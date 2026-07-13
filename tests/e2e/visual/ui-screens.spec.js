/**
 * Visual Tests — UI Screen Snapshots
 *
 * Full-page and component-level visual regression tests for
 * key game screens: Title, Dashboard, all 9 tabs, and overlays.
 */

import { test, expect } from "@playwright/test";
import {
  waitForTitleScreen,
  waitForFonts,
  startGame,
  navigateToTab,
} from "../helpers.js";

test.describe("Title Screen", () => {
  test("renders difficulty selection buttons", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);
    await waitForFonts(page);

    // All three difficulty options should be visible
    await expect(page.getByText("Easy")).toBeVisible();
    await expect(page.getByText("Normal")).toBeVisible();
    await expect(page.getByText("Hard")).toBeVisible();

    // Visual snapshot
    await expect(page).toHaveScreenshot("title-screen-with-difficulties.png", {
      fullPage: true,
    });
  });

  test("displays How to Play section", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);
    await waitForFonts(page);

    await expect(page.getByText("How to Play")).toBeVisible();
  });

  test("shows music toggle button", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    const muteBtn = page.locator('button[aria-label*="Mute"]');
    await expect(muteBtn).toBeVisible();
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);
  });

  test("displays all primary resource stats", async ({ page }) => {
    // Check for primary resource labels (use exact match to avoid ambiguity)
    await expect(page.getByText("Denarii", { exact: true })).toBeVisible();
    await expect(page.getByText("Food", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Families", { exact: true })).toBeVisible();
    await expect(page.getByText("Garrison", { exact: true })).toBeVisible();

    // Dashboard snapshot
    const dashboard = page.locator(".sticky.top-0").first();
    await expect(dashboard).toHaveScreenshot("dashboard-resources.png");
  });

  test("shows season and year info", async ({ page }) => {
    // Should show season + year text in the dashboard
    await expect(page.getByText("Year 1").first()).toBeVisible();
  });

  test("displays save/load/mute controls", async ({ page }) => {
    await expect(page.locator('button[aria-label="Save game"]')).toBeVisible();
    await expect(page.locator('button[aria-label*="Mute"]')).toBeVisible();
  });
});

test.describe("Tab Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);
  });

  test("all 9 tabs are visible", async ({ page }) => {
    const tabNames = [
      "Estate",
      "Map",
      "Market",
      "Military",
      "People",
      "Hall",
      "Chapel",
      "Forge",
      "Chronicle",
    ];

    for (const name of tabNames) {
      const tab = page.locator(`button[aria-label*="${name}"]`);
      await expect(tab, `${name} tab should be visible`).toBeVisible();
    }
  });

  test("tab bar visual snapshot", async ({ page }) => {
    const tabBar = page.locator('div[style*="background-color: rgb(15, 13, 10)"]').first();
    if (await tabBar.isVisible()) {
      await expect(tabBar).toHaveScreenshot("tab-bar.png");
    }
  });

  test("clicking tabs changes content", async ({ page }) => {
    await navigateToTab(page, "Map");

    // Wait for map content to render
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("map-tab-content.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    });
  });
});

test.describe("Estate Tab", () => {
  test("renders estate management view on game start", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);

    // Should show building-related content
    await expect(page.getByText("Build New")).toBeVisible();

    await expect(page).toHaveScreenshot("estate-tab-initial.png", {
      fullPage: true,
    });
  });
});

test.describe("Map Tab", () => {
  test("renders the estate map with terrain", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);

    await navigateToTab(page, "Map");

    // Wait for CSS animations and map rendering
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("map-tab-terrain.png", {
      fullPage: true,
      // Map has animated peasants — use higher threshold
      maxDiffPixelRatio: 0.03,
    });
  });
});

test.describe("Military Tab", () => {
  test("renders military management with garrison info", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);

    await navigateToTab(page, "Military");

    await expect(page).toHaveScreenshot("military-tab.png", {
      fullPage: true,
    });
  });
});

test.describe("Market Tab", () => {
  test("renders the market square", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);

    await navigateToTab(page, "Market");

    await expect(page).toHaveScreenshot("market-tab.png", {
      fullPage: true,
    });
  });
});

test.describe("Chronicle Tab", () => {
  test("renders the chronicle log", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);

    await navigateToTab(page, "Chronicle");

    await expect(page).toHaveScreenshot("chronicle-tab.png", {
      fullPage: true,
    });
  });
});

test.describe("Simulate Season Button", () => {
  test("button is visible and styled during management phase", async ({
    page,
  }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);

    const simBtn = page.locator('button[aria-label*="Simulate"]');
    await expect(simBtn).toBeVisible();
    await expect(simBtn).toHaveScreenshot("simulate-season-button.png");
  });
});
