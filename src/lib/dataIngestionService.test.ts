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

  (global as any).__supabaseDataIngestionMocks = {
    from,
  };

  return {
    createClient: () => ({
      from,
    }),
  };
});

// Import after mocking
import { DataIngestionService } from './dataIngestionService';
import { MachineData, SystemInfo, SystemPackage } from './systemDataCollector';

// Helper to get mocks
const getMocks = () => (global as any).__supabaseDataIngestionMocks as MockFns;

describe('DataIngestionService', () => {
  let mocks: MockFns;
  let service: DataIngestionService;

  // Sample machine data for tests
  const sampleSystemInfo: SystemInfo = {
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
  };

  const samplePackages: SystemPackage[] = [
    { name: 'nginx', version: '1.24.0', vendor: 'nginx', package_type: 'deb', description: 'Web server' },
    { name: 'nodejs', version: '18.19.0', vendor: 'nodejs', package_type: 'deb', description: 'JavaScript runtime' },
    { name: 'postgresql', version: '15.4', vendor: 'PostgreSQL', package_type: 'deb', description: 'Database' },
  ];

  const sampleMachineData: MachineData = {
    endpoint: sampleSystemInfo,
    packages: samplePackages,
    last_scan: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    mocks = getMocks();
    vi.clearAllMocks();
    service = new DataIngestionService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a new instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DataIngestionService);
    });
  });

  describe('collectAndStoreSystemData', () => {
    it('should collect and store system data successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockCollectSystemData.mockResolvedValue(sampleMachineData);

      // Mock endpoint upsert
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
      expect(result.data).toBeDefined();
      expect(result.data?.endpoint.hostname).toBe('test-server-01');
      expect(consoleSpy).toHaveBeenCalledWith('✅ System data collection and storage completed');

      consoleSpy.mockRestore();
    });

    it('should return error when data collection fails', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCollectSystemData.mockRejectedValue(new Error('Collection failed'));

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Collection failed');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle unknown error types', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCollectSystemData.mockRejectedValue('String error');

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log system data details during collection', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockCollectSystemData.mockResolvedValue(sampleMachineData);

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

      expect(consoleSpy).toHaveBeenCalledWith('🔍 Starting system data collection...');
      expect(consoleSpy).toHaveBeenCalledWith(`📊 Collected data for ${sampleMachineData.endpoint.hostname}:`);

      consoleSpy.mockRestore();
    });
  });

  describe('storeSystemData (via collectAndStoreSystemData)', () => {
    it('should throw error when endpoint upsert fails', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockCollectSystemData.mockResolvedValue(sampleMachineData);

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoints') {
          return {
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: null,
                  error: { message: 'Database connection failed' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to store endpoint data');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should continue when package upsert fails', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockCollectSystemData.mockResolvedValue(sampleMachineData);

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
            upsert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: null,
                  error: { message: 'Package insert failed' },
                }),
              }),
            }),
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

    it('should continue when endpoint_packages link fails', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockCollectSystemData.mockResolvedValue(sampleMachineData);

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
            upsert: () => Promise.resolve({ error: { message: 'Link failed' } }),
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

    it('should handle package processing exceptions', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockCollectSystemData.mockResolvedValue(sampleMachineData);

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
          if (packageCallCount === 1) {
            throw new Error('Unexpected error');
          }
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
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getStoredSystemData', () => {
    it('should retrieve all system data when no hostname provided', async () => {
      const mockData = [
        { id: 'endpoint-1', hostname: 'server-01', endpoint_packages: [] },
        { id: 'endpoint-2', hostname: 'server-02', endpoint_packages: [] },
      ];

      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: mockData, error: null }),
      });

      const data = await service.getStoredSystemData();

      expect(data).toHaveLength(2);
      expect(data[0].hostname).toBe('server-01');
    });

    it('should retrieve filtered data when hostname provided', async () => {
      const mockData = [{ id: 'endpoint-1', hostname: 'server-01', endpoint_packages: [] }];

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: mockData, error: null }),
        }),
      });

      const data = await service.getStoredSystemData('server-01');

      expect(data).toHaveLength(1);
      expect(data[0].hostname).toBe('server-01');
    });

    it('should throw error when query fails', async () => {
      mocks.from.mockReturnValue({
        select: () => Promise.resolve({ data: null, error: { message: 'Query failed' } }),
      });

      await expect(service.getStoredSystemData()).rejects.toThrow('Failed to retrieve system data: Query failed');
    });
  });

  describe('scanForVulnerabilities', () => {
    it('should scan endpoint and insert vulnerabilities', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      mocks.from.mockImplementation((table: string) => {
        if (table === 'endpoint_packages') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [
                  { id: 'ep-1', packages: { name: 'nginx', version: '1.24.0' }, endpoints: { hostname: 'server-01' } },
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

      await service.scanForVulnerabilities('endpoint-1');

      expect(upsertMock).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('🔍 Scanning endpoint endpoint-1 for vulnerabilities...');
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Found 1 vulnerabilities');

      consoleSpy.mockRestore();
    });

    it('should throw error when getting packages fails', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Database error' } }),
        }),
      });

      await expect(service.scanForVulnerabilities('endpoint-1')).rejects.toThrow('Failed to get endpoint packages: Database error');

      consoleSpy.mockRestore();
    });
  });

  describe('Data Type Validation', () => {
    it('should handle MachineData with vulnerabilities', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const dataWithVulns: MachineData = {
        ...sampleMachineData,
        vulnerabilities: [{ id: 'vuln-1', cve_id: 'CVE-2024-0001', severity: 'high' }],
      };

      mockCollectSystemData.mockResolvedValue(dataWithVulns);

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
      expect(result.data?.vulnerabilities).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should handle empty packages array', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const dataNoPackages: MachineData = {
        endpoint: sampleSystemInfo,
        packages: [],
        last_scan: '2024-01-15T10:00:00Z',
      };

      mockCollectSystemData.mockResolvedValue(dataNoPackages);

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
        return {};
      });

      const result = await service.collectAndStoreSystemData();

      expect(result.success).toBe(true);
      expect(result.data?.packages).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should handle different OS types', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const osTypes: SystemInfo['os_type'][] = ['Windows 10', 'Windows Server', 'Red Hat Linux', 'Ubuntu', 'CentOS', 'macOS', 'Other'];

      for (const osType of osTypes) {
        const dataWithOS: MachineData = {
          endpoint: { ...sampleSystemInfo, os_type: osType },
          packages: samplePackages,
          last_scan: new Date().toISOString(),
        };

        mockCollectSystemData.mockResolvedValue(dataWithOS);

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
      }

      consoleSpy.mockRestore();
    });

    it('should handle different environment types', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const environments: SystemInfo['environment'][] = ['production', 'staging', 'development'];

      for (const env of environments) {
        const dataWithEnv: MachineData = {
          endpoint: { ...sampleSystemInfo, environment: env },
          packages: samplePackages,
          last_scan: new Date().toISOString(),
        };

        mockCollectSystemData.mockResolvedValue(dataWithEnv);

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
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Package Type Handling', () => {
    it('should handle all package types', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const packageTypes: SystemPackage['package_type'][] = ['msi', 'rpm', 'deb', 'exe', 'dmg', 'pkg', 'brew', 'npm', 'pip'];

      const packagesWithTypes: SystemPackage[] = packageTypes.map((type, idx) => ({
        name: `package-${idx}`,
        version: '1.0.0',
        package_type: type,
      }));

      const dataWithPackageTypes: MachineData = {
        endpoint: sampleSystemInfo,
        packages: packagesWithTypes,
        last_scan: '2024-01-15T10:00:00Z',
      };

      mockCollectSystemData.mockResolvedValue(dataWithPackageTypes);

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
      expect(result.data?.packages).toHaveLength(9);

      consoleSpy.mockRestore();
    });
  });
});
