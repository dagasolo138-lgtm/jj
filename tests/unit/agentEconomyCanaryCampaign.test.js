import assert from "node:assert/strict";
import test from "node:test";

import {
  CANARY_CAMPAIGN_STATUS,
  ENGINE_MODES,
  applyCanaryTransaction,
  createInitialAgentEconomy,
  createInitialEngineControl,
  ensureLiveStateAdapter,
  finalizeCanaryCampaignTransaction,
  getCanaryCampaignBlockers,
  isCanaryCampaignRunning,
  recordEngineComparison,
  startCanaryCampaign,
  stopCanaryCampaign,
} from "../../src/engine/agentEconomy/index.js";
import { getEconomyMonitorViewModel } from "../../src/engine/agentEconomy/economyMonitorSelectors.js";
import {
  gameReducer,
  initialState,
} from "../../src/engine/agentEconomy/integratedGameReducer.js";

function safeComparison(id) {
  return {
    id,
    turn: 1,
    season: "spring",
    safe: true,
    criticalIssues: [],
    warnings: [],
  };
}

function readyControl(requiredSafeQuarters = 2) {
  let control = createInitialEngineControl({
    requiredSafeQuarters,
    adapterCapabilities: {
      treasury: true,
      estateInventory: true,
      population: true,
      victoryAndGameOver: true,
    },
  });
  for (let index = 0; index < requiredSafeQuarters; index += 1) {
    control = recordEngineComparison(control, safeComparison(`safe-${index + 1}`));
  }
  return control;
}

function baseState(overrides = {}) {
  return {
    turn: 4,
    season: "winter",
    year: 1,
    difficulty: "normal",
    phase: "management",
    denarii: 100,
    food: 12,
    population: 2,
    garrison: 1,
    inventory: { grain: 12, iron: 2 },
    bankruptcyTurns: 0,
    starvationTurns: 0,
    resourceDeltas: { denarii: 0, food: 0, population: 0, garrison: 0 },
    economyHistory: [],
    gameOverReason: null,
    ...overrides,
  };
}

function projectedAgent(state) {
  const economy = ensureLiveStateAdapter(createInitialAgentEconomy(state.population, {
    estateInventory: state.inventory,
    seed: 47,
  }), state);
  return {
    ...economy,
    liveStateAdapter: {
      ...economy.liveStateAdapter,
      treasury: {
        ...economy.liveStateAdapter.treasury,
        projectedDenarii: state.denarii,
      },
      outcome: {
        ...economy.liveStateAdapter.outcome,
        phase: state.phase,
        gameOverReason: state.gameOverReason,
      },
    },
  };
}

test("campaign remains blocked until adapters and the safe-quarter streak are ready", () => {
  const control = createInitialEngineControl({
    requiredSafeQuarters: 3,
    adapterCapabilities: {
      treasury: true,
      estateInventory: true,
      population: true,
      victoryAndGameOver: true,
    },
  });
  const started = startCanaryCampaign(control, { quarterLimit: 3, turn: 5 });

  assert.deepEqual(getCanaryCampaignBlockers(control), ["safe-quarter-streak:0/3"]);
  assert.equal(started.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.BLOCKED);
  assert.equal(started.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(started.writeBackEnabled, false);
  assert.match(started.canaryCampaign.lastStopReason, /^campaign-blocked:/);
});

test("starting a campaign atomically enables a bounded canary window", () => {
  const started = startCanaryCampaign(readyControl(), { quarterLimit: 3, turn: 7 });

  assert.equal(isCanaryCampaignRunning(started), true);
  assert.equal(started.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.RUNNING);
  assert.equal(started.canaryCampaign.quarterLimit, 3);
  assert.equal(started.canaryCampaign.startedTurn, 7);
  assert.equal(started.activeMode, ENGINE_MODES.CANARY);
  assert.equal(started.requestedMode, ENGINE_MODES.CANARY);
  assert.equal(started.authority, ENGINE_MODES.LEGACY);
  assert.equal(started.writeBackEnabled, true);
  assert.deepEqual(started.promotionBlockers, []);
});

test("the final committed quarter automatically closes the campaign", () => {
  let control = startCanaryCampaign(readyControl(1), { quarterLimit: 3, turn: 2 });

  for (let index = 1; index <= 3; index += 1) {
    control = finalizeCanaryCampaignTransaction(control, {
      id: `tx-${index}`,
      status: "committed",
      applied: true,
      issues: [],
    }, index + 2);
  }

  assert.equal(control.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.COMPLETED);
  assert.equal(control.canaryCampaign.attemptedQuarters, 3);
  assert.equal(control.canaryCampaign.committedQuarters, 3);
  assert.equal(control.canaryCampaign.lastStopReason, "campaign-limit-reached");
  assert.equal(control.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(control.authority, ENGINE_MODES.LEGACY);
  assert.equal(control.writeBackEnabled, false);
  assert.ok(control.promotionBlockers.includes("candidate-write-disabled"));
});

test("a rolled-back transaction aborts the campaign and restores the hard write gate", () => {
  const started = startCanaryCampaign(readyControl(1), { quarterLimit: 3, turn: 2 });
  const aborted = finalizeCanaryCampaignTransaction(started, {
    id: "tx-bad",
    status: "rolled-back",
    applied: false,
    issues: ["invalid-denarii"],
  }, 3);

  assert.equal(aborted.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.ABORTED);
  assert.equal(aborted.canaryCampaign.attemptedQuarters, 1);
  assert.equal(aborted.canaryCampaign.committedQuarters, 0);
  assert.equal(aborted.canaryCampaign.lastStopReason, "invalid-denarii");
  assert.equal(aborted.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(aborted.writeBackEnabled, false);
  assert.ok(aborted.promotionBlockers.includes("candidate-write-disabled"));
});

test("operator stop aborts an active campaign immediately", () => {
  const started = startCanaryCampaign(readyControl(1), { quarterLimit: 3, turn: 2 });
  const stopped = stopCanaryCampaign(started, "operator-emergency-stop", 3);

  assert.equal(stopped.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.ABORTED);
  assert.equal(stopped.canaryCampaign.lastStopReason, "operator-emergency-stop");
  assert.equal(stopped.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(stopped.authority, ENGINE_MODES.LEGACY);
  assert.equal(stopped.writeBackEnabled, false);
  assert.equal(stopped.rollbackCount, started.rollbackCount + 1);
});

test("real transactions stop writing after the campaign quarter limit", () => {
  const official = baseState();
  let agentEconomy = projectedAgent(official);
  let control = startCanaryCampaign(readyControl(1), { quarterLimit: 2, turn: official.turn });

  const first = applyCanaryTransaction({
    beforeState: official,
    legacyState: official,
    agentEconomy,
    control,
    comparison: safeComparison("first"),
  });
  assert.equal(first.applied, true);
  assert.equal(first.control.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.RUNNING);
  assert.equal(first.agentEconomy.enabled, true);

  agentEconomy = first.agentEconomy;
  control = first.control;
  const second = applyCanaryTransaction({
    beforeState: first.state,
    legacyState: first.state,
    agentEconomy,
    control,
    comparison: safeComparison("second"),
  });

  assert.equal(second.applied, true);
  assert.equal(second.control.canaryWriteCount, 2);
  assert.equal(second.control.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.COMPLETED);
  assert.equal(second.control.writeBackEnabled, false);
  assert.equal(second.control.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(second.agentEconomy.enabled, false);
  assert.equal(second.agentEconomy.shadowMode, true);
  assert.equal(second.agentEconomy.liveStateAdapter.writeBackEnabled, false);
});

test("an active mode without a running campaign cannot write official state", () => {
  const official = baseState();
  const agentEconomy = projectedAgent(official);
  const control = {
    ...readyControl(1),
    requestedMode: ENGINE_MODES.CANARY,
    activeMode: ENGINE_MODES.CANARY,
    writeBackEnabled: true,
    canaryEligible: true,
  };
  const result = applyCanaryTransaction({
    beforeState: official,
    legacyState: official,
    agentEconomy,
    control,
    comparison: safeComparison("no-campaign"),
  });

  assert.equal(result.applied, false);
  assert.equal(result.transaction, null);
  assert.equal(result.state, official);
});

test("reducer campaign controls are explicit and emergency stop is atomic", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const ready = {
    ...started,
    agentEconomy: {
      ...started.agentEconomy,
      engineControl: readyControl(1),
    },
  };
  const running = gameReducer(ready, {
    type: "AGENT_ECONOMY_START_CANARY_CAMPAIGN",
    payload: { quarterLimit: 3 },
  });

  assert.equal(running.agentEconomy.engineControl.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.RUNNING);
  assert.equal(running.agentEconomy.enabled, true);
  assert.equal(running.agentEconomy.shadowMode, false);
  assert.equal(running.agentEconomy.liveStateAdapter.writeBackEnabled, true);

  const stopped = gameReducer(running, {
    type: "AGENT_ECONOMY_STOP_CANARY_CAMPAIGN",
    payload: { reason: "test-stop" },
  });
  assert.equal(stopped.agentEconomy.engineControl.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.ABORTED);
  assert.equal(stopped.agentEconomy.engineControl.writeBackEnabled, false);
  assert.equal(stopped.agentEconomy.enabled, false);
  assert.equal(stopped.agentEconomy.shadowMode, true);
});

test("monitor selector exposes campaign progress and recent transactions", () => {
  const official = baseState();
  const agentEconomy = projectedAgent(official);
  const control = startCanaryCampaign(readyControl(1), { quarterLimit: 3, turn: 4 });
  const state = {
    ...official,
    agentEconomy: {
      ...agentEconomy,
      engineControl: {
        ...control,
        canaryTransactionHistory: [{
          id: "tx-visible",
          status: "committed",
          turn: 4,
          season: "winter",
          issues: [],
        }],
      },
    },
  };
  const view = getEconomyMonitorViewModel(state);

  assert.equal(view.campaign.status, CANARY_CAMPAIGN_STATUS.RUNNING);
  assert.equal(view.campaign.quarterLimit, 3);
  assert.equal(view.campaign.canStart, false);
  assert.equal(view.mode.writeBackEnabled, true);
  assert.equal(view.transactions[0].id, "tx-visible");
});


test("switching away from canary aborts a running campaign", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const running = gameReducer({
    ...started,
    agentEconomy: {
      ...started.agentEconomy,
      engineControl: readyControl(1),
    },
  }, {
    type: "AGENT_ECONOMY_START_CANARY_CAMPAIGN",
    payload: { quarterLimit: 3 },
  });
  const shadow = gameReducer(running, {
    type: "AGENT_ECONOMY_SET_MODE",
    payload: { mode: ENGINE_MODES.SHADOW },
  });

  assert.equal(shadow.agentEconomy.engineControl.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.ABORTED);
  assert.equal(shadow.agentEconomy.engineControl.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(shadow.agentEconomy.engineControl.writeBackEnabled, false);
  assert.equal(shadow.agentEconomy.liveStateAdapter.writeBackEnabled, false);
  assert.equal(shadow.agentEconomy.enabled, false);
});

test("disabling write-back aborts the campaign instead of leaving a ghost run", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const running = gameReducer({
    ...started,
    agentEconomy: {
      ...started.agentEconomy,
      engineControl: readyControl(1),
    },
  }, {
    type: "AGENT_ECONOMY_START_CANARY_CAMPAIGN",
    payload: { quarterLimit: 3 },
  });
  const disabled = gameReducer(running, {
    type: "AGENT_ECONOMY_SET_WRITE_BACK",
    payload: { enabled: false },
  });

  assert.equal(disabled.agentEconomy.engineControl.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.ABORTED);
  assert.equal(disabled.agentEconomy.engineControl.canaryCampaign.lastStopReason, "writeback-disabled");
  assert.equal(disabled.agentEconomy.engineControl.writeBackEnabled, false);
  assert.equal(disabled.agentEconomy.engineControl.authority, ENGINE_MODES.LEGACY);
  assert.equal(disabled.agentEconomy.shadowMode, true);
});
