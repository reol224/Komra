import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import {
  filterAuditLogsBySourcePreferences,
  getAuditLogCountsBySource,
} from '@/lib/logSourceHelpers';

function makeQuery(result: { data: unknown[]; error: null }) {
  const query: any = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.then = (resolve: (value: typeof result) => unknown) =>
    Promise.resolve(result).then(resolve);
  return query;
}

describe('log source helpers', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockFrom.mockImplementation((table: string) =>
      makeQuery({ data: [], error: null }),
    );
  });

  it('filters logs using each supported source category', async () => {
    const sourceTypes = [
      'application',
      'security',
      'network',
      'system',
      'windows',
      'linux',
      'database',
      'web',
    ];
    const logs = sourceTypes.map((type) => ({
      action: `EVENT_${type.toUpperCase()}`,
      metadata: {
        action_category: type === 'application' ? 'vulnerability_scanning' : type,
      },
    }));

    mockFrom.mockImplementation((table: string) =>
      makeQuery({
        data: table === 'user_log_source_preferences'
          ? sourceTypes.map((log_source_type) => ({ log_source_type, enabled: true }))
          : [],
        error: null,
      }),
    );

    const filtered = await filterAuditLogsBySourcePreferences(logs, 'user-id');

    expect(filtered).toEqual(logs);
    expect(getAuditLogCountsBySource(filtered)).toEqual(
      Object.fromEntries(sourceTypes.map((type) => [type, 1])),
    );
  });

  it('uses custom sources even when no predefined preference rows exist', async () => {
    mockFrom.mockImplementation((table: string) =>
      makeQuery({
        data: table === 'user_custom_log_sources'
          ? [{ source_type: 'windows', enabled: true }]
          : [],
        error: null,
      }),
    );

    const logs = [
      { action: 'WINDOWS_EVENT', metadata: { source_type: 'windows' } },
      { action: 'APPLICATION_EVENT', metadata: { source_type: 'application' } },
    ];

    await expect(
      filterAuditLogsBySourcePreferences(logs, 'user-id'),
    ).resolves.toEqual([logs[0]]);
  });

  it('leaves logs unfiltered when neither preference table has saved rows', async () => {
    const logs = [{ action: 'UNCLASSIFIED_EVENT', metadata: {} }];

    await expect(
      filterAuditLogsBySourcePreferences(logs, 'user-id'),
    ).resolves.toEqual(logs);
  });
});
