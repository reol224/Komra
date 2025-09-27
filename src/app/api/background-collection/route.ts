import { NextRequest, NextResponse } from 'next/server';
import { BackgroundDataCollector } from '@/lib/backgroundDataCollector';
import { SearchableDataService } from '@/lib/searchableDataService';

const backgroundCollector = new BackgroundDataCollector();
const searchableService = new SearchableDataService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'schedules':
        const schedules = await backgroundCollector.getSchedules();
        return NextResponse.json({ success: true, data: schedules });

      case 'jobs':
        const scheduleId = searchParams.get('scheduleId');
        const jobs = await backgroundCollector.getCollectionJobs(scheduleId || undefined);
        return NextResponse.json({ success: true, data: jobs });

      case 'statistics':
        const stats = await searchableService.getSearchStatistics();
        return NextResponse.json({ success: true, data: stats });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use: schedules, jobs, or statistics' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Background collection API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Only parse JSON body if the request has content
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      // If JSON parsing fails, continue with empty body
      console.warn('Failed to parse request body, using empty object:', parseError);
    }

    switch (action) {
      case 'start':
        await backgroundCollector.startBackgroundCollection();
        
        // Log the start event
        await searchableService.createAuditEntry({
          event_type: 'system_control',
          event_category: 'background_collection',
          action: 'service_started',
          description: 'Background data collection service started',
          severity: 'info',
          metadata: { started_by: 'api_request' }
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Background collection service started' 
        });

      case 'stop':
        backgroundCollector.stopBackgroundCollection();
        
        // Log the stop event
        await searchableService.createAuditEntry({
          event_type: 'system_control',
          event_category: 'background_collection',
          action: 'service_stopped',
          description: 'Background data collection service stopped',
          severity: 'info',
          metadata: { stopped_by: 'api_request' }
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Background collection service stopped' 
        });

      case 'create_schedule':
        const { name, endpoints, frequency, collection_type } = body;
        
        if (!name || !endpoints || !frequency) {
          return NextResponse.json({ 
            success: false, 
            error: 'Missing required fields: name, endpoints, frequency' 
          }, { status: 400 });
        }

        const scheduleId = await backgroundCollector.createSchedule({
          name,
          endpoints,
          frequency,
          collection_type: collection_type || 'full',
          enabled: true
        });

        // Log the schedule creation
        await searchableService.createAuditEntry({
          event_type: 'configuration',
          event_category: 'background_collection',
          action: 'schedule_created',
          description: `Collection schedule '${name}' created with ${endpoints.length} endpoints`,
          severity: 'info',
          metadata: { 
            schedule_id: scheduleId,
            endpoints: endpoints.length,
            frequency,
            collection_type 
          }
        });

        return NextResponse.json({ 
          success: true, 
          data: { id: scheduleId },
          message: 'Collection schedule created successfully' 
        });

      case 'enable_schedule':
        const { scheduleId: enableId } = body;
        await backgroundCollector.enableSchedule(enableId);
        
        await searchableService.createAuditEntry({
          event_type: 'configuration',
          event_category: 'background_collection',
          action: 'schedule_enabled',
          description: `Collection schedule enabled: ${enableId}`,
          severity: 'info',
          metadata: { schedule_id: enableId }
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Schedule enabled successfully' 
        });

      case 'disable_schedule':
        const { scheduleId: disableId } = body;
        await backgroundCollector.disableSchedule(disableId);
        
        await searchableService.createAuditEntry({
          event_type: 'configuration',
          event_category: 'background_collection',
          action: 'schedule_disabled',
          description: `Collection schedule disabled: ${disableId}`,
          severity: 'info',
          metadata: { schedule_id: disableId }
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Schedule disabled successfully' 
        });

      case 'trigger_collection':
        // Manually trigger a collection job
        const { endpoints: triggerEndpoints } = body;
        
        if (!triggerEndpoints || !Array.isArray(triggerEndpoints)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Missing or invalid endpoints array' 
          }, { status: 400 });
        }

        // Create a temporary schedule for manual collection
        const tempScheduleId = await backgroundCollector.createSchedule({
          name: `Manual Collection - ${new Date().toISOString()}`,
          endpoints: triggerEndpoints,
          frequency: 'daily',
          collection_type: 'full',
          enabled: false // Disabled since it's a one-time run
        });

        await searchableService.createAuditEntry({
          event_type: 'data_collection',
          event_category: 'manual_trigger',
          action: 'collection_triggered',
          description: `Manual data collection triggered for ${triggerEndpoints.length} endpoints`,
          severity: 'info',
          metadata: { 
            endpoints: triggerEndpoints.length,
            trigger_type: 'manual'
          }
        });

        return NextResponse.json({ 
          success: true, 
          data: { schedule_id: tempScheduleId },
          message: 'Manual collection triggered successfully' 
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Background collection API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}