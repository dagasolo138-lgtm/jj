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

function ratio(numerator, denominator, fallback = 0) {
  return denominator > 0 ? numerator / denominator : fallback;
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
    const referencePrice = Math.max(0.5, nonNegative(record?.referencePrice) || bounds.reference);
    const lastPrice = nonNegative(record?.lastPrice);
    const priceRatio = lastPrice / referencePrice;
    const invalid = !Number.isFinite(record?.lastPrice)
      || lastPrice < bounds.floor - 0.01
      || lastPrice > bounds.ceiling + 0.01;
    if (invalid) criticalIssues.push(`price-out-of-bounds:${commodity}:${record?.lastPrice}`);
    rows.push({
      commodity,
      lastPrice: round(lastPrice, 2),
      referencePrice: round(referencePrice, 2),
      ratio: round(priceRatio, 4),
      floorHit: lastPrice <= bounds.floor + 0.01,
      ceilingHit: lastPrice >= bounds.ceiling - 0.01,
      inflation: priceRatio >= 3,
      crash: priceRatio <= 0.4,
    });
  }

  const ratios = rows.map((row) => row.ratio);
  return {
    rows,
    criticalIssues,
    floorHits: rows.filter((row) => row.floorHit).map((row) => row.commodity),
    ceilingHits: rows.filter((row) => row.ceilingHit).map((row) => row.commodity),
    inflationCommodities: rows.filter((row) => row.inflation).map((row) => row.commodity),
    crashCommodities: rows.filter((row) => row.crash).map((row) => row.commodity),
    minRatio: round(ratios.length > 0 ? Math.min(...ratios) : 1, 4),
    maxRatio: round(ratios.length > 0 ? Math.max(...ratios) : 1, 4),
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
  const initial = createInitialAgentEconomy(population, {
    seed,
    estateInventory: options.estateInventory ?? legacyInitialState.inventory,
  });
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
  const foodConsumed = nonNegative(state.metrics.foodConsumed);
  const unmetFood = nonNegative(state.metrics.unmetFood);
  const foodDemand = foodConsumed + unmetFood;
  const foodFulfillmentRate = ratio(foodConsumed, foodDemand, 1) * 100;
  const settledTrades = nonNegative(state.metrics.settledTrades);
  const failedOrders = nonNegative(state.metrics.failedOrders);
  const tradeVolume = nonNegative(state.metrics.tradeVolume);
  const tradesPerDay = ratio(settledTrades, expectedDays);
  const tradeVolumePerDay = ratio(tradeVolume, expectedDays);
  const buildingDays = expectedDays * buildings.length;
  const inputShortageEvents = nonNegative(state.metrics.inputShortageEvents);
  const idleBuildingDays = nonNegative(state.metrics.idleBuildingDays);
  const shortageEventRate = ratio(inputShortageEvents, buildingDays) * 100;
  const idleBuildingRate = ratio(idleBuildingDays, buildingDays) * 100;
  const workerCoverageRate = ratio(
    nonNegative(state.metrics.workerDaysAssigned),
    nonNegative(state.metrics.workerDaysRequired),
    1,
  ) * 100;
  const noMarketActivity = settledTrades === 0;
  const lowMarketLiquidity = tradesPerDay < 0.05;
  const allBuildingsIdle = monitor.production.totalBuildings > 0
    && monitor.production.idle >= monitor.production.totalBuildings;
  const lowFoodFulfillment = foodFulfillmentRate < 75;
  const criticalFoodFulfillment = foodFulfillmentRate < 25;
  const underemployment = monitor.householdStats.employmentRate < 60;
  const chronicInputShortages = shortageEventRate > 25;
  const highIdleBuildingRate = idleBuildingRate > 25;
  const economicCollapse = criticalFoodFulfillment
    || monitor.householdStats.severePovertyRate >= 75
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
    production: {
      ...monitor.production,
      buildingDays,
      shortageEventRate: round(shortageEventRate, 2),
      idleBuildingRate: round(idleBuildingRate, 2),
      workerCoverageRate: round(workerCoverageRate, 2),
    },
    food: {
      consumed: round(foodConsumed, 2),
      unmet: round(unmetFood, 2),
      demand: round(foodDemand, 2),
      fulfillmentRate: round(foodFulfillmentRate, 2),
    },
    market: {
      totalDemand: monitor.market.totalDemand,
      totalSupply: monitor.market.totalSupply,
      netPressure: monitor.market.netPressure,
      settledTrades,
      failedOrders,
      tradeVolume,
      tradesPerDay: round(tradesPerDay, 4),
      tradeVolumePerDay: round(tradeVolumePerDay, 4),
      noMarketActivity,
      lowMarketLiquidity,
      ...priceInspection,
    },
    balance: {
      economicCollapse,
      allBuildingsIdle,
      highPoverty: monitor.householdStats.povertyRate >= 50,
      severeEndpointFoodStress: monitor.householdStats.foodStressRate >= 50,
      lowFoodFulfillment,
      criticalFoodFulfillment,
      underemployment,
      lowMarketLiquidity,
      highWealthConcentration: wealthGini >= 0.65,
      chronicInputShortages,
      highIdleBuildingRate,
    },
    metrics: {
      goodsProduced: nonNegative(state.metrics.goodsProduced),
      goodsConsumed: nonNegative(state.metrics.goodsConsumed),
      foodConsumed,
      unmetFood,
      inputShortageEvents,
      idleBuildingDays,
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

function lowestSeeds(runs, selector, count = 5) {
  return [...runs]
    .filter((run) => run.completed)
    .sort((left, right) => selector(left) - selector(right))
    .slice(0, count)
    .map((run) => ({ seed: run.seed, value: round(selector(run), 4) }));
}

function summarizeCommodityPrices(completedRuns) {
  const stats = new Map();
  for (const run of completedRuns) {
    for (const row of run.market?.rows ?? []) {
      const entry = stats.get(row.commodity) ?? {
        ratios: [],
        inflationRuns: 0,
        crashRuns: 0,
        floorHits: 0,
        ceilingHits: 0,
      };
      entry.ratios.push(row.ratio);
      entry.inflationRuns += row.inflation ? 1 : 0;
      entry.crashRuns += row.crash ? 1 : 0;
      entry.floorHits += row.floorHit ? 1 : 0;
      entry.ceilingHits += row.ceilingHit ? 1 : 0;
      stats.set(row.commodity, entry);
    }
  }

  return Object.fromEntries([...stats.entries()].map(([commodity, entry]) => [commodity, {
    meanRatio: round(mean(entry.ratios), 4),
    minRatio: round(Math.min(...entry.ratios), 4),
    maxRatio: round(Math.max(...entry.ratios), 4),
    inflationRate: round(ratio(entry.inflationRuns, completedRuns.length) * 100, 2),
    crashRate: round(ratio(entry.crashRuns, completedRuns.length) * 100, 2),
    floorHitRate: round(ratio(entry.floorHits, completedRuns.length) * 100, 2),
    ceilingHitRate: round(ratio(entry.ceilingHits, completedRuns.length) * 100, 2),
  }]));
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

  const collapseRate = rate((run) => run.balance?.economicCollapse);
  const highPovertyRate = rate((run) => run.balance?.highPoverty);
  const endpointFoodStressRate = rate((run) => run.balance?.severeEndpointFoodStress);
  const lowFoodFulfillmentRate = rate((run) => run.balance?.lowFoodFulfillment);
  const criticalFoodFulfillmentRate = rate((run) => run.balance?.criticalFoodFulfillment);
  const underemploymentRate = rate((run) => run.balance?.underemployment);
  const lowLiquidityRate = rate((run) => run.balance?.lowMarketLiquidity);
  const chronicShortageRate = rate((run) => run.balance?.chronicInputShortages);
  const highIdleRate = rate((run) => run.balance?.highIdleBuildingRate);
  const inflationRate = rate((run) => (run.market?.inflationCommodities?.length ?? 0) > 0);
  const crashRate = rate((run) => (run.market?.crashCommodities?.length ?? 0) > 0);
  const frozenMarketRate = rate((run) => run.market?.noMarketActivity);
  const concentratedRate = rate((run) => run.balance?.highWealthConcentration);
  const balanceFindings = [];

  if (collapseRate > 5) balanceFindings.push(`economic collapse in ${round(collapseRate, 1)}% of seeds`);
  if (lowFoodFulfillmentRate > 10) {
    balanceFindings.push(`food fulfillment below 75% in ${round(lowFoodFulfillmentRate, 1)}% of seeds`);
  }
  if (criticalFoodFulfillmentRate > 5) {
    balanceFindings.push(`food fulfillment below 25% in ${round(criticalFoodFulfillmentRate, 1)}% of seeds`);
  }
  if (underemploymentRate > 25) balanceFindings.push(`underemployment in ${round(underemploymentRate, 1)}% of seeds`);
  if (lowLiquidityRate > 10) balanceFindings.push(`low market liquidity in ${round(lowLiquidityRate, 1)}% of seeds`);
  if (chronicShortageRate > 25) balanceFindings.push(`chronic input shortages in ${round(chronicShortageRate, 1)}% of seeds`);
  if (highIdleRate > 25) balanceFindings.push(`high building idle rate in ${round(highIdleRate, 1)}% of seeds`);
  if (highPovertyRate > 25) balanceFindings.push(`high endpoint poverty in ${round(highPovertyRate, 1)}% of seeds`);
  if (endpointFoodStressRate > 25) {
    balanceFindings.push(`high endpoint food stress in ${round(endpointFoodStressRate, 1)}% of seeds`);
  }
  if (inflationRate > 10) balanceFindings.push(`extreme inflation in ${round(inflationRate, 1)}% of seeds`);
  if (crashRate > 10) balanceFindings.push(`price crash in ${round(crashRate, 1)}% of seeds`);
  if (frozenMarketRate > 10) balanceFindings.push(`zero-trade market in ${round(frozenMarketRate, 1)}% of seeds`);
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
      severeEndpointFoodStress: round(endpointFoodStressRate, 2),
      lowFoodFulfillment: round(lowFoodFulfillmentRate, 2),
      criticalFoodFulfillment: round(criticalFoodFulfillmentRate, 2),
      underemployment: round(underemploymentRate, 2),
      lowMarketLiquidity: round(lowLiquidityRate, 2),
      chronicInputShortages: round(chronicShortageRate, 2),
      highIdleBuildingRate: round(highIdleRate, 2),
      highWealthConcentration: round(concentratedRate, 2),
      extremeInflation: round(inflationRate, 2),
      priceCrash: round(crashRate, 2),
      marketFreeze: round(frozenMarketRate, 2),
      allBuildingsIdle: round(rate((run) => run.balance?.allBuildingsIdle), 2),
    },
    averages: {
      povertyRate: round(completedMean((run) => run.householdStats?.povertyRate), 2),
      severePovertyRate: round(completedMean((run) => run.householdStats?.severePovertyRate), 2),
      endpointFoodStressRate: round(completedMean((run) => run.householdStats?.foodStressRate), 2),
      employmentRate: round(completedMean((run) => run.householdStats?.employmentRate), 2),
      health: round(completedMean((run) => run.householdStats?.averageHealth), 2),
      satisfaction: round(completedMean((run) => run.householdStats?.averageSatisfaction), 2),
      wealthGini: round(completedMean((run) => run.wealthGini), 4),
      foodConsumed: round(completedMean((run) => run.food?.consumed), 2),
      unmetFood: round(completedMean((run) => run.food?.unmet), 2),
      foodDemand: round(completedMean((run) => run.food?.demand), 2),
      foodFulfillmentRate: round(completedMean((run) => run.food?.fulfillmentRate), 2),
      shortageEventRate: round(completedMean((run) => run.production?.shortageEventRate), 2),
      idleBuildingRate: round(completedMean((run) => run.production?.idleBuildingRate), 2),
      workerCoverageRate: round(completedMean((run) => run.production?.workerCoverageRate), 2),
      trades: round(completedMean((run) => run.market?.settledTrades), 2),
      tradesPerDay: round(completedMean((run) => run.market?.tradesPerDay), 4),
      tradeVolumePerDay: round(completedMean((run) => run.market?.tradeVolumePerDay), 4),
      failedOrders: round(completedMean((run) => run.market?.failedOrders), 2),
    },
    priceByCommodity: summarizeCommodityPrices(completedRuns),
    criticalFindings,
    balanceFindings,
    failedSeeds: failedRuns.map((run) => ({
      seed: run.seed,
      exception: run.exception,
      criticalIssues: run.criticalIssues,
    })),
    worstSeeds: {
      poverty: worstSeeds(completedRuns, (run) => run.householdStats?.povertyRate ?? 0),
      foodFulfillment: lowestSeeds(completedRuns, (run) => run.food?.fulfillmentRate ?? 100),
      unmetFood: worstSeeds(completedRuns, (run) => run.food?.unmet ?? 0),
      idleBuildingRate: worstSeeds(completedRuns, (run) => run.production?.idleBuildingRate ?? 0),
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
