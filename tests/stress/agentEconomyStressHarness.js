import { performance } from "node:perf_hooks";

import { initialState as legacyInitialState } from "../../src/engine/gameReducer.js";
import {
  createInitialAgentEconomy,
  createSeededRng,
  getAgentEconomyTotals,
  getCommodityPriceBounds,
  normalizeSeed,
  simulateAgentQuarter,
  validateHouseholds,
} from "../../src/engine/agentEconomy/index.js";
import { getEconomyMonitorViewModel } from "../../src/engine/agentEconomy/economyMonitorSelectors.js";

export const STRESS_SEED_COUNT = 100;
export const STRESS_QUARTERS = 40;
export const STRESS_DAYS = 1200;
export const DEFAULT_RUNTIME_GATE_MS_PER_QUARTER = 250;

const SEASONS = ["spring", "summer", "autumn", "winter"];
const MONEY_TOLERANCE = 0.05;
const INVENTORY_TOLERANCE = 0.1;

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function nonNegative(value) {
  return Math.max(0, finite(value));
}

function round(value, digits = 4) {
  return Number(finite(value).toFixed(digits));
}

function mean(values) {
  return values.length > 0
    ? values.reduce((total, value) => total + finite(value), 0) / values.length
    : 0;
}

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

function weightedGini(households = []) {
  const rows = households
    .map((household) => ({
      weight: Math.max(0, Math.floor(finite(household?.weight))),
      value: nonNegative(household?.cash) / Math.max(1, Math.floor(finite(household?.weight, 1))),
    }))
    .filter((row) => row.weight > 0);
  const population = rows.reduce((total, row) => total + row.weight, 0);
  const weightedWealth = rows.reduce((total, row) => total + row.weight * row.value, 0);
  if (population === 0 || weightedWealth === 0) return 0;

  let absoluteDifference = 0;
  for (const left of rows) {
    for (const right of rows) {
      absoluteDifference += left.weight * right.weight * Math.abs(left.value - right.value);
    }
  }
  return absoluteDifference / (2 * population * weightedWealth);
}

function inspectPrices(marketPrices = {}) {
  const rows = [];
  const criticalIssues = [];

  for (const [commodity, record] of Object.entries(marketPrices)) {
    const bounds = getCommodityPriceBounds(commodity);
    const referencePrice = Math.max(0.5, nonNegative(record?.referencePrice) || bounds.referencePrice);
    const lastPrice = nonNegative(record?.lastPrice);
    const ratio = lastPrice / referencePrice;
    const invalid = !Number.isFinite(record?.lastPrice)
      || lastPrice < bounds.floor - 0.01
      || lastPrice > bounds.ceiling + 0.01;
    if (invalid) criticalIssues.push(`price-out-of-bounds:${commodity}:${record?.lastPrice}`);
    rows.push({
      commodity,
      lastPrice: round(lastPrice, 2),
      referencePrice: round(referencePrice, 2),
      ratio: round(ratio, 4),
      floorHit: lastPrice <= bounds.floor + 0.01,
      ceilingHit: lastPrice >= bounds.ceiling - 0.01,
      inflation: ratio >= 3,
      crash: ratio <= 0.4,
    });
  }

  return {
    rows,
    criticalIssues,
    floorHits: rows.filter((row) => row.floorHit).map((row) => row.commodity),
    ceilingHits: rows.filter((row) => row.ceilingHit).map((row) => row.commodity),
    inflationCommodities: rows.filter((row) => row.inflation).map((row) => row.commodity),
    crashCommodities: rows.filter((row) => row.crash).map((row) => row.commodity),
    minRatio: round(Math.min(...rows.map((row) => row.ratio), 1), 4),
    maxRatio: round(Math.max(...rows.map((row) => row.ratio), 1), 4),
  };
}

function cloneBuildings(buildings = []) {
  return buildings.map((building) => typeof building === "string" ? building : { ...building });
}

export function generateStressSeeds(count = STRESS_SEED_COUNT, baseSeed = "agent-economy-step-9") {
  const targetCount = Math.max(1, Math.floor(count));
  const rng = createSeededRng(normalizeSeed(baseSeed));
  const seeds = new Set();
  while (seeds.size < targetCount) {
    const seed = Math.floor(rng.next() * 4294967296) >>> 0;
    seeds.add(seed || seeds.size + 1);
  }
  return [...seeds];
}

export function runStressSeed(seed, options = {}) {
  const quarters = Math.max(1, Math.floor(options.quarters ?? STRESS_QUARTERS));
  const population = Math.max(1, Math.floor(options.population ?? legacyInitialState.population));
  const buildings = cloneBuildings(options.buildings ?? legacyInitialState.buildings);
  const laborAllocation = {
    ...legacyInitialState.laborAllocation,
    ...(options.laborAllocation ?? {}),
  };
  const taxRate = options.taxRate ?? legacyInitialState.taxRate;
  const initial = createInitialAgentEconomy(population, { seed });
  const initialTotals = getAgentEconomyTotals(initial);
  let state = initial;
  let exception = null;
  const startedAt = performance.now();

  try {
    for (let turn = 1; turn <= quarters; turn += 1) {
      state = simulateAgentQuarter(state, {
        turn,
        season: SEASONS[(turn - 1) % SEASONS.length],
        taxRate,
        buildings,
        laborAllocation,
      });
    }
  } catch (error) {
    exception = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  const durationMs = performance.now() - startedAt;
  if (exception) {
    return {
      seed,
      completed: false,
      exception,
      durationMs: round(durationMs, 2),
      averageQuarterMs: round(durationMs / quarters, 4),
      criticalIssues: [`exception:${exception}`],
    };
  }

  const totals = getAgentEconomyTotals(state);
  const validation = validateHouseholds(state.households, population);
  const monitor = getEconomyMonitorViewModel({ agentEconomy: state });
  const priceInspection = inspectPrices(state.marketPrices);
  const criticalIssues = [...validation.errors, ...priceInspection.criticalIssues];

  const expectedDays = quarters * 30;
  if (state.day !== expectedDays) criticalIssues.push(`day-count:${state.day}/${expectedDays}`);
  if (state.metrics.quartersSimulated !== quarters) {
    criticalIssues.push(`quarter-count:${state.metrics.quartersSimulated}/${quarters}`);
  }
  if (totals.population !== population) criticalIssues.push(`population:${totals.population}/${population}`);

  const expectedCashDelta = round(
    nonNegative(state.metrics.grossIncome)
      - nonNegative(state.metrics.taxCollected)
      + nonNegative(state.metrics.welfarePaid),
    2,
  );
  const actualCashDelta = round(totals.cash - initialTotals.cash, 2);
  const cashAccountingError = round(actualCashDelta - expectedCashDelta, 2);
  if (Math.abs(cashAccountingError) > MONEY_TOLERANCE) {
    criticalIssues.push(`cash-accounting-error:${cashAccountingError}`);
  }

  const expectedInventoryDelta = round(
    nonNegative(state.metrics.goodsProduced)
      - nonNegative(state.metrics.productionInputsConsumed)
      - nonNegative(state.metrics.goodsConsumed),
    4,
  );
  const actualInventoryDelta = round(totals.totalInventory - initialTotals.totalInventory, 4);
  const inventoryAccountingError = round(actualInventoryDelta - expectedInventoryDelta, 4);
  if (Math.abs(inventoryAccountingError) > INVENTORY_TOLERANCE) {
    criticalIssues.push(`inventory-accounting-error:${inventoryAccountingError}`);
  }

  try {
    const serialized = JSON.parse(JSON.stringify(state));
    if (serialized.day !== state.day) criticalIssues.push("serialization-roundtrip-mismatch");
  } catch (error) {
    criticalIssues.push(`serialization-error:${error instanceof Error ? error.message : String(error)}`);
  }

  const households = state.households ?? [];
  const wealthGini = weightedGini(households);
  const noMarketActivity = nonNegative(state.metrics.settledTrades) === 0;
  const allBuildingsIdle = monitor.production.totalBuildings > 0
    && monitor.production.idle >= monitor.production.totalBuildings;
  const economicCollapse = monitor.householdStats.severePovertyRate >= 75
    || monitor.householdStats.foodStressRate >= 75
    || monitor.householdStats.averageHealth <= 25
    || allBuildingsIdle;

  return {
    seed,
    completed: criticalIssues.length === 0,
    exception: null,
    durationMs: round(durationMs, 2),
    averageQuarterMs: round(durationMs / quarters, 4),
    day: state.day,
    quarters: state.metrics.quartersSimulated,
    criticalIssues,
    accounting: {
      expectedCashDelta,
      actualCashDelta,
      cashAccountingError,
      expectedInventoryDelta,
      actualInventoryDelta,
      inventoryAccountingError,
    },
    population: totals.population,
    cash: totals.cash,
    inventory: totals.totalInventory,
    wealthGini: round(wealthGini, 4),
    householdStats: monitor.householdStats,
    production: monitor.production,
    market: {
      totalDemand: monitor.market.totalDemand,
      totalSupply: monitor.market.totalSupply,
      netPressure: monitor.market.netPressure,
      settledTrades: nonNegative(state.metrics.settledTrades),
      failedOrders: nonNegative(state.metrics.failedOrders),
      tradeVolume: nonNegative(state.metrics.tradeVolume),
      noMarketActivity,
      ...priceInspection,
    },
    balance: {
      economicCollapse,
      allBuildingsIdle,
      highPoverty: monitor.householdStats.povertyRate >= 50,
      severeFoodStress: monitor.householdStats.foodStressRate >= 50,
      highWealthConcentration: wealthGini >= 0.65,
      persistentShortages: nonNegative(state.metrics.inputShortageEvents) >= expectedDays,
    },
    metrics: {
      goodsProduced: nonNegative(state.metrics.goodsProduced),
      goodsConsumed: nonNegative(state.metrics.goodsConsumed),
      unmetFood: nonNegative(state.metrics.unmetFood),
      inputShortageEvents: nonNegative(state.metrics.inputShortageEvents),
      idleBuildingDays: nonNegative(state.metrics.idleBuildingDays),
      workerDaysRequired: nonNegative(state.metrics.workerDaysRequired),
      workerDaysAssigned: nonNegative(state.metrics.workerDaysAssigned),
    },
  };
}

function worstSeeds(runs, selector, count = 5) {
  return [...runs]
    .filter((run) => run.completed)
    .sort((left, right) => selector(right) - selector(left))
    .slice(0, count)
    .map((run) => ({ seed: run.seed, value: round(selector(run), 4) }));
}

export function summarizeStressRuns(runs, options = {}) {
  const runtimeGate = nonNegative(
    options.runtimeGateMsPerQuarter ?? DEFAULT_RUNTIME_GATE_MS_PER_QUARTER,
  );
  const completedRuns = runs.filter((run) => run.completed);
  const failedRuns = runs.filter((run) => !run.completed);
  const durations = runs.map((run) => nonNegative(run.durationMs));
  const quarterDurations = runs.map((run) => nonNegative(run.averageQuarterMs));
  const rate = (predicate) => runs.length > 0
    ? (runs.filter(predicate).length / runs.length) * 100
    : 0;
  const completedMean = (selector) => mean(completedRuns.map(selector));
  const runtimeGateExceeded = quarterDurations.some((value) => value > runtimeGate);

  const criticalFindings = [];
  if (failedRuns.length > 0) criticalFindings.push(`${failedRuns.length} seed runs failed hard invariants`);
  if (runtimeGateExceeded) criticalFindings.push(`runtime gate exceeded (${runtimeGate} ms/quarter)`);

  const balanceFindings = [];
  const collapseRate = rate((run) => run.balance?.economicCollapse);
  const highPovertyRate = rate((run) => run.balance?.highPoverty);
  const foodStressRate = rate((run) => run.balance?.severeFoodStress);
  const inflationRate = rate((run) => (run.market?.inflationCommodities?.length ?? 0) > 0);
  const crashRate = rate((run) => (run.market?.crashCommodities?.length ?? 0) > 0);
  const frozenMarketRate = rate((run) => run.market?.noMarketActivity);
  const concentratedRate = rate((run) => run.balance?.highWealthConcentration);

  if (collapseRate > 5) balanceFindings.push(`economic collapse in ${round(collapseRate, 1)}% of seeds`);
  if (highPovertyRate > 25) balanceFindings.push(`high poverty in ${round(highPovertyRate, 1)}% of seeds`);
  if (foodStressRate > 25) balanceFindings.push(`severe food stress in ${round(foodStressRate, 1)}% of seeds`);
  if (inflationRate > 10) balanceFindings.push(`extreme inflation in ${round(inflationRate, 1)}% of seeds`);
  if (crashRate > 10) balanceFindings.push(`price crash in ${round(crashRate, 1)}% of seeds`);
  if (frozenMarketRate > 10) balanceFindings.push(`market freeze in ${round(frozenMarketRate, 1)}% of seeds`);
  if (concentratedRate > 25) balanceFindings.push(`high wealth concentration in ${round(concentratedRate, 1)}% of seeds`);

  return {
    status: criticalFindings.length === 0 ? "pass" : "fail",
    balanceStatus: balanceFindings.length === 0 ? "stable" : "needs-calibration",
    requestedRuns: runs.length,
    completedRuns: completedRuns.length,
    failedRuns: failedRuns.length,
    completionRate: round(rate((run) => run.completed), 2),
    economicSurvivalRate: round(100 - collapseRate, 2),
    gameplayWinRate: null,
    gameplayWinRateReason: "No autonomous player strategy is executed by this economy-only harness.",
    runtime: {
      totalMs: round(durations.reduce((total, value) => total + value, 0), 2),
      meanRunMs: round(mean(durations), 2),
      p50RunMs: round(percentile(durations, 50), 2),
      p95RunMs: round(percentile(durations, 95), 2),
      maxRunMs: round(Math.max(...durations, 0), 2),
      meanQuarterMs: round(mean(quarterDurations), 4),
      p95QuarterMs: round(percentile(quarterDurations, 95), 4),
      maxQuarterMs: round(Math.max(...quarterDurations, 0), 4),
      gateMsPerQuarter: runtimeGate,
      gateExceeded: runtimeGateExceeded,
    },
    rates: {
      invariantFailure: round(rate((run) => !run.completed), 2),
      economicCollapse: round(collapseRate, 2),
      highPoverty: round(highPovertyRate, 2),
      severeFoodStress: round(foodStressRate, 2),
      highWealthConcentration: round(concentratedRate, 2),
      extremeInflation: round(inflationRate, 2),
      priceCrash: round(crashRate, 2),
      marketFreeze: round(frozenMarketRate, 2),
      persistentInputShortages: round(rate((run) => run.balance?.persistentShortages), 2),
      allBuildingsIdle: round(rate((run) => run.balance?.allBuildingsIdle), 2),
    },
    averages: {
      povertyRate: round(completedMean((run) => run.householdStats?.povertyRate), 2),
      severePovertyRate: round(completedMean((run) => run.householdStats?.severePovertyRate), 2),
      foodStressRate: round(completedMean((run) => run.householdStats?.foodStressRate), 2),
      employmentRate: round(completedMean((run) => run.householdStats?.employmentRate), 2),
      health: round(completedMean((run) => run.householdStats?.averageHealth), 2),
      satisfaction: round(completedMean((run) => run.householdStats?.averageSatisfaction), 2),
      wealthGini: round(completedMean((run) => run.wealthGini), 4),
      unmetFood: round(completedMean((run) => run.metrics?.unmetFood), 2),
      shortages: round(completedMean((run) => run.metrics?.inputShortageEvents), 2),
      idleBuildingDays: round(completedMean((run) => run.metrics?.idleBuildingDays), 2),
      trades: round(completedMean((run) => run.market?.settledTrades), 2),
    },
    criticalFindings,
    balanceFindings,
    failedSeeds: failedRuns.map((run) => ({
      seed: run.seed,
      exception: run.exception,
      criticalIssues: run.criticalIssues,
    })),
    worstSeeds: {
      poverty: worstSeeds(completedRuns, (run) => run.householdStats?.povertyRate ?? 0),
      foodStress: worstSeeds(completedRuns, (run) => run.householdStats?.foodStressRate ?? 0),
      unmetFood: worstSeeds(completedRuns, (run) => run.metrics?.unmetFood ?? 0),
      wealthConcentration: worstSeeds(completedRuns, (run) => run.wealthGini ?? 0),
      runtime: worstSeeds(completedRuns, (run) => run.averageQuarterMs ?? 0),
    },
  };
}

export function runAgentEconomyStress(options = {}) {
  const seedCount = Math.max(1, Math.floor(options.seedCount ?? STRESS_SEED_COUNT));
  const quarters = Math.max(1, Math.floor(options.quarters ?? STRESS_QUARTERS));
  const seeds = options.seeds ?? generateStressSeeds(seedCount, options.baseSeed);
  const runs = seeds.map((seed) => runStressSeed(seed, { ...options, quarters }));
  const summary = summarizeStressRuns(runs, options);

  return {
    generatedAt: new Date().toISOString(),
    configuration: {
      seedCount: seeds.length,
      quartersPerSeed: quarters,
      daysPerSeed: quarters * 30,
      totalQuarterSimulations: seeds.length * quarters,
      totalDaySimulations: seeds.length * quarters * 30,
      population: options.population ?? legacyInitialState.population,
      baseSeed: options.baseSeed ?? "agent-economy-step-9",
      runtimeGateMsPerQuarter: options.runtimeGateMsPerQuarter
        ?? DEFAULT_RUNTIME_GATE_MS_PER_QUARTER,
    },
    summary,
    runs,
  };
}
