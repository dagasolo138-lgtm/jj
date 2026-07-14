import assert from "node:assert/strict";
import test from "node:test";

import { gameReducer as legacyGameReducer } from "../../src/engine/gameReducer.js";
import {
  gameReducer,
  initialState,
} from "../../src/engine/agentEconomy/integratedGameReducer.js";
import {
  createInitialAgentEconomy,
  ensureLiveStateAdapter,
  finalizeAgentQuarterLiveState,
  getDistributedInventoryTotals,
  getHouseholdPopulation,
  projectAgentEconomyToLegacyState,
  reconcileLiveStateTransition,
} from "../../src/engine/agentEconomy/index.js";

function sumCash(households = []) {
  return Number(households.reduce((total, household) => total + household.cash, 0).toFixed(2));
}

function fixedRandom(callback) {
  const original = Math.random;
  Math.random = () => 0.5;
  try {
    return callback();
  } finally {
    Math.random = original;
  }
}

function startGame() {
  return gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
}

test("live adapters expose all four capabilities while write-back stays disabled", () => {
  const legacy = {
    turn: 1,
    season: "spring",
    denarii: 500,
    population: 4,
    inventory: { grain: 20, iron: 3 },
    phase: "management",
  };
  const economy = ensureLiveStateAdapter(
    createInitialAgentEconomy(4, { estateInventory: legacy.inventory }),
    legacy,
  );

  assert.deepEqual(economy.agentEconomy, undefined);
  assert.ok(Object.values(economy.liveStateAdapter.capabilities).every(Boolean));
  assert.equal(economy.liveStateAdapter.shadowOnly, true);
  assert.equal(economy.liveStateAdapter.writeBackEnabled, false);
  assert.ok(economy.engineControl.promotionBlockers.includes("candidate-write-disabled"));
  assert.ok(!economy.engineControl.promotionBlockers.some((item) => item.startsWith("adapter-not-ready:")));
});

test("external treasury and estate inventory changes are mirrored into the shadow projection", () => {
  const before = {
    turn: 1,
    season: "spring",
    denarii: 100,
    population: 3,
    inventory: { grain: 12, iron: 2 },
    phase: "management",
  };
  const after = {
    ...before,
    denarii: 112,
    inventory: { grain: 8, iron: 2 },
  };
  const initial = ensureLiveStateAdapter(
    createInitialAgentEconomy(3, { estateInventory: before.inventory }),
    before,
  );
  const next = reconcileLiveStateTransition(initial, before, after, { type: "SELL_RESOURCE" });
  const totals = getDistributedInventoryTotals(next.households);

  assert.equal(next.liveStateAdapter.treasury.projectedDenarii, 112);
  assert.equal(next.liveStateAdapter.treasury.lastExternalDelta, 12);
  assert.equal(totals.grain, 8);
  assert.equal(next.liveStateAdapter.estateInventory.lastAppliedDelta.grain, -4);
  assert.deepEqual(before.inventory, { grain: 12, iron: 2 });
  assert.deepEqual(after.inventory, { grain: 8, iron: 2 });
});

test("population loss preserves removed household cash and inventory", () => {
  const beforeLegacy = {
    turn: 3,
    season: "autumn",
    denarii: 100,
    population: 3,
    inventory: { grain: 9 },
    phase: "seasonal_resolve",
  };
  const afterLegacy = { ...beforeLegacy, population: 1 };
  const initial = ensureLiveStateAdapter(createInitialAgentEconomy(3, {
    estateInventory: beforeLegacy.inventory,
  }), beforeLegacy);
  const beforeCash = sumCash(initial.households);
  const beforeInventory = getDistributedInventoryTotals(initial.households);

  const next = reconcileLiveStateTransition(
    initial,
    beforeLegacy,
    afterLegacy,
    { type: "SELECT_SEASONAL_ACTION" },
  );
  const afterCash = sumCash(next.households) + next.liveStateAdapter.unassignedAssets.cash;
  const afterInventory = getDistributedInventoryTotals(next.households);

  assert.equal(getHouseholdPopulation(next.households), 1);
  assert.equal(afterCash, beforeCash);
  assert.equal(afterInventory.grain + (next.liveStateAdapter.unassignedAssets.inventory.grain ?? 0), beforeInventory.grain);
  assert.ok(next.liveStateAdapter.population.conservedCash > 0);
});

test("victory and game-over fields are mirrored without taking authority", () => {
  const before = {
    turn: 40,
    season: "winter",
    denarii: 100,
    population: 4,
    inventory: { grain: 10 },
    phase: "random_resolve",
  };
  const after = {
    ...before,
    phase: "victory",
    pyrrhicVictory: true,
  };
  const initial = ensureLiveStateAdapter(createInitialAgentEconomy(4, {
    estateInventory: before.inventory,
  }), before);
  const next = reconcileLiveStateTransition(initial, before, after, { type: "ADVANCE_TURN" });

  assert.equal(next.liveStateAdapter.outcome.phase, "victory");
  assert.equal(next.liveStateAdapter.outcome.victory, true);
  assert.equal(next.liveStateAdapter.outcome.pyrrhicVictory, true);
  assert.equal(next.engineControl.authority, "legacy");
});

test("quarter finalization applies agent fiscal flow and ignores legacy seasonal treasury delta", () => {
  const legacyBefore = {
    turn: 1,
    season: "spring",
    denarii: 100,
    population: 2,
    inventory: { grain: 10 },
    phase: "management",
  };
  const legacyAfter = {
    ...legacyBefore,
    denarii: 999,
    phase: "seasonal_resolve",
  };
  const before = ensureLiveStateAdapter(createInitialAgentEconomy(2, {
    estateInventory: legacyBefore.inventory,
  }), legacyBefore);
  const simulated = {
    ...before,
    metrics: {
      ...before.metrics,
      taxCollected: before.metrics.taxCollected + 10,
      welfarePaid: before.metrics.welfarePaid + 3,
    },
  };
  const finalized = finalizeAgentQuarterLiveState(before, simulated, legacyAfter);

  assert.equal(finalized.liveStateAdapter.treasury.projectedDenarii, 107);
  assert.equal(finalized.liveStateAdapter.treasury.lastFiscalDelta, 7);
  assert.equal(finalized.liveStateAdapter.treasury.lastExternalDelta, 0);
});

test("projecting agent state is pure and includes household assets", () => {
  const legacy = {
    turn: 2,
    season: "summer",
    denarii: 50,
    food: 0,
    population: 2,
    inventory: {},
    phase: "management",
  };
  const economy = ensureLiveStateAdapter(createInitialAgentEconomy(2, {
    estateInventory: { grain: 8, iron: 2 },
  }), { ...legacy, inventory: { grain: 8, iron: 2 } });
  const snapshot = JSON.parse(JSON.stringify(economy));
  const projected = projectAgentEconomyToLegacyState(economy, legacy);

  assert.equal(projected.denarii, 50);
  assert.equal(projected.population, 2);
  assert.equal(projected.inventory.grain, 8);
  assert.equal(projected.inventory.iron, 2);
  assert.equal(projected.food, 8);
  assert.deepEqual(economy, snapshot);
  assert.deepEqual(legacy.inventory, {});
});

test("starting a new game resets the shadow economy and adapter ledger", () => {
  let state = startGame();
  state = {
    ...state,
    agentEconomy: {
      ...state.agentEconomy,
      day: 90,
      metrics: { ...state.agentEconomy.metrics, quartersSimulated: 3 },
    },
  };
  const restarted = gameReducer(state, {
    type: "PLAY_AGAIN",
    payload: { difficulty: "normal" },
  });

  assert.equal(restarted.agentEconomy.day, 0);
  assert.equal(restarted.agentEconomy.metrics.quartersSimulated, 0);
  assert.equal(restarted.agentEconomy.liveStateAdapter.syncCount, 0);
  assert.equal(restarted.agentEconomy.liveStateAdapter.legacySnapshot.denarii, restarted.denarii);
});

test("integrated season keeps every official legacy field authoritative", () => {
  const before = startGame();
  const action = { type: "SIMULATE_SEASON", payload: { seasonalEvents: [] } };
  const expectedLegacy = fixedRandom(() => legacyGameReducer(before, action));
  const after = fixedRandom(() => gameReducer(before, action));

  for (const key of ["denarii", "food", "population", "inventory", "phase", "gameOverReason"]) {
    assert.deepEqual(after[key], expectedLegacy[key], key);
  }
  assert.equal(after.agentEconomy.enabled, false);
  assert.equal(after.agentEconomy.shadowMode, true);
  assert.ok(Object.values(after.agentEconomy.engineControl.adapterCapabilities).every(Boolean));
  assert.ok(after.agentEconomy.engineControl.promotionBlockers.includes("candidate-write-disabled"));
});
