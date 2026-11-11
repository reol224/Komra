import SystemDataCollector, { MachineData } from '../lib/systemDataCollector';
import { supabase } from './supabase';
import { scanEndpointForKnownVulnerabilities } from './vulnerabilityDetection';

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
    const { data: endpointRows, error: endpointError } = await supabase.rpc(
      'upsert_local_endpoint',
      {
        p_hostname: machineData.endpoint.hostname,
        p_ip_address: machineData.endpoint.ip_address,
        p_os_type: machineData.endpoint.os_type,
        p_os_version: machineData.endpoint.os_version,
        p_environment: machineData.endpoint.environment,
        p_last_scan: machineData.last_scan,
        p_status: 'healthy',
        p_metadata: {
          architecture: machineData.endpoint.architecture,
          cpu_info: machineData.endpoint.cpu_info,
          memory_total: machineData.endpoint.memory_total,
          resource_metrics: machineData.endpoint.resource_metrics,
          disk_usage: machineData.endpoint.disk_usage,
          network_interfaces: machineData.endpoint.network_interfaces,
          running_services: machineData.endpoint.running_services,
        },
      },
    );

    if (endpointError) {
      throw new Error(`Failed to store endpoint data: ${endpointError.message}`);
    }

    const endpoint = Array.isArray(endpointRows) ? endpointRows[0] : endpointRows;
    if (!endpoint) {
      throw new Error('Failed to store endpoint data: database returned no endpoint');
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
            onConflict: 'name,version,package_type'
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
    console.log(`🔍 Scanning endpoint ${endpointId} for vulnerabilities...`);
    const scanResult = await scanEndpointForKnownVulnerabilities(supabase, endpointId);
    console.log(
      `🚨 Found ${scanResult.matches} OSV matches across ${scanResult.scannedPackages} supported packages`,
    );
  }
}

export default DataIngestionService;