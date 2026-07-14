import { consumeHousehold, updateHouseholdNeeds } from "./consumptionSystem.js";
import { generateHouseholdOrderIntents, previewOrderMatches } from "./orderIntentSystem.js";
import { produceHousehold } from "./productionSystem.js";
import { createSeededRng, DEFAULT_AGENT_ECONOMY_SEED, normalizeSeed } from "./seededRng.js";
import { settleOrderBooks } from "./tradeSettlement.js";
import {
  applyHouseholdTaxAndWelfare,
  payHouseholdIncome,
  updateHouseholdWellbeing,
} from "./welfareSystem.js";

export const AGENT_DAYS_PER_QUARTER = 30;
export const DAILY_PIPELINE = [
  "production",
  "needs",
  "order-generation",
  "market-settlement",
  "consumption",
  "income",
  "tax-and-welfare",
  "wellbeing",
];

function safeMetric(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function sumObjectValues(object) {
  return Object.values(object ?? {}).reduce((total, value) => total + safeMetric(value), 0);
}

function createMetrics(metrics = {}) {
  return {
    totalTrades: safeMetric(metrics.totalTrades),
    failedTrades: safeMetric(metrics.failedTrades),
    daysSimulated: safeMetric(metrics.daysSimulated),
    quartersSimulated: safeMetric(metrics.quartersSimulated),
    goodsProduced: safeMetric(metrics.goodsProduced),
    goodsConsumed: safeMetric(metrics.goodsConsumed),
    unmetFood: safeMetric(metrics.unmetFood),
    ordersGenerated: safeMetric(metrics.ordersGenerated),
    potentialMatches: safeMetric(metrics.potentialMatches),
    potentialMatchVolume: safeMetric(metrics.potentialMatchVolume),
    settledTrades: safeMetric(metrics.settledTrades),
    failedOrders: safeMetric(metrics.failedOrders),
    tradeVolume: safeMetric(metrics.tradeVolume),
    tradeValue: safeMetric(metrics.tradeValue),
    grossIncome: safeMetric(metrics.grossIncome),
    taxCollected: safeMetric(metrics.taxCollected),
    welfarePaid: safeMetric(metrics.welfarePaid),
  };
}

function addMetric(metrics, key, value) {
  return {
    ...metrics,
    [key]: Number((safeMetric(metrics[key]) + safeMetric(value)).toFixed(2)),
  };
}

function aggregateProduction(households, rng, context) {
  const producedByCommodity = {};
  let totalProduced = 0;
  const nextHouseholds = households.map((household) => {
    const result = produceHousehold(household, rng, context);
    totalProduced += result.totalProduced;
    for (const [commodity, amount] of Object.entries(result.produced)) {
      producedByCommodity[commodity] = (producedByCommodity[commodity] ?? 0) + amount;
    }
    return result.household;
  });
  return { households: nextHouseholds, producedByCommodity, totalProduced };
}

function aggregateConsumption(households, rng, context) {
  const consumedByCommodity = {};
  let totalConsumed = 0;
  let unmetFood = 0;
  const unmetFoodByHousehold = {};
  const nextHouseholds = households.map((household) => {
    const result = consumeHousehold(household, rng, context);
    totalConsumed += result.totalConsumed;
    unmetFood += result.unmetFood;
    unmetFoodByHousehold[household.id] = result.unmetFood;
    for (const [commodity, amount] of Object.entries(result.consumed)) {
      consumedByCommodity[commodity] = (consumedByCommodity[commodity] ?? 0) + amount;
    }
    return result.household;
  });
  return { households: nextHouseholds, consumedByCommodity, totalConsumed, unmetFood, unmetFoodByHousehold };
}

/**
 * Runs one compressed economic day. This is a pure, headless shadow simulation.
 * The supplied RNG is the only source of randomness.
 */
export function simulateAgentDay(state, rng, context = {}) {
  if (!rng || typeof rng.next !== "function") {
    throw new TypeError("simulateAgentDay requires a seeded RNG");
  }

  const currentDay = Math.max(0, Math.floor(state?.day ?? 0));
  const day = currentDay + 1;
  const dayContext = { ...context, day };
  let households = Array.isArray(state?.households)
    ? state.households.map((household) => ({ ...household, inventory: { ...household.inventory }, needs: { ...household.needs } }))
    : [];

  const production = aggregateProduction(households, rng, dayContext);
  households = production.households;

  households = households.map((household) => updateHouseholdNeeds(household, dayContext));

  const orders = generateHouseholdOrderIntents(households, dayContext);
  const marketPreview = previewOrderMatches(orders);
  const market = settleOrderBooks(households, orders);
  households = market.households;

  const consumption = aggregateConsumption(households, rng, dayContext);
  households = consumption.households;

  let grossIncome = 0;
  const incomeByHousehold = {};
  households = households.map((household) => {
    const result = payHouseholdIncome(household);
    grossIncome += result.grossIncome;
    incomeByHousehold[household.id] = result.grossIncome;
    return result.household;
  });

  let taxCollected = 0;
  let welfarePaid = 0;
  households = households.map((household) => {
    const result = applyHouseholdTaxAndWelfare(household, {
      ...dayContext,
      grossIncome: incomeByHousehold[household.id] ?? 0,
    });
    taxCollected += result.taxPaid;
    welfarePaid += result.welfarePaid;
    return result.household;
  });

  households = households.map((household) => updateHouseholdWellbeing(household, {
    ...dayContext,
    unmetFood: consumption.unmetFoodByHousehold[household.id] ?? 0,
  }));

  let metrics = createMetrics(state?.metrics);
  metrics = addMetric(metrics, "daysSimulated", 1);
  metrics = addMetric(metrics, "goodsProduced", production.totalProduced);
  metrics = addMetric(metrics, "goodsConsumed", consumption.totalConsumed);
  metrics = addMetric(metrics, "unmetFood", consumption.unmetFood);
  metrics = addMetric(metrics, "ordersGenerated", orders.length);
  metrics = addMetric(metrics, "potentialMatches", marketPreview.potentialMatches);
  metrics = addMetric(metrics, "potentialMatchVolume", marketPreview.potentialVolume);
  metrics = addMetric(metrics, "settledTrades", market.summary.settledTrades);
  metrics = addMetric(metrics, "failedOrders", market.summary.failedOrders);
  metrics = addMetric(metrics, "totalTrades", market.summary.settledTrades);
  metrics = addMetric(metrics, "failedTrades", market.summary.failedOrders);
  metrics = addMetric(metrics, "tradeVolume", market.summary.tradeVolume);
  metrics = addMetric(metrics, "tradeValue", market.summary.tradeValue);
  metrics = addMetric(metrics, "grossIncome", grossIncome);
  metrics = addMetric(metrics, "taxCollected", taxCollected);
  metrics = addMetric(metrics, "welfarePaid", welfarePaid);

  const summary = {
    day,
    turn: context.turn ?? null,
    season: context.season ?? null,
    pipeline: [...DAILY_PIPELINE],
    produced: production.producedByCommodity,
    consumed: consumption.consumedByCommodity,
    totalProduced: production.totalProduced,
    totalConsumed: consumption.totalConsumed,
    unmetFood: consumption.unmetFood,
    ordersGenerated: orders.length,
    orderSummary: market.summary.orderSummary,
    potentialMatches: marketPreview.potentialMatches,
    potentialMatchVolume: marketPreview.potentialVolume,
    settledTrades: market.summary.settledTrades,
    failedOrders: market.summary.failedOrders,
    tradeVolume: market.summary.tradeVolume,
    tradeValue: market.summary.tradeValue,
    tradedCommodities: market.summary.tradedCommodities,
    grossIncome: Number(grossIncome.toFixed(2)),
    taxCollected: Number(taxCollected.toFixed(2)),
    welfarePaid: Number(welfarePaid.toFixed(2)),
  };

  return {
    ...state,
    day,
    households,
    pendingOrders: market.failedOrders.slice(-500),
    lastTrades: market.trades.slice(-100),
    lastDailySummary: summary,
    dailyHistory: [...(state?.dailyHistory ?? []), summary].slice(-60),
    metrics,
  };
}

export function simulateAgentQuarter(agentEconomy, context = {}) {
  const days = Math.max(1, Math.floor(context.days ?? AGENT_DAYS_PER_QUARTER));
  const seed = normalizeSeed(agentEconomy?.rngState ?? agentEconomy?.rngSeed ?? DEFAULT_AGENT_ECONOMY_SEED);
  const rng = createSeededRng(seed);
  const startMetrics = createMetrics(agentEconomy?.metrics);
  const startDay = Math.max(0, Math.floor(agentEconomy?.day ?? 0));
  let state = {
    ...agentEconomy,
    rngSeed: normalizeSeed(agentEconomy?.rngSeed ?? DEFAULT_AGENT_ECONOMY_SEED),
    rngState: seed,
    metrics: startMetrics,
    households: Array.isArray(agentEconomy?.households) ? agentEconomy.households : [],
  };

  for (let index = 0; index < days; index += 1) {
    state = simulateAgentDay(state, rng, context);
  }

  const endMetrics = createMetrics(state.metrics);
  const quarterSummary = {
    turn: context.turn ?? null,
    season: context.season ?? null,
    startDay: startDay + 1,
    endDay: state.day,
    days,
    produced: Number((endMetrics.goodsProduced - startMetrics.goodsProduced).toFixed(2)),
    consumed: Number((endMetrics.goodsConsumed - startMetrics.goodsConsumed).toFixed(2)),
    unmetFood: Number((endMetrics.unmetFood - startMetrics.unmetFood).toFixed(2)),
    ordersGenerated: Number((endMetrics.ordersGenerated - startMetrics.ordersGenerated).toFixed(2)),
    potentialMatches: Number((endMetrics.potentialMatches - startMetrics.potentialMatches).toFixed(2)),
    settledTrades: Number((endMetrics.settledTrades - startMetrics.settledTrades).toFixed(2)),
    failedOrders: Number((endMetrics.failedOrders - startMetrics.failedOrders).toFixed(2)),
    tradeVolume: Number((endMetrics.tradeVolume - startMetrics.tradeVolume).toFixed(2)),
    tradeValue: Number((endMetrics.tradeValue - startMetrics.tradeValue).toFixed(2)),
    grossIncome: Number((endMetrics.grossIncome - startMetrics.grossIncome).toFixed(2)),
    taxCollected: Number((endMetrics.taxCollected - startMetrics.taxCollected).toFixed(2)),
    welfarePaid: Number((endMetrics.welfarePaid - startMetrics.welfarePaid).toFixed(2)),
  };

  return {
    ...state,
    rngState: rng.snapshot(),
    lastQuarterSummary: quarterSummary,
    quarterHistory: [...(agentEconomy?.quarterHistory ?? []), quarterSummary].slice(-40),
    metrics: addMetric(endMetrics, "quartersSimulated", 1),
  };
}

export function getAgentEconomyTotals(agentEconomy) {
  const households = agentEconomy?.households ?? [];
  const inventory = households.reduce((totals, household) => {
    for (const [commodity, amount] of Object.entries(household.inventory ?? {})) {
      totals[commodity] = (totals[commodity] ?? 0) + safeMetric(amount);
    }
    return totals;
  }, {});

  return {
    households: households.length,
    population: households.reduce((total, household) => total + Math.max(0, Math.floor(household.weight ?? 0)), 0),
    cash: Number(households.reduce((total, household) => total + safeMetric(household.cash), 0).toFixed(2)),
    inventory,
    totalInventory: sumObjectValues(inventory),
  };
}
