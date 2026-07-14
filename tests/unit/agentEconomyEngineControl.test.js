import assert from "node:assert/strict";
import test from "node:test";

import { gameReducer as legacyGameReducer } from "../../src/engine/gameReducer.js";
import {
  gameReducer,
  initialState,
} from "../../src/engine/agentEconomy/integratedGameReducer.js";
import {
  ENGINE_MODES,
  buildEngineComparison,
  createInitialAgentEconomy,
  createInitialEngineControl,
  recordEngineComparison,
  requestEngineMode,
  simulateAgentQuarter,
} from "../../src/engine/agentEconomy/index.js";

function withFixedRandom(callback) {
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

function startGame() {
  return gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
}

function simulateSeason(state) {
  return withFixedRandom(() => gameReducer(state, {
    type: "SIMULATE_SEASON",
    payload: { seasonalEvents: [] },
  }));
}

function safeComparison(index = 1) {
  return {
    id: `safe-${index}`,
    turn: index,
    season: "spring",
    safe: true,
    criticalIssues: [],
    warnings: [],
  };
}

test("new games start in shadow mode with live adapters ready and write-back blocked", () => {
  const state = startGame();
  const control = state.agentEconomy.engineControl;

  assert.equal(control.requestedMode, ENGINE_MODES.SHADOW);
  assert.equal(control.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(control.authority, ENGINE_MODES.LEGACY);
  assert.equal(control.canaryEligible, false);
  assert.ok(Object.values(control.adapterCapabilities).every(Boolean));
  assert.ok(!control.promotionBlockers.some((item) => item.startsWith("adapter-not-ready:")));
  assert.ok(control.promotionBlockers.includes("candidate-write-disabled"));
});

test("season simulation records a safe engine comparison without changing legacy authority", () => {
  const before = startGame();
  const expectedLegacy = withFixedRandom(() => legacyGameReducer(before, {
    type: "SIMULATE_SEASON",
    payload: { seasonalEvents: [] },
  }));
  const after = simulateSeason(before);
  const control = after.agentEconomy.engineControl;

  assert.equal(control.totalComparisons, 1);
  assert.equal(control.lastComparison.safe, true, control.lastComparison.criticalIssues?.join("\n"));
  assert.equal(control.consecutiveSafeQuarters, 1);
  assert.equal(control.authority, ENGINE_MODES.LEGACY);
  assert.equal(after.denarii, expectedLegacy.denarii);
  assert.equal(after.food, expectedLegacy.food);
  assert.equal(after.population, expectedLegacy.population);
  assert.deepEqual(after.inventory, expectedLegacy.inventory);
  assert.equal(control.legacyCheckpoint.turn, before.turn);
});

test("legacy-only mode skips the candidate engine", () => {
  const started = startGame();
  const legacyOnly = gameReducer(started, {
    type: "AGENT_ECONOMY_SET_MODE",
    payload: { mode: ENGINE_MODES.LEGACY },
  });
  const beforeDay = legacyOnly.agentEconomy.day;
  const after = simulateSeason(legacyOnly);

  assert.equal(after.agentEconomy.day, beforeDay);
  assert.equal(after.agentEconomy.engineControl.activeMode, ENGINE_MODES.LEGACY);
  assert.equal(after.agentEconomy.engineControl.totalComparisons, 0);
  assert.equal(after.agentEconomy.shadowMode, false);
});

test("canary requests remain blocked while game-state adapters are incomplete", () => {
  const started = startGame();
  const requested = gameReducer(started, {
    type: "AGENT_ECONOMY_SET_MODE",
    payload: { mode: ENGINE_MODES.CANARY },
  });
  const control = requested.agentEconomy.engineControl;

  assert.equal(control.requestedMode, ENGINE_MODES.CANARY);
  assert.equal(control.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(control.authority, ENGINE_MODES.LEGACY);
  assert.match(control.lastRollbackReason, /^promotion-blocked:/);
});

test("eight safe comparisons and complete adapters make canary eligible", () => {
  let control = createInitialEngineControl({
    writeBackEnabled: true,
    adapterCapabilities: {
      treasury: true,
      estateInventory: true,
      population: true,
      victoryAndGameOver: true,
    },
  });

  for (let index = 1; index <= 8; index += 1) {
    control = recordEngineComparison(control, safeComparison(index));
  }

  assert.equal(control.canaryEligible, true);
  assert.equal(control.consecutiveSafeQuarters, 8);
  assert.deepEqual(control.promotionBlockers, []);

  const requested = requestEngineMode(control, ENGINE_MODES.CANARY, 9);
  assert.equal(requested.activeMode, ENGINE_MODES.CANARY);
  assert.equal(requested.authority, ENGINE_MODES.LEGACY);
});

test("unsafe comparison automatically rolls canary back to shadow", () => {
  let control = createInitialEngineControl({
    requestedMode: ENGINE_MODES.CANARY,
    writeBackEnabled: true,
    adapterCapabilities: {
      treasury: true,
      estateInventory: true,
      population: true,
      victoryAndGameOver: true,
    },
  });
  control = {
    ...control,
    requestedMode: ENGINE_MODES.CANARY,
    activeMode: ENGINE_MODES.CANARY,
    canaryEligible: true,
    consecutiveSafeQuarters: 8,
  };

  const rolledBack = recordEngineComparison(control, {
    id: "unsafe",
    safe: false,
    criticalIssues: ["cash-accounting-error:10"],
    warnings: [],
  });

  assert.equal(rolledBack.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(rolledBack.authority, ENGINE_MODES.LEGACY);
  assert.equal(rolledBack.rollbackCount, 1);
  assert.equal(rolledBack.lastRollbackReason, "cash-accounting-error:10");
  assert.equal(rolledBack.consecutiveSafeQuarters, 0);
});

test("comparison detects corrupt household output", () => {
  const beforeAgent = createInitialAgentEconomy(10, { seed: 7 });
  const projected = simulateAgentQuarter(beforeAgent, {
    days: 30,
    turn: 1,
    season: "spring",
    taxRate: "medium",
    buildings: [],
    laborAllocation: { construction: 0 },
  });
  projected.households[0] = {
    ...projected.households[0],
    cash: -5,
  };

  const comparison = buildEngineComparison({
    beforeLegacy: { denarii: 100, food: 20, population: 10, garrison: 0, inventory: {} },
    afterLegacy: { denarii: 100, food: 20, population: 10, garrison: 0, inventory: {} },
    beforeAgent,
    projectedAgent: projected,
    turn: 1,
    season: "spring",
    expectedDays: 30,
  });

  assert.equal(comparison.safe, false);
  assert.ok(comparison.criticalIssues.some((item) => item.startsWith("invalid-household-cash:")));
});

test("comparison history is capped at forty quarters", () => {
  let control = createInitialEngineControl();
  for (let index = 1; index <= 55; index += 1) {
    control = recordEngineComparison(control, safeComparison(index));
  }

  assert.equal(control.comparisonHistory.length, 40);
  assert.equal(control.comparisonHistory[0].id, "safe-16");
  assert.equal(control.comparisonHistory.at(-1).id, "safe-55");
});
