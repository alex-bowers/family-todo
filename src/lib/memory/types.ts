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
  | 'create_list'
  | 'update_list'
  | 'delete_list'
  | 'create_item'
  | 'update_item'
  | 'delete_item';

export interface PendingMutation {
  id: string;
  op: MutationOp;
  payload: Record<string, unknown>;
  clientTs: string;
}

export interface SyncSnapshot {
  lists: TodoList[];
  items: TodoItem[];
  serverTs: string;
}
