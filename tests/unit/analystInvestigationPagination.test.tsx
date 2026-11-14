import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuditLogEntry } from '@/lib/auditLogger';

const { mockGetAuditLogs } = vi.hoisted(() => ({
  mockGetAuditLogs: vi.fn(),
}));

vi.mock('@/lib/auditLogger', () => ({
  auditLogger: { getAuditLogs: mockGetAuditLogs },
}));

import AnalystInvestigation from '@/components/dashboard/analyst/AnalystInvestigation';

function createAuditLog(id: number): AuditLogEntry {
  return {
    id: String(id),
    user_id: 'analyst-1',
    user_email: 'analyst@example.com',
    action: 'TEST_ACTION',
    resource_type: 'application',
    details: {},
    timestamp: new Date(2026, 10, 13, 12, 0, id % 60).toISOString(),
    severity: 'low',
    status: 'success',
  };
}

describe('Analyst Investigation log pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and combines all pages before showing the log count', async () => {
    mockGetAuditLogs
      .mockResolvedValueOnce(Array.from({ length: 1000 }, (_, index) => createAuditLog(index)))
      .mockResolvedValueOnce([createAuditLog(1000)]);

    render(<AnalystInvestigation />);

    expect(await screen.findByText('Log Entries (1001)')).toBeInTheDocument();
    expect(mockGetAuditLogs).toHaveBeenCalledTimes(2);
    expect(mockGetAuditLogs).toHaveBeenNthCalledWith(1, expect.objectContaining({
      limit: 1000,
      offset: 0,
      throwOnError: true,
    }));
    expect(mockGetAuditLogs).toHaveBeenNthCalledWith(2, expect.objectContaining({
      limit: 1000,
      offset: 1000,
      throwOnError: true,
    }));
  });
});
