<script>
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import TodoItemList from '$lib/components/TodoItemList.svelte';
  import { resolveHouseholdId } from '$lib/memory/household';
  import { ItemRepository } from '$lib/memory/item-repository';
  import { ItemStore } from '$lib/stores/item-store';
  import { ListRepository } from '$lib/memory/list-repository';
  import { OfflineQueue } from '$lib/sync/offline-queue';
  import { startRealtimeBridge } from '$lib/sync/realtime';

  const householdId = resolveHouseholdId();
  const listId = get(page).params.listId;

  const itemRepository = new ItemRepository(householdId);
  const listRepository = new ListRepository();
  const store = new ItemStore(listId, itemRepository);
  const queue = new OfflineQueue(householdId);
  const itemState = store;
  let listTitle = '';
  let hydrated = false;
  let syncStatus = 'online synced';
  let stopRealtime = () => {};

  async function sendQueuedMutation(mutation) {
    const payload = mutation.payload ?? {};

    switch (mutation.op) {
      case 'create_item':
        await itemRepository.createItem(payload.listId ?? listId, payload.description ?? '');
        return;
      case 'update_item':
        if (typeof payload.isCompleted === 'boolean') {
          await itemRepository.setItemCompletion(payload.itemId, payload.isCompleted);
        } else {
          await itemRepository.updateItemText(payload.itemId, payload.description ?? '');
        }
        return;
      case 'delete_item':
        await itemRepository.deleteItem(payload.itemId);
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
    // Show native confirmation dialog
    if (!confirm('Are you sure you want to delete this item?')) {
      return; // User cancelled
    }

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

  async function loadListTitle() {
    try {
      const lists = await listRepository.getLists(householdId);
      const list = lists.find(l => l.id === listId);
      if (list) {
        listTitle = list.title;
      }
    } catch (error) {
      console.error('Failed to load list title', error);
    }
  }

  async function handleDeleteList() {
    // Show native confirmation dialog
    if (!confirm(`Are you sure you want to delete the list "${listTitle}" and all its items? This action cannot be undone.`)) {
      return; // User cancelled
    }

    try {
      await listRepository.deleteList(listId);
      // Redirect to home page after successful deletion
      goto('/');
    } catch (error) {
      console.error('Failed to delete list', error);
      // TODO: Show error to user
    }
  }

  onMount(async () => {
    await loadListTitle();
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
  <h1>{listTitle || 'List Details'}</h1>
  <p data-testid="item-hydrated" hidden={!hydrated}>ready</p>
  <p data-testid="sync-status" role="status" aria-live="polite">{syncStatus}</p>
  <p>
    <a href="/">Back to lists</a>
    <button
      type="button"
      class="danger"
      on:click={handleDeleteList}
      aria-label={`Delete list ${listTitle}`}
      data-testid="delete-list-button"
    >
      Delete List
    </button>
  </p>

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

  .danger {
    background-color: #dc2626;
    color: white;
    border: none;
    border-radius: 0.25rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    margin-left: 1rem;
  }

  .danger:hover {
    background-color: #b91c1c;
  }
</style>
