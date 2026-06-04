import { expect, test } from '@playwright/test';

const householdId = '00000000-0000-0000-0000-000000000002'; // Test household ID

test('cross-device contexts converge on latest item text', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // Set test household ID for both contexts
  await pageA.addInitScript(({ seededHouseholdId }) => {
    localStorage.clear();
    localStorage.setItem('familytodo:household-id', seededHouseholdId);
  }, { seededHouseholdId: householdId });

  await pageB.addInitScript(({ seededHouseholdId }) => {
    localStorage.clear();
    localStorage.setItem('familytodo:household-id', seededHouseholdId);
  }, { seededHouseholdId: householdId });

  await pageA.goto('/');
  await pageB.goto('/');

  await expect(pageA.getByTestId('hydrated')).toHaveText('ready', { timeout: 15000 });
  await expect(pageB.getByTestId('hydrated')).toHaveText('ready', { timeout: 15000 });

  await contextA.close();
  await contextB.close();
});
