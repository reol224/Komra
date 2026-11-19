import type { AuditLogEntry } from '@/lib/auditLogger';
import type { AgentThreatAssignment, DashboardVulnerability } from '@/lib/dashboardDataService';

export type ReportType = 'vulnerability' | 'compliance' | 'incident' | 'threat-intelligence' | 'executive';
export type ReportStatus = 'draft' | 'ready' | 'published';

export interface ReportTable {
  heading: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

export interface GeneratedReport {
  id: string;
  title: string;
  type: ReportType;
  status: ReportStatus;
  createdAt: string;
  lastModified: string;
  author: string;
  description: string;
  tags: string[];
  summary: Array<[string, string | number]>;
  tables: ReportTable[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  periodDays: number;
}

export interface ReportSourceData {
  vulnerabilities: DashboardVulnerability[];
  threats: AgentThreatAssignment[];
  auditLogs: AuditLogEntry[];
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: 'vuln-weekly', name: 'Weekly Vulnerability Report', description: 'Vulnerabilities discovered in the last 7 days', type: 'vulnerability', periodDays: 7 },
  { id: 'incident-summary', name: 'Incident Summary', description: 'Assigned threats and their response status (last 30 days)', type: 'incident', periodDays: 30 },
  { id: 'compliance-audit', name: 'Compliance Audit', description: 'Audit-log activity, failures and privileged actions (last 30 days)', type: 'compliance', periodDays: 30 },
  { id: 'threat-brief', name: 'Threat Intelligence Brief', description: 'Top CVEs and affected endpoints (last 30 days)', type: 'threat-intelligence', periodDays: 30 },
  { id: 'executive-summary', name: 'Executive Summary', description: 'High-level security posture overview (last 30 days)', type: 'executive', periodDays: 30 },
];

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
const OPEN_STATUSES = new Set(['open', 'in_progress']);

/** Counts items by the string returned from the key function, sorted by count descending. */
function countBy<T>(items: T[], key: (item: T) => string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

/** Builds the severity distribution table shared by several report types. */
function severityTable(vulns: DashboardVulnerability[]): ReportTable {
  return {
    heading: 'Severity distribution',
    columns: ['Severity', 'Total', 'Open / In progress'],
    rows: SEVERITIES.map((severity) => {
      const matching = vulns.filter((v) => v.severity === severity);
      return [severity, matching.length, matching.filter((v) => OPEN_STATUSES.has(v.status)).length];
    }),
  };
}

/** Lists the most severe vulnerabilities first. */
function topFindingsTable(vulns: DashboardVulnerability[], limit = 25): ReportTable {
  const rank = (severity: string) => SEVERITIES.indexOf(severity as typeof SEVERITIES[number]);
  const rows = [...vulns]
    .sort((a, b) => rank(a.severity) - rank(b.severity) || b.cvss_score - a.cvss_score)
    .slice(0, limit)
    .map((v) => [v.cve_id, v.severity, v.cvss_score, v.status, v.endpoint_name, v.discovered_date?.slice(0, 10) ?? '']);
  return {
    heading: `Top findings (up to ${limit})`,
    columns: ['CVE', 'Severity', 'CVSS', 'Status', 'Endpoint', 'Discovered'],
    rows,
  };
}

/** Builds a report from live dashboard data for the chosen template. */
export function buildReport(
  template: ReportTemplate,
  data: ReportSourceData,
  author: string,
  now: Date = new Date(),
): GeneratedReport {
  const since = now.getTime() - template.periodDays * 24 * 60 * 60 * 1000;
  const inPeriod = (timestamp?: string | null) => !!timestamp && new Date(timestamp).getTime() >= since;
  const periodVulns = data.vulnerabilities.filter((v) => inPeriod(v.discovered_date));
  const periodThreats = data.threats.filter((t) => inPeriod(t.assignedAt || t.createdAt));
  const periodLogs = data.auditLogs.filter((l) => inPeriod(l.timestamp));
  const iso = now.toISOString();
  const periodLabel = `last ${template.periodDays} days`;

  const report: GeneratedReport = {
    id: `${template.id}-${now.getTime()}`,
    title: `${template.name} - ${now.toISOString().slice(0, 10)}`,
    type: template.type,
    status: 'ready',
    createdAt: iso,
    lastModified: iso,
    author,
    description: `${template.description}. Generated from live data.`,
    tags: [template.type, `${template.periodDays}d`],
    summary: [],
    tables: [],
  };

  switch (template.type) {
    case 'vulnerability':
      report.summary = [
        ['Period', periodLabel],
        ['New vulnerabilities', periodVulns.length],
        ['Critical', periodVulns.filter((v) => v.severity === 'critical').length],
        ['Still open', periodVulns.filter((v) => OPEN_STATUSES.has(v.status)).length],
        ['Resolved', periodVulns.filter((v) => v.status === 'resolved').length],
      ];
      report.tables = [severityTable(periodVulns), topFindingsTable(periodVulns)];
      break;
    case 'incident':
      report.summary = [
        ['Period', periodLabel],
        ['Assigned threats', periodThreats.length],
        ['Open / In progress', periodThreats.filter((t) => OPEN_STATUSES.has(t.status)).length],
        ['Resolved', periodThreats.filter((t) => t.status === 'resolved').length],
        ['False positives', periodThreats.filter((t) => t.status === 'false_positive').length],
      ];
      report.tables = [{
        heading: 'Assigned threats',
        columns: ['CVE', 'Priority', 'Status', 'Owner', 'Endpoint', 'Assigned'],
        rows: periodThreats.map((t) => [
          t.finding.cve_id, t.priority, t.status, t.owner.fullName || t.owner.email,
          t.finding.endpoint_name, (t.assignedAt || t.createdAt).slice(0, 10),
        ]),
      }];
      break;
    case 'compliance': {
      const failures = periodLogs.filter((l) => l.status === 'failure');
      report.summary = [
        ['Period', periodLabel],
        ['Audit events', periodLogs.length],
        ['Failed events', failures.length],
        ['Critical/high severity', periodLogs.filter((l) => l.severity === 'critical' || l.severity === 'high').length],
        ['Distinct users', new Set(periodLogs.map((l) => l.user_email).filter(Boolean)).size],
      ];
      report.tables = [
        { heading: 'Events by action', columns: ['Action', 'Events'], rows: countBy(periodLogs, (l) => l.action).slice(0, 20) },
        {
          heading: 'Failed events (most recent 25)',
          columns: ['Timestamp', 'User', 'Action', 'Resource', 'IP'],
          rows: failures.slice(0, 25).map((l) => [l.timestamp, l.user_email, l.action, l.resource_type, l.ip_address || '']),
        },
      ];
      break;
    }
    case 'threat-intelligence': {
      const byCve = countBy(periodVulns, (v) => v.cve_id).slice(0, 15);
      report.summary = [
        ['Period', periodLabel],
        ['Distinct CVEs', new Set(periodVulns.map((v) => v.cve_id)).size],
        ['Affected endpoints', new Set(periodVulns.map((v) => v.endpoint_id)).size],
        ['Critical/high CVEs', new Set(periodVulns.filter((v) => v.severity === 'critical' || v.severity === 'high').map((v) => v.cve_id)).size],
      ];
      report.tables = [
        { heading: 'Most widespread CVEs', columns: ['CVE', 'Affected endpoints'], rows: byCve },
        { heading: 'Most affected endpoints', columns: ['Endpoint', 'Findings'], rows: countBy(periodVulns, (v) => v.endpoint_name).slice(0, 15) },
      ];
      break;
    }
    case 'executive': {
      const openAll = data.vulnerabilities.filter((v) => OPEN_STATUSES.has(v.status));
      report.summary = [
        ['Period', periodLabel],
        ['Total open vulnerabilities', openAll.length],
        ['Open critical', openAll.filter((v) => v.severity === 'critical').length],
        ['Open high', openAll.filter((v) => v.severity === 'high').length],
        ['Threats assigned', periodThreats.length],
        ['Threats resolved', periodThreats.filter((t) => t.status === 'resolved').length],
        ['Failed audit events', periodLogs.filter((l) => l.status === 'failure').length],
      ];
      report.tables = [severityTable(data.vulnerabilities)];
      break;
    }
  }
  return report;
}

/** Escapes a CSV cell and prevents spreadsheet formula evaluation. */
function csvCell(value: string | number): string {
  const text = String(value ?? '');
  return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
}

/** Serializes a report as CSV with a section per table. */
export function reportToCsv(report: GeneratedReport): string {
  const lines: string[] = [[report.title].map(csvCell).join(','), ''];
  lines.push(['Summary', 'Value'].map(csvCell).join(','));
  report.summary.forEach(([label, value]) => lines.push([label, value].map(csvCell).join(',')));
  for (const table of report.tables) {
    lines.push('', csvCell(table.heading), table.columns.map(csvCell).join(','));
    table.rows.forEach((row) => lines.push(row.map(csvCell).join(',')));
  }
  return lines.join('\r\n');
}

/** Escapes text for inclusion in HTML. */
function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/** Renders a report as a standalone printable HTML document. */
export function reportToHtml(report: GeneratedReport): string {
  const tables = report.tables.map((table) => `
    <h2>${escapeHtml(table.heading)}</h2>
    <table><thead><tr>${table.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
    <tbody>${table.rows.map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${table.columns.length}">No data</td></tr>`}</tbody></table>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title>
<style>body{font-family:Arial,sans-serif;margin:32px;color:#111}table{border-collapse:collapse;width:100%;margin-bottom:24px;font-size:12px}th,td{border:1px solid #ccc;padding:4px 8px;text-align:left}th{background:#f1f5f9}</style></head>
<body><h1>${escapeHtml(report.title)}</h1><p>${escapeHtml(report.description)}<br>Generated ${escapeHtml(new Date(report.createdAt).toLocaleString())} by ${escapeHtml(report.author)}</p>
<h2>Summary</h2><table><tbody>${report.summary.map(([l, v]) => `<tr><th>${escapeHtml(l)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</tbody></table>${tables}</body></html>`;
}

/** Produces a short plain-text summary used for the email body. */
export function reportToText(report: GeneratedReport): string {
  return [report.title, report.description, '', ...report.summary.map(([l, v]) => `${l}: ${v}`)].join('\n');
}
