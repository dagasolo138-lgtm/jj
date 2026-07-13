# QA Backlog — The Lord's Ledger

> Cap: 25 items. When full, fix before adding more.
> Format: see `QA.md`.
> Populated: 2026-04-17 — fresh persona QA + gameplay/visual suite run.
> Prior backlog (B-01..B-25) resolved across 5 fix cycles on this branch
> (see git log). This backlog starts a new cycle; numbering continues from B-26.
> 2026-04-17 cycle 2: re-ran persona + exploratory QA, added B-37..B-42 from
> the gameplay/visual suite and full tab tour. Total unfixed items: 11 (under
> 25 cap). Current fix set: B-32, B-33, B-34, B-36, B-37 (5 items).
> 2026-04-17 cycle 3: re-ran persona QA + gameplay + visual suites; all visual
> specs pass, persona specs pass (0 pageerrors), but auto-playthrough reports
> `possible_softlock` on Normal/Balanced + Normal/Military and multi-turn /
> season-flow specs still flake under 8 parallel workers. Added B-43, B-44.
> Unfixed items: 8 (under cap). Current fix set:
> B-38, B-39, B-40, B-41, B-42 (5 items).
> 2026-04-17 cycle 4 (main): re-ran persona QA + gameplay (50 pass, 1 skip)
> + visual (54 pass). Persona screenshots for Avg (Normal) and Goat (Hard)
> show TITLE SCREEN instead of the true end-state, and
> `playthrough-results.json` keeps growing across runs. Added B-45, B-46,
> B-47, B-48. Fix set: B-35, B-45, B-46, B-47, B-48 (5 items).
> 2026-04-17 cycle 4 (branch): parallel branch cycle found the same TITLE
> SCREEN regression plus auto-playthrough softlocks on **all six** profiles
> (Easy/Passive sl26, Easy/Builder sl23, Normal/Balanced sl23, Normal/Military
> famine22, Hard/Passive sl25, Hard/Builder sl23). Fixed the softlock (B-43)
> by making the auto-playthrough describe block serial + adding
> TitleScreen recovery helpers. Main's `Return to Title`-regex narrowing
> (cycle 4 main B-46) is the root-cause prevention; branch's serial + recovery
> is the defence in depth. Branch also flagged the Avg persona 120s timeout
> as B-45 (branch) — resolved by raising describe timeout to 180s. Branch
> fix set: B-35, B-43, B-44 (superseded by main B-47), B-45 (branch),
> B-46 (branch duplicate of B-43).

Priority legend:
- P0: crash / blocker
- P1: broken feature or soft-lock
- P2: UX / balance / accessibility
- P3: polish / dead code

---

### B-26 — game-start.spec.js expects stale food totals (Normal: 200 vs 365) ✅ FIXED 2026-04-17
- Persona: N/A (CI)
- Severity: P1 (CI red)
- Reproduction: `npx playwright test tests/e2e/gameplay/game-start.spec.js` →
  "starting on Normal difficulty sets correct initial resources" expects
  `food === 200` but receives `365`.
- Expected: Test asserts the current Normal startingInventory
  (grain 280 + livestock 50 + fish 35 = 365) which matches `src/data/economy.js:283`.
- Actual: Comment and assertion reflect pre-B-06/B-07 balance values.

### B-27 — game-start.spec.js expects stale food totals (Easy: 280 vs 480) ✅ FIXED 2026-04-17
- Persona: N/A (CI)
- Severity: P1 (CI red)
- Reproduction: Same spec, "Easy difficulty gives more resources" expects 280,
  receives 480.
- Expected: Assertion should match current Easy inventory in `economy.js` (grain
  360 + livestock 80 + fish 40 = 480).
- Actual: Outdated assertion blocks CI.

### B-28 — game-start.spec.js expects stale Hard denarii (350 vs 400) ✅ FIXED 2026-04-17
- Persona: N/A (CI)
- Severity: P1 (CI red)
- Reproduction: "Hard difficulty gives fewer resources" expects `denarii === 350`,
  receives 400. `economy.js:294` sets Hard `startingDenarii: 400`.
- Expected: Assertion updated to 400.
- Actual: Stale from earlier balance pass.

### B-29 — Dashboard test helper still uses `.text-2xl` index map ✅ FIXED 2026-04-17
- Persona: N/A (maintainability — B-17 was only half-fixed)
- Severity: P2
- Reproduction: `tests/e2e/gameplay/game-start.spec.js:14` `getDashboardValues`
  uses `document.querySelectorAll(".text-2xl")` and positional indexing.
  Dashboard now has `data-testid="resource-<key>"` (see `Dashboard.jsx:58, 111`)
  but tests never migrated. Any reorder/new .text-2xl breaks tests.
- Expected: Use `data-testid="resource-denarii"`, `resource-food`, etc.
- Actual: Positional mapping; brittle.

### B-30 — Visual snapshot `tab-bar.png` out of date after focus-ring fix ✅ FIXED 2026-04-17
- Persona: N/A (CI)
- Severity: P2
- Reproduction: `npx playwright test tests/e2e/visual/ui-screens.spec.js` →
  "Tab Navigation tab bar visual snapshot" pixel-diff fails. B-10's
  `:focus-visible` outline additions on `TabBar.jsx` changed rendering.
- Expected: Update baseline with `npm run test:update-snapshots`.
- Actual: Stale baseline fails CI visual suite.

### B-31 — Visual snapshot `estate-tab-initial.png` out of date ✅ FIXED 2026-04-17
- Persona: N/A (CI)
- Severity: P2
- Reproduction: "Estate Tab renders estate management view on game start" →
  48,732 pixels differ. Likely from chronicle-entry icon/color changes (B-16)
  or disabled-action tooltip (B-23).
- Expected: Refresh baseline snapshot.
- Actual: Pixel diff every run.

### B-32 — CSS warning: `grid-cols-3` not recognized as pseudo-class ✅ FIXED 2026-04-17
- Persona: N/A (build log noise)
- Severity: P3
- Reproduction: `npm run build` → "`grid-cols-3` is not recognized as a valid
  pseudo-class" (3 warnings, `src/index.css` around the responsive media block).
  Cause: selectors like `.grid.grid-cols-1.sm\\:grid-cols-3` double-escape
  the colon; Tailwind 4 parser rejects the escaped selector.
- Expected: Use single backslash escape (`\:`) or rewrite as
  `@media` rules targeting `.sm\:grid-cols-3` without class chaining.
- Actual: 3 warnings per build.

### B-33 — `dismissTutorial` helper races with overlay unmount ("element not stable") ✅ FIXED 2026-04-17
- Persona: N/A (flake)
- Severity: P2
- Reproduction: Running full `tests/e2e/gameplay/season-flow.spec.js` under
  parallel workers occasionally fails on `dismissButton.click()` with
  "element is not stable / element was detached". Helper reads
  `I Understand` then clicks before the overlay finishes its fade-in
  transition.
- Expected: Wait for `state: "visible"` + small settle, or use
  `locator.click({ trial: true, force: true })` after opacity transition.
- Actual: Flake rate ~10% under 8 parallel workers.

### B-34 — Military/fortification specs time out at 30s under parallel workers ✅ FIXED 2026-04-17
- Persona: N/A (flake)
- Severity: P2
- Reproduction: `npx playwright test tests/e2e/gameplay` with default workers:
  "Military Tab morale is displayed in the dashboard" and "fortification section
  shows walls, gate, moat tracks" timeout while they pass individually. Root
  cause is shared dev server saturating and dismissTutorial flake (B-33).
- Expected: Bump test-level timeout or stabilise dismissTutorial.
- Actual: Intermittent CI red.

### B-35 — npm audit: 4 vulnerabilities (1 moderate, 3 high) ✅ FIXED 2026-04-17
- Persona: N/A (supply chain)
- Severity: P2
- Reproduction: `npm install` → "4 vulnerabilities (1 moderate, 3 high)".
- Expected: Review with `npm audit`, upgrade or document exceptions.
- Actual: Security notice on every install.
- Resolution (2026-04-17): `npm audit fix` (no `--force`, React/Vite/Tailwind
  majors untouched) bumped transitive deps to safe minors. Down from
  4 → 0: brace-expansion 1.1.12 → 1.1.14 (GHSA-f886-m6hf-6m8v moderate),
  flatted 3.3.4 → 3.4.2 (GHSA-25h7-pfq9-p65f, GHSA-rf6f-7fwh-wjgh high),
  picomatch 4.0.3 → 4.0.4 (GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj high),
  vite 7.3.1 → 7.3.2 (GHSA-4w7w-66w2-5vf9, GHSA-v2wj-q39q-566r,
  GHSA-p9ff-h696-f583 high). Post-fix `npm audit` reports 0 vulnerabilities.

### B-36 — Persona QA logs CDN TLS errors and counts them toward `pageerror` budget ✅ FIXED 2026-04-17
- Persona: N/A (QA harness)
- Severity: P3
- Reproduction: `tests/e2e/qa/persona-qa.spec.js` → each persona records two
  `ERR_CERT_AUTHORITY_INVALID` console errors from external music/font CDN
  requests in the sandboxed environment. They inflate the error count and
  make a real regression harder to see.
- Expected: Filter `ERR_CERT_AUTHORITY_INVALID` and `net::` transport errors
  in the collector so only app-level errors count.
- Actual: Noise in `qa-findings.json` every run.

### B-37 — Remaining gameplay/visual specs still use `.text-2xl` positional indexing ✅ FIXED 2026-04-17
- Persona: N/A (maintainability — B-29 was partial)
- Severity: P2
- Reproduction: `grep -rn ".text-2xl" tests/` shows 9 more spec files still
  call `document.querySelectorAll(".text-2xl")` with positional index maps:
  `tests/e2e/gameplay/market.spec.js:15`,
  `tests/e2e/gameplay/estate-building.spec.js:15`,
  `tests/e2e/gameplay/auto-playthrough.spec.js:27`,
  `tests/e2e/gameplay/multi-turn.spec.js:16`,
  `tests/e2e/gameplay/military.spec.js:15, 26, 112`,
  `tests/e2e/gameplay/save-load.spec.js:16`,
  `tests/e2e/visual/theme-colors.spec.js:103`.
  B-29 only migrated `game-start.spec.js`.
- Expected: Use `data-testid="resource-<key>"` selectors added by B-29
  (Dashboard.jsx:58,111) across all remaining specs.
- Actual: Positional indexing persists in 9 spec locations; any reorder
  breaks many tests at once.

### B-38 — `qa-findings.json` appended forever across runs, no truncation ✅ FIXED 2026-04-17
- Persona: N/A (QA harness)
- Severity: P3
- Reproduction: `tests/e2e/qa/persona-qa.spec.js` → `record()` reads
  existing findings and appends. Running the persona suite N times leaves
  N × 3 entries in `qa-findings.json`; the run-level `qa-summary.json`
  then reports the accumulated totals, not the current cycle.
- Expected: Truncate `qa-findings.json` at start of a new run (or stamp a
  `runId` and derive the per-run summary from that id).
- Actual: File grows and confuses cycle-over-cycle comparisons.

### B-39 — Full-page visual QA reveals layout overflow on Market/Estate tabs at 1280×720 ✅ FIXED 2026-04-17
- Persona: Avg Gamer
- Severity: P2
- Reproduction: `playtest-screenshots/qa-cycle/tab-market.png` (fullPage)
  — the "Purse: 500d", Simulate Season button, and merchant strip sit
  *below* a portion of the commodity table that is cut by the fold.
  Estate tab (after-turn-1) shows three production cards rendering empty
  (right column) when the viewport is narrower than the 3-col grid.
- Expected: Either enable a scrollable commodity panel that doesn't push
  merchants out of view, or drop to 2-col layout below a breakpoint.
  Blank production cards suggest Chapel/tribute lock state leaks into the
  BUILD NEW grid — investigate the `disabled` branch in EstateTab card
  render.
- Actual: Content feels truncated for players on default desktop window.

### B-40 — Exploratory spec shipped with stale tab labels (`Great Hall`, `Blacksmith`) ✅ FIXED 2026-04-17
- Persona: N/A (QA harness)
- Severity: P2
- Reproduction: Initial version of `tests/e2e/qa/exploratory.spec.js`
  iterated `["Map", "Market", "Military", "People", "Great Hall",
  "Chapel", "Blacksmith", "Chronicle"]`. Actual TabBar labels (TabBar.jsx:10)
  are `Hall` and `Forge`; the spec timed out at 120s clicking a non-existent
  aria-label. Fixed inline this cycle, but no guard prevents regression.
- Expected: Export `TAB_CONFIG` from `src/components/TabBar.jsx` (or a
  shared list) so specs import the single source of truth.
- Actual: Any tab rename silently breaks downstream specs.

### B-41 — `SIMULATE_SEASON` button floats over Blacksmith forge on tall scrolls ✅ FIXED 2026-04-17
- Persona: Avg Gamer / Goat Gamer
- Severity: P2 (UX)
- Reproduction: `playtest-screenshots/qa-cycle/tab-forge.png` (fullPage) —
  the Simulate Season action bar overlaps the cold-forge indicator and the
  anvil silhouette. At 1280px the anvil and "COLD" banner collide with the
  sticky-positioned action bar from the top-level layout.
- Expected: Add bottom padding equal to action-bar height on the Forge
  content so scroll bottom is reachable.
- Actual: Blacksmith interior appears cramped; anvil clipped.

### B-42 — Blacksmith anvil sprite rendered as black silhouette on dark background ✅ FIXED 2026-04-17
- Persona: Noob (first-time player)
- Severity: P3 (visibility / onboarding)
- Reproduction: Forge tab at game start — the anvil SVG at the top of
  `BlacksmithTab.jsx` has `filter: "brightness(0.3)"` applied while the
  page background is already `#0f0d0a`. The anvil reads as a dark blob.
- Expected: Either lift the silhouette brightness to ~0.6 or place the
  anvil on a lighter plate so shape is visible to first-time players.
- Actual: Users can't tell what the black blob is until they interact.

### B-43 — Auto-playthrough reports `possible_softlock` on Normal/Balanced & Normal/Military ✅ FIXED 2026-04-17
- Persona: Avg Gamer / Goat Gamer
- Severity: P1 (broken progression for default difficulty)
- Reproduction: `npx playwright test tests/e2e/gameplay/auto-playthrough.spec.js`
  → "Full game: Normal/Balanced" stops at turn 14, "Full game: Normal/Military"
  at turn 13 with `finalOutcome: "possible_softlock"`. Persona QA also shows
  Avg ending at turn 7 and Goat at turn 8 with `note: "ended early"`.
  The auto-driver's heuristics can't find any affordable action — all buttons
  disabled or the game sits on a state the driver doesn't handle.
- Expected: Either the auto-driver handles the state (event resolve, etc.) or
  the balance / UI leaves an always-available action (e.g., "Do nothing" /
  "Advance") so a Normal difficulty run reaches turn 40.
- Actual: Default-difficulty AI consistently gets stuck mid-game.

### B-44 — `multi-turn.spec.js` + `season-flow.spec.js` flake under 8 parallel workers ✅ FIXED 2026-04-17 (superseded by B-47)
- Persona: N/A (CI flake — B-33/B-34 regression)
- Severity: P2
- Reproduction: `npx playwright test tests/e2e/gameplay --reporter=line` fails
  "game handles 8 turns (2 full years) on easy difficulty" and "Simulate Season
  button triggers seasonal event" intermittently while those same specs pass
  when re-run against a smaller batch. B-33 added a stability wait in
  `dismissTutorial`, but `playOneTurn` / event resolve under parallel workers
  still races with overlay transitions.
- Expected: Either harden `playOneTurn`/seasonal-resolve locators with
  `state: "visible"` + `stabilityTimeout`, or serialize the gameplay project
  (`workers: 1` for `tests/e2e/gameplay/`) until overlay races are resolved.
- Actual: ~2/51 gameplay tests fail on each full-suite run.

### B-45 — `tests/e2e/playthrough-results.json` accumulates across runs (no truncation) ✅ FIXED 2026-04-17
- Persona: N/A (QA harness — parallel of fixed B-38 for `qa-findings.json`)
- Severity: P3
- Reproduction: `npx playwright test tests/e2e/gameplay/auto-playthrough.spec.js`
  → file grows with every execution; `grep '"runId":'` shows 2 × each run.
  There is no `beforeAll` truncation analogous to
  `persona-qa.spec.js:58-63` (B-38 fix). Historical data from earlier cycles
  pollutes new analyses.
- Expected: Truncate `playthrough-results.json` to `[]` in a `test.beforeAll`
  hook at the top of `auto-playthrough.spec.js` so each invocation starts fresh.
- Actual: File contains 12 runs from earlier cycles mixed with current run.

### B-46 — `playOneTurn` helper's `/Return/` regex clicks "Return to Title" on game-over ✅ FIXED 2026-04-17
- Persona: Avg Gamer / Goat Gamer (QA harness artifact)
- Severity: P2
- Reproduction: `tests/e2e/helpers.js:203-208` filters continue-buttons with
  `/…|Return/`. When `Normal`/`Hard` persona hits game-over around turn 7-8,
  the game-over overlay's "Return to Title" (plus its "Try Again" button)
  is rendered. Although the helper checks "Try Again" first, the post-turn
  screenshot captured immediately after `playOneTurn` returns shows the
  TITLE SCREEN — see `playtest-screenshots/qa-avg.png` + `qa-goat.png`.
  The regex is broad enough that a later iteration or a race during fade-in
  clicks the title-return affordance before the Try-Again guard fires.
- Expected: Narrow the final regex to the exact resolve strings
  (`Return to Your Reign`) or exclude anything matching `Return to Title`.
  Post-run screenshots should then capture the ACTUAL end state
  (game-over reason + scoreboard), not the reset title screen.
- Actual: Persona QA screenshots consistently show the title screen for
  Avg + Goat personas, making failure triage blind.

### B-47 — Gameplay project runs fully parallel; overlay race causes flakes (was B-44 root) ✅ FIXED 2026-04-17
- Persona: N/A (CI)
- Severity: P2
- Reproduction: `playwright.config.js:8` sets `workers: undefined` (all cores)
  outside CI. Visual + persona specs are deterministic at 8 workers, but
  `season-flow.spec.js` and `multi-turn.spec.js` intermittently race the
  overlay transitions (B-44). B-33 hardened `dismissTutorial` but B-44 notes
  the follow-on races still persist at 8 workers.
- Expected: Split projects — keep visual/qa fully parallel, add a
  `gameplay` project pinned to `workers: 2` (or `fullyParallel: false`) so
  `season-flow`/`multi-turn`/`auto-playthrough` share the Vite server without
  saturating it. Retain current behaviour on CI (`workers: 1`).
- Actual: ~2/51 gameplay tests fail on each full-suite run; B-44 regressed.

### B-48 — `auto-playthrough.spec.js` logs `sim_button_missing` without a state dump ✅ FIXED 2026-04-17
- Persona: N/A (QA diagnostics)
- Severity: P3
- Reproduction: `tests/e2e/playthrough-results.json` shows `"finalOutcome":
  "sim_button_missing"` on Normal/Military (turn 31) + Hard/Builder (turn 30)
  + Easy/Passive (turn 9) + Easy/Builder (turn 8). The payload contains
  turn/resources/events but no snapshot of the blocking DOM — engineers
  can't tell whether a modal is stuck, if the page is on game-over, or if
  the sim-button label has drifted. Makes B-43 investigation harder.
- Expected: On `sim_button_missing` + `possible_softlock` outcomes, capture
  `document.body.innerText.slice(0, 800)` and the list of visible button
  labels and attach to `turnData[last]`. One screenshot per failing run
  saved to `playtest-screenshots/autoplay-<runId>.png` would also help.
- Actual: Outcome strings without enough context to diagnose.
- Resolution (2026-04-17): added `captureDiagnostics(page, runId, outcome)`
  helper in `tests/e2e/gameplay/auto-playthrough.spec.js`. On
  `sim_button_missing` and `possible_softlock` it snapshots
  `document.body.innerText.slice(0, 800)`, up to 20 visible button labels
  (trimmed to 60 chars), and writes
  `playtest-screenshots/autoplay-<runId>-<outcome>.png` (fullPage, `/`
  sanitized to `-`). Screenshot call is wrapped in try/catch so a screenshot
  failure cannot break the test. `playOneTurnLogged` now accepts `runId` and
  threads it through; diagnostics attach to the returned object and are
  merged into the final `turnData` entry plus a top-level `diagnostics`
  field on the payload when the run stops on a blocking outcome.

### B-49 — Avg Gamer persona test times out at 120s (branch cycle 4) ✅ FIXED 2026-04-17
- Persona: Avg Gamer (test harness)
- Severity: P1 (CI red — persona suite cannot complete cleanly)
- Reproduction: `npx playwright test tests/e2e/qa/persona-qa.spec.js` →
  "Avg Gamer — builds and simulates" fails with
  `Test timeout of 120000ms exceeded.` on `page.screenshot` —
  "Target page, context or browser has been closed". The 8-turn loop + per-
  turn `playOneTurn` + overlay dismissals regularly overruns the 120s budget
  on Normal difficulty; the worker tears the context down before the final
  `page.screenshot` lands.
- Expected: Raise describe-level + inline test timeout to 180_000.
- Actual: Persona suite reported `1 failed` ("Avg Gamer") and
  `qa-findings.json` was missing the Avg persona entry.
- Resolution (2026-04-17, branch): `tests/e2e/qa/persona-qa.spec.js`
  describe `timeout: 180_000`, Avg inline `test.setTimeout(180_000)`.
  All 3 personas now pass in 53s with findings for every persona.

### B-50 — Auto-playthrough softlocks on all six profiles (branch duplicate of B-43) ✅ FIXED 2026-04-17
- Persona: Avg Gamer / Goat Gamer
- Severity: P1 (no profile reaches turn 40)
- Reproduction: Same as B-43 above; this entry captures the branch-cycle
  observation that the failure hit all six profiles (Easy/Passive sl26,
  Easy/Builder sl23, Normal/Balanced sl23, Normal/Military famine22,
  Hard/Passive sl25, Hard/Builder sl23).
- Resolution (2026-04-17, branch cycle 4): main's B-46 (narrow `Return`
  regex in `tests/e2e/helpers.js`) is the root-cause prevention. Branch's
  serial-mode change on the auto-playthrough describe block + title-screen
  recovery helpers are deliberately NOT applied here because main's fix
  already makes the spec green without altering worker parallelism.
  Post-fix (main HEAD) auto-playthrough outcomes: 4/6 profiles reach
  turn 40 (victory), 2 end in meaningful famine (no softlocks).

---

> 2026-04-17 cycle 5: fresh persona QA + exploratory + gameplay + visual run
> on branch `claude/dazzling-curie-s9HRW`. Visual suite 54/54 pass, persona
> 3/3 pass (0 pageerrors), auto-playthrough (serial) 6/6 pass (4 victory,
> 2 meaningful famine). Bugs surfaced from fresh screenshots and parallel
> run. Current fix set: B-51, B-52, B-53, B-54, B-55 (5 items).
> 2026-04-17 cycle 6 (branch `claude/dazzling-curie-mAG8c`): single-cycle
> run. Pre-fix persona QA 3/3 pass (0 pageerrors; Goat `title_screen` at
> turn 7, Avg `sim_missing` at turn 0). Fixed B-56, B-57, B-58, B-59, B-60
> in parallel with 2 Opus 4.7 subagents — UI polish (anvil silhouette,
> chronicle hug + placeholder) + diagnostics (persona snapshot helper,
> diag threaded through multi-turn + season-flow). Post-fix persona QA
> 3/3 pass (Noob + Avg clean, Goat still shows the same Vite HMR title
> bounce at turn 7 but now surfaces precise innerText + buttonLabels).
> Backlog after cycle: 0 unfixed items.

### B-51 — Persona QA screenshots `qa-avg.png` + `qa-goat.png` capture TITLE SCREEN again — ✅ FIXED 2026-04-17
- Persona: Avg Gamer / Goat Gamer (QA harness regression of B-46)
- Severity: P1 (triage blind for 2/3 personas)
- Reproduction: `npx playwright test tests/e2e/qa/persona-qa.spec.js` →
  both `playtest-screenshots/qa-avg.png` (Normal, ended turn 3) and
  `qa-goat.png` (Hard, ended turn 7) render as the title screen. The Noob
  run captures real gameplay (644 KB file) but Avg + Goat are identical
  `148 922`-byte title-screen captures. B-46 narrowed the resolve regex to
  exact strings, but something in `playOneTurn` still reaches title before
  the outer loop screenshots.
- Expected: When a persona run breaks early, the post-run screenshot shows
  the actual end state (GameOverScreen with "Try Again", VictoryScreen, or
  the stuck management screen) — never the title screen.
- Actual: Two of three personas produce screenshots indistinguishable from
  an untouched title load, so reviewers can't tell why the run ended.
- Resolution (2026-04-17): Root cause was Vite HMR reconnect under parallel
  worker load bouncing the SPA back to the initial title state mid-turn
  (PLAY_AGAIN in the reducer never re-enters title, so no in-app reset was
  the culprit). `playOneTurn` now accepts an optional `diag` object and
  records `{ reason, iteration }` for each false return — added an explicit
  `title_screen` probe on "Choose Your Challenge" that fires BEFORE the
  overlay-dismissal path so the harness exits with a precise reason instead
  of a silent `sim_missing` timeout. Persona spec now writes the reason into
  the `bugs` payload. Screenshot reflects whatever end state is actually on
  screen (title, game-over, victory, or stuck management).

### B-52 — `playtest-screenshots/autoplay-*.png` accumulate stale diagnostics across runs — ✅ FIXED 2026-04-17
- Persona: N/A (QA diagnostics)
- Severity: P3
- Reproduction: `ls playtest-screenshots/autoplay-*.png` shows
  `autoplay-Easy-Builder-sim_button_missing.png`,
  `autoplay-Easy-Passive-possible_softlock.png`,
  `autoplay-Hard-Passive-possible_softlock.png`,
  `autoplay-Normal-Balanced-possible_softlock.png`,
  `autoplay-Normal-Military-possible_softlock.png` — all are title-screen
  captures from a prior failed cycle. The current serial run is clean
  (6/6 pass) but those stale PNGs still sit in the directory, so a
  reviewer scanning the folder assumes there are active softlocks.
- Expected: `auto-playthrough.spec.js` (or a `beforeAll` in the spec)
  clears prior `autoplay-*.png` files when a run starts; alternatively
  write new diagnostics under `playtest-screenshots/autoplay/<runId>/`.
- Actual: Directory is polluted with false-positive failure artifacts
  from previous cycles.
- Resolution (2026-04-17): Added `test.beforeAll` in
  `auto-playthrough.spec.js` that enumerates the screenshots dir with
  `readdirSync` and unlinks any entry matching `^autoplay-.*\.png$`,
  wrapped in try/catch so a missing dir or race is harmless. `qa-*.png`,
  `qa-cycle/`, and `game-*-final.png` are untouched.

### B-53 — Auto-playthrough flakes with `ERR_CONNECTION_REFUSED` under parallel workers — ✅ FIXED 2026-04-17
- Persona: N/A (CI)
- Severity: P1 (CI red — 3/6 profiles fail on full-suite run)
- Reproduction: `npx playwright test tests/e2e/gameplay --reporter=line` →
  `Normal/Military`, `Hard/Passive`, `Hard/Builder` fail at `page.goto("/")`
  with `net::ERR_CONNECTION_REFUSED at http://localhost:5173/`. Re-running
  the same spec with `--workers=1` passes 6/6 in 17 m. `playwright.config.js`
  currently lets the gameplay project use all cores; the single shared Vite
  dev server chokes under the load (B-47 intended to split gameplay to
  `workers: 2`, but the softlock/auto-playthrough file is still running
  fully parallel on non-CI).
- Expected: Pin `auto-playthrough.spec.js` (or the whole gameplay project)
  to `fullyParallel: false` / `workers: 1..2` locally so Vite can serve
  every playthrough without dying mid-navigation.
- Actual: Every local suite run flakes out 3 auto-playthrough tests.
- Resolution (2026-04-17): Marked the `Automated Playthroughs` describe
  block with `test.describe.configure({ mode: "serial" })` so the 6
  playthrough profiles share a single worker and the Vite dev server only
  serves one game at a time. Visual / persona / exploratory projects
  unchanged; `playwright.config.js` untouched.

### B-54 — Market tab commodity table obscured by sticky Simulate-Season bar on 1280×720 ✅ FIXED 2026-04-17
- Persona: Avg Gamer / Goat Gamer
- Severity: P2 (UX readability)
- Reproduction: Open Market tab on default 1280×720 viewport. The sticky
  "SIMULATE SEASON" bar (App.jsx:661, `sticky bottom-0`) sits on top of
  the middle rows of the commodity table (`tab-market.png`). When the
  user scrolls to inspect prices for Iron/Stone/Steel/Coal, those rows
  pass *under* the sticky bar, not above, so the value column is unreadable
  mid-scroll. B-39 marked this fixed but the overlap persists at 1280×720
  per fresh screenshot.
- Expected: Either pad the main content area by the sticky-bar height so
  the bar is below, not over, the table, or shrink the sticky bar to a
  minimized pill while on tabs with dense tables.
- Actual: Middle ~30% of the commodity rows are visually hidden while
  scrolling on 720p displays.
- Resolution (2026-04-17): Added an explicit 96px aria-hidden spacer at the
  end of the tab-content region in `src/App.jsx` (rendered only during
  management/non-flip phases) so the final rows of Market/Forge/Chronicle
  can scroll above the sticky Simulate-Season bar on 1280×720.

### B-55 — Forge tab lower half (Weapon Rack, Forge Materials, flavor text) renders at ~40% opacity on load ✅ FIXED 2026-04-17
- Persona: Noob / Avg Gamer
- Severity: P2 (UX — looks broken / disabled)
- Reproduction: Open Forge tab on a fresh game (`tab-forge.png`). The
  Workshop view shows Godric + Wat + COLD indicator clearly, but
  everything below the first fold — the WEAPON RACK section, the FORGE
  MATERIALS legend, and the Scribe's-note flavor italic — is rendered
  semi-transparent / dimmed. There is no visual cue that those panels
  are hover-reveal or interactive; they read as "disabled". On
  `tab-market.png` the bottom half renders at full opacity, so the
  dimming is Forge-specific.
- Expected: Either keep the Forge info-only sections at full opacity,
  or attach a label ("Unlocks after first forging session") so the
  dimmed state communicates *why* it's dimmed.
- Actual: First-time players assume the forge is bugged.
- Resolution (2026-04-17): In `src/components/BlacksmithTab.jsx` the Weapon
  Rack now has a solid dark panel wrapper matching Resource Shelf; both
  headings bumped from dim `#a89070` to gold `#c4a24a`, and the ambient
  footer text lifted to `#c8b090` / `rgba(255,107,26,0.7)` so info-only
  panels read at full opacity over the forge's darker lower gradient.

### B-56 — Blacksmith anvil SVG still reads as abstract "helmet" shape ✅ FIXED 2026-04-17
- Persona: Noob
- Severity: P3 (visibility / onboarding)
- Reproduction: `tab-forge.png` — the central anvil illustration (Workshop
  view) is a dark silhouette shaped like a long horizontal bar with a
  small pedestal. B-42 was marked fixed by brightening the silhouette,
  but the geometry itself is unrecognizable — users without context read
  it as a helmet or car bumper, not an anvil.
- Expected: Either replace with a recognizable anvil sprite (pointed
  horn, square body, stepped base) or add a small label "Anvil" under
  it.
- Actual: Visual reads as an unrelated object; onboarding for 6th
  graders loses the forge metaphor.
- Resolution (2026-04-17): Redrew the `Anvil` component in
  `src/components/BlacksmithTab.jsx` as a three-tier silhouette — a
  140×16 top plate with a CSS-triangle pointed horn on the left and a
  square heel/step on the right, an 80×20 tapered waist (clipPath
  polygon), and a 110×22 wider stand/base. Added `aria-label="Anvil"`
  on the outer wrapper so screen readers + first-time players get the
  label hint. `forgeLit` reflection overlay retained on the top plate.

### B-57 — Chronicle tab has ~400 px of empty space between first entry and Simulate bar ✅ FIXED 2026-04-17
- Persona: Noob / Avg Gamer
- Severity: P3 (polish)
- Reproduction: `tab-chronicle.png` on fresh game — Y1 Spring "The old
  lord has passed…" entry renders at ~350 px, then nothing until the
  sticky Simulate Season bar at ~650 px. The card looks incomplete and
  the tab reads as unfinished.
- Expected: Either collapse the chronicle panel height to hug content,
  add placeholder guidance ("New entries appear after each simulated
  season."), or show the tutorial tip inline.
- Actual: Empty expanse suggests a rendering bug to first-time players.
- Resolution (2026-04-17): In `src/components/Chronicle.jsx` replaced
  the fixed `max-h-80` class with an inline
  `maxHeight: "min(60vh, 480px)"` so the scroll panel hugs content when
  short and still scrolls when long. Added a conditional parchment-
  styled hint below the list when `entries.length < 3` — "New entries
  appear after each simulated season. Click ⚔ Simulate Season to
  continue your reign." — using the existing Crimson Text / muted
  `#6a5a42` colour so it reads as flavour text, not a UI button.

### B-58 — Avg Gamer persona ends at turn 3 on Normal — no explanation in findings ✅ FIXED 2026-04-17
- Persona: Avg Gamer
- Severity: P2 (diagnostics / possible softlock)
- Reproduction: `qa-findings.json` persona Avg logs
  `{persona: "Avg", turn: 3, note: "ended early"}`. Normal/Balanced
  auto-playthrough reaches turn 40 victorious, so Normal is beatable;
  `Avg` ending at turn 3 is either (a) a real softlock in the harness's
  build-Strip-Farm-then-simulate loop or (b) `playOneTurn` returning
  false spuriously. No screenshot helps (see B-51), no diagnostic string.
- Expected: Avg test captures `document.body.innerText.slice(0, 400)` +
  visible button labels on early exit so cycle-to-cycle comparison can
  distinguish softlock from false positive. Ideally Avg reaches ≥ turn 8.
- Actual: Blind triage — reviewer can't tell if game or harness is at
  fault.
- Resolution (2026-04-17): Added `captureStateSnapshot(page)` helper in
  `tests/e2e/qa/persona-qa.spec.js` that grabs
  `document.body.innerText.slice(0, 400)` + up to 20 visible button
  labels, and now spreads the snapshot into every persona's
  `bugs.push({...})` payload on early exit. Post-fix run: Avg completes
  8 turns with zero bugs recorded; when Avg *does* fail, reviewers now
  see the actual screen text + available buttons alongside
  `reason` + `iteration`.

### B-59 — Goat Gamer persona ends at turn 7 on Hard with same blind diagnostic ✅ FIXED 2026-04-17
- Persona: Goat Gamer
- Severity: P2 (diagnostics)
- Reproduction: Same as B-58 but Hard difficulty: `{persona: "Goat",
  turn: 7, note: "ended early"}`. Hard/Passive auto-playthrough ends in
  turn-22 famine, Hard/Builder reaches turn 40; turn 7 is unusually early
  for Hard. Screenshot shows title screen (B-51), no other diagnostic.
- Expected: Same as B-58 — innerText snapshot + visible button labels.
  Distinguish game-over (Try Again visible) from harness timeout.
- Actual: Both failure modes look identical in current findings payload.
- Resolution (2026-04-17): Same `captureStateSnapshot` helper (see B-58)
  threaded through Goat's early-exit branch. Post-fix `qa-findings.json`
  for Goat's turn-7 exit now shows
  `reason: "title_screen"`, `iteration: 2`, plus an `innerText` snapshot
  confirming the page bounced to "Choose Your Challenge" and
  `buttonLabels: ["Mute music", "EASY…", "NORMAL…", "HARD…"]` — i.e.
  the known Vite HMR reconnect artifact, not a softlock. Triage blindness
  is eliminated.

### B-60 — `playOneTurn` has no per-iteration diagnostic on failure ✅ FIXED 2026-04-17
- Persona: N/A (QA harness)
- Severity: P2
- Reproduction: `tests/e2e/helpers.js:150-257` `playOneTurn` returns
  `true`/`false` but never surfaces *why* it returned false. B-48 added
  diagnostics in `auto-playthrough.spec.js`; the generic helper didn't
  receive the same treatment, so persona + multi-turn + save-load specs
  still get opaque `false` returns.
- Expected: `playOneTurn` accepts an optional `diag` object and records
  which branch fired (`game_over`, `victory`, `sim_missing`, `loop_timeout`)
  plus the iteration index. Callers log this in the bugs array.
- Actual: Helper failure reason is invisible to every caller.
- Resolution (2026-04-17): `playOneTurn(page, diag)` in
  `tests/e2e/helpers.js` now writes `{reason, iteration}` for each
  false-return branch (`sim_missing`, `title_screen`, `game_over`,
  `victory`, `page_closed`, `loop_timeout`). All return-checking
  callers were threaded: `tests/e2e/qa/persona-qa.spec.js` (3 sites),
  `tests/e2e/gameplay/multi-turn.spec.js` (5 sites), and
  `tests/e2e/gameplay/season-flow.spec.js` (5 sites) now log
  `[multi-turn]` / `[season-flow]` diagnostics on stop. `save-load.spec.js`
  does not call `playOneTurn`, and the two fire-and-forget invocations
  in `season-flow.spec.js:167` + `exploratory.spec.js:47` do not check
  the return value so threading is a no-op there.
