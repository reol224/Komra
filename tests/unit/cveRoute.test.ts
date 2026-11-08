import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cves/[cveId]/route';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('GET /api/cves/[cveId]', () => {
  it('rejects invalid CVE identifiers without querying NVD', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(
      new Request('http://localhost/api/cves/not-a-cve'),
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
      new Request('http://localhost/api/cves/CVE-2025-12345'),
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
      new Request('http://localhost/api/cves/CVE-2025-54321'),
      { params: Promise.resolve({ cveId: 'CVE-2025-54321' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      cvssScore: 9.4,
      severity: 'CRITICAL',
    });
  });
});
