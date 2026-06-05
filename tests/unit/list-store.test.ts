import { describe, it, expect, vi } from "vitest";
import { ListStore } from "$lib/stores/list-store";
import {
  makeList,
  FIXTURE_HOUSEHOLD_ID,
} from "../contract/fixtures/hasura-fixtures";

describe("ListStore transitions", () => {
  it("loads lists and auto-selects first list", async () => {
    const repository = {
      getLists: vi.fn(async () => [
        makeList(),
        makeList({
          id: "44444444-4444-4444-4444-444444444444",
          sortOrder: 1,
          title: "School",
        }),
      ]),
      createList: vi.fn(),
      deleteList: vi.fn(),
    };

    const store = new ListStore(FIXTURE_HOUSEHOLD_ID, repository);
    await store.load();

    const snapshot = store.getSnapshot();
    expect(snapshot.lists).toHaveLength(2);
    expect(snapshot.selectedListId).toBe(snapshot.lists[0]?.id);
  });

  it("creates a list and selects the created list", async () => {
    const created = makeList({
      id: "55555555-5555-5555-5555-555555555555",
      title: "Chores",
      sortOrder: 1,
    });
    const repository = {
      getLists: vi.fn(async () => [makeList()]),
      createList: vi.fn(async () => created),
      deleteList: vi.fn(),
    };

    const store = new ListStore(FIXTURE_HOUSEHOLD_ID, repository);
    await store.load();
    await store.create("Chores");

    const snapshot = store.getSnapshot();
    expect(snapshot.lists).toHaveLength(2);
    expect(snapshot.selectedListId).toBe(created.id);
  });

  it("deletes selected list and falls back to first remaining list", async () => {
    const a = makeList({
      id: "aaaaaaa1-1111-1111-1111-111111111111",
      title: "A",
      sortOrder: 0,
    });
    const b = makeList({
      id: "bbbbbbb2-2222-2222-2222-222222222222",
      title: "B",
      sortOrder: 1,
    });

    const repository = {
      getLists: vi.fn(async () => [a, b]),
      createList: vi.fn(),
      deleteList: vi.fn(async () => undefined),
    };

    const store = new ListStore(FIXTURE_HOUSEHOLD_ID, repository);
    await store.load();
    store.select(b.id);
    await store.remove(b.id);

    const snapshot = store.getSnapshot();
    expect(snapshot.lists.map((list) => list.id)).toEqual([a.id]);
    expect(snapshot.selectedListId).toBe(a.id);
  });

  it("deletes last list and clears selection", async () => {
    const a = makeList({
      id: "aaaaaaa1-1111-1111-1111-111111111111",
      title: "A",
      sortOrder: 0,
    });

    const repository = {
      getLists: vi.fn(async () => [a]),
      createList: vi.fn(),
      deleteList: vi.fn(async () => undefined),
    };

    const store = new ListStore(FIXTURE_HOUSEHOLD_ID, repository);
    await store.load();
    store.select(a.id);
    await store.remove(a.id);

    const snapshot = store.getSnapshot();
    expect(snapshot.lists).toHaveLength(0);
    expect(snapshot.selectedListId).toBeNull();
  });
});
