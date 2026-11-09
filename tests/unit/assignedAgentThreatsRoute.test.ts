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

function makeQuery<T extends Record<string, unknown>>(
  records: T[],
  error: { code?: string; message: string } | null = null,
) {
  const filters: Array<{ column: string; values: unknown[] }> = [];
  const query = {
    select: vi.fn(() => query),
    in: vi.fn((column: string, values: unknown[]) => {
      filters.push({ column, values });
      return query;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      filters.push({ column, values: [value] });
      return query;
    }),
    order: vi.fn(() => query),
    range: vi.fn((start: number, end: number) => ({
      data: filteredRecords().slice(start, end + 1),
      count: filteredRecords().length,
      error,
    })),
    then: (resolve: (value: { data: T[]; error: typeof error }) => unknown) =>
      Promise.resolve({ data: filteredRecords(), error }).then(resolve),
  };
  function filteredRecords() {
    return records.filter((record) => filters.every(({ column, values }) =>
      values.includes(record[column]),
    ));
  }
  return query;
}

import { GET } from '@/app/api/dashboard/assigned-agent-threats/route';

describe('assigned agent threats API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminRpc.mockReturnValue(makeQuery([]));
    mockUserRpc.mockReturnValue(makeQuery([]));
    mockAdminFrom.mockImplementation((table: string) => makeQuery(
      table === 'cves'
        ? [{ id: 'cve-record-1', cve_id: 'CVE-2025-0001' }]
        : table === 'endpoints'
          ? [{ id: 'endpoint-1', hostname: 'assigned-host', environment: 'production' }]
          : table === 'vulnerabilities'
            ? [{
                id: 'finding-1',
                cve_id: 'CVE-2025-0001',
                description: 'Known issue in an installed package',
                severity: 'high',
                cvss_score: 8.1,
                status: 'open',
                endpoint_id: 'endpoint-1',
                discovered_date: '2025-03-01T12:00:00Z',
                source_id: 'OSV-2025-0001',
                reference_urls: ['https://osv.dev/vulnerability/OSV-2025-0001'],
                affected_packages: ['openssl'],
                source: 'osv',
              }]
            : table === 'users'
              ? [
                  { id: 'analyst-1', email: 'analyst@example.com', full_name: 'Analyst Owner' },
                  { id: 'admin-1', email: 'admin@example.com', full_name: 'Admin User' },
                ]
              : [],
    ));
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
    }, { count: 'exact' });
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it('hydrates authorized assignments with the OSV finding, endpoint, and owner', async () => {
    mockAdminRpc.mockReturnValue(makeQuery([{
      id: 'assignment-1',
      cve_id: 'cve-record-1',
      endpoint_id: 'endpoint-1',
      assigned_to: 'analyst-1',
      triaged_by: 'admin-1',
      status: 'in_progress',
      priority: 'critical',
      notes: 'Investigate affected package',
      created_at: '2025-03-02T10:00:00Z',
      updated_at: '2025-03-02T11:00:00Z',
      expires_at: null,
      triaged_at: '2025-03-02T10:00:00Z',
    }]));
    const request = new NextRequest('http://localhost/api/dashboard/assigned-agent-threats', {
      headers: { Cookie: 'komra_demo_session=opaque-session-secret' },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([{
      id: 'assignment-1',
      status: 'in_progress',
      priority: 'critical',
      notes: 'Investigate affected package',
      owner: { id: 'analyst-1', email: 'analyst@example.com', fullName: 'Analyst Owner' },
      assignedBy: { id: 'admin-1', email: 'admin@example.com', fullName: 'Admin User' },
      finding: {
        id: 'finding-1',
        cve_id: 'CVE-2025-0001',
        endpoint_name: 'assigned-host',
        source: 'osv',
      },
    }]);
  });

  it('lets the database reject a non-admin request for another analyst', async () => {
    mockAdminRpc.mockReturnValue(makeQuery([], {
      code: '42501',
      message: 'Users may only view their own assignments.',
    }));
    const request = new NextRequest(
      'http://localhost/api/dashboard/assigned-agent-threats?assigneeId=22222222-2222-4222-8222-222222222222',
      { headers: { Cookie: 'komra_demo_session=analyst-session' } },
    );

    const response = await GET(request);

    expect(response.status).toBe(403);
    expect(mockAdminRpc).toHaveBeenCalledWith('get_app_session_agent_threats', {
      p_token_hash: expect.any(String),
      p_assignee_id: '22222222-2222-4222-8222-222222222222',
    }, { count: 'exact' });
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
    }, { count: 'exact' });
  });

  it('rejects callers without either a demo session or a Supabase identity', async () => {
    const request = new NextRequest('http://localhost/api/dashboard/assigned-agent-threats');

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(mockAdminRpc).not.toHaveBeenCalled();
    expect(mockUserRpc).not.toHaveBeenCalled();
  });
});
