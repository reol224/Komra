import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSecurityNotifications } from './useSecurityNotifications';
import { toast } from '@/components/ui/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';

// Mock the notification context
const mockUseNotifications = vi.fn();
vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => mockUseNotifications(),
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock Notification API
const mockNotification = vi.fn();
const originalNotification = global.Notification;

describe('useSecurityNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Default mock for useNotifications
    mockUseNotifications.mockReturnValue({
      isSubscribed: true,
      permission: 'granted',
    });

    // Mock localStorage
    const mockStorage: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => mockStorage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
    });

    // Mock Notification API
    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true,
    });
    (global.Notification as any).permission = 'granted';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(global, 'Notification', {
      value: originalNotification,
      writable: true,
      configurable: true,
    });
  });

  describe('initialization', () => {
    it('should return triggerTestNotification function', () => {
      const { result } = renderHook(() => useSecurityNotifications());
      
      expect(result.current.triggerTestNotification).toBeDefined();
      expect(typeof result.current.triggerTestNotification).toBe('function');
    });
  });

  describe('triggerTestNotification', () => {
    it('should send test notification when called', () => {
      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(toast).toHaveBeenCalledWith({
        title: '🚨 Critical Security Alert',
        description: 'This is a test security notification from Komra Dashboard',
        variant: 'destructive',
      });
    });

    it('should create browser notification when permission is granted', () => {
      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(mockNotification).toHaveBeenCalledWith(
        '🚨 Critical Security Alert',
        expect.objectContaining({
          body: 'This is a test security notification from Komra Dashboard',
          icon: '/images/icon-rounded-corners.png',
          tag: 'security-critical_vulnerability',
          requireInteraction: true,
        })
      );
    });

    it('should not create browser notification when Notification is not available', () => {
      // Set Notification to undefined to simulate unavailable API
      Object.defineProperty(global, 'Notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      // When Notification is undefined, browser notification won't be created
      // but toast should still work
      expect(mockNotification).not.toHaveBeenCalled();
      expect(toast).toHaveBeenCalled();
    });

    it('should not create browser notification when permission is not granted', () => {
      (global.Notification as any).permission = 'denied';

      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(mockNotification).not.toHaveBeenCalled();
      // toast should still work
      expect(toast).toHaveBeenCalled();
    });
  });

  describe('notification settings', () => {
    it('should respect criticalVulnerabilities setting when false', () => {
      localStorage.setItem('komra-notification-settings', JSON.stringify({
        criticalVulnerabilities: false,
      }));

      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(toast).not.toHaveBeenCalled();
      expect(mockNotification).not.toHaveBeenCalled();
    });

    it('should send notification when criticalVulnerabilities setting is true', () => {
      localStorage.setItem('komra-notification-settings', JSON.stringify({
        criticalVulnerabilities: true,
      }));

      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(toast).toHaveBeenCalled();
    });

    it('should send notification when criticalVulnerabilities setting is not set (default true)', () => {
      localStorage.setItem('komra-notification-settings', JSON.stringify({}));

      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(toast).toHaveBeenCalled();
    });
  });

  describe('security event polling', () => {
    it('should not poll for events when not subscribed', () => {
      mockUseNotifications.mockReturnValue({
        isSubscribed: false,
        permission: 'granted',
      });

      renderHook(() => useSecurityNotifications());
      
      // Fast-forward time by 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Since not subscribed, no notifications should be sent
      // The mock events are generated each interval, so we verify no toast was called
      expect(toast).not.toHaveBeenCalled();
    });

    it('should not poll for events when permission is not granted', () => {
      mockUseNotifications.mockReturnValue({
        isSubscribed: true,
        permission: 'denied',
      });

      renderHook(() => useSecurityNotifications());
      
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(toast).not.toHaveBeenCalled();
    });

    it('should poll for events when subscribed and permission granted', async () => {
      mockUseNotifications.mockReturnValue({
        isSubscribed: true,
        permission: 'granted',
      });

      renderHook(() => useSecurityNotifications());
      
      // Fast-forward time by 30 seconds to trigger the interval
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      // Should have triggered a notification for the mock event
      expect(toast).toHaveBeenCalled();
    });

    it('should clear interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      mockUseNotifications.mockReturnValue({
        isSubscribed: true,
        permission: 'granted',
      });

      const { unmount } = renderHook(() => useSecurityNotifications());
      
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('getNotificationTitle', () => {
    it('should use critical alert title for critical_vulnerability type', () => {
      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '🚨 Critical Security Alert',
        })
      );
    });
  });

  describe('notification variant', () => {
    it('should use destructive variant for critical severity', () => {
      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle localStorage parsing errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid json');
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      // Should log error but not crash
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle Notification constructor errors gracefully', () => {
      // Create a mock that throws when called as a constructor
      class MockNotificationError {
        constructor() {
          throw new Error('Notification error');
        }
        static permission = 'granted';
      }
      
      Object.defineProperty(global, 'Notification', {
        value: MockNotificationError,
        writable: true,
        configurable: true,
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('notification data', () => {
    it('should include event data in browser notification', () => {
      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'critical_vulnerability',
            severity: 'critical',
            url: '/dashboard',
          }),
        })
      );
    });

    it('should use requireInteraction true for critical events', () => {
      const { result } = renderHook(() => useSecurityNotifications());
      
      act(() => {
        result.current.triggerTestNotification();
      });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requireInteraction: true,
        })
      );
    });
  });
});
