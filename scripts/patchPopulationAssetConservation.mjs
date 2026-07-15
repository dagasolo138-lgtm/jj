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
  "src/engine/agentEconomy/householdUtils.js",
  `export function getHouseholdPopulation(households) {\n  return (households ?? []).reduce((total, household) =>\n    total + Math.max(0, Math.floor(household?.weight ?? 0)), 0);\n}\n`,
  `export function getHouseholdPopulation(households) {\n  return (households ?? []).reduce((total, household) =>\n    total + Math.max(0, Math.floor(household?.weight ?? 0)), 0);\n}\n\nfunction removeSeedAssets(household) {\n  return {\n    ...household,\n    cash: 0,\n    inventory: Object.fromEntries(HOUSEHOLD_COMMODITIES.map((commodity) => [commodity, 0])),\n  };\n}\n`,
  "add zero-asset migration helper",
);

replaceOnce(
  "src/engine/agentEconomy/householdUtils.js",
  `    return {\n      ...created,\n      enabled: sanitized.enabled,`,
  `    return {\n      ...created,\n      households: options.seedMigrationAssets === false\n        ? created.households.map(removeSeedAssets)\n        : created.households,\n      enabled: sanitized.enabled,`,
  "zero assets for population recovery reconciliation",
);

replaceOnce(
  "src/engine/agentEconomy/householdUtils.js",
  `      households.push(createHousehold({\n        id: \`hh-\${String(nextHouseholdId).padStart(6, "0")}\`,\n        index,\n        weight: 1,\n        createdTurn: options.createdTurn ?? 0,\n        origin: options.origin ?? "population-growth",\n      }));`,
  `      const createdHousehold = createHousehold({\n        id: \`hh-\${String(nextHouseholdId).padStart(6, "0")}\`,\n        index,\n        weight: 1,\n        createdTurn: options.createdTurn ?? 0,\n        origin: options.origin ?? "population-growth",\n      });\n      households.push(options.seedMigrationAssets === false\n        ? removeSeedAssets(createdHousehold)\n        : createdHousehold);`,
  "zero assets for added migration household",
);

replaceOnce(
  "src/engine/agentEconomy/liveStateAdapter.js",
  `  let reconciled = reconcileAgentEconomyPopulation(agentEconomy, targetPopulation, options);`,
  `  let reconciled = reconcileAgentEconomyPopulation(agentEconomy, targetPopulation, {\n    ...options,\n    seedMigrationAssets: false,\n  });`,
  "disable synthetic assets in live population adapter",
);

const testPath = "tests/unit/agentEconomyLiveStateAdapter.test.js";
let tests = fs.readFileSync(testPath, "utf8");
const marker = `test("victory and game-over fields are mirrored without taking authority", () => {`;
const addedTest = `test("population growth through the live adapter does not mint household assets", () => {\n  const legacyBefore = {\n    turn: 4,\n    season: "autumn",\n    denarii: 100,\n    population: 1,\n    inventory: { grain: 4, iron: 1 },\n    phase: "management",\n  };\n  const legacyAfter = { ...legacyBefore, population: 2, phase: "seasonal_resolve" };\n  const before = ensureLiveStateAdapter(createInitialAgentEconomy(1, {\n    estateInventory: legacyBefore.inventory,\n  }), legacyBefore);\n  const beforeCash = sumCash(before.households) + before.liveStateAdapter.unassignedAssets.cash;\n  const beforeInventory = getDistributedInventoryTotals(before.households);\n  const finalized = finalizeAgentQuarterLiveState(before, before, legacyAfter);\n  const afterCash = sumCash(finalized.households) + finalized.liveStateAdapter.unassignedAssets.cash;\n  const afterInventory = getDistributedInventoryTotals(finalized.households);\n  const migrant = finalized.households.at(-1);\n\n  assert.equal(getHouseholdPopulation(finalized.households), 2);\n  assert.equal(afterCash, beforeCash);\n  assert.equal(afterInventory.grain + (finalized.liveStateAdapter.unassignedAssets.inventory.grain ?? 0), beforeInventory.grain);\n  assert.equal(afterInventory.iron + (finalized.liveStateAdapter.unassignedAssets.inventory.iron ?? 0), beforeInventory.iron);\n  assert.equal(migrant.cash, 0);\n  assert.equal(Object.values(migrant.inventory).reduce((total, amount) => total + amount, 0), 0);\n});\n\n`;
if (!tests.includes(marker)) throw new Error("Missing live adapter test marker");
if (!tests.includes("population growth through the live adapter does not mint household assets")) {
  tests = tests.replace(marker, addedTest + marker);
  fs.writeFileSync(testPath, tests, "utf8");
}
