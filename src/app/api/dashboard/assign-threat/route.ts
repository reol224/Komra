import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SESSION_COOKIE = 'komra_demo_session';
const validPriorities = ['critical', 'high', 'medium', 'low'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function responseForDatabaseError(error: { code?: string; message: string }) {
  if (error.code === '42501') {
    return NextResponse.json({ error: 'You are not authorized to assign this finding.' }, { status: 403 });
  }
  console.error('Unable to assign finding:', error);
  return NextResponse.json({ error: 'Unable to assign this finding.' }, { status: 500 });
}

export async function POST(request: NextRequest) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid assignment request.' }, { status: 400 });
  }

  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'Invalid assignment request.' }, { status: 400 });
  }
  const { vulnerabilityId, cveId, endpointId, assignedTo, priority, notes } =
    input as Record<string, unknown>;
  if (
    typeof vulnerabilityId !== 'string'
    || !UUID_PATTERN.test(vulnerabilityId)
    || typeof cveId !== 'string'
    || cveId.length === 0
    || typeof endpointId !== 'string'
    || !UUID_PATTERN.test(endpointId)
    || typeof assignedTo !== 'string'
    || !UUID_PATTERN.test(assignedTo)
    || typeof priority !== 'string'
    || !validPriorities.includes(priority)
    || typeof notes !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid assignment request.' }, { status: 400 });
  }

  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  let result;
  if (accessToken) {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'The sign-in session is invalid or expired.' }, { status: 401 });
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      },
    );
    result = await supabaseUser.rpc('assign_agent_threat', {
      p_vulnerability_id: vulnerabilityId,
      p_cve_identifier: cveId,
      p_endpoint_id: endpointId,
      p_assignee_id: assignedTo,
      p_priority: priority,
      p_notes: notes,
    });
  } else {
    const appToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (!appToken) {
      return NextResponse.json({ error: 'Sign in to assign findings.' }, { status: 401 });
    }
    result = await supabaseAdmin.rpc('assign_agent_threat_with_app_session', {
      p_token_hash: createHash('sha256').update(appToken).digest('hex'),
      p_vulnerability_id: vulnerabilityId,
      p_cve_identifier: cveId,
      p_endpoint_id: endpointId,
      p_assignee_id: assignedTo,
      p_priority: priority,
      p_notes: notes,
    });
  }

  if (result.error) return responseForDatabaseError(result.error);
  return NextResponse.json({ success: true });
}
