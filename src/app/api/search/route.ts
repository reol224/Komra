import { NextRequest, NextResponse } from 'next/server';
import { SearchableDataService, SearchFilters } from '@/lib/searchableDataService';

const searchableService = new SearchableDataService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'audit':
        const auditFilters = parseFilters(searchParams);
        const auditLimit = parseInt(searchParams.get('limit') || '100');
        const auditOffset = parseInt(searchParams.get('offset') || '0');
        
        const auditResults = await searchableService.searchAuditTrail(auditFilters, auditLimit, auditOffset);
        return NextResponse.json({ success: true, data: auditResults });

      case 'investigations':
        const investigationFilters = parseFilters(searchParams);
        const investigationLimit = parseInt(searchParams.get('limit') || '50');
        const investigationOffset = parseInt(searchParams.get('offset') || '0');
        
        const investigationResults = await searchableService.searchInvestigations(investigationFilters, investigationLimit, investigationOffset);
        return NextResponse.json({ success: true, data: investigationResults });

      case 'compliance':
        const complianceFilters = parseFilters(searchParams);
        const complianceLimit = parseInt(searchParams.get('limit') || '50');
        const complianceOffset = parseInt(searchParams.get('offset') || '0');
        
        const complianceResults = await searchableService.searchComplianceReports(complianceFilters, complianceLimit, complianceOffset);
        return NextResponse.json({ success: true, data: complianceResults });

      case 'global_search':
        const searchTerm = searchParams.get('q');
        const dataTypes = searchParams.get('types')?.split(',') || ['audit', 'investigations', 'compliance'];
        const globalLimit = parseInt(searchParams.get('limit') || '20');
        
        if (!searchTerm) {
          return NextResponse.json({ 
            success: false, 
            error: 'Search term (q) is required for global search' 
          }, { status: 400 });
        }

        const globalResults = await searchableService.globalSearch(searchTerm, dataTypes, globalLimit);
        return NextResponse.json({ success: true, data: globalResults });

      case 'statistics':
        const stats = await searchableService.getSearchStatistics();
        return NextResponse.json({ success: true, data: stats });

      case 'export':
        const exportType = searchParams.get('type') as 'audit' | 'investigations' | 'compliance';
        const exportFilters = parseFilters(searchParams);
        
        if (!exportType || !['audit', 'investigations', 'compliance'].includes(exportType)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid export type. Use: audit, investigations, or compliance' 
          }, { status: 400 });
        }

        const exportData = await searchableService.exportData(exportType, exportFilters);
        
        // Set headers for file download
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Content-Disposition', `attachment; filename="${exportType}_export_${new Date().toISOString().split('T')[0]}.json"`);
        
        return new NextResponse(JSON.stringify(exportData, null, 2), { headers });

      case 'related_data':
        const endpointIds = searchParams.get('endpoint_ids')?.split(',') || [];
        const vulnerabilityIds = searchParams.get('vulnerability_ids')?.split(',') || [];
        
        const relatedData = await searchableService.getRelatedData(endpointIds, vulnerabilityIds);
        return NextResponse.json({ success: true, data: relatedData });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use: audit, investigations, compliance, global_search, statistics, export, or related_data' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'create_audit':
        const auditId = await searchableService.createAuditEntry(body);
        return NextResponse.json({ 
          success: true, 
          data: { id: auditId },
          message: 'Audit entry created successfully' 
        });

      case 'create_investigation':
        const investigationId = await searchableService.createInvestigation(body);
        return NextResponse.json({ 
          success: true, 
          data: { id: investigationId },
          message: 'Investigation created successfully' 
        });

      case 'update_investigation':
        const { id, ...updates } = body;
        if (!id) {
          return NextResponse.json({ 
            success: false, 
            error: 'Investigation ID is required' 
          }, { status: 400 });
        }

        await searchableService.updateInvestigation(id, updates);
        
        // Log the update
        await searchableService.createAuditEntry({
          event_type: 'investigation',
          event_category: 'case_management',
          action: 'investigation_updated',
          description: `Investigation ${id} updated`,
          severity: 'info',
          metadata: { investigation_id: id, updates: Object.keys(updates) }
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Investigation updated successfully' 
        });

      case 'create_compliance_report':
        const reportId = await searchableService.createComplianceReport(body);
        
        // Log the report creation
        await searchableService.createAuditEntry({
          event_type: 'compliance',
          event_category: 'reporting',
          action: 'report_created',
          description: `Compliance report created: ${body.title}`,
          severity: 'info',
          metadata: { 
            report_id: reportId,
            framework: body.framework,
            report_type: body.report_type 
          }
        });

        return NextResponse.json({ 
          success: true, 
          data: { id: reportId },
          message: 'Compliance report created successfully' 
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}

// Helper function to parse search filters from URL parameters
function parseFilters(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};

  // Date range
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  if (startDate && endDate) {
    filters.dateRange = { start: startDate, end: endDate };
  }

  // Arrays
  const severity = searchParams.get('severity');
  if (severity) {
    filters.severity = severity.split(',');
  }

  const status = searchParams.get('status');
  if (status) {
    filters.status = status.split(',');
  }

  const endpoints = searchParams.get('endpoints');
  if (endpoints) {
    filters.endpoints = endpoints.split(',');
  }

  const categories = searchParams.get('categories');
  if (categories) {
    filters.categories = categories.split(',');
  }

  const tags = searchParams.get('tags');
  if (tags) {
    filters.tags = tags.split(',');
  }

  // Text search
  const textSearch = searchParams.get('search');
  if (textSearch) {
    filters.textSearch = textSearch;
  }

  return filters;
}