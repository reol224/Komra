'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';

interface NotificationContextType {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Register service worker
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      setServiceWorkerRegistration(registration);
      
      // Check if already subscribed
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive security alerts and updates.",
        });
        return true;
      } else {
        toast({
          title: "Notifications Blocked",
          description: "Enable notifications in your browser settings to receive security alerts.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!serviceWorkerRegistration || permission !== 'granted') return false;
    
    try {
      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }
      
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });
      
      // Send subscription to server
      console.log('Push subscription:', subscription);
      
      // Save subscription to database
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          subscription: subscription
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save subscription');
      }
      
      setIsSubscribed(true);
      
      toast({
        title: "Push Notifications Enabled",
        description: "You'll receive real-time security alerts.",
      });
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to enable push notifications. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!serviceWorkerRegistration) return false;
    
    try {
      const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        // Unsubscribe from database first
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'unsubscribe',
            subscription: subscription
          })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          console.warn('Failed to remove subscription from database:', result.error);
        }
        
        // Then unsubscribe from browser
        await subscription.unsubscribe();
        setIsSubscribed(false);
        
        toast({
          title: "Notifications Disabled",
          description: "You'll no longer receive push notifications.",
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          notification: {
            title: 'Komra Security Test',
            body: 'This is a test notification from Komra Security Dashboard',
            icon: '/images/icon-rounded-corners.png',
            tag: 'test-notification'
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test Notification Sent",
          description: `Sent to ${result.stats?.successful || 0} subscribers`,
        });
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send test notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value: NotificationContextType = {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}