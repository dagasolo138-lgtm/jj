import { BASE_BUY_PRICES } from "../../data/economy.js";
import { createInitialEngineControl } from "./engineControlSystem.js";
import { distributeEstateInventory } from "./estateInventoryAdapter.js";
import { createInitialNeeds, normalizeNeeds } from "./needsSystem.js";
import { getDefaultOccupation, normalizeOccupation } from "./occupationSystem.js";
import {
  createInitialMarketPrices,
  normalizePriceBelief,
} from "./priceBeliefSystem.js";
import { DEFAULT_AGENT_ECONOMY_SEED, normalizeSeed } from "./seededRng.js";

export const AGENT_ECONOMY_SCHEMA_VERSION = 12;
export const DEFAULT_MAX_HOUSEHOLDS = 120;

export const HOUSEHOLD_COMMODITIES = [
  "grain",
  "livestock",
  "fish",
  "flour",
  "timber",
  "wood",
  "coal",
  "iron",
  "stone",
  "clay",
  "wool",
  "cloth",
  "leather",
  "steel",
  "herbs",
  "ale",
  "salt",
  "tools",
];

function toNonNegativeInteger(value, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function toNonNegativeQuantity(value, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  return Number(Math.max(0, value).toFixed(4));
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
    beliefs[commodity] = normalizePriceBelief(commodity, {
      min: center * 0.8,
      max: center * 1.2,
      lastPrice: center,
    });
  }

  return beliefs;
}

function createPriceHistory(priceBeliefs) {
  return Object.fromEntries(
    Object.entries(priceBeliefs).map(([commodity, belief]) => [commodity, [belief.lastPrice]]),
  );
}

function normalizeProductionNeeds(productionNeeds) {
  const source = productionNeeds && typeof productionNeeds === "object" ? productionNeeds : {};
  const normalized = {};
  for (const commodity of HOUSEHOLD_COMMODITIES) {
    const amount = toNonNegativeQuantity(source[commodity]);
    if (amount > 0) normalized[commodity] = amount;
  }
  return normalized;
}

function normalizeWorkAssignments(assignments) {
  if (!Array.isArray(assignments)) return [];
  return assignments
    .filter((assignment) => assignment && typeof assignment === "object")
    .map((assignment) => ({
      householdId: typeof assignment.householdId === "string" ? assignment.householdId : "",
      workers: Math.max(1, toNonNegativeInteger(assignment.workers, 1)),
      buildingInstanceId: typeof assignment.buildingInstanceId === "string"
        ? assignment.buildingInstanceId
        : "",
      buildingType: typeof assignment.buildingType === "string" ? assignment.buildingType : "unknown",
    }))
    .filter((assignment) => assignment.householdId && assignment.buildingInstanceId)
    .slice(-12);
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
  const inventory = createEmptyHouseholdInventory();
  inventory.grain = normalizedWeight * 2;

  return {
    id: id || `hh-${String(normalizedIndex + 1).padStart(6, "0")}`,
    weight: normalizedWeight,
    occupation: normalizedOccupation,
    cash: (12 + (normalizedIndex % 5) * 3) * normalizedWeight,
    inventory,
    needs: createInitialNeeds(normalizedIndex),
    priceBeliefs,
    priceHistory: createPriceHistory(priceBeliefs),
    workplaceId: null,
    workAssignments: [],
    assignedWorkers: 0,
    employmentRatio: 0,
    productionNeeds: {},
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
    normalizedBeliefs[commodity] = normalizePriceBelief(
      commodity,
      beliefsSource[commodity] ?? fallback.priceBeliefs[commodity],
    );
  }

  const inventorySource = source.inventory && typeof source.inventory === "object"
    ? source.inventory
    : {};
  const normalizedInventory = {};
  for (const commodity of HOUSEHOLD_COMMODITIES) {
    normalizedInventory[commodity] = toNonNegativeQuantity(
      inventorySource[commodity],
      fallback.inventory[commodity],
    );
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

  const workAssignments = normalizeWorkAssignments(source.workAssignments);
  const assignedWorkers = Math.min(
    weight,
    workAssignments.reduce((total, assignment) => total + assignment.workers, 0),
  );

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
    workAssignments,
    assignedWorkers,
    employmentRatio: Math.max(0, Math.min(1,
      Number.isFinite(source.employmentRatio)
        ? source.employmentRatio
        : assignedWorkers / weight,
    )),
    productionNeeds: normalizeProductionNeeds(source.productionNeeds),
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
  const generatedHouseholds = createHouseholdsForPopulation(population, {
    maxHouseholds,
    createdTurn: options.createdTurn ?? 0,
    origin: options.origin ?? "generated",
  });
  const hasEstateInventory = options.estateInventory
    && typeof options.estateInventory === "object";
  const households = hasEstateInventory
    ? distributeEstateInventory(generatedHouseholds, options.estateInventory, { replace: true })
    : generatedHouseholds;
  const rngSeed = normalizeSeed(options.seed ?? DEFAULT_AGENT_ECONOMY_SEED);

  return {
    schemaVersion: AGENT_ECONOMY_SCHEMA_VERSION,
    enabled: false,
    shadowMode: true,
    engineControl: createInitialEngineControl(),
    liveStateAdapter: null,
    maxHouseholds,
    nextHouseholdId: households.length + 1,
    lastReconciledPopulation: toNonNegativeInteger(population),
    inventoryAdapterVersion: hasEstateInventory ? 1 : 0,
    inventorySeededFromEstate: Boolean(hasEstateInventory),
    households,
    rngSeed,
    rngState: rngSeed,
    day: 0,
    pendingOrders: [],
    lastTrades: [],
    marketPrices: createInitialMarketPrices(HOUSEHOLD_COMMODITIES),
    lastBeliefUpdates: [],
    beliefUpdateHistory: [],
    lastWorkforceSummary: null,
    lastBuildingProduction: [],
    lastDailySummary: null,
    lastQuarterSummary: null,
    dailyHistory: [],
    quarterHistory: [],
    metrics: {
      totalTrades: 0,
      failedTrades: 0,
      daysSimulated: 0,
      quartersSimulated: 0,
      goodsProduced: 0,
      goodsConsumed: 0,
      foodConsumed: 0,
      productionInputsConsumed: 0,
      unmetFood: 0,
      ordersGenerated: 0,
      potentialMatches: 0,
      potentialMatchVolume: 0,
      settledTrades: 0,
      failedOrders: 0,
      tradeVolume: 0,
      tradeValue: 0,
      beliefAdjustments: 0,
      priceIncreases: 0,
      priceDecreases: 0,
      workerDaysRequired: 0,
      workerDaysAssigned: 0,
      idleBuildingDays: 0,
      inputShortageEvents: 0,
      grossIncome: 0,
      taxCollected: 0,
      welfarePaid: 0,
    },
  };
}
