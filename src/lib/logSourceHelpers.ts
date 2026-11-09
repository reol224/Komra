import { supabase } from './supabase';

export interface AuditLogWithSource {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'warning';
  metadata?: Record<string, any>;
  details?: Record<string, any>;
  user_email?: string;
  source_type?: string;
}

/**
 * Maps audit action to log source type based on action category metadata.
 * Supports: security, application, system. Falls back to application.
 * @param action - The audit action name
 * @param metadata - The audit metadata record
 * @returns The classified source type
 */
function getSourceTypeForAction(
  action: string,
  metadata?: Record<string, any>
): string {
  const category = metadata?.action_category || '';

  const categoryToSourceMap: Record<string, string> = {
    authentication: 'security',
    user_administration: 'security',
    threat_management: 'security',
    vulnerability_scanning: 'application',
    system_health: 'system',
    incident_response: 'security',
    configuration_change: 'system',
    access_control: 'security',
    compliance: 'security',
  };

  if (category in categoryToSourceMap) {
    return categoryToSourceMap[category];
  }

  // Fallback detection based on action name
  if (action.includes('SECURITY') || action.includes('AUTH')) return 'security';
  if (action.includes('USER')) return 'security';
  if (action.includes('SYSTEM') || action.includes('HEALTH')) return 'system';
  if (action.includes('THREAT') || action.includes('VULNERABILITY'))
    return 'application';

  return 'application';
}

/**
 * Filter audit logs based on enabled log sources
 */
export async function filterAuditLogsBySourcePreferences<T extends { action: string; metadata?: any }>(
  logs: T[],
  userId: string
): Promise<T[]> {
  try {
    // Fetch user's log source preferences
    const [{ data: preferences, error: prefError }, { data: customSources, error: customError }] =
      await Promise.all([
        supabase
          .from('user_log_source_preferences')
          .select('log_source_type, enabled')
          .eq('user_id', userId),
        supabase
          .from('user_custom_log_sources')
          .select('source_type, enabled')
          .eq('user_id', userId),
      ]);

    // Handle query errors
    if (prefError || customError) {
      console.error('Error fetching preferences:', prefError || customError);
      // On error, return all logs (don't break the UI)
      return logs;
    }

    // If no preference rows exist, user hasn't configured anything - return all logs
    if (!preferences || preferences.length === 0) {
      return logs;
    }

    const enabledSources = new Set<string>();

    // Add enabled predefined sources
    preferences.forEach((p) => {
      if (p.enabled) enabledSources.add(p.log_source_type);
    });

    // Add enabled custom sources
    (customSources || []).forEach((s) => {
      if (s.enabled) enabledSources.add(s.source_type);
    });

    // If no sources are enabled (all explicitly disabled), return empty
    if (enabledSources.size === 0) {
      return [];
    }

    // Filter logs based on enabled sources
    return logs.filter((log) => {
      const sourceType = getSourceTypeForAction(log.action, log.metadata);
      return enabledSources.has(sourceType);
    });
  } catch (error) {
    console.error('Error filtering audit logs by source preferences:', error);
    // On error, return all logs (don't break the UI)
    return logs;
  }
}

/**
 * Aggregates audit logs by source type and returns count per type.
 * @param logs - The audit logs to count
 * @returns Record mapping source type to log count
 */
export async function getAuditLogCountsBySource<T extends { action: string; metadata?: any }>(
  logs: T[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  logs.forEach((log) => {
    const sourceType = getSourceTypeForAction(log.action, log.metadata);
    counts[sourceType] = (counts[sourceType] || 0) + 1;
  });

  return counts;
}
