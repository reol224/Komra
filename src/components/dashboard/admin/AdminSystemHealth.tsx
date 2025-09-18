'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Server, Database, Wifi, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AdminSystemHealth() {
  const systemMetrics = {
    uptime: '99.8%',
    responseTime: '145ms',
    activeConnections: 1247,
    databaseHealth: 'healthy',
    memoryUsage: 68,
    cpuUsage: 42,
    diskUsage: 34,
    networkLatency: '12ms'
  };

  const services = [
    { name: 'Web Server', status: 'healthy', uptime: '99.9%', lastCheck: '2 min ago' },
    { name: 'Database', status: 'healthy', uptime: '99.8%', lastCheck: '1 min ago' },
    { name: 'Authentication Service', status: 'healthy', uptime: '100%', lastCheck: '30 sec ago' },
    { name: 'Vulnerability Scanner', status: 'warning', uptime: '98.5%', lastCheck: '5 min ago' },
    { name: 'Report Generator', status: 'healthy', uptime: '99.7%', lastCheck: '1 min ago' },
    { name: 'Audit Logger', status: 'healthy', uptime: '99.9%', lastCheck: '45 sec ago' }
  ];

  const recentEvents = [
    { time: '14:32', type: 'info', message: 'Scheduled vulnerability scan completed successfully' },
    { time: '14:15', type: 'warning', message: 'High memory usage detected on scanner service' },
    { time: '13:45', type: 'info', message: 'Database backup completed' },
    { time: '13:30', type: 'error', message: 'Failed authentication attempt from 192.168.1.100' },
    { time: '13:15', type: 'info', message: 'System health check passed' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Activity className="h-5 w-5" />
        <h3 className="text-lg font-semibold">System Health & Performance</h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{systemMetrics.uptime}</div>
                <div className="text-sm text-gray-500">System Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{systemMetrics.responseTime}</div>
                <div className="text-sm text-gray-500">Avg Response Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{systemMetrics.activeConnections}</div>
                <div className="text-sm text-gray-500">Active Connections</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold capitalize text-green-600">
                  {systemMetrics.databaseHealth}
                </div>
                <div className="text-sm text-gray-500">Database Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-gray-500">{systemMetrics.memoryUsage}%</span>
              </div>
              <Progress value={systemMetrics.memoryUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-gray-500">{systemMetrics.cpuUsage}%</span>
              </div>
              <Progress value={systemMetrics.cpuUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Disk Usage</span>
                <span className="text-sm text-gray-500">{systemMetrics.diskUsage}%</span>
              </div>
              <Progress value={systemMetrics.diskUsage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-500">Uptime: {service.uptime}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={getStatusColor(service.status)} className="capitalize">
                    {service.status}
                  </Badge>
                  <span className="text-sm text-gray-500">{service.lastCheck}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent System Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border-l-2 border-gray-200">
                <span className="text-sm text-gray-500 min-w-[50px]">{event.time}</span>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${getEventTypeColor(event.type)} uppercase`}>
                    {event.type}
                  </span>
                  <p className="text-sm text-gray-700 mt-1">{event.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}