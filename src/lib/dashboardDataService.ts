import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface DashboardEndpoint {
  id: string;
  name: string;
  ipAddress: string;
  osType: string;
  status: 'healthy' | 'vulnerable' | 'critical';
  lastScan: string;
  vulnerablePackages: number;
  totalPackages: number;
  environment: string;
  metadata?: any;
}

export interface DashboardPackage {
  id: string;
  name: string;
  version: string;
  vulnerabilities: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  endpointId: string;
  packageType: string;
  vendor?: string;
}

export interface DashboardVulnerability {
  id: string;
  cve_id: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss_score: number;
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive';
  endpoint_id: string;
  endpoint_name: string;
  environment: string;
  discovered_date: string;
  affected_packages: string[];
  source?: string;
  source_id?: string | null;
  reference_urls?: string[];
}

export interface RiskMetrics {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalEndpoints: number;
  healthyEndpoints: number;
  vulnerableEndpoints: number;
  criticalEndpoints: number;
}

export interface AgentInventoryStats {
  totalEndpoints: number;
  reportedPackages: number;
  reportedServices: number;
  latestCollection: string | null;
}

export interface AgentResourceMetrics {
  cpu_usage_percent: number | null;
  memory_usage_percent: number | null;
  memory_used_bytes: number | null;
  memory_total_bytes: number | null;
  disk_usage_percent: number | null;
  disk_used_bytes: number | null;
  disk_total_bytes: number | null;
}

export interface AgentHealthEndpoint {
  id: string;
  hostname: string;
  osType: string;
  lastScan: string | null;
  runningServices: string[];
  resourceMetrics: AgentResourceMetrics | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function finiteNumber(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
    ? value
    : null;
}

function parseAgentResourceMetrics(value: unknown): AgentResourceMetrics | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const metrics: AgentResourceMetrics = {
    cpu_usage_percent: finiteNumber(record.cpu_usage_percent, 0, 100),
    memory_usage_percent: finiteNumber(record.memory_usage_percent, 0, 100),
    memory_used_bytes: finiteNumber(record.memory_used_bytes),
    memory_total_bytes: finiteNumber(record.memory_total_bytes, 1),
    disk_usage_percent: finiteNumber(record.disk_usage_percent, 0, 100),
    disk_used_bytes: finiteNumber(record.disk_used_bytes),
    disk_total_bytes: finiteNumber(record.disk_total_bytes, 1),
  };
  return Object.values(metrics).some((metric) => metric !== null) ? metrics : null;
}

export interface ThreatAssignee {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'analyst';
}

export class DashboardDataService {

  async getAgentSystemHealth(): Promise<AgentHealthEndpoint[]> {
    const { data: endpoints, error } = await supabase
      .from('endpoints')
      .select('id, hostname, os_type, last_scan, metadata')
      .filter('metadata->>collection_source', 'eq', 'agent')
      .order('last_scan', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch agent system health: ${error.message}`);
    }

    return (endpoints ?? []).map((endpoint) => {
      const metadata = asRecord(endpoint.metadata);
      return {
        id: endpoint.id,
        hostname: endpoint.hostname,
        osType: endpoint.os_type,
        lastScan: endpoint.last_scan,
        runningServices: Array.isArray(metadata.running_services)
          ? metadata.running_services.filter(
              (service): service is string => typeof service === 'string' && service.length > 0,
            )
          : [],
        resourceMetrics: parseAgentResourceMetrics(metadata.resource_metrics),
      };
    });
  }

  async getThreatAssignees(): Promise<ThreatAssignee[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .in('role', ['admin', 'analyst'])
      .order('full_name');

    if (error) {
      throw new Error(`Failed to load threat assignees: ${error.message}`);
    }

    return data || [];
  }

  async assignThreat(input: {
    vulnerabilityId: string;
    cveId: string;
    endpointId: string;
    assignedTo: string;
    assignedBy: string;
    assignedByEmail: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    notes: string;
  }): Promise<{ auditLogged: boolean }> {
    const { data: cve, error: cveError } = await supabase
      .from('cves')
      .select('id')
      .eq('cve_id', input.cveId)
      .maybeSingle();

    if (cveError) {
      throw new Error(`Failed to find CVE record for assignment: ${cveError.message}`);
    }
    if (!cve) {
      throw new Error(`CVE ${input.cveId} is missing from the CVE catalog`);
    }

    const { error: triageError } = await supabase
      .from('triage_actions')
      .upsert(
        {
          cve_id: cve.id,
          endpoint_id: input.endpointId,
          status: 'in_progress',
          priority: input.priority,
          assigned_to: input.assignedTo,
          notes: input.notes,
          triaged_by: input.assignedBy,
          triaged_at: new Date().toISOString(),
        },
        { onConflict: 'cve_id,endpoint_id' },
      );

    if (triageError) {
      throw new Error(`Failed to save threat assignment: ${triageError.message}`);
    }

    const { error: vulnerabilityError } = await supabase
      .from('vulnerabilities')
      .update({ status: 'in_progress' })
      .eq('id', input.vulnerabilityId);

    if (vulnerabilityError) {
      throw new Error(`Assignment saved, but finding status update failed: ${vulnerabilityError.message}`);
    }

    const { error: auditError } = await supabase.from('audit_logs').insert({
      user_id: input.assignedBy,
      user_email: input.assignedByEmail,
      action: 'THREAT_ASSIGNED',
      resource_type: 'vulnerability',
      resource_id: input.vulnerabilityId,
      details: {
        cve_id: input.cveId,
        endpoint_id: input.endpointId,
        assigned_to: input.assignedTo,
        priority: input.priority,
      },
      timestamp: new Date().toISOString(),
      severity: 'high',
      status: 'success',
      metadata: { action_category: 'threat_management', security_relevant: true, compliance_relevant: true },
    });

    if (auditError) {
      console.error('Threat assignment was saved, but its audit event could not be recorded:', auditError);
      return { auditLogged: false };
    }

    return { auditLogged: true };
  }

  async recordThreatEscalation(input: {
    userId: string;
    userEmail: string;
    vulnerabilityId: string;
    cveId: string;
    endpointId: string;
    reason: string;
    level: string;
    notes: string;
  }): Promise<void> {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: input.userId,
      user_email: input.userEmail,
      action: 'THREAT_ESCALATED',
      resource_type: 'vulnerability',
      resource_id: input.vulnerabilityId,
      details: {
        cve_id: input.cveId,
        endpoint_id: input.endpointId,
        reason: input.reason,
        escalation_level: input.level,
        notes: input.notes,
      },
      timestamp: new Date().toISOString(),
      severity: 'high',
      status: 'success',
      metadata: { action_category: 'threat_management', security_relevant: true },
    });

    if (error) {
      throw new Error(`Failed to record threat escalation: ${error.message}`);
    }
  }

  async getAgentInventoryStats(): Promise<AgentInventoryStats> {
    const { data: endpoints, error } = await supabase
      .from('endpoints')
      .select('last_scan, metadata')
      .filter('metadata->>collection_source', 'eq', 'agent');

    if (error) {
      throw new Error(`Failed to fetch agent inventory: ${error.message}`);
    }

    const inventory = endpoints || [];
    const latestCollection = inventory.reduce<string | null>((latest, endpoint) => {
      const scan = endpoint.last_scan;
      if (!scan || Number.isNaN(Date.parse(scan))) return latest;
      return !latest || Date.parse(scan) > Date.parse(latest) ? scan : latest;
    }, null);

    return {
      totalEndpoints: inventory.length,
      reportedPackages: inventory.reduce(
        (total, endpoint) => total + (Number(endpoint.metadata?.reported_package_count) || 0),
        0
      ),
      reportedServices: inventory.reduce(
        (total, endpoint) => total + (Array.isArray(endpoint.metadata?.running_services)
          ? endpoint.metadata.running_services.length
          : 0),
        0
      ),
      latestCollection
    };
  }
  
  async getEndpoints(): Promise<DashboardEndpoint[]> {
    try {
      const { data: endpoints, error } = await supabase
        .from('endpoints')
        .select(`
          id,
          hostname,
          ip_address,
          os_type,
          os_version,
          status,
          last_scan,
          environment,
          metadata,
          endpoint_packages (
            id,
            packages (
              id,
              name,
              version
            )
          ),
          vulnerabilities (
            id,
            severity
          )
        `);

      if (error) {
        console.error('Error fetching endpoints:', error);
        return [];
      }

      return endpoints.map(endpoint => {
        const totalPackages = endpoint.endpoint_packages?.length || 0;
        const vulnerabilities = endpoint.vulnerabilities || [];
        const vulnerablePackages = new Set(
          vulnerabilities.map(v => v.id)
        ).size;

        // Determine status based on vulnerabilities
        let status: 'healthy' | 'vulnerable' | 'critical' = 'healthy';
        const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
        const highVulns = vulnerabilities.filter(v => v.severity === 'high').length;

        if (criticalVulns > 0) {
          status = 'critical';
        } else if (highVulns > 0 || vulnerablePackages > 0) {
          status = 'vulnerable';
        }

        return {
          id: endpoint.id,
          name: endpoint.hostname,
          ipAddress: endpoint.ip_address,
          osType: endpoint.os_type,
          status,
          lastScan: endpoint.last_scan,
          vulnerablePackages,
          totalPackages,
          environment: endpoint.environment,
          metadata: endpoint.metadata
        };
      });
    } catch (error) {
      console.error('Error in getEndpoints:', error);
      return [];
    }
  }

  async getPackagesForEndpoint(endpointId: string): Promise<DashboardPackage[]> {
    try {
      const { data: endpointPackages, error } = await supabase
        .from('endpoint_packages')
        .select(`
          id,
          packages (
            id,
            name,
            version,
            package_type,
            vendor
          ),
          vulnerabilities (
            id,
            severity
          )
        `)
        .eq('endpoint_id', endpointId);

      if (error) {
        console.error('Error fetching packages:', error);
        return [];
      }

      return endpointPackages.map(ep => {
        const pkg = Array.isArray(ep.packages) ? ep.packages[0] : ep.packages;
        const vulnerabilities = ep.vulnerabilities || [];
        const vulnerabilityCount = vulnerabilities.length;
        
        // Determine highest severity
        let severity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';
        if (vulnerabilities.some(v => v.severity === 'critical')) {
          severity = 'critical';
        } else if (vulnerabilities.some(v => v.severity === 'high')) {
          severity = 'high';
        } else if (vulnerabilities.some(v => v.severity === 'medium')) {
          severity = 'medium';
        } else if (vulnerabilities.some(v => v.severity === 'low')) {
          severity = 'low';
        }

        return {
          id: pkg?.id || '',
          name: pkg?.name || '',
          version: pkg?.version || '',
          vulnerabilities: vulnerabilityCount,
          severity,
          endpointId,
          packageType: pkg?.package_type || '',
          vendor: pkg?.vendor
        };
      }).filter(pkg => pkg.id); // Filter out any packages without valid data
    } catch (error) {
      console.error('Error in getPackagesForEndpoint:', error);
      return [];
    }
  }

  async getVulnerabilities(): Promise<DashboardVulnerability[]> {
    try {
      const { data: vulnerabilities, error } = await supabase
        .from('vulnerabilities')
        .select(`
          id,
          cve_id,
          description,
          severity,
          cvss_score,
          status,
          endpoint_id,
          discovered_date,
          endpoints (
            hostname,
            environment
          )
        `)
        .order('discovered_date', { ascending: false });

      if (error) {
        console.error('Error fetching vulnerabilities:', error);
        return [];
      }

      return vulnerabilities.map(vuln => {
        const endpoint = Array.isArray(vuln.endpoints) ? vuln.endpoints[0] : vuln.endpoints;
        
        return {
          id: vuln.id,
          cve_id: vuln.cve_id,
          severity: vuln.severity,
          cvss_score: vuln.cvss_score,
          description: vuln.description,
          status: vuln.status,
          endpoint_id: vuln.endpoint_id,
          endpoint_name: endpoint?.hostname || 'Unknown',
          environment: endpoint?.environment || 'Unknown',
          discovered_date: vuln.discovered_date,
          affected_packages: [] // This would need a join with packages if we track that relationship
        };
      });
    } catch (error) {
      console.error('Error fetching vulnerabilities:', error);
      return [];
    }
  }

  async getAgentVulnerabilities(): Promise<DashboardVulnerability[]> {
    const { data: vulnerabilities, error } = await supabase
      .from('vulnerabilities')
      .select(`
        id,
        cve_id,
        description,
        severity,
        cvss_score,
        status,
        endpoint_id,
        discovered_date,
        source_id,
        reference_urls,
        affected_packages,
        endpoints!inner (
          hostname,
          environment,
          metadata
        )
      `)
      .eq('source', 'osv')
      .order('discovered_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch agent vulnerability findings: ${error.message}`);
    }

    return (vulnerabilities || [])
      .map((vuln) => {
        const endpoint = Array.isArray(vuln.endpoints)
          ? vuln.endpoints[0]
          : vuln.endpoints;

        return {
          id: vuln.id,
          cve_id: vuln.cve_id,
          severity: vuln.severity,
          cvss_score: vuln.cvss_score,
          description: vuln.description,
          status: vuln.status,
          endpoint_id: vuln.endpoint_id,
          endpoint_name: endpoint?.hostname || 'Unknown',
          environment: endpoint?.environment || 'Unknown',
          discovered_date: vuln.discovered_date,
          affected_packages: vuln.affected_packages || [],
          source: 'osv',
          source_id: vuln.source_id,
          reference_urls: vuln.reference_urls || [],
          collection_source: endpoint?.metadata?.collection_source,
        };
      })
      .filter((vulnerability) => vulnerability.collection_source === 'agent')
      .map(({ collection_source: _collectionSource, ...vulnerability }) => vulnerability);
  }

  async getRiskMetrics(): Promise<RiskMetrics> {
    try {
      const [endpoints, vulnerabilities] = await Promise.all([
        this.getEndpoints(),
        this.getVulnerabilities()
      ]);

      const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
      const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
      const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
      const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

      const totalEndpoints = endpoints.length;
      const healthyEndpoints = endpoints.filter(e => e.status === 'healthy').length;
      const vulnerableEndpoints = endpoints.filter(e => e.status === 'vulnerable').length;
      const criticalEndpoints = endpoints.filter(e => e.status === 'critical').length;

      return {
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        totalEndpoints,
        healthyEndpoints,
        vulnerableEndpoints,
        criticalEndpoints
      };
    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      return {
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        totalEndpoints: 0,
        healthyEndpoints: 0,
        vulnerableEndpoints: 0,
        criticalEndpoints: 0
      };
    }
  }

  async getPackages(): Promise<DashboardPackage[]> {
    try {
      const { data: packages, error } = await supabase
        .from('packages')
        .select(`
          id,
          name,
          version,
          vendor,
          package_type,
          endpoint_packages (
            endpoint_id,
            endpoints (
              hostname
            )
          )
        `);

      if (error) {
        console.error('Error fetching packages:', error);
        return [];
      }

      return packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        version: pkg.version,
        vulnerabilities: 0, // Would need to join with vulnerabilities table
        severity: 'none' as const,
        endpointId: pkg.endpoint_packages?.[0]?.endpoint_id || '',
        packageType: pkg.package_type,
        vendor: pkg.vendor
      }));
    } catch (error) {
      console.error('Error fetching packages:', error);
      return [];
    }
  }

  // Utility method to trigger system data collection
  async triggerDataCollection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/system-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: 'System data collection completed successfully'
        };
      } else {
        return {
          success: false,
          message: result.error || 'Data collection failed'
        };
      }
    } catch (error) {
      console.error('Error triggering data collection:', error);
      return {
        success: false,
        message: 'Failed to trigger data collection'
      };
    }
  }

  async getVulnerabilityDistribution() {
    try {
      const vulnerabilities = await this.getVulnerabilities();
      
      const severityData = [
        { 
          name: 'Critical', 
          value: vulnerabilities.filter(v => v.severity === 'critical').length,
          color: '#7C3AED'
        },
        { 
          name: 'High', 
          value: vulnerabilities.filter(v => v.severity === 'high').length,
          color: '#DC2626'
        },
        { 
          name: 'Medium', 
          value: vulnerabilities.filter(v => v.severity === 'medium').length,
          color: '#F97316'
        },
        { 
          name: 'Low', 
          value: vulnerabilities.filter(v => v.severity === 'low').length,
          color: '#16A34A'
        }
      ];

      const environmentData = [
        {
          name: 'Production',
          value: vulnerabilities.filter(v => v.environment === 'production').length,
          color: '#DC2626'
        },
        {
          name: 'Staging',
          value: vulnerabilities.filter(v => v.environment === 'staging').length,
          color: '#F97316'
        },
        {
          name: 'Development',
          value: vulnerabilities.filter(v => v.environment === 'development').length,
          color: '#3B82F6'
        }
      ];

      const statusData = [
        {
          name: 'Open',
          value: vulnerabilities.filter(v => v.status === 'open').length,
          color: '#DC2626'
        },
        {
          name: 'In Progress',
          value: vulnerabilities.filter(v => v.status === 'in_progress').length,
          color: '#F97316'
        },
        {
          name: 'Resolved',
          value: vulnerabilities.filter(v => v.status === 'resolved').length,
          color: '#16A34A'
        }
      ];

      return {
        severityData,
        environmentData,
        statusData
      };
    } catch (error) {
      console.error('Error in getVulnerabilityDistribution:', error);
      return {
        severityData: [],
        environmentData: [],
        statusData: []
      };
    }
  }

  async triggerVulnerabilityAssessment(endpointId: string): Promise<void> {
    try {
      // Get endpoint packages
      const { data: endpointPackages, error: packagesError } = await supabase
        .from('endpoint_packages')
        .select(`
          id,
          endpoint_id,
          packages (
            id,
            name,
            version
          )
        `)
        .eq('endpoint_id', endpointId);

      if (packagesError) {
        throw new Error(`Failed to get endpoint packages: ${packagesError.message}`);
      }

      // Mock vulnerability assessment - in real implementation, this would query CVE databases
      const mockVulnerabilities = [
        {
          cve_id: 'CVE-2024-0001',
          severity: 'high',
          description: 'Buffer overflow vulnerability in system library',
          cvss_score: 8.5
        },
        {
          cve_id: 'CVE-2024-0002',
          severity: 'medium',
          description: 'Information disclosure vulnerability',
          cvss_score: 6.2
        }
      ];

      // Insert vulnerabilities
      for (const vuln of mockVulnerabilities) {
        await supabase
          .from('vulnerabilities')
          .upsert({
            endpoint_id: endpointId,
            cve_id: vuln.cve_id,
            severity: vuln.severity,
            description: vuln.description,
            cvss_score: vuln.cvss_score,
            status: 'open',
            discovered_date: new Date().toISOString()
          }, {
            onConflict: 'endpoint_id,cve_id'
          });
      }

      console.log(`✅ Vulnerability assessment completed for endpoint ${endpointId}`);
    } catch (error) {
      console.error('Error in triggerVulnerabilityAssessment:', error);
      throw error;
    }
  }

  async updateEndpointStatus(endpointId: string, status: 'healthy' | 'vulnerable' | 'critical'): Promise<void> {
    try {
      const { error } = await supabase
        .from('endpoints')
        .update({ status })
        .eq('id', endpointId);

      if (error) {
        throw new Error(`Failed to update endpoint status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateEndpointStatus:', error);
      throw error;
    }
  }
}

export default DashboardDataService;