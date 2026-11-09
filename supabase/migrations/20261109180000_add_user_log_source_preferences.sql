-- User log source preferences for filtering audit and dashboard data
CREATE TABLE IF NOT EXISTS public.user_log_source_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_source_type TEXT NOT NULL CHECK (log_source_type IN (
    'application', 'security', 'network', 'system', 'windows', 'linux', 'database', 'web'
  )),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_source_type)
);

-- Custom named log sources with per-user configuration
CREATE TABLE IF NOT EXISTS public.user_custom_log_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'application', 'security', 'network', 'system', 'windows', 'linux', 'database', 'web'
  )),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_log_source_preferences_user_id
  ON public.user_log_source_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_custom_log_sources_user_id
  ON public.user_custom_log_sources(user_id);

-- RLS for user log source preferences
ALTER TABLE public.user_log_source_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_log_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own log source preferences"
  ON public.user_log_source_preferences;
CREATE POLICY "Users can manage their own log source preferences"
  ON public.user_log_source_preferences
  FOR ALL
  USING (user_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'))
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'));

DROP POLICY IF EXISTS "Users can manage their own custom log sources"
  ON public.user_custom_log_sources;
CREATE POLICY "Users can manage their own custom log sources"
  ON public.user_custom_log_sources
  FOR ALL
  USING (user_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'))
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'));
