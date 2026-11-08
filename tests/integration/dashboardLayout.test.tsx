import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { authState } = vi.hoisted(() => ({
  authState: { role: 'admin' as 'admin' | 'analyst' | 'viewer' },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'user@example.com',
      full_name: 'Test User',
      role: authState.role,
    },
    signOut: vi.fn(),
  }),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    permission: 'default',
    isSubscribed: false,
    requestPermission: vi.fn(),
    subscribe: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSecurityNotifications', () => ({
  useSecurityNotifications: () => ({ triggerTestNotification: vi.fn() }),
}));

vi.mock('@/lib/dashboardDataService', () => ({
  DashboardDataService: class {
    getAgentInventoryStats = vi.fn().mockResolvedValue({
      totalEndpoints: 0,
      reportedPackages: 0,
      reportedServices: 0,
      latestCollection: null,
    });
  },
}));

vi.mock('@/components/dashboard/admin/AdminUserManagement', () => ({
  default: () => <div>Admin user management panel</div>,
}));
vi.mock('@/components/dashboard/admin/AdminSystemHealth', () => ({
  default: () => <div>Admin system health panel</div>,
}));
vi.mock('@/components/dashboard/admin/AdminThreatSummary', () => ({
  default: () => <div>Admin threat summary panel</div>,
}));
vi.mock('@/components/dashboard/admin/AdminAuditTrail', () => ({
  default: () => <div>Admin audit trail panel</div>,
}));
vi.mock('@/components/dashboard/analyst/AnalystThreatFeed', () => ({
  default: () => <div>Analyst threat feed panel</div>,
}));
vi.mock('@/components/dashboard/analyst/AnalystIncidentResponse', () => ({
  default: () => <div>Analyst incident response panel</div>,
}));
vi.mock('@/components/dashboard/analyst/AnalystInvestigation', () => ({
  default: () => <div>Analyst investigation panel</div>,
}));
vi.mock('@/components/dashboard/analyst/AnalystReports', () => ({
  default: () => <div>Analyst reports panel</div>,
}));
vi.mock('@/components/dashboard/viewer/ViewerSystemStatus', () => ({
  default: () => <div>Viewer system status panel</div>,
}));
vi.mock('@/components/dashboard/viewer/ViewerAlerts', () => ({
  default: () => <div>Viewer alerts panel</div>,
}));
vi.mock('@/components/dashboard/viewer/ViewerCompliance', () => ({
  default: () => <div>Viewer compliance panel</div>,
}));

import DashboardLayout from '@/components/dashboard/DashboardLayout';

afterEach(() => {
  cleanup();
  authState.role = 'admin';
});

describe('DashboardLayout role tabs', () => {
  it.each([
    ['analyst', 'Threat Feed', 'Analyst threat feed panel'],
    ['viewer', 'System Status', 'Viewer system status panel'],
  ] as const)('selects an available tab on initial %s load', async (role, tabName, panelText) => {
    authState.role = role;
    render(<DashboardLayout />);

    expect(await screen.findByRole('tab', { name: tabName })).toHaveAttribute('data-state', 'active');
    expect(await screen.findByText(panelText)).toBeInTheDocument();
  });

  it('preserves the admin overview default and changes to a valid tab when role changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DashboardLayout />);

    expect(await screen.findByRole('tab', { name: 'Overview' })).toHaveAttribute('data-state', 'active');
    expect(await screen.findByText('Admin threat summary panel')).toBeInTheDocument();

    authState.role = 'analyst';
    rerender(<DashboardLayout />);
    expect(await screen.findByRole('tab', { name: 'Threat Feed' })).toHaveAttribute('data-state', 'active');
    expect(await screen.findByText('Analyst threat feed panel')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Reports' }));
    expect(screen.getByRole('tab', { name: 'Reports' })).toHaveAttribute('data-state', 'active');

    authState.role = 'viewer';
    rerender(<DashboardLayout />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'System Status' })).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getByText('Viewer system status panel')).toBeInTheDocument();
  });
});
