import React from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface ProtectedComponentProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
}

export function ProtectedComponent({
  children,
  requiredRole,
  resource,
  action,
  fallback,
}: ProtectedComponentProps) {
  const { user, hasPermission, canAccess } = useAuth();

  if (!user) {
    return (
      fallback || (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Please sign in to access this content.
          </AlertDescription>
        </Alert>
      )
    );
  }

  // Check role-based permission
  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      fallback || (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this content. Required role: {requiredRole}
          </AlertDescription>
        </Alert>
      )
    );
  }

  // Check resource-action permission
  if (resource && action && !canAccess(resource, action)) {
    return (
      fallback || (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to {action} {resource}.
          </AlertDescription>
        </Alert>
      )
    );
  }

  return <>{children}</>;
}

interface RoleBasedRenderProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleBasedRender({ children, roles, fallback }: RoleBasedRenderProps) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function usePermissions() {
  const { user, hasPermission, canAccess } = useAuth();

  return {
    user,
    isAdmin: user?.role === 'admin',
    isAnalyst: user?.role === 'analyst' || user?.role === 'admin',
    isViewer: !!user,
    hasPermission,
    canAccess,
    canRead: (resource: string) => canAccess(resource, 'read'),
    canCreate: (resource: string) => canAccess(resource, 'create'),
    canUpdate: (resource: string) => canAccess(resource, 'update'),
    canDelete: (resource: string) => canAccess(resource, 'delete'),
    canExport: (resource: string) => canAccess(resource, 'export'),
  };
}