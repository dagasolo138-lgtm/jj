import assert from "node:assert/strict";
import test from "node:test";

import {
  CANARY_CAMPAIGN_STATUS,
  ENGINE_MODES,
  RELEASE_DRIFT_LIMITS,
  finalizeCanaryCampaignTransaction,
  getCanaryCampaignBlockers,
  getCanaryReleaseGuardrails,
  normalizeEngineControl,
  recordCanaryObservation,
  recordEngineComparison,
  startCanaryCampaign,
} from "../../src/engine/agentEconomy/index.js";
import { getEconomyMonitorViewModel } from "../../src/engine/agentEconomy/economyMonitorSelectors.js";

function safeComparison(id = "safe") {
  return {
    id,
    turn: 1,
    season: "spring",
    safe: true,
    criticalIssues: [],
    warnings: [],
    legacyDeltas: {
      denarii: 4,
      food: -2,
      population: 0,
      inventory: -1,
    },
    agentDeltas: {
      cash: 5,
      food: -1,
      population: 0,
      inventory: 0,
    },
    accounting: {
      cashAccountingError: 0,
      inventoryAccountingError: 0,
    },
  };
}

function readyControl(requiredSafeQuarters = 1) {
  let control = createReadyBase(requiredSafeQuarters);
  for (let index = 0; index < requiredSafeQuarters; index += 1) {
    control = recordEngineComparison(control, safeComparison(`safe-${index + 1}`));
  }
  return control;
}

function createReadyBase(requiredSafeQuarters) {
  return normalizeEngineControl({
    requiredSafeQuarters,
    adapterCapabilities: {
      treasury: true,
      estateInventory: true,
      population: true,
      victoryAndGameOver: true,
    },
  });
}

function completedTrial(id, overrides = {}) {
  return {
    version: 1,
    id,
    status: "completed",
    quarterLimit: 3,
    attemptedQuarters: 3,
    committedQuarters: 3,
    startedTurn: 1,
    completedTurn: 4,
    lastStopReason: "campaign-limit-reached",
    observationCount: 3,
    rollbackCount: 0,
    maxDriftRatios: {
      denarii: 0.05,
      food: 0.08,
      population: 0,
      inventory: 0.07,
    },
    totalResourceShift: {
      denarii: 8,
      food: -3,
      population: 0,
      inventory: -2,
    },
    ...overrides,
  };
}

test("four-quarter campaigns remain blocked until three standard trials are complete", () => {
  const control = readyControl();
  const blockers = getCanaryCampaignBlockers(control, { quarterLimit: 4 });
  const started = startCanaryCampaign(control, { quarterLimit: 4, turn: 9 });

  assert.ok(blockers.includes("release-gate:completed-trials:0/3"));
  assert.ok(blockers.includes("release-gate:observation-window:0/3"));
  assert.equal(started.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.BLOCKED);
  assert.equal(started.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(started.writeBackEnabled, false);
});

test("three clean standard trials unlock the four-quarter extension", () => {
  const control = {
    ...readyControl(),
    canaryCampaignHistory: [
      completedTrial("trial-1"),
      completedTrial("trial-2"),
      completedTrial("trial-3"),
    ],
  };
  const gate = getCanaryReleaseGuardrails(control);
  const started = startCanaryCampaign(control, { quarterLimit: 4, turn: 14 });

  assert.equal(gate.ready, true);
  assert.deepEqual(gate.blockers, []);
  assert.equal(started.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.RUNNING);
  assert.equal(started.canaryCampaign.tier, "extended");
  assert.equal(started.canaryCampaign.quarterLimit, 4);
  assert.equal(started.writeBackEnabled, true);
});

test("a recent aborted campaign blocks extension even after enough completed trials", () => {
  const control = {
    ...readyControl(),
    canaryCampaignHistory: [
      completedTrial("trial-1"),
      completedTrial("trial-2"),
      completedTrial("trial-3"),
      completedTrial("trial-aborted", {
        status: "aborted",
        committedQuarters: 1,
        attemptedQuarters: 2,
        rollbackCount: 1,
        lastStopReason: "invalid-denarii",
      }),
    ],
  };
  const gate = getCanaryReleaseGuardrails(control);

  assert.equal(gate.ready, false);
  assert.ok(gate.blockers.includes("recent-campaign-abort"));
  assert.ok(gate.blockers.includes("recent-transaction-rollback"));
});

test("resource drift beyond a release limit blocks extension", () => {
  const control = {
    ...readyControl(),
    canaryCampaignHistory: [
      completedTrial("trial-1"),
      completedTrial("trial-2"),
      completedTrial("trial-3", {
        maxDriftRatios: {
          denarii: RELEASE_DRIFT_LIMITS.denariiRatio + 0.01,
          food: 0.1,
          population: 0,
          inventory: 0.1,
        },
      }),
    ],
  };
  const gate = getCanaryReleaseGuardrails(control);

  assert.equal(gate.ready, false);
  assert.ok(gate.blockers.includes("denarii-drift-limit"));
});

test("transaction observations record model drift and are archived with the campaign", () => {
  let control = startCanaryCampaign(readyControl(), { quarterLimit: 1, turn: 4 });
  const transaction = {
    id: "tx-observed",
    status: "committed",
    applied: true,
    turn: 4,
    season: "winter",
    issues: [],
    checkpoint: {
      denarii: 100,
      food: 20,
      population: 2,
      inventory: { grain: 20, iron: 2 },
    },
    committed: {
      denarii: 105,
      food: 19,
      population: 2,
      inventory: { grain: 19, iron: 3 },
    },
  };
  control = recordCanaryObservation(control, transaction, safeComparison("observed"));
  control = finalizeCanaryCampaignTransaction(control, transaction, 5);

  assert.equal(control.canaryObservations.length, 1);
  assert.equal(control.canaryObservations[0].transactionId, "tx-observed");
  assert.deepEqual(control.canaryObservations[0].modelDrift, {
    denarii: 1,
    food: 1,
    population: 0,
    inventory: 1,
  });
  assert.equal(control.canaryCampaignHistory.length, 1);
  assert.equal(control.canaryCampaignHistory[0].observationCount, 1);
  assert.equal(control.canaryCampaignHistory[0].status, "completed");
  assert.equal(control.lastCanaryCampaignSummary.id, control.canaryCampaign.id);
});

test("observation and campaign history survive JSON save normalization", () => {
  const source = {
    ...readyControl(),
    canaryObservationSequence: 7,
    canaryObservations: [{
      id: "obs-save",
      transactionId: "tx-save",
      status: "committed",
      modelDrift: { denarii: 1, food: 2, population: 0, inventory: 3 },
    }],
    canaryCampaignHistory: [completedTrial("trial-save")],
  };
  const restored = normalizeEngineControl(JSON.parse(JSON.stringify(source)));

  assert.equal(restored.canaryObservationSequence, 7);
  assert.equal(restored.canaryObservations[0].id, "obs-save");
  assert.equal(restored.canaryCampaignHistory[0].id, "trial-save");
});

test("monitor exposes release readiness and transaction drift", () => {
  const control = {
    ...readyControl(),
    canaryCampaignHistory: [
      completedTrial("trial-1"),
      completedTrial("trial-2"),
      completedTrial("trial-3"),
    ],
    canaryTransactionHistory: [{
      id: "tx-visible",
      status: "committed",
      turn: 4,
      season: "winter",
      issues: [],
    }],
    canaryObservations: [{
      id: "obs-visible",
      transactionId: "tx-visible",
      status: "committed",
      applied: true,
      modelDrift: { denarii: 2, food: -1, population: 0, inventory: 3 },
      driftRatios: { denarii: 0.02, food: 0.04, population: 0, inventory: 0.03 },
      resourceShift: { denarii: 2, food: -1, population: 0, inventory: 3 },
    }],
  };
  const view = getEconomyMonitorViewModel({
    agentEconomy: {
      engineControl: control,
      households: [],
      marketPrices: {},
      metrics: {},
    },
  });

  assert.equal(view.releaseGate.ready, true);
  assert.equal(view.campaign.canStartExtended, true);
  assert.equal(view.transactions[0].modelDrift.denarii, 2);
  assert.equal(view.transactions[0].resourceShift.inventory, 3);
});
