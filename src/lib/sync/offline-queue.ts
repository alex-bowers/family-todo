import { cacheStore } from '$lib/memory/cache';
import type { PendingMutation, UUID } from '$lib/memory/types';

export type SyncStatus = 'offline queued' | 'online syncing' | 'online synced' | 'online error';

export class OfflineQueue {
  constructor(private readonly householdId: UUID) {}

  private coalesce(queue: PendingMutation[], next: PendingMutation): PendingMutation[] {
    const previousIndex = queue.findIndex(
      (entry) =>
        entry.op === next.op &&
        (entry.payload.itemId ?? entry.payload.listId) === (next.payload.itemId ?? next.payload.listId)
    );

    if (previousIndex === -1) {
      return [...queue, next];
    }

    const merged = queue.slice();
    merged[previousIndex] = {
      ...merged[previousIndex],
      payload: {
        ...merged[previousIndex].payload,
        ...next.payload
      },
      clientTs: next.clientTs
    };
    return merged;
  }

  enqueue(op: PendingMutation['op'], payload: Record<string, unknown>): PendingMutation {
    const mutation: PendingMutation = {
      id: crypto.randomUUID(),
      op,
      payload,
      clientTs: new Date().toISOString(),
      retries: 0,
      lastError: null
    };

    const queue = cacheStore.readPendingMutations(this.householdId);
    cacheStore.writePendingMutations(this.householdId, this.coalesce(queue, mutation));
    return mutation;
  }

  size(): number {
    return cacheStore.readPendingMutations(this.householdId).length;
  }

  async flush(send: (mutation: PendingMutation) => Promise<void>): Promise<{ sent: number; failed: number }> {
    const queue = cacheStore.readPendingMutations(this.householdId);
    const pending: PendingMutation[] = [];
    let sent = 0;

    for (const mutation of queue) {
      if (mutation.nextAttemptAt && mutation.nextAttemptAt > new Date().toISOString()) {
        pending.push(mutation);
        continue;
      }

      try {
        await send(mutation);
        sent += 1;
      } catch (error) {
        const retries = (mutation.retries ?? 0) + 1;
        pending.push({
          ...mutation,
          retries,
          lastError: error instanceof Error ? error.message : 'offline flush failed',
          nextAttemptAt: new Date(Date.now() + Math.min(30_000, 2 ** retries * 500)).toISOString()
        });
      }
    }

    cacheStore.writePendingMutations(this.householdId, pending);
    return {
      sent,
      failed: pending.length
    };
  }
}
