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
  v_actor_id UUID := public.resolve_authenticated_application_user();
  v_actor_email TEXT;
  v_role TEXT;
  v_can_triage BOOLEAN;
  v_can_assign BOOLEAN;
  v_cve_id UUID;
  v_finding_status TEXT;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'A verified sign-in identity is required.'
      USING ERRCODE = '42501';
  END IF;

  SELECT account.role, account.email
    INTO v_role, v_actor_email
  FROM public.users AS account
  WHERE account.id = v_actor_id;

  SELECT
    COALESCE(bool_or(permission.permission_id = 'vulnerabilities.triage'), FALSE),
    COALESCE(bool_or(permission.permission_id = 'vulnerabilities.assign'), FALSE)
    INTO v_can_triage, v_can_assign
  FROM public.role_permissions AS permission
  WHERE permission.role = v_role
    AND permission.granted = TRUE
    AND permission.permission_id IN (
      'vulnerabilities.triage',
      'vulnerabilities.assign'
    );

  IF NOT COALESCE(v_can_triage, FALSE)
     OR NOT COALESCE(v_can_assign, FALSE) THEN
    RAISE EXCEPTION 'The signed-in user does not have triage and assignment permission.'
      USING ERRCODE = '42501';
  END IF;

  IF p_priority IS NULL OR p_priority NOT IN ('critical', 'high', 'medium', 'low') THEN
    RAISE EXCEPTION 'The requested assignment priority is invalid.';
  END IF;

  SELECT cve.id, finding.status
    INTO v_cve_id, v_finding_status
  FROM public.cves AS cve
  JOIN public.vulnerabilities AS finding
    ON finding.cve_id = cve.cve_id
  JOIN public.endpoints AS endpoint
    ON endpoint.id = finding.endpoint_id
  WHERE cve.cve_id = p_cve_identifier
    AND finding.id = p_vulnerability_id
    AND finding.endpoint_id = p_endpoint_id
    AND finding.source = 'osv'
    AND endpoint.metadata->>'collection_source' = 'agent'
  FOR UPDATE OF finding;

  IF v_cve_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.users AS assignee
    WHERE assignee.id = p_assignee_id
      AND assignee.role IN ('admin', 'analyst')
  ) THEN
    RAISE EXCEPTION 'The finding, CVE, endpoint, or assignee is invalid.';
  END IF;

  IF v_finding_status NOT IN ('open', 'in_progress') THEN
    RAISE EXCEPTION 'The selected finding is no longer active.'
      USING ERRCODE = '40001';
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

  INSERT INTO public.audit_logs (
    user_id, user_email, action, resource_type, resource_id, details,
    timestamp, severity, status, metadata
  )
  VALUES (
    v_actor_id,
    v_actor_email,
    'THREAT_ASSIGNED',
    'vulnerability',
    p_vulnerability_id::TEXT,
    jsonb_build_object(
      'cve_id', p_cve_identifier,
      'endpoint_id', p_endpoint_id,
      'assigned_to', p_assignee_id,
      'priority', p_priority
    ),
    NOW(),
    'high',
    'success',
    '{"action_category":"threat_management","security_relevant":true,"compliance_relevant":true}'::jsonb
  );
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
  v_actor_email TEXT;
  v_role TEXT;
  v_can_triage BOOLEAN;
  v_can_assign BOOLEAN;
  v_cve_id UUID;
  v_finding_status TEXT;
BEGIN
  SELECT session.user_id, account.role, account.email
    INTO v_actor_id, v_role, v_actor_email
  FROM public.application_sessions AS session
  JOIN public.users AS account ON account.id = session.user_id
  WHERE session.token_hash = p_token_hash
    AND session.revoked_at IS NULL
    AND session.expires_at > NOW();

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'A valid application session is required.'
      USING ERRCODE = '42501';
  END IF;

  SELECT
    COALESCE(bool_or(permission.permission_id = 'vulnerabilities.triage'), FALSE),
    COALESCE(bool_or(permission.permission_id = 'vulnerabilities.assign'), FALSE)
    INTO v_can_triage, v_can_assign
  FROM public.role_permissions AS permission
  WHERE permission.role = v_role
    AND permission.granted = TRUE
    AND permission.permission_id IN (
      'vulnerabilities.triage',
      'vulnerabilities.assign'
    );

  IF NOT COALESCE(v_can_triage, FALSE)
     OR NOT COALESCE(v_can_assign, FALSE) THEN
    RAISE EXCEPTION 'The signed-in user does not have triage and assignment permission.'
      USING ERRCODE = '42501';
  END IF;

  IF p_priority IS NULL OR p_priority NOT IN ('critical', 'high', 'medium', 'low') THEN
    RAISE EXCEPTION 'The requested assignment priority is invalid.';
  END IF;

  SELECT cve.id, finding.status
    INTO v_cve_id, v_finding_status
  FROM public.cves AS cve
  JOIN public.vulnerabilities AS finding
    ON finding.cve_id = cve.cve_id
  JOIN public.endpoints AS endpoint
    ON endpoint.id = finding.endpoint_id
  WHERE cve.cve_id = p_cve_identifier
    AND finding.id = p_vulnerability_id
    AND finding.endpoint_id = p_endpoint_id
    AND finding.source = 'osv'
    AND endpoint.metadata->>'collection_source' = 'agent'
  FOR UPDATE OF finding;

  IF v_cve_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.users AS assignee
    WHERE assignee.id = p_assignee_id
      AND assignee.role IN ('admin', 'analyst')
  ) THEN
    RAISE EXCEPTION 'The finding, CVE, endpoint, or assignee is invalid.';
  END IF;

  IF v_finding_status NOT IN ('open', 'in_progress') THEN
    RAISE EXCEPTION 'The selected finding is no longer active.'
      USING ERRCODE = '40001';
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

  INSERT INTO public.audit_logs (
    user_id, user_email, action, resource_type, resource_id, details,
    timestamp, severity, status, metadata
  )
  VALUES (
    v_actor_id,
    v_actor_email,
    'THREAT_ASSIGNED',
    'vulnerability',
    p_vulnerability_id::TEXT,
    jsonb_build_object(
      'cve_id', p_cve_identifier,
      'endpoint_id', p_endpoint_id,
      'assigned_to', p_assignee_id,
      'priority', p_priority
    ),
    NOW(),
    'high',
    'success',
    '{"action_category":"threat_management","security_relevant":true,"compliance_relevant":true}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_agent_threat(UUID, TEXT, UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_agent_threat(UUID, TEXT, UUID, UUID, TEXT, TEXT)
  TO authenticated;

REVOKE ALL ON FUNCTION public.assign_agent_threat_with_app_session(TEXT, UUID, TEXT, UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_agent_threat_with_app_session(TEXT, UUID, TEXT, UUID, UUID, TEXT, TEXT)
  TO service_role;
