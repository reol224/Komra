'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, TrendingUp, Filter, RefreshCw, Eye, ExternalLink } from 'lucide-react';

interface ThreatFeedItem {
  id: string;
  cve: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  publishedDate: string;
  lastModified: string;
  affectedSystems: number;
  description: string;
  source: string;
  status: 'new' | 'investigating' | 'confirmed' | 'mitigated';
  tags: string[];
}

export default function AnalystThreatFeed() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const threatFeed: ThreatFeedItem[] = [
    {
      id: '1',
      cve: 'CVE-2024-1234',
      title: 'Remote Code Execution in Apache Struts 2.5.x',
      severity: 'critical',
      cvss: 9.8,
      publishedDate: '2024-03-22T10:00:00Z',
      lastModified: '2024-03-22T14:30:00Z',
      affectedSystems: 15,
      description: 'A critical vulnerability allows remote attackers to execute arbitrary code via crafted OGNL expressions.',
      source: 'NVD',
      status: 'new',
      tags: ['rce', 'apache', 'struts', 'web-application']
    },
    {
      id: '2',
      cve: 'CVE-2024-5678',
      title: 'SQL Injection in Custom CRM Application',
      severity: 'high',
      cvss: 8.1,
      publishedDate: '2024-03-22T08:15:00Z',
      lastModified: '2024-03-22T13:45:00Z',
      affectedSystems: 8,
      description: 'SQL injection vulnerability in user authentication module allows data extraction.',
      source: 'Internal Security Team',
      status: 'investigating',
      tags: ['sql-injection', 'crm', 'authentication', 'database']
    },
    {
      id: '3',
      cve: 'CVE-2024-9012',
      title: 'Privilege Escalation in Windows Service Manager',
      severity: 'high',
      cvss: 7.8,
      publishedDate: '2024-03-21T16:30:00Z',
      lastModified: '2024-03-22T12:15:00Z',
      affectedSystems: 23,
      description: 'Local privilege escalation vulnerability in Windows service management component.',
      source: 'Microsoft Security Response Center',
      status: 'confirmed',
      tags: ['privilege-escalation', 'windows', 'service', 'local']
    },
    {
      id: '4',
      cve: 'CVE-2024-3456',
      title: 'Cross-Site Scripting in Web Portal',
      severity: 'medium',
      cvss: 6.1,
      publishedDate: '2024-03-21T14:20:00Z',
      lastModified: '2024-03-22T11:30:00Z',
      affectedSystems: 5,
      description: 'Stored XSS vulnerability in user profile management section.',
      source: 'Bug Bounty Program',
      status: 'mitigated',
      tags: ['xss', 'web-portal', 'stored', 'user-input']
    },
    {
      id: '5',
      cve: 'CVE-2024-7890',
      title: 'Buffer Overflow in Network Driver',
      severity: 'high',
      cvss: 8.4,
      publishedDate: '2024-03-21T12:00:00Z',
      lastModified: '2024-03-21T18:45:00Z',
      affectedSystems: 12,
      description: 'Buffer overflow in network driver allows kernel-level code execution.',
      source: 'Vendor Advisory',
      status: 'new',
      tags: ['buffer-overflow', 'network', 'driver', 'kernel']
    }
  ];

  const filteredThreats = threatFeed.filter(threat => {
    const matchesSearch = threat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         threat.cve.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         threat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         threat.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = selectedSeverity === 'all' || threat.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || threat.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

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
      case 'new': return 'destructive';
      case 'investigating': return 'secondary';
      case 'confirmed': return 'default';
      case 'mitigated': return 'default';
      default: return 'outline';
    }
  };

  const getCvssColor = (cvss: number) => {
    if (cvss >= 9.0) return 'text-red-600';
    if (cvss >= 7.0) return 'text-orange-600';
    if (cvss >= 4.0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleInvestigate = (threatId: string) => {
    console.log('Starting investigation for threat:', threatId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Real-time Threat Feed</h3>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
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
                  {threatFeed.filter(t => t.status === 'new').length}
                </div>
                <div className="text-sm text-gray-500">New Threats</div>
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
                  {threatFeed.filter(t => t.status === 'investigating').length}
                </div>
                <div className="text-sm text-gray-500">Under Investigation</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {threatFeed.filter(t => t.severity === 'critical' || t.severity === 'high').length}
                </div>
                <div className="text-sm text-gray-500">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {threatFeed.reduce((sum, t) => sum + t.affectedSystems, 0)}
                </div>
                <div className="text-sm text-gray-500">Affected Systems</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                placeholder="Search threats, CVEs, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
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
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="mitigated">Mitigated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Threat Feed */}
      <div className="space-y-4">
        {filteredThreats.map((threat) => (
          <Card key={threat.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant={getSeverityColor(threat.severity)} className="capitalize">
                      {threat.severity}
                    </Badge>
                    <Badge variant={getStatusColor(threat.status)} className="capitalize">
                      {threat.status}
                    </Badge>
                    <span className={`text-sm font-bold ${getCvssColor(threat.cvss)}`}>
                      CVSS {threat.cvss}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold mb-2">{threat.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{threat.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span><strong>CVE:</strong> {threat.cve}</span>
                    <span><strong>Affected Systems:</strong> {threat.affectedSystems}</span>
                    <span><strong>Source:</strong> {threat.source}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    {threat.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Published: {new Date(threat.publishedDate).toLocaleString()} • 
                    Last Modified: {new Date(threat.lastModified).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleInvestigate(threat.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Investigate
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredThreats.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No threats match your current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}