import { describe, expect, it, vi } from 'vitest';
import { ItemStore } from '$lib/stores/item-store';
import { FIXTURE_ITEM_ID, FIXTURE_LIST_ID, makeItem } from '../contract/fixtures/hasura-fixtures';

describe('ItemStore transitions', () => {
  it('loads items for the current list', async () => {
    const repository = {
      getItems: vi.fn(async () => [makeItem()]),
      createItem: vi.fn(),
      updateItemText: vi.fn(),
      setItemCompletion: vi.fn(),
      deleteItem: vi.fn()
    };

    const store = new ItemStore(FIXTURE_LIST_ID, repository);
    await store.load();

    const snapshot = store.getSnapshot();
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].description).toBe('Buy milk');
  });

  it('creates and updates an item', async () => {
    const repository = {
      getItems: vi.fn(async () => []),
      createItem: vi.fn(async () => makeItem()),
      updateItemText: vi.fn(async () => makeItem({ description: 'Buy oat milk' })),
      setItemCompletion: vi.fn(),
      deleteItem: vi.fn()
    };

    const store = new ItemStore(FIXTURE_LIST_ID, repository);
    await store.load();
    await store.create('Buy milk');
    await store.updateText(FIXTURE_ITEM_ID, 'Buy oat milk');

    const snapshot = store.getSnapshot();
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].description).toBe('Buy oat milk');
  });

  it('toggles completion and removes item', async () => {
    const completed = makeItem({ isCompleted: true, completedAt: '2026-04-17T00:10:00.000Z' });
    const repository = {
      getItems: vi.fn(async () => [makeItem()]),
      createItem: vi.fn(),
      updateItemText: vi.fn(),
      setItemCompletion: vi.fn(async () => completed),
      deleteItem: vi.fn(async () => undefined)
    };

    const store = new ItemStore(FIXTURE_LIST_ID, repository);
    await store.load();
    await store.toggleCompletion(FIXTURE_ITEM_ID, true);

    let snapshot = store.getSnapshot();
    expect(snapshot.items[0].isCompleted).toBe(true);
    expect(snapshot.items[0].completedAt).toBeTruthy();

    await store.remove(FIXTURE_ITEM_ID);
    snapshot = store.getSnapshot();
    expect(snapshot.items).toHaveLength(0);
  });
});
