import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemStore } from "$lib/stores/item-store";
import { buildItemUndoRecord } from "$lib/stores/item-undo";
import type { ItemUndoRecord, TodoItem } from "$lib/memory/types";
import {
  FIXTURE_ITEM_ID,
  FIXTURE_LIST_ID,
  makeItem,
} from "../contract/fixtures/hasura-fixtures";

const AFTER_UPDATED_AT = "2026-04-17T00:05:00.000Z";
const REVERTED_UPDATED_AT = "2026-04-17T00:06:00.000Z";
const ORIGINAL_FIELDS = {
  description: "Buy milk",
  isCompleted: false,
  completedAt: null,
  deletedAt: null,
};

function memoryUndoStorage(initial: ItemUndoRecord | null = null) {
  let record = initial;
  return {
    read: vi.fn(() => record),
    write: vi.fn((next: ItemUndoRecord) => {
      record = next;
    }),
    clear: vi.fn(() => {
      record = null;
    }),
    current: () => record,
  };
}

function makeRepository(items: TodoItem[] = [makeItem()]) {
  return {
    getItems: vi.fn(async () => items),
    createItem: vi.fn(),
    updateItemText: vi.fn(),
    setItemCompletion: vi.fn(),
    deleteItem: vi.fn(),
    revertItem: vi.fn(),
  };
}

const ticked = makeItem({
  isCompleted: true,
  completedAt: AFTER_UPDATED_AT,
  updatedAt: AFTER_UPDATED_AT,
});

describe("ItemStore undo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("undoes a tick back to the previous state", async () => {
    const repository = makeRepository();
    repository.setItemCompletion.mockResolvedValue(ticked);
    repository.revertItem.mockResolvedValue(
      makeItem({ updatedAt: REVERTED_UPDATED_AT }),
    );
    const storage = memoryUndoStorage();
    const store = new ItemStore(FIXTURE_LIST_ID, repository, storage);

    await store.load();
    await store.toggleCompletion(FIXTURE_ITEM_ID, true);

    expect(store.getSnapshot().undo?.action).toBe("complete");
    expect(storage.current()?.expectedUpdatedAt).toBe(AFTER_UPDATED_AT);

    await store.undo();

    expect(repository.revertItem).toHaveBeenCalledWith(
      FIXTURE_ITEM_ID,
      ORIGINAL_FIELDS,
      AFTER_UPDATED_AT,
    );
    const snapshot = store.getSnapshot();
    expect(snapshot.items[0].isCompleted).toBe(false);
    expect(snapshot.undo).toBeNull();
    expect(snapshot.undoMessage).toBe("Undone: ticked “Buy milk”.");
    expect(storage.current()).toBeNull();
  });

  it("restores a deleted item", async () => {
    const repository = makeRepository();
    repository.deleteItem.mockResolvedValue(
      makeItem({ deletedAt: AFTER_UPDATED_AT, updatedAt: AFTER_UPDATED_AT }),
    );
    repository.revertItem.mockResolvedValue(
      makeItem({ updatedAt: REVERTED_UPDATED_AT }),
    );
    const store = new ItemStore(
      FIXTURE_LIST_ID,
      repository,
      memoryUndoStorage(),
    );

    await store.load();
    await store.remove(FIXTURE_ITEM_ID);
    expect(store.getSnapshot().items).toHaveLength(0);

    await store.undo();

    expect(repository.revertItem).toHaveBeenCalledWith(
      FIXTURE_ITEM_ID,
      ORIGINAL_FIELDS,
      AFTER_UPDATED_AT,
    );
    expect(store.getSnapshot().items).toHaveLength(1);
    expect(store.getSnapshot().undoMessage).toBe("Undone: deleted “Buy milk”.");
  });

  it("removes an added item when its add is undone", async () => {
    const repository = makeRepository([]);
    repository.createItem.mockResolvedValue(
      makeItem({ updatedAt: AFTER_UPDATED_AT }),
    );
    repository.revertItem.mockResolvedValue(
      makeItem({
        deletedAt: REVERTED_UPDATED_AT,
        updatedAt: REVERTED_UPDATED_AT,
      }),
    );
    const store = new ItemStore(
      FIXTURE_LIST_ID,
      repository,
      memoryUndoStorage(),
    );

    await store.load();
    await store.create("Buy milk");
    await store.undo();

    expect(repository.revertItem).toHaveBeenCalledWith(
      FIXTURE_ITEM_ID,
      { ...ORIGINAL_FIELDS, deletedAt: expect.any(String) },
      AFTER_UPDATED_AT,
    );
    expect(store.getSnapshot().items).toHaveLength(0);
    expect(store.getSnapshot().undoMessage).toBe("Undone: added “Buy milk”.");
  });

  it("restores the previous text when an edit is undone", async () => {
    const repository = makeRepository();
    repository.updateItemText.mockResolvedValue(
      makeItem({ description: "Buy oat milk", updatedAt: AFTER_UPDATED_AT }),
    );
    repository.revertItem.mockResolvedValue(
      makeItem({ updatedAt: REVERTED_UPDATED_AT }),
    );
    const store = new ItemStore(
      FIXTURE_LIST_ID,
      repository,
      memoryUndoStorage(),
    );

    await store.load();
    await store.updateText(FIXTURE_ITEM_ID, "Buy oat milk");
    await store.undo();

    expect(store.getSnapshot().items[0].description).toBe("Buy milk");
    expect(store.getSnapshot().undoMessage).toBe(
      "Undone: renamed “Buy milk” to “Buy oat milk”.",
    );
  });

  it("refuses the undo when the item changed elsewhere", async () => {
    const repository = makeRepository();
    repository.setItemCompletion.mockResolvedValue(ticked);
    repository.revertItem.mockResolvedValue(null);
    const storage = memoryUndoStorage();
    const store = new ItemStore(FIXTURE_LIST_ID, repository, storage);

    await store.load();
    await store.toggleCompletion(FIXTURE_ITEM_ID, true);
    await store.undo();

    const snapshot = store.getSnapshot();
    expect(snapshot.items[0].isCompleted).toBe(true);
    expect(snapshot.undo).toBeNull();
    expect(snapshot.undoMessage).toBe(
      "Couldn’t undo: “Buy milk” has changed since.",
    );
    expect(storage.current()).toBeNull();
  });

  it("keeps the record when the undo request fails", async () => {
    const repository = makeRepository();
    repository.setItemCompletion.mockResolvedValue(ticked);
    repository.revertItem.mockRejectedValue(new Error("Network down"));
    const storage = memoryUndoStorage();
    const store = new ItemStore(FIXTURE_LIST_ID, repository, storage);

    await store.load();
    await store.toggleCompletion(FIXTURE_ITEM_ID, true);
    await store.undo();

    expect(store.getSnapshot().error).toBe("Network down");
    expect(store.getSnapshot().undo).not.toBeNull();
    expect(storage.current()).not.toBeNull();
  });

  it("does not record an action that changed nothing", async () => {
    const repository = makeRepository();
    repository.setItemCompletion.mockResolvedValue(makeItem());
    const storage = memoryUndoStorage();
    const store = new ItemStore(FIXTURE_LIST_ID, repository, storage);

    await store.load();
    await store.toggleCompletion(FIXTURE_ITEM_ID, false);

    expect(storage.write).not.toHaveBeenCalled();
    expect(store.getSnapshot().undo).toBeNull();
  });

  it("drops a record once it is an hour old", async () => {
    vi.useFakeTimers();
    const recordedAt = new Date("2026-04-17T00:00:00.000Z");
    const record = buildItemUndoRecord(
      "complete",
      makeItem(),
      ticked,
      recordedAt,
    );

    vi.setSystemTime(new Date("2026-04-17T00:59:59.000Z"));
    const freshStorage = memoryUndoStorage(record);
    const freshStore = new ItemStore(
      FIXTURE_LIST_ID,
      makeRepository([ticked]),
      freshStorage,
    );
    await freshStore.load();
    expect(freshStore.getSnapshot().undo).not.toBeNull();

    vi.setSystemTime(new Date("2026-04-17T01:00:00.000Z"));
    const staleStorage = memoryUndoStorage(record);
    const staleStore = new ItemStore(
      FIXTURE_LIST_ID,
      makeRepository([ticked]),
      staleStorage,
    );
    await staleStore.load();
    expect(staleStore.getSnapshot().undo).toBeNull();
    expect(staleStorage.current()).toBeNull();
  });

  it("only offers the undo on the list where it happened", async () => {
    const record = buildItemUndoRecord(
      "complete",
      makeItem({ listId: "another-list" }),
      { ...ticked, listId: "another-list" },
    );
    const storage = memoryUndoStorage(record);
    const store = new ItemStore(FIXTURE_LIST_ID, makeRepository(), storage);

    await store.load();

    expect(store.getSnapshot().undo).toBeNull();
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it("says so when there is nothing to undo", async () => {
    const repository = makeRepository();
    const store = new ItemStore(
      FIXTURE_LIST_ID,
      repository,
      memoryUndoStorage(),
    );

    await store.load();
    await store.undo();

    expect(repository.revertItem).not.toHaveBeenCalled();
    expect(store.getSnapshot().undoMessage).toBe("Nothing to undo.");
  });
});
