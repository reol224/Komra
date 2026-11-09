import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AgentThreatAssignment, DashboardVulnerability } from '@/lib/dashboardDataService';

const SESSION_COOKIE = 'komra_demo_session';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 500;
const BATCH_SIZE = 100;

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

async function fetchAllPages<T>(
  fetchPage: (start: number, end: number) => PromiseLike<{
    data: T[] | null;
    count?: number | null;
    error: { code?: string; message: string } | null;
  }>,
): Promise<{ data: T[]; error: { code?: string; message: string } | null }> {
  const rows: T[] = [];
  let start = 0;
  let totalCount: number | null = null;
  for (;;) {
    const { data, count, error } = await fetchPage(start, start + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    if (count !== null && count !== undefined) totalCount = count;
    const page = data ?? [];
    rows.push(...page);
    if (totalCount !== null ? rows.length >= totalCount : page.length < PAGE_SIZE) {
      return { data: rows, error: null };
    }
    if (page.length === 0) return { data: rows, error: null };
    start += page.length;
  }
}

function chunks<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

export async function GET(request: NextRequest) {
  const assigneeId = request.nextUrl.searchParams.get('assigneeId');
  if (assigneeId !== null && !UUID_PATTERN.test(assigneeId)) {
    return NextResponse.json({ error: 'Invalid assignee ID.' }, { status: 400 });
  }
  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  let assignments: AssignmentRecord[];
  let assignmentError: { code?: string; message: string } | null;

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
    const result = await fetchAllPages<AssignmentRecord>((start, end) =>
      supabaseUser.rpc('get_authorized_agent_threats', {
        p_assignee_id: assigneeId,
      }, { count: 'exact' }).range(start, end));
    assignments = result.data;
    assignmentError = result.error;
  } else {
    const appToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (!appToken) {
      return NextResponse.json({ error: 'Sign in to view assigned findings.' }, { status: 401 });
    }
    const result = await fetchAllPages<AssignmentRecord>((start, end) =>
      supabaseAdmin.rpc('get_app_session_agent_threats', {
        p_token_hash: hashToken(appToken),
        p_assignee_id: assigneeId,
      }, { count: 'exact' }).range(start, end));
    assignments = result.data;
    assignmentError = result.error;
  }

  if (assignmentError) return responseForDatabaseError(assignmentError);
  if (!assignments.length) return NextResponse.json([]);

  const cveIds = Array.from(new Set(assignments.map((assignment) => assignment.cve_id)));
  const endpointIds = Array.from(new Set(assignments.map((assignment) => assignment.endpoint_id)));
  const cveRecords = (await Promise.all(chunks(cveIds, BATCH_SIZE).map((batch) =>
    supabaseAdmin.from('cves').select('id, cve_id').in('id', batch),
  )));
  const endpointRecords = (await Promise.all(chunks(endpointIds, BATCH_SIZE).map((batch) =>
    supabaseAdmin.from('endpoints').select('id, hostname, environment').in('id', batch),
  )));
  const cveError = cveRecords.find(({ error }) => error)?.error;
  const endpointError = endpointRecords.find(({ error }) => error)?.error;
  if (cveError) return responseForDatabaseError(cveError);
  if (endpointError) return responseForDatabaseError(endpointError);

  const cveIdByRecordId = new Map(cveRecords.flatMap(({ data }) =>
    (data ?? []).map((cve) => [cve.id, cve.cve_id] as const),
  ));
  const endpointById = new Map(endpointRecords.flatMap(({ data }) =>
    (data ?? []).map((endpoint) => [endpoint.id, endpoint] as const),
  ));
  const findingRows: Array<{
    id: string;
    cve_id: string;
    description: string;
    severity: DashboardVulnerability['severity'];
    cvss_score: number;
    status: DashboardVulnerability['status'];
    endpoint_id: string;
    discovered_date: string;
    source_id: string | null;
    reference_urls: string[] | null;
    affected_packages: string[] | null;
  }> = [];
  for (const assignmentBatch of chunks(assignments, 50)) {
    const batchCveIds = Array.from(new Set(assignmentBatch
      .map((assignment) => cveIdByRecordId.get(assignment.cve_id))
      .filter((id): id is string => Boolean(id))));
    const batchEndpointIds = Array.from(new Set(assignmentBatch.map((assignment) => assignment.endpoint_id)));
    const result = await fetchAllPages((start, end) => supabaseAdmin
      .from('vulnerabilities')
      .select('id, cve_id, description, severity, cvss_score, status, endpoint_id, discovered_date, source_id, reference_urls, affected_packages', { count: 'exact' })
      .eq('source', 'osv')
      .in('cve_id', batchCveIds)
      .in('endpoint_id', batchEndpointIds)
      .order('id', { ascending: true })
      .range(start, end));
    if (result.error) return responseForDatabaseError(result.error);
    findingRows.push(...result.data);
  }

  const findingByKey = new Map(
    findingRows.map((finding) => [`${finding.endpoint_id}:${finding.cve_id}`, finding]),
  );
  const userIds = Array.from(new Set(assignments.flatMap((assignment) =>
    [assignment.assigned_to, assignment.triaged_by].filter((id): id is string => Boolean(id)),
  )));
  const userResults = await Promise.all(chunks(userIds, BATCH_SIZE).map((batch) =>
    supabaseAdmin.from('users').select('id, email, full_name').in('id', batch),
  ));
  const userError = userResults.find(({ error }) => error)?.error;
  if (userError) return responseForDatabaseError(userError);
  const userById = new Map(userResults.flatMap(({ data }) =>
    (data ?? []).map((user) => [user.id, user] as const),
  ));

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
      const assignmentStatus: AgentThreatAssignment['status'] =
        (['open', 'in_progress', 'resolved', 'false_positive'] as const)
          .find((candidate) => candidate === assignment.status) ?? 'open';
      const status: AgentThreatAssignment['status'] = assignmentStatus === 'false_positive'
        ? 'false_positive'
        : finding.status === 'resolved'
          ? 'resolved'
          : assignmentStatus;
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
