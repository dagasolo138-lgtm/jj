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
  control = startCanaryCampaign(control, { quarterLimit: 3, turn: 1 });
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
  const desiredInventory = overrides.inventory ?? { grain: 12, iron: 3 };
  const households = economy.households.map((household, index) => ({
    ...household,
    inventory: index === 0
      ? {
        ...household.inventory,
        ...desiredInventory,
      }
      : Object.fromEntries(Object.keys(household.inventory ?? {}).map((key) => [key, 0])),
  }));
  return {
    ...economy,
    households,
    liveStateAdapter: {
      ...economy.liveStateAdapter,
      treasury: {
        ...economy.liveStateAdapter.treasury,
        projectedDenarii: overrides.denarii ?? 120,
      },
      outcome: {
        ...economy.liveStateAdapter.outcome,
        phase: overrides.phase ?? legacyState.phase,
        gameOverReason: overrides.gameOverReason ?? legacyState.gameOverReason,
      },
    },
  };
}

test("safe canary transaction atomically commits candidate resources", () => {
  const beforeState = baseState();
  const legacyState = {
    ...beforeState,
    denarii: 80,
    food: 8,
    inventory: { grain: 8, iron: 2 },
    buildings: [{ instanceId: "legacy-building", type: "strip_farm", condition: 91 }],
    chronicle: [...beforeState.chronicle, { text: "legacy-event" }],
  };
  const agentEconomy = projectedAgent(legacyState, {
    denarii: 120,
    inventory: { grain: 12, iron: 3 },
  });
  const control = readyCanaryControl();
  const result = applyCanaryTransaction({
    beforeState,
    legacyState,
    agentEconomy,
    control,
    comparison: safeComparison("commit"),
  });

  assert.equal(result.applied, true);
  assert.equal(result.state.denarii, 120);
  assert.equal(result.state.food, 12);
  assert.equal(result.state.population, 2);
  assert.deepEqual(result.state.inventory, { grain: 12, livestock: 0, fish: 0, flour: 0, timber: 0, wood: 0, coal: 0, iron: 3, stone: 0, clay: 0, wool: 0, cloth: 0, leather: 0, steel: 0, herbs: 0, ale: 0, salt: 0, tools: 0 });
  assert.deepEqual(result.state.buildings, legacyState.buildings);
  assert.deepEqual(result.state.chronicle, legacyState.chronicle);
  assert.equal(result.control.authority, ENGINE_MODES.CANARY);
  assert.equal(result.control.canaryWriteCount, 1);
  assert.equal(result.control.lastCanaryTransaction.status, "committed");
  assert.equal(result.agentEconomy.enabled, true);
  assert.equal(result.agentEconomy.shadowMode, false);
});

test("invalid candidate projection restores the complete legacy result and disables write-back", () => {
  const beforeState = baseState();
  const legacyState = {
    ...beforeState,
    denarii: 77,
    food: 7,
    inventory: { grain: 7, iron: 1 },
    chronicle: [...beforeState.chronicle, { text: "legacy-kept" }],
  };
  const agentEconomy = projectedAgent(legacyState);
  const control = readyCanaryControl();
  const result = applyCanaryTransaction({
    beforeState,
    legacyState,
    agentEconomy,
    control,
    comparison: safeComparison("rollback"),
    projector: () => ({
      ...legacyState,
      denarii: Number.NaN,
    }),
  });

  assert.equal(result.applied, false);
  assert.deepEqual(result.state, legacyState);
  assert.equal(result.control.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(result.control.authority, ENGINE_MODES.LEGACY);
  assert.equal(result.control.writeBackEnabled, false);
  assert.equal(result.control.canaryRollbackCount, 1);
  assert.equal(result.control.rollbackCount, control.rollbackCount + 1);
  assert.match(result.control.lastRollbackReason, /^canary-transaction:/);
  assert.equal(result.transaction.status, "rolled-back");
  assert.equal(result.agentEconomy.enabled, false);
  assert.equal(result.agentEconomy.shadowMode, true);
  assert.equal(result.agentEconomy.liveStateAdapter.writeBackEnabled, false);
  assert.ok(result.control.promotionBlockers.includes("candidate-write-disabled"));
});

test("object game-over reasons compare by value rather than object identity", () => {
  const gameOverReason = checkGameOver({
    population: 2,
    bankruptcyTurns: 4,
    starvationTurns: 0,
    difficulty: "normal",
  });
  const beforeState = baseState({
    denarii: 0,
    bankruptcyTurns: 3,
  });
  const legacyState = baseState({
    denarii: 0,
    bankruptcyTurns: 4,
    phase: "game_over",
    gameOverReason: JSON.parse(JSON.stringify(gameOverReason)),
  });
  const agentEconomy = projectedAgent(legacyState, {
    denarii: 0,
    phase: "game_over",
    gameOverReason: JSON.parse(JSON.stringify(gameOverReason)),
    inventory: { grain: 12, iron: 3 },
  });
  const result = applyCanaryTransaction({
    beforeState,
    legacyState,
    agentEconomy,
    control: readyCanaryControl(),
    comparison: safeComparison("game-over-object"),
  });

  assert.equal(result.applied, true);
  assert.deepEqual(result.state.gameOverReason, gameOverReason);
  assert.equal(result.state.phase, "game_over");
});

test("canary transaction history is capped", () => {
  const beforeState = baseState();
  const legacyState = baseState();
  const agentEconomy = projectedAgent(legacyState);
  let control = readyCanaryControl();
  control = {
    ...control,
    canaryTransactionHistory: Array.from(
      { length: CANARY_TRANSACTION_HISTORY_LIMIT },
      (_, index) => ({ id: `old-${index}`, status: "committed" }),
    ),
  };
  const result = applyCanaryTransaction({
    beforeState,
    legacyState,
    agentEconomy,
    control,
    comparison: safeComparison("history-cap"),
  });

  assert.equal(result.control.canaryTransactionHistory.length, CANARY_TRANSACTION_HISTORY_LIMIT);
  assert.notEqual(result.control.canaryTransactionHistory[0].id, "old-0");
  assert.equal(result.control.canaryTransactionHistory.at(-1).status, "committed");
});

test("integrated reducer writes only candidate resource fields during an active canary quarter", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const preparedControl = readyCanaryControl();
  const before = {
    ...started,
    agentEconomy: {
      ...started.agentEconomy,
      engineControl: preparedControl,
      enabled: true,
      shadowMode: false,
      liveStateAdapter: {
        ...started.agentEconomy.liveStateAdapter,
        writeBackEnabled: true,
        shadowOnly: false,
      },
    },
  };
  const action = { type: "SIMULATE_SEASON", payload: { seasonalEvents: [] } };
  const legacyAfter = fixedRandom(() => legacyGameReducer(before, action));
  const after = fixedRandom(() => gameReducer(before, action));

  assert.equal(after.agentEconomy.engineControl.lastCanaryTransaction.status, "committed");
  assert.equal(after.agentEconomy.engineControl.authority, ENGINE_MODES.CANARY);
  assert.equal(after.agentEconomy.shadowMode, false);
  assert.deepEqual(after.buildings, legacyAfter.buildings);
  assert.deepEqual(after.chronicle, legacyAfter.chronicle);
  assert.deepEqual(after.currentEvent, legacyAfter.currentEvent);
  assert.deepEqual(after.currentRandomEvent, legacyAfter.currentRandomEvent);
  assert.equal(after.food, after.inventory.grain + after.inventory.livestock + after.inventory.fish + after.inventory.flour);
});

test("disabling write-back immediately demotes an active canary", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const state = {
    ...started,
    agentEconomy: {
      ...started.agentEconomy,
      engineControl: readyCanaryControl(),
      enabled: true,
      shadowMode: false,
      liveStateAdapter: {
        ...started.agentEconomy.liveStateAdapter,
        writeBackEnabled: true,
        shadowOnly: false,
      },
    },
  };
  const next = gameReducer(state, {
    type: "AGENT_ECONOMY_SET_WRITE_BACK",
    payload: { enabled: false },
  });

  assert.equal(next.agentEconomy.engineControl.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(next.agentEconomy.engineControl.authority, ENGINE_MODES.LEGACY);
  assert.equal(next.agentEconomy.engineControl.writeBackEnabled, false);
  assert.equal(next.agentEconomy.engineControl.canaryEligible, false);
  assert.equal(next.agentEconomy.enabled, false);
  assert.equal(next.agentEconomy.shadowMode, true);
  assert.equal(next.agentEconomy.liveStateAdapter.writeBackEnabled, false);
  assert.ok(next.agentEconomy.engineControl.promotionBlockers.includes("candidate-write-disabled"));
});
