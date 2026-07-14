import { BASE_BUY_PRICES } from "../../data/economy.js";
import { createInitialNeeds, normalizeNeeds } from "./needsSystem.js";
import { getDefaultOccupation, normalizeOccupation } from "./occupationSystem.js";

export const AGENT_ECONOMY_SCHEMA_VERSION = 1;
export const DEFAULT_MAX_HOUSEHOLDS = 120;

export const HOUSEHOLD_COMMODITIES = [
  "grain",
  "livestock",
  "fish",
  "flour",
  "timber",
  "wood",
  "wool",
  "cloth",
  "herbs",
  "ale",
  "salt",
  "tools",
];

function toNonNegativeInteger(value, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function createEmptyHouseholdInventory() {
  return Object.fromEntries(HOUSEHOLD_COMMODITIES.map((commodity) => [commodity, 0]));
}

function createPriceBeliefs(index = 0) {
  const offset = ((Math.max(0, index) % 7) - 3) * 0.025;
  const beliefs = {};

  for (const commodity of HOUSEHOLD_COMMODITIES) {
    const referencePrice = BASE_BUY_PRICES[commodity] ?? 5;
    const center = Math.max(0.5, referencePrice * (1 + offset));
    beliefs[commodity] = {
      min: Number(Math.max(0.5, center * 0.8).toFixed(2)),
      max: Number(Math.max(0.5, center * 1.2).toFixed(2)),
      lastPrice: Number(center.toFixed(2)),
    };
  }

  return beliefs;
}

function createPriceHistory(priceBeliefs) {
  return Object.fromEntries(
    Object.entries(priceBeliefs).map(([commodity, belief]) => [commodity, [belief.lastPrice]]),
  );
}

export function createHousehold({
  id,
  index = 0,
  weight = 1,
  occupation,
  createdTurn = 0,
  origin = "generated",
} = {}) {
  const normalizedWeight = Math.max(1, toNonNegativeInteger(weight, 1));
  const normalizedIndex = toNonNegativeInteger(index);
  const normalizedOccupation = normalizeOccupation(occupation ?? getDefaultOccupation(normalizedIndex));
  const priceBeliefs = createPriceBeliefs(normalizedIndex);

  return {
    id: id || `hh-${String(normalizedIndex + 1).padStart(6, "0")}`,
    weight: normalizedWeight,
    occupation: normalizedOccupation,
    cash: (12 + (normalizedIndex % 5) * 3) * normalizedWeight,
    inventory: createEmptyHouseholdInventory(),
    needs: createInitialNeeds(normalizedIndex),
    priceBeliefs,
    priceHistory: createPriceHistory(priceBeliefs),
    workplaceId: null,
    homeId: null,
    health: 78 + (normalizedIndex % 18),
    satisfaction: 48 + (normalizedIndex % 17),
    meta: {
      createdTurn: toNonNegativeInteger(createdTurn),
      origin,
    },
  };
}

export function normalizeHousehold(household, index = 0) {
  const fallback = createHousehold({ index });
  const source = household && typeof household === "object" ? household : {};
  const weight = Math.max(1, toNonNegativeInteger(source.weight, fallback.weight));
  const beliefsSource = source.priceBeliefs && typeof source.priceBeliefs === "object"
    ? source.priceBeliefs
    : fallback.priceBeliefs;
  const normalizedBeliefs = {};

  for (const commodity of HOUSEHOLD_COMMODITIES) {
    const fallbackBelief = fallback.priceBeliefs[commodity];
    const belief = beliefsSource[commodity] ?? fallbackBelief;
    const min = Math.max(0.5, Number(belief?.min) || fallbackBelief.min);
    const max = Math.max(min, Number(belief?.max) || fallbackBelief.max);
    const lastPrice = Math.max(0.5, Number(belief?.lastPrice) || fallbackBelief.lastPrice);
    normalizedBeliefs[commodity] = { min, max, lastPrice };
  }

  const inventorySource = source.inventory && typeof source.inventory === "object"
    ? source.inventory
    : {};
  const normalizedInventory = {};
  for (const commodity of HOUSEHOLD_COMMODITIES) {
    normalizedInventory[commodity] = toNonNegativeInteger(inventorySource[commodity]);
  }

  const historySource = source.priceHistory && typeof source.priceHistory === "object"
    ? source.priceHistory
    : {};
  const normalizedHistory = {};
  for (const commodity of HOUSEHOLD_COMMODITIES) {
    const values = Array.isArray(historySource[commodity])
      ? historySource[commodity].filter((value) => Number.isFinite(value) && value >= 0.5).slice(-24)
      : [];
    normalizedHistory[commodity] = values.length > 0
      ? values
      : [normalizedBeliefs[commodity].lastPrice];
  }

  return {
    ...fallback,
    ...source,
    id: typeof source.id === "string" && source.id.length > 0 ? source.id : fallback.id,
    weight,
    occupation: normalizeOccupation(source.occupation),
    cash: Math.max(0, Number(source.cash) || 0),
    inventory: normalizedInventory,
    needs: normalizeNeeds(source.needs),
    priceBeliefs: normalizedBeliefs,
    priceHistory: normalizedHistory,
    workplaceId: typeof source.workplaceId === "string" ? source.workplaceId : null,
    homeId: typeof source.homeId === "string" ? source.homeId : null,
    health: Math.max(0, Math.min(100, Number(source.health) || fallback.health)),
    satisfaction: Math.max(0, Math.min(100, Number(source.satisfaction) || fallback.satisfaction)),
    meta: {
      ...fallback.meta,
      ...(source.meta && typeof source.meta === "object" ? source.meta : {}),
    },
  };
}

export function createHouseholdsForPopulation(population, options = {}) {
  const totalPopulation = toNonNegativeInteger(population);
  if (totalPopulation === 0) return [];

  const maxHouseholds = Math.max(1, toNonNegativeInteger(
    options.maxHouseholds,
    DEFAULT_MAX_HOUSEHOLDS,
  ));
  const householdCount = Math.min(totalPopulation, maxHouseholds);
  const baseWeight = Math.floor(totalPopulation / householdCount);
  const remainder = totalPopulation % householdCount;

  return Array.from({ length: householdCount }, (_, index) => createHousehold({
    id: `hh-${String(index + 1).padStart(6, "0")}`,
    index,
    weight: baseWeight + (index < remainder ? 1 : 0),
    createdTurn: options.createdTurn ?? 0,
    origin: options.origin ?? "generated",
  }));
}

export function createInitialAgentEconomy(population, options = {}) {
  const maxHouseholds = Math.max(1, toNonNegativeInteger(
    options.maxHouseholds,
    DEFAULT_MAX_HOUSEHOLDS,
  ));
  const households = createHouseholdsForPopulation(population, {
    maxHouseholds,
    createdTurn: options.createdTurn ?? 0,
    origin: options.origin ?? "generated",
  });

  return {
    schemaVersion: AGENT_ECONOMY_SCHEMA_VERSION,
    enabled: false,
    shadowMode: true,
    maxHouseholds,
    nextHouseholdId: households.length + 1,
    lastReconciledPopulation: toNonNegativeInteger(population),
    households,
    metrics: {
      totalTrades: 0,
      failedTrades: 0,
      daysSimulated: 0,
    },
  };
}
