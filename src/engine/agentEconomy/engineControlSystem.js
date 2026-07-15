import {
  createInitialCanaryPilot,
  normalizeCanaryPilot,
} from "./canaryPilotSystem.js";
import { getCommodityPriceBounds } from "./priceBeliefSystem.js";

export const ENGINE_MODES = Object.freeze({
  LEGACY: "legacy",
  SHADOW: "shadow",
  CANARY: "canary",
});

export const REQUIRED_SAFE_QUARTERS = 8;
export const COMPARISON_HISTORY_LIMIT = 40;

const FOOD_COMMODITIES = ["grain", "livestock", "fish", "flour"];
const DEFAULT_ADAPTER_CAPABILITIES = Object.freeze({
  treasury: false,
  estateInventory: false,
  population: false,
  victoryAndGameOver: false,
});

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function nonNegative(value) {
  return Math.max(0, finite(value));
}

function integer(value, fallback = 0) {
  return Math.max(0, Math.floor(finite(value, fallback)));
}

function round(value, digits = 4) {
  return Number(finite(value).toFixed(digits));
}

function sign(value, tolerance = 0.0001) {
  const normalized = finite(value);
  if (normalized > tolerance) return 1;
  if (normalized < -tolerance) return -1;
  return 0;
}

function sumInventory(inventory = {}) {
  return Object.values(inventory).reduce((total, amount) => total + nonNegative(amount), 0);
}

function sumFood(inventory = {}) {
  return FOOD_COMMODITIES.reduce((total, commodity) =>
    total + nonNegative(inventory?.[commodity]), 0);
}

function collectAgentTotals(agentEconomy = {}) {
  const households = Array.isArray(agentEconomy.households) ? agentEconomy.households : [];
  const inventory = {};
  let population = 0;
  let cash = 0;

  for (const household of households) {
    population += integer(household?.weight);
    cash += nonNegative(household?.cash);
    for (const [commodity, amount] of Object.entries(household?.inventory ?? {})) {
      inventory[commodity] = nonNegative(inventory[commodity]) + nonNegative(amount);
    }
  }

  return {
    households: households.length,
    population,
    cash: round(cash, 2),
    inventory,
    totalInventory: round(sumInventory(inventory)),
    food: round(sumFood(inventory)),
  };
}

function normalizeCapabilities(capabilities = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_ADAPTER_CAPABILITIES).map(([key, fallback]) => [
      key,
      capabilities?.[key] === true ? true : fallback,
    ]),
  );
}

function getAdapterBlockers(capabilities) {
  return Object.entries(capabilities)
    .filter(([, ready]) => !ready)
    .map(([name]) => `adapter-not-ready:${name}`);
}

export function createInitialEngineControl(options = {}) {
  const adapterCapabilities = normalizeCapabilities(options.adapterCapabilities);
  const writeBackEnabled = options.writeBackEnabled === true;
  const requestedMode = Object.values(ENGINE_MODES).includes(options.requestedMode)
    ? options.requestedMode
    : ENGINE_MODES.SHADOW;

  return {
    version: 4,
    requestedMode,
    activeMode: requestedMode === ENGINE_MODES.LEGACY
      ? ENGINE_MODES.LEGACY
      : ENGINE_MODES.SHADOW,
    authority: ENGINE_MODES.LEGACY,
    autoRollback: options.autoRollback !== false,
    requiredSafeQuarters: Math.max(1, integer(options.requiredSafeQuarters, REQUIRED_SAFE_QUARTERS)),
    consecutiveSafeQuarters: 0,
    totalComparisons: 0,
    safeComparisons: 0,
    unsafeComparisons: 0,
    canaryEligible: false,
    adapterCapabilities,
    writeBackEnabled,
    promotionBlockers: [
      ...getAdapterBlockers(adapterCapabilities),
      ...(writeBackEnabled ? [] : ["candidate-write-disabled"]),
    ],
    rollbackCount: 0,
    canaryWriteCount: 0,
    canaryRollbackCount: 0,
    lastCanaryTransaction: null,
    canaryTransactionHistory: [],
    canaryCampaignSequence: 0,
    canaryObservationSequence: 0,
    lastCanaryObservation: null,
    canaryObservations: [],
    lastCanaryCampaignSummary: null,
    canaryCampaignHistory: [],
    canaryPilotSequence: 0,
    canaryPilot: createInitialCanaryPilot(),
    lastRollbackReason: null,
    lastModeChangeTurn: 0,
    lastComparison: null,
    comparisonHistory: [],
    legacyCheckpoint: null,
  };
}

export function normalizeEngineControl(control) {
  const source = control && typeof control === "object" ? control : {};
  const fallback = createInitialEngineControl();
  const adapterCapabilities = normalizeCapabilities(source.adapterCapabilities);
  const activeMode = Object.values(ENGINE_MODES).includes(source.activeMode)
    ? source.activeMode
    : fallback.activeMode;
  const requestedMode = Object.values(ENGINE_MODES).includes(source.requestedMode)
    ? source.requestedMode
    : activeMode;
  const writeBackEnabled = source.writeBackEnabled === true;
  const authority = source.authority === ENGINE_MODES.CANARY
    && activeMode === ENGINE_MODES.CANARY
    && writeBackEnabled
    ? ENGINE_MODES.CANARY
    : ENGINE_MODES.LEGACY;

  return {
    ...fallback,
    ...source,
    version: 4,
    requestedMode,
    activeMode,
    authority,
    autoRollback: source.autoRollback !== false,
    requiredSafeQuarters: Math.max(1, integer(source.requiredSafeQuarters, REQUIRED_SAFE_QUARTERS)),
    consecutiveSafeQuarters: integer(source.consecutiveSafeQuarters),
    totalComparisons: integer(source.totalComparisons),
    safeComparisons: integer(source.safeComparisons),
    unsafeComparisons: integer(source.unsafeComparisons),
    canaryEligible: source.canaryEligible === true,
    adapterCapabilities,
    writeBackEnabled,
    promotionBlockers: Array.isArray(source.promotionBlockers)
      ? source.promotionBlockers.filter((item) => typeof item === "string").slice(-20)
      : getAdapterBlockers(adapterCapabilities),
    rollbackCount: integer(source.rollbackCount),
    canaryWriteCount: integer(source.canaryWriteCount),
    canaryRollbackCount: integer(source.canaryRollbackCount),
    lastCanaryTransaction: source.lastCanaryTransaction && typeof source.lastCanaryTransaction === "object"
      ? source.lastCanaryTransaction
      : null,
    canaryTransactionHistory: Array.isArray(source.canaryTransactionHistory)
      ? source.canaryTransactionHistory.slice(-20)
      : [],
    canaryCampaignSequence: integer(source.canaryCampaignSequence),
    canaryObservationSequence: integer(source.canaryObservationSequence),
    lastCanaryObservation: source.lastCanaryObservation && typeof source.lastCanaryObservation === "object"
      ? source.lastCanaryObservation
      : null,
    canaryObservations: Array.isArray(source.canaryObservations)
      ? source.canaryObservations.slice(-48)
      : [],
    lastCanaryCampaignSummary: source.lastCanaryCampaignSummary
      && typeof source.lastCanaryCampaignSummary === "object"
      ? source.lastCanaryCampaignSummary
      : null,
    canaryCampaignHistory: Array.isArray(source.canaryCampaignHistory)
      ? source.canaryCampaignHistory.slice(-12)
      : [],
    canaryPilotSequence: integer(source.canaryPilotSequence),
    canaryPilot: normalizeCanaryPilot(source.canaryPilot),
    lastRollbackReason: typeof source.lastRollbackReason === "string"
      ? source.lastRollbackReason
      : null,
    lastModeChangeTurn: integer(source.lastModeChangeTurn),
    lastComparison: source.lastComparison && typeof source.lastComparison === "object"
      ? source.lastComparison
      : null,
    comparisonHistory: Array.isArray(source.comparisonHistory)
      ? source.comparisonHistory.slice(-COMPARISON_HISTORY_LIMIT)
      : [],
    legacyCheckpoint: source.legacyCheckpoint && typeof source.legacyCheckpoint === "object"
      ? source.legacyCheckpoint
      : null,
  };
}

export function createLegacyCheckpoint(state = {}) {
  return {
    turn: integer(state.turn),
    season: typeof state.season === "string" ? state.season : null,
    year: integer(state.year),
    phase: typeof state.phase === "string" ? state.phase : null,
    denarii: round(nonNegative(state.denarii), 2),
    food: round(nonNegative(state.food), 4),
    population: integer(state.population),
    garrison: integer(state.garrison),
    inventory: Object.fromEntries(
      Object.entries(state.inventory ?? {}).map(([commodity, amount]) => [commodity, round(nonNegative(amount))]),
    ),
    buildings: Array.isArray(state.buildings)
      ? state.buildings.map((building) => typeof building === "string" ? building : { ...building })
      : [],
  };
}

function inspectHouseholds(agentEconomy, criticalIssues) {
  const seen = new Set();
  for (const [index, household] of (agentEconomy?.households ?? []).entries()) {
    const id = typeof household?.id === "string" ? household.id : `index-${index}`;
    if (!household || typeof household !== "object") {
      criticalIssues.push(`invalid-household:${index}`);
      continue;
    }
    if (seen.has(id)) criticalIssues.push(`duplicate-household:${id}`);
    seen.add(id);
    if (!Number.isInteger(household.weight) || household.weight < 1) {
      criticalIssues.push(`invalid-household-weight:${id}`);
    }
    if (!Number.isFinite(household.cash) || household.cash < 0) {
      criticalIssues.push(`invalid-household-cash:${id}`);
    }
    for (const [commodity, amount] of Object.entries(household.inventory ?? {})) {
      if (!Number.isFinite(amount) || amount < -0.0001) {
        criticalIssues.push(`invalid-inventory:${id}:${commodity}`);
      }
    }
    for (const [commodity, belief] of Object.entries(household.priceBeliefs ?? {})) {
      const bounds = getCommodityPriceBounds(commodity);
      if (!Number.isFinite(belief?.min) || !Number.isFinite(belief?.max)
        || belief.min < bounds.floor - 0.01 || belief.max > bounds.ceiling + 0.01
        || belief.min > belief.max) {
        criticalIssues.push(`invalid-price-belief:${id}:${commodity}`);
      }
    }
  }
}

function inspectMarketPrices(agentEconomy, criticalIssues) {
  for (const [commodity, record] of Object.entries(agentEconomy?.marketPrices ?? {})) {
    const bounds = getCommodityPriceBounds(commodity);
    for (const key of ["lastPrice", "averagePrice", "low", "high"]) {
      const value = record?.[key];
      if (!Number.isFinite(value) || value < bounds.floor - 0.01 || value > bounds.ceiling + 0.01) {
        criticalIssues.push(`invalid-market-price:${commodity}:${key}`);
      }
    }
  }
}

function metricDelta(beforeAgent, afterAgent, key) {
  return round(nonNegative(afterAgent?.metrics?.[key]) - nonNegative(beforeAgent?.metrics?.[key]));
}

export function buildEngineComparison({
  beforeLegacy,
  afterLegacy,
  beforeAgent,
  projectedAgent,
  turn,
  season,
  expectedDays = 30,
} = {}) {
  const beforeAgentTotals = collectAgentTotals(beforeAgent);
  const projectedAgentTotals = collectAgentTotals(projectedAgent);
  const criticalIssues = [];
  const warnings = [];
  inspectHouseholds(projectedAgent, criticalIssues);
  inspectMarketPrices(projectedAgent, criticalIssues);

  const dayDelta = integer(projectedAgent?.day) - integer(beforeAgent?.day);
  if (dayDelta !== expectedDays) criticalIssues.push(`unexpected-day-delta:${dayDelta}`);
  const grossIncome = metricDelta(beforeAgent, projectedAgent, "grossIncome");
  const taxCollected = metricDelta(beforeAgent, projectedAgent, "taxCollected");
  const welfarePaid = metricDelta(beforeAgent, projectedAgent, "welfarePaid");
  const expectedCashDelta = round(grossIncome - taxCollected + welfarePaid, 2);
  const actualCashDelta = round(projectedAgentTotals.cash - beforeAgentTotals.cash, 2);
  const cashAccountingError = round(actualCashDelta - expectedCashDelta, 2);
  if (Math.abs(cashAccountingError) > 0.05) {
    criticalIssues.push(`cash-accounting-error:${cashAccountingError}`);
  }

  const produced = metricDelta(beforeAgent, projectedAgent, "goodsProduced");
  const productionInputs = metricDelta(beforeAgent, projectedAgent, "productionInputsConsumed");
  const consumed = metricDelta(beforeAgent, projectedAgent, "goodsConsumed");
  const expectedInventoryDelta = round(produced - productionInputs - consumed);
  const actualInventoryDelta = round(
    projectedAgentTotals.totalInventory - beforeAgentTotals.totalInventory,
  );
  const inventoryAccountingError = round(actualInventoryDelta - expectedInventoryDelta);
  if (Math.abs(inventoryAccountingError) > 0.1) {
    criticalIssues.push(`inventory-accounting-error:${inventoryAccountingError}`);
  }

  const legacyDeltas = {
    denarii: round(finite(afterLegacy?.denarii) - finite(beforeLegacy?.denarii), 2),
    food: round(finite(afterLegacy?.food) - finite(beforeLegacy?.food)),
    population: integer(afterLegacy?.population) - integer(beforeLegacy?.population),
    garrison: integer(afterLegacy?.garrison) - integer(beforeLegacy?.garrison),
    inventory: round(sumInventory(afterLegacy?.inventory) - sumInventory(beforeLegacy?.inventory)),
  };
  const agentDeltas = {
    cash: actualCashDelta,
    food: round(projectedAgentTotals.food - beforeAgentTotals.food),
    population: projectedAgentTotals.population - beforeAgentTotals.population,
    inventory: actualInventoryDelta,
    produced,
    productionInputsConsumed: productionInputs,
    consumed,
    unmetFood: metricDelta(beforeAgent, projectedAgent, "unmetFood"),
    settledTrades: metricDelta(beforeAgent, projectedAgent, "settledTrades"),
    failedOrders: metricDelta(beforeAgent, projectedAgent, "failedOrders"),
  };

  if (sign(legacyDeltas.food) !== 0 && sign(agentDeltas.food) !== 0
    && sign(legacyDeltas.food) !== sign(agentDeltas.food)) {
    warnings.push("food-direction-mismatch");
  }
  if (sign(legacyDeltas.denarii) !== 0 && sign(agentDeltas.cash) !== 0
    && sign(legacyDeltas.denarii) !== sign(agentDeltas.cash)) {
    warnings.push("money-direction-mismatch");
  }
  if (legacyDeltas.population !== agentDeltas.population) {
    warnings.push("population-model-divergence");
  }
  const population = Math.max(1, beforeAgentTotals.population);
  const unmetFoodPerPerson = round(agentDeltas.unmetFood / population);
  if (unmetFoodPerPerson > expectedDays * 0.5) warnings.push("high-agent-food-shortfall");

  return {
    id: `comparison-turn-${integer(turn)}-${season ?? "unknown"}`,
    turn: integer(turn),
    season: typeof season === "string" ? season : null,
    safe: criticalIssues.length === 0,
    criticalIssues: [...new Set(criticalIssues)].slice(0, 50),
    warnings: [...new Set(warnings)].slice(0, 50),
    legacyDeltas,
    agentDeltas,
    accounting: {
      expectedCashDelta,
      actualCashDelta,
      cashAccountingError,
      expectedInventoryDelta,
      actualInventoryDelta,
      inventoryAccountingError,
      dayDelta,
    },
    health: {
      households: projectedAgentTotals.households,
      representedPopulation: projectedAgentTotals.population,
      unmetFoodPerPerson,
      workerCoverage: round(
        nonNegative(projectedAgent?.lastWorkforceSummary?.laborCoverage),
      ),
      idleBuildingDays: agentDeltas.idleBuildingDays ?? metricDelta(
        beforeAgent,
        projectedAgent,
        "idleBuildingDays",
      ),
    },
  };
}

function calculateEligibility(control, safeStreak) {
  const adapterBlockers = getAdapterBlockers(control.adapterCapabilities);
  const blockers = [...adapterBlockers];
  if (!control.writeBackEnabled) blockers.push("candidate-write-disabled");
  if (safeStreak < control.requiredSafeQuarters) {
    blockers.push(`safe-quarter-streak:${safeStreak}/${control.requiredSafeQuarters}`);
  }
  return {
    eligible: blockers.length === 0,
    blockers,
  };
}

export function setEngineAdapterCapabilities(control, capabilities = {}) {
  const normalized = normalizeEngineControl(control);
  const adapterCapabilities = normalizeCapabilities({
    ...normalized.adapterCapabilities,
    ...capabilities,
  });
  const eligibility = calculateEligibility(
    { ...normalized, adapterCapabilities },
    normalized.consecutiveSafeQuarters,
  );
  return {
    ...normalized,
    adapterCapabilities,
    canaryEligible: eligibility.eligible,
    promotionBlockers: eligibility.blockers,
  };
}

export function setEngineWriteBackEnabled(control, enabled) {
  const normalized = normalizeEngineControl(control);
  const writeBackEnabled = enabled === true;
  const activeMode = !writeBackEnabled && normalized.activeMode === ENGINE_MODES.CANARY
    ? ENGINE_MODES.SHADOW
    : normalized.activeMode;
  const requestedMode = !writeBackEnabled && normalized.requestedMode === ENGINE_MODES.CANARY
    ? ENGINE_MODES.SHADOW
    : normalized.requestedMode;
  const eligibility = calculateEligibility(
    { ...normalized, activeMode, requestedMode, writeBackEnabled },
    normalized.consecutiveSafeQuarters,
  );
  return {
    ...normalized,
    requestedMode,
    activeMode,
    authority: writeBackEnabled ? normalized.authority : ENGINE_MODES.LEGACY,
    writeBackEnabled,
    canaryEligible: eligibility.eligible,
    promotionBlockers: eligibility.blockers,
  };
}

export function recordEngineComparison(control, comparison, checkpoint = null) {
  const normalized = normalizeEngineControl(control);
  const safeStreak = comparison?.safe ? normalized.consecutiveSafeQuarters + 1 : 0;
  let activeMode = normalized.activeMode;
  let writeBackEnabled = normalized.writeBackEnabled;
  let rollbackCount = normalized.rollbackCount;
  let lastRollbackReason = normalized.lastRollbackReason;

  if (!comparison?.safe && normalized.autoRollback && activeMode === ENGINE_MODES.CANARY) {
    activeMode = ENGINE_MODES.SHADOW;
    writeBackEnabled = false;
    rollbackCount += 1;
    lastRollbackReason = comparison.criticalIssues?.[0] ?? "unsafe-engine-comparison";
  }

  const eligibility = calculateEligibility(
    { ...normalized, activeMode, writeBackEnabled },
    safeStreak,
  );
  if (normalized.requestedMode === ENGINE_MODES.CANARY && eligibility.eligible) {
    activeMode = ENGINE_MODES.CANARY;
  } else if (normalized.requestedMode === ENGINE_MODES.LEGACY) {
    activeMode = ENGINE_MODES.LEGACY;
  } else if (activeMode !== ENGINE_MODES.CANARY) {
    activeMode = ENGINE_MODES.SHADOW;
  }

  const authority = activeMode === ENGINE_MODES.CANARY
    && writeBackEnabled
    && normalized.authority === ENGINE_MODES.CANARY
    ? ENGINE_MODES.CANARY
    : ENGINE_MODES.LEGACY;

  return {
    ...normalized,
    activeMode,
    authority,
    writeBackEnabled,
    consecutiveSafeQuarters: safeStreak,
    totalComparisons: normalized.totalComparisons + 1,
    safeComparisons: normalized.safeComparisons + (comparison?.safe ? 1 : 0),
    unsafeComparisons: normalized.unsafeComparisons + (comparison?.safe ? 0 : 1),
    canaryEligible: eligibility.eligible,
    promotionBlockers: eligibility.blockers,
    rollbackCount,
    lastRollbackReason,
    lastComparison: comparison,
    comparisonHistory: [
      ...normalized.comparisonHistory,
      comparison,
    ].slice(-COMPARISON_HISTORY_LIMIT),
    legacyCheckpoint: checkpoint ?? normalized.legacyCheckpoint,
  };
}

export function requestEngineMode(control, requestedMode, turn = 0) {
  const normalized = normalizeEngineControl(control);
  if (!Object.values(ENGINE_MODES).includes(requestedMode)) return normalized;

  if (requestedMode === ENGINE_MODES.LEGACY) {
    return {
      ...normalized,
      requestedMode,
      activeMode: ENGINE_MODES.LEGACY,
      authority: ENGINE_MODES.LEGACY,
      lastModeChangeTurn: integer(turn),
    };
  }

  if (requestedMode === ENGINE_MODES.SHADOW) {
    return {
      ...normalized,
      requestedMode,
      activeMode: ENGINE_MODES.SHADOW,
      authority: ENGINE_MODES.LEGACY,
      lastModeChangeTurn: integer(turn),
    };
  }

  return {
    ...normalized,
    requestedMode,
    activeMode: normalized.canaryEligible ? ENGINE_MODES.CANARY : ENGINE_MODES.SHADOW,
    authority: normalized.canaryEligible && normalized.activeMode === ENGINE_MODES.CANARY
      ? normalized.authority
      : ENGINE_MODES.LEGACY,
    lastModeChangeTurn: integer(turn),
    lastRollbackReason: normalized.canaryEligible
      ? normalized.lastRollbackReason
      : `promotion-blocked:${normalized.promotionBlockers.join(",")}`,
  };
}

export function forceEngineRollback(control, reason = "manual-rollback", turn = 0) {
  const normalized = normalizeEngineControl(control);
  return {
    ...normalized,
    requestedMode: ENGINE_MODES.SHADOW,
    activeMode: ENGINE_MODES.SHADOW,
    authority: ENGINE_MODES.LEGACY,
    writeBackEnabled: false,
    canaryEligible: false,
    promotionBlockers: calculateEligibility(
      { ...normalized, writeBackEnabled: false },
      normalized.consecutiveSafeQuarters,
    ).blockers,
    rollbackCount: normalized.rollbackCount + 1,
    lastRollbackReason: reason,
    lastModeChangeTurn: integer(turn),
  };
}

export function shouldRunAgentEngine(control) {
  return normalizeEngineControl(control).activeMode !== ENGINE_MODES.LEGACY;
}
