// Service Worker for Push Notifications
const CACHE_NAME = 'komra-security-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'Komra Security Alert',
        body: event.data.text() || 'New security notification',
        icon: '/images/icon rounded corners.png',
        badge: '/images/icon rounded corners.png'
      };
    }
  }

  const options = {
    title: notificationData.title || 'Komra Security Alert',
    body: notificationData.body || 'New security notification',
    icon: notificationData.icon || '/images/icon rounded corners.png',
    badge: notificationData.badge || '/images/icon rounded corners.png',
    tag: notificationData.tag || 'komra-security',
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/images/icon rounded corners.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: notificationData.priority === 'high',
    silent: notificationData.priority === 'low'
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the dashboard or specific page
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open dashboard
    event.waitUntil(
      self.clients.openWindow('/dashboard')
    );
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync for notifications
      console.log('Background sync triggered')
    );
  }
});