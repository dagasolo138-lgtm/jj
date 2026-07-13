/**
 * Persona QA — Noob, Avg Gamer, Goat Gamer.
 *
 * Each persona plays 8 turns max, logs console errors, captures one
 * screenshot at end-of-run. Bug findings are appended to
 * `qa-findings.json` at the repo root for review.
 */

import { test, expect } from "@playwright/test";
import { startGame, dismissOverlay, playOneTurn } from "../helpers.js";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";

const FINDINGS_PATH = resolve(import.meta.dirname, "..", "..", "..", "qa-findings.json");
const SUMMARY_PATH = resolve(import.meta.dirname, "..", "..", "..", "qa-summary.json");
const SHOT_DIR = resolve(import.meta.dirname, "..", "..", "..", "playtest-screenshots");
const RUN_START = Date.now();

function record(finding) {
  let out = [];
  if (existsSync(FINDINGS_PATH)) {
    try { out = JSON.parse(readFileSync(FINDINGS_PATH, "utf8")); } catch { /* empty */ }
  }
  out.push({ ts: new Date().toISOString(), ...finding });
  writeFileSync(FINDINGS_PATH, JSON.stringify(out, null, 2));
}

// Network/transport noise from the sandboxed CDN (TLS, DNS, connection refused,
// etc.) is not an app-level error and should not count toward the pageerror
// budget or pollute qa-findings.json.
function isNetworkNoise(text) {
  if (!text) return false;
  return (
    text.includes("ERR_CERT_AUTHORITY_INVALID") ||
    text.includes("net::ERR_") ||
    /Failed to load resource:.*net::/.test(text)
  );
}

// Capture a lightweight snapshot of the current page state so reviewers can
// distinguish a real softlock from a harness timeout (B-58/B-59). We grab
// the first 400 chars of body text plus up to 20 visible button labels;
// errors are swallowed because this runs on the unhappy path.
async function captureStateSnapshot(page) {
  try {
    const innerText = await page.evaluate(() => document.body.innerText.slice(0, 400));
    const buttonLabels = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button"))
        .filter(b => b.offsetParent !== null)
        .slice(0, 20)
        .map(b => (b.getAttribute("aria-label") || b.innerText || "").trim().slice(0, 60))
        .filter(Boolean)
    );
    return { innerText, buttonLabels };
  } catch {
    return { innerText: null, buttonLabels: [] };
  }
}

async function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => {
    if (isNetworkNoise(e.message)) return;
    errors.push({ type: "pageerror", msg: e.message });
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isNetworkNoise(text)) return;
    errors.push({ type: "console", msg: text });
  });
  return errors;
}

test.describe("Persona QA", () => {
  // Describe-level cap is 180s so the Avg Gamer test (B-45) can run a full
  // 8-turn Normal-difficulty loop + screenshot without the worker tearing
  // down the context. Noob and Goat still set their own 120s cap inline.
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(() => {
    // Truncate findings at the start of each run so N invocations of this
    // spec yield exactly 3 entries (one per persona) rather than N × 3.
    // The afterAll summary then reflects only the current run's findings.
    writeFileSync(FINDINGS_PATH, JSON.stringify([], null, 2));
  });

  test.afterAll(() => {
    // Build a run-level summary of qa-findings.json so cycles can be compared.
    let findings = [];
    if (existsSync(FINDINGS_PATH)) {
      try { findings = JSON.parse(readFileSync(FINDINGS_PATH, "utf8")); } catch { /* empty */ }
    }
    const byPersona = {};
    const bySeverity = { pageerror: 0, console: 0 };
    let totalBugs = 0;
    for (const f of findings) {
      const p = f.persona || "Unknown";
      byPersona[p] = (byPersona[p] || 0) + 1;
      if (Array.isArray(f.errors)) {
        for (const e of f.errors) {
          if (e.type && bySeverity[e.type] !== undefined) bySeverity[e.type] += 1;
        }
      }
      if (Array.isArray(f.bugs)) totalBugs += f.bugs.length;
    }
    const summary = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - RUN_START,
      totalFindings: findings.length,
      totalBugs,
      byPersona,
      bySeverity,
    };
    writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
  });

  test("Noob — random clicker on easy", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await collectErrors(page);
    await page.goto("/");
    await startGame(page, "easy");
    const bugs = [];

    for (let i = 0; i < 6; i++) {
      // Click every visible tab in random order
      const tabs = ["Estate", "Map", "Market", "Military", "People", "Chapel"];
      const tab = tabs[Math.floor(Math.random() * tabs.length)];
      const btn = page.locator(`button[aria-label*="${tab}"]`).first();
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(200);
        await dismissOverlay(page);
      }
      const diag = {};
      const ok = await playOneTurn(page, diag);
      if (!ok) {
        const snapshot = await captureStateSnapshot(page);
        bugs.push({
          persona: "Noob",
          turn: i,
          note: "game ended / stuck before turn " + i,
          reason: diag.reason || "unknown",
          iteration: diag.iteration ?? null,
          ...snapshot,
        });
        break;
      }
    }

    await page.screenshot({ path: `${SHOT_DIR}/qa-noob.png`, fullPage: true });
    record({ persona: "Noob", errors, bugs });
    expect(errors.filter(e => e.type === "pageerror").length).toBeLessThan(5);
  });

  test("Avg Gamer — builds and simulates", async ({ page }) => {
    // Normal-difficulty 8-turn loop + per-turn overlay dismissals regularly
    // runs past the 120s describe default, so give this persona more runway
    // (B-45). Noob/Goat stay at their own 120s budgets.
    test.setTimeout(180_000);
    const errors = await collectErrors(page);
    await page.goto("/");
    await startGame(page, "normal");
    const bugs = [];

    // Try to build a Strip Farm
    const estate = page.locator('button[aria-label*="Estate"]').first();
    if (await estate.isVisible({ timeout: 1000 }).catch(() => false)) await estate.click();
    await page.waitForTimeout(300);
    await dismissOverlay(page);
    const build = page.getByText("Strip Farm", { exact: false }).first();
    if (await build.isVisible({ timeout: 1000 }).catch(() => false)) {
      await build.click().catch(() => {});
      await page.waitForTimeout(200);
      const buildBtn = page.locator("button").filter({ hasText: /^Build$/ }).first();
      if (await buildBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await buildBtn.click().catch(() => {});
      }
    }

    for (let i = 0; i < 8; i++) {
      const diag = {};
      const ok = await playOneTurn(page, diag);
      if (!ok) {
        const snapshot = await captureStateSnapshot(page);
        bugs.push({
          persona: "Avg",
          turn: i,
          note: "ended early",
          reason: diag.reason || "unknown",
          iteration: diag.iteration ?? null,
          ...snapshot,
        });
        break;
      }
    }

    await page.screenshot({ path: `${SHOT_DIR}/qa-avg.png`, fullPage: true });
    record({ persona: "Avg", errors, bugs });
    expect(errors.filter(e => e.type === "pageerror").length).toBeLessThan(3);
  });

  test("Goat Gamer — methodical full playthrough attempt", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await collectErrors(page);
    await page.goto("/");
    await startGame(page, "hard");
    const bugs = [];

    for (let i = 0; i < 12; i++) {
      const diag = {};
      const ok = await playOneTurn(page, diag);
      if (!ok) {
        const snapshot = await captureStateSnapshot(page);
        bugs.push({
          persona: "Goat",
          turn: i,
          note: "ended early",
          reason: diag.reason || "unknown",
          iteration: diag.iteration ?? null,
          ...snapshot,
        });
        break;
      }
    }

    await page.screenshot({ path: `${SHOT_DIR}/qa-goat.png`, fullPage: true });
    record({ persona: "Goat", errors, bugs });
    expect(errors.filter(e => e.type === "pageerror").length).toBeLessThan(3);
  });
});
