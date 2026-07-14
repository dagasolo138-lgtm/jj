import assert from "node:assert/strict";
import test from "node:test";

import { gameReducer as legacyGameReducer } from "../../src/engine/gameReducer.js";
import { checkGameOver } from "../../src/engine/meterUtils.js";
import {
  gameReducer,
  initialState,
} from "../../src/engine/agentEconomy/integratedGameReducer.js";
import {
  CANARY_TRANSACTION_HISTORY_LIMIT,
  ENGINE_MODES,
  applyCanaryTransaction,
  createInitialAgentEconomy,
  createInitialEngineControl,
  ensureLiveStateAdapter,
  isCanaryCampaignRunning,
  projectAgentEconomyToLegacyState,
  recordEngineComparison,
  startCanaryCampaign,
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

function safeComparison(id = "safe-canary") {
  return {
    id,
    turn: 1,
    season: "spring",
    safe: true,
    criticalIssues: [],
    warnings: [],
  };
}

function readyCanaryControl() {
  let control = createInitialEngineControl({
    writeBackEnabled: true,
    requiredSafeQuarters: 1,
    adapterCapabilities: {
      treasury: true,
      estateInventory: true,
      population: true,
      victoryAndGameOver: true,
    },
  });
  control = recordEngineComparison(control, safeComparison("eligibility"));
  control = startCanaryCampaign(control, { quarterLimit: 4, turn: 1 });
  assert.equal(control.activeMode, ENGINE_MODES.CANARY);
  assert.equal(isCanaryCampaignRunning(control), true);
  assert.equal(control.writeBackEnabled, true);
  return control;
}

function baseState(overrides = {}) {
  return {
    turn: 1,
    season: "spring",
    year: 1,
    difficulty: "normal",
    phase: "management",
    denarii: 100,
    food: 10,
    population: 2,
    garrison: 1,
    inventory: { grain: 10, iron: 2 },
    bankruptcyTurns: 0,
    starvationTurns: 0,
    resourceDeltas: { denarii: 0, food: 0, population: 0, garrison: 0 },
    economyHistory: [],
    buildings: [{ instanceId: "test-farm", type: "strip_farm", condition: 100 }],
    chronicle: [{ text: "preserve-me" }],
    gameOverReason: null,
    ...overrides,
  };
}

function projectedAgent(legacyState, overrides = {}) {
  const economy = ensureLiveStateAdapter(createInitialAgentEconomy(legacyState.population, {
    estateInventory: overrides.inventory ?? { grain: 12, iron: 3 },
    seed: 99,
  }), legacyState);
  return {
    ...economy,
    liveStateAdapter: {
      ...economy.liveStateAdapter,
      treasury: {
        ...economy.liveStateAdapter.treasury,
        projectedDenarii: overrides.denarii ?? 130,
      },
      outcome: {
        ...economy.liveStateAdapter.outcome,
        phase: legacyState.phase,
        gameOverReason: legacyState.gameOverReason,
      },
    },
  };
}

test("safe canary transaction atomically commits candidate resources", () => {
  const before = baseState();
  const legacyAfter = baseState({
    phase: "seasonal_resolve",
    denarii: 90,
    food: 8,
    inventory: { grain: 8, iron: 2 },
    economyHistory: [{ turn: 1, season: "spring", netGold: -10, netFood: -2 }],
  });
  const agentEconomy = projectedAgent(legacyAfter);
  const legacySnapshot = structuredClone(legacyAfter);
  const agentSnapshot = structuredClone(agentEconomy);

  const result = applyCanaryTransaction({
    beforeState: before,
    legacyState: legacyAfter,
    agentEconomy,
    control: readyCanaryControl(),
    comparison: safeComparison(),
  });

  assert.equal(result.applied, true);
  assert.equal(result.state.denarii, 130);
  assert.equal(result.state.food, 12);
  assert.equal(result.state.population, 2);
  assert.equal(result.state.inventory.grain, 12);
  assert.equal(result.state.inventory.iron, 3);
  assert.deepEqual(result.state.buildings, legacyAfter.buildings);
  assert.deepEqual(result.state.chronicle, legacyAfter.chronicle);
  assert.equal(result.state.phase, legacyAfter.phase);
  assert.deepEqual(result.state.resourceDeltas, {
    denarii: 30,
    food: 2,
    population: 0,
    garrison: 0,
  });
  assert.equal(result.state.economyHistory.at(-1).netGold, 30);
  assert.equal(result.state.economyHistory.at(-1).netFood, 2);
  assert.equal(result.control.authority, ENGINE_MODES.CANARY);
  assert.equal(result.control.canaryWriteCount, 1);
  assert.equal(result.control.canaryRollbackCount, 0);
  assert.equal(result.transaction.status, "committed");
  assert.equal(result.transaction.checkpoint.denarii, 90);
  assert.equal(result.agentEconomy.enabled, true);
  assert.equal(result.agentEconomy.shadowMode, false);
  assert.equal(result.agentEconomy.liveStateAdapter.shadowOnly, false);
  assert.deepEqual(legacyAfter, legacySnapshot);
  assert.deepEqual(agentEconomy, agentSnapshot);
});

test("invalid candidate projection restores the complete legacy result and disables write-back", () => {
  const before = baseState();
  const legacyAfter = baseState({
    phase: "seasonal_resolve",
    denarii: 91,
    inventory: { grain: 9, iron: 2 },
    food: 9,
  });
  const agentEconomy = projectedAgent(legacyAfter);
  const legacySnapshot = structuredClone(legacyAfter);

  const result = applyCanaryTransaction({
    beforeState: before,
    legacyState: legacyAfter,
    agentEconomy,
    control: readyCanaryControl(),
    comparison: safeComparison(),
    projector: () => ({
      ...legacyAfter,
      denarii: Number.NaN,
      food: -5,
      inventory: { grain: -5 },
    }),
  });

  assert.equal(result.applied, false);
  assert.deepEqual(result.state, legacySnapshot);
  assert.equal(result.control.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(result.control.authority, ENGINE_MODES.LEGACY);
  assert.equal(result.control.writeBackEnabled, false);
  assert.ok(result.control.promotionBlockers.includes("candidate-write-disabled"));
  assert.equal(result.control.rollbackCount, 1);
  assert.equal(result.control.canaryWriteCount, 0);
  assert.equal(result.control.canaryRollbackCount, 1);
  assert.equal(result.transaction.status, "rolled-back");
  assert.ok(result.transaction.issues.includes("invalid-denarii"));
  assert.ok(result.transaction.issues.includes("invalid-food"));
  assert.ok(result.transaction.issues.includes("invalid-inventory-quantity:grain"));
  assert.equal(result.agentEconomy.enabled, false);
  assert.equal(result.agentEconomy.shadowMode, true);
  assert.equal(result.agentEconomy.liveStateAdapter.writeBackEnabled, false);
});

test("object game-over reasons compare by value rather than object identity", () => {
  const gameOverReason = checkGameOver({
    population: 0,
    bankruptcyTurns: 0,
    starvationTurns: 0,
    difficulty: "normal",
  });
  const before = baseState({ population: 1, food: 0, inventory: { grain: 0 } });
  const legacyAfter = baseState({
    phase: "game_over",
    population: 0,
    food: 0,
    inventory: { grain: 0 },
    gameOverReason: structuredClone(gameOverReason),
  });
  const agentEconomy = projectedAgent(legacyAfter, {
    inventory: {},
    denarii: 100,
  });

  const result = applyCanaryTransaction({
    beforeState: before,
    legacyState: legacyAfter,
    agentEconomy,
    control: readyCanaryControl(),
    comparison: safeComparison("game-over"),
  });

  assert.equal(result.applied, true);
  assert.deepEqual(result.state.gameOverReason, gameOverReason);
  assert.deepEqual(result.transaction.committed.gameOverReason, gameOverReason);
});

test("canary transaction history is capped", () => {
  const before = baseState();
  const legacyAfter = baseState({ phase: "seasonal_resolve" });
  let agentEconomy = projectedAgent(legacyAfter);
  let control = readyCanaryControl();

  for (let index = 0; index < CANARY_TRANSACTION_HISTORY_LIMIT + 7; index += 1) {
    if (!isCanaryCampaignRunning(control)) {
      control = startCanaryCampaign(control, { quarterLimit: 4, turn: index + 1 });
    }
    const result = applyCanaryTransaction({
      beforeState: before,
      legacyState: legacyAfter,
      agentEconomy,
      control,
      comparison: safeComparison(`history-${index}`),
    });
    assert.equal(result.applied, true);
    control = result.control;
    agentEconomy = result.agentEconomy;
  }

  assert.equal(control.canaryWriteCount, CANARY_TRANSACTION_HISTORY_LIMIT + 7);
  assert.equal(control.canaryTransactionHistory.length, CANARY_TRANSACTION_HISTORY_LIMIT);
  assert.equal(control.canaryTransactionHistory.at(-1).comparisonId, `history-${CANARY_TRANSACTION_HISTORY_LIMIT + 6}`);
});

test("integrated reducer writes only candidate resource fields during an active canary quarter", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const armed = {
    ...started,
    agentEconomy: {
      ...started.agentEconomy,
      liveStateAdapter: {
        ...started.agentEconomy.liveStateAdapter,
        writeBackEnabled: true,
        shadowOnly: true,
      },
      engineControl: readyCanaryControl(),
    },
  };
  const action = { type: "SIMULATE_SEASON", payload: { seasonalEvents: [] } };
  const expectedLegacy = fixedRandom(() => legacyGameReducer(armed, action));
  const after = fixedRandom(() => gameReducer(armed, action));
  const projected = projectAgentEconomyToLegacyState(after.agentEconomy, after);

  assert.equal(after.agentEconomy.engineControl.authority, ENGINE_MODES.CANARY);
  assert.equal(after.agentEconomy.engineControl.canaryWriteCount, 1);
  assert.equal(after.agentEconomy.engineControl.lastCanaryTransaction.status, "committed");
  assert.equal(after.agentEconomy.enabled, true);
  assert.equal(after.agentEconomy.shadowMode, false);
  assert.equal(after.denarii, projected.denarii);
  assert.equal(after.food, projected.food);
  assert.equal(after.population, projected.population);
  assert.deepEqual(after.inventory, projected.inventory);
  for (const key of ["phase", "garrison", "buildings", "chronicle", "seasonReport"]) {
    assert.deepEqual(after[key], expectedLegacy[key], key);
  }
});

test("disabling write-back immediately demotes an active canary", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const canaryState = {
    ...started,
    agentEconomy: {
      ...started.agentEconomy,
      enabled: true,
      shadowMode: false,
      liveStateAdapter: {
        ...started.agentEconomy.liveStateAdapter,
        writeBackEnabled: true,
        shadowOnly: false,
      },
      engineControl: {
        ...readyCanaryControl(),
        authority: ENGINE_MODES.CANARY,
      },
    },
  };

  const demoted = gameReducer(canaryState, {
    type: "AGENT_ECONOMY_SET_WRITE_BACK",
    payload: { enabled: false },
  });

  assert.equal(demoted.agentEconomy.engineControl.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(demoted.agentEconomy.engineControl.authority, ENGINE_MODES.LEGACY);
  assert.equal(demoted.agentEconomy.engineControl.writeBackEnabled, false);
  assert.equal(demoted.agentEconomy.enabled, false);
  assert.equal(demoted.agentEconomy.shadowMode, true);
  assert.equal(demoted.agentEconomy.liveStateAdapter.shadowOnly, true);
});
