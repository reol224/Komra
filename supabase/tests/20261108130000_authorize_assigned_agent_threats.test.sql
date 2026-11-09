CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

BEGIN;

SELECT extensions.plan(19);

INSERT INTO public.users (id, email, full_name, role)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'security-admin@komra.test', 'Security Admin', 'admin'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'security-analyst@komra.test', 'Security Analyst', 'analyst'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'security-viewer@komra.test', 'Security Viewer', 'viewer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (
  id, email, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
VALUES (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'security-analyst@komra.test',
  NOW(), NOW(), NOW(), '{}'::jsonb, '{}'::jsonb
), (
  '77777777-7777-4777-8777-777777777777',
  'security-admin@komra.test',
  NOW(), NOW(), NOW(), '{}'::jsonb, '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.application_sessions (token_hash, user_id, expires_at)
VALUES (
  repeat('a', 64),
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  NOW() + INTERVAL '1 hour'
)
ON CONFLICT (token_hash) DO NOTHING;

INSERT INTO public.endpoints (id, hostname, os_type, environment, metadata)
VALUES
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'sql-test-agent', 'Windows 10', 'testing',
   '{"collection_source":"agent"}'::jsonb),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'sql-test-non-agent', 'Windows 10', 'testing',
   '{"collection_source":"scanner"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cves (id, cve_id, description, severity)
VALUES
  ('11111111-aaaa-4111-8111-111111111111', 'CVE-2099-11111', 'Agent source test', 'high'),
  ('22222222-bbbb-4222-8222-222222222222', 'CVE-2099-22222', 'Legacy source test', 'medium'),
  ('33333333-cccc-4333-8333-333333333333', 'CVE-2099-33333', 'Non-agent source test', 'low')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vulnerabilities (
  id, endpoint_id, cve_id, severity, status, source
)
VALUES
  ('44444444-aaaa-4444-8444-444444444444',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'CVE-2099-11111', 'high', 'open', 'osv'),
  ('55555555-bbbb-4555-8555-555555555555',
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'CVE-2099-22222', 'medium', 'open', 'legacy'),
  ('66666666-cccc-4666-8666-666666666666',
   'ffffffff-ffff-4fff-8fff-ffffffffffff', 'CVE-2099-33333', 'low', 'open', 'osv')
ON CONFLICT (id) DO NOTHING;

SELECT set_config('request.jwt.claim.sub', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', TRUE);
SELECT set_config('request.jwt.claim.role', 'authenticated', TRUE);

SELECT extensions.is(
  public.resolve_authenticated_application_user(),
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  'Auth identity resolves to the unique application profile by email, not UUID equality'
);

UPDATE public.role_permissions
SET granted = FALSE
WHERE role = 'analyst'
  AND permission_id = 'vulnerabilities.assign';

SELECT extensions.throws_ok(
  $$SELECT public.assign_agent_threat(
    '44444444-aaaa-4444-8444-444444444444',
    'CVE-2099-11111',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'high',
    'test'
  )$$,
  '42501',
  'The signed-in user does not have triage and assignment permission.',
  'Assignment RPC requires vulnerabilities.assign in addition to triage'
);

SELECT extensions.throws_ok(
  $$SELECT public.assign_agent_threat_with_app_session(
    repeat('a', 64),
    '44444444-aaaa-4444-8444-444444444444',
    'CVE-2099-11111',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'high',
    'test'
  )$$,
  '42501',
  'The signed-in user does not have triage and assignment permission.',
  'App-session assignment RPC also requires vulnerabilities.assign'
);

UPDATE public.role_permissions
SET granted = TRUE
WHERE role = 'analyst'
  AND permission_id = 'vulnerabilities.assign';

SELECT extensions.throws_ok(
  $$SELECT public.assign_agent_threat(
    '55555555-bbbb-4555-8555-555555555555',
    'CVE-2099-22222',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'high',
    'test'
  )$$,
  'P0001',
  'The finding, CVE, endpoint, or assignee is invalid.',
  'Assignment RPC rejects non-OSV provenance'
);

SELECT extensions.throws_ok(
  $$SELECT public.assign_agent_threat_with_app_session(
    repeat('a', 64),
    '55555555-bbbb-4555-8555-555555555555',
    'CVE-2099-22222',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'high',
    'test'
  )$$,
  'P0001',
  'The finding, CVE, endpoint, or assignee is invalid.',
  'App-session assignment RPC rejects non-OSV provenance'
);

SELECT extensions.throws_ok(
  $$SELECT public.assign_agent_threat(
    '66666666-cccc-4666-8666-666666666666',
    'CVE-2099-33333',
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'low',
    'test'
  )$$,
  'P0001',
  'The finding, CVE, endpoint, or assignee is invalid.',
  'Assignment RPC rejects findings from non-agent endpoints'
);

SELECT extensions.throws_ok(
  $$SELECT public.assign_agent_threat_with_app_session(
    repeat('a', 64),
    '66666666-cccc-4666-8666-666666666666',
    'CVE-2099-33333',
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'low',
    'test'
  )$$,
  'P0001',
  'The finding, CVE, endpoint, or assignee is invalid.',
  'App-session assignment RPC rejects findings from non-agent endpoints'
);

SELECT extensions.lives_ok(
  $$SELECT public.assign_agent_threat(
    '44444444-aaaa-4444-8444-444444444444',
    'CVE-2099-11111',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'high',
    'test'
  )$$,
  'Authorized Auth assignment succeeds for an OSV finding on an agent endpoint'
);

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.audit_logs
   WHERE action = 'THREAT_ASSIGNED'
     AND user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     AND user_email = 'security-analyst@komra.test'
     AND resource_id = '44444444-aaaa-4444-8444-444444444444'),
  1,
  'Auth assignment writes an audit record attributed to the resolved application profile'
);

SELECT set_config('request.jwt.claim.role', 'service_role', TRUE);

SELECT extensions.lives_ok(
  $$SELECT public.assign_agent_threat_with_app_session(
    repeat('a', 64),
    '44444444-aaaa-4444-8444-444444444444',
    'CVE-2099-11111',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'high',
    'test'
  )$$,
  'Authorized app-session assignment succeeds for an OSV agent finding'
);

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.audit_logs
   WHERE action = 'THREAT_ASSIGNED'
     AND user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     AND user_email = 'security-analyst@komra.test'
     AND resource_id = '44444444-aaaa-4444-8444-444444444444'),
  2,
  'App-session assignment writes an audit record attributed to its verified session'
);

SELECT set_config('request.jwt.claim.role', 'authenticated', TRUE);

UPDATE public.vulnerabilities
SET status = 'resolved'
WHERE id = '44444444-aaaa-4444-8444-444444444444';

SELECT extensions.throws_ok(
  $$SELECT public.assign_agent_threat(
    '44444444-aaaa-4444-8444-444444444444',
    'CVE-2099-11111',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'high',
    'test'
  )$$,
  '40001',
  'The selected finding is no longer active.',
  'Auth assignment rejects findings resolved before confirmation'
);

SELECT extensions.throws_ok(
  $$SELECT public.assign_agent_threat_with_app_session(
    repeat('a', 64),
    '44444444-aaaa-4444-8444-444444444444',
    'CVE-2099-11111',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'high',
    'test'
  )$$,
  '40001',
  'The selected finding is no longer active.',
  'App-session assignment rejects findings resolved before confirmation'
);

UPDATE public.triage_actions
SET status = 'resolved'
WHERE cve_id = '11111111-aaaa-4111-8111-111111111111'
  AND endpoint_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

SELECT extensions.is(
  (SELECT status FROM public.vulnerabilities
   WHERE id = '44444444-aaaa-4444-8444-444444444444'),
  'resolved',
  'Direct triage updates synchronize status to matching agent OSV findings'
);

SELECT extensions.throws_ok(
  $$INSERT INTO public.triage_actions (
      cve_id, endpoint_id, status, priority, assigned_to, triaged_by
    )
    VALUES (
      '11111111-aaaa-4111-8111-111111111111',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      'in_progress',
      'high',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    )$$,
  '23514',
  'The assignee must have an eligible application role.',
  'Direct triage writes reject ineligible assignees'
);

SELECT set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', TRUE);

UPDATE public.triage_actions
SET assigned_to = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    triaged_by = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
WHERE cve_id = '11111111-aaaa-4111-8111-111111111111'
  AND endpoint_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.triage_actions
   WHERE cve_id = '11111111-aaaa-4111-8111-111111111111'
     AND endpoint_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
     AND assigned_to = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     AND triaged_by = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  1,
  'Authorized admin reassignment remains available'
);

SELECT set_config('request.jwt.claim.role', 'authenticated', TRUE);

SELECT extensions.throws_ok(
  $$INSERT INTO public.audit_logs (
      user_email, action, resource_type, severity, status
    )
    VALUES (
      'security-admin@komra.test', 'THREAT_ESCALATED', 'vulnerability', 'high', 'success'
    )$$,
  '42501',
  'Threat escalation audit events are server-managed.',
  'Authenticated direct threat escalation audit inserts are blocked'
);

SELECT set_config('request.jwt.claim.role', 'anon', TRUE);

SELECT extensions.throws_ok(
  $$INSERT INTO public.audit_logs (
      user_email, action, resource_type, severity, status
    )
    VALUES (
      'security-admin@komra.test', 'THREAT_ESCALATED', 'vulnerability', 'high', 'success'
    )$$,
  '42501',
  'Threat escalation audit events are server-managed.',
  'Anonymous direct threat escalation audit inserts are blocked'
);

SELECT set_config('request.jwt.claim.role', 'service_role', TRUE);

INSERT INTO public.audit_logs (
  user_id, user_email, action, resource_type, severity, status
)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'security-admin@komra.test', 'THREAT_ESCALATED', 'vulnerability', 'high', 'success'
);

SELECT extensions.is(
  (SELECT count(*)::integer FROM public.audit_logs
   WHERE user_email = 'security-admin@komra.test'
     AND action = 'THREAT_ESCALATED'),
  1,
  'Server service-role threat escalation audit inserts remain allowed'
);

SELECT * FROM extensions.finish();

ROLLBACK;
