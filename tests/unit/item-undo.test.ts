import { describe, expect, it } from "vitest";
import {
  ITEM_UNDO_TTL_MS,
  buildItemUndoRecord,
  describeItemUndo,
  isItemUndoExpired,
  isItemUndoRecord,
} from "$lib/stores/item-undo";
import { makeItem } from "../contract/fixtures/hasura-fixtures";

const RECORDED_AT = new Date("2026-04-17T00:00:00.000Z");

function tickRecord() {
  return buildItemUndoRecord(
    "complete",
    makeItem(),
    makeItem({
      isCompleted: true,
      completedAt: "2026-04-17T00:05:00.000Z",
      updatedAt: "2026-04-17T00:05:00.000Z",
    }),
    RECORDED_AT,
  );
}

describe("item undo helpers", () => {
  it("builds a record that restores the previous field values", () => {
    const record = tickRecord();

    expect(record).toEqual({
      action: "complete",
      listId: makeItem().listId,
      itemId: makeItem().id,
      label: "Buy milk",
      revertTo: {
        description: "Buy milk",
        isCompleted: false,
        completedAt: null,
        deletedAt: null,
      },
      expectedUpdatedAt: "2026-04-17T00:05:00.000Z",
      recordedAt: "2026-04-17T00:00:00.000Z",
    });
  });

  it("describes each action in plain words", () => {
    const before = makeItem();
    const after = makeItem({ description: "Buy oat milk" });

    expect(describeItemUndo(buildItemUndoRecord("create", after, after))).toBe(
      "added “Buy oat milk”",
    );
    expect(describeItemUndo(buildItemUndoRecord("edit", before, after))).toBe(
      "renamed “Buy milk” to “Buy oat milk”",
    );
    expect(describeItemUndo(tickRecord())).toBe("ticked “Buy milk”");
    expect(
      describeItemUndo(buildItemUndoRecord("uncomplete", before, before)),
    ).toBe("unticked “Buy milk”");
    expect(
      describeItemUndo(buildItemUndoRecord("delete", before, before)),
    ).toBe("deleted “Buy milk”");
  });

  it("expires a record one hour after it was recorded", () => {
    const record = tickRecord();
    const recordedMs = RECORDED_AT.getTime();

    expect(isItemUndoExpired(record, recordedMs + ITEM_UNDO_TTL_MS - 1)).toBe(
      false,
    );
    expect(isItemUndoExpired(record, recordedMs + ITEM_UNDO_TTL_MS)).toBe(true);
    expect(
      isItemUndoExpired({ ...record, recordedAt: "not a date" }, recordedMs),
    ).toBe(true);
  });

  it("accepts a stored record and rejects malformed ones", () => {
    const record = tickRecord();

    expect(isItemUndoRecord(JSON.parse(JSON.stringify(record)))).toBe(true);
    expect(isItemUndoRecord(null)).toBe(false);
    expect(isItemUndoRecord({ ...record, action: "explode" })).toBe(false);
    expect(isItemUndoRecord({ ...record, revertTo: null })).toBe(false);
    expect(
      isItemUndoRecord({
        ...record,
        revertTo: { ...record.revertTo, description: "  " },
      }),
    ).toBe(false);
    expect(
      isItemUndoRecord({
        ...record,
        revertTo: { ...record.revertTo, completedAt: 42 },
      }),
    ).toBe(false);
  });
});
