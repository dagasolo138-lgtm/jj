import assert from "node:assert/strict";
import test from "node:test";

import {
  CANARY_CAMPAIGN_STATUS,
  createInitialEngineControl,
  getCanaryCampaignBlockers,
  getCanaryReleaseGuardrails,
  normalizeEngineControl,
  recordEngineComparison,
  startCanaryCampaign,
} from "../../src/engine/agentEconomy/index.js";

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
  control = recordEngineComparison(control, safeComparison("release-regression"));
  return control;
}

test("release evidence never blocks another standard three-quarter observation", () => {
  const control = readyControl();

  assert.deepEqual(getCanaryCampaignBlockers(control, { quarterLimit: 3 }), []);
  assert.ok(getCanaryCampaignBlockers(control, { quarterLimit: 4 }).length > 0);

  const standard = startCanaryCampaign(control, { quarterLimit: 3, turn: 2 });
  assert.equal(standard.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.RUNNING);
  assert.equal(standard.canaryCampaign.quarterLimit, 3);
});

test("old saves without observation evidence remain closed to extension", () => {
  const restored = normalizeEngineControl(JSON.parse(JSON.stringify(readyControl())));
  const gate = getCanaryReleaseGuardrails(restored);
  const extended = startCanaryCampaign(restored, { quarterLimit: 4, turn: 2 });

  assert.equal(gate.ready, false);
  assert.equal(gate.completedStandardTrials, 0);
  assert.equal(extended.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.BLOCKED);
  assert.equal(extended.writeBackEnabled, false);
});
