import {
  AGENT_ECONOMY_SCHEMA_VERSION,
  DEFAULT_MAX_HOUSEHOLDS,
  createHousehold,
  createInitialAgentEconomy,
  normalizeHousehold,
} from "./householdFactory.js";

function toPopulation(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
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
    }
    if (!household.priceBeliefs || typeof household.priceBeliefs !== "object") {
      errors.push(`household ${household.id || index} has no price beliefs`);
    }
  });

  const population = getHouseholdPopulation(households);
  if (expectedPopulation != null && population !== toPopulation(expectedPopulation)) {
    errors.push(`household population ${population} does not match ${toPopulation(expectedPopulation)}`);
  }

  return { valid: errors.length === 0, errors, population };
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

  return {
    schemaVersion: AGENT_ECONOMY_SCHEMA_VERSION,
    enabled: source.enabled === true,
    shadowMode: source.shadowMode !== false,
    maxHouseholds,
    nextHouseholdId: nextIdNumber(source, households),
    lastReconciledPopulation: toPopulation(source.lastReconciledPopulation),
    households,
    metrics: {
      totalTrades: toPopulation(source.metrics?.totalTrades),
      failedTrades: toPopulation(source.metrics?.failedTrades),
      daysSimulated: toPopulation(source.metrics?.daysSimulated),
    },
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
    return createInitialAgentEconomy(targetPopulation, {
      maxHouseholds,
      createdTurn: options.createdTurn ?? 0,
      origin: options.origin ?? "migration",
    });
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

/**
 * Loads current or legacy save data. Missing household state is generated from
 * the saved population, while existing household memory is preserved.
 */
export function hydrateAgentEconomy(savedAgentEconomy, population, options = {}) {
  if (!savedAgentEconomy || typeof savedAgentEconomy !== "object") {
    return createInitialAgentEconomy(population, {
      maxHouseholds: options.maxHouseholds,
      createdTurn: options.createdTurn ?? 0,
      origin: "legacy-save-migration",
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
