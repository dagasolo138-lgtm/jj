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

function household(id, occupation, overrides = {}) {
  const created = createHousehold({ id, occupation, weight: 1 });
  return {
    ...created,
    ...overrides,
    inventory: {
      ...created.inventory,
      ...(overrides.inventory ?? {}),
    },
    needs: {
      ...created.needs,
      ...(overrides.needs ?? {}),
    },
    priceBeliefs: {
      ...created.priceBeliefs,
      ...(overrides.priceBeliefs ?? {}),
    },
  };
}

function building(type, suffix = "test") {
  return {
    instanceId: `${type}-${suffix}`,
    type,
    condition: 100,
  };
}

test("matching households are assigned to building workplaces", () => {
  const households = [
    household("farmer-one", "farmer"),
    household("artisan-one", "artisan"),
  ];
  const result = allocateBuildingWorkforce(
    households,
    [building("strip_farm"), building("tannery")],
    { construction: 0 },
  );

  assert.equal(result.buildingWorkforce[0].assignedWorkers, 1);
  assert.equal(result.buildingWorkforce[1].assignedWorkers, 1);
  assert.equal(result.summary.assignedWorkers, 2);
  assert.equal(result.households.find((item) => item.id === "farmer-one").workplaceId, "strip_farm-test");
  assert.equal(result.households.find((item) => item.id === "artisan-one").workplaceId, "tannery-test");
});

test("a building without the required occupation stays idle", () => {
  const result = runBuildingProduction(
    [household("laborer-one", "laborer")],
    [building("strip_farm")],
    { season: "summer", laborAllocation: { construction: 0 } },
  );

  assert.equal(result.buildingReports[0].status, "no-workers");
  assert.equal(result.produced.grain ?? 0, 0);
  assert.equal(result.metrics.idleBuildingDays, 1);
});

test("staffed farms produce and ruined farms do not", () => {
  const worker = household("farmer-one", "farmer", { health: 90, satisfaction: 70 });
  const active = runBuildingProduction(
    [worker],
    [building("strip_farm", "active")],
    { season: "summer", laborAllocation: { construction: 0 } },
  );
  const ruined = runBuildingProduction(
    [worker],
    [{ ...building("strip_farm", "ruined"), condition: 10 }],
    { season: "summer", laborAllocation: { construction: 0 } },
  );

  assert.ok(active.produced.grain > 0);
  assert.equal(ruined.produced.grain ?? 0, 0);
  assert.equal(ruined.buildingReports[0].status, "ruined");
});

test("converter buildings consume inputs and produce outputs", () => {
  const artisan = household("artisan-one", "artisan", {
    inventory: { coal: 20, iron: 20 },
    health: 95,
    satisfaction: 75,
  });
  const result = runBuildingProduction(
    [artisan],
    [building("smelter")],
    { season: "spring", laborAllocation: { construction: 0 } },
  );

  assert.ok(result.consumed.coal > 0);
  assert.ok(result.consumed.iron > 0);
  assert.ok(result.produced.steel > 0);
  assert.ok(result.households[0].inventory.coal < 20);
  assert.ok(result.households[0].inventory.iron < 20);
  assert.ok(result.households[0].inventory.steel > 0);
});

test("missing converter inputs create production needs and market buy orders", () => {
  const artisan = household("artisan-one", "artisan", {
    inventory: { coal: 0, iron: 0 },
  });
  const production = runBuildingProduction(
    [artisan],
    [building("smelter")],
    { season: "spring", laborAllocation: { construction: 0 } },
  );
  const updated = production.households[0];
  const orders = generateHouseholdOrderIntents(production.households, { day: 1 });
  const coalOrder = orders.find((order) => order.side === "buy" && order.commodity === "coal");
  const ironOrder = orders.find((order) => order.side === "buy" && order.commodity === "iron");

  assert.equal(production.buildingReports[0].status, "input-shortage");
  assert.ok(updated.productionNeeds.coal > 0);
  assert.ok(updated.productionNeeds.iron > 0);
  assert.ok(coalOrder);
  assert.ok(ironOrder);
  assert.equal(coalOrder.reason, "production-input-buffer");
});

test("shadow sawmills and tanneries form real input chains", () => {
  const woodsman = household("woodsman-one", "woodsman", {
    inventory: { timber: 10 },
  });
  const artisan = household("artisan-one", "artisan", {
    inventory: { livestock: 10 },
  });
  const result = runBuildingProduction(
    [woodsman, artisan],
    [building("sawmill"), building("tannery")],
    { season: "autumn", laborAllocation: { construction: 0 } },
  );

  assert.ok(result.consumed.timber > 0);
  assert.ok(result.produced.wood > 0);
  assert.ok(result.consumed.livestock > 0);
  assert.ok(result.produced.leather > 0);
});

test("understaffing reduces output without inventing workers", () => {
  const oneArtisan = household("artisan-one", "artisan", {
    inventory: { coal: 20, iron: 20 },
  });
  const twoArtisans = [
    oneArtisan,
    household("artisan-two", "artisan", { inventory: { coal: 20, iron: 20 } }),
  ];
  const smelter = building("smelter");
  const under = runBuildingProduction(
    [oneArtisan],
    [smelter],
    { season: "spring", laborAllocation: { construction: 0 } },
  );
  const full = runBuildingProduction(
    twoArtisans,
    [smelter],
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

test("an estate without buildings produces only low-output subsistence goods", () => {
  const initial = createInitialAgentEconomy(10, { seed: "empty-estate" });
  const result = simulateAgentQuarter(initial, {
    days: 1,
    season: "spring",
    taxRate: "medium",
    buildings: [],
    laborAllocation: { construction: 0 },
  });
  const produced = result.lastDailySummary.produced;
  const industrialCommodities = [
    "coal",
    "iron",
    "stone",
    "clay",
    "wood",
    "leather",
    "steel",
    "cloth",
    "ale",
  ];

  assert.ok(result.lastDailySummary.totalProduced > 0);
  assert.ok(result.lastDailySummary.totalProduced < 1);
  assert.equal(result.lastBuildingProduction.length, 0);
  assert.ok(result.lastDailySummary.workforce.subsistenceAssignedWorkers > 0);
  for (const commodity of industrialCommodities) {
    assert.equal(produced[commodity] ?? 0, 0, commodity);
  }
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
