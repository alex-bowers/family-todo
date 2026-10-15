import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ItemRepository } from "$lib/memory/item-repository";
import { cacheStore } from "$lib/memory/cache";
import type { TodoItem } from "$lib/memory/types";
import {
  FIXTURE_HOUSEHOLD_ID,
  FIXTURE_ITEM_ID,
  FIXTURE_LIST_ID,
  makeItem,
} from "./fixtures/hasura-fixtures";

const ACTION_UPDATED_AT = "2026-04-17T00:05:00.000Z";
const REVERT_FIELDS = {
  description: "Buy milk",
  isCompleted: false,
  completedAt: null,
  deletedAt: null,
};

function serverRow(overrides: Record<string, unknown> = {}) {
  return {
    id: FIXTURE_ITEM_ID,
    household_id: FIXTURE_HOUSEHOLD_ID,
    list_id: FIXTURE_LIST_ID,
    description: "Buy milk",
    is_completed: false,
    completed_at: null,
    created_at: "2026-04-17T00:00:00.000Z",
    updated_at: "2026-04-17T00:06:00.000Z",
    deleted_at: null,
    ...overrides,
  };
}

function seedItems(items: TodoItem[]): void {
  cacheStore.writeSnapshot(FIXTURE_HOUSEHOLD_ID, {
    lists: [],
    items,
    serverTs: "2026-04-17T00:00:00.000Z",
  });
}

describe("Item revert contract", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends RevertItem guarded by the post-action updatedAt", async () => {
    const request = vi.fn(async () => ({
      update_todo_items_by_pk: serverRow(),
    }));
    const repository = new ItemRepository(FIXTURE_HOUSEHOLD_ID, {
      request,
    } as never);

    const reverted = await repository.revertItem(
      FIXTURE_ITEM_ID,
      REVERT_FIELDS,
      ACTION_UPDATED_AT,
    );

    expect(request).toHaveBeenCalledWith("RevertItem", {
      itemId: FIXTURE_ITEM_ID,
      ...REVERT_FIELDS,
      expectedUpdatedAt: ACTION_UPDATED_AT,
    });
    expect(reverted?.description).toBe("Buy milk");
    // A restored item missing from the local cache is added back to it.
    expect(cacheStore.readSnapshot(FIXTURE_HOUSEHOLD_ID)?.items).toEqual([
      reverted,
    ]);
  });

  it("returns null when the server item has changed since the action", async () => {
    const request = vi.fn(async () => ({ update_todo_items_by_pk: null }));
    const repository = new ItemRepository(FIXTURE_HOUSEHOLD_ID, {
      request,
    } as never);

    const reverted = await repository.revertItem(
      FIXTURE_ITEM_ID,
      REVERT_FIELDS,
      ACTION_UPDATED_AT,
    );

    expect(reverted).toBeNull();
  });

  it("reverts locally only while the cached item is unchanged", async () => {
    seedItems([
      makeItem({
        isCompleted: true,
        completedAt: "2026-04-17T00:05:00.000Z",
        updatedAt: ACTION_UPDATED_AT,
      }),
    ]);
    const repository = new ItemRepository(FIXTURE_HOUSEHOLD_ID, null);

    const reverted = await repository.revertItem(
      FIXTURE_ITEM_ID,
      REVERT_FIELDS,
      ACTION_UPDATED_AT,
    );
    const repeated = await repository.revertItem(
      FIXTURE_ITEM_ID,
      REVERT_FIELDS,
      ACTION_UPDATED_AT,
    );

    expect(reverted?.isCompleted).toBe(false);
    expect(reverted?.completedAt).toBeNull();
    expect(repeated).toBeNull();
  });

  it("returns the deleted item carrying the server updatedAt", async () => {
    seedItems([makeItem()]);
    const request = vi.fn(async () => ({
      update_todo_items_by_pk: {
        id: FIXTURE_ITEM_ID,
        deleted_at: "2026-04-17T00:07:00.000Z",
        updated_at: "2026-04-17T00:07:00.123456+00:00",
      },
    }));
    const repository = new ItemRepository(FIXTURE_HOUSEHOLD_ID, {
      request,
    } as never);

    const deleted = await repository.deleteItem(FIXTURE_ITEM_ID);

    expect(deleted?.updatedAt).toBe("2026-04-17T00:07:00.123456+00:00");
    expect(deleted?.deletedAt).toBeTruthy();
  });

  it("returns null from deleteItem when the server did not apply it", async () => {
    seedItems([makeItem()]);
    const request = vi.fn(async () => ({ update_todo_items_by_pk: null }));
    const repository = new ItemRepository(FIXTURE_HOUSEHOLD_ID, {
      request,
    } as never);

    expect(await repository.deleteItem(FIXTURE_ITEM_ID)).toBeNull();
  });
});
