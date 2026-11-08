import { NextResponse } from 'next/server';

const CVE_ID_PATTERN = /^CVE-\d{4}-\d{4,}$/i;

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ cveId: string }> },
) {
  const { cveId } = await context.params;
  if (!CVE_ID_PATTERN.test(cveId)) {
    return NextResponse.json({ error: 'Invalid CVE identifier' }, { status: 400 });
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
