import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}));

import { DELETE, POST } from '@/app/api/auth/demo-session/route';

describe('demo session API', () => {
  const insert = vi.fn();
  const update = vi.fn();
  const userUpdate = vi.fn();
  const maybeSingle = vi.fn();
  const sessionUpdate = {
    eq: vi.fn(),
    is: vi.fn(),
  };
  const userUpdateQuery = {
    eq: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingle.mockResolvedValue({
      data: {
        id: 'analyst-1',
        email: 'analyst@komra.security',
        full_name: 'Analyst User',
        role: 'analyst',
        mfa_enabled: false,
        last_activity: null,
      },
      error: null,
    });
    insert.mockResolvedValue({ error: null });
    update.mockReturnValue(sessionUpdate);
    userUpdate.mockReturnValue(userUpdateQuery);
    sessionUpdate.eq.mockReturnThis();
    sessionUpdate.is.mockResolvedValue({ error: null });
    userUpdateQuery.eq.mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: userUpdate,
          maybeSingle,
        };
      }
      if (table === 'application_sessions') return { insert, update };
      throw new Error(`Unexpected table: ${table}`);
    });
    mockRpc.mockResolvedValue({ data: true, error: null });
  });

  it('creates an HttpOnly application session only after password verification', async () => {
    const request = new NextRequest('http://localhost/api/auth/demo-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'analyst@komra.security', password: 'valid-password' }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user).toMatchObject({
      id: 'analyst-1',
      email: 'analyst@komra.security',
      role: 'analyst',
    });
    expect(mockRpc).toHaveBeenCalledWith('verify_user_password', {
      input_user_id: 'analyst-1',
      input_password: 'valid-password',
    });
    expect(userUpdate).toHaveBeenCalledWith({
      last_login: expect.any(String),
      last_activity: expect.any(String),
    });
    expect(userUpdateQuery.eq).toHaveBeenCalledWith('id', 'analyst-1');
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'analyst-1',
      token_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      expires_at: expect.any(String),
    }));
    expect(userUpdate.mock.invocationCallOrder[0]).toBeGreaterThan(
      insert.mock.invocationCallOrder[0],
    );
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('komra_demo_session=');
  });

  it('does not create an app session when the password is rejected', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    const request = new NextRequest('http://localhost/api/auth/demo-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'analyst@komra.security', password: 'wrong-password' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(insert).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('does not update login timestamps when the previous session cannot be revoked', async () => {
    sessionUpdate.is.mockResolvedValueOnce({ error: { message: 'database unavailable' } });
    const request = new NextRequest('http://localhost/api/auth/demo-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'komra_demo_session=previous-session',
      },
      body: JSON.stringify({ email: 'analyst@komra.security', password: 'valid-password' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(insert).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('does not update login timestamps when creating the session fails', async () => {
    insert.mockResolvedValueOnce({ error: { message: 'database unavailable' } });
    const request = new NextRequest('http://localhost/api/auth/demo-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'analyst@komra.security', password: 'valid-password' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('returns the created session when the login timestamp update fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    userUpdateQuery.eq.mockResolvedValueOnce({ error: { message: 'column unavailable' } });
    const request = new NextRequest('http://localhost/api/auth/demo-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'analyst@komra.security', password: 'valid-password' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('komra_demo_session=');
    expect(consoleError).toHaveBeenCalledWith(
      'Unable to record demo user login:',
      { message: 'column unavailable' },
    );
    consoleError.mockRestore();
  });

  it('preserves the browser cookie when revocation fails so the caller can retry', async () => {
    sessionUpdate.is.mockResolvedValueOnce({ error: { message: 'database unavailable' } });
    const request = new NextRequest('http://localhost/api/auth/demo-session', {
      method: 'DELETE',
      headers: { Cookie: 'komra_demo_session=opaque-session-secret' },
    });

    const response = await DELETE(request);

    expect(response.status).toBe(500);
    expect(response.headers.get('set-cookie')).toBeNull();

    const retryResponse = await DELETE(request);
    expect(retryResponse.status).toBe(204);
    expect(retryResponse.headers.get('set-cookie')).toContain('komra_demo_session=');
    expect(retryResponse.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
