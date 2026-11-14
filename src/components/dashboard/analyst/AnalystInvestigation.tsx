'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Database, Network, FileText, Download, Play, RefreshCw } from 'lucide-react';
import { getSeverityBadgeClassName } from '@/lib/dashboardBadgeStyles';
import { auditLogger, AuditLogEntry } from '@/lib/auditLogger';

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  status_code?: number;
}

interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  query: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  matches: number;
}

const LOG_PAGE_SIZE = 1000;

/** Escapes a CSV cell and prevents spreadsheet formula evaluation. */
export function escapeCsvValue(value: string | number | undefined): string {
  const stringValue = String(value ?? '');
  const safeValue = /^[=+\-@\t\r]/.test(stringValue) ? `'${stringValue}` : stringValue;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

/** Returns the inclusive start timestamp for a supported log-search range. */
function getLogSearchStartDate(timeRange: string): string {
  const rangeMilliseconds: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() - (rangeMilliseconds[timeRange] ?? rangeMilliseconds['1h'])).toISOString();
}

/** Converts a persisted audit entry into the fields used by Log Search. */
function mapAuditLogEntry(entry: AuditLogEntry): LogEntry {
  const sourceCandidate =
    entry.metadata?.log_source_type
    || entry.metadata?.source_type
    || entry.resource_type;
  const source = typeof sourceCandidate === 'string' && sourceCandidate
    ? sourceCandidate
    : 'application';
  const detailMessage = Object.entries(entry.details || {})
    .map(([key, value]) => {
      const readableValue = typeof value === 'string'
        ? value
        : JSON.stringify(value) ?? String(value);
      return `${key.replace(/_/g, ' ')}: ${readableValue}`;
    })
    .join(' · ');
  const level: LogEntry['level'] = entry.severity === 'critical'
    ? 'critical'
    : entry.status === 'failure' || entry.severity === 'high'
      ? 'error'
      : entry.status === 'warning' || entry.severity === 'medium'
        ? 'warning'
        : 'info';
  const endpoint = entry.details?.endpoint;
  const statusCode = entry.details?.status_code;
  const ipAddress = entry.ip_address || entry.details?.ip_address || entry.metadata?.ip_address;

  return {
    id: entry.id || `${entry.timestamp}:${entry.action}:${entry.user_id || entry.user_email}`,
    timestamp: entry.timestamp,
    source,
    level,
    message: detailMessage ? `${entry.action}: ${detailMessage}` : entry.action,
    user_email: entry.user_email,
    ip_address: typeof ipAddress === 'string' ? ipAddress : undefined,
    user_agent: entry.user_agent,
    endpoint: typeof endpoint === 'string' ? endpoint : entry.resource_id,
    status_code: typeof statusCode === 'number' ? statusCode : undefined,
  };
}

/** Renders persisted audit logs and investigation tools for analysts. */
export default function AnalystInvestigation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [correlationQuery, setCorrelationQuery] = useState('');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [logLoadError, setLogLoadError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const correlationRules: CorrelationRule[] = [
    {
      id: '1',
      name: 'Brute Force Detection',
      description: 'Detects multiple failed login attempts from same IP',
      query: 'source:auth-service AND level:error AND message:*failed*login* | stats count by ip_address | where count > 5',
      severity: 'high',
      enabled: true,
      matches: 3
    },
    {
      id: '2',
      name: 'SQL Injection Pattern',
      description: 'Identifies potential SQL injection attempts',
      query: 'message:*SELECT* OR message:*UNION* OR message:*DROP* | where status_code >= 400',
      severity: 'critical',
      enabled: true,
      matches: 1
    },
    {
      id: '3',
      name: 'Privilege Escalation',
      description: 'Detects attempts to access admin resources',
      query: 'endpoint:*/admin/* AND status_code:401 | stats count by ip_address',
      severity: 'medium',
      enabled: true,
      matches: 2
    },
    {
      id: '4',
      name: 'Data Exfiltration',
      description: 'Large data transfers or bulk queries',
      query: 'source:database* AND message:*SELECT* | where response_size > 1MB',
      severity: 'high',
      enabled: false,
      matches: 0
    }
  ];

  useEffect(() => {
    let isCurrentRequest = true;

    const loadLogs = async () => {
      setIsLoadingLogs(true);
      setLogLoadError(null);
      try {
        const startDate = getLogSearchStartDate(selectedTimeRange);
        const entries: AuditLogEntry[] = [];
        let offset = 0;
        while (isCurrentRequest) {
          const page = await auditLogger.getAuditLogs({
            startDate,
            limit: LOG_PAGE_SIZE,
            offset,
            throwOnError: true,
          });
          if (!isCurrentRequest) return;

          entries.push(...page);
          if (page.length < LOG_PAGE_SIZE) break;
          offset += page.length;
        }
        if (isCurrentRequest) {
          setLogEntries(entries.map(mapAuditLogEntry));
        }
      } catch (error) {
        if (isCurrentRequest) {
          console.error('Unable to load persisted logs for Analyst Investigation:', error);
          setLogEntries([]);
          setLogLoadError(error instanceof Error ? error.message : 'Unable to load logs.');
        }
      } finally {
        if (isCurrentRequest) setIsLoadingLogs(false);
      }
    };

    void loadLogs();
    return () => {
      isCurrentRequest = false;
    };
  }, [selectedTimeRange, refreshVersion]);

  const availableSources = useMemo(
    () => Array.from(new Set(logEntries.map(({ source }) => source))).sort(),
    [logEntries],
  );

  const filteredLogs = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return logEntries.filter((log) => {
      const matchesSearch = !search || [
        log.message,
        log.source,
        log.ip_address || '',
        log.user_email || '',
        log.user_agent || '',
        log.endpoint || '',
      ].some((value) => value.toLowerCase().includes(search));
      const matchesSource = selectedSource === 'all' || log.source === selectedSource;
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
      return matchesSearch && matchesSource && matchesLevel;
    });
  }, [logEntries, searchQuery, selectedSource, selectedLevel]);

  const getLevelColor = getSeverityBadgeClassName;
  const getSeverityColor = getSeverityBadgeClassName;

  /** Reports the selected predefined rule until correlation execution is implemented. */
  const handleRunCorrelation = (ruleId: string) => {
    console.log('Running correlation rule:', ruleId);
  };

  /** Downloads the currently filtered log results as a formula-safe CSV file. */
  const handleExportLogs = () => {
    const columns = ['timestamp', 'source', 'level', 'message', 'user_email', 'ip_address', 'user_agent', 'endpoint', 'status_code'];
    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.source,
      log.level,
      log.message,
      log.user_email,
      log.ip_address,
      log.user_agent,
      log.endpoint,
      log.status_code,
    ].map(escapeCsvValue).join(','));
    const csv = [columns.map(escapeCsvValue).join(','), ...rows].join('\r\n');
    const objectUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const downloadLink = document.createElement('a');
    downloadLink.href = objectUrl;
    downloadLink.download = `audit-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    downloadLink.click();
    URL.revokeObjectURL(objectUrl);
  };

  /** Reports a custom query until correlation execution is implemented. */
  const handleRunCustomQuery = () => {
    console.log('Running custom correlation query:', correlationQuery);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Investigation Workspace</h3>
        </div>
        <Button
          onClick={handleExportLogs}
          disabled={isLoadingLogs || filteredLogs.length === 0}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export Results</span>
        </Button>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Log Search</span>
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center space-x-2">
            <Network className="h-4 w-4" />
            <span>Correlation Tools</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Analysis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Search Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedTimeRange}
                  onValueChange={(value) => {
                    setSelectedTimeRange(value);
                    setSelectedSource('all');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">Last 15 minutes</SelectItem>
                    <SelectItem value="1h">Last hour</SelectItem>
                    <SelectItem value="6h">Last 6 hours</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {availableSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.replace(/[_-]/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Log Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Log Entries ({filteredLogs.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefreshVersion((version) => version + 1)}
                  disabled={isLoadingLogs}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading persisted audit logs...</p>
              ) : logLoadError ? (
                <p role="alert" className="py-8 text-center text-sm text-destructive">{logLoadError}</p>
              ) : filteredLogs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {logEntries.length === 0
                    ? 'No audit logs were recorded in this time range.'
                    : 'No logs match the selected search and filters.'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
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
                          <Badge variant="outline">{log.source.replace(/[_-]/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getLevelColor(log.level)} capitalize`}>
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md truncate" title={log.message}>{log.message}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{log.ip_address || '-'}</div>
                        </TableCell>
                        <TableCell>
                          {log.endpoint && (
                            <div className="text-xs text-gray-500">
                              {log.endpoint} {log.status_code && `(${log.status_code})`}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          {/* Custom Query */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Correlation Query</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your correlation query (e.g., source:web-server* AND level:error | stats count by ip_address)"
                  value={correlationQuery}
                  onChange={(e) => setCorrelationQuery(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={handleRunCustomQuery} disabled={!correlationQuery.trim()}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Query
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Predefined Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Correlation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge className={`${getSeverityColor(rule.severity)} capitalize`}>
                          {rule.severity}
                        </Badge>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                      <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded">
                        {rule.query}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{rule.matches}</div>
                        <div className="text-xs text-gray-500">Matches</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunCorrelation(rule.id)}
                        disabled={!rule.enabled}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {/* Analysis Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {logEntries.filter(l => l.level === 'critical' || l.level === 'error').length}
                </div>
                <div className="text-sm text-gray-500">Critical/Error Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {new Set(logEntries.map(l => l.ip_address).filter(Boolean)).size}
                </div>
                <div className="text-sm text-gray-500">Unique IP Addresses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {new Set(logEntries.map(l => l.source)).size}
                </div>
                <div className="text-sm text-gray-500">Active Sources</div>
              </CardContent>
            </Card>
          </div>

          {/* Top IPs */}
          <Card>
            <CardHeader>
              <CardTitle>Top IP Addresses by Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Error Rate</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono">203.0.113.42</TableCell>
                    <TableCell>4</TableCell>
                    <TableCell className="text-red-600">75%</TableCell>
                    <TableCell>2024-03-22 15:45:32</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono">192.168.1.105</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="text-yellow-600">0%</TableCell>
                    <TableCell>2024-03-22 15:44:18</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}