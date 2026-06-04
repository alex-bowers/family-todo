import { expect, test } from "@playwright/test";

const householdId = "00000000-0000-0000-0000-000000000002"; // Test household ID

test.describe("PWA installability", () => {
  test("exposes manifest metadata and install status region", async ({
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

    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    expect(manifestHref).toBe("/manifest.webmanifest");

    const manifest = await context.request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBeTruthy();

    const body = await manifest.json();
    expect(body.name).toBe("FamilyToDo");
    expect(body.display).toBe("standalone");
    expect(Array.isArray(body.icons)).toBeTruthy();
    expect(body.icons.length).toBeGreaterThan(0);

    await expect(page.getByTestId("pwa-install-status")).toBeVisible();
  });
});
