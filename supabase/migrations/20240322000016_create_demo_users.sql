-- Create demo users in public.users table
INSERT INTO public.users (
  id, email, full_name, role, mfa_enabled, created_at, updated_at
)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@komra.security', 'Admin User', 'admin', false, now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'analyst@komra.security', 'Analyst User', 'analyst', false, now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'viewer@komra.security', 'Viewer User', 'viewer', false, now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();