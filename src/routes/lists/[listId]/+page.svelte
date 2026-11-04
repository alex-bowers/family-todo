<script>
  import { page } from '$app/stores';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import TodoItemList from '$lib/components/TodoItemList.svelte';
  import { resolveHouseholdId } from '$lib/memory/household';
  import { ItemRepository } from '$lib/memory/item-repository';
  import { ItemStore } from '$lib/stores/item-store';
  import { createItemUndoStorage, describeItemUndo } from '$lib/stores/item-undo';
  import { ListRepository } from '$lib/memory/list-repository';
  import { OfflineQueue } from '$lib/sync/offline-queue';
  import { startRealtimeBridge } from '$lib/sync/realtime';

  const householdId = resolveHouseholdId();
  const listId = get(page).params.listId;

  const itemRepository = new ItemRepository(householdId);
  const listRepository = new ListRepository();
  const store = new ItemStore(listId, itemRepository, createItemUndoStorage(householdId));
  const queue = new OfflineQueue(householdId);
  const itemState = store;
  let listTitle = '';
  let hydrated = false;
  let syncStatus = 'online synced';
  let online = true;
  let deleteError = '';
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

  async function handleUndo() {
    await store.undo();
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

    deleteError = '';
    if (!listId) {
      deleteError = 'Could not find the list. Please return to your lists.';
      return;
    }

    try {
      await listRepository.deleteList(listId, householdId);
      // Redirect to home page after successful deletion
      goto('/');
    } catch (error) {
      console.error('Failed to delete list', error);
      deleteError = 'Could not delete the list. Please try again.';
    }
  }

  onMount(async () => {
    await loadListTitle();
    hydrated = true;
    online = navigator.onLine;
    syncStatus = navigator.onLine ? 'online synced' : 'offline queued';
    await store.load();

    stopRealtime = startRealtimeBridge({
      onReconnect: async () => {
        online = true;
        await flushQueue();
        await store.load();
      },
      onOffline: async () => {
        online = false;
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

<svelte:head>
  <title>{listTitle ? `${listTitle} | FamilyToDo` : 'List details | FamilyToDo'}</title>
  <meta name="description" content="Manage tasks in this shared FamilyToDo list." />
</svelte:head>

<main>
  <div class="actions">
    <div class="action-group">
      <a href="/" class="button primary">Back to lists</a>
      <button
        type="button"
        class="button secondary"
        on:click={handleUndo}
        disabled={!$itemState.undo || !online}
        aria-label={$itemState.undo ? `Undo: ${describeItemUndo($itemState.undo)}` : 'Undo'}
        data-testid="undo-button"
      >
        Undo
      </button>
    </div>
    <button
      type="button"
      class="button danger"
      on:click={handleDeleteList}
      aria-label={`Delete list ${listTitle}`}
      data-testid="delete-list-button"
    >
      Delete List
    </button>
  </div>
  {#if deleteError}
    <p class="delete-error" role="alert">{deleteError}</p>
  {/if}
  <div class="header">
    <h1>{listTitle || 'List Details'}</h1>
    <div
      data-testid="item-hydrated"
      class="hydration-indicator"
      class:active={hydrated}
      role="status"
      aria-label={hydrated ? 'Connected' : 'Loading'}
    ></div>
  </div>
  <span data-testid="sync-status" role="status" aria-live="polite">{syncStatus}</span>
  {#if $itemState.undoMessage}
    <p class="undo-status" role="status" data-testid="undo-status">{$itemState.undoMessage}</p>
  {/if}

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
    gap: 1.25rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
    align-items: center;
  }

  .action-group {
    display: flex;
    gap: 0.75rem;
  }

  .undo-status {
    margin: 0;
    color: var(--stone);
    font-size: 0.9rem;
    text-align: center;
  }

  .delete-error {
    margin: 0;
    color: var(--clay);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .header h1 {
    margin: 0;
  }

  [data-testid='sync-status'] {
    justify-self: center;
    color: var(--stone);
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .hydration-indicator {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--line);
    transition: background-color 0.2s ease;
  }

  .hydration-indicator.active {
    background: var(--moss);
  }

  .button {
    white-space: nowrap;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 0.625rem 1.125rem;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    font-weight: 500;
    text-decoration: none;
    display: inline-block;
  }

  .button.primary {
    background-color: var(--moss);
    color: var(--moss-ink);
  }

  .button.primary:hover {
    background-color: var(--moss-strong);
  }

  .button.secondary {
    background-color: var(--sand);
    border-color: var(--line);
    color: var(--sumi);
  }

  .button.secondary:hover:not(:disabled) {
    border-color: var(--stone);
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .button.danger {
    background-color: transparent;
    border-color: var(--clay);
    color: var(--clay);
  }

  .button.danger:hover {
    background-color: var(--clay);
    color: var(--clay-ink);
  }
</style>
