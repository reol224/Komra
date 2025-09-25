ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);