import { test, expect } from "@playwright/test";
import { createTestList } from "./helpers";

const householdId = "00000000-0000-0000-0000-000000000002"; // Test household ID
const slowExpect = { timeout: 15000 };

test.describe("List navigation", () => {
  // Ensure clean state before each test
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ seededHouseholdId }) => {
        localStorage.clear();
        localStorage.setItem("familytodo:household-id", seededHouseholdId);
      },
      { seededHouseholdId: householdId },
    );
    await page.goto("/");
    // Wait for page to be fully loaded and hydrated
    await expect(page.getByTestId("hydrated")).toHaveText("ready", slowExpect);
    // Small delay to ensure page is fully interactive
    await page.waitForTimeout(500);
  });

  test("activates list via keyboard navigation", async ({ page }) => {
    // Create a test list with a unique name
    const listName = `Keyboard Navigation Test List ${Date.now()}`;
    await createTestList(page, listName);

    // Focus the list button and verify focus
    const listButton = page.getByRole("button", { name: `Open list ${listName}` });
    await listButton.focus();

    // Verify the button is actually focused before pressing Enter
    await expect(listButton).toBeFocused();

    // Activate the list with Enter key
    await page.keyboard.press("Enter");

    // Should navigate to the list detail page
    await page.waitForURL(/\/lists\/.+/);
    await expect(page.getByText(listName)).toBeVisible(slowExpect);
  });

  test("activates list on mobile-sized viewport", async ({ page }) => {
    // Set viewport to mobile size and wait for it to apply
    await page.setViewportSize({ width: 375, height: 667 });

    // Small wait to ensure viewport is fully applied
    await page.waitForTimeout(300);

    // Create a test list with a unique name
    const listName = `Mobile Navigation Test List ${Date.now()}`;
    await createTestList(page, listName);

    // Click directly on the list to activate it
    await page.getByRole("button", { name: `Open list ${listName}` }).click();

    // Should navigate to the list detail page
    await page.waitForURL(/\/lists\/.+/);
    await expect(page.getByText(listName)).toBeVisible(slowExpect);
  });
});
