import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getAssignedAgentThreats } = vi.hoisted(() => ({
  getAssignedAgentThreats: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'analyst-123', email: 'analyst@example.com', role: 'analyst' },
  }),
}));

vi.mock('@/lib/dashboardDataService', () => ({
  DashboardDataService: class {
    getAssignedAgentThreats = getAssignedAgentThreats;
  },
}));

import AnalystThreatFeed from '@/components/dashboard/analyst/AnalystThreatFeed';
import AnalystIncidentResponse from '@/components/dashboard/analyst/AnalystIncidentResponse';

const assignment = {
  id: 'assignment-1',
  status: 'in_progress' as const,
  priority: 'critical' as const,
  notes: 'Review the affected package version.',
  createdAt: '2026-11-07T17:00:00.000Z',
  updatedAt: '2026-11-07T18:00:00.000Z',
  assignedAt: '2026-11-07T18:00:00.000Z',
  owner: {
    id: 'analyst-123',
    email: 'analyst@example.com',
    fullName: 'Assigned Analyst',
  },
  assignedBy: {
    id: 'admin-123',
    email: 'admin@example.com',
    fullName: 'Security Admin',
  },
  finding: {
    id: 'finding-1',
    cve_id: 'GHSA-abcd-efgh-ijkl',
    description: 'A package version on the endpoint is vulnerable.',
    severity: 'critical' as const,
    cvss_score: 9.1,
    status: 'in_progress' as const,
    endpoint_id: 'endpoint-1',
    endpoint_name: 'agent-prod-1',
    environment: 'production',
    discovered_date: '2026-11-07T16:00:00.000Z',
    affected_packages: ['example-package'],
    source: 'osv',
    source_id: 'GHSA-abcd-efgh-ijkl',
    reference_urls: [],
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Analyst assignment queues', () => {
  it('loads assigned OSV findings and owner in the threat feed for the current analyst', async () => {
    getAssignedAgentThreats.mockResolvedValue([assignment]);
    render(<AnalystThreatFeed />);

    expect(await screen.findByText('GHSA-abcd-efgh-ijkl')).toBeInTheDocument();
    expect(screen.getByText('Owner: Assigned Analyst')).toBeInTheDocument();
    expect(screen.getByText('Endpoint: agent-prod-1 (production)')).toBeInTheDocument();
    await waitFor(() => {
      expect(getAssignedAgentThreats).toHaveBeenCalledWith();
    });
  });

  it('loads the same assigned finding and owner in the incident response queue', async () => {
    getAssignedAgentThreats.mockResolvedValue([assignment]);
    render(<AnalystIncidentResponse />);

    expect(await screen.findAllByText('GHSA-abcd-efgh-ijkl')).not.toHaveLength(0);
    expect(screen.getByText('Owner: Assigned Analyst')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Assignment' }));
    expect(screen.getAllByText('Assigned Analyst')).not.toHaveLength(0);
    expect(screen.getByText('Security Admin')).toBeInTheDocument();
    await waitFor(() => {
      expect(getAssignedAgentThreats).toHaveBeenCalledWith();
    });
  });
});
