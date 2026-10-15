import { cacheStore } from "$lib/memory/cache";
import type {
  ItemRevertFields,
  ItemUndoAction,
  ItemUndoRecord,
  TodoItem,
  UUID,
} from "$lib/memory/types";

export const ITEM_UNDO_TTL_MS = 60 * 60 * 1000;

const ACTIONS: readonly ItemUndoAction[] = [
  "create",
  "edit",
  "complete",
  "uncomplete",
  "delete",
];

export interface ItemUndoStorage {
  read(): ItemUndoRecord | null;
  write(record: ItemUndoRecord): void;
  clear(): void;
}

function isNullableString(value: unknown): boolean {
  return value === null || typeof value === "string";
}

export function isItemUndoRecord(value: unknown): value is ItemUndoRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<Record<keyof ItemUndoRecord, unknown>>;
  const revertTo = record.revertTo;
  if (!revertTo || typeof revertTo !== "object") {
    return false;
  }

  const fields = revertTo as Partial<Record<keyof ItemRevertFields, unknown>>;
  const description = fields.description;

  return (
    ACTIONS.includes(record.action as ItemUndoAction) &&
    typeof record.listId === "string" &&
    typeof record.itemId === "string" &&
    typeof record.label === "string" &&
    typeof record.expectedUpdatedAt === "string" &&
    typeof record.recordedAt === "string" &&
    typeof description === "string" &&
    description.trim().length > 0 &&
    typeof fields.isCompleted === "boolean" &&
    isNullableString(fields.completedAt) &&
    isNullableString(fields.deletedAt)
  );
}

export function isItemUndoExpired(
  record: ItemUndoRecord,
  nowMs: number,
): boolean {
  const recordedMs = Date.parse(record.recordedAt);
  return Number.isNaN(recordedMs) || nowMs - recordedMs >= ITEM_UNDO_TTL_MS;
}

export function buildItemUndoRecord(
  action: ItemUndoAction,
  before: TodoItem,
  after: TodoItem,
  now: Date = new Date(),
): ItemUndoRecord {
  return {
    action,
    listId: after.listId,
    itemId: after.id,
    label: after.description,
    revertTo: {
      description: before.description,
      isCompleted: before.isCompleted,
      completedAt: before.completedAt,
      deletedAt: before.deletedAt,
    },
    expectedUpdatedAt: after.updatedAt,
    recordedAt: now.toISOString(),
  };
}

export function describeItemUndo(record: ItemUndoRecord): string {
  switch (record.action) {
    case "create":
      return `added “${record.label}”`;
    case "edit":
      return `renamed “${record.revertTo.description}” to “${record.label}”`;
    case "complete":
      return `ticked “${record.label}”`;
    case "uncomplete":
      return `unticked “${record.label}”`;
    case "delete":
      return `deleted “${record.label}”`;
  }
}

export function createItemUndoStorage(householdId: UUID): ItemUndoStorage {
  return {
    read() {
      const stored = cacheStore.readItemUndo(householdId);
      return isItemUndoRecord(stored) ? stored : null;
    },
    write(record) {
      cacheStore.writeItemUndo(householdId, record);
    },
    clear() {
      cacheStore.clearItemUndo(householdId);
    },
  };
}
