import { describe, expect, it, vi } from 'vitest';
import { ListRepository } from '$lib/memory/list-repository';

const HOUSEHOLD_ID = '11111111-1111-1111-1111-111111111111';

describe('Supabase list contract', () => {
  it('reads lists using GetLists operation', async () => {
    const request = vi.fn(async () => ({
      todo_lists: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          household_id: HOUSEHOLD_ID,
          title: 'Groceries',
          sort_order: 0,
          created_at: '2026-04-17T00:00:00.000Z',
          updated_at: '2026-04-17T00:00:00.000Z',
          deleted_at: null
        }
      ]
    }));

    const repository = new ListRepository({ request } as never);
    const lists = await repository.getLists(HOUSEHOLD_ID);

    expect(lists).toHaveLength(1);
    expect(request).toHaveBeenCalledWith('GetLists', { householdId: HOUSEHOLD_ID });
  });
});
