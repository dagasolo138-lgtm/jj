/**
 * Unicode Asset Audit
 *
 * Navigates every game screen and programmatically finds all Unicode
 * characters rendered as text icons (not replaced by pixel sprites or SVGs).
 * Captures screenshots of each screen for visual reference.
 */

import { test, expect } from "@playwright/test";
import {
  waitForFonts,
  startGame,
  navigateToTab,
} from "../helpers.js";

// Unicode ranges used as visual icons (not normal prose punctuation).
// We look for anything in these blocks rendered as raw text:
//   - Miscellaneous Symbols (U+2600–U+26FF)
//   - Dingbats (U+2700–U+27BF)
//   - Miscellaneous Technical (U+2300–U+23FF)
//   - Geometric Shapes (U+25A0–U+25FF)
//   - Arrows (U+2190–U+21FF)
//   - Mathematical Operators used as icons (U+2200–U+22FF)
//   - Box Drawing / Block Elements (U+2500–U+259F)
//   - Supplemental Arrows / Misc Symbols (U+2900–U+297F, U+2980–U+29FF)
//   - General Punctuation used as icons (U+2020–U+206F subset)
//   - Letterlike Symbols (U+2100–U+214F)
//   - Music Symbols, playing cards, etc.
//
// We exclude normal prose characters: em dash (—), en dash (–), smart quotes,
// ellipsis (…), middle dot for sentences, accent marks, etc.

const PROSE_EXCLUDE = new Set([
  "\u2014", // — em dash
  "\u2013", // – en dash
  "\u2018", // ' left single quote
  "\u2019", // ' right single quote
  "\u201C", // " left double quote
  "\u201D", // " right double quote
  "\u2026", // … ellipsis
  "\u00B7", // · middle dot (used in prose)
  "\u00D7", // × multiplication sign (used in prose like "×1.5")
  "\u2212", // − minus sign
  "\u00E9", // é
  "\u00F3", // ó
  "\u00FC", // ü
]);

/**
 * Scans the page for Unicode characters used as visual icons.
 * Returns an array of { char, codePoint, context, tagName, x, y }.
 */
async function scanForUnicodeIcons(page) {
  return page.evaluate((excludeList) => {
    const results = [];
    const seen = new Map(); // track unique char+context combos

    // Walk all text nodes in the document
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent;
      if (!text) continue;

      // Check if parent is visible
      const parent = node.parentElement;
      if (!parent) continue;
      const style = window.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") continue;

      // Scan for non-ASCII characters in icon ranges
      for (let i = 0; i < text.length; i++) {
        const cp = text.codePointAt(i);
        const char = String.fromCodePoint(cp);

        // Skip basic ASCII and Latin-1 prose characters
        if (cp < 0x2000) continue;
        // Skip excluded prose characters
        if (excludeList.includes(char)) continue;

        // Check if this char is inside an SVG or an <img> (already replaced)
        let el = parent;
        let insideSvgOrImg = false;
        while (el) {
          if (el.tagName === "SVG" || el.tagName === "svg" || el.tagName === "IMG") {
            insideSvgOrImg = true;
            break;
          }
          el = el.parentElement;
        }
        if (insideSvgOrImg) continue;

        // Get surrounding context (trim to 60 chars)
        const fullText = text.trim();
        const context = fullText.length > 60
          ? fullText.substring(0, 60) + "..."
          : fullText;

        const rect = parent.getBoundingClientRect();
        const key = `${char}|${parent.tagName}|${context.substring(0, 30)}`;

        if (!seen.has(key)) {
          seen.set(key, true);
          results.push({
            char,
            codePoint: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"),
            unicodeName: "", // filled in post-processing
            context,
            tagName: parent.tagName.toLowerCase(),
            className: (parent.className || "").toString().substring(0, 80),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            visible: rect.width > 0 && rect.height > 0,
          });
        }
      }
    }
    return results;
  }, [...PROSE_EXCLUDE]);
}

// Map of code points to descriptive names for the report
const UNICODE_NAMES = {
  "U+2022": "Bullet •",
  "U+2042": "Asterism ⁂",
  "U+2020": "Dagger †",
  "U+2191": "Up Arrow ↑",
  "U+2192": "Right Arrow →",
  "U+2193": "Down Arrow ↓",
  "U+2190": "Left Arrow ←",
  "U+2197": "NE Arrow ↗",
  "U+2248": "Almost Equal ≈",
  "U+2261": "Identical To ≡",
  "U+221E": "Infinity ∞",
  "U+223F": "Sine Wave ∿",
  "U+2302": "House ⌂",
  "U+25A0": "Black Square ■",
  "U+25A1": "White Square □",
  "U+25A3": "Crosshatch Square ▣",
  "U+25A7": "Diagonal Fill Square ▧",
  "U+25AE": "Black Vertical Rect ▮",
  "U+25B0": "Black Parallelogram ▰",
  "U+25B2": "Up Triangle ▲",
  "U+25B6": "Right Triangle ▶",
  "U+25BC": "Down Triangle ▼",
  "U+25C6": "Black Diamond ◆",
  "U+25C9": "Fisheye ◉",
  "U+25CB": "White Circle ○",
  "U+25CF": "Black Circle ●",
  "U+2600": "Sun ☀",
  "U+2605": "Black Star ★",
  "U+2615": "Hot Beverage ☕",
  "U+2616": "White Shogi Piece ☖",
  "U+2618": "Shamrock ☘",
  "U+2620": "Skull & Crossbones ☠",
  "U+2626": "Orthodox Cross ☦",
  "U+2629": "Cross of Jerusalem ☩",
  "U+2630": "Trigram ☰",
  "U+2665": "Black Heart ♥",
  "U+2668": "Hot Springs ♨",
  "U+266A": "Eighth Note ♪",
  "U+266B": "Beamed Notes ♫",
  "U+2680": "Die Face-1 ⚀",
  "U+2692": "Hammer & Pick ⚒",
  "U+2693": "Anchor ⚓",
  "U+2694": "Crossed Swords ⚔",
  "U+2696": "Scales ⚖",
  "U+2698": "Flower ⚘",
  "U+2699": "Gear ⚙",
  "U+269C": "Fleur-de-lis ⚜",
  "U+26A0": "Warning ⚠",
  "U+26BF": "Squared Key ⚿",
  "U+26CA": "Sail ⛊",
  "U+26E8": "Black Cross on Shield ⛨",
  "U+26EA": "Church ⛪",
  "U+2713": "Check Mark ✓",
  "U+2717": "Ballot X ✗",
  "U+271D": "Latin Cross ✝",
  "U+2720": "Maltese Cross ✠",
  "U+2726": "Four-pointed Star ✦",
  "U+2727": "White Four-pointed Star ✧",
  "U+2734": "Eight-pointed Star ✴",
  "U+2736": "Six-pointed Star ✶",
  "U+273D": "Heavy Teardrop Asterisk ✽",
  "U+2741": "Eight Petal Flower ❁",
  "U+2744": "Snowflake ❄",
  "U+2756": "Black Diamond Minus White X ❖",
  "U+2767": "Rotated Floral Heart ❧",
  "U+265B": "Black Chess Queen ♛",
  "U+29BF": "Circled Bullet ⦿",
  "U+27B6": "Three-D Right Arrow ➶",
};

test.describe("Unicode Asset Audit", () => {
  const allFindings = {};

  test("Title Screen — scan Unicode icons", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=The Lord's Ledger", { timeout: 15_000 });
    await page.waitForSelector("text=Normal", { timeout: 5_000 });
    await waitForFonts(page);

    // Expand "How to Play" if present
    const howToPlay = page.getByText("How to Play");
    if (await howToPlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await howToPlay.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: "test-results/unicode-audit/title-screen.png", fullPage: true });
    const findings = await scanForUnicodeIcons(page);
    allFindings["Title Screen"] = findings;

    console.log("\n=== TITLE SCREEN ===");
    console.log(`Found ${findings.length} Unicode icon instances`);
    for (const f of findings) {
      const name = UNICODE_NAMES[f.codePoint] || f.char;
      console.log(`  ${f.codePoint} ${name} — <${f.tagName}> "${f.context.substring(0, 50)}"`);
    }
  });

  const TABS = ["Estate", "Map", "Market", "Military", "People", "Hall", "Chapel", "Forge", "Chronicle"];

  for (const tab of TABS) {
    test(`${tab} Tab — scan Unicode icons`, async ({ page }) => {
      await page.goto("/");
      await startGame(page);
      await waitForFonts(page);
      await navigateToTab(page, tab);
      await page.waitForTimeout(800);

      // For tabs with expandable sections, try to expand them
      if (tab === "Estate") {
        // Try to expand the "Build New" section
        const buildNew = page.getByText("Build New");
        if (await buildNew.isVisible({ timeout: 500 }).catch(() => false)) {
          await buildNew.click();
          await page.waitForTimeout(500);
        }
      }

      if (tab === "Military") {
        // Try to expand fortifications section
        const fortBtn = page.getByText("Fortifications");
        if (await fortBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await fortBtn.click();
          await page.waitForTimeout(500);
        }
      }

      if (tab === "Hall") {
        // Great Hall — try to open sub-sections
        const disputes = page.getByText("Disputes").first();
        if (await disputes.isVisible({ timeout: 500 }).catch(() => false)) {
          await disputes.click();
          await page.waitForTimeout(500);
        }
      }

      // Scroll full page to ensure everything is rendered
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `test-results/unicode-audit/${tab.toLowerCase()}-tab.png`,
        fullPage: true,
      });

      const findings = await scanForUnicodeIcons(page);
      allFindings[`${tab} Tab`] = findings;

      console.log(`\n=== ${tab.toUpperCase()} TAB ===`);
      console.log(`Found ${findings.length} Unicode icon instances`);
      for (const f of findings) {
        const name = UNICODE_NAMES[f.codePoint] || f.char;
        console.log(`  ${f.codePoint} ${name} — <${f.tagName}> "${f.context.substring(0, 50)}"`);
      }
    });
  }

  test("Dashboard (always visible) — scan Unicode icons", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);

    // Just scan the top dashboard area
    const findings = await scanForUnicodeIcons(page);
    // Filter to only dashboard area (top of page)
    const dashboardFindings = findings.filter((f) => f.y < 200);

    console.log("\n=== DASHBOARD ===");
    console.log(`Found ${dashboardFindings.length} Unicode icon instances in dashboard area`);
    for (const f of dashboardFindings) {
      const name = UNICODE_NAMES[f.codePoint] || f.char;
      console.log(`  ${f.codePoint} ${name} — <${f.tagName}> "${f.context.substring(0, 50)}"`);
    }
  });

  test("FINAL SUMMARY — all unique Unicode icons across game", async ({ page }) => {
    // This test runs last — it does a full scan of all screens in sequence
    // and produces the definitive list

    const allIcons = new Map(); // codePoint -> { char, name, locations[] }

    // Helper to collect
    const collect = (screenName, findings) => {
      for (const f of findings) {
        if (!allIcons.has(f.codePoint)) {
          allIcons.set(f.codePoint, {
            char: f.char,
            codePoint: f.codePoint,
            name: UNICODE_NAMES[f.codePoint] || f.char,
            locations: [],
          });
        }
        allIcons.get(f.codePoint).locations.push({
          screen: screenName,
          context: f.context.substring(0, 50),
          tag: f.tagName,
        });
      }
    };

    // 1. Title screen
    await page.goto("/");
    await page.waitForSelector("text=The Lord's Ledger", { timeout: 15_000 });
    await page.waitForSelector("text=Normal", { timeout: 5_000 });
    await waitForFonts(page);
    const howToPlay = page.getByText("How to Play");
    if (await howToPlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await howToPlay.click();
      await page.waitForTimeout(500);
    }
    collect("Title Screen", await scanForUnicodeIcons(page));

    // 2. Start game
    await startGame(page);
    await waitForFonts(page);
    collect("Dashboard / Estate", await scanForUnicodeIcons(page));

    // 3. Each tab
    for (const tab of ["Map", "Market", "Military", "People", "Hall", "Chapel", "Forge", "Chronicle"]) {
      await navigateToTab(page, tab);
      await page.waitForTimeout(800);

      // Expand sections for deeper scanning
      if (tab === "Estate") {
        const buildNew = page.getByText("Build New");
        if (await buildNew.isVisible({ timeout: 500 }).catch(() => false)) {
          await buildNew.click();
          await page.waitForTimeout(500);
        }
      }
      if (tab === "Military") {
        const fortBtn = page.getByText("Fortifications");
        if (await fortBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await fortBtn.click();
          await page.waitForTimeout(500);
        }
      }
      if (tab === "Hall") {
        // Try sub-sections
        for (const section of ["Disputes", "Audiences", "Decrees", "Council"]) {
          const btn = page.getByText(section).first();
          if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(300);
          }
        }
      }

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(200);
      await page.evaluate(() => window.scrollTo(0, 0));

      collect(`${tab} Tab`, await scanForUnicodeIcons(page));
    }

    // 4. Try simulating a season to see event cards
    await navigateToTab(page, "Estate");
    const simBtn = page.locator('button[aria-label*="Simulate"]');
    if (await simBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await simBtn.click();
      await page.waitForTimeout(1500);
      collect("Season Event", await scanForUnicodeIcons(page));

      // Click through the event if there's a choice or continue button
      const continueBtn = page.getByText("Continue").first();
      if (await continueBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(500);
      }
      // Check for random event
      collect("Random Event", await scanForUnicodeIcons(page));

      const resolveBtn = page.getByText("Continue").first();
      if (await resolveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await resolveBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // PRINT FINAL REPORT
    const sorted = [...allIcons.values()].sort((a, b) =>
      a.codePoint.localeCompare(b.codePoint)
    );

    console.log("\n" + "=".repeat(80));
    console.log("COMPLETE UNICODE ASSET AUDIT — Characters Not Replaced by Pixel Sprites");
    console.log("=".repeat(80));
    console.log(`\nTotal unique Unicode icon characters found: ${sorted.length}\n`);

    console.log("Code Point | Char | Name                              | Screens Found In");
    console.log("-".repeat(80));

    for (const icon of sorted) {
      const screens = [...new Set(icon.locations.map((l) => l.screen))];
      console.log(
        `${icon.codePoint.padEnd(10)} | ${icon.char.padEnd(4)} | ${icon.name.padEnd(33)} | ${screens.join(", ")}`
      );
    }

    console.log("\n" + "=".repeat(80));
    console.log("DETAILED LOCATIONS");
    console.log("=".repeat(80));

    for (const icon of sorted) {
      console.log(`\n${icon.codePoint} ${icon.name}`);
      for (const loc of icon.locations) {
        console.log(`  [${loc.screen}] <${loc.tag}> "${loc.context}"`);
      }
    }

    console.log("\n" + "=".repeat(80));

    // Also make the test pass and report count
    expect(sorted.length).toBeGreaterThan(0);
  });
});
