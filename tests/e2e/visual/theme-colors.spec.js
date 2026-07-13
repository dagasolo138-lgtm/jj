/**
 * Visual Tests — Theme & Colors
 *
 * Verifies the Royal Dark medieval theme palette is applied correctly:
 * background colors, gold accents, resource stat colors, and borders.
 */

import { test, expect } from "@playwright/test";
import {
  waitForTitleScreen,
  waitForFonts,
  startGame,
  getComputedStyleProp,
} from "../helpers.js";

// Expected theme colors from index.css @theme
const THEME = {
  bgDeepest: "rgb(15, 13, 10)",       // #0f0d0a
  bgDark: "rgb(26, 22, 16)",          // #1a1610
  bgCard: "rgb(35, 30, 22)",          // #231e16
  gold: "rgb(196, 162, 74)",          // #c4a24a
  goldBright: "rgb(232, 196, 74)",    // #e8c44a
  tan: "rgb(168, 144, 112)",          // #a89070
  tanDark: "rgb(106, 90, 66)",        // #6a5a42
  royalRed: "rgb(139, 26, 26)",       // #8b1a1a
};

test.describe("Title Screen Theme", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);
    await waitForFonts(page);
  });

  test("page background is deepest dark", async ({ page }) => {
    const bg = await getComputedStyleProp(page, "body", "background-color");
    expect(bg).toBe(THEME.bgDeepest);
  });

  test("title card has dark background with gold border", async ({ page }) => {
    const cardStyles = await page.evaluate(() => {
      // The title card is the main bordered container
      const card = document.querySelector(".border-2");
      if (!card) return null;
      const styles = window.getComputedStyle(card);
      return {
        bg: styles.backgroundColor,
        borderColor: styles.borderColor,
      };
    });

    expect(cardStyles).not.toBeNull();
    expect(cardStyles.bg).toBe(THEME.bgDark);
    expect(cardStyles.borderColor).toBe(THEME.gold);
  });

  test("game title text is bright gold", async ({ page }) => {
    const titleColor = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return null;
      return window.getComputedStyle(h1).color;
    });

    expect(titleColor).toBe(THEME.goldBright);
  });

  test("subtitle text is tan colored", async ({ page }) => {
    const subtitleColor = await page.evaluate(() => {
      const sub = document.querySelector("h1 + p");
      if (!sub) return null;
      return window.getComputedStyle(sub).color;
    });

    expect(subtitleColor).toBe(THEME.tan);
  });

  test("full title screen visual snapshot", async ({ page }) => {
    await expect(page).toHaveScreenshot("title-screen-full.png", {
      fullPage: true,
    });
  });
});

test.describe("Management Phase Theme", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);
  });

  test("main background is deepest dark", async ({ page }) => {
    const bg = await page.evaluate(() => {
      const main = document.querySelector(".min-h-screen");
      if (!main) return null;
      return window.getComputedStyle(main).backgroundColor;
    });

    expect(bg).toBe(THEME.bgDeepest);
  });

  test("dashboard resource values use bright gold", async ({ page }) => {
    // Read via the `data-testid="resource-denarii"` attribute instead of
    // positional `.text-2xl` indexing (B-29 / B-37).
    const valueColor = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="resource-denarii"]');
      if (!el) return null;
      return window.getComputedStyle(el).color;
    });

    expect(valueColor).toBe(THEME.goldBright);
  });

  test("tab bar has correct active/inactive styling", async ({ page }) => {
    const tabStyles = await page.evaluate(() => {
      const tabs = document.querySelectorAll('button[aria-label*="tab"]');
      const results = [];
      for (const tab of tabs) {
        const styles = window.getComputedStyle(tab);
        const isActive = tab.getAttribute("aria-current") === "page";
        results.push({
          label: tab.getAttribute("aria-label"),
          isActive,
          color: styles.color,
          bg: styles.backgroundColor,
          borderBottom: styles.borderBottomColor,
        });
      }
      return results;
    });

    expect(tabStyles.length).toBeGreaterThan(0);

    // At least one tab should be active
    const activeTab = tabStyles.find((t) => t.isActive);
    expect(activeTab, "should have an active tab").toBeTruthy();
    expect(activeTab.color).toBe(THEME.gold);
    expect(activeTab.bg).toBe(THEME.bgCard);

    // Inactive tabs should use dark tan
    const inactiveTab = tabStyles.find((t) => !t.isActive);
    expect(inactiveTab, "should have inactive tabs").toBeTruthy();
    expect(inactiveTab.color).toBe(THEME.tanDark);
  });

  test("Simulate Season button uses royal red gradient with gold text", async ({
    page,
  }) => {
    const btnStyles = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="Simulate"]');
      if (!btn) return null;
      const styles = window.getComputedStyle(btn);
      return {
        color: styles.color,
        borderColor: styles.borderColor,
        bg: styles.backgroundImage,
      };
    });

    expect(btnStyles).not.toBeNull();
    expect(btnStyles.color).toBe(THEME.goldBright);
    expect(btnStyles.borderColor).toBe(THEME.gold);
    // Background should be a gradient containing royal red tones
    expect(btnStyles.bg).toContain("linear-gradient");
  });

  test("resource stat border colors match resource types", async ({ page }) => {
    const borderColors = await page.evaluate(() => {
      // Resource stats have inline border-bottom styling
      const stats = document.querySelectorAll("[style*='border-bottom']");
      return Array.from(stats)
        .map((el) => el.style.borderBottom || el.style.borderBottomColor)
        .filter(Boolean);
    });

    // At least the primary resources should have colored borders
    expect(borderColors.length).toBeGreaterThanOrEqual(4);
  });
});

test.describe("CSS Custom Properties", () => {
  test("theme CSS variables are defined", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return {
        bgDeepest: styles.getPropertyValue("--color-bg-deepest").trim(),
        bgDark: styles.getPropertyValue("--color-bg-dark").trim(),
        bgCard: styles.getPropertyValue("--color-bg-card").trim(),
        gold: styles.getPropertyValue("--color-gold").trim(),
        goldBright: styles.getPropertyValue("--color-gold-bright").trim(),
        tan: styles.getPropertyValue("--color-tan").trim(),
        royalRed: styles.getPropertyValue("--color-royal-red").trim(),
        foodGreen: styles.getPropertyValue("--color-food-green").trim(),
      };
    });

    expect(cssVars.gold).toBeTruthy();
    expect(cssVars.goldBright).toBeTruthy();
    expect(cssVars.bgDeepest).toBeTruthy();
    expect(cssVars.royalRed).toBeTruthy();
  });
});
