import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ActiveSession {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

export class SessionManagementService {
  /**
   * Create a new session for a user
   */
  static async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    sessionTimeout: number = 1800
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_user_session', {
        p_user_id: userId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_session_timeout: sessionTimeout
      });

      if (error) {
        console.error('Session creation error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Session created successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }

  /**
   * End a session (called on logout)
   */
  static async endSession(sessionId: string): Promise<boolean> {
    try {
      console.log('🟢 endSession called for:', sessionId);
      
      const { data, error } = await supabase
        .from('auth_sessions')
        .update({ 
          is_active: false,
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select();

      console.log('🟢 endSession update result:', { data, error });

      if (error) {
        console.error('🟢 Error ending session:', error);
        return false;
      }

      console.log('🟢 Session ended successfully:', data);
      return true;
    } catch (error) {
      console.error('🟢 Exception ending session:', error);
      return false;
    }
  }

  /**
   * Get all active sessions for all users (admin only)
   */
  static async getAllActiveSessions(): Promise<ActiveSession[]> {
    try {
      const { data, error } = await supabase
        .from('auth_sessions')
        .select(`
          id,
          user_id,
          created_at,
          last_activity,
          expires_at,
          ip_address,
          user_agent,
          is_active
        `)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      // Fetch user details
      const userIds = Array.from(new Set(data.map(s => s.user_id)));
      const { data: users } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      return data.map(session => ({
        ...session,
        user_email: userMap.get(session.user_id)?.email,
        user_name: userMap.get(session.user_id)?.full_name,
      }));
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  /**
   * Get active sessions for a specific user
   */
  static async getUserSessions(userId: string): Promise<ActiveSession[]> {
    try {
      const { data, error } = await supabase
        .from('auth_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  /**
   * Terminate a specific session
   */
  static async terminateSession(
    sessionId: string,
    terminatedBy?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('terminate_user_session', {
        p_session_id: sessionId,
        p_terminated_by: terminatedBy || null,
      });

      if (error) {
        console.error('Error terminating session:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error terminating session:', error);
      return false;
    }
  }

  /**
   * Terminate all sessions for a user (force logout)
   */
  static async terminateAllUserSessions(
    userId: string,
    terminatedBy?: string
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('terminate_all_user_sessions', {
        p_user_id: userId,
        p_terminated_by: terminatedBy || null,
      });

      if (error) {
        console.error('Error terminating all sessions:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      return 0;
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_sessions');

      if (error) {
        console.error('Error cleaning up sessions:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return 0;
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats() {
    try {
      const { data: activeSessions } = await supabase
        .from('auth_sessions')
        .select('user_id', { count: 'exact' })
        .eq('is_active', true);

      const { data: totalSessions } = await supabase
        .from('auth_sessions')
        .select('id', { count: 'exact' });

      const { data: recentSessions } = await supabase
        .from('auth_sessions')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return {
        activeCount: activeSessions?.length || 0,
        totalCount: totalSessions?.length || 0,
        last24Hours: recentSessions?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching session stats:', error);
      return {
        activeCount: 0,
        totalCount: 0,
        last24Hours: 0,
      };
    }
  }
}