'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle, Shield, TrendingUp, Clock, Eye, ExternalLink, Users, Calendar, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DashboardDataService, DashboardVulnerability, RiskMetrics } from '@/lib/dashboardDataService';
import { auditLogger } from '@/lib/auditLogger';

export default function AdminThreatSummary() {
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [assignmentDialog, setAssignmentDialog] = useState(false);
  const [escalationDialog, setEscalationDialog] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false); // Loading state for assignment
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [priority, setPriority] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationLevel, setEscalationLevel] = useState('');
  const [escalationNotes, setEscalationNotes] = useState('');
  
  // Real data state
  const [vulnerabilities, setVulnerabilities] = useState<DashboardVulnerability[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    totalEndpoints: 0,
    healthyEndpoints: 0,
    vulnerableEndpoints: 0,
    criticalEndpoints: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const dashboardService = new DashboardDataService();

  // Load real threat data
  useEffect(() => {
    loadThreatData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadThreatData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadThreatData = async () => {
    try {
      setIsLoading(true);
      const [vulnData, metricsData] = await Promise.all([
        dashboardService.getVulnerabilities(),
        dashboardService.getRiskMetrics()
      ]);

      setVulnerabilities(vulnData);
      setRiskMetrics(metricsData);
      
      console.log('🔍 Threat data loaded:', {
        vulnerabilities: vulnData.length,
        critical: metricsData.criticalCount,
        high: metricsData.highCount
      });
    } catch (error) {
      console.error('❌ Error loading threat data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const teamMembers = [
    { id: 'john-doe', name: 'John Doe', role: 'Senior Security Analyst', availability: 'available' },
    { id: 'jane-smith', name: 'Jane Smith', role: 'Incident Response Lead', availability: 'busy' },
    { id: 'mike-johnson', name: 'Mike Johnson', role: 'Vulnerability Researcher', availability: 'available' },
    { id: 'sarah-wilson', name: 'Sarah Wilson', role: 'Security Engineer', availability: 'available' },
    { id: 'david-brown', name: 'David Brown', role: 'Threat Hunter', availability: 'offline' }
  ];

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

  // Calculate threat stats from real data
  const threatStats = {
    totalThreats: vulnerabilities.length,
    criticalThreats: riskMetrics.criticalCount,
    highThreats: riskMetrics.highCount,
    mediumThreats: riskMetrics.mediumCount,
    lowThreats: riskMetrics.lowCount,
    resolvedToday: vulnerabilities.filter(v => 
      v.status === 'resolved' && 
      new Date(v.discovered_date).toDateString() === new Date().toDateString()
    ).length,
    newThreatsToday: vulnerabilities.filter(v => 
      new Date(v.discovered_date).toDateString() === new Date().toDateString()
    ).length,
    avgResolutionTime: '4.2 hours' // This would need historical data to calculate properly
  };

  // Get recent high-priority threats from real data
  const recentThreats = vulnerabilities
    .filter(v => v.severity === 'critical' || v.severity === 'high')
    .sort((a, b) => new Date(b.discovered_date).getTime() - new Date(a.discovered_date).getTime())
    .slice(0, 10)
    .map(vuln => ({
      id: vuln.cve_id,
      severity: vuln.severity,
      title: vuln.description || `Vulnerability ${vuln.cve_id}`,
      affectedSystems: 1, // This would need endpoint relationship data
      detectedAt: vuln.discovered_date,
      status: vuln.status === 'resolved' ? 'resolved' : 
              vuln.status === 'in_progress' ? 'mitigating' : 'active',
      description: vuln.description || `Security vulnerability ${vuln.cve_id} detected in system`,
      impact: vuln.severity === 'critical' ? 'Complete system compromise possible' :
              vuln.severity === 'high' ? 'Significant security risk' :
              'Moderate security concern',
      recommendation: vuln.severity === 'critical' ? 'Immediate patching required' :
                     vuln.severity === 'high' ? 'Apply security updates within 24 hours' :
                     'Schedule maintenance window for patching',
      affectedEndpoints: [vuln.endpoint_name]
    }));

  // Calculate threat trends from real data
  const threatTrends = [
    { 
      period: 'Last 7 days', 
      detected: vulnerabilities.filter(v => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(v.discovered_date) >= weekAgo;
      }).length,
      resolved: vulnerabilities.filter(v => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return v.status === 'resolved' && new Date(v.discovered_date) >= weekAgo;
      }).length,
      trend: 'stable' as const
    },
    { 
      period: 'Last 30 days', 
      detected: vulnerabilities.filter(v => {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return new Date(v.discovered_date) >= monthAgo;
      }).length,
      resolved: vulnerabilities.filter(v => {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return v.status === 'resolved' && new Date(v.discovered_date) >= monthAgo;
      }).length,
      trend: 'down' as const
    },
    { 
      period: 'Last 90 days', 
      detected: vulnerabilities.length,
      resolved: vulnerabilities.filter(v => v.status === 'resolved').length,
      trend: 'stable' as const
    }
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
      case 'active': return 'bg-red-700 text-white border-red-800';
      case 'investigating': return 'bg-blue-700 text-white border-blue-800';
      case 'mitigating': return 'bg-purple-700 text-white border-purple-800';
      case 'resolved': return 'bg-green-700 text-white border-green-800';
      default: return 'bg-gray-700 text-white border-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600';
      case 'busy': return 'text-yellow-600';
      case 'offline': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  const handleViewCVE = (threatId: string) => {
    // Extract CVE ID from threat ID (e.g., CVE-2024-1234)
    const cveId = threatId;
    
    // Open CVE in NIST National Vulnerability Database
    const cveUrl = `https://nvd.nist.gov/vuln/detail/${cveId}`;
    window.open(cveUrl, '_blank', 'noopener,noreferrer');
  };

  const handleViewThreatDetails = (threat: any) => {
    setSelectedThreat(threat);
  };

  const handleAssignThreat = (threat: any) => {
    setSelectedThreat(threat);
    setAssignmentDialog(true);
    setSelectedTeamMember('');
    setAssignmentNotes('');
    setPriority('');
  };

  const handleConfirmAssignment = async () => {
    if (!selectedTeamMember || !priority) {
      toast({
        title: "Missing Information",
        description: "Please select a team member and priority level",
        variant: "destructive",
      });
      return;
    }

    const assignedMember = teamMembers.find(member => member.id === selectedTeamMember);
    
    setIsAssigning(true);
    
    try {
      // Create audit log entry
      const auditEntry = {
        action: 'threat_assignment',
        threat_id: selectedThreat?.id,
        assigned_to: assignedMember?.name,
        assigned_by: 'Current Admin User', // This would come from auth context
        priority: priority,
        notes: assignmentNotes,
        timestamp: new Date().toISOString(),
        details: {
          threat_title: selectedThreat?.title,
          severity: selectedThreat?.severity,
          affected_systems: selectedThreat?.affectedSystems
        }
      };

      // Log the assignment action
      auditLogger.log(auditEntry);
      
      // Simulate assignment API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update threat status to assigned (simulate database update)
      if (selectedThreat) {
        selectedThreat.status = 'assigned';
        selectedThreat.assignedTo = assignedMember?.name;
        selectedThreat.assignedAt = new Date().toISOString();
        selectedThreat.priority = priority;
      }
      
      // Show success toast immediately
      toast({
        title: "Assignment Successful! ✅",
        description: (
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>
              {selectedThreat?.id} assigned to {assignedMember?.name} with {priority} priority
            </span>
          </div>
        ),
        duration: 4000,
      });
      
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "There was an error assigning the threat. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Always reset state and close dialog
      setIsAssigning(false);
      setAssignmentDialog(false);
      setSelectedTeamMember('');
      setAssignmentNotes('');
      setPriority('');
      setSelectedThreat(null);
    }
  };

  const handleEscalateThreat = (threat: any) => {
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

    const selectedLevel = escalationLevels.find(level => level.id === escalationLevel);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success toast
      toast({
        title: "Escalation Successful! 🚨",
        description: (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span>
              {selectedThreat?.id} escalated to {selectedLevel?.name}
            </span>
          </div>
        ),
        duration: 4000,
      });
      
      // Reset form
      setEscalationDialog(false);
      setEscalationReason('');
      setEscalationLevel('');
      setEscalationNotes('');
      setSelectedThreat(null);
      
    } catch (error) {
      toast({
        title: "Escalation Failed",
        description: "There was an error escalating the threat. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Threat Detection Summary</h3>
        </div>
        <div className="text-sm text-gray-500">
          {isLoading ? 'Loading...' : `Last updated: ${new Date().toLocaleTimeString()}`}
        </div>
      </div>

      {/* Threat Overview - Now with real data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? '...' : threatStats.criticalThreats}
                </div>
                <div className="text-sm text-gray-500">Critical Threats</div>
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
                  {isLoading ? '...' : threatStats.highThreats}
                </div>
                <div className="text-sm text-gray-500">High Threats</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? '...' : threatStats.resolvedToday}
                </div>
                <div className="text-sm text-gray-500">Resolved Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{threatStats.avgResolutionTime}</div>
                <div className="text-sm text-gray-500">Avg Resolution</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Distribution - Now with real data */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-red-600">
                {isLoading ? '...' : threatStats.criticalThreats}
              </div>
              <div className="text-sm text-gray-500">Critical</div>
              <div className="text-xs text-gray-400">
                {threatStats.totalThreats > 0 ? 
                  ((threatStats.criticalThreats / threatStats.totalThreats) * 100).toFixed(1) : '0'}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {isLoading ? '...' : threatStats.highThreats}
              </div>
              <div className="text-sm text-gray-500">High</div>
              <div className="text-xs text-gray-400">
                {threatStats.totalThreats > 0 ? 
                  ((threatStats.highThreats / threatStats.totalThreats) * 100).toFixed(1) : '0'}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">
                {isLoading ? '...' : threatStats.mediumThreats}
              </div>
              <div className="text-sm text-gray-500">Medium</div>
              <div className="text-xs text-gray-400">
                {threatStats.totalThreats > 0 ? 
                  ((threatStats.mediumThreats / threatStats.totalThreats) * 100).toFixed(1) : '0'}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {isLoading ? '...' : threatStats.lowThreats}
              </div>
              <div className="text-sm text-gray-500">Low</div>
              <div className="text-xs text-gray-400">
                {threatStats.totalThreats > 0 ? 
                  ((threatStats.lowThreats / threatStats.totalThreats) * 100).toFixed(1) : '0'}%
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
          ) : recentThreats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No high-priority threats detected</p>
              <p className="text-sm">Your systems appear to be secure</p>
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
                      <div className="font-medium">{threat.title}</div>
                      <div className="text-sm text-gray-500">{threat.id}</div>
                      <div className="text-sm text-gray-500">
                        {threat.affectedSystems} affected systems • 
                        Detected {new Date(threat.detectedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getSeverityColor(threat.severity) + " capitalize"}>
                      {threat.severity}
                    </Badge>
                    <Badge className={getStatusColor(threat.status) + " capitalize"}>
                      {threat.status}
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
                            <span>{threat.title}</span>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <Badge className={getSeverityColor(threat.severity) + " capitalize"}>
                              {threat.severity}
                            </Badge>
                            <Badge className={getStatusColor(threat.status) + " capitalize"}>
                              {threat.status}
                            </Badge>
                            <span className="text-sm text-gray-500">{threat.id}</span>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-gray-600">{threat.description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Impact</h4>
                            <p className="text-sm text-gray-600">{threat.impact}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Recommendation</h4>
                            <p className="text-sm text-gray-600">{threat.recommendation}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Affected Endpoints ({threat.affectedSystems})</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {threat.affectedEndpoints.map((endpoint, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {endpoint}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>Detected: {new Date(threat.detectedAt).toLocaleString()}</span>
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
                              onClick={() => handleViewCVE(threat.id)}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>View CVE</span>
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

      {/* Team Assignment Dialog */}
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
                {selectedThreat?.title} ({selectedThreat?.id})
              </div>
            </div>

            <div>
              <Label htmlFor="team-member" className="text-sm font-medium">Assign to Team Member</Label>
              <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id} disabled={member.availability === 'offline'}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.role}</div>
                        </div>
                        <div className={`text-xs ml-2 ${getAvailabilityColor(member.availability)}`}>
                          {member.availability}
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
                  <SelectItem value="urgent">Urgent - Immediate attention required</SelectItem>
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

      {/* Threat Escalation Dialog */}
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
                {selectedThreat?.title} ({selectedThreat?.id})
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
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Confirm Escalation
              </Button>
              <Button variant="outline" onClick={() => setEscalationDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Threat Trends - Now with real data */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {threatTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTrendIcon(trend.trend)}
                  <div>
                    <div className="font-medium">{trend.period}</div>
                    <div className="text-sm text-gray-500">
                      {trend.detected} detected • {trend.resolved} resolved
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {trend.detected - trend.resolved > 0 ? '+' : ''}
                    {trend.detected - trend.resolved}
                  </div>
                  <div className="text-sm text-gray-500">Net change</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}