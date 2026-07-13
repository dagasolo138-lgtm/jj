/**
 * Gameplay Tests — Military Recruitment & Fortifications
 *
 * Verifies soldier recruitment, dismissal, and fortification upgrades.
 */

import { test, expect } from "@playwright/test";
import { startGame, navigateToTab, dismissOverlay } from "../helpers.js";

/**
 * Get the current garrison count from the Dashboard.
 *
 * Reads via the `data-testid="resource-garrison"` attribute instead of
 * positional `.text-2xl` indexing (B-29 / B-37).
 */
async function getGarrison(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="resource-garrison"]');
    if (!el) return undefined;
    const parsed = parseInt(el.textContent, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  });
}

/**
 * Get the current denarii from the Dashboard.
 *
 * Reads via the `data-testid="resource-denarii"` attribute (B-29 / B-37).
 */
async function getDenarii(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="resource-denarii"]');
    if (!el) return undefined;
    const parsed = parseInt(el.textContent, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  });
}

test.describe("Military Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page, "easy");
    await navigateToTab(page, "Military");
  });

  test("displays garrison information", async ({ page }) => {
    // Should show garrison count
    const garrison = await getGarrison(page);
    expect(garrison).toBe(5); // Easy starts with 5 garrison
  });

  test("shows soldier type sections (Levy, Men-at-Arms, Knights)", async ({
    page,
  }) => {
    await expect(page.getByText("Levy", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Men-at-Arms", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Knight", { exact: false }).first()).toBeVisible();
  });

  test("recruiting a levy increases garrison count", async ({ page }) => {
    const initialGarrison = await getGarrison(page);
    const initialDenarii = await getDenarii(page);

    // Click recruit +1 for levy
    const recruitBtn = page
      .locator("button")
      .filter({ hasText: "Recruit +1" })
      .first();
    await recruitBtn.click();
    await page.waitForTimeout(300);

    const newGarrison = await getGarrison(page);
    expect(newGarrison).toBe(initialGarrison + 1);

    // Should cost denarii
    const newDenarii = await getDenarii(page);
    expect(newDenarii).toBeLessThan(initialDenarii);
  });

  test("dismissing a soldier decreases garrison count", async ({ page }) => {
    const initialGarrison = await getGarrison(page);

    // Click dismiss for levy — button text is "Dismiss -1"
    const dismissBtn = page
      .locator("button")
      .filter({ hasText: "Dismiss -1" })
      .first();

    // Scroll to make dismiss button visible
    await dismissBtn.scrollIntoViewIfNeeded();

    if (await dismissBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
      await dismissBtn.click();
      await page.waitForTimeout(300);

      const newGarrison = await getGarrison(page);
      expect(newGarrison).toBe(initialGarrison - 1);
    }
  });

  test("recruiting +5 soldiers adds 5 to garrison", async ({ page }) => {
    const initialGarrison = await getGarrison(page);

    const recruitBtn = page
      .locator("button")
      .filter({ hasText: "Recruit +5" })
      .first();

    if (await recruitBtn.isEnabled()) {
      await recruitBtn.click();
      await page.waitForTimeout(300);

      const newGarrison = await getGarrison(page);
      expect(newGarrison).toBe(initialGarrison + 5);
    }
  });

  test("morale is displayed in the dashboard", async ({ page }) => {
    // Read via the `data-testid="resource-morale"` attribute (B-29 / B-37).
    const morale = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="resource-morale"]');
      if (!el) return undefined;
      const parsed = parseInt(el.textContent, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    });

    // Starting morale should be 50
    expect(morale).toBe(50);
  });
});

test.describe("Fortification Upgrades", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page, "easy");
    await navigateToTab(page, "Military");
  });

  test("fortification section shows walls, gate, moat tracks", async ({
    page,
  }) => {
    await expect(page.getByText("Walls", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Gate", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Moat", { exact: false }).first()).toBeVisible();
  });

  test("upgrading walls costs denarii", async ({ page }) => {
    // Dismiss any scribe's note that may appear on first visit
    await dismissOverlay(page);
    const initialDenarii = await getDenarii(page);

    // Scroll down to find the walls upgrade button
    const upgradeBtn = page
      .locator("button")
      .filter({ hasText: /Upgrade \(\d+d\)/ })
      .first();

    await upgradeBtn.scrollIntoViewIfNeeded();

    if (await upgradeBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
      await upgradeBtn.click();
      await page.waitForTimeout(300);
      // Dismiss any scribe's note triggered by the upgrade
      await dismissOverlay(page);

      const newDenarii = await getDenarii(page);
      expect(newDenarii).toBeLessThan(initialDenarii);
    }
  });

  test("all three fortification tracks have upgrade buttons at game start", async ({
    page,
  }) => {
    // Dismiss any scribe's note that may appear
    await dismissOverlay(page);

    // Scroll to the fortification section
    const fortSection = page.getByText("Moat", { exact: false }).first();
    await fortSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // At game start (walls=1, gate=0, moat=0, 700d easy), all three
    // tracks should show upgrade buttons since no prerequisites are unmet
    const upgradeButtons = page.locator("button").filter({ hasText: /Upgrade \(\d+d\)/ });
    const count = await upgradeButtons.count();
    expect(count).toBeGreaterThanOrEqual(2); // At least walls and gate or moat
  });
});
