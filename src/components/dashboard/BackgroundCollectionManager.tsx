'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Plus, 
  Settings, 
  Clock, 
  Server, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';

interface CollectionSchedule {
  id: string;
  name: string;
  endpoints: string[];
  frequency: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  collection_type: string;
  created_at: string;
}

interface CollectionJob {
  id: string;
  schedule_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  endpoints_processed: number;
  packages_collected: number;
  vulnerabilities_found: number;
  error_message?: string;
}

interface SearchStatistics {
  auditEntries: number;
  investigations: number;
  complianceReports: number;
  criticalEvents: number;
  openInvestigations: number;
  publishedReports: number;
}

export default function BackgroundCollectionManager() {
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [jobs, setJobs] = useState<CollectionJob[]>([]);
  const [statistics, setStatistics] = useState<SearchStatistics>({
    auditEntries: 0,
    investigations: 0,
    complianceReports: 0,
    criticalEvents: 0,
    openInvestigations: 0,
    publishedReports: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // New schedule form state
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    endpoints: '',
    frequency: 'daily',
    collection_type: 'full'
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [schedulesRes, jobsRes, statsRes] = await Promise.all([
        fetch('/api/background-collection?action=schedules'),
        fetch('/api/background-collection?action=jobs'),
        fetch('/api/search?action=statistics')
      ]);

      const [schedulesData, jobsData, statsData] = await Promise.all([
        schedulesRes.json(),
        jobsRes.json(),
        statsRes.json()
      ]);

      if (schedulesData.success) setSchedules(schedulesData.data);
      if (jobsData.success) setJobs(jobsData.data);
      if (statsData.success) setStatistics(statsData.data);

    } catch (error) {
      console.error('Error loading background collection data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startService = async () => {
    try {
      const response = await fetch('/api/background-collection?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (result.success) {
        setIsServiceRunning(true);
        await loadData();
      }
    } catch (error) {
      console.error('Error starting service:', error);
    }
  };

  const stopService = async () => {
    try {
      const response = await fetch('/api/background-collection?action=stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (result.success) {
        setIsServiceRunning(false);
        await loadData();
      }
    } catch (error) {
      console.error('Error stopping service:', error);
    }
  };

  const createSchedule = async () => {
    try {
      const endpoints = newSchedule.endpoints.split(',').map(e => e.trim()).filter(e => e);
      
      const response = await fetch('/api/background-collection?action=create_schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSchedule.name,
          endpoints,
          frequency: newSchedule.frequency,
          collection_type: newSchedule.collection_type
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setIsCreateDialogOpen(false);
        setNewSchedule({ name: '', endpoints: '', frequency: 'daily', collection_type: 'full' });
        await loadData();
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const toggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      const action = enabled ? 'disable_schedule' : 'enable_schedule';
      const response = await fetch(`/api/background-collection?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId })
      });
      
      const result = await response.json();
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const triggerManualCollection = async () => {
    try {
      const allEndpoints = schedules.flatMap(s => s.endpoints);
      const uniqueEndpoints = [...new Set(allEndpoints)];
      
      const response = await fetch('/api/background-collection?action=trigger_collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoints: uniqueEndpoints })
      });
      
      const result = await response.json();
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error triggering manual collection:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'hourly': return <Clock className="h-4 w-4" />;
      case 'daily': return <Activity className="h-4 w-4" />;
      case 'weekly': return <Server className="h-4 w-4" />;
      case 'monthly': return <Settings className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Background Data Collection</h2>
          <p className="text-gray-600">Automated security scanning and data collection management</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={triggerManualCollection}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Manual Scan</span>
          </Button>
          <Button
            onClick={isServiceRunning ? stopService : startService}
            className={`flex items-center space-x-2 ${
              isServiceRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isServiceRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isServiceRunning ? 'Stop Service' : 'Start Service'}</span>
          </Button>
        </div>
      </div>

      {/* Service Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isServiceRunning ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                Background Collection Service: {isServiceRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {isLoading ? 'Loading...' : `Last updated: ${new Date().toLocaleTimeString()}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{statistics.auditEntries}</div>
            <div className="text-sm text-gray-500">Audit Entries</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{statistics.investigations}</div>
            <div className="text-sm text-gray-500">Investigations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{statistics.complianceReports}</div>
            <div className="text-sm text-gray-500">Compliance Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{statistics.criticalEvents}</div>
            <div className="text-sm text-gray-500">Critical Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{statistics.openInvestigations}</div>
            <div className="text-sm text-gray-500">Open Cases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{statistics.publishedReports}</div>
            <div className="text-sm text-gray-500">Published Reports</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedules">Collection Schedules</TabsTrigger>
          <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Schedules */}
            <Card>
              <CardHeader>
                <CardTitle>Active Collection Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                {schedules.filter(s => s.enabled).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4" />
                    <p>No active collection schedules</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedules.filter(s => s.enabled).slice(0, 5).map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getFrequencyIcon(schedule.frequency)}
                          <div>
                            <div className="font-medium">{schedule.name}</div>
                            <div className="text-sm text-gray-500">
                              {schedule.endpoints.length} endpoints • {schedule.frequency}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Job Status */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Collection Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4" />
                    <p>No recent collection jobs</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                            <span className="text-sm text-gray-500">
                              {job.started_at ? new Date(job.started_at).toLocaleString() : 'Not started'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {job.endpoints_processed} endpoints • {job.packages_collected} packages • {job.vulnerabilities_found} vulnerabilities
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Collection Schedules</h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>New Schedule</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collection Schedule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Schedule Name</Label>
                    <Input
                      id="name"
                      value={newSchedule.name}
                      onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                      placeholder="e.g., Daily Security Scan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endpoints">Endpoints (comma-separated)</Label>
                    <Input
                      id="endpoints"
                      value={newSchedule.endpoints}
                      onChange={(e) => setNewSchedule({...newSchedule, endpoints: e.target.value})}
                      placeholder="192.168.1.100, 192.168.1.101, server.example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={newSchedule.frequency} onValueChange={(value) => setNewSchedule({...newSchedule, frequency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="collection_type">Collection Type</Label>
                    <Select value={newSchedule.collection_type} onValueChange={(value) => setNewSchedule({...newSchedule, collection_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Scan</SelectItem>
                        <SelectItem value="incremental">Incremental</SelectItem>
                        <SelectItem value="vulnerability_only">Vulnerabilities Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createSchedule}>Create Schedule</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getFrequencyIcon(schedule.frequency)}
                      <div>
                        <h4 className="font-medium">{schedule.name}</h4>
                        <p className="text-sm text-gray-500">
                          {schedule.endpoints.length} endpoints • {schedule.frequency} • {schedule.collection_type}
                        </p>
                        <p className="text-xs text-gray-400">
                          Last run: {schedule.last_run ? new Date(schedule.last_run).toLocaleString() : 'Never'} • 
                          Next run: {schedule.next_run ? new Date(schedule.next_run).toLocaleString() : 'Not scheduled'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSchedule(schedule.id, schedule.enabled)}
                      >
                        {schedule.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <h3 className="text-lg font-semibold">Collection Job History</h3>
          
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                        <span className="font-medium">
                          {job.started_at ? new Date(job.started_at).toLocaleString() : 'Pending'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <div>Endpoints processed: {job.endpoints_processed}</div>
                        <div>Packages collected: {job.packages_collected}</div>
                        <div>Vulnerabilities found: {job.vulnerabilities_found}</div>
                        {job.error_message && (
                          <div className="text-red-600 mt-1">Error: {job.error_message}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {job.completed_at && (
                        <div>
                          Completed: {new Date(job.completed_at).toLocaleString()}
                        </div>
                      )}
                      <div>
                        Duration: {job.started_at && job.completed_at ? 
                          `${Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)}s` : 
                          'N/A'
                        }
                      </div>
                    </div>
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