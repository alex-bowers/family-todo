<script>
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import TodoItemList from '$lib/components/TodoItemList.svelte';
  import { resolveHouseholdId } from '$lib/memory/household';
  import { ItemRepository } from '$lib/memory/item-repository';
  import { ItemStore } from '$lib/stores/item-store';
  import { OfflineQueue } from '$lib/sync/offline-queue';
  import { startRealtimeBridge } from '$lib/sync/realtime';

  const householdId = resolveHouseholdId();
  const listId = get(page).params.listId;

  const repository = new ItemRepository(householdId);
  const store = new ItemStore(listId, repository);
  const queue = new OfflineQueue(householdId);
  const itemState = store;
  let hydrated = false;
  let syncStatus = 'online synced';
  let stopRealtime = () => {};

  async function sendQueuedMutation(mutation) {
    const payload = mutation.payload ?? {};

    switch (mutation.op) {
      case 'create_item':
        await repository.createItem(payload.listId ?? listId, payload.description ?? '');
        return;
      case 'update_item':
        if (typeof payload.isCompleted === 'boolean') {
          await repository.setItemCompletion(payload.itemId, payload.isCompleted);
        } else {
          await repository.updateItemText(payload.itemId, payload.description ?? '');
        }
        return;
      case 'delete_item':
        await repository.deleteItem(payload.itemId);
        return;
      default:
        return;
    }
  }

  async function flushQueue() {
    syncStatus = 'online syncing';
    const result = await queue.flush(sendQueuedMutation);
    syncStatus = result.failed === 0 ? 'online synced' : 'online error';
  }

  function queueMutation(op, payload) {
    queue.enqueue(op, payload);
    syncStatus = 'offline queued';
  }

  async function handleCreate(description) {
    await store.create(description);
    if (navigator.onLine) {
      syncStatus = 'online synced';
    } else {
      queueMutation('create_item', { listId, description });
    }
  }

  async function handleToggle(itemId, isCompleted) {
    await store.toggleCompletion(itemId, isCompleted);
    if (navigator.onLine) {
      syncStatus = 'online synced';
    } else {
      queueMutation('update_item', { itemId, isCompleted });
    }
  }

  async function handleDelete(itemId) {
    await store.remove(itemId);
    if (navigator.onLine) {
      syncStatus = 'online synced';
    } else {
      queueMutation('delete_item', { itemId });
    }
  }

  async function handleUpdate(itemId, description) {
    await store.updateText(itemId, description);
    if (navigator.onLine) {
      syncStatus = 'online synced';
    } else {
      queueMutation('update_item', { itemId, description });
    }
  }

  onMount(async () => {
    hydrated = true;
    syncStatus = navigator.onLine ? 'online synced' : 'offline queued';
    await store.load();

    stopRealtime = startRealtimeBridge({
      onReconnect: async () => {
        await flushQueue();
        await store.load();
      },
      onOffline: async () => {
        syncStatus = 'offline queued';
      },
      onPoll: async () => {
        if (navigator.onLine) {
          await store.load();
        }
      },
      onRealtimeEvent: async () => {
        if (navigator.onLine) {
          await store.load();
        }
      },
      pollMs: 10000
    });

    if (navigator.onLine && queue.size() > 0) {
      await flushQueue();
    }
  });

  onDestroy(() => {
    stopRealtime();
  });
</script>

<main>
  <h1>List Details</h1>
  <p>Manage items for list: {listId}</p>
  <p data-testid="item-hydrated" hidden={!hydrated}>ready</p>
  <p data-testid="sync-status" role="status" aria-live="polite">{syncStatus}</p>
  <p><a href="/">Back to lists</a></p>

  <TodoItemList
    items={$itemState.items}
    loading={$itemState.loading}
    error={$itemState.error}
    onCreate={handleCreate}
    onToggle={handleToggle}
    onDelete={handleDelete}
    onUpdate={handleUpdate}
  />
</main>

<style>
  main {
    padding: 1rem;
    display: grid;
    gap: 1rem;
  }
</style>
