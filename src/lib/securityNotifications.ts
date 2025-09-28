// Helper function to trigger security notifications via API
export async function triggerSecurityNotification(
  type: 'critical_vulnerability' | 'high_severity_threat' | 'system_offline' | 'new_endpoint' | 'compliance_alert',
  details: any
) {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'trigger-security',
        notification: {
          type,
          details
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error triggering security notification:', error);
    throw error;
  }
}

// Predefined notification templates
export const SECURITY_NOTIFICATION_TEMPLATES = {
  critical_vulnerability: {
    title: '🚨 Critical Security Alert',
    priority: 'high' as const,
    getBody: (details: any) => `Critical vulnerability detected: ${details.cve || 'Unknown CVE'}`,
    tag: 'critical-vulnerability'
  },
  high_severity_threat: {
    title: '⚠️ High Severity Threat',
    priority: 'normal' as const,
    getBody: (details: any) => `High severity threat detected on ${details.endpoint || 'unknown endpoint'}`,
    tag: 'high-severity-threat'
  },
  system_offline: {
    title: '📴 System Offline',
    priority: 'normal' as const,
    getBody: (details: any) => `System ${details.endpoint || 'unknown'} has gone offline`,
    tag: 'system-offline'
  },
  new_endpoint: {
    title: '🔍 New Endpoint Discovered',
    priority: 'low' as const,
    getBody: (details: any) => `New endpoint discovered: ${details.endpoint || 'unknown'}`,
    tag: 'new-endpoint'
  },
  compliance_alert: {
    title: '📋 Compliance Alert',
    priority: 'normal' as const,
    getBody: (details: any) => `Compliance violation detected: ${details.violation || 'unknown violation'}`,
    tag: 'compliance-alert'
  }
};

export type SecurityNotificationType = keyof typeof SECURITY_NOTIFICATION_TEMPLATES;