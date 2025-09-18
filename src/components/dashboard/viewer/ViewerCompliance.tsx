'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Shield, FileText, Calendar, TrendingUp } from 'lucide-react';

export default function ViewerCompliance() {
  const complianceOverview = {
    overallScore: 87,
    totalControls: 156,
    compliantControls: 136,
    partialControls: 15,
    nonCompliantControls: 5,
    lastAssessment: '2024-03-15T10:00:00Z',
    nextAssessment: '2024-06-15T10:00:00Z'
  };

  const frameworks = [
    {
      name: 'SOC 2 Type II',
      score: 92,
      status: 'compliant',
      controls: 45,
      compliant: 42,
      partial: 2,
      nonCompliant: 1,
      lastAudit: '2024-02-15T00:00:00Z',
      nextAudit: '2024-08-15T00:00:00Z'
    },
    {
      name: 'ISO 27001',
      score: 85,
      status: 'compliant',
      controls: 114,
      compliant: 97,
      partial: 12,
      nonCompliant: 5,
      lastAudit: '2024-01-20T00:00:00Z',
      nextAudit: '2024-07-20T00:00:00Z'
    },
    {
      name: 'GDPR',
      score: 78,
      status: 'partial',
      controls: 32,
      compliant: 25,
      partial: 5,
      nonCompliant: 2,
      lastAudit: '2024-03-01T00:00:00Z',
      nextAudit: '2024-09-01T00:00:00Z'
    },
    {
      name: 'HIPAA',
      score: 94,
      status: 'compliant',
      controls: 18,
      compliant: 17,
      partial: 1,
      nonCompliant: 0,
      lastAudit: '2024-02-28T00:00:00Z',
      nextAudit: '2024-08-28T00:00:00Z'
    }
  ];

  const recentFindings = [
    {
      id: '1',
      framework: 'ISO 27001',
      control: 'A.12.6.1 - Management of technical vulnerabilities',
      severity: 'medium',
      status: 'open',
      description: 'Vulnerability management process needs documentation updates',
      dueDate: '2024-04-15T00:00:00Z'
    },
    {
      id: '2',
      framework: 'SOC 2',
      control: 'CC6.1 - Logical and physical access controls',
      severity: 'low',
      status: 'in-progress',
      description: 'Access review process requires quarterly documentation',
      dueDate: '2024-04-01T00:00:00Z'
    },
    {
      id: '3',
      framework: 'GDPR',
      control: 'Article 32 - Security of processing',
      severity: 'high',
      status: 'open',
      description: 'Data encryption at rest implementation incomplete',
      dueDate: '2024-03-30T00:00:00Z'
    },
    {
      id: '4',
      framework: 'ISO 27001',
      control: 'A.18.1.4 - Privacy and protection of personally identifiable information',
      severity: 'medium',
      status: 'resolved',
      description: 'PII handling procedures updated and approved',
      dueDate: '2024-03-20T00:00:00Z'
    }
  ];

  const complianceTrends = [
    { month: 'Jan 2024', score: 82 },
    { month: 'Feb 2024', score: 85 },
    { month: 'Mar 2024', score: 87 }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'non-compliant': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'partial': return 'secondary';
      case 'non-compliant': return 'destructive';
      case 'open': return 'destructive';
      case 'in-progress': return 'secondary';
      case 'resolved': return 'default';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Compliance Snapshots</h3>
      </div>

      {/* Overall Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Overall Compliance Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(complianceOverview.overallScore)}`}>
                {complianceOverview.overallScore}%
              </div>
              <div className="text-sm text-gray-500">Overall Score</div>
              <Progress value={complianceOverview.overallScore} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{complianceOverview.compliantControls}</div>
              <div className="text-sm text-gray-500">Compliant Controls</div>
              <div className="text-xs text-gray-400">
                of {complianceOverview.totalControls} total
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{complianceOverview.partialControls}</div>
              <div className="text-sm text-gray-500">Partial Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{complianceOverview.nonCompliantControls}</div>
              <div className="text-sm text-gray-500">Non-Compliant</div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Last Assessment:</span>
                <span className="ml-2 font-medium">
                  {new Date(complianceOverview.lastAssessment).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Next Assessment:</span>
                <span className="ml-2 font-medium">
                  {new Date(complianceOverview.nextAssessment).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Framework Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Frameworks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {frameworks.map((framework, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(framework.status)}
                    <h4 className="font-medium">{framework.name}</h4>
                    <Badge variant={getStatusColor(framework.status)} className="capitalize">
                      {framework.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getScoreColor(framework.score)}`}>
                      {framework.score}%
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{framework.compliant}</div>
                    <div className="text-xs text-gray-500">Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-600">{framework.partial}</div>
                    <div className="text-xs text-gray-500">Partial</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{framework.nonCompliant}</div>
                    <div className="text-xs text-gray-500">Non-Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{framework.controls}</div>
                    <div className="text-xs text-gray-500">Total Controls</div>
                  </div>
                </div>
                
                <Progress value={framework.score} className="mb-3" />
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Last Audit: {new Date(framework.lastAudit).toLocaleDateString()}</span>
                  <span>Next Audit: {new Date(framework.nextAudit).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Findings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentFindings.map((finding) => (
              <div key={finding.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="outline">{finding.framework}</Badge>
                      <Badge variant={getSeverityColor(finding.severity)} className="capitalize">
                        {finding.severity}
                      </Badge>
                      <Badge variant={getStatusColor(finding.status)} className="capitalize">
                        {finding.status}
                      </Badge>
                    </div>
                    <h4 className="font-medium mb-1">{finding.control}</h4>
                    <p className="text-sm text-gray-600 mb-2">{finding.description}</p>
                    <div className="text-xs text-gray-500">
                      Due Date: {new Date(finding.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Compliance Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{trend.month}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`text-lg font-bold ${getScoreColor(trend.score)}`}>
                    {trend.score}%
                  </div>
                  <Progress value={trend.score} className="w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Quarterly SOC 2 Review</div>
                  <div className="text-sm text-gray-500">Internal assessment</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">April 1, 2024</div>
                <div className="text-sm text-gray-500">10 days remaining</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">GDPR Compliance Audit</div>
                  <div className="text-sm text-gray-500">External audit</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">May 15, 2024</div>
                <div className="text-sm text-gray-500">54 days remaining</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">ISO 27001 Surveillance Audit</div>
                  <div className="text-sm text-gray-500">External audit</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">July 20, 2024</div>
                <div className="text-sm text-gray-500">120 days remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}