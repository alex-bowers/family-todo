<script>
  import { goto } from '$app/navigation';

  export let lists = [];
  export let selectedListId = null;
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

<aside class="list-sidebar" aria-label="Todo lists">
  <h2>Lists</h2>

  <form on:submit={handleCreate} aria-label="Create list form">
    <label for="new-list-title">New list</label>
    <input
      id="new-list-title"
      name="new-list-title"
      bind:value={newListTitle}
      maxlength="120"
      required
      placeholder="Add a list"
      aria-describedby="list-help"
    />
    <p id="list-help">Create separate lists for groceries, chores, or school tasks.</p>
    <button type="submit" disabled={loading}>Create list</button>
  </form>

  {#if error}
    <p role="alert" class="error">{error}</p>
  {/if}

  {#if lists.length === 0}
    <p class="empty-state">No lists yet. Create your first list above.</p>
  {:else}
    <ul>
      {#each lists as list (list.id)}
        <li>
          <button
            type="button"
            class:selected={selectedListId === list.id}
            on:click={() => handleListActivation(list.id)}
            aria-current={selectedListId === list.id ? 'true' : undefined}
            aria-label={`Open list ${list.title}`}
            data-testid={`list-${list.id}`}
          >
            Open list {list.title}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</aside>

<style>
  .list-sidebar {
    border: 1px solid #ccc;
    border-radius: 0.75rem;
    padding: 1rem;
    background: #fff;
  }

  form {
    display: grid;
    gap: 0.5rem;
  }

  input {
    border: 1px solid #666;
    border-radius: 0.4rem;
    padding: 0.5rem;
  }

  p {
    margin: 0;
  }

  ul {
    margin: 1rem 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;
  }

  li {
    display: flex;
    gap: 0.5rem;
  }

  button {
    border: 1px solid #1f2937;
    border-radius: 0.4rem;
    padding: 0.4rem 0.6rem;
    background: #f8f8f8;
  }

  button:focus-visible,
  input:focus-visible,
  .empty-state:focus-visible {
    outline: 3px solid #0b5fff;
    outline-offset: 1px;
  }

  button.selected {
    background: #dbeafe;
    border-color: #1d4ed8;
  }

  .error {
    color: #7f1d1d;
    font-weight: 600;
  }

  .empty-state {
    margin-top: 1rem;
    color: #555;
  }
</style>
