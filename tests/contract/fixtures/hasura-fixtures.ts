import type { TodoItem, TodoList } from '$lib/memory/types';

export const FIXTURE_HOUSEHOLD_ID = '11111111-1111-1111-1111-111111111111';
export const FIXTURE_LIST_ID = '22222222-2222-2222-2222-222222222222';
export const FIXTURE_ITEM_ID = '33333333-3333-3333-3333-333333333333';

export function makeList(overrides: Partial<TodoList> = {}): TodoList {
  return {
    id: FIXTURE_LIST_ID,
    householdId: FIXTURE_HOUSEHOLD_ID,
    title: 'Groceries',
    sortOrder: 0,
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T00:00:00.000Z',
    deletedAt: null,
    ...overrides
  };
}

export function makeItem(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: FIXTURE_ITEM_ID,
    listId: FIXTURE_LIST_ID,
    description: 'Buy milk',
    isCompleted: false,
    completedAt: null,
    createdAt: '2026-04-17T00:00:00.000Z',
    updatedAt: '2026-04-17T00:00:00.000Z',
    deletedAt: null,
    ...overrides
  };
}

export interface HasuraGraphqlSuccess<T> {
  data: T;
}

export interface HasuraGraphqlError {
  errors: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
}

export function makeHasuraSuccess<T>(data: T): HasuraGraphqlSuccess<T> {
  return { data };
}

export function makeHasuraError(message = 'permission denied'): HasuraGraphqlError {
  return {
    errors: [
      {
        message,
        extensions: { code: 'permission-error' }
      }
    ]
  };
}
