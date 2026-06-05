import { Page, expect } from "@playwright/test";

const slowExpect = { timeout: 15000 };

/**
 * Reusable Playwright helpers for seeding and interacting with lists and items
 */

export async function createTestList(
  page: Page,
  listName: string,
): Promise<string> {
  // Wait for page hydration
  await expect(page.getByTestId("hydrated")).toHaveText("ready", slowExpect);

  const newListInput = page.getByLabel("New list");
  const createButton = page.getByRole("button", { name: "Create list" });

  await expect(createButton).toBeEnabled(slowExpect);

  // Fill the list name
  await newListInput.fill(listName);

  // Verify the fill stuck before submitting
  await expect(newListInput).toHaveValue(listName);

  // Click create button
  await createButton.click();

  // Wait for the list to appear with a more flexible approach
  // First wait for any list button to appear (gives us a signal that lists are rendering)
  await page
    .getByRole("button", { name: /Open list / })
    .first()
    .waitFor({ state: "visible", timeout: slowExpect.timeout });

  // Then verify our specific list is visible with a longer timeout
  // This handles cases where the list takes a moment to render
  // Use .first() to handle potential duplicates gracefully
  await expect(
    page.getByRole("button", { name: `Open list ${listName}` }).first()
  ).toBeVisible({ timeout: 10000 });

  return `list-${Date.now()}`;
}

export async function createTestItem(
  page: Page,
  itemName: string,
): Promise<void> {
  const newItemInput = page.getByLabel("New item");
  await newItemInput.fill(itemName);
  await page.getByRole("button", { name: "Add item" }).click();

  // Wait for the item to appear
  await page.getByText(itemName).waitFor({ state: "visible" });
}

export async function navigateToListDetail(
  page: Page,
  listName: string,
): Promise<void> {
  // First select the list
  await page.getByRole("button", { name: `Open list ${listName}` }).click();

  // Then click the open link
  await page.getByRole("link", { name: "Open selected list" }).click();

  // Wait for navigation to complete
  await page.waitForURL(/\/lists\/.+/);
}
