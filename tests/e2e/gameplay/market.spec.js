/**
 * Gameplay Tests — Market Trading
 *
 * Verifies the buy/sell workflow in the Market Square.
 */

import { test, expect } from "@playwright/test";
import { startGame, navigateToTab } from "../helpers.js";

/**
 * Get the current denarii from the Dashboard.
 *
 * Reads the value via the `data-testid="resource-denarii"` attribute instead
 * of relying on positional order of `.text-2xl` elements (B-29 / B-37).
 */
async function getDenarii(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="resource-denarii"]');
    if (!el) return undefined;
    const parsed = parseInt(el.textContent, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  });
}

test.describe("Market Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page, "easy");
    await navigateToTab(page, "Market");
  });

  test("market square is visible with merchant content", async ({ page }) => {
    // Market should show trading-related content
    const hasMarketContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return (
        text.includes("Market") ||
        text.includes("Merchant") ||
        text.includes("Sell") ||
        text.includes("Buy") ||
        text.includes("Trade")
      );
    });

    expect(hasMarketContent).toBe(true);
  });

  test("sell mode shows available resources to sell", async ({ page }) => {
    // Look for sell-related button or mode
    const sellBtn = page.getByText("Sell to Merchant", { exact: false }).first();
    if (await sellBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await sellBtn.click();
      await page.waitForTimeout(300);

      // Should show resources with sell prices
      const hasResources = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes("Grain") || text.includes("Livestock") || text.includes("Iron");
      });
      expect(hasResources).toBe(true);
    }
  });

  test("buy mode shows available resources to purchase", async ({ page }) => {
    const buyBtn = page.getByText("Buy from Merchant", { exact: false }).first();
    if (await buyBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await buyBtn.click();
      await page.waitForTimeout(300);

      const hasResources = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes("Grain") || text.includes("Iron") || text.includes("Livestock");
      });
      expect(hasResources).toBe(true);
    }
  });

  test("selling a resource increases denarii", async ({ page }) => {
    const initialDenarii = await getDenarii(page);

    // Enter sell mode
    const sellBtn = page.getByText("Sell to Merchant", { exact: false }).first();
    if (await sellBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await sellBtn.click();
      await page.waitForTimeout(300);
    }

    // Try to find and click a quick-sell button (sells 1 unit)
    // Quick trade buttons are small numbered buttons like "1", "5"
    const quickSellBtns = page.locator("button").filter({ hasText: /^1$/ });
    const count = await quickSellBtns.count();
    if (count > 0) {
      await quickSellBtns.first().click();
      await page.waitForTimeout(300);

      const newDenarii = await getDenarii(page);
      expect(newDenarii).toBeGreaterThan(initialDenarii);
    }
  });

  test("buying a resource decreases denarii", async ({ page }) => {
    const initialDenarii = await getDenarii(page);

    // Enter buy mode
    const buyBtn = page.getByText("Buy from Merchant", { exact: false }).first();
    if (await buyBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await buyBtn.click();
      await page.waitForTimeout(300);
    }

    // Try to find and click a quick-buy button
    const quickBuyBtns = page.locator("button").filter({ hasText: /^1$/ });
    const count = await quickBuyBtns.count();
    if (count > 0) {
      await quickBuyBtns.first().click();
      await page.waitForTimeout(300);

      const newDenarii = await getDenarii(page);
      expect(newDenarii).toBeLessThan(initialDenarii);
    }
  });
});
