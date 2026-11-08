CREATE TABLE IF NOT EXISTS public.application_sessions (
  token_hash TEXT PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_sessions_user_expiry
  ON public.application_sessions(user_id, expires_at);

ALTER TABLE public.application_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.application_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.application_sessions TO service_role;

ALTER TABLE public.triage_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.triage_actions FROM PUBLIC, anon;
GRANT SELECT ON public.triage_actions TO authenticated;

DROP POLICY IF EXISTS "Users with triage permission read authorized agent assignments"
  ON public.triage_actions;
CREATE POLICY "Users with triage permission read authorized agent assignments"
  ON public.triage_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS actor_account
      JOIN public.role_permissions AS permission
        ON permission.role = actor_account.role
       AND permission.permission_id = 'vulnerabilities.triage'
       AND permission.granted = TRUE
      WHERE actor_account.id = (SELECT auth.uid())
        AND (
          triage_actions.assigned_to = actor_account.id
          OR (
            actor_account.role = 'admin'
            AND EXISTS (
              SELECT 1
              FROM public.role_permissions AS admin_permission
              WHERE admin_permission.role = actor_account.role
                AND admin_permission.permission_id = 'vulnerabilities.triage'
                AND admin_permission.granted = TRUE
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users with triage permission create assignments"
  ON public.triage_actions;
CREATE POLICY "Users with triage permission create assignments"
  ON public.triage_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    triaged_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.users AS actor_account
      JOIN public.role_permissions AS permission
        ON permission.role = actor_account.role
       AND permission.permission_id = 'vulnerabilities.triage'
       AND permission.granted = TRUE
      WHERE actor_account.id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users with triage permission update assignments"
  ON public.triage_actions;
CREATE POLICY "Users with triage permission update assignments"
  ON public.triage_actions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS actor_account
      JOIN public.role_permissions AS permission
        ON permission.role = actor_account.role
       AND permission.permission_id = 'vulnerabilities.triage'
       AND permission.granted = TRUE
      WHERE actor_account.id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    triaged_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.users AS actor_account
      JOIN public.role_permissions AS permission
        ON permission.role = actor_account.role
       AND permission.permission_id = 'vulnerabilities.triage'
       AND permission.granted = TRUE
      WHERE actor_account.id = (SELECT auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.get_authorized_agent_threats(
  p_assignee_id UUID DEFAULT NULL
)
RETURNS SETOF public.triage_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role TEXT;
  v_can_triage BOOLEAN;
  v_target_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'A verified sign-in identity is required.'
      USING ERRCODE = '42501';
  END IF;

  SELECT account.role
    INTO v_role
  FROM public.users AS account
  WHERE account.id = v_user_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'The signed-in user is not authorized to view assignments.'
      USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(permission.granted, FALSE)
    INTO v_can_triage
  FROM public.role_permissions AS permission
  WHERE permission.role = v_role
    AND permission.permission_id = 'vulnerabilities.triage';

  IF NOT COALESCE(v_can_triage, FALSE) THEN
    RAISE EXCEPTION 'The signed-in user does not have triage permission.'
      USING ERRCODE = '42501';
  END IF;

  IF p_assignee_id IS NOT NULL
     AND p_assignee_id <> v_user_id
     AND v_role <> 'admin' THEN
    RAISE EXCEPTION 'Users may only view their own assignments.'
      USING ERRCODE = '42501';
  END IF;

  v_target_id := COALESCE(p_assignee_id, v_user_id);

  RETURN QUERY
  SELECT assignment.*
  FROM public.triage_actions AS assignment
  JOIN public.cves AS cve ON cve.id = assignment.cve_id
  JOIN public.endpoints AS endpoint ON endpoint.id = assignment.endpoint_id
  JOIN public.vulnerabilities AS finding
    ON finding.endpoint_id = assignment.endpoint_id
   AND finding.cve_id = cve.cve_id
   AND finding.source = 'osv'
  WHERE assignment.assigned_to = v_target_id
    AND endpoint.metadata->>'collection_source' = 'agent'
  ORDER BY assignment.updated_at DESC NULLS LAST, assignment.created_at DESC, assignment.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_app_session_agent_threats(
  p_token_hash TEXT,
  p_assignee_id UUID DEFAULT NULL
)
RETURNS SETOF public.triage_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_can_triage BOOLEAN;
  v_target_id UUID;
BEGIN
  SELECT session.user_id, account.role
    INTO v_user_id, v_role
  FROM public.application_sessions AS session
  JOIN public.users AS account ON account.id = session.user_id
  WHERE session.token_hash = p_token_hash
    AND session.revoked_at IS NULL
    AND session.expires_at > NOW();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'A valid application session is required.'
      USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(permission.granted, FALSE)
    INTO v_can_triage
  FROM public.role_permissions AS permission
  WHERE permission.role = v_role
    AND permission.permission_id = 'vulnerabilities.triage';

  IF NOT COALESCE(v_can_triage, FALSE) THEN
    RAISE EXCEPTION 'The signed-in user does not have triage permission.'
      USING ERRCODE = '42501';
  END IF;

  IF p_assignee_id IS NOT NULL
     AND p_assignee_id <> v_user_id
     AND v_role <> 'admin' THEN
    RAISE EXCEPTION 'Users may only view their own assignments.'
      USING ERRCODE = '42501';
  END IF;

  v_target_id := COALESCE(p_assignee_id, v_user_id);

  RETURN QUERY
  SELECT assignment.*
  FROM public.triage_actions AS assignment
  JOIN public.cves AS cve ON cve.id = assignment.cve_id
  JOIN public.endpoints AS endpoint ON endpoint.id = assignment.endpoint_id
  JOIN public.vulnerabilities AS finding
    ON finding.endpoint_id = assignment.endpoint_id
   AND finding.cve_id = cve.cve_id
   AND finding.source = 'osv'
  WHERE assignment.assigned_to = v_target_id
    AND endpoint.metadata->>'collection_source' = 'agent'
  ORDER BY assignment.updated_at DESC NULLS LAST, assignment.created_at DESC, assignment.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_agent_threat(
  p_vulnerability_id UUID,
  p_cve_identifier TEXT,
  p_endpoint_id UUID,
  p_assignee_id UUID,
  p_priority TEXT,
  p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_role TEXT;
  v_can_triage BOOLEAN;
  v_cve_id UUID;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'A verified sign-in identity is required.'
      USING ERRCODE = '42501';
  END IF;

  SELECT account.role
    INTO v_role
  FROM public.users AS account
  WHERE account.id = v_actor_id;

  SELECT COALESCE(permission.granted, FALSE)
    INTO v_can_triage
  FROM public.role_permissions AS permission
  WHERE permission.role = v_role
    AND permission.permission_id = 'vulnerabilities.triage';

  IF NOT COALESCE(v_can_triage, FALSE) THEN
    RAISE EXCEPTION 'The signed-in user does not have triage permission.'
      USING ERRCODE = '42501';
  END IF;

  IF p_priority IS NULL OR p_priority NOT IN ('critical', 'high', 'medium', 'low') THEN
    RAISE EXCEPTION 'The requested assignment priority is invalid.';
  END IF;

  SELECT cve.id
    INTO v_cve_id
  FROM public.cves AS cve
  WHERE cve.cve_id = p_cve_identifier;

  IF v_cve_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.vulnerabilities AS finding
    WHERE finding.id = p_vulnerability_id
      AND finding.cve_id = p_cve_identifier
      AND finding.endpoint_id = p_endpoint_id
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.users AS assignee
    WHERE assignee.id = p_assignee_id
      AND assignee.role IN ('admin', 'analyst')
  ) THEN
    RAISE EXCEPTION 'The finding, CVE, endpoint, or assignee is invalid.';
  END IF;

  INSERT INTO public.triage_actions (
    cve_id, endpoint_id, status, priority, assigned_to, notes, triaged_by, triaged_at
  )
  VALUES (
    v_cve_id, p_endpoint_id, 'in_progress', p_priority, p_assignee_id, p_notes, v_actor_id, NOW()
  )
  ON CONFLICT (cve_id, endpoint_id) DO UPDATE
  SET status = 'in_progress',
      priority = EXCLUDED.priority,
      assigned_to = EXCLUDED.assigned_to,
      notes = EXCLUDED.notes,
      triaged_by = EXCLUDED.triaged_by,
      triaged_at = EXCLUDED.triaged_at,
      updated_at = NOW();

  UPDATE public.vulnerabilities
  SET status = 'in_progress'
  WHERE id = p_vulnerability_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The assigned finding could not be updated.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_agent_threat_with_app_session(
  p_token_hash TEXT,
  p_vulnerability_id UUID,
  p_cve_identifier TEXT,
  p_endpoint_id UUID,
  p_assignee_id UUID,
  p_priority TEXT,
  p_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_id UUID;
  v_role TEXT;
  v_can_triage BOOLEAN;
  v_cve_id UUID;
BEGIN
  SELECT session.user_id, account.role
    INTO v_actor_id, v_role
  FROM public.application_sessions AS session
  JOIN public.users AS account ON account.id = session.user_id
  WHERE session.token_hash = p_token_hash
    AND session.revoked_at IS NULL
    AND session.expires_at > NOW();

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'A valid application session is required.'
      USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(permission.granted, FALSE)
    INTO v_can_triage
  FROM public.role_permissions AS permission
  WHERE permission.role = v_role
    AND permission.permission_id = 'vulnerabilities.triage';

  IF NOT COALESCE(v_can_triage, FALSE) THEN
    RAISE EXCEPTION 'The signed-in user does not have triage permission.'
      USING ERRCODE = '42501';
  END IF;

  IF p_priority IS NULL OR p_priority NOT IN ('critical', 'high', 'medium', 'low') THEN
    RAISE EXCEPTION 'The requested assignment priority is invalid.';
  END IF;

  SELECT cve.id
    INTO v_cve_id
  FROM public.cves AS cve
  WHERE cve.cve_id = p_cve_identifier;

  IF v_cve_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.vulnerabilities AS finding
    WHERE finding.id = p_vulnerability_id
      AND finding.cve_id = p_cve_identifier
      AND finding.endpoint_id = p_endpoint_id
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.users AS assignee
    WHERE assignee.id = p_assignee_id
      AND assignee.role IN ('admin', 'analyst')
  ) THEN
    RAISE EXCEPTION 'The finding, CVE, endpoint, or assignee is invalid.';
  END IF;

  INSERT INTO public.triage_actions (
    cve_id, endpoint_id, status, priority, assigned_to, notes, triaged_by, triaged_at
  )
  VALUES (
    v_cve_id, p_endpoint_id, 'in_progress', p_priority, p_assignee_id, p_notes, v_actor_id, NOW()
  )
  ON CONFLICT (cve_id, endpoint_id) DO UPDATE
  SET status = 'in_progress',
      priority = EXCLUDED.priority,
      assigned_to = EXCLUDED.assigned_to,
      notes = EXCLUDED.notes,
      triaged_by = EXCLUDED.triaged_by,
      triaged_at = EXCLUDED.triaged_at,
      updated_at = NOW();

  UPDATE public.vulnerabilities
  SET status = 'in_progress'
  WHERE id = p_vulnerability_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The assigned finding could not be updated.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_authorized_agent_threats(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_authorized_agent_threats(UUID)
  TO authenticated;

REVOKE ALL ON FUNCTION public.get_app_session_agent_threats(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_app_session_agent_threats(TEXT, UUID)
  TO service_role;

REVOKE ALL ON FUNCTION public.assign_agent_threat(UUID, TEXT, UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_agent_threat(UUID, TEXT, UUID, UUID, TEXT, TEXT)
  TO authenticated;

REVOKE ALL ON FUNCTION public.assign_agent_threat_with_app_session(TEXT, UUID, TEXT, UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_agent_threat_with_app_session(TEXT, UUID, TEXT, UUID, UUID, TEXT, TEXT)
  TO service_role;
