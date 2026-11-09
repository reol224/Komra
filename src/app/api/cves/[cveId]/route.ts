import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const CVE_ID_PATTERN = /^CVE-\d{4}-\d{4,}$/i;
const SESSION_COOKIE = 'komra_demo_session';
const RATE_LIMIT_WINDOW_SECONDS = 30;
const MAX_NVD_REQUESTS_WITHOUT_KEY = 4;
const MAX_NVD_REQUESTS_WITH_KEY = 40;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface NvdCveResponse {
  vulnerabilities?: Array<{
    cve: {
      id: string;
      descriptions?: Array<{ lang: string; value: string }>;
      published?: string;
      lastModified?: string;
      references?: Array<{ url: string; tags?: string[] }>;
      metrics?: {
        cvssMetricV40?: Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>;
        cvssMetricV31?: Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>;
        cvssMetricV30?: Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>;
        cvssMetricV2?: Array<{
          cvssData?: { baseScore?: number; baseSeverity?: string };
          baseSeverity?: string;
        }>;
      };
    };
  }>;
}

async function authorizeCveLookup(request: NextRequest): Promise<Response | null> {
  let userId: string | null = null;
  const appToken = request.cookies.get(SESSION_COOKIE)?.value;

  if (appToken) {
    const tokenHash = createHash('sha256').update(appToken).digest('hex');
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('application_sessions')
      .select('user_id')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionError) {
      console.error('Unable to verify CVE lookup application session:', sessionError);
      return NextResponse.json({ error: 'Unable to verify sign-in session.' }, { status: 500 });
    }
    userId = session?.user_id ?? null;
  } else {
    const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!accessToken) {
      return NextResponse.json({ error: 'Sign in to view CVE details.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'The sign-in session is invalid or expired.' }, { status: 401 });
    }
    userId = user.id;
  }

  if (!userId) {
    return NextResponse.json({ error: 'The sign-in session is invalid or expired.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) {
    console.error('Unable to load CVE lookup user role:', profileError);
    return NextResponse.json({ error: 'Unable to authorize CVE lookup.' }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: 'You are not authorized to view CVE details.' }, { status: 403 });
  }

  const { data: permission, error: permissionError } = await supabaseAdmin
    .from('role_permissions')
    .select('granted')
    .eq('role', profile.role)
    .eq('permission_id', 'vulnerabilities.view')
    .maybeSingle();
  if (permissionError) {
    console.error('Unable to verify CVE lookup permission:', permissionError);
    return NextResponse.json({ error: 'Unable to authorize CVE lookup.' }, { status: 500 });
  }
  if (permission?.granted !== true) {
    return NextResponse.json({ error: 'You are not authorized to view CVE details.' }, { status: 403 });
  }

  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cveId: string }> },
) {
  const { cveId } = await context.params;
  if (!CVE_ID_PATTERN.test(cveId)) {
    return NextResponse.json({ error: 'Invalid CVE identifier' }, { status: 400 });
  }

  const authorizationError = await authorizeCveLookup(request);
  if (authorizationError) return authorizationError;

  const { data: rateLimitAllowed, error: rateLimitError } = await supabaseAdmin.rpc(
    'consume_nvd_cve_rate_limit',
    {
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      p_max_requests: process.env.NVD_API_KEY
        ? MAX_NVD_REQUESTS_WITH_KEY
        : MAX_NVD_REQUESTS_WITHOUT_KEY,
    },
  );
  if (rateLimitError) {
    console.error('Unable to enforce NVD CVE rate limit:', rateLimitError);
    return NextResponse.json({ error: 'Unable to retrieve CVE details right now.' }, { status: 503 });
  }
  if (rateLimitAllowed !== true) {
    return NextResponse.json(
      { error: 'CVE lookup rate limit exceeded. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(RATE_LIMIT_WINDOW_SECONDS) } },
    );
  }

  try {
    const headers = new Headers({ Accept: 'application/json' });
    if (process.env.NVD_API_KEY) {
      headers.set('apiKey', process.env.NVD_API_KEY);
    }

    const response = await fetch(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cveId.toUpperCase())}`,
      { headers, signal: AbortSignal.timeout(15000), next: { revalidate: 3600 } },
    );

    if (!response.ok) {
      console.error(`NVD CVE request failed with status ${response.status}`);
      return NextResponse.json(
        { error: 'NVD is temporarily unavailable. Try again later.' },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const result = (await response.json()) as NvdCveResponse;
    const cve = result.vulnerabilities?.[0]?.cve;
    if (!cve) {
      return NextResponse.json({ error: 'CVE was not found in NVD.' }, { status: 404 });
    }

    const metric =
      cve.metrics?.cvssMetricV40?.[0] ??
      cve.metrics?.cvssMetricV31?.[0] ??
      cve.metrics?.cvssMetricV30?.[0] ??
      cve.metrics?.cvssMetricV2?.[0];
    const metricSeverity = metric && 'baseSeverity' in metric
      ? metric.baseSeverity
      : null;

    return NextResponse.json({
      id: cve.id,
      description: cve.descriptions?.find((description) => description.lang === 'en')?.value ?? null,
      cvssScore: metric?.cvssData?.baseScore ?? null,
      severity: metric?.cvssData?.baseSeverity ?? metricSeverity,
      published: cve.published ?? null,
      lastModified: cve.lastModified ?? null,
      references: cve.references ?? [],
      url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
    });
  } catch (error) {
    console.error('Failed to retrieve CVE details from NVD:', error);
    return NextResponse.json(
      { error: 'Unable to retrieve CVE details from NVD.' },
      { status: 502 },
    );
  }
}
