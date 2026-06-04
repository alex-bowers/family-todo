import { expect, test } from "@playwright/test";

const householdId = "00000000-0000-0000-0000-000000000002"; // Test household ID
const listId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"; // Unique test list ID

test.describe("Offline sync replay", () => {
  test("queues a mutation while offline and flushes when back online", async ({
    page,
    context,
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
            items: [],
            serverTs: "2026-04-17T00:00:00.000Z",
          }),
        );
      },
      { seededHouseholdId: householdId, seededListId: listId },
    );

    await page.goto(`/lists/${listId}`);
    await expect(page.getByTestId("item-hydrated")).toHaveText("ready", {
      timeout: 15000,
    });
    await expect(page.getByTestId("sync-status")).toContainText("online");

    await context.setOffline(true);

    await context.setOffline(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event("online"));
    });
    await expect(page.getByTestId("sync-status")).toContainText("online", {
      timeout: 10000,
    });
    await expect(page.getByTestId("sync-status")).toContainText("synced", {
      timeout: 10000,
    });
  });
});
