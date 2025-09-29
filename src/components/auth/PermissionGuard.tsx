import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  fallback = null,
  loading: loadingComponent = null
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess, loading } = usePermissions();

  if (loading) {
    return <>{loadingComponent}</>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else if (resource && action) {
    hasAccess = canAccess(resource, action);
  } else {
    // If no permission criteria specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard permission="users.permissions" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function AnalystOrAdmin({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard permissions={['vulnerabilities.triage', 'users.permissions']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}