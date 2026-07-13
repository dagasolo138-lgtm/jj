<p align="center">
  <img src="https://img.shields.io/badge/you_inherited_a_medieval_estate-good_luck-8b1a1a?style=for-the-badge&labelColor=1a1610" alt="Good Luck" />
</p>

<h1 align="center">
  &#9819; The Lord's Ledger
</h1>

<p align="center">
  <strong>A medieval economic simulation where 6th graders discover that running a feudal estate is harder than it looks — and way more fun than a worksheet.</strong>
</p>

<p align="center">
  <em>"My lord, the granary is empty, the soldiers haven't been paid, the Scots are at the border, and your steward just quit. It's only Tuesday."</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind 4" />
  <img src="https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/Target_Audience-6th_Graders-e8c44a?style=flat-square" alt="6th Graders" />
  <img src="https://img.shields.io/badge/Lines_of_Code-46%2C600+-c4a24a?style=flat-square" alt="43,700+ LOC" />
</p>

<p align="center">
  <a href="#-what-is-this">What Is This</a> &#183;
  <a href="#-gameplay">Gameplay</a> &#183;
  <a href="#%EF%B8%8F-game-systems">Systems</a> &#183;
  <a href="#-getting-started">Getting Started</a> &#183;
  <a href="#-architecture">Architecture</a> &#183;
  <a href="#-educational-design">Educational Design</a> &#183;
  <a href="#-license">License</a>
</p>

---

## &#9878; What Is This

The Lord's Ledger is a **browser-based medieval economic simulation** built for classroom use. Students inherit a feudal estate in medieval England and must manage it for **10 years (40 turns)** across all four seasons — balancing food production, treasury management, military defense, trade, faith, and population growth.

It is **not** a quiz game. There are no right answers — only trade-offs. A decision to raise taxes funds your army but drives families away. Building a brewery boosts morale and trade income but consumes grain your people need to eat. Ignoring military upgrades saves money until Scottish raiders burn your granary to the ground.

Every mechanic teaches real medieval history through systems, not lectures.

## &#9876; Gameplay

### The Premise

> *The old lord has passed, and the estate is now yours. Manage your treasury, keep your people fed, defend your borders, and honor the Church — for ten years, through spring planting and winter storms, through raids and feasts and the quiet decisions that shape a reign.*

### Core Loop

```
 Title Screen (choose Easy / Normal / Hard)
       |
       v
 +--> MANAGEMENT PHASE
 |     |  Browse tabs: Estate, Trade, Military, People, Chapel, Blacksmith, Map...
 |     |  Build structures, set tax rates, trade goods, recruit soldiers
 |     v
 |    SIMULATE SEASON --> Economy engine runs
 |     |  Production -> Consumption -> Upkeep -> Tax -> Population Growth
 |     v
 |    SEASONAL EVENT --> Choose-your-own-adventure decision
 |     |  "The Planting Decision" / "A Merchant Caravan" / "The Bishop's Visit"
 |     v
 |    RANDOM EVENT --> Raid? Plague? Windfall?
 |     |
 +-----+ (next turn)
       |
       v
 VICTORY (survived 40 turns) or GAME OVER (depopulation / bankruptcy)
```

### Victory & Defeat

**Win** by surviving 40 turns. Your final title is scored across four dimensions:

| Title | Condition |
|-------|-----------|
| **The Prosperous** | Highest total wealth (denarii + inventory) |
| **The Beloved** | Largest population |
| **The Iron Lord** | Strongest military (garrison + castle) |
| **The Great Builder** | Most buildings constructed |
| **The Balanced** | Decent across all categories |

**Lose** if your population hits 0 (*The Empty Village*) or your treasury stays at 0 for 3+ consecutive turns (*The Empty Coffer*). Both failures come with historically grounded narratives explaining why your reign collapsed — and what real medieval lords faced in similar situations.

### Difficulty Modes

| Mode | Starting Denarii | Population | Garrison | Penalty Scale |
|------|-----------------|------------|----------|---------------|
| &#10049; Easy | 700 | 22 families | 5 soldiers | 0.5x |
| &#9878; Normal | 500 | 20 families | 5 soldiers | 1.0x |
| &#9760; Hard | 350 | 18 families | 3 soldiers | 1.5x |

---

## &#9881;&#65039; Game Systems

### &#9884; Economy & Resources

The game tracks **17 resource types** organized into four categories:

| Category | Resources | Role |
|----------|-----------|------|
| **Food** | Grain, Livestock, Fish, Flour | Consumed by population each season. No food = families leave. |
| **Raw Materials** | Timber, Clay, Iron, Stone | Used for building and castle upgrades. |
| **Forge Materials** | Steel, Coal, Leather, Wood | Feed the Blacksmith's Forge for crafting weapons and armor. |
| **Trade Goods** | Wool, Cloth, Honey, Herbs, Ale | Sold at market for denarii. Prices fluctuate &#177;20% each season. |

**Market prices** regenerate every turn via `generateMarketPrices()`, simulating real supply-and-demand volatility. Students learn that buying low and selling high is a strategy, not a guarantee.

**Seasons affect everything:**

| Season | Farm Output | Food Consumption | Building Degradation |
|--------|-------------|------------------|---------------------|
| &#11824; Spring | &#215;0.5 (planting) | Normal | Normal |
| &#9728; Summer | &#215;1.0 (growing) | Normal | Normal |
| &#10086; Autumn | &#215;1.5 (harvest!) | Normal | Normal |
| &#10052; Winter | &#215;0.25 (dormant) | +50% (heating) | +50% (weather) |

### &#9876; Buildings (17 Types)

Buildings are the backbone of the estate. Each has production output, upkeep cost, land requirements, condition degradation, historical notes, and building synergies.

**Food Production:**
- **Strip Farm** (*Ager Communis*) — Basic grain, +20% synergy with Mill
- **Demesne Field** (*Dominicum Arvum*) — Lord's personal farmland, higher yield
- **Pasture** (*Pascuum Gregis*) — Livestock + wool production
- **Fishpond** (*Vivarium Piscium*) — Reliable protein, +10% with Herb Garden

**Raw Materials:**
- **Timber Lot** (*Silva Caedua*) — Wood for building and repairs
- **Clay Pit** (*Fossa Argillae*) — Construction and pottery, +15% with Quarry
- **Iron Mine** (*Fodina Ferri*) — Critical for military, rare and expensive
- **Quarry** (*Lapicidina*) — Stone for castle upgrades
- **Herb Garden** (*Hortus Herbarum*) — Medicinal herbs for Church standing
- **Apiary** (*Apiarium Mellis*) — Honey and beeswax for trade

**Forge Materials:**
- **Coal Pit** (*Fossa Carbonum*) — Charcoal for the forge
- **Tannery** (*Coriaria Officina*) — Converts hides to leather
- **Sawmill** (*Molendinum Serrarium*) — Cuts timber into planks
- **Smelter** (*Fornax Ferri*) — Converts iron + coal into steel (requires Iron Mine)

**Processing (Tier 2):**
- **Mill** (*Molendinum*) — Grain &#8594; Flour (requires Strip Farm)
- **Fulling Mill** (*Fullonica Molendinum*) — Wool &#8594; Cloth (requires Pasture)
- **Brewery** (*Bracinum Cerevisiae*) — Grain &#8594; Ale (boosts morale)

Every building includes a **historical note** written at 6th-grade reading level, connecting the game mechanic to real medieval history. Students learn why fulling mills smelled terrible, why fishponds were status symbols, and why charcoal burners were some of the loneliest people in medieval Europe.

### &#9876; Military & Defense

Three soldier types with escalating cost and power:

| Type | Recruit Cost | Upkeep/Season | Defense Value |
|------|-------------|---------------|---------------|
| **Levy** | 5d | 1d | 1 |
| **Men-at-Arms** | 15d | 3d | 3 |
| **Knights** | 50d | 8d | 8 |

Three fortification tracks with tiered upgrades:

| Track | Levels | Defense Range | Example |
|-------|--------|---------------|---------|
| **Walls** | 0&#8594;4 | 0&#8594;40 | Wooden Palisade &#8594; Concentric Walls |
| **Gate** | 0&#8594;4 | 0&#8594;18 | Open Entrance &#8594; Fortified Gatehouse |
| **Moat** | 0&#8594;3 | 0&#8594;15 | None &#8594; Flooded Moat |

**Defense Rating** = (garrison defense + fortification defense) &#215; morale modifier + watchtower bonus. Morale ranges from Mutinous to Fierce, affected by pay, food, and combat.

### &#9876; Raid System

Two threat types that scale with game progression:

| Threat | First Appears | Defense Needed | Stakes |
|--------|--------------|----------------|--------|
| **Outlaws & Brigands** | Turn 4+ | 25 defense rating | Lose 30-50d, food, trade goods |
| **Scottish Border Reivers** | Turn 8+ (forced at turn 16) | 50 defense rating | Lose 80-120d, massive food/population loss |

Raids are resolved by comparing your **defense rating** against the threat threshold. Victory earns bounty rewards; defeat is devastating. Zero garrison means automatic loss — *"There was no one to defend the estate."*

### &#9819; Great Hall

The seat of lordly power, with four sub-chambers:

- **Audience Chamber** — Hear petitions from peasants, merchants, and clergy (20 encounters)
- **Decree Desk** — Issue formal decrees with active policy slots that affect the entire estate
- **Council Chamber** — Consult with advisors on strategic decisions
- **Feast Hall** — Host feasts to boost morale and population loyalty

Features a **Steward Edmund** NPC with context-aware dialogue, trust mechanics, and mood system. Tracks your **reputation** across 6 dimensions: merciful, stern, wealthy, pious, militant, and balanced.

### &#9962; Chapel & Faith

Donate denarii to the Church across three tiers (Small Offering 25d / Generous Tithe 75d / Grand Donation 150d) to build faith and piety. Higher faith unlocks economic blessings and protects against certain negative events.

### &#9878; Boar's Head Tavern

A clickable location on the map with three activities:
- **Bard's Corner** — Hear tales and earn morale bonuses
- **Knight's Gambit** — Strategic mini-game
- **Rats in the Cellar** — Pest control challenge

### &#9876; Watchtower

Scout the surrounding lands, gain intelligence on incoming threats, and prepare for raids before they arrive. Captain briefings provide strategic context.

### &#9876; Blacksmith's Forge

Craft weapons, armor, and tools using forge materials (steel, coal, leather, wood) from your unified inventory. NPC blacksmith Godric guides the crafting process. The forging mini-game provides hands-on interaction with the material economy.

### &#9878; Market Square

A dedicated trading hub accessible from the map, with merchant NPCs including Marta the Merchant and Old Aldric offering unique trade opportunities beyond the standard buy/sell interface.

### &#128256; Perspective Flips (CYOA)

At key moments, the game interrupts with **Choose Your Own Adventure** sequences where students play as different historical figures — lords, serfs, merchants, and knights. Each flip branches through 3-5 decision nodes with multiple endings, then returns to the main game with consequences applied.

Example: *"The Lord of Ashworth Manor"* casts the student as Lord Wynn, forcing them to see feudalism from the ruling perspective and make decisions about justice, taxation, and loyalty.

### &#10024; Hidden Synergy System

Seven secret strategy paths with 3 tiers each (21 total synergies), unlocked by building combinations:

| Path | Trigger Example | Reward |
|------|----------------|--------|
| **The Wool Baron** | Pasture &#8594; Fulling Mill &#8594; Trade volume | Escalating passive income |
| *(6 more paths)* | Various building + resource combos | Unique bonuses per tier |

Synergies are **hidden** — students discover them through experimentation, not instructions. A toast notification reveals each unlock with flavor text and a chronicle entry.

### &#128220; Narrative Events

- **20+ seasonal events** with branching choices, each tied to the current season
- **20+ random events** gated by game progression (military events after turn 3, faith events after turn 5)
- **16 dispute cases** in the Audience Chamber requiring judgment calls
- Every event includes a **Scribe's Note** — 2-3 sentences of real medieval history at 6th-grade reading level

---

## &#128640; Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+

### Install & Run

```bash
git clone https://github.com/goldbar123467/The-Lords-Ledger.git
cd The-Lords-Ledger
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build &#8594; `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint with flat config (React hooks + refresh rules) |

### Deploy

The project deploys to **Vercel** with zero configuration. Push to `main` and it auto-deploys. Vercel Web Analytics is integrated for page view tracking.

---

## &#128736; Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2 |
| Build Tool | Vite | 7.3 |
| Styling | Tailwind CSS | 4.2 |
| Icons | Lucide React | 0.577 |
| Analytics | Vercel Analytics | 1.6 |
| E2E Testing | Playwright | 1.58 |
| Language | JavaScript (ES2024) | Pure JS, no TypeScript |

### State Management

All game state lives in a **single `useReducer`** in `App.jsx`. The reducer (`gameReducer.js`, 3,697 lines) handles 70+ action types and is the single source of truth for every state transition.

```
App.jsx (useReducer)
  |
  +-- gameReducer.js -----> 70+ action types (BUILD, TRADE, RECRUIT, SET_TAX, SIMULATE_SEASON...)
  +-- economyEngine.js ---> Pure simulation: production -> consumption -> upkeep -> tax -> growth
  +-- eventSelector.js ---> Season-aware event selection with turn-based gating
  +-- raidEngine.js ------> Raid resolution: garrison + castle defense vs raider strength
  +-- synergyEngine.js ---> Hidden strategy path detection and tier progression
  +-- flipEngine.js ------> CYOA perspective flip branching narrative state machine
  +-- meterUtils.js ------> Legacy effect translation (old meter format -> resource deltas)
```

### Game Phase Flow

```
title -> management -> seasonal_action -> seasonal_resolve -> random_event -> random_resolve -> management
                                                                                                  |
game_over (population = 0 or bankrupt 3 turns)                                                    |
victory (survived 40 turns) <---------------------------------------------------------------------+
```

### Project Structure

```
src/
 +-- App.jsx                    # Root component: useReducer, phase routing, tab wiring
 +-- main.jsx                   # React DOM entry point
 +-- index.css                  # Tailwind 4 config + custom medieval theme (CSS vars, fonts)
 |
 +-- engine/                    # Pure functions only -- no side effects, no DOM access
 |    +-- gameReducer.js        # Central state machine (3,697 lines, 20+ actions)
 |    +-- economyEngine.js      # Seasonal simulation engine (658 lines)
 |    +-- eventSelector.js      # Event selection with turn gates
 |    +-- raidEngine.js         # Raid combat resolution
 |    +-- synergyEngine.js      # Hidden path detection (7 paths x 3 tiers)
 |    +-- flipEngine.js         # CYOA branching narrative engine
 |    +-- meterUtils.js         # Legacy effect translation layer
 |
 +-- data/                      # Pure data definitions -- no logic, no side effects
 |    +-- economy.js            # 17 resources, market prices, tax rates, castle levels
 |    +-- buildings.js          # 17 buildings with Latin names, synergies, historical notes
 |    +-- seasonalEvents.js     # 20+ season-specific narrative events (1,333 lines)
 |    +-- randomEvents.js       # 20+ random events by category (1,288 lines)
 |    +-- raids.js              # Criminal outlaws + Scottish Border Reivers
 |    +-- endings.js            # 5 victory titles + 2 failure narratives with history
 |    +-- synergies.js          # 7 hidden strategy paths (21 tiers total)
 |    +-- cyoaFlips.js          # CYOA perspective flip content (1,025 lines)
 |    +-- blacksmith.js         # Forge recipes and crafting data
 |    +-- chapel.js             # Faith/piety system definitions
 |    +-- disputes.js           # 16 audience chamber dispute cases (1,907 lines)
 |    +-- decrees.js            # Great Hall decree definitions
 |    +-- audience.js           # 20 audience encounter scripts (1,301 lines)
 |    +-- market.js             # Market Square merchant data
 |    +-- tavern.js             # Tavern NPC and activity data
 |    +-- watchtower.js         # Scouting and threat intelligence
 |    +-- greatHall.js          # Great Hall configuration
 |    +-- military.js           # Military unit definitions
 |    +-- people.js             # Population event content
 |    +-- perspectiveFlips.js   # Perspective flip trigger conditions
 |
 +-- components/                # React UI layer (36 components)
      +-- Dashboard.jsx         # Sticky top bar: denarii, food, families, garrison, faith, piety
      +-- TabBar.jsx            # Horizontal tab navigation (all tabs unlocked from turn 1)
      +-- TitleScreen.jsx       # Difficulty selection + intro narrative
      +-- EstateTab.jsx         # Building management + economy overview + inventory
      +-- TradeTab.jsx          # Buy/sell marketplace with quantity controls (1, 5, All)
      +-- MilitaryTab.jsx       # Garrison, castle upgrades, defense installations
      +-- PeopleTab.jsx         # Tax rate management + church donations
      +-- ChapelTab.jsx         # Faith and piety management
      +-- BlacksmithTab.jsx     # Forge crafting interface (2,718 lines)
      +-- MapTab.jsx            # Pure CSS bird's-eye estate map (1,508 lines)
      +-- GreatHall.jsx         # Lordly seat with 4 sub-chamber routing
      +-- AudienceChamber.jsx   # Hear petitions from subjects
      +-- DecreeDesk.jsx        # Issue and manage active decrees
      +-- CouncilChamber.jsx    # Consult with advisors
      +-- FeastHall.jsx         # Host feasts for morale
      +-- Tavern.jsx            # Boar's Head Tavern hub
      +-- BardsCorner.jsx       # Tavern: storytelling activity
      +-- KnightsGambit.jsx     # Tavern: strategy game
      +-- RatsInCellar.jsx      # Tavern: pest control challenge
      +-- Watchtower.jsx        # Scouting and threat intelligence (1,497 lines)
      +-- MarketSquare.jsx      # Market hub with NPC merchants
      +-- MartaMerchant.jsx     # NPC: Marta the merchant
      +-- OldAldric.jsx         # NPC: Old Aldric
      +-- Chronicle.jsx         # Reverse-chronological scrolling event log
      +-- EventCard.jsx         # Seasonal/random event presentation
      +-- FlipScreen.jsx        # CYOA perspective flip interface
      +-- ForgingGame.jsx       # Blacksmith crafting mini-game
      +-- RaidScreen.jsx        # Raid combat interface
      +-- DisputeScreen.jsx     # Dispute resolution interface
      +-- ResolveScreen.jsx     # Event resolution display
      +-- SynergyToast.jsx      # Hidden path unlock notification
      +-- TutorialHint.jsx      # Contextual tutorial tooltips
      +-- ScribesNote.jsx       # Historical context popover
      +-- VictoryScreen.jsx     # End-game victory narrative + scoring
      +-- GameOverScreen.jsx    # Failure narrative display
```

### Key Conventions

| Convention | Detail |
|-----------|--------|
| **State immutability** | Reducer always returns `{ ...state, field: newValue }`. Never mutate in place. |
| **Action shape** | `{ type: "SCREAMING_SNAKE", payload: { ... } }` |
| **Engine purity** | All engine files export pure functions. No side effects, no DOM. `Math.random()` is the sole exception. |
| **Data injection** | Event data passed via action payloads, never imported by the reducer. |
| **Theming** | Medieval parchment/dark aesthetic. CSS custom properties in `index.css`. |
| **Typography** | Cinzel Decorative (titles), Cinzel (headings), Crimson Text (body) via Google Fonts. |
| **No emoji** | Unicode symbols only (&#9876; &#9962; &#9878; &#9819; &#9760;). Design rule, not preference. |
| **Styling** | Inline `style={{}}` for theme colors, Tailwind utilities for layout. Intentional choice — parchment palette doesn't map to Tailwind color utilities. |

---

## &#127891; Educational Design

### Standards Alignment

The Lord's Ledger is designed for **Project-Based Learning (PBL)** units in 6th-grade social studies, with mechanics that directly address:

- **Medieval economics:** Supply and demand, trade-offs, resource scarcity, taxation, market pricing
- **Feudal social structure:** Lord-peasant relationships, Church authority, military obligation
- **Historical cause and effect:** Decisions compound across turns — a bad trade in turn 3 creates a famine in turn 10
- **Financial literacy:** Budget management, risk assessment, opportunity cost
- **Primary source thinking:** Perspective flips force students to consider multiple viewpoints on the same historical systems

### How It Teaches

The game **never lectures**. Instead:

1. **Mechanics are the content.** The tax system doesn't just have medieval names — it models real feudal economics where higher taxes generate revenue but drive population away, exactly as happened after the Black Death.

2. **Historical notes are embedded, not bolted on.** Every building, event, and failure screen includes a "Scribe's Note" with 2-3 sentences of real history at 6th-grade reading level. Students learn that the word "bereaved" comes from the Border Reiving tradition, that Lavenham became the 14th wealthiest town in England from wool alone, and that the Bardi banking collapse shattered Europe's financial markets.

3. **Failure is educational.** The game over screens explain *why* depopulation and bankruptcy destroyed real medieval estates, with specific historical examples. Getting conquered by Scottish raiders teaches more about border politics than any textbook paragraph.

4. **Perspective flips build empathy.** CYOA sequences force students to see feudalism from multiple viewpoints — lord, peasant, merchant, clergy — before returning to their own estate with consequences applied to their game state.

5. **Hidden synergies reward systems thinking.** Students who notice that a Pasture + Fulling Mill + trade volume unlocks "The Wool Baron" path are learning about medieval England's actual economic engine — the wool trade that made towns like Lavenham rich.

### Classroom Integration

| Feature | Classroom Use |
|---------|--------------|
| **Single class period** | A full 40-turn game is playable in 35-45 minutes |
| **Three difficulty modes** | Teachers can differentiate by student readiness |
| **Chronicle log** | Records every decision for post-game Socratic discussion |
| **Victory titles** | Natural culminating assessment — students pitch their strategy as a "medieval investor presentation" |
| **Scribe's Notes** | Built-in vocabulary scaffolding for domain-specific terms |
| **Perspective flips** | Ready-made empathy exercises for class discussion |

---

## &#127912; The CSS Map

The estate map (`MapTab.jsx`, 1,508 lines) is **entirely CSS-rendered** — no images, no canvas, no external sprites. Every building, tree, peasant, road, and water body is built from `div`s, gradients, borders, and CSS animations.

- **Season-reactive terrain** — ground, trees, water, and crops change color palette per season
- **Walking peasants** — CSS keyframe animations along waypoint paths; count scales with population
- **Smoke plumes** — Rising from the castle chimney, forge buildings, and processing buildings
- **Custom building sprites** — Coal pit with glowing embers, sawmill with spinning blade, tannery with swaying hides, smelter with furnace mouth glow
- **Clickable landmarks** — Tavern, Watchtower, and Market Square open their respective game views
- **SVG shoreline** — Organic bezier-curved lake edge on the west side
- **Winter snow overlay** — Radial gradient snowflakes at 40% opacity
- **Compass rose** — Because every medieval map deserves one

---

## &#129309; Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the architecture conventions in `CLAUDE.md`
4. Commit your changes
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Adding Content

The most common contributions are new **events**, **buildings**, and **disputes**:

- **New event:** Add to `src/data/seasonalEvents.js` or `src/data/randomEvents.js`. Include a `scribesNote` with real history.
- **New building:** Add to `src/data/buildings.js`. Include `historicalNote`, set `rarity`, define `produces`/`consumes`.
- **New dispute:** Add to `src/data/disputes.js`. Write two options with meaningfully different consequences.

### Development Flow

1. Add data definitions to `src/data/`
2. Add pure logic to `src/engine/`
3. Add reducer action case to `gameReducer.js`
4. Add or update component in `src/components/`
5. Wire dispatch handler in `App.jsx`

---

## &#128220; License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Free to use, modify, and distribute. Built for classrooms everywhere.

---

<p align="center">
  <em>"History is full of lords who did not last ten years."</em>
</p>

<p align="center">
  <sub>Built for classrooms. Powered by trade-offs. No worksheets were harmed in the making of this game.</sub>
</p>
