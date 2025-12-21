import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase functions
interface MockFns {
  from: ReturnType<typeof vi.fn>;
}

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  const from = vi.fn();

  // Store refs for test access
  (global as any).__supabaseDashboardMocks = {
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
  DashboardPackage,
  DashboardVulnerability,
  RiskMetrics,
} from '@/lib/dashboardDataService';

// Helper to get mocks
const getMocks = () => (global as any).__supabaseDashboardMocks as MockFns;

describe('DashboardDataService', () => {
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

  describe('DashboardEndpoint interface', () => {
    it('should have correct structure', () => {
      const endpoint: DashboardEndpoint = {
        id: 'endpoint-1',
        name: 'web-server-01',
        ipAddress: '192.168.1.100',
        osType: 'Ubuntu 22.04',
        status: 'healthy',
        lastScan: '2024-01-15T10:00:00Z',
        vulnerablePackages: 0,
        totalPackages: 150,
        environment: 'production',
        metadata: { region: 'us-west-2' },
      };

      expect(endpoint.id).toBe('endpoint-1');
      expect(endpoint.status).toBe('healthy');
      expect(endpoint.environment).toBe('production');
    });

    it('should support all status types', () => {
      const statuses: DashboardEndpoint['status'][] = ['healthy', 'vulnerable', 'critical'];
      statuses.forEach(status => {
        const endpoint: DashboardEndpoint = {
          id: 'test',
          name: 'test',
          ipAddress: '0.0.0.0',
          osType: 'Linux',
          status,
          lastScan: '',
          vulnerablePackages: 0,
          totalPackages: 0,
          environment: 'test',
        };
        expect(endpoint.status).toBe(status);
      });
    });
  });

  describe('DashboardPackage interface', () => {
    it('should have correct structure', () => {
      const pkg: DashboardPackage = {
        id: 'pkg-1',
        name: 'openssl',
        version: '3.0.1',
        vulnerabilities: 2,
        severity: 'high',
        endpointId: 'endpoint-1',
        packageType: 'deb',
        vendor: 'OpenSSL',
      };

      expect(pkg.name).toBe('openssl');
      expect(pkg.severity).toBe('high');
      expect(pkg.vulnerabilities).toBe(2);
    });

    it('should support all severity types', () => {
      const severities: DashboardPackage['severity'][] = ['critical', 'high', 'medium', 'low', 'none'];
      severities.forEach(severity => {
        const pkg: DashboardPackage = {
          id: 'test',
          name: 'test',
          version: '1.0',
          vulnerabilities: 0,
          severity,
          endpointId: 'test',
          packageType: 'npm',
        };
        expect(pkg.severity).toBe(severity);
      });
    });
  });

  describe('DashboardVulnerability interface', () => {
    it('should have correct structure', () => {
      const vuln: DashboardVulnerability = {
        id: 'vuln-1',
        cve_id: 'CVE-2024-0001',
        description: 'Buffer overflow vulnerability',
        severity: 'critical',
        cvss_score: 9.8,
        status: 'open',
        endpoint_id: 'endpoint-1',
        endpoint_name: 'web-server-01',
        environment: 'production',
        discovered_date: '2024-01-15T10:00:00Z',
        affected_packages: ['openssl', 'libssl'],
      };

      expect(vuln.cve_id).toBe('CVE-2024-0001');
      expect(vuln.cvss_score).toBe(9.8);
      expect(vuln.status).toBe('open');
    });

    it('should support all status types', () => {
      const statuses: DashboardVulnerability['status'][] = ['open', 'in_progress', 'resolved'];
      statuses.forEach(status => {
        const vuln: DashboardVulnerability = {
          id: 'test',
          cve_id: 'CVE-2024-0001',
          description: 'Test',
          severity: 'medium',
          cvss_score: 5.0,
          status,
          endpoint_id: 'test',
          endpoint_name: 'test',
          environment: 'test',
          discovered_date: '',
          affected_packages: [],
        };
        expect(vuln.status).toBe(status);
      });
    });
  });

  describe('RiskMetrics interface', () => {
    it('should have correct structure', () => {
      const metrics: RiskMetrics = {
        criticalCount: 5,
        highCount: 10,
        mediumCount: 20,
        lowCount: 15,
        totalEndpoints: 50,
        healthyEndpoints: 30,
        vulnerableEndpoints: 15,
        criticalEndpoints: 5,
      };

      expect(metrics.criticalCount).toBe(5);
      expect(metrics.totalEndpoints).toBe(50);
      expect(metrics.healthyEndpoints).toBe(30);
    });
  });

  describe('getEndpoints', () => {
    it('should return mapped endpoints successfully', async () => {
      const mockEndpoints = [
        {
          id: 'endpoint-1',
          hostname: 'web-server-01',
          ip_address: '192.168.1.100',
          os_type: 'Ubuntu 22.04',
          os_version: '22.04',
          status: 'active',
          last_scan: '2024-01-15T10:00:00Z',
          environment: 'production',
          metadata: { region: 'us-west-2' },
          endpoint_packages: [{ id: 'pkg-1', packages: { id: 'p1', name: 'nginx', version: '1.0' } }],
          vulnerabilities: [],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockEndpoints, error: null }),
      });

      const endpoints = await service.getEndpoints();

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0].name).toBe('web-server-01');
      expect(endpoints[0].status).toBe('healthy');
    });

    it('should set status to critical when critical vulnerabilities exist', async () => {
      const mockEndpoints = [
        {
          id: 'endpoint-1',
          hostname: 'vulnerable-server',
          ip_address: '192.168.1.101',
          os_type: 'Ubuntu',
          os_version: '22.04',
          status: 'active',
          last_scan: '2024-01-15T10:00:00Z',
          environment: 'production',
          metadata: null,
          endpoint_packages: [],
          vulnerabilities: [
            { id: 'v1', severity: 'critical' },
            { id: 'v2', severity: 'high' },
          ],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockEndpoints, error: null }),
      });

      const endpoints = await service.getEndpoints();

      expect(endpoints[0].status).toBe('critical');
    });

    it('should set status to vulnerable when high vulnerabilities exist', async () => {
      const mockEndpoints = [
        {
          id: 'endpoint-1',
          hostname: 'vulnerable-server',
          ip_address: '192.168.1.101',
          os_type: 'Ubuntu',
          os_version: '22.04',
          status: 'active',
          last_scan: '2024-01-15T10:00:00Z',
          environment: 'production',
          metadata: null,
          endpoint_packages: [],
          vulnerabilities: [{ id: 'v1', severity: 'high' }],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockEndpoints, error: null }),
      });

      const endpoints = await service.getEndpoints();

      expect(endpoints[0].status).toBe('vulnerable');
    });

    it('should return empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: null, error: { message: 'Database error' } }),
      });

      const endpoints = await service.getEndpoints();

      expect(endpoints).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle exceptions gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => Promise.reject(new Error('Network error')),
      });

      const endpoints = await service.getEndpoints();

      expect(endpoints).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('getPackagesForEndpoint', () => {
    it('should return mapped packages successfully', async () => {
      const mockPackages = [
        {
          id: 'ep-1',
          packages: { id: 'pkg-1', name: 'nginx', version: '1.0', package_type: 'deb', vendor: 'Nginx' },
          vulnerabilities: [],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: mockPackages, error: null }),
        }),
      });

      const packages = await service.getPackagesForEndpoint('endpoint-1');

      expect(packages).toHaveLength(1);
      expect(packages[0].name).toBe('nginx');
      expect(packages[0].severity).toBe('none');
    });

    it('should determine severity based on vulnerabilities', async () => {
      const mockPackages = [
        {
          id: 'ep-1',
          packages: { id: 'pkg-1', name: 'openssl', version: '3.0.1', package_type: 'deb', vendor: 'OpenSSL' },
          vulnerabilities: [
            { id: 'v1', severity: 'critical' },
            { id: 'v2', severity: 'high' },
          ],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: mockPackages, error: null }),
        }),
      });

      const packages = await service.getPackagesForEndpoint('endpoint-1');

      expect(packages[0].severity).toBe('critical');
      expect(packages[0].vulnerabilities).toBe(2);
    });

    it('should handle array packages format', async () => {
      const mockPackages = [
        {
          id: 'ep-1',
          packages: [{ id: 'pkg-1', name: 'node', version: '18.0', package_type: 'npm', vendor: 'Node.js' }],
          vulnerabilities: [],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: mockPackages, error: null }),
        }),
      });

      const packages = await service.getPackagesForEndpoint('endpoint-1');

      expect(packages[0].name).toBe('node');
    });

    it('should return empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Error' } }),
        }),
      });

      const packages = await service.getPackagesForEndpoint('endpoint-1');

      expect(packages).toEqual([]);

      consoleSpy.mockRestore();
    });

    it('should filter out packages without valid data', async () => {
      const mockPackages = [
        {
          id: 'ep-1',
          packages: null,
          vulnerabilities: [],
        },
        {
          id: 'ep-2',
          packages: { id: 'pkg-1', name: 'valid', version: '1.0', package_type: 'npm' },
          vulnerabilities: [],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: mockPackages, error: null }),
        }),
      });

      const packages = await service.getPackagesForEndpoint('endpoint-1');

      expect(packages).toHaveLength(1);
      expect(packages[0].name).toBe('valid');
    });
  });

  describe('getVulnerabilities', () => {
    it('should return mapped vulnerabilities successfully', async () => {
      const mockVulns = [
        {
          id: 'vuln-1',
          cve_id: 'CVE-2024-0001',
          description: 'Test vulnerability',
          severity: 'high',
          cvss_score: 8.5,
          status: 'open',
          endpoint_id: 'endpoint-1',
          discovered_date: '2024-01-15T10:00:00Z',
          endpoints: { hostname: 'web-server-01', environment: 'production' },
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: mockVulns, error: null }),
        }),
      });

      const vulns = await service.getVulnerabilities();

      expect(vulns).toHaveLength(1);
      expect(vulns[0].cve_id).toBe('CVE-2024-0001');
      expect(vulns[0].endpoint_name).toBe('web-server-01');
    });

    it('should handle array endpoints format', async () => {
      const mockVulns = [
        {
          id: 'vuln-1',
          cve_id: 'CVE-2024-0001',
          description: 'Test',
          severity: 'medium',
          cvss_score: 5.0,
          status: 'open',
          endpoint_id: 'endpoint-1',
          discovered_date: '2024-01-15T10:00:00Z',
          endpoints: [{ hostname: 'server-01', environment: 'staging' }],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: mockVulns, error: null }),
        }),
      });

      const vulns = await service.getVulnerabilities();

      expect(vulns[0].endpoint_name).toBe('server-01');
      expect(vulns[0].environment).toBe('staging');
    });

    it('should handle missing endpoint data', async () => {
      const mockVulns = [
        {
          id: 'vuln-1',
          cve_id: 'CVE-2024-0001',
          description: 'Test',
          severity: 'low',
          cvss_score: 3.0,
          status: 'resolved',
          endpoint_id: 'endpoint-1',
          discovered_date: '2024-01-15T10:00:00Z',
          endpoints: null,
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: mockVulns, error: null }),
        }),
      });

      const vulns = await service.getVulnerabilities();

      expect(vulns[0].endpoint_name).toBe('Unknown');
      expect(vulns[0].environment).toBe('Unknown');
    });

    it('should return empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: { message: 'Error' } }),
        }),
      });

      const vulns = await service.getVulnerabilities();

      expect(vulns).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('getRiskMetrics', () => {
    it('should calculate risk metrics correctly', async () => {
      // Mock getEndpoints
      const mockEndpoints = [
        { id: '1', hostname: 's1', ip_address: '1.1.1.1', os_type: 'Linux', status: 'active', last_scan: '', environment: 'prod', endpoint_packages: [], vulnerabilities: [] },
        { id: '2', hostname: 's2', ip_address: '1.1.1.2', os_type: 'Linux', status: 'active', last_scan: '', environment: 'prod', endpoint_packages: [], vulnerabilities: [{ id: 'v1', severity: 'critical' }] },
        { id: '3', hostname: 's3', ip_address: '1.1.1.3', os_type: 'Linux', status: 'active', last_scan: '', environment: 'prod', endpoint_packages: [], vulnerabilities: [{ id: 'v2', severity: 'high' }] },
      ];

      // Mock getVulnerabilities
      const mockVulns = [
        { id: 'v1', cve_id: 'CVE-1', description: '', severity: 'critical', cvss_score: 9.0, status: 'open', endpoint_id: '2', discovered_date: '', endpoints: { hostname: 's2', environment: 'prod' } },
        { id: 'v2', cve_id: 'CVE-2', description: '', severity: 'high', cvss_score: 7.0, status: 'open', endpoint_id: '3', discovered_date: '', endpoints: { hostname: 's3', environment: 'prod' } },
        { id: 'v3', cve_id: 'CVE-3', description: '', severity: 'medium', cvss_score: 5.0, status: 'open', endpoint_id: '3', discovered_date: '', endpoints: { hostname: 's3', environment: 'prod' } },
        { id: 'v4', cve_id: 'CVE-4', description: '', severity: 'low', cvss_score: 2.0, status: 'resolved', endpoint_id: '1', discovered_date: '', endpoints: { hostname: 's1', environment: 'prod' } },
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

      expect(metrics.criticalCount).toBe(1);
      expect(metrics.highCount).toBe(1);
      expect(metrics.mediumCount).toBe(1);
      expect(metrics.lowCount).toBe(1);
      expect(metrics.totalEndpoints).toBe(3);
    });

    it('should return zero metrics on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: null, error: { message: 'Database error' } }),
      });

      const metrics = await service.getRiskMetrics();

      expect(metrics.criticalCount).toBe(0);
      expect(metrics.totalEndpoints).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('getPackages', () => {
    it('should return mapped packages successfully', async () => {
      const mockPackages = [
        {
          id: 'pkg-1',
          name: 'nginx',
          version: '1.0',
          vendor: 'Nginx',
          package_type: 'deb',
          endpoint_packages: [{ endpoint_id: 'e1', endpoints: { hostname: 'server-1' } }],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockPackages, error: null }),
      });

      const packages = await service.getPackages();

      expect(packages).toHaveLength(1);
      expect(packages[0].name).toBe('nginx');
      expect(packages[0].endpointId).toBe('e1');
    });

    it('should return empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: null, error: { message: 'Error' } }),
      });

      const packages = await service.getPackages();

      expect(packages).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('triggerDataCollection', () => {
    it('should return success on successful API call', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const result = await service.triggerDataCollection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('System data collection completed successfully');
    });

    it('should return failure on API error', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: false, error: 'Collection failed' }),
      });

      const result = await service.triggerDataCollection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection failed');
    });

    it('should handle fetch exception', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await service.triggerDataCollection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to trigger data collection');

      consoleSpy.mockRestore();
    });
  });

  describe('getVulnerabilityDistribution', () => {
    it('should return distribution data', async () => {
      const mockVulns = [
        { id: '1', cve_id: 'CVE-1', description: '', severity: 'critical', cvss_score: 9, status: 'open', endpoint_id: 'e1', discovered_date: '', endpoints: { hostname: 's1', environment: 'production' } },
        { id: '2', cve_id: 'CVE-2', description: '', severity: 'high', cvss_score: 7, status: 'in_progress', endpoint_id: 'e1', discovered_date: '', endpoints: { hostname: 's1', environment: 'staging' } },
        { id: '3', cve_id: 'CVE-3', description: '', severity: 'medium', cvss_score: 5, status: 'resolved', endpoint_id: 'e1', discovered_date: '', endpoints: { hostname: 's1', environment: 'development' } },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: mockVulns, error: null }),
        }),
      });

      const distribution = await service.getVulnerabilityDistribution();

      expect(distribution.severityData.find(s => s.name === 'Critical')?.value).toBe(1);
      expect(distribution.severityData.find(s => s.name === 'High')?.value).toBe(1);
      expect(distribution.environmentData.find(e => e.name === 'Production')?.value).toBe(1);
      expect(distribution.statusData.find(s => s.name === 'Open')?.value).toBe(1);
    });

    it('should return arrays with zero values on empty vulnerabilities', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Return empty array when there's an error in getVulnerabilities
      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: { message: 'Error' } }),
        }),
      });

      const distribution = await service.getVulnerabilityDistribution();

      // getVulnerabilityDistribution processes even empty results, so it returns arrays with zero values
      expect(distribution.severityData).toHaveLength(4);
      expect(distribution.severityData.every(s => s.value === 0)).toBe(true);
      expect(distribution.environmentData).toHaveLength(3);
      expect(distribution.statusData).toHaveLength(3);

      consoleSpy.mockRestore();
    });
  });

  describe('triggerVulnerabilityAssessment', () => {
    it('should insert vulnerabilities for endpoint', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoint_packages') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [{ id: 'ep-1', endpoint_id: 'e1', packages: { id: 'p1', name: 'nginx', version: '1.0' } }], error: null }),
            }),
          };
        }
        if (table === 'vulnerabilities') {
          return { upsert: upsertMock };
        }
        return {};
      });

      await service.triggerVulnerabilityAssessment('endpoint-1');

      expect(upsertMock).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Vulnerability assessment completed for endpoint endpoint-1');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should throw error when fetching packages fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Database error' } }),
        }),
      });

      await expect(service.triggerVulnerabilityAssessment('endpoint-1')).rejects.toThrow('Failed to get endpoint packages');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateEndpointStatus', () => {
    it('should update endpoint status successfully', async () => {
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      await expect(service.updateEndpointStatus('endpoint-1', 'healthy')).resolves.not.toThrow();
    });

    it('should throw error when update fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: { message: 'Update failed' } }),
        }),
      });

      await expect(service.updateEndpointStatus('endpoint-1', 'critical')).rejects.toThrow('Failed to update endpoint status');

      consoleErrorSpy.mockRestore();
    });
  });
});
