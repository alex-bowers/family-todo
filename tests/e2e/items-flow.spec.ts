import { expect, test } from '@playwright/test';

const householdId = '00000000-0000-0000-0000-000000000001';
const listId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const slowExpect = { timeout: 15000 };

test.describe('Item lifecycle flow', () => {
  test('creates, edits, completes, and deletes an item', async ({ page }) => {
    await page.addInitScript(
      ({ seededHouseholdId, seededListId }) => {
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
            items: [],
            serverTs: '2026-04-17T00:00:00.000Z'
          })
        );
      },
      { seededHouseholdId: householdId, seededListId: listId }
    );

    await page.goto(`/lists/${listId}`);

    await expect(page.getByTestId('item-hydrated')).toHaveText('ready', slowExpect);
    await expect(page.getByLabel('New item')).toBeVisible(slowExpect);
    await expect(page.getByRole('button', { name: 'Add item' })).toBeEnabled(slowExpect);

    const itemText = page.locator('.item-text', { hasText: 'Buy milk' });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.getByLabel('New item').fill('Buy milk');
      await page.getByRole('button', { name: 'Add item' }).click();

      try {
        await expect(itemText).toBeVisible({ timeout: 2000 });
        break;
      } catch {
        if (attempt === 2) {
          throw new Error('Item did not appear after create retries');
        }
        await page.reload();
        await expect(page.getByTestId('item-hydrated')).toHaveText('ready', slowExpect);
      }
    }

    await page.getByRole('button', { name: 'Edit item Buy milk' }).click();
    await page.getByLabel('Edit Buy milk').fill('Buy oat milk');
    await page.getByRole('button', { name: 'Save' }).click();

    const updatedText = page.locator('.item-text', { hasText: 'Buy oat milk' });
    await expect(updatedText).toBeVisible(slowExpect);

    await page.getByLabel('Mark Buy oat milk complete').check();
    await expect(updatedText).toHaveClass(/completed/, slowExpect);

    await page.getByRole('button', { name: 'Delete item Buy oat milk' }).click();
    await expect(updatedText).toHaveCount(0, slowExpect);
  });
});
