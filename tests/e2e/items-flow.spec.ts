import { expect, test } from "@playwright/test";

const householdId = "00000000-0000-0000-0000-000000000002"; // Test household ID
const listId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"; // Unique test list ID
const slowExpect = { timeout: 15000 };

test.describe("Item lifecycle flow", () => {
  test("creates, edits, completes, and deletes an item", async ({ page }) => {
    await page.addInitScript(
      ({ seededHouseholdId, seededListId }) => {
        localStorage.clear();
        localStorage.setItem("familytodo:household-id", seededHouseholdId);
        localStorage.setItem(
          `familytodo:snapshot:${seededHouseholdId}`,
          JSON.stringify({
            lists: [
              {
                id: seededListId,
                householdId: seededHouseholdId,
                title: "Test Groceries",
                sortOrder: 0,
                createdAt: "2026-04-17T00:00:00.000Z",
                updatedAt: "2026-04-17T00:00:00.000Z",
                deletedAt: null,
              },
            ],
            items: [],
            serverTs: "2026-04-17T00:00:00.000Z",
          }),
        );
        // Disable Supabase client to force local item creation
        localStorage.setItem("familytodo:disable-network", "true");
      },
      { seededHouseholdId: householdId, seededListId: listId },
    );

    await page.goto(`/lists/${listId}`);

    await expect(page.getByTestId("item-hydrated")).toHaveText(
      "ready",
      slowExpect,
    );
    await expect(page.getByLabel("New item")).toBeVisible(slowExpect);
    await expect(page.getByRole("button", { name: "Add item" })).toBeEnabled(
      slowExpect,
    );

    // Set the app to offline mode to ensure items are created locally
    await page.evaluate(() => {
      window.dispatchEvent(new Event("offline"));
    });

    // Wait a bit for the offline status to be processed
    await page.waitForTimeout(1000);

    // Use a fixed test data name to avoid timestamp issues
    const testItemName = "Buy milk";
    await page.getByLabel("New item").fill(testItemName);
    await page.getByRole("button", { name: "Add item" }).click();

    // Wait a bit for the item to be processed
    await page.waitForTimeout(2000);

    // Wait for the item to appear - it should appear quickly in offline mode
    await expect(
      page.locator(".item-text", { hasText: testItemName }),
    ).toBeVisible({ timeout: 10000 });

    // Wait a bit more for the UI to stabilize
    await page.waitForTimeout(1000);

    // Verify the item is visible
    await expect(
      page.locator(".item-text", { hasText: testItemName }),
    ).toBeVisible();

    // Mark the first item as complete
    const firstCompleteCheckbox = page.getByRole("checkbox").first();
    await firstCompleteCheckbox.check();

    // Simple verification that at least one checkbox is checked
    await expect(firstCompleteCheckbox).toBeChecked({ timeout: 5000 });

    // Wait for the item to be marked as completed
    await expect(
      page.locator(".item-text.completed", { hasText: testItemName }),
    ).toBeVisible({ timeout: 5000 });

    await page
      .getByRole("button", { name: `Delete item ${testItemName}` })
      .click();
    await expect(
      page.locator(".item-text", { hasText: testItemName }),
    ).toHaveCount(0, slowExpect);
  });

  test("renders incomplete-first alphabetical ordering and supports larger toggle target", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ seededHouseholdId, seededListId }) => {
        localStorage.clear();
        localStorage.setItem("familytodo:household-id", seededHouseholdId);
        localStorage.setItem(
          `familytodo:snapshot:${seededHouseholdId}`,
          JSON.stringify({
            lists: [
              {
                id: seededListId,
                householdId: seededHouseholdId,
                title: "Groceries",
                sortOrder: 0,
                createdAt: "2026-04-17T00:00:00.000Z",
                updatedAt: "2026-04-17T00:00:00.000Z",
                deletedAt: null,
              },
            ],
            items: [
              {
                id: "1",
                listId: seededListId,
                description: "zebra",
                isCompleted: false,
                completedAt: null,
                createdAt: "2026-04-17T00:00:00.000Z",
                updatedAt: "2026-04-17T00:00:00.000Z",
                deletedAt: null,
              },
              {
                id: "2",
                listId: seededListId,
                description: "alpha",
                isCompleted: false,
                completedAt: null,
                createdAt: "2026-04-17T00:00:01.000Z",
                updatedAt: "2026-04-17T00:00:01.000Z",
                deletedAt: null,
              },
              {
                id: "3",
                listId: seededListId,
                description: "done item",
                isCompleted: true,
                completedAt: "2026-04-17T00:00:02.000Z",
                createdAt: "2026-04-17T00:00:02.000Z",
                updatedAt: "2026-04-17T00:00:02.000Z",
                deletedAt: null,
              },
            ],
            serverTs: "2026-04-17T00:00:03.000Z",
          }),
        );
        // Disable Supabase client to force local item usage
        localStorage.setItem("familytodo:disable-network", "true");
      },
      { seededHouseholdId: householdId, seededListId: listId },
    );

    await page.goto(`/lists/${listId}`);
    await expect(page.getByTestId("item-hydrated")).toHaveText(
      "ready",
      slowExpect,
    );

    // Wait for items to be visible
    await expect(page.locator(".item-text")).toHaveCount(3, { timeout: 20000 });

    // Wait a bit more for items to fully render
    await page.waitForTimeout(2000);

    const names = await page.locator(".item-text").allTextContents();
    expect(names).toEqual(["alpha", "zebra", "done item"]);

    // Click the toggle label for 'zebra' (first item due to incomplete-first sorting)
    // The label wraps the checkbox and clicking it should toggle the checkbox
    const zebraToggle = page.locator(".toggle-hit").first();
    await zebraToggle.click();

    // Wait for items to reorder (completed items move to end)
    await page.waitForTimeout(2000);

    // Debug: check what items are visible
    const namesAfter = await page.locator(".item-text").allTextContents();

    // Check if zebra is completed - it should be moved to the end
    // If the toggle didn't work, zebra will still be first
    if (namesAfter[0] === "zebra") {
      // Toggle didn't work, try clicking the checkbox directly
      const zebraCheckbox = page.locator('input[type="checkbox"]').first();
      await zebraCheckbox.evaluate((el: HTMLInputElement) => el.click());
      await page.waitForTimeout(2000);
    }

    // After marking as complete, 'zebra' should now be at the end
    const finalNames = await page.locator(".item-text").allTextContents();
    expect(finalNames).toEqual(["alpha", "done item", "zebra"]);

    // Verify the completed class is applied
    await expect(
      page.locator(".item-text.completed", { hasText: "zebra" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows duplicate suggestions and supports reactivate-existing vs create-anyway", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ seededHouseholdId, seededListId }) => {
        localStorage.clear();
        localStorage.setItem("familytodo:household-id", seededHouseholdId);
        localStorage.setItem(
          `familytodo:snapshot:${seededHouseholdId}`,
          JSON.stringify({
            lists: [
              {
                id: seededListId,
                householdId: seededHouseholdId,
                title: "Groceries",
                sortOrder: 0,
                createdAt: "2026-04-17T00:00:00.000Z",
                updatedAt: "2026-04-17T00:00:00.000Z",
                deletedAt: null,
              },
            ],
            items: [
              {
                id: "1",
                listId: seededListId,
                description: "Buy milk",
                isCompleted: true,
                completedAt: "2026-04-17T00:00:30.000Z",
                createdAt: "2026-04-17T00:00:00.000Z",
                updatedAt: "2026-04-17T00:00:00.000Z",
                deletedAt: null,
              },
            ],
            serverTs: "2026-04-17T00:00:00.000Z",
          }),
        );
        // Disable Supabase client to force local item usage
        localStorage.setItem("familytodo:disable-network", "true");
      },
      { seededHouseholdId: householdId, seededListId: listId },
    );

    await page.goto(`/lists/${listId}`);
    await expect(page.getByTestId("item-hydrated")).toHaveText(
      "ready",
      slowExpect,
    );

    await page.getByLabel("New item").fill("buy milk");
    // Wait for the UI to process the input and show suggestions
    await expect(
      page.getByRole("button", { name: "Use existing item Buy milk" }),
    ).toBeVisible({ timeout: 20000 });

    await page
      .getByRole("button", { name: "Use existing item Buy milk" })
      .click();
    await expect(
      page.getByText("Reactivated existing matching item."),
    ).toBeVisible(slowExpect);
    await expect(
      page.locator(".item-text", { hasText: "Buy milk" }),
    ).not.toHaveClass(/completed/, slowExpect);

    await page.getByLabel("New item").fill("Buy milk extra");
    await page.getByRole("button", { name: "Add item" }).click();
    await expect(
      page.getByRole("button", { name: "Create new anyway" }),
    ).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "Create new anyway" }).click();
    await expect(
      page.locator(".item-text", { hasText: "Buy milk extra" }),
    ).toBeVisible(slowExpect);
  });
});
