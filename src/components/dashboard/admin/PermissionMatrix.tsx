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
import { auditLogger } from '@/lib/auditLogger';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

interface RolePermissions {
  [role: string]: {
    [permissionId: string]: boolean;
  };
}

// Define the default permissions for each role based on the provided data
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  admin: {
    'api.access': true,
    'api.keys': true,
    'dashboard.alerts': true,
    'dashboard.export': true,
    'dashboard.risk_assessment': true,
    'dashboard.view': true,
    'endpoints.manage': true,
    'endpoints.scan': true,
    'endpoints.view': true,
    'integrations.manage': true,
    'reports.create': true,
    'reports.download': true,
    'reports.export': true,
    'reports.generate': true,
    'reports.schedule': true,
    'reports.share': true,
    'reports.view': true,
    'system.audit_logs': true,
    'system.backup': true,
    'system.config': true,
    'system.escalate_threats': true,
    'system.health_monitoring': true,
    'system.logs': true,
    'system.maintenance': true,
    'system.settings': true,
    'system.threat_summary': true,
    'users.create': true,
    'users.delete': true,
    'users.edit': true,
    'users.permissions': true,
    'users.view': true,
    'vulnerabilities.assign': true,
    'vulnerabilities.delete': true,
    'vulnerabilities.remediation_plan': true,
    'vulnerabilities.resolve': true,
    'vulnerabilities.triage': true,
    'vulnerabilities.view': true
  },
  analyst: {
    'api.access': true,
    'api.keys': false,
    'dashboard.alerts': true,
    'dashboard.export': true,
    'dashboard.risk_assessment': true,
    'dashboard.view': true,
    'endpoints.manage': false,
    'endpoints.scan': true,
    'endpoints.view': true,
    'integrations.manage': false,
    'reports.create': true,
    'reports.download': true,
    'reports.export': true,
    'reports.generate': true,
    'reports.schedule': false,
    'reports.share': true,
    'reports.view': true,
    'system.audit_logs': false,
    'system.backup': false,
    'system.config': false,
    'system.escalate_threats': false,
    'system.health_monitoring': false,
    'system.logs': true,
    'system.maintenance': false,
    'system.settings': false,
    'system.threat_summary': false,
    'users.create': false,
    'users.delete': false,
    'users.edit': false,
    'users.permissions': false,
    'users.view': true,
    'vulnerabilities.assign': true,
    'vulnerabilities.delete': false,
    'vulnerabilities.remediation_plan': true,
    'vulnerabilities.resolve': true,
    'vulnerabilities.triage': true,
    'vulnerabilities.view': true
  },
  viewer: {
    'api.access': false,
    'api.keys': false,
    'dashboard.alerts': true,
    'dashboard.export': false,
    'dashboard.risk_assessment': false,
    'dashboard.view': true,
    'endpoints.manage': false,
    'endpoints.scan': false,
    'endpoints.view': true,
    'integrations.manage': false,
    'reports.create': false,
    'reports.download': false,
    'reports.export': false,
    'reports.generate': false,
    'reports.schedule': false,
    'reports.share': false,
    'reports.view': true,
    'system.audit_logs': false,
    'system.backup': false,
    'system.config': false,
    'system.escalate_threats': false,
    'system.health_monitoring': false,
    'system.logs': false,
    'system.maintenance': false,
    'system.settings': false,
    'system.threat_summary': false,
    'users.create': false,
    'users.delete': false,
    'users.edit': false,
    'users.permissions': false,
    'users.view': true,
    'vulnerabilities.assign': false,
    'vulnerabilities.delete': false,
    'vulnerabilities.remediation_plan': false,
    'vulnerabilities.resolve': false,
    'vulnerabilities.triage': false,
    'vulnerabilities.view': true
  }
};

export default function PermissionMatrix() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [originalRolePermissions, setOriginalRolePermissions] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      // Fetch permissions - order by category first, then by name
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      if (permissionsError) throw permissionsError;

      // Sort by name within each category (secondary sort done client-side)
      const sortedPermissions = (permissionsData || []).sort((a, b) => {
        if (a.category === b.category) {
          return (a.name || '').localeCompare(b.name || '');
        }
        return 0; // Keep category order from DB
      });

      // Fetch role permissions
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (rolePermissionsError) throw rolePermissionsError;

      setPermissions(sortedPermissions);

      // Build role permissions object
      const rolePermsObj: RolePermissions = {};
      const roles = ['admin', 'analyst', 'viewer'];
      
      roles.forEach(role => {
        rolePermsObj[role] = {};
        sortedPermissions.forEach(permission => {
          const rolePermission = rolePermissionsData?.find(
            rp => rp.role === role && rp.permission_id === permission.id
          );
          rolePermsObj[role][permission.id] = rolePermission?.granted || false;
        });
      });

      setRolePermissions(rolePermsObj);
      // Store original state for change tracking
      setOriginalRolePermissions(JSON.parse(JSON.stringify(rolePermsObj)));
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: "Error",
        description: "Failed to load permissions",
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
      // Prepare data for upsert
      const rolePermissionUpdates: any[] = [];
      const changedPermissions: Array<{
        role: string;
        permission: string;
        action: 'granted' | 'revoked';
        permissionDescription?: string;
      }> = [];
      
      Object.entries(rolePermissions).forEach(([role, rolePerms]) => {
        Object.entries(rolePerms).forEach(([permissionId, granted]) => {
          rolePermissionUpdates.push({
            role,
            permission_id: permissionId,
            granted,
            updated_at: new Date().toISOString()
          });

          // Only track actual changes by comparing with original state
          const originalGranted = originalRolePermissions[role]?.[permissionId] || false;
          if (originalGranted !== granted) {
            const permission = permissions.find(p => p.id === permissionId);
            const permissionName = permission?.name || permissionId;
            const permissionDescription = permission?.description;
            
            changedPermissions.push({
              role,
              permission: permissionName,
              action: granted ? 'granted' : 'revoked',
              permissionDescription
            });
          }
        });
      });

      // Use upsert instead of delete/insert to avoid conflicts
      const { error: upsertError } = await supabase
        .from('role_permissions')
        .upsert(rolePermissionUpdates, {
          onConflict: 'role,permission_id'
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        throw upsertError;
      }

      // Log only actual changes
      try {
        if (changedPermissions.length > 0) {
          await auditLogger.logPermissionMatrixUpdate(changedPermissions);
        }
      } catch (auditError) {
        console.warn('Audit logging failed:', auditError);
        // Don't fail the entire operation if audit logging fails
      }

      // Update original state to current state after successful save
      setOriginalRolePermissions(JSON.parse(JSON.stringify(rolePermissions)));
      setHasChanges(false);
      
      const changeMessage = changedPermissions.length > 0 
        ? `${changedPermissions.length} permission changes saved and logged.`
        : 'Permission matrix saved (no changes detected).';
      
      toast({
        title: "Success",
        description: changeMessage,
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to save permissions: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      setLoading(true);
      // Reset to default permissions by reloading from database
      await loadPermissions();
      setHasChanges(false);
      toast({
        title: "Reset Complete",
        description: "All changes have been discarded and permissions reset to database values.",
      });
    } catch (error) {
      console.error('Error resetting permissions:', error);
      toast({
        title: "Error",
        description: "Failed to reset permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToRoleDefaults = async () => {
    try {
      setLoading(true);
      
      // Create new role permissions object with role defaults
      const defaultRolePermissions: RolePermissions = {};
      const roles = ['admin', 'analyst', 'viewer'];
      
      // Initialize with all permissions set to false
      roles.forEach(role => {
        defaultRolePermissions[role] = {};
        permissions.forEach(permission => {
          defaultRolePermissions[role][permission.id] = false;
        });
      });
      
      // Set default permissions for each role based on the provided data
      Object.entries(DEFAULT_ROLE_PERMISSIONS).forEach(([role, rolePermissions]) => {
        Object.entries(rolePermissions).forEach(([permissionName, granted]) => {
          // Find the permission by matching resource.action pattern
          const permission = permissions.find(p => {
            const fullName = `${p.resource}.${p.action}`;
            return fullName === permissionName || p.name === permissionName;
          });
          if (permission && defaultRolePermissions[role]) {
            defaultRolePermissions[role][permission.id] = granted;
          }
        });
      });
      
      setRolePermissions(defaultRolePermissions);
      setHasChanges(true);
      
      toast({
        title: "Reset to Role Defaults",
        description: "Permission matrix has been reset to the standard role defaults. Remember to save your changes.",
      });
    } catch (error) {
      console.error('Error resetting to role defaults:', error);
      toast({
        title: "Error",
        description: "Failed to reset to role defaults.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {};
    // Ensure permissions is an array before calling forEach
    if (Array.isArray(permissions)) {
      permissions.forEach(permission => {
        if (!categories[permission.category]) {
          categories[permission.category] = [];
        }
        categories[permission.category].push(permission);
      });
    }
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={loading}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Role Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to Role Defaults</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the permission matrix to the standard default permissions for each role:
                  <br />• <strong>Admin:</strong> Full system access and management
                  <br />• <strong>Analyst:</strong> Investigation, reporting, and limited management
                  <br />• <strong>Viewer:</strong> Read-only access to all systems
                  <br /><br />
                  This will overwrite current settings but won't save automatically.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetToRoleDefaults} className="bg-blue-600 hover:bg-blue-700">
                  Reset to Defaults
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={!hasChanges || loading}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Database Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to Database Defaults</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the permission matrix to the current database state, discarding all unsaved changes. The database contains the established default permissions for each role.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetToRoleDefaults} className="bg-blue-600 hover:bg-blue-700">
                  Reset to Database Defaults
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
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