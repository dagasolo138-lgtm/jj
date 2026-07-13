# QA Process — The Lord's Ledger

## Overview

This document describes the persona-based QA process used to validate
The Lord's Ledger before merge. It captures how Playwright is wired up,
how each persona plays, and what is expected of a "pass" run.

## Playwright Quick Reference

- Config: `playwright.config.js` (Chromium only, 1280×720, Vite dev server auto-started).
- Helpers: `tests/e2e/helpers.js` — `startGame()`, `navigateToTab()`,
  `playOneTurn()`, `dismissOverlay()`, `dismissTutorial()`.
- Existing specs:
  - `tests/e2e/gameplay/*.spec.js` — gameplay / flow
  - `tests/e2e/visual/*.spec.js` — screenshot / unicode / icon audits
- Commands:
  ```bash
  npm run test                  # full suite
  npm run test:visual           # visual only
  npx playwright test <file>    # one spec
  npm run test:update-snapshots # refresh baselines
  ```
- QA persona driver: `tests/e2e/qa/persona-qa.spec.js` (added this cycle).
- Screenshots are written to `playtest-screenshots/`.

## Personas (3 roles)

### 1. Noob (6th grader, first time)
- Click everything, dismiss every tooltip without reading.
- Never opens Market, Chapel, Blacksmith; lives on Estate + Simulate.
- Goal: game should not soft-lock or crash on random clicking.

### 2. Avg Gamer
- Follows the intended loop: build 1–2 economy buildings, recruit a few
  levy, then simulate.
- Uses the Market occasionally; reads scribe's notes.
- Goal: beat 10+ turns, meters should not auto-kill them.

### 3. Goat Gamer
- Optimal play: Spring/Summer farm build, Autumn tax stacking, Winter
  fortify, military synergy by year 2.
- Goal: reach the 40-turn victory and unlock synergies.

## Bug Logging Format (backlog.md)

```
### B-NN — <short title>
- Persona(s): Noob / Avg / Goat
- Severity: P0 (crash) | P1 (soft-lock / broken feature) | P2 (UX) | P3 (polish)
- Reproduction: …
- Expected: …
- Actual: …
```

- **Cap: 25 items.** When the backlog is full, fixing takes priority
  over new bug intake.

## Fix Cycle

1. Two Opus 4.7 subagents each take 2–3 items from the top of the backlog.
2. Each fix must pass `npm run lint` and build.
3. After 5 items are fixed, re-run the persona QA and take fresh
   screenshots for the merged branch.
4. 8-step code-review pipeline before merging to `main`:
   1. Lint passes.
   2. Build passes.
   3. No new console errors in QA run.
   4. No regressions in gameplay happy path.
   5. No hard-coded secrets or API keys.
   6. State mutations still go through the reducer.
   7. Pure-function rule holds in `src/engine/`.
   8. Diff scoped to the fixes (no scope creep).
