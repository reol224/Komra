"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Activity,
  Users,
  Settings,
  Eye,
  Search,
  Bell,
  Database,
  Lock,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  BellOff,
  Server,
  FileText,
  LogOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AgentInventoryStats,
  DashboardDataService,
} from "@/lib/dashboardDataService";
import { useNotifications } from "@/contexts/NotificationContext";
import { useSecurityNotifications } from "@/hooks/useSecurityNotifications";
import { useAuth } from "@/contexts/AuthContext";

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

export default function DashboardLayout() {
  const { signOut, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inventoryStats, setInventoryStats] =
    useState<AgentInventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    notifications: true,
    logSources: [
      { id: "1", name: "Windows Event Logs", enabled: true, type: "windows" },
      { id: "2", name: "Linux Syslog", enabled: true, type: "linux" },
      {
        id: "3",
        name: "Application Logs",
        enabled: false,
        type: "application",
      },
      { id: "4", name: "Network Logs", enabled: true, type: "network" },
      { id: "5", name: "Security Logs", enabled: true, type: "security" },
    ],
  });

  const [newLogSource, setNewLogSource] = useState({
    name: "",
    type: "application",
  });

  const dashboardService = useMemo(() => new DashboardDataService(), []);

  const { permission, isSubscribed, requestPermission, subscribe } =
    useNotifications();
  const { triggerTestNotification } = useSecurityNotifications();

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setInventoryError(null);
      setInventoryStats(await dashboardService.getAgentInventoryStats());
    } catch (error) {
      console.error("Error loading agent inventory:", error);
      setInventoryError("Unable to load agent inventory. Check the database connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [dashboardService]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const handleSettingsChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    if (key === "notifications" && value === true) {
      // Request notification permission when enabling notifications
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Komra Security Dashboard", {
              body: "Push notifications enabled successfully",
              icon: "/favicon.ico",
            });
          }
        });
      }
    }

    console.log(`⚙️ Settings updated: ${key} = ${value}`);
  };

  const handleLogSourceToggle = (sourceId: string, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      logSources: prev.logSources.map((source) =>
        source.id === sourceId ? { ...source, enabled } : source,
      ),
    }));
    console.log(
      `📋 Log source ${sourceId} ${enabled ? "enabled" : "disabled"}`,
    );
  };

  const handleAddLogSource = () => {
    if (newLogSource.name.trim()) {
      const newSource = {
        id: Date.now().toString(),
        name: newLogSource.name.trim(),
        type: newLogSource.type,
        enabled: true,
      };

      setSettings((prev) => ({
        ...prev,
        logSources: [...prev.logSources, newSource],
      }));

      setNewLogSource({ name: "", type: "application" });
      console.log(`📋 Added new log source: ${newSource.name}`);
    }
  };

  const handleRemoveLogSource = (sourceId: string) => {
    setSettings((prev) => ({
      ...prev,
      logSources: prev.logSources.filter((source) => source.id !== sourceId),
    }));
    console.log(`📋 Removed log source: ${sourceId}`);
  };

  const renderInventoryOverview = () => (
    <>
      {inventoryError && (
        <p role="alert" className="text-sm text-destructive">
          {inventoryError}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agent Endpoints
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "..."
                : inventoryError
                  ? "Unavailable"
                  : (inventoryStats?.totalEndpoints ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Reporting to this Komra instance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Packages Scanned
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "..."
                : inventoryError
                  ? "Unavailable"
                  : (inventoryStats?.reportedPackages ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From each endpoint&apos;s latest scan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Services Observed
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "..."
                : inventoryError
                  ? "Unavailable"
                  : (inventoryStats?.reportedServices ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From each endpoint&apos;s latest scan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Latest Agent Scan
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold break-words">
              {isLoading
                ? "..."
                : inventoryError
                  ? "Unavailable"
                  : inventoryStats?.latestCollection
                    ? new Date(inventoryStats.latestCollection).toLocaleString()
                    : "No scans yet"}
            </div>
            <p className="text-xs text-muted-foreground">Most recent endpoint report</p>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {renderInventoryOverview()}

      {/* Admin Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
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

        <TabsContent value="notifications">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Push Notification Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure and manage push notifications for security events
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    permission === "granted" && isSubscribed
                      ? "default"
                      : "secondary"
                  }
                >
                  {permission === "granted" && isSubscribed ? (
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
                    if (permission === "granted" && isSubscribed) {
                      triggerTestNotification();
                    } else {
                      requestPermission().then((granted) => {
                        if (granted) subscribe();
                      });
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  {permission === "granted" && isSubscribed ? (
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
                        <Badge
                          variant={
                            permission === "granted" ? "default" : "destructive"
                          }
                        >
                          {permission}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Push Subscription</Label>
                        <Badge variant={isSubscribed ? "default" : "secondary"}>
                          {isSubscribed ? "Subscribed" : "Not Subscribed"}
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
                        if (permission === "granted" && isSubscribed) {
                          triggerTestNotification();
                        }
                      }}
                      disabled={permission !== "granted" || !isSubscribed}
                      variant="outline"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Send Test Notification
                    </Button>
                    <Button
                      onClick={() => window.open("/notifications", "_blank")}
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
      {renderInventoryOverview()}

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
      {renderInventoryOverview()}

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
                    onCheckedChange={(checked) =>
                      handleSettingsChange("notifications", checked)
                    }
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
                      <div
                        key={source.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={source.enabled}
                            onCheckedChange={(checked) =>
                              handleLogSourceToggle(source.id, checked)
                            }
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
                    <Label className="text-sm font-medium">
                      Add New Log Source
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Log source name..."
                        value={newLogSource.name}
                        onChange={(e) =>
                          setNewLogSource((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="flex-1"
                      />
                      <Select
                        value={newLogSource.type}
                        onValueChange={(value) =>
                          setNewLogSource((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="application">
                            Application
                          </SelectItem>
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
                    {settings.logSources.filter((s) => s.enabled).length} of{" "}
                    {settings.logSources.length} log sources active
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-2">
                  <Button
                    onClick={() => {
                      loadDashboardData();
                      console.log("🔄 Manual refresh triggered");
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
        return (
          <Badge className="bg-blue-700 text-white">Security Analyst</Badge>
        );
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
          <h1 className="text-3xl font-bold">Komra Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.full_name || user?.email || "there"}!
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-sm font-medium">
                {user?.full_name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && getRoleIcon(user.role)}
            {user && getRoleBadge(user.role)}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      {/* Role-based Dashboard Content */}
      {user?.role === "admin" && renderAdminDashboard()}
      {user?.role === "analyst" && renderAnalystDashboard()}
      {user?.role === "viewer" && renderViewerDashboard()}
      {/* Role Access Notice */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Role-Based Access Control Active</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Dashboard content is customized based on your role permissions.
          {user?.role === "admin" &&
            " You have full administrative access to all features."}
          {user?.role === "analyst" &&
            " You have access to investigation and analysis tools."}
          {user?.role === "viewer" &&
            " You have read-only access to system status and reports."}
        </p>
      </div>
    </div>
  );
}
