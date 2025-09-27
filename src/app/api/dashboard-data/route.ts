import { NextRequest, NextResponse } from 'next/server';
import DashboardDataService from '../../../lib/dashboardDataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const endpointId = searchParams.get('endpointId');

    const dashboardService = new DashboardDataService();

    switch (type) {
      case 'endpoints':
        const endpoints = await dashboardService.getEndpoints();
        return NextResponse.json({
          success: true,
          data: endpoints
        });

      case 'packages':
        if (!endpointId) {
          return NextResponse.json({
            success: false,
            error: 'endpointId is required for packages'
          }, { status: 400 });
        }
        const packages = await dashboardService.getPackagesForEndpoint(endpointId);
        return NextResponse.json({
          success: true,
          data: packages
        });

      case 'vulnerabilities':
        const vulnerabilities = await dashboardService.getVulnerabilities();
        return NextResponse.json({
          success: true,
          data: vulnerabilities
        });

      case 'risk-metrics':
        const riskMetrics = await dashboardService.getRiskMetrics();
        return NextResponse.json({
          success: true,
          data: riskMetrics
        });

      case 'vulnerability-distribution':
        const distribution = await dashboardService.getVulnerabilityDistribution();
        return NextResponse.json({
          success: true,
          data: distribution
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter. Use: endpoints, packages, vulnerabilities, risk-metrics, or vulnerability-distribution'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in dashboard data API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, endpointId, status } = await request.json();
    const dashboardService = new DashboardDataService();

    switch (action) {
      case 'trigger-vulnerability-assessment':
        if (!endpointId) {
          return NextResponse.json({
            success: false,
            error: 'endpointId is required'
          }, { status: 400 });
        }
        
        await dashboardService.triggerVulnerabilityAssessment(endpointId);
        return NextResponse.json({
          success: true,
          message: 'Vulnerability assessment triggered successfully'
        });

      case 'update-endpoint-status':
        if (!endpointId || !status) {
          return NextResponse.json({
            success: false,
            error: 'endpointId and status are required'
          }, { status: 400 });
        }

        await dashboardService.updateEndpointStatus(endpointId, status);
        return NextResponse.json({
          success: true,
          message: 'Endpoint status updated successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: trigger-vulnerability-assessment or update-endpoint-status'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in dashboard data POST API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}