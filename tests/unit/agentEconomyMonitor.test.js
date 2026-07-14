import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialAgentEconomy,
  createSeededRng,
  simulateAgentDay,
} from "../../src/engine/agentEconomy/index.js";
import {
  commodityLabel,
  getEconomyMonitorViewModel,
} from "../../src/engine/agentEconomy/economyMonitorSelectors.js";
import { TAB_CONFIG } from "../../src/components/tabConfig.js";

const BUILDINGS = [
  { instanceId: "farm-1", type: "strip_farm", condition: 100 },
  { instanceId: "mill-1", type: "mill", condition: 100 },
  { instanceId: "smelter-1", type: "smelter", condition: 100 },
];

test("economy tab is present exactly once", () => {
  const economyTabs = TAB_CONFIG.filter((tab) => tab.id === "economy");
  assert.equal(economyTabs.length, 1);
  assert.equal(economyTabs[0].label, "Economy");
});

test("commodity labels are readable", () => {
  assert.equal(commodityLabel("grain"), "Grain");
  assert.equal(commodityLabel("iron_ore"), "Iron Ore");
});

test("monitor aggregates household employment poverty and market pressure", () => {
  const agentEconomy = createInitialAgentEconomy(12, { seed: 20260714 });
  agentEconomy.households[0].cash = 0;
  agentEconomy.households[0].needs.food = 90;
  agentEconomy.households[0].assignedWorkers = 0;
  agentEconomy.households[1].assignedWorkers = 1;
  agentEconomy.households[1].workAssignments = [{
    householdId: agentEconomy.households[1].id,
    workers: 1,
    buildingInstanceId: "farm-1",
    buildingType: "strip_farm",
  }];
  agentEconomy.marketPrices.grain.bidVolume = 8;
  agentEconomy.marketPrices.grain.failedBidVolume = 4;
  agentEconomy.marketPrices.grain.askVolume = 2;
  agentEconomy.marketPrices.grain.failedAskVolume = 1;

  const view = getEconomyMonitorViewModel({ agentEconomy });

  assert.equal(view.householdStats.population, 12);
  assert.ok(view.householdStats.povertyRate > 0);
  assert.ok(view.householdStats.employmentRate > 0);
  const grain = view.market.rows.find((row) => row.commodity === "grain");
  assert.ok(grain);
  assert.equal(grain.demand, 12);
  assert.equal(grain.supply, 3);
  assert.equal(grain.pressure, 9);
  assert.equal(view.mode.authority, "legacy");
});

test("monitor reflects a real building-driven daily simulation", () => {
  const initial = createInitialAgentEconomy(20, { seed: "monitor-day" });
  const rng = createSeededRng(initial.rngState);
  const simulated = simulateAgentDay(initial, rng, {
    turn: 1,
    season: "spring",
    taxRate: "medium",
    buildings: BUILDINGS,
    laborAllocation: { construction: 20 },
  });
  const view = getEconomyMonitorViewModel({ agentEconomy: simulated });

  assert.equal(view.day, 1);
  assert.equal(view.production.totalBuildings, BUILDINGS.length);
  assert.ok(view.production.rows.some((row) => row.name === "Strip Farm"));
  assert.ok(view.market.rows.length > 0);
  assert.ok(view.narrative.length > 0);
  assert.ok(view.quarter === null);
});

test("monitor reports dual-engine safety issues without throwing", () => {
  const agentEconomy = createInitialAgentEconomy(4);
  agentEconomy.engineControl.lastComparison = {
    safe: false,
    turn: 3,
    season: "autumn",
    criticalIssues: ["cash-accounting-error:1"],
    warnings: ["food-direction-mismatch"],
    legacyDeltas: { denarii: 5, food: -2, population: 0, inventory: -2 },
    agentDeltas: { cash: 4, food: 1, population: 0, inventory: 1 },
    accounting: { cashAccountingError: 1, inventoryAccountingError: 3 },
  };

  const view = getEconomyMonitorViewModel({ agentEconomy });
  assert.equal(view.comparison.safe, false);
  assert.deepEqual(view.comparison.criticalIssues, ["cash-accounting-error:1"]);
  assert.ok(view.narrative.some((line) => line.includes("Dual-engine warning")));
});
