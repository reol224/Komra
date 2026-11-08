'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle, Shield, TrendingUp, Clock, Eye, ExternalLink, Users, Calendar, UserCheck, AlertCircle, CheckCircle2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardDataService, DashboardVulnerability, ThreatAssignee } from '@/lib/dashboardDataService';
import { useAuth } from '@/contexts/AuthContext';

interface NvdCveDetails {
  id: string;
  description: string | null;
  cvssScore: number | null;
  severity: string | null;
  published: string | null;
  lastModified: string | null;
  references: Array<{ url: string; tags?: string[] }>;
  url: string;
}

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function AdminThreatSummary() {
  const { user } = useAuth();
  const [selectedThreat, setSelectedThreat] = useState<DashboardVulnerability | null>(null);
  const [assignmentDialog, setAssignmentDialog] = useState(false);
  const [escalationDialog, setEscalationDialog] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [teamMembers, setTeamMembers] = useState<ThreatAssignee[]>([]);
  const [assigneeError, setAssigneeError] = useState<string | null>(null);
  const [nvdDetails, setNvdDetails] = useState<NvdCveDetails | null>(null);
  const [isLoadingNvd, setIsLoadingNvd] = useState(false);
  const [nvdError, setNvdError] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [priority, setPriority] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationLevel, setEscalationLevel] = useState('');
  const [escalationNotes, setEscalationNotes] = useState('');
  
  const [vulnerabilities, setVulnerabilities] = useState<DashboardVulnerability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [findingsSearch, setFindingsSearch] = useState('');
  const [findingsSeverity, setFindingsSeverity] = useState('all');
  const [findingsStatus, setFindingsStatus] = useState('all');
  const [findingsPage, setFindingsPage] = useState(0);

  const loadThreatData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setVulnerabilities(await new DashboardDataService().getAgentVulnerabilities());
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error('Error loading agent vulnerability findings:', error);
      setLoadError('Unable to load vulnerability findings. Check the database connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadThreatData();
    const loadAssignees = async () => {
      try {
        setTeamMembers(await new DashboardDataService().getThreatAssignees());
      } catch (error) {
        console.error('Error loading threat assignees:', error);
        setAssigneeError('Unable to load team members.');
      }
    };
    void loadAssignees();

  }, [loadThreatData]);

  useEffect(() => {
    const cveId = selectedThreat?.cve_id;
    setNvdDetails(null);
    setNvdError(null);
    if (!cveId || !/^CVE-\d{4}-\d{4,}$/i.test(cveId)) {
      setIsLoadingNvd(false);
      return;
    }

    const controller = new AbortController();
    setIsLoadingNvd(true);
    fetch(`/api/cves/${encodeURIComponent(cveId)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Unable to load NVD details.');
        }
        setNvdDetails(result as NvdCveDetails);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error('Unable to load NVD CVE details:', error);
        setNvdError(error instanceof Error ? error.message : 'Unable to load NVD details.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingNvd(false);
      });

    return () => controller.abort();
  }, [selectedThreat?.cve_id]);

  const activeFindings = vulnerabilities.filter(
    (vulnerability) => vulnerability.status === 'open' || vulnerability.status === 'in_progress'
  );
  const severityCounts = {
    critical: activeFindings.filter((vulnerability) => vulnerability.severity === 'critical').length,
    high: activeFindings.filter((vulnerability) => vulnerability.severity === 'high').length,
    medium: activeFindings.filter((vulnerability) => vulnerability.severity === 'medium').length,
    low: activeFindings.filter((vulnerability) => vulnerability.severity === 'low').length,
  };
  const affectedEndpointCount = new Set(activeFindings.map((vulnerability) => vulnerability.endpoint_id)).size;
  const isWithinDays = (date: string, days: number) => {
    const timestamp = Date.parse(date);
    return !Number.isNaN(timestamp) && timestamp >= Date.now() - days * 24 * 60 * 60 * 1000;
  };
  const recentThreats = activeFindings
    .filter((vulnerability) => vulnerability.severity === 'critical' || vulnerability.severity === 'high')
    .slice(0, 10);
  const threatTrends = [7, 30, 90].map((days) => ({
    period: `Last ${days} days`,
    detected: vulnerabilities.filter((vulnerability) =>
      isWithinDays(vulnerability.discovered_date, days)
    ).length,
  }));
  const newFindingsLastDay = vulnerabilities.filter((vulnerability) =>
    isWithinDays(vulnerability.discovered_date, 1)
  ).length;
  const filteredFindings = useMemo(() => {
    const search = findingsSearch.trim().toLocaleLowerCase();
    return vulnerabilities.filter((vulnerability) => {
      const matchesSearch = !search || [
        vulnerability.cve_id,
        vulnerability.description,
        vulnerability.endpoint_name,
        vulnerability.environment,
        ...vulnerability.affected_packages,
      ].some((value) => value.toLocaleLowerCase().includes(search));
      const matchesSeverity = findingsSeverity === 'all' || vulnerability.severity === findingsSeverity;
      const matchesStatus = findingsStatus === 'all' || vulnerability.status === findingsStatus;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [findingsSearch, findingsSeverity, findingsStatus, vulnerabilities]);
  const findingsPageSize = 25;
  const findingsPageCount = Math.ceil(filteredFindings.length / findingsPageSize);
  useEffect(() => {
    setFindingsPage((page) => Math.min(page, Math.max(0, findingsPageCount - 1)));
  }, [findingsPageCount]);
  const paginatedFindings = filteredFindings.slice(
    findingsPage * findingsPageSize,
    (findingsPage + 1) * findingsPageSize
  );
  const findingsStart = filteredFindings.length === 0 ? 0 : findingsPage * findingsPageSize + 1;
  const findingsEnd = Math.min((findingsPage + 1) * findingsPageSize, filteredFindings.length);

  const escalationLevels = [
    { id: 'incident-response', name: 'Incident Response Team', description: 'For active security incidents' },
    { id: 'ciso', name: 'CISO Office', description: 'For strategic security decisions' },
    { id: 'executive', name: 'Executive Leadership', description: 'For business-critical threats' },
    { id: 'external', name: 'External Security Firm', description: 'For specialized expertise' }
  ];

  const escalationReasons = [
    'Critical vulnerability with active exploitation',
    'Potential data breach detected',
    'System compromise confirmed',
    'Widespread infrastructure impact',
    'Regulatory compliance violation',
    'Advanced persistent threat (APT) indicators',
    'Zero-day vulnerability discovered',
    'Other (specify in notes)'
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-violet-800 text-white border-violet-900';
      case 'high': return 'bg-red-700 text-white border-red-800';
      case 'medium': return 'bg-orange-700 text-white border-orange-800';
      case 'low': return 'bg-green-700 text-white border-green-800';
      default: return 'bg-gray-700 text-white border-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-700 text-white border-red-800';
      case 'in_progress': return 'bg-blue-700 text-white border-blue-800';
      case 'resolved': return 'bg-green-700 text-white border-green-800';
      case 'false_positive': return 'bg-gray-700 text-white border-gray-800';
      default: return 'bg-gray-700 text-white border-gray-800';
    }
  };

  const handleViewCVE = (threatId: string) => {
    const url = /^CVE-\d{4}-\d{4,}$/i.test(threatId)
      ? `https://nvd.nist.gov/vuln/detail/${threatId}`
      : `https://osv.dev/vulnerability/${encodeURIComponent(threatId)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewThreatDetails = (threat: DashboardVulnerability) => {
    setSelectedThreat(threat);
  };

  const handleAssignThreat = (threat: DashboardVulnerability) => {
    setSelectedThreat(threat);
    setAssignmentDialog(true);
    setSelectedTeamMember('');
    setAssignmentNotes('');
    setPriority('');
  };

  const handleConfirmAssignment = async () => {
    if (!selectedThreat || !user || !selectedTeamMember || !priority) {
      toast({
        title: "Missing Information",
        description: "Select a team member and priority, and make sure you are signed in.",
        variant: "destructive",
      });
      return;
    }

    if (!['critical', 'high', 'medium', 'low'].includes(priority)) {
      toast({
        title: "Invalid priority",
        description: "Choose a valid threat priority.",
        variant: "destructive",
      });
      return;
    }

    const assignedMember = teamMembers.find((member) => member.id === selectedTeamMember);
    if (!assignedMember) {
      toast({
        title: "Team member unavailable",
        description: "Refresh the page and select a current team member.",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    try {
      await new DashboardDataService().assignThreat({
        vulnerabilityId: selectedThreat.id,
        cveId: selectedThreat.cve_id,
        endpointId: selectedThreat.endpoint_id,
        assignedTo: assignedMember.id,
        assignedBy: user.id,
        priority: priority as 'critical' | 'high' | 'medium' | 'low',
        notes: assignmentNotes,
      });
      await loadThreatData();
      toast({
        title: "Threat assigned",
        description: (
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>
              {selectedThreat.cve_id} assigned to {assignedMember.full_name || assignedMember.email}.
            </span>
          </div>
        ),
        duration: 4000,
      });
      setAssignmentDialog(false);
      setSelectedThreat(null);
      setSelectedTeamMember('');
      setAssignmentNotes('');
      setPriority('');
    } catch (error) {
      console.error('Failed to assign threat:', error);
      toast({
        title: "Assignment Failed",
        description: error instanceof Error ? error.message : "Unable to save the assignment.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleEscalateThreat = (threat: DashboardVulnerability) => {
    setSelectedThreat(threat);
    setEscalationDialog(true);
    setEscalationReason('');
    setEscalationLevel('');
    setEscalationNotes('');
  };

  const handleConfirmEscalation = async () => {
    if (!escalationReason || !escalationLevel) {
      toast({
        title: "Missing Information",
        description: "Please select escalation reason and level",
        variant: "destructive",
      });
      return;
    }

    if (!selectedThreat || !user) {
      toast({
        title: "Sign-in required",
        description: "Sign in before escalating a finding.",
        variant: "destructive",
      });
      return;
    }

    const selectedLevel = escalationLevels.find((level) => level.id === escalationLevel);
    if (!selectedLevel) return;

    setIsEscalating(true);
    try {
      await new DashboardDataService().recordThreatEscalation({
        userId: user.id,
        userEmail: user.email,
        vulnerabilityId: selectedThreat.id,
        cveId: selectedThreat.cve_id,
        endpointId: selectedThreat.endpoint_id,
        reason: escalationReason,
        level: selectedLevel.name,
        notes: escalationNotes,
      });
      toast({
        title: "Threat escalation recorded",
        description: (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span>
              {selectedThreat.cve_id} escalated to {selectedLevel.name}.
            </span>
          </div>
        ),
        duration: 4000,
      });
      setEscalationDialog(false);
      setEscalationReason('');
      setEscalationLevel('');
      setEscalationNotes('');
      setSelectedThreat(null);
    } catch (error) {
      console.error('Failed to record threat escalation:', error);
      toast({
        title: "Escalation Failed",
        description: error instanceof Error ? error.message : "Unable to record the escalation.",
        variant: "destructive",
      });
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <PermissionGuard permission="system.threat_summary" fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-slate-300">You don't have permission to view threat summary data.</p>
          </div>
        </div>
      </div>
    }>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Threat Detection Summary</h3>
          </div>
          <div className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : lastUpdatedAt ? `Last updated: ${lastUpdatedAt.toLocaleTimeString()}` : 'Not updated yet'}
          </div>
        </div>

        {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
        <p className="text-sm text-muted-foreground">
          Findings are package-version matches against the configured CVE catalog for agent-reported endpoints.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {isLoading ? '...' : loadError ? 'Unavailable' : severityCounts.critical}
                  </div>
                  <div className="text-sm text-gray-500">Active Critical Findings</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {isLoading ? '...' : loadError ? 'Unavailable' : severityCounts.high}
                  </div>
                  <div className="text-sm text-gray-500">Active High Findings</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? '...' : loadError ? 'Unavailable' : newFindingsLastDay}
                  </div>
                  <div className="text-sm text-gray-500">New Findings (24h)</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {isLoading ? '...' : loadError ? 'Unavailable' : affectedEndpointCount}
                  </div>
                  <div className="text-sm text-gray-500">Affected Endpoints</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Findings by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-red-600">
                  {isLoading ? '...' : loadError ? '—' : severityCounts.critical}
                </div>
                <div className="text-sm text-gray-500">Critical</div>
                <div className="text-xs text-gray-400">
                  {isLoading ? '...' : loadError ? '—' : `${activeFindings.length > 0 ? ((severityCounts.critical / activeFindings.length) * 100).toFixed(1) : '0'}%`}
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {isLoading ? '...' : loadError ? '—' : severityCounts.high}
                </div>
                <div className="text-sm text-gray-500">High</div>
                <div className="text-xs text-gray-400">
                  {isLoading ? '...' : loadError ? '—' : `${activeFindings.length > 0 ? ((severityCounts.high / activeFindings.length) * 100).toFixed(1) : '0'}%`}
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">
                  {isLoading ? '...' : loadError ? '—' : severityCounts.medium}
                </div>
                <div className="text-sm text-gray-500">Medium</div>
                <div className="text-xs text-gray-400">
                  {isLoading ? '...' : loadError ? '—' : `${activeFindings.length > 0 ? ((severityCounts.medium / activeFindings.length) * 100).toFixed(1) : '0'}%`}
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {isLoading ? '...' : loadError ? '—' : severityCounts.low}
                </div>
                <div className="text-sm text-gray-500">Low</div>
                <div className="text-xs text-gray-400">
                  {isLoading ? '...' : loadError ? '—' : `${activeFindings.length > 0 ? ((severityCounts.low / activeFindings.length) * 100).toFixed(1) : '0'}%`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent High-Priority Threats - Now with real data */}
        <Card>
          <CardHeader>
            <CardTitle>Recent High-Priority Threats</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading threat data...</div>
            ) : loadError ? (
              <div className="text-center py-8 text-gray-500">Vulnerability findings are unavailable.</div>
            ) : recentThreats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>No open high-priority CVE matches on agent-reported endpoints.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentThreats.map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        threat.severity === 'critical' ? 'text-red-600' : 
                        threat.severity === 'high' ? 'text-orange-600' : 
                        'text-yellow-600'
                      }`} />
                      <div>
                        <div className="font-medium">{threat.description || threat.cve_id}</div>
                        <div className="text-sm text-gray-500">{threat.cve_id}</div>
                        <div className="text-sm text-gray-500">
                          {threat.endpoint_name} ({threat.environment}) • Detected{' '}
                          {new Date(threat.discovered_date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getSeverityColor(threat.severity) + " capitalize"}>
                        {threat.severity}
                      </Badge>
                      <Badge className={getStatusColor(threat.status) + " capitalize"}>
                        {threat.status.replace('_', ' ')}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewThreatDetails(threat)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <AlertTriangle className={`h-5 w-5 ${
                                threat.severity === 'critical' ? 'text-red-600' : 
                                threat.severity === 'high' ? 'text-orange-600' : 
                                'text-yellow-600'
                              }`} />
                              <span>{threat.description || threat.cve_id}</span>
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                              <Badge className={getSeverityColor(threat.severity) + " capitalize"}>
                                {threat.severity}
                              </Badge>
                              <Badge className={getStatusColor(threat.status) + " capitalize"}>
                                {threat.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm text-gray-500">{threat.cve_id}</span>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-2">Description</h4>
                              <p className="text-sm text-gray-600">{threat.description || 'No description is available in the CVE catalog.'}</p>
                            </div>

                            {threat.cvss_score !== null && (
                              <div>
                                <h4 className="font-semibold mb-2">CVSS Score</h4>
                                <p className="text-sm text-gray-600">{threat.cvss_score}</p>
                              </div>
                            )}

                            {/^CVE-\d{4}-\d{4,}$/i.test(threat.cve_id) && (
                              <div className="space-y-2 rounded-md border p-3">
                                <h4 className="font-semibold">NVD details</h4>
                                {isLoadingNvd && (
                                  <p className="text-sm text-gray-500">Loading current NVD data...</p>
                                )}
                                {nvdError && (
                                  <p role="status" className="text-sm text-amber-700">{nvdError}</p>
                                )}
                                {nvdDetails && (
                                  <>
                                    {nvdDetails.description && (
                                      <p className="text-sm text-gray-600">{nvdDetails.description}</p>
                                    )}
                                    <p className="text-sm text-gray-600">
                                      CVSS {nvdDetails.cvssScore ?? 'not available'}
                                      {nvdDetails.severity ? ` (${nvdDetails.severity})` : ''}
                                      {' · '}Published {nvdDetails.published
                                        ? new Date(nvdDetails.published).toLocaleDateString()
                                        : 'date unavailable'}
                                    </p>
                                    {nvdDetails.references.length > 0 && (
                                      <ul className="list-inside list-disc space-y-1 text-sm">
                                        {nvdDetails.references.slice(0, 5).map((reference) => {
                                          const url = safeExternalUrl(reference.url);
                                          return url ? (
                                            <li key={url}>
                                              <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline"
                                              >
                                                {url}
                                              </a>
                                            </li>
                                          ) : null;
                                        })}
                                      </ul>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                            
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>Affected Endpoint</span>
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {threat.endpoint_name} ({threat.environment})
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>Detected: {new Date(threat.discovered_date).toLocaleString()}</span>
                            </div>
                            
                            <div className="flex space-x-2 pt-4">
                              <Button
                                onClick={() => handleAssignThreat(threat)}
                                className="flex-1"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Assign to Team
                              </Button>
                              {threat.severity === 'critical' && (
                                <Button
                                  variant="destructive"
                                  onClick={() => handleEscalateThreat(threat)}
                                  className="flex-1"
                                >
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Escalate
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                className="flex items-center space-x-2"
                                onClick={() => handleViewCVE(threat.cve_id)}
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span>{/^CVE-\d{4}-\d{4,}$/i.test(threat.cve_id) ? 'View NVD' : 'View OSV'}</span>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Vulnerability Findings ({isLoading ? '...' : vulnerabilities.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search vulnerability findings"
                  placeholder="Search CVE, package, endpoint..."
                  className="pl-9"
                  value={findingsSearch}
                  onChange={(event) => {
                    setFindingsSearch(event.target.value);
                    setFindingsPage(0);
                  }}
                />
              </div>
              <Select value={findingsSeverity} onValueChange={(value) => {
                setFindingsSeverity(value);
                setFindingsPage(0);
              }}>
                <SelectTrigger aria-label="Filter findings by severity">
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
              <Select value={findingsStatus} onValueChange={(value) => {
                setFindingsStatus(value);
                setFindingsPage(0);
              }}>
                <SelectTrigger aria-label="Filter findings by status">
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
            </div>

            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading vulnerability findings...</p>
            ) : loadError ? (
              <p className="py-8 text-center text-sm text-destructive">Vulnerability findings are unavailable.</p>
            ) : filteredFindings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {vulnerabilities.length === 0
                  ? 'No vulnerability findings have been reported.'
                  : 'No findings match these search and filter criteria.'}
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedFindings.map((finding) => (
                    <details key={finding.id} className="rounded-lg border p-4">
                      <summary className="flex cursor-pointer list-none flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="font-medium">{finding.description || finding.cve_id}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {finding.cve_id} · {finding.endpoint_name} ({finding.environment})
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Detected {new Date(finding.discovered_date).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge className={`${getSeverityColor(finding.severity)} capitalize`}>
                            {finding.severity}
                          </Badge>
                          <Badge className={`${getStatusColor(finding.status)} capitalize`}>
                            {finding.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </summary>
                      <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                        {finding.cvss_score !== null && (
                          <p><span className="font-medium">CVSS score:</span> {finding.cvss_score}</p>
                        )}
                        <p>
                          <span className="font-medium">Affected packages:</span>{' '}
                          {finding.affected_packages.length > 0
                            ? finding.affected_packages.join(', ')
                            : 'Package details unavailable'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewCVE(finding.cve_id)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {/^CVE-\d{4}-\d{4,}$/i.test(finding.cve_id) ? 'View NVD' : 'View OSV'}
                          </Button>
                          {(finding.reference_urls || []).map((reference) => {
                            const url = safeExternalUrl(reference);
                            return url ? (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
                              >
                                Reference
                              </a>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {findingsStart}–{findingsEnd} of {filteredFindings.length} findings
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFindingsPage((page) => Math.max(0, page - 1))}
                      disabled={findingsPage === 0}
                      aria-label="Previous findings page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {findingsPage + 1} of {findingsPageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFindingsPage((page) => Math.min(findingsPageCount - 1, page + 1))}
                      disabled={findingsPage >= findingsPageCount - 1}
                      aria-label="Next findings page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Team Assignment Dialog */}
        <PermissionGuard permission="vulnerabilities.assign">
          <Dialog open={assignmentDialog} onOpenChange={setAssignmentDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>Assign Threat to Team</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Threat</Label>
                  <div className="mt-1 p-2 rounded border text-sm text-white" style={{ backgroundColor: '#344256' }}>
                    {selectedThreat?.description || selectedThreat?.cve_id} ({selectedThreat?.cve_id})
                  </div>
                </div>

                <div>
                  <Label htmlFor="team-member" className="text-sm font-medium">Assign to Team Member</Label>
                  {assigneeError && <p role="alert" className="mt-1 text-sm text-destructive">{assigneeError}</p>}
                  <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{member.full_name || member.email}</div>
                              <div className="text-xs text-gray-500">{member.role}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority" className="text-sm font-medium">Priority Level</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical - Immediate attention required</SelectItem>
                      <SelectItem value="high">High - Address within 4 hours</SelectItem>
                      <SelectItem value="medium">Medium - Address within 24 hours</SelectItem>
                      <SelectItem value="low">Low - Address within 72 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Assignment Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="Add any specific instructions or context..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleConfirmAssignment} 
                    className="flex-1"
                    disabled={isAssigning}
                  >
                    {isAssigning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Confirm Assignment
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setAssignmentDialog(false)} 
                    className="flex-1"
                    disabled={isAssigning}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </PermissionGuard>

        {/* Threat Escalation Dialog */}
        <PermissionGuard permission="system.escalate_threats">
          <Dialog open={escalationDialog} onOpenChange={setEscalationDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span>Escalate Critical Threat</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Threat</Label>
                  <div className="mt-1 p-2 rounded border text-sm text-white" style={{ backgroundColor: '#344256' }}>
                    {selectedThreat?.description || selectedThreat?.cve_id} ({selectedThreat?.cve_id})
                  </div>
                </div>

                <div>
                  <Label htmlFor="escalation-reason" className="text-sm font-medium">Escalation Reason</Label>
                  <Select value={escalationReason} onValueChange={setEscalationReason}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select escalation reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {escalationReasons.map((reason, index) => (
                        <SelectItem key={index} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="escalation-level" className="text-sm font-medium">Escalate To</Label>
                  <Select value={escalationLevel} onValueChange={setEscalationLevel}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select escalation level" />
                    </SelectTrigger>
                    <SelectContent>
                      {escalationLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          <div>
                            <div className="font-medium">{level.name}</div>
                            <div className="text-xs text-gray-500">{level.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="escalation-notes" className="text-sm font-medium">Escalation Details</Label>
                  <Textarea
                    id="escalation-notes"
                    value={escalationNotes}
                    onChange={(e) => setEscalationNotes(e.target.value)}
                    placeholder="Provide detailed context for the escalation, including immediate actions taken and business impact..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-red-800">Critical Escalation</div>
                      <div className="text-red-700">
                        This will immediately notify the selected team and trigger emergency response protocols.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleConfirmEscalation} 
                    variant="destructive"
                    className="flex-1"
                    disabled={isEscalating}
                  >
                    {isEscalating ? 'Recording...' : <><AlertCircle className="h-4 w-4 mr-2" />Confirm Escalation</>}
                  </Button>
                  <Button variant="outline" onClick={() => setEscalationDialog(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </PermissionGuard>

        <Card>
          <CardHeader>
            <CardTitle>New Catalog Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threatTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="font-medium">{trend.period}</div>
                  <div className="text-lg font-semibold">
                    {isLoading ? '...' : loadError ? 'Unavailable' : trend.detected}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Counts use each finding&apos;s recorded discovery date. Resolution trends are not available.
            </p>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}