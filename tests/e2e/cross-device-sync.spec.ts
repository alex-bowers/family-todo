import { expect, test } from '@playwright/test';

test('cross-device contexts converge on latest item text', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto('/');
  await pageB.goto('/');

  await expect(pageA.getByTestId('hydrated')).toHaveText('ready', { timeout: 15000 });
  await expect(pageB.getByTestId('hydrated')).toHaveText('ready', { timeout: 15000 });

  await contextA.close();
  await contextB.close();
});
