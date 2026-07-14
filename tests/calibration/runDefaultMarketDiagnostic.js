import fs from "node:fs";
import path from "node:path";

import { initialState as legacyInitialState } from "../../src/engine/gameReducer.js";
import {
  createInitialAgentEconomy,
  generateHouseholdOrderIntents,
  getAgentEconomyTotals,
  simulateAgentQuarter,
} from "../../src/engine/agentEconomy/index.js";

const outputPath = process.env.DIAGNOSTIC_REPORT_PATH
  || "artifacts/agent-economy-default-market-diagnostic.json";

let state = createInitialAgentEconomy(legacyInitialState.population, {
  seed: "default-market-diagnostic",
  estateInventory: legacyInitialState.inventory,
});
const days = [];
const seasons = ["spring", "summer", "autumn", "winter"];

function summarizeBooks(orders) {
  const commodities = [...new Set(orders.map((order) => order.commodity))].sort();
  return Object.fromEntries(commodities.map((commodity) => {
    const bids = orders.filter((order) => order.commodity === commodity && order.side === "buy");
    const asks = orders.filter((order) => order.commodity === commodity && order.side === "sell");
    return [commodity, {
      bidCount: bids.length,
      askCount: asks.length,
      highestBid: bids.length > 0 ? Math.max(...bids.map((order) => order.price)) : null,
      lowestAsk: asks.length > 0 ? Math.min(...asks.map((order) => order.price)) : null,
      bidVolume: Number(bids.reduce((total, order) => total + order.quantity, 0).toFixed(4)),
      askVolume: Number(asks.reduce((total, order) => total + order.quantity, 0).toFixed(4)),
      crossed: bids.length > 0 && asks.length > 0
        ? Math.max(...bids.map((order) => order.price)) >= Math.min(...asks.map((order) => order.price))
        : false,
    }];
  }));
}

for (let day = 1; day <= 60; day += 1) {
  const season = seasons[Math.floor((day - 1) / 30) % seasons.length];
  const previewOrders = generateHouseholdOrderIntents(state.households, { day });
  const before = getAgentEconomyTotals(state);
  state = simulateAgentQuarter(state, {
    days: 1,
    turn: Math.floor((day - 1) / 30) + 1,
    season,
    taxRate: legacyInitialState.taxRate,
    buildings: legacyInitialState.buildings,
    laborAllocation: legacyInitialState.laborAllocation,
  });
  const after = getAgentEconomyTotals(state);
  days.push({
    day,
    season,
    preProductionBooks: summarizeBooks(previewOrders),
    summary: state.lastDailySummary,
    buildingStatus: state.lastBuildingProduction.map((report) => ({
      type: report.type,
      status: report.status,
      assignedWorkers: report.assignedWorkers,
      laborRatio: report.laborRatio,
      inputRatio: report.inputRatio,
      shortages: report.shortages,
      produced: report.produced,
    })),
    inventoryDelta: Number((after.totalInventory - before.totalInventory).toFixed(4)),
    foodInventory: Number([
      "grain",
      "flour",
      "fish",
      "livestock",
    ].reduce((total, commodity) => total + (after.inventory[commodity] ?? 0), 0).toFixed(4)),
  });
}

const result = {
  initialInventory: legacyInitialState.inventory,
  finalMetrics: state.metrics,
  finalTotals: getAgentEconomyTotals(state),
  days,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Diagnostic written to ${outputPath}`);
