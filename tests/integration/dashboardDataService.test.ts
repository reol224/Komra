import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase functions
interface MockFns {
  from: ReturnType<typeof vi.fn>;
}

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  const from = vi.fn();

  // Store refs for test access
  (global as any).__supabaseDashboardIntegrationMocks = {
    from,
  };

  return {
    createClient: () => ({
      from,
    }),
  };
});

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import {
  DashboardDataService,
  DashboardEndpoint,
  DashboardVulnerability,
  RiskMetrics,
} from '@/lib/dashboardDataService';

// Helper to get mocks
const getMocks = () => (global as any).__supabaseDashboardIntegrationMocks as MockFns;

describe('DashboardDataService Integration Tests', () => {
  let mocks: MockFns;
  let service: DashboardDataService;

  beforeEach(() => {
    mocks = getMocks();
    vi.clearAllMocks();
    service = new DashboardDataService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Dashboard Data Flow', () => {
    it('should retrieve and process complete infrastructure overview', async () => {
      // Setup mock data for a complete infrastructure
      const mockEndpoints = [
        {
          id: 'prod-web-1',
          hostname: 'prod-web-server-01',
          ip_address: '10.0.1.100',
          os_type: 'Ubuntu 22.04',
          os_version: '22.04',
          status: 'active',
          last_scan: '2024-01-15T10:00:00Z',
          environment: 'production',
          metadata: { region: 'us-east-1', tier: 'web' },
          endpoint_packages: [
            { id: 'ep1', packages: { id: 'p1', name: 'nginx', version: '1.24.0' } },
            { id: 'ep2', packages: { id: 'p2', name: 'nodejs', version: '18.19.0' } },
          ],
          vulnerabilities: [
            { id: 'v1', severity: 'high' },
            { id: 'v2', severity: 'medium' },
          ],
        },
        {
          id: 'prod-db-1',
          hostname: 'prod-database-01',
          ip_address: '10.0.2.100',
          os_type: 'Ubuntu 22.04',
          os_version: '22.04',
          status: 'active',
          last_scan: '2024-01-15T09:30:00Z',
          environment: 'production',
          metadata: { region: 'us-east-1', tier: 'database' },
          endpoint_packages: [
            { id: 'ep3', packages: { id: 'p3', name: 'postgresql', version: '15.4' } },
          ],
          vulnerabilities: [
            { id: 'v3', severity: 'critical' },
          ],
        },
        {
          id: 'staging-web-1',
          hostname: 'staging-web-server-01',
          ip_address: '10.0.10.100',
          os_type: 'Ubuntu 22.04',
          os_version: '22.04',
          status: 'active',
          last_scan: '2024-01-15T08:00:00Z',
          environment: 'staging',
          metadata: { region: 'us-east-1', tier: 'web' },
          endpoint_packages: [],
          vulnerabilities: [],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockEndpoints, error: null }),
      });

      const endpoints = await service.getEndpoints();

      // Verify endpoint count
      expect(endpoints).toHaveLength(3);

      // Verify production web server
      const prodWeb = endpoints.find(e => e.id === 'prod-web-1');
      expect(prodWeb).toBeDefined();
      expect(prodWeb?.status).toBe('vulnerable');
      expect(prodWeb?.environment).toBe('production');

      // Verify production database (should be critical due to critical vulnerability)
      const prodDb = endpoints.find(e => e.id === 'prod-db-1');
      expect(prodDb).toBeDefined();
      expect(prodDb?.status).toBe('critical');

      // Verify staging server (should be healthy)
      const stagingWeb = endpoints.find(e => e.id === 'staging-web-1');
      expect(stagingWeb).toBeDefined();
      expect(stagingWeb?.status).toBe('healthy');
    });

    it('should calculate comprehensive risk metrics for security dashboard', async () => {
      // Mock endpoints
      const mockEndpoints = [
        { id: '1', hostname: 'healthy-1', ip_address: '1.1.1.1', os_type: 'Linux', status: 'active', last_scan: '', environment: 'prod', endpoint_packages: [], vulnerabilities: [] },
        { id: '2', hostname: 'healthy-2', ip_address: '1.1.1.2', os_type: 'Linux', status: 'active', last_scan: '', environment: 'prod', endpoint_packages: [], vulnerabilities: [] },
        { id: '3', hostname: 'vulnerable-1', ip_address: '1.1.1.3', os_type: 'Linux', status: 'active', last_scan: '', environment: 'prod', endpoint_packages: [], vulnerabilities: [{ id: 'v1', severity: 'high' }] },
        { id: '4', hostname: 'critical-1', ip_address: '1.1.1.4', os_type: 'Linux', status: 'active', last_scan: '', environment: 'prod', endpoint_packages: [], vulnerabilities: [{ id: 'v2', severity: 'critical' }] },
        { id: '5', hostname: 'critical-2', ip_address: '1.1.1.5', os_type: 'Linux', status: 'active', last_scan: '', environment: 'prod', endpoint_packages: [], vulnerabilities: [{ id: 'v3', severity: 'critical' }, { id: 'v4', severity: 'high' }] },
      ];

      // Mock vulnerabilities
      const mockVulns = [
        { id: 'v1', cve_id: 'CVE-2024-001', description: 'High vuln', severity: 'high', cvss_score: 7.5, status: 'open', endpoint_id: '3', discovered_date: '', endpoints: { hostname: 'vulnerable-1', environment: 'prod' } },
        { id: 'v2', cve_id: 'CVE-2024-002', description: 'Critical vuln 1', severity: 'critical', cvss_score: 9.8, status: 'open', endpoint_id: '4', discovered_date: '', endpoints: { hostname: 'critical-1', environment: 'prod' } },
        { id: 'v3', cve_id: 'CVE-2024-003', description: 'Critical vuln 2', severity: 'critical', cvss_score: 9.5, status: 'in_progress', endpoint_id: '5', discovered_date: '', endpoints: { hostname: 'critical-2', environment: 'prod' } },
        { id: 'v4', cve_id: 'CVE-2024-004', description: 'High vuln 2', severity: 'high', cvss_score: 8.0, status: 'open', endpoint_id: '5', discovered_date: '', endpoints: { hostname: 'critical-2', environment: 'prod' } },
        { id: 'v5', cve_id: 'CVE-2024-005', description: 'Medium vuln', severity: 'medium', cvss_score: 5.5, status: 'resolved', endpoint_id: '1', discovered_date: '', endpoints: { hostname: 'healthy-1', environment: 'prod' } },
        { id: 'v6', cve_id: 'CVE-2024-006', description: 'Low vuln', severity: 'low', cvss_score: 2.0, status: 'resolved', endpoint_id: '2', discovered_date: '', endpoints: { hostname: 'healthy-2', environment: 'prod' } },
      ];

      let callCount = 0;
      mocks.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: () => Promise.resolve({ data: mockEndpoints, error: null }) };
        } else {
          return { select: () => ({ order: () => Promise.resolve({ data: mockVulns, error: null }) }) };
        }
      });

      const metrics = await service.getRiskMetrics();

      expect(metrics.criticalCount).toBe(2);
      expect(metrics.highCount).toBe(2);
      expect(metrics.mediumCount).toBe(1);
      expect(metrics.lowCount).toBe(1);
      expect(metrics.totalEndpoints).toBe(5);
      expect(metrics.healthyEndpoints).toBe(2);
      expect(metrics.vulnerableEndpoints).toBe(1);
      expect(metrics.criticalEndpoints).toBe(2);
    });
  });

  describe('Vulnerability Analysis Workflows', () => {
    it('should analyze vulnerability distribution by severity', async () => {
      const mockVulns = [
        // Critical vulnerabilities
        { id: '1', cve_id: 'CVE-2024-001', description: 'Critical 1', severity: 'critical', cvss_score: 9.8, status: 'open', endpoint_id: 'e1', discovered_date: '', endpoints: { hostname: 's1', environment: 'production' } },
        { id: '2', cve_id: 'CVE-2024-002', description: 'Critical 2', severity: 'critical', cvss_score: 9.5, status: 'open', endpoint_id: 'e2', discovered_date: '', endpoints: { hostname: 's2', environment: 'production' } },
        // High vulnerabilities
        { id: '3', cve_id: 'CVE-2024-003', description: 'High 1', severity: 'high', cvss_score: 8.0, status: 'in_progress', endpoint_id: 'e1', discovered_date: '', endpoints: { hostname: 's1', environment: 'staging' } },
        { id: '4', cve_id: 'CVE-2024-004', description: 'High 2', severity: 'high', cvss_score: 7.5, status: 'open', endpoint_id: 'e3', discovered_date: '', endpoints: { hostname: 's3', environment: 'staging' } },
        { id: '5', cve_id: 'CVE-2024-005', description: 'High 3', severity: 'high', cvss_score: 7.0, status: 'resolved', endpoint_id: 'e4', discovered_date: '', endpoints: { hostname: 's4', environment: 'development' } },
        // Medium vulnerabilities
        { id: '6', cve_id: 'CVE-2024-006', description: 'Medium 1', severity: 'medium', cvss_score: 5.5, status: 'open', endpoint_id: 'e1', discovered_date: '', endpoints: { hostname: 's1', environment: 'production' } },
        // Low vulnerabilities
        { id: '7', cve_id: 'CVE-2024-007', description: 'Low 1', severity: 'low', cvss_score: 2.0, status: 'resolved', endpoint_id: 'e5', discovered_date: '', endpoints: { hostname: 's5', environment: 'development' } },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: mockVulns, error: null }),
        }),
      });

      const distribution = await service.getVulnerabilityDistribution();

      // Verify severity distribution
      expect(distribution.severityData.find(s => s.name === 'Critical')?.value).toBe(2);
      expect(distribution.severityData.find(s => s.name === 'High')?.value).toBe(3);
      expect(distribution.severityData.find(s => s.name === 'Medium')?.value).toBe(1);
      expect(distribution.severityData.find(s => s.name === 'Low')?.value).toBe(1);

      // Verify environment distribution
      expect(distribution.environmentData.find(e => e.name === 'Production')?.value).toBe(3);
      expect(distribution.environmentData.find(e => e.name === 'Staging')?.value).toBe(2);
      expect(distribution.environmentData.find(e => e.name === 'Development')?.value).toBe(2);

      // Verify status distribution
      expect(distribution.statusData.find(s => s.name === 'Open')?.value).toBe(4);
      expect(distribution.statusData.find(s => s.name === 'In Progress')?.value).toBe(1);
      expect(distribution.statusData.find(s => s.name === 'Resolved')?.value).toBe(2);
    });

    it('should handle vulnerability triage workflow', async () => {
      const initialVulns = [
        {
          id: 'vuln-new',
          cve_id: 'CVE-2024-CRITICAL',
          description: 'New critical vulnerability discovered',
          severity: 'critical',
          cvss_score: 9.9,
          status: 'open',
          endpoint_id: 'prod-server-1',
          discovered_date: '2024-01-15T10:00:00Z',
          endpoints: { hostname: 'prod-web-01', environment: 'production' },
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: initialVulns, error: null }),
        }),
      });

      const vulns = await service.getVulnerabilities();

      // Verify initial state
      expect(vulns).toHaveLength(1);
      expect(vulns[0].status).toBe('open');
      expect(vulns[0].severity).toBe('critical');
      expect(vulns[0].environment).toBe('production');
    });
  });

  describe('Package Management Scenarios', () => {
    it('should retrieve packages for specific endpoint with vulnerability details', async () => {
      const mockPackages = [
        {
          id: 'ep-1',
          packages: { id: 'pkg-nginx', name: 'nginx', version: '1.24.0', package_type: 'deb', vendor: 'nginx' },
          vulnerabilities: [],
        },
        {
          id: 'ep-2',
          packages: { id: 'pkg-openssl', name: 'openssl', version: '3.0.1', package_type: 'deb', vendor: 'OpenSSL' },
          vulnerabilities: [
            { id: 'v1', severity: 'critical' },
            { id: 'v2', severity: 'high' },
          ],
        },
        {
          id: 'ep-3',
          packages: { id: 'pkg-curl', name: 'curl', version: '8.0.0', package_type: 'deb', vendor: 'curl' },
          vulnerabilities: [
            { id: 'v3', severity: 'medium' },
          ],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: mockPackages, error: null }),
        }),
      });

      const packages = await service.getPackagesForEndpoint('prod-server-1');

      expect(packages).toHaveLength(3);

      // Verify nginx (no vulnerabilities)
      const nginx = packages.find(p => p.name === 'nginx');
      expect(nginx?.severity).toBe('none');
      expect(nginx?.vulnerabilities).toBe(0);

      // Verify openssl (critical and high vulnerabilities)
      const openssl = packages.find(p => p.name === 'openssl');
      expect(openssl?.severity).toBe('critical');
      expect(openssl?.vulnerabilities).toBe(2);

      // Verify curl (medium vulnerability)
      const curl = packages.find(p => p.name === 'curl');
      expect(curl?.severity).toBe('medium');
      expect(curl?.vulnerabilities).toBe(1);
    });

    it('should list all packages across infrastructure', async () => {
      const mockPackages = [
        { id: 'p1', name: 'nginx', version: '1.24.0', vendor: 'nginx', package_type: 'deb', endpoint_packages: [{ endpoint_id: 'e1', endpoints: { hostname: 'web-1' } }] },
        { id: 'p2', name: 'nodejs', version: '18.19.0', vendor: 'nodejs', package_type: 'deb', endpoint_packages: [{ endpoint_id: 'e1', endpoints: { hostname: 'web-1' } }] },
        { id: 'p3', name: 'postgresql', version: '15.4', vendor: 'PostgreSQL', package_type: 'deb', endpoint_packages: [{ endpoint_id: 'e2', endpoints: { hostname: 'db-1' } }] },
        { id: 'p4', name: 'redis', version: '7.2.0', vendor: 'Redis', package_type: 'deb', endpoint_packages: [{ endpoint_id: 'e3', endpoints: { hostname: 'cache-1' } }] },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockPackages, error: null }),
      });

      const packages = await service.getPackages();

      expect(packages).toHaveLength(4);
      expect(packages.map(p => p.name)).toContain('nginx');
      expect(packages.map(p => p.name)).toContain('postgresql');
    });
  });

  describe('Data Collection Workflows', () => {
    it('should trigger manual data collection successfully', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          collected: { endpoints: 10, packages: 150, vulnerabilities: 25 },
        }),
      });

      const result = await service.triggerDataCollection();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/system-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle data collection failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: false,
          error: 'Agent unreachable',
        }),
      });

      const result = await service.triggerDataCollection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Agent unreachable');

      consoleSpy.mockRestore();
    });

    it('should trigger vulnerability assessment for endpoint', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoint_packages') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [
                  { id: 'ep-1', endpoint_id: 'prod-server-1', packages: { id: 'p1', name: 'nginx', version: '1.24.0' } },
                  { id: 'ep-2', endpoint_id: 'prod-server-1', packages: { id: 'p2', name: 'openssl', version: '3.0.1' } },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'vulnerabilities') {
          return { upsert: upsertMock };
        }
        return {};
      });

      await service.triggerVulnerabilityAssessment('prod-server-1');

      // Verify upsert was called for mock vulnerabilities
      expect(upsertMock).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Vulnerability assessment completed for endpoint prod-server-1');

      consoleSpy.mockRestore();
    });
  });

  describe('Status Update Workflows', () => {
    it('should update endpoint status to healthy', async () => {
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      await expect(service.updateEndpointStatus('endpoint-1', 'healthy')).resolves.not.toThrow();
    });

    it('should update endpoint status to vulnerable', async () => {
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      await expect(service.updateEndpointStatus('endpoint-1', 'vulnerable')).resolves.not.toThrow();
    });

    it('should update endpoint status to critical', async () => {
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      await expect(service.updateEndpointStatus('endpoint-1', 'critical')).resolves.not.toThrow();
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle database connection failures gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: null, error: { message: 'Connection refused' } }),
      });

      const endpoints = await service.getEndpoints();
      expect(endpoints).toEqual([]);

      const metrics = await service.getRiskMetrics();
      expect(metrics.totalEndpoints).toBe(0);

      consoleSpy.mockRestore();
    });

    it('should handle network timeouts gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const result = await service.triggerDataCollection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to trigger data collection');

      consoleSpy.mockRestore();
    });

    it('should handle malformed data gracefully', async () => {
      const mockEndpoints = [
        {
          id: 'endpoint-1',
          hostname: null,
          ip_address: null,
          os_type: null,
          os_version: null,
          status: null,
          last_scan: null,
          environment: null,
          metadata: null,
          endpoint_packages: null,
          vulnerabilities: null,
        },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockEndpoints, error: null }),
      });

      const endpoints = await service.getEndpoints();

      // Should still return an endpoint with default/null values
      expect(endpoints).toHaveLength(1);
      expect(endpoints[0].status).toBe('healthy');
    });
  });

  describe('Multi-Environment Scenarios', () => {
    it('should handle data from multiple environments', async () => {
      const mockEndpoints = [
        { id: 'prod-1', hostname: 'prod-web-01', ip_address: '10.0.1.1', os_type: 'Linux', status: 'active', last_scan: '', environment: 'production', endpoint_packages: [], vulnerabilities: [{ id: 'v1', severity: 'critical' }] },
        { id: 'prod-2', hostname: 'prod-db-01', ip_address: '10.0.1.2', os_type: 'Linux', status: 'active', last_scan: '', environment: 'production', endpoint_packages: [], vulnerabilities: [] },
        { id: 'staging-1', hostname: 'staging-web-01', ip_address: '10.0.2.1', os_type: 'Linux', status: 'active', last_scan: '', environment: 'staging', endpoint_packages: [], vulnerabilities: [{ id: 'v2', severity: 'high' }] },
        { id: 'dev-1', hostname: 'dev-web-01', ip_address: '10.0.3.1', os_type: 'Linux', status: 'active', last_scan: '', environment: 'development', endpoint_packages: [], vulnerabilities: [] },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockEndpoints, error: null }),
      });

      const endpoints = await service.getEndpoints();

      const prodEndpoints = endpoints.filter(e => e.environment === 'production');
      const stagingEndpoints = endpoints.filter(e => e.environment === 'staging');
      const devEndpoints = endpoints.filter(e => e.environment === 'development');

      expect(prodEndpoints).toHaveLength(2);
      expect(stagingEndpoints).toHaveLength(1);
      expect(devEndpoints).toHaveLength(1);

      // Production critical endpoint
      expect(prodEndpoints.find(e => e.id === 'prod-1')?.status).toBe('critical');
      // Production healthy endpoint
      expect(prodEndpoints.find(e => e.id === 'prod-2')?.status).toBe('healthy');
      // Staging vulnerable endpoint
      expect(stagingEndpoints[0].status).toBe('vulnerable');
      // Dev healthy endpoint
      expect(devEndpoints[0].status).toBe('healthy');
    });
  });

  describe('Security Compliance Scenarios', () => {
    it('should identify all critical vulnerabilities for compliance reporting', async () => {
      const mockVulns = [
        { id: '1', cve_id: 'CVE-2024-CRITICAL-1', description: 'Critical RCE', severity: 'critical', cvss_score: 10.0, status: 'open', endpoint_id: 'e1', discovered_date: '2024-01-10T00:00:00Z', endpoints: { hostname: 'prod-1', environment: 'production' } },
        { id: '2', cve_id: 'CVE-2024-CRITICAL-2', description: 'Critical SQLi', severity: 'critical', cvss_score: 9.8, status: 'in_progress', endpoint_id: 'e2', discovered_date: '2024-01-12T00:00:00Z', endpoints: { hostname: 'prod-2', environment: 'production' } },
        { id: '3', cve_id: 'CVE-2024-HIGH-1', description: 'High XSS', severity: 'high', cvss_score: 8.5, status: 'open', endpoint_id: 'e3', discovered_date: '2024-01-14T00:00:00Z', endpoints: { hostname: 'staging-1', environment: 'staging' } },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: mockVulns, error: null }),
        }),
      });

      const vulns = await service.getVulnerabilities();
      const criticalVulns = vulns.filter(v => v.severity === 'critical');
      const prodCriticalVulns = criticalVulns.filter(v => v.environment === 'production');

      expect(criticalVulns).toHaveLength(2);
      expect(prodCriticalVulns).toHaveLength(2);
      expect(prodCriticalVulns.every(v => v.cvss_score >= 9.0)).toBe(true);
    });
  });
});
