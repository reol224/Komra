import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface SearchFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  severity?: string[];
  status?: string[];
  endpoints?: string[];
  categories?: string[];
  tags?: string[];
  textSearch?: string;
}

export interface AuditTrailEntry {
  id: string;
  event_type: string;
  event_category: string;
  user_id?: string;
  endpoint_id?: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  description: string;
  metadata: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  timestamp: string;
  severity: string;
}

export interface InvestigationLog {
  id: string;
  investigation_id: string;
  investigator_id?: string;
  case_number?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  tags: string[];
  evidence: any;
  findings?: string;
  related_endpoints: string[];
  related_vulnerabilities: string[];
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface ComplianceReport {
  id: string;
  report_type: string;
  framework: string;
  title: string;
  description?: string;
  scope: any;
  findings: any;
  recommendations: any;
  status: string;
  generated_by?: string;
  reviewed_by?: string;
  approved_by?: string;
  report_period_start?: string;
  report_period_end?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export class SearchableDataService {
  
  // Search audit trail with advanced filters
  async searchAuditTrail(filters: SearchFilters = {}, limit: number = 100, offset: number = 0): Promise<{
    data: AuditTrailEntry[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('audit_trail')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.dateRange) {
        query = query
          .gte('timestamp', filters.dateRange.start)
          .lte('timestamp', filters.dateRange.end);
      }

      if (filters.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('event_category', filters.categories);
      }

      if (filters.endpoints && filters.endpoints.length > 0) {
        query = query.in('endpoint_id', filters.endpoints);
      }

      if (filters.textSearch) {
        query = query.textSearch('description', filters.textSearch);
      }

      const { data, error, count } = await query
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to search audit trail: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error searching audit trail:', error);
      return { data: [], total: 0 };
    }
  }

  // Search investigation logs
  async searchInvestigations(filters: SearchFilters = {}, limit: number = 50, offset: number = 0): Promise<{
    data: InvestigationLog[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('investigation_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.severity && filters.severity.length > 0) {
        query = query.in('priority', filters.severity); // Using severity filter for priority
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.textSearch) {
        query = query.textSearch('title,description,findings', filters.textSearch);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to search investigations: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error searching investigations:', error);
      return { data: [], total: 0 };
    }
  }

  // Search compliance reports
  async searchComplianceReports(filters: SearchFilters = {}, limit: number = 50, offset: number = 0): Promise<{
    data: ComplianceReport[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('compliance_reports')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('framework', filters.categories); // Using categories for framework
      }

      if (filters.textSearch) {
        query = query.textSearch('title,description', filters.textSearch);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to search compliance reports: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error searching compliance reports:', error);
      return { data: [], total: 0 };
    }
  }

  // Advanced search across all data types
  async globalSearch(searchTerm: string, dataTypes: string[] = ['audit', 'investigations', 'compliance'], limit: number = 20): Promise<{
    audit: AuditTrailEntry[];
    investigations: InvestigationLog[];
    compliance: ComplianceReport[];
  }> {
    const results = {
      audit: [] as AuditTrailEntry[],
      investigations: [] as InvestigationLog[],
      compliance: [] as ComplianceReport[]
    };

    const promises = [];

    if (dataTypes.includes('audit')) {
      promises.push(
        this.searchAuditTrail({ textSearch: searchTerm }, limit).then(result => {
          results.audit = result.data;
        })
      );
    }

    if (dataTypes.includes('investigations')) {
      promises.push(
        this.searchInvestigations({ textSearch: searchTerm }, limit).then(result => {
          results.investigations = result.data;
        })
      );
    }

    if (dataTypes.includes('compliance')) {
      promises.push(
        this.searchComplianceReports({ textSearch: searchTerm }, limit).then(result => {
          results.compliance = result.data;
        })
      );
    }

    await Promise.all(promises);
    return results;
  }

  // Create audit trail entry
  async createAuditEntry(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): Promise<string> {
    const { data, error } = await supabase
      .from('audit_trail')
      .insert(entry)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create audit entry: ${error.message}`);
    }

    return data.id;
  }

  // Create investigation log
  async createInvestigation(investigation: Omit<InvestigationLog, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('investigation_logs')
      .insert(investigation)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create investigation: ${error.message}`);
    }

    return data.id;
  }

  // Update investigation
  async updateInvestigation(id: string, updates: Partial<InvestigationLog>): Promise<void> {
    const { error } = await supabase
      .from('investigation_logs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update investigation: ${error.message}`);
    }
  }

  // Create compliance report
  async createComplianceReport(report: Omit<ComplianceReport, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('compliance_reports')
      .insert(report)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create compliance report: ${error.message}`);
    }

    return data.id;
  }

  // Get aggregated statistics for dashboards
  async getSearchStatistics(): Promise<{
    auditEntries: number;
    investigations: number;
    complianceReports: number;
    criticalEvents: number;
    openInvestigations: number;
    publishedReports: number;
  }> {
    try {
      const [auditCount, investigationCount, complianceCount, criticalCount, openCount, publishedCount] = await Promise.all([
        supabase.from('audit_trail').select('*', { count: 'exact', head: true }),
        supabase.from('investigation_logs').select('*', { count: 'exact', head: true }),
        supabase.from('compliance_reports').select('*', { count: 'exact', head: true }),
        supabase.from('audit_trail').select('*', { count: 'exact', head: true }).eq('severity', 'critical'),
        supabase.from('investigation_logs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('compliance_reports').select('*', { count: 'exact', head: true }).eq('status', 'published')
      ]);

      return {
        auditEntries: auditCount.count || 0,
        investigations: investigationCount.count || 0,
        complianceReports: complianceCount.count || 0,
        criticalEvents: criticalCount.count || 0,
        openInvestigations: openCount.count || 0,
        publishedReports: publishedCount.count || 0
      };
    } catch (error) {
      console.error('Error getting search statistics:', error);
      return {
        auditEntries: 0,
        investigations: 0,
        complianceReports: 0,
        criticalEvents: 0,
        openInvestigations: 0,
        publishedReports: 0
      };
    }
  }

  // Export data for compliance reporting
  async exportData(dataType: 'audit' | 'investigations' | 'compliance', filters: SearchFilters = {}): Promise<any[]> {
    try {
      let data: any[] = [];

      switch (dataType) {
        case 'audit':
          const auditResult = await this.searchAuditTrail(filters, 10000, 0);
          data = auditResult.data;
          break;
        case 'investigations':
          const investigationResult = await this.searchInvestigations(filters, 10000, 0);
          data = investigationResult.data;
          break;
        case 'compliance':
          const complianceResult = await this.searchComplianceReports(filters, 10000, 0);
          data = complianceResult.data;
          break;
      }

      return data;
    } catch (error) {
      console.error(`Error exporting ${dataType} data:`, error);
      return [];
    }
  }

  // Get related data for investigations
  async getRelatedData(endpointIds: string[], vulnerabilityIds: string[]): Promise<{
    endpoints: any[];
    vulnerabilities: any[];
    packages: any[];
  }> {
    try {
      const [endpoints, vulnerabilities, packages] = await Promise.all([
        endpointIds.length > 0 ? supabase.from('endpoints').select('*').in('id', endpointIds) : { data: [] },
        vulnerabilityIds.length > 0 ? supabase.from('vulnerabilities').select('*').in('id', vulnerabilityIds) : { data: [] },
        endpointIds.length > 0 ? supabase.from('packages').select('*, endpoint_packages!inner(endpoint_id)').in('endpoint_packages.endpoint_id', endpointIds) : { data: [] }
      ]);

      return {
        endpoints: endpoints.data || [],
        vulnerabilities: vulnerabilities.data || [],
        packages: packages.data || []
      };
    } catch (error) {
      console.error('Error getting related data:', error);
      return {
        endpoints: [],
        vulnerabilities: [],
        packages: []
      };
    }
  }
}