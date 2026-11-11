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
import { supabase } from "@/lib/supabase";
import { useNotifications } from "@/contexts/NotificationContext";
import { useSecurityNotifications } from "@/hooks/useSecurityNotifications";
import { useAuth, UserRole } from "@/contexts/AuthContext";

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

const ROLE_TABS: Record<UserRole, string[]> = {
  admin: ["overview", "users", "system", "audit", "notifications"],
  analyst: ["threats", "incidents", "investigation", "reports"],
  viewer: ["status", "alerts", "compliance"],
};

const DEFAULT_ROLE_TAB: Record<UserRole, string> = {
  admin: "overview",
  analyst: "threats",
  viewer: "status",
};

interface LogSourcePreference {
  type: string;
  enabled: boolean;
}

interface CustomLogSource {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

/** Renders the role-specific dashboard and its administrator settings. */
export default function DashboardLayout() {
  const { signOut, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState(
    () => user?.role ? DEFAULT_ROLE_TAB[user.role] : DEFAULT_ROLE_TAB.admin,
  );
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
  const [logSourcePreferences, setLogSourcePreferences] = useState<LogSourcePreference[]>([]);
  const [customLogSources, setCustomLogSources] = useState<CustomLogSource[]>([]);
  const [logSourceError, setLogSourceError] = useState<string | null>(null);

  const [newLogSource, setNewLogSource] = useState({
    name: "",
    type: "application",
  });

  const dashboardService = useMemo(() => new DashboardDataService(), []);

  const { permission, isSubscribed, requestPermission, subscribe } =
    useNotifications();
  const { triggerTestNotification } = useSecurityNotifications();

  /** Sends a same-origin log-source request with the active session credentials. */
  const fetchLogSources = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: "same-origin",
    });
  }, []);

  /** Loads persisted log-source preferences and reports retrieval failures. */
  const loadLogSources = useCallback(async () => {
    try {
      const response = await fetchLogSources('/api/admin/log-sources');
      if (!response.ok) throw new Error('Failed to load log sources');
      const data = await response.json();
      setLogSourcePreferences(data.preferences || []);
      setCustomLogSources(data.customSources || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading log sources';
      console.error(message, error);
      setLogSourceError(message);
    }
  }, [fetchLogSources]);

  useEffect(() => {
    void loadLogSources();
  }, [loadLogSources]);

  useEffect(() => {
    if (!user?.role) return;
    setSelectedTab((currentTab) =>
      ROLE_TABS[user.role].includes(currentTab)
        ? currentTab
        : DEFAULT_ROLE_TAB[user.role],
    );
  }, [user?.role]);

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

  /** Updates a dashboard setting and requests browser permission when needed. */
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

  /** Persists a source toggle and restores server state if the update fails. */
  const handleLogSourceToggle = (sourceId: string, enabled: boolean) => {
    setLogSourceError(null);
    const isCustom = customLogSources.some((s) => s.id === sourceId);
    const isPredefined = logSourcePreferences.some((p) => p.type === sourceId);

    if (isCustom) {
      const source = customLogSources.find((s) => s.id === sourceId);
      if (source) {
        void (async () => {
          try {
            const response = await fetchLogSources('/api/admin/log-sources', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update-source',
                source: { ...source, enabled },
              }),
            });
            if (!response.ok) {
              throw new Error('Failed to update log source');
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Error updating log source';
            setLogSourceError(message);
            // Reload from server to restore correct state
            void loadLogSources();
          }
        })();
      }
      // Optimistic update
      setCustomLogSources((prev) =>
        prev.map((source) =>
          source.id === sourceId ? { ...source, enabled } : source
        )
      );
    } else if (isPredefined) {
      void (async () => {
        try {
          const response = await fetchLogSources('/api/admin/log-sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update-preference',
              preferences: logSourcePreferences.map((p) =>
                p.type === sourceId ? { ...p, enabled } : p
              ),
            }),
          });
          if (!response.ok) {
            throw new Error('Failed to update log preference');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error updating log preference';
          setLogSourceError(message);
          // Reload from server to restore correct state
          void loadLogSources();
        }
      })();
      // Optimistic update
      setLogSourcePreferences((prev) =>
        prev.map((pref) =>
          pref.type === sourceId ? { ...pref, enabled } : pref
        )
      );
    }
  };

  /** Adds a custom log source and reloads the persisted source list. */
  const handleAddLogSource = async () => {
    if (newLogSource.name.trim()) {
      try {
        setLogSourceError(null);
        const response = await fetchLogSources('/api/admin/log-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add-source',
            source: {
              name: newLogSource.name.trim(),
              type: newLogSource.type,
              enabled: true,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add log source');
        }

        setNewLogSource({ name: "", type: "application" });
        // Reload from server to get the persisted source with ID
        void loadLogSources();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error adding log source';
        setLogSourceError(message);
      }
    }
  };

  /** Removes a custom source and restores server state if removal fails. */
  const handleRemoveLogSource = async (sourceId: string) => {
    setLogSourceError(null);
    const isCustom = customLogSources.some((s) => s.id === sourceId);

    if (isCustom) {
      // Optimistic update
      setCustomLogSources((prev) =>
        prev.filter((source) => source.id !== sourceId)
      );

      try {
        const response = await fetchLogSources('/api/admin/log-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'remove-source',
            source: { id: sourceId },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to remove log source');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error removing log source';
        setLogSourceError(message);
        // Reload from server to restore correct state
        void loadLogSources();
      }
    }
  };

  /** Renders inventory totals or the appropriate loading/error state. */
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
              Packages Reported
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

  /** Renders the administrator dashboard tabs and panels. */
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

  /** Renders the analyst dashboard tabs and panels. */
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

  /** Renders the viewer dashboard tabs and read-only panels. */
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

  /** Renders the role-specific header control or icon. */
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

                  {logSourceError && (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/30">
                      {logSourceError}
                    </div>
                  )}

                  {/* Existing Log Sources */}
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {logSourcePreferences.map((pref) => (
                      <div
                        key={`pref-${pref.type}`}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            aria-label={`${pref.type} Logs`}
                            checked={pref.enabled}
                            onCheckedChange={(checked) =>
                              handleLogSourceToggle(pref.type, checked)
                            }
                          />
                          <div>
                            <p className="font-medium text-sm capitalize">{pref.type} Logs</p>
                            <p className="text-xs text-muted-foreground">
                              {pref.type} logs
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {customLogSources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Switch
                            aria-label={source.name}
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
                          onClick={() => void handleRemoveLogSource(source.id)}
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
                        onChange={(e) => {
                          setLogSourceError(null);
                          setNewLogSource((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }));
                        }}
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
                        onClick={() => void handleAddLogSource()}
                        disabled={!newLogSource.name.trim()}
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Log Sources Summary */}
                  <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                    {[
                      ...logSourcePreferences.filter((p) => p.enabled),
                      ...customLogSources.filter((s) => s.enabled),
                    ].length} of{" "}
                    {logSourcePreferences.length + customLogSources.length} log sources active
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
                    Close
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

  /** Renders the badge describing the current dashboard role. */
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
                if (await signOut()) window.location.href = "/";
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
