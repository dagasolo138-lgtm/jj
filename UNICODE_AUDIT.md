# Unicode Asset Audit

**Generated:** 2026-04-11 via Playwright visual scan of every game screen  
**Method:** Automated DOM tree-walk across Title Screen, Dashboard, and all 9 tabs (Estate, Map, Market, Military, People, Hall, Chapel, Forge, Chronicle), plus Season/Random Event overlays  
**Total unique Unicode icon characters found: 49**

Screenshots saved in `test-results/unicode-audit/`

---

## Category 1: Resource & Status Icons (8 characters)

Used in Dashboard resource bars, EventCard indicators, title screen "How to Play", and throughout the UI as inline resource labels.

| Code Point | Char | Name | Where Used |
|---|---|---|---|
| U+269C | ⚜ | Fleur-de-lis (Denarii icon) | Title Screen, EventCard, Season/Random Events |
| U+2727 | ✧ | White Four-pointed Star (Food icon) | Title Screen, Estate, Market, EventCard |
| U+2302 | ⌂ | House (Population icon) | Title Screen |
| U+2694 | ⚔ | Crossed Swords (Garrison icon) | Title Screen, Estate, Military, Events |
| U+2191 | ↑ | Up Arrow (increase indicator) | All screens (volume control + event indicators) |
| U+2193 | ↓ | Down Arrow (decrease indicator) | All screens (volume control + event indicators) |
| U+2192 | → | Right Arrow (flow indicator) | Estate, People |
| U+2197 | ↗ | NE Arrow (trade outflow) | Market |

## Category 2: Building Icons (15 characters)

Defined in `src/data/buildings.js` as the `icon` property. Shown in Estate building cards, Market trade listings, and Map legend.

| Code Point | Char | Name | Building(s) |
|---|---|---|---|
| U+2727 | ✧ | White Four-pointed Star | Strip Farm, Demesne Field |
| U+2042 | ⁂ | Asterism | Pasture |
| U+2248 | ≈ | Almost Equal (water) | Fishpond |
| U+2261 | ≡ | Identical To (logs) | Timber Lot |
| U+2698 | ⚘ | Flower | Herb Garden |
| U+2736 | ✶ | Six-pointed Star | Apiary |
| U+25A3 | ▣ | Crosshatch Square | Charcoal Burner |
| U+25C6 | ◆ | Black Diamond | Quarry |
| U+25A7 | ▧ | Diagonal Fill Square | Tannery |
| U+25AE | ▮ | Black Vertical Rectangle | Sawmill |
| U+25B0 | ▰ | Black Parallelogram | Bloomery |
| U+2699 | ⚙ | Gear | Mill |
| U+2630 | ☰ | Trigram | Fulling Mill |
| U+2615 | ☕ | Hot Beverage | Brewery |
| U+2692 | ⚒ | Hammer & Pick | General crafting/tools icon |

## Category 3: Season Symbols (4 characters)

Used in Dashboard season display, Chronicle entries, and tab headers.

| Code Point | Char | Name | Season |
|---|---|---|---|
| U+2741 | ❁ | Eight Petal Flower | Spring |
| U+2600 | ☀ | Sun | Summer (not found in current scan — may only appear in later turns) |
| U+2767 | ❧ | Rotated Floral Heart | Autumn (not found — appears in later turns) |
| U+2744 | ❄ | Snowflake | Winter (not found — appears in later turns) |

*Note: Only ❁ (Spring) appeared in the scan since the game starts in Spring, Year 1. The other 3 season symbols are defined in Dashboard.jsx and Chronicle.jsx but only render when those seasons are active.*

## Category 4: Military & Defense Icons (7 characters)

Used in MilitaryTab section headers, garrison display, fortification labels, and raid screens.

| Code Point | Char | Name | Usage |
|---|---|---|---|
| U+2694 | ⚔ | Crossed Swords | Garrison count, military header |
| U+265B | ♛ | Black Chess Queen | Castle/royalty, fortification header |
| U+2696 | ⚖ | Scales | Balance/defense rating, difficulty icon |
| U+26CA | ⛊ | Sail (Armor) | Armor section header |
| U+2616 | ☖ | White Shogi Piece | Watchtower header |
| U+221E | ∞ | Infinity | Unlimited garrison display |
| U+270D | ✍ | Writing Hand | Military chronicle |

## Category 5: Decorative & UI Chrome (10 characters)

Used as section dividers, expand/collapse indicators, and visual accents.

| Code Point | Char | Name | Usage |
|---|---|---|---|
| U+25C6 | ◆ | Black Diamond | Section dividers, decorative separators (appears on ALL screens) |
| U+2756 | ❖ | Black Diamond with White X | Tip markers, tutorial hints |
| U+25B2 | ▲ | Up Triangle | Price rising / increase indicator |
| U+25BC | ▼ | Down Triangle | Price falling / decrease, collapse indicator |
| U+25B6 | ▶ | Right Triangle | Expand button, "Historical context" toggle |
| U+25B8 | ▸ | Small Right Triangle | List bullet in Great Hall |
| U+2713 | ✓ | Check Mark | Requirement met |
| U+2717 | ✗ | Ballot X | Requirement not met / "VULNERABLE" |
| U+2022 | • | Bullet | List markers |
| U+2E30 | ⸰ | Ring Point | Decorative accent |

## Category 6: Market & Trade Icons (5 characters)

Used in MarketSquare price tables, merchant cards, and trade goods display.

| Code Point | Char | Name | Usage |
|---|---|---|---|
| U+25CF | ● | Black Circle | "Stable" price indicator |
| U+25CB | ○ | White Circle | Empty/unselected state |
| U+2734 | ✴ | Eight-pointed Star | Market special marker |
| U+2726 | ✦ | Four-pointed Star | Trade goods, historical context toggle |
| U+223F | ∿ | Sine Wave | Synergy/combination indicator |

## Category 7: Religion & Chapel Icons (1 character)

| Code Point | Char | Name | Usage |
|---|---|---|---|
| U+26EA | ⛪ | Church | Chapel tab header, Map legend |

## Category 8: Miscellaneous Game Icons (5 characters)

| Code Point | Char | Name | Usage |
|---|---|---|---|
| U+2620 | ☠ | Skull & Crossbones | Hard difficulty, death/danger |
| U+266B | ♫ | Beamed Notes | Music toggle button (ALL screens) |
| U+25A0 | ■ | Black Square | Map legend color block |
| U+25A1 | □ | White Square | Empty plot marker |
| U+25AC | ▬ | Black Rectangle | Forge crafting UI |

## Summary by Screen

| Screen | Unicode Icons Found |
|---|---|
| **Title Screen** | 9 (⚜ ✧ ⌂ ⚔ ♛ ⚖ ☠ ❁ ♫ + ◆) |
| **Dashboard** | 11 (↑ ↓ ♫ ❁ ◆ ❖ ⸰ ▼ ▲ + building icons) |
| **Estate Tab** | 30+ (all building icons + UI chrome) |
| **Map Tab** | 8 (↑ ↓ ♫ ❁ ◆ ☕ ⛪ ⚖) |
| **Market Tab** | 25+ (building icons + price indicators + trade symbols) |
| **Military Tab** | 15+ (⚔ ♛ ⚖ ⛊ ☖ ∞ ✍ ✗ ▼ + decorative) |
| **People Tab** | 8 (✦ ❖ ◆ → ❁ + arrows) |
| **Hall Tab** | 5 (▸ ◆ ❁ + arrows) |
| **Chapel Tab** | 5 (⛪ ◆ ❁ + arrows) |
| **Forge Tab** | 8 (▧ ▮ ▰ ▬ ◆ ❁ + arrows) |
| **Chronicle Tab** | 6 (◆ ❖ ❁ + arrows) |
| **Event Overlays** | 6 (⚜ ⚔ ◆ ❁ + arrows) |

## Characters Already Replaced by SVG/Sprites

The Dashboard resource bar uses **Lucide React SVG icons** (Coins, Wheat, Users, Swords, Heart, Cross, Church) instead of Unicode. The tab bar also uses Lucide SVG icons. These are the **only** icons that have been replaced — all 49 characters listed above remain as raw Unicode text.

---

*Test file: `tests/e2e/visual/unicode-audit.spec.js`*
