-- pg-delta: transaction=false

UPDATE public.packages
SET package_type = 'unknown'
WHERE package_type IS NULL;

ALTER TABLE public.packages
  ALTER COLUMN package_type SET DEFAULT 'unknown',
  ALTER COLUMN package_type SET NOT NULL;

-- Build the replacement while the legacy constraint still protects writes.
-- This statement must run outside a transaction; if a failed concurrent build
-- leaves an invalid index, drop that index concurrently before retrying.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS packages_name_version_package_type_key
  ON public.packages (name, version, package_type);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.packages'::regclass
      AND conname = 'packages_name_version_package_type_key'
  ) THEN
    ALTER TABLE public.packages
      ADD CONSTRAINT packages_name_version_package_type_key
      UNIQUE USING INDEX packages_name_version_package_type_key;
  END IF;

  ALTER TABLE public.packages
    DROP CONSTRAINT IF EXISTS packages_name_version_key;
END;
$$;

-- Roll back only before rows with multiple package_type values exist for a
-- (name, version) pair. Verify with:
--   SELECT name, version FROM public.packages
--   GROUP BY name, version HAVING count(*) > 1;
-- If clear, concurrently build the old key, attach it, then drop the new key:
--   CREATE UNIQUE INDEX CONCURRENTLY packages_name_version_key
--     ON public.packages (name, version);
--   ALTER TABLE public.packages ADD CONSTRAINT packages_name_version_key
--     UNIQUE USING INDEX packages_name_version_key;
--   ALTER TABLE public.packages DROP CONSTRAINT
--     packages_name_version_package_type_key;
-- If duplicate pairs exist, retain the new identity constraint; rollback is
-- not compatible with data already stored under the expanded identity.

CREATE OR REPLACE FUNCTION public.upsert_local_endpoint(
  p_hostname text,
  p_ip_address inet,
  p_os_type text,
  p_os_version text,
  p_environment text,
  p_last_scan timestamptz,
  p_status text,
  p_metadata jsonb
)
RETURNS SETOF public.endpoints
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  INSERT INTO public.endpoints AS current_endpoint (
    hostname,
    ip_address,
    os_type,
    os_version,
    environment,
    last_scan,
    status,
    metadata
  )
  VALUES (
    p_hostname,
    p_ip_address,
    p_os_type,
    p_os_version,
    p_environment,
    p_last_scan,
    p_status,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (hostname) DO UPDATE
  SET ip_address = EXCLUDED.ip_address,
      os_type = EXCLUDED.os_type,
      os_version = EXCLUDED.os_version,
      environment = EXCLUDED.environment,
      last_scan = EXCLUDED.last_scan,
      status = EXCLUDED.status,
      metadata = COALESCE(current_endpoint.metadata, '{}'::jsonb)
        || COALESCE(EXCLUDED.metadata, '{}'::jsonb)
  RETURNING current_endpoint.*;
$$;
