# The Lord's Ledger — Playwright Playtest Report
> Generated: 2026-04-14 | Games: 6 | Method: Headless Playwright + 6th-grader personas

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total games | 6 |
| Victories | 1 (17%) |
| Game Overs | 3 (50%) |
| Stuck/Crashed | 2 |
| Avg turns survived | 20.3/40 |
| Avg playthrough time | 225.2s |

## Per-Persona Results

| Persona | Difficulty | Outcome | Turns | Buildings | Trades | Flips | Synergies | Time |
|---------|-----------|---------|-------|-----------|--------|-------|-----------|------|
| Impulsive Builder | normal | WIN | 40 | 0 | 0 | Yes | 6 | 185.8s |
| War Kid | normal | STUCK | 7 | 0 | 0 | Yes | 4 | 336.9s |
| Cautious Explorer | easy | LOSS | 29 | 0 | 0 | Yes | 6 | 247.3s |
| Random Clicker | normal | LOSS | 21 | 0 | 0 | Yes | 5 | 106.2s |
| Trader Kid | normal | STUCK | 6 | 0 | 0 | Yes | 4 | 390.5s |
| Speedrunner | hard | LOSS | 19 | 0 | 0 | Yes | 4 | 84.7s |

## Game Over Analysis

### Death Causes

- **famine — The Great Famine**: 3x

### Death Details

- **Cautious Explorer** (easy): Died at turn 29
  - Reason: famine — The Great Famine
  - Final resources: Denarii:? Food:? Pop:? Garrison:? Morale:?
- **Random Clicker** (normal): Died at turn 21
  - Reason: famine — The Great Famine
  - Final resources: Denarii:? Food:? Pop:? Garrison:? Morale:?
- **Speedrunner** (hard): Died at turn 19
  - Reason: famine — The Great Famine
  - Final resources: Denarii:? Food:? Pop:? Garrison:? Morale:?

## Victory Analysis

- **Impulsive Builder** (normal): Won at turn 40
  - Final resources: Denarii:? Food:? Pop:? Garrison:? Morale:?
  - Buildings built: 0, Trades: 0

## UX Friction Points

Moments where a 6th grader would get confused, frustrated, or stuck.

### Meter Critically Low (danger zone)
- **Occurrences**: 5
- **Personas affected**: Impulsive Builder, Cautious Explorer, Random Clicker
- **Meters affected**:
  - food: 5x

### game_timeout
- **Occurrences**: 2
- **Personas affected**: War Kid, Trader Kid

## Console Errors

- `Failed to load resource: net::ERR_CERT_AUTHORITY_INVALID`
- `%s a style property during rerender (%s) when a conflicting property is set (%s) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, `

## Event & Decision Analysis

### Events Encountered

No events were encountered (games may have ended before events fired).

## Building Activity

No buildings were constructed across all playthroughs.

## Tab Usage

| Tab | Games Used |
|-----|------------|
| Estate | 5/6 |
| Military | 3/6 |
| People | 2/6 |
| Chronicle | 1/6 |
| Trade | 0/6 |

## Meter Trajectories

### Impulsive Builder (normal)

| Turn | Denarii | Food | Population | Garrison | Morale |
|------|---------|------|------------|----------|--------|
| 1 | 500 | 365 | 20 | 5 | 50 |
| 2 | 488 | 344 | 20 | 5 | 55 |
| 3 | 516 | 319 | 20 | 7 | 90 |
| 4 | 651 | 319 | 20 | 7 | 94 |
| 5 | 639 | 318 | 24 | 13 | 100 |
| 6 | 548 | 316 | 25 | 16 | 100 |
| 7 | 571 | 331 | 25 | 16 | 99 |
| 8 | 806 | 279 | 26 | 16 | 99 |
| 9 | 995 | 261 | 26 | 16 | 99 |
| 10 | 939 | 280 | 26 | 19 | 100 |
| 11 | 823 | 292 | 27 | 21 | 100 |
| 12 | 811 | 300 | 27 | 22 | 100 |
| 13 | 990 | 236 | 31 | 25 | 100 |
| 14 | 1098 | 173 | 32 | 25 | 100 |
| 15 | 1177 | 161 | 33 | 25 | 99 |
| 16 | 1414 | 122 | 33 | 25 | 100 |
| 17 | 1388 | 136 | 39 | 25 | 100 |
| 18 | 1384 | 116 | 40 | 25 | 100 |
| 19 | 1271 | 133 | 40 | 25 | 99 |
| 20 | 1482 | 121 | 41 | 25 | 100 |
| 21 | 1564 | 109 | 44 | 25 | 100 |
| 22 | 1662 | 84 | 45 | 25 | 96 |
| 23 | 1560 | 63 | 46 | 25 | 100 |
| 24 | 1872 | 76 | 46 | 25 | 96 |
| 25 | 1896 | 101 | 49 | 25 | 91 |
| 26 | 1976 | 109 | 50 | 25 | 89 |
| 27 | 1916 | 113 | 50 | 25 | 87 |
| 28 | 2219 | 107 | 50 | 25 | 85 |
| 29 | 2319 | 70 | 54 | 25 | 100 |
| 30 | 2381 | 46 | 54 | 25 | 100 |
| 31 | 2273 | 26 | 54 | 25 | 100 |
| 32 | 2693 | 12 | 54 | 25 | 91 |
| 33 | 2621 | 0 | 45 | 22 | 81 |
| 34 | 2605 | 24 | 33 | 17 | 68 |
| 35 | 2489 | 19 | 33 | 19 | 92 |
| 36 | 2651 | 36 | 33 | 20 | 100 |
| 37 | 2715 | 31 | 36 | 21 | 91 |
| 38 | 2791 | 42 | 36 | 21 | 84 |
| 39 | 2897 | 55 | 36 | 21 | 77 |
| 40 | 3047 | 53 | 36 | 21 | 70 |

### War Kid (normal)

| Turn | Denarii | Food | Population | Garrison | Morale |
|------|---------|------|------------|----------|--------|
| 1 | 500 | 365 | 20 | 5 | 50 |
| 2 | 598 | 350 | 21 | 5 | 55 |
| 3 | 721 | 346 | 21 | 5 | 60 |
| 4 | 765 | 356 | 21 | 5 | 65 |
| 5 | 761 | 370 | 21 | 7 | 74 |
| 6 | 592 | 350 | 21 | 13 | 93 |
| 7 | 789 | 317 | 21 | 13 | 97 |

### Cautious Explorer (easy)

| Turn | Denarii | Food | Population | Garrison | Morale |
|------|---------|------|------------|----------|--------|
| 1 | 700 | 480 | 22 | 5 | 50 |
| 2 | 621 | 484 | 23 | 5 | 55 |
| 3 | 601 | 456 | 23 | 7 | 90 |
| 4 | 852 | 411 | 25 | 7 | 94 |
| 5 | 990 | 386 | 28 | 8 | 91 |
| 6 | 889 | 408 | 28 | 8 | 95 |
| 7 | 742 | 387 | 28 | 11 | 100 |
| 8 | 714 | 359 | 31 | 12 | 100 |
| 9 | 750 | 294 | 31 | 12 | 99 |
| 10 | 666 | 256 | 31 | 17 | 100 |
| 11 | 697 | 235 | 31 | 19 | 100 |
| 12 | 859 | 199 | 33 | 19 | 99 |
| 13 | 733 | 220 | 34 | 19 | 99 |
| 14 | 624 | 159 | 34 | 20 | 100 |
| 15 | 699 | 148 | 35 | 20 | 99 |
| 16 | 888 | 107 | 37 | 20 | 99 |
| 17 | 1037 | 48 | 42 | 25 | 100 |
| 18 | 937 | 18 | 34 | 22 | 84 |
| 19 | 822 | 57 | 25 | 20 | 70 |
| 20 | 986 | 53 | 27 | 20 | 64 |
| 21 | 1094 | 0 | 27 | 21 | 67 |
| 22 | 1121 | 18 | 20 | 20 | 84 |
| 23 | 1138 | 12 | 15 | 20 | 100 |
| 24 | 1083 | 39 | 13 | 21 | 100 |
| 25 | 1048 | 37 | 19 | 25 | 100 |
| 26 | 1130 | 0 | 19 | 25 | 100 |
| 27 | 1077 | 9 | 14 | 23 | 90 |
| 28 | 1297 | 12 | 12 | 20 | 76 |
| 29 | 1241 | 0 | 12 | 22 | 99 |

### Random Clicker (normal)

| Turn | Denarii | Food | Population | Garrison | Morale |
|------|---------|------|------------|----------|--------|
| 1 | 500 | 365 | 20 | 5 | 50 |
| 2 | 391 | 349 | 20 | 5 | 55 |
| 3 | 472 | 347 | 20 | 5 | 60 |
| 4 | 550 | 365 | 22 | 4 | 56 |
| 5 | 672 | 360 | 23 | 5 | 70 |
| 6 | 872 | 354 | 23 | 4 | 65 |
| 7 | 877 | 308 | 24 | 5 | 70 |
| 8 | 1061 | 257 | 25 | 5 | 74 |
| 9 | 1052 | 219 | 19 | 5 | 70 |
| 10 | 1011 | 189 | 19 | 5 | 74 |
| 11 | 1005 | 157 | 20 | 6 | 90 |
| 12 | 1096 | 159 | 18 | 5 | 85 |
| 13 | 1136 | 102 | 19 | 5 | 89 |
| 14 | 1020 | 87 | 20 | 7 | 100 |
| 15 | 877 | 78 | 20 | 6 | 99 |
| 16 | 918 | 68 | 22 | 8 | 100 |
| 17 | 850 | 62 | 18 | 7 | 76 |
| 18 | 853 | 35 | 18 | 8 | 86 |
| 19 | 830 | 6 | 18 | 8 | 79 |
| 20 | 974 | 0 | 13 | 6 | 66 |
| 21 | 903 | 9 | 8 | 6 | 45 |

### Trader Kid (normal)

| Turn | Denarii | Food | Population | Garrison | Morale |
|------|---------|------|------------|----------|--------|
| 1 | 500 | 365 | 20 | 5 | 50 |
| 2 | 506 | 343 | 20 | 6 | 61 |
| 3 | 621 | 331 | 21 | 6 | 66 |
| 4 | 771 | 295 | 21 | 7 | 82 |
| 5 | 964 | 285 | 21 | 6 | 77 |
| 6 | 1003 | 251 | 22 | 8 | 100 |

### Speedrunner (hard)

| Turn | Denarii | Food | Population | Garrison | Morale |
|------|---------|------|------------|----------|--------|
| 1 | 400 | 255 | 18 | 3 | 50 |
| 2 | 383 | 244 | 19 | 3 | 55 |
| 3 | 525 | 208 | 19 | 3 | 60 |
| 4 | 590 | 234 | 19 | 3 | 65 |
| 5 | 587 | 246 | 19 | 4 | 85 |
| 6 | 648 | 245 | 19 | 4 | 89 |
| 7 | 529 | 224 | 19 | 8 | 100 |
| 8 | 649 | 213 | 19 | 8 | 99 |
| 9 | 507 | 203 | 14 | 7 | 79 |
| 10 | 615 | 177 | 14 | 9 | 98 |
| 11 | 566 | 155 | 14 | 10 | 100 |
| 12 | 529 | 141 | 14 | 11 | 100 |
| 13 | 523 | 156 | 17 | 14 | 100 |
| 14 | 789 | 106 | 17 | 14 | 99 |
| 15 | 855 | 87 | 17 | 14 | 99 |
| 16 | 1091 | 76 | 17 | 15 | 99 |
| 17 | 1046 | 45 | 14 | 15 | 79 |
| 18 | 926 | 15 | 15 | 19 | 100 |
| 19 | 800 | 12 | 11 | 18 | 100 |

## Recommendations for Gameplay Fixes & Additions

Based on the playtest data, here are prioritized suggestions:

### [MEDIUM] Balance: Low win rate for target audience

Only 17% won. Consider gentler penalties or a "story mode".

### [MEDIUM] Engagement: Trade tab never used

No persona visited the trade tab. Consider: tutorial prompt directing there, auto-switching when it unlocks, or making it visually prominent.

### [MEDIUM] UX: Add contextual "What should I do?" hints

6th graders need guidance. A hint button per tab ("Try building a Strip Farm!") would reduce confusion.

### [MEDIUM] Engagement: Add a "quick tips" loading screen between seasons

Show tips like "Sell goods on the Trade tab to earn more denarii!" during the season transition.

### [LOW] Engagement: Add achievements/milestones

Badges like "First Trade!", "Castle Upgraded!", "Survived 14 Turns!" give tangible goals and dopamine hits.

### [LOW] UX: Add undo/confirmation for costly actions

Kids misclick. Confirm expensive purchases (>200d) or irreversible actions (demolish).

### [LOW] Balance: Consider an auto-save / checkpoint system

If a game-over feels unfair, let kids rewind 1-2 turns. Reduces frustration without removing consequences.

## Appendix: Action Log Summary

### Impulsive Builder
- Total actions: 41
- Buildings built: 0
- Trades made: 0
- Events faced: 0
- Friction points: 1
- Console errors: 2
- Disabled clicks: 0

### War Kid
- Total actions: 17
- Buildings built: 0
- Trades made: 0
- Events faced: 0
- Friction points: 1
- Console errors: 2
- Disabled clicks: 0

### Cautious Explorer
- Total actions: 59
- Buildings built: 0
- Trades made: 0
- Events faced: 0
- Friction points: 3
- Console errors: 4
- Disabled clicks: 0

### Random Clicker
- Total actions: 31
- Buildings built: 0
- Trades made: 0
- Events faced: 0
- Friction points: 1
- Console errors: 14
- Disabled clicks: 0

### Trader Kid
- Total actions: 7
- Buildings built: 0
- Trades made: 0
- Events faced: 0
- Friction points: 1
- Console errors: 2
- Disabled clicks: 0

### Speedrunner
- Total actions: 20
- Buildings built: 0
- Trades made: 0
- Events faced: 0
- Friction points: 0
- Console errors: 2
- Disabled clicks: 0
