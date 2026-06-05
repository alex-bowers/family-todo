import { expect, test } from "@playwright/test";

const householdId = "00000000-0000-0000-0000-000000000002"; // Test household ID

test("migration smoke keeps core list flow usable", async ({ page }) => {
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

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByLabel("New list").fill("Migration Smoke");
    await page.getByRole("button", { name: "Create list" }).click();

    try {
      await expect(
        page.getByRole("button", { name: "Open list Migration Smoke" }),
      ).toBeVisible({ timeout: 2000 });
      return;
    } catch {
      if (attempt === 2) {
        throw new Error("Migration smoke list did not appear after retries");
      }

      await page.reload();
      await expect(page.getByTestId("hydrated")).toHaveText("ready", {
        timeout: 15000,
      });
    }
  }
});
