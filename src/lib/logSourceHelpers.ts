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

const LOG_SOURCE_TYPES = new Set([
  'application',
  'security',
  'network',
  'system',
  'windows',
  'linux',
  'database',
  'web',
]);

/**
 * Maps an audit action to a supported source using explicit source metadata,
 * then known action categories, and finally the existing action-name fallback.
 * @param action - The audit action name
 * @param metadata - Audit metadata, including optional source identifiers
 * @param sourceType - An explicit source type attached to the audit log
 * @returns The classified source type
 */
function getSourceTypeForAction(
  action: string,
  metadata?: Record<string, any>,
  sourceType?: string,
): string {
  const category = metadata?.action_category || '';
  const explicitSource = sourceType ?? metadata?.log_source_type ?? metadata?.source_type;
  if (typeof explicitSource === 'string' && LOG_SOURCE_TYPES.has(explicitSource)) {
    return explicitSource;
  }

  const categoryToSourceMap: Record<string, string> = {
    authentication: 'security',
    user_administration: 'security',
    permission_management: 'security',
    session_management: 'security',
    security: 'security',
    threat_management: 'security',
    vulnerability_scanning: 'application',
    system_health: 'system',
    system_administration: 'system',
    incident_response: 'security',
    configuration_change: 'system',
    access_control: 'security',
    compliance: 'security',
    network: 'network',
    windows: 'windows',
    linux: 'linux',
    database: 'database',
    web: 'web',
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
 * Filters audit logs by enabled predefined and custom source preferences.
 * A user with no saved preferences or custom sources retains unfiltered logs.
 * @param logs - The audit logs to filter
 * @param userId - The application profile ID owning the preferences
 * @returns Logs belonging to enabled source types
 */
export async function filterAuditLogsBySourcePreferences<T extends {
  action: string;
  metadata?: any;
  source_type?: string;
}>(
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

    const savedPreferences = preferences ?? [];
    const savedCustomSources = customSources ?? [];
    if (savedPreferences.length === 0 && savedCustomSources.length === 0) {
      return logs;
    }

    const enabledSources = new Set<string>();

    // Add enabled predefined sources
    savedPreferences.forEach((p) => {
      if (p.enabled) enabledSources.add(p.log_source_type);
    });

    // Add enabled custom sources
    savedCustomSources.forEach((s) => {
      if (s.enabled) enabledSources.add(s.source_type);
    });

    // If no sources are enabled (all explicitly disabled), return empty
    if (enabledSources.size === 0) {
      return [];
    }

    // Filter logs based on enabled sources
    return logs.filter((log) => {
      const sourceType = getSourceTypeForAction(
        log.action,
        log.metadata,
        log.source_type,
      );
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
export function getAuditLogCountsBySource<T extends {
  action: string;
  metadata?: any;
  source_type?: string;
}>(
  logs: T[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  logs.forEach((log) => {
    const sourceType = getSourceTypeForAction(log.action, log.metadata, log.source_type);
    counts[sourceType] = (counts[sourceType] || 0) + 1;
  });

  return counts;
}
