import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HasuraClient } from '$lib/graphql/client';
import { ItemRepository } from '$lib/memory/item-repository';
import {
  FIXTURE_ITEM_ID,
  FIXTURE_LIST_ID,
  makeHasuraSuccess,
  makeItem
} from './fixtures/hasura-fixtures';

const FIXTURE_HOUSEHOLD_ID = '11111111-1111-1111-1111-111111111111';

describe('Item GraphQL contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
  });

  it('queries active items by list id with expected variables', async () => {
    const payload = makeHasuraSuccess({
      todo_items: [
        {
          id: FIXTURE_ITEM_ID,
          list_id: FIXTURE_LIST_ID,
          description: 'Buy milk',
          is_completed: false,
          completed_at: null,
          created_at: '2026-04-17T00:00:00.000Z',
          updated_at: '2026-04-17T00:00:00.000Z',
          deleted_at: null
        }
      ]
    });

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const repository = new ItemRepository(FIXTURE_HOUSEHOLD_ID, new HasuraClient('http://example.test/graphql'));
    const items = await repository.getItems(FIXTURE_LIST_ID);

    expect(items).toHaveLength(1);
    expect(items[0].description).toBe('Buy milk');

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.query).toContain('query GetItemsByList');
    expect(body.variables).toEqual({ listId: FIXTURE_LIST_ID });
  });

  it('creates, edits, completes, and soft-deletes item via GraphQL mutations', async () => {
    const base = makeItem();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            makeHasuraSuccess({
              insert_todo_items_one: {
                id: base.id,
                list_id: base.listId,
                description: base.description,
                is_completed: false,
                completed_at: null,
                created_at: base.createdAt,
                updated_at: base.updatedAt,
                deleted_at: null
              }
            })
          ),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            makeHasuraSuccess({
              update_todo_items_by_pk: {
                id: base.id,
                list_id: base.listId,
                description: 'Buy oat milk',
                is_completed: false,
                completed_at: null,
                created_at: base.createdAt,
                updated_at: '2026-04-17T00:05:00.000Z',
                deleted_at: null
              }
            })
          ),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            makeHasuraSuccess({
              update_todo_items_by_pk: {
                id: base.id,
                list_id: base.listId,
                description: 'Buy oat milk',
                is_completed: true,
                completed_at: '2026-04-17T00:06:00.000Z',
                created_at: base.createdAt,
                updated_at: '2026-04-17T00:06:00.000Z',
                deleted_at: null
              }
            })
          ),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            makeHasuraSuccess({
              update_todo_items_by_pk: {
                id: base.id,
                deleted_at: '2026-04-17T00:07:00.000Z'
              }
            })
          ),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );

    vi.stubGlobal('fetch', fetchMock);

    const repository = new ItemRepository(FIXTURE_HOUSEHOLD_ID, new HasuraClient('http://example.test/graphql'));

    const created = await repository.createItem(FIXTURE_LIST_ID, base.description);
    const updated = await repository.updateItemText(created.id, 'Buy oat milk');
    const completed = await repository.setItemCompletion(updated.id, true);
    await repository.deleteItem(completed.id);

    const createBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    const updateBody = JSON.parse((fetchMock.mock.calls[1]?.[1] as RequestInit).body as string);
    const completeBody = JSON.parse((fetchMock.mock.calls[2]?.[1] as RequestInit).body as string);
    const deleteBody = JSON.parse((fetchMock.mock.calls[3]?.[1] as RequestInit).body as string);

    expect(createBody.query).toContain('mutation CreateItem');
    expect(updateBody.query).toContain('mutation UpdateItemText');
    expect(completeBody.query).toContain('mutation SetItemCompletion');
    expect(deleteBody.query).toContain('mutation DeleteItem');
  });
});
