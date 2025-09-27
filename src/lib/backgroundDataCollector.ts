import { createClient } from '@supabase/supabase-js';
import { DataIngestionService } from './dataIngestionService';
import SystemDataCollector from './systemDataCollector';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CollectionSchedule {
  id: string;
  name: string;
  endpoints: string[];
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  collection_type: 'full' | 'incremental' | 'vulnerability_only';
  created_at: string;
  updated_at: string;
}

export interface CollectionJob {
  id: string;
  schedule_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  endpoints_processed: number;
  packages_collected: number;
  vulnerabilities_found: number;
  error_message?: string;
  metadata?: any;
}

export class BackgroundDataCollector {
  private dataIngestionService: DataIngestionService;
  private systemDataCollector: SystemDataCollector;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.dataIngestionService = new DataIngestionService();
    this.systemDataCollector = new SystemDataCollector();
  }

  // Start the background collection service
  async startBackgroundCollection(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Background collection already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting background data collection service');

    // Check for scheduled jobs every 5 minutes
    this.intervalId = setInterval(async () => {
      await this.processScheduledJobs();
    }, 5 * 60 * 1000);

    // Run initial check
    await this.processScheduledJobs();
  }

  // Stop the background collection service
  stopBackgroundCollection(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Background data collection service stopped');
  }

  // Process all scheduled collection jobs
  private async processScheduledJobs(): Promise<void> {
    try {
      const schedules = await this.getActiveSchedules();
      
      for (const schedule of schedules) {
        if (this.shouldRunSchedule(schedule)) {
          await this.executeCollectionJob(schedule);
        }
      }
    } catch (error) {
      console.error('❌ Error processing scheduled jobs:', error);
    }
  }

  // Get all active collection schedules
  private async getActiveSchedules(): Promise<CollectionSchedule[]> {
    const { data: schedules, error } = await supabase
      .from('collection_schedules')
      .select('*')
      .eq('enabled', true);

    if (error) {
      console.error('Error fetching schedules:', error);
      return [];
    }

    return schedules || [];
  }

  // Check if a schedule should run now
  private shouldRunSchedule(schedule: CollectionSchedule): boolean {
    if (!schedule.next_run) {
      return true; // First run
    }

    const nextRun = new Date(schedule.next_run);
    const now = new Date();
    
    return now >= nextRun;
  }

  // Execute a collection job for a schedule
  private async executeCollectionJob(schedule: CollectionSchedule): Promise<void> {
    const jobId = await this.createCollectionJob(schedule.id);
    
    try {
      console.log(`📊 Starting collection job for schedule: ${schedule.name}`);
      
      await this.updateJobStatus(jobId, 'running');
      
      let totalEndpoints = 0;
      let totalPackages = 0;
      let totalVulnerabilities = 0;

      // Collect data from each endpoint
      for (const endpoint of schedule.endpoints) {
        try {
          const result = await this.collectEndpointData(endpoint);
          totalEndpoints++;
          totalPackages += result.packages;
          totalVulnerabilities += result.vulnerabilities;
          
          console.log(`✅ Collected data from ${endpoint}: ${result.packages} packages, ${result.vulnerabilities} vulnerabilities`);
        } catch (error) {
          console.error(`❌ Failed to collect data from ${endpoint}:`, error);
        }
      }

      // Update job completion
      await this.completeCollectionJob(jobId, {
        endpoints_processed: totalEndpoints,
        packages_collected: totalPackages,
        vulnerabilities_found: totalVulnerabilities
      });

      // Update schedule next run time
      await this.updateScheduleNextRun(schedule);

      console.log(`🎉 Collection job completed: ${totalEndpoints} endpoints, ${totalPackages} packages, ${totalVulnerabilities} vulnerabilities`);

    } catch (error) {
      console.error(`❌ Collection job failed:`, error);
      await this.failCollectionJob(jobId, error.message);
    }
  }

  // Collect data from a specific endpoint
  private async collectEndpointData(endpoint: string): Promise<void> {
    try {
      console.log(`🔍 Starting data collection for endpoint: ${endpoint}`);
      
      // Use the correct method name from DataIngestionService
      const result = await this.dataIngestionService.collectAndStoreSystemData();
      
      if (result.success) {
        console.log(`✅ Successfully collected data from ${endpoint}`);
        
        // If we have endpoint data, also scan for vulnerabilities
        if (result.data?.endpoint) {
          // Get the endpoint ID from the database to run vulnerability scan
          const { data: endpointRecord } = await this.supabase
            .from('endpoints')
            .select('id')
            .eq('hostname', result.data.endpoint.hostname)
            .single();
            
          if (endpointRecord) {
            await this.dataIngestionService.scanForVulnerabilities(endpointRecord.id);
          }
        }
      } else {
        console.error(`❌ Failed to collect data from ${endpoint}: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Failed to collect data from ${endpoint}:`, error);
      throw error;
    }
  }

  // Create a new collection job
  private async createCollectionJob(scheduleId: string): Promise<string> {
    const { data, error } = await supabase
      .from('collection_jobs')
      .insert({
        schedule_id: scheduleId,
        status: 'pending',
        endpoints_processed: 0,
        packages_collected: 0,
        vulnerabilities_found: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create collection job: ${error.message}`);
    }

    return data.id;
  }

  // Update job status
  private async updateJobStatus(jobId: string, status: 'running' | 'completed' | 'failed'): Promise<void> {
    const updates: any = { status };
    
    if (status === 'running') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('collection_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job status:', error);
    }
  }

  // Complete a collection job
  private async completeCollectionJob(jobId: string, results: {
    endpoints_processed: number;
    packages_collected: number;
    vulnerabilities_found: number;
  }): Promise<void> {
    const { error } = await supabase
      .from('collection_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        ...results
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error completing job:', error);
    }
  }

  // Fail a collection job
  private async failCollectionJob(jobId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('collection_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage
      })
      .eq('id', jobId);

    if (error) {
      console.error('Error failing job:', error);
    }
  }

  // Update schedule next run time
  private async updateScheduleNextRun(schedule: CollectionSchedule): Promise<void> {
    const nextRun = this.calculateNextRun(schedule.frequency);
    
    const { error } = await supabase
      .from('collection_schedules')
      .update({
        last_run: new Date().toISOString(),
        next_run: nextRun.toISOString()
      })
      .eq('id', schedule.id);

    if (error) {
      console.error('Error updating schedule:', error);
    }
  }

  // Calculate next run time based on frequency
  private calculateNextRun(frequency: string): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // Public API methods for managing schedules
  async createSchedule(schedule: Omit<CollectionSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('collection_schedules')
      .insert({
        ...schedule,
        next_run: this.calculateNextRun(schedule.frequency).toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create schedule: ${error.message}`);
    }

    console.log(`📅 Created collection schedule: ${schedule.name}`);
    return data.id;
  }

  async getSchedules(): Promise<CollectionSchedule[]> {
    const { data, error } = await supabase
      .from('collection_schedules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch schedules: ${error.message}`);
    }

    return data || [];
  }

  async getCollectionJobs(scheduleId?: string): Promise<CollectionJob[]> {
    let query = supabase
      .from('collection_jobs')
      .select('*')
      .order('started_at', { ascending: false });

    if (scheduleId) {
      query = query.eq('schedule_id', scheduleId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch collection jobs: ${error.message}`);
    }

    return data || [];
  }

  async enableSchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('collection_schedules')
      .update({ enabled: true })
      .eq('id', scheduleId);

    if (error) {
      throw new Error(`Failed to enable schedule: ${error.message}`);
    }
  }

  async disableSchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('collection_schedules')
      .update({ enabled: false })
      .eq('id', scheduleId);

    if (error) {
      throw new Error(`Failed to disable schedule: ${error.message}`);
    }
  }
}