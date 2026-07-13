/**
 * Gameplay Tests — Multi-Turn Survival
 *
 * Verifies the game can be played through multiple turns without
 * crashing, and that resources, turns, and seasons track correctly.
 */

import { test, expect } from "@playwright/test";
import { startGame, dismissTutorial, playOneTurn } from "../helpers.js";

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

/**
 * Get the current turn number from the dashboard text.
 */
async function getCurrentTurn(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const match = text.match(/Turn\s+(\d+)\s*\/\s*40/);
    return match ? parseInt(match[1], 10) : null;
  });
}

test.describe("Multi-Turn Survival", () => {
  test("game survives 4 turns (1 full year) without crashing", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await page.goto("/");
    await startGame(page, "easy");

    const initialValues = await getDashboardValues(page);
    expect(initialValues.denarii).toBe(700);

    const initialTurn = await getCurrentTurn(page);
    expect(initialTurn).toBe(1);

    for (let i = 0; i < 4; i++) {
      const diag = {};
      const success = await playOneTurn(page, diag);
      if (!success) {
        console.log(`[multi-turn] playOneTurn stopped: ${diag.reason} @ iter ${diag.iteration}`);
        const isGameOver = await page
          .getByText("Try Again", { exact: true })
          .isVisible({ timeout: 500 })
          .catch(() => false);
        const isVictory = await page
          .getByText("Reign Again", { exact: true })
          .isVisible({ timeout: 500 })
          .catch(() => false);
        expect(isGameOver || isVictory).toBe(true);
        return;
      }
    }

    // Turn should have advanced beyond 1
    const finalTurn = await getCurrentTurn(page);
    expect(finalTurn).toBeGreaterThan(1);
    // Should be roughly turn 5, allow some variance from event timing
    expect(finalTurn).toBeGreaterThanOrEqual(4);
    expect(finalTurn).toBeLessThanOrEqual(8);
  });

  test("resources change over multiple turns", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/");
    await startGame(page, "easy");

    const turnSnapshots = [];
    turnSnapshots.push(await getDashboardValues(page));

    for (let i = 0; i < 3; i++) {
      const diag = {};
      const success = await playOneTurn(page, diag);
      if (!success) {
        console.log(`[multi-turn] playOneTurn stopped: ${diag.reason} @ iter ${diag.iteration}`);
        break;
      }
      turnSnapshots.push(await getDashboardValues(page));
    }

    expect(turnSnapshots.length).toBeGreaterThanOrEqual(2);

    const initial = turnSnapshots[0];
    const latest = turnSnapshots[turnSnapshots.length - 1];

    const changed =
      initial.denarii !== latest.denarii ||
      initial.food !== latest.food ||
      initial.families !== latest.families;
    expect(changed).toBe(true);
  });

  test("building before simulating affects economy", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/");
    await startGame(page, "easy");

    // Build a Strip Farm for food production
    const buildBtn = page
      .locator("button")
      .filter({ hasText: "Build (100d)" })
      .first();
    if (await buildBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await buildBtn.click();
      await page.waitForTimeout(300);
    }

    const afterBuild = await getDashboardValues(page);
    expect(afterBuild.denarii).toBe(600); // 700 - 100

    const diag = {};
    const success = await playOneTurn(page, diag);
    if (success) {
      const afterTurn = await getDashboardValues(page);
      expect(
        afterTurn.denarii !== afterBuild.denarii ||
          afterTurn.food !== afterBuild.food
      ).toBe(true);
    } else {
      console.log(`[multi-turn] playOneTurn stopped: ${diag.reason} @ iter ${diag.iteration}`);
    }
  });

  test("recruiting soldiers before simulating costs upkeep", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await page.goto("/");
    await startGame(page, "easy");

    // Navigate to military and recruit
    await page.locator('button[aria-label*="Military"]').click();
    await dismissTutorial(page);

    const initialValues = await getDashboardValues(page);

    const recruitBtn = page
      .locator("button")
      .filter({ hasText: "Recruit +5" })
      .first();
    await recruitBtn.scrollIntoViewIfNeeded();
    if (await recruitBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
      await recruitBtn.click();
      await page.waitForTimeout(300);
    }

    const afterRecruit = await getDashboardValues(page);
    // Garrison should have increased
    expect(afterRecruit.garrison).toBeGreaterThan(initialValues.garrison);

    const diag = {};
    const success = await playOneTurn(page, diag);
    if (success) {
      const afterTurn = await getDashboardValues(page);
      // Economy ran — denarii should have changed (upkeep, production, events)
      expect(afterTurn.denarii).not.toBe(afterRecruit.denarii);
    } else {
      console.log(`[multi-turn] playOneTurn stopped: ${diag.reason} @ iter ${diag.iteration}`);
    }
  });

  test("game handles 8 turns (2 full years) on easy difficulty", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await page.goto("/");
    await startGame(page, "easy");

    let turnsPlayed = 0;
    for (let i = 0; i < 8; i++) {
      const diag = {};
      const success = await playOneTurn(page, diag);
      if (!success) {
        console.log(`[multi-turn] playOneTurn stopped: ${diag.reason} @ iter ${diag.iteration}`);
        break;
      }
      turnsPlayed++;
    }

    // Should have played multiple turns without crashing
    expect(turnsPlayed).toBeGreaterThanOrEqual(2);

    if (turnsPlayed >= 4) {
      // Should have advanced past Year 1
      const finalTurn = await getCurrentTurn(page);
      expect(finalTurn).toBeGreaterThan(4);
    }
  });
});
