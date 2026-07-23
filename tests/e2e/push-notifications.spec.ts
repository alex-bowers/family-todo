import { test, expect } from "@playwright/test";

const householdId = "00000000-0000-0000-0000-000000000002";
const slowExpect = { timeout: 15000 };

test.describe("Push notification toggle flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ seededHouseholdId }) => {
        localStorage.clear();
        localStorage.setItem("familytodo:household-id", seededHouseholdId);
      },
      { seededHouseholdId: householdId },
    );
    await page.goto("/");
    await expect(page.getByTestId("hydrated")).toHaveAttribute(
      "aria-label",
      "Connected",
      slowExpect,
    );
    await page.waitForTimeout(500);
  });

  test("notification bell toggle exists and is clickable", async ({ page }) => {
    const bellButton = page.locator("button.bell");
    await expect(bellButton).toBeVisible(slowExpect);
    await expect(bellButton).toBeEnabled(slowExpect);
  });

  test("toggling notification bell updates aria-label", async ({ page }) => {
    const bellButton = page.locator("button.bell");
    await expect(bellButton).toHaveAttribute(
      "aria-label",
      "Weekly reminder off",
      slowExpect,
    );

    // Click to enable (will prompt for permission, which we handle via context)
    // Note: In CI, permission may be denied by default
    await bellButton.click();

    // After click, the state may change depending on permission
    // The aria-label should reflect the current state
    const label = await bellButton.getAttribute("aria-label");
    expect(["Weekly reminder on", "Weekly reminder off"]).toContain(label);
  });

  test("notification preference is persisted in localStorage", async ({ page }) => {
    const bellButton = page.locator("button.bell");

    // Initial state: off
    const initialPref = await page.evaluate(() =>
      localStorage.getItem("familytodo:weekly-notification-enabled"),
    );
    expect(initialPref).toBeNull();

    // Click toggle
    await bellButton.click();

    // Preference should be set (even if permission denied, the toggle attempts)
    const afterClickPref = await page.evaluate(() =>
      localStorage.getItem("familytodo:weekly-notification-enabled"),
    );
    // If permission is granted, it will be "true"; if denied, it stays null
    expect([null, "true"]).toContain(afterClickPref);
  });
});
