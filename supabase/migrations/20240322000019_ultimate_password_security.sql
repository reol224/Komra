-- Ultimate password security implementation
-- This implements the most secure password hashing available in PostgreSQL

-- Drop existing functions to recreate with enhanced security
DROP FUNCTION IF EXISTS verify_user_password(UUID, TEXT);
DROP FUNCTION IF EXISTS hash_password(TEXT);

-- Enhanced hash_password function with maximum security
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TABLE(hash TEXT, salt TEXT) AS $$
DECLARE
  generated_salt TEXT;
  password_hash TEXT;
BEGIN
  -- Generate a cryptographically secure random salt (32 bytes)
  generated_salt := encode(gen_random_bytes(32), 'base64');
  
  -- Use bcrypt with cost factor 12 (very secure, but still performant)
  -- Cost factor 12 means 2^12 = 4096 iterations
  -- This is currently the highest recommended for production use
  password_hash := crypt(password, gen_salt('bf', 12));
  
  RETURN QUERY SELECT password_hash, generated_salt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced password verification with timing attack protection
CREATE OR REPLACE FUNCTION verify_user_password(input_user_id UUID, password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
  stored_salt TEXT;
  computed_hash TEXT;
  dummy_hash TEXT;
BEGIN
  -- Get stored password hash and salt
  SELECT password_hash, salt INTO stored_hash, stored_salt
  FROM public.user_passwords 
  WHERE user_id = input_user_id;
  
  -- Always perform a hash computation to prevent timing attacks
  IF stored_hash IS NULL THEN
    -- Compute a dummy hash to maintain consistent timing
    dummy_hash := crypt(password, gen_salt('bf', 12));
    RETURN FALSE;
  END IF;
  
  -- Verify password using crypt
  computed_hash := crypt(password, stored_hash);
  
  -- Return true if hashes match
  RETURN computed_hash = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check password strength
CREATE OR REPLACE FUNCTION check_password_strength(password TEXT)
RETURNS TABLE(
  is_strong BOOLEAN,
  score INTEGER,
  feedback TEXT[]
) AS $$
DECLARE
  strength_score INTEGER := 0;
  feedback_array TEXT[] := ARRAY[]::TEXT[];
  has_upper BOOLEAN := FALSE;
  has_lower BOOLEAN := FALSE;
  has_digit BOOLEAN := FALSE;
  has_special BOOLEAN := FALSE;
  length_check BOOLEAN := FALSE;
BEGIN
  -- Check length (minimum 12 characters for high security)
  IF length(password) >= 12 THEN
    strength_score := strength_score + 2;
    length_check := TRUE;
  ELSIF length(password) >= 8 THEN
    strength_score := strength_score + 1;
    feedback_array := array_append(feedback_array, 'Consider using at least 12 characters for maximum security');
  ELSE
    feedback_array := array_append(feedback_array, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check for uppercase letters
  IF password ~ '[A-Z]' THEN
    has_upper := TRUE;
    strength_score := strength_score + 1;
  ELSE
    feedback_array := array_append(feedback_array, 'Add uppercase letters');
  END IF;
  
  -- Check for lowercase letters
  IF password ~ '[a-z]' THEN
    has_lower := TRUE;
    strength_score := strength_score + 1;
  ELSE
    feedback_array := array_append(feedback_array, 'Add lowercase letters');
  END IF;
  
  -- Check for digits
  IF password ~ '[0-9]' THEN
    has_digit := TRUE;
    strength_score := strength_score + 1;
  ELSE
    feedback_array := array_append(feedback_array, 'Add numbers');
  END IF;
  
  -- Check for special characters
  IF password ~ '[^A-Za-z0-9]' THEN
    has_special := TRUE;
    strength_score := strength_score + 2;
  ELSE
    feedback_array := array_append(feedback_array, 'Add special characters (!@#$%^&*)');
  END IF;
  
  -- Bonus points for very long passwords
  IF length(password) >= 16 THEN
    strength_score := strength_score + 1;
  END IF;
  
  -- Check for common patterns (reduce score)
  IF password ~* '(password|123456|qwerty|admin|login)' THEN
    strength_score := strength_score - 3;
    feedback_array := array_append(feedback_array, 'Avoid common words and patterns');
  END IF;
  
  -- Determine if password is strong (score >= 6 out of 8 possible)
  RETURN QUERY SELECT 
    (strength_score >= 6) as is_strong,
    strength_score,
    feedback_array;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user_passwords table with additional security metadata
ALTER TABLE public.user_passwords 
ADD COLUMN IF NOT EXISTS last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS change_reason TEXT,
ADD COLUMN IF NOT EXISTS strength_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_change BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- Create index for security monitoring
CREATE INDEX IF NOT EXISTS idx_user_passwords_last_changed ON public.user_passwords(last_changed);
CREATE INDEX IF NOT EXISTS idx_user_passwords_requires_change ON public.user_passwords(requires_change);
CREATE INDEX IF NOT EXISTS idx_user_passwords_locked_until ON public.user_passwords(locked_until);

-- Update existing demo passwords with strength scores
UPDATE public.user_passwords 
SET strength_score = 4, -- Demo passwords are medium strength
    last_changed = NOW(),
    change_reason = 'Security upgrade to bcrypt-12'
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222', 
  '33333333-3333-3333-3333-333333333333'
);