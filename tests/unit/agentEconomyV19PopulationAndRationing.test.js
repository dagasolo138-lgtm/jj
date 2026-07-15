import assert from "node:assert/strict";
import test from "node:test";

import {
  EMERGENCY_RATIONING_RESERVE_PER_PERSON,
  consumeHousehold,
  createHousehold,
  createInitialAgentEconomy,
  ensureLiveStateAdapter,
  finalizeAgentQuarterLiveState,
  getDistributedInventoryTotals,
  getHouseholdPopulation,
} from "../../src/engine/agentEconomy/index.js";

function cashTotal(agentEconomy) {
  return Number((agentEconomy.households.reduce(
    (total, household) => total + household.cash,
    0,
  ) + (agentEconomy.liveStateAdapter?.unassignedAssets?.cash ?? 0)).toFixed(2));
}

test("V19 emergency rationing keeps a 0.3 food reserve per represented family", () => {
  assert.equal(EMERGENCY_RATIONING_RESERVE_PER_PERSON, 0.3);
});

test("V19 daily food consumption uses an exact fractional target", () => {
  const household = createHousehold({ id: "fractional-food", weight: 1 });
  const result = consumeHousehold({
    ...household,
    inventory: {
      ...household.inventory,
      flour: 0,
      fish: 0,
      grain: 1,
      livestock: 0,
    },
  }, { next: () => 0 }, { day: 1, season: "summer" });

  assert.equal(result.targetFood, 0.0683);
  assert.equal(result.consumedFood, 0.0683);
  assert.equal(result.unmetFood, 0);
  assert.equal(result.household.inventory.grain, 0.9317);
});

test("V19 population alignment changes household structure without minting assets", () => {
  const legacyBefore = {
    turn: 4,
    season: "autumn",
    denarii: 100,
    population: 1,
    inventory: { grain: 4, iron: 1 },
    phase: "management",
  };
  const legacyAfter = {
    ...legacyBefore,
    population: 2,
    phase: "seasonal_resolve",
  };
  const before = ensureLiveStateAdapter(createInitialAgentEconomy(1, {
    estateInventory: legacyBefore.inventory,
  }), legacyBefore);
  const beforeCash = cashTotal(before);
  const beforeInventory = getDistributedInventoryTotals(before.households);

  const finalized = finalizeAgentQuarterLiveState(before, before, legacyAfter);
  const afterInventory = getDistributedInventoryTotals(finalized.households);
  const reserveInventory = finalized.liveStateAdapter.unassignedAssets.inventory;
  const migrant = finalized.households.at(-1);

  assert.equal(getHouseholdPopulation(finalized.households), 2);
  assert.equal(cashTotal(finalized), beforeCash);
  assert.equal(afterInventory.grain + (reserveInventory.grain ?? 0), beforeInventory.grain);
  assert.equal(afterInventory.iron + (reserveInventory.iron ?? 0), beforeInventory.iron);
  assert.equal(migrant.cash, 0);
  assert.equal(Object.values(migrant.inventory).reduce((total, amount) => total + amount, 0), 0);
});
