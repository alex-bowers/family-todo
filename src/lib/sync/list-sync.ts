import type { TodoList, UUID } from '$lib/memory/types';
import type { SyncEngine } from '$lib/sync/engine';

interface ListSyncOptions {
  householdId: UUID;
  syncEngine: SyncEngine;
  onListsUpdated: (lists: TodoList[]) => void;
  onError?: (error: unknown) => void;
}

export function setupListRefreshOnReconnect(options: ListSyncOptions): () => void {
  const refresh = async (): Promise<void> => {
    try {
      const snapshot = await options.syncEngine.pullChanges();
      const lists = snapshot.lists
        .filter((list) => list.householdId === options.householdId && !list.deletedAt)
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder ||
            a.updatedAt.localeCompare(b.updatedAt) ||
            a.createdAt.localeCompare(b.createdAt)
        );
      options.onListsUpdated(lists);
    } catch (error) {
      options.onError?.(error);
    }
  };

  const handleOnline = (): void => {
    void refresh();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
    }
  };
}
