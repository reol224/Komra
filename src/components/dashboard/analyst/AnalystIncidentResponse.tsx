'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, Shield, User, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AgentThreatAssignment, DashboardDataService } from '@/lib/dashboardDataService';
import { getSeverityBadgeClassName, getStatusBadgeClassName } from '@/lib/dashboardBadgeStyles';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const dashboardService = new DashboardDataService();

export default function AnalystIncidentResponse() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AgentThreatAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      console.error('Unable to load analyst incident assignments:', error);
      setLoadError(error instanceof Error ? error.message : 'Unable to load assigned findings.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const currentAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? assignments[0] ?? null,
    [assignments, selectedAssignmentId],
  );
  const openCount = assignments.filter(({ status }) => status === 'open').length;
  const investigatingCount = assignments.filter(({ status }) => status === 'in_progress').length;
  const resolvedCount = assignments.filter(({ status }) => status === 'resolved').length;
  const criticalCount = assignments.filter(({ finding }) => finding.severity === 'critical').length;

  const getSeverityColor = getSeverityBadgeClassName;
  const getStatusColor = getStatusBadgeClassName;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-5 w-5" />
        <div>
          <h3 className="text-lg font-semibold">Incident Response Queue</h3>
          <p className="text-sm text-muted-foreground">OSV findings assigned to your account</p>
        </div>
      </div>

      {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardContent className="flex items-center gap-2 pt-6">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div><div className="text-2xl font-bold text-red-600">{isLoading ? '...' : loadError ? 'Unavailable' : openCount}</div><div className="text-sm text-muted-foreground">Open</div></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-2 pt-6">
          <Clock className="h-5 w-5 text-yellow-600" />
          <div><div className="text-2xl font-bold text-yellow-600">{isLoading ? '...' : loadError ? 'Unavailable' : investigatingCount}</div><div className="text-sm text-muted-foreground">In Progress</div></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-2 pt-6">
          <Shield className="h-5 w-5 text-blue-600" />
          <div><div className="text-2xl font-bold">{isLoading ? '...' : loadError ? 'Unavailable' : resolvedCount}</div><div className="text-sm text-muted-foreground">Resolved</div></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-2 pt-6">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div><div className="text-2xl font-bold text-red-600">{isLoading ? '...' : loadError ? 'Unavailable' : criticalCount}</div><div className="text-sm text-muted-foreground">Critical Findings</div></div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Assigned Findings</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading assigned findings...</p>
              ) : loadError ? (
                <p className="py-4 text-center text-sm text-destructive">Assigned findings are unavailable.</p>
              ) : assignments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No OSV findings are assigned to you.</p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <button
                      type="button"
                      key={assignment.id}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        currentAssignment?.id === assignment.id
                          ? 'border-blue-400 bg-blue-100 text-slate-900'
                          : 'text-card-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedAssignmentId(assignment.id)}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Badge className={`${getSeverityColor(assignment.finding.severity)} capitalize`}>
                          {assignment.finding.severity}
                        </Badge>
                        <Badge className={`${getStatusColor(assignment.status)} capitalize`}>
                          {assignment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h4
                        className={`text-sm font-medium ${
                          currentAssignment?.id === assignment.id ? 'text-black' : 'text-white'
                        }`}
                      >
                        {assignment.finding.cve_id}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {assignment.finding.description || 'No description available.'}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Owner: {assignment.owner.fullName || assignment.owner.email}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {currentAssignment ? (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-white">{currentAssignment.finding.cve_id}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={`${getSeverityColor(currentAssignment.finding.severity)} capitalize`}>
                      {currentAssignment.finding.severity}
                    </Badge>
                    <Badge className={`${getStatusColor(currentAssignment.status)} capitalize`}>
                      {currentAssignment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="details">Finding</TabsTrigger>
                    <TabsTrigger value="assignment">Assignment</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-medium">Description</h4>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {currentAssignment.finding.description || 'No description available.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="mb-1 font-medium">Affected Endpoint</h4>
                        <p className="text-sm text-muted-foreground">
                          {currentAssignment.finding.endpoint_name} ({currentAssignment.finding.environment})
                        </p>
                      </div>
                      <div>
                        <h4 className="mb-1 font-medium">CVSS Score</h4>
                        <p className="text-sm text-muted-foreground">
                          {currentAssignment.finding.cvss_score ?? 'Not available'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 font-medium">Affected Packages</h4>
                      {currentAssignment.finding.affected_packages.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentAssignment.finding.affected_packages.map((pkg) => (
                            <Badge key={pkg} variant="outline">{pkg}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Package details unavailable.</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Detected {new Date(currentAssignment.finding.discovered_date).toLocaleString()}
                    </p>
                    <a
                      href={`https://osv.dev/vulnerability/${encodeURIComponent(currentAssignment.finding.source_id || currentAssignment.finding.cve_id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-blue-600 underline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open OSV record
                    </a>
                  </TabsContent>
                  <TabsContent value="assignment" className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="mt-0.5 h-4 w-4" />
                      <div>
                        <h4 className="font-medium">Owner</h4>
                        <p className="text-sm text-muted-foreground">
                          {currentAssignment.owner.fullName || currentAssignment.owner.email}
                        </p>
                        {currentAssignment.owner.fullName && (
                          <p className="text-xs text-muted-foreground">{currentAssignment.owner.email}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Priority</h4>
                      <p className="text-sm capitalize text-muted-foreground">{currentAssignment.priority}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Assigned</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentAssignment.assignedAt
                          ? new Date(currentAssignment.assignedAt).toLocaleString()
                          : new Date(currentAssignment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {currentAssignment.assignedBy && (
                      <div>
                        <h4 className="font-medium">Assigned by</h4>
                        <p className="text-sm text-muted-foreground">
                          {currentAssignment.assignedBy.fullName || currentAssignment.assignedBy.email}
                        </p>
                      </div>
                    )}
                    {currentAssignment.notes && (
                      <div>
                        <h4 className="font-medium">Assignment notes</h4>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{currentAssignment.notes}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {isLoading ? 'Loading assigned findings...' : 'Select an assigned finding to view details.'}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
