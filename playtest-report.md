# The Lord's Ledger — Playwright Playtest Report

> Generated: 2026-03-08 | Games: 6 | Method: Headless Playwright + 6th-grader personas
>
> Each persona simulates a distinct play style a 6th grader might adopt. Games play through the real browser UI using Playwright, interacting with buttons, tabs, and events exactly as a student would.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total games | 6 |
| Victories | 2 (33%) |
| Game Overs | 0 (0%) |
| Timed out / Got stuck | 4 (67%) |
| Avg turns survived | 16.0/28 |
| Avg playthrough time | 113s |
| Console errors | 0 |

**Key takeaway:** Only 2 of 6 personas completed a full game. The other 4 hit either the game timeout or got stuck in UI loops (synergy toast auto-dismiss timing, Scribe's Note overlays). Zero game-overs occurred — the game rarely kills the player outright, but several personas hovered dangerously close to death. The **People meter is the most volatile** — it goes critically high (85+) for builders and critically low (<15) for passive players.

---

## Per-Persona Results

| Persona | Difficulty | Outcome | Turns | Buildings | Trades | Flips | Synergies | Time |
|---------|-----------|---------|-------|-----------|--------|-------|-----------|------|
| Impulsive Builder | normal | **WIN** | 27 | 10 | 0 | Yes | 6 | 103s |
| War Kid | normal | STUCK | 6 | 0 | 0 | No | 3 | 205s |
| Cautious Explorer | easy | STUCK | 7 | 5 | 0 | No | 4 | 47s |
| Random Clicker | normal | **WIN** | 25 | 5 | 5 | Yes | 5 | 102s |
| Trader Kid | normal | STUCK | 20 | 4 | 19 | Yes | 3 | 180s |
| Speedrunner | hard | STUCK | 11 | 0 | 0 | Yes | 1 | 40s |

### Persona Observations

- **Impulsive Builder** (WIN): Built 10 buildings, never traded. People meter was chronically high (85-95 for most of the game). Treasury was critically low (6-14) for 8+ turns. Won by the skin of their teeth with treasury=33, people=44, military=19, faith=78 on turn 28.
- **War Kid** (STUCK at T6): Built zero buildings because the strategy waits until turn 5 for military access. By then, the game was slow and the persona got stuck in a synergy toast loop. This reveals that **a military-only strategy is non-viable** — players who ignore the economy have nothing to do for 4 turns.
- **Cautious Explorer** (STUCK at T7): People meter hit **99** on turn 7 on Easy difficulty — one point from game over (100 = loss). **Easy mode's People meter climbs too aggressively.** The persona explored all tabs but got stuck after the People meter maxed out.
- **Random Clicker** (WIN): Survived all 28 turns with meters in dangerous territory most of the game. People dropped to 4 on turn 19 (nearly fatal). The random strategy's diversification inadvertently balanced the meters. Final state: treasury=12, people=56, military=13, faith=14 — all meters under 20 is terrifyingly close to death.
- **Trader Kid** (STUCK at T20): Active trader with 19 trades. Faith meter hit 91-92 in late game — dangerously close to game over at 100. Trade strategy with spice purchases pushed faith too high. Got stuck in a Scribe's Note / flip sequence.
- **Speedrunner** (STUCK at T12): Zero actions per turn. People crashed from 63 to 22 in 3 turns, then continued dropping. **Doing nothing is extremely punishing** — there's no passive stability.

---

## Victory Analysis

- **Impulsive Builder** (normal): Won at turn 28
  - Buildings built: 10 (Strip Farm x2, Demesne Field x2, Pasture, Fishpond, Apiary, Clay Pit, Herb Garden, Iron Mine)
  - Final meters: T:33 P:44 M:19 F:78
  - **Insight**: Building everything works but treasury stays dangerously low. Military and faith are unmanaged — they just drift.

- **Random Clicker** (normal): Won at turn 28
  - Buildings built: 5, Trades: 5
  - Final meters: T:12 P:56 M:13 F:14
  - **Insight**: Random play can win but every meter is in the danger zone. This is a nail-biter — not a satisfying victory for a 6th grader.

---

## UX Friction Points

These are moments where a 6th grader would get confused, frustrated, or stuck.

### Meter Critically Low (danger zone, no guidance shown)
- **Occurrences**: 30
- **Personas affected**: Impulsive Builder, Random Clicker, Trader Kid, Speedrunner
- **Meters affected**:
  - Treasury: 15x (most common — economy death spiral)
  - People: 10x (food/happiness collapse)
  - Military: 3x (neglect)
  - Faith: 2x (neglect)
- **Impact**: When treasury hits single digits, the player has no way to build, trade, or recruit. There's no clear recovery path shown in the UI.

### Meter Critically High (danger zone, no guidance shown)
- **Occurrences**: 29
- **Personas affected**: Impulsive Builder, Cautious Explorer, Random Clicker, Trader Kid
- **Meters affected**:
  - People: 19x (runs away on Easy, and for builders)
  - Faith: 6x (spice purchases + church donations push it too high)
  - Treasury: 4x
- **Impact**: Players don't realize that meters hitting 100 = game over. A 6th grader would think "high People is good!" and not understand why they lost. **This is the #1 confusion risk.**

### Locked Tabs Visible ("What's that?")
- **Occurrences**: 24 (every game)
- **Impact**: Every persona sees grayed-out Trade and Military tabs for the first 2-4 turns. No tooltip explains when they unlock. A 6th grader will click them, get frustrated, and wonder if the game is broken.

### Timeout / Stuck
- **Occurrences**: 4 games
- **Root causes**:
  - Synergy tier 1 toasts have a 5-second auto-dismiss timer that creates a wait loop
  - Scribe's Note overlays block all interaction until dismissed
  - Flip sequences require multiple precise clicks through decision/outcome/summary phases
- **Impact**: If a real player encounters these, they'd need to wait or figure out the dismiss pattern. Not intuitive.

---

## Event & Decision Analysis

### Most Common Events (across all 6 games)

| Event | Frequency | Notes |
|-------|-----------|-------|
| The Water Mill Opportunity | 6x | Every game sees this |
| The Crop Blight | 6x | Every game |
| The Wool Surplus | 5x | |
| The Accounting Books | 5x | |
| The Flood in the Lower Village | 5x | |
| The Trade Dispute | 5x | |
| The Court Dispute | 5x | |
| The Trade Road Opens | 5x | |
| The Hay Harvest Rush | 5x | |

**Observation**: Events repeat frequently even within 6 games. Players seeing the same event multiple times in a single playthrough would break immersion. The event pool may need expansion.

### Choice Patterns

Most personas picked Option 1 (the "safe" choice) ~70% of the time, which matches real 6th-grader behavior — they pick the first option that sounds reasonable. Only the Random Clicker varied choices.

**Observation**: If Option 1 is always the "safe" choice, players who always pick it will have a very uniform experience. Consider randomizing option order or making Option 2 more tempting.

---

## Building Activity

| Building | Times Built | Cost | Notes |
|----------|-------------|------|-------|
| Strip Farm | 6 | 100d | Most popular — cheap and produces grain |
| Demesne Field | 4 | 200d | Second choice |
| Apiary | 3 | 90d | Cheap but niche |
| Clay Pit | 3 | 110d | |
| Fishpond | 3 | 120d | |
| Pasture | 2 | 150d | |
| Herb Garden | 2 | 80d | Cheapest building |
| Iron Mine | 1 | 250d | Only built once — too expensive |
| Quarry | 0 | - | Never built |
| Timber Lot | 0 | - | Never built by automated personas |
| Fulling Mill | 0 | - | Never built (requires Pasture) |
| Brewery | 0 | - | Never built (requires Strip Farm) |

**Observations**:
- Advanced buildings (Fulling Mill, Brewery) are **never built** because they require prerequisite buildings. A 6th grader won't understand prerequisite chains without clearer UI.
- Iron Mine, Quarry, and Timber Lot are rarely/never built — too expensive for the early game when money is tight.
- The cheapest buildings (Herb Garden 80d, Apiary 90d, Strip Farm 100d) dominate because players can actually afford them.

---

## Tab Usage

| Tab | Games Used | % |
|-----|------------|---|
| Estate | 5/6 | 83% |
| Trade | 3/6 | 50% |
| Military | 3/6 | 50% |
| People | 2/6 | 33% |
| Chronicle | 1/6 | 17% |

**Key findings**:
- **People tab is underused** (33%). Tax rate and church donations are only accessible here. Most players never change their tax rate from default "medium".
- **Chronicle tab is almost never visited** (17%). The chronicle is the game's narrative backbone but players don't seek it out during management phase.
- **Trade tab is used by half** — but only when the persona specifically targets trading. Casual players don't discover it.

---

## Meter Trajectories

### Impulsive Builder (normal) — **WON**

| Turn | Treasury | People | Military | Faith |
|------|----------|--------|----------|-------|
| 1 | 40 | 50 | - | - |
| 5 | 35 | 83 | 34 | 45 |
| 10 | 10 | 95 | 49 | 59 |
| 15 | 14 | 88 | 46 | 64 |
| 20 | 14 | 88 | 19 | 89 |
| 25 | 17 | 63 | 28 | 81 |
| 28 | 33 | 44 | 19 | 78 |

**Pattern**: People rockets to 95 by turn 10, treasury stays in single digits. Military and faith are neglected. The game is carried entirely by building production.

### Cautious Explorer (easy) — **STUCK at T7**

| Turn | Treasury | People | Military | Faith |
|------|----------|--------|----------|-------|
| 1 | 50 | 55 | - | - |
| 3 | 50 | 78 | 35 | - |
| 5 | 72 | 85 | 43 | 50 |
| 7 | 68 | **99** | 34 | 44 |

**Pattern**: People meter skyrockets from 55 to 99 in 7 turns on Easy. The Cautious Explorer set tax to Low and built buildings — both of which boost People. **Easy mode needs a People meter growth cap or slower People gain.**

### Random Clicker (normal) — **WON**

| Turn | Treasury | People | Military | Faith |
|------|----------|--------|----------|-------|
| 1 | 40 | 50 | - | - |
| 10 | 85 | 45 | 20 | 35 |
| 15 | 63 | 14 | 26 | 26 |
| 20 | 29 | 9 | 16 | 18 |
| 25 | 19 | 29 | 20 | 28 |
| 28 | 12 | 56 | 13 | 14 |

**Pattern**: All meters flirt with death. People drops to 4 on turn 19, faith to 12 on turn 19. This player survived by pure luck. **A 6th grader would have a heart attack watching these numbers.**

### Speedrunner (hard) — **STUCK at T12**

| Turn | Treasury | People | Military | Faith |
|------|----------|--------|----------|-------|
| 1 | 30 | 45 | - | - |
| 5 | 35 | 58 | 23 | 40 |
| 8 | 65 | 63 | 22 | 34 |
| 12 | 73 | 15 | 14 | 40 |

**Pattern**: Doing nothing on Hard causes People and Military to crater. **There's no floor — passive play is a death sentence.** A kid who doesn't understand the game will lose fast.

---

## Recommendations for Gameplay Fixes & Additions

### [CRITICAL] Balance: People meter hits 100 too easily on Easy mode

**Evidence**: Cautious Explorer reached People=99 on turn 7 on Easy. Building + low taxes + food surplus pushes People relentlessly upward.

**Fix options**:
1. Cap People meter gain to +3 per turn maximum
2. Add a "People are thriving — but they're getting demanding" event that drains People when it's above 80
3. Reduce the People boost from food surplus on Easy difficulty
4. Show a **"People meter too high!"** warning with guidance: "Raise taxes or recruit soldiers to bring balance"

### [CRITICAL] UX: Players don't understand that meters at 100 = loss

**Evidence**: People meter hits 85+ in 4 of 6 games. Players (especially on Easy) will think high People is good.

**Fix options**:
1. Add a prominent banner when any meter is above 85: "WARNING: If People reaches 100, you lose! Lower it by raising taxes or recruiting soldiers."
2. Change the meter bar color to red when above 85 (currently only low meters get red)
3. Add a tutorial tooltip on turn 1 explaining "Keep all meters between 1-99"

### [HIGH] Balance: Treasury death spiral has no recovery path

**Evidence**: Treasury went critically low (<=15) in 15 occurrences across 4 personas. Once treasury hits 0, there's nothing to sell, nothing to build, and no way to earn money except passive income.

**Fix options**:
1. Add an "Emergency Tax" action that gives immediate denarii but tanks People
2. Add a "Sell Building" button that's more prominent (demolish exists but players don't find it)
3. Increase passive income from castle level 1
4. Add a loan mechanic from the Church (costs faith, gives denarii)

### [HIGH] UX: Military-focused players have nothing to do for 4 turns

**Evidence**: War Kid built 0 buildings and had 0 trades in the first 4 turns because the Military tab doesn't unlock until turn 5. The persona essentially did nothing.

**Fix options**:
1. Add a "Prepare for War" mini-objective on turns 1-4 (stockpile iron, build quarry)
2. Show a quest/goal: "Build an Iron Mine and Quarry before Turn 5 to be ready for military"
3. Unlock Military tab on turn 3 instead of 5 (it's already unlocked as a meter on turn 3)

### [HIGH] UX: Synergy toasts block game flow

**Evidence**: Tier 1 synergy toasts have a 5-second auto-dismiss timer that creates UI dead time. Multiple toasts queue up and create multi-second waits where the player can't do anything.

**Fix options**:
1. Make tier 1 toasts non-blocking (show in corner, don't prevent interaction)
2. Batch multiple tier 1 toasts into one "3 paths unlocked!" notification
3. Reduce auto-dismiss timer from 5s to 2.5s

### [MEDIUM] Balance: Faith meter runs away with spice purchases

**Evidence**: Trader Kid's faith hit 91-92 by turn 20-22. Buying spices + church donations push faith too high with no counter-mechanic.

**Fix options**:
1. Add diminishing returns on faith gain from repeated spice purchases
2. Add events that drain faith when it's above 70 ("The bishop demands a tithe!")
3. Cap faith gain per turn at +5

### [MEDIUM] UX: People tab and Chronicle tab are underused

**Evidence**: People tab used in 33% of games, Chronicle in 17%.

**Fix options**:
1. Auto-switch to People tab on turn 1 after building something ("Now set your tax rate!")
2. Add a notification badge on tabs that need attention
3. Show Chronicle highlights in the Dashboard area so players don't need to visit the tab

### [MEDIUM] UX: Locked tabs need "unlocks at" tooltip

**Evidence**: 24 locked-tab friction points across all 6 games. Every persona encounters them.

**Fix**: Add tooltip or subtitle text: "Unlocks Turn 3" / "Unlocks Turn 5" below the locked tab icon.

### [MEDIUM] Balance: Doing nothing should not be instantly fatal

**Evidence**: Speedrunner (zero actions per turn) saw People crash from 63 to 15 in 4 turns on Hard.

**Fix options**:
1. Add a minimum passive food production (foraging) even with no buildings
2. Slow down meter decay in the first 8 turns (tutorial grace period)
3. Add "Your people are starving — build a Strip Farm!" emergency hint

### [MEDIUM] Engagement: Advanced buildings are never built

**Evidence**: Fulling Mill, Brewery, Quarry, and Timber Lot were never built. Prerequisite chains are too complex and costs are too high.

**Fix options**:
1. Show a "build path" visualization: "Strip Farm -> Brewery (unlocks Ale production)"
2. Reduce costs of advanced buildings by 20-30%
3. Add a quest/milestone: "Build a Brewery to unlock Ale trading!"

### [LOW] UX: Add contextual "What should I do?" hints

6th graders need guidance. A small "?" button per tab that says something like "Try building a Strip Farm to produce grain" would reduce confusion significantly.

### [LOW] Engagement: Add achievements/milestones

Badges like "First Trade!", "Castle Upgraded!", "Survived 14 Turns!" give tangible goals and dopamine hits. 6th graders are highly motivated by collectible achievements.

### [LOW] UX: Add undo/confirmation for costly actions

Kids misclick. Add a confirmation dialog for expensive purchases (>200d) or irreversible actions (demolish).

### [LOW] Engagement: Add seasonal tips between turns

Show tips like "Sell goods on the Trade tab to earn more denarii!" during the season transition. This teaches game mechanics without feeling like a tutorial.

### [LOW] Balance: Consider a checkpoint/rewind system

If a game-over feels unfair, let kids rewind 1-2 turns. Reduces frustration without removing consequences entirely.

### [LOW] Engagement: Event variety needs expansion

**Evidence**: The same events appear in 5-6 of 6 games. A full 28-turn game will see many repeats. Consider adding 10-15 more seasonal and random events to the pool.

---

## Technical Notes

- **Zero console errors** across all 6 games — clean codebase
- **No crashes or React errors** — state management is solid
- **Scribe's Note overlay** (z-50 fixed position) blocks all game interaction until dismissed — working as designed but causes automation friction
- **Synergy toast** tier 1 auto-dismiss creates a 5-second dead zone — real players would just wait, but it feels like lag

---

## Appendix: Action Log Summary

### Impulsive Builder
- Total actions: 38
- Buildings built: 10
- Trades made: 0
- Events faced: 54
- Friction points: 30
- Console errors: 0

### War Kid
- Total actions: 11
- Buildings built: 0
- Trades made: 0
- Events faced: 10
- Friction points: 5
- Console errors: 0
- Disabled clicks: 4 (tried to click locked military tab)

### Cautious Explorer
- Total actions: 20
- Buildings built: 5
- Trades made: 0
- Events faced: 14
- Friction points: 10
- Console errors: 0

### Random Clicker
- Total actions: 37
- Buildings built: 5
- Trades made: 5
- Events faced: 50
- Friction points: 22
- Console errors: 0

### Trader Kid
- Total actions: 75
- Buildings built: 4
- Trades made: 19
- Events faced: 40
- Friction points: 12
- Console errors: 0

### Speedrunner
- Total actions: 12
- Buildings built: 0
- Trades made: 0
- Events faced: 20
- Friction points: 8
- Console errors: 0
