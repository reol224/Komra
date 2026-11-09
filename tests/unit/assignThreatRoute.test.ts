import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockRpc, mockGetUser } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, _key: string, options?: { global?: { headers?: { Authorization?: string } } }) => {
    if (options?.global?.headers?.Authorization) return { rpc: mockRpc };
    return { rpc: mockRpc, auth: { getUser: mockGetUser } };
  },
}));

import { POST } from '@/app/api/dashboard/assign-threat/route';

describe('assign threat API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-user-1' } }, error: null });
  });

  it('passes only the demo session hash and assignment details to the database', async () => {
    const request = new NextRequest('http://localhost/api/dashboard/assign-threat', {
      method: 'POST',
      headers: {
        Cookie: 'komra_demo_session=opaque-session-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vulnerabilityId: '11111111-1111-4111-8111-111111111111',
        cveId: 'OSV-2026-1234',
        endpointId: '22222222-2222-4222-8222-222222222222',
        assignedTo: '33333333-3333-4333-8333-333333333333',
        priority: 'high',
        notes: 'Investigate this finding',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      'assign_agent_threat_with_app_session',
      expect.objectContaining({
        p_token_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        p_vulnerability_id: '11111111-1111-4111-8111-111111111111',
        p_assignee_id: '33333333-3333-4333-8333-333333333333',
      }),
    );
    expect(mockRpc.mock.calls[0][1]).not.toHaveProperty('assignedBy');
  });

  it('rejects callers without a demo session or verified Supabase identity', async () => {
    const request = new NextRequest('http://localhost/api/dashboard/assign-threat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vulnerabilityId: '11111111-1111-4111-8111-111111111111',
        cveId: 'OSV-2026-1234',
        endpointId: '22222222-2222-4222-8222-222222222222',
        assignedTo: '33333333-3333-4333-8333-333333333333',
        priority: 'high',
        notes: '',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('uses the verified Supabase identity for regular authenticated users', async () => {
    const request = new NextRequest('http://localhost/api/dashboard/assign-threat', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer verified-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vulnerabilityId: '11111111-1111-4111-8111-111111111111',
        cveId: 'OSV-2026-1234',
        endpointId: '22222222-2222-4222-8222-222222222222',
        assignedTo: '33333333-3333-4333-8333-333333333333',
        priority: 'high',
        notes: '',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockGetUser).toHaveBeenCalledWith('verified-access-token');
    expect(mockRpc).toHaveBeenCalledWith(
      'assign_agent_threat',
      expect.not.objectContaining({ p_token_hash: expect.anything() }),
    );
  });
});
