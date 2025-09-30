INSERT INTO permissions (id, name, description, category, resource, action) VALUES
('system.threat_summary', 'View Threat Summary', 'Access threat detection and security overview', 'System', 'system', 'threat_summary'),
('system.health_monitoring', 'System Health Monitoring', 'Monitor system health and performance metrics', 'System', 'system', 'health_monitoring'),
('system.audit_logs', 'View Audit Logs', 'Access detailed audit trail and access logs', 'System', 'system', 'audit_logs'),
('dashboard.risk_assessment', 'Risk Assessment', 'View risk assessment dashboard and metrics', 'Dashboard', 'dashboard', 'risk_assessment'),
('dashboard.alerts', 'View Alerts', 'Access alerts and notifications dashboard', 'Dashboard', 'dashboard', 'alerts'),
('vulnerabilities.assign', 'Assign Vulnerabilities', 'Assign vulnerabilities to team members', 'Vulnerabilities', 'vulnerabilities', 'assign'),
('vulnerabilities.remediation_plan', 'Remediation Planning', 'Create and manage remediation plans', 'Vulnerabilities', 'vulnerabilities', 'remediation_plan'),
('reports.generate', 'Generate Reports', 'Generate security and compliance reports', 'Reports', 'reports', 'generate'),
('reports.download', 'Download Reports', 'Download reports in various formats', 'Reports', 'reports', 'download'),
('reports.share', 'Share Reports', 'Share reports via email or other methods', 'Reports', 'reports', 'share'),
('system.settings', 'System Settings', 'Access and modify system settings', 'System', 'system', 'settings'),
('system.escalate_threats', 'Escalate Threats', 'Escalate critical security threats', 'System', 'system', 'escalate_threats')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role, permission_id, granted) VALUES
('admin', 'system.threat_summary', true),
('admin', 'system.health_monitoring', true),
('admin', 'system.audit_logs', true),
('admin', 'dashboard.risk_assessment', true),
('admin', 'dashboard.alerts', true),
('admin', 'vulnerabilities.assign', true),
('admin', 'vulnerabilities.remediation_plan', true),
('admin', 'reports.generate', true),
('admin', 'reports.download', true),
('admin', 'reports.share', true),
('admin', 'system.settings', true),
('admin', 'system.escalate_threats', true),
('analyst', 'dashboard.risk_assessment', true),
('analyst', 'dashboard.alerts', true),
('analyst', 'vulnerabilities.assign', true),
('analyst', 'vulnerabilities.remediation_plan', true),
('analyst', 'reports.generate', true),
('analyst', 'reports.download', true),
('analyst', 'reports.share', true),
('viewer', 'dashboard.alerts', true)
ON CONFLICT (role, permission_id) DO UPDATE SET granted = EXCLUDED.granted;