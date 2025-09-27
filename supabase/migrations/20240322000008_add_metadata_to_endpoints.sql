ALTER TABLE public.endpoints 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_endpoints_metadata ON public.endpoints USING GIN (metadata);

ALTER TABLE public.endpoints 
ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE public.endpoints 
SET metadata = '{}' 
WHERE metadata IS NULL;