-- Install pgcrypto extension if not already installed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create user_passwords table with enhanced security
CREATE TABLE IF NOT EXISTS public.user_passwords (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'argon2id',
  iterations INTEGER NOT NULL DEFAULT 3,
  memory_cost INTEGER NOT NULL DEFAULT 65536, -- 64MB
  parallelism INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced password hashing function using Argon2id parameters
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TABLE(hash TEXT, salt TEXT) AS $$
DECLARE
  generated_salt TEXT;
  password_hash TEXT;
BEGIN
  -- Generate a cryptographically secure random salt (32 bytes)
  generated_salt := encode(gen_random_bytes(32), 'base64');
  
  -- Use PostgreSQL's crypt with the strongest available algorithm
  -- Note: PostgreSQL doesn't have native Argon2id, so we use the strongest available
  -- For true Argon2id, you'd need a custom extension
  password_hash := crypt(password, gen_salt('bf', 12)); -- bcrypt with cost factor 12
  
  RETURN QUERY SELECT password_hash, generated_salt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced password verification function
CREATE OR REPLACE FUNCTION verify_user_password(user_id UUID, password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
  stored_salt TEXT;
  computed_hash TEXT;
BEGIN
  -- Get stored password hash and salt
  SELECT password_hash, salt INTO stored_hash, stored_salt
  FROM public.user_passwords 
  WHERE user_passwords.user_id = verify_user_password.user_id;
  
  -- Return false if user not found
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify password using crypt
  computed_hash := crypt(password, stored_hash);
  
  -- Return true if hashes match
  RETURN computed_hash = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade existing passwords to new security standard
CREATE OR REPLACE FUNCTION upgrade_password_security(user_id UUID, new_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  new_hash TEXT;
  new_salt TEXT;
BEGIN
  -- Generate new hash with enhanced security
  SELECT hash, salt INTO new_hash, new_salt FROM hash_password(new_password);
  
  -- Update or insert password record
  INSERT INTO public.user_passwords (user_id, password_hash, salt, algorithm, iterations, memory_cost, parallelism)
  VALUES (user_id, new_hash, new_salt, 'bcrypt-12', 12, 0, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    algorithm = EXCLUDED.algorithm,
    iterations = EXCLUDED.iterations,
    memory_cost = EXCLUDED.memory_cost,
    parallelism = EXCLUDED.parallelism,
    updated_at = NOW();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add security policies
ALTER TABLE public.user_passwords ENABLE ROW LEVEL SECURITY;

-- Only allow users to access their own password records (for verification)
CREATE POLICY "Users can verify own passwords" ON public.user_passwords
  FOR SELECT USING (user_id = auth.uid());

-- Only allow system functions to modify passwords
CREATE POLICY "System can manage passwords" ON public.user_passwords
  FOR ALL USING (current_setting('role') = 'service_role');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_passwords_user_id ON public.user_passwords(user_id);

-- Enable realtime for password security monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_passwords;