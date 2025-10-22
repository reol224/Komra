"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  mfa_enabled?: boolean;
  last_activity?: string;
  session_timeout?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const DEMO_USERS = {
  'admin@komra.security': {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@komra.security',
    full_name: 'Admin User',
    role: 'admin' as UserRole,
    mfa_enabled: false,
  },
  'analyst@komra.security': {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'analyst@komra.security',
    full_name: 'Analyst User',
    role: 'analyst' as UserRole,
    mfa_enabled: false,
  },
  'viewer@komra.security': {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'viewer@komra.security',
    full_name: 'Viewer User',
    role: 'viewer' as UserRole,
    mfa_enabled: false,
  }
};

const roleHierarchy: Record<UserRole, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

const permissions: Record<UserRole, Record<string, string[]>> = {
  viewer: {
    vulnerabilities: ['read'],
    endpoints: ['read'],
    reports: ['read'],
    triage: ['read'],
    audit_logs: [],
  },
  analyst: {
    vulnerabilities: ['read', 'update'],
    endpoints: ['read', 'update'],
    reports: ['read', 'create', 'export'],
    triage: ['read', 'create', 'update'],
    audit_logs: ['read'],
  },
  admin: {
    vulnerabilities: ['read', 'create', 'update', 'delete'],
    endpoints: ['read', 'create', 'update', 'delete'],
    reports: ['read', 'create', 'update', 'delete', 'export'],
    triage: ['read', 'create', 'update', 'delete'],
    audit_logs: ['read', 'create', 'update', 'delete'],
    users: ['read', 'create', 'update', 'delete'],
    system: ['read', 'create', 'update', 'delete'],
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo user in localStorage
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser) {
      try {
        const userData = JSON.parse(demoUser);
        setUser(userData);
        // Refresh user data from database to get latest MFA status
        refreshUserFromDB(userData.id);
      } catch (error) {
        console.error('Error parsing demo user:', error);
        localStorage.removeItem('demo_user');
      }
    }
    setLoading(false);
  }, []);

  const refreshUserFromDB = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, mfa_enabled, last_activity')
        .eq('id', userId)
        .single();

      if (!error && data) {
        const updatedUser = {
          ...data,
          session_timeout: getSessionTimeoutByRole(data.role as UserRole),
        };
        setUser(updatedUser);
        localStorage.setItem('demo_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const refreshUser = async () => {
    if (user?.id) {
      await refreshUserFromDB(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Check if it's a demo user
    const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS];
    
    if (demoUser) {
      // For demo users, verify password using the database function
      const { data: isValid, error } = await supabase.rpc('verify_user_password', {
        input_user_id: demoUser.id,
        input_password: password
      });

      if (error) {
        console.error('Password verification error:', error);
        throw new Error('Invalid login credentials');
      }

      if (!isValid) {
        throw new Error('Invalid login credentials');
      }

      // Demo user login successful
      const userData = {
        id: demoUser.id,
        email: demoUser.email,
        full_name: demoUser.full_name,
        role: demoUser.role,
        mfa_enabled: demoUser.mfa_enabled,
        session_timeout: getSessionTimeoutByRole(demoUser.role),
      };
      
      setUser(userData);
      localStorage.setItem('demo_user', JSON.stringify(userData));
      return;
    }

    // Regular Supabase authentication for non-demo users
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Update last activity
    await updateLastActivity();
  };

  const signOut = async () => {
    // Clear demo user
    localStorage.removeItem('demo_user');
    setUser(null);
    
    // Also sign out from Supabase if there's a session
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Supabase signout error:', error);
  };

  const updateLastActivity = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('users')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  };

  const getSessionTimeoutByRole = (role: UserRole): number => {
    switch (role) {
      case 'admin':
        return 15 * 60 * 1000; // 15 minutes for admin
      case 'analyst':
        return 30 * 60 * 1000; // 30 minutes for analyst
      case 'viewer':
        return 30 * 60 * 1000; // 30 minutes for viewer
      default:
        return 30 * 60 * 1000;
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!user) return false;
    const userPermissions = permissions[user.role];
    const resourcePermissions = userPermissions[resource];
    return resourcePermissions?.includes(action) || false;
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    hasPermission,
    canAccess,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}