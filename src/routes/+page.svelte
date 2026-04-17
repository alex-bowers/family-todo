<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import ListSidebar from '$lib/components/ListSidebar.svelte';
  import { resolveDeviceId, resolveHouseholdId } from '$lib/memory/household';
  import { ListRepository } from '$lib/memory/list-repository';
  import { ListStore } from '$lib/stores/list-store';
  import { SyncEngine } from '$lib/sync/engine';
  import { setupListRefreshOnReconnect } from '$lib/sync/list-sync';

  const householdId = resolveHouseholdId();
  const deviceId = resolveDeviceId();
  const repository = new ListRepository();
  const store = new ListStore(householdId, repository);
  const syncEngine = new SyncEngine(householdId, deviceId);

  let cleanupSync = () => {};

  const listState = store;
  let hydrated = false;

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
  <h1>FamilyToDo</h1>
  <p>Shared family lists with cross-device memory.</p>
  <p data-testid="hydrated" hidden={!hydrated}>ready</p>

  <section class="layout">
    <ListSidebar
      lists={$listState.lists}
      selectedListId={$listState.selectedListId}
      loading={$listState.loading}
      error={$listState.error}
      onSelect={(id) => store.select(id)}
      onCreate={(title) => store.create(title)}
      onDelete={(id) => store.remove(id)}
    />

    <section class="detail" aria-live="polite">
      {#if $listState.selectedListId}
        <p>
          Selected list: {$listState.lists.find((list) => list.id === $listState.selectedListId)?.title}
        </p>
        <p>
          <a href={`/lists/${$listState.selectedListId}`}>Open selected list</a>
        </p>
      {:else}
        <p>Create a list to get started.</p>
      {/if}
    </section>
  </section>
</main>

<style>
  main {
    padding: 1rem;
    display: grid;
    gap: 1rem;
  }

  .layout {
    display: grid;
    gap: 1rem;
    grid-template-columns: minmax(16rem, 24rem) 1fr;
  }

  .detail {
    border: 1px solid #ccc;
    border-radius: 0.75rem;
    padding: 1rem;
    background: #fff;
  }

  @media (max-width: 800px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
