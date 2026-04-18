import { expect, test } from '@playwright/test';

test('migration smoke keeps core list flow usable', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto('/');
  await expect(page.getByTestId('hydrated')).toHaveText('ready', { timeout: 15000 });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel('New list').fill('Migration Smoke');
    await page.getByRole('button', { name: 'Create list' }).click();

    try {
      await expect(page.getByRole('button', { name: 'Select list Migration Smoke' })).toBeVisible({ timeout: 2000 });
      return;
    } catch {
      if (attempt === 2) {
        throw new Error('Migration smoke list did not appear after retries');
      }

      await page.reload();
      await expect(page.getByTestId('hydrated')).toHaveText('ready', { timeout: 15000 });
    }
  }
});
