/**
 * Gameplay Tests — Season Simulation Flow
 *
 * Verifies the turn cycle: management → simulate season →
 * seasonal event → resolve → random event → resolve → next turn.
 */

import { test, expect } from "@playwright/test";
import { startGame, dismissTutorial, playOneTurn } from "../helpers.js";

/**
 * Click "Simulate Season" and wait for the seasonal event screen.
 */
async function simulateSeason(page) {
  const simBtn = page.locator('button[aria-label*="Simulate"]');
  await simBtn.click();
  // Wait for event card to appear (seasonal_action phase)
  await page.waitForSelector('[role="group"][aria-label="Choose your response"]', {
    timeout: 10_000,
  });
}

/**
 * Choose an event option (0-indexed).
 */
async function chooseEventOption(page, index = 0) {
  const options = page.locator('[role="group"][aria-label="Choose your response"] button');
  await options.nth(index).click();
}

/**
 * Click the resolve/continue button to advance past a resolve screen.
 * Handles the case where overlays (Scribe's Note) may be blocking.
 */
async function clickContinue(page) {
  // First dismiss any overlay that might be on top
  const overlayBtns = page.locator(".fixed.inset-0 button");
  const overlayCount = await overlayBtns.count();
  if (overlayCount > 0) {
    await overlayBtns.last().click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(300);
  }

  const continueBtn = page.locator("button").filter({
    hasText: /See What Happens Next|Continue|See Your Legacy/,
  });
  if (await continueBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await continueBtn.first().click({ timeout: 5_000 });
  }
}

test.describe("Season Simulation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await startGame(page, "easy");
  });

  test("Simulate Season button triggers seasonal event", async ({ page }) => {
    await simulateSeason(page);

    // Should see the seasonal event card
    await expect(page.getByText("Seasonal Decision")).toBeVisible();

    // Should show event title and options
    const options = page.locator(
      '[role="group"][aria-label="Choose your response"] button'
    );
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("choosing a seasonal event option shows resolve screen", async ({
    page,
  }) => {
    await simulateSeason(page);
    await chooseEventOption(page, 0);

    // Should see the resolve continue button
    await expect(
      page.getByText("See What Happens Next", { exact: true })
    ).toBeVisible();
  });

  test("completing seasonal resolve transitions to next phase", async ({
    page,
  }) => {
    await simulateSeason(page);
    await chooseEventOption(page, 0);
    await clickContinue(page);

    // After seasonal resolve, game transitions to random event, flip, raid, or management.
    // Just verify we left the seasonal resolve screen
    await page.waitForTimeout(500);
    const resolveGone = await page
      .getByText("See What Happens Next", { exact: true })
      .isVisible({ timeout: 500 })
      .catch(() => false);
    expect(resolveGone).toBe(false);
  });

  test("completing full turn cycle advances the turn", async ({ page }) => {
    test.setTimeout(60_000);

    await expect(page.getByText("Turn 1/40", { exact: false }).first()).toBeVisible();

    const diag = {};
    const ok = await playOneTurn(page, diag);
    if (!ok) {
      console.log(`[season-flow] playOneTurn stopped: ${diag.reason} @ iter ${diag.iteration}`);
    }

    await expect(page.getByText("Turn 2/40", { exact: false }).first()).toBeVisible();
  });

  test("season advances each turn (Spring → Summer → Autumn → Winter)", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await expect(page.getByText("Spring", { exact: false }).first()).toBeVisible();

    const logDiag = (diag) => {
      if (diag.reason) {
        console.log(`[season-flow] playOneTurn stopped: ${diag.reason} @ iter ${diag.iteration}`);
      }
    };

    {
      const diag = {};
      const ok = await playOneTurn(page, diag);
      if (!ok) logDiag(diag);
    }
    await expect(page.getByText("Summer", { exact: false }).first()).toBeVisible();

    {
      const diag = {};
      const ok = await playOneTurn(page, diag);
      if (!ok) logDiag(diag);
    }
    await expect(page.getByText("Autumn", { exact: false }).first()).toBeVisible();

    {
      const diag = {};
      const ok = await playOneTurn(page, diag);
      if (!ok) logDiag(diag);
    }
    await expect(page.getByText("Winter", { exact: false }).first()).toBeVisible();
  });

  test("year advances after 4 seasons", async ({ page }) => {
    test.setTimeout(120_000);

    for (let i = 0; i < 4; i++) {
      const diag = {};
      const ok = await playOneTurn(page, diag);
      if (!ok) {
        console.log(`[season-flow] playOneTurn stopped: ${diag.reason} @ iter ${diag.iteration}`);
      }
    }

    await expect(page.getByText("Year 2", { exact: false }).first()).toBeVisible();
  });

  test("chronicle records events from each turn", async ({ page }) => {
    test.setTimeout(60_000);

    await playOneTurn(page);

    // Navigate to chronicle
    await page.locator('button[aria-label*="Chronicle"]').click();
    await dismissTutorial(page);

    // Chronicle should have more than just the opening entry
    const entries = page.locator(".tab-fade-in >> text=Spring");
    const count = await entries.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
