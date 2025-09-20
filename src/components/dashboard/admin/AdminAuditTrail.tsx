'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Download, Filter, Eye, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failure' | 'warning';
}

export default function AdminAuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const auditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: '2024-03-22T14:30:15Z',
      user: 'admin@koma.security',
      action: 'USER_ROLE_CHANGED',
      resource: 'users/analyst@koma.security',
      details: 'Changed role from viewer to analyst',
      severity: 'high',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success'
    },
    {
      id: '2',
      timestamp: '2024-03-22T14:15:32Z',
      user: 'analyst@koma.security',
      action: 'REPORT_GENERATED',
      resource: 'reports/vulnerability-summary-2024-03-22',
      details: 'Generated vulnerability summary report',
      severity: 'medium',
      ip_address: '192.168.1.105',
      user_agent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7)',
      status: 'success'
    },
    {
      id: '3',
      timestamp: '2024-03-22T13:45:18Z',
      user: 'system',
      action: 'VULNERABILITY_DETECTED',
      resource: 'endpoints/web-server-01',
      details: 'Critical vulnerability CVE-2024-1234 detected',
      severity: 'critical',
      ip_address: '10.0.0.15',
      user_agent: 'Koma-Scanner/1.0',
      status: 'warning'
    },
    {
      id: '4',
      timestamp: '2024-03-22T13:30:45Z',
      user: 'unknown',
      action: 'LOGIN_FAILED',
      resource: 'auth/login',
      details: 'Failed login attempt with invalid credentials',
      severity: 'high',
      ip_address: '203.0.113.42',
      user_agent: 'curl/7.68.0',
      status: 'failure'
    },
    {
      id: '5',
      timestamp: '2024-03-22T13:15:22Z',
      user: 'viewer@koma.security',
      action: 'DATA_ACCESSED',
      resource: 'vulnerabilities/list',
      details: 'Accessed vulnerability list view',
      severity: 'low',
      ip_address: '192.168.1.110',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success'
    },
    {
      id: '6',
      timestamp: '2024-03-22T12:45:33Z',
      user: 'admin@koma.security',
      action: 'USER_CREATED',
      resource: 'users/newuser@company.com',
      details: 'Created new user account with analyst role',
      severity: 'medium',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success'
    },
    {
      id: '7',
      timestamp: '2024-03-22T12:30:15Z',
      user: 'system',
      action: 'BACKUP_COMPLETED',
      resource: 'database/audit_logs',
      details: 'Automated database backup completed successfully',
      severity: 'low',
      ip_address: '127.0.0.1',
      user_agent: 'Koma-Backup/1.0',
      status: 'success'
    },
    {
      id: '8',
      timestamp: '2024-03-22T11:15:44Z',
      user: 'analyst@koma.security',
      action: 'CVE_TRIAGED',
      resource: 'vulnerabilities/CVE-2024-5678',
      details: 'Triaged CVE-2024-5678 as high priority',
      severity: 'medium',
      ip_address: '192.168.1.105',
      user_agent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7)',
      status: 'success'
    }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

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
      case 'success': return 'default';
      case 'failure': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const exportAuditLogs = () => {
    // In real implementation, this would generate and download a CSV/PDF
    console.log('Exporting audit logs...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Access Control Audit Trail</h3>
        </div>
        <Button onClick={exportAuditLogs} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export Logs</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <div className="text-sm text-gray-500">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(log => log.severity === 'critical' || log.severity === 'high').length}
            </div>
            <div className="text-sm text-gray-500">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(log => log.status === 'failure').length}
            </div>
            <div className="text-sm text-gray-500">Failed Actions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(filteredLogs.map(log => log.user)).size}
            </div>
            <div className="text-sm text-gray-500">Unique Users</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.user}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.action.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-500">{log.details}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{log.resource}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(log.severity)} className="capitalize">
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(log.status)} className="capitalize">
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{log.ip_address}</div>
                  </TableCell>
                  <TableCell>
                    <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                        </DialogHeader>
                        {selectedLog && (
                          <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Event ID</label>
                                <div className="font-mono text-sm">{selectedLog.id}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Timestamp</label>
                                <div className="text-sm">
                                  {new Date(selectedLog.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* User & Action Information */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">User</label>
                                <div className="font-medium">{selectedLog.user}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Action</label>
                                <div className="font-medium">{selectedLog.action.replace(/_/g, ' ')}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Resource</label>
                                <div className="font-mono text-sm p-2 rounded" style={{backgroundColor: '#344256'}}>
                                  {selectedLog.resource}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Details</label>
                                <div className="text-sm p-3 rounded" style={{backgroundColor: '#344256'}}>
                                  {selectedLog.details}
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Status & Severity */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Severity</label>
                                <div className="mt-1">
                                  <Badge variant={getSeverityColor(selectedLog.severity)} className="capitalize">
                                    {selectedLog.severity}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Status</label>
                                <div className="mt-1">
                                  <Badge variant={getStatusColor(selectedLog.status)} className="capitalize">
                                    {selectedLog.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            {/* Technical Information */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">IP Address</label>
                                <div className="font-mono text-sm">{selectedLog.ip_address}</div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">User Agent</label>
                                <div className="text-sm p-2 rounded break-all" style={{backgroundColor: '#344256'}}>
                                  {selectedLog.user_agent}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                                Close
                              </Button>
                              <Button onClick={() => {
                                // In real implementation, this would export individual log
                                console.log('Exporting log:', selectedLog.id);
                              }}>
                                Export This Log
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}