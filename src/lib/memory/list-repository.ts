import { cacheStore } from '$lib/memory/cache';
import type { TodoList, UUID } from '$lib/memory/types';
import { DELETE_LIST, GET_LISTS, CREATE_LIST } from '$lib/graphql/operations';
import { hasuraClient, type HasuraClient } from '$lib/graphql/client';

type GraphqlList = {
  id: string;
  household_id: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

interface GetListsResponse {
  todo_lists: GraphqlList[];
}

interface CreateListResponse {
  insert_todo_lists_one: GraphqlList;
}

interface DeleteListResponse {
  update_todo_lists_by_pk: {
    id: string;
    deleted_at: string | null;
  } | null;
}

function fromGraphql(row: GraphqlList): TodoList {
  return {
    id: row.id,
    householdId: row.household_id,
    title: row.title,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function nonDeleted(lists: TodoList[]): TodoList[] {
  return lists
    .filter((list) => !list.deletedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export class ListRepository {
  constructor(private readonly client: HasuraClient | null = hasuraClient) {}

  private readLocal(householdId: UUID): TodoList[] {
    return cacheStore.readSnapshot(householdId)?.lists ?? [];
  }

  private writeLocal(householdId: UUID, lists: TodoList[]): void {
    const current = cacheStore.readSnapshot(householdId);
    cacheStore.writeSnapshot(householdId, {
      lists,
      items: current?.items ?? [],
      serverTs: new Date().toISOString()
    });
  }

  async getLists(householdId: UUID): Promise<TodoList[]> {
    if (this.client) {
      const result = await this.client.request<GetListsResponse>(GET_LISTS, { householdId });
      const mapped = result.todo_lists.map(fromGraphql);
      this.writeLocal(householdId, mapped);
      return nonDeleted(mapped);
    }

    return nonDeleted(this.readLocal(householdId));
  }

  async createList(householdId: UUID, title: string): Promise<TodoList> {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('List title is required');
    }

    const existing = this.readLocal(householdId);
    const sortOrder = existing.length;

    if (this.client) {
      const result = await this.client.request<CreateListResponse>(CREATE_LIST, {
        householdId,
        title: trimmed,
        sortOrder
      });
      const created = fromGraphql(result.insert_todo_lists_one);
      this.writeLocal(householdId, [...existing, created]);
      return created;
    }

    const now = new Date().toISOString();
    const created: TodoList = {
      id: crypto.randomUUID(),
      householdId,
      title: trimmed,
      sortOrder,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    this.writeLocal(householdId, [...existing, created]);
    return created;
  }

  async deleteList(listId: UUID, householdId: UUID): Promise<void> {
    const existing = this.readLocal(householdId);

    if (this.client) {
      await this.client.request<DeleteListResponse>(DELETE_LIST, {
        listId,
        deletedAt: new Date().toISOString()
      });
    }

    const now = new Date().toISOString();
    const updated = existing.map((list) =>
      list.id === listId
        ? {
            ...list,
            deletedAt: now,
            updatedAt: now
          }
        : list
    );

    this.writeLocal(householdId, updated);
  }
}
