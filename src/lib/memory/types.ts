export type UUID = string;

export interface Household {
  id: UUID;
  name: string;
  createdAt: string;
}

export interface TodoList {
  id: UUID;
  householdId: UUID;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TodoItem {
  id: UUID;
  listId: UUID;
  description: string;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SyncCursor {
  deviceId: string;
  householdId: UUID;
  lastSyncedAt: string;
}

export type MutationOp =
  | "create_list"
  | "update_list"
  | "delete_list"
  | "create_item"
  | "update_item"
  | "delete_item";

export interface PendingMutation {
  id: string;
  op: MutationOp;
  payload: Record<string, unknown>;
  clientTs: string;
  retries?: number;
  nextAttemptAt?: string;
  lastError?: string | null;
  expectedUpdatedAt?: string;
}

export interface SyncSnapshot {
  lists: TodoList[];
  items: TodoItem[];
  serverTs: string;
}

export interface SupabaseListRow {
  id: string;
  household_id: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SupabaseItemRow {
  id: string;
  list_id: string;
  household_id: string;
  description: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function fromSupabaseList(row: SupabaseListRow): TodoList {
  return {
    id: row.id,
    householdId: row.household_id,
    title: row.title,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function fromSupabaseItem(row: SupabaseItemRow): TodoItem {
  return {
    id: row.id,
    listId: row.list_id,
    description: row.description,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
