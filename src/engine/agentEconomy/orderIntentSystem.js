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

export function generateHouseholdOrderIntents(households, context = {}) {
  const day = Math.max(1, Math.floor(context.day ?? 1));
  const orders = [];

  for (const household of households ?? []) {
    const weight = Math.max(1, Math.floor(household.weight ?? 1));
    const foodNeed = Math.max(0, Number(household.needs?.food) || 0);

    if (foodNeed >= 35) {
      const commodity = "grain";
      const quantity = Math.max(1, Math.ceil(weight * Math.min(1.5, foodNeed / 70)));
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

    for (const [commodity, rawAmount] of Object.entries(household.inventory ?? {})) {
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
 * Step 3 dry-run matcher. It measures crossing demand and supply but deliberately
 * does not transfer inventory or cash. Step 4 replaces this with the order book.
 */
export function previewOrderMatches(orders) {
  const commodities = new Set((orders ?? []).map((order) => order.commodity));
  let potentialMatches = 0;
  let potentialVolume = 0;

  for (const commodity of commodities) {
    const bids = orders
      .filter((order) => order.commodity === commodity && order.side === "buy")
      .sort((a, b) => b.price - a.price);
    const asks = orders
      .filter((order) => order.commodity === commodity && order.side === "sell")
      .sort((a, b) => a.price - b.price);

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
