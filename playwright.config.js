import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Cap local workers at 2 for the gameplay specs so overlay transitions don't
  // race under 8+ parallel browsers (B-33, B-34, B-44). CI already uses 1.
  // Visual specs run as part of the same project and still parallelise up to 2.
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],

  /* Shared settings for all projects */
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      // Gameplay specs run in the dedicated `gameplay` project (B-47) with
      // a capped worker count; exclude them here so a full-suite run does
      // not execute them twice.
      testIgnore: /tests\/e2e\/gameplay\//,
      use: {
        ...devices["Desktop Chrome"],
        // Consistent viewport for visual snapshots
        viewport: { width: 1280, height: 720 },
      },
    },
    /**
     * Gameplay project (B-47): the `season-flow` / `multi-turn` /
     * `auto-playthrough` specs race overlay transitions when run with the
     * default worker count. Pinning this project to 2 workers locally keeps
     * the Vite dev server from saturating while leaving the visual + persona
     * projects fully parallel. On CI we already run `workers: 1` at the
     * top level, so this opt-in cap is a no-op there.
     */
    {
      name: "gameplay",
      testDir: "./tests/e2e/gameplay",
      fullyParallel: false,
      workers: process.env.CI ? 1 : 2,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  /* Start the Vite dev server before running tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  /* Snapshot configuration */
  expect: {
    toHaveScreenshot: {
      // Allow small pixel diffs from anti-aliasing across runs
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
});
