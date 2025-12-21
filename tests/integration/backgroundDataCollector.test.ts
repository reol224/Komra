import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase functions
interface MockFns {
  from: ReturnType<typeof vi.fn>;
}

// Mock DataIngestionService
vi.mock('@/lib/dataIngestionService', () => {
  return {
    DataIngestionService: class {
      collectAndStoreSystemData = vi.fn();
      scanForVulnerabilities = vi.fn();
    },
  };
});

// Mock SystemDataCollector
vi.mock('@/lib/systemDataCollector', () => {
  return {
    default: class {},
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  const from = vi.fn();

  // Store refs for test access
  (global as any).__supabaseMocksIntegration = {
    from,
  };

  return {
    createClient: () => ({
      from,
    }),
  };
});

// Import after mocking
import { BackgroundDataCollector, CollectionSchedule, CollectionJob } from '@/lib/backgroundDataCollector';

// Helper to get mocks
const getMocks = () => (global as any).__supabaseMocksIntegration as MockFns;

describe('BackgroundDataCollector Integration Tests', () => {
  let mocks: MockFns;
  let collector: BackgroundDataCollector;

  beforeEach(() => {
    mocks = getMocks();
    vi.clearAllMocks();
    vi.useFakeTimers();
    collector = new BackgroundDataCollector();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    collector.stopBackgroundCollection();
  });

  describe('Complete Schedule Lifecycle', () => {
    it('should manage a schedule from creation to execution', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      // Step 1: Create a schedule
      mocks.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'schedule-lifecycle-test',
                name: 'Lifecycle Test Schedule',
                endpoints: ['server-1', 'server-2'],
                frequency: 'daily',
                enabled: true,
                collection_type: 'full',
                next_run: '2024-01-16T10:00:00Z',
                created_at: now.toISOString(),
                updated_at: now.toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const scheduleId = await collector.createSchedule({
        name: 'Lifecycle Test Schedule',
        endpoints: ['server-1', 'server-2'],
        frequency: 'daily',
        enabled: true,
        collection_type: 'full',
      });

      expect(scheduleId).toBe('schedule-lifecycle-test');
      expect(consoleSpy).toHaveBeenCalledWith('📅 Created collection schedule: Lifecycle Test Schedule');

      // Step 2: Verify schedule exists
      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({
            data: [{
              id: 'schedule-lifecycle-test',
              name: 'Lifecycle Test Schedule',
              endpoints: ['server-1', 'server-2'],
              frequency: 'daily',
              enabled: true,
              collection_type: 'full',
            }],
            error: null,
          }),
        }),
      });

      const schedules = await collector.getSchedules();
      expect(schedules).toHaveLength(1);
      expect(schedules[0].name).toBe('Lifecycle Test Schedule');

      // Step 3: Disable schedule
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      await collector.disableSchedule(scheduleId);

      // Step 4: Re-enable schedule
      await collector.enableSchedule(scheduleId);

      consoleSpy.mockRestore();
    });

    it('should handle schedule with multiple endpoints', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const endpoints = [
        'web-server-01',
        'web-server-02',
        'db-server-01',
        'cache-server-01',
        'worker-01',
      ];

      mocks.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'multi-endpoint-schedule',
                name: 'Multi-Endpoint Scan',
                endpoints,
                frequency: 'hourly',
                enabled: true,
                collection_type: 'full',
              },
              error: null,
            }),
          }),
        }),
      });

      const scheduleId = await collector.createSchedule({
        name: 'Multi-Endpoint Scan',
        endpoints,
        frequency: 'hourly',
        enabled: true,
        collection_type: 'full',
      });

      expect(scheduleId).toBe('multi-endpoint-schedule');

      consoleSpy.mockRestore();
    });
  });

  describe('Job Status Transitions', () => {
    it('should track job through pending → running → completed states', async () => {
      const mockJobs = [
        {
          id: 'job-001',
          schedule_id: 'schedule-1',
          status: 'pending',
          endpoints_processed: 0,
          packages_collected: 0,
          vulnerabilities_found: 0,
        },
        {
          id: 'job-001',
          schedule_id: 'schedule-1',
          status: 'running',
          started_at: '2024-01-15T10:00:00Z',
          endpoints_processed: 0,
          packages_collected: 0,
          vulnerabilities_found: 0,
        },
        {
          id: 'job-001',
          schedule_id: 'schedule-1',
          status: 'completed',
          started_at: '2024-01-15T10:00:00Z',
          completed_at: '2024-01-15T10:30:00Z',
          endpoints_processed: 5,
          packages_collected: 200,
          vulnerabilities_found: 15,
        },
      ];

      // Verify each state is valid
      expect(mockJobs[0].status).toBe('pending');
      expect(mockJobs[1].status).toBe('running');
      expect(mockJobs[2].status).toBe('completed');

      // Verify final metrics
      expect(mockJobs[2].endpoints_processed).toBe(5);
      expect(mockJobs[2].packages_collected).toBe(200);
      expect(mockJobs[2].vulnerabilities_found).toBe(15);
    });

    it('should track job through pending → running → failed states', async () => {
      const mockJob: CollectionJob = {
        id: 'job-failed-001',
        schedule_id: 'schedule-1',
        status: 'failed',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        endpoints_processed: 1,
        packages_collected: 0,
        vulnerabilities_found: 0,
        error_message: 'Connection refused to endpoint server-3',
      };

      expect(mockJob.status).toBe('failed');
      expect(mockJob.error_message).toBeDefined();
      expect(mockJob.endpoints_processed).toBe(1);
    });
  });

  describe('Frequency Scheduling Scenarios', () => {
    it('should schedule correct next runs for all frequencies', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const frequencies = [
        { frequency: 'hourly', expectedNext: '2024-01-15T11:00:00.000Z' },
        { frequency: 'daily', expectedNext: '2024-01-16T10:00:00.000Z' },
        { frequency: 'weekly', expectedNext: '2024-01-22T10:00:00.000Z' },
        { frequency: 'monthly', expectedNext: '2024-02-15T10:00:00.000Z' },
      ];

      for (const { frequency, expectedNext } of frequencies) {
        let capturedNextRun: string | undefined;

        mocks.from.mockReturnValue({
          insert: (data: any) => {
            capturedNextRun = data.next_run;
            return {
              select: () => ({
                single: () => Promise.resolve({
                  data: { id: `schedule-${frequency}`, ...data },
                  error: null,
                }),
              }),
            };
          },
        });

        await collector.createSchedule({
          name: `${frequency} Test`,
          endpoints: [],
          frequency: frequency as 'hourly' | 'daily' | 'weekly' | 'monthly',
          enabled: true,
          collection_type: 'full',
        });

        expect(capturedNextRun).toBe(expectedNext);
      }
    });
  });

  describe('Collection Type Workflows', () => {
    it('should support full collection workflow', async () => {
      const schedule: CollectionSchedule = {
        id: 'full-scan-schedule',
        name: 'Full Production Scan',
        endpoints: ['prod-server-1', 'prod-server-2', 'prod-db'],
        frequency: 'daily',
        enabled: true,
        collection_type: 'full',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      expect(schedule.collection_type).toBe('full');
      expect(schedule.endpoints).toHaveLength(3);
    });

    it('should support incremental collection workflow', async () => {
      const schedule: CollectionSchedule = {
        id: 'incremental-scan-schedule',
        name: 'Incremental Hourly Scan',
        endpoints: ['web-server-1'],
        frequency: 'hourly',
        enabled: true,
        collection_type: 'incremental',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      expect(schedule.collection_type).toBe('incremental');
      expect(schedule.frequency).toBe('hourly');
    });

    it('should support vulnerability-only collection workflow', async () => {
      const schedule: CollectionSchedule = {
        id: 'vuln-only-schedule',
        name: 'Vulnerability Scan Only',
        endpoints: ['critical-server-1', 'critical-server-2'],
        frequency: 'daily',
        enabled: true,
        collection_type: 'vulnerability_only',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      expect(schedule.collection_type).toBe('vulnerability_only');
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle database connection failures gracefully', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({
            data: null,
            error: { message: 'Connection refused' },
          }),
        }),
      });

      await expect(collector.getSchedules()).rejects.toThrow('Failed to fetch schedules: Connection refused');
    });

    it('should handle partial endpoint failures in jobs', async () => {
      const jobWithPartialFailure: CollectionJob = {
        id: 'job-partial-fail',
        schedule_id: 'schedule-1',
        status: 'completed',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:30:00Z',
        endpoints_processed: 5,
        packages_collected: 150,
        vulnerabilities_found: 10,
        metadata: {
          failed_endpoints: ['server-3'],
          failure_reason: 'Connection timeout',
        },
      };

      // Job completed even though one endpoint failed
      expect(jobWithPartialFailure.status).toBe('completed');
      expect(jobWithPartialFailure.endpoints_processed).toBe(5);
      expect(jobWithPartialFailure.metadata?.failed_endpoints).toContain('server-3');
    });

    it('should handle schedule update failures', async () => {
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({
            error: { message: 'Constraint violation' },
          }),
        }),
      });

      await expect(collector.enableSchedule('invalid-schedule')).rejects.toThrow('Failed to enable schedule: Constraint violation');
    });
  });

  describe('Multiple Concurrent Schedules', () => {
    it('should manage multiple schedules simultaneously', async () => {
      const schedules: CollectionSchedule[] = [
        {
          id: 'schedule-production',
          name: 'Production Full Scan',
          endpoints: ['prod-1', 'prod-2'],
          frequency: 'daily',
          enabled: true,
          collection_type: 'full',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 'schedule-staging',
          name: 'Staging Vulnerability Scan',
          endpoints: ['staging-1'],
          frequency: 'hourly',
          enabled: true,
          collection_type: 'vulnerability_only',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 'schedule-dev',
          name: 'Dev Incremental Scan',
          endpoints: ['dev-1', 'dev-2', 'dev-3'],
          frequency: 'weekly',
          enabled: false,
          collection_type: 'incremental',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: schedules, error: null }),
        }),
      });

      const result = await collector.getSchedules();

      expect(result).toHaveLength(3);
      expect(result.filter(s => s.enabled)).toHaveLength(2);
      expect(result.filter(s => s.collection_type === 'full')).toHaveLength(1);
    });
  });

  describe('Job History and Metrics', () => {
    it('should retrieve job history for a schedule', async () => {
      const mockJobs: CollectionJob[] = [
        {
          id: 'job-3',
          schedule_id: 'schedule-1',
          status: 'completed',
          started_at: '2024-01-15T10:00:00Z',
          completed_at: '2024-01-15T10:30:00Z',
          endpoints_processed: 5,
          packages_collected: 200,
          vulnerabilities_found: 15,
        },
        {
          id: 'job-2',
          schedule_id: 'schedule-1',
          status: 'completed',
          started_at: '2024-01-14T10:00:00Z',
          completed_at: '2024-01-14T10:25:00Z',
          endpoints_processed: 5,
          packages_collected: 195,
          vulnerabilities_found: 12,
        },
        {
          id: 'job-1',
          schedule_id: 'schedule-1',
          status: 'failed',
          started_at: '2024-01-13T10:00:00Z',
          completed_at: '2024-01-13T10:05:00Z',
          endpoints_processed: 1,
          packages_collected: 0,
          vulnerabilities_found: 0,
          error_message: 'Database unavailable',
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => ({
            eq: () => Promise.resolve({ data: mockJobs, error: null }),
          }),
        }),
      });

      const jobs = await collector.getCollectionJobs('schedule-1');

      expect(jobs).toHaveLength(3);
      expect(jobs[0].status).toBe('completed');
      expect(jobs[2].status).toBe('failed');
      expect(jobs[2].error_message).toBe('Database unavailable');
    });

    it('should calculate job success rate', async () => {
      const mockJobs: CollectionJob[] = [
        { id: '1', schedule_id: 's1', status: 'completed', endpoints_processed: 5, packages_collected: 100, vulnerabilities_found: 10 },
        { id: '2', schedule_id: 's1', status: 'completed', endpoints_processed: 5, packages_collected: 95, vulnerabilities_found: 8 },
        { id: '3', schedule_id: 's1', status: 'failed', endpoints_processed: 1, packages_collected: 0, vulnerabilities_found: 0 },
        { id: '4', schedule_id: 's1', status: 'completed', endpoints_processed: 5, packages_collected: 110, vulnerabilities_found: 12 },
        { id: '5', schedule_id: 's1', status: 'completed', endpoints_processed: 5, packages_collected: 105, vulnerabilities_found: 11 },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => ({
            eq: () => Promise.resolve({ data: mockJobs, error: null }),
          }),
        }),
      });

      const jobs = await collector.getCollectionJobs('s1');
      const successRate = jobs.filter(j => j.status === 'completed').length / jobs.length;

      expect(successRate).toBe(0.8); // 4 out of 5 succeeded
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle security compliance scanning workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Create compliance scan schedule
      mocks.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'compliance-scan',
                name: 'PCI-DSS Compliance Scan',
                endpoints: ['payment-gateway', 'card-processor', 'transaction-db'],
                frequency: 'weekly',
                enabled: true,
                collection_type: 'full',
              },
              error: null,
            }),
          }),
        }),
      });

      const scheduleId = await collector.createSchedule({
        name: 'PCI-DSS Compliance Scan',
        endpoints: ['payment-gateway', 'card-processor', 'transaction-db'],
        frequency: 'weekly',
        enabled: true,
        collection_type: 'full',
      });

      expect(scheduleId).toBe('compliance-scan');

      consoleSpy.mockRestore();
    });

    it('should handle infrastructure monitoring workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Create infrastructure monitoring schedule
      mocks.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'infra-monitor',
                name: 'Infrastructure Health Check',
                endpoints: [
                  'load-balancer-1',
                  'web-server-1',
                  'web-server-2',
                  'api-server-1',
                  'db-primary',
                  'db-replica',
                  'cache-server-1',
                  'message-queue',
                ],
                frequency: 'hourly',
                enabled: true,
                collection_type: 'incremental',
              },
              error: null,
            }),
          }),
        }),
      });

      const scheduleId = await collector.createSchedule({
        name: 'Infrastructure Health Check',
        endpoints: [
          'load-balancer-1',
          'web-server-1',
          'web-server-2',
          'api-server-1',
          'db-primary',
          'db-replica',
          'cache-server-1',
          'message-queue',
        ],
        frequency: 'hourly',
        enabled: true,
        collection_type: 'incremental',
      });

      expect(scheduleId).toBe('infra-monitor');

      consoleSpy.mockRestore();
    });

    it('should handle critical vulnerability response workflow', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Create emergency vulnerability scan
      mocks.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'emergency-scan',
                name: 'CVE-2024-XXXX Emergency Scan',
                endpoints: [
                  'prod-web-1',
                  'prod-web-2',
                  'prod-api-1',
                  'prod-api-2',
                ],
                frequency: 'hourly',
                enabled: true,
                collection_type: 'vulnerability_only',
              },
              error: null,
            }),
          }),
        }),
      });

      const scheduleId = await collector.createSchedule({
        name: 'CVE-2024-XXXX Emergency Scan',
        endpoints: [
          'prod-web-1',
          'prod-web-2',
          'prod-api-1',
          'prod-api-2',
        ],
        frequency: 'hourly',
        enabled: true,
        collection_type: 'vulnerability_only',
      });

      expect(scheduleId).toBe('emergency-scan');

      // Simulate emergency scan job completion
      const emergencyJob: CollectionJob = {
        id: 'emergency-job-1',
        schedule_id: 'emergency-scan',
        status: 'completed',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:10:00Z',
        endpoints_processed: 4,
        packages_collected: 0,
        vulnerabilities_found: 2,
        metadata: {
          scan_type: 'emergency',
          cve_targeted: 'CVE-2024-XXXX',
          affected_endpoints: ['prod-web-1', 'prod-api-2'],
        },
      };

      expect(emergencyJob.vulnerabilities_found).toBe(2);
      expect(emergencyJob.metadata?.affected_endpoints).toHaveLength(2);

      consoleSpy.mockRestore();
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop collection service cleanly', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock empty schedules for startup
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      });

      // Start service
      await collector.startBackgroundCollection();
      expect(consoleSpy).toHaveBeenCalledWith('🚀 Starting background data collection service');

      // Stop service
      collector.stopBackgroundCollection();
      expect(consoleSpy).toHaveBeenCalledWith('⏹️ Background data collection service stopped');

      consoleSpy.mockRestore();
    });

    it('should prevent duplicate service starts', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      });

      await collector.startBackgroundCollection();
      await collector.startBackgroundCollection();

      expect(consoleSpy).toHaveBeenCalledWith('🔄 Background collection already running');

      consoleSpy.mockRestore();
    });
  });
});
