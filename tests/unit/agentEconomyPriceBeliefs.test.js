import assert from "node:assert/strict";
import test from "node:test";

import {
  LEARNED_PRICE_CEILING_MULTIPLIER,
  LEARNED_PRICE_FLOOR_MULTIPLIER,
  applyPriceLearning,
  createHousehold,
  createInitialAgentEconomy,
  getCommodityPriceBounds,
  settleOrderBooks,
  simulateAgentQuarter,
  updateMarketPriceIndex,
} from "../../src/engine/agentEconomy/index.js";

function center(belief) {
  return (belief.min + belief.max) / 2;
}

function order(overrides) {
  return {
    id: "order-1",
    householdId: "hh-1",
    side: "buy",
    commodity: "grain",
    quantity: 4,
    price: 6,
    reason: "test",
    ...overrides,
  };
}

test("failed urgent buy orders raise the household price band", () => {
  const household = createHousehold({ id: "hh-1", index: 0 });
  household.needs.food = 95;
  const previous = household.priceBeliefs.grain;
  const buyOrder = order({ householdId: household.id });

  const result = applyPriceLearning([household], {
    orders: [buyOrder],
    trades: [],
    failedOrders: [{ ...buyOrder, remainingQuantity: 4 }],
  });
  const next = result.households[0].priceBeliefs.grain;

  assert.ok(center(next) > center(previous));
  assert.equal(result.summary.increases, 1);
  assert.equal(result.summary.decreases, 0);
});

test("unsold surplus lowers the seller price band", () => {
  const household = createHousehold({ id: "hh-2", index: 1 });
  const previous = household.priceBeliefs.grain;
  const sellOrder = order({
    id: "sell-1",
    householdId: household.id,
    side: "sell",
    quantity: 8,
    price: previous.min,
  });

  const result = applyPriceLearning([household], {
    orders: [sellOrder],
    trades: [],
    failedOrders: [{ ...sellOrder, remainingQuantity: 8 }],
  });
  const next = result.households[0].priceBeliefs.grain;

  assert.ok(center(next) < center(previous));
  assert.equal(result.summary.decreases, 1);
});

test("completed trade moves buyer and seller beliefs in opposite directions", () => {
  const buyer = createHousehold({ id: "buyer", index: 0 });
  const seller = createHousehold({ id: "seller", index: 1 });
  buyer.cash = 100;
  seller.inventory.grain = 10;
  buyer.priceBeliefs.grain = { min: 4, max: 6, lastPrice: 5 };
  seller.priceBeliefs.grain = { min: 4, max: 6, lastPrice: 5 };
  const orders = [
    order({ id: "bid", householdId: buyer.id, price: 7, quantity: 4 }),
    order({ id: "ask", householdId: seller.id, side: "sell", price: 3, quantity: 4 }),
  ];
  const market = settleOrderBooks([buyer, seller], orders);
  const learned = applyPriceLearning(market.households, { ...market, orders });
  const nextBuyer = learned.households.find((household) => household.id === buyer.id);
  const nextSeller = learned.households.find((household) => household.id === seller.id);

  assert.equal(market.trades[0].price, 5);
  assert.ok(center(nextBuyer.priceBeliefs.grain) < 5);
  assert.ok(center(nextSeller.priceBeliefs.grain) > 5);
  assert.equal(nextBuyer.priceBeliefs.grain.lastPrice, 5);
  assert.equal(nextSeller.priceBeliefs.grain.lastPrice, 5);
});

test("repeated failures stay inside the calibrated learning band", () => {
  let household = createHousehold({ id: "hh-1", index: 0 });
  household.needs.food = 100;
  const buyOrder = order({ householdId: household.id, quantity: 10 });

  for (let index = 0; index < 250; index += 1) {
    household = applyPriceLearning([household], {
      orders: [buyOrder],
      trades: [],
      failedOrders: [{ ...buyOrder, remainingQuantity: 10 }],
    }).households[0];
  }

  const bounds = getCommodityPriceBounds("grain");
  const belief = household.priceBeliefs.grain;
  assert.ok(belief.min >= bounds.reference * LEARNED_PRICE_FLOOR_MULTIPLIER - 0.01);
  assert.ok(belief.max <= bounds.reference * LEARNED_PRICE_CEILING_MULTIPLIER + 0.01);
  assert.ok(belief.min >= bounds.floor);
  assert.ok(belief.max <= bounds.ceiling);
  assert.ok(belief.min <= belief.max);
});

test("market index records volume-weighted price and trend", () => {
  const orders = [
    order({ id: "bid-1", householdId: "buyer-1", quantity: 5, price: 8 }),
    order({ id: "ask-1", householdId: "seller-1", side: "sell", quantity: 5, price: 4 }),
  ];
  const trades = [
    { commodity: "grain", quantity: 2, price: 5, value: 10 },
    { commodity: "grain", quantity: 3, price: 7, value: 21 },
  ];
  const first = updateMarketPriceIndex({}, orders, trades, [], 1);
  const grain = first.marketPrices.grain;

  assert.equal(grain.lastPrice, 6.2);
  assert.equal(grain.volume, 5);
  assert.equal(grain.tradeCount, 2);
  assert.equal(grain.lastUpdatedDay, 1);
  assert.ok(["up", "down", "flat"].includes(grain.trend));
  assert.ok(grain.history.length >= 2);
});

test("40-quarter price learning remains bounded and serializable", () => {
  let state = createInitialAgentEconomy(120, { seed: "step-5-stress" });

  for (let turn = 1; turn <= 40; turn += 1) {
    state = simulateAgentQuarter(state, {
      turn,
      season: ["spring", "summer", "autumn", "winter"][(turn - 1) % 4],
      taxRate: turn % 5 === 0 ? "high" : "medium",
    });
  }

  for (const household of state.households) {
    for (const [commodity, belief] of Object.entries(household.priceBeliefs)) {
      const bounds = getCommodityPriceBounds(commodity);
      assert.ok(Number.isFinite(belief.min));
      assert.ok(Number.isFinite(belief.max));
      assert.ok(belief.min >= bounds.floor);
      assert.ok(belief.max <= bounds.ceiling);
      assert.ok(belief.min <= belief.max);
    }
  }

  for (const market of Object.values(state.marketPrices)) {
    assert.ok(Number.isFinite(market.lastPrice));
    assert.ok(market.lastPrice >= 0.5);
    assert.ok(market.history.length <= 40);
  }

  assert.equal(state.day, 1200);
  assert.ok(state.metrics.beliefAdjustments > 0);
  assert.ok(state.metrics.priceIncreases > 0);
  assert.ok(state.metrics.priceDecreases > 0);
  assert.ok(state.beliefUpdateHistory.length <= 60);
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
});
