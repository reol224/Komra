'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Database, Network, FileText, Download, Play } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  status_code?: number;
}

interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  query: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  matches: number;
}

export default function AnalystInvestigation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [correlationQuery, setCorrelationQuery] = useState('');

  const logEntries: LogEntry[] = [
    {
      id: '1',
      timestamp: '2024-03-22T15:45:32Z',
      source: 'web-server-01',
      level: 'error',
      message: 'Failed authentication attempt for user admin',
      ip_address: '203.0.113.42',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      endpoint: '/admin/login',
      status_code: 401
    },
    {
      id: '2',
      timestamp: '2024-03-22T15:44:18Z',
      source: 'database-01',
      level: 'warning',
      message: 'Unusual query pattern detected: SELECT * FROM users WHERE role = admin',
      ip_address: '192.168.1.105'
    },
    {
      id: '3',
      timestamp: '2024-03-22T15:43:55Z',
      source: 'firewall-01',
      level: 'info',
      message: 'Connection blocked from suspicious IP range',
      ip_address: '203.0.113.42'
    },
    {
      id: '4',
      timestamp: '2024-03-22T15:42:12Z',
      source: 'web-server-01',
      level: 'critical',
      message: 'Potential SQL injection attempt detected in parameter user_id',
      ip_address: '203.0.113.42',
      endpoint: '/api/users',
      status_code: 500
    },
    {
      id: '5',
      timestamp: '2024-03-22T15:41:33Z',
      source: 'auth-service',
      level: 'warning',
      message: 'Multiple failed login attempts from same IP within 5 minutes',
      ip_address: '203.0.113.42'
    }
  ];

  const correlationRules: CorrelationRule[] = [
    {
      id: '1',
      name: 'Brute Force Detection',
      description: 'Detects multiple failed login attempts from same IP',
      query: 'source:auth-service AND level:error AND message:*failed*login* | stats count by ip_address | where count > 5',
      severity: 'high',
      enabled: true,
      matches: 3
    },
    {
      id: '2',
      name: 'SQL Injection Pattern',
      description: 'Identifies potential SQL injection attempts',
      query: 'message:*SELECT* OR message:*UNION* OR message:*DROP* | where status_code >= 400',
      severity: 'critical',
      enabled: true,
      matches: 1
    },
    {
      id: '3',
      name: 'Privilege Escalation',
      description: 'Detects attempts to access admin resources',
      query: 'endpoint:*/admin/* AND status_code:401 | stats count by ip_address',
      severity: 'medium',
      enabled: true,
      matches: 2
    },
    {
      id: '4',
      name: 'Data Exfiltration',
      description: 'Large data transfers or bulk queries',
      query: 'source:database* AND message:*SELECT* | where response_size > 1MB',
      severity: 'high',
      enabled: false,
      matches: 0
    }
  ];

  const filteredLogs = logEntries.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ip_address && log.ip_address.includes(searchQuery));
    const matchesSource = selectedSource === 'all' || log.source.includes(selectedSource);
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesSearch && matchesSource && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
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

  const handleRunCorrelation = (ruleId: string) => {
    console.log('Running correlation rule:', ruleId);
  };

  const handleExportLogs = () => {
    console.log('Exporting filtered logs...');
  };

  const handleRunCustomQuery = () => {
    console.log('Running custom correlation query:', correlationQuery);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Investigation Workspace</h3>
        </div>
        <Button onClick={handleExportLogs} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export Results</span>
        </Button>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Log Search</span>
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center space-x-2">
            <Network className="h-4 w-4" />
            <span>Correlation Tools</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Analysis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Search Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">Last 15 minutes</SelectItem>
                    <SelectItem value="1h">Last hour</SelectItem>
                    <SelectItem value="6h">Last 6 hours</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="web-server">Web Servers</SelectItem>
                    <SelectItem value="database">Databases</SelectItem>
                    <SelectItem value="firewall">Firewalls</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Log Results */}
          <Card>
            <CardHeader>
              <CardTitle>Log Entries ({filteredLogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
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
                        <Badge variant="outline">{log.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLevelColor(log.level)} className="capitalize">
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">{log.message}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{log.ip_address || '-'}</div>
                      </TableCell>
                      <TableCell>
                        {log.endpoint && (
                          <div className="text-xs text-gray-500">
                            {log.endpoint} {log.status_code && `(${log.status_code})`}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          {/* Custom Query */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Correlation Query</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your correlation query (e.g., source:web-server* AND level:error | stats count by ip_address)"
                  value={correlationQuery}
                  onChange={(e) => setCorrelationQuery(e.target.value)}
                  className="font-mono"
                />
                <Button onClick={handleRunCustomQuery} disabled={!correlationQuery.trim()}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Query
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Predefined Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Correlation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant={getSeverityColor(rule.severity)} className="capitalize">
                          {rule.severity}
                        </Badge>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                      <div className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded">
                        {rule.query}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{rule.matches}</div>
                        <div className="text-xs text-gray-500">Matches</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunCorrelation(rule.id)}
                        disabled={!rule.enabled}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {/* Analysis Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {logEntries.filter(l => l.level === 'critical' || l.level === 'error').length}
                </div>
                <div className="text-sm text-gray-500">Critical/Error Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {new Set(logEntries.map(l => l.ip_address).filter(Boolean)).size}
                </div>
                <div className="text-sm text-gray-500">Unique IP Addresses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {new Set(logEntries.map(l => l.source)).size}
                </div>
                <div className="text-sm text-gray-500">Active Sources</div>
              </CardContent>
            </Card>
          </div>

          {/* Top IPs */}
          <Card>
            <CardHeader>
              <CardTitle>Top IP Addresses by Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Error Rate</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono">203.0.113.42</TableCell>
                    <TableCell>4</TableCell>
                    <TableCell className="text-red-600">75%</TableCell>
                    <TableCell>2024-03-22 15:45:32</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono">192.168.1.105</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="text-yellow-600">0%</TableCell>
                    <TableCell>2024-03-22 15:44:18</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}