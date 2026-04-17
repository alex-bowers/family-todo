import { describe, expect, it, vi } from 'vitest';
import { SyncEngine } from '$lib/sync/engine';
import { cacheStore } from '$lib/memory/cache';

const FIXTURE_HOUSEHOLD_ID = '11111111-1111-1111-1111-111111111111';
const SINCE = '2026-04-17T00:00:00.000Z';

describe('Sync contract', () => {
  it('pulls changes and keeps deleted rows in merged snapshot', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => {
        if (key.endsWith(`cursor:${FIXTURE_HOUSEHOLD_ID}`)) {
          return JSON.stringify({
            householdId: FIXTURE_HOUSEHOLD_ID,
            deviceId: 'device-a',
            lastSyncedAt: SINCE
          });
        }
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });

    const engine = new SyncEngine(FIXTURE_HOUSEHOLD_ID, 'device-a');
    vi.spyOn(cacheStore, 'readSnapshot').mockReturnValue({ lists: [], items: [], serverTs: SINCE });
    vi.spyOn(cacheStore, 'readCursor').mockReturnValue({
      householdId: FIXTURE_HOUSEHOLD_ID,
      deviceId: 'device-a',
      lastSyncedAt: SINCE
    });
    vi.spyOn(cacheStore, 'writeSnapshot').mockImplementation(() => undefined);
    vi.spyOn(cacheStore, 'writeCursor').mockImplementation(() => undefined);

    vi.spyOn(engine as unknown as { pullChanges: () => Promise<unknown> }, 'pullChanges').mockResolvedValue({
      lists: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          householdId: FIXTURE_HOUSEHOLD_ID,
          title: 'Groceries',
          sortOrder: 0,
          createdAt: '2026-04-17T00:00:00.000Z',
          updatedAt: '2026-04-17T00:01:00.000Z',
          deletedAt: null
        }
      ],
      items: [
        {
          id: '33333333-3333-3333-3333-333333333333',
          listId: '22222222-2222-2222-2222-222222222222',
          description: 'Buy milk',
          isCompleted: false,
          completedAt: null,
          createdAt: '2026-04-17T00:00:00.000Z',
          updatedAt: '2026-04-17T00:02:00.000Z',
          deletedAt: '2026-04-17T00:03:00.000Z'
        }
      ],
      serverTs: '2026-04-17T00:03:00.000Z'
    });

    const data = await engine.pullChanges();

    expect(data.lists).toHaveLength(1);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].deletedAt).toBeTruthy();
  });
});
