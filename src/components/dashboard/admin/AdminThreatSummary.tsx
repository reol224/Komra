'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Shield, TrendingUp, Clock, Eye, ExternalLink, Users, Calendar, UserCheck, AlertCircle } from 'lucide-react';

export default function AdminThreatSummary() {
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [assignmentDialog, setAssignmentDialog] = useState(false);
  const [escalationDialog, setEscalationDialog] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [priority, setPriority] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationLevel, setEscalationLevel] = useState('');
  const [escalationNotes, setEscalationNotes] = useState('');

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

  const threatStats = {
    totalThreats: 1247,
    criticalThreats: 23,
    highThreats: 156,
    mediumThreats: 489,
    lowThreats: 579,
    resolvedToday: 45,
    newThreatsToday: 12,
    avgResolutionTime: '4.2 hours'
  };

  const recentThreats = [
    {
      id: 'CVE-2024-1234',
      severity: 'critical',
      title: 'Remote Code Execution in Apache Struts',
      affectedSystems: 15,
      detectedAt: '2024-03-22T14:30:00Z',
      status: 'active',
      description: 'A critical vulnerability in Apache Struts allows remote code execution through malicious HTTP requests.',
      impact: 'Complete system compromise possible',
      recommendation: 'Immediately update Apache Struts to version 2.5.30 or later',
      affectedEndpoints: ['web-server-01', 'web-server-02', 'api-gateway-01']
    },
    {
      id: 'CVE-2024-5678',
      severity: 'high',
      title: 'SQL Injection in Custom Application',
      affectedSystems: 8,
      detectedAt: '2024-03-22T13:45:00Z',
      status: 'investigating',
      description: 'SQL injection vulnerability found in user authentication module.',
      impact: 'Potential data breach and unauthorized access',
      recommendation: 'Apply input validation patches and review database permissions',
      affectedEndpoints: ['app-server-01', 'app-server-02']
    },
    {
      id: 'CVE-2024-9012',
      severity: 'high',
      title: 'Privilege Escalation in Windows Service',
      affectedSystems: 23,
      detectedAt: '2024-03-22T12:15:00Z',
      status: 'mitigating',
      description: 'Local privilege escalation vulnerability in Windows Print Spooler service.',
      impact: 'Local users can gain SYSTEM privileges',
      recommendation: 'Install Windows security update KB5012345',
      affectedEndpoints: ['win-server-01', 'win-server-02', 'win-workstation-*']
    },
    {
      id: 'CVE-2024-3456',
      severity: 'medium',
      title: 'Cross-Site Scripting in Web Portal',
      affectedSystems: 5,
      detectedAt: '2024-03-22T11:30:00Z',
      status: 'resolved',
      description: 'Stored XSS vulnerability in user profile comments section.',
      impact: 'Session hijacking and data theft possible',
      recommendation: 'Input sanitization has been implemented',
      affectedEndpoints: ['web-portal-01']
    }
  ];

  const threatTrends = [
    { period: 'Last 7 days', detected: 89, resolved: 76, trend: 'up' },
    { period: 'Last 30 days', detected: 342, resolved: 318, trend: 'down' },
    { period: 'Last 90 days', detected: 1156, resolved: 1089, trend: 'stable' }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'investigating': return 'secondary';
      case 'mitigating': return 'default';
      case 'resolved': return 'default';
      default: return 'outline';
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

  const handleConfirmAssignment = () => {
    if (!selectedTeamMember || !priority) {
      alert('Please select a team member and priority level');
      return;
    }

    const assignedMember = teamMembers.find(member => member.id === selectedTeamMember);
    
    // Simulate assignment
    alert(`Successfully assigned ${selectedThreat?.id} to ${assignedMember?.name} with ${priority} priority`);
    
    // Reset form
    setAssignmentDialog(false);
    setSelectedTeamMember('');
    setAssignmentNotes('');
    setPriority('');
    setSelectedThreat(null);
  };

  const handleEscalateThreat = (threat: any) => {
    setSelectedThreat(threat);
    setEscalationDialog(true);
    setEscalationReason('');
    setEscalationLevel('');
    setEscalationNotes('');
  };

  const handleConfirmEscalation = () => {
    if (!escalationReason || !escalationLevel) {
      alert('Please select escalation reason and level');
      return;
    }

    const selectedLevel = escalationLevels.find(level => level.id === escalationLevel);
    
    // Simulate escalation
    alert(`Successfully escalated ${selectedThreat?.id} to ${selectedLevel?.name}\nReason: ${escalationReason}`);
    
    // Reset form
    setEscalationDialog(false);
    setEscalationReason('');
    setEscalationLevel('');
    setEscalationNotes('');
    setSelectedThreat(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Threat Detection Summary</h3>
      </div>

      {/* Threat Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{threatStats.criticalThreats}</div>
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
                <div className="text-2xl font-bold text-orange-600">{threatStats.highThreats}</div>
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
                <div className="text-2xl font-bold text-green-600">{threatStats.resolvedToday}</div>
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

      {/* Threat Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-red-600">{threatStats.criticalThreats}</div>
              <div className="text-sm text-gray-500">Critical</div>
              <div className="text-xs text-gray-400">
                {((threatStats.criticalThreats / threatStats.totalThreats) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{threatStats.highThreats}</div>
              <div className="text-sm text-gray-500">High</div>
              <div className="text-xs text-gray-400">
                {((threatStats.highThreats / threatStats.totalThreats) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{threatStats.mediumThreats}</div>
              <div className="text-sm text-gray-500">Medium</div>
              <div className="text-xs text-gray-400">
                {((threatStats.mediumThreats / threatStats.totalThreats) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">{threatStats.lowThreats}</div>
              <div className="text-sm text-gray-500">Low</div>
              <div className="text-xs text-gray-400">
                {((threatStats.lowThreats / threatStats.totalThreats) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent High-Priority Threats with Enhanced Escalation */}
      <Card>
        <CardHeader>
          <CardTitle>Recent High-Priority Threats</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <Badge variant={getSeverityColor(threat.severity)} className="capitalize">
                    {threat.severity}
                  </Badge>
                  <Badge variant={getStatusColor(threat.status)} className="capitalize">
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
                          <Badge variant={getSeverityColor(threat.severity)} className="capitalize">
                            {threat.severity}
                          </Badge>
                          <Badge variant={getStatusColor(threat.status)} className="capitalize">
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
              <Button onClick={handleConfirmAssignment} className="flex-1">
                Confirm Assignment
              </Button>
              <Button variant="outline" onClick={() => setAssignmentDialog(false)} className="flex-1">
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

      {/* Threat Trends */}
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