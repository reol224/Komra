import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuthGetUser, mockFrom } = vi.hoisted(() => ({
  mockAuthGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
  }),
}));

import { POST } from '@/app/api/audit/threat-escalations/route';

function request(body: unknown, accessToken = 'verified-token') {
  return new Request('http://localhost/api/audit/threat-escalations', {
    method: 'POST',
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as never;
}

describe('threat escalation audit API', () => {
  let auditInsert: ReturnType<typeof vi.fn>;
  let granted: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    granted = true;
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'verified-user-id', email: 'verified@example.com' } },
      error: null,
    });
    auditInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'audit_logs') return { insert: auditInsert };
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === 'users') return Promise.resolve({ data: { role: 'admin' }, error: null });
          if (table === 'role_permissions') {
            return Promise.resolve({ data: { granted }, error: null });
          }
          if (table === 'vulnerabilities') {
            return Promise.resolve({
              data: { id: 'finding-1', cve_id: 'CVE-2025-0001', endpoint_id: 'endpoint-1' },
              error: null,
            });
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      };
    });
  });

  it('requires a verified session before writing', async () => {
    const response = await POST(request({}, ''));

    expect(response.status).toBe(401);
    expect(mockAuthGetUser).not.toHaveBeenCalled();
    expect(auditInsert).not.toHaveBeenCalled();
  });

  it('rejects users without the escalation permission', async () => {
    granted = false;
    const response = await POST(request({
      vulnerabilityId: 'finding-1',
      reason: 'Potential data breach detected',
      level: 'Incident Response Team',
      notes: '',
    }));

    expect(response.status).toBe(403);
    expect(auditInsert).not.toHaveBeenCalled();
  });

  it('records the actor and finding details from verified server data', async () => {
    const response = await POST(request({
      userId: 'spoofed-user-id',
      userEmail: 'spoofed@example.com',
      vulnerabilityId: 'finding-1',
      reason: 'Potential data breach detected',
      level: 'Incident Response Team',
      notes: 'Investigate immediately',
    }));

    expect(response.status).toBe(201);
    expect(auditInsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'verified-user-id',
      user_email: 'verified@example.com',
      action: 'THREAT_ESCALATED',
      resource_id: 'finding-1',
      details: {
        cve_id: 'CVE-2025-0001',
        endpoint_id: 'endpoint-1',
        reason: 'Potential data breach detected',
        escalation_level: 'Incident Response Team',
        notes: 'Investigate immediately',
      },
    }));
  });
});
