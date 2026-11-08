UPDATE public.packages
SET package_type = 'unknown'
WHERE package_type IS NULL;

ALTER TABLE public.packages
  ALTER COLUMN package_type SET DEFAULT 'unknown',
  ALTER COLUMN package_type SET NOT NULL;

ALTER TABLE public.packages
  DROP CONSTRAINT IF EXISTS packages_name_version_key,
  ADD CONSTRAINT packages_name_version_package_type_key
    UNIQUE (name, version, package_type);
