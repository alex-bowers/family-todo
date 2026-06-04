import { describe, expect, it, vi } from "vitest";
import { ItemRepository } from "$lib/memory/item-repository";

const HOUSEHOLD_ID = "11111111-1111-1111-1111-111111111111";
const LIST_ID = "22222222-2222-2222-2222-222222222222";

describe("Supabase item contract", () => {
  it("creates and updates items through operation contracts", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        insert_todo_items_one: {
          id: "33333333-3333-3333-3333-333333333333",
          household_id: HOUSEHOLD_ID,
          list_id: LIST_ID,
          description: "Buy milk",
          is_completed: false,
          completed_at: null,
          created_at: "2026-04-17T00:00:00.000Z",
          updated_at: "2026-04-17T00:00:00.000Z",
          deleted_at: null,
        },
      })
      .mockResolvedValueOnce({
        update_todo_items_by_pk: {
          id: "33333333-3333-3333-3333-333333333333",
          household_id: HOUSEHOLD_ID,
          list_id: LIST_ID,
          description: "Buy oat milk",
          is_completed: false,
          completed_at: null,
          created_at: "2026-04-17T00:00:00.000Z",
          updated_at: "2026-04-17T00:01:00.000Z",
          deleted_at: null,
        },
      });

    const repository = new ItemRepository(HOUSEHOLD_ID, { request } as never);

    const created = await repository.createItem(LIST_ID, "Buy milk");
    const updated = await repository.updateItemText(created.id, "Buy oat milk");

    expect(updated.description).toBe("Buy oat milk");
    expect(request.mock.calls[0]?.[0]).toBe("CreateItem");
    expect(request.mock.calls[1]?.[0]).toBe("UpdateItemText");
  });

  it("returns incomplete-first alphabetical ordering on getItems", async () => {
    const request = vi.fn().mockResolvedValueOnce({
      todo_items: [
        {
          id: "1",
          household_id: HOUSEHOLD_ID,
          list_id: LIST_ID,
          description: "zebra",
          is_completed: false,
          completed_at: null,
          created_at: "2026-04-17T00:00:00.000Z",
          updated_at: "2026-04-17T00:00:00.000Z",
          deleted_at: null,
        },
        {
          id: "2",
          household_id: HOUSEHOLD_ID,
          list_id: LIST_ID,
          description: "apple",
          is_completed: false,
          completed_at: null,
          created_at: "2026-04-17T00:00:00.000Z",
          updated_at: "2026-04-17T00:00:00.000Z",
          deleted_at: null,
        },
        {
          id: "3",
          household_id: HOUSEHOLD_ID,
          list_id: LIST_ID,
          description: "alpha complete",
          is_completed: true,
          completed_at: "2026-04-17T00:00:00.000Z",
          created_at: "2026-04-17T00:00:00.000Z",
          updated_at: "2026-04-17T00:00:00.000Z",
          deleted_at: null,
        },
      ],
    });

    const repository = new ItemRepository(HOUSEHOLD_ID, { request } as never);
    const items = await repository.getItems(LIST_ID);

    expect(
      items.map((item) => `${item.isCompleted}:${item.description}`),
    ).toEqual(["false:apple", "false:zebra", "true:alpha complete"]);
    expect(request.mock.calls[0]?.[0]).toBe("GetItemsByList");
  });

  it("uses completion update path needed to reactivate duplicate matches", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        insert_todo_items_one: {
          id: "33333333-3333-3333-3333-333333333333",
          household_id: HOUSEHOLD_ID,
          list_id: LIST_ID,
          description: "Buy milk",
          is_completed: true,
          completed_at: "2026-04-17T00:02:00.000Z",
          created_at: "2026-04-17T00:00:00.000Z",
          updated_at: "2026-04-17T00:00:00.000Z",
          deleted_at: null,
        },
      })
      .mockResolvedValueOnce({
        update_todo_items_by_pk: {
          id: "33333333-3333-3333-3333-333333333333",
          household_id: HOUSEHOLD_ID,
          list_id: LIST_ID,
          description: "Buy milk",
          is_completed: false,
          completed_at: null,
          created_at: "2026-04-17T00:00:00.000Z",
          updated_at: "2026-04-17T00:01:00.000Z",
          deleted_at: null,
        },
      });

    const repository = new ItemRepository(HOUSEHOLD_ID, { request } as never);
    const created = await repository.createItem(LIST_ID, "Buy milk");
    const updated = await repository.setItemCompletion(created.id, false);

    expect(updated.isCompleted).toBe(false);
    expect(request.mock.calls[1]?.[0]).toBe("SetItemCompletion");
    expect(request.mock.calls[1]?.[1]).toMatchObject({
      itemId: created.id,
      isCompleted: false,
    });
  });
});
