'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Server, Shield, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function ViewerSystemStatus() {
  const systemOverview = {
    overallHealth: 'healthy',
    uptime: '99.8%',
    totalEndpoints: 156,
    healthyEndpoints: 142,
    warningEndpoints: 11,
    criticalEndpoints: 3,
    lastScanTime: '2024-03-22T15:30:00Z'
  };

  const serviceStatus = [
    { name: 'Web Services', status: 'healthy', uptime: '99.9%', endpoints: 45 },
    { name: 'Database Systems', status: 'healthy', uptime: '99.8%', endpoints: 12 },
    { name: 'Authentication Services', status: 'healthy', uptime: '100%', endpoints: 8 },
    { name: 'File Servers', status: 'warning', uptime: '98.5%', endpoints: 23 },
    { name: 'Network Infrastructure', status: 'healthy', uptime: '99.7%', endpoints: 34 },
    { name: 'Backup Systems', status: 'healthy', uptime: '99.9%', endpoints: 15 }
  ];

  const vulnerabilityOverview = {
    total: 1247,
    critical: 23,
    high: 156,
    medium: 489,
    low: 579,
    resolved: 892,
    inProgress: 234,
    open: 121
  };

  const recentActivity = [
    { time: '15:30', type: 'scan', message: 'Vulnerability scan completed on 156 endpoints' },
    { time: '14:45', type: 'update', message: 'System health status updated' },
    { time: '14:15', type: 'alert', message: '3 new medium-severity vulnerabilities detected' },
    { time: '13:30', type: 'resolved', message: '5 vulnerabilities marked as resolved' },
    { time: '12:45', type: 'scan', message: 'Compliance check completed successfully' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scan': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'update': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const healthPercentage = Math.round((systemOverview.healthyEndpoints / systemOverview.totalEndpoints) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Activity className="h-5 w-5" />
        <h3 className="text-lg font-semibold">System Status Overview</h3>
      </div>

      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(systemOverview.overallHealth)}
            <span>Overall System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{healthPercentage}%</div>
              <div className="text-sm text-gray-500">Healthy</div>
              <Progress value={healthPercentage} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{systemOverview.uptime}</div>
              <div className="text-sm text-gray-500">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{systemOverview.totalEndpoints}</div>
              <div className="text-sm text-gray-500">Total Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Last Scan</div>
              <div className="text-sm font-medium">
                {new Date(systemOverview.lastScanTime).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoint Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{systemOverview.healthyEndpoints}</div>
                <div className="text-sm text-gray-500">Healthy Endpoints</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{systemOverview.warningEndpoints}</div>
                <div className="text-sm text-gray-500">Warning Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{systemOverview.criticalEndpoints}</div>
                <div className="text-sm text-gray-500">Critical Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceStatus.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-500">{service.endpoints} endpoints</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{service.uptime}</div>
                    <div className="text-xs text-gray-500">Uptime</div>
                  </div>
                  <Badge variant={getStatusColor(service.status)} className="capitalize">
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vulnerability Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Vulnerability Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{vulnerabilityOverview.critical}</div>
              <div className="text-sm text-gray-500">Critical</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{vulnerabilityOverview.high}</div>
              <div className="text-sm text-gray-500">High</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{vulnerabilityOverview.medium}</div>
              <div className="text-sm text-gray-500">Medium</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{vulnerabilityOverview.low}</div>
              <div className="text-sm text-gray-500">Low</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xl font-bold text-green-600">{vulnerabilityOverview.resolved}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{vulnerabilityOverview.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-xl font-bold text-red-600">{vulnerabilityOverview.open}</div>
              <div className="text-sm text-gray-600">Open</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border-l-2 border-gray-200">
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{activity.message}</span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}