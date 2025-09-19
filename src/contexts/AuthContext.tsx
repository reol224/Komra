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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role as UserRole,
        mfa_enabled: data.mfa_enabled || false,
        last_activity: data.last_activity,
        session_timeout: getSessionTimeoutByRole(data.role),
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Create user profile if it doesn't exist
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        const { data, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            email: authUser.user.email!,
            role: 'analyst', // Default role
            mfa_enabled: false,
          })
          .select()
          .single();

        if (!insertError && data) {
          setUser({
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            role: data.role as UserRole,
            mfa_enabled: false,
            session_timeout: getSessionTimeoutByRole(data.role),
          });
        }
      }
    } finally {
      setLoading(false);
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Update last activity
    await updateLastActivity();
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
    updateLastActivity,
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