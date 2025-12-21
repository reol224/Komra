import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock SystemDataCollector
const mockCollectSystemData = vi.fn();
vi.mock('@/lib/systemDataCollector', () => {
  return {
    default: class MockSystemDataCollector {
      collectSystemData = mockCollectSystemData;
    },
    MachineData: {},
  };
});

// Mock Supabase functions
interface MockFns {
  from: ReturnType<typeof vi.fn>;
}

vi.mock('@supabase/supabase-js', () => {
  const from = vi.fn();

  (global as any).__supabaseDataIngestionIntegrationMocks = {
    from,
  };

  return {
    createClient: () => ({
      from,
    }),
  };
});

// Import after mocking
import { DataIngestionService } from '@/lib/dataIngestionService';
import { MachineData, SystemInfo, SystemPackage } from '@/lib/systemDataCollector';

// Helper to get mocks
const getMocks = () => (global as any).__supabaseDataIngestionIntegrationMocks as MockFns;

describe('DataIngestionService Integration Tests', () => {
  let mocks: MockFns;
  let service: DataIngestionService;

  // Sample machine data for tests
  const createSystemInfo = (overrides: Partial<SystemInfo> = {}): SystemInfo => ({
    hostname: 'test-server-01',
    ip_address: '192.168.1.100',
    os_type: 'Ubuntu',
    os_version: '22.04',
    architecture: 'x64',
    cpu_info: 'Intel Core i7',
    memory_total: 16000000000,
    disk_usage: { total: '500GB', used: '200GB' },
    network_interfaces: [{ name: 'eth0', interfaces: [{ address: '192.168.1.100', family: 'IPv4', internal: false }] }],
    running_services: ['nginx', 'postgresql', 'docker'],
    environment: 'production',
    ...overrides,
  });

  const createPackage = (overrides: Partial<SystemPackage> = {}): SystemPackage => ({
    name: 'nginx',
    version: '1.24.0',
    vendor: 'nginx',
    package_type: 'deb',
    description: 'Web server',
    ...overrides,
  });

  const createMachineData = (
    systemInfo: Partial<SystemInfo> = {},
    packages: SystemPackage[] = [],
    vulnerabilities?: any[]
  ): MachineData => ({
    endpoint: createSystemInfo(systemInfo),
    packages: packages.length > 0 ? packages : [createPackage()],
    vulnerabilities,
    last_scan: new Date().toISOString(),
  });

  beforeEach(() => {
    mocks = getMocks();
    vi.clearAllMocks();
    service = new DataIngestionService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Data Ingestion Workflow', () => {
    it('should complete full data collection and storage workflow for production server', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const productionPackages: SystemPackage[] = [
        createPackage({ name: 'nginx', version: '1.24.0', vendor: 'nginx' }),
        createPackage({ name: 'nodejs', version: '20.10.0', vendor: 'nodejs' }),
        createPackage({ name: 'postgresql', version: '15.4', vendor: 'PostgreSQL' }),
        createPackage({ name: 'redis', version: '7.2.0', vendor: 'Redis' }),
        createPackage({ name: 'docker', version: '24.0.0', vendor: 'Docker' }),
      ];

      const machineData = createMachineData(
        {
          hostname: 'prod-web-server-01',
          ip_address: '10.0.1.100',
          environment: 'production',
          running_services: ['nginx', 'postgresql', 'redis', 'docker'],
        },
        productionPackages
      );

      mockCollectSystemData.mockResolvedValue(machineData);

      let endpointUpsertCalled = false;
      let packagesUpsertCount = 0;
      let endpointPackagesUpsertCount = 0;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoints') {
          return {
            upsert: () => {
              endpointUpsertCalled = true;
              return {
                select: () => ({
                  single: () => Promise.resolve({
                    data: { id: 'endpoint-prod-1', hostname: 'prod-web-server-01' },
                    error: null,
                  }),
                }),
              };
            },
          };
        }
        if (table === 'packages') {
          return {
            upsert: () => {
              packagesUpsertCount++;
              return {
                select: () => ({
                  single: () => Promise.resolve({
                    data: { id: `pkg-${packagesUpsertCount}`, name: productionPackages[packagesUpsertCount - 1]?.name },
                    error: null,
                  }),
                }),
              };
            },
          };
        }
        if (table === 'endpoint_packages') {
          return {
            upsert: () => {
              endpointPackagesUpsertCount++;
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      });

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(true);
      expect(result.data?.endpoint.hostname).toBe('prod-web-server-01');
      expect(result.data?.endpoint.environment).toBe('production');
      expect(result.data?.packages).toHaveLength(5);
      expect(endpointUpsertCalled).toBe(true);
      expect(packagesUpsertCount).toBe(5);
      expect(endpointPackagesUpsertCount).toBe(5);

      consoleSpy.mockRestore();
    });

    it('should handle multi-server infrastructure data ingestion', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const servers = [
        { hostname: 'web-server-01', env: 'production' as const, ip: '10.0.1.1' },
        { hostname: 'db-server-01', env: 'production' as const, ip: '10.0.1.2' },
        { hostname: 'staging-server-01', env: 'staging' as const, ip: '10.0.2.1' },
        { hostname: 'dev-server-01', env: 'development' as const, ip: '10.0.3.1' },
      ];

      for (const server of servers) {
        const machineData = createMachineData({
          hostname: server.hostname,
          environment: server.env,
          ip_address: server.ip,
        });

        mockCollectSystemData.mockResolvedValue(machineData);

        mocks.from.mockImplementation((table: string) => {
          if (table === 'endpoints') {
            return {
              upsert: () => ({
                select: () => ({
                  single: () => Promise.resolve({
                    data: { id: `endpoint-${server.hostname}`, hostname: server.hostname },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'packages') {
            return {
              upsert: () => ({
                select: () => ({
                  single: () => Promise.resolve({
                    data: { id: 'pkg-1', name: 'nginx' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'endpoint_packages') {
            return {
              upsert: () => Promise.resolve({ error: null }),
            };
          }
          return {};
        });

        const result = await service.collectAndStoreSystemData();

        expect(result.success).toBe(true);
        expect(result.data?.endpoint.hostname).toBe(server.hostname);
        expect(result.data?.endpoint.environment).toBe(server.env);
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Data Retrieval Workflows', () => {
    it('should retrieve all stored endpoints', async () => {
      const mockEndpoints = [
        {
          id: 'endpoint-1',
          hostname: 'prod-web-01',
          environment: 'production',
          endpoint_packages: [{ package_id: 'p1', packages: { name: 'nginx' } }],
        },
        {
          id: 'endpoint-2',
          hostname: 'prod-db-01',
          environment: 'production',
          endpoint_packages: [{ package_id: 'p2', packages: { name: 'postgresql' } }],
        },
        {
          id: 'endpoint-3',
          hostname: 'staging-web-01',
          environment: 'staging',
          endpoint_packages: [],
        },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockEndpoints, error: null }),
      });

      const data = await service.getStoredSystemData();

      expect(data).toHaveLength(3);
      expect(data.find((e: any) => e.hostname === 'prod-web-01')).toBeDefined();
      expect(data.find((e: any) => e.hostname === 'prod-db-01')).toBeDefined();
      expect(data.find((e: any) => e.hostname === 'staging-web-01')).toBeDefined();
    });

    it('should retrieve specific endpoint by hostname', async () => {
      const mockEndpoint = {
        id: 'endpoint-1',
        hostname: 'prod-web-01',
        ip_address: '10.0.1.100',
        environment: 'production',
        endpoint_packages: [
          { package_id: 'p1', packages: { name: 'nginx', version: '1.24.0' } },
          { package_id: 'p2', packages: { name: 'nodejs', version: '20.10.0' } },
        ],
      };

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: [mockEndpoint], error: null }),
        }),
      });

      const data = await service.getStoredSystemData('prod-web-01');

      expect(data).toHaveLength(1);
      expect(data[0].hostname).toBe('prod-web-01');
      expect(data[0].endpoint_packages).toHaveLength(2);
    });

    it('should return empty array for non-existent hostname', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      });

      const data = await service.getStoredSystemData('non-existent-server');

      expect(data).toHaveLength(0);
    });
  });

  describe('Vulnerability Scanning Workflows', () => {
    it('should scan endpoint and create vulnerability records', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      let vulnerabilityUpsertCalled = false;
      let upsertData: any = null;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoint_packages') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [
                  { id: 'ep-1', packages: { name: 'nginx', version: '1.24.0' }, endpoints: { hostname: 'prod-web-01' } },
                  { id: 'ep-2', packages: { name: 'openssl', version: '3.0.1' }, endpoints: { hostname: 'prod-web-01' } },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'vulnerabilities') {
          return {
            upsert: (data: any) => {
              vulnerabilityUpsertCalled = true;
              upsertData = data;
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      });

      await service.scanForVulnerabilities('endpoint-prod-1');

      expect(vulnerabilityUpsertCalled).toBe(true);
      expect(upsertData).toBeDefined();
      expect(upsertData.cve_id).toBe('CVE-2024-0001');
      expect(upsertData.severity).toBe('high');
      expect(upsertData.status).toBe('open');

      consoleSpy.mockRestore();
    });

    it('should handle vulnerability scan on endpoint with no packages', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      let vulnerabilityUpsertCalled = false;

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoint_packages') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === 'vulnerabilities') {
          return {
            upsert: () => {
              vulnerabilityUpsertCalled = true;
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      });

      await service.scanForVulnerabilities('endpoint-empty');

      // Mock vulnerabilities are still inserted (as per current implementation)
      expect(vulnerabilityUpsertCalled).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle database connection failure during data ingestion', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const machineData = createMachineData();
      mockCollectSystemData.mockResolvedValue(machineData);

      mocks.from.mockReturnValue({
        upsert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { message: 'Connection refused: Database server unreachable' },
            }),
          }),
        }),
      });

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to store endpoint data');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle system data collection failure', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCollectSystemData.mockRejectedValue(new Error('Permission denied: Cannot access system information'));

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied: Cannot access system information');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle partial package storage failure', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const packages = [
        createPackage({ name: 'nginx' }),
        createPackage({ name: 'postgresql' }),
        createPackage({ name: 'redis' }),
      ];

      const machineData = createMachineData({}, packages);
      mockCollectSystemData.mockResolvedValue(machineData);

      let packageCallCount = 0;
      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoints') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'endpoint-1', hostname: 'test-server-01' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'packages') {
          packageCallCount++;
          if (packageCallCount === 2) {
            return {
              upsert: () => ({
                select: () => ({
                  single: () => Promise.resolve({
                    data: null,
                    error: { message: 'Duplicate key violation' },
                  }),
                }),
              }),
            };
          }
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: `pkg-${packageCallCount}`, name: packages[packageCallCount - 1].name },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'endpoint_packages') {
          return {
            upsert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should handle data retrieval failure', async () => {
      mocks.from.mockReturnValue({
        select: () => Promise.resolve({
          data: null,
          error: { message: 'Query timeout exceeded' },
        }),
      });

      await expect(service.getStoredSystemData()).rejects.toThrow('Failed to retrieve system data: Query timeout exceeded');
    });

    it('should handle vulnerability scan failure', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({
            data: null,
            error: { message: 'Table not found' },
          }),
        }),
      });

      await expect(service.scanForVulnerabilities('endpoint-1')).rejects.toThrow('Failed to get endpoint packages: Table not found');

      consoleSpy.mockRestore();
    });
  });

  describe('Windows Server Data Ingestion', () => {
    it('should handle Windows Server system data', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const windowsPackages: SystemPackage[] = [
        createPackage({ name: 'Microsoft SQL Server', version: '2019', package_type: 'msi', vendor: 'Microsoft' }),
        createPackage({ name: 'IIS', version: '10.0', package_type: 'msi', vendor: 'Microsoft' }),
        createPackage({ name: 'Visual C++ Runtime', version: '14.0', package_type: 'exe', vendor: 'Microsoft' }),
      ];

      const machineData = createMachineData(
        {
          hostname: 'win-server-01',
          os_type: 'Windows Server',
          os_version: '2019',
          architecture: 'x64',
          running_services: ['MSSQLSERVER', 'W3SVC', 'WAS'],
        },
        windowsPackages
      );

      mockCollectSystemData.mockResolvedValue(machineData);

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoints') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'endpoint-win-1', hostname: 'win-server-01' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'packages') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'pkg-1', name: 'test' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'endpoint_packages') {
          return {
            upsert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(true);
      expect(result.data?.endpoint.os_type).toBe('Windows Server');
      expect(result.data?.packages.some(p => p.package_type === 'msi')).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('macOS Data Ingestion', () => {
    it('should handle macOS system data', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const macPackages: SystemPackage[] = [
        createPackage({ name: 'Xcode', version: '15.0', package_type: 'dmg', vendor: 'Apple' }),
        createPackage({ name: 'Visual Studio Code', version: '1.85.0', package_type: 'dmg', vendor: 'Microsoft' }),
        createPackage({ name: 'node', version: '20.10.0', package_type: 'brew' }),
        createPackage({ name: 'python', version: '3.12.0', package_type: 'brew' }),
      ];

      const machineData = createMachineData(
        {
          hostname: 'mac-dev-01',
          os_type: 'macOS',
          os_version: '14.0',
          architecture: 'arm64',
          running_services: ['com.apple.finder', 'com.apple.dock'],
        },
        macPackages
      );

      mockCollectSystemData.mockResolvedValue(machineData);

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoints') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'endpoint-mac-1', hostname: 'mac-dev-01' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'packages') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'pkg-1', name: 'test' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'endpoint_packages') {
          return {
            upsert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(true);
      expect(result.data?.endpoint.os_type).toBe('macOS');
      expect(result.data?.packages.some(p => p.package_type === 'brew')).toBe(true);
      expect(result.data?.packages.some(p => p.package_type === 'dmg')).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Red Hat / CentOS Data Ingestion', () => {
    it('should handle Red Hat Linux system data', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const rpmPackages: SystemPackage[] = [
        createPackage({ name: 'httpd', version: '2.4.57', package_type: 'rpm', vendor: 'Apache' }),
        createPackage({ name: 'postgresql-server', version: '15.4', package_type: 'rpm', vendor: 'PostgreSQL' }),
        createPackage({ name: 'firewalld', version: '1.2.5', package_type: 'rpm', vendor: 'Red Hat' }),
      ];

      const machineData = createMachineData(
        {
          hostname: 'rhel-server-01',
          os_type: 'Red Hat Linux',
          os_version: '9.3',
          running_services: ['httpd.service', 'postgresql.service', 'firewalld.service'],
        },
        rpmPackages
      );

      mockCollectSystemData.mockResolvedValue(machineData);

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoints') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'endpoint-rhel-1', hostname: 'rhel-server-01' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'packages') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'pkg-1', name: 'test' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'endpoint_packages') {
          return {
            upsert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(true);
      expect(result.data?.endpoint.os_type).toBe('Red Hat Linux');
      expect(result.data?.packages.every(p => p.package_type === 'rpm')).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Metadata Storage', () => {
    it('should store complete metadata including CPU, memory, and disk info', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const machineData = createMachineData({
        cpu_info: 'Intel Xeon E5-2680 v4 @ 2.40GHz',
        memory_total: 64000000000,
        disk_usage: {
          '/': { total: '500GB', used: '150GB', free: '350GB' },
          '/data': { total: '2TB', used: '1.2TB', free: '800GB' },
        },
        network_interfaces: [
          { name: 'eth0', interfaces: [{ address: '10.0.1.100', family: 'IPv4', internal: false }] },
          { name: 'eth1', interfaces: [{ address: '10.0.2.100', family: 'IPv4', internal: false }] },
        ],
      });

      mockCollectSystemData.mockResolvedValue(machineData);

      let storedEndpointData: any = null;
      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoints') {
          return {
            upsert: (data: any) => {
              storedEndpointData = data;
              return {
                select: () => ({
                  single: () => Promise.resolve({
                    data: { id: 'endpoint-1', hostname: 'test-server-01' },
                    error: null,
                  }),
                }),
              };
            },
          };
        }
        if (table === 'packages') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'pkg-1', name: 'nginx' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'endpoint_packages') {
          return {
            upsert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });

      await service.collectAndStoreSystemData();

      expect(storedEndpointData).toBeDefined();
      expect(storedEndpointData.metadata.cpu_info).toBe('Intel Xeon E5-2680 v4 @ 2.40GHz');
      expect(storedEndpointData.metadata.memory_total).toBe(64000000000);
      expect(storedEndpointData.metadata.disk_usage).toBeDefined();
      expect(storedEndpointData.metadata.network_interfaces).toHaveLength(2);

      consoleSpy.mockRestore();
    });
  });

  describe('Large Scale Data Ingestion', () => {
    it('should handle endpoint with many packages', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Create 100 packages
      const manyPackages: SystemPackage[] = Array.from({ length: 100 }, (_, i) => 
        createPackage({ name: `package-${i}`, version: `1.0.${i}` })
      );

      const machineData = createMachineData({}, manyPackages);
      mockCollectSystemData.mockResolvedValue(machineData);

      let packageCount = 0;
      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoints') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: 'endpoint-1', hostname: 'test-server-01' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'packages') {
          return {
            upsert: () => {
              packageCount++;
              return {
                select: () => ({
                  single: () => Promise.resolve({
                    data: { id: `pkg-${packageCount}`, name: `package-${packageCount}` },
                    error: null,
                  }),
                }),
              };
            },
          };
        }
        if (table === 'endpoint_packages') {
          return {
            upsert: () => Promise.resolve({ error: null }),
          };
        }
        return {};
      });

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(true);
      expect(result.data?.packages).toHaveLength(100);
      expect(packageCount).toBe(100);

      consoleSpy.mockRestore();
    });
  });
});
