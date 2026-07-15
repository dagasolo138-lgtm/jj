import assert from "node:assert/strict";
import test from "node:test";

import {
  CANARY_CAMPAIGN_STATUS,
  CANARY_PILOT_STATUS,
  ENGINE_MODES,
  abortCanaryPilot,
  continueCanaryPilot,
  createInitialEngineControl,
  finalizeCanaryCampaignTransaction,
  getCanaryPilotReport,
  getCanaryReleaseGuardrails,
  normalizeEngineControl,
  recordEngineComparison,
  startCanaryCampaign,
  startCanaryPilot,
  synchronizeCanaryPilot,
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
  control = recordEngineComparison(control, safeComparison("pilot-eligibility"));
  return control;
}

function startPilot(control, turn = 1) {
  const campaignControl = startCanaryCampaign(control, { quarterLimit: 3, turn });
  return startCanaryPilot(campaignControl, campaignControl.canaryCampaign, turn);
}

function finishActiveCampaign(control, turn = 1) {
  let next = control;
  for (let index = 0; index < 3; index += 1) {
    next = finalizeCanaryCampaignTransaction(next, {
      id: `pilot-tx-${turn}-${index + 1}`,
      status: "committed",
      applied: true,
      issues: [],
    }, turn + index);
  }
  return synchronizeCanaryPilot(next);
}

function continuePilot(control, turn) {
  const campaignControl = startCanaryCampaign(control, { quarterLimit: 3, turn });
  return continueCanaryPilot(campaignControl, campaignControl.canaryCampaign, turn);
}

test("pilot starts one bounded three-quarter campaign", () => {
  const control = startPilot(readyControl(), 2);
  const report = getCanaryPilotReport(control);

  assert.equal(control.activeMode, ENGINE_MODES.CANARY);
  assert.equal(control.writeBackEnabled, true);
  assert.equal(control.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.RUNNING);
  assert.equal(control.canaryCampaign.quarterLimit, 3);
  assert.equal(report.status, CANARY_PILOT_STATUS.RUNNING);
  assert.equal(report.attemptedCampaigns, 1);
  assert.equal(report.completedCampaigns, 0);
  assert.equal(report.totalPlannedQuarters, 9);
});

test("completed pilot campaign pauses in shadow mode for operator review", () => {
  const started = startPilot(readyControl(), 2);
  const paused = finishActiveCampaign(started, 2);
  const report = getCanaryPilotReport(paused);
  const repeated = synchronizeCanaryPilot(paused);

  assert.equal(paused.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(paused.writeBackEnabled, false);
  assert.equal(report.status, CANARY_PILOT_STATUS.AWAITING_REVIEW);
  assert.equal(report.completedCampaigns, 1);
  assert.equal(report.committedQuarters, 3);
  assert.equal(report.canContinue, true);
  assert.equal(getCanaryPilotReport(repeated).completedCampaigns, 1);
});

test("three reviewed campaigns complete the pilot and unlock the release gate", () => {
  let control = startPilot(readyControl(), 1);
  control = finishActiveCampaign(control, 1);
  control = continuePilot(control, 5);
  control = finishActiveCampaign(control, 5);
  control = continuePilot(control, 9);
  control = finishActiveCampaign(control, 9);

  const report = getCanaryPilotReport(control);
  const gate = getCanaryReleaseGuardrails(control);

  assert.equal(report.status, CANARY_PILOT_STATUS.COMPLETED);
  assert.equal(report.completedCampaigns, 3);
  assert.equal(report.attemptedCampaigns, 3);
  assert.equal(report.committedQuarters, 9);
  assert.equal(report.rollbackCount, 0);
  assert.equal(control.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(control.writeBackEnabled, false);
  assert.equal(gate.ready, true);
});

test("a rolled-back campaign aborts the pilot and leaves the write gate closed", () => {
  let control = startPilot(readyControl(), 1);
  control = finalizeCanaryCampaignTransaction(control, {
    id: "pilot-rollback",
    status: "rolled-back",
    applied: false,
    issues: ["invalid-denarii"],
  }, 2);
  control = synchronizeCanaryPilot(control);
  const report = getCanaryPilotReport(control);

  assert.equal(report.status, CANARY_PILOT_STATUS.ABORTED);
  assert.equal(report.lastStopReason, "invalid-denarii");
  assert.equal(report.rollbackCount, 1);
  assert.equal(control.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(control.writeBackEnabled, false);
});

test("manual pilot stop is persistent and cannot continue", () => {
  const started = startPilot(readyControl(), 1);
  const stopped = abortCanaryPilot(started, "operator-pilot-stop", 2);
  const restored = normalizeEngineControl(JSON.parse(JSON.stringify(stopped)));
  const report = getCanaryPilotReport(restored);

  assert.equal(report.status, CANARY_PILOT_STATUS.ABORTED);
  assert.equal(report.lastStopReason, "operator-pilot-stop");
  assert.equal(report.canContinue, false);
});

test("reducer exposes explicit start and emergency-stop pilot actions", () => {
  const startedGame = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const readyState = {
    ...startedGame,
    agentEconomy: {
      ...startedGame.agentEconomy,
      engineControl: readyControl(),
    },
  };
  const running = gameReducer(readyState, {
    type: "AGENT_ECONOMY_START_CANARY_PILOT",
  });

  assert.equal(running.agentEconomy.engineControl.canaryPilot.status, CANARY_PILOT_STATUS.RUNNING);
  assert.equal(running.agentEconomy.enabled, true);
  assert.equal(running.agentEconomy.shadowMode, false);

  const stopped = gameReducer(running, {
    type: "AGENT_ECONOMY_STOP_CANARY_PILOT",
    payload: { reason: "pilot-test-stop" },
  });

  assert.equal(stopped.agentEconomy.engineControl.canaryPilot.status, CANARY_PILOT_STATUS.ABORTED);
  assert.equal(stopped.agentEconomy.engineControl.writeBackEnabled, false);
  assert.equal(stopped.agentEconomy.enabled, false);
  assert.equal(stopped.agentEconomy.shadowMode, true);
});

test("monitor selector reports pilot progress without exposing automatic continuation", () => {
  const paused = finishActiveCampaign(startPilot(readyControl(), 1), 1);
  const state = {
    ...initialState,
    agentEconomy: {
      ...initialState.agentEconomy,
      engineControl: paused,
    },
  };
  const view = getEconomyMonitorViewModel(state);

  assert.equal(view.pilot.status, CANARY_PILOT_STATUS.AWAITING_REVIEW);
  assert.equal(view.pilot.completedCampaigns, 1);
  assert.equal(view.pilot.committedQuarters, 3);
  assert.equal(view.pilot.canContinue, true);
  assert.equal(view.pilot.running, false);
  assert.equal(view.mode.writeBackEnabled, false);
});
