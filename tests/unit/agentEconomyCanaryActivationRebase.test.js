import assert from "node:assert/strict";
import test from "node:test";

import {
  gameReducer,
  initialState,
} from "../../src/engine/agentEconomy/integratedGameReducer.js";
import {
  CANARY_PILOT_STATUS,
  createInitialEngineControl,
  getDistributedInventoryTotals,
  projectAgentEconomyToLegacyState,
  rebaseAgentEconomyForCanary,
  recordEngineComparison,
} from "../../src/engine/agentEconomy/index.js";

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

function readyControl() {
  let control = createInitialEngineControl({
    requiredSafeQuarters: 1,
    adapterCapabilities: {
      treasury: true,
      estateInventory: true,
      population: true,
      victoryAndGameOver: true,
    },
  });
  control = recordEngineComparison(control, {
    id: "activation-ready",
    turn: 1,
    season: "spring",
    safe: true,
    criticalIssues: [],
    warnings: [],
  });
  return control;
}

function divergeShadowEconomy(state) {
  return {
    ...state.agentEconomy,
    households: state.agentEconomy.households.map((household, index) => ({
      ...household,
      satisfaction: index === 0 ? 73 : household.satisfaction,
      inventory: Object.fromEntries(
        Object.keys(household.inventory ?? {}).map((commodity) => [commodity, 0]),
      ),
    })),
    pendingOrders: [{ id: "stale-shadow-order", commodity: "grain" }],
    liveStateAdapter: {
      ...state.agentEconomy.liveStateAdapter,
      treasury: {
        ...state.agentEconomy.liveStateAdapter.treasury,
        projectedDenarii: 7,
      },
    },
  };
}

function assertInventoryMatches(projected, official) {
  for (const [commodity, amount] of Object.entries(official)) {
    assert.equal(projected[commodity] ?? 0, amount, commodity);
  }
  const projectedTotal = Object.values(projected).reduce((total, amount) => total + amount, 0);
  const officialTotal = Object.values(official).reduce((total, amount) => total + amount, 0);
  assert.equal(Number(projectedTotal.toFixed(4)), Number(officialTotal.toFixed(4)));
}

test("canary rebase aligns treasury, inventory and population while preserving household memory", () => {
  const state = startGame();
  const divergent = divergeShadowEconomy(state);
  const originalNeeds = divergent.households[0].needs;
  const originalBeliefs = divergent.households[0].priceBeliefs;

  const rebased = rebaseAgentEconomyForCanary(divergent, state, {
    reason: "unit-rebase",
  });
  const projected = projectAgentEconomyToLegacyState(rebased, state);

  assert.equal(projected.denarii, state.denarii);
  assert.equal(projected.food, state.food);
  assert.equal(projected.population, state.population);
  assertInventoryMatches(projected.inventory, state.inventory);
  assert.deepEqual(rebased.households[0].needs, originalNeeds);
  assert.deepEqual(rebased.households[0].priceBeliefs, originalBeliefs);
  assert.equal(rebased.households[0].satisfaction, 73);
  assert.deepEqual(rebased.pendingOrders, []);
  assert.equal(rebased.liveStateAdapter.activationBaseline.reason, "unit-rebase");
  assert.equal(rebased.liveStateAdapter.activationBaseline.previousProjection.denarii, 7);
  assert.equal(getDistributedInventoryTotals(rebased.households).grain, state.inventory.grain);
});

test("starting a pilot rebases a divergent shadow state before enabling write-back", () => {
  const started = startGame();
  const divergent = divergeShadowEconomy(started);
  const prepared = {
    ...started,
    agentEconomy: {
      ...divergent,
      engineControl: readyControl(),
    },
  };

  const running = gameReducer(prepared, {
    type: "AGENT_ECONOMY_START_CANARY_PILOT",
  });
  const projected = projectAgentEconomyToLegacyState(running.agentEconomy, running);

  assert.equal(running.agentEconomy.engineControl.canaryPilot.status, CANARY_PILOT_STATUS.RUNNING);
  assert.equal(running.agentEconomy.engineControl.writeBackEnabled, true);
  assert.equal(projected.denarii, running.denarii);
  assert.equal(projected.food, running.food);
  assert.equal(projected.population, running.population);
  assertInventoryMatches(projected.inventory, running.inventory);
  assert.equal(running.agentEconomy.liveStateAdapter.activationBaseline.reason, "pilot-start");
  assert.equal(running.agentEconomy.liveStateAdapter.activationBaseline.previousProjection.denarii, 7);
});

test("first canary write reflects only the current quarter instead of stale shadow inventory", () => {
  const started = startGame();
  const prepared = {
    ...started,
    agentEconomy: {
      ...divergeShadowEconomy(started),
      engineControl: readyControl(),
    },
  };
  const running = gameReducer(prepared, {
    type: "AGENT_ECONOMY_START_CANARY_PILOT",
  });
  const after = fixedRandom(() => gameReducer(running, {
    type: "SIMULATE_SEASON",
    payload: { seasonalEvents: [] },
  }));
  const observation = after.agentEconomy.engineControl.lastCanaryObservation;

  assert.equal(observation.status, "committed");
  assert.equal(observation.applied, true);
  for (const key of ["denarii", "food", "population", "inventory"]) {
    assert.ok(
      Math.abs((observation.resourceShift[key] ?? 0) - (observation.modelDrift[key] ?? 0)) <= 0.0002,
      `${key}: resourceShift=${observation.resourceShift[key]} modelDrift=${observation.modelDrift[key]}`,
    );
  }
});
