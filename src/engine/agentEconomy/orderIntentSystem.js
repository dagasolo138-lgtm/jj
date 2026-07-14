const FOOD_COMMODITIES = ["grain", "flour", "fish", "livestock"];

function safePrice(belief, side) {
  const fallback = Math.max(0.5, Number(belief?.lastPrice) || 1);
  if (side === "buy") return Math.max(0.5, Number(belief?.max) || fallback);
  return Math.max(0.5, Number(belief?.min) || fallback);
}

function reserveFor(commodity, weight) {
  if (FOOD_COMMODITIES.includes(commodity)) return Math.max(1, weight * 2);
  if (commodity === "tools" || commodity === "cloth") return weight;
  return 0;
}

function foodStock(inventory) {
  return FOOD_COMMODITIES.reduce((total, commodity) =>
    total + Math.max(0, Math.floor(Number(inventory?.[commodity]) || 0)), 0);
}

export function generateHouseholdOrderIntents(households, context = {}) {
  const day = Math.max(1, Math.floor(context.day ?? 1));
  const orders = [];

  for (const household of households ?? []) {
    const weight = Math.max(1, Math.floor(household.weight ?? 1));
    const inventory = household.inventory ?? {};
    const foodNeed = Math.max(0, Number(household.needs?.food) || 0);
    const currentFood = foodStock(inventory);
    const targetFood = Math.max(1, weight * 2);

    if (foodNeed >= 35 && currentFood < targetFood) {
      const commodity = "grain";
      const quantity = Math.max(
        1,
        Math.ceil(Math.min(targetFood - currentFood, weight * Math.min(1.5, foodNeed / 70))),
      );
      orders.push({
        id: `day-${day}-${household.id}-buy-${commodity}`,
        householdId: household.id,
        side: "buy",
        commodity,
        quantity,
        price: safePrice(household.priceBeliefs?.[commodity], "buy"),
        reason: "food-need",
      });
    }

    if ((household.needs?.clothing ?? 0) >= 60 && (inventory.cloth ?? 0) < weight) {
      orders.push({
        id: `day-${day}-${household.id}-buy-cloth`,
        householdId: household.id,
        side: "buy",
        commodity: "cloth",
        quantity: Math.max(1, Math.ceil(weight / 2)),
        price: safePrice(household.priceBeliefs?.cloth, "buy"),
        reason: "clothing-need",
      });
    }

    if ((household.needs?.tools ?? 0) >= 65 && (inventory.tools ?? 0) < 1) {
      orders.push({
        id: `day-${day}-${household.id}-buy-tools`,
        householdId: household.id,
        side: "buy",
        commodity: "tools",
        quantity: 1,
        price: safePrice(household.priceBeliefs?.tools, "buy"),
        reason: "tools-need",
      });
    }

    for (const [commodity, rawAmount] of Object.entries(inventory)) {
      const amount = Math.max(0, Math.floor(Number(rawAmount) || 0));
      const reserve = reserveFor(commodity, weight);
      const surplus = amount - reserve;
      if (surplus <= 0) continue;
      orders.push({
        id: `day-${day}-${household.id}-sell-${commodity}`,
        householdId: household.id,
        side: "sell",
        commodity,
        quantity: surplus,
        price: safePrice(household.priceBeliefs?.[commodity], "sell"),
        reason: "surplus",
      });
    }
  }

  return orders;
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
      const volume = Math.min(bidRemaining, askRemaining);
      if (volume <= 0) break;
      potentialMatches += 1;
      potentialVolume += volume;
      bidRemaining -= volume;
      askRemaining -= volume;
      if (bidRemaining <= 0) {
        bidIndex += 1;
        bidRemaining = bids[bidIndex]?.quantity ?? 0;
      }
      if (askRemaining <= 0) {
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
