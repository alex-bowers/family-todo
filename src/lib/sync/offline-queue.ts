import { cacheStore } from '$lib/memory/cache';
import type { PendingMutation, UUID } from '$lib/memory/types';

export type SyncStatus = 'offline queued' | 'online syncing' | 'online synced' | 'online error';

export class OfflineQueue {
  constructor(private readonly householdId: UUID) {}

  enqueue(op: PendingMutation['op'], payload: Record<string, unknown>): PendingMutation {
    const mutation: PendingMutation = {
      id: crypto.randomUUID(),
      op,
      payload,
      clientTs: new Date().toISOString()
    };

    const queue = cacheStore.readPendingMutations(this.householdId);
    queue.push(mutation);
    cacheStore.writePendingMutations(this.householdId, queue);
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
