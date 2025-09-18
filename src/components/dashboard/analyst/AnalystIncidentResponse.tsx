'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Clock, Users, MessageSquare, FileText, Plus } from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  assignee: string;
  createdAt: string;
  lastUpdated: string;
  affectedSystems: string[];
  description: string;
  timeline: IncidentEvent[];
}

interface IncidentEvent {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: 'status_change' | 'comment' | 'action' | 'escalation';
}

export default function AnalystIncidentResponse() {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const incidents: Incident[] = [
    {
      id: '1',
      title: 'Critical RCE Vulnerability in Production Web Server',
      severity: 'critical',
      status: 'investigating',
      assignee: 'analyst@koma.security',
      createdAt: '2024-03-22T14:30:00Z',
      lastUpdated: '2024-03-22T15:45:00Z',
      affectedSystems: ['web-server-01', 'web-server-02', 'load-balancer-01'],
      description: 'CVE-2024-1234 detected in Apache Struts affecting production web servers. Immediate containment required.',
      timeline: [
        {
          id: '1',
          timestamp: '2024-03-22T14:30:00Z',
          user: 'system',
          action: 'Incident Created',
          details: 'Automated detection of CVE-2024-1234 in production environment',
          type: 'status_change'
        },
        {
          id: '2',
          timestamp: '2024-03-22T14:35:00Z',
          user: 'analyst@koma.security',
          action: 'Assigned to Analyst',
          details: 'Incident assigned for immediate investigation',
          type: 'status_change'
        },
        {
          id: '3',
          timestamp: '2024-03-22T14:45:00Z',
          user: 'analyst@koma.security',
          action: 'Status Changed',
          details: 'Changed status from Open to Investigating',
          type: 'status_change'
        },
        {
          id: '4',
          timestamp: '2024-03-22T15:00:00Z',
          user: 'analyst@koma.security',
          action: 'Comment Added',
          details: 'Confirmed vulnerability affects Struts 2.5.x. Checking for active exploitation.',
          type: 'comment'
        },
        {
          id: '5',
          timestamp: '2024-03-22T15:30:00Z',
          user: 'analyst@koma.security',
          action: 'Containment Action',
          details: 'Implemented WAF rules to block potential exploit attempts',
          type: 'action'
        }
      ]
    },
    {
      id: '2',
      title: 'Suspicious Login Activity from Foreign IP',
      severity: 'high',
      status: 'contained',
      assignee: 'analyst@koma.security',
      createdAt: '2024-03-22T13:15:00Z',
      lastUpdated: '2024-03-22T14:20:00Z',
      affectedSystems: ['auth-server-01', 'user-database'],
      description: 'Multiple failed login attempts detected from IP addresses in suspicious geographic locations.',
      timeline: [
        {
          id: '1',
          timestamp: '2024-03-22T13:15:00Z',
          user: 'system',
          action: 'Incident Created',
          details: 'Automated detection of suspicious login patterns',
          type: 'status_change'
        },
        {
          id: '2',
          timestamp: '2024-03-22T13:20:00Z',
          user: 'analyst@koma.security',
          action: 'Investigation Started',
          details: 'Analyzing login logs and IP reputation',
          type: 'status_change'
        },
        {
          id: '3',
          timestamp: '2024-03-22T14:00:00Z',
          user: 'analyst@koma.security',
          action: 'Containment Action',
          details: 'Blocked suspicious IP ranges and enabled additional MFA requirements',
          type: 'action'
        }
      ]
    },
    {
      id: '3',
      title: 'Data Exfiltration Attempt Detected',
      severity: 'high',
      status: 'open',
      assignee: 'senior-analyst@koma.security',
      createdAt: '2024-03-22T12:45:00Z',
      lastUpdated: '2024-03-22T12:45:00Z',
      affectedSystems: ['database-server-03', 'file-server-01'],
      description: 'Unusual data access patterns detected suggesting potential data exfiltration attempt.',
      timeline: [
        {
          id: '1',
          timestamp: '2024-03-22T12:45:00Z',
          user: 'system',
          action: 'Incident Created',
          details: 'DLP system detected unusual data access patterns',
          type: 'status_change'
        }
      ]
    }
  ];

  const getIncident = (id: string) => incidents.find(i => i.id === id);
  const currentIncident = selectedIncident ? getIncident(selectedIncident) : null;

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
      case 'open': return 'destructive';
      case 'investigating': return 'secondary';
      case 'contained': return 'default';
      case 'resolved': return 'default';
      default: return 'outline';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <Shield className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'action': return <AlertTriangle className="h-4 w-4" />;
      case 'escalation': return <Users className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusChange = (incidentId: string, newStatus: string) => {
    console.log(`Changing incident ${incidentId} status to ${newStatus}`);
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedIncident) {
      console.log(`Adding comment to incident ${selectedIncident}: ${newComment}`);
      setNewComment('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Incident Response Tools</h3>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Incident</span>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {incidents.filter(i => i.status === 'open').length}
                </div>
                <div className="text-sm text-gray-500">Open Incidents</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {incidents.filter(i => i.status === 'investigating').length}
                </div>
                <div className="text-sm text-gray-500">Under Investigation</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {incidents.filter(i => i.status === 'contained').length}
                </div>
                <div className="text-sm text-gray-500">Contained</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {incidents.filter(i => i.severity === 'critical').length}
                </div>
                <div className="text-sm text-gray-500">Critical Severity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedIncident === incident.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedIncident(incident.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={getSeverityColor(incident.severity)} className="capitalize">
                        {incident.severity}
                      </Badge>
                      <Badge variant={getStatusColor(incident.status)} className="capitalize">
                        {incident.status}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{incident.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">{incident.description}</p>
                    <div className="text-xs text-gray-400">
                      Assigned to: {incident.assignee}
                    </div>
                    <div className="text-xs text-gray-400">
                      Updated: {new Date(incident.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incident Details */}
        <div className="lg:col-span-2">
          {currentIncident ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{currentIncident.title}</CardTitle>
                  <div className="flex space-x-2">
                    <Badge variant={getSeverityColor(currentIncident.severity)} className="capitalize">
                      {currentIncident.severity}
                    </Badge>
                    <Badge variant={getStatusColor(currentIncident.status)} className="capitalize">
                      {currentIncident.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{currentIncident.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Affected Systems</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentIncident.affectedSystems.map((system, index) => (
                          <Badge key={index} variant="outline">{system}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-1">Assignee</h4>
                        <p className="text-sm text-gray-600">{currentIncident.assignee}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Created</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(currentIncident.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4">
                    <div className="space-y-4">
                      {currentIncident.timeline.map((event) => (
                        <div key={event.id} className="flex items-start space-x-3 p-3 border-l-2 border-gray-200">
                          {getEventTypeIcon(event.type)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{event.action}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{event.details}</p>
                            <p className="text-xs text-gray-400 mt-1">by {event.user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Change Status</h4>
                      <Select 
                        value={currentIncident.status} 
                        onValueChange={(value) => handleStatusChange(currentIncident.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="contained">Contained</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Add Comment</h4>
                      <Textarea
                        placeholder="Add investigation notes, actions taken, or updates..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="mb-2"
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        Add Comment
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">Select an incident to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}