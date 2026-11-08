import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AgentThreatAssignment, DashboardVulnerability } from '@/lib/dashboardDataService';

const SESSION_COOKIE = 'komra_demo_session';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AssignmentRecord = {
  id: string;
  cve_id: string;
  endpoint_id: string;
  assigned_to: string;
  triaged_by: string | null;
  status: string;
  priority: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  triaged_at: string | null;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function responseForDatabaseError(error: { code?: string; message: string }) {
  if (error.code === '42501') {
    return NextResponse.json({ error: 'You are not authorized to view these assignments.' }, { status: 403 });
  }
  console.error('Unable to load authorized agent assignments:', error);
  return NextResponse.json({ error: 'Unable to load assigned findings.' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const assigneeId = request.nextUrl.searchParams.get('assigneeId');
  if (assigneeId !== null && !UUID_PATTERN.test(assigneeId)) {
    return NextResponse.json({ error: 'Invalid assignee ID.' }, { status: 400 });
  }
  const appToken = request.cookies.get(SESSION_COOKIE)?.value;
  const authorization = request.headers.get('authorization');
  let assignments: AssignmentRecord[] | null;
  let assignmentError;

  if (appToken) {
    const result = await supabaseAdmin.rpc('get_app_session_agent_threats', {
      p_token_hash: hashToken(appToken),
      p_assignee_id: assigneeId,
    });
    assignments = result.data as AssignmentRecord[] | null;
    assignmentError = result.error;
  } else {
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!accessToken) {
      return NextResponse.json({ error: 'Sign in to view assigned findings.' }, { status: 401 });
    }

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
    const result = await supabaseUser.rpc('get_authorized_agent_threats', {
      p_assignee_id: assigneeId,
    });
    assignments = result.data as AssignmentRecord[] | null;
    assignmentError = result.error;
  }

  if (assignmentError) return responseForDatabaseError(assignmentError);
  if (!assignments?.length) return NextResponse.json([]);

  const cveIds = Array.from(new Set(assignments.map((assignment) => assignment.cve_id)));
  const endpointIds = Array.from(new Set(assignments.map((assignment) => assignment.endpoint_id)));
  const [cveResult, endpointResult] = await Promise.all([
    supabaseAdmin.from('cves').select('id, cve_id').in('id', cveIds),
    supabaseAdmin.from('endpoints').select('id, hostname, environment').in('id', endpointIds),
  ]);
  if (cveResult.error) return responseForDatabaseError(cveResult.error);
  if (endpointResult.error) return responseForDatabaseError(endpointResult.error);

  const cveIdByRecordId = new Map((cveResult.data ?? []).map((cve) => [cve.id, cve.cve_id]));
  const endpointById = new Map((endpointResult.data ?? []).map((endpoint) => [endpoint.id, endpoint]));
  const findingCveIds = Array.from(new Set(cveIdByRecordId.values()));
  const { data: findings, error: findingError } = await supabaseAdmin
    .from('vulnerabilities')
    .select('id, cve_id, description, severity, cvss_score, status, endpoint_id, discovered_date, source_id, reference_urls, affected_packages')
    .eq('source', 'osv')
    .in('cve_id', findingCveIds)
    .in('endpoint_id', endpointIds);
  if (findingError) return responseForDatabaseError(findingError);

  const findingByKey = new Map(
    (findings ?? []).map((finding) => [`${finding.endpoint_id}:${finding.cve_id}`, finding]),
  );
  const userIds = Array.from(new Set(assignments.flatMap((assignment) =>
    [assignment.assigned_to, assignment.triaged_by].filter((id): id is string => Boolean(id)),
  )));
  const { data: users, error: userError } = userIds.length > 0
    ? await supabaseAdmin.from('users').select('id, email, full_name').in('id', userIds)
    : { data: [], error: null };
  if (userError) return responseForDatabaseError(userError);
  const userById = new Map((users ?? []).map((user) => [user.id, user]));

  let result: AgentThreatAssignment[];
  try {
    result = assignments.map((assignment) => {
      const cveId = cveIdByRecordId.get(assignment.cve_id);
      const finding = cveId
        ? findingByKey.get(`${assignment.endpoint_id}:${cveId}`)
        : undefined;
      const endpoint = endpointById.get(assignment.endpoint_id);
      const owner = userById.get(assignment.assigned_to);
      if (!finding || !endpoint || !owner) {
        throw new Error(`Assigned threat ${assignment.id} is missing its finding, endpoint, or owner.`);
      }

      const assignedByUser = assignment.triaged_by
        ? userById.get(assignment.triaged_by)
        : undefined;
      const status: AgentThreatAssignment['status'] =
        (['open', 'in_progress', 'resolved', 'false_positive'] as const)
          .find((candidate) => candidate === assignment.status) ?? 'open';
      const priority: AgentThreatAssignment['priority'] =
        (['critical', 'high', 'medium', 'low'] as const)
          .find((candidate) => candidate === assignment.priority) ?? 'medium';
      const dashboardFinding: DashboardVulnerability = {
        id: finding.id,
        cve_id: finding.cve_id,
        description: finding.description,
        severity: finding.severity,
        cvss_score: finding.cvss_score,
        status: finding.status,
        endpoint_id: finding.endpoint_id,
        endpoint_name: endpoint.hostname,
        environment: endpoint.environment,
        discovered_date: finding.discovered_date,
        affected_packages: finding.affected_packages ?? [],
        source: 'osv',
        source_id: finding.source_id,
        reference_urls: finding.reference_urls ?? [],
      };

      return {
        id: assignment.id,
        status,
        priority,
        notes: assignment.notes,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
        assignedAt: assignment.triaged_at,
        owner: {
          id: owner.id,
          email: owner.email,
          fullName: owner.full_name,
        },
        assignedBy: assignedByUser
          ? {
              id: assignedByUser.id,
              email: assignedByUser.email,
              fullName: assignedByUser.full_name,
            }
          : null,
        finding: dashboardFinding,
      };
    });
  } catch (error) {
    console.error('Assigned threat data is incomplete:', error);
    return NextResponse.json({ error: 'Assigned finding details are unavailable.' }, { status: 500 });
  }

  return NextResponse.json(result);
}
