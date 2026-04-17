import { describe, expect, it } from 'vitest';
import { fromSupabaseItem, fromSupabaseList } from '$lib/memory/types';

describe('Migration compatibility contract', () => {
  it('maps Supabase list and item rows into existing domain shapes', () => {
    const list = fromSupabaseList({
      id: 'list-1',
      household_id: 'house-1',
      title: 'Groceries',
      sort_order: 0,
      created_at: '2026-04-17T00:00:00.000Z',
      updated_at: '2026-04-17T00:00:00.000Z',
      deleted_at: null
    });

    const item = fromSupabaseItem({
      id: 'item-1',
      household_id: 'house-1',
      list_id: 'list-1',
      description: 'Buy milk',
      is_completed: false,
      completed_at: null,
      created_at: '2026-04-17T00:00:00.000Z',
      updated_at: '2026-04-17T00:00:00.000Z',
      deleted_at: null
    });

    expect(list.householdId).toBe('house-1');
    expect(item.listId).toBe('list-1');
  });
});
