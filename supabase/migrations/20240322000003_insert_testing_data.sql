-- Insert test users
INSERT INTO public.users (id, email, full_name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@komasecurity.com', 'Alice Johnson', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'analyst@komasecurity.com', 'Bob Smith', 'analyst'),
  ('550e8400-e29b-41d4-a716-446655440003', 'security@komasecurity.com', 'Carol Davis', 'analyst'),
  ('550e8400-e29b-41d4-a716-446655440004', 'viewer@komasecurity.com', 'David Wilson', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Insert test endpoints
INSERT INTO public.endpoints (id, hostname, ip_address, os_type, os_version, environment, status, last_scan) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'web-server-01', '192.168.1.10', 'Red Hat Linux', '8.5', 'production', 'critical', NOW() - INTERVAL '2 hours'),
  ('660e8400-e29b-41d4-a716-446655440002', 'db-server-01', '192.168.1.20', 'Windows Server', '2019', 'production', 'vulnerable', NOW() - INTERVAL '1 hour'),
  ('660e8400-e29b-41d4-a716-446655440003', 'app-server-01', '192.168.1.30', 'Red Hat Linux', '9.0', 'production', 'healthy', NOW() - INTERVAL '30 minutes'),
  ('660e8400-e29b-41d4-a716-446655440004', 'test-server-01', '192.168.2.10', 'Windows 10', '21H2', 'testing', 'vulnerable', NOW() - INTERVAL '3 hours'),
  ('660e8400-e29b-41d4-a716-446655440005', 'dev-workstation-01', '192.168.3.10', 'Windows 10', '22H2', 'development', 'healthy', NOW() - INTERVAL '4 hours'),
  ('660e8400-e29b-41d4-a716-446655440006', 'backup-server-01', '192.168.1.40', 'Windows Server', '2022', 'production', 'critical', NOW() - INTERVAL '1 hour'),
  ('660e8400-e29b-41d4-a716-446655440007', 'mail-server-01', '192.168.1.50', 'Red Hat Linux', '8.7', 'production', 'vulnerable', NOW() - INTERVAL '2 hours'),
  ('660e8400-e29b-41d4-a716-446655440008', 'staging-web-01', '192.168.2.20', 'Red Hat Linux', '9.1', 'testing', 'healthy', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Insert test packages
INSERT INTO public.packages (id, name, version, package_type, vendor) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'Apache HTTP Server', '2.4.41', 'web_server', 'Apache Software Foundation'),
  ('770e8400-e29b-41d4-a716-446655440002', 'OpenSSL', '1.1.1f', 'crypto_library', 'OpenSSL Project'),
  ('770e8400-e29b-41d4-a716-446655440003', 'MySQL', '8.0.25', 'database', 'Oracle Corporation'),
  ('770e8400-e29b-41d4-a716-446655440004', 'Node.js', '14.17.0', 'runtime', 'Node.js Foundation'),
  ('770e8400-e29b-41d4-a716-446655440005', 'nginx', '1.18.0', 'web_server', 'Nginx Inc'),
  ('770e8400-e29b-41d4-a716-446655440006', 'PostgreSQL', '13.3', 'database', 'PostgreSQL Global Development Group'),
  ('770e8400-e29b-41d4-a716-446655440007', 'Redis', '6.2.4', 'cache', 'Redis Labs'),
  ('770e8400-e29b-41d4-a716-446655440008', 'Docker', '20.10.7', 'container', 'Docker Inc'),
  ('770e8400-e29b-41d4-a716-446655440009', 'Python', '3.8.10', 'runtime', 'Python Software Foundation'),
  ('770e8400-e29b-41d4-a716-446655440010', 'Java JDK', '11.0.11', 'runtime', 'Oracle Corporation'),
  ('770e8400-e29b-41d4-a716-446655440011', 'Git', '2.25.1', 'version_control', 'Git SCM'),
  ('770e8400-e29b-41d4-a716-446655440012', 'curl', '7.68.0', 'utility', 'curl project'),
  ('770e8400-e29b-41d4-a716-446655440013', 'OpenSSH', '8.2p1', 'ssh_client', 'OpenBSD Project'),
  ('770e8400-e29b-41d4-a716-446655440014', 'vim', '8.1.2269', 'editor', 'Vim project'),
  ('770e8400-e29b-41d4-a716-446655440015', 'sudo', '1.8.31', 'privilege_escalation', 'Todd Miller')
ON CONFLICT (name, version) DO NOTHING;

-- Insert endpoint-package relationships
INSERT INTO public.endpoint_packages (endpoint_id, package_id, installed_date) VALUES
  -- web-server-01 packages
  ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '30 days'),
  ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '45 days'),
  ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '60 days'),
  ('660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '60 days'),
  -- db-server-01 packages
  ('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '20 days'),
  ('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '40 days'),
  -- app-server-01 packages
  ('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '15 days'),
  ('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '25 days'),
  ('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '35 days'),
  ('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '10 days'),
  -- test-server-01 packages
  ('660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '5 days'),
  ('660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440009', NOW() - INTERVAL '12 days'),
  ('660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '18 days'),
  -- dev-workstation-01 packages
  ('660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '7 days'),
  ('660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '14 days'),
  ('660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '21 days'),
  -- backup-server-01 packages
  ('660e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '50 days'),
  ('660e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '55 days'),
  -- mail-server-01 packages
  ('660e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '28 days'),
  ('660e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '42 days'),
  -- staging-web-01 packages
  ('660e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '8 days'),
  ('660e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '16 days')
ON CONFLICT (endpoint_id, package_id) DO NOTHING;

-- Insert test CVEs
INSERT INTO public.cves (id, cve_id, description, severity, cvss_score, published_date, modified_date, reference_urls) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'CVE-2021-44228', 'Apache Log4j2 JNDI features do not protect against attacker controlled LDAP and other JNDI related endpoints.', 'critical', 10.0, '2021-12-09', '2021-12-10', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2021-44228']),
  ('880e8400-e29b-41d4-a716-446655440002', 'CVE-2021-3156', 'Heap-based buffer overflow in Sudo before 1.9.5p2.', 'high', 7.8, '2021-01-26', '2021-02-01', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2021-3156']),
  ('880e8400-e29b-41d4-a716-446655440003', 'CVE-2021-34527', 'Windows Print Spooler Remote Code Execution Vulnerability (PrintNightmare).', 'critical', 8.8, '2021-07-01', '2021-07-13', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2021-34527']),
  ('880e8400-e29b-41d4-a716-446655440004', 'CVE-2022-0847', 'A flaw was found in the way the "flags" member of the new pipe buffer structure was lacking proper initialization in copy_page_to_iter_pipe and push_pipe functions in the Linux kernel.', 'high', 7.8, '2022-03-07', '2022-03-11', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2022-0847']),
  ('880e8400-e29b-41d4-a716-446655440005', 'CVE-2021-41773', 'A flaw was found in a change made to path normalization in Apache HTTP Server 2.4.49.', 'high', 7.5, '2021-10-04', '2021-10-07', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2021-41773']),
  ('880e8400-e29b-41d4-a716-446655440006', 'CVE-2021-1675', 'Windows Print Spooler Elevation of Privilege Vulnerability.', 'high', 7.8, '2021-06-08', '2021-07-13', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2021-1675']),
  ('880e8400-e29b-41d4-a716-446655440007', 'CVE-2022-22965', 'A Spring MVC or Spring WebFlux application running on JDK 9+ may be vulnerable to remote code execution (RCE) via data binding.', 'critical', 9.8, '2022-03-31', '2022-04-01', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2022-22965']),
  ('880e8400-e29b-41d4-a716-446655440008', 'CVE-2021-42013', 'It was found that the fix for Apache HTTP Server for CVE-2021-41773 was insufficient.', 'critical', 9.8, '2021-10-07', '2021-10-08', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2021-42013']),
  ('880e8400-e29b-41d4-a716-446655440009', 'CVE-2022-0778', 'The BN_mod_sqrt() function, which computes a modular square root, contains a bug that can cause it to loop forever for non-prime moduli.', 'high', 7.5, '2022-03-15', '2022-03-16', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2022-0778']),
  ('880e8400-e29b-41d4-a716-446655440010', 'CVE-2021-4034', 'A local privilege escalation vulnerability was found on polkit pkexec utility.', 'high', 7.8, '2022-01-25', '2022-01-28', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2021-4034']),
  ('880e8400-e29b-41d4-a716-446655440011', 'CVE-2022-1292', 'The c_rehash script does not properly sanitise shell metacharacters to prevent command injection.', 'critical', 9.8, '2022-05-03', '2022-05-05', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2022-1292']),
  ('880e8400-e29b-41d4-a716-446655440012', 'CVE-2021-3711', 'In order to decrypt SM2 encrypted data an application is expected to call the API function EVP_PKEY_decrypt().', 'high', 9.8, '2021-08-24', '2021-08-26', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2021-3711']),
  ('880e8400-e29b-41d4-a716-446655440013', 'CVE-2022-32250', 'net/netfilter/nf_tables_api.c in the Linux kernel through 5.18.1 allows a local user to gain privileges.', 'high', 7.8, '2022-06-02', '2022-06-09', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2022-32250']),
  ('880e8400-e29b-41d4-a716-446655440014', 'CVE-2021-44832', 'Apache Log4j2 versions 2.0-beta7 through 2.17.0 are vulnerable to a remote code execution (RCE) attack.', 'medium', 6.6, '2021-12-28', '2021-12-29', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2021-44832']),
  ('880e8400-e29b-41d4-a716-446655440015', 'CVE-2022-26134', 'In affected versions of Confluence Server and Data Center, an OGNL injection vulnerability exists.', 'critical', 9.8, '2022-06-02', '2022-06-03', ARRAY['https://nvd.nist.gov/vuln/detail/CVE-2022-26134'])
ON CONFLICT (cve_id) DO NOTHING;

-- Insert package vulnerabilities
INSERT INTO public.package_vulnerabilities (package_id, cve_id, affected_versions, fixed_version) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440005', ARRAY['2.4.49'], '2.4.50'),
  ('770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440008', ARRAY['2.4.49', '2.4.50'], '2.4.51'),
  ('770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440009', ARRAY['1.1.1f', '1.1.1g', '1.1.1h'], '1.1.1n'),
  ('770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440011', ARRAY['1.1.1f', '1.1.1g', '1.1.1h', '1.1.1i', '1.1.1j', '1.1.1k', '1.1.1l', '1.1.1m'], '1.1.1o'),
  ('770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440012', ARRAY['1.1.1f', '1.1.1g', '1.1.1h', '1.1.1i', '1.1.1j', '1.1.1k'], '1.1.1l'),
  ('770e8400-e29b-41d4-a716-446655440015', '880e8400-e29b-41d4-a716-446655440002', ARRAY['1.8.31'], '1.9.5p2'),
  ('770e8400-e29b-41d4-a716-446655440015', '880e8400-e29b-41d4-a716-446655440010', ARRAY['1.8.31'], '1.9.9'),
  ('770e8400-e29b-41d4-a716-446655440013', '880e8400-e29b-41d4-a716-446655440013', ARRAY['8.2p1'], '8.9p1')
ON CONFLICT (package_id, cve_id) DO NOTHING;

-- Insert remediation plans
INSERT INTO public.remediation_plans (id, name, description, status, assigned_to, due_date, created_by) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', 'Critical OpenSSL Vulnerabilities Q1 2023', 'Address critical OpenSSL vulnerabilities across production infrastructure', 'active', '550e8400-e29b-41d4-a716-446655440002', NOW() + INTERVAL '14 days', '550e8400-e29b-41d4-a716-446655440001'),
  ('990e8400-e29b-41d4-a716-446655440002', 'Apache HTTP Server Security Updates', 'Update Apache HTTP Server to latest secure version', 'active', '550e8400-e29b-41d4-a716-446655440003', NOW() + INTERVAL '7 days', '550e8400-e29b-41d4-a716-446655440001'),
  ('990e8400-e29b-41d4-a716-446655440003', 'Sudo Privilege Escalation Fix', 'Patch sudo vulnerability across all Linux systems', 'completed', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '5 days', '550e8400-e29b-41d4-a716-446655440001'),
  ('990e8400-e29b-41d4-a716-446655440004', 'Windows Print Spooler Remediation', 'Address PrintNightmare vulnerabilities on Windows systems', 'active', '550e8400-e29b-41d4-a716-446655440003', NOW() + INTERVAL '10 days', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

-- Insert triage actions
INSERT INTO public.triage_actions (cve_id, endpoint_id, status, priority, assigned_to, remediation_plan_id, notes, triaged_by, triaged_at) VALUES
  ('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', 'in_progress', 'critical', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', 'Production web server requires immediate patching', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 days'),
  ('880e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440001', 'open', 'critical', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', 'Follow-up vulnerability after CVE-2021-41773 fix', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day'),
  ('880e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440002', 'in_progress', 'high', '550e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440001', 'Database server OpenSSL update scheduled', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '3 days'),
  ('880e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440006', 'open', 'critical', '550e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440001', 'Backup server critical OpenSSL vulnerability', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day'),
  ('880e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440007', 'in_progress', 'high', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', 'Mail server OpenSSL patch in progress', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 days'),
  ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'resolved', 'high', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440003', 'Sudo updated to secure version', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '7 days'),
  ('880e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440001', 'resolved', 'high', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440003', 'Polkit pkexec vulnerability patched', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '6 days'),
  ('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'open', 'critical', '550e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440004', 'PrintNightmare vulnerability on Windows DB server', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day'),
  ('880e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 'in_progress', 'high', '550e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440004', 'Windows Print Spooler patch deployment', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '2 days'),
  ('880e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440001', 'open', 'high', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Linux kernel privilege escalation - needs assessment', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day')
ON CONFLICT (cve_id, endpoint_id) DO NOTHING;

-- Insert some audit log entries for testing
INSERT INTO public.audit_logs (user_id, user_email, action, resource_type, details, severity, status, metadata) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@komasecurity.com', 'REPORT_GENERATED', 'security_report', '{"report_type": "security_audit", "total_endpoints": 8, "total_cves": 15, "critical_cves": 6}', 'high', 'success', '{"action_category": "report_generation", "compliance_relevant": true}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'analyst@komasecurity.com', 'DATA_READ', 'vulnerability_data', '{"resource_accessed": "cve_database", "query_type": "severity_filter"}', 'medium', 'success', '{"action_category": "data_access", "compliance_relevant": true}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'security@komasecurity.com', 'TRIAGE_UPDATED', 'cve_triage', '{"cve_id": "CVE-2021-44228", "status_change": "open_to_in_progress"}', 'medium', 'success', '{"action_category": "vulnerability_management"}'),
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@komasecurity.com', 'REPORT_DOWNLOADED', 'security_report', '{"download_format": "PDF", "report_id": "audit_2024_q1"}', 'medium', 'success', '{"action_category": "data_export", "compliance_relevant": true}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'analyst@komasecurity.com', 'SECURITY_SCAN_INITIATED', 'endpoint_scan', '{"endpoint_count": 8, "scan_type": "vulnerability_assessment"}', 'high', 'success', '{"action_category": "security", "security_relevant": true}')
ON CONFLICT (id) DO NOTHING;