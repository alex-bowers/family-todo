import { expect, test } from '@playwright/test';

const householdId = '00000000-0000-0000-0000-000000000001';
const listId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const itemId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

test.describe('Sync conflict regression', () => {
  test('last writer wins when two tabs edit the same item', async ({ context }) => {
    const seed = async (page: import('@playwright/test').Page): Promise<void> => {
      await page.addInitScript(
        ({ seededHouseholdId, seededListId, seededItemId }) => {
          localStorage.clear();
          localStorage.setItem('familytodo:household-id', seededHouseholdId);
          localStorage.setItem(
            `familytodo:snapshot:${seededHouseholdId}`,
            JSON.stringify({
              lists: [
                {
                  id: seededListId,
                  householdId: seededHouseholdId,
                  title: 'Groceries',
                  sortOrder: 0,
                  createdAt: '2026-04-17T00:00:00.000Z',
                  updatedAt: '2026-04-17T00:00:00.000Z',
                  deletedAt: null
                }
              ],
              items: [
                {
                  id: seededItemId,
                  listId: seededListId,
                  description: 'Original item',
                  isCompleted: false,
                  completedAt: null,
                  createdAt: '2026-04-17T00:00:00.000Z',
                  updatedAt: '2026-04-17T00:00:00.000Z',
                  deletedAt: null
                }
              ],
              serverTs: '2026-04-17T00:00:00.000Z'
            })
          );
        },
        {
          seededHouseholdId: householdId,
          seededListId: listId,
          seededItemId: itemId
        }
      );
    };

    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await seed(pageA);
    await seed(pageB);

    await pageA.goto(`/lists/${listId}`);
    await pageB.goto(`/lists/${listId}`);

    await expect(pageA.getByTestId('item-hydrated')).toHaveText('ready', { timeout: 15000 });
    await expect(pageB.getByTestId('item-hydrated')).toHaveText('ready', { timeout: 15000 });

    await pageA.getByRole('button', { name: /Edit item/ }).first().click();
    await pageA.locator('input[aria-label^="Edit "]').first().fill('Edit from tab A');
    await pageA.getByRole('button', { name: 'Save' }).click();
    await expect(pageA.locator('.item-text', { hasText: 'Edit from tab A' })).toBeVisible();

    await pageB.getByRole('button', { name: /Edit item/ }).first().click();
    await pageB.locator('input[aria-label^="Edit "]').first().fill('Edit from tab B');
    await pageB.getByRole('button', { name: 'Save' }).click();
    await expect(pageB.locator('.item-text', { hasText: 'Edit from tab B' })).toBeVisible();

    await pageA.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await pageB.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    await expect(pageA.locator('.item-text', { hasText: 'Edit from tab B' })).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('.item-text', { hasText: 'Edit from tab B' })).toBeVisible();
  });
});
