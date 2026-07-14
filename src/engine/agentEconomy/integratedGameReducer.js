import {
  gameReducer as legacyGameReducer,
  initialState as legacyInitialState,
} from "../gameReducer.js";
import { AGENT_DAYS_PER_QUARTER, simulateAgentQuarter } from "./dailySimulation.js";
import { hydrateAgentEconomy, reconcileAgentEconomyPopulation } from "./householdUtils.js";

function normalizePopulation(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

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

function shouldRunShadowQuarter(preparedState, action) {
  return action?.type === "SIMULATE_SEASON"
    && preparedState.phase === "management"
    && preparedState.turn < 40;
}

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

  const reconciledState = ensureAgentEconomyState(nextState, origin);
  if (!shouldRunShadowQuarter(preparedState, action)) return reconciledState;

  const simulatedAgentEconomy = simulateAgentQuarter(
    preparedState.agentEconomy,
    {
      days: AGENT_DAYS_PER_QUARTER,
      turn: preparedState.turn,
      season: preparedState.season,
      taxRate: preparedState.taxRate,
      buildings: preparedState.buildings,
      laborAllocation: preparedState.laborAllocation,
    },
  );

  return {
    ...reconciledState,
    agentEconomy: reconcileAgentEconomyPopulation(
      simulatedAgentEconomy,
      reconciledState.population,
      {
        createdTurn: preparedState.turn,
        origin: "shadow-quarter-resolution",
      },
    ),
  };
}

export default gameReducer;
