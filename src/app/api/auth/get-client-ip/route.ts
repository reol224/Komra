import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Try multiple headers to get the real client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  let ip = 
    cfConnectingIp || 
    realIp || 
    (forwarded ? forwarded.split(',')[0].trim() : null) ||
    'unknown';

  return NextResponse.json({ ip });
}
