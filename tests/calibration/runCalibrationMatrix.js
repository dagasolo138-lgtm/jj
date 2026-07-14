import fs from "node:fs";
import path from "node:path";

import {
  CALIBRATION_BASE_SEED,
  CALIBRATION_QUARTERS,
  CALIBRATION_SEED_COUNT,
} from "./calibrationConfig.js";
import { runCalibrationMatrix } from "./calibrationHarness.js";

function numberFlag(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((item) => item.startsWith(prefix));
  const value = argument ? argument.slice(prefix.length) : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function stringFlag(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((item) => item.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

const seedCount = Math.floor(numberFlag("seeds", CALIBRATION_SEED_COUNT));
const quarters = Math.floor(numberFlag("quarters", CALIBRATION_QUARTERS));
const baseSeed = stringFlag("base-seed", CALIBRATION_BASE_SEED);
const output = stringFlag(
  "output",
  process.env.CALIBRATION_REPORT_PATH || "artifacts/agent-economy-calibration-report.json",
);
const strictHard = process.argv.includes("--strict-hard") || process.env.CALIBRATION_STRICT_HARD === "1";
const strictTargets = process.argv.includes("--strict-targets") || process.env.CALIBRATION_STRICT_TARGETS === "1";

const report = runCalibrationMatrix({ seedCount, quarters, baseSeed });
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `Calibration matrix: ${report.configuration.scenarioCount} scenarios × `
    + `${report.configuration.seedCount} seeds × ${report.configuration.quartersPerScenario} quarters.`,
);
console.log(`Simulated ${report.configuration.totalDaySimulations.toLocaleString()} economic days.`);
console.log(`Hard status: ${report.hardStatus}. Calibration status: ${report.calibrationStatus}.`);
console.log(`Target misses: ${report.targetMissCount}. Directional status: ${report.directionalStatus}.`);

for (const scenario of report.scenarios) {
  const observed = scenario.evaluation.observed;
  const misses = scenario.evaluation.calibrationChecks.filter((item) => item.status === "fail").length;
  console.log(
    `${scenario.id}: hard=${scenario.evaluation.hardStatus}; target=${scenario.evaluation.calibrationStatus}; `
      + `food=${observed.foodFulfillmentRate}%; employment=${observed.employmentRate}%; `
      + `idle=${observed.idleBuildingRate}%; trades/day=${observed.tradesPerDay}; misses=${misses}`,
  );
}

console.log(`Report: ${output}`);

if (strictHard && report.hardStatus !== "pass") process.exitCode = 1;
if (strictTargets && report.calibrationStatus !== "meets-target") process.exitCode = 2;
