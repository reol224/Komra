'use client';

import { useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from '@/components/ui/use-toast';

interface SecurityEvent {
  id: string;
  type: 'critical_vulnerability' | 'high_severity_threat' | 'system_offline' | 'new_endpoint' | 'compliance_alert';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  endpoint?: string;
  cve?: string;
}

export const useSecurityNotifications = () => {
  const { isSubscribed, permission } = useNotifications();
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  // Simulate real-time security events
  useEffect(() => {
    if (!isSubscribed || permission !== 'granted') return;

    const checkForSecurityEvents = async () => {
      try {
        // In production, this would be a real API call to your backend
        // For demo purposes, we'll simulate security events
        const mockEvents: SecurityEvent[] = [
          {
            id: `event-${Date.now()}`,
            type: 'critical_vulnerability',
            title: 'Critical Vulnerability Detected',
            description: 'CVE-2024-1234 affects Windows Server endpoints',
            severity: 'critical',
            timestamp: new Date().toISOString(),
            endpoint: 'WIN-SERVER-01',
            cve: 'CVE-2024-1234'
          }
        ];

        // Check if there are new events
        const newEvents = mockEvents.filter(event => event.id !== lastEventId);
        
        if (newEvents.length > 0) {
          const latestEvent = newEvents[0];
          setLastEventId(latestEvent.id);
          
          // Send push notification
          await sendSecurityNotification(latestEvent);
        }
      } catch (error) {
        console.error('Error checking for security events:', error);
      }
    };

    // Check for events every 30 seconds (in production, use WebSocket or Server-Sent Events)
    const interval = setInterval(checkForSecurityEvents, 30000);
    
    return () => clearInterval(interval);
  }, [isSubscribed, permission, lastEventId]);

  const sendSecurityNotification = async (event: SecurityEvent) => {
    try {
      // Get notification settings
      const settings = JSON.parse(localStorage.getItem('komra-notification-settings') || '{}');
      
      // Check if this type of notification is enabled
      const shouldNotify = checkNotificationSettings(event.type, settings);
      
      if (!shouldNotify) return;

      // Create notification data
      const notificationData = {
        title: getNotificationTitle(event),
        body: event.description,
        icon: '/images/icon-rounded-corners.png',
        badge: '/images/icon-rounded-corners.png',
        tag: `security-${event.type}`,
        data: {
          eventId: event.id,
          type: event.type,
          severity: event.severity,
          url: '/dashboard'
        },
        priority: event.severity === 'critical' ? 'high' : 'normal'
      };

      // In production, send this to your push notification service
      // For demo, we'll show a browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notificationData.title, {
          body: notificationData.body,
          icon: notificationData.icon,
          tag: notificationData.tag,
          data: notificationData.data,
          requireInteraction: event.severity === 'critical'
        });
      }

      // Also show toast notification
      toast({
        title: notificationData.title,
        description: notificationData.body,
        variant: event.severity === 'critical' ? 'destructive' : 'default',
      });

    } catch (error) {
      console.error('Error sending security notification:', error);
    }
  };

  const checkNotificationSettings = (eventType: SecurityEvent['type'], settings: any): boolean => {
    switch (eventType) {
      case 'critical_vulnerability':
        return settings.criticalVulnerabilities !== false;
      case 'high_severity_threat':
        return settings.highSeverityThreats !== false;
      case 'system_offline':
        return settings.systemOffline !== false;
      case 'new_endpoint':
        return settings.newEndpoints === true;
      case 'compliance_alert':
        return settings.complianceAlerts !== false;
      default:
        return true;
    }
  };

  const getNotificationTitle = (event: SecurityEvent): string => {
    switch (event.type) {
      case 'critical_vulnerability':
        return `🚨 Critical Security Alert`;
      case 'high_severity_threat':
        return `⚠️ High Severity Threat`;
      case 'system_offline':
        return `📴 System Offline`;
      case 'new_endpoint':
        return `🔍 New Endpoint Discovered`;
      case 'compliance_alert':
        return `📋 Compliance Alert`;
      default:
        return `🔔 Security Notification`;
    }
  };

  const triggerTestNotification = () => {
    const testEvent: SecurityEvent = {
      id: `test-${Date.now()}`,
      type: 'critical_vulnerability',
      title: 'Test Notification',
      description: 'This is a test security notification from Komra Dashboard',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      endpoint: 'TEST-ENDPOINT',
      cve: 'CVE-TEST-2024'
    };

    sendSecurityNotification(testEvent);
  };

  return {
    triggerTestNotification
  };
};