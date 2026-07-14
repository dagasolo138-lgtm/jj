import {
  FOOD_STOCK_TARGET_PER_PERSON,
  MIN_TRADE_QUANTITY,
  PRODUCTION_INPUT_BUFFER_DAYS,
  calibratedQuantity,
} from "./economyCalibration.js";

const FOOD_COMMODITIES = ["grain", "flour", "fish", "livestock"];

function safePrice(belief, side) {
  const fallback = Math.max(0.5, Number(belief?.lastPrice) || 1);
  if (side === "buy") return Math.max(0.5, Number(belief?.max) || fallback);
  return Math.max(0.5, Number(belief?.min) || fallback);
}

function reserveFor(household, commodity, weight) {
  let reserve = 0;
  if (FOOD_COMMODITIES.includes(commodity)) {
    reserve = Math.max(1, weight * FOOD_STOCK_TARGET_PER_PERSON);
  }
  if (commodity === "tools" || commodity === "cloth") reserve = Math.max(reserve, weight);
  reserve += Math.max(0, Number(household.productionNeeds?.[commodity]) || 0)
    * PRODUCTION_INPUT_BUFFER_DAYS;
  return calibratedQuantity(reserve);
}

function foodStock(inventory) {
  return calibratedQuantity(FOOD_COMMODITIES.reduce((total, commodity) =>
    total + Math.max(0, Number(inventory?.[commodity]) || 0), 0));
}

function addBuyRequest(requests, commodity, quantity, reason, minimumLot = false) {
  const rawAmount = calibratedQuantity(quantity);
  if (rawAmount <= 0) return;
  const amount = minimumLot
    ? Math.max(MIN_TRADE_QUANTITY, rawAmount)
    : rawAmount;
  if (amount < MIN_TRADE_QUANTITY) return;
  const current = requests.get(commodity) ?? { quantity: 0, reasons: [] };
  current.quantity = calibratedQuantity(current.quantity + amount);
  if (!current.reasons.includes(reason)) current.reasons.push(reason);
  requests.set(commodity, current);
}

function dailySellLimit(weight, commodity) {
  if (FOOD_COMMODITIES.includes(commodity)) return calibratedQuantity(Math.max(0.5, weight));
  return calibratedQuantity(Math.max(0.25, weight * 0.5));
}

export function generateHouseholdOrderIntents(households, context = {}) {
  const day = Math.max(1, Math.floor(context.day ?? 1));
  const buyOrders = [];
  const sellerCandidates = [];

  for (const household of households ?? []) {
    const weight = Math.max(1, Math.floor(household.weight ?? 1));
    const inventory = household.inventory ?? {};
    const currentFood = foodStock(inventory);
    const targetFood = Math.max(1, weight * FOOD_STOCK_TARGET_PER_PERSON);
    const buyRequests = new Map();

    if (currentFood < targetFood) {
      addBuyRequest(
        buyRequests,
        "grain",
        targetFood - currentFood,
        "food-stock",
        true,
      );
    }

    if ((household.needs?.clothing ?? 0) >= 60 && (inventory.cloth ?? 0) < weight) {
      addBuyRequest(buyRequests, "cloth", Math.max(MIN_TRADE_QUANTITY, weight / 2), "clothing-need", true);
    }

    if ((household.needs?.tools ?? 0) >= 65 && (inventory.tools ?? 0) < 1) {
      addBuyRequest(buyRequests, "tools", 1, "tools-need", true);
    }

    for (const [commodity, amount] of Object.entries(household.productionNeeds ?? {})) {
      const currentStock = Math.max(0, Number(inventory[commodity]) || 0);
      const dailyShortage = Math.max(0, Number(amount) || 0);
      const targetStock = calibratedQuantity(dailyShortage * PRODUCTION_INPUT_BUFFER_DAYS);
      const missing = calibratedQuantity(targetStock - currentStock);
      if (missing <= 0) continue;
      addBuyRequest(
        buyRequests,
        commodity,
        missing,
        "production-input-buffer",
        true,
      );
    }

    for (const [commodity, request] of buyRequests.entries()) {
      buyOrders.push({
        id: `day-${day}-${household.id}-buy-${commodity}`,
        householdId: household.id,
        side: "buy",
        commodity,
        quantity: request.quantity,
        price: safePrice(household.priceBeliefs?.[commodity], "buy"),
        reason: request.reasons.join("+"),
      });
    }

    for (const [commodity, rawAmount] of Object.entries(inventory)) {
      const amount = calibratedQuantity(rawAmount);
      const reserve = reserveFor(household, commodity, weight);
      const surplus = calibratedQuantity(amount - reserve);
      if (surplus < MIN_TRADE_QUANTITY) continue;
      sellerCandidates.push({
        id: `day-${day}-${household.id}-sell-${commodity}`,
        householdId: household.id,
        side: "sell",
        commodity,
        quantity: Math.min(surplus, dailySellLimit(weight, commodity)),
        price: safePrice(household.priceBeliefs?.[commodity], "sell"),
        reason: "observed-demand-surplus",
      });
    }
  }

  const demandedCommodities = new Set(buyOrders.map((order) => order.commodity));
  const sellOrders = sellerCandidates.filter((order) =>
    demandedCommodities.has(order.commodity)
    && order.quantity >= MIN_TRADE_QUANTITY);

  return [...buyOrders, ...sellOrders];
}

/**
 * Dry-run matcher kept for diagnostics and comparison. Step 4 live shadow market
 * uses settleOrderBooks so money and inventory move inside agentEconomy.
 */
export function previewOrderMatches(orders) {
  const commodities = new Set((orders ?? []).map((order) => order.commodity));
  let potentialMatches = 0;
  let potentialVolume = 0;

  for (const commodity of commodities) {
    const bids = orders
      .filter((order) => order.commodity === commodity && order.side === "buy")
      .sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
    const asks = orders
      .filter((order) => order.commodity === commodity && order.side === "sell")
      .sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));

    let bidIndex = 0;
    let askIndex = 0;
    let bidRemaining = bids[0]?.quantity ?? 0;
    let askRemaining = asks[0]?.quantity ?? 0;

    while (bidIndex < bids.length && askIndex < asks.length) {
      if (bids[bidIndex].price < asks[askIndex].price) break;
      const volume = calibratedQuantity(Math.min(bidRemaining, askRemaining));
      if (volume < MIN_TRADE_QUANTITY) break;
      potentialMatches += 1;
      potentialVolume = calibratedQuantity(potentialVolume + volume);
      bidRemaining = calibratedQuantity(bidRemaining - volume);
      askRemaining = calibratedQuantity(askRemaining - volume);
      if (bidRemaining < MIN_TRADE_QUANTITY) {
        bidIndex += 1;
        bidRemaining = bids[bidIndex]?.quantity ?? 0;
      }
      if (askRemaining < MIN_TRADE_QUANTITY) {
        askIndex += 1;
        askRemaining = asks[askIndex]?.quantity ?? 0;
      }
    }
  }

  return {
    potentialMatches,
    potentialVolume,
    settledTrades: 0,
    shadowOnly: true,
  };
}
