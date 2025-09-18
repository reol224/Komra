'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, AlertTriangle, Info, CheckCircle, Clock, Filter } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'vulnerability' | 'system' | 'compliance' | 'security';
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  source: string;
}

export default function ViewerAlerts() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const alerts: Alert[] = [
    {
      id: '1',
      title: 'Critical Vulnerability Detected',
      message: 'CVE-2024-1234 detected in Apache Struts affecting 15 production systems. Immediate attention required.',
      severity: 'critical',
      category: 'vulnerability',
      timestamp: '2024-03-22T14:30:00Z',
      status: 'active',
      source: 'Vulnerability Scanner'
    },
    {
      id: '2',
      title: 'High Memory Usage Alert',
      message: 'Database server DB-01 is experiencing high memory usage (85%). Performance may be impacted.',
      severity: 'warning',
      category: 'system',
      timestamp: '2024-03-22T14:15:00Z',
      status: 'acknowledged',
      source: 'System Monitor'
    },
    {
      id: '3',
      title: 'Failed Login Attempts',
      message: 'Multiple failed login attempts detected from IP 203.0.113.42. Potential brute force attack.',
      severity: 'error',
      category: 'security',
      timestamp: '2024-03-22T13:45:00Z',
      status: 'active',
      source: 'Security Monitor'
    },
    {
      id: '4',
      title: 'Compliance Check Completed',
      message: 'Monthly SOC 2 compliance check completed successfully. All requirements met.',
      severity: 'info',
      category: 'compliance',
      timestamp: '2024-03-22T13:30:00Z',
      status: 'resolved',
      source: 'Compliance Engine'
    },
    {
      id: '5',
      title: 'Backup Process Warning',
      message: 'Backup process for file-server-03 completed with warnings. Some files may have been skipped.',
      severity: 'warning',
      category: 'system',
      timestamp: '2024-03-22T12:15:00Z',
      status: 'acknowledged',
      source: 'Backup System'
    },
    {
      id: '6',
      title: 'SSL Certificate Expiring',
      message: 'SSL certificate for api.company.com will expire in 30 days. Renewal required.',
      severity: 'warning',
      category: 'security',
      timestamp: '2024-03-22T11:00:00Z',
      status: 'active',
      source: 'Certificate Monitor'
    },
    {
      id: '7',
      title: 'Patch Installation Complete',
      message: 'Security patches successfully installed on 23 Windows servers. Systems require restart.',
      severity: 'info',
      category: 'system',
      timestamp: '2024-03-22T10:30:00Z',
      status: 'resolved',
      source: 'Patch Management'
    },
    {
      id: '8',
      title: 'Unusual Network Traffic',
      message: 'Unusual outbound network traffic detected from internal subnet 192.168.10.0/24.',
      severity: 'error',
      category: 'security',
      timestamp: '2024-03-22T09:45:00Z',
      status: 'active',
      source: 'Network Monitor'
    }
  ];

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || alert.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus;
    return matchesSeverity && matchesCategory && matchesStatus;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Bell className="h-4 w-4 text-red-600" />;
      case 'acknowledged': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'acknowledged': return 'secondary';
      case 'resolved': return 'default';
      default: return 'outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vulnerability': return 'destructive';
      case 'security': return 'destructive';
      case 'system': return 'default';
      case 'compliance': return 'outline';
      default: return 'outline';
    }
  };

  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Bell className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Alerts and Notifications</h3>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{alertStats.total}</div>
                <div className="text-sm text-gray-500">Total Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{alertStats.active}</div>
                <div className="text-sm text-gray-500">Active Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
                <div className="text-sm text-gray-500">Critical Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{alertStats.acknowledged}</div>
                <div className="text-sm text-gray-500">Acknowledged</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vulnerability">Vulnerability</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge variant={getSeverityColor(alert.severity)} className="capitalize">
                        {alert.severity}
                      </Badge>
                      <Badge variant={getCategoryColor(alert.category)} className="capitalize">
                        {alert.category}
                      </Badge>
                      <Badge variant={getStatusColor(alert.status)} className="capitalize">
                        {alert.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{alert.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span><strong>Source:</strong> {alert.source}</span>
                      <span><strong>Time:</strong> {new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(alert.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="text-gray-500">No alerts match your current filters.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {alerts.filter(a => {
                  const alertTime = new Date(a.timestamp);
                  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return alertTime > oneDayAgo;
                }).length}
              </div>
              <div className="text-sm text-gray-500">Last 24 Hours</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {alerts.filter(a => a.status === 'resolved').length}
              </div>
              <div className="text-sm text-gray-500">Resolved Today</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {alerts.filter(a => a.severity === 'critical' && a.status === 'active').length}
              </div>
              <div className="text-sm text-gray-500">Critical Active</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-lg font-bold text-yellow-600">
                {alerts.filter(a => a.status === 'acknowledged').length}
              </div>
              <div className="text-sm text-gray-500">Pending Action</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}