/**
 * playwright-playtest.js — Headless Playwright playtest for The Lord's Ledger
 *
 * Launches the actual game in a real browser and plays through multiple full
 * games simulating how a 6th grader would interact with the UI.
 *
 * Usage:
 *   node playwright-playtest.js [numGames]    (default: 6)
 *
 * Requires: Vite dev server running on localhost:5173
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";

const NUM_GAMES = parseInt(process.argv[2], 10) || 6;
const BASE_URL = "http://localhost:5173";
const REPORT_PATH = "report.md";
const DEBUG = process.argv.includes("--debug");

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------
const PERSONAS = [
  { name: "Impulsive Builder", difficulty: "normal", strategy: "build_everything" },
  { name: "War Kid", difficulty: "normal", strategy: "military_focused" },
  { name: "Cautious Explorer", difficulty: "easy", strategy: "explore_all_tabs" },
  { name: "Random Clicker", difficulty: "normal", strategy: "random" },
  { name: "Trader Kid", difficulty: "normal", strategy: "trade_focused" },
  { name: "Speedrunner", difficulty: "hard", strategy: "speedrun" },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function dbg(...args) { if (DEBUG) console.log("  [DBG]", ...args); }

// ---------------------------------------------------------------------------
// Game log
// ---------------------------------------------------------------------------
function createGameLog() {
  return {
    persona: null, difficulty: null,
    turns: [], actions: [], disabledClicks: [],
    consoleErrors: [], consoleWarnings: [],
    uxFriction: [], outcome: null, gameOverReason: null,
    finalMeters: null, totalTime: 0, turnTimes: [],
    tabsVisited: new Set(), eventsEncountered: [],
    eventChoices: [], buildingsBuilt: [], tradesMade: [],
    flipEncountered: false, synergiesUnlocked: [],
  };
}

// ---------------------------------------------------------------------------
// Phase detection — order matters: most specific first
// ---------------------------------------------------------------------------
async function detectPhase(page) {
  const visible = async (text) => {
    try {
      return await page.locator(text).first().isVisible({ timeout: 200 });
    } catch { return false; }
  };

  // Quick check: get all visible button texts for faster matching
  let buttonTexts = [];
  try {
    buttonTexts = await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .filter((b) => b.offsetParent !== null)
        .map((b) => b.textContent.trim())
    );
  } catch { /* skip */ }

  const hasButton = (text) => buttonTexts.some((t) => t.includes(text));

  // Scribe's Note overlay (blocks everything else)
  if (await visible("h4:has-text('Scribe\\'s Note')")) return "scribes_note";

  // Synergy overlays (z-50, blocks game)
  if (hasButton("Continue Your Reign")) return "synergy_overlay";
  if (await visible("text='Tap to dismiss'")) return "synergy_card";
  if (await visible("[role='status']:has-text('Path Unlocked')")) return "synergy_toast";

  // Terminal states
  if (hasButton("Try Again") || hasButton("Reign Again")) {
    if (await visible("text='Chronicle of Ruin'")) return "game_over";
    if (hasButton("Reign Again")) return "victory";
    return "game_over";
  }

  // Raid phases
  if (hasButton("Defend the Estate")) return "raid_warning";
  if (await visible("text='Raid Outcome'")) return "raid_result";

  // Flip phases
  if (hasButton("Return to Your Reign")) return "flip_summary";
  if (hasButton("See the Consequences")) return "flip_outcome_last";
  if (await visible("text=/Decision \\d+ of \\d+/") || await visible("[aria-label='Choose your path']") || await visible("[aria-label='Choose your response']")) return "flip_decision";
  if (hasButton("Begin")) return "flip_intro";

  // Events
  if (await visible("text='Seasonal Decision'")) return "seasonal_action";
  if (await visible("text='An Event Unfolds'")) return "random_event";
  if (hasButton("See What Happens Next")) return "seasonal_resolve";
  if (hasButton("See Your Legacy")) return "random_resolve_final";

  // Management (Simulate Season button is the definitive marker)
  if (hasButton("Simulate Season")) return "management";

  // Resolve with generic Continue (after random event, flip outcome)
  if (hasButton("Continue")) return "resolve_generic";

  // Title screen
  if (await visible("text='Choose Your Challenge'")) return "title";

  return "unknown";
}

async function scrapeMeters(page) {
  const meters = {};
  // The game uses concrete resources displayed in the Dashboard header.
  // Each resource has a label ("Denarii", "Food", "Families", "Garrison", "Morale")
  // and a numeric value rendered in a span.text-2xl sibling.
  for (const [label, key] of [["Denarii", "denarii"], ["Food", "food"], ["Families", "population"], ["Garrison", "garrison"], ["Morale", "morale"]]) {
    try {
      const val = await page.evaluate((lbl) => {
        const spans = [...document.querySelectorAll("span")];
        const labelSpan = spans.find((s) => s.textContent.trim() === lbl);
        if (!labelSpan) return null;
        // Walk up to the stat container and find the text-2xl value span
        const container = labelSpan.closest("div.flex.flex-col") || labelSpan.parentElement?.parentElement;
        if (!container) return null;
        const valueSpan = container.querySelector(".text-2xl");
        if (!valueSpan) return null;
        const text = valueSpan.textContent.replace(/[^0-9.-]/g, "");
        return text ? parseInt(text, 10) : null;
      }, label);
      meters[key] = val;
    } catch { /* skip */ }
  }
  return meters;
}

async function scrapeTurn(page) {
  try {
    const el = page.locator("text=/Turn \\d+\\/40/").first();
    const text = await el.textContent({ timeout: 300 });
    const match = text.match(/Turn (\d+)\/40/);
    return match ? parseInt(match[1], 10) : null;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Universal overlay dismissers
// ---------------------------------------------------------------------------
async function dismissOverlays(page, log) {
  for (let i = 0; i < 15; i++) {
    // Tutorial popup — "I Understand" button in a fixed overlay
    const tutorialBtn = page.locator("button:has-text('I Understand')").first();
    if (await tutorialBtn.isVisible({ timeout: 200 }).catch(() => false)) {
      try {
        await tutorialBtn.click({ timeout: 1500 });
        dbg("Dismissed tutorial popup");
      } catch { /* skip */ }
      await sleep(300);
      continue;
    }

    const phase = await detectPhase(page);

    if (phase === "scribes_note") {
      // Scribe's Note has its own "Continue" button inside a fixed z-50 overlay
      try {
        await page.evaluate(() => {
          const fixed = document.querySelector(".fixed.inset-0.z-50");
          if (fixed) {
            const btn = fixed.querySelector("button");
            if (btn) btn.click();
          }
        });
        dbg("Dismissed Scribe's Note");
      } catch { break; }
      await sleep(300);
      continue;
    }

    if (phase === "synergy_overlay") {
      try {
        await page.locator("button:has-text('Continue Your Reign')").first().click({ timeout: 1500 });
        log.synergiesUnlocked.push("tier3");
        dbg("Dismissed tier3 synergy");
      } catch { break; }
      await sleep(300);
      continue;
    }

    if (phase === "synergy_card") {
      try {
        await page.locator("text='Tap to dismiss'").first().click({ timeout: 1500 });
        log.synergiesUnlocked.push("tier2");
        dbg("Dismissed tier2 synergy");
      } catch { break; }
      await sleep(500);
      continue;
    }

    if (phase === "synergy_toast") {
      log.synergiesUnlocked.push("tier1");
      dbg("Dismissed tier1 synergy (waiting for auto-dismiss)");
      // Tier 1 toasts auto-dismiss after 5s — click to speed up then break
      try {
        await page.locator("[role='status']:has-text('Path Unlocked')").first().click({ timeout: 500 });
      } catch { /* auto-dismisses anyway */ }
      await sleep(600);
      break;
    }

    break; // No overlay detected
  }
}

// ---------------------------------------------------------------------------
// Strategy: Management phase actions
// ---------------------------------------------------------------------------
async function doManagement(page, log, strategy, turn) {
  const t0 = Date.now();

  switch (strategy) {
    case "build_everything": {
      await clickTab(page, log, "Estate");
      await sleep(200);
      // Click every enabled build button
      const btns = page.locator("button[aria-label^='Build ']:not([disabled])");
      const count = await btns.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const btn = btns.nth(i);
        if (await btn.isVisible().catch(() => false) && !(await btn.isDisabled().catch(() => true))) {
          const label = await btn.getAttribute("aria-label").catch(() => "?");
          await btn.click().catch(() => {});
          log.buildingsBuilt.push({ turn, label });
          log.actions.push({ action: "build", description: label, turn });
          await sleep(150);
        }
      }
      break;
    }

    case "military_focused": {
      if (turn < 5) {
        // Build farms early
        await clickTab(page, log, "Estate");
        await sleep(200);
        await tryClick(page, log, "button[aria-label*='Build Strip Farm']", "Build Strip Farm", turn);
      } else {
        await clickTab(page, log, "Military");
        await sleep(200);
        for (let i = 0; i < 3; i++) {
          await tryClick(page, log, "button:has-text('Recruit +5')", "Recruit +5", turn);
          await sleep(100);
        }
        await tryClick(page, log, "button:has-text('Upgrade Castle')", "Upgrade Castle", turn);
        await tryClick(page, log, "button:has-text('Install')", "Install defense", turn);
      }
      break;
    }

    case "explore_all_tabs": {
      const tabs = ["Estate", "People", "Chronicle"];
      if (turn >= 3) tabs.push("Trade");
      if (turn >= 5) tabs.push("Military");
      for (const tab of tabs) {
        await clickTab(page, log, tab);
        await sleep(400);
      }
      // Build one thing
      await clickTab(page, log, "Estate");
      await sleep(200);
      const btns = page.locator("button[aria-label^='Build ']:not([disabled])");
      if (await btns.count().catch(() => 0) > 0) {
        const btn = btns.first();
        if (!(await btn.isDisabled().catch(() => true))) {
          const label = await btn.getAttribute("aria-label").catch(() => "?");
          await btn.click().catch(() => {});
          log.buildingsBuilt.push({ turn, label });
          log.actions.push({ action: "build", description: label, turn });
        }
      }
      // Set low tax
      await clickTab(page, log, "People");
      await sleep(200);
      await tryClick(page, log, "button[aria-label*='Set tax rate to Low']", "Set tax Low", turn);
      break;
    }

    case "random": {
      const tabs = ["Estate", "People"];
      if (turn >= 3) tabs.push("Trade");
      if (turn >= 5) tabs.push("Military");
      const tab = pick(tabs);
      await clickTab(page, log, tab);
      await sleep(300);

      if (tab === "Estate") {
        const btns = page.locator("button[aria-label^='Build ']:not([disabled])");
        const count = await btns.count().catch(() => 0);
        if (count > 0) {
          const btn = btns.nth(Math.floor(Math.random() * count));
          if (!(await btn.isDisabled().catch(() => true))) {
            const label = await btn.getAttribute("aria-label").catch(() => "?");
            await btn.click().catch(() => {});
            log.buildingsBuilt.push({ turn, label });
          }
        }
      } else if (tab === "Trade") {
        const sellBtns = page.locator("button[aria-label^='Sell']:not([disabled])");
        const buyBtns = page.locator("button[aria-label^='Buy']:not([disabled])");
        if (Math.random() > 0.5) {
          const count = await sellBtns.count().catch(() => 0);
          if (count > 0) {
            const btn = sellBtns.nth(Math.floor(Math.random() * count));
            const label = await btn.getAttribute("aria-label").catch(() => "sell");
            await btn.click().catch(() => {});
            log.tradesMade.push({ type: "sell", turn, label });
          }
        } else {
          const count = await buyBtns.count().catch(() => 0);
          if (count > 0) {
            const btn = buyBtns.nth(Math.floor(Math.random() * count));
            const label = await btn.getAttribute("aria-label").catch(() => "buy");
            await btn.click().catch(() => {});
            log.tradesMade.push({ type: "buy", turn, label });
          }
        }
      } else if (tab === "People") {
        const rate = pick(["Low", "Medium", "High"]);
        await tryClick(page, log, `button[aria-label*='Set tax rate to ${rate}']`, `Tax ${rate}`, turn);
      } else if (tab === "Military") {
        await tryClick(page, log, "button:has-text('Recruit +1')", "Recruit +1", turn);
      }
      break;
    }

    case "trade_focused": {
      if (turn <= 3) {
        await clickTab(page, log, "Estate");
        await sleep(200);
        const btns = page.locator("button[aria-label^='Build ']:not([disabled])");
        const count = Math.min(await btns.count().catch(() => 0), 2);
        for (let i = 0; i < count; i++) {
          const btn = btns.nth(i);
          if (!(await btn.isDisabled().catch(() => true))) {
            const label = await btn.getAttribute("aria-label").catch(() => "?");
            await btn.click().catch(() => {});
            log.buildingsBuilt.push({ turn, label });
            await sleep(150);
          }
        }
      }
      if (turn >= 3) {
        await clickTab(page, log, "Trade");
        await sleep(200);
        // Sell all sellable goods
        const sellBtns = page.locator("button[aria-label^='Sell all']:not([disabled])");
        const sCount = await sellBtns.count().catch(() => 0);
        for (let i = 0; i < sCount; i++) {
          const btn = sellBtns.nth(i);
          if (!(await btn.isDisabled().catch(() => true))) {
            const label = await btn.getAttribute("aria-label").catch(() => "sell");
            await btn.click().catch(() => {});
            log.tradesMade.push({ type: "sell", turn, label });
            await sleep(100);
          }
        }
        // Buy useful goods
        for (const item of ["Salt", "Tools", "Spices"]) {
          await tryClick(page, log, `button[aria-label*='Buy 1 ${item}']`, `Buy ${item}`, turn);
          await sleep(100);
        }
      }
      break;
    }

    case "speedrun":
      // Do nothing, just simulate
      break;
  }

  log.turnTimes.push(Date.now() - t0);
}

async function clickTab(page, log, tabName) {
  try {
    const btn = page.locator(`button[aria-label*='${tabName} tab']`).first();
    if (await btn.isVisible({ timeout: 300 }).catch(() => false) && !(await btn.isDisabled().catch(() => true))) {
      await btn.click({ timeout: 1000 });
      log.tabsVisited.add(tabName.toLowerCase());
      await sleep(200);
      // Dismiss tutorial popup that appears on the newly opened tab
      const tutorialBtn = page.locator("button:has-text('I Understand')").first();
      if (await tutorialBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await tutorialBtn.click({ timeout: 1000 }).catch(() => {});
        await sleep(200);
      }
    }
  } catch { /* skip */ }
}

async function tryClick(page, log, selector, description, turn) {
  try {
    const btn = page.locator(selector).first();
    if (await btn.isVisible({ timeout: 300 }).catch(() => false) && !(await btn.isDisabled().catch(() => true))) {
      await btn.click({ timeout: 1000 });
      log.actions.push({ action: "click", description, turn });
      return true;
    } else {
      const disabled = await btn.isDisabled().catch(() => false);
      if (disabled) log.disabledClicks.push({ selector, description, turn });
    }
  } catch { /* skip */ }
  return false;
}

// ---------------------------------------------------------------------------
// UX analysis at each management turn
// ---------------------------------------------------------------------------
async function analyzeUX(page, log, turn) {
  // Disabled builds
  try {
    const disabled = page.locator("button[aria-label^='Build '][disabled]");
    const count = await disabled.count().catch(() => 0);
    if (count > 0) {
      const reasons = [];
      for (let i = 0; i < Math.min(count, 5); i++) {
        const title = await disabled.nth(i).getAttribute("title").catch(() => null);
        if (title) reasons.push(title);
      }
      if (reasons.length > 0) {
        log.uxFriction.push({ type: "disabled_builds", turn, count, reasons: [...new Set(reasons)] });
      }
    }
  } catch { /* skip */ }

  // Critical resources
  const meters = await scrapeMeters(page);
  if (meters.denarii !== null && meters.denarii <= 0) log.uxFriction.push({ type: "meter_critical_low", turn, meter: "denarii", value: meters.denarii });
  if (meters.food !== null && meters.food <= 0) log.uxFriction.push({ type: "meter_critical_low", turn, meter: "food", value: meters.food });
  if (meters.population !== null && meters.population <= 3) log.uxFriction.push({ type: "meter_critical_low", turn, meter: "population", value: meters.population });
  if (meters.morale !== null && meters.morale <= 20) log.uxFriction.push({ type: "meter_critical_low", turn, meter: "morale", value: meters.morale });

  // Locked tabs
  try {
    const locked = page.locator("button[aria-label*='locked']");
    const count = await locked.count().catch(() => 0);
    if (count > 0) log.uxFriction.push({ type: "locked_tabs_visible", turn, count });
  } catch { /* skip */ }
}

// ---------------------------------------------------------------------------
// Play a full game
// ---------------------------------------------------------------------------
async function playGame(page, persona, idx) {
  const log = createGameLog();
  log.persona = persona.name;
  log.difficulty = persona.difficulty;
  const t0 = Date.now();

  console.log(`  Game ${idx + 1}: ${persona.name} (${persona.difficulty})...`);

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(500);

  // Start game
  const diffLabel = persona.difficulty.charAt(0).toUpperCase() + persona.difficulty.slice(1);
  try {
    await page.locator(`button:has-text('${diffLabel}')`).first().click({ timeout: 3000 });
    log.actions.push({ action: "start_game", description: diffLabel });
  } catch (e) {
    log.uxFriction.push({ type: "start_failed", error: e.message });
    log.totalTime = Date.now() - t0;
    return log;
  }

  await sleep(600);

  let lastTurn = 0;
  let stuckCount = 0;
  const gameTimeout = 300000; // 300s per game max

  for (let iter = 0; iter < 400; iter++) {
    if (Date.now() - t0 > gameTimeout) {
      log.uxFriction.push({ type: "game_timeout" });
      break;
    }
    // Always dismiss overlays first
    await dismissOverlays(page, log);

    const phase = await detectPhase(page);
    dbg(`iter=${iter} phase=${phase}`);

    // Overlay phases — handle directly in main loop too
    if (phase === "scribes_note") {
      stuckCount = 0;
      try {
        // Click the Continue button inside the scribe's note fixed overlay
        // Use evaluate to find the correct button in the z-50 overlay
        const clicked = await page.evaluate(() => {
          const fixed = document.querySelector(".fixed.inset-0.z-50");
          if (fixed) {
            const btn = fixed.querySelector("button");
            if (btn) { btn.click(); return true; }
          }
          // Fallback: click any Continue button
          const btns = [...document.querySelectorAll("button")].filter(b => b.textContent.trim() === "Continue");
          if (btns.length > 0) { btns[btns.length - 1].click(); return true; }
          return false;
        });
        dbg("Dismissed Scribe's Note (main loop), clicked=" + clicked);
      } catch { /* skip */ }
      await sleep(300);
      continue;
    }
    if (phase === "synergy_overlay" || phase === "synergy_card" || phase === "synergy_toast") {
      stuckCount = 0;
      await dismissOverlays(page, log);
      await sleep(300);
      continue;
    }

    // Terminal states
    if (phase === "game_over") {
      log.outcome = "game_over";
      try {
        // Scrape the data-gameover-reason attribute from GameOverScreen
        const reasonAttr = await page.locator("[data-gameover-reason]").first().getAttribute("data-gameover-reason", { timeout: 1000 });
        const title = await page.locator("h2").first().textContent({ timeout: 1000 });
        log.gameOverReason = reasonAttr ? `${reasonAttr} — ${title}` : title;
      } catch { log.gameOverReason = "Unknown"; }
      log.finalMeters = await scrapeMeters(page);
      break;
    }
    if (phase === "victory") {
      log.outcome = "victory";
      log.finalMeters = await scrapeMeters(page);
      break;
    }

    // Management phase
    if (phase === "management") {
      stuckCount = 0;
      const turn = await scrapeTurn(page);
      if (turn && turn !== lastTurn) {
        lastTurn = turn;
        const meters = await scrapeMeters(page);
        log.turns.push({ turn, meters });
      }

      await doManagement(page, log, persona.strategy, lastTurn);
      await analyzeUX(page, log, lastTurn);

      // Click Simulate Season
      try {
        await page.locator("button:has-text('Simulate Season')").first().click({ timeout: 2000 });
        log.actions.push({ action: "simulate_season", turn: lastTurn });
      } catch {
        log.uxFriction.push({ type: "simulate_button_missing", turn: lastTurn });
        break;
      }
      await sleep(400);
      continue;
    }

    // Seasonal event
    if (phase === "seasonal_action" || phase === "random_event") {
      stuckCount = 0;
      try {
        const title = await page.locator("h3").first().textContent({ timeout: 1000 });
        log.eventsEncountered.push(title);

        const options = page.locator("[role='group'] button");
        const count = await options.count();
        if (count > 0) {
          const idx = persona.strategy === "random"
            ? Math.floor(Math.random() * count)
            : (Math.random() > 0.7 ? Math.min(1, count - 1) : 0);
          const btn = options.nth(idx);
          const text = await btn.textContent().catch(() => "?");
          // Scroll the option into view to clear the sticky dashboard
          await btn.scrollIntoViewIfNeeded().catch(() => {});
          await sleep(100);
          await btn.click({ timeout: 2000 });
          log.eventChoices.push({ event: title, choice: text.slice(0, 80), phase });
        }
      } catch { /* skip */ }
      await sleep(300);
      continue;
    }

    // Resolve phases
    if (phase === "seasonal_resolve") {
      stuckCount = 0;
      try { await page.locator("button:has-text('See What Happens Next')").first().click({ timeout: 2000 }); }
      catch { /* skip */ }
      await sleep(300);
      continue;
    }
    if (phase === "random_resolve_final") {
      stuckCount = 0;
      try { await page.locator("button:has-text('See Your Legacy')").first().click({ timeout: 2000 }); }
      catch { /* skip */ }
      await sleep(300);
      continue;
    }
    if (phase === "resolve_generic") {
      stuckCount = 0;
      try { await page.locator("button:has-text('Continue')").first().click({ timeout: 2000 }); }
      catch { /* skip */ }
      await sleep(300);
      continue;
    }

    // Raid phases
    if (phase === "raid_warning") {
      stuckCount = 0;
      try { await page.locator("button:has-text('Defend the Estate')").first().click({ timeout: 2000 }); }
      catch { /* skip */ }
      await sleep(300);
      continue;
    }
    if (phase === "raid_result") {
      stuckCount = 0;
      // Raid result has a Continue button
      try { await page.locator("button:has-text('Continue')").first().click({ timeout: 2000 }); }
      catch { /* skip */ }
      await sleep(300);
      continue;
    }

    // Flip phases
    if (phase === "flip_intro") {
      stuckCount = 0;
      log.flipEncountered = true;
      try { await page.locator("button:has-text('Begin')").first().click({ timeout: 2000 }); }
      catch { /* skip */ }
      await sleep(300);
      continue;
    }
    if (phase === "flip_decision") {
      stuckCount = 0;
      try {
        const options = page.locator("[role='group'] button");
        const count = await options.count();
        if (count > 0) {
          const idx = persona.strategy === "random" ? Math.floor(Math.random() * count) : 0;
          const btn = options.nth(Math.min(idx, count - 1));
          await btn.scrollIntoViewIfNeeded().catch(() => {});
          await sleep(100);
          await btn.click({ timeout: 2000 });
        }
      } catch { /* skip */ }
      await sleep(300);
      continue;
    }
    if (phase === "flip_outcome_last") {
      stuckCount = 0;
      try { await page.locator("button:has-text('See the Consequences')").first().click({ timeout: 2000 }); }
      catch { /* skip */ }
      await sleep(300);
      continue;
    }
    if (phase === "flip_summary") {
      stuckCount = 0;
      try { await page.locator("button:has-text('Return to Your Reign')").first().click({ timeout: 2000 }); }
      catch { /* skip */ }
      await sleep(300);
      continue;
    }

    // Flip outcome (not last — has a generic Continue)
    // Check for flip outcome with Success!/failure text
    {
      const successVisible = await page.locator("text='Success!'").first().isVisible({ timeout: 150 }).catch(() => false);
      const failVisible = await page.locator("text=/Things didn/").first().isVisible({ timeout: 150 }).catch(() => false);
      if (successVisible || failVisible) {
        stuckCount = 0;
        try { await page.locator("button:has-text('Continue')").first().click({ timeout: 2000 }); }
        catch { /* skip */ }
        await sleep(300);
        continue;
      }
    }

    // Unknown phase — try recovery by clicking any visible overlay button
    stuckCount++;
    dbg(`stuck count = ${stuckCount}`);
    if (stuckCount > 20) {
      log.uxFriction.push({ type: "completely_stuck", phase });
      break;
    }
    // Try clicking any overlay button as last resort
    try {
      const clicked = await page.evaluate(() => {
        // Try fixed overlays first
        const fixed = document.querySelector(".fixed.inset-0");
        if (fixed) {
          const btn = fixed.querySelector("button");
          if (btn) { btn.click(); return "overlay"; }
        }
        // Try event option buttons (scroll into view first)
        const roleGroup = document.querySelector("[role='group']");
        if (roleGroup) {
          const btn = roleGroup.querySelector("button");
          if (btn) { btn.scrollIntoView({ block: "center" }); btn.click(); return "event-option:" + btn.textContent.trim().substring(0, 30); }
        }
        // Try any visible button with action-like text
        const btns = [...document.querySelectorAll("button")].filter(b => b.offsetParent !== null);
        const actionBtn = btns.find(b => /continue|begin|accept|dismiss|ok|close|proceed|done|return/i.test(b.textContent));
        if (actionBtn) { actionBtn.click(); return actionBtn.textContent.trim().substring(0, 30); }
        return null;
      });
      if (clicked) dbg(`Recovery click: ${clicked}`);
    } catch { /* skip */ }
    await sleep(500);
  }

  log.totalTime = Date.now() - t0;

  // Final screenshot
  try {
    await page.screenshot({ path: `playtest-screenshots/game-${idx + 1}-final.png`, fullPage: true });
  } catch { /* skip */ }

  return log;
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------
function generateReport(allLogs) {
  const lines = [];
  const now = new Date().toISOString().split("T")[0];

  lines.push("# The Lord's Ledger — Playwright Playtest Report");
  lines.push(`> Generated: ${now} | Games: ${allLogs.length} | Method: Headless Playwright + 6th-grader personas`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Executive Summary
  lines.push("## Executive Summary");
  lines.push("");

  const wins = allLogs.filter((l) => l.outcome === "victory").length;
  const losses = allLogs.filter((l) => l.outcome === "game_over").length;
  const stuck = allLogs.filter((l) => !l.outcome).length;
  const gamesWithTurns = allLogs.filter((l) => l.turns.length > 0);
  const avgTurns = gamesWithTurns.length > 0
    ? gamesWithTurns.reduce((s, l) => s + l.turns.length, 0) / gamesWithTurns.length : 0;
  const avgTime = allLogs.length > 0
    ? (allLogs.reduce((s, l) => s + l.totalTime, 0) / allLogs.length / 1000).toFixed(1) : "0";

  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push(`| Total games | ${allLogs.length} |`);
  lines.push(`| Victories | ${wins} (${Math.round(wins / Math.max(allLogs.length, 1) * 100)}%) |`);
  lines.push(`| Game Overs | ${losses} (${Math.round(losses / Math.max(allLogs.length, 1) * 100)}%) |`);
  lines.push(`| Stuck/Crashed | ${stuck} |`);
  lines.push(`| Avg turns survived | ${avgTurns.toFixed(1)}/40 |`);
  lines.push(`| Avg playthrough time | ${avgTime}s |`);
  lines.push("");

  // Per-Persona Results
  lines.push("## Per-Persona Results");
  lines.push("");
  lines.push("| Persona | Difficulty | Outcome | Turns | Buildings | Trades | Flips | Synergies | Time |");
  lines.push("|---------|-----------|---------|-------|-----------|--------|-------|-----------|------|");

  for (const log of allLogs) {
    const turns = log.turns.length;
    const buildings = log.buildingsBuilt.length;
    const trades = log.tradesMade.length;
    const flips = log.flipEncountered ? "Yes" : "No";
    const synergies = log.synergiesUnlocked.length;
    const time = (log.totalTime / 1000).toFixed(1) + "s";
    const outcome = log.outcome === "victory" ? "WIN"
      : log.outcome === "game_over" ? `LOSS` : "STUCK";
    lines.push(`| ${log.persona} | ${log.difficulty} | ${outcome} | ${turns} | ${buildings} | ${trades} | ${flips} | ${synergies} | ${time} |`);
  }
  lines.push("");

  // Game Over Analysis
  const gameOvers = allLogs.filter((l) => l.outcome === "game_over");
  if (gameOvers.length > 0) {
    lines.push("## Game Over Analysis");
    lines.push("");
    lines.push("### Death Causes");
    lines.push("");
    const causes = {};
    for (const l of gameOvers) {
      const reason = l.gameOverReason || "Unknown";
      causes[reason] = (causes[reason] || 0) + 1;
    }
    for (const [cause, count] of Object.entries(causes).sort((a, b) => b[1] - a[1])) {
      lines.push(`- **${cause}**: ${count}x`);
    }
    lines.push("");

    lines.push("### Death Details");
    lines.push("");
    for (const l of gameOvers) {
      const m = l.finalMeters || {};
      lines.push(`- **${l.persona}** (${l.difficulty}): Died at turn ${l.turns.length}`);
      lines.push(`  - Reason: ${l.gameOverReason || "?"}`);
      lines.push(`  - Final resources: Denarii:${m.denarii ?? "?"} Food:${m.food ?? "?"} Pop:${m.population ?? "?"} Garrison:${m.garrison ?? "?"} Morale:${m.morale ?? "?"}`);
    }
    lines.push("");
  }

  // Victory Analysis
  const victories = allLogs.filter((l) => l.outcome === "victory");
  if (victories.length > 0) {
    lines.push("## Victory Analysis");
    lines.push("");
    for (const l of victories) {
      const m = l.finalMeters || {};
      lines.push(`- **${l.persona}** (${l.difficulty}): Won at turn ${l.turns.length}`);
      lines.push(`  - Final resources: Denarii:${m.denarii ?? "?"} Food:${m.food ?? "?"} Pop:${m.population ?? "?"} Garrison:${m.garrison ?? "?"} Morale:${m.morale ?? "?"}`);
      lines.push(`  - Buildings built: ${l.buildingsBuilt.length}, Trades: ${l.tradesMade.length}`);
    }
    lines.push("");
  }

  // UX Friction Points
  lines.push("## UX Friction Points");
  lines.push("");
  lines.push("Moments where a 6th grader would get confused, frustrated, or stuck.");
  lines.push("");

  const frictionByType = {};
  for (const log of allLogs) {
    for (const f of log.uxFriction) {
      frictionByType[f.type] = frictionByType[f.type] || [];
      frictionByType[f.type].push({ persona: log.persona, ...f });
    }
  }

  const frictionLabels = {
    disabled_builds: "Disabled Build Buttons (\"Why can't I build?\")",
    zero_food: "Zero Food Warning",
    zero_denarii: "Zero Gold (stuck, can't do anything)",
    locked_tabs_visible: "Locked Tabs Visible (\"What's that?\")",
    meter_critical_low: "Meter Critically Low (danger zone)",
    meter_critical_high: "Meter Critically High (danger zone)",
    simulate_button_missing: "Simulate Season Button Missing",
    completely_stuck: "Player Completely Stuck",
    start_failed: "Game Failed to Start",
  };

  if (Object.keys(frictionByType).length === 0) {
    lines.push("No friction points detected.");
  } else {
    for (const [type, instances] of Object.entries(frictionByType).sort((a, b) => b[1].length - a[1].length)) {
      const label = frictionLabels[type] || type;
      lines.push(`### ${label}`);
      lines.push(`- **Occurrences**: ${instances.length}`);
      lines.push(`- **Personas affected**: ${[...new Set(instances.map((i) => i.persona))].join(", ")}`);

      if (type === "disabled_builds") {
        const allReasons = instances.flatMap((i) => i.reasons || []);
        const reasonCounts = {};
        for (const r of allReasons) reasonCounts[r] = (reasonCounts[r] || 0) + 1;
        if (Object.keys(reasonCounts).length > 0) {
          lines.push("- **Reasons shown**:");
          for (const [reason, count] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
            lines.push(`  - "${reason}": ${count}x`);
          }
        }
      }

      if (type === "meter_critical_low" || type === "meter_critical_high") {
        const meterCounts = {};
        for (const i of instances) meterCounts[i.meter] = (meterCounts[i.meter] || 0) + 1;
        lines.push("- **Meters affected**:");
        for (const [meter, count] of Object.entries(meterCounts).sort((a, b) => b[1] - a[1])) {
          lines.push(`  - ${meter}: ${count}x`);
        }
      }
      lines.push("");
    }
  }

  // Console Errors
  const allErrors = allLogs.flatMap((l) => l.consoleErrors);
  if (allErrors.length > 0) {
    lines.push("## Console Errors");
    lines.push("");
    const unique = [...new Set(allErrors)];
    for (const err of unique.slice(0, 20)) {
      lines.push(`- \`${err.slice(0, 200)}\``);
    }
    lines.push("");
  }

  // Event & Decision Analysis
  lines.push("## Event & Decision Analysis");
  lines.push("");
  const eventCounts = {};
  for (const log of allLogs) {
    for (const e of log.eventsEncountered) eventCounts[e] = (eventCounts[e] || 0) + 1;
  }

  lines.push("### Events Encountered");
  lines.push("");
  if (Object.keys(eventCounts).length === 0) {
    lines.push("No events were encountered (games may have ended before events fired).");
  } else {
    for (const [event, count] of Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      lines.push(`- **${event}**: ${count}x`);
    }
  }
  lines.push("");

  const allChoices = allLogs.flatMap((l) => l.eventChoices);
  if (allChoices.length > 0) {
    lines.push("### Choices Made");
    lines.push("");
    lines.push("| Event | Choice | Phase |");
    lines.push("|-------|--------|-------|");
    for (const c of allChoices.slice(0, 40)) {
      lines.push(`| ${(c.event || "?").slice(0, 40)} | ${(c.choice || "?").slice(0, 50)} | ${c.phase} |`);
    }
    lines.push("");
  }

  // Building Activity
  lines.push("## Building Activity");
  lines.push("");
  const buildCounts = {};
  for (const log of allLogs) {
    for (const b of log.buildingsBuilt) buildCounts[b.label] = (buildCounts[b.label] || 0) + 1;
  }
  if (Object.keys(buildCounts).length === 0) {
    lines.push("No buildings were constructed across all playthroughs.");
  } else {
    lines.push("| Building | Times Built |");
    lines.push("|----------|-------------|");
    for (const [b, count] of Object.entries(buildCounts).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${b} | ${count} |`);
    }
  }
  lines.push("");

  // Tab Usage
  lines.push("## Tab Usage");
  lines.push("");
  const tabUsage = { estate: 0, trade: 0, military: 0, people: 0, chronicle: 0 };
  for (const log of allLogs) {
    for (const tab of log.tabsVisited) tabUsage[tab] = (tabUsage[tab] || 0) + 1;
  }
  lines.push("| Tab | Games Used |");
  lines.push("|-----|------------|");
  for (const [tab, count] of Object.entries(tabUsage).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${tab.charAt(0).toUpperCase() + tab.slice(1)} | ${count}/${allLogs.length} |`);
  }
  lines.push("");

  // Meter Trajectories
  lines.push("## Meter Trajectories");
  lines.push("");
  for (const log of allLogs) {
    if (log.turns.length === 0) continue;
    lines.push(`### ${log.persona} (${log.difficulty})`);
    lines.push("");
    lines.push("| Turn | Denarii | Food | Population | Garrison | Morale |");
    lines.push("|------|---------|------|------------|----------|--------|");
    for (const t of log.turns) {
      const m = t.meters;
      lines.push(`| ${t.turn} | ${m.denarii ?? "-"} | ${m.food ?? "-"} | ${m.population ?? "-"} | ${m.garrison ?? "-"} | ${m.morale ?? "-"} |`);
    }
    lines.push("");
  }

  // Recommendations
  lines.push("## Recommendations for Gameplay Fixes & Additions");
  lines.push("");
  lines.push("Based on the playtest data, here are prioritized suggestions:");
  lines.push("");

  const recs = [];

  if ((frictionByType.disabled_builds?.length || 0) > 3) {
    recs.push({ p: "HIGH", cat: "UX", title: "Improve build button feedback",
      detail: "Disabled build buttons show cryptic reasons. Add clearer messages: \"You need X more denarii\" or \"Build Y first\". A tooltip explaining exactly what's missing would help 6th graders." });
  }

  if (wins === 0) {
    recs.push({ p: "HIGH", cat: "Balance", title: "Win rate is 0% — game is too hard for 6th graders",
      detail: "No persona achieved victory. Consider: (1) reduce event penalties on Easy, (2) increase starting resources, (3) add safety nets like emergency loans, (4) slower meter decay in early turns." });
  } else if (wins / allLogs.length < 0.3) {
    recs.push({ p: "MEDIUM", cat: "Balance", title: "Low win rate for target audience",
      detail: `Only ${Math.round(wins / allLogs.length * 100)}% won. Consider gentler penalties or a "story mode".` });
  }

  if (avgTurns < 10) {
    recs.push({ p: "HIGH", cat: "Balance", title: "Games ending too early",
      detail: `Average survival is ${avgTurns.toFixed(1)} turns. Players never see late-game content. Consider slower meter decay in early turns or a grace period.` });
  }

  const critLow = frictionByType.meter_critical_low?.length || 0;
  const critHigh = frictionByType.meter_critical_high?.length || 0;
  if (critLow + critHigh > 5) {
    recs.push({ p: "MEDIUM", cat: "UX", title: "Better meter danger warnings",
      detail: "Meters hit critical zones without guidance. Add contextual hints: \"Your faith is low! Donate to the Church or buy spices on Trade tab.\"" });
  }

  if ((frictionByType.locked_tabs_visible?.length || 0) > 0) {
    recs.push({ p: "LOW", cat: "UX", title: "Locked tab clarity",
      detail: "Locked tabs show grayed out but don't explain when they unlock. Add \"Unlocks on Turn 3\" tooltip." });
  }

  for (const [tab, count] of Object.entries(tabUsage)) {
    if (count === 0 && tab !== "chronicle") {
      recs.push({ p: "MEDIUM", cat: "Engagement", title: `${tab.charAt(0).toUpperCase() + tab.slice(1)} tab never used`,
        detail: `No persona visited the ${tab} tab. Consider: tutorial prompt directing there, auto-switching when it unlocks, or making it visually prominent.` });
    }
  }

  if (allLogs.every((l) => !l.flipEncountered)) {
    recs.push({ p: "MEDIUM", cat: "Engagement", title: "Perspective flips never triggered",
      detail: "No game reached a perspective flip. Either conditions are too strict or games end too early. Consider lowering trigger requirements." });
  }

  recs.push({ p: "MEDIUM", cat: "UX", title: "Add contextual \"What should I do?\" hints",
    detail: "6th graders need guidance. A hint button per tab (\"Try building a Strip Farm!\") would reduce confusion." });

  recs.push({ p: "LOW", cat: "Engagement", title: "Add achievements/milestones",
    detail: "Badges like \"First Trade!\", \"Castle Upgraded!\", \"Survived 14 Turns!\" give tangible goals and dopamine hits." });

  recs.push({ p: "LOW", cat: "UX", title: "Add undo/confirmation for costly actions",
    detail: "Kids misclick. Confirm expensive purchases (>200d) or irreversible actions (demolish)." });

  recs.push({ p: "MEDIUM", cat: "Engagement", title: "Add a \"quick tips\" loading screen between seasons",
    detail: "Show tips like \"Sell goods on the Trade tab to earn more denarii!\" during the season transition." });

  recs.push({ p: "LOW", cat: "Balance", title: "Consider an auto-save / checkpoint system",
    detail: "If a game-over feels unfair, let kids rewind 1-2 turns. Reduces frustration without removing consequences." });

  for (const rec of recs.sort((a, b) => {
    const p = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (p[a.p] ?? 3) - (p[b.p] ?? 3);
  })) {
    lines.push(`### [${rec.p}] ${rec.cat}: ${rec.title}`);
    lines.push("");
    lines.push(rec.detail);
    lines.push("");
  }

  // Appendix
  lines.push("## Appendix: Action Log Summary");
  lines.push("");
  for (const log of allLogs) {
    lines.push(`### ${log.persona}`);
    lines.push(`- Total actions: ${log.actions.length}`);
    lines.push(`- Buildings built: ${log.buildingsBuilt.length}`);
    lines.push(`- Trades made: ${log.tradesMade.length}`);
    lines.push(`- Events faced: ${log.eventsEncountered.length}`);
    lines.push(`- Friction points: ${log.uxFriction.length}`);
    lines.push(`- Console errors: ${log.consoleErrors.length}`);
    lines.push(`- Disabled clicks: ${log.disabledClicks.length}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n=== The Lord's Ledger — Playwright Playtest ===`);
  console.log(`Running ${NUM_GAMES} games with 6th-grader personas...\n`);

  try { mkdirSync("playtest-screenshots", { recursive: true }); } catch { /* ok */ }

  const browser = await chromium.launch({ headless: true });
  const allLogs = [];

  for (let i = 0; i < NUM_GAMES; i++) {
    const persona = PERSONAS[i % PERSONAS.length];
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    const consoleLogs = { errors: [], warnings: [] };
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleLogs.errors.push(msg.text());
      if (msg.type() === "warning") consoleLogs.warnings.push(msg.text());
    });
    page.on("pageerror", (err) => consoleLogs.errors.push(err.message));

    try {
      const log = await playGame(page, persona, i);
      log.consoleErrors = [...log.consoleErrors, ...consoleLogs.errors];
      log.consoleWarnings = [...log.consoleWarnings, ...consoleLogs.warnings];
      log.tabsVisited = [...log.tabsVisited];
      allLogs.push(log);

      const icon = log.outcome === "victory" ? "WIN" : log.outcome === "game_over" ? "LOSS" : "???";
      console.log(`    ${icon} — ${log.persona}: ${log.turns.length} turns, ${log.actions.length} actions, ${log.uxFriction.length} friction pts`);
    } catch (err) {
      console.error(`    ERROR — ${persona.name}: ${err.message}`);
      allLogs.push({
        ...createGameLog(), persona: persona.name, difficulty: persona.difficulty,
        consoleErrors: [`Fatal: ${err.message}`],
        uxFriction: [{ type: "fatal_error", error: err.message }],
        tabsVisited: [],
      });
    }

    await context.close();
  }

  await browser.close();

  const report = generateReport(allLogs);
  writeFileSync(REPORT_PATH, report);
  console.log(`\nReport written to ${REPORT_PATH}`);
  console.log(`Screenshots saved to playtest-screenshots/\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
