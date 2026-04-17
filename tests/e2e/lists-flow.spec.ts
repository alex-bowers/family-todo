import { test, expect } from '@playwright/test';

const slowExpect = { timeout: 15000 };

test.describe('List create/delete flow', () => {
  test('creates two lists and deletes one with selection fallback', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto('/');

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await expect(page.getByLabel('New list')).toBeVisible({ timeout: 5000 });
        break;
      } catch {
        if (attempt === 2) {
          throw new Error('List form did not become visible after reload attempts');
        }
        await page.reload();
      }
    }

    await expect(page.getByTestId('hydrated')).toHaveText('ready', slowExpect);
    await expect(page.getByRole('button', { name: 'Create list' })).toBeEnabled(slowExpect);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.getByLabel('New list').fill('Groceries');
      await page.getByRole('button', { name: 'Create list' }).click();

      try {
        await expect(page.getByRole('button', { name: /Select list / })).toHaveCount(1, { timeout: 2000 });
        break;
      } catch {
        if (attempt === 2) {
          throw new Error('First list did not appear after create retries');
        }
        await page.reload();
        await expect(page.getByTestId('hydrated')).toHaveText('ready', slowExpect);
      }
    }

    await page.getByLabel('New list').fill('School');
    await page.getByRole('button', { name: 'Create list' }).click();
    await expect(page.getByRole('button', { name: /Select list / })).toHaveCount(2, slowExpect);

    await expect(page.getByRole('button', { name: 'Select list Groceries' })).toBeVisible(slowExpect);
    await expect(page.getByRole('button', { name: 'Select list School' })).toBeVisible(slowExpect);

    await page.getByRole('button', { name: 'Delete list School' }).click();

    await expect(page.getByRole('button', { name: 'Select list School' })).toHaveCount(0, slowExpect);
    await expect(page.getByRole('button', { name: 'Select list Groceries' })).toBeVisible(slowExpect);
    await expect(page.getByText('Selected list: Groceries')).toBeVisible(slowExpect);
  });
});
