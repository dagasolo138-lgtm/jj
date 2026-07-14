import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeHousehold,
  createHousehold,
} from "../../src/engine/agentEconomy/index.js";

const alwaysRoundUpRng = { next: () => 0 };

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

test("food consumption keeps fractional inventory below one unit", () => {
  const result = consumeHousehold(householdWithGrain(0.75), alwaysRoundUpRng, { day: 1 });

  assert.equal(result.consumedFood, 0);
  assert.equal(result.unmetFood, 1);
  assert.equal(result.household.inventory.grain, 0.75);
});

test("food consumption removes whole units without erasing the remainder", () => {
  const result = consumeHousehold(householdWithGrain(1.75), alwaysRoundUpRng, { day: 1 });

  assert.equal(result.consumedFood, 1);
  assert.equal(result.unmetFood, 0);
  assert.equal(result.household.inventory.grain, 0.75);
  assert.equal(result.totalConsumed, 1);
});
