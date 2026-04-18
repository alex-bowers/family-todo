import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemRepository } from '$lib/memory/item-repository';
import {
  FIXTURE_ITEM_ID,
  FIXTURE_LIST_ID,
  makeItem
} from './fixtures/hasura-fixtures';

const FIXTURE_HOUSEHOLD_ID = '11111111-1111-1111-1111-111111111111';

describe('Item repository contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
  });

  it('queries active items by list id with expected variables', async () => {
    const request = vi.fn(async () => ({
      todo_items: [
        {
          id: FIXTURE_ITEM_ID,
          household_id: FIXTURE_HOUSEHOLD_ID,
          list_id: FIXTURE_LIST_ID,
          description: 'Buy milk',
          is_completed: false,
          completed_at: null,
          created_at: '2026-04-17T00:00:00.000Z',
          updated_at: '2026-04-17T00:00:00.000Z',
          deleted_at: null
        }
      ]
    }));

    const repository = new ItemRepository(FIXTURE_HOUSEHOLD_ID, { request } as never);
    const items = await repository.getItems(FIXTURE_LIST_ID);

    expect(items).toHaveLength(1);
    expect(items[0].description).toBe('Buy milk');

    expect(request).toHaveBeenCalledWith('GetItemsByList', { listId: FIXTURE_LIST_ID });
  });

  it('creates, edits, completes, and soft-deletes item via repository operations', async () => {
    const base = makeItem();

    const request = vi
      .fn()
      .mockResolvedValueOnce(
        {
          insert_todo_items_one: {
            id: base.id,
            household_id: FIXTURE_HOUSEHOLD_ID,
            list_id: base.listId,
            description: base.description,
            is_completed: false,
            completed_at: null,
            created_at: base.createdAt,
            updated_at: base.updatedAt,
            deleted_at: null
          }
        }
      )
      .mockResolvedValueOnce(
        {
          update_todo_items_by_pk: {
            id: base.id,
            household_id: FIXTURE_HOUSEHOLD_ID,
            list_id: base.listId,
            description: 'Buy oat milk',
            is_completed: false,
            completed_at: null,
            created_at: base.createdAt,
            updated_at: '2026-04-17T00:05:00.000Z',
            deleted_at: null
          }
        }
      )
      .mockResolvedValueOnce(
        {
          update_todo_items_by_pk: {
            id: base.id,
            household_id: FIXTURE_HOUSEHOLD_ID,
            list_id: base.listId,
            description: 'Buy oat milk',
            is_completed: true,
            completed_at: '2026-04-17T00:06:00.000Z',
            created_at: base.createdAt,
            updated_at: '2026-04-17T00:06:00.000Z',
            deleted_at: null
          }
        }
      )
      .mockResolvedValueOnce(
        {
          update_todo_items_by_pk: {
            id: base.id,
            deleted_at: '2026-04-17T00:07:00.000Z'
          }
        }
      );

    const repository = new ItemRepository(FIXTURE_HOUSEHOLD_ID, { request } as never);

    const created = await repository.createItem(FIXTURE_LIST_ID, base.description);
    const updated = await repository.updateItemText(created.id, 'Buy oat milk');
    const completed = await repository.setItemCompletion(updated.id, true);
    await repository.deleteItem(completed.id);

    expect(request.mock.calls[0]?.[0]).toBe('CreateItem');
    expect(request.mock.calls[1]?.[0]).toBe('UpdateItemText');
    expect(request.mock.calls[2]?.[0]).toBe('SetItemCompletion');
    expect(request.mock.calls[3]?.[0]).toBe('DeleteItem');
  });
});
