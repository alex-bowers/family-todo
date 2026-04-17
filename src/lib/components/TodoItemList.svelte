<script>
  export let items = [];
  export let loading = false;
  export let error = null;
  export let onCreate;
  export let onToggle;
  export let onDelete;
  export let onUpdate;

  let newItemDescription = '';
  let editingItemId = null;
  let editingDescription = '';
  let validationMessage = null;

  async function handleCreate(event) {
    event.preventDefault();
    const trimmed = newItemDescription.trim();
    if (!trimmed) {
      validationMessage = 'Item text cannot be blank.';
      return;
    }

    validationMessage = null;
    await onCreate(trimmed);
    newItemDescription = '';
  }

  function startEdit(item) {
    editingItemId = item.id;
    editingDescription = item.description;
    validationMessage = null;
  }

  function cancelEdit() {
    editingItemId = null;
    editingDescription = '';
    validationMessage = null;
  }

  async function saveEdit(itemId) {
    const trimmed = editingDescription.trim();
    if (!trimmed) {
      validationMessage = 'Item text cannot be blank.';
      return;
    }

    validationMessage = null;
    await onUpdate(itemId, trimmed);
    cancelEdit();
  }

  function handleEditKeydown(event) {
    if (event.key === 'Escape') {
      cancelEdit();
    }
  }
</script>

<section class="item-panel" aria-label="Todo items">
  <h2>Items</h2>

  <form on:submit={handleCreate} aria-label="Create item form">
    <label for="new-item-description">New item</label>
    <input
      id="new-item-description"
      name="new-item-description"
      bind:value={newItemDescription}
      maxlength="500"
      placeholder="Add a task"
      required
    />
    <button type="submit" disabled={loading}>Add item</button>
  </form>

  {#if validationMessage}
    <p class="validation" role="alert">{validationMessage}</p>
  {/if}

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if items.length === 0}
    <p class="empty">No items yet. Add one above.</p>
  {:else}
    <ul>
      {#each items as item (item.id)}
        <li>
          <label class="toggle-label" for={`item-toggle-${item.id}`}>Toggle completion</label>
          <input
            id={`item-toggle-${item.id}`}
            type="checkbox"
            checked={item.isCompleted}
            on:change={(event) => onToggle(item.id, event.currentTarget.checked)}
            aria-label={`Mark ${item.description} complete`}
          />

          {#if editingItemId === item.id}
            <input
              bind:value={editingDescription}
              on:keydown={handleEditKeydown}
              aria-label={`Edit ${item.description}`}
              maxlength="500"
            />
            <button type="button" on:click={() => saveEdit(item.id)}>
              Save
            </button>
            <button type="button" on:click={cancelEdit}>
              Cancel
            </button>
          {:else}
            <span class="item-text" class:completed={item.isCompleted}>{item.description}</span>
            <button type="button" on:click={() => startEdit(item)} aria-label={`Edit item ${item.description}`}>
              Edit
            </button>
            <button type="button" class="danger" on:click={() => onDelete(item.id)} aria-label={`Delete item ${item.description}`}>
              Delete
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .item-panel {
    border: 1px solid #ccc;
    border-radius: 0.75rem;
    padding: 1rem;
    background: #fff;
  }

  form {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  input:not([type='checkbox']) {
    border: 1px solid #666;
    border-radius: 0.4rem;
    padding: 0.5rem;
  }

  button {
    border: 1px solid #1f2937;
    border-radius: 0.4rem;
    padding: 0.35rem 0.6rem;
    background: #f8f8f8;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 3px solid #0b5fff;
    outline-offset: 1px;
  }

  .toggle-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;
  }

  li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 0.5rem;
    align-items: center;
  }

  .item-text.completed {
    text-decoration: line-through;
    color: #555;
  }

  .danger,
  .error,
  .validation {
    color: #7f1d1d;
  }

  .empty {
    color: #555;
  }
</style>
