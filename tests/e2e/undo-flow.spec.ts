import { expect, test, type Page } from "@playwright/test";
import { createTestItem } from "./helpers";

const householdId = "00000000-0000-0000-0000-000000000003";
const listId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const slowExpect = { timeout: 15000 };

interface SeedOptions {
    items?: unknown[];
    undoRecord?: unknown;
}

async function openSeededList(page: Page, seed: SeedOptions = {}) {
    await page.addInitScript(
        ({ seededHouseholdId, seededListId, items, undoRecord }) => {
            // Seed once per tab so reloads keep what the test did.
            if (sessionStorage.getItem("undo-flow-seeded")) {
                return;
            }
            sessionStorage.setItem("undo-flow-seeded", "true");

            localStorage.clear();
            localStorage.setItem("familytodo:household-id", seededHouseholdId);
            localStorage.setItem(
                `familytodo:snapshot:${seededHouseholdId}`,
                JSON.stringify({
                    lists: [
                        {
                            id: seededListId,
                            householdId: seededHouseholdId,
                            title: "Undo Groceries",
                            sortOrder: 0,
                            createdAt: "2026-04-17T00:00:00.000Z",
                            updatedAt: "2026-04-17T00:00:00.000Z",
                            deletedAt: null,
                        },
                    ],
                    items,
                    serverTs: "2026-04-17T00:00:00.000Z",
                }),
            );
            if (undoRecord) {
                localStorage.setItem(
                    `familytodo:undo:${seededHouseholdId}`,
                    JSON.stringify(undoRecord),
                );
            }
            // Disable Supabase client to force local item storage
            localStorage.setItem("familytodo:disable-network", "true");
        },
        {
            seededHouseholdId: householdId,
            seededListId: listId,
            items: seed.items ?? [],
            undoRecord: seed.undoRecord ?? null,
        },
    );

    await page.goto(`/lists/${listId}`);
    await expect(page.getByTestId("item-hydrated")).toHaveAttribute(
        "aria-label",
        "Connected",
        slowExpect,
    );
}

test.describe("Undo last item action", () => {
    test("undoes a tick, including after a reload", async ({ page }) => {
        await openSeededList(page);
        const undoButton = page.getByTestId("undo-button");
        await expect(undoButton).toBeDisabled();

        await createTestItem(page, "Buy milk");
        await expect(undoButton).toHaveAccessibleName(
            "Undo: added “Buy milk”",
        );

        await page
            .getByRole("checkbox", { name: "Mark Buy milk complete" })
            .check();
        await expect(undoButton).toHaveAccessibleName(
            "Undo: ticked “Buy milk”",
        );

        await page.reload();
        await expect(page.getByTestId("item-hydrated")).toHaveAttribute(
            "aria-label",
            "Connected",
            slowExpect,
        );
        await expect(undoButton).toBeEnabled(slowExpect);

        await undoButton.click();

        await expect(
            page.getByRole("checkbox", { name: "Mark Buy milk complete" }),
        ).not.toBeChecked();
        await expect(page.getByTestId("undo-status")).toHaveText(
            "Undone: ticked “Buy milk”.",
        );
        await expect(undoButton).toBeDisabled();
    });

    test("restores a deleted item after the confirmation", async ({ page }) => {
        await openSeededList(page);
        await createTestItem(page, "Buy bread");

        page.once("dialog", (dialog) => dialog.accept());
        await page
            .getByRole("button", { name: "Delete item Buy bread" })
            .click();
        await expect(
            page.locator(".item-text", { hasText: "Buy bread" }),
        ).toHaveCount(0, slowExpect);

        await page.getByTestId("undo-button").click();

        await expect(
            page.locator(".item-text", { hasText: "Buy bread" }),
        ).toBeVisible(slowExpect);
    });

    test("does not offer an undo older than an hour", async ({ page }) => {
        const item = {
            id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
            listId,
            description: "Buy eggs",
            isCompleted: true,
            completedAt: "2026-04-17T00:05:00.000Z",
            createdAt: "2026-04-17T00:00:00.000Z",
            updatedAt: "2026-04-17T00:05:00.000Z",
            deletedAt: null,
        };
        const twoHoursAgo = new Date(
            Date.now() - 2 * 60 * 60 * 1000,
        ).toISOString();

        await openSeededList(page, {
            items: [item],
            undoRecord: {
                action: "complete",
                listId,
                itemId: item.id,
                label: item.description,
                revertTo: {
                    description: item.description,
                    isCompleted: false,
                    completedAt: null,
                    deletedAt: null,
                },
                expectedUpdatedAt: item.updatedAt,
                recordedAt: twoHoursAgo,
            },
        });

        await expect(
            page.locator(".item-text", { hasText: "Buy eggs" }),
        ).toBeVisible(slowExpect);
        await expect(page.getByTestId("undo-button")).toBeDisabled();
    });
});
