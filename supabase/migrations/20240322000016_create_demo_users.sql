-- Create demo users in public.users table
INSERT INTO public.users (id, email, full_name, role, mfa_enabled, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@komra.security', 'Admin User', 'admin', false, now(), now()),
('22222222-2222-2222-2222-222222222222', 'analyst@komra.security', 'Analyst User', 'analyst', false, now(), now()),
('33333333-3333-3333-3333-333333333333', 'viewer@komra.security', 'Viewer User', 'viewer', false, now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();

-- Create password entries for demo users using the hash_password function
INSERT INTO public.user_passwords (user_id, password_hash, salt, created_at, updated_at)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  hp.hash,
  hp.salt,
  now(),
  now()
FROM hash_password('password123') hp
ON CONFLICT (user_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  updated_at = now();

INSERT INTO public.user_passwords (user_id, password_hash, salt, created_at, updated_at)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  hp.hash,
  hp.salt,
  now(),
  now()
FROM hash_password('password123') hp
ON CONFLICT (user_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  updated_at = now();

INSERT INTO public.user_passwords (user_id, password_hash, salt, created_at, updated_at)
SELECT 
  '33333333-3333-3333-3333-333333333333',
  hp.hash,
  hp.salt,
  now(),
  now()
FROM hash_password('password123') hp
ON CONFLICT (user_id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  updated_at = now();