import { describe, expect, it, vi } from 'vitest';
import { HasuraClient } from '$lib/graphql/client';
import { GET_CHANGES_SINCE } from '$lib/graphql/operations';

const FIXTURE_HOUSEHOLD_ID = '11111111-1111-1111-1111-111111111111';
const SINCE = '2026-04-17T00:00:00.000Z';

describe('Sync GraphQL contract', () => {
  it('queries GetChangesSince with expected variables and includes deleted rows', async () => {
    const payload = {
      data: {
        changedLists: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            household_id: FIXTURE_HOUSEHOLD_ID,
            title: 'Groceries',
            sort_order: 0,
            created_at: '2026-04-17T00:00:00.000Z',
            updated_at: '2026-04-17T00:01:00.000Z',
            deleted_at: null
          }
        ],
        changedItems: [
          {
            id: '33333333-3333-3333-3333-333333333333',
            list_id: '22222222-2222-2222-2222-222222222222',
            description: 'Buy milk',
            is_completed: false,
            completed_at: null,
            created_at: '2026-04-17T00:00:00.000Z',
            updated_at: '2026-04-17T00:02:00.000Z',
            deleted_at: '2026-04-17T00:03:00.000Z'
          }
        ]
      }
    };

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const client = new HasuraClient('http://example.test/graphql');
    const data = await client.request(GET_CHANGES_SINCE, {
      householdId: FIXTURE_HOUSEHOLD_ID,
      since: SINCE
    });

    expect(data.changedLists).toHaveLength(1);
    expect(data.changedItems).toHaveLength(1);
    expect(data.changedItems[0].deleted_at).toBeTruthy();

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.query).toContain('query GetChangesSince');
    expect(body.variables).toEqual({ householdId: FIXTURE_HOUSEHOLD_ID, since: SINCE });
  });
});
