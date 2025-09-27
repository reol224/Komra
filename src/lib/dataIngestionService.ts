import { createClient } from '@supabase/supabase-js';
import SystemDataCollector, { MachineData } from '../lib/systemDataCollector';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class DataIngestionService {
  private collector: SystemDataCollector;

  constructor() {
    this.collector = new SystemDataCollector();
  }

  async collectAndStoreSystemData(): Promise<{ success: boolean; data?: MachineData; error?: string }> {
    try {
      console.log('🔍 Starting system data collection...');
      
      // Collect system data
      const machineData = await this.collector.collectSystemData();
      
      console.log(`📊 Collected data for ${machineData.endpoint.hostname}:`);
      console.log(`   - OS: ${machineData.endpoint.os_type} ${machineData.endpoint.os_version}`);
      console.log(`   - Packages: ${machineData.packages.length}`);
      console.log(`   - Services: ${machineData.endpoint.running_services.length}`);

      // Store in Supabase
      await this.storeSystemData(machineData);
      
      console.log('✅ System data collection and storage completed');
      
      return { success: true, data: machineData };
    } catch (error) {
      console.error('❌ Error during data collection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async storeSystemData(machineData: MachineData): Promise<void> {
    // Insert or update endpoint
    const endpointData = {
      hostname: machineData.endpoint.hostname,
      ip_address: machineData.endpoint.ip_address,
      os_type: machineData.endpoint.os_type,
      os_version: machineData.endpoint.os_version,
      environment: machineData.endpoint.environment,
      last_scan: machineData.last_scan,
      status: 'healthy',
      metadata: {
        architecture: machineData.endpoint.architecture,
        cpu_info: machineData.endpoint.cpu_info,
        memory_total: machineData.endpoint.memory_total,
        disk_usage: machineData.endpoint.disk_usage,
        network_interfaces: machineData.endpoint.network_interfaces,
        running_services: machineData.endpoint.running_services
      }
    };

    const { data: endpoint, error: endpointError } = await supabase
      .from('endpoints')
      .upsert(endpointData, {
        onConflict: 'hostname'
      })
      .select()
      .single();

    if (endpointError) {
      throw new Error(`Failed to store endpoint data: ${endpointError.message}`);
    }

    console.log(`📝 Stored endpoint: ${endpoint.hostname}`);

    // Store packages
    for (const pkg of machineData.packages) {
      try {
        // First, insert or get the package
        const { data: packageData, error: packageError } = await supabase
          .from('packages')
          .upsert({
            name: pkg.name,
            version: pkg.version,
            vendor: pkg.vendor,
            package_type: pkg.package_type,
            description: pkg.description
          }, {
            onConflict: 'name,version'
          })
          .select()
          .single();

        if (packageError) {
          console.warn(`Warning: Failed to store package ${pkg.name}: ${packageError.message}`);
          continue;
        }

        // Then, link the package to the endpoint
        const { error: linkError } = await supabase
          .from('endpoint_packages')
          .upsert({
            endpoint_id: endpoint.id,
            package_id: packageData.id,
            installed_date: pkg.installed_date,
            status: 'installed'
          }, {
            onConflict: 'endpoint_id,package_id'
          });

        if (linkError) {
          console.warn(`Warning: Failed to link package ${pkg.name} to endpoint: ${linkError.message}`);
        }
      } catch (pkgError) {
        console.warn(`Warning: Error processing package ${pkg.name}:`, pkgError);
        continue;
      }
    }

    console.log(`📦 Processed ${machineData.packages.length} packages`);
  }

  async getStoredSystemData(hostname?: string): Promise<any> {
    let query = supabase
      .from('endpoints')
      .select(`
        *,
        endpoint_packages (
          *,
          packages (*)
        )
      `);

    if (hostname) {
      query = query.eq('hostname', hostname);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve system data: ${error.message}`);
    }

    return data;
  }

  async scanForVulnerabilities(endpointId: string): Promise<void> {
    // This would integrate with vulnerability databases
    // For now, we'll create a placeholder implementation
    console.log(`🔍 Scanning endpoint ${endpointId} for vulnerabilities...`);
    
    // Get endpoint packages
    const { data: endpointPackages, error } = await supabase
      .from('endpoint_packages')
      .select(`
        *,
        packages (*),
        endpoints (*)
      `)
      .eq('endpoint_id', endpointId);

    if (error) {
      throw new Error(`Failed to get endpoint packages: ${error.message}`);
    }

    // Mock vulnerability detection (in real implementation, this would query CVE databases)
    const mockVulnerabilities = [
      {
        cve_id: 'CVE-2024-0001',
        severity: 'high',
        description: 'Sample vulnerability for testing',
        cvss_score: 8.5
      }
    ];

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

    console.log(`🚨 Found ${mockVulnerabilities.length} vulnerabilities`);
  }
}

export default DataIngestionService;