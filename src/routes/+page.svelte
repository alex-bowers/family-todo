<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import ListSidebar from '$lib/components/ListSidebar.svelte';
  import NotificationSettings from '$lib/components/NotificationSettings.svelte';
  import { resolveDeviceId, resolveHouseholdId } from '$lib/memory/household';
  import { ListRepository } from '$lib/memory/list-repository';
  import { ListStore } from '$lib/stores/list-store';
  import { SyncEngine } from '$lib/sync/engine';
  import { setupListRefreshOnReconnect } from '$lib/sync/list-sync';
  import { hasuraConfigured } from '$lib/graphql/client';

  const householdId = resolveHouseholdId();
  const deviceId = resolveDeviceId();
  const repository = new ListRepository();
  const store = new ListStore(householdId, repository);
  const syncEngine = new SyncEngine(householdId, deviceId);

  let cleanupSync = () => {};

  const listState = store;
  let hydrated = false;
  const backendConfigured = hasuraConfigured();

  onMount(async () => {
    hydrated = true;
    await store.load();

    cleanupSync = setupListRefreshOnReconnect({
      householdId,
      syncEngine,
      onListsUpdated: (lists) => store.setLists(lists),
      onError: (error) => {
        console.error('List sync refresh failed', error);
      }
    });
  });

  onDestroy(() => {
    cleanupSync();
  });
</script>

<svelte:head>
  <title>FamilyToDo | Shared lists</title>
  <meta name="description" content="Shared family to-do lists for groceries, chores and everyday tasks." />
</svelte:head>

<main>
  <div class="header">
    <h1 class="heading">FamilyToDo</h1>
    <div class="header-actions">
      <NotificationSettings />
      <div
        data-testid="hydrated"
        class="hydration-indicator"
        class:active={hydrated}
        role="status"
        aria-label={hydrated ? 'Connected' : 'Loading'}
      ></div>
    </div>
  </div>
  {#if !backendConfigured}
    <p role="status" aria-live="polite" class="migration-warning">
      Running in offline-compatible mode while Supabase configuration is incomplete.
    </p>
  {/if}

  <section class="layout">
    <ListSidebar
      lists={$listState.lists}
      selectedListId={$listState.selectedListId}
      loading={$listState.loading}
      error={$listState.error}
      onSelect={(id) => store.select(id)}
      onCreate={(title) => store.create(title)}
    />
  </section>
</main>

<style>
  main {
    padding: 2rem 1.25rem 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
  }

  .heading {
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
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

  .layout {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: minmax(16rem, 28rem) 1fr;
  }

  .migration-warning {
    border: 1px solid var(--line);
    background: var(--ochre-soft);
    color: var(--ochre);
    border-radius: var(--radius-sm);
    padding: 0.875rem 1rem;
    margin: 0;
  }

  @media (max-width: 800px) {
    .layout {
      grid-template-columns: 1fr;
      width: 100%;
    }
  }
</style>
