import { buildOrderBooks, summarizeOrders } from "./orderBook.js";

const PRICE_HISTORY_LIMIT = 24;

function money(value) {
  if (!Number.isFinite(value)) return 0;
  return Number(Math.max(0, value).toFixed(2));
}

function quantity(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function getAvailableInventory(household, commodity) {
  return quantity(household?.inventory?.[commodity]);
}

function getAffordableQuantity(household, price) {
  if (price <= 0) return 0;
  return Math.floor(money(household?.cash) / price);
}

function appendPriceHistory(household, commodity, price) {
  const existing = Array.isArray(household.priceHistory?.[commodity])
    ? household.priceHistory[commodity]
    : [];
  return existing.concat(price).slice(-PRICE_HISTORY_LIMIT);
}

function updateTradeMemory(household, commodity, price) {
  const previousBelief = household.priceBeliefs?.[commodity] ?? {
    min: price,
    max: price,
    lastPrice: price,
  };
  return {
    ...household,
    priceBeliefs: {
      ...household.priceBeliefs,
      [commodity]: {
        ...previousBelief,
        lastPrice: price,
      },
    },
    priceHistory: {
      ...household.priceHistory,
      [commodity]: appendPriceHistory(household, commodity, price),
    },
  };
}

function settleTrade(householdsById, bid, ask, commodity, sequence) {
  const buyer = householdsById.get(bid.householdId);
  const seller = householdsById.get(ask.householdId);
  if (!buyer || !seller) return null;
  if (buyer.id === seller.id) return null;

  const tradePrice = money((bid.price + ask.price) / 2);
  const affordable = getAffordableQuantity(buyer, tradePrice);
  const available = getAvailableInventory(seller, commodity);
  const tradeQuantity = quantity(Math.min(
    bid.remainingQuantity,
    ask.remainingQuantity,
    affordable,
    available,
  ));

  if (tradePrice <= 0 || tradeQuantity <= 0) return null;

  const tradeValue = money(tradeQuantity * tradePrice);
  const buyerInventory = { ...buyer.inventory };
  const sellerInventory = { ...seller.inventory };
  buyerInventory[commodity] = getAvailableInventory(buyer, commodity) + tradeQuantity;
  sellerInventory[commodity] = available - tradeQuantity;

  const nextBuyer = updateTradeMemory({
    ...buyer,
    cash: money((buyer.cash ?? 0) - tradeValue),
    inventory: buyerInventory,
  }, commodity, tradePrice);

  const nextSeller = updateTradeMemory({
    ...seller,
    cash: money((seller.cash ?? 0) + tradeValue),
    inventory: sellerInventory,
  }, commodity, tradePrice);

  householdsById.set(buyer.id, nextBuyer);
  householdsById.set(seller.id, nextSeller);
  bid.remainingQuantity -= tradeQuantity;
  ask.remainingQuantity -= tradeQuantity;

  return {
    id: `trade-${String(sequence).padStart(6, "0")}`,
    buyerId: buyer.id,
    sellerId: seller.id,
    commodity,
    quantity: tradeQuantity,
    price: tradePrice,
    value: tradeValue,
    bidId: bid.id,
    askId: ask.id,
  };
}

function collectFailedOrders(books) {
  const failedOrders = [];
  for (const book of Object.values(books)) {
    for (const order of [...book.bids, ...book.asks]) {
      if (order.remainingQuantity > 0) {
        failedOrders.push({
          id: order.id,
          householdId: order.householdId,
          side: order.side,
          commodity: order.commodity,
          quantity: order.quantity,
          remainingQuantity: order.remainingQuantity,
          price: order.price,
          reason: order.reason,
        });
      }
    }
  }
  return failedOrders;
}

export function settleOrderBooks(households, orders) {
  const books = buildOrderBooks(orders);
  const householdsById = new Map((households ?? []).map((household) => [household.id, household]));
  const trades = [];

  for (const [commodity, book] of Object.entries(books)) {
    let bidIndex = 0;
    let askIndex = 0;

    while (bidIndex < book.bids.length && askIndex < book.asks.length) {
      const bid = book.bids[bidIndex];
      const ask = book.asks[askIndex];

      if (bid.remainingQuantity <= 0) {
        bidIndex += 1;
        continue;
      }
      if (ask.remainingQuantity <= 0) {
        askIndex += 1;
        continue;
      }
      if (bid.householdId === ask.householdId) {
        askIndex += 1;
        continue;
      }
      if (bid.price < ask.price) break;

      const trade = settleTrade(householdsById, bid, ask, commodity, trades.length + 1);
      if (!trade) {
        const buyer = householdsById.get(bid.householdId);
        const seller = householdsById.get(ask.householdId);
        if (!buyer || getAffordableQuantity(buyer, money((bid.price + ask.price) / 2)) <= 0) {
          bidIndex += 1;
        } else if (!seller || getAvailableInventory(seller, commodity) <= 0) {
          askIndex += 1;
        } else {
          break;
        }
        continue;
      }

      book.trades.push(trade);
      trades.push(trade);
    }
  }

  const failedOrders = collectFailedOrders(books);
  const tradeValue = money(trades.reduce((total, trade) => total + trade.value, 0));
  const tradeVolume = trades.reduce((total, trade) => total + trade.quantity, 0);
  const tradedCommodities = [...new Set(trades.map((trade) => trade.commodity))].sort();

  return {
    households: (households ?? []).map((household) => householdsById.get(household.id) ?? household),
    books,
    trades,
    failedOrders,
    summary: {
      orders: (orders ?? []).length,
      orderSummary: summarizeOrders(orders),
      settledTrades: trades.length,
      failedOrders: failedOrders.length,
      tradeVolume,
      tradeValue,
      tradedCommodities,
    },
  };
}
