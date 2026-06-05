<script>
  import { getItemMatches } from '$lib/utils/item-matching';
  import { focusAndKeepVisible } from '$lib/utils/mobile-focus';

  /** @typedef {import('$lib/memory/types').TodoItem} TodoItem */
  /** @typedef {import('$lib/utils/item-matching').ItemMatch} ItemMatch */
  /** @typedef {(description: string) => Promise<void>} CreateHandler */
  /** @typedef {(itemId: string, isCompleted: boolean) => Promise<void>} ToggleHandler */
  /** @typedef {(itemId: string) => Promise<void>} DeleteHandler */
  /** @typedef {(itemId: string, description: string) => Promise<void>} UpdateHandler */

  /** @type {TodoItem[]} */
  export let items = [];
  export let loading = false;
  export let error = null;
  /** @type {CreateHandler} */
  export let onCreate;
  /** @type {ToggleHandler} */
  export let onToggle;
  /** @type {DeleteHandler} */
  export let onDelete;
  /** @type {UpdateHandler} */
  export let onUpdate;

  let newItemDescription = '';
  /** @type {string | null} */
  let editingItemId = null;
  let editingDescription = '';
  /** @type {string | null} */
  let validationMessage = null;
  let highlightedSuggestionIndex = -1;
  /** @type {ItemMatch | null} */
  let pendingStrongMatch = null;
  /** @type {ItemMatch[]} */
  let suggestionMatches = [];
  /** @type {ItemMatch | null} */
  let strongMatch = null;

  $: suggestionMatches = getItemMatches(newItemDescription, items);
  $: strongMatch = suggestionMatches.find((match) => match.isStrongMatch) ?? null;

  function clearDraftAssist() {
    highlightedSuggestionIndex = -1;
    pendingStrongMatch = null;
  }

  /** @param {string} trimmed */
  async function createItemFromDraft(trimmed) {
    await onCreate(trimmed);
    newItemDescription = '';
    clearDraftAssist();
  }

  /** @param {ItemMatch} match */
  async function reactivateExistingItem(match) {
    await onToggle(match.item.id, false);
    newItemDescription = '';
    if (match.item.isCompleted) {
      validationMessage = 'Reactivated existing matching item.';
    } else {
      validationMessage = 'Matching item is already uncompleted.';
    }
    clearDraftAssist();
  }

  /** @param {SubmitEvent} event */
  async function handleCreate(event) {
    event.preventDefault();
    const trimmed = newItemDescription.trim();
    if (!trimmed) {
      validationMessage = 'Item text cannot be blank.';
      return;
    }

    validationMessage = null;
    if (pendingStrongMatch) {
      await reactivateExistingItem(pendingStrongMatch);
      return;
    }

    if (strongMatch) {
      pendingStrongMatch = strongMatch;
      validationMessage = `Possible duplicate found: "${strongMatch.item.description}". Choose update existing or create new.`;
      return;
    }

    await createItemFromDraft(trimmed);
  }

  /** @param {ItemMatch} match */
  async function handleUseExistingSuggestion(match) {
    pendingStrongMatch = match;
    const trimmed = newItemDescription.trim();
    if (!trimmed) {
      return;
    }

    validationMessage = null;
    await reactivateExistingItem(match);
  }

  async function handleCreateAnyway() {
    const trimmed = newItemDescription.trim();
    if (!trimmed) {
      return;
    }

    validationMessage = null;
    await createItemFromDraft(trimmed);
  }

  async function handleUsePendingStrongMatch() {
    if (!pendingStrongMatch) {
      return;
    }

    await handleUseExistingSuggestion(pendingStrongMatch);
  }

  /** @param {FocusEvent} event */
  function handleDraftFocus(event) {
    // Keep the input visible on mobile devices
    focusAndKeepVisible(event.target);
  }

  /** @param {KeyboardEvent} event */
  function handleDraftKeydown(event) {
    if (event.key === 'ArrowDown') {
      if (suggestionMatches.length === 0) {
        return;
      }
      event.preventDefault();
      highlightedSuggestionIndex = Math.min(highlightedSuggestionIndex + 1, suggestionMatches.length - 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      if (suggestionMatches.length === 0) {
        return;
      }
      event.preventDefault();
      highlightedSuggestionIndex = Math.max(highlightedSuggestionIndex - 1, 0);
      return;
    }

    if (event.key === 'Escape') {
      clearDraftAssist();
      validationMessage = null;
      return;
    }

    if (event.key === 'Enter' && highlightedSuggestionIndex >= 0 && suggestionMatches[highlightedSuggestionIndex]) {
      event.preventDefault();
      newItemDescription = suggestionMatches[highlightedSuggestionIndex].item.description;
      pendingStrongMatch = suggestionMatches[highlightedSuggestionIndex];
    }
  }

  /** @param {TodoItem} item */
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

  /** @param {string} itemId */
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

  /** @param {KeyboardEvent} event */
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
      on:focus={handleDraftFocus}
      on:keydown={handleDraftKeydown}
      maxlength="500"
      placeholder="Add a task"
      required
      aria-describedby="new-item-help"
    />
    <p id="new-item-help" class="help-text">Start typing to find similar existing items and avoid duplicates.</p>
    <button type="submit" disabled={loading}>Add item</button>

    {#if suggestionMatches.length > 0 && newItemDescription.trim()}
      <div class="suggestions" role="listbox" aria-label="Possible duplicate items">
        <p class="suggestions-title">Possible matches</p>
        <ul>
          {#each suggestionMatches as match, index (match.item.id)}
            <li class:active={highlightedSuggestionIndex === index}>
              <button
                type="button"
                class="suggestion-button"
                on:click={() => handleUseExistingSuggestion(match)}
                aria-label={`Use existing item ${match.item.description}`}
              >
                Use existing "{match.item.description}"
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if pendingStrongMatch}
      <div class="duplicate-actions" role="group" aria-label="Duplicate resolution actions">
        <button type="button" on:click={handleUsePendingStrongMatch}>
          Mark existing as uncompleted
        </button>
        <button type="button" on:click={handleCreateAnyway}>Create new anyway</button>
      </div>
    {/if}
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
          <label class="toggle-hit" for={`item-toggle-${item.id}`}>
            <span class="toggle-label">Toggle completion</span>
            <input
              id={`item-toggle-${item.id}`}
              type="checkbox"
              checked={item.isCompleted}
              on:change={(event) => onToggle(item.id, event.currentTarget.checked)}
              aria-label={`Mark ${item.description} complete`}
            />
          </label>

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

  .help-text {
    margin: 0;
    color: #374151;
    font-size: 0.9rem;
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

  .toggle-hit {
    width: 2.5rem;
    min-height: 2.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #f9fafb;
    cursor: pointer;
  }

  .toggle-hit input[type='checkbox'] {
    width: 1.2rem;
    height: 1.2rem;
    margin: 0;
  }

  .suggestions {
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.5rem;
    background: #fcfcfc;
  }

  .suggestions-title {
    margin: 0 0 0.25rem 0;
    font-weight: 600;
  }

  .suggestion-button {
    width: 100%;
    text-align: left;
  }

  .suggestions li.active .suggestion-button {
    border-color: #0b5fff;
    background: #e8f0ff;
  }

  .duplicate-actions {
    display: flex;
    gap: 0.5rem;
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
