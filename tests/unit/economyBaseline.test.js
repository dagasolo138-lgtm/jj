import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ECONOMY_BASELINE_SCENARIOS,
  runAllEconomyBaselines,
  runEconomyScenario,
} from "../baselines/economyScenarios.js";

const baselineUrl = new URL("../baselines/economy-v1.json", import.meta.url);

async function readBaseline() {
  const contents = await readFile(baselineUrl, "utf8");
  return JSON.parse(contents);
}

test("legacy economy scenarios are deterministic with fixed seeds", () => {
  for (const scenario of ECONOMY_BASELINE_SCENARIOS) {
    const first = runEconomyScenario(scenario, 40);
    const second = runEconomyScenario(scenario, 40);
    assert.deepStrictEqual(second, first, `${scenario.id} changed between identical seeded runs`);
  }
});

test("legacy economy output matches the frozen v1 baseline", async () => {
  const baseline = await readBaseline();

  assert.equal(baseline.schemaVersion, 1);
  assert.equal(baseline.engine, "legacy-seasonal-economy");
  assert.equal(baseline.turnsPerScenario, 40);
  assert.deepStrictEqual(runAllEconomyBaselines(40), baseline.scenarios);
});

test("baseline covers the five migration risk profiles", () => {
  assert.deepStrictEqual(
    ECONOMY_BASELINE_SCENARIOS.map(({ id }) => id),
    [
      "balanced_agriculture",
      "crushing_tax",
      "military_overload",
      "food_shortage",
      "damaged_estate",
    ],
  );
});
