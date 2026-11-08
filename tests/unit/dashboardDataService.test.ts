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
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
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

function pagedTable(data: unknown, error: unknown = null) {
  const query = {
    eq: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data, error }),
  };
  return {
    select: vi.fn().mockReturnValue(query),
    query,
  };
}

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

  describe('getAgentInventoryStats', () => {
    it('aggregates endpoints across API pages', async () => {
      const firstPage = Array.from({ length: 1000 }, (_, index) => ({
        id: `agent-${index}`,
        last_scan: null,
        metadata: { reported_package_count: 1, running_services: [] },
      }));
      const secondPage = [{
        id: 'agent-1000',
        last_scan: '2025-03-02T12:00:00Z',
        metadata: { reported_package_count: 10, running_services: ['ssh'] },
      }];
      const query = {
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((start: number) => Promise.resolve({
          data: start === 0 ? firstPage : secondPage,
          error: null,
        })),
      };
      mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue(query) });

      await expect(service.getAgentInventoryStats()).resolves.toEqual({
        totalEndpoints: 1001,
        reportedPackages: 1010,
        reportedServices: 1,
        latestCollection: '2025-03-02T12:00:00Z',
      });
      expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    });

    it('aggregates package and service counts from agent endpoint metadata', async () => {
      const { query, ...table } = pagedTable([
          {
            id: 'endpoint-1',
            last_scan: '2025-03-01T12:00:00Z',
            metadata: {
              reported_package_count: 120,
              running_services: ['ssh', 'nginx'],
            },
          },
          {
            id: 'endpoint-2',
            last_scan: '2025-03-02T12:00:00Z',
            metadata: {
              reported_package_count: '45',
              running_services: ['cron'],
            },
          },
          {
            id: 'endpoint-3',
            last_scan: 'invalid-date',
            metadata: { reported_package_count: 5, running_services: 'not-an-array' },
          },
      ]);
      mocks.from.mockReturnValue(table);

      await expect(service.getAgentInventoryStats()).resolves.toEqual({
        totalEndpoints: 3,
        reportedPackages: 170,
        reportedServices: 3,
        latestCollection: '2025-03-02T12:00:00Z',
      });
      expect(mocks.from).toHaveBeenCalledWith('endpoints');
      expect(table.select).toHaveBeenCalledWith('id, last_scan, metadata');
      expect(query.filter).toHaveBeenCalledWith(
        'metadata->>collection_source',
        'eq',
        'agent',
      );
      expect(query.range).toHaveBeenCalledWith(0, 999);
    });

    it('returns zero counts when no agent endpoints are reported', async () => {
      const table = pagedTable([]);
      mocks.from.mockReturnValue(table);

      await expect(service.getAgentInventoryStats()).resolves.toEqual({
        totalEndpoints: 0,
        reportedPackages: 0,
        reportedServices: 0,
        latestCollection: null,
      });
    });

    it('surfaces endpoint query errors', async () => {
      const table = pagedTable(null, { message: 'permission denied' });
      mocks.from.mockReturnValue(table);

      await expect(service.getAgentInventoryStats()).rejects.toThrow(
        'Failed to fetch agent inventory: permission denied',
      );
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

      mocks.from.mockReturnValue(pagedTable(mockEndpoints));

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

      mocks.from.mockReturnValue(pagedTable(mockEndpoints));

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

      mocks.from.mockReturnValue(pagedTable(mockEndpoints));

      const endpoints = await service.getEndpoints();

      expect(endpoints[0].status).toBe('vulnerable');
    });

    it('should return empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue(pagedTable(null, { message: 'Database error' }));

      const endpoints = await service.getEndpoints();

      expect(endpoints).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle exceptions gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const query = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockRejectedValue(new Error('Network error')),
      };
      mocks.from.mockReturnValue({
        select: vi.fn().mockReturnValue(query),
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
    it('fetches all pages in stable discovered-date order', async () => {
      const finding = {
        id: 'finding',
        cve_id: 'CVE-2025-0001',
        description: 'Issue',
        severity: 'high',
        cvss_score: 7.5,
        status: 'open',
        endpoint_id: 'endpoint-1',
        discovered_date: '2025-03-01T12:00:00Z',
        endpoints: { hostname: 'agent-host', environment: 'production' },
      };
      const firstPage = Array.from({ length: 1000 }, (_, index) => ({
        ...finding,
        id: `finding-${index}`,
      }));
      const secondPage = [{ ...finding, id: 'finding-1000' }];
      const query = {
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((start: number) => Promise.resolve({
          data: start === 0 ? firstPage : secondPage,
          error: null,
        })),
      };
      mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue(query) });

      const vulnerabilities = await service.getVulnerabilities();

      expect(vulnerabilities).toHaveLength(1001);
      expect(query.range).toHaveBeenNthCalledWith(1, 0, 999);
      expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
      expect(query.order).toHaveBeenCalledWith('discovered_date', { ascending: false });
      expect(query.order).toHaveBeenCalledWith('id', { ascending: true });
    });

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

      mocks.from.mockReturnValue(pagedTable(mockVulns));

      const vulns = await service.getVulnerabilities();

      expect(vulns).toHaveLength(1);
      expect(vulns[0].cve_id).toBe('CVE-2024-0001');
      expect(vulns[0].endpoint_name).toBe('web-server-01');
    });

    describe('assignThreat', () => {
      it('uses the server-authorized assignment endpoint without sending a caller-supplied actor', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
        const input = {
          vulnerabilityId: 'finding-missing',
          cveId: 'CVE-2025-0001',
          endpointId: 'endpoint-1',
          assignedTo: 'analyst-1',
          priority: 'high',
          notes: '',
        } as const;

        await expect(service.assignThreat(input)).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/assign-threat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
      });
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

      mocks.from.mockReturnValue(pagedTable(mockVulns));

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

      mocks.from.mockReturnValue(pagedTable(mockVulns));

      const vulns = await service.getVulnerabilities();

      expect(vulns[0].endpoint_name).toBe('Unknown');
      expect(vulns[0].environment).toBe('Unknown');
    });

    it('should return empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mocks.from.mockReturnValue(pagedTable(null, { message: 'Error' }));

      const vulns = await service.getVulnerabilities();

      expect(vulns).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('getAgentVulnerabilities', () => {
    it('fetches all filtered agent findings across API pages', async () => {
      const finding = {
        id: 'finding',
        cve_id: 'CVE-2025-0001',
        description: 'Issue',
        severity: 'high',
        cvss_score: 7.5,
        status: 'open',
        endpoint_id: 'endpoint-1',
        discovered_date: '2025-03-01T12:00:00Z',
        endpoints: {
          hostname: 'agent-host',
          environment: 'production',
          metadata: { collection_source: 'agent' },
        },
      };
      const firstPage = Array.from({ length: 1000 }, (_, index) => ({
        ...finding,
        id: `finding-${index}`,
      }));
      const secondPage = [{ ...finding, id: 'finding-1000' }];
      const query = {
        eq: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((start: number) => Promise.resolve({
          data: start === 0 ? firstPage : secondPage,
          error: null,
        })),
      };
      mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue(query) });

      const findings = await service.getAgentVulnerabilities();

      expect(findings).toHaveLength(1001);
      expect(query.filter).toHaveBeenCalledWith(
        'endpoints.metadata->>collection_source',
        'eq',
        'agent',
      );
      expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    });

    it('returns findings only for endpoints collected by an agent', async () => {
      const { query, ...table } = pagedTable([
          {
            id: 'finding-1',
            cve_id: 'CVE-2025-0001',
            description: 'Known issue',
            severity: 'critical',
            cvss_score: 9.8,
            status: 'open',
            endpoint_id: 'agent-endpoint',
            discovered_date: '2025-03-01T12:00:00Z',
            source_id: 'OSV-2025-0001',
            reference_urls: ['https://osv.dev/vulnerability/OSV-2025-0001'],
            affected_packages: ['openssl'],
            endpoints: {
              hostname: 'agent-host',
              environment: 'production',
              metadata: { collection_source: 'agent' },
            },
          },
      ]);
      mocks.from.mockReturnValue(table);

      await expect(service.getAgentVulnerabilities()).resolves.toEqual([
        {
          id: 'finding-1',
          cve_id: 'CVE-2025-0001',
          description: 'Known issue',
          severity: 'critical',
          cvss_score: 9.8,
          status: 'open',
          endpoint_id: 'agent-endpoint',
          endpoint_name: 'agent-host',
          environment: 'production',
          discovered_date: '2025-03-01T12:00:00Z',
          affected_packages: ['openssl'],
          source: 'osv',
          source_id: 'OSV-2025-0001',
          reference_urls: ['https://osv.dev/vulnerability/OSV-2025-0001'],
        },
      ]);
      expect(mocks.from).toHaveBeenCalledWith('vulnerabilities');
      expect(table.select).toHaveBeenCalledWith(expect.stringContaining('metadata'));
      expect(query.eq).toHaveBeenCalledWith('source', 'osv');
      expect(query.filter).toHaveBeenCalledWith(
        'endpoints.metadata->>collection_source',
        'eq',
        'agent',
      );
    });

    it('surfaces query errors instead of showing zero findings', async () => {
      mocks.from.mockReturnValue(pagedTable(null, { message: 'permission denied' }));

      await expect(service.getAgentVulnerabilities()).rejects.toThrow(
        'Failed to fetch agent vulnerability findings: permission denied',
      );
    });
  });

  describe('getAgentSystemHealth', () => {
    it('includes endpoints beyond the first page in health reports', async () => {
      const endpoints = Array.from({ length: 1001 }, (_, index) => ({
        id: `endpoint-${index}`,
        hostname: `agent-${index}`,
        os_type: 'Linux',
        last_scan: '2026-11-07T18:00:00.000Z',
        updated_at: '2026-11-07T18:05:00.000Z',
        metadata: { collection_source: 'agent', running_services: [] },
      }));
      const query = {
        filter: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((start: number) => Promise.resolve({
          data: start === 0 ? endpoints.slice(0, 1000) : endpoints.slice(1000),
          error: null,
        })),
      };
      mocks.from.mockReturnValue({ select: vi.fn().mockReturnValue(query) });

      await expect(service.getAgentSystemHealth()).resolves.toHaveLength(1001);
      expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
      expect(query.order).toHaveBeenCalledWith('id', { ascending: true });
    });

    it('returns agent service reports and validates resource telemetry', async () => {
      const { query, ...table } = pagedTable([
          {
            id: 'endpoint-1',
            hostname: 'agent-host',
            os_type: 'Ubuntu 24.04',
            last_scan: '2026-11-07T18:00:00.000Z',
            updated_at: '2026-11-07T18:05:00.000Z',
            metadata: {
              collection_source: 'agent',
              running_services: ['ssh.service', 'cron.service', 1],
              resource_metrics: {
                cpu_usage_percent: 51.2,
                memory_usage_percent: 72,
                memory_used_bytes: 720,
                memory_total_bytes: 1000,
                disk_usage_percent: 84.5,
                disk_used_bytes: 845,
                disk_total_bytes: 1000,
              },
            },
          },
          {
            id: 'endpoint-2',
            hostname: 'old-agent',
            os_type: 'Windows Server',
            last_scan: null,
            updated_at: null,
            metadata: {
              running_services: [],
              resource_metrics: { cpu_usage_percent: 180 },
            },
          },
      ]);
      mocks.from.mockReturnValue(table);

      await expect(service.getAgentSystemHealth()).resolves.toEqual([
        {
          id: 'endpoint-1',
          hostname: 'agent-host',
          osType: 'Ubuntu 24.04',
          lastScan: '2026-11-07T18:00:00.000Z',
          receivedAt: '2026-11-07T18:05:00.000Z',
          runningServices: ['ssh.service', 'cron.service'],
          resourceMetrics: {
            cpu_usage_percent: 51.2,
            memory_usage_percent: 72,
            memory_used_bytes: 720,
            memory_total_bytes: 1000,
            disk_usage_percent: 84.5,
            disk_used_bytes: 845,
            disk_total_bytes: 1000,
          },
        },
        {
          id: 'endpoint-2',
          hostname: 'old-agent',
          osType: 'Windows Server',
          lastScan: null,
          receivedAt: null,
          runningServices: [],
          resourceMetrics: null,
        },
      ]);
      expect(mocks.from).toHaveBeenCalledWith('endpoints');
      expect(query.filter).toHaveBeenCalledWith('metadata->>collection_source', 'eq', 'agent');
      expect(query.order).toHaveBeenCalledWith('last_scan', { ascending: false });
    });

    it('surfaces endpoint query errors', async () => {
      mocks.from.mockReturnValue(pagedTable(null, { message: 'connection failed' }));

      await expect(service.getAgentSystemHealth()).rejects.toThrow(
        'Failed to fetch agent system health: connection failed',
      );
    });
  });

  describe('getAssignedAgentThreats', () => {
    it('loads the analyst assigned OSV finding with endpoint and owner details', async () => {
      const assignment = {
        id: 'assignment-1',
        status: 'in_progress',
        priority: 'critical',
        notes: 'Investigate affected package',
        owner: { id: 'analyst-1', email: 'analyst@example.com', fullName: 'Analyst Owner' },
        assignedBy: { id: 'admin-1', email: 'admin@example.com', fullName: 'Admin User' },
        finding: {
          id: 'finding-1',
          cve_id: 'OSV-2026-1234',
          source: 'osv',
          source_id: 'GHSA-abcd-efgh-ijkl',
          endpoint_name: 'agent-host',
        },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([assignment]),
      });

      const result = await service.getAssignedAgentThreats();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'assignment-1',
        status: 'in_progress',
        priority: 'critical',
        owner: { id: 'analyst-1', email: 'analyst@example.com', fullName: 'Analyst Owner' },
        assignedBy: { id: 'admin-1', email: 'admin@example.com', fullName: 'Admin User' },
        finding: {
          id: 'finding-1',
          cve_id: 'OSV-2026-1234',
          source: 'osv',
          source_id: 'GHSA-abcd-efgh-ijkl',
          endpoint_name: 'agent-host',
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/dashboard/assigned-agent-threats',
        { headers: undefined },
      );
    });

    it('passes optional admin target IDs to the database-authorized route', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

      await expect(service.getAssignedAgentThreats('analyst-target')).resolves.toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/dashboard/assigned-agent-threats?assigneeId=analyst-target',
        { headers: undefined },
      );
    });

    it('surfaces server authorization errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'You are not authorized to view these assignments.' }),
      });

      await expect(service.getAssignedAgentThreats('other-analyst')).rejects.toThrow(
        'You are not authorized to view these assignments.',
      );
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
        return pagedTable(callCount === 1 ? mockEndpoints : mockVulns);
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

      mocks.from.mockReturnValue(pagedTable(null, { message: 'Database error' }));

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

      mocks.from.mockReturnValue(pagedTable(mockVulns));

      const distribution = await service.getVulnerabilityDistribution();

      expect(distribution.severityData.find(s => s.name === 'Critical')?.value).toBe(1);
      expect(distribution.severityData.find(s => s.name === 'High')?.value).toBe(1);
      expect(distribution.environmentData.find(e => e.name === 'Production')?.value).toBe(1);
      expect(distribution.statusData.find(s => s.name === 'Open')?.value).toBe(1);
    });

    it('should return arrays with zero values on empty vulnerabilities', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Return empty array when there's an error in getVulnerabilities
      mocks.from.mockReturnValue(pagedTable(null, { message: 'Error' }));

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
