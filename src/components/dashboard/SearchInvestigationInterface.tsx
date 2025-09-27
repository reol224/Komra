'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertTriangle, 
  FileText, 
  Shield, 
  Clock,
  User,
  Server,
  Database,
  Plus,
  ExternalLink
} from 'lucide-react';

interface SearchFilters {
  dateRange?: { start: string; end: string };
  severity?: string[];
  status?: string[];
  categories?: string[];
  textSearch?: string;
}

interface AuditEntry {
  id: string;
  event_type: string;
  event_category: string;
  action: string;
  description: string;
  severity: string;
  timestamp: string;
  metadata?: any;
}

interface Investigation {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  tags: string[];
  created_at: string;
  investigator_id?: string;
  case_number?: string;
}

interface ComplianceReport {
  id: string;
  title: string;
  framework: string;
  status: string;
  created_at: string;
  report_type: string;
}

export default function SearchInvestigationInterface() {
  const [selectedTab, setSelectedTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{
    audit: AuditEntry[];
    investigations: Investigation[];
    compliance: ComplianceReport[];
  }>({ audit: [], investigations: [], compliance: [] });
  
  const [auditData, setAuditData] = useState<{ data: AuditEntry[]; total: number }>({ data: [], total: 0 });
  const [investigationData, setInvestigationData] = useState<{ data: Investigation[]; total: number }>({ data: [], total: 0 });
  const [complianceData, setComplianceData] = useState<{ data: ComplianceReport[]; total: number }>({ data: [], total: 0 });
  
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isCreateInvestigationOpen, setIsCreateInvestigationOpen] = useState(false);
  
  const [newInvestigation, setNewInvestigation] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tags: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [auditRes, investigationRes, complianceRes] = await Promise.all([
        fetch('/api/search?action=audit&limit=50'),
        fetch('/api/search?action=investigations&limit=50'),
        fetch('/api/search?action=compliance&limit=50')
      ]);

      const [auditResult, investigationResult, complianceResult] = await Promise.all([
        auditRes.json(),
        investigationRes.json(),
        complianceRes.json()
      ]);

      if (auditResult.success) setAuditData(auditResult.data);
      if (investigationResult.success) setInvestigationData(investigationResult.data);
      if (complianceResult.success) setComplianceData(complianceResult.data);

    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performGlobalSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/search?action=global_search&q=${encodeURIComponent(searchTerm)}&limit=20`);
      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Error performing global search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createInvestigation = async () => {
    try {
      const tags = newInvestigation.tags.split(',').map(t => t.trim()).filter(t => t);
      
      const response = await fetch('/api/search?action=create_investigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newInvestigation.title,
          description: newInvestigation.description,
          priority: newInvestigation.priority,
          status: 'open',
          tags,
          investigation_id: crypto.randomUUID(),
          case_number: `CASE-${Date.now()}`
        })
      });

      const result = await response.json();
      if (result.success) {
        setIsCreateInvestigationOpen(false);
        setNewInvestigation({ title: '', description: '', priority: 'medium', tags: '' });
        await loadInitialData();
      }
    } catch (error) {
      console.error('Error creating investigation:', error);
    }
  };

  const exportData = async (dataType: 'audit' | 'investigations' | 'compliance') => {
    try {
      const response = await fetch(`/api/search?action=export&type=${dataType}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'system': return <Server className="h-4 w-4" />;
      case 'audit': return <FileText className="h-4 w-4" />;
      case 'compliance': return <Database className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Investigation & Compliance</h2>
          <p className="text-gray-600">Search, investigate, and generate compliance reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => exportData('audit')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </Button>
          <Dialog open={isCreateInvestigationOpen} onOpenChange={setIsCreateInvestigationOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Investigation</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Investigation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Investigation Title</Label>
                  <Input
                    id="title"
                    value={newInvestigation.title}
                    onChange={(e) => setNewInvestigation({...newInvestigation, title: e.target.value})}
                    placeholder="e.g., Suspicious Network Activity Investigation"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newInvestigation.description}
                    onChange={(e) => setNewInvestigation({...newInvestigation, description: e.target.value})}
                    placeholder="Detailed description of the investigation..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newInvestigation.priority} onValueChange={(value) => setNewInvestigation({...newInvestigation, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newInvestigation.tags}
                    onChange={(e) => setNewInvestigation({...newInvestigation, tags: e.target.value})}
                    placeholder="network, malware, incident-response"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateInvestigationOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createInvestigation}>Create Investigation</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Global Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search across audit logs, investigations, and compliance reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && performGlobalSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={performGlobalSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchTerm && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results for "{searchTerm}"</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({searchResults.audit.length + searchResults.investigations.length + searchResults.compliance.length})</TabsTrigger>
                <TabsTrigger value="audit">Audit Logs ({searchResults.audit.length})</TabsTrigger>
                <TabsTrigger value="investigations">Investigations ({searchResults.investigations.length})</TabsTrigger>
                <TabsTrigger value="compliance">Compliance ({searchResults.compliance.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {/* Combined results */}
                {[...searchResults.audit.map(item => ({...item, type: 'audit'})), 
                  ...searchResults.investigations.map(item => ({...item, type: 'investigation'})),
                  ...searchResults.compliance.map(item => ({...item, type: 'compliance'}))]
                  .sort((a, b) => new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime())
                  .slice(0, 20)
                  .map((item, index) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-start space-x-3 p-4 border rounded-lg">
                    {getCategoryIcon(item.event_category || item.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={item.type === 'audit' ? 'bg-blue-100 text-blue-800' : 
                                         item.type === 'investigation' ? 'bg-orange-100 text-orange-800' : 
                                         'bg-green-100 text-green-800'}>
                          {item.type}
                        </Badge>
                        {item.severity && <Badge className={getSeverityColor(item.severity)}>{item.severity}</Badge>}
                        {item.priority && <Badge className={getSeverityColor(item.priority)}>{item.priority}</Badge>}
                        {item.status && <Badge className={getStatusColor(item.status)}>{item.status}</Badge>}
                      </div>
                      <h4 className="font-medium mt-1">{item.title || item.description}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(item.timestamp || item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                {searchResults.audit.map((entry) => (
                  <div key={entry.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    {getCategoryIcon(entry.event_category)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(entry.severity)}>{entry.severity}</Badge>
                        <Badge className="bg-gray-100 text-gray-800">{entry.event_type}</Badge>
                      </div>
                      <h4 className="font-medium mt-1">{entry.description}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {entry.action} • {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="investigations" className="space-y-4">
                {searchResults.investigations.map((investigation) => (
                  <div key={investigation.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <AlertTriangle className="h-4 w-4 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(investigation.priority)}>{investigation.priority}</Badge>
                        <Badge className={getStatusColor(investigation.status)}>{investigation.status}</Badge>
                      </div>
                      <h4 className="font-medium mt-1">{investigation.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Case: {investigation.case_number} • {new Date(investigation.created_at).toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {investigation.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                {searchResults.compliance.map((report) => (
                  <div key={report.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <FileText className="h-4 w-4 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-100 text-purple-800">{report.framework}</Badge>
                        <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                      </div>
                      <h4 className="font-medium mt-1">{report.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {report.report_type} • {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Main Data Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit">Audit Trail ({auditData.total})</TabsTrigger>
          <TabsTrigger value="investigations">Investigations ({investigationData.total})</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Reports ({complianceData.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Security Audit Trail</h3>
            <Button variant="outline" onClick={() => exportData('audit')}>
              <Download className="h-4 w-4 mr-2" />
              Export Audit Logs
            </Button>
          </div>
          
          <div className="space-y-3">
            {auditData.data.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getCategoryIcon(entry.event_category)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(entry.severity)}>{entry.severity}</Badge>
                          <Badge className="bg-gray-100 text-gray-800">{entry.event_type}</Badge>
                          <span className="text-sm text-gray-500">{entry.action}</span>
                        </div>
                        <h4 className="font-medium mt-1">{entry.description}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="investigations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Security Investigations</h3>
            <Button variant="outline" onClick={() => exportData('investigations')}>
              <Download className="h-4 w-4 mr-2" />
              Export Investigations
            </Button>
          </div>
          
          <div className="space-y-3">
            {investigationData.data.map((investigation) => (
              <Card key={investigation.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(investigation.priority)}>{investigation.priority}</Badge>
                        <Badge className={getStatusColor(investigation.status)}>{investigation.status}</Badge>
                        <span className="text-sm text-gray-500">Case: {investigation.case_number}</span>
                      </div>
                      <h4 className="font-medium mt-1">{investigation.title}</h4>
                      {investigation.description && (
                        <p className="text-sm text-gray-600 mt-1">{investigation.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {new Date(investigation.created_at).toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {investigation.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compliance Reports</h3>
            <Button variant="outline" onClick={() => exportData('compliance')}>
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
          </div>
          
          <div className="space-y-3">
            {complianceData.data.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-100 text-purple-800">{report.framework}</Badge>
                        <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        <span className="text-sm text-gray-500">{report.report_type}</span>
                      </div>
                      <h4 className="font-medium mt-1">{report.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}