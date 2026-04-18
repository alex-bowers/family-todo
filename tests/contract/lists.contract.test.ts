import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListRepository } from '$lib/memory/list-repository';
import {
  FIXTURE_HOUSEHOLD_ID,
  FIXTURE_LIST_ID,
  makeList
} from './fixtures/hasura-fixtures';

describe('List repository contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
  });

  it('queries active lists with expected operation and variables', async () => {
    const request = vi.fn(async () => ({
      todo_lists: [
        {
          id: FIXTURE_LIST_ID,
          household_id: FIXTURE_HOUSEHOLD_ID,
          title: 'Groceries',
          sort_order: 0,
          created_at: '2026-04-17T00:00:00.000Z',
          updated_at: '2026-04-17T00:00:00.000Z',
          deleted_at: null
        }
      ]
    }));

    const repository = new ListRepository({ request } as never);

    const lists = await repository.getLists(FIXTURE_HOUSEHOLD_ID);

    expect(lists).toHaveLength(1);
    expect(lists[0].title).toBe('Groceries');

    expect(request).toHaveBeenCalledWith('GetLists', {
      householdId: FIXTURE_HOUSEHOLD_ID
    });
  });

  it('creates and soft-deletes list via repository operations', async () => {
    const created = makeList();
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        insert_todo_lists_one: {
          id: created.id,
          household_id: created.householdId,
          title: created.title,
          sort_order: created.sortOrder,
          created_at: created.createdAt,
          updated_at: created.updatedAt,
          deleted_at: null
        }
      })
      .mockResolvedValueOnce({
        update_todo_lists_by_pk: { id: created.id, deleted_at: new Date().toISOString() }
      });

    const repository = new ListRepository({ request } as never);

    const inserted = await repository.createList(FIXTURE_HOUSEHOLD_ID, 'Groceries');
    await repository.deleteList(inserted.id, FIXTURE_HOUSEHOLD_ID);

    expect(request).toHaveBeenNthCalledWith(1, 'CreateList', {
      householdId: FIXTURE_HOUSEHOLD_ID,
      title: 'Groceries',
      sortOrder: 0
    });
    expect(request.mock.calls[1]?.[0]).toBe('DeleteList');
    expect(request.mock.calls[1]?.[1].listId).toBe(inserted.id);
  });
});
