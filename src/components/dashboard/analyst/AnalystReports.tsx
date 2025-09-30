'use client';

import React, { useState } from 'react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Mail, Calendar, Filter, TrendingUp } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'vulnerability' | 'compliance' | 'incident' | 'threat-intelligence';
  status: 'draft' | 'ready' | 'published';
  createdAt: string;
  lastModified: string;
  author: string;
  description: string;
  tags: string[];
}

export default function AnalystReports() {
  const [selectedReportType, setSelectedReportType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reports: Report[] = [
    {
      id: '1',
      title: 'Weekly Vulnerability Assessment Report',
      type: 'vulnerability',
      status: 'ready',
      createdAt: '2024-03-22T10:00:00Z',
      lastModified: '2024-03-22T14:30:00Z',
      author: 'analyst@koma.security',
      description: 'Comprehensive analysis of vulnerabilities detected in the past week, including severity distribution and remediation recommendations.',
      tags: ['weekly', 'cve', 'remediation', 'critical']
    },
    {
      id: '2',
      title: 'Incident Response Summary - March 2024',
      type: 'incident',
      status: 'draft',
      createdAt: '2024-03-20T09:15:00Z',
      lastModified: '2024-03-22T11:45:00Z',
      author: 'analyst@koma.security',
      description: 'Monthly summary of security incidents, response times, and lessons learned.',
      tags: ['monthly', 'incidents', 'response-time', 'metrics']
    },
    {
      id: '3',
      title: 'Compliance Audit Report - Q1 2024',
      type: 'compliance',
      status: 'published',
      createdAt: '2024-03-15T08:30:00Z',
      lastModified: '2024-03-18T16:20:00Z',
      author: 'senior-analyst@koma.security',
      description: 'Quarterly compliance assessment covering SOC 2, ISO 27001, and internal security policies.',
      tags: ['quarterly', 'soc2', 'iso27001', 'compliance']
    },
    {
      id: '4',
      title: 'Threat Intelligence Briefing',
      type: 'threat-intelligence',
      status: 'ready',
      createdAt: '2024-03-21T14:00:00Z',
      lastModified: '2024-03-22T09:30:00Z',
      author: 'analyst@koma.security',
      description: 'Latest threat intelligence updates, emerging attack patterns, and recommended defensive measures.',
      tags: ['threat-intel', 'emerging-threats', 'defensive-measures']
    },
    {
      id: '5',
      title: 'Critical Vulnerability Emergency Report',
      type: 'vulnerability',
      status: 'published',
      createdAt: '2024-03-22T14:30:00Z',
      lastModified: '2024-03-22T15:00:00Z',
      author: 'analyst@koma.security',
      description: 'Emergency report on CVE-2024-1234 affecting production systems with immediate action items.',
      tags: ['emergency', 'critical', 'cve-2024-1234', 'production']
    }
  ];

  const filteredReports = reports.filter(report => {
    const matchesType = selectedReportType === 'all' || report.type === selectedReportType;
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  const getReport = (id: string) => reports.find(r => r.id === id);
  const currentReport = selectedReport ? getReport(selectedReport) : null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vulnerability': return 'destructive';
      case 'incident': return 'secondary';
      case 'compliance': return 'default';
      case 'threat-intelligence': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'ready': return 'default';
      case 'published': return 'default';
      default: return 'outline';
    }
  };

  const handleGenerateReport = () => {
    console.log('Generating new report...');
  };

  const handleExportReport = (reportId: string, format: string) => {
    console.log(`Exporting report ${reportId} as ${format}`);
  };

  const handleEmailReport = (reportId: string) => {
    console.log(`Emailing report ${reportId}`);
  };

  const reportTemplates = [
    { id: 'vuln-weekly', name: 'Weekly Vulnerability Report', description: 'Standard weekly vulnerability assessment' },
    { id: 'incident-summary', name: 'Incident Summary', description: 'Incident response and analysis summary' },
    { id: 'compliance-audit', name: 'Compliance Audit', description: 'Regulatory compliance assessment' },
    { id: 'threat-brief', name: 'Threat Intelligence Brief', description: 'Current threat landscape analysis' },
    { id: 'executive-summary', name: 'Executive Summary', description: 'High-level security posture overview' }
  ];

  return (
    <PermissionGuard permission="reports.view" fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-slate-300">You don't have permission to view reports.</p>
          </div>
        </div>
      </div>
    }>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Exportable Reports</h3>
          </div>
          <PermissionGuard permission="reports.generate">
            <Button onClick={handleGenerateReport} className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Generate Report</span>
            </Button>
          </PermissionGuard>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{reports.length}</div>
                  <div className="text-sm text-gray-500">Total Reports</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {reports.filter(r => r.status === 'ready').length}
                  </div>
                  <div className="text-sm text-gray-500">Ready to Publish</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {reports.filter(r => r.status === 'published').length}
                  </div>
                  <div className="text-sm text-gray-500">Published</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {reports.filter(r => r.status === 'draft').length}
                  </div>
                  <div className="text-sm text-gray-500">In Draft</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">Existing Reports</TabsTrigger>
            <TabsTrigger value="templates">Report Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Report Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Report Types</SelectItem>
                      <SelectItem value="vulnerability">Vulnerability Reports</SelectItem>
                      <SelectItem value="incident">Incident Reports</SelectItem>
                      <SelectItem value="compliance">Compliance Reports</SelectItem>
                      <SelectItem value="threat-intelligence">Threat Intelligence</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reports List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Reports ({filteredReports.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredReports.map((report) => (
                        <div
                          key={report.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedReport === report.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedReport(report.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant={getTypeColor(report.type)} className="capitalize text-xs">
                              {report.type.replace('-', ' ')}
                            </Badge>
                            <Badge variant={getStatusColor(report.status)} className="capitalize text-xs">
                              {report.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm mb-1">{report.title}</h4>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{report.description}</p>
                          <div className="text-xs text-gray-400">
                            By: {report.author}
                          </div>
                          <div className="text-xs text-gray-400">
                            Modified: {new Date(report.lastModified).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Report Details */}
              <div className="lg:col-span-2">
                {currentReport ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{currentReport.title}</CardTitle>
                        <div className="flex space-x-2">
                          <Badge variant={getTypeColor(currentReport.type)} className="capitalize">
                            {currentReport.type.replace('-', ' ')}
                          </Badge>
                          <Badge variant={getStatusColor(currentReport.status)} className="capitalize">
                            {currentReport.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{currentReport.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {currentReport.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-1">Author</h4>
                          <p className="text-sm text-gray-600">{currentReport.author}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Created</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(currentReport.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Last Modified</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(currentReport.lastModified).toLocaleString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <PermissionGuard permission="reports.download">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportReport(currentReport.id, 'pdf')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportReport(currentReport.id, 'docx')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export DOCX
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportReport(currentReport.id, 'csv')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="reports.share">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEmailReport(currentReport.id)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email Report
                          </Button>
                        </PermissionGuard>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-500">Select a report to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <PermissionGuard permission="reports.generate">
              <Card>
                <CardHeader>
                  <CardTitle>Report Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportTemplates.map((template) => (
                      <div key={template.id} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{template.name}</h4>
                        <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                        <Button size="sm" className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}