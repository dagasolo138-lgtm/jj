/**
 * Visual Tests — Font Rendering
 *
 * Verifies that the medieval theme fonts (Cinzel, Cinzel Decorative,
 * Crimson Text, Almendra, Uncial Antiqua) load and render correctly.
 *
 * Google Fonts load lazily — they only appear in document.fonts after
 * text using them is rendered. We check computed fontFamily on elements
 * that reference these fonts rather than iterating the FontFaceSet.
 */

import { test, expect } from "@playwright/test";
import { waitForTitleScreen, waitForFonts, startGame } from "../helpers.js";

test.describe("Font Loading", () => {
  test("title heading element references Cinzel Decorative", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);
    await waitForFonts(page);

    const titleFont = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return null;
      return window.getComputedStyle(h1).fontFamily;
    });

    expect(titleFont).not.toBeNull();
    expect(titleFont).toContain("Cinzel Decorative");
  });

  test("body element uses Crimson Text font family", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);
    await waitForFonts(page);

    const bodyFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    expect(bodyFont).toContain("Crimson Text");
  });

  test("heading elements use Cinzel font family", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);
    await waitForFonts(page);

    // The "How to Play" heading should use the heading font
    const headingFont = await page.evaluate(() => {
      const headings = document.querySelectorAll("h3");
      for (const h of headings) {
        const ff = window.getComputedStyle(h).fontFamily;
        if (ff.includes("Cinzel")) return ff;
      }
      // Fallback: check any element with font-heading class
      const fh = document.querySelector(".font-heading");
      if (fh) return window.getComputedStyle(fh).fontFamily;
      return null;
    });

    expect(headingFont).not.toBeNull();
    expect(headingFont).toContain("Cinzel");
  });

  test("Google Fonts stylesheet is loaded", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);

    const hasGoogleFonts = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.some((link) => link.href.includes("fonts.googleapis.com"));
    });

    expect(hasGoogleFonts).toBe(true);
  });
});

test.describe("Font Visual Snapshots", () => {
  test("title screen typography renders correctly", async ({ page }) => {
    await page.goto("/");
    await waitForTitleScreen(page);
    await waitForFonts(page);

    // Snapshot the game title
    const titleEl = page.locator("h1").first();
    await expect(titleEl).toHaveScreenshot("title-heading-font.png");
  });

  test("tab bar uses heading font", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);

    const tabFont = await page.evaluate(() => {
      const tabButton = document.querySelector('button[aria-label*="Estate"]');
      if (!tabButton) return null;
      return window.getComputedStyle(tabButton).fontFamily;
    });

    expect(tabFont).toContain("Cinzel");
  });

  test("dashboard resource labels render with heading font", async ({ page }) => {
    await page.goto("/");
    await startGame(page);
    await waitForFonts(page);

    const labelFont = await page.evaluate(() => {
      const labels = document.querySelectorAll(".font-heading");
      if (labels.length === 0) return null;
      return window.getComputedStyle(labels[0]).fontFamily;
    });

    expect(labelFont).toContain("Cinzel");
  });
});
