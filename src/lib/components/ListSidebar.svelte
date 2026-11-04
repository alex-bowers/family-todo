<script>
  import { goto } from '$app/navigation';

  export let lists = [];
  export let loading = false;
  export let error = null;
  export let onCreate;

  let newListTitle = '';

  async function handleCreate(event) {
    event.preventDefault();
    const title = newListTitle.trim();
    if (!title) {
      return;
    }

    await onCreate(title);
    newListTitle = '';
  }

  function handleListActivation(id) {
    // Navigate directly to the list detail page
    goto(`/lists/${id}`);
  }
</script>

<aside aria-label="Todo lists">
  {#if error}
    <p role="alert" class="error">{error}</p>
  {/if}

  {#if lists.length === 0}
    <p class="empty-state">No lists yet. Create your first list above.</p>
  {:else}
    <div class="list-grid">
      {#each lists as list (list.id)}
        <button
          type="button"
          on:click={() => handleListActivation(list.id)}
          aria-label={`Open list ${list.title}`}
          data-testid={`list-${list.id}`}
        >
          {list.title}
        </button>
      {/each}
    </div>
  {/if}

  <hr>

  <h2 class="heading">Add New List</h2>
  <form on:submit={handleCreate} aria-label="Create list form">
    <label for="new-list-title" class="visually-hidden">New list</label>
    <input
      id="new-list-title"
      name="new-list-title"
      bind:value={newListTitle}
      maxlength="120"
      required
      placeholder="New list name"
      aria-describedby="list-help"
    />
    <button type="submit" disabled={loading}>Create list</button>
    <span id="list-help">Create separate lists for groceries, chores, or school tasks.</span>
  </form>
</aside>

<style>
  .list-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .list-grid button {
    min-height: 4.5rem;
    padding: 1rem;
    text-align: left;
    font-weight: 500;
    background: var(--paper);
    border-color: var(--line);
    border-radius: var(--radius-lg);
  }

  .list-grid button:hover {
    border-color: var(--oak);
  }

  .heading {
    margin: 0 0 1rem;
  }

  hr {
    margin: 2rem 0;
  }

  form {
    display: grid;
    gap: 0.875rem;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  input {
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.625rem 0.75rem;
    background: var(--paper);
  }

  input::placeholder {
    color: var(--stone);
  }

  p {
    margin: 0;
  }

  button {
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 0.625rem 1rem;
    background: var(--sand);
    color: var(--sumi);
  }

  button[type='submit'] {
    background: var(--moss);
    border-color: var(--moss);
    color: var(--moss-ink);
    font-weight: 500;
  }

  button[type='submit']:hover:not(:disabled) {
    background: var(--moss-strong);
  }

  button:focus-visible,
  input:focus-visible,
  .empty-state:focus-visible {
    outline: 2px solid var(--moss);
    outline-offset: 2px;
  }

  #list-help {
    color: var(--stone);
    font-size: 0.85rem;
  }

  .error {
    color: var(--clay);
    font-weight: 500;
  }

  .empty-state {
    margin-top: 1rem;
    color: var(--stone);
  }
</style>
