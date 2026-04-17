import { expect, test } from '@playwright/test';

test('reconnect after offline period restores synced status', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByTestId('hydrated')).toHaveText('ready', { timeout: 15000 });

  await context.setOffline(true);
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));

  await page.goto('/');
  await expect(page.getByTestId('hydrated')).toHaveText('ready', { timeout: 15000 });
});
