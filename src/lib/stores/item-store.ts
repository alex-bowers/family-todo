import { get, writable } from "svelte/store";
import type { TodoItem, UUID } from "$lib/memory/types";
import { ItemRepository } from "$lib/memory/item-repository";
import { sortItemsForDisplay } from "$lib/utils/item-ordering";

export interface ItemState {
  items: TodoItem[];
  loading: boolean;
  error: string | null;
}

const initialState: ItemState = {
  items: [],
  loading: false,
  error: null,
};

export class ItemStore {
  private readonly state = writable<ItemState>(initialState);

  constructor(
    private readonly listId: UUID,
    private readonly repository: Pick<
      ItemRepository,
      | "getItems"
      | "createItem"
      | "updateItemText"
      | "setItemCompletion"
      | "deleteItem"
    >,
  ) {}

  subscribe = this.state.subscribe;

  private replaceItem(items: TodoItem[], nextItem: TodoItem): TodoItem[] {
    const index = items.findIndex((item) => item.id === nextItem.id);
    if (index === -1) {
      return items;
    }

    const current = items[index];
    if (
      current.description === nextItem.description &&
      current.isCompleted === nextItem.isCompleted &&
      current.completedAt === nextItem.completedAt &&
      current.updatedAt === nextItem.updatedAt &&
      current.deletedAt === nextItem.deletedAt
    ) {
      return items;
    }

    const next = items.slice();
    next[index] = nextItem;
    return sortItemsForDisplay(next);
  }

  private insertItem(items: TodoItem[], created: TodoItem): TodoItem[] {
    return sortItemsForDisplay([...items, created]);
  }

  private setError(error: unknown): void {
    this.state.update((current) => ({
      ...current,
      loading: false,
      error: error instanceof Error ? error.message : "Unexpected item error",
    }));
  }

  async load(): Promise<void> {
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const items = await this.repository.getItems(this.listId);
      this.state.set({
        items: sortItemsForDisplay(items),
        loading: false,
        error: null,
      });
    } catch (error) {
      this.setError(error);
    }
  }

  async create(description: string): Promise<void> {
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const created = await this.repository.createItem(
        this.listId,
        description,
      );
      this.state.update((current) => ({
        ...current,
        loading: false,
        items: this.insertItem(current.items, created),
      }));
    } catch (error) {
      this.setError(error);
    }
  }

  async updateText(itemId: UUID, description: string): Promise<void> {
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const updated = await this.repository.updateItemText(itemId, description);
      this.state.update((current) => ({
        ...current,
        loading: false,
        items: this.replaceItem(current.items, updated),
      }));
    } catch (error) {
      this.setError(error);
    }
  }

  async toggleCompletion(itemId: UUID, isCompleted: boolean): Promise<void> {
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const updated = await this.repository.setItemCompletion(
        itemId,
        isCompleted,
      );
      this.state.update((current) => ({
        ...current,
        loading: false,
        items: this.replaceItem(current.items, updated),
      }));
    } catch (error) {
      this.setError(error);
    }
  }

  async remove(itemId: UUID): Promise<void> {
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      await this.repository.deleteItem(itemId);
      this.state.update((current) => ({
        ...current,
        loading: false,
        items: sortItemsForDisplay(
          current.items.filter((item) => item.id !== itemId),
        ),
      }));
    } catch (error) {
      this.setError(error);
    }
  }

  getSnapshot(): ItemState {
    return get(this.state);
  }
}
