import assert from "node:assert/strict";
import test from "node:test";

import {
  CANARY_CAMPAIGN_STATUS,
  createInitialEngineControl,
  finalizeCanaryCampaignTransaction,
  normalizeCanaryCampaign,
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
  return recordEngineComparison(control, safeComparison("ready"));
}

test("old saves without campaign data normalize to an idle closed campaign", () => {
  const legacyControl = normalizeEngineControl(JSON.parse(JSON.stringify(readyControl())));
  const campaign = normalizeCanaryCampaign(legacyControl.canaryCampaign);

  assert.equal(campaign.status, CANARY_CAMPAIGN_STATUS.IDLE);
  assert.equal(campaign.quarterLimit, 3);
  assert.equal(legacyControl.writeBackEnabled, false);
});

test("a running campaign survives JSON save and resumes its exact quarter count", () => {
  let control = startCanaryCampaign(readyControl(), { quarterLimit: 3, turn: 5 });
  control = finalizeCanaryCampaignTransaction(control, {
    id: "persist-1",
    status: "committed",
    applied: true,
    issues: [],
  }, 5);

  const restored = normalizeEngineControl(JSON.parse(JSON.stringify(control)));
  const campaign = normalizeCanaryCampaign(restored.canaryCampaign);

  assert.equal(campaign.status, CANARY_CAMPAIGN_STATUS.RUNNING);
  assert.equal(campaign.quarterLimit, 3);
  assert.equal(campaign.attemptedQuarters, 1);
  assert.equal(campaign.committedQuarters, 1);
  assert.equal(campaign.lastTransactionId, "persist-1");
  assert.equal(restored.writeBackEnabled, true);
});

test("a restored campaign still closes exactly at its configured limit", () => {
  let control = startCanaryCampaign(readyControl(), { quarterLimit: 3, turn: 5 });
  control = finalizeCanaryCampaignTransaction(control, {
    id: "persist-1",
    status: "committed",
    applied: true,
    issues: [],
  }, 5);
  control = normalizeEngineControl(JSON.parse(JSON.stringify(control)));

  for (let index = 2; index <= 3; index += 1) {
    control = finalizeCanaryCampaignTransaction(control, {
      id: `persist-${index}`,
      status: "committed",
      applied: true,
      issues: [],
    }, 4 + index);
  }

  const campaign = normalizeCanaryCampaign(control.canaryCampaign);
  assert.equal(campaign.status, CANARY_CAMPAIGN_STATUS.COMPLETED);
  assert.equal(campaign.attemptedQuarters, 3);
  assert.equal(campaign.committedQuarters, 3);
  assert.equal(control.writeBackEnabled, false);
  assert.equal(control.authority, "legacy");
  assert.ok(control.promotionBlockers.includes("candidate-write-disabled"));
});
