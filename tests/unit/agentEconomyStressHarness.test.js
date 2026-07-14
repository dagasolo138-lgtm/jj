import assert from "node:assert/strict";
import test from "node:test";

import {
  generateStressSeeds,
  runAgentEconomyStress,
  runStressSeed,
  summarizeStressRuns,
} from "../stress/agentEconomyStressHarness.js";

function stableRunShape(run) {
  const { durationMs: _durationMs, averageQuarterMs: _averageQuarterMs, ...stable } = run;
  return stable;
}

test("stress seed generation is deterministic and unique", () => {
  const first = generateStressSeeds(100, "step-9-seeds");
  const second = generateStressSeeds(100, "step-9-seeds");

  assert.deepEqual(first, second);
  assert.equal(first.length, 100);
  assert.equal(new Set(first).size, 100);
  assert.ok(first.every((seed) => Number.isInteger(seed) && seed > 0));
});

test("the same stress seed produces the same economic result", () => {
  const first = runStressSeed(123456789, { quarters: 4 });
  const second = runStressSeed(123456789, { quarters: 4 });

  assert.deepEqual(stableRunShape(first), stableRunShape(second));
  assert.equal(first.completed, true, first.criticalIssues?.join("\n"));
  assert.equal(first.day, 120);
  assert.equal(first.quarters, 4);
  assert.equal(first.accounting.cashAccountingError, 0);
  assert.ok(Math.abs(first.accounting.inventoryAccountingError) <= 0.1);
});

test("calibrated default estate remains below the chronic shortage threshold", () => {
  const run = runStressSeed(3193591166, { quarters: 40 });

  assert.equal(run.completed, true, run.criticalIssues?.join("\n"));
  assert.ok(run.production.shortageEventRate <= 35);
  assert.equal(run.balance.chronicInputShortages, false);
  assert.equal(run.balance.economicCollapse, false);
});

test("small multi-seed scan reports hard invariants separately from balance", () => {
  const report = runAgentEconomyStress({
    seeds: [101, 202, 303],
    quarters: 4,
    runtimeGateMsPerQuarter: 1000,
  });

  assert.equal(report.configuration.seedCount, 3);
  assert.equal(report.configuration.totalQuarterSimulations, 12);
  assert.equal(report.configuration.totalDaySimulations, 360);
  assert.equal(report.summary.status, "pass", report.summary.criticalFindings.join("\n"));
  assert.equal(report.summary.completionRate, 100);
  assert.equal(report.summary.gameplayWinRate, null);
  assert.match(report.summary.gameplayWinRateReason, /No autonomous player strategy/);
  assert.equal(report.runs.length, 3);
  assert.ok(report.runs.every((run) => run.completed));
});

test("summary fails hard when a seed violates invariants", () => {
  const summary = summarizeStressRuns([
    {
      seed: 1,
      completed: false,
      durationMs: 5,
      averageQuarterMs: 1,
      criticalIssues: ["population:19/20"],
    },
    {
      seed: 2,
      completed: true,
      durationMs: 5,
      averageQuarterMs: 1,
      householdStats: {},
      production: {},
      market: {},
      balance: {},
      metrics: {},
      wealthGini: 0,
    },
  ], { runtimeGateMsPerQuarter: 1000 });

  assert.equal(summary.status, "fail");
  assert.equal(summary.failedRuns, 1);
  assert.equal(summary.completionRate, 50);
  assert.match(summary.criticalFindings[0], /failed hard invariants/);
});
