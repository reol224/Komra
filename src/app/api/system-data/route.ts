import { NextRequest, NextResponse } from 'next/server';
import DataIngestionService from '../../../lib/dataIngestionService';

export async function POST(request: NextRequest) {
  try {
    const service = new DataIngestionService();
    const result = await service.collectAndStoreSystemData();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'System data collected and stored successfully',
        data: {
          hostname: result.data?.endpoint.hostname,
          os_type: result.data?.endpoint.os_type,
          packages_count: result.data?.packages.length,
          last_scan: result.data?.last_scan
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostname = searchParams.get('hostname');
    
    const service = new DataIngestionService();
    const data = await service.getStoredSystemData(hostname || undefined);
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}