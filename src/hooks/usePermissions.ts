import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { permissionService, UserPermissions } from '@/lib/permissionService';

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      loadPermissions();
    } else {
      setPermissions({});
      setLoading(false);
    }
  }, [user?.role]);

  const loadPermissions = async () => {
    if (!user?.role) return;
    
    try {
      setLoading(true);
      const userPermissions = await permissionService.getRolePermissions(user.role);
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error loading user permissions:', error);
      // Fail-closed: empty permissions on error for security
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionId: string): boolean => {
    return permissions[permissionId] === true;
  };

  const hasAnyPermission = (permissionIds: string[]): boolean => {
    return permissionIds.some(id => permissions[id] === true);
  };

  const hasAllPermissions = (permissionIds: string[]): boolean => {
    return permissionIds.every(id => permissions[id] === true);
  };

  const canAccess = (resource: string, action: string): boolean => {
    const permissionId = `${resource}.${action}`;
    return hasPermission(permissionId);
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    refreshPermissions: loadPermissions
  };
}

export function usePermission(permissionId: string) {
  const { hasPermission, loading } = usePermissions();
  return { hasPermission: hasPermission(permissionId), loading };
}