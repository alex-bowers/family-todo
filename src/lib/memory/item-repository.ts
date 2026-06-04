import { hasuraClient, type HasuraClient } from "$lib/graphql/client";
import {
  CREATE_ITEM,
  DELETE_ITEM,
  GET_ITEMS_BY_LIST,
  SET_ITEM_COMPLETION,
  UPDATE_ITEM_TEXT,
} from "$lib/graphql/operations";
import { cacheStore } from "$lib/memory/cache";
import {
  fromSupabaseItem,
  type SupabaseItemRow,
  type TodoItem,
  type UUID,
} from "$lib/memory/types";
import { sortItemsForDisplay } from "$lib/utils/item-ordering";

interface GetItemsResponse {
  todo_items: SupabaseItemRow[];
}

interface CreateItemResponse {
  insert_todo_items_one: SupabaseItemRow;
}

interface UpdateItemResponse {
  update_todo_items_by_pk: SupabaseItemRow | null;
}

interface DeleteItemResponse {
  update_todo_items_by_pk: {
    id: string;
    deleted_at: string | null;
  } | null;
}

function activeSorted(items: TodoItem[]): TodoItem[] {
  return sortItemsForDisplay(items.filter((item) => !item.deletedAt));
}

export class ItemRepository {
  constructor(
    private readonly householdId: UUID,
    private readonly client: HasuraClient | null = hasuraClient,
  ) {}

  private readLocal(): TodoItem[] {
    return cacheStore.readSnapshot(this.householdId)?.items ?? [];
  }

  private writeLocal(items: TodoItem[]): void {
    const current = cacheStore.readSnapshot(this.householdId);
    cacheStore.writeSnapshot(this.householdId, {
      lists: current?.lists ?? [],
      items,
      serverTs: new Date().toISOString(),
    });
  }

  async getItems(listId: UUID): Promise<TodoItem[]> {
    if (this.client) {
      const result = await this.client.request<GetItemsResponse>(
        GET_ITEMS_BY_LIST,
        { listId },
      );
      const mapped = result.todo_items.map(fromSupabaseItem);
      const local = this.readLocal().filter((item) => item.listId !== listId);
      this.writeLocal([...local, ...mapped]);
      return activeSorted(mapped);
    }

    return activeSorted(
      this.readLocal().filter((item) => item.listId === listId),
    );
  }

  async createItem(listId: UUID, description: string): Promise<TodoItem> {
    const trimmed = description.trim();
    if (!trimmed) {
      throw new Error("Item text is required");
    }

    const existing = this.readLocal();

    if (this.client) {
      const result = await this.client.request<CreateItemResponse>(
        CREATE_ITEM,
        {
          listId,
          householdId: this.householdId,
          description: trimmed,
        },
      );
      const created = fromSupabaseItem(result.insert_todo_items_one);
      this.writeLocal([...existing, created]);
      return created;
    }

    const now = new Date().toISOString();
    const created: TodoItem = {
      id: crypto.randomUUID(),
      listId,
      description: trimmed,
      isCompleted: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.writeLocal([...existing, created]);
    return created;
  }

  async updateItemText(itemId: UUID, description: string): Promise<TodoItem> {
    const trimmed = description.trim();
    if (!trimmed) {
      throw new Error("Item text is required");
    }

    const existing = this.readLocal();

    if (this.client) {
      const result = await this.client.request<UpdateItemResponse>(
        UPDATE_ITEM_TEXT,
        {
          itemId,
          description: trimmed,
          expectedUpdatedAt: existing.find((item) => item.id === itemId)
            ?.updatedAt,
        },
      );

      if (!result.update_todo_items_by_pk) {
        throw new Error("Item not found");
      }

      const updated = fromSupabaseItem(result.update_todo_items_by_pk);
      this.writeLocal(
        existing.map((item) => (item.id === itemId ? updated : item)),
      );
      return updated;
    }

    const now = new Date().toISOString();
    const updated = existing.find((item) => item.id === itemId);
    if (!updated) {
      throw new Error("Item not found");
    }

    const next: TodoItem = {
      ...updated,
      description: trimmed,
      updatedAt: now,
    };
    this.writeLocal(existing.map((item) => (item.id === itemId ? next : item)));
    return next;
  }

  async setItemCompletion(
    itemId: UUID,
    isCompleted: boolean,
  ): Promise<TodoItem> {
    const existing = this.readLocal();

    if (this.client) {
      const result = await this.client.request<UpdateItemResponse>(
        SET_ITEM_COMPLETION,
        {
          itemId,
          isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : null,
          expectedUpdatedAt: existing.find((item) => item.id === itemId)
            ?.updatedAt,
        },
      );

      if (!result.update_todo_items_by_pk) {
        throw new Error("Item not found");
      }

      const updated = fromSupabaseItem(result.update_todo_items_by_pk);
      this.writeLocal(
        existing.map((item) => (item.id === itemId ? updated : item)),
      );
      return updated;
    }

    const now = new Date().toISOString();
    const updated = existing.find((item) => item.id === itemId);
    if (!updated) {
      throw new Error("Item not found");
    }

    const next: TodoItem = {
      ...updated,
      isCompleted,
      completedAt: isCompleted ? now : null,
      updatedAt: now,
    };

    this.writeLocal(existing.map((item) => (item.id === itemId ? next : item)));
    return next;
  }

  async deleteItem(itemId: UUID): Promise<void> {
    const existing = this.readLocal();

    if (this.client) {
      await this.client.request<DeleteItemResponse>(DELETE_ITEM, {
        itemId,
        deletedAt: new Date().toISOString(),
        expectedUpdatedAt: existing.find((item) => item.id === itemId)
          ?.updatedAt,
      });
    }

    const now = new Date().toISOString();
    const updated = existing.map((item) =>
      item.id === itemId
        ? {
            ...item,
            deletedAt: now,
            updatedAt: now,
          }
        : item,
    );

    this.writeLocal(updated);
  }
}
