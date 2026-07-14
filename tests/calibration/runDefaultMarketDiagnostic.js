import fs from "node:fs";
import path from "node:path";

import { initialState as legacyInitialState } from "../../src/engine/gameReducer.js";
import {
  createInitialAgentEconomy,
  getAgentEconomyTotals,
  simulateAgentQuarter,
} from "../../src/engine/agentEconomy/index.js";

const outputPath = process.env.DIAGNOSTIC_REPORT_PATH
  || "artifacts/agent-economy-default-market-diagnostic.json";
const seasons = ["spring", "summer", "autumn", "winter"];
const scenarios = [
  {
    id: "default",
    buildings: legacyInitialState.buildings,
    laborAllocation: legacyInitialState.laborAllocation,
  },
  {
    id: "agricultural-shortage",
    buildings: legacyInitialState.buildings.filter((building) =>
      (typeof building === "string" ? building : building.type) !== "strip_farm"),
    laborAllocation: legacyInitialState.laborAllocation,
  },
  {
    id: "labor-shortage",
    buildings: legacyInitialState.buildings,
    laborAllocation: {
      ...legacyInitialState.laborAllocation,
      demesne: 15,
      peasant: 15,
      construction: 70,
    },
  },
];

function addObject(target, source = {}) {
  for (const [key, amount] of Object.entries(source)) {
    target[key] = Number(((target[key] ?? 0) + (Number(amount) || 0)).toFixed(4));
  }
}

function summarizeHouseholds(households) {
  return households.map((household) => ({
    id: household.id,
    occupation: household.occupation,
    cash: household.cash,
    health: household.health,
    satisfaction: household.satisfaction,
    foodNeed: household.needs?.food,
    assignedWorkers: household.assignedWorkers,
    employmentRatio: household.employmentRatio,
    inventory: Object.fromEntries(
      Object.entries(household.inventory ?? {}).filter(([, amount]) => Number(amount) > 0.001),
    ),
  }));
}

function runScenario(scenario) {
  let state = createInitialAgentEconomy(legacyInitialState.population, {
    seed: `calibration-diagnostic-${scenario.id}`,
    estateInventory: legacyInitialState.inventory,
  });
  const buildings = {};

  for (let day = 1; day <= 360; day += 1) {
    const season = seasons[Math.floor((day - 1) / 30) % seasons.length];
    state = simulateAgentQuarter(state, {
      days: 1,
      turn: Math.floor((day - 1) / 30) + 1,
      season,
      taxRate: legacyInitialState.taxRate,
      buildings: scenario.buildings,
      laborAllocation: scenario.laborAllocation,
    });

    for (const report of state.lastBuildingProduction) {
      const record = buildings[report.type] ?? {
        days: 0,
        idleDays: 0,
        shortageDays: 0,
        inputLimitedDays: 0,
        assignedWorkerDays: 0,
        produced: {},
        consumed: {},
        shortages: {},
      };
      record.days += 1;
      record.assignedWorkerDays += Number(report.assignedWorkers) || 0;
      if (["no-workers", "ruined", "input-shortage", "unknown-building"].includes(report.status)) {
        record.idleDays += 1;
      }
      if (["input-shortage", "input-limited"].includes(report.status)) record.shortageDays += 1;
      if (report.status === "input-limited") record.inputLimitedDays += 1;
      addObject(record.produced, report.produced);
      addObject(record.consumed, report.consumed);
      addObject(record.shortages, report.shortages);
      buildings[report.type] = record;
    }
  }

  return {
    id: scenario.id,
    buildings: scenario.buildings,
    laborAllocation: scenario.laborAllocation,
    metrics: state.metrics,
    totals: getAgentEconomyTotals(state),
    marketPrices: state.marketPrices,
    workforce: state.lastWorkforceSummary,
    buildingSummary: buildings,
    households: summarizeHouseholds(state.households),
  };
}

const result = {
  initialInventory: legacyInitialState.inventory,
  scenarios: scenarios.map(runScenario),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Diagnostic written to ${outputPath}`);
