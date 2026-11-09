import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLoadHealth } = vi.hoisted(() => ({ mockLoadHealth: vi.fn() }));

vi.mock('@/lib/dashboardDataService', () => ({
  DashboardDataService: class {
    getAgentSystemHealth = mockLoadHealth;
  },
}));

vi.mock('@/components/auth/PermissionGuard', () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => children,
}));

import AdminSystemHealth from '@/components/dashboard/admin/AdminSystemHealth';

describe('AdminSystemHealth', () => {
  const startTime = new Date('2026-11-09T12:00:00.000Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers({ now: startTime });
    mockLoadHealth.mockResolvedValue([{
      id: 'endpoint-1',
      hostname: 'agent-1',
      osType: 'Ubuntu 24.04',
      lastScan: '2026-11-09T11:56:00.000Z',
      receivedAt: '2026-11-09T11:56:00.000Z',
      runningServices: [],
      resourceMetrics: {
        cpu_usage_percent: 90,
        memory_usage_percent: null,
        memory_used_bytes: null,
        memory_total_bytes: null,
        disk_usage_percent: null,
        disk_used_bytes: null,
        disk_total_bytes: null,
      },
    }]);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('reevaluates freshness and excludes stale telemetry during periodic refresh', async () => {
    const intervalSpy = vi.spyOn(window, 'setInterval');
    await act(async () => {
      render(<AdminSystemHealth />);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockLoadHealth).toHaveBeenCalledTimes(1);
    expect(screen.getByText('90.0%')).toBeInTheDocument();
    const refreshTimer = intervalSpy.mock.calls.find(([, delay]) => delay === 60_000);
    expect(refreshTimer).toBeDefined();
    vi.setSystemTime(startTime + 6 * 60_000);
    await act(async () => {
      (refreshTimer?.[0] as () => void)();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockLoadHealth).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/No recent resource telemetry/)).toBeInTheDocument();
    expect(screen.getByText('Agent report is stale (10 minutes ago)')).toBeInTheDocument();
    intervalSpy.mockRestore();
  });
});
