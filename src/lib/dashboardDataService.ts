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
  status: 'open' | 'in_progress' | 'resolved';
  endpoint_id: string;
  endpoint_name: string;
  environment: string;
  discovered_date: string;
  affected_packages: string[];
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

export class DashboardDataService {
  
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