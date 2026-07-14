export {
  AGENT_ECONOMY_SCHEMA_VERSION,
  DEFAULT_MAX_HOUSEHOLDS,
  HOUSEHOLD_COMMODITIES,
  createHousehold,
  createHouseholdsForPopulation,
  createInitialAgentEconomy,
  normalizeHousehold,
} from "./householdFactory.js";

export {
  cloneAgentEconomy,
  getHouseholdPopulation,
  hydrateAgentEconomy,
  reconcileAgentEconomyPopulation,
  validateHouseholds,
} from "./householdUtils.js";

export {
  OCCUPATIONS,
  getDefaultOccupation,
  getOccupationCounts,
  getOccupationDefinition,
  normalizeOccupation,
} from "./occupationSystem.js";

export {
  DEFAULT_NEEDS,
  NEED_KEYS,
  clampNeed,
  createInitialNeeds,
  getHighestPriorityNeed,
  normalizeNeeds,
  updateNeed,
} from "./needsSystem.js";
