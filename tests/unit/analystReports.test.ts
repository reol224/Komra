import { describe, it, expect } from 'vitest';
import { buildReport, reportToCsv, reportToHtml, REPORT_TEMPLATES } from '@/lib/analystReports';

const now = new Date('2026-01-10T00:00:00Z');
const vuln = (over: Record<string, unknown>) => ({
  id: 'v', cve_id: 'CVE-1', description: '', severity: 'critical', cvss_score: 9, status: 'open',
  endpoint_id: 'e1', endpoint_name: 'host-1', environment: 'prod', discovered_date: '2026-01-09T00:00:00Z',
  affected_packages: [], ...over,
}) as never;

describe('buildReport', () => {
  it('only counts vulnerabilities in the template period', () => {
    const template = REPORT_TEMPLATES.find((t) => t.id === 'vuln-weekly')!;
    const report = buildReport(template, {
      vulnerabilities: [vuln({}), vuln({ discovered_date: '2025-12-01T00:00:00Z' })],
      threats: [],
      auditLogs: [],
    }, 'a@b.c', now);
    expect(report.summary).toContainEqual(['New vulnerabilities', 1]);
  });

  it('neutralizes formulas in CSV and escapes HTML', () => {
    const template = REPORT_TEMPLATES.find((t) => t.id === 'vuln-weekly')!;
    const report = buildReport(template, {
      vulnerabilities: [vuln({ endpoint_name: '=cmd|<b>' })], threats: [], auditLogs: [],
    }, 'a@b.c', now);
    expect(reportToCsv(report)).toContain(`"'=cmd|<b>"`);
    expect(reportToHtml(report)).toContain('&lt;b&gt;');
  });
});
