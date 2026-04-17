import { describe, expect, it } from 'vitest';
import { SyncEngine } from '$lib/sync/engine';

describe('Supabase sync contract', () => {
  it('returns deterministic snapshot shape from pullChanges', async () => {
    const engine = new SyncEngine('11111111-1111-1111-1111-111111111111', 'device-a');
    const snapshot = await engine.pullChanges();

    expect(Array.isArray(snapshot.lists)).toBe(true);
    expect(Array.isArray(snapshot.items)).toBe(true);
    expect(typeof snapshot.serverTs).toBe('string');
  });
});
