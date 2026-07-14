import BUILDINGS from "../../data/buildings.js";
import { ENGINE_MODES, normalizeEngineControl } from "./engineControlSystem.js";

const FOOD_COMMODITIES = new Set(["grain", "livestock", "fish", "flour"]);
const STATUS_PRIORITY = {
  "input-shortage": 5,
  ruined: 5,
  "no-workers": 4,
  "input-limited": 3,
  understaffed: 2,
  staffed: 1,
};

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function nonNegative(value) {
  return Math.max(0, finite(value));
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function round(value, digits = 1) {
  return Number(finite(value).toFixed(digits));
}

export function commodityLabel(commodity) {
  return String(commodity ?? "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getHouseholdStats(households = []) {
  let population = 0;
  let assignedWorkers = 0;
  let poorPopulation = 0;
  let severePovertyPopulation = 0;
  let weightedHealth = 0;
  let weightedSatisfaction = 0;
  let highFoodNeedPopulation = 0;

  for (const household of households) {
    const weight = Math.max(0, Math.floor(finite(household?.weight)));
    const cash = nonNegative(household?.cash);
    const foodNeed = nonNegative(household?.needs?.food);
    const assigned = Math.min(weight, nonNegative(household?.assignedWorkers));
    const cashPerPerson = ratio(cash, weight || 1);
    const isPoor = cashPerPerson < 2.5 || foodNeed >= 75;
    const isSevere = cashPerPerson < 1 || foodNeed >= 90;

    population += weight;
    assignedWorkers += assigned;
    if (isPoor) poorPopulation += weight;
    if (isSevere) severePovertyPopulation += weight;
    if (foodNeed >= 75) highFoodNeedPopulation += weight;
    weightedHealth += nonNegative(household?.health) * weight;
    weightedSatisfaction += nonNegative(household?.satisfaction) * weight;
  }

  return {
    households: households.length,
    population,
    assignedWorkers: round(assignedWorkers, 2),
    unassignedWorkers: round(Math.max(0, population - assignedWorkers), 2),
    employmentRate: round(ratio(assignedWorkers, population) * 100),
    povertyRate: round(ratio(poorPopulation, population) * 100),
    severePovertyRate: round(ratio(severePovertyPopulation, population) * 100),
    foodStressRate: round(ratio(highFoodNeedPopulation, population) * 100),
    averageHealth: round(ratio(weightedHealth, population)),
    averageSatisfaction: round(ratio(weightedSatisfaction, population)),
  };
}

function getPriceRows(marketPrices = {}) {
  return Object.entries(marketPrices).map(([commodity, record]) => {
    const bidVolume = nonNegative(record?.bidVolume);
    const askVolume = nonNegative(record?.askVolume);
    const failedBidVolume = nonNegative(record?.failedBidVolume);
    const failedAskVolume = nonNegative(record?.failedAskVolume);
    const demand = bidVolume + failedBidVolume;
    const supply = askVolume + failedAskVolume;
    const activity = demand + supply + nonNegative(record?.volume);

    return {
      commodity,
      label: commodityLabel(commodity),
      lastPrice: round(nonNegative(record?.lastPrice), 2),
      averagePrice: round(nonNegative(record?.averagePrice), 2),
      referencePrice: round(nonNegative(record?.referencePrice), 2),
      changePct: round(finite(record?.changePct), 1),
      trend: ["up", "down", "flat"].includes(record?.trend) ? record.trend : "flat",
      demand: round(demand, 2),
      supply: round(supply, 2),
      pressure: round(demand - supply, 2),
      volume: round(nonNegative(record?.volume), 2),
      tradeCount: Math.max(0, Math.floor(finite(record?.tradeCount))),
      history: Array.isArray(record?.history)
        ? record.history.filter(Number.isFinite).slice(-20)
        : [],
      activity,
    };
  }).sort((a, b) => b.activity - a.activity || a.label.localeCompare(b.label));
}

function getBuildingRows(buildingReports = []) {
  return buildingReports.map((report) => {
    const definition = BUILDINGS[report?.type];
    const shortages = Object.entries(report?.shortages ?? {})
      .filter(([, amount]) => nonNegative(amount) > 0)
      .map(([commodity, amount]) => ({
        commodity,
        label: commodityLabel(commodity),
        amount: round(nonNegative(amount), 2),
      }));

    return {
      instanceId: report?.instanceId ?? report?.type ?? "unknown",
      type: report?.type ?? "unknown",
      name: definition?.name ?? commodityLabel(report?.type ?? "unknown building"),
      status: report?.status ?? "unknown",
      requiredOccupation: report?.requiredOccupation ?? "laborer",
      requiredWorkers: nonNegative(report?.requiredWorkers),
      assignedWorkers: nonNegative(report?.assignedWorkers),
      laborCoverage: round(nonNegative(report?.laborRatio) * 100),
      condition: round(nonNegative(report?.condition)),
      shortages,
      produced: Object.entries(report?.produced ?? {})
        .filter(([, amount]) => nonNegative(amount) > 0)
        .map(([commodity, amount]) => `${commodityLabel(commodity)} ${round(amount, 2)}`),
      priority: STATUS_PRIORITY[report?.status] ?? 0,
    };
  }).sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
}

function createNarrative(agentEconomy, householdStats, priceRows, buildingRows, control) {
  const lines = [];
  const summary = agentEconomy?.lastDailySummary;
  const comparison = control.lastComparison;
  const criticalBuildings = buildingRows.filter((row) => row.priority >= 3);
  const strongestPressure = priceRows
    .filter((row) => Math.abs(row.pressure) > 0.01)
    .sort((a, b) => Math.abs(b.pressure) - Math.abs(a.pressure))[0];

  if (!summary) {
    lines.push("Simulate a season to generate the first household-economy report.");
  } else {
    lines.push(
      `Day ${summary.day}: ${round(summary.totalProduced, 1)} goods produced, ${round(summary.totalConsumed, 1)} consumed, and ${round(summary.tradeVolume, 1)} traded.`,
    );
    if (nonNegative(summary.unmetFood) > 0) {
      lines.push(`${round(summary.unmetFood, 1)} food units went unmet during the latest economic day.`);
    }
  }

  if (criticalBuildings.length > 0) {
    const first = criticalBuildings[0];
    const reason = first.shortages.length > 0
      ? `short of ${first.shortages.map((item) => item.label).join(", ")}`
      : first.status.replaceAll("-", " ");
    lines.push(`${first.name} is constrained: ${reason}.`);
  }

  if (strongestPressure) {
    const direction = strongestPressure.pressure > 0 ? "demand exceeds supply" : "supply exceeds demand";
    lines.push(`${strongestPressure.label}: ${direction} by ${Math.abs(strongestPressure.pressure).toFixed(1)} units.`);
  }

  if (householdStats.povertyRate >= 25) {
    lines.push(`${householdStats.povertyRate}% of represented residents are under the monitor's poverty threshold.`);
  }

  if (comparison?.warnings?.length > 0) {
    lines.push(`Dual-engine warning: ${comparison.warnings[0].replaceAll("-", " ")}.`);
  } else if (comparison?.safe) {
    lines.push(`Dual-engine accounting passed for turn ${comparison.turn}.`);
  }

  return lines.slice(0, 6);
}

export function getEconomyMonitorViewModel(state = {}) {
  const agentEconomy = state.agentEconomy ?? {};
  const households = Array.isArray(agentEconomy.households) ? agentEconomy.households : [];
  const control = normalizeEngineControl(agentEconomy.engineControl);
  const householdStats = getHouseholdStats(households);
  const priceRows = getPriceRows(agentEconomy.marketPrices);
  const buildingRows = getBuildingRows(agentEconomy.lastBuildingProduction);
  const comparison = control.lastComparison;
  const metrics = agentEconomy.metrics ?? {};
  const latestQuarter = agentEconomy.lastQuarterSummary;

  const totalDemand = round(priceRows.reduce((total, row) => total + row.demand, 0), 2);
  const totalSupply = round(priceRows.reduce((total, row) => total + row.supply, 0), 2);
  const activePriceRows = priceRows.filter((row) => row.activity > 0 || FOOD_COMMODITIES.has(row.commodity));

  return {
    day: Math.max(0, Math.floor(finite(agentEconomy.day))),
    mode: {
      requested: control.requestedMode,
      active: control.activeMode,
      authority: control.authority,
      canaryEligible: control.canaryEligible,
      safeStreak: control.consecutiveSafeQuarters,
      requiredSafeQuarters: control.requiredSafeQuarters,
      rollbackCount: control.rollbackCount,
      lastRollbackReason: control.lastRollbackReason,
      blockers: control.promotionBlockers,
      isLegacyOnly: control.activeMode === ENGINE_MODES.LEGACY,
    },
    householdStats,
    market: {
      totalDemand,
      totalSupply,
      netPressure: round(totalDemand - totalSupply, 2),
      rows: activePriceRows.slice(0, 10),
    },
    production: {
      rows: buildingRows.slice(0, 12),
      totalBuildings: buildingRows.length,
      staffed: buildingRows.filter((row) => row.status === "staffed").length,
      constrained: buildingRows.filter((row) => row.priority >= 2).length,
      idle: buildingRows.filter((row) => ["no-workers", "ruined", "input-shortage"].includes(row.status)).length,
      laborCoverage: round(nonNegative(agentEconomy.lastWorkforceSummary?.laborCoverage) * 100),
    },
    quarter: latestQuarter ? {
      produced: round(nonNegative(latestQuarter.produced), 1),
      consumed: round(nonNegative(latestQuarter.consumed), 1),
      unmetFood: round(nonNegative(latestQuarter.unmetFood), 1),
      tradeVolume: round(nonNegative(latestQuarter.tradeVolume), 1),
      failedOrders: round(nonNegative(latestQuarter.failedOrders), 0),
      idleBuildingDays: round(nonNegative(latestQuarter.idleBuildingDays), 0),
    } : null,
    lifetime: {
      trades: round(nonNegative(metrics.settledTrades), 0),
      tradeVolume: round(nonNegative(metrics.tradeVolume), 1),
      goodsProduced: round(nonNegative(metrics.goodsProduced), 1),
      unmetFood: round(nonNegative(metrics.unmetFood), 1),
    },
    comparison: comparison ? {
      safe: comparison.safe === true,
      turn: comparison.turn,
      season: comparison.season,
      criticalIssues: comparison.criticalIssues ?? [],
      warnings: comparison.warnings ?? [],
      legacyDeltas: comparison.legacyDeltas,
      agentDeltas: comparison.agentDeltas,
      accounting: comparison.accounting,
    } : null,
    narrative: createNarrative(agentEconomy, householdStats, priceRows, buildingRows, control),
  };
}
