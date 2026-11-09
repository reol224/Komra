CREATE TABLE IF NOT EXISTS public.api_rate_limit_windows (
  bucket_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0)
);

ALTER TABLE public.api_rate_limit_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limit_windows FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.api_rate_limit_windows TO service_role;

CREATE OR REPLACE FUNCTION public.consume_nvd_cve_rate_limit(
  p_window_seconds INTEGER,
  p_max_requests INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_allowed BOOLEAN;
  v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF p_window_seconds <= 0 OR p_max_requests <= 0 THEN
    RAISE EXCEPTION 'Rate-limit configuration must be positive.';
  END IF;

  INSERT INTO public.api_rate_limit_windows AS rate_limit (
    bucket_key,
    window_started_at,
    request_count
  )
  VALUES ('nvd-cve-lookups', v_now, 1)
  ON CONFLICT (bucket_key) DO UPDATE
  SET window_started_at = CASE
        WHEN rate_limit.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          THEN v_now
        ELSE rate_limit.window_started_at
      END,
      request_count = CASE
        WHEN rate_limit.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          THEN 1
        ELSE rate_limit.request_count + 1
      END
  WHERE rate_limit.window_started_at <= v_now - make_interval(secs => p_window_seconds)
     OR rate_limit.request_count < p_max_requests
  RETURNING TRUE INTO v_allowed;

  RETURN COALESCE(v_allowed, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_nvd_cve_rate_limit(INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_nvd_cve_rate_limit(INTEGER, INTEGER)
  TO service_role;
