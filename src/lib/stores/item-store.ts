import { get, writable } from "svelte/store";
import type {
  ItemRevertFields,
  ItemUndoRecord,
  TodoItem,
  UUID,
} from "$lib/memory/types";
import { ItemRepository } from "$lib/memory/item-repository";
import { sortItemsForDisplay } from "$lib/utils/item-ordering";
import {
  buildItemUndoRecord,
  describeItemUndo,
  isItemUndoExpired,
  type ItemUndoStorage,
} from "$lib/stores/item-undo";

export interface ItemState {
  items: TodoItem[];
  loading: boolean;
  error: string | null;
  undo: ItemUndoRecord | null;
  undoMessage: string | null;
}

const initialState: ItemState = {
  items: [],
  loading: false,
  error: null,
  undo: null,
  undoMessage: null,
};

export class ItemStore {
  private readonly state = writable<ItemState>(initialState);
  private undoing = false;

  constructor(
    private readonly listId: UUID,
    private readonly repository: Pick<
      ItemRepository,
      | "getItems"
      | "createItem"
      | "updateItemText"
      | "setItemCompletion"
      | "deleteItem"
      | "revertItem"
    >,
    private readonly undoStorage: ItemUndoStorage | null = null,
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

  private applyItem(items: TodoItem[], next: TodoItem): TodoItem[] {
    if (next.deletedAt) {
      return items.filter((item) => item.id !== next.id);
    }

    return items.some((item) => item.id === next.id)
      ? this.replaceItem(items, next)
      : this.insertItem(items, next);
  }

  private findItem(itemId: UUID): TodoItem | undefined {
    return get(this.state).items.find((item) => item.id === itemId);
  }

  private readUndo(): ItemUndoRecord | null {
    const record = this.undoStorage?.read() ?? null;
    if (!record) {
      return null;
    }

    if (isItemUndoExpired(record, Date.now())) {
      this.undoStorage?.clear();
      return null;
    }

    // The record is per device, but only offered on the list it belongs to.
    return record.listId === this.listId ? record : null;
  }

  private rememberUndo(record: ItemUndoRecord): void {
    if (!this.undoStorage) {
      return;
    }

    this.undoStorage.write(record);
    this.state.update((current) => ({
      ...current,
      undo: record,
      undoMessage: null,
    }));
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
      const undo = this.readUndo();
      this.state.update((current) => ({
        ...current,
        items: sortItemsForDisplay(items),
        loading: false,
        error: null,
        undo,
      }));
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
      this.rememberUndo(buildItemUndoRecord("create", created, created));
    } catch (error) {
      this.setError(error);
    }
  }

  async updateText(itemId: UUID, description: string): Promise<void> {
    const before = this.findItem(itemId);
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
      if (before && before.description !== updated.description) {
        this.rememberUndo(buildItemUndoRecord("edit", before, updated));
      }
    } catch (error) {
      this.setError(error);
    }
  }

  async toggleCompletion(itemId: UUID, isCompleted: boolean): Promise<void> {
    const before = this.findItem(itemId);
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
      if (before && before.isCompleted !== updated.isCompleted) {
        this.rememberUndo(
          buildItemUndoRecord(
            updated.isCompleted ? "complete" : "uncomplete",
            before,
            updated,
          ),
        );
      }
    } catch (error) {
      this.setError(error);
    }
  }

  async remove(itemId: UUID): Promise<void> {
    const before = this.findItem(itemId);
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const deleted = await this.repository.deleteItem(itemId);
      this.state.update((current) => ({
        ...current,
        loading: false,
        items: sortItemsForDisplay(
          current.items.filter((item) => item.id !== itemId),
        ),
      }));
      if (before && deleted) {
        this.rememberUndo(buildItemUndoRecord("delete", before, deleted));
      }
    } catch (error) {
      this.setError(error);
    }
  }

  async undo(): Promise<void> {
    if (this.undoing) {
      return;
    }

    const record = this.readUndo();
    if (!record) {
      this.state.update((current) => ({
        ...current,
        undo: null,
        undoMessage: "Nothing to undo.",
      }));
      return;
    }

    this.undoing = true;
    this.state.update((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      // Undoing an add removes the item, stamped with the time of the undo.
      const fields: ItemRevertFields =
        record.action === "create"
          ? { ...record.revertTo, deletedAt: new Date().toISOString() }
          : record.revertTo;
      const reverted = await this.repository.revertItem(
        record.itemId,
        fields,
        record.expectedUpdatedAt,
      );

      this.undoStorage?.clear();
      this.state.update((current) => ({
        ...current,
        loading: false,
        undo: null,
        items: reverted ? this.applyItem(current.items, reverted) : current.items,
        undoMessage: reverted
          ? `Undone: ${describeItemUndo(record)}.`
          : `Couldn’t undo: “${record.label}” has changed since.`,
      }));
    } catch (error) {
      // Keep the record so the undo can be retried.
      this.setError(error);
    } finally {
      this.undoing = false;
    }
  }

  getSnapshot(): ItemState {
    return get(this.state);
  }
}
