import assert from "node:assert/strict";
import test from "node:test";

import {
  EMERGENCY_RATIONING_RESERVE_PER_PERSON,
  EMERGENCY_RATIONING_STOCK_PER_PERSON,
  applyEmergencyFoodRationing,
  createHousehold,
} from "../../src/engine/agentEconomy/index.js";

function makeHousehold(id, inventory, overrides = {}) {
  const household = createHousehold({ id, weight: 1, occupation: "laborer" });
  return {
    ...household,
    ...overrides,
    inventory: {
      ...household.inventory,
      grain: 0,
      livestock: 0,
      fish: 0,
      flour: 0,
      ...inventory,
    },
    needs: {
      ...household.needs,
      food: 70,
      ...(overrides.needs ?? {}),
    },
  };
}

function foodTotal(households) {
  return Number(households.reduce((total, household) => total
    + (household.inventory.grain ?? 0)
    + (household.inventory.livestock ?? 0)
    + (household.inventory.fish ?? 0)
    + (household.inventory.flour ?? 0), 0).toFixed(4));
}

function consumptionState(households, overrides = {}) {
  return {
    households,
    consumedByCommodity: {},
    totalConsumed: 0,
    foodConsumed: 0,
    unmetFood: 2,
    unmetFoodByHousehold: {
      donor: 0,
      hungry: 2,
    },
    targetFoodByHousehold: {
      donor: 0,
      hungry: 2,
    },
    consumedFoodByHousehold: {
      donor: 0,
      hungry: 0,
    },
    ...overrides,
  };
}

test("low-stock rationing consumes pooled food while preserving the estate reserve", () => {
  const households = [
    makeHousehold("donor", { grain: 3 }),
    makeHousehold("hungry", {}),
  ];
  const beforeFood = foodTotal(households);
  const result = applyEmergencyFoodRationing(consumptionState(households));
  const afterFood = foodTotal(result.households);

  assert.equal(EMERGENCY_RATIONING_STOCK_PER_PERSON, 3);
  assert.equal(EMERGENCY_RATIONING_RESERVE_PER_PERSON, 0.3);
  assert.equal(result.emergencyRationing.triggered, true);
  assert.equal(result.emergencyRationing.protectedReserve, 0.6);
  assert.equal(result.emergencyRationing.foodRationed, 2);
  assert.equal(result.emergencyRationing.recipients, 1);
  assert.equal(result.emergencyRationing.consumedByCommodity.grain, 2);
  assert.equal(result.foodConsumed, 2);
  assert.equal(result.totalConsumed, 2);
  assert.equal(result.unmetFood, 0);
  assert.equal(result.unmetFoodByHousehold.hungry, 0);
  assert.equal(result.consumedFoodByHousehold.hungry, 2);
  assert.equal(beforeFood - afterFood, 2);
  assert.equal(afterFood, 1);
});

test("healthy stock levels continue to rely on the household market", () => {
  const households = [
    makeHousehold("donor", { grain: 10 }),
    makeHousehold("hungry", {}),
  ];
  const before = JSON.parse(JSON.stringify(households));
  const result = applyEmergencyFoodRationing(consumptionState(households));

  assert.equal(result.emergencyRationing.triggered, false);
  assert.equal(result.emergencyRationing.foodRationed, 0);
  assert.equal(result.unmetFood, 2);
  assert.deepEqual(result.households, before);
});

test("rationing draws fractional food without crossing the reserve floor", () => {
  const households = [
    makeHousehold("donor", { grain: 0.75, fish: 0.75, flour: 0.5 }),
    makeHousehold("hungry", {}),
  ];
  const beforeFood = foodTotal(households);
  const result = applyEmergencyFoodRationing(consumptionState(households));
  const afterFood = foodTotal(result.households);
  const consumed = Object.values(result.emergencyRationing.consumedByCommodity)
    .reduce((total, amount) => total + amount, 0);

  assert.equal(result.emergencyRationing.triggered, true);
  assert.equal(result.emergencyRationing.foodRationed, 1.4);
  assert.equal(consumed, 1.4);
  assert.equal(afterFood, 0.6);
  assert.equal(result.unmetFood, 0.6);
  assert.equal(beforeFood - afterFood, result.emergencyRationing.foodRationed);
});

test("rationing does not trigger when only the protected reserve remains", () => {
  const households = [
    makeHousehold("donor", { grain: 0.6 }),
    makeHousehold("hungry", {}),
  ];
  const result = applyEmergencyFoodRationing(consumptionState(households));

  assert.equal(result.emergencyRationing.triggered, false);
  assert.equal(result.emergencyRationing.protectedReserve, 0.6);
  assert.equal(result.emergencyRationing.availableBudget, 0);
  assert.equal(result.unmetFood, 2);
  assert.equal(foodTotal(result.households), 0.6);
});

test("rationing can be disabled explicitly for comparison runs", () => {
  const households = [
    makeHousehold("donor", { grain: 3 }),
    makeHousehold("hungry", {}),
  ];
  const result = applyEmergencyFoodRationing(
    consumptionState(households),
    { emergencyRationing: false },
  );

  assert.equal(result.emergencyRationing.triggered, false);
  assert.equal(result.unmetFood, 2);
  assert.equal(foodTotal(result.households), 3);
});
