import assert from "node:assert/strict";
import test from "node:test";

import { initialState as legacyInitialState } from "../../src/engine/gameReducer.js";
import {
  DAILY_FOOD_TARGET_PER_PERSON,
  MIN_TRADE_QUANTITY,
  allocateBuildingWorkforce,
  createHousehold,
  createInitialAgentEconomy,
  generateHouseholdOrderIntents,
  getDistributedInventoryTotals,
  runBuildingProduction,
  settleOrderBooks,
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

test("daily food target matches two units per person per quarter", () => {
  assert.equal(Number((DAILY_FOOD_TARGET_PER_PERSON * 30).toFixed(6)), 2);
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
