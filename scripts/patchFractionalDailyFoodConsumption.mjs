import fs from "node:fs";

function replaceOnce(path, search, replacement, label) {
  const source = fs.readFileSync(path, "utf8");
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Ambiguous patch anchor: ${label}`);
  }
  fs.writeFileSync(path, source.replace(search, replacement), "utf8");
}

replaceOnce(
  "src/engine/agentEconomy/consumptionSystem.js",
  `import { clampNeed, normalizeNeeds } from "./needsSystem.js";\nimport { stochasticRound } from "./seededRng.js";`,
  `import { clampNeed, normalizeNeeds } from "./needsSystem.js";`,
  "remove stochastic food rounding import",
);

replaceOnce(
  "src/engine/agentEconomy/consumptionSystem.js",
  `  const requested = Math.max(0, Math.floor(Number(requestedQuantity) || 0));\n  const consumed = Math.min(Math.floor(available), requested);`,
  `  const requested = inventoryQuantity(requestedQuantity);\n  const consumed = inventoryQuantity(Math.min(available, requested));`,
  "consume fractional inventory quantities",
);

replaceOnce(
  "src/engine/agentEconomy/consumptionSystem.js",
  `export function consumeHousehold(household, rng, context = {}) {\n  const weight = Math.max(1, Math.floor(household.weight ?? 1));\n  const seasonalMultiplier = SEASON_CONSUMPTION_MULTIPLIERS[context.season] ?? 1;\n  const targetFood = stochasticRound(\n    weight * DAILY_FOOD_TARGET_PER_PERSON * seasonalMultiplier,\n    rng,\n  );`,
  `export function consumeHousehold(household, _rng, context = {}) {\n  const weight = Math.max(1, Math.floor(household.weight ?? 1));\n  const seasonalMultiplier = SEASON_CONSUMPTION_MULTIPLIERS[context.season] ?? 1;\n  const targetFood = inventoryQuantity(\n    weight * DAILY_FOOD_TARGET_PER_PERSON * seasonalMultiplier,\n  );`,
  "replace stochastic daily target with exact fractional target",
);

const testPath = "tests/unit/agentEconomyConsumption.test.js";
fs.writeFileSync(testPath, `import assert from "node:assert/strict";\nimport test from "node:test";\n\nimport {\n  consumeHousehold,\n  createHousehold,\n} from "../../src/engine/agentEconomy/index.js";\n\nconst unusedRng = { next: () => 0 };\n\nfunction householdWithGrain(grain) {\n  const household = createHousehold({ id: \`grain-\${grain}\`, weight: 1, occupation: "farmer" });\n  return {\n    ...household,\n    inventory: {\n      ...household.inventory,\n      flour: 0,\n      fish: 0,\n      grain,\n      livestock: 0,\n    },\n  };\n}\n\ntest("food consumption uses the exact fractional daily target", () => {\n  const result = consumeHousehold(householdWithGrain(0.75), unusedRng, { day: 1 });\n\n  assert.equal(result.targetFood, 0.0683);\n  assert.equal(result.consumedFood, 0.0683);\n  assert.equal(result.unmetFood, 0);\n  assert.equal(result.household.inventory.grain, 0.6817);\n  assert.equal(result.totalConsumed, 0.0683);\n});\n\ntest("food consumption records a fractional shortfall without losing inventory", () => {\n  const result = consumeHousehold(householdWithGrain(0.05), unusedRng, { day: 1 });\n\n  assert.equal(result.targetFood, 0.0683);\n  assert.equal(result.consumedFood, 0.05);\n  assert.equal(result.unmetFood, 0.0183);\n  assert.equal(result.household.inventory.grain, 0);\n  assert.equal(result.totalConsumed, 0.05);\n});\n`, "utf8");
