import assert from "node:assert/strict";
import test from "node:test";

import { initialState as legacyInitialState } from "../../src/engine/gameReducer.js";
import {
  DAILY_FOOD_TARGET_PER_PERSON,
  FOOD_PER_PERSON_PER_QUARTER,
  MIN_TRADE_QUANTITY,
  allocateBuildingWorkforce,
  createHousehold,
  createInitialAgentEconomy,
  generateHouseholdOrderIntents,
  getDistributedInventoryTotals,
  runBuildingProduction,
  settleOrderBooks,
  updateHouseholdWellbeing,
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
  };
}

function building(type, suffix = "calibration") {
  return {
    instanceId: `${type}-${suffix}`,
    type,
    condition: 100,
  };
}

test("estate inventory is conserved and assigned to relevant occupations", () => {
  const economy = createInitialAgentEconomy(legacyInitialState.population, {
    seed: "inventory-adapter",
    estateInventory: legacyInitialState.inventory,
  });
  const totals = getDistributedInventoryTotals(economy.households);

  assert.equal(economy.inventorySeededFromEstate, true);
  assert.equal(economy.inventoryAdapterVersion, 1);
  for (const [commodity, amount] of Object.entries(legacyInitialState.inventory)) {
    assert.equal(totals[commodity] ?? 0, amount, commodity);
  }

  const farmers = economy.households.filter((item) => item.occupation === "farmer");
  const herders = economy.households.filter((item) => item.occupation === "herder");
  const fishermen = economy.households.filter((item) => item.occupation === "fisherman");
  assert.equal(farmers.reduce((sum, item) => sum + item.inventory.grain, 0), 150);
  assert.equal(herders.reduce((sum, item) => sum + item.inventory.livestock, 0), 30);
  assert.equal(fishermen.reduce((sum, item) => sum + item.inventory.fish, 0), 20);
});

test("daily food target matches the calibrated quarterly target", () => {
  assert.equal(
    Number((DAILY_FOOD_TARGET_PER_PERSON * 30).toFixed(6)),
    FOOD_PER_PERSON_PER_QUARTER,
  );
  assert.ok(FOOD_PER_PERSON_PER_QUARTER > 2);
  assert.ok(FOOD_PER_PERSON_PER_QUARTER < 2.1);
});

test("fractional surplus can cross the order book", () => {
  const buyer = household("buyer", "laborer", {
    cash: 20,
    inventory: { grain: 0 },
    needs: { food: 80 },
  });
  const seller = household("seller", "farmer", {
    cash: 1,
    inventory: { grain: 2.4 },
  });
  buyer.priceBeliefs.grain = { min: 3, max: 5, lastPrice: 4 };
  seller.priceBeliefs.grain = { min: 3, max: 5, lastPrice: 4 };

  const orders = generateHouseholdOrderIntents([buyer, seller], { day: 1 });
  const ask = orders.find((order) => order.side === "sell" && order.commodity === "grain");
  const bid = orders.find((order) => order.side === "buy" && order.commodity === "grain");
  assert.ok(ask.quantity >= MIN_TRADE_QUANTITY);
  assert.ok(bid.quantity >= MIN_TRADE_QUANTITY);

  const result = settleOrderBooks([buyer, seller], orders);
  assert.equal(result.trades.length, 1);
  assert.equal(result.trades[0].quantity, 0.4);
  const nextBuyer = result.households.find((item) => item.id === "buyer");
  const nextSeller = result.households.find((item) => item.id === "seller");
  assert.equal(nextBuyer.inventory.grain, 0.4);
  assert.equal(nextSeller.inventory.grain, 2);
});

test("production input orders cross even when household beliefs disagree", () => {
  const buyer = household("artisan", "artisan", {
    cash: 20,
    inventory: { coal: 0 },
    productionNeeds: { coal: 0.03 },
  });
  const seller = household("miner", "miner", {
    cash: 1,
    inventory: { coal: 10 },
  });
  buyer.priceBeliefs.coal = { min: 0.5, max: 1, lastPrice: 0.75 };
  seller.priceBeliefs.coal = { min: 10, max: 12, lastPrice: 11 };

  const orders = generateHouseholdOrderIntents([buyer, seller], { day: 1 });
  const bid = orders.find((order) => order.householdId === buyer.id && order.commodity === "coal");
  const ask = orders.find((order) => order.householdId === seller.id && order.commodity === "coal");
  assert.ok(bid);
  assert.ok(ask);
  assert.ok(bid.price >= ask.price);

  const result = settleOrderBooks([buyer, seller], orders);
  assert.equal(result.trades.length, 1);
  assert.ok(result.trades[0].quantity >= MIN_TRADE_QUANTITY);
});

test("a farm can employ and scale beyond its minimum crew", () => {
  const farmers = Array.from({ length: 8 }, (_, index) =>
    household(`farmer-${index}`, "farmer", { inventory: { grain: 0 } }));
  const workforce = allocateBuildingWorkforce(
    farmers,
    [building("strip_farm")],
    { construction: 0 },
  );
  const oneWorker = runBuildingProduction(
    farmers.slice(0, 1),
    [building("strip_farm", "one")],
    { season: "summer", laborAllocation: { construction: 0 } },
  );
  const expanded = runBuildingProduction(
    farmers,
    [building("strip_farm", "eight")],
    { season: "summer", laborAllocation: { construction: 0 } },
  );

  assert.equal(workforce.summary.requiredWorkers, 1);
  assert.equal(workforce.summary.assignedWorkers, 8);
  assert.equal(workforce.buildingWorkforce[0].workerCapacity, 10);
  assert.equal(workforce.buildingWorkforce[0].status, "staffed");
  assert.ok(expanded.produced.grain > oneWorker.produced.grain * 7);
});

test("idle economic workers perform low-output subsistence work", () => {
  const farmers = Array.from({ length: 5 }, (_, index) =>
    household(`subsistence-${index}`, "farmer", { inventory: { grain: 0 } }));
  const result = runBuildingProduction(
    farmers,
    [building("pasture", "no-herders")],
    { season: "summer", laborAllocation: { construction: 0 } },
  );

  assert.equal(result.subsistence.assignedWorkers, 5);
  assert.ok(result.subsistence.produced.grain > 0);
  assert.ok(result.produced.grain > 0);
  assert.ok(result.households.every((item) => item.employmentRatio === 1));
});

test("service work raises employment without creating building output", () => {
  const households = [
    household("farmer", "farmer"),
    household("trader", "trader"),
    household("clergy", "clergy"),
    household("laborer", "laborer"),
  ];
  const result = allocateBuildingWorkforce(
    households,
    [building("strip_farm")],
    { construction: 0 },
  );

  assert.equal(result.summary.assignedWorkers, 1);
  assert.equal(result.summary.serviceAssignedWorkers, 3);
  assert.equal(result.summary.employedWorkers, 4);
  assert.equal(result.summary.employmentCoverage, 1);
  assert.equal(result.buildingWorkforce[0].assignedWorkers, 1);
});

test("wellbeing changes only when a meal is due or missed", () => {
  const source = household("meal-cadence", "laborer", {
    health: 60,
    employmentRatio: 1,
    needs: { food: 20 },
  });
  const noMealDue = updateHouseholdWellbeing(source, {
    day: 1,
    targetFood: 0,
    consumedFood: 0,
    unmetFood: 0,
  });
  const missedMeal = updateHouseholdWellbeing(source, {
    day: 1,
    targetFood: 1,
    consumedFood: 0,
    unmetFood: 1,
  });
  const fullMeal = updateHouseholdWellbeing(source, {
    day: 1,
    targetFood: 1,
    consumedFood: 1,
    unmetFood: 0,
  });

  assert.equal(noMealDue.health, 60);
  assert.equal(missedMeal.health, 58);
  assert.equal(fullMeal.health, 61);
});
