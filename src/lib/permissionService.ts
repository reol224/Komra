import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/contexts/AuthContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

export interface UserPermissions {
  [permissionId: string]: boolean;
}

class PermissionService {
  private permissionsCache: Map<UserRole, UserPermissions> = new Map();
  private cacheExpiry: Map<UserRole, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all permissions for a specific role
   */
  async getRolePermissions(role: UserRole): Promise<UserPermissions> {
    // Check cache first
    const cached = this.permissionsCache.get(role);
    const expiry = this.cacheExpiry.get(role);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id, granted')
        .eq('role', role);

      if (error) throw error;

      const permissions: UserPermissions = {};
      data?.forEach(rp => {
        permissions[rp.permission_id] = rp.granted;
      });

      // Cache the result
      this.permissionsCache.set(role, permissions);
      this.cacheExpiry.set(role, Date.now() + this.CACHE_DURATION);

      return permissions;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return {};
    }
  }

  /**
   * Check if a role has a specific permission
   */
  async hasPermission(role: UserRole, permissionId: string): Promise<boolean> {
    const permissions = await this.getRolePermissions(role);
    return permissions[permissionId] === true;
  }

  /**
   * Check if a role has any of the specified permissions
   */
  async hasAnyPermission(role: UserRole, permissionIds: string[]): Promise<boolean> {
    const permissions = await this.getRolePermissions(role);
    return permissionIds.some(id => permissions[id] === true);
  }

  /**
   * Check if a role has all of the specified permissions
   */
  async hasAllPermissions(role: UserRole, permissionIds: string[]): Promise<boolean> {
    const permissions = await this.getRolePermissions(role);
    return permissionIds.every(id => permissions[id] === true);
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category, name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  }

  /**
   * Clear the permissions cache for a specific role or all roles
   */
  clearCache(role?: UserRole): void {
    if (role) {
      this.permissionsCache.delete(role);
      this.cacheExpiry.delete(role);
    } else {
      this.permissionsCache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Bulk check permissions for UI components
   */
  async checkPermissions(role: UserRole, checks: { [key: string]: string }): Promise<{ [key: string]: boolean }> {
    const permissions = await this.getRolePermissions(role);
    const results: { [key: string]: boolean } = {};
    
    Object.entries(checks).forEach(([key, permissionId]) => {
      results[key] = permissions[permissionId] === true;
    });

    return results;
  }
}

// Export singleton instance
export const permissionService = new PermissionService();

// Common permission constants
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_EXPORT: 'dashboard.export',
  
  // Vulnerabilities
  VULNERABILITIES_VIEW: 'vulnerabilities.view',
  VULNERABILITIES_TRIAGE: 'vulnerabilities.triage',
  VULNERABILITIES_RESOLVE: 'vulnerabilities.resolve',
  VULNERABILITIES_DELETE: 'vulnerabilities.delete',
  
  // Endpoints
  ENDPOINTS_VIEW: 'endpoints.view',
  ENDPOINTS_MANAGE: 'endpoints.manage',
  ENDPOINTS_SCAN: 'endpoints.scan',
  
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_PERMISSIONS: 'users.permissions',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_SCHEDULE: 'reports.schedule',
  
  // System
  SYSTEM_CONFIG: 'system.config',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  
  // API
  API_ACCESS: 'api.access',
  API_KEYS: 'api.keys',
  INTEGRATIONS_MANAGE: 'integrations.manage'
} as const;