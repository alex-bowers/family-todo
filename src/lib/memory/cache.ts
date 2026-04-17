import type { PendingMutation, SyncCursor, SyncSnapshot, UUID } from './types';

const CACHE_PREFIX = 'familytodo';

function key(name: string): string {
  return `${CACHE_PREFIX}:${name}`;
}

function readJson<T>(name: string, fallback: T): T {
  if (typeof localStorage === 'undefined') {
    return fallback;
  }

  const raw = localStorage.getItem(key(name));
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(name: string, value: T): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(key(name), JSON.stringify(value));
}

export const cacheStore = {
  readSnapshot(householdId: UUID): SyncSnapshot | null {
    return readJson<SyncSnapshot | null>(`snapshot:${householdId}`, null);
  },

  writeSnapshot(householdId: UUID, snapshot: SyncSnapshot): void {
    writeJson(`snapshot:${householdId}`, snapshot);
  },

  readCursor(householdId: UUID): SyncCursor | null {
    return readJson<SyncCursor | null>(`cursor:${householdId}`, null);
  },

  writeCursor(cursor: SyncCursor): void {
    writeJson(`cursor:${cursor.householdId}`, cursor);
  },

  readPendingMutations(householdId: UUID): PendingMutation[] {
    return readJson<PendingMutation[]>(`queue:${householdId}`, []);
  },

  writePendingMutations(householdId: UUID, queue: PendingMutation[]): void {
    writeJson(`queue:${householdId}`, queue);
  },

  clearHousehold(householdId: UUID): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(key(`snapshot:${householdId}`));
    localStorage.removeItem(key(`cursor:${householdId}`));
    localStorage.removeItem(key(`queue:${householdId}`));
  }
};
