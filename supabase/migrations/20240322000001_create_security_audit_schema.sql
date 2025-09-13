CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT NOT NULL,
  ip_address INET,
  os_type TEXT NOT NULL CHECK (os_type IN ('Windows 10', 'Windows Server', 'Red Hat Linux')),
  os_version TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('production', 'testing', 'development')),
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'vulnerable', 'critical')),
  last_scan TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  package_type TEXT,
  vendor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, version)
);

CREATE TABLE IF NOT EXISTS public.endpoint_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.endpoints(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  installed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(endpoint_id, package_id)
);

CREATE TABLE IF NOT EXISTS public.cves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id TEXT UNIQUE NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  cvss_score DECIMAL(3,1),
  published_date TIMESTAMP WITH TIME ZONE,
  modified_date TIMESTAMP WITH TIME ZONE,
  reference_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.package_vulnerabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  cve_id UUID NOT NULL REFERENCES public.cves(id) ON DELETE CASCADE,
  affected_versions TEXT[],
  fixed_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(package_id, cve_id)
);

CREATE TABLE IF NOT EXISTS public.remediation_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES public.users(id),
  due_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.triage_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cve_id UUID NOT NULL REFERENCES public.cves(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES public.endpoints(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'false_positive')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  assigned_to UUID REFERENCES public.users(id),
  remediation_plan_id UUID REFERENCES public.remediation_plans(id),
  notes TEXT,
  triaged_by UUID REFERENCES public.users(id),
  triaged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cve_id, endpoint_id)
);

CREATE INDEX IF NOT EXISTS idx_endpoints_os_type ON public.endpoints(os_type);
CREATE INDEX IF NOT EXISTS idx_endpoints_environment ON public.endpoints(environment);
CREATE INDEX IF NOT EXISTS idx_endpoints_status ON public.endpoints(status);
CREATE INDEX IF NOT EXISTS idx_cves_severity ON public.cves(severity);
CREATE INDEX IF NOT EXISTS idx_cves_cve_id ON public.cves(cve_id);
CREATE INDEX IF NOT EXISTS idx_triage_actions_status ON public.triage_actions(status);
CREATE INDEX IF NOT EXISTS idx_triage_actions_priority ON public.triage_actions(priority);
CREATE INDEX IF NOT EXISTS idx_triage_actions_assigned_to ON public.triage_actions(assigned_to);

ALTER PUBLICATION supabase_realtime ADD TABLE public.endpoints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.endpoint_packages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.package_vulnerabilities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.triage_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.remediation_plans;