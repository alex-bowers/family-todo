import { expect, test } from '@playwright/test';

test('empty and large household snapshots hydrate successfully', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'familytodo:snapshot:00000000-0000-0000-0000-000000000001',
      JSON.stringify({
        lists: Array.from({ length: 50 }).map((_, index) => ({
          id: `list-${index}`,
          householdId: '00000000-0000-0000-0000-000000000001',
          title: `List ${index}`,
          sortOrder: index,
          createdAt: '2026-04-17T00:00:00.000Z',
          updatedAt: '2026-04-17T00:00:00.000Z',
          deletedAt: null
        })),
        items: [],
        serverTs: '2026-04-17T00:00:00.000Z'
      })
    );
  });

  await page.goto('/');
  await expect(page.getByTestId('hydrated')).toHaveText('ready', { timeout: 15000 });
});
