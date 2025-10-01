import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'warning';
  metadata?: Record<string, any>;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  private getClientInfo() {
    if (typeof window !== 'undefined') {
      return {
        ip_address: 'client-side', // In production, get from server
        user_agent: navigator.userAgent,
      };
    }
    return {
      ip_address: 'server-side',
      user_agent: 'server',
    };
  }

  public async log(
    action: string,
    resourceType: string,
    details: Record<string, any>,
    options: {
      resourceId?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      status?: 'success' | 'failure' | 'warning';
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      const clientInfo = this.getClientInfo();

      const logEntry: AuditLogEntry = {
        user_id: user?.id || 'anonymous',
        user_email: user?.email || 'anonymous@system.local',
        action,
        resource_type: resourceType,
        resource_id: options.resourceId,
        details,
        ...clientInfo,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        severity: options.severity || 'medium',
        status: options.status || 'success',
        metadata: options.metadata,
      };

      // Store in Supabase
      const { error } = await supabase
        .from('audit_logs')
        .insert([logEntry]);

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Fallback to local storage for critical logs
        this.fallbackLog(logEntry);
      }

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Audit Log:', logEntry);
      }
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  private fallbackLog(entry: AuditLogEntry): void {
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('audit_logs_fallback') || '[]');
      logs.push(entry);
      // Keep only last 100 entries
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      localStorage.setItem('audit_logs_fallback', JSON.stringify(logs));
    }
  }

  // Specific logging methods for common actions
  public async logPermissionMatrixUpdate(
    changedPermissions: Array<{
      role: string;
      permission: string;
      action: 'granted' | 'revoked';
      permissionDescription?: string;
    }>
  ): Promise<void> {
    await this.log(
      'PERMISSION_MATRIX_UPDATED',
      'permission_matrix',
      {
        total_changes: changedPermissions.length,
        changes: changedPermissions,
        matrix_update_timestamp: new Date().toISOString(),
        affected_roles: [...new Set(changedPermissions.map(c => c.role))],
        affected_permissions: [...new Set(changedPermissions.map(c => c.permission))],
      },
      {
        severity: 'critical',
        status: 'success',
        metadata: {
          action_category: 'permission_management',
          compliance_relevant: true,
          security_relevant: true,
          change_type: 'bulk_update',
          requires_notification: true,
        },
      }
    );
  }

  public async logReportGeneration(reportData: any): Promise<void> {
    await this.log(
      'REPORT_GENERATED',
      'security_report',
      {
        report_type: 'security_audit',
        total_endpoints: reportData.endpointInventory?.totalEndpoints || 0,
        total_cves: reportData.vulnerabilitySummary?.totalCVEs || 0,
        critical_cves: reportData.vulnerabilitySummary?.bySeverity?.critical || 0,
        risk_rating: reportData.executiveSummary?.overallRiskRating || 'unknown',
        environments: reportData.metadata?.targetEnvironments || [],
        report_version: reportData.metadata?.reportVersion || '1.0',
      },
      {
        severity: 'high',
        status: 'success',
        metadata: {
          action_category: 'report_generation',
          compliance_relevant: true,
          data_sensitivity: 'high',
        },
      }
    );
  }

  public async logReportDownload(format: string): Promise<void> {
    await this.log(
      'REPORT_DOWNLOADED',
      'security_report',
      {
        download_format: format,
        download_timestamp: new Date().toISOString(),
      },
      {
        severity: 'medium',
        status: 'success',
        metadata: {
          action_category: 'data_export',
          compliance_relevant: true,
        },
      }
    );
  }

  public async logReportEmail(recipients: string[]): Promise<void> {
    await this.log(
      'REPORT_EMAILED',
      'security_report',
      {
        recipient_count: recipients.length,
        recipients: recipients.map(email => email.replace(/(.{2}).*(@.*)/, '$1***$2')), // Mask emails
        email_timestamp: new Date().toISOString(),
      },
      {
        severity: 'high',
        status: 'success',
        metadata: {
          action_category: 'data_sharing',
          compliance_relevant: true,
          data_sensitivity: 'high',
        },
      }
    );
  }

  public async logUserLogin(): Promise<void> {
    await this.log(
      'USER_LOGIN',
      'authentication',
      {
        login_timestamp: new Date().toISOString(),
        login_method: 'standard',
      },
      {
        severity: 'low',
        status: 'success',
        metadata: {
          action_category: 'authentication',
          security_relevant: true,
        },
      }
    );
  }

  public async logUserLogout(): Promise<void> {
    await this.log(
      'USER_LOGOUT',
      'authentication',
      {
        logout_timestamp: new Date().toISOString(),
        session_duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
      },
      {
        severity: 'low',
        status: 'success',
        metadata: {
          action_category: 'authentication',
          security_relevant: true,
        },
      }
    );
  }

  public async logDataAccess(resourceType: string, resourceId: string, action: string): Promise<void> {
    await this.log(
      `DATA_${action.toUpperCase()}`,
      resourceType,
      {
        resource_accessed: resourceId,
        access_timestamp: new Date().toISOString(),
        access_type: action,
      },
      {
        resourceId,
        severity: 'medium',
        status: 'success',
        metadata: {
          action_category: 'data_access',
          compliance_relevant: true,
        },
      }
    );
  }

  public async logSecurityEvent(eventType: string, details: Record<string, any>): Promise<void> {
    await this.log(
      `SECURITY_${eventType.toUpperCase()}`,
      'security_event',
      {
        event_type: eventType,
        event_timestamp: new Date().toISOString(),
        ...details,
      },
      {
        severity: 'critical',
        status: details.status || 'warning',
        metadata: {
          action_category: 'security',
          security_relevant: true,
          requires_investigation: true,
        },
      }
    );
  }

  public async logSystemChange(changeType: string, details: Record<string, any>): Promise<void> {
    await this.log(
      `SYSTEM_${changeType.toUpperCase()}`,
      'system_configuration',
      {
        change_type: changeType,
        change_timestamp: new Date().toISOString(),
        ...details,
      },
      {
        severity: 'high',
        status: 'success',
        metadata: {
          action_category: 'system_administration',
          compliance_relevant: true,
        },
      }
    );
  }

  // Query methods for audit log retrieval
  public async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    severity?: string;
    limit?: number;
  } = {}): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to retrieve audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }

  public async getAuditSummary(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalActions: number;
    uniqueUsers: number;
    topActions: Array<{ action: string; count: number }>;
    securityEvents: number;
    complianceEvents: number;
  }> {
    try {
      const startDate = new Date();
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', startDate.toISOString());

      if (error || !data) {
        return {
          totalActions: 0,
          uniqueUsers: 0,
          topActions: [],
          securityEvents: 0,
          complianceEvents: 0,
        };
      }

      const uniqueUsers = new Set(data.map(log => log.user_id)).size;
      const actionCounts = data.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([action, count]) => ({ action, count: count as number }));

      const securityEvents = data.filter(log => 
        log.action.startsWith('SECURITY_') || 
        log.metadata?.security_relevant
      ).length;

      const complianceEvents = data.filter(log => 
        log.metadata?.compliance_relevant
      ).length;

      return {
        totalActions: data.length,
        uniqueUsers,
        topActions,
        securityEvents,
        complianceEvents,
      };
    } catch (error) {
      console.error('Error generating audit summary:', error);
      return {
        totalActions: 0,
        uniqueUsers: 0,
        topActions: [],
        securityEvents: 0,
        complianceEvents: 0,
      };
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();