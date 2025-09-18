'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, TrendingUp, Clock, Eye } from 'lucide-react';

export default function AdminThreatSummary() {
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
      status: 'active'
    },
    {
      id: 'CVE-2024-5678',
      severity: 'high',
      title: 'SQL Injection in Custom Application',
      affectedSystems: 8,
      detectedAt: '2024-03-22T13:45:00Z',
      status: 'investigating'
    },
    {
      id: 'CVE-2024-9012',
      severity: 'high',
      title: 'Privilege Escalation in Windows Service',
      affectedSystems: 23,
      detectedAt: '2024-03-22T12:15:00Z',
      status: 'mitigating'
    },
    {
      id: 'CVE-2024-3456',
      severity: 'medium',
      title: 'Cross-Site Scripting in Web Portal',
      affectedSystems: 5,
      detectedAt: '2024-03-22T11:30:00Z',
      status: 'resolved'
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

      {/* Recent High-Priority Threats */}
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
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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