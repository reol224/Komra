'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
} from 'lucide-react';
import {
  AgentHealthEndpoint,
  DashboardDataService,
} from '@/lib/dashboardDataService';

const REPORT_FRESHNESS_MS = 5 * 60 * 1000;
const RESOURCE_ALERT_THRESHOLD = 85;
const dashboardService = new DashboardDataService();

function reportTime(endpoint: AgentHealthEndpoint): number | null {
  if (!endpoint.lastScan) return null;
  const timestamp = Date.parse(endpoint.lastScan);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatAge(timestamp: number | null, now: number): string {
  if (timestamp === null) return 'No report received';
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes === 0) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function average(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  if (available.length === 0) return null;
  return available.reduce((sum, value) => sum + value, 0) / available.length;
}

function formatPercentage(value: number | null): string {
  return value === null ? 'No data' : `${value.toFixed(1)}%`;
}

export default function AdminSystemHealth() {
  const [endpoints, setEndpoints] = useState<AgentHealthEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const now = Date.now();

  const loadSystemHealth = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setEndpoints(await dashboardService.getAgentSystemHealth());
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error('Unable to load agent system health:', error);
      setLoadError('Unable to load system health. Check the database connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSystemHealth();
    const interval = setInterval(() => void loadSystemHealth(), 30_000);
    return () => clearInterval(interval);
  }, [loadSystemHealth]);

  const reportingEndpoints = useMemo(
    () => endpoints.filter((endpoint) => {
      const timestamp = reportTime(endpoint);
      return timestamp !== null && now - timestamp <= REPORT_FRESHNESS_MS;
    }),
    [endpoints, now],
  );
  const latestReport = useMemo(
    () => endpoints.reduce<number | null>((latest, endpoint) => {
      const timestamp = reportTime(endpoint);
      return timestamp !== null && (latest === null || timestamp > latest) ? timestamp : latest;
    }, null),
    [endpoints],
  );
  const resourceSamples = reportingEndpoints
    .map((endpoint) => endpoint.resourceMetrics)
    .filter((metrics) => metrics !== null);
  const cpuUsage = average(resourceSamples.map((metrics) => metrics.cpu_usage_percent));
  const memoryUsage = average(resourceSamples.map((metrics) => metrics.memory_usage_percent));
  const diskUsage = average(resourceSamples.map((metrics) => metrics.disk_usage_percent));
  const runningServiceReports = endpoints.flatMap((endpoint) =>
    endpoint.runningServices.map((service) => ({
      service,
      endpoint,
      isFresh: reportingEndpoints.some((current) => current.id === endpoint.id),
    })),
  );
  const events = endpoints.flatMap((endpoint) => {
    const timestamp = reportTime(endpoint);
    if (timestamp === null) return [];
    const metrics = endpoint.resourceMetrics;
    const alerts: Array<{ time: number; level: 'warning'; message: string; hostname: string }> = [];
    if (metrics?.cpu_usage_percent !== null && metrics?.cpu_usage_percent !== undefined
      && metrics.cpu_usage_percent >= RESOURCE_ALERT_THRESHOLD) {
      alerts.push({
        time: timestamp,
        level: 'warning',
        message: `CPU usage was ${metrics.cpu_usage_percent.toFixed(1)}%`,
        hostname: endpoint.hostname,
      });
    }
    if (metrics?.memory_usage_percent !== null && metrics?.memory_usage_percent !== undefined
      && metrics.memory_usage_percent >= RESOURCE_ALERT_THRESHOLD) {
      alerts.push({
        time: timestamp,
        level: 'warning',
        message: `Memory usage was ${metrics.memory_usage_percent.toFixed(1)}%`,
        hostname: endpoint.hostname,
      });
    }
    if (metrics?.disk_usage_percent !== null && metrics?.disk_usage_percent !== undefined
      && metrics.disk_usage_percent >= RESOURCE_ALERT_THRESHOLD) {
      alerts.push({
        time: timestamp,
        level: 'warning',
        message: `Disk usage was ${metrics.disk_usage_percent.toFixed(1)}%`,
        hostname: endpoint.hostname,
      });
    }
    if (now - timestamp > REPORT_FRESHNESS_MS) {
      alerts.push({
        time: timestamp,
        level: 'warning',
        message: `Agent report is stale (${formatAge(timestamp, now)})`,
        hostname: endpoint.hostname,
      });
    }
    return alerts;
  }).sort((left, right) => right.time - left.time).slice(0, 8);

  const renderResourceMetric = (
    label: string,
    Icon: typeof Cpu,
    value: number | null,
  ) => (
    <div key={label}>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className="text-sm text-muted-foreground">{formatPercentage(value)}</span>
      </div>
      <Progress value={value ?? 0} className="h-2" />
    </div>
  );

  return (
    <PermissionGuard permission="system.health_monitoring" fallback={
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-300">You don't have permission to view system health data.</p>
      </div>
    }>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <h3 className="text-lg font-semibold">System Health &amp; Performance</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading...'
              : lastUpdatedAt
                ? `Last updated: ${lastUpdatedAt.toLocaleTimeString()}`
                : 'No dashboard refresh yet'}
          </div>
        </div>

        {loadError && (
          <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Server className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : `${reportingEndpoints.length}/${endpoints.length}`}
                </div>
                <div className="text-sm text-muted-foreground">Agents reporting</div>
                <div className="text-xs text-muted-foreground">Reports within 5 minutes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : formatAge(latestReport, now)}
                </div>
                <div className="text-sm text-muted-foreground">Latest agent report</div>
                <div className="text-xs text-muted-foreground">
                  {latestReport === null ? 'No agent reports received' : new Date(latestReport).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : resourceSamples.length}
                </div>
                <div className="text-sm text-muted-foreground">Resource samples</div>
                <div className="text-xs text-muted-foreground">Recent reports with telemetry</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <CheckCircle className="h-5 w-5 text-teal-600" />
              <div>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : runningServiceReports.length}
                </div>
                <div className="text-sm text-muted-foreground">Services reported running</div>
                <div className="text-xs text-muted-foreground">From latest stored endpoint reports</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
            <p className="text-sm text-muted-foreground">
              Average of agent measurements reported within the last 5 minutes
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="py-4 text-sm text-muted-foreground">Loading endpoint telemetry...</p>
            ) : resourceSamples.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No recent resource telemetry. Run the updated agent on an endpoint to report CPU, memory, and disk usage.
              </p>
            ) : (
              <div className="space-y-6">
                {renderResourceMetric('CPU usage', Cpu, cpuUsage)}
                {renderResourceMetric('Memory usage', MemoryStick, memoryUsage)}
                {renderResourceMetric('Disk usage', HardDrive, diskUsage)}
                <p className="text-xs text-muted-foreground">
                  {resourceSamples.length} of {reportingEndpoints.length} currently reporting endpoints provided each available measurement.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Services listed as running in each endpoint&apos;s latest agent report
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading service reports...</p>
            ) : runningServiceReports.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No running services were included in the latest endpoint reports.
              </p>
            ) : (
              <div className="space-y-3">
                {runningServiceReports.slice(0, 30).map(({ service, endpoint, isFresh }) => {
                  const timestamp = reportTime(endpoint);
                  return (
                    <div
                      key={`${endpoint.id}:${service}`}
                      className="flex items-center justify-between gap-4 rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{service}</div>
                        <div className="text-sm text-muted-foreground">
                          {endpoint.hostname} · {endpoint.osType}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant={isFresh ? 'default' : 'outline'}>
                          {isFresh ? 'Reported running' : 'Last report stale'}
                        </Badge>
                        <span className="hidden text-sm text-muted-foreground sm:inline">
                          {formatAge(timestamp, now)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {runningServiceReports.length > 30 && (
                  <p className="text-sm text-muted-foreground">
                    Showing 30 of {runningServiceReports.length} service/endpoint reports.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading agent alerts...</p>
            ) : events.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
                No resource threshold alerts or stale agent reports.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <div key={`${event.hostname}:${event.time}:${index}`} className="flex items-start gap-3 border-l-2 border-amber-400 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.hostname} · reported {formatAge(event.time, now)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
