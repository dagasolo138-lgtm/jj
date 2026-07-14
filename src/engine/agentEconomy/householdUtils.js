import {
  AGENT_ECONOMY_SCHEMA_VERSION,
  DEFAULT_MAX_HOUSEHOLDS,
  HOUSEHOLD_COMMODITIES,
  createHousehold,
  createInitialAgentEconomy,
  normalizeHousehold,
} from "./householdFactory.js";
import { normalizeEngineControl } from "./engineControlSystem.js";
import { createInitialMarketPrices } from "./priceBeliefSystem.js";
import { DEFAULT_AGENT_ECONOMY_SEED, normalizeSeed } from "./seededRng.js";

function toPopulation(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function toNonNegativeNumber(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function nextIdNumber(agentEconomy, households) {
  const configured = Number.isFinite(agentEconomy?.nextHouseholdId)
    ? Math.max(1, Math.floor(agentEconomy.nextHouseholdId))
    : 1;
  const highestExisting = households.reduce((highest, household) => {
    const match = /^hh-(\d+)$/.exec(household.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return Math.max(configured, highestExisting + 1);
}

export function getHouseholdPopulation(households) {
  return (households ?? []).reduce((total, household) =>
    total + Math.max(0, Math.floor(household?.weight ?? 0)), 0);
}

export function validateHouseholds(households, expectedPopulation = null) {
  const errors = [];
  const ids = new Set();

  if (!Array.isArray(households)) {
    return { valid: false, errors: ["households must be an array"], population: 0 };
  }

  households.forEach((household, index) => {
    if (!household || typeof household !== "object") {
      errors.push(`household ${index} is not an object`);
      return;
    }
    if (typeof household.id !== "string" || household.id.length === 0) {
      errors.push(`household ${index} has no id`);
    } else if (ids.has(household.id)) {
      errors.push(`duplicate household id: ${household.id}`);
    } else {
      ids.add(household.id);
    }
    if (!Number.isInteger(household.weight) || household.weight < 1) {
      errors.push(`household ${household.id || index} has invalid weight`);
    }
    if (!Number.isFinite(household.cash) || household.cash < 0) {
      errors.push(`household ${household.id || index} has invalid cash`);
    }
    if (!household.inventory || typeof household.inventory !== "object") {
      errors.push(`household ${household.id || index} has no inventory`);
    } else if (Object.values(household.inventory).some((amount) => !Number.isFinite(amount) || amount < 0)) {
      errors.push(`household ${household.id || index} has invalid inventory quantity`);
    }
    if (!household.priceBeliefs || typeof household.priceBeliefs !== "object") {
      errors.push(`household ${household.id || index} has no price beliefs`);
    }
    if (!Array.isArray(household.workAssignments)) {
      errors.push(`household ${household.id || index} has invalid work assignments`);
    }
    if (!Number.isFinite(household.assignedWorkers) || household.assignedWorkers < 0
      || household.assignedWorkers > household.weight) {
      errors.push(`household ${household.id || index} has invalid assigned workers`);
    }
  });

  const population = getHouseholdPopulation(households);
  if (expectedPopulation != null && population !== toPopulation(expectedPopulation)) {
    errors.push(`household population ${population} does not match ${toPopulation(expectedPopulation)}`);
  }

  return { valid: errors.length === 0, errors, population };
}

function sanitizeMetrics(metrics = {}) {
  const keys = [
    "totalTrades",
    "failedTrades",
    "daysSimulated",
    "quartersSimulated",
    "goodsProduced",
    "goodsConsumed",
    "foodConsumed",
    "productionInputsConsumed",
    "unmetFood",
    "ordersGenerated",
    "potentialMatches",
    "potentialMatchVolume",
    "settledTrades",
    "failedOrders",
    "tradeVolume",
    "tradeValue",
    "beliefAdjustments",
    "priceIncreases",
    "priceDecreases",
    "workerDaysRequired",
    "workerDaysAssigned",
    "idleBuildingDays",
    "inputShortageEvents",
    "grossIncome",
    "taxCollected",
    "welfarePaid",
  ];
  return Object.fromEntries(keys.map((key) => [
    key,
    ["daysSimulated", "quartersSimulated"].includes(key)
      ? toPopulation(metrics[key])
      : toNonNegativeNumber(metrics[key]),
  ]));
}

function sanitizeMarketPrices(marketPrices) {
  const defaults = createInitialMarketPrices(HOUSEHOLD_COMMODITIES);
  const source = marketPrices && typeof marketPrices === "object" ? marketPrices : {};
  const normalized = {};

  for (const commodity of HOUSEHOLD_COMMODITIES) {
    const fallback = defaults[commodity];
    const record = source[commodity] && typeof source[commodity] === "object"
      ? source[commodity]
      : {};
    const lastPrice = toNonNegativeNumber(record.lastPrice) || fallback.lastPrice;
    const previousPrice = toNonNegativeNumber(record.previousPrice) || lastPrice;
    const averagePrice = toNonNegativeNumber(record.averagePrice) || lastPrice;
    normalized[commodity] = {
      ...fallback,
      ...record,
      commodity,
      referencePrice: toNonNegativeNumber(record.referencePrice) || fallback.referencePrice,
      previousPrice,
      lastPrice,
      averagePrice,
      low: toNonNegativeNumber(record.low) || lastPrice,
      high: toNonNegativeNumber(record.high) || lastPrice,
      volume: toNonNegativeNumber(record.volume),
      tradeCount: toPopulation(record.tradeCount),
      bidVolume: toNonNegativeNumber(record.bidVolume),
      askVolume: toNonNegativeNumber(record.askVolume),
      failedBidVolume: toNonNegativeNumber(record.failedBidVolume),
      failedAskVolume: toNonNegativeNumber(record.failedAskVolume),
      changePct: Number.isFinite(record.changePct) ? Number(record.changePct) : 0,
      trend: ["up", "down", "flat"].includes(record.trend) ? record.trend : "flat",
      lastUpdatedDay: toPopulation(record.lastUpdatedDay),
      history: Array.isArray(record.history)
        ? record.history.filter((value) => Number.isFinite(value) && value >= 0.5).slice(-40)
        : fallback.history,
    };
  }

  return normalized;
}

function sanitizeAgentEconomy(savedAgentEconomy) {
  const source = savedAgentEconomy && typeof savedAgentEconomy === "object"
    ? savedAgentEconomy
    : {};
  const maxHouseholds = Number.isFinite(source.maxHouseholds)
    ? Math.max(1, Math.floor(source.maxHouseholds))
    : DEFAULT_MAX_HOUSEHOLDS;
  const rawHouseholds = Array.isArray(source.households) ? source.households : [];
  const seenIds = new Set();
  const households = [];

  rawHouseholds.slice(0, maxHouseholds).forEach((household, index) => {
    const normalized = normalizeHousehold(household, index);
    let id = normalized.id;
    if (seenIds.has(id)) id = `hh-${String(index + 1).padStart(6, "0")}`;
    seenIds.add(id);
    households.push({ ...normalized, id });
  });

  const rngSeed = normalizeSeed(source.rngSeed ?? DEFAULT_AGENT_ECONOMY_SEED);
  const rngState = normalizeSeed(source.rngState ?? rngSeed, rngSeed);

  return {
    schemaVersion: AGENT_ECONOMY_SCHEMA_VERSION,
    enabled: source.enabled === true,
    shadowMode: source.shadowMode !== false,
    engineControl: normalizeEngineControl(source.engineControl),
    maxHouseholds,
    nextHouseholdId: nextIdNumber(source, households),
    lastReconciledPopulation: toPopulation(source.lastReconciledPopulation),
    inventoryAdapterVersion: toPopulation(source.inventoryAdapterVersion),
    inventorySeededFromEstate: source.inventorySeededFromEstate === true,
    households,
    rngSeed,
    rngState,
    day: toPopulation(source.day),
    pendingOrders: Array.isArray(source.pendingOrders) ? source.pendingOrders.slice(-500) : [],
    lastTrades: Array.isArray(source.lastTrades) ? source.lastTrades.slice(-100) : [],
    marketPrices: sanitizeMarketPrices(source.marketPrices),
    lastBeliefUpdates: Array.isArray(source.lastBeliefUpdates)
      ? source.lastBeliefUpdates.slice(-200)
      : [],
    beliefUpdateHistory: Array.isArray(source.beliefUpdateHistory)
      ? source.beliefUpdateHistory.slice(-60)
      : [],
    lastWorkforceSummary: source.lastWorkforceSummary && typeof source.lastWorkforceSummary === "object"
      ? source.lastWorkforceSummary
      : null,
    lastBuildingProduction: Array.isArray(source.lastBuildingProduction)
      ? source.lastBuildingProduction.slice(-100)
      : [],
    lastDailySummary: source.lastDailySummary && typeof source.lastDailySummary === "object"
      ? source.lastDailySummary
      : null,
    lastQuarterSummary: source.lastQuarterSummary && typeof source.lastQuarterSummary === "object"
      ? source.lastQuarterSummary
      : null,
    dailyHistory: Array.isArray(source.dailyHistory) ? source.dailyHistory.slice(-60) : [],
    quarterHistory: Array.isArray(source.quarterHistory) ? source.quarterHistory.slice(-40) : [],
    metrics: sanitizeMetrics(source.metrics),
  };
}

export function reconcileAgentEconomyPopulation(agentEconomy, population, options = {}) {
  const targetPopulation = toPopulation(population);
  const sanitized = sanitizeAgentEconomy(agentEconomy);
  const maxHouseholds = Math.max(1, Math.floor(options.maxHouseholds ?? sanitized.maxHouseholds));
  let households = sanitized.households
    .slice(0, maxHouseholds)
    .map((household) => ({ ...household }));
  let nextHouseholdId = nextIdNumber(sanitized, households);

  if (targetPopulation === 0) {
    return {
      ...sanitized,
      maxHouseholds,
      households: [],
      nextHouseholdId,
      lastReconciledPopulation: 0,
    };
  }

  if (households.length === 0) {
    const created = createInitialAgentEconomy(targetPopulation, {
      maxHouseholds,
      createdTurn: options.createdTurn ?? 0,
      origin: options.origin ?? "migration",
      seed: sanitized.rngSeed,
      estateInventory: options.estateInventory,
    });
    return {
      ...created,
      enabled: sanitized.enabled,
      shadowMode: sanitized.shadowMode,
      engineControl: sanitized.engineControl,
      rngSeed: sanitized.rngSeed,
      rngState: sanitized.rngState,
      day: sanitized.day,
      pendingOrders: sanitized.pendingOrders,
      lastTrades: sanitized.lastTrades,
      marketPrices: sanitized.marketPrices,
      lastBeliefUpdates: sanitized.lastBeliefUpdates,
      beliefUpdateHistory: sanitized.beliefUpdateHistory,
      lastWorkforceSummary: sanitized.lastWorkforceSummary,
      lastBuildingProduction: sanitized.lastBuildingProduction,
      lastDailySummary: sanitized.lastDailySummary,
      lastQuarterSummary: sanitized.lastQuarterSummary,
      dailyHistory: sanitized.dailyHistory,
      quarterHistory: sanitized.quarterHistory,
      metrics: sanitized.metrics,
    };
  }

  let representedPopulation = getHouseholdPopulation(households);

  if (representedPopulation < targetPopulation) {
    let missing = targetPopulation - representedPopulation;

    while (missing > 0 && households.length < maxHouseholds) {
      const index = households.length;
      households.push(createHousehold({
        id: `hh-${String(nextHouseholdId).padStart(6, "0")}`,
        index,
        weight: 1,
        createdTurn: options.createdTurn ?? 0,
        origin: options.origin ?? "population-growth",
      }));
      nextHouseholdId += 1;
      missing -= 1;
    }

    if (missing > 0) {
      const baseIncrease = Math.floor(missing / households.length);
      const remainder = missing % households.length;
      households = households.map((household, index) => ({
        ...household,
        weight: household.weight + baseIncrease + (index < remainder ? 1 : 0),
      }));
    }
  } else if (representedPopulation > targetPopulation) {
    if (targetPopulation < households.length) {
      households = households.slice(0, targetPopulation).map((household) => ({
        ...household,
        weight: 1,
      }));
    } else {
      let excess = representedPopulation - targetPopulation;
      households = [...households];
      for (let index = households.length - 1; index >= 0 && excess > 0; index -= 1) {
        const household = households[index];
        const reducible = Math.max(0, household.weight - 1);
        const reduction = Math.min(reducible, excess);
        if (reduction > 0) {
          households[index] = { ...household, weight: household.weight - reduction };
          excess -= reduction;
        }
      }
    }
  }

  representedPopulation = getHouseholdPopulation(households);
  if (representedPopulation !== targetPopulation) {
    throw new Error(`Household reconciliation failed: ${representedPopulation} !== ${targetPopulation}`);
  }

  return {
    ...sanitized,
    schemaVersion: AGENT_ECONOMY_SCHEMA_VERSION,
    maxHouseholds,
    nextHouseholdId,
    lastReconciledPopulation: targetPopulation,
    households,
  };
}

export function hydrateAgentEconomy(savedAgentEconomy, population, options = {}) {
  if (!savedAgentEconomy || typeof savedAgentEconomy !== "object") {
    return createInitialAgentEconomy(population, {
      maxHouseholds: options.maxHouseholds,
      createdTurn: options.createdTurn ?? 0,
      origin: "legacy-save-migration",
      seed: options.seed,
      estateInventory: options.estateInventory,
    });
  }
  return reconcileAgentEconomyPopulation(savedAgentEconomy, population, options);
}

export function cloneAgentEconomy(agentEconomy, population) {
  return hydrateAgentEconomy(
    JSON.parse(JSON.stringify(agentEconomy ?? null)),
    population,
  );
}
