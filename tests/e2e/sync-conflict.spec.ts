import { expect, test } from "@playwright/test";

const householdId = "00000000-0000-0000-0000-000000000002"; // Test household ID
const listId = "cccccccc-cccc-cccc-cccc-cccccccccccc"; // Unique test list ID
const itemId = "dddddddd-dddd-dddd-dddd-dddddddddddd"; // Unique test item ID

test.describe("Sync conflict regression", () => {
  test("last writer wins when two tabs edit the same item", async ({
    context,
  }) => {
    const seed = async (
      page: import("@playwright/test").Page,
    ): Promise<void> => {
      await page.addInitScript(
        ({ seededHouseholdId, seededListId, seededItemId }) => {
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
                  id: seededItemId,
                  listId: seededListId,
                  description: "Original item",
                  isCompleted: false,
                  completedAt: null,
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
        {
          seededHouseholdId: householdId,
          seededListId: listId,
          seededItemId: itemId,
        },
      );
    };

    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await seed(pageA);
    await seed(pageB);

    await pageA.goto(`/lists/${listId}`);
    await pageB.goto(`/lists/${listId}`);

    // Set both pages to offline mode
    await pageA.evaluate(() => {
      window.dispatchEvent(new Event("offline"));
    });
    await pageB.evaluate(() => {
      window.dispatchEvent(new Event("offline"));
    });

    await expect(pageA.getByTestId("item-hydrated")).toHaveText("ready", {
      timeout: 15000,
    });
    await expect(pageB.getByTestId("item-hydrated")).toHaveText("ready", {
      timeout: 15000,
    });

    // Wait a bit for offline mode to be processed
    await pageA.waitForTimeout(1000);
    await pageB.waitForTimeout(1000);

    // Wait for items to be visible
    await expect(
      pageA.locator(".item-text", { hasText: "Original item" }),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      pageB.locator(".item-text", { hasText: "Original item" }),
    ).toBeVisible({ timeout: 20000 });

    await pageA
      .getByRole("button", { name: "Edit item Original item" })
      .first()
      .click();
    await pageA
      .locator('input[aria-label^="Edit "]')
      .first()
      .fill("Edit from tab A");
    await pageA.getByRole("button", { name: "Save" }).click();
    await expect(
      pageA.locator(".item-text", { hasText: "Edit from tab A" }),
    ).toBeVisible();

    await pageB
      .getByRole("button", { name: /Edit item/ })
      .first()
      .click();
    await pageB
      .locator('input[aria-label^="Edit "]')
      .first()
      .fill("Edit from tab B");
    await pageB.getByRole("button", { name: "Save" }).click();
    await expect(
      pageB.locator(".item-text", { hasText: "Edit from tab B" }),
    ).toBeVisible();

    await pageA.evaluate(() => {
      window.dispatchEvent(new Event("online"));
    });
    await pageB.evaluate(() => {
      window.dispatchEvent(new Event("online"));
    });

    await expect(
      pageA.locator(".item-text", { hasText: "Edit from tab B" }),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      pageB.locator(".item-text", { hasText: "Edit from tab B" }),
    ).toBeVisible();
  });
});
