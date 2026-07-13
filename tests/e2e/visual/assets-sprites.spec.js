/**
 * Visual Tests — Sprite & Asset Loading
 *
 * Verifies that all game sprite assets in public/sprites/ load correctly,
 * render at expected dimensions, and are not broken/missing.
 */

import { test, expect } from "@playwright/test";

const SPRITE_FILES = [
  "blacksmith.png",
  "corn.png",
  "grass.png",
  "ground.png",
  "house.png",
  "house_green.png",
  "house_white.png",
  "mill.png",
  "mill_small.png",
  "river.png",
  "river2.png",
  "road.png",
  "smoke.png",
  "stone.png",
  "stone_ground.png",
  "tower.png",
  "tree1.png",
  "tree2.png",
  "tree3.png",
  "tree4.png",
  "wall.png",
  "wall_gate.png",
  "wheat.png",
];

test.describe("Sprite Assets", () => {
  test("all sprite files are served and return 200", async ({ page }) => {
    const results = [];

    for (const sprite of SPRITE_FILES) {
      const response = await page.request.get(`/sprites/${sprite}`);
      results.push({
        sprite,
        status: response.status(),
        contentType: response.headers()["content-type"],
      });
    }

    for (const result of results) {
      expect.soft(result.status, `${result.sprite} should return 200`).toBe(200);
      expect
        .soft(result.contentType, `${result.sprite} should be a PNG image`)
        .toContain("image/png");
    }
  });

  test("all sprite files have non-zero content length", async ({ page }) => {
    for (const sprite of SPRITE_FILES) {
      const response = await page.request.get(`/sprites/${sprite}`);
      const body = await response.body();
      expect(body.length, `${sprite} should have content`).toBeGreaterThan(0);
    }
  });

  test("sprites render correctly when loaded as images", async ({ page }) => {
    // Build a test page that loads all sprites as <img> elements
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { background: #1a1610; margin: 0; padding: 20px; display: flex; flex-wrap: wrap; gap: 16px; }
          .sprite-box { display: flex; flex-direction: column; align-items: center; gap: 4px; }
          .sprite-box img { image-rendering: pixelated; width: 64px; height: 64px; object-fit: contain; }
          .sprite-box span { color: #a89070; font-size: 11px; font-family: monospace; }
        </style>
      </head>
      <body>
        ${SPRITE_FILES.map(
          (s) =>
            `<div class="sprite-box"><img src="http://localhost:5173/sprites/${s}" alt="${s}" /><span>${s}</span></div>`
        ).join("\n")}
      </body>
      </html>
    `);

    // Wait for all images to load
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images.length > 0 && images.every((img) => img.complete && img.naturalWidth > 0);
    }, { timeout: 15_000 });

    // Verify each image loaded with valid dimensions
    const imageStats = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("img")).map((img) => ({
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
      }));
    });

    for (const stat of imageStats) {
      expect(stat.complete, `${stat.alt} should be complete`).toBe(true);
      expect(stat.naturalWidth, `${stat.alt} should have width > 0`).toBeGreaterThan(0);
      expect(stat.naturalHeight, `${stat.alt} should have height > 0`).toBeGreaterThan(0);
    }

    // Visual snapshot of all sprites rendered together
    await expect(page).toHaveScreenshot("all-sprites-grid.png", {
      fullPage: true,
    });
  });

  test("individual sprite dimensions are reasonable", async ({ page }) => {
    const dimensionResults = [];

    for (const sprite of SPRITE_FILES) {
      const response = await page.request.get(`/sprites/${sprite}`);
      const body = await response.body();

      // PNG header: bytes 16-19 = width, bytes 20-23 = height (big-endian)
      const width = body.readUInt32BE(16);
      const height = body.readUInt32BE(20);

      dimensionResults.push({ sprite, width, height, size: body.length });
    }

    for (const result of dimensionResults) {
      // Sprites should be reasonably sized (not degenerate 1x1 or absurdly huge)
      expect(result.width, `${result.sprite} width`).toBeGreaterThanOrEqual(8);
      expect(result.height, `${result.sprite} height`).toBeGreaterThanOrEqual(8);
      expect(result.width, `${result.sprite} width max`).toBeLessThanOrEqual(2048);
      expect(result.height, `${result.sprite} height max`).toBeLessThanOrEqual(2048);
    }
  });
});

test.describe("Audio Assets", () => {
  const AUDIO_FILES = [
    "medieval-background.mp3",
    "medieval-happy.mp3",
    "medieval-waltz.mp3",
  ];

  test("all audio files are served and return 200", async ({ page }) => {
    for (const audio of AUDIO_FILES) {
      const response = await page.request.get(`/audio/${audio}`);
      expect(response.status(), `${audio} should return 200`).toBe(200);
      const body = await response.body();
      expect(body.length, `${audio} should have content`).toBeGreaterThan(1000);
    }
  });
});
