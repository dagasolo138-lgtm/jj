import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeHousehold,
  createHousehold,
} from "../../src/engine/agentEconomy/index.js";

const unusedRng = { next: () => 0 };

function householdWithGrain(grain) {
  const household = createHousehold({ id: `grain-${grain}`, weight: 1, occupation: "farmer" });
  return {
    ...household,
    inventory: {
      ...household.inventory,
      flour: 0,
      fish: 0,
      grain,
      livestock: 0,
    },
  };
}

test("food consumption uses the exact fractional daily target", () => {
  const result = consumeHousehold(householdWithGrain(0.75), unusedRng, { day: 1 });

  assert.equal(result.targetFood, 0.0683);
  assert.equal(result.consumedFood, 0.0683);
  assert.equal(result.unmetFood, 0);
  assert.equal(result.household.inventory.grain, 0.6817);
  assert.equal(result.totalConsumed, 0.0683);
});

test("food consumption records a fractional shortfall without losing inventory", () => {
  const result = consumeHousehold(householdWithGrain(0.05), unusedRng, { day: 1 });

  assert.equal(result.targetFood, 0.0683);
  assert.equal(result.consumedFood, 0.05);
  assert.equal(result.unmetFood, 0.0183);
  assert.equal(result.household.inventory.grain, 0);
  assert.equal(result.totalConsumed, 0.05);
});
