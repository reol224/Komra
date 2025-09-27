-- Create collection schedules table
CREATE TABLE IF NOT EXISTS collection_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  endpoints TEXT[] NOT NULL DEFAULT '{}',
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  collection_type VARCHAR(20) DEFAULT 'full' CHECK (collection_type IN ('full', 'incremental', 'vulnerability_only')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collection jobs table
CREATE TABLE IF NOT EXISTS collection_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES collection_schedules(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  endpoints_processed INTEGER DEFAULT 0,
  packages_collected INTEGER DEFAULT 0,
  vulnerabilities_found INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create searchable audit trail table for compliance
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  user_id UUID,
  endpoint_id UUID REFERENCES endpoints(id),
  resource_type VARCHAR(50),
  resource_id UUID,
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical', 'info'))
);

-- Create searchable investigation logs table
CREATE TABLE IF NOT EXISTS investigation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  investigation_id UUID DEFAULT gen_random_uuid(),
  investigator_id UUID,
  case_number VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'archived')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  tags TEXT[] DEFAULT '{}',
  evidence JSONB DEFAULT '{}',
  findings TEXT,
  related_endpoints UUID[] DEFAULT '{}',
  related_vulnerabilities UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Create compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  framework VARCHAR(50) NOT NULL, -- SOC2, ISO27001, NIST, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scope JSONB DEFAULT '{}',
  findings JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
  generated_by UUID,
  reviewed_by UUID,
  approved_by UUID,
  report_period_start TIMESTAMPTZ,
  report_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Create indexes for searchability and performance
CREATE INDEX IF NOT EXISTS idx_collection_schedules_enabled ON collection_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_next_run ON collection_schedules(next_run);
CREATE INDEX IF NOT EXISTS idx_collection_jobs_schedule_id ON collection_jobs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_collection_jobs_status ON collection_jobs(status);
CREATE INDEX IF NOT EXISTS idx_collection_jobs_started_at ON collection_jobs(started_at);

-- Audit trail indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trail_event_type ON audit_trail(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_event_category ON audit_trail(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_trail_endpoint_id ON audit_trail(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_severity ON audit_trail(severity);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);

-- Investigation logs indexes
CREATE INDEX IF NOT EXISTS idx_investigation_logs_status ON investigation_logs(status);
CREATE INDEX IF NOT EXISTS idx_investigation_logs_priority ON investigation_logs(priority);
CREATE INDEX IF NOT EXISTS idx_investigation_logs_created_at ON investigation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_investigation_logs_tags ON investigation_logs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_investigation_logs_related_endpoints ON investigation_logs USING GIN(related_endpoints);

-- Compliance reports indexes
CREATE INDEX IF NOT EXISTS idx_compliance_reports_framework ON compliance_reports(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_created_at ON compliance_reports(created_at);

-- Full-text search indexes for investigation and compliance
CREATE INDEX IF NOT EXISTS idx_investigation_logs_search ON investigation_logs USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(findings, '')));
CREATE INDEX IF NOT EXISTS idx_compliance_reports_search ON compliance_reports USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_audit_trail_search ON audit_trail USING GIN(to_tsvector('english', description));

-- Enable realtime for background collection monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE collection_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE collection_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_trail;
ALTER PUBLICATION supabase_realtime ADD TABLE investigation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE compliance_reports;

-- Insert default collection schedules
INSERT INTO collection_schedules (name, endpoints, frequency, collection_type) VALUES
('Daily Security Scan', ARRAY['192.168.1.100', '192.168.1.101', '192.168.1.102'], 'daily', 'full'),
('Hourly Vulnerability Check', ARRAY['192.168.1.100', '192.168.1.101'], 'hourly', 'vulnerability_only'),
('Weekly Full Audit', ARRAY['192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103'], 'weekly', 'full')
ON CONFLICT DO NOTHING;

-- Insert sample audit trail entries
INSERT INTO audit_trail (event_type, event_category, action, description, severity) VALUES
('system_scan', 'security', 'vulnerability_detected', 'Critical vulnerability CVE-2024-1234 detected on endpoint 192.168.1.100', 'critical'),
('data_collection', 'system', 'background_scan_completed', 'Automated security scan completed successfully for 4 endpoints', 'info'),
('compliance', 'audit', 'report_generated', 'SOC2 compliance report generated for Q4 2024', 'info'),
('investigation', 'security', 'case_opened', 'Security investigation opened for suspicious network activity', 'high')
ON CONFLICT DO NOTHING;