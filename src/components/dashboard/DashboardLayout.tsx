"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  Settings, 
  Eye, 
  Search, 
  Bell, 
  CheckCircle, 
  TrendingUp, 
  Database, 
  Lock, 
  UserCheck, 
  BarChart3, 
  Clock, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Play, 
  Square, 
  BellOff,
  Server,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DashboardDataService, RiskMetrics } from '@/lib/dashboardDataService';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSecurityNotifications } from '@/hooks/useSecurityNotifications';

// Import role-specific components
import AdminUserManagement from "./admin/AdminUserManagement";
import AdminSystemHealth from "./admin/AdminSystemHealth";
import AdminThreatSummary from "./admin/AdminThreatSummary";
import AdminAuditTrail from "./admin/AdminAuditTrail";
import BackgroundCollectionManager from "./BackgroundCollectionManager";

import AnalystThreatFeed from "./analyst/AnalystThreatFeed";
import AnalystIncidentResponse from "./analyst/AnalystIncidentResponse";
import AnalystInvestigation from "./analyst/AnalystInvestigation";
import AnalystReports from "./analyst/AnalystReports";

import ViewerSystemStatus from "./viewer/ViewerSystemStatus";
import ViewerAlerts from "./viewer/ViewerAlerts";
import ViewerCompliance from "./viewer/ViewerCompliance";

// Mock user data - in real app this would come from auth context
const mockUser = {
  id: "1",
  email: "admin@company.com",
  role: "admin" as "admin" | "analyst" | "viewer",
  name: "John Admin",
};

interface DashboardStats {
  totalEndpoints: number;
  criticalVulns: number;
  activeIncidents: number;
  complianceScore: number;
  healthyEndpoints: number;
  vulnerableEndpoints: number;
  criticalEndpoints: number;
}

const mockStats: DashboardStats = {
  totalEndpoints: 127,
  criticalVulns: 12,
  activeIncidents: 3,
  complianceScore: 87,
  healthyEndpoints: 115,
  vulnerableEndpoints: 12,
  criticalEndpoints: 12,
};

export default function DashboardLayout() {
  const [currentUser, setCurrentUser] = useState(mockUser);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalEndpoints: 0,
    criticalVulns: 0,
    activeIncidents: 0,
    complianceScore: 0,
    healthyEndpoints: 0,
    vulnerableEndpoints: 0,
    criticalEndpoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: "30",
    notifications: true,
    logSources: [
      { id: '1', name: 'Windows Event Logs', enabled: true, type: 'windows' },
      { id: '2', name: 'Linux Syslog', enabled: true, type: 'linux' },
      { id: '3', name: 'Application Logs', enabled: false, type: 'application' },
      { id: '4', name: 'Network Logs', enabled: true, type: 'network' },
      { id: '5', name: 'Security Logs', enabled: true, type: 'security' }
    ]
  });

  const [newLogSource, setNewLogSource] = useState({ name: '', type: 'application' });

  const dashboardService = new DashboardDataService();

  const { permission, isSubscribed, requestPermission, subscribe } = useNotifications();
  const { triggerTestNotification } = useSecurityNotifications();

  // Load real dashboard data
  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh if enabled - this overrides the 30 second default
    let interval: NodeJS.Timeout;
    if (settings.autoRefresh) {
      const intervalMs = parseInt(settings.refreshInterval) * 1000;
      console.log(`🔄 Auto-refresh enabled: ${settings.refreshInterval}s interval`);
      
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing dashboard data...');
        loadDashboardData();
        
        // Show notification if enabled
        if (settings.notifications && 'Notification' in window) {
          // Request permission if not granted
          if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
          
          // Show notification for critical updates
          if (Notification.permission === 'granted' && dashboardStats.criticalVulns > 0) {
            new Notification('Komra Security Alert', {
              body: `${dashboardStats.criticalVulns} critical vulnerabilities detected`,
              icon: '/favicon.ico',
              tag: 'security-alert'
            });
          }
        }
      }, intervalMs);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        console.log('🔄 Auto-refresh interval cleared');
      }
    };
  }, [settings.autoRefresh, settings.refreshInterval, settings.notifications, dashboardStats.criticalVulns]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [endpoints, riskMetrics] = await Promise.all([
        dashboardService.getEndpoints(),
        dashboardService.getRiskMetrics()
      ]);

      // Calculate compliance score based on vulnerability ratio
      const complianceScore = Math.max(0, 100 - Math.round((riskMetrics.criticalCount + riskMetrics.highCount) / Math.max(riskMetrics.totalEndpoints, 1) * 100));

      setDashboardStats({
        totalEndpoints: riskMetrics.totalEndpoints,
        criticalVulns: riskMetrics.criticalCount + riskMetrics.highCount,
        activeIncidents: riskMetrics.criticalCount, // Critical vulns as active incidents
        complianceScore,
        healthyEndpoints: riskMetrics.healthyEndpoints,
        vulnerableEndpoints: riskMetrics.vulnerableEndpoints,
        criticalEndpoints: riskMetrics.criticalEndpoints,
      });

      console.log('📊 Dashboard data loaded:', {
        endpoints: endpoints.length,
        critical: riskMetrics.criticalCount,
        compliance: complianceScore
      });
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      // Keep existing mock data on error
    } finally {
      setIsLoading(false);
    }
  };

  // TEMPORARY: Role switcher for testing - DELETE AFTER TESTING
  const handleRoleChange = (newRole: "admin" | "analyst" | "viewer") => {
    const roleNames = {
      admin: "John Admin",
      analyst: "Jane Analyst", 
      viewer: "Bob Viewer"
    };
    
    const roleEmails = {
      admin: "admin@company.com",
      analyst: "analyst@company.com",
      viewer: "viewer@company.com"
    };

    setCurrentUser({
      ...currentUser,
      role: newRole,
      name: roleNames[newRole],
      email: roleEmails[newRole]
    });
    
    // Reset tab when switching roles
    setSelectedTab("overview");
    
    console.log(`🔧 Switched to ${newRole} role for testing`);
  };

  const handleSettingsChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (key === 'notifications' && value === true) {
      // Request notification permission when enabling notifications
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Komra Security Dashboard', {
              body: 'Push notifications enabled successfully',
              icon: '/favicon.ico'
            });
          }
        });
      }
    }
    
    console.log(`⚙️ Settings updated: ${key} = ${value}`);
  };

  const handleLogSourceToggle = (sourceId: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      logSources: prev.logSources.map(source => 
        source.id === sourceId ? { ...source, enabled } : source
      )
    }));
    console.log(`📋 Log source ${sourceId} ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleAddLogSource = () => {
    if (newLogSource.name.trim()) {
      const newSource = {
        id: Date.now().toString(),
        name: newLogSource.name.trim(),
        type: newLogSource.type,
        enabled: true
      };
      
      setSettings(prev => ({
        ...prev,
        logSources: [...prev.logSources, newSource]
      }));
      
      setNewLogSource({ name: '', type: 'application' });
      console.log(`📋 Added new log source: ${newSource.name}`);
    }
  };

  const handleRemoveLogSource = (sourceId: string) => {
    setSettings(prev => ({
      ...prev,
      logSources: prev.logSources.filter(source => source.id !== sourceId)
    }));
    console.log(`📋 Removed log source: ${sourceId}`);
  };

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Admin Overview Stats - Now with real data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Endpoints
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : dashboardStats.totalEndpoints}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.healthyEndpoints} healthy, {dashboardStats.vulnerableEndpoints} vulnerable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Vulnerabilities
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? "..." : dashboardStats.criticalVulns}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.criticalEndpoints} endpoints affected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Incidents
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoading ? "..." : dashboardStats.activeIncidents}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Score
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dashboardStats.complianceScore >= 80 ? 'text-green-600' : 
              dashboardStats.complianceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {isLoading ? "..." : `${dashboardStats.complianceScore}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.complianceScore >= 80 ? 'Good' : 
               dashboardStats.complianceScore >= 60 ? 'Needs improvement' : 'Critical'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="collection">Background Collection</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminThreatSummary />
            <AdminSystemHealth />
          </div>
        </TabsContent>

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="system">
          <AdminSystemHealth />
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditTrail />
        </TabsContent>

        <TabsContent value="collection">
          <BackgroundCollectionManager />
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Push Notification Management</h3>
                <p className="text-sm text-muted-foreground">
                  Configure and manage push notifications for security events
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={permission === 'granted' && isSubscribed ? "default" : "secondary"}>
                  {permission === 'granted' && isSubscribed ? (
                    <>
                      <Bell className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <BellOff className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>

                {/* Notification Bell */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (permission === 'granted' && isSubscribed) {
                      triggerTestNotification();
                    } else {
                      requestPermission().then(granted => {
                        if (granted) subscribe();
                      });
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  {permission === 'granted' && isSubscribed ? (
                    <>
                      <Bell className="h-4 w-4" />
                      Test Alert
                    </>
                  ) : (
                    <>
                      <BellOff className="h-4 w-4" />
                      Enable Alerts
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Browser Notifications</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Permission Status</Label>
                        <Badge variant={permission === 'granted' ? 'default' : 'destructive'}>
                          {permission}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Push Subscription</Label>
                        <Badge variant={isSubscribed ? 'default' : 'secondary'}>
                          {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Service Worker</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Registration Status</Label>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Background Sync</Label>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        if (permission === 'granted' && isSubscribed) {
                          triggerTestNotification();
                        }
                      }}
                      disabled={permission !== 'granted' || !isSubscribed}
                      variant="outline"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Send Test Notification
                    </Button>
                    <Button 
                      onClick={() => window.open('/notifications', '_blank')}
                      variant="outline"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderAnalystDashboard = () => (
    <div className="space-y-6">
      {/* Analyst Overview Stats - Enhanced with real data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Threats
            </CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? "..." : dashboardStats.criticalVulns}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.criticalEndpoints} endpoints at risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Investigations
            </CardTitle>
            <Search className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Math.ceil(dashboardStats.criticalVulns / 3)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.activeIncidents} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monitored Systems
            </CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? "..." : dashboardStats.totalEndpoints}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.healthyEndpoints} healthy systems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2.4h</div>
            <p className="text-xs text-muted-foreground">Average response</p>
          </CardContent>
        </Card>
      </div>

      {/* Analyst Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="threats">Threat Feed</TabsTrigger>
          <TabsTrigger value="incidents">Incident Response</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="threats">
          <AnalystThreatFeed />
        </TabsContent>

        <TabsContent value="incidents">
          <AnalystIncidentResponse />
        </TabsContent>

        <TabsContent value="investigation">
          <AnalystInvestigation />
        </TabsContent>

        <TabsContent value="reports">
          <AnalystReports />
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderViewerDashboard = () => (
    <div className="space-y-6">
      {/* Viewer Overview Stats - Read-only with real data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className={`h-4 w-4 ${
              dashboardStats.criticalEndpoints === 0 ? 'text-green-500' : 'text-red-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dashboardStats.criticalEndpoints === 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {dashboardStats.criticalEndpoints === 0 ? 'Healthy' : 'At Risk'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.totalEndpoints} systems monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {isLoading ? "..." : dashboardStats.criticalVulns}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.activeIncidents} require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Status
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dashboardStats.complianceScore >= 80 ? 'text-green-600' : 
              dashboardStats.complianceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {isLoading ? "..." : `${dashboardStats.complianceScore}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.complianceScore >= 80 ? 'Within acceptable range' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings.autoRefresh ? `${settings.refreshInterval}s` : 'Manual'}
            </div>
            <p className="text-xs text-muted-foreground">
              {settings.autoRefresh ? 'Auto-refresh enabled' : 'Manual refresh only'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Viewer Tabs - Read-only views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <ViewerSystemStatus />
        </TabsContent>

        <TabsContent value="alerts">
          <ViewerAlerts />
        </TabsContent>

        <TabsContent value="compliance">
          <ViewerCompliance />
        </TabsContent>
      </Tabs>
    </div>
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Dashboard Settings
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Auto Refresh */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Auto Refresh
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically refresh dashboard data (overrides 30s default)
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => handleSettingsChange('autoRefresh', checked)}
                  />
                </div>

                {/* Refresh Interval */}
                {settings.autoRefresh && (
                  <div className="space-y-2 pl-6 border-l-2 border-muted">
                    <Label>Refresh Interval</Label>
                    <Select 
                      value={settings.refreshInterval} 
                      onValueChange={(value) => handleSettingsChange('refreshInterval', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Current: Every {settings.refreshInterval} seconds
                    </p>
                  </div>
                )}

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser notifications for critical security events
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', checked)}
                  />
                </div>

                {/* Log Sources Management */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <Label className="text-base font-medium">Log Sources</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Configure which log sources to monitor for security events
                  </p>
                  
                  {/* Existing Log Sources */}
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {settings.logSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={source.enabled}
                            onCheckedChange={(checked) => handleLogSourceToggle(source.id, checked)}
                          />
                          <div>
                            <p className="font-medium text-sm">{source.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {source.type} logs
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLogSource(source.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Log Source */}
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                    <Label className="text-sm font-medium">Add New Log Source</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Log source name..."
                        value={newLogSource.name}
                        onChange={(e) => setNewLogSource(prev => ({ ...prev, name: e.target.value }))}
                        className="flex-1"
                      />
                      <Select
                        value={newLogSource.type}
                        onValueChange={(value) => setNewLogSource(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="application">Application</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="network">Network</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="windows">Windows</SelectItem>
                          <SelectItem value="linux">Linux</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="web">Web Server</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAddLogSource}
                        disabled={!newLogSource.name.trim()}
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Log Sources Summary */}
                  <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                    {settings.logSources.filter(s => s.enabled).length} of {settings.logSources.length} log sources active
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-2">
                  <Button 
                    onClick={() => {
                      loadDashboardData();
                      console.log('🔄 Manual refresh triggered');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Now
                  </Button>
                  <Button 
                    onClick={() => setIsSettingsOpen(false)} 
                    className="flex-1"
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      case "analyst":
        return <Search className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-700 text-white">Administrator</Badge>;
      case "analyst":
        return <Badge className="bg-blue-700 text-white">Security Analyst</Badge>;
      case "viewer":
        return <Badge className="bg-green-700 text-white">Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="bg-background p-6 min-h-screen w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Koma Security Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive security monitoring and vulnerability management
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* TEMPORARY: Role Switcher for Testing - DELETE AFTER TESTING */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={currentUser.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Settings className="h-3 w-3" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="analyst">
                    <div className="flex items-center gap-2">
                      <Search className="h-3 w-3" />
                      Analyst
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      Viewer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-xs px-2 py-1">
                🧪 Testing Mode
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getRoleIcon(currentUser.role)}
            {getRoleBadge(currentUser.role)}
          </div>
        </div>
      </div>
      {/* Role-based Dashboard Content */}
      {currentUser.role === "admin" && renderAdminDashboard()}
      {currentUser.role === "analyst" && renderAnalystDashboard()}
      {currentUser.role === "viewer" && renderViewerDashboard()}
      {/* Role Access Notice */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Role-Based Access Control Active</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Dashboard content is customized based on your role permissions.
          {currentUser.role === "admin" &&
            " You have full administrative access to all features."}
          {currentUser.role === "analyst" &&
            " You have access to investigation and analysis tools."}
          {currentUser.role === "viewer" &&
            " You have read-only access to system status and reports."}
        </p>
      </div>
    </div>
  );
}