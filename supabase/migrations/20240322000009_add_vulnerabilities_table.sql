ALTER TABLE public.endpoint_packages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'installed' CHECK (status IN ('installed', 'removed', 'updated'));

CREATE TABLE IF NOT EXISTS public.vulnerabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.endpoints(id) ON DELETE CASCADE,
  cve_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description TEXT,
  cvss_score DECIMAL(3,1),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'false_positive')),
  discovered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(endpoint_id, cve_id)
);

CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON public.vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_status ON public.vulnerabilities(status);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_endpoint_id ON public.vulnerabilities(endpoint_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.vulnerabilities;