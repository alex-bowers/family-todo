<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import ListSidebar from '$lib/components/ListSidebar.svelte';
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

<main>
  <div class="header">
    <h1 class="heading">FamilyToDo</h1>
    <div
      data-testid="hydrated"
      class="hydration-indicator"
      class:active={hydrated}
      role="status"
      aria-label={hydrated ? 'Connected' : 'Loading'}
    ></div>
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
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .heading {
    margin: 0;
  }

  .hydration-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #e5e7eb;
    transition: background-color 0.2s ease;
  }

  .hydration-indicator.active {
    background: #10b981;
  }

  .layout {
    display: grid;
    gap: 1rem;
    grid-template-columns: minmax(16rem, 24rem) 1fr;
  }

  .migration-warning {
    border: 1px solid #d97706;
    background: #fffbeb;
    color: #92400e;
    border-radius: 0.5rem;
    padding: 0.75rem;
  }

  @media (max-width: 800px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
