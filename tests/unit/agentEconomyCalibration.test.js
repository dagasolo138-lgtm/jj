import assert from "node:assert/strict";
import test from "node:test";

import {
  CALIBRATION_SCENARIOS,
  CALIBRATION_VERSION,
  DEFAULT_CALIBRATION_TARGET,
  getCalibrationScenario,
} from "../calibration/calibrationConfig.js";
import {
  evaluateScenarioSummary,
  runCalibrationMatrix,
} from "../calibration/calibrationHarness.js";

function passingSummary() {
  return {
    completionRate: 100,
    economicSurvivalRate: 98,
    runtime: { maxQuarterMs: 10 },
    rates: {
      invariantFailure: 0,
      extremeInflation: 0,
      priceCrash: 0,
    },
    averages: {
      foodFulfillmentRate: 99,
      employmentRate: 70,
      idleBuildingRate: 20,
      shortageEventRate: 25,
      tradesPerDay: 0.3,
      trades: 100,
      failedOrders: 500,
      povertyRate: 10,
      health: 75,
      satisfaction: 55,
    },
    priceByCommodity: {
      grain: { minRatio: 0.8, maxRatio: 1.3 },
      livestock: { minRatio: 0.7, maxRatio: 1.8 },
    },
  };
}

test("calibration configuration defines seven unique fixed scenarios", () => {
  assert.equal(CALIBRATION_VERSION, 2);
  assert.equal(CALIBRATION_SCENARIOS.length, 7);
  assert.equal(new Set(CALIBRATION_SCENARIOS.map((scenario) => scenario.id)).size, 7);
  assert.ok(CALIBRATION_SCENARIOS.every((scenario) => scenario.population > 0));
  assert.ok(CALIBRATION_SCENARIOS.every((scenario) => scenario.buildings.length > 0));
  assert.ok(CALIBRATION_SCENARIOS.every((scenario) => scenario.target.foodFulfillmentRateMin > 0));
  assert.ok(getCalibrationScenario("default-estate"));
  assert.equal(getCalibrationScenario("missing"), null);
});

test("default targets encode the calibrated healthy economy band", () => {
  assert.equal(DEFAULT_CALIBRATION_TARGET.economicSurvivalRateMin, 95);
  assert.equal(DEFAULT_CALIBRATION_TARGET.foodFulfillmentRateMin, 85);
  assert.equal(DEFAULT_CALIBRATION_TARGET.foodFulfillmentRateMax, 100);
  assert.equal(DEFAULT_CALIBRATION_TARGET.employmentRateMin, 60);
  assert.equal(DEFAULT_CALIBRATION_TARGET.employmentRateMax, 85);
  assert.equal(DEFAULT_CALIBRATION_TARGET.idleBuildingRateMax, 25);
  assert.equal(DEFAULT_CALIBRATION_TARGET.inputShortageRateMax, 35);
  assert.equal(DEFAULT_CALIBRATION_TARGET.extremeInflationSeedRateMax, 5);
  assert.equal(DEFAULT_CALIBRATION_TARGET.commodityPriceRatioMin, 0.6);
  assert.equal(DEFAULT_CALIBRATION_TARGET.commodityPriceRatioMax, 2);
});

test("broken supply chain starts without upstream raw material stock", () => {
  const broken = getCalibrationScenario("broken-supply-chain");
  assert.equal(broken.estateInventory.timber, 0);
  assert.equal(broken.estateInventory.iron, 0);
  assert.equal(broken.estateInventory.coal, 0);
});

test("hard gates are evaluated separately from economic targets", () => {
  const summary = passingSummary();
  summary.averages.foodFulfillmentRate = 20;

  const evaluation = evaluateScenarioSummary(summary, DEFAULT_CALIBRATION_TARGET);

  assert.equal(evaluation.hardStatus, "pass");
  assert.equal(evaluation.calibrationStatus, "needs-calibration");
  assert.ok(evaluation.calibrationChecks.some(
    (item) => item.id === "food-fulfillment-rate-minimum" && item.status === "fail",
  ));
});

test("a healthy synthetic economy meets every default target", () => {
  const evaluation = evaluateScenarioSummary(passingSummary(), DEFAULT_CALIBRATION_TARGET);

  assert.equal(evaluation.hardStatus, "pass");
  assert.equal(evaluation.calibrationStatus, "meets-target");
  assert.ok(evaluation.hardChecks.every((item) => item.status === "pass"));
  assert.ok(evaluation.calibrationChecks.every((item) => item.status === "pass"));
});

test("small calibration matrix runs every scenario on shared deterministic seeds", () => {
  const report = runCalibrationMatrix({ seedCount: 2, quarters: 2, baseSeed: "calibration-unit" });

  assert.equal(report.configuration.scenarioCount, 7);
  assert.equal(report.configuration.seedCount, 2);
  assert.equal(report.configuration.totalQuarterSimulations, 28);
  assert.equal(report.configuration.totalDaySimulations, 840);
  assert.equal(report.scenarios.length, 7);
  assert.equal(report.hardStatus, "pass");
  assert.ok(["meets-target", "needs-calibration"].includes(report.calibrationStatus));
  assert.equal(report.directionalChecks.length, 6);
  assert.ok(report.scenarios.every((scenario) => scenario.evaluation.hardStatus === "pass"));
});
