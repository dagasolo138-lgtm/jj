/**
 * Visual Tests — Lucide Icons
 *
 * Verifies that Lucide React icons render correctly across
 * the Dashboard, TabBar, and other UI components.
 */

import { test, expect } from "@playwright/test";
import { waitForFonts, startGame } from "../helpers.js";

test.describe("Dashboard Icons", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);
  });

  test("resource stat icons are rendered as SVGs", async ({ page }) => {
    const iconCount = await page.evaluate(() => {
      const svgs = document.querySelectorAll("svg");
      return svgs.length;
    });

    // Should have multiple SVG icons (resource stats + tab icons)
    expect(iconCount).toBeGreaterThanOrEqual(9);
  });

  test("dashboard icons render at correct size", async ({ page }) => {
    const iconSizes = await page.evaluate(() => {
      // Dashboard resource icons use aria-hidden="true"
      const dashboardIcons = document.querySelectorAll(
        'svg[aria-hidden="true"]'
      );
      return Array.from(dashboardIcons)
        .slice(0, 7)
        .map((svg) => {
          const rect = svg.getBoundingClientRect();
          return {
            renderedWidth: Math.round(rect.width),
            renderedHeight: Math.round(rect.height),
          };
        });
    });

    expect(iconSizes.length).toBeGreaterThan(0);
    for (const size of iconSizes) {
      // Icons should render at approximately 16px (allow 14-18 for rounding)
      expect(size.renderedWidth).toBeGreaterThanOrEqual(14);
      expect(size.renderedWidth).toBeLessThanOrEqual(18);
      expect(size.renderedHeight).toBeGreaterThanOrEqual(14);
      expect(size.renderedHeight).toBeLessThanOrEqual(18);
    }
  });

  test("tab bar icons render inline with labels", async ({ page }) => {
    const tabIconCount = await page.evaluate(() => {
      const tabButtons = document.querySelectorAll(
        'button[aria-label*="tab"] svg'
      );
      return tabButtons.length;
    });

    // 9 tabs, each with an icon
    expect(tabIconCount).toBe(9);
  });

  test("tab icons have correct color inheritance", async ({ page }) => {
    const iconColors = await page.evaluate(() => {
      const tabIcons = document.querySelectorAll(
        'button[aria-label*="tab"] svg'
      );
      return Array.from(tabIcons).map((svg) => ({
        label: svg.closest("button")?.getAttribute("aria-label"),
        color: window.getComputedStyle(svg).color,
      }));
    });

    expect(iconColors.length).toBe(9);

    // Active tab icon should be gold, inactive should be dark tan
    const activeIcon = iconColors.find((i) =>
      i.label?.includes("active")
    );
    if (activeIcon) {
      expect(activeIcon.color).toBe("rgb(196, 162, 74)");
    }
  });
});
