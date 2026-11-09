"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { auditLogger, AuditLogEntry } from "@/lib/auditLogger";
import { useAuth } from "@/contexts/AuthContext";
import { filterAuditLogsBySourcePreferences, getAuditLogCountsBySource } from "@/lib/logSourceHelpers";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
  ip_address: string;
  user_agent: string;
  session_id: string;
  metadata: Record<string, unknown> | null;
  status: "success" | "failure" | "warning";
}

/** Converts structured audit details into a readable, compact string. */
function formatAuditDetails(details: AuditLogEntry["details"]): string {
  if (typeof details === "string") return details;
  return Object.entries(details)
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" · ");
}

/** Returns the ISO timestamp at the start of the selected audit time range. */
function getAuditStartDate(timeRange: string): string {
  const rangeHours: Record<string, number> = {
    "1h": 1,
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
    "90d": 24 * 90,
  };
  return new Date(Date.now() - (rangeHours[timeRange] ?? 24) * 60 * 60 * 1000).toISOString();
}

/** Converts a persisted audit entry into the shape rendered by this panel. */
function mapAuditLog(entry: AuditLogEntry): AuditLog {
  return {
    id: entry.id || `${entry.user_id}-${entry.timestamp}-${entry.action}`,
    timestamp: entry.timestamp,
    user: entry.user_email || "Unknown",
    action: entry.action,
    resource: [entry.resource_type, entry.resource_id].filter(Boolean).join("/") || "—",
    details: formatAuditDetails(entry.details || {}),
    severity: entry.severity,
    ip_address: entry.ip_address ? String(entry.ip_address) : "Unknown",
    user_agent: entry.user_agent || "Unknown",
    session_id: entry.session_id || "Unknown",
    metadata: entry.metadata && typeof entry.metadata === "object"
      ? entry.metadata as Record<string, unknown>
      : null,
    status: entry.status,
  };
}

/** Renders searchable, filterable, and exportable administrator audit logs. */
export default function AdminAuditTrail() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("24h");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [totalFetchedRows, setTotalFetchedRows] = useState(0);
  const loadRequestVersion = useRef(0);

  /** Loads the first audit-log page and discards results superseded by a newer refresh. */
  const loadAuditLogs = useCallback(async () => {
    const requestVersion = ++loadRequestVersion.current;
    setIsLoading(true);
    setLoadError(null);
    setAuditLogs([]);
    setHasMoreLogs(false);
    setPage(0);
    setTotalFetchedRows(0);
    setIsLoadingMore(false);
    const startDate = getAuditStartDate(selectedTimeRange);

    try {
      const entries = await auditLogger.getAuditLogs({
        startDate,
        limit: 1000,
        throwOnError: true,
      });
      if (requestVersion !== loadRequestVersion.current) return;
      
      const mappedLogs = entries.map(mapAuditLog);
      
      // Filter by user's enabled log sources
      if (user?.id) {
        const filtered = (await filterAuditLogsBySourcePreferences(
          mappedLogs,
          user.id
        )) as AuditLog[];
        if (requestVersion !== loadRequestVersion.current) return;

        setAuditLogs(filtered);
      } else {
        setAuditLogs(mappedLogs);
      }
      
      setTotalFetchedRows(entries.length);
      setHasMoreLogs(entries.length === 1000);
      setLastUpdatedAt(new Date());
      setPage(0);
    } catch (error) {
      if (requestVersion !== loadRequestVersion.current) return;
      console.error("Failed to load persisted audit logs:", error);
      setLoadError(error instanceof Error ? error.message : "Unable to load audit logs.");
    } finally {
      if (requestVersion === loadRequestVersion.current) setIsLoading(false);
    }
  }, [selectedTimeRange, user?.id]);

  /** Loads and filters the next audit-log page unless a refresh has superseded it. */
  const loadOlderLogs = async () => {
    const requestVersion = loadRequestVersion.current;
    const offset = totalFetchedRows;
    setIsLoadingMore(true);
    setLoadError(null);
    try {
      const entries = await auditLogger.getAuditLogs({
        startDate: getAuditStartDate(selectedTimeRange),
        limit: 1000,
        offset,
        throwOnError: true,
      });
      if (requestVersion !== loadRequestVersion.current) return;

      const mappedLogs = entries.map(mapAuditLog);
      let pageLogs = mappedLogs;

      if (user?.id) {
        pageLogs = (await filterAuditLogsBySourcePreferences(
          mappedLogs,
          user.id
        )) as AuditLog[];
        if (requestVersion !== loadRequestVersion.current) return;
      }

      setAuditLogs((current) => [...current, ...pageLogs]);
      setTotalFetchedRows((prev) => prev + entries.length);
      setHasMoreLogs(entries.length === 1000);
    } catch (error) {
      if (requestVersion !== loadRequestVersion.current) return;
      console.error("Failed to load older audit events:", error);
      setLoadError(error instanceof Error ? error.message : "Unable to load older audit events.");
    } finally {
      if (requestVersion === loadRequestVersion.current) setIsLoadingMore(false);
    }
  };

  const sourceTypeCounts = useMemo(
    () => user?.id ? getAuditLogCountsBySource(auditLogs) : {},
    [auditLogs, user?.id],
  );

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  const filteredLogs = useMemo(() => auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity =
      selectedSeverity === "all" || log.severity === selectedSeverity;
    const matchesStatus =
      selectedStatus === "all" || log.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  }), [auditLogs, searchTerm, selectedSeverity, selectedStatus]);
  const pageCount = Math.ceil(filteredLogs.length / pageSize);
  const visibleLogs = filteredLogs.slice(page * pageSize, (page + 1) * pageSize);
  const pageStart = filteredLogs.length === 0 ? 0 : page * pageSize + 1;
  const pageEnd = Math.min((page + 1) * pageSize, filteredLogs.length);

  /** Opens the details dialog for the selected audit event. */
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setCopiedLogId(false);
    setCopyError(null);
    setIsDetailDialogOpen(true);
  };

  /** Copies an event ID and records any clipboard failure for the dialog. */
  const copyEventId = async (eventId: string) => {
    try {
      await navigator.clipboard.writeText(eventId);
      setCopiedLogId(true);
      setCopyError(null);
    } catch (error) {
      console.error("Failed to copy audit event ID:", error);
      setCopiedLogId(false);
      setCopyError("Could not copy the event ID. Select and copy it manually.");
    }
  };

  /** Returns the badge classes associated with an audit severity. */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-violet-800 text-white border-violet-900";
      case "high":
        return "bg-red-600 text-white border-red-700";
      case "medium":
        return "bg-orange-600 text-white border-orange-700";
      case "low":
        return "bg-green-600 text-white border-green-700";
      default:
        return "";
    }
  };

  /** Returns the badge classes associated with an audit result status. */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-600 text-white border-green-700";
      case "failure":
        return "bg-red-600 text-white border-red-700";
      case "warning":
        return "bg-orange-600 text-white border-orange-700";
      default:
        return "";
    }
  };

  /** Downloads the currently filtered audit events as a CSV file. */
  const exportAuditLogs = () => {
    /** Escapes CSV values and neutralizes spreadsheet formula prefixes. */
    const csvEscape = (value: string) => {
      const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const csvContent = [
      [
        "ID",
        "Timestamp",
        "User",
        "Action",
        "Resource",
        "Details",
        "Severity",
        "Status",
        "IP Address",
        "User Agent",
        "Session ID",
        "Metadata",
      ],
      ...filteredLogs.map((log) => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.resource,
        log.details,
        log.severity,
        log.status,
        log.ip_address,
        log.user_agent,
        log.session_id,
        JSON.stringify(log.metadata || {}),
      ]),
    ]
      .map((row) => row.map((field) => csvEscape(String(field ?? ""))).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `audit-logs-${selectedTimeRange}-${filteredLogs.length}-events-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    void auditLogger.log(
      "AUDIT_LOGS_EXPORTED",
      "audit_logs",
      {
        time_range: selectedTimeRange,
        severity_filter: selectedSeverity,
        status_filter: selectedStatus,
        search_applied: Boolean(searchTerm.trim()),
        exported_event_count: filteredLogs.length,
        format: "csv",
      },
      {
        severity: "high",
        metadata: { action_category: "data_export", compliance_relevant: true },
        actorUserId: user?.id,
        actorUserEmail: user?.email,
      },
    );
  };

  /** Downloads one audit event as a formatted JSON file. */
  const exportSingleLog = (log: AuditLog) => {
    const logData = {
      "Event ID": log.id,
      Timestamp: new Date(log.timestamp).toLocaleString(),
      User: log.user,
      Action: log.action.replace(/_/g, " "),
      Resource: log.resource,
      Details: log.details,
      Severity: log.severity,
      Status: log.status,
      "IP Address": log.ip_address,
      "User Agent": log.user_agent,
      "Session ID": log.session_id,
      Metadata: log.metadata,
    };

    const jsonContent = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `audit-log-${log.id}-${new Date().toISOString().split("T")[0]}.json`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    void auditLogger.log(
      "AUDIT_EVENT_EXPORTED",
      "audit_logs",
      { event_id: log.id, format: "json" },
      {
        resourceId: log.id,
        severity: "medium",
        metadata: { action_category: "data_export", compliance_relevant: true },
        actorUserId: user?.id,
        actorUserEmail: user?.email,
      },
    );
  };

  return (
    <PermissionGuard
      permission="system.audit_logs"
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-slate-300">
                You don't have permission to view audit trail data.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              Access Control Audit Trail
            </h3>
          </div>
          <PermissionGuard permission="reports.download">
            <Button
              onClick={exportAuditLogs}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Logs</span>
            </Button>
          </PermissionGuard>
          <div className="flex items-center gap-3">
            {lastUpdatedAt && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdatedAt.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => void loadAuditLogs()} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedSeverity}
                onValueChange={(value) => {
                  setSelectedSeverity(value);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value);
                setPage(0);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={selectedTimeRange}
                onValueChange={setSelectedTimeRange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {hasMoreLogs && (
          <p role="status" className="text-sm text-amber-700">
            Showing the latest 1,000 audit events for this time range. Load older events to continue through the period.
          </p>
        )}
        {loadError && (
          <p role="alert" className="text-sm text-destructive">
            {loadError}
          </p>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{isLoading ? "…" : filteredLogs.length}</div>
              <div className="text-sm text-gray-500">Matching Events Loaded</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {
                  (isLoading ? [] : filteredLogs).filter(
                    (log) =>
                      log.severity === "critical" || log.severity === "high",
                  ).length
                }
              </div>
              <div className="text-sm text-gray-500">High Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? "…" : filteredLogs.filter((log) => log.status === "failure").length}
              </div>
              <div className="text-sm text-gray-500">Failed Actions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {isLoading ? "…" : new Set(filteredLogs.map((log) => log.user)).size}
              </div>
              <div className="text-sm text-gray-500">Unique Users</div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Events ({isLoading ? "…" : filteredLogs.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {lastUpdatedAt && `Last updated: ${lastUpdatedAt.toLocaleTimeString()}`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadAuditLogs()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </CardHeader>

          {/* Log Source Counts */}
          {Object.keys(sourceTypeCounts).length > 0 && (
            <div className="px-6 pb-4 flex gap-2 flex-wrap">
              {Object.entries(sourceTypeCounts).map(([sourceType, count]) => (
                <Badge key={sourceType} variant="secondary" className="capitalize">
                  {sourceType}: {count}
                </Badge>
              ))}
            </div>
          )}

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Loading audit events…</TableCell></TableRow>
                ) : loadError && auditLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-destructive">Audit events could not be loaded.</TableCell></TableRow>
                ) : visibleLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No audit events match the selected filters.</TableCell></TableRow>
                ) : visibleLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.user}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {log.action.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm text-gray-500">{log.details}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{log.resource}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`capitalize ${getSeverityColor(log.severity)}`}
                      >
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`capitalize ${getStatusColor(log.status)}`}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{log.ip_address}</div>
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={isDetailDialogOpen}
                        onOpenChange={setIsDetailDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-6">
                              {/* Basic Information */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Event ID
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <div className="break-all font-mono text-sm">
                                      {selectedLog.id}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => void copyEventId(selectedLog.id)}
                                    >
                                      {copiedLogId ? "Copied" : "Copy ID"}
                                    </Button>
                                  </div>
                                  {copyError && <p role="alert" className="mt-1 text-xs text-destructive">{copyError}</p>}
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Timestamp
                                  </label>
                                  <div className="text-sm">
                                    {new Date(
                                      selectedLog.timestamp,
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* User & Action Information */}
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    User
                                  </label>
                                  <div className="font-medium">
                                    {selectedLog.user}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Action
                                  </label>
                                  <div className="font-medium">
                                    {selectedLog.action.replace(/_/g, " ")}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Resource
                                  </label>
                                  <div
                                    className="font-mono text-sm p-2 rounded"
                                    style={{ backgroundColor: "#344256" }}
                                  >
                                    {selectedLog.resource}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Details
                                  </label>
                                  <div
                                    className="text-sm p-3 rounded"
                                    style={{ backgroundColor: "#344256" }}
                                  >
                                    {selectedLog.details}
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Status & Severity */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Severity
                                  </label>
                                  <div className="mt-1">
                                    <Badge
                                      className={`capitalize ${getSeverityColor(selectedLog.severity)}`}
                                    >
                                      {selectedLog.severity}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Status
                                  </label>
                                  <div className="mt-1">
                                    <Badge
                                      className={`capitalize ${getStatusColor(selectedLog.status)}`}
                                    >
                                      {selectedLog.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Technical Information */}
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    IP Address
                                  </label>
                                  <div className="font-mono text-sm">
                                    {selectedLog.ip_address}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    User Agent
                                  </label>
                                  <div
                                    className="text-sm p-2 rounded break-all"
                                    style={{ backgroundColor: "#344256" }}
                                  >
                                    {selectedLog.user_agent}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Session ID
                                  </label>
                                  <div className="break-all font-mono text-sm">
                                    {selectedLog.session_id}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Metadata
                                  </label>
                                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded p-3 text-xs" style={{ backgroundColor: "#344256" }}>
                                    {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                                  </pre>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsDetailDialogOpen(false)}
                                >
                                  Close
                                </Button>
                                <Button
                                  onClick={() => {
                                    exportSingleLog(selectedLog);
                                    setIsDetailDialogOpen(false);
                                  }}
                                >
                                  Export This Log
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Showing {pageStart}–{pageEnd} of {filteredLogs.length} loaded events
                </span>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Per page
                  <select
                    aria-label="Audit events per page"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(0);
                    }}
                    className="h-9 rounded-md border border-input bg-background px-2 text-foreground"
                  >
                    {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0 || isLoading}
                  aria-label="Previous audit events page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pageCount === 0 ? 0 : page + 1} of {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                  disabled={page >= pageCount - 1 || isLoading}
                  aria-label="Next audit events page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {hasMoreLogs && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => void loadOlderLogs()} disabled={isLoadingMore}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingMore ? "animate-spin" : ""}`} />
                  {isLoadingMore ? "Loading older events…" : "Load older events"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
