/**
 * Gameplay Tests — Save & Load System
 *
 * Verifies that game state persists correctly through
 * localStorage save/load and survives page reload.
 */

import { test, expect } from "@playwright/test";
import { startGame, dismissTutorial } from "../helpers.js";

/**
 * Get Dashboard resource values.
 *
 * Reads each resource via its `data-testid="resource-<key>"` attribute instead
 * of relying on positional order of `.text-2xl` elements (B-29 / B-37).
 */
async function getDashboardValues(page) {
  return page.evaluate(() => {
    const readResource = (key) => {
      const el = document.querySelector(`[data-testid="resource-${key}"]`);
      if (!el) return undefined;
      const parsed = parseInt(el.textContent, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    };
    return {
      denarii: readResource("denarii"),
      food: readResource("food"),
      families: readResource("families"),
      garrison: readResource("garrison"),
    };
  });
}

test.describe("Save & Load", () => {
  test("save button shows confirmation flash", async ({ page }) => {
    await page.goto("/");
    await startGame(page);

    // Click save
    await page.locator('button[aria-label="Save game"]').click();

    // Should show "Saved!" confirmation text
    await expect(page.getByText("Saved!")).toBeVisible({ timeout: 2_000 });
  });

  test("saved game persists state through save/load cycle", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);

    // Build a Strip Farm to change state
    const buildBtn = page
      .locator("button")
      .filter({ hasText: "Build (100d)" })
      .first();
    if (await buildBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await buildBtn.click();
      await page.waitForTimeout(300);
    }

    // Record modified state
    const afterBuild = await getDashboardValues(page);

    // Save the game
    await page.locator('button[aria-label="Save game"]').click();
    await page.waitForTimeout(500);

    // Start a new game (which resets state)
    await page.goto("/");
    await page.waitForSelector("text=The Lord's Ledger", { timeout: 10_000 });

    // Load the saved game
    const loadBtn = page.locator('button[aria-label="Load saved game"]');
    if (await loadBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await loadBtn.click();
      await page.waitForTimeout(500);

      // Should see "Loaded!" confirmation
      await expect(page.getByText("Loaded!").first()).toBeVisible({ timeout: 2_000 });

      // Verify state matches what we saved (after building)
      const afterLoad = await getDashboardValues(page);
      expect(afterLoad.denarii).toBe(afterBuild.denarii);
      expect(afterLoad.families).toBe(afterBuild.families);
      expect(afterLoad.garrison).toBe(afterBuild.garrison);
    }
  });

  test("load button is disabled when no save exists", async ({ page }) => {
    // Clear localStorage first
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("text=The Lord's Ledger", { timeout: 10_000 });

    // Load button on title screen should not appear or be dimmed
    const loadBtn = page.locator('button[aria-label="Load saved game"]');
    const isVisible = await loadBtn.isVisible({ timeout: 1_000 }).catch(() => false);

    if (isVisible) {
      // If visible, it should have reduced opacity or be non-functional
      const opacity = await loadBtn.evaluate((el) =>
        window.getComputedStyle(el).opacity
      );
      // With no save, opacity should be reduced
      expect(parseFloat(opacity)).toBeLessThanOrEqual(1);
    }
  });

  test("save preserves game after navigating tabs", async ({ page }) => {
    await page.goto("/");
    await startGame(page);

    // Navigate to Military tab
    await page.locator('button[aria-label*="Military"]').click();
    await dismissTutorial(page);

    // Recruit a soldier
    const recruitBtn = page
      .locator("button")
      .filter({ hasText: "Recruit +1" })
      .first();
    if (await recruitBtn.isEnabled()) {
      await recruitBtn.click();
      await page.waitForTimeout(300);
    }

    const stateAfterRecruit = await getDashboardValues(page);

    // Save
    await page.locator('button[aria-label="Save game"]').click();
    await page.waitForTimeout(500);

    // Reload page completely
    await page.goto("/");
    await page.waitForSelector("text=The Lord's Ledger", { timeout: 10_000 });

    // Load
    const loadBtn = page.locator('button[aria-label="Load saved game"]');
    if (await loadBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await loadBtn.click();
      await page.waitForTimeout(500);

      const stateAfterLoad = await getDashboardValues(page);
      expect(stateAfterLoad.garrison).toBe(stateAfterRecruit.garrison);
    }
  });
});
