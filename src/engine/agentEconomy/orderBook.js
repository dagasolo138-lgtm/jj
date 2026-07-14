function money(value) {
  if (!Number.isFinite(value)) return 0;
  return Number(Math.max(0, value).toFixed(2));
}

function quantity(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeOrder(order, index = 0) {
  const side = order?.side === "sell" ? "sell" : "buy";
  const price = money(order?.price);
  return {
    id: typeof order?.id === "string" && order.id.length > 0
      ? order.id
      : `order-${String(index + 1).padStart(6, "0")}`,
    householdId: typeof order?.householdId === "string" ? order.householdId : "",
    side,
    commodity: typeof order?.commodity === "string" ? order.commodity : "unknown",
    quantity: quantity(order?.quantity),
    price,
    reason: typeof order?.reason === "string" ? order.reason : "unknown",
    remainingQuantity: quantity(order?.quantity),
  };
}

export function buildOrderBooks(orders) {
  const books = {};

  (orders ?? []).forEach((order, index) => {
    const normalized = normalizeOrder(order, index);
    if (!normalized.householdId || normalized.quantity <= 0 || normalized.price <= 0) return;
    const book = books[normalized.commodity] ?? { bids: [], asks: [], trades: [] };
    if (normalized.side === "buy") book.bids.push(normalized);
    else book.asks.push(normalized);
    books[normalized.commodity] = book;
  });

  for (const book of Object.values(books)) {
    book.bids.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
    book.asks.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
  }

  return books;
}

export function summarizeOrders(orders) {
  const summary = {};
  for (const order of orders ?? []) {
    const commodity = order.commodity ?? "unknown";
    const bucket = summary[commodity] ?? {
      bids: 0,
      asks: 0,
      bidVolume: 0,
      askVolume: 0,
    };
    if (order.side === "buy") {
      bucket.bids += 1;
      bucket.bidVolume += quantity(order.quantity);
    } else if (order.side === "sell") {
      bucket.asks += 1;
      bucket.askVolume += quantity(order.quantity);
    }
    summary[commodity] = bucket;
  }
  return summary;
}
