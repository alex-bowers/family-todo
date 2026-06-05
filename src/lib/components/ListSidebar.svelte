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
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .heading {
    margin: 0 0 1rem;
  }

  hr {
    margin: 2rem 0;
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

  #list-help {
    visibility: hidden;
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
