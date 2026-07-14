import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOrderBooks,
  createHousehold,
  settleOrderBooks,
} from "../../src/engine/agentEconomy/index.js";

function makeHousehold(id, overrides = {}) {
  return {
    ...createHousehold({ id, index: id === "buyer" ? 1 : 2 }),
    ...overrides,
    inventory: {
      ...createHousehold({ id, index: id === "buyer" ? 1 : 2 }).inventory,
      ...(overrides.inventory ?? {}),
    },
  };
}

function totals(households, commodity) {
  return {
    cash: Number(households.reduce((total, household) => total + household.cash, 0).toFixed(2)),
    commodity: households.reduce((total, household) => total + (household.inventory[commodity] ?? 0), 0),
  };
}

test("order books sort bids high-to-low and asks low-to-high", () => {
  const books = buildOrderBooks([
    { id: "bid-low", householdId: "a", side: "buy", commodity: "grain", quantity: 1, price: 3 },
    { id: "bid-high", householdId: "b", side: "buy", commodity: "grain", quantity: 1, price: 5 },
    { id: "ask-high", householdId: "c", side: "sell", commodity: "grain", quantity: 1, price: 4 },
    { id: "ask-low", householdId: "d", side: "sell", commodity: "grain", quantity: 1, price: 2 },
  ]);

  assert.deepEqual(books.grain.bids.map((order) => order.id), ["bid-high", "bid-low"]);
  assert.deepEqual(books.grain.asks.map((order) => order.id), ["ask-low", "ask-high"]);
});

test("matching orders transfer inventory and cash at midpoint price", () => {
  const buyer = makeHousehold("buyer", {
    cash: 20,
    inventory: { grain: 0 },
  });
  const seller = makeHousehold("seller", {
    cash: 1,
    inventory: { grain: 10 },
  });
  const before = totals([buyer, seller], "grain");

  const result = settleOrderBooks([buyer, seller], [
    { id: "bid", householdId: "buyer", side: "buy", commodity: "grain", quantity: 4, price: 5 },
    { id: "ask", householdId: "seller", side: "sell", commodity: "grain", quantity: 4, price: 3 },
  ]);

  const afterBuyer = result.households.find((household) => household.id === "buyer");
  const afterSeller = result.households.find((household) => household.id === "seller");
  const after = totals(result.households, "grain");

  assert.equal(result.trades.length, 1);
  assert.equal(result.trades[0].price, 4);
  assert.equal(result.trades[0].quantity, 4);
  assert.equal(result.trades[0].value, 16);
  assert.equal(afterBuyer.cash, 4);
  assert.equal(afterBuyer.inventory.grain, 4);
  assert.equal(afterSeller.cash, 17);
  assert.equal(afterSeller.inventory.grain, 6);
  assert.deepEqual(after, before);
  assert.equal(afterBuyer.priceBeliefs.grain.lastPrice, 4);
  assert.equal(afterSeller.priceBeliefs.grain.lastPrice, 4);
  assert.equal(afterBuyer.priceHistory.grain.at(-1), 4);
});

test("uncrossed orders do not trade and remain as failed orders", () => {
  const buyer = makeHousehold("buyer", { cash: 20, inventory: { grain: 0 } });
  const seller = makeHousehold("seller", { cash: 1, inventory: { grain: 10 } });
  const before = totals([buyer, seller], "grain");

  const result = settleOrderBooks([buyer, seller], [
    { id: "bid", householdId: "buyer", side: "buy", commodity: "grain", quantity: 4, price: 2 },
    { id: "ask", householdId: "seller", side: "sell", commodity: "grain", quantity: 4, price: 3 },
  ]);

  assert.equal(result.trades.length, 0);
  assert.equal(result.failedOrders.length, 2);
  assert.deepEqual(totals(result.households, "grain"), before);
});

test("cash and inventory constraints cap partial fills", () => {
  const buyer = makeHousehold("buyer", { cash: 6, inventory: { grain: 0 } });
  const seller = makeHousehold("seller", { cash: 1, inventory: { grain: 10 } });

  const result = settleOrderBooks([buyer, seller], [
    { id: "bid", householdId: "buyer", side: "buy", commodity: "grain", quantity: 10, price: 5 },
    { id: "ask", householdId: "seller", side: "sell", commodity: "grain", quantity: 10, price: 3 },
  ]);

  const afterBuyer = result.households.find((household) => household.id === "buyer");
  assert.equal(result.trades.length, 1);
  assert.equal(result.trades[0].quantity, 1);
  assert.equal(afterBuyer.cash, 2);
  assert.equal(afterBuyer.inventory.grain, 1);
  assert.ok(result.failedOrders.some((order) => order.id === "bid" && order.remainingQuantity === 9));
});
