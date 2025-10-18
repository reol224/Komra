import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface AgentData {
  endpoint: {
    hostname: string;
    ip_address: string;
    os_type: string;
    os_version: string;
    architecture: string;
    cpu_info: string;
    memory_total: number;
    disk_usage: any;
    network_interfaces: any[];
    running_services: string[];
    environment: string;
  };
  packages: Array<{
    name: string;
    version: string;
    vendor?: string;
    package_type: string;
    description?: string;
    installed_date?: string;
  }>;
  last_scan: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== process.env.KOMRA_AGENT_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Invalid API key'
      }, { status: 401 });
    }

    // Parse agent data
    const agentData: AgentData = await request.json();

    if (!agentData.endpoint || !agentData.packages) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data format: missing endpoint or packages'
      }, { status: 400 });
    }

    console.log(`📡 Received data from agent: ${agentData.endpoint.hostname}`);
    console.log(`   - OS: ${agentData.endpoint.os_type} ${agentData.endpoint.os_version}`);
    console.log(`   - Packages: ${agentData.packages.length}`);
    console.log(`   - Services: ${agentData.endpoint.running_services.length}`);

    // Store endpoint data
    const endpointData = {
      hostname: agentData.endpoint.hostname,
      ip_address: agentData.endpoint.ip_address,
      os_type: agentData.endpoint.os_type,
      os_version: agentData.endpoint.os_version,
      environment: agentData.endpoint.environment,
      last_scan: agentData.last_scan,
      status: 'healthy',
      metadata: {
        architecture: agentData.endpoint.architecture,
        cpu_info: agentData.endpoint.cpu_info,
        memory_total: agentData.endpoint.memory_total,
        disk_usage: agentData.endpoint.disk_usage,
        network_interfaces: agentData.endpoint.network_interfaces,
        running_services: agentData.endpoint.running_services
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
      throw new Error(`Failed to store endpoint: ${endpointError.message}`);
    }

    console.log(`✅ Stored endpoint: ${endpoint.hostname}`);

    // Store packages
    let packagesProcessed = 0;
    let packagesSkipped = 0;

    for (const pkg of agentData.packages) {
      try {
        // Insert or get the package
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
          console.warn(`⚠️  Skipped package ${pkg.name}: ${packageError.message}`);
          packagesSkipped++;
          continue;
        }

        // Link package to endpoint
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
          console.warn(`⚠️  Failed to link package ${pkg.name}: ${linkError.message}`);
          packagesSkipped++;
        } else {
          packagesProcessed++;
        }
      } catch (pkgError) {
        console.warn(`⚠️  Error processing package ${pkg.name}:`, pkgError);
        packagesSkipped++;
      }
    }

    console.log(`📦 Processed ${packagesProcessed} packages (${packagesSkipped} skipped)`);

    return NextResponse.json({
      success: true,
      message: 'Agent data ingested successfully',
      data: {
        endpoint_id: endpoint.id,
        hostname: endpoint.hostname,
        packages_processed: packagesProcessed,
        packages_skipped: packagesSkipped,
        last_scan: agentData.last_scan
      }
    });

  } catch (error) {
    console.error('❌ Error ingesting agent data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Komra Agent Ingestion API',
    version: '1.0.0',
    endpoints: {
      POST: '/api/agent/ingest - Submit system data from remote agents'
    }
  });
}
