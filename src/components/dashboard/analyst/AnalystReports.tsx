'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Mail, Calendar, TrendingUp, Trash2, Loader2 } from 'lucide-react';
import { getStatusBadgeClassName } from '@/lib/dashboardBadgeStyles';
import { useAuth } from '@/contexts/AuthContext';
import { auditLogger } from '@/lib/auditLogger';
import { DashboardDataService } from '@/lib/dashboardDataService';
import {
  REPORT_TEMPLATES,
  ReportTemplate,
  GeneratedReport,
  buildReport,
  reportToCsv,
  reportToHtml,
  reportToText,
} from '@/lib/analystReports';

const dashboardService = new DashboardDataService();
const STORAGE_PREFIX = 'komra_analyst_reports_';
const MAX_STORED_REPORTS = 25;

/** Downloads text content as a file in the browser. */
function downloadFile(filename: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Lists, generates, exports and shares reports built from live dashboard data. */
export default function AnalystReports() {
  const { user } = useAuth();
  const storageKey = `${STORAGE_PREFIX}${user?.id ?? 'anonymous'}`;
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('reports');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setReports(stored ? (JSON.parse(stored) as GeneratedReport[]) : []);
    } catch {
      setReports([]);
    }
    setSelectedReport(null);
  }, [storageKey]);

  const persist = useCallback((next: GeneratedReport[]) => {
    const trimmed = next.slice(0, MAX_STORED_REPORTS);
    setReports(trimmed);
    try {
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
    } catch {
      setMessage({ kind: 'error', text: 'Reports could not be saved in this browser.' });
    }
  }, [storageKey]);

  /** Fetches live data and creates a report from the chosen template. */
  const handleGenerateReport = async (template: ReportTemplate) => {
    setGeneratingId(template.id);
    setMessage(null);
    try {
      const startDate = new Date(Date.now() - template.periodDays * 24 * 60 * 60 * 1000).toISOString();
      const [vulnerabilities, threats, auditLogs] = await Promise.all([
        dashboardService.getVulnerabilities(),
        dashboardService.getAssignedAgentThreats(),
        auditLogger.getAuditLogs({ startDate, limit: 1000, throwOnError: true }),
      ]);
      const report = buildReport(
        template,
        { vulnerabilities, threats, auditLogs },
        user?.email ?? 'unknown',
      );
      persist([report, ...reports]);
      setSelectedReport(report.id);
      setActiveTab('reports');
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Unable to generate the report.' });
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredReports = useMemo(() => reports.filter((report) => (
    (selectedReportType === 'all' || report.type === selectedReportType)
    && (selectedStatus === 'all' || report.status === selectedStatus)
  )), [reports, selectedReportType, selectedStatus]);

  const currentReport = reports.find((r) => r.id === selectedReport) ?? null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vulnerability': return 'destructive';
      case 'incident': return 'secondary';
      case 'compliance': return 'default';
      default: return 'outline';
    }
  };

  /** Exports a report as CSV, printable PDF, or HTML (Word-compatible). */
  const handleExportReport = (report: GeneratedReport, format: 'pdf' | 'docx' | 'csv') => {
    const base = report.id;
    if (format === 'csv') {
      downloadFile(`${base}.csv`, reportToCsv(report), 'text/csv;charset=utf-8');
    } else if (format === 'docx') {
      downloadFile(`${base}.doc`, reportToHtml(report), 'application/msword');
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setMessage({ kind: 'error', text: 'Allow pop-ups to export the report as PDF.' });
        return;
      }
      printWindow.document.write(reportToHtml(report));
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  /** Opens the user's mail client with the report summary. */
  const handleEmailReport = (report: GeneratedReport) => {
    window.location.href = `mailto:?subject=${encodeURIComponent(report.title)}&body=${encodeURIComponent(reportToText(report))}`;
  };

  /** Updates the status of a stored report. */
  const handleSetStatus = (report: GeneratedReport, status: GeneratedReport['status']) => {
    persist(reports.map((r) => r.id === report.id ? { ...r, status, lastModified: new Date().toISOString() } : r));
  };

  /** Removes a stored report. */
  const handleDeleteReport = (report: GeneratedReport) => {
    persist(reports.filter((r) => r.id !== report.id));
    if (selectedReport === report.id) setSelectedReport(null);
  };

  return (
    <PermissionGuard permission="reports.view" fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-slate-300">You don&apos;t have permission to view reports.</p>
          </div>
        </div>
      </div>
    }>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Exportable Reports</h3>
          </div>
          <PermissionGuard permission="reports.generate">
            <Button onClick={() => setActiveTab('templates')} className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Generate Report</span>
            </Button>
          </PermissionGuard>
        </div>

        {message && (
          <p className={`text-sm ${message.kind === 'error' ? 'text-red-400' : 'text-slate-300'}`} role="alert">{message.text}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: <FileText className="h-5 w-5 text-blue-600" />, value: reports.length, label: 'Total Reports' },
            { icon: <Calendar className="h-5 w-5 text-green-600" />, value: reports.filter((r) => r.status === 'ready').length, label: 'Ready to Publish' },
            { icon: <TrendingUp className="h-5 w-5 text-purple-600" />, value: reports.filter((r) => r.status === 'published').length, label: 'Published' },
            { icon: <FileText className="h-5 w-5 text-yellow-600" />, value: reports.filter((r) => r.status === 'draft').length, label: 'In Draft' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  {stat.icon}
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">Existing Reports</TabsTrigger>
            <TabsTrigger value="templates">Report Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger><SelectValue placeholder="All Report Types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Report Types</SelectItem>
                      <SelectItem value="vulnerability">Vulnerability Reports</SelectItem>
                      <SelectItem value="incident">Incident Reports</SelectItem>
                      <SelectItem value="compliance">Compliance Reports</SelectItem>
                      <SelectItem value="threat-intelligence">Threat Intelligence</SelectItem>
                      <SelectItem value="executive">Executive Summary</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
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
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader><CardTitle>Reports ({filteredReports.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredReports.length === 0 && (
                        <p className="text-sm text-gray-500">No reports yet. Generate one from the Report Templates tab.</p>
                      )}
                      {filteredReports.map((report) => (
                        <div
                          key={report.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedReport === report.id ? 'bg-blue-100 border-blue-400 text-slate-900' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedReport(report.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant={getTypeColor(report.type)} className="capitalize text-xs">
                              {report.type.replace('-', ' ')}
                            </Badge>
                            <Badge className={`${getStatusBadgeClassName(report.status)} capitalize text-xs`}>
                              {report.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm mb-1">{report.title}</h4>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{report.description}</p>
                          <div className="text-xs text-gray-400">By: {report.author}</div>
                          <div className="text-xs text-gray-400">Modified: {new Date(report.lastModified).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                          <Badge className={`${getStatusBadgeClassName(currentReport.status)} capitalize`}>
                            {currentReport.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-sm text-gray-600">{currentReport.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentReport.summary.map(([label, value]) => (
                          <div key={label}>
                            <div className="text-xs text-gray-500">{label}</div>
                            <div className="text-lg font-semibold">{value}</div>
                          </div>
                        ))}
                      </div>
                      {currentReport.tables.map((table) => (
                        <div key={table.heading}>
                          <h4 className="font-medium mb-2">{table.heading}</h4>
                          <div className="max-h-72 overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>{table.columns.map((c) => <TableHead key={c}>{c}</TableHead>)}</TableRow>
                              </TableHeader>
                              <TableBody>
                                {table.rows.length === 0 ? (
                                  <TableRow><TableCell colSpan={table.columns.length} className="text-gray-500">No data in this period.</TableCell></TableRow>
                                ) : table.rows.map((row, i) => (
                                  <TableRow key={i}>{row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}</TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                      <div className="text-xs text-gray-500">
                        Created {new Date(currentReport.createdAt).toLocaleString()} by {currentReport.author}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <PermissionGuard permission="reports.download">
                          <Button variant="outline" size="sm" onClick={() => handleExportReport(currentReport, 'pdf')}>
                            <Download className="h-4 w-4 mr-2" />Export PDF
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleExportReport(currentReport, 'docx')}>
                            <Download className="h-4 w-4 mr-2" />Export DOC
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleExportReport(currentReport, 'csv')}>
                            <Download className="h-4 w-4 mr-2" />Export CSV
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="reports.share">
                          <Button variant="outline" size="sm" onClick={() => handleEmailReport(currentReport)}>
                            <Mail className="h-4 w-4 mr-2" />Email Report
                          </Button>
                        </PermissionGuard>
                        {currentReport.status !== 'published' && (
                          <Button variant="outline" size="sm" onClick={() => handleSetStatus(currentReport, 'published')}>
                            Mark Published
                          </Button>
                        )}
                        {currentReport.status !== 'draft' && (
                          <Button variant="outline" size="sm" onClick={() => handleSetStatus(currentReport, 'draft')}>
                            Move to Draft
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleDeleteReport(currentReport)}>
                          <Trash2 className="h-4 w-4 mr-2" />Delete
                        </Button>
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
                <CardHeader><CardTitle>Report Templates</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {REPORT_TEMPLATES.map((template) => (
                      <div key={template.id} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{template.name}</h4>
                        <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={generatingId !== null}
                          onClick={() => void handleGenerateReport(template)}
                        >
                          {generatingId === template.id
                            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            : <FileText className="h-4 w-4 mr-2" />}
                          {generatingId === template.id ? 'Generating...' : 'Use Template'}
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
