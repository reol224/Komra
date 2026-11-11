const severityBadgeClasses: Record<string, string> = {
  critical: "border-red-700 bg-red-600 text-white",
  error: "border-red-700 bg-red-600 text-white",
  high: "border-orange-700 bg-orange-600 text-white",
  medium: "border-yellow-600 bg-yellow-300 text-yellow-950",
  warning: "border-yellow-600 bg-yellow-300 text-yellow-950",
  low: "border-blue-700 bg-blue-600 text-white",
  info: "border-blue-700 bg-blue-600 text-white",
  none: "border-slate-600 bg-slate-500 text-white",
};

const severityTextClasses: Record<string, string> = {
  critical: "text-red-600",
  error: "text-red-600",
  high: "text-orange-600",
  medium: "text-yellow-600",
  warning: "text-yellow-600",
  low: "text-blue-600",
  info: "text-blue-600",
};

const severityChartColors: Record<string, string> = {
  critical: "#dc2626",
  error: "#dc2626",
  high: "#ea580c",
  medium: "#fde047",
  warning: "#fde047",
  low: "#2563eb",
  info: "#2563eb",
};

const redStatusClasses = "border-red-700 bg-red-600 text-white";
const amberStatusClasses = "border-yellow-600 bg-yellow-300 text-yellow-950";
const greenStatusClasses = "border-green-700 bg-green-600 text-white";
const slateStatusClasses = "border-slate-600 bg-slate-500 text-white";

const statusBadgeClasses: Record<string, string> = {
  open: redStatusClasses,
  active: redStatusClasses,
  failure: redStatusClasses,
  failed: redStatusClasses,
  error: redStatusClasses,
  suspended: redStatusClasses,
  overdue: redStatusClasses,
  non_compliant: redStatusClasses,
  in_progress: amberStatusClasses,
  investigating: amberStatusClasses,
  mitigating: amberStatusClasses,
  pending: amberStatusClasses,
  acknowledged: amberStatusClasses,
  partial: amberStatusClasses,
  warning: amberStatusClasses,
  resolved: greenStatusClasses,
  closed: greenStatusClasses,
  completed: greenStatusClasses,
  success: greenStatusClasses,
  healthy: greenStatusClasses,
  compliant: greenStatusClasses,
  ready: greenStatusClasses,
  published: greenStatusClasses,
  enabled: greenStatusClasses,
  draft: slateStatusClasses,
  inactive: slateStatusClasses,
  disabled: slateStatusClasses,
  cancelled: slateStatusClasses,
  false_positive: slateStatusClasses,
  vulnerable: amberStatusClasses,
};

const statusTextClasses: Record<string, string> = {
  open: "text-red-600",
  active: "text-red-600",
  failure: "text-red-600",
  failed: "text-red-600",
  error: "text-red-600",
  suspended: "text-red-600",
  overdue: "text-red-600",
  non_compliant: "text-red-600",
  in_progress: "text-yellow-600",
  investigating: "text-yellow-600",
  mitigating: "text-yellow-600",
  pending: "text-yellow-600",
  acknowledged: "text-yellow-600",
  partial: "text-yellow-600",
  warning: "text-yellow-600",
  resolved: "text-green-600",
  closed: "text-green-600",
  completed: "text-green-600",
  success: "text-green-600",
  healthy: "text-green-600",
  compliant: "text-green-600",
  ready: "text-green-600",
  published: "text-green-600",
  enabled: "text-green-600",
};

const statusChartColors: Record<string, string> = {
  open: "#dc2626",
  active: "#dc2626",
  failure: "#dc2626",
  failed: "#dc2626",
  error: "#dc2626",
  in_progress: "#fde047",
  investigating: "#fde047",
  mitigating: "#fde047",
  pending: "#fde047",
  acknowledged: "#fde047",
  partial: "#fde047",
  warning: "#fde047",
  resolved: "#16a34a",
  closed: "#16a34a",
  completed: "#16a34a",
  success: "#16a34a",
  healthy: "#16a34a",
  compliant: "#16a34a",
};

const accountStatusBadgeClasses: Record<string, string> = {
  active: greenStatusClasses,
  inactive: slateStatusClasses,
  suspended: redStatusClasses,
};

/** Returns the shared badge palette for severity and priority labels. */
export function getSeverityBadgeClassName(severity: string): string {
  return severityBadgeClasses[severity.trim().toLowerCase()] ?? slateStatusClasses;
}

/** Returns the shared text color for severity and priority counts. */
export function getSeverityTextClassName(severity: string): string {
  return severityTextClasses[severity.trim().toLowerCase()] ?? "text-slate-600";
}

/** Returns the shared chart color for severity and priority data. */
export function getSeverityChartColor(severity: string): string {
  return severityChartColors[severity.trim().toLowerCase()] ?? "#64748b";
}

/** Returns the shared badge palette for workflow, audit, and health statuses. */
export function getStatusBadgeClassName(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return statusBadgeClasses[normalized] ?? slateStatusClasses;
}

/** Returns the shared text color for workflow and health status counts. */
export function getStatusTextClassName(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return statusTextClasses[normalized] ?? "text-slate-600";
}

/** Returns the shared chart color for workflow and health statuses. */
export function getStatusChartColor(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return statusChartColors[normalized] ?? "#64748b";
}

/** Returns account-state colors without conflating an active account with an active alert. */
export function getAccountStatusBadgeClassName(status: string): string {
  return accountStatusBadgeClasses[status.trim().toLowerCase()] ?? slateStatusClasses;
}
