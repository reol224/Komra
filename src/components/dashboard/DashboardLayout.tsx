"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  Activity,
  AlertTriangle,
  Server,
  FileText,
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import role-specific components
import AdminUserManagement from "./admin/AdminUserManagement";
import AdminSystemHealth from "./admin/AdminSystemHealth";
import AdminThreatSummary from "./admin/AdminThreatSummary";
import AdminAuditTrail from "./admin/AdminAuditTrail";

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
}

const mockStats: DashboardStats = {
  totalEndpoints: 127,
  criticalVulns: 12,
  activeIncidents: 3,
  complianceScore: 87,
};

export default function DashboardLayout() {
  const [currentUser, setCurrentUser] = useState(mockUser);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: "30",
    notifications: true,
    darkMode: false,
    compactView: false,
    showAdvancedMetrics: true
  });

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
  };

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Admin Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Endpoints
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalEndpoints}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
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
              {mockStats.criticalVulns}
            </div>
            <p className="text-xs text-muted-foreground">-3 from last week</p>
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
              {mockStats.activeIncidents}
            </div>
            <p className="text-xs text-muted-foreground">2 resolved today</p>
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
            <div className="text-2xl font-bold text-green-600">
              {mockStats.complianceScore}%
            </div>
            <p className="text-xs text-muted-foreground">+5% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
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
      </Tabs>
    </div>
  );

  const renderAnalystDashboard = () => (
    <div className="space-y-6">
      {/* Analyst Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Threats
            </CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">24</div>
            <p className="text-xs text-muted-foreground">+6 new today</p>
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
            <div className="text-2xl font-bold text-orange-600">8</div>
            <p className="text-xs text-muted-foreground">3 high priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reports Generated
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">15</div>
            <p className="text-xs text-muted-foreground">This month</p>
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
      {/* Viewer Overview Stats - Read-only */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">7</div>
            <p className="text-xs text-muted-foreground">2 require attention</p>
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
            <div className="text-2xl font-bold text-green-600">87%</div>
            <p className="text-xs text-muted-foreground">
              Within acceptable range
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2m ago</div>
            <p className="text-xs text-muted-foreground">
              Auto-refresh enabled
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Dashboard Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Auto Refresh */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Refresh</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically refresh dashboard data
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => handleSettingsChange('autoRefresh', checked)}
                  />
                </div>

                {/* Refresh Interval */}
                {settings.autoRefresh && (
                  <div className="space-y-2">
                    <Label>Refresh Interval</Label>
                    <Select 
                      value={settings.refreshInterval} 
                      onValueChange={(value) => handleSettingsChange('refreshInterval', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for critical events
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', checked)}
                  />
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch to dark theme
                    </p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => handleSettingsChange('darkMode', checked)}
                  />
                </div>

                {/* Compact View */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact View</Label>
                    <p className="text-sm text-muted-foreground">
                      Show more data in less space
                    </p>
                  </div>
                  <Switch
                    checked={settings.compactView}
                    onCheckedChange={(checked) => handleSettingsChange('compactView', checked)}
                  />
                </div>

                {/* Advanced Metrics */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Advanced Metrics</Label>
                    <p className="text-sm text-muted-foreground">
                      Display detailed performance data
                    </p>
                  </div>
                  <Switch
                    checked={settings.showAdvancedMetrics}
                    onCheckedChange={(checked) => handleSettingsChange('showAdvancedMetrics', checked)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => setIsSettingsOpen(false)} 
                    className="w-full"
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
    <div className="bg-background p-6 w-[2956px] h-[1959px]">
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