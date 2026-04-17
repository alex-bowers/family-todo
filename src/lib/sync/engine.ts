import type { PendingMutation, SyncSnapshot, UUID } from '$lib/memory/types';
import { cacheStore } from '$lib/memory/cache';
import { GET_CHANGES_SINCE } from '$lib/graphql/operations';
import { hasuraClient } from '$lib/graphql/client';

interface ChangesSincePayload {
  changedLists: SyncSnapshot['lists'];
  changedItems: SyncSnapshot['items'];
}

function latestTs(...timestamps: string[]): string {
  return timestamps.sort((a, b) => a.localeCompare(b)).at(-1) ?? new Date().toISOString();
}

export class SyncEngine {
  constructor(
    private readonly householdId: UUID,
    private readonly deviceId: string
  ) {}

  getQueue(): PendingMutation[] {
    return cacheStore.readPendingMutations(this.householdId);
  }

  enqueue(mutation: PendingMutation): void {
    const queue = this.getQueue();
    queue.push(mutation);
    cacheStore.writePendingMutations(this.householdId, queue);
  }

  async pullChanges(): Promise<SyncSnapshot> {
    const currentSnapshot = cacheStore.readSnapshot(this.householdId);
    const cursor = cacheStore.readCursor(this.householdId);
    const since = cursor?.lastSyncedAt ?? new Date(0).toISOString();

    const data = await hasuraClient.request<ChangesSincePayload>(GET_CHANGES_SINCE, {
      householdId: this.householdId,
      since
    });

    // Last-write-wins by server updated_at for deterministic merge in v1.
    const mergedLists = new Map<string, (typeof data.changedLists)[number]>();
    const mergedItems = new Map<string, (typeof data.changedItems)[number]>();

    for (const list of currentSnapshot?.lists ?? []) {
      mergedLists.set(list.id, list);
    }
    for (const list of data.changedLists) {
      mergedLists.set(list.id, list);
    }

    for (const item of currentSnapshot?.items ?? []) {
      mergedItems.set(item.id, item);
    }
    for (const item of data.changedItems) {
      mergedItems.set(item.id, item);
    }

    const serverTs = latestTs(
      since,
      ...data.changedLists.map((list) => list.updatedAt),
      ...data.changedItems.map((item) => item.updatedAt)
    );

    const mergedSnapshot: SyncSnapshot = {
      lists: [...mergedLists.values()],
      items: [...mergedItems.values()],
      serverTs
    };

    cacheStore.writeSnapshot(this.householdId, mergedSnapshot);
    cacheStore.writeCursor({
      householdId: this.householdId,
      deviceId: this.deviceId,
      lastSyncedAt: serverTs
    });

    return mergedSnapshot;
  }

  async flushQueue(
    send: (mutation: PendingMutation) => Promise<void>
  ): Promise<{ sent: number; failed: number }> {
    const queue = this.getQueue();
    const pending: PendingMutation[] = [];
    let sent = 0;

    for (const mutation of queue) {
      try {
        await send(mutation);
        sent += 1;
      } catch {
        pending.push(mutation);
      }
    }

    cacheStore.writePendingMutations(this.householdId, pending);

    return {
      sent,
      failed: pending.length
    };
  }
}
