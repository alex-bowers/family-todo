import {
  FIXTURE_HOUSEHOLD_ID,
  FIXTURE_ITEM_ID,
  FIXTURE_LIST_ID,
} from "./hasura-fixtures";

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
  household_id: string;
  list_id: string;
  description: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function makeSupabaseListRow(
  overrides: Partial<SupabaseListRow> = {},
): SupabaseListRow {
  return {
    id: FIXTURE_LIST_ID,
    household_id: FIXTURE_HOUSEHOLD_ID,
    title: "Groceries",
    sort_order: 0,
    created_at: "2026-04-17T00:00:00.000Z",
    updated_at: "2026-04-17T00:00:00.000Z",
    deleted_at: null,
    ...overrides,
  };
}

export function makeSupabaseItemRow(
  overrides: Partial<SupabaseItemRow> = {},
): SupabaseItemRow {
  return {
    id: FIXTURE_ITEM_ID,
    household_id: FIXTURE_HOUSEHOLD_ID,
    list_id: FIXTURE_LIST_ID,
    description: "Buy milk",
    is_completed: false,
    completed_at: null,
    created_at: "2026-04-17T00:00:00.000Z",
    updated_at: "2026-04-17T00:00:00.000Z",
    deleted_at: null,
    ...overrides,
  };
}
