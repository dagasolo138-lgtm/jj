/**
 * playtest.js — Headless automated playtest for The Lord's Ledger
 *
 * Runs N full 28-turn games with different strategy profiles, dispatching
 * the full action cycle through the game reducer. No React/DOM needed.
 *
 * Usage: node playtest.js [numRuns]
 *   Default: 20 runs (3–4 per strategy)
 *
 * Output:
 *   [BUG]  — Invariant violation (state corruption)
 *   [WARN] — Balance concern (gameplay issue)
 *   [INFO] — Milestone / progress
 */

import { gameReducer, initialState } from "./src/engine/gameReducer.js";
import seasonalEventsData from "./src/data/seasonalEvents.js";
import randomEventsData from "./src/data/randomEvents.js";
import { PERSPECTIVE_FLIPS } from "./src/data/perspectiveFlips.js";
import BUILDINGS from "./src/data/buildings.js";
import { FOOD_RESOURCES, DEFENSE_UPGRADES } from "./src/data/economy.js";

// ---------------------------------------------------------------------------
// Flatten seasonal events (same as App.jsx)
// ---------------------------------------------------------------------------
const seasonalEvents = Object.values(seasonalEventsData).flat();
const randomEvents = randomEventsData;

const VALID_BUILDING_IDS = new Set(Object.keys(BUILDINGS));

// ---------------------------------------------------------------------------
// Strategy profiles
// ---------------------------------------------------------------------------
const STRATEGIES = {
  passive: {
    builds: [],
    taxRate: "medium",
    trades: false,
    optionPick: "first",
  },
  builder: {
    builds: ["strip_farm", "pasture", "fishpond", "strip_farm", "pasture", "brewery"],
    taxRate: "low",
    trades: false,
    optionPick: "first",
  },
  trader: {
    builds: ["pasture", "pasture", "strip_farm"],
    taxRate: "medium",
    trades: true,
    sellAll: true,
    optionPick: "first",
  },
  military: {
    builds: ["iron_mine", "quarry", "strip_farm"],
    taxRate: "high",
    trades: false,
    optionPick: "first",
    recruit: true,
    upgradeCastle: true,
    installDefenses: true,
  },
  pious: {
    builds: ["herb_garden", "strip_farm", "fishpond", "apiary"],
    taxRate: "low",
    trades: true,
    buySpices: true,
    optionPick: "first",
    donate: true,
  },
  random: {
    builds: "random",
    taxRate: "random",
    trades: "random",
    optionPick: "random",
  },
};

// ---------------------------------------------------------------------------
// Dispatch helper — wraps reducer call
// ---------------------------------------------------------------------------
function dispatch(state, action) {
  return gameReducer(state, action);
}

// ---------------------------------------------------------------------------
// Invariant checks — returns array of bug strings
// ---------------------------------------------------------------------------
function checkInvariants(state, turn, strategyName) {
  const bugs = [];
  const prefix = `[${strategyName} T${turn}]`;

  // Meters in [0, 100]
  for (const [name, value] of Object.entries(state.meters)) {
    if (value < 0 || value > 100) {
      bugs.push(`[BUG] ${prefix} Meter ${name} out of range: ${value}`);
    }
  }

  // Denarii >= 0
  if (state.denarii < 0) {
    bugs.push(`[BUG] ${prefix} Denarii negative: ${state.denarii}`);
  }

  // Population >= 5
  if (state.population < 5) {
    bugs.push(`[BUG] ${prefix} Population below minimum: ${state.population}`);
  }

  // No negative inventory
  for (const [res, qty] of Object.entries(state.inventory)) {
    if (qty < 0) {
      bugs.push(`[BUG] ${prefix} Inventory ${res} negative: ${qty}`);
    }
  }

  // Food consistency: state.food should equal sum of food resources
  const computedFood = FOOD_RESOURCES.reduce((sum, r) => sum + (state.inventory[r] || 0), 0);
  if (state.food !== computedFood) {
    bugs.push(`[BUG] ${prefix} Food mismatch: state.food=${state.food}, computed=${computedFood}`);
  }

  // Buildings only contain valid IDs
  for (const bid of state.buildings) {
    if (!VALID_BUILDING_IDS.has(bid)) {
      bugs.push(`[BUG] ${prefix} Invalid building ID: ${bid}`);
    }
  }

  // Synergy activated: no duplicates
  const activated = state.synergies?.activated ?? [];
  const uniqueActivated = new Set(activated);
  if (uniqueActivated.size !== activated.length) {
    bugs.push(`[BUG] ${prefix} Duplicate synergy IDs in activated: ${JSON.stringify(activated)}`);
  }

  // Synergy notifications have required fields
  for (const notif of state.pendingSynergyNotifications ?? []) {
    if (notif.tier === undefined || !notif.title || !notif.pathIcon) {
      bugs.push(`[BUG] ${prefix} Synergy notification missing fields: ${JSON.stringify(notif)}`);
    }
  }

  return bugs;
}

// ---------------------------------------------------------------------------
// Pick an option index based on strategy
// ---------------------------------------------------------------------------
function pickOption(event, strategy) {
  if (!event?.options?.length) return 0;
  if (strategy.optionPick === "random") {
    return Math.floor(Math.random() * event.options.length);
  }
  return 0; // "first"
}

// ---------------------------------------------------------------------------
// Management phase actions for a given strategy
// ---------------------------------------------------------------------------
function doManagementActions(state, strategy, buildQueue) {
  // 1. Set tax rate
  if (strategy.taxRate === "random") {
    const rates = ["low", "medium", "high", "crushing"];
    const rate = rates[Math.floor(Math.random() * rates.length)];
    state = dispatch(state, { type: "SET_TAX_RATE", payload: { rate } });
  } else if (strategy.taxRate) {
    state = dispatch(state, { type: "SET_TAX_RATE", payload: { rate: strategy.taxRate } });
  }

  // 2. Build from queue
  if (strategy.builds === "random") {
    // Try to build a random building
    const allIds = Object.keys(BUILDINGS);
    const shuffled = allIds.sort(() => Math.random() - 0.5);
    for (const bid of shuffled) {
      const before = state.buildings.length;
      state = dispatch(state, { type: "BUILD_BUILDING", payload: { buildingId: bid } });
      if (state.buildings.length > before) break; // built one
    }
  } else if (buildQueue.length > 0) {
    const nextBuild = buildQueue[0];
    const before = state.buildings.length;
    state = dispatch(state, { type: "BUILD_BUILDING", payload: { buildingId: nextBuild } });
    if (state.buildings.length > before) {
      buildQueue.shift(); // successfully built, remove from queue
    }
  }

  // 3. Trade
  const shouldTrade = strategy.trades === "random"
    ? Math.random() > 0.5
    : strategy.trades;

  if (shouldTrade && state.phase === "management") {
    // Sell: sell tradeable goods from inventory
    if (strategy.sellAll || strategy.trades === "random") {
      const sellable = ["wool", "cloth", "honey", "herbs", "ale", "timber", "clay", "iron", "stone"];
      for (const res of sellable) {
        const qty = state.inventory[res] || 0;
        if (qty > 0) {
          const sellQty = strategy.trades === "random"
            ? Math.ceil(Math.random() * qty)
            : qty;
          state = dispatch(state, { type: "SELL_RESOURCE", payload: { resource: res, quantity: sellQty } });
        }
      }
    }

    // Buy spices (pious strategy) or random goods
    if (strategy.buySpices && state.denarii >= 25) {
      state = dispatch(state, { type: "BUY_RESOURCE", payload: { resource: "spices", quantity: 1 } });
    }
    if (strategy.trades === "random" && state.denarii > 50) {
      const buyable = ["grain", "livestock", "fish", "timber", "clay", "iron", "stone", "salt", "tools", "spices"];
      const res = buyable[Math.floor(Math.random() * buyable.length)];
      state = dispatch(state, { type: "BUY_RESOURCE", payload: { resource: res, quantity: Math.ceil(Math.random() * 3) } });
    }
  }

  // 4. Recruit soldiers
  if (strategy.recruit && state.denarii >= 10) {
    state = dispatch(state, { type: "RECRUIT_SOLDIERS", payload: { count: 2 } });
  }
  if (strategy.builds === "random" && Math.random() > 0.7 && state.denarii >= 10) {
    state = dispatch(state, { type: "RECRUIT_SOLDIERS", payload: { count: Math.ceil(Math.random() * 3) } });
  }

  // 5. Upgrade castle
  if (strategy.upgradeCastle) {
    state = dispatch(state, { type: "UPGRADE_CASTLE" });
  }

  // 6. Install defense upgrades
  if (strategy.installDefenses) {
    for (const upg of Object.values(DEFENSE_UPGRADES)) {
      if (!state.defenseUpgrades.includes(upg.id)) {
        state = dispatch(state, { type: "INSTALL_DEFENSE", payload: { upgradeId: upg.id } });
        break; // One per turn
      }
    }
  }

  // 7. Donate to church
  if (strategy.donate && state.denarii >= 75) {
    state = dispatch(state, { type: "DONATE_TO_CHURCH", payload: { amount: 75 } });
  }
  if (strategy.builds === "random" && Math.random() > 0.8 && state.denarii >= 25) {
    state = dispatch(state, { type: "DONATE_TO_CHURCH", payload: { amount: 25 } });
  }

  return state;
}

// ---------------------------------------------------------------------------
// Handle perspective flip sequence
// ---------------------------------------------------------------------------
function handleFlipSequence(state, strategy) {
  // flip_intro → DISMISS_FLIP_INTRO → flip_decision
  state = dispatch(state, { type: "DISMISS_FLIP_INTRO" });

  const flip = PERSPECTIVE_FLIPS[state.currentFlipId];
  if (!flip) return state;

  // Loop through decisions
  for (let i = 0; i < flip.decisions.length; i++) {
    if (state.phase !== "flip_decision") break;

    const decision = flip.decisions[i];
    const optionIndex = strategy.optionPick === "random"
      ? Math.floor(Math.random() * decision.options.length)
      : 0;

    state = dispatch(state, { type: "SELECT_FLIP_OPTION", payload: { optionIndex } });

    if (state.phase === "flip_outcome") {
      state = dispatch(state, { type: "CONTINUE_FLIP" });
    }

    if (state.phase === "flip_summary") break;
  }

  // Dismiss summary
  if (state.phase === "flip_summary") {
    state = dispatch(state, { type: "DISMISS_FLIP_SUMMARY" });
  }

  return state;
}

// ---------------------------------------------------------------------------
// Drain synergy notifications
// ---------------------------------------------------------------------------
function drainSynergyNotifications(state) {
  let safety = 50;
  while ((state.pendingSynergyNotifications?.length ?? 0) > 0 && safety-- > 0) {
    state = dispatch(state, { type: "DISMISS_SYNERGY_NOTIFICATION" });
  }
  return state;
}

// ---------------------------------------------------------------------------
// Run a single full game
// ---------------------------------------------------------------------------
function runGame(strategyName) {
  const strategy = STRATEGIES[strategyName];
  const buildQueue = strategy.builds === "random"
    ? []
    : [...(strategy.builds || [])];

  const allBugs = [];
  const warnings = [];
  const meterHistory = []; // { turn, meters }
  const synergyLog = [];   // { turn, ids }
  let flipCount = 0;
  let denariiZeroStreak = 0;
  let maxDenariiZeroStreak = 0;

  // Start the game
  let state = dispatch(initialState, { type: "START_GAME" });

  let turnProcessed = 0;
  let maxIterations = 200; // safety limit

  while (state.phase !== "game_over" && state.phase !== "victory" && maxIterations-- > 0) {
    const turn = state.turn;

    // --- Management phase ---
    if (state.phase === "management") {
      state = doManagementActions(state, strategy, buildQueue);

      // Record state before simulation
      meterHistory.push({
        turn,
        meters: { ...state.meters },
        denarii: state.denarii,
        food: state.food,
        population: state.population,
      });

      // Simulate season
      state = dispatch(state, {
        type: "SIMULATE_SEASON",
        payload: { seasonalEvents },
      });

      if (state.phase === "game_over") break;
    }

    // --- Seasonal action ---
    if (state.phase === "seasonal_action") {
      const optionIndex = pickOption(state.currentEvent, strategy);
      state = dispatch(state, {
        type: "SELECT_SEASONAL_ACTION",
        payload: { optionIndex },
      });

      if (state.phase === "game_over") break;
    }

    // --- Seasonal resolve → random event ---
    if (state.phase === "seasonal_resolve") {
      state = dispatch(state, {
        type: "CONTINUE_TO_RANDOM",
        payload: { randomEvents },
      });
    }

    // --- Random event ---
    if (state.phase === "random_event") {
      const optionIndex = pickOption(state.currentRandomEvent, strategy);
      state = dispatch(state, {
        type: "SELECT_RANDOM_RESPONSE",
        payload: { optionIndex },
      });

      if (state.phase === "game_over") break;
    }

    // --- Random resolve → advance turn ---
    if (state.phase === "random_resolve") {
      state = dispatch(state, { type: "ADVANCE_TURN" });
    }

    // --- Handle perspective flip ---
    if (state.phase === "flip_intro") {
      flipCount++;
      state = handleFlipSequence(state, strategy);
      if (state.phase === "game_over" || state.phase === "victory") break;
    }

    // --- Drain synergy notifications ---
    state = drainSynergyNotifications(state);

    // --- Track synergies activated this turn ---
    const newSynergies = (state.synergies?.activated ?? []).filter(
      (id) => !synergyLog.some((entry) => entry.ids.includes(id))
    );
    if (newSynergies.length > 0) {
      synergyLog.push({ turn: state.turn, ids: newSynergies });
    }

    // --- Per-turn invariant checks ---
    const bugs = checkInvariants(state, state.turn, strategyName);
    allBugs.push(...bugs);

    // --- Phase stuck detection ---
    if (state.phase !== "management" && state.phase !== "game_over" && state.phase !== "victory") {
      allBugs.push(`[BUG] [${strategyName} T${state.turn}] Stuck in phase: ${state.phase}`);
      break;
    }

    // --- Balance tracking ---
    // Denarii zero streak
    if (state.denarii === 0) {
      denariiZeroStreak++;
      if (denariiZeroStreak > maxDenariiZeroStreak) maxDenariiZeroStreak = denariiZeroStreak;
    } else {
      denariiZeroStreak = 0;
    }

    // Meter danger zones
    for (const [meter, value] of Object.entries(state.meters)) {
      if (value <= 10) {
        warnings.push(`[WARN] [${strategyName} T${state.turn}] ${meter} critically low: ${value}`);
      }
      if (value >= 90) {
        warnings.push(`[WARN] [${strategyName} T${state.turn}] ${meter} critically high: ${value}`);
      }
    }

    turnProcessed = state.turn;
  }

  if (maxIterations <= 0) {
    allBugs.push(`[BUG] [${strategyName}] Exceeded max iterations, stuck in phase: ${state.phase}`);
  }

  if (maxDenariiZeroStreak >= 3) {
    warnings.push(`[WARN] [${strategyName}] Economy death spiral: denarii=0 for ${maxDenariiZeroStreak} consecutive turns`);
  }

  return {
    strategyName,
    outcome: state.phase, // "victory" | "game_over"
    finalTurn: turnProcessed,
    gameOverReason: state.gameOverReason,
    finalMeters: { ...state.meters },
    finalDenarii: state.denarii,
    finalPopulation: state.population,
    bugs: allBugs,
    warnings,
    synergyLog,
    flipCount,
    buildingsBuilt: state.buildings?.length ?? 0,
    synergiesActivated: state.synergies?.activated ?? [],
  };
}

// ---------------------------------------------------------------------------
// Main — run all playthroughs and summarize
// ---------------------------------------------------------------------------
const NUM_RUNS = parseInt(process.argv[2], 10) || 20;
const strategyNames = Object.keys(STRATEGIES);

console.log(`\n=== The Lord's Ledger — Automated Playtest ===`);
console.log(`Running ${NUM_RUNS} games across ${strategyNames.length} strategies...\n`);

const results = [];
let totalBugs = 0;
let totalWarnings = 0;

for (let i = 0; i < NUM_RUNS; i++) {
  // Round-robin through strategies, with extra randoms
  const stratIdx = i % strategyNames.length;
  const strategyName = strategyNames[stratIdx];

  const result = runGame(strategyName);
  results.push(result);

  // Print bugs immediately
  for (const bug of result.bugs) {
    console.log(bug);
    totalBugs++;
  }

  // Print first few warnings per game (cap to avoid noise)
  const warnCap = 3;
  for (let w = 0; w < Math.min(result.warnings.length, warnCap); w++) {
    console.log(result.warnings[w]);
  }
  if (result.warnings.length > warnCap) {
    console.log(`  ... and ${result.warnings.length - warnCap} more warnings`);
  }
  totalWarnings += result.warnings.length;

  // Info line
  const outcomeIcon = result.outcome === "victory" ? "WIN" : "LOSS";
  const reason = result.gameOverReason
    ? `${result.gameOverReason.meter} ${result.gameOverReason.type}`
    : "";
  const synCount = result.synergiesActivated.length;
  console.log(
    `[INFO] Game ${i + 1}/${NUM_RUNS}: ${result.strategyName.padEnd(10)} ` +
    `${outcomeIcon} T${String(result.finalTurn).padStart(2)} | ` +
    `Meters: T${result.finalMeters.treasury} P${result.finalMeters.people} M${result.finalMeters.military} F${result.finalMeters.faith} | ` +
    `${result.finalDenarii}d ${result.finalPopulation}pop | ` +
    `${synCount} synergies ${result.flipCount} flips` +
    (reason ? ` | ${reason}` : "")
  );
}

// ---------------------------------------------------------------------------
// Summary table
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));

// Per-strategy breakdown
const byStrategy = {};
for (const name of strategyNames) {
  byStrategy[name] = results.filter((r) => r.strategyName === name);
}

console.log("\nStrategy      | Games | Wins | Losses | Win% | Avg Turn | Avg Synergies | Flips");
console.log("-".repeat(85));

for (const [name, games] of Object.entries(byStrategy)) {
  const wins = games.filter((g) => g.outcome === "victory").length;
  const losses = games.filter((g) => g.outcome === "game_over").length;
  const winPct = games.length > 0 ? Math.round((wins / games.length) * 100) : 0;
  const avgTurn = games.length > 0
    ? (games.reduce((s, g) => s + g.finalTurn, 0) / games.length).toFixed(1)
    : "N/A";
  const avgSyn = games.length > 0
    ? (games.reduce((s, g) => s + g.synergiesActivated.length, 0) / games.length).toFixed(1)
    : "N/A";
  const totalFlips = games.reduce((s, g) => s + g.flipCount, 0);

  console.log(
    `${name.padEnd(14)}| ${String(games.length).padStart(5)} | ${String(wins).padStart(4)} | ${String(losses).padStart(6)} | ${String(winPct).padStart(3)}% | ${String(avgTurn).padStart(8)} | ${String(avgSyn).padStart(13)} | ${String(totalFlips).padStart(5)}`
  );
}

// Death causes
console.log("\nDeath Causes:");
const deathCauses = {};
for (const r of results) {
  if (r.gameOverReason) {
    const key = `${r.gameOverReason.meter} ${r.gameOverReason.type}`;
    deathCauses[key] = (deathCauses[key] || 0) + 1;
  }
}
if (Object.keys(deathCauses).length === 0) {
  console.log("  (none — all games survived!)");
} else {
  for (const [cause, count] of Object.entries(deathCauses).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cause}: ${count}`);
  }
}

// Synergy activation frequency
console.log("\nSynergy Activation Counts:");
const synergyCounts = {};
for (const r of results) {
  for (const id of r.synergiesActivated) {
    synergyCounts[id] = (synergyCounts[id] || 0) + 1;
  }
}
if (Object.keys(synergyCounts).length === 0) {
  console.log("  (none activated across all games)");
} else {
  for (const [id, count] of Object.entries(synergyCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${id}: ${count}/${NUM_RUNS}`);
  }
}

// Final meter spread for victories
const victories = results.filter((r) => r.outcome === "victory");
if (victories.length > 0) {
  console.log("\nVictory Meter Spreads (avg):");
  const avgMeters = { treasury: 0, people: 0, military: 0, faith: 0 };
  for (const v of victories) {
    for (const m of Object.keys(avgMeters)) {
      avgMeters[m] += v.finalMeters[m];
    }
  }
  for (const m of Object.keys(avgMeters)) {
    avgMeters[m] = Math.round(avgMeters[m] / victories.length);
  }
  console.log(`  Treasury: ${avgMeters.treasury} | People: ${avgMeters.people} | Military: ${avgMeters.military} | Faith: ${avgMeters.faith}`);
}

// Final verdict
console.log("\n" + "=".repeat(80));
console.log(`Total: ${results.length} games | ${totalBugs} bugs | ${totalWarnings} warnings`);
if (totalBugs === 0) {
  console.log("No invariant violations detected.");
} else {
  console.log(`ATTENTION: ${totalBugs} bug(s) found — review [BUG] lines above.`);
}
console.log("=".repeat(80) + "\n");
