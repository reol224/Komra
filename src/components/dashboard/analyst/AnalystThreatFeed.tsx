'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, ExternalLink, RefreshCw, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AgentThreatAssignment, DashboardDataService } from '@/lib/dashboardDataService';
import { getSeverityBadgeClassName, getStatusBadgeClassName } from '@/lib/dashboardBadgeStyles';

const dashboardService = new DashboardDataService();

export default function AnalystThreatFeed() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AgentThreatAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadAssignments = useCallback(async () => {
    if (!user?.id) {
      setAssignments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      setAssignments(await dashboardService.getAssignedAgentThreats());
    } catch (error) {
      console.error('Unable to load assigned analyst threats:', error);
      setLoadError(error instanceof Error ? error.message : 'Unable to load assigned threats.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const filteredAssignments = useMemo(() => {
    const search = searchTerm.trim().toLocaleLowerCase();
    return assignments.filter(({ finding, owner, notes, status }) => {
      const matchesSearch = !search || [
        finding.cve_id,
        finding.description,
        finding.endpoint_name,
        finding.affected_packages.join(' '),
        owner.fullName || '',
        owner.email,
        notes || '',
      ].some((value) => value.toLocaleLowerCase().includes(search));
      const matchesSeverity = selectedSeverity === 'all' || finding.severity === selectedSeverity;
      const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [assignments, searchTerm, selectedSeverity, selectedStatus]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadAssignments();
  };

  const statusLabel = (status: AgentThreatAssignment['status']) => status.replace('_', ' ');
  const statusColor = getStatusBadgeClassName;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Assigned OSV Threats</h3>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} className="flex items-center space-x-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? '...' : loadError ? 'Unavailable' : assignments.filter(({ status }) => status === 'open').length}
              </div>
              <div className="text-sm text-muted-foreground">Open Assignments</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 pt-6">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {isLoading ? '...' : loadError ? 'Unavailable' : assignments.filter(({ status }) => status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">Under Investigation</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 pt-6">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? '...' : loadError ? 'Unavailable' : assignments.filter(({ finding }) =>
                  finding.severity === 'critical' || finding.severity === 'high'
                ).length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority Assignments</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
          <Input
            aria-label="Search assigned threats"
            placeholder="Search findings, endpoints, packages, or owners..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger aria-label="Filter by severity">
              <SelectValue placeholder="All severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger aria-label="Filter by assignment status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="false_positive">False positive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading assigned threats...</p>
      ) : loadError ? (
        <p role="alert" className="py-8 text-center text-sm text-destructive">{loadError}</p>
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {assignments.length === 0
              ? 'No OSV findings are assigned to you.'
              : 'No assigned findings match your filters.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const { finding } = assignment;
            const ownerName = assignment.owner.fullName || assignment.owner.email;
            const osvUrl = `https://osv.dev/vulnerability/${encodeURIComponent(finding.source_id || finding.cve_id)}`;
            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className={`${getSeverityBadgeClassName(finding.severity)} capitalize`}>
                          {finding.severity}
                        </Badge>
                        <Badge className={`${statusColor(assignment.status)} capitalize`}>
                          {statusLabel(assignment.status)}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {assignment.priority} priority
                        </Badge>
                        {finding.cvss_score !== null && <span className="text-sm font-bold">CVSS {finding.cvss_score}</span>}
                      </div>
                      <h4 className="text-lg font-semibold">
                        <a
                          href={osvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {finding.cve_id}
                        </a>
                      </h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {finding.description || 'No description available.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Endpoint: {finding.endpoint_name} ({finding.environment})</span>
                        <span>Owner: {ownerName}</span>
                        <span>Assigned: {assignment.assignedAt
                          ? new Date(assignment.assignedAt).toLocaleString()
                          : new Date(assignment.createdAt).toLocaleString()}</span>
                      </div>
                      {finding.affected_packages.length > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Affected packages: {finding.affected_packages.join(', ')}
                        </p>
                      )}
                      {assignment.notes && (
                        <p className="mt-2 text-sm"><span className="font-medium">Assignment notes:</span> {assignment.notes}</p>
                      )}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      <a
                        href={osvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open OSV
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
