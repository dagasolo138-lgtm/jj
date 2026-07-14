import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_RUNTIME_GATE_MS_PER_QUARTER,
  STRESS_QUARTERS,
  STRESS_SEED_COUNT,
  runAgentEconomyStress,
} from "./agentEconomyStressHarness.js";

function readNumberFlag(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((item) => item.startsWith(prefix));
  const raw = argument ? argument.slice(prefix.length) : process.env[name.toUpperCase().replaceAll("-", "_")];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readStringFlag(name, fallback) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((item) => item.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
}

const seedCount = Math.floor(readNumberFlag("seeds", STRESS_SEED_COUNT));
const quarters = Math.floor(readNumberFlag("quarters", STRESS_QUARTERS));
const runtimeGateMsPerQuarter = readNumberFlag(
  "runtime-gate-ms-per-quarter",
  DEFAULT_RUNTIME_GATE_MS_PER_QUARTER,
);
const outputPath = readStringFlag(
  "output",
  process.env.STRESS_REPORT_PATH || "artifacts/agent-economy-stress-report.json",
);
const baseSeed = readStringFlag("base-seed", "agent-economy-step-9");
const strict = process.argv.includes("--strict") || process.env.STRESS_STRICT === "1";
const failOnBalance = process.argv.includes("--fail-on-balance")
  || process.env.STRESS_FAIL_ON_BALANCE === "1";

const report = runAgentEconomyStress({
  seedCount,
  quarters,
  runtimeGateMsPerQuarter,
  baseSeed,
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

const { summary, configuration } = report;
console.log(`Agent economy stress: ${configuration.seedCount} seeds × ${configuration.quartersPerSeed} quarters`);
console.log(`Simulated ${configuration.totalDaySimulations.toLocaleString()} economic days.`);
console.log(`Hard-invariant status: ${summary.status}; completion ${summary.completionRate}%.`);
console.log(`Economic survival: ${summary.economicSurvivalRate}%; balance: ${summary.balanceStatus}.`);
console.log(`Runtime p95: ${summary.runtime.p95QuarterMs} ms/quarter; max ${summary.runtime.maxQuarterMs} ms/quarter.`);
console.log(`Report: ${outputPath}`);

if (summary.criticalFindings.length > 0) {
  console.error(`Critical findings: ${summary.criticalFindings.join(" | ")}`);
}
if (summary.balanceFindings.length > 0) {
  console.warn(`Balance findings: ${summary.balanceFindings.join(" | ")}`);
}

if (strict && summary.status !== "pass") process.exitCode = 1;
if (failOnBalance && summary.balanceStatus !== "stable") process.exitCode = 2;
