import { describe, expect, it, vi } from "vitest";
import { ItemStore } from "$lib/stores/item-store";
import {
  FIXTURE_ITEM_ID,
  FIXTURE_LIST_ID,
  makeItem,
} from "../contract/fixtures/hasura-fixtures";
import { normalizeItemText } from "$lib/utils/item-text";
import { sortItemsForDisplay } from "$lib/utils/item-ordering";
import { getItemMatches } from "$lib/utils/item-matching";

describe("ItemStore transitions", () => {
  it("loads items for the current list", async () => {
    const repository = {
      getItems: vi.fn(async () => [makeItem()]),
      createItem: vi.fn(),
      updateItemText: vi.fn(),
      setItemCompletion: vi.fn(),
      deleteItem: vi.fn(),
    };

    const store = new ItemStore(FIXTURE_LIST_ID, repository);
    await store.load();

    const snapshot = store.getSnapshot();
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].description).toBe("Buy milk");
  });

  it("orders loaded items with incomplete first then alphabetical", async () => {
    const repository = {
      getItems: vi.fn(async () => [
        makeItem({ id: "2", description: "zebra", isCompleted: false }),
        makeItem({ id: "3", description: "alpha", isCompleted: true }),
        makeItem({ id: "1", description: "apple", isCompleted: false }),
      ]),
      createItem: vi.fn(),
      updateItemText: vi.fn(),
      setItemCompletion: vi.fn(),
      deleteItem: vi.fn(),
    };

    const store = new ItemStore(FIXTURE_LIST_ID, repository);
    await store.load();

    const snapshot = store.getSnapshot();
    expect(
      snapshot.items.map((item) => `${item.isCompleted}:${item.description}`),
    ).toEqual(["false:apple", "false:zebra", "true:alpha"]);
  });

  it("creates and updates an item", async () => {
    const repository = {
      getItems: vi.fn(async () => []),
      createItem: vi.fn(async () => makeItem()),
      updateItemText: vi.fn(async () =>
        makeItem({ description: "Buy oat milk" }),
      ),
      setItemCompletion: vi.fn(),
      deleteItem: vi.fn(),
    };

    const store = new ItemStore(FIXTURE_LIST_ID, repository);
    await store.load();
    await store.create("Buy milk");
    await store.updateText(FIXTURE_ITEM_ID, "Buy oat milk");

    const snapshot = store.getSnapshot();
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].description).toBe("Buy oat milk");
  });

  it("toggles completion and removes item", async () => {
    const completed = makeItem({
      isCompleted: true,
      completedAt: "2026-04-17T00:10:00.000Z",
    });
    const repository = {
      getItems: vi.fn(async () => [makeItem()]),
      createItem: vi.fn(),
      updateItemText: vi.fn(),
      setItemCompletion: vi.fn(async () => completed),
      deleteItem: vi.fn(async () => undefined),
    };

    const store = new ItemStore(FIXTURE_LIST_ID, repository);
    await store.load();
    await store.toggleCompletion(FIXTURE_ITEM_ID, true);

    let snapshot = store.getSnapshot();
    expect(snapshot.items[0].isCompleted).toBe(true);
    expect(snapshot.items[0].completedAt).toBeTruthy();

    await store.remove(FIXTURE_ITEM_ID);
    snapshot = store.getSnapshot();
    expect(snapshot.items).toHaveLength(0);
  });

  it("normalizes item text for case, punctuation, and whitespace", () => {
    expect(normalizeItemText("  Buy-milk!!  ")).toBe("buy milk");
    expect(normalizeItemText("BUY    MILK")).toBe("buy milk");
  });

  it("sort helper keeps incomplete items first and stable text ordering", () => {
    const sorted = sortItemsForDisplay([
      makeItem({ id: "3", description: "Beta", isCompleted: true }),
      makeItem({ id: "2", description: "zeta", isCompleted: false }),
      makeItem({ id: "1", description: "alpha", isCompleted: false }),
    ]);

    expect(
      sorted.map((item) => `${item.isCompleted}:${item.description}`),
    ).toEqual(["false:alpha", "false:zeta", "true:Beta"]);
  });

  it("returns strong match for normalized duplicate text", () => {
    const matches = getItemMatches(" buy   milk ", [
      makeItem({ id: "a", description: "Buy milk" }),
      makeItem({ id: "b", description: "Take out trash" }),
    ]);

    expect(matches[0]?.item.id).toBe("a");
    expect(matches[0]?.isStrongMatch).toBe(true);
  });
});
