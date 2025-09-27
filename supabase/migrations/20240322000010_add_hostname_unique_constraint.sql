ALTER TABLE public.endpoints 
ADD CONSTRAINT unique_hostname UNIQUE (hostname);

CREATE INDEX IF NOT EXISTS idx_endpoints_hostname ON public.endpoints(hostname);