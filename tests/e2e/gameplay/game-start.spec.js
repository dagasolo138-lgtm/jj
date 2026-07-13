/**
 * Gameplay Tests — Game Start & Difficulty Selection
 *
 * Verifies that each difficulty level starts with the correct
 * resources, buildings, and initial game state.
 */

import { test, expect } from "@playwright/test";
import { waitForTitleScreen, dismissTutorial } from "../helpers.js";

/**
 * Get all visible resource values from the Dashboard.
 *
 * Reads each resource by its `data-testid="resource-*"` attribute instead of
 * relying on positional order of `.text-2xl` elements. Missing testids
 * (e.g. faith/piety may not render on every run) resolve to `undefined`.
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
      morale: readResource("morale"),
      faith: readResource("faith"),
      piety: readResource("piety"),
    };
  });
}

test.describe("Game Start", () => {
  test("title screen shows all three difficulty options", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    await expect(page.getByText("Easy")).toBeVisible();
    await expect(page.getByText("Normal")).toBeVisible();
    await expect(page.getByText("Hard")).toBeVisible();
  });

  test("starting on Normal difficulty sets correct initial resources", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    await page.getByText("Normal").click();
    await page.waitForSelector("text=Denarii", { timeout: 10_000 });
    await dismissTutorial(page);

    const values = await getDashboardValues(page);
    expect(values.denarii).toBe(500);
    expect(values.families).toBe(20);
    expect(values.garrison).toBe(5);
    // Food is calculated from inventory: grain 280 + livestock 50 + fish 35 = 365
    expect(values.food).toBe(365);
  });

  test("starting on Easy difficulty gives more resources", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    await page.getByText("Easy").click();
    await page.waitForSelector("text=Denarii", { timeout: 10_000 });
    await dismissTutorial(page);

    const values = await getDashboardValues(page);
    expect(values.denarii).toBe(700);
    expect(values.families).toBe(22);
    expect(values.garrison).toBe(5);
    // Easy food: grain 350 + livestock 80 + fish 50 = 480
    expect(values.food).toBe(480);
  });

  test("starting on Hard difficulty gives fewer resources", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    await page.getByText("Hard").click();
    await page.waitForSelector("text=Denarii", { timeout: 10_000 });
    await dismissTutorial(page);

    const values = await getDashboardValues(page);
    expect(values.denarii).toBe(400);
    expect(values.families).toBe(18);
    expect(values.garrison).toBe(3);
    // Hard food: grain 200 + livestock 35 + fish 20 = 255
    expect(values.food).toBe(255);
  });

  test("game starts on Spring, Year 1, Turn 1", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    await page.getByText("Normal").click();
    await page.waitForSelector("text=Denarii", { timeout: 10_000 });
    await dismissTutorial(page);

    // Dashboard shows season and year info
    await expect(page.getByText("Spring, Year 1").first()).toBeVisible();
  });

  test("game starts on the Estate tab", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    await page.getByText("Normal").click();
    await page.waitForSelector("text=Denarii", { timeout: 10_000 });
    await dismissTutorial(page);

    // Estate tab should be active
    const activeTab = page.locator('[aria-current="page"]');
    await expect(activeTab).toHaveAttribute("aria-label", /Estate/);
  });

  test("chronicle has opening entry after game start", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    await page.getByText("Normal").click();
    await page.waitForSelector("text=Denarii", { timeout: 10_000 });
    await dismissTutorial(page);

    // Navigate to chronicle tab
    await page.locator('button[aria-label*="Chronicle"]').click();
    await dismissTutorial(page);

    // Should contain the opening chronicle entry
    await expect(
      page.getByText("The old lord has passed", { exact: false })
    ).toBeVisible();
  });

  test("estate starts with 4 pre-built buildings", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    await page.getByText("Normal").click();
    await page.waitForSelector("text=Denarii", { timeout: 10_000 });
    await dismissTutorial(page);

    // Should see pre-built buildings in the "Your Buildings" section
    await expect(page.getByText("Coal Pit", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Tannery", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Sawmill", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Smelter", { exact: false }).first()).toBeVisible();
  });
});
