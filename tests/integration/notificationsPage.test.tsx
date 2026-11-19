import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { notificationState } = vi.hoisted(() => ({
  notificationState: { isSupported: true },
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    isSupported: notificationState.isSupported,
    permission: 'default',
    isSubscribed: false,
    requestPermission: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    sendTestNotification: vi.fn(),
  }),
}));

import NotificationsPage from '@/app/notifications/page';

afterEach(() => {
  localStorage.removeItem('komra-notification-settings');
  notificationState.isSupported = true;
});

describe('Notifications page', () => {
  it('keeps preferences usable within the dashboard navigation', async () => {
    const user = userEvent.setup();
    render(<NotificationsPage />);

    const navigation = screen.getByRole('navigation', { name: 'Dashboard navigation' });
    expect(within(navigation).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(within(navigation).getByRole('link', { name: 'Notifications' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('switch', { name: 'Critical Vulnerabilities' }));
    expect(JSON.parse(localStorage.getItem('komra-notification-settings')!)).toMatchObject({
      criticalVulnerabilities: false,
    });
    expect(screen.getByLabelText('Notification Frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Quiet Hours Start')).toBeInTheDocument();
  });

  it('keeps navigation available when push notifications are unsupported', () => {
    notificationState.isSupported = false;
    render(<NotificationsPage />);

    expect(screen.getByText('Push Notifications Not Supported')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/dashboard');
  });
});
