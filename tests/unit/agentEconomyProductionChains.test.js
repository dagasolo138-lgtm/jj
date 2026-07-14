import assert from "node:assert/strict";
import test from "node:test";

import { initialState as legacyInitialState } from "../../src/engine/gameReducer.js";
import {
  allocateBuildingWorkforce,
  createHousehold,
  createInitialAgentEconomy,
  generateHouseholdOrderIntents,
  runBuildingProduction,
  simulateAgentQuarter,
  validateHouseholds,
} from "../../src/engine/agentEconomy/index.js";

function household(id, occupation, inventory = {}) {
  const created = createHousehold({ id, occupation, weight: 1 });
  return {
    ...created,
    inventory: {
      ...created.inventory,
      grain: 0,
      ...inventory,
    },
  };
}

function building(type, condition = 100, suffix = "test") {
  return {
    instanceId: `${type}-${suffix}`,
    type,
    condition,
  };
}

test("matching households are assigned to building workplaces", () => {
  const households = [
    household("farmer", "farmer"),
    household("artisan", "artisan"),
  ];
  const result = allocateBuildingWorkforce(
    households,
    [building("strip_farm")],
    { construction: 0 },
  );

  assert.equal(result.summary.requiredWorkers, 1);
  assert.equal(result.summary.assignedWorkers, 1);
  assert.equal(result.buildingWorkforce[0].status, "staffed");
  const farmer = result.households.find((item) => item.id === "farmer");
  assert.equal(farmer.workplaceId, "strip_farm-test");
  assert.equal(farmer.assignedWorkers, 1);
  assert.equal(farmer.employmentRatio, 1);
});

test("a building without the required occupation stays idle", () => {
  const result = runBuildingProduction(
    [household("artisan", "artisan")],
    [building("strip_farm")],
    { season: "spring", laborAllocation: { construction: 0 } },
  );

  assert.equal(result.totalProduced, 0);
  assert.equal(result.metrics.idleBuildingDays, 1);
  assert.equal(result.buildingReports[0].status, "no-workers");
  assert.equal(result.workforce.shortagesByOccupation.farmer, 1);
});

test("staffed farms produce and ruined farms do not", () => {
  const workers = [household("farmer", "farmer")];
  const working = runBuildingProduction(
    workers,
    [building("strip_farm", 100)],
    { season: "spring", laborAllocation: { construction: 0 } },
  );
  const ruined = runBuildingProduction(
    workers,
    [building("strip_farm", 10)],
    { season: "spring", laborAllocation: { construction: 0 } },
  );

  assert.ok(working.produced.grain > 0);
  assert.equal(ruined.totalProduced, 0);
  assert.equal(ruined.buildingReports[0].status, "ruined");
});

test("converter buildings consume inputs and produce outputs", () => {
  const artisan = household("miller", "artisan", { grain: 10 });
  const result = runBuildingProduction(
    [artisan],
    [building("mill")],
    { season: "spring", laborAllocation: { construction: 0 } },
  );
  const nextArtisan = result.households[0];

  assert.ok(result.consumed.grain > 0);
  assert.ok(result.produced.flour > 0);
  assert.ok(nextArtisan.inventory.grain < 10);
  assert.ok(nextArtisan.inventory.flour > 0);
});

test("missing converter inputs create production needs and market buy orders", () => {
  const result = runBuildingProduction(
    [household("miller", "artisan")],
    [building("mill")],
    { season: "spring", laborAllocation: { construction: 0 } },
  );
  const nextArtisan = result.households[0];
  const orders = generateHouseholdOrderIntents(nextArtisan ? [nextArtisan] : [], { day: 1 });
  const grainOrder = orders.find((order) =>
    order.side === "buy" && order.commodity === "grain" && order.reason.includes("production-input"));

  assert.equal(result.totalProduced, 0);
  assert.equal(result.metrics.inputShortageEvents, 1);
  assert.equal(result.buildingReports[0].status, "input-shortage");
  assert.ok(nextArtisan.productionNeeds.grain > 0);
  assert.ok(grainOrder);
  assert.ok(grainOrder.quantity >= 1);
});

test("shadow sawmills and tanneries form real input chains", () => {
  const woodsman = household("woodsman", "woodsman", { timber: 8 });
  const artisan = household("tanner", "artisan", { livestock: 5 });
  const result = runBuildingProduction(
    [woodsman, artisan],
    [building("sawmill"), building("tannery")],
    { season: "spring", laborAllocation: { construction: 0 } },
  );

  assert.ok(result.consumed.timber > 0);
  assert.ok(result.consumed.livestock > 0);
  assert.ok(result.produced.wood > 0);
  assert.ok(result.produced.leather > 0);
});

test("understaffing reduces output without inventing workers", () => {
  const oneArtisan = [household("artisan-one", "artisan", { iron: 10, coal: 10 })];
  const twoArtisans = [
    household("artisan-one", "artisan", { iron: 10, coal: 10 }),
    household("artisan-two", "artisan", { iron: 10, coal: 10 }),
  ];
  const under = runBuildingProduction(
    oneArtisan,
    [building("smelter")],
    { season: "spring", laborAllocation: { construction: 0 } },
  );
  const full = runBuildingProduction(
    twoArtisans,
    [building("smelter")],
    { season: "spring", laborAllocation: { construction: 0 } },
  );

  assert.equal(under.buildingReports[0].status, "understaffed");
  assert.equal(under.workforce.assignedWorkers, 1);
  assert.equal(full.workforce.assignedWorkers, 2);
  assert.ok(full.produced.steel > under.produced.steel);
});

test("construction allocation reduces workers available to the estate", () => {
  const households = [
    household("farmer-one", "farmer"),
    household("farmer-two", "farmer"),
  ];
  const result = allocateBuildingWorkforce(
    households,
    [building("demesne_field")],
    { construction: 50 },
  );

  assert.equal(result.summary.economicWorkerCapacity, 1);
  assert.equal(result.summary.requiredWorkers, 2);
  assert.equal(result.summary.assignedWorkers, 1);
  assert.equal(result.buildingWorkforce[0].status, "understaffed");
});

test("an empty estate cannot produce through occupation-only fallback", () => {
  const initial = createInitialAgentEconomy(10, { seed: "empty-estate" });
  const result = simulateAgentQuarter(initial, {
    days: 1,
    season: "spring",
    taxRate: "medium",
    buildings: [],
    laborAllocation: { construction: 0 },
  });

  assert.equal(result.lastDailySummary.totalProduced, 0);
  assert.equal(result.metrics.goodsProduced, 0);
});

test("40 building-driven quarters remain finite and population-safe", () => {
  let state = createInitialAgentEconomy(legacyInitialState.population, { seed: "step-6-stress" });

  for (let turn = 1; turn <= 40; turn += 1) {
    state = simulateAgentQuarter(state, {
      turn,
      season: ["spring", "summer", "autumn", "winter"][(turn - 1) % 4],
      taxRate: legacyInitialState.taxRate,
      buildings: legacyInitialState.buildings,
      laborAllocation: legacyInitialState.laborAllocation,
    });
  }

  const validation = validateHouseholds(state.households, legacyInitialState.population);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(state.day, 1200);
  assert.equal(state.metrics.quartersSimulated, 40);
  assert.ok(state.metrics.workerDaysRequired > 0);
  assert.ok(state.metrics.workerDaysAssigned > 0);
  assert.ok(state.metrics.goodsProduced > 0);
  assert.ok(state.metrics.inputShortageEvents > 0);
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
});
