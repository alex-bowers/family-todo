import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HasuraClient } from '$lib/graphql/client';
import { ListRepository } from '$lib/memory/list-repository';
import { makeHasuraSuccess, makeList, FIXTURE_HOUSEHOLD_ID, FIXTURE_LIST_ID } from './fixtures/hasura-fixtures';

describe('List GraphQL contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
  });

  it('queries active lists with expected variables', async () => {
    const payload = makeHasuraSuccess({
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
    });

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const repository = new ListRepository(new HasuraClient('http://example.test/graphql'));

    const lists = await repository.getLists(FIXTURE_HOUSEHOLD_ID);

    expect(lists).toHaveLength(1);
    expect(lists[0].title).toBe('Groceries');

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.variables).toEqual({ householdId: FIXTURE_HOUSEHOLD_ID });
    expect(body.query).toContain('query GetLists');
  });

  it('creates and soft-deletes list via GraphQL mutations', async () => {
    const created = makeList();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            makeHasuraSuccess({
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
          ),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(
            makeHasuraSuccess({
              update_todo_lists_by_pk: { id: created.id, deleted_at: new Date().toISOString() }
            })
          ),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );

    vi.stubGlobal('fetch', fetchMock);

    const repository = new ListRepository(new HasuraClient('http://example.test/graphql'));

    const inserted = await repository.createList(FIXTURE_HOUSEHOLD_ID, 'Groceries');
    await repository.deleteList(inserted.id, FIXTURE_HOUSEHOLD_ID);

    const createBody = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    const deleteBody = JSON.parse((fetchMock.mock.calls[1]?.[1] as RequestInit).body as string);

    expect(createBody.query).toContain('mutation CreateList');
    expect(createBody.variables.householdId).toBe(FIXTURE_HOUSEHOLD_ID);
    expect(deleteBody.query).toContain('mutation DeleteList');
    expect(deleteBody.variables.listId).toBe(inserted.id);
  });
});
