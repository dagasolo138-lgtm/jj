import {
  gameReducer as legacyGameReducer,
  initialState as legacyInitialState,
} from "../gameReducer.js";
import { hydrateAgentEconomy } from "./householdUtils.js";

function normalizePopulation(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

/**
 * Adds or repairs household proxy state without changing the live economy.
 * The legacy reducer remains authoritative for production, consumption,
 * population, events, and victory conditions during the migration.
 */
export function ensureAgentEconomyState(state, origin = "state-reconciliation") {
  const source = state && typeof state === "object" ? state : legacyInitialState;
  const population = normalizePopulation(source.population);

  return {
    ...source,
    population,
    agentEconomy: hydrateAgentEconomy(
      source.agentEconomy,
      population,
      {
        createdTurn: source.turn ?? 0,
        maxHouseholds: source.agentEconomy?.maxHouseholds,
        origin,
      },
    ),
  };
}

export const initialState = ensureAgentEconomyState(
  legacyInitialState,
  "initial-state",
);

export function gameReducer(state, action) {
  const preparedState = ensureAgentEconomyState(
    state ?? initialState,
    "reducer-input",
  );
  const nextState = legacyGameReducer(preparedState, action);

  let origin = "state-reconciliation";
  if (action?.type === "START_GAME" || action?.type === "PLAY_AGAIN") {
    origin = "new-game";
  } else if (action?.type === "LOAD_SAVE") {
    origin = "save-migration";
  }

  return ensureAgentEconomyState(nextState, origin);
}

export default gameReducer;
