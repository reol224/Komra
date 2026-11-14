import { describe, it, expect } from 'vitest';
import { runCorrelationQuery, CorrelationEvent } from '@/lib/correlationEngine';

const event = (over: Partial<CorrelationEvent>): CorrelationEvent => ({
  id: Math.random().toString(),
  timestamp: '2026-01-01T00:00:00Z',
  source: 'auth',
  level: 'info',
  message: 'x',
  ...over,
});

describe('runCorrelationQuery', () => {
  const events = [
    event({ level: 'error', message: 'login_failed', ip_address: '1.1.1.1', status_code: 401 }),
    event({ level: 'error', message: 'login_failed', ip_address: '1.1.1.1', timestamp: '2026-01-02T00:00:00Z' }),
    event({ level: 'info', message: 'login ok', ip_address: '2.2.2.2' }),
  ];

  it('filters with wildcards and AND/OR', () => {
    expect(runCorrelationQuery(events, 'level:error AND message:*login*').matches).toBe(2);
    expect(runCorrelationQuery(events, 'ip_address:2.2.2.2 OR status_code >= 400').matches).toBe(2);
  });

  it('groups and filters by count', () => {
    const result = runCorrelationQuery(events, 'level:error | stats count by ip_address | where count >= 2');
    expect(result.kind).toBe('groups');
    expect(result.groups).toEqual([{ key: '1.1.1.1', count: 2, lastSeen: '2026-01-02T00:00:00Z' }]);
  });

  it('throws readable errors for unsupported clauses', () => {
    expect(() => runCorrelationQuery(events, 'level:error | sort x')).toThrow(/Unsupported clause/);
    expect(() => runCorrelationQuery(events, 'level:error | where count > 1')).toThrow(/stats/);
  });
});
