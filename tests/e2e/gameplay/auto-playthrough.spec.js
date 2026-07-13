/**
 * Automated Game Playthrough — Balance & Bug Detection
 *
 * Plays through the full 40-turn game multiple times on each difficulty,
 * logging resource snapshots every turn, recording events/choices, and
 * detecting crashes, soft-locks, and balance anomalies.
 *
 * Results are written to tests/e2e/playthrough-results.json for analysis.
 */

import { test } from "@playwright/test";
import { startGame, dismissTutorial, dismissOverlay } from "../helpers.js";
import { writeFileSync, existsSync, readFileSync, readdirSync, unlinkSync } from "fs";
import { resolve } from "path";

const RESULTS_PATH = resolve(
  import.meta.dirname,
  "..",
  "playthrough-results.json"
);

// Diagnostics screenshots land here (autoplay-<runId>-<outcome>.png).
// B-52: stale PNGs from prior failed cycles accumulate and look like active
// softlocks to a reviewer scanning the folder, so the spec clears its own
// artifacts at the start of each run. Only `autoplay-*.png` files in this
// exact directory are touched — `qa-*.png`, `qa-cycle/`, and
// `game-*-final.png` are preserved.
const SCREENSHOT_DIR = resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "playtest-screenshots"
);

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Extract dashboard resource values via DOM.
 *
 * Reads each value via its `data-testid="resource-<key>"` attribute instead
 * of positional `.text-2xl` indexing (B-29 / B-37). Missing testids resolve
 * to `null` so existing callers stay backward compatible.
 */
async function getResources(page) {
  return page.evaluate(() => {
    const readResource = (key) => {
      const el = document.querySelector(`[data-testid="resource-${key}"]`);
      if (!el) return null;
      const parsed = parseInt(el.textContent, 10);
      return Number.isNaN(parsed) ? null : parsed;
    };
    return {
      denarii: readResource("denarii"),
      food: readResource("food"),
      families: readResource("families"),
      garrison: readResource("garrison"),
    };
  });
}

/** Get current turn and season info from the dashboard */
async function getTurnInfo(page) {
  return page.evaluate(() => {
    const text = document.body.innerText;
    const turnMatch = text.match(/Turn\s+(\d+)\s*\/\s*40/);
    const seasonMatch = text.match(/(Spring|Summer|Autumn|Winter),\s*Year\s*(\d+)/);
    return {
      turn: turnMatch ? parseInt(turnMatch[1], 10) : null,
      season: seasonMatch ? seasonMatch[1] : null,
      year: seasonMatch ? parseInt(seasonMatch[2], 10) : null,
    };
  });
}

/** Collect visible text about events/choices made */
async function getVisibleEventText(page) {
  return page.evaluate(() => {
    // Look for event card title/description
    const headings = Array.from(document.querySelectorAll("h3, h2"));
    const texts = headings
      .map((h) => h.textContent.trim())
      .filter((t) => t.length > 3 && t.length < 200);
    return texts.slice(0, 3);
  });
}

/**
 * Attempt management-phase actions with varied strategies.
 * Strategy parameter controls what actions the bot prioritizes.
 */
async function doManagementActions(page, turn, strategy, log) {
  await dismissTutorial(page);

  if (strategy === "builder") {
    await tryBuildSomething(page, turn, log);
  } else if (strategy === "military") {
    await tryRecruitSoldiers(page, log);
  } else if (strategy === "balanced") {
    // Alternate between building and military each turn
    if (turn % 2 === 1) {
      await tryBuildSomething(page, turn, log);
    } else {
      await tryRecruitSoldiers(page, log);
    }
  }
  // "passive" strategy: do nothing, just simulate

  // Always return to estate tab after actions
  const estateTab = page.locator('button[aria-label*="Estate"]');
  if (await estateTab.isVisible({ timeout: 500 }).catch(() => false)) {
    await estateTab.click();
    await page.waitForTimeout(200);
    await dismissTutorial(page);
  }
}

/** Try to build the first affordable building */
async function tryBuildSomething(page, turn, log) {
  const estateTab = page.locator('button[aria-label*="Estate"]');
  if (await estateTab.isVisible({ timeout: 500 }).catch(() => false)) {
    await estateTab.click();
    await page.waitForTimeout(300);
    await dismissTutorial(page);
  }

  // Find any enabled Build button
  const buildButtons = page.locator("button").filter({ hasText: /^Build \(/ });
  const count = await buildButtons.count();
  for (let i = 0; i < count; i++) {
    const btn = buildButtons.nth(i);
    if (await btn.isEnabled({ timeout: 300 }).catch(() => false)) {
      const btnText = await btn.textContent();
      await btn.click();
      await page.waitForTimeout(300);
      log.push(`Turn ${turn}: Built — ${btnText}`);
      await dismissOverlay(page);
      return;
    }
  }
}

/** Try to recruit soldiers */
async function tryRecruitSoldiers(page, log) {
  const milTab = page.locator('button[aria-label*="Military"]');
  if (await milTab.isVisible({ timeout: 500 }).catch(() => false)) {
    await milTab.click();
    await page.waitForTimeout(300);
    await dismissTutorial(page);
  }

  const recruitBtn = page.locator("button").filter({ hasText: /Recruit \+/ }).first();
  if (await recruitBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    if (await recruitBtn.isEnabled({ timeout: 300 }).catch(() => false)) {
      const btnText = await recruitBtn.textContent();
      await recruitBtn.click();
      await page.waitForTimeout(300);
      log.push(`Recruited: ${btnText}`);
      await dismissOverlay(page);
    }
  }
}

/**
 * Capture a diagnostic snapshot of the visible page (text + button labels)
 * plus a full-page screenshot for triage. Called on blocking outcomes
 * (sim_button_missing, possible_softlock) per B-48.
 */
async function captureDiagnostics(page, runId, outcome) {
  const snapshot = await page
    .evaluate(() => {
      const visibleText = document.body.innerText.slice(0, 800);
      const buttons = Array.from(document.querySelectorAll("button"))
        .filter((b) => {
          const rect = b.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .slice(0, 20)
        .map((b) => (b.textContent || "").trim().slice(0, 60));
      return { visibleText, buttons };
    })
    .catch(() => ({ visibleText: "", buttons: [] }));

  const safeRunId = String(runId ?? "unknown").replace(/\//g, "-");
  try {
    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, `autoplay-${safeRunId}-${outcome}.png`),
      fullPage: true,
    });
  } catch {
    // Screenshot failure must not break the test
  }

  return snapshot;
}

/**
 * Play one full turn with event logging. Returns:
 *  { continued: bool, events: string[], choicesMade: string[], outcome: string|null }
 */
async function playOneTurnLogged(page, runId) {
  const events = [];
  const choices = [];

  // Dismiss any tutorial or overlay before looking for sim button
  await dismissOverlay(page);
  await dismissTutorial(page);

  const simBtn = page.locator('button[aria-label*="Simulate"]');
  if (!(await simBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
    const diagnostics = await captureDiagnostics(
      page,
      runId,
      "sim_button_missing"
    );
    return {
      continued: false,
      events,
      choices,
      outcome: "sim_button_missing",
      diagnostics,
    };
  }
  await simBtn.click();

  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(250);

    // Check game end states
    if (
      await page
        .getByText("Try Again", { exact: true })
        .isVisible({ timeout: 200 })
        .catch(() => false)
    ) {
      // Capture game-over reason from data attribute (BUG 1 fix)
      const reasonText = await page.evaluate(() => {
        const el = document.querySelector('[data-gameover-reason]');
        if (el) return el.getAttribute('data-gameover-reason');
        const body = document.body.innerText;
        const match = body.match(
          /(depopulat|bankrupt|population.*reached.*0|denarii.*0|no.*families)/i
        );
        return match ? match[0] : "unknown";
      });
      return { continued: false, events, choices, outcome: `game_over:${reasonText}` };
    }

    if (
      await page
        .getByText("Reign Again", { exact: true })
        .isVisible({ timeout: 200 })
        .catch(() => false)
    ) {
      return { continued: false, events, choices, outcome: "victory" };
    }

    // Check if back in management
    if (await simBtn.isVisible({ timeout: 200 }).catch(() => false)) {
      if (!(await dismissOverlay(page))) {
        return { continued: true, events, choices, outcome: null };
      }
      continue;
    }

    // Capture event text before making choices
    const eventTexts = await getVisibleEventText(page);
    if (eventTexts.length > 0) {
      events.push(...eventTexts.filter((t) => !events.includes(t)));
    }

    // Priority 1: Dismiss overlays (scribe's note, tutorial, raid)
    const overlayBtns = page.locator(".fixed.inset-0 button");
    const overlayCount = await overlayBtns.count();
    if (overlayCount > 0) {
      const btnText = await overlayBtns.last().textContent().catch(() => "");
      await overlayBtns.last().click({ timeout: 2_000 }).catch(() => {});
      if (btnText) choices.push(btnText.trim().substring(0, 60));
      continue;
    }

    // Priority 2: Event/flip choices — pick randomly for variety
    const choiceBtns = page.locator('[role="group"] button');
    const choiceCount = await choiceBtns.count();
    if (choiceCount > 0 && await choiceBtns.first().isVisible({ timeout: 200 }).catch(() => false)) {
      const idx = Math.floor(Math.random() * choiceCount);
      const choiceText = await choiceBtns.nth(idx).textContent().catch(() => "");
      // Scroll the page down to ensure event options clear the sticky dashboard
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(100);
      await choiceBtns.nth(idx).click({ timeout: 5_000 }).catch(() => {});
      choices.push(`Choice[${idx + 1}/${choiceCount}]: ${choiceText.trim().substring(0, 80)}`);
      continue;
    }

    // Priority 3: Continue/resolve buttons.
    //
    // Narrowed to exact resolve-step labels (B-46): the prior trailing
    // `|Return` alternation let the driver click navigation affordances on
    // the game-over / victory screen (e.g. "Return to Title"), hiding the
    // true end state. Each label is anchored with an optional leading arrow
    // glyph so in-game labels like "\u2190 Return to Market Square" still
    // match, but unrelated "Return" substrings do not.
    const RESOLVE_PREFIX = "^\\s*(?:\\u2190\\s*)?";
    const RESOLVE_LABELS = [
      "See What Happens Next",
      "Continue",
      "See Your Legacy",
      "See the Consequences",
      "Return to Your Reign",
      "Return to Throne",
      "Return to Queue",
      "Return to Market Square",
      "Return to Tavern",
      "Return to Chapel",
      "Defend",
      "Begin",
      "Proceed",
      "Accept",
      "Done",
    ];
    const resolvePattern = new RegExp(
      RESOLVE_LABELS.map((l) => `${RESOLVE_PREFIX}${l}\\s*$`).join("|")
    );
    const continueBtn = page.locator("button").filter({ hasText: resolvePattern });
    if (
      await continueBtn
        .first()
        .isVisible({ timeout: 200 })
        .catch(() => false)
    ) {
      const txt = await continueBtn.last().textContent().catch(() => "");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(100);
      await continueBtn.last().click({ timeout: 5_000 }).catch(() => {});
      if (txt) choices.push(txt.trim().substring(0, 60));
      continue;
    }
  }

  // If we exhausted the loop, check if we're stuck
  const stillSim = await simBtn.isVisible({ timeout: 500 }).catch(() => false);
  if (!stillSim) {
    const diagnostics = await captureDiagnostics(
      page,
      runId,
      "possible_softlock"
    );
    return {
      continued: false,
      events,
      choices,
      outcome: "possible_softlock",
      diagnostics,
    };
  }
  return {
    continued: true,
    events,
    choices,
    outcome: null,
  };
}

/**
 * Run a full game playthrough. Returns structured result data.
 */
async function runPlaythrough(page, difficulty, strategy, runId) {
  const turnData = [];
  const actionLog = [];
  const errors = [];
  let finalOutcome = null;
  let finalDiagnostics = null;
  let turnsPlayed = 0;
  const startTime = Date.now();

  await page.goto("/");
  await startGame(page, difficulty);

  // Initial snapshot
  const initRes = await getResources(page);
  const initTurn = await getTurnInfo(page);
  turnData.push({
    turn: initTurn.turn,
    season: initTurn.season,
    year: initTurn.year,
    resources: initRes,
    events: [],
    choices: [],
  });

  for (let t = 0; t < 42; t++) {
    // Safety margin above 40 turns
    try {
      // Do management actions based on strategy
      await doManagementActions(page, t + 1, strategy, actionLog);

      // Play the turn
      const result = await playOneTurnLogged(page, runId);
      turnsPlayed++;

      // Snapshot resources after turn
      let postRes = null;
      let postTurn = null;
      if (result.continued) {
        postRes = await getResources(page);
        postTurn = await getTurnInfo(page);
      }

      const turnEntry = {
        turn: postTurn?.turn ?? turnsPlayed + 1,
        season: postTurn?.season ?? null,
        year: postTurn?.year ?? null,
        resources: postRes,
        events: result.events.slice(0, 5),
        choices: result.choices.slice(0, 5),
      };
      if (result.diagnostics) {
        turnEntry.diagnostics = result.diagnostics;
      }
      turnData.push(turnEntry);

      if (!result.continued) {
        finalOutcome = result.outcome;
        if (result.diagnostics) {
          finalDiagnostics = result.diagnostics;
        }
        break;
      }
    } catch (err) {
      errors.push(`Turn ${t + 1}: ${err.message}`);
      // Try to recover
      const canContinue = await page
        .locator('button[aria-label*="Simulate"]')
        .isVisible({ timeout: 2_000 })
        .catch(() => false);
      if (!canContinue) {
        finalOutcome = `crash:${err.message.substring(0, 100)}`;
        break;
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  const payload = {
    runId,
    difficulty,
    strategy,
    turnsPlayed,
    finalOutcome,
    elapsedSeconds: parseFloat(elapsed),
    turnData,
    actionLog,
    errors,
  };

  // Attach top-level diagnostics when the run stopped on a blocking outcome
  // so consumers can inspect the payload without digging into turnData (B-48).
  if (
    finalDiagnostics &&
    (finalOutcome === "sim_button_missing" ||
      finalOutcome === "possible_softlock")
  ) {
    payload.diagnostics = finalDiagnostics;
  }

  return payload;
}

// ─── Test Runs ──────────────────────────────────────────────────────

// Load or initialize results array
function loadResults() {
  if (existsSync(RESULTS_PATH)) {
    try {
      return JSON.parse(readFileSync(RESULTS_PATH, "utf-8"));
    } catch {
      return [];
    }
  }
  return [];
}

function saveResults(results) {
  writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
}

const PLAYTHROUGHS = [
  { difficulty: "easy", strategy: "passive", label: "Easy/Passive" },
  { difficulty: "easy", strategy: "builder", label: "Easy/Builder" },
  { difficulty: "normal", strategy: "balanced", label: "Normal/Balanced" },
  { difficulty: "normal", strategy: "military", label: "Normal/Military" },
  { difficulty: "hard", strategy: "passive", label: "Hard/Passive" },
  { difficulty: "hard", strategy: "builder", label: "Hard/Builder" },
];

test.describe("Automated Playthroughs", () => {
  // B-53: the six auto-playthrough profiles all hit the same Vite dev server,
  // and running them in parallel saturates it — `page.goto("/")` flakes with
  // `net::ERR_CONNECTION_REFUSED` on 3/6 profiles under default parallelism.
  // Serial mode funnels every playthrough through one worker so the dev
  // server only serves one game at a time. Visual / persona / exploratory
  // specs are unaffected (they live in other projects / directories).
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    // Truncate playthrough-results.json at the start of each run so a fresh
    // invocation starts with an empty array (mirrors persona-qa.spec.js). The
    // end-of-test writes then append to this clean file, keeping cycle-over-
    // cycle analysis free of stale runs. (B-45)
    writeFileSync(RESULTS_PATH, JSON.stringify([], null, 2));

    // B-52: clear stale `autoplay-*.png` diagnostics so the screenshots dir
    // reflects only the current run's outcomes. We match defensively — only
    // files whose basename matches `^autoplay-.*\.png$` are unlinked, and
    // the try/catch means a missing dir, permission issue, or race does not
    // fail the spec. `qa-*.png`, `qa-cycle/`, `game-*-final.png`, and any
    // other artifacts in the folder are left alone.
    try {
      const entries = readdirSync(SCREENSHOT_DIR);
      for (const name of entries) {
        if (/^autoplay-.*\.png$/.test(name)) {
          try {
            unlinkSync(resolve(SCREENSHOT_DIR, name));
          } catch {
            // File may have been removed between readdir and unlink — ok.
          }
        }
      }
    } catch {
      // Screenshot dir doesn't exist yet (fresh clone) — harmless; the first
      // `captureDiagnostics` call will create it.
    }
  });

  for (const run of PLAYTHROUGHS) {
    test(`Full game: ${run.label}`, async ({ page }) => {
      test.setTimeout(300_000); // 5 minutes per run

      const result = await runPlaythrough(
        page,
        run.difficulty,
        run.strategy,
        run.label
      );

      // Append to results file
      const results = loadResults();
      results.push(result);
      saveResults(results);

      // Log summary to console
      console.log(
        `\n=== ${run.label} ===\n` +
          `  Turns: ${result.turnsPlayed}, Outcome: ${result.finalOutcome}\n` +
          `  Time: ${result.elapsedSeconds}s, Errors: ${result.errors.length}\n`
      );
    });
  }
});
