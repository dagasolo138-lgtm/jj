import {
  gameReducer as legacyGameReducer,
  initialState as legacyInitialState,
} from "../gameReducer.js";
import { AGENT_DAYS_PER_QUARTER, simulateAgentQuarter } from "./dailySimulation.js";
import {
  ENGINE_MODES,
  buildEngineComparison,
  createLegacyCheckpoint,
  forceEngineRollback,
  normalizeEngineControl,
  recordEngineComparison,
  requestEngineMode,
  shouldRunAgentEngine,
} from "./engineControlSystem.js";
import { hydrateAgentEconomy, reconcileAgentEconomyPopulation } from "./householdUtils.js";

function normalizePopulation(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function ensureAgentEconomyState(state, origin = "state-reconciliation") {
  const source = state && typeof state === "object" ? state : legacyInitialState;
  const population = normalizePopulation(source.population);
  const agentEconomy = hydrateAgentEconomy(
    source.agentEconomy,
    population,
    {
      createdTurn: source.turn ?? 0,
      maxHouseholds: source.agentEconomy?.maxHouseholds,
      origin,
    },
  );

  return {
    ...source,
    population,
    agentEconomy: {
      ...agentEconomy,
      engineControl: normalizeEngineControl(agentEconomy.engineControl),
    },
  };
}

export const initialState = ensureAgentEconomyState(
  legacyInitialState,
  "initial-state",
);

function isValidSeasonSimulation(state, action) {
  return action?.type === "SIMULATE_SEASON"
    && state.phase === "management"
    && state.turn < 40;
}

function applyControlAction(state, action) {
  if (action?.type === "AGENT_ECONOMY_SET_MODE") {
    const mode = action.payload?.mode;
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        engineControl: requestEngineMode(
          state.agentEconomy.engineControl,
          mode,
          state.turn,
        ),
      },
    };
  }

  if (action?.type === "AGENT_ECONOMY_FORCE_ROLLBACK") {
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        enabled: false,
        shadowMode: true,
        engineControl: forceEngineRollback(
          state.agentEconomy.engineControl,
          action.payload?.reason ?? "manual-rollback",
          state.turn,
        ),
      },
    };
  }

  return null;
}

function buildFailureComparison(preparedState, error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    id: `comparison-turn-${preparedState.turn}-${preparedState.season}-failure`,
    turn: preparedState.turn,
    season: preparedState.season,
    safe: false,
    criticalIssues: [`agent-engine-exception:${message}`],
    warnings: [],
    legacyDeltas: null,
    agentDeltas: null,
    accounting: null,
    health: null,
  };
}

export function gameReducer(state, action) {
  const preparedState = ensureAgentEconomyState(
    state ?? initialState,
    "reducer-input",
  );
  const controlledState = applyControlAction(preparedState, action);
  if (controlledState) return controlledState;

  const nextState = legacyGameReducer(preparedState, action);

  let origin = "state-reconciliation";
  if (action?.type === "START_GAME" || action?.type === "PLAY_AGAIN") {
    origin = "new-game";
  } else if (action?.type === "LOAD_SAVE") {
    origin = "save-migration";
  }

  const reconciledState = ensureAgentEconomyState(nextState, origin);
  if (!isValidSeasonSimulation(preparedState, action)) return reconciledState;

  const control = normalizeEngineControl(preparedState.agentEconomy.engineControl);
  if (!shouldRunAgentEngine(control)) {
    return {
      ...reconciledState,
      agentEconomy: {
        ...reconciledState.agentEconomy,
        enabled: false,
        shadowMode: false,
        engineControl: control,
      },
    };
  }

  const checkpoint = createLegacyCheckpoint(preparedState);

  try {
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

    const comparison = buildEngineComparison({
      beforeLegacy: preparedState,
      afterLegacy: reconciledState,
      beforeAgent: preparedState.agentEconomy,
      projectedAgent: simulatedAgentEconomy,
      turn: preparedState.turn,
      season: preparedState.season,
      expectedDays: AGENT_DAYS_PER_QUARTER,
    });
    const nextControl = recordEngineComparison(control, comparison, checkpoint);
    const nextAgentEconomy = reconcileAgentEconomyPopulation(
      simulatedAgentEconomy,
      reconciledState.population,
      {
        createdTurn: preparedState.turn,
        origin: "dual-engine-quarter-resolution",
      },
    );

    return {
      ...reconciledState,
      agentEconomy: {
        ...nextAgentEconomy,
        enabled: nextControl.activeMode === ENGINE_MODES.CANARY,
        shadowMode: nextControl.activeMode !== ENGINE_MODES.CANARY,
        engineControl: nextControl,
      },
    };
  } catch (error) {
    const comparison = buildFailureComparison(preparedState, error);
    const failedControl = recordEngineComparison(control, comparison, checkpoint);
    const rolledBackControl = forceEngineRollback(
      failedControl,
      comparison.criticalIssues[0],
      preparedState.turn,
    );

    return {
      ...reconciledState,
      agentEconomy: {
        ...reconciledState.agentEconomy,
        enabled: false,
        shadowMode: true,
        engineControl: rolledBackControl,
      },
    };
  }
}

export default gameReducer;
