import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockFrom, mockGetUser, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
    auth: { getUser: mockGetUser },
  }),
}));

import { GET } from '@/app/api/cves/[cveId]/route';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('GET /api/cves/[cveId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-user-1' } }, error: null });
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockFrom.mockImplementation((table: string) => {
      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: table === 'application_sessions'
            ? { user_id: 'user-1' }
            : table === 'users'
              ? { role: 'analyst' }
              : { granted: true },
          error: null,
        }),
      };
      return query;
    });
  });

  it('rejects invalid CVE identifiers without querying NVD', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(
      new NextRequest('http://localhost/api/cves/not-a-cve'),
      { params: Promise.resolve({ cveId: 'not-a-cve' }) },
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns NVD description, CVSS data, dates, and references', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      vulnerabilities: [{
        cve: {
          id: 'CVE-2025-12345',
          descriptions: [{ lang: 'en', value: 'Example vulnerability' }],
          published: '2025-01-01T00:00:00.000',
          lastModified: '2025-01-02T00:00:00.000',
          references: [{ url: 'https://example.com/advisory' }],
          metrics: {
            cvssMetricV31: [{
              cvssData: { baseScore: 8.1, baseSeverity: 'HIGH' },
            }],
          },
        },
      }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(
      new NextRequest('http://localhost/api/cves/CVE-2025-12345', {
        headers: { Cookie: 'komra_demo_session=valid-session' },
      }),
      { params: Promise.resolve({ cveId: 'CVE-2025-12345' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: 'CVE-2025-12345',
      description: 'Example vulnerability',
      cvssScore: 8.1,
      severity: 'HIGH',
      published: '2025-01-01T00:00:00.000',
      lastModified: '2025-01-02T00:00:00.000',
      references: [{ url: 'https://example.com/advisory' }],
      url: 'https://nvd.nist.gov/vuln/detail/CVE-2025-12345',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('cveId=CVE-2025-12345'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('returns the CVSS v4 score and severity when it is the only metric', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      vulnerabilities: [{
        cve: {
          id: 'CVE-2025-54321',
          metrics: {
            cvssMetricV40: [{
              cvssData: { baseScore: 9.4, baseSeverity: 'CRITICAL' },
            }],
          },
        },
      }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(
      new NextRequest('http://localhost/api/cves/CVE-2025-54321', {
        headers: { Cookie: 'komra_demo_session=valid-session' },
      }),
      { params: Promise.resolve({ cveId: 'CVE-2025-54321' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      cvssScore: 9.4,
      severity: 'CRITICAL',
    });
  });

  it('rejects unauthenticated callers before querying NVD', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await GET(
      new NextRequest('http://localhost/api/cves/CVE-2025-54321'),
      { params: Promise.resolve({ cveId: 'CVE-2025-54321' }) },
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('accepts a verified Supabase session when loading CVE details', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      vulnerabilities: [{ cve: { id: 'CVE-2025-54321' } }],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await GET(
      new NextRequest('http://localhost/api/cves/CVE-2025-54321', {
        headers: { Authorization: 'Bearer verified-token' },
      }),
      { params: Promise.resolve({ cveId: 'CVE-2025-54321' }) },
    );

    expect(response.status).toBe(200);
    expect(mockGetUser).toHaveBeenCalledWith('verified-token');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejects rate-limited CVE lookups before calling NVD', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await GET(
      new NextRequest('http://localhost/api/cves/CVE-2025-54321', {
        headers: { Cookie: 'komra_demo_session=valid-session' },
      }),
      { params: Promise.resolve({ cveId: 'CVE-2025-54321' }) },
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when the shared rate limiter is unavailable', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'database unavailable' },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await GET(
      new NextRequest('http://localhost/api/cves/CVE-2025-54321', {
        headers: { Cookie: 'komra_demo_session=valid-session' },
      }),
      { params: Promise.resolve({ cveId: 'CVE-2025-54321' }) },
    );

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
