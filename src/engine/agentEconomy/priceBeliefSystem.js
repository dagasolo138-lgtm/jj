import { BASE_BUY_PRICES, BASE_SELL_PRICES } from "../../data/economy.js";
import { MIN_TRADE_QUANTITY, calibratedQuantity } from "./economyCalibration.js";

export const PRICE_HISTORY_LIMIT = 40;
export const MIN_ABSOLUTE_PRICE = 0.5;
export const PRICE_FLOOR_MULTIPLIER = 0.25;
export const PRICE_CEILING_MULTIPLIER = 5;

const FOOD_COMMODITIES = new Set(["grain", "flour", "fish", "livestock"]);

function roundMoney(value) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

export function getReferencePrice(commodity) {
  const buy = Number(BASE_BUY_PRICES[commodity]);
  const sell = Number(BASE_SELL_PRICES[commodity]);
  if (Number.isFinite(buy) && Number.isFinite(sell)) return (buy + sell) / 2;
  if (Number.isFinite(buy)) return buy;
  if (Number.isFinite(sell)) return sell;
  return 5;
}

export function getCommodityPriceBounds(commodity) {
  const reference = getReferencePrice(commodity);
  const floor = Math.max(MIN_ABSOLUTE_PRICE, reference * PRICE_FLOOR_MULTIPLIER);
  const ceiling = Math.max(floor + MIN_ABSOLUTE_PRICE, reference * PRICE_CEILING_MULTIPLIER);
  return { floor: roundMoney(floor), ceiling: roundMoney(ceiling), reference };
}

export function normalizePriceBelief(commodity, belief = {}) {
  const bounds = getCommodityPriceBounds(commodity);
  const fallback = clamp(Number(belief.lastPrice) || bounds.reference, bounds.floor, bounds.ceiling);
  let min = clamp(Number(belief.min) || fallback * 0.8, bounds.floor, bounds.ceiling);
  let max = clamp(Number(belief.max) || fallback * 1.2, bounds.floor, bounds.ceiling);
  if (max < min) [min, max] = [max, min];
  const minimumSpread = Math.max(0.1, bounds.reference * 0.04);
  if (max - min < minimumSpread) {
    const center = (min + max) / 2;
    min = clamp(center - minimumSpread / 2, bounds.floor, bounds.ceiling);
    max = clamp(center + minimumSpread / 2, bounds.floor, bounds.ceiling);
  }
  return {
    min: roundMoney(min),
    max: roundMoney(max),
    lastPrice: roundMoney(clamp(fallback, bounds.floor, bounds.ceiling)),
  };
}

function shiftBelief(commodity, belief, options = {}) {
  const bounds = getCommodityPriceBounds(commodity);
  const normalized = normalizePriceBelief(commodity, belief);
  let center = (normalized.min + normalized.max) / 2;
  let halfSpread = Math.max((normalized.max - normalized.min) / 2, bounds.reference * 0.04);

  if (Number.isFinite(options.anchorPrice)) {
    const anchor = clamp(options.anchorPrice, bounds.floor, bounds.ceiling);
    const weight = clamp(Number(options.anchorWeight) || 0, 0, 1);
    center += (anchor - center) * weight;
  }

  center *= Number.isFinite(options.centerMultiplier) ? options.centerMultiplier : 1;
  halfSpread *= Number.isFinite(options.spreadMultiplier) ? options.spreadMultiplier : 1;
  center = clamp(center, bounds.floor, bounds.ceiling);
  halfSpread = clamp(halfSpread, bounds.reference * 0.04, bounds.reference * 0.75);

  let min = clamp(center - halfSpread, bounds.floor, bounds.ceiling);
  let max = clamp(center + halfSpread, bounds.floor, bounds.ceiling);
  if (max < min) [min, max] = [max, min];

  return {
    min: roundMoney(min),
    max: roundMoney(max),
    lastPrice: Number.isFinite(options.lastPrice)
      ? roundMoney(clamp(options.lastPrice, bounds.floor, bounds.ceiling))
      : normalized.lastPrice,
  };
}

function outcomeKey(householdId, commodity) {
  return `${householdId}::${commodity}`;
}

function ensureOutcome(map, householdId, commodity) {
  const key = outcomeKey(householdId, commodity);
  if (!map.has(key)) {
    map.set(key, {
      householdId,
      commodity,
      buyOrdered: 0,
      sellOrdered: 0,
      buyFilled: 0,
      sellFilled: 0,
      buyValue: 0,
      sellValue: 0,
      failedBuy: 0,
      failedSell: 0,
    });
  }
  return map.get(key);
}

export function collectPriceOutcomes(orders = [], trades = [], failedOrders = []) {
  const outcomes = new Map();

  for (const order of orders) {
    const outcome = ensureOutcome(outcomes, order.householdId, order.commodity);
    const quantity = calibratedQuantity(order.quantity);
    if (quantity < MIN_TRADE_QUANTITY) continue;
    if (order.side === "buy") outcome.buyOrdered = calibratedQuantity(outcome.buyOrdered + quantity);
    else outcome.sellOrdered = calibratedQuantity(outcome.sellOrdered + quantity);
  }

  for (const trade of trades) {
    const quantity = calibratedQuantity(trade.quantity);
    if (quantity < MIN_TRADE_QUANTITY) continue;
    const value = Math.max(0, Number(trade.value) || quantity * (Number(trade.price) || 0));
    const buyer = ensureOutcome(outcomes, trade.buyerId, trade.commodity);
    buyer.buyFilled = calibratedQuantity(buyer.buyFilled + quantity);
    buyer.buyValue += value;
    const seller = ensureOutcome(outcomes, trade.sellerId, trade.commodity);
    seller.sellFilled = calibratedQuantity(seller.sellFilled + quantity);
    seller.sellValue += value;
  }

  for (const order of failedOrders) {
    const outcome = ensureOutcome(outcomes, order.householdId, order.commodity);
    const remaining = calibratedQuantity(order.remainingQuantity);
    if (remaining < MIN_TRADE_QUANTITY) continue;
    if (order.side === "buy") outcome.failedBuy = calibratedQuantity(outcome.failedBuy + remaining);
    else outcome.failedSell = calibratedQuantity(outcome.failedSell + remaining);
  }

  return outcomes;
}

function learnFromOutcome(household, outcome) {
  const previous = normalizePriceBelief(
    outcome.commodity,
    household.priceBeliefs?.[outcome.commodity],
  );
  let next = previous;
  const tradeQuantity = outcome.buyFilled + outcome.sellFilled;
  const tradeValue = outcome.buyValue + outcome.sellValue;
  const tradePrice = tradeQuantity > 0 ? tradeValue / tradeQuantity : null;

  if (outcome.buyFilled > 0) {
    const fillRatio = outcome.buyFilled / Math.max(MIN_TRADE_QUANTITY, outcome.buyOrdered);
    next = shiftBelief(outcome.commodity, next, {
      anchorPrice: outcome.buyValue / outcome.buyFilled,
      anchorWeight: 0.35,
      centerMultiplier: fillRatio >= 0.9 ? 0.985 : 1.015,
      spreadMultiplier: 0.9,
      lastPrice: outcome.buyValue / outcome.buyFilled,
    });
  }

  if (outcome.sellFilled > 0) {
    const fillRatio = outcome.sellFilled / Math.max(MIN_TRADE_QUANTITY, outcome.sellOrdered);
    next = shiftBelief(outcome.commodity, next, {
      anchorPrice: outcome.sellValue / outcome.sellFilled,
      anchorWeight: 0.35,
      centerMultiplier: fillRatio >= 0.9 ? 1.025 : 1,
      spreadMultiplier: 0.92,
      lastPrice: outcome.sellValue / outcome.sellFilled,
    });
  }

  if (outcome.failedBuy > 0) {
    const ratio = outcome.failedBuy / Math.max(MIN_TRADE_QUANTITY, outcome.buyOrdered);
    const urgency = FOOD_COMMODITIES.has(outcome.commodity)
      ? clamp((Number(household.needs?.food) || 0) / 100, 0, 1)
      : 0;
    next = shiftBelief(outcome.commodity, next, {
      centerMultiplier: 1 + 0.03 + ratio * 0.05 + urgency * 0.025,
      spreadMultiplier: 1.04,
    });
  }

  if (outcome.failedSell > 0) {
    const ratio = outcome.failedSell / Math.max(MIN_TRADE_QUANTITY, outcome.sellOrdered);
    next = shiftBelief(outcome.commodity, next, {
      centerMultiplier: 1 - 0.025 - ratio * 0.05,
      spreadMultiplier: 1.04,
    });
  }

  const previousCenter = (previous.min + previous.max) / 2;
  const nextCenter = (next.min + next.max) / 2;
  return {
    belief: next,
    event: {
      householdId: household.id,
      commodity: outcome.commodity,
      previousMin: previous.min,
      previousMax: previous.max,
      nextMin: next.min,
      nextMax: next.max,
      previousCenter: roundMoney(previousCenter),
      nextCenter: roundMoney(nextCenter),
      direction: nextCenter > previousCenter + 0.01
        ? "up"
        : nextCenter < previousCenter - 0.01 ? "down" : "flat",
      buyFilled: outcome.buyFilled,
      sellFilled: outcome.sellFilled,
      failedBuy: outcome.failedBuy,
      failedSell: outcome.failedSell,
      tradePrice: tradePrice == null ? null : roundMoney(tradePrice),
    },
  };
}

export function applyPriceLearning(households, marketResult) {
  const outcomes = collectPriceOutcomes(
    marketResult?.orders,
    marketResult?.trades,
    marketResult?.failedOrders,
  );
  const events = [];
  const nextHouseholds = (households ?? []).map((household) => {
    const relevant = [...outcomes.values()].filter((outcome) => outcome.householdId === household.id);
    if (relevant.length === 0) return household;
    let next = household;
    for (const outcome of relevant) {
      const learned = learnFromOutcome(next, outcome);
      next = {
        ...next,
        priceBeliefs: {
          ...next.priceBeliefs,
          [outcome.commodity]: learned.belief,
        },
      };
      events.push(learned.event);
    }
    return next;
  });

  return {
    households: nextHouseholds,
    events,
    summary: {
      adjustments: events.length,
      increases: events.filter((event) => event.direction === "up").length,
      decreases: events.filter((event) => event.direction === "down").length,
      unchanged: events.filter((event) => event.direction === "flat").length,
    },
  };
}

export function createInitialMarketPrices(commodities = []) {
  return Object.fromEntries(commodities.map((commodity) => {
    const reference = getReferencePrice(commodity);
    const price = roundMoney(reference);
    return [commodity, {
      commodity,
      referencePrice: price,
      previousPrice: price,
      lastPrice: price,
      averagePrice: price,
      low: price,
      high: price,
      volume: 0,
      tradeCount: 0,
      bidVolume: 0,
      askVolume: 0,
      failedBidVolume: 0,
      failedAskVolume: 0,
      changePct: 0,
      trend: "flat",
      lastUpdatedDay: 0,
      history: [price],
    }];
  }));
}

export function updateMarketPriceIndex(previousPrices = {}, orders = [], trades = [], failedOrders = [], day = 0) {
  const commodities = new Set([
    ...Object.keys(previousPrices),
    ...orders.map((order) => order.commodity),
    ...trades.map((trade) => trade.commodity),
  ]);
  const nextPrices = {};
  const snapshot = {};

  for (const commodity of commodities) {
    const previous = previousPrices[commodity]
      ?? createInitialMarketPrices([commodity])[commodity];
    const commodityOrders = orders.filter((order) => order.commodity === commodity);
    const commodityTrades = trades.filter((trade) => trade.commodity === commodity);
    const commodityFailures = failedOrders.filter((order) => order.commodity === commodity);
    const volume = sum(commodityTrades, (trade) => Math.max(0, Number(trade.quantity) || 0));
    const value = sum(commodityTrades, (trade) => Math.max(0, Number(trade.value) || 0));
    const lastPrice = volume > 0 ? roundMoney(value / volume) : previous.lastPrice;
    const previousPrice = previous.lastPrice;
    const changePct = previousPrice > 0
      ? roundMoney(((lastPrice - previousPrice) / previousPrice) * 100)
      : 0;
    const prices = commodityTrades.map((trade) => Number(trade.price)).filter(Number.isFinite);
    const averagePrice = roundMoney((previous.averagePrice * 3 + lastPrice) / 4);
    const bidVolume = sum(commodityOrders.filter((order) => order.side === "buy"), (order) => Number(order.quantity) || 0);
    const askVolume = sum(commodityOrders.filter((order) => order.side === "sell"), (order) => Number(order.quantity) || 0);
    const failedBidVolume = sum(commodityFailures.filter((order) => order.side === "buy"), (order) => Number(order.remainingQuantity) || 0);
    const failedAskVolume = sum(commodityFailures.filter((order) => order.side === "sell"), (order) => Number(order.remainingQuantity) || 0);
    const record = {
      commodity,
      referencePrice: previous.referencePrice ?? roundMoney(getReferencePrice(commodity)),
      previousPrice,
      lastPrice,
      averagePrice,
      low: prices.length > 0 ? roundMoney(Math.min(...prices)) : lastPrice,
      high: prices.length > 0 ? roundMoney(Math.max(...prices)) : lastPrice,
      volume,
      tradeCount: commodityTrades.length,
      bidVolume,
      askVolume,
      failedBidVolume,
      failedAskVolume,
      changePct,
      trend: changePct > 0.5 ? "up" : changePct < -0.5 ? "down" : "flat",
      lastUpdatedDay: Math.max(0, Math.floor(day)),
      history: [...(previous.history ?? [previousPrice]), lastPrice].slice(-PRICE_HISTORY_LIMIT),
    };
    nextPrices[commodity] = record;
    snapshot[commodity] = {
      lastPrice,
      volume,
      tradeCount: commodityTrades.length,
      bidVolume,
      askVolume,
      failedBidVolume,
      failedAskVolume,
      trend: record.trend,
    };
  }

  return { marketPrices: nextPrices, snapshot };
}
