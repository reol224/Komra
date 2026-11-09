import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const escalationLevels = [
  'Incident Response Team',
  'CISO Office',
  'Executive Leadership',
  'External Security Firm',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return NextResponse.json({ error: 'A verified sign-in session is required.' }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'The sign-in session is invalid or expired.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Unable to load threat escalation actor role:', profileError);
    return NextResponse.json({ error: 'Unable to authorize threat escalation.' }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: 'The signed-in user is not authorized to escalate threats.' }, { status: 403 });
  }

  const { data: permission, error: permissionError } = await supabase
    .from('role_permissions')
    .select('granted')
    .eq('role', profile.role)
    .eq('permission_id', 'system.escalate_threats')
    .maybeSingle();
  if (permissionError) {
    console.error('Unable to verify threat escalation permission:', permissionError);
    return NextResponse.json({ error: 'Unable to authorize threat escalation.' }, { status: 500 });
  }
  if (permission?.granted !== true) {
    return NextResponse.json({ error: 'The signed-in user is not authorized to escalate threats.' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (!isRecord(payload)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { vulnerabilityId, reason, level, notes } = payload;
  if (
    typeof vulnerabilityId !== 'string'
    || typeof reason !== 'string'
    || reason.length === 0
    || reason.length > 200
    || typeof level !== 'string'
    || !escalationLevels.includes(level)
    || typeof notes !== 'string'
    || notes.length > 5000
  ) {
    return NextResponse.json({ error: 'Invalid threat escalation details.' }, { status: 400 });
  }

  const { data: vulnerability, error: vulnerabilityError } = await supabase
    .from('vulnerabilities')
    .select('id, cve_id, endpoint_id')
    .eq('id', vulnerabilityId)
    .maybeSingle();
  if (vulnerabilityError) {
    console.error('Unable to load threat escalation finding:', vulnerabilityError);
    return NextResponse.json({ error: 'Unable to verify the selected finding.' }, { status: 500 });
  }
  if (!vulnerability) {
    return NextResponse.json({ error: 'The selected finding no longer exists.' }, { status: 404 });
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    user_id: user.id,
    user_email: user.email,
    action: 'THREAT_ESCALATED',
    resource_type: 'vulnerability',
    resource_id: vulnerability.id,
    details: {
      cve_id: vulnerability.cve_id,
      endpoint_id: vulnerability.endpoint_id,
      reason,
      escalation_level: level,
      notes,
    },
    timestamp: new Date().toISOString(),
    severity: 'high',
    status: 'success',
    metadata: { action_category: 'threat_management', security_relevant: true },
  });
  if (auditError) {
    console.error('Unable to record threat escalation:', auditError);
    return NextResponse.json({ error: 'Failed to record threat escalation.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
