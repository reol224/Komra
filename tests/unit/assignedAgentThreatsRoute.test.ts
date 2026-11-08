import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockAdminFrom,
  mockAdminRpc,
  mockAdminGetUser,
  mockUserRpc,
} = vi.hoisted(() => ({
  mockAdminFrom: vi.fn(),
  mockAdminRpc: vi.fn(),
  mockAdminGetUser: vi.fn(),
  mockUserRpc: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, _key: string, options?: { global?: { headers?: { Authorization?: string } } }) => {
    if (options?.global?.headers?.Authorization) {
      return { rpc: mockUserRpc };
    }
    return {
      from: mockAdminFrom,
      rpc: mockAdminRpc,
      auth: { getUser: mockAdminGetUser },
    };
  },
}));

import { GET } from '@/app/api/dashboard/assigned-agent-threats/route';

describe('assigned agent threats API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminRpc.mockResolvedValue({ data: [], error: null });
    mockUserRpc.mockResolvedValue({ data: [], error: null });
    mockAdminGetUser.mockResolvedValue({
      data: { user: { id: 'auth-user-1' } },
      error: null,
    });
  });

  it('passes only the hash of the HttpOnly demo session to the database authorization function', async () => {
    const request = new NextRequest('http://localhost/api/dashboard/assigned-agent-threats', {
      headers: { Cookie: 'komra_demo_session=opaque-session-secret' },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(mockAdminRpc).toHaveBeenCalledWith('get_app_session_agent_threats', {
      p_token_hash: createHash('sha256').update('opaque-session-secret').digest('hex'),
      p_assignee_id: null,
    });
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it('lets the database reject a non-admin request for another analyst', async () => {
    mockAdminRpc.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'Users may only view their own assignments.' },
    });
    const request = new NextRequest(
      'http://localhost/api/dashboard/assigned-agent-threats?assigneeId=22222222-2222-4222-8222-222222222222',
      { headers: { Cookie: 'komra_demo_session=analyst-session' } },
    );

    const response = await GET(request);

    expect(response.status).toBe(403);
    expect(mockAdminRpc).toHaveBeenCalledWith('get_app_session_agent_threats', {
      p_token_hash: expect.any(String),
      p_assignee_id: '22222222-2222-4222-8222-222222222222',
    });
  });

  it('uses the verified Supabase identity for regular authenticated users', async () => {
    const request = new NextRequest(
      'http://localhost/api/dashboard/assigned-agent-threats',
      { headers: { Authorization: 'Bearer verified-access-token' } },
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockAdminGetUser).toHaveBeenCalledWith('verified-access-token');
    expect(mockUserRpc).toHaveBeenCalledWith('get_authorized_agent_threats', {
      p_assignee_id: null,
    });
  });

  it('rejects callers without either a demo session or a Supabase identity', async () => {
    const request = new NextRequest('http://localhost/api/dashboard/assigned-agent-threats');

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(mockAdminRpc).not.toHaveBeenCalled();
    expect(mockUserRpc).not.toHaveBeenCalled();
  });
});
