-- Enhanced password security upgrade
-- First, add security columns to existing user_passwords table
DO $$ 
BEGIN
  -- Add algorithm column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_passwords' AND column_name = 'algorithm') THEN
    ALTER TABLE public.user_passwords ADD COLUMN algorithm TEXT NOT NULL DEFAULT 'bcrypt-12';
  END IF;
  
  -- Add iterations column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_passwords' AND column_name = 'iterations') THEN
    ALTER TABLE public.user_passwords ADD COLUMN iterations INTEGER NOT NULL DEFAULT 12;
  END IF;
  
  -- Add memory_cost column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_passwords' AND column_name = 'memory_cost') THEN
    ALTER TABLE public.user_passwords ADD COLUMN memory_cost INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- Add parallelism column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_passwords' AND column_name = 'parallelism') THEN
    ALTER TABLE public.user_passwords ADD COLUMN parallelism INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Drop and recreate the upgrade function with fixed variable naming
DROP FUNCTION IF EXISTS upgrade_password_security(UUID, TEXT);

CREATE OR REPLACE FUNCTION upgrade_password_security(input_user_id UUID, new_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  new_hash TEXT;
  new_salt TEXT;
BEGIN
  -- Generate new hash with enhanced security (bcrypt cost factor 12)
  SELECT hash, salt INTO new_hash, new_salt FROM hash_password(new_password);
  
  -- Update or insert password record
  INSERT INTO public.user_passwords (user_id, password_hash, salt, algorithm, iterations, memory_cost, parallelism)
  VALUES (input_user_id, new_hash, new_salt, 'bcrypt-12', 12, 0, 1)
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

-- Now upgrade demo users to use enhanced password security
SELECT upgrade_password_security('11111111-1111-1111-1111-111111111111', 'password123');
SELECT upgrade_password_security('22222222-2222-2222-2222-222222222222', 'password123');
SELECT upgrade_password_security('33333333-3333-3333-3333-333333333333', 'password123');