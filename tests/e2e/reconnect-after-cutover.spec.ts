import { expect, test } from "@playwright/test";

const householdId = "00000000-0000-0000-0000-000000000002"; // Test household ID

test("reconnect after offline period restores synced status", async ({
  page,
  context,
}) => {
  await page.addInitScript(
    ({ seededHouseholdId }) => {
      localStorage.clear();
      localStorage.setItem("familytodo:household-id", seededHouseholdId);
    },
    { seededHouseholdId: householdId },
  );

  await page.goto("/");
  await expect(page.getByTestId("hydrated")).toHaveText("ready", {
    timeout: 15000,
  });

  await context.setOffline(true);
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));

  await page.goto("/");
  await expect(page.getByTestId("hydrated")).toHaveText("ready", {
    timeout: 15000,
  });
});
