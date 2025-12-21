import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase functions
interface MockFns {
  from: ReturnType<typeof vi.fn>;
}

// Mock DataIngestionService
vi.mock('./dataIngestionService', () => {
  return {
    DataIngestionService: class {
      collectAndStoreSystemData = vi.fn();
      scanForVulnerabilities = vi.fn();
    },
  };
});

// Mock SystemDataCollector
vi.mock('./systemDataCollector', () => {
  return {
    default: class {},
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  const from = vi.fn();

  // Store refs for test access
  (global as any).__supabaseMocks = {
    from,
  };

  return {
    createClient: () => ({
      from,
    }),
  };
});

// Import after mocking
import { BackgroundDataCollector, CollectionSchedule, CollectionJob } from './backgroundDataCollector';

// Helper to get mocks
const getMocks = () => (global as any).__supabaseMocks as MockFns;

describe('BackgroundDataCollector', () => {
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

  describe('CollectionSchedule interface', () => {
    it('should have correct structure for CollectionSchedule', () => {
      const schedule: CollectionSchedule = {
        id: 'schedule-123',
        name: 'Daily Scan',
        endpoints: ['server-1', 'server-2'],
        frequency: 'daily',
        enabled: true,
        last_run: '2024-01-15T10:00:00Z',
        next_run: '2024-01-16T10:00:00Z',
        collection_type: 'full',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      expect(schedule.id).toBe('schedule-123');
      expect(schedule.name).toBe('Daily Scan');
      expect(schedule.endpoints).toHaveLength(2);
      expect(schedule.frequency).toBe('daily');
      expect(schedule.enabled).toBe(true);
      expect(schedule.collection_type).toBe('full');
    });

    it('should support all frequency types', () => {
      const frequencies: CollectionSchedule['frequency'][] = ['hourly', 'daily', 'weekly', 'monthly'];
      frequencies.forEach(freq => {
        const schedule: CollectionSchedule = {
          id: 'test',
          name: 'Test',
          endpoints: [],
          frequency: freq,
          enabled: true,
          collection_type: 'full',
          created_at: '',
          updated_at: '',
        };
        expect(schedule.frequency).toBe(freq);
      });
    });

    it('should support all collection types', () => {
      const types: CollectionSchedule['collection_type'][] = ['full', 'incremental', 'vulnerability_only'];
      types.forEach(type => {
        const schedule: CollectionSchedule = {
          id: 'test',
          name: 'Test',
          endpoints: [],
          frequency: 'daily',
          enabled: true,
          collection_type: type,
          created_at: '',
          updated_at: '',
        };
        expect(schedule.collection_type).toBe(type);
      });
    });
  });

  describe('CollectionJob interface', () => {
    it('should have correct structure for CollectionJob', () => {
      const job: CollectionJob = {
        id: 'job-123',
        schedule_id: 'schedule-456',
        status: 'completed',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:30:00Z',
        endpoints_processed: 5,
        packages_collected: 150,
        vulnerabilities_found: 12,
        metadata: { version: '1.0' },
      };

      expect(job.id).toBe('job-123');
      expect(job.schedule_id).toBe('schedule-456');
      expect(job.status).toBe('completed');
      expect(job.endpoints_processed).toBe(5);
      expect(job.packages_collected).toBe(150);
      expect(job.vulnerabilities_found).toBe(12);
    });

    it('should support all status types', () => {
      const statuses: CollectionJob['status'][] = ['pending', 'running', 'completed', 'failed'];
      statuses.forEach(status => {
        const job: CollectionJob = {
          id: 'test',
          schedule_id: 'test',
          status,
          endpoints_processed: 0,
          packages_collected: 0,
          vulnerabilities_found: 0,
        };
        expect(job.status).toBe(status);
      });
    });

    it('should support error_message for failed jobs', () => {
      const job: CollectionJob = {
        id: 'job-failed',
        schedule_id: 'schedule-1',
        status: 'failed',
        endpoints_processed: 1,
        packages_collected: 0,
        vulnerabilities_found: 0,
        error_message: 'Connection timeout',
      };

      expect(job.status).toBe('failed');
      expect(job.error_message).toBe('Connection timeout');
    });
  });

  describe('startBackgroundCollection', () => {
    it('should start the background collection service', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock empty schedules
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      });

      await collector.startBackgroundCollection();

      expect(consoleSpy).toHaveBeenCalledWith('🚀 Starting background data collection service');

      consoleSpy.mockRestore();
    });

    it('should not start if already running', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock empty schedules
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

  describe('stopBackgroundCollection', () => {
    it('should stop the background collection service', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock empty schedules
      mocks.from.mockReturnValue({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      });

      await collector.startBackgroundCollection();
      collector.stopBackgroundCollection();

      expect(consoleSpy).toHaveBeenCalledWith('⏹️ Background data collection service stopped');

      consoleSpy.mockRestore();
    });
  });

  describe('createSchedule', () => {
    it('should create a new schedule successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const newSchedule = {
        name: 'Hourly Scan',
        endpoints: ['endpoint-1'],
        frequency: 'hourly' as const,
        enabled: true,
        collection_type: 'full' as const,
      };

      mocks.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: { id: 'new-schedule-id', ...newSchedule },
              error: null,
            }),
          }),
        }),
      });

      const scheduleId = await collector.createSchedule(newSchedule);

      expect(scheduleId).toBe('new-schedule-id');
      expect(consoleSpy).toHaveBeenCalledWith('📅 Created collection schedule: Hourly Scan');

      consoleSpy.mockRestore();
    });

    it('should throw error when schedule creation fails', async () => {
      const newSchedule = {
        name: 'Test Schedule',
        endpoints: [],
        frequency: 'daily' as const,
        enabled: true,
        collection_type: 'full' as const,
      };

      mocks.from.mockReturnValue({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      await expect(collector.createSchedule(newSchedule)).rejects.toThrow('Failed to create schedule: Database error');
    });
  });

  describe('getSchedules', () => {
    it('should return all schedules', async () => {
      const mockSchedules: CollectionSchedule[] = [
        {
          id: 'schedule-1',
          name: 'Daily Full Scan',
          endpoints: ['server-1'],
          frequency: 'daily',
          enabled: true,
          collection_type: 'full',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'schedule-2',
          name: 'Weekly Vulnerability Scan',
          endpoints: ['server-2'],
          frequency: 'weekly',
          enabled: false,
          collection_type: 'vulnerability_only',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: mockSchedules, error: null }),
        }),
      });

      const schedules = await collector.getSchedules();

      expect(schedules).toHaveLength(2);
      expect(schedules[0].name).toBe('Daily Full Scan');
      expect(schedules[1].name).toBe('Weekly Vulnerability Scan');
    });

    it('should return empty array when no schedules exist', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: null }),
        }),
      });

      const schedules = await collector.getSchedules();

      expect(schedules).toEqual([]);
    });

    it('should throw error when fetch fails', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: { message: 'Network error' } }),
        }),
      });

      await expect(collector.getSchedules()).rejects.toThrow('Failed to fetch schedules: Network error');
    });
  });

  describe('getCollectionJobs', () => {
    it('should return all collection jobs', async () => {
      const mockJobs: CollectionJob[] = [
        {
          id: 'job-1',
          schedule_id: 'schedule-1',
          status: 'completed',
          endpoints_processed: 5,
          packages_collected: 100,
          vulnerabilities_found: 10,
        },
        {
          id: 'job-2',
          schedule_id: 'schedule-1',
          status: 'running',
          endpoints_processed: 2,
          packages_collected: 50,
          vulnerabilities_found: 5,
        },
      ];

      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: mockJobs, error: null }),
        }),
      });

      const jobs = await collector.getCollectionJobs();

      expect(jobs).toHaveLength(2);
      expect(jobs[0].status).toBe('completed');
      expect(jobs[1].status).toBe('running');
    });

    it('should filter jobs by schedule ID', async () => {
      const mockJobs: CollectionJob[] = [
        {
          id: 'job-1',
          schedule_id: 'schedule-1',
          status: 'completed',
          endpoints_processed: 5,
          packages_collected: 100,
          vulnerabilities_found: 10,
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

      expect(jobs).toHaveLength(1);
      expect(jobs[0].schedule_id).toBe('schedule-1');
    });

    it('should throw error when fetch fails', async () => {
      mocks.from.mockReturnValue({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: { message: 'Database unavailable' } }),
        }),
      });

      await expect(collector.getCollectionJobs()).rejects.toThrow('Failed to fetch collection jobs: Database unavailable');
    });
  });

  describe('enableSchedule', () => {
    it('should enable a schedule successfully', async () => {
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      await expect(collector.enableSchedule('schedule-1')).resolves.not.toThrow();
    });

    it('should throw error when enable fails', async () => {
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: { message: 'Update failed' } }),
        }),
      });

      await expect(collector.enableSchedule('schedule-1')).rejects.toThrow('Failed to enable schedule: Update failed');
    });
  });

  describe('disableSchedule', () => {
    it('should disable a schedule successfully', async () => {
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      });

      await expect(collector.disableSchedule('schedule-1')).resolves.not.toThrow();
    });

    it('should throw error when disable fails', async () => {
      mocks.from.mockReturnValue({
        update: () => ({
          eq: () => Promise.resolve({ error: { message: 'Update failed' } }),
        }),
      });

      await expect(collector.disableSchedule('schedule-1')).rejects.toThrow('Failed to disable schedule: Update failed');
    });
  });

  describe('calculateNextRun', () => {
    it('should calculate next run for hourly frequency', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const newSchedule = {
        name: 'Hourly Test',
        endpoints: [],
        frequency: 'hourly' as const,
        enabled: true,
        collection_type: 'full' as const,
      };

      let capturedNextRun: string | undefined;

      mocks.from.mockReturnValue({
        insert: (data: any) => {
          capturedNextRun = data.next_run;
          return {
            select: () => ({
              single: () => Promise.resolve({
                data: { id: 'new-id', ...data },
                error: null,
              }),
            }),
          };
        },
      });

      await collector.createSchedule(newSchedule);

      expect(capturedNextRun).toBeDefined();
      const nextRunDate = new Date(capturedNextRun!);
      const expectedDate = new Date('2024-01-15T11:00:00Z');
      expect(nextRunDate.getTime()).toBe(expectedDate.getTime());
    });

    it('should calculate next run for daily frequency', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const newSchedule = {
        name: 'Daily Test',
        endpoints: [],
        frequency: 'daily' as const,
        enabled: true,
        collection_type: 'full' as const,
      };

      let capturedNextRun: string | undefined;

      mocks.from.mockReturnValue({
        insert: (data: any) => {
          capturedNextRun = data.next_run;
          return {
            select: () => ({
              single: () => Promise.resolve({
                data: { id: 'new-id', ...data },
                error: null,
              }),
            }),
          };
        },
      });

      await collector.createSchedule(newSchedule);

      expect(capturedNextRun).toBeDefined();
      const nextRunDate = new Date(capturedNextRun!);
      const expectedDate = new Date('2024-01-16T10:00:00Z');
      expect(nextRunDate.getTime()).toBe(expectedDate.getTime());
    });

    it('should calculate next run for weekly frequency', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const newSchedule = {
        name: 'Weekly Test',
        endpoints: [],
        frequency: 'weekly' as const,
        enabled: true,
        collection_type: 'full' as const,
      };

      let capturedNextRun: string | undefined;

      mocks.from.mockReturnValue({
        insert: (data: any) => {
          capturedNextRun = data.next_run;
          return {
            select: () => ({
              single: () => Promise.resolve({
                data: { id: 'new-id', ...data },
                error: null,
              }),
            }),
          };
        },
      });

      await collector.createSchedule(newSchedule);

      expect(capturedNextRun).toBeDefined();
      const nextRunDate = new Date(capturedNextRun!);
      const expectedDate = new Date('2024-01-22T10:00:00Z');
      expect(nextRunDate.getTime()).toBe(expectedDate.getTime());
    });

    it('should calculate next run for monthly frequency', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const newSchedule = {
        name: 'Monthly Test',
        endpoints: [],
        frequency: 'monthly' as const,
        enabled: true,
        collection_type: 'full' as const,
      };

      let capturedNextRun: string | undefined;

      mocks.from.mockReturnValue({
        insert: (data: any) => {
          capturedNextRun = data.next_run;
          return {
            select: () => ({
              single: () => Promise.resolve({
                data: { id: 'new-id', ...data },
                error: null,
              }),
            }),
          };
        },
      });

      await collector.createSchedule(newSchedule);

      expect(capturedNextRun).toBeDefined();
      const nextRunDate = new Date(capturedNextRun!);
      const expectedDate = new Date('2024-02-15T10:00:00Z');
      expect(nextRunDate.getTime()).toBe(expectedDate.getTime());
    });
  });
});
