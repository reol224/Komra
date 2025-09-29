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

export default function PermissionMatrix() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
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
      setLoading(true);
      
      // Load all permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category, name');

      if (permissionsError) throw permissionsError;

      // Load role permissions
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (rolePermissionsError) throw rolePermissionsError;

      setPermissions(permissionsData || []);

      // Build role permissions object
      const rolePermissionsMap: Record<UserRole, Record<string, boolean>> = {
        admin: {},
        analyst: {},
        viewer: {}
      };

      // Initialize all permissions as false
      (permissionsData || []).forEach(permission => {
        rolePermissionsMap.admin[permission.id] = false;
        rolePermissionsMap.analyst[permission.id] = false;
        rolePermissionsMap.viewer[permission.id] = false;
      });

      // Set granted permissions to true
      (rolePermissionsData || []).forEach(rp => {
        if (rolePermissionsMap[rp.role as UserRole]) {
          rolePermissionsMap[rp.role as UserRole][rp.permission_id] = rp.granted;
        }
      });

      setRolePermissions(rolePermissionsMap);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: "Error",
        description: "Failed to load permissions from database.",
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
      
      Object.entries(rolePermissions).forEach(([role, permissions]) => {
        Object.entries(permissions).forEach(([permissionId, granted]) => {
          rolePermissionUpdates.push({
            role,
            permission_id: permissionId,
            granted,
            updated_at: new Date().toISOString()
          });
        });
      });

      // Delete existing role permissions and insert new ones
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .neq('role', 'nonexistent'); // Delete all

      if (deleteError) throw deleteError;

      // Insert new permissions
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(rolePermissionUpdates);

      if (insertError) throw insertError;
      
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

  const resetToDefaults = async () => {
    try {
      // Reset to default permissions by reloading from database
      await loadPermissions();
      setHasChanges(false);
      toast({
        title: "Reset Complete",
        description: "Permissions have been reset to current database values.",
      });
    } catch (error) {
      console.error('Error resetting permissions:', error);
      toast({
        title: "Error",
        description: "Failed to reset permissions.",
        variant: "destructive",
      });
    }
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
            Reset to Database
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