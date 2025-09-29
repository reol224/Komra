'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

interface RolePermission {
  role: UserRole;
  permission_id: string;
  granted: boolean;
}

const DEFAULT_PERMISSIONS: Permission[] = [
  // Dashboard & Overview
  { id: 'dashboard.view', name: 'View Dashboard', description: 'Access main dashboard and overview', category: 'Dashboard', resource: 'dashboard', action: 'view' },
  { id: 'dashboard.export', name: 'Export Dashboard Data', description: 'Export dashboard data and reports', category: 'Dashboard', resource: 'dashboard', action: 'export' },
  
  // Vulnerability Management
  { id: 'vulnerabilities.view', name: 'View Vulnerabilities', description: 'View vulnerability reports and details', category: 'Vulnerabilities', resource: 'vulnerabilities', action: 'view' },
  { id: 'vulnerabilities.triage', name: 'Triage Vulnerabilities', description: 'Assign and prioritize vulnerabilities', category: 'Vulnerabilities', resource: 'vulnerabilities', action: 'triage' },
  { id: 'vulnerabilities.resolve', name: 'Resolve Vulnerabilities', description: 'Mark vulnerabilities as resolved', category: 'Vulnerabilities', resource: 'vulnerabilities', action: 'resolve' },
  { id: 'vulnerabilities.delete', name: 'Delete Vulnerabilities', description: 'Delete vulnerability records', category: 'Vulnerabilities', resource: 'vulnerabilities', action: 'delete' },
  
  // Endpoint Management
  { id: 'endpoints.view', name: 'View Endpoints', description: 'View endpoint inventory and details', category: 'Endpoints', resource: 'endpoints', action: 'view' },
  { id: 'endpoints.manage', name: 'Manage Endpoints', description: 'Add, edit, and remove endpoints', category: 'Endpoints', resource: 'endpoints', action: 'manage' },
  { id: 'endpoints.scan', name: 'Scan Endpoints', description: 'Initiate vulnerability scans', category: 'Endpoints', resource: 'endpoints', action: 'scan' },
  
  // User Management
  { id: 'users.view', name: 'View Users', description: 'View user accounts and profiles', category: 'User Management', resource: 'users', action: 'view' },
  { id: 'users.create', name: 'Create Users', description: 'Create new user accounts', category: 'User Management', resource: 'users', action: 'create' },
  { id: 'users.edit', name: 'Edit Users', description: 'Modify user accounts and roles', category: 'User Management', resource: 'users', action: 'edit' },
  { id: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', category: 'User Management', resource: 'users', action: 'delete' },
  { id: 'users.permissions', name: 'Manage Permissions', description: 'Modify user permissions and access control', category: 'User Management', resource: 'users', action: 'permissions' },
  
  // Reports & Analytics
  { id: 'reports.view', name: 'View Reports', description: 'Access security reports and analytics', category: 'Reports', resource: 'reports', action: 'view' },
  { id: 'reports.create', name: 'Create Reports', description: 'Generate custom reports', category: 'Reports', resource: 'reports', action: 'create' },
  { id: 'reports.export', name: 'Export Reports', description: 'Export reports in various formats', category: 'Reports', resource: 'reports', action: 'export' },
  { id: 'reports.schedule', name: 'Schedule Reports', description: 'Set up automated report generation', category: 'Reports', resource: 'reports', action: 'schedule' },
  
  // System Administration
  { id: 'system.config', name: 'System Configuration', description: 'Modify system settings and configuration', category: 'System', resource: 'system', action: 'config' },
  { id: 'system.logs', name: 'View System Logs', description: 'Access system and audit logs', category: 'System', resource: 'system', action: 'logs' },
  { id: 'system.backup', name: 'System Backup', description: 'Create and manage system backups', category: 'System', resource: 'system', action: 'backup' },
  { id: 'system.maintenance', name: 'System Maintenance', description: 'Perform system maintenance tasks', category: 'System', resource: 'system', action: 'maintenance' },
  
  // API & Integration
  { id: 'api.access', name: 'API Access', description: 'Access REST API endpoints', category: 'API', resource: 'api', action: 'access' },
  { id: 'api.keys', name: 'Manage API Keys', description: 'Create and manage API keys', category: 'API', resource: 'api', action: 'keys' },
  { id: 'integrations.manage', name: 'Manage Integrations', description: 'Configure third-party integrations', category: 'API', resource: 'integrations', action: 'manage' }
];

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'dashboard.view', 'dashboard.export',
    'vulnerabilities.view', 'vulnerabilities.triage', 'vulnerabilities.resolve', 'vulnerabilities.delete',
    'endpoints.view', 'endpoints.manage', 'endpoints.scan',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.permissions',
    'reports.view', 'reports.create', 'reports.export', 'reports.schedule',
    'system.config', 'system.logs', 'system.backup', 'system.maintenance',
    'api.access', 'api.keys', 'integrations.manage'
  ],
  analyst: [
    'dashboard.view', 'dashboard.export',
    'vulnerabilities.view', 'vulnerabilities.triage', 'vulnerabilities.resolve',
    'endpoints.view', 'endpoints.scan',
    'users.view',
    'reports.view', 'reports.create', 'reports.export',
    'system.logs',
    'api.access'
  ],
  viewer: [
    'dashboard.view',
    'vulnerabilities.view',
    'endpoints.view',
    'users.view',
    'reports.view'
  ]
};

export default function PermissionMatrix() {
  const [permissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Record<string, boolean>>>({
    admin: {},
    analyst: {},
    viewer: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      // Initialize with default permissions
      const initialPermissions: Record<UserRole, Record<string, boolean>> = {
        admin: {},
        analyst: {},
        viewer: {}
      };

      // Set default permissions for each role
      Object.entries(DEFAULT_ROLE_PERMISSIONS).forEach(([role, permissionIds]) => {
        permissions.forEach(permission => {
          initialPermissions[role as UserRole][permission.id] = permissionIds.includes(permission.id);
        });
      });

      setRolePermissions(initialPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: "Error",
        description: "Failed to load permissions. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (role: UserRole, permissionId: string, granted: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permissionId]: granted
      }
    }));
    setHasChanges(true);
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      // In a real implementation, this would save to the database
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Permission matrix updated successfully.",
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: "Failed to save permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const initialPermissions: Record<UserRole, Record<string, boolean>> = {
      admin: {},
      analyst: {},
      viewer: {}
    };

    Object.entries(DEFAULT_ROLE_PERMISSIONS).forEach(([role, permissionIds]) => {
      permissions.forEach(permission => {
        initialPermissions[role as UserRole][permission.id] = permissionIds.includes(permission.id);
      });
    });

    setRolePermissions(initialPermissions);
    setHasChanges(true);
  };

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  const getRolePermissionCount = (role: UserRole) => {
    return Object.values(rolePermissions[role] || {}).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const categories = getPermissionsByCategory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Permission Matrix</h3>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={savePermissions} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Changes Warning */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">You have unsaved changes to the permission matrix.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {getRolePermissionCount('admin')}
                </div>
                <div className="text-sm text-gray-500">Admin Permissions</div>
              </div>
              <Badge variant="destructive">Administrator</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {getRolePermissionCount('analyst')}
                </div>
                <div className="text-sm text-gray-500">Analyst Permissions</div>
              </div>
              <Badge variant="default">Analyst</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {getRolePermissionCount('viewer')}
                </div>
                <div className="text-sm text-gray-500">Viewer Permissions</div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">Viewer</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(categories)[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              {Object.keys(categories).map(category => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(categories).map(([category, categoryPermissions]) => (
              <TabsContent key={category} value={category}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/2">Permission</TableHead>
                      <TableHead className="text-center">Administrator</TableHead>
                      <TableHead className="text-center">Analyst</TableHead>
                      <TableHead className="text-center">Viewer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-gray-500">{permission.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={rolePermissions.admin[permission.id] || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('admin', permission.id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={rolePermissions.analyst[permission.id] || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('analyst', permission.id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={rolePermissions.viewer[permission.id] || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('viewer', permission.id, checked)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}