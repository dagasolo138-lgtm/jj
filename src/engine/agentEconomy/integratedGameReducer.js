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
  setEngineWriteBackEnabled,
  shouldRunAgentEngine,
} from "./engineControlSystem.js";
import { hydrateAgentEconomy } from "./householdUtils.js";
import {
  isCanaryCampaignRunning,
  startCanaryCampaign,
  stopCanaryCampaign,
} from "./canaryCampaignSystem.js";
import { applyCanaryTransaction } from "./canaryTransactionSystem.js";
import {
  ensureLiveStateAdapter,
  finalizeAgentQuarterLiveState,
  reconcileLiveStateTransition,
} from "./liveStateAdapter.js";

function normalizePopulation(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function ensureAgentEconomyState(state, origin = "state-reconciliation") {
  const source = state && typeof state === "object" ? state : legacyInitialState;
  const population = normalizePopulation(source.population);
  const hydratedAgentEconomy = hydrateAgentEconomy(
    source.agentEconomy,
    population,
    {
      createdTurn: source.turn ?? 0,
      maxHouseholds: source.agentEconomy?.maxHouseholds,
      origin,
      estateInventory: source.inventory,
    },
  );
  const agentEconomy = ensureLiveStateAdapter(hydratedAgentEconomy, source);

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
  if (action?.type === "AGENT_ECONOMY_START_CANARY_CAMPAIGN") {
    const engineControl = startCanaryCampaign(
      state.agentEconomy.engineControl,
      {
        quarterLimit: action.payload?.quarterLimit,
        turn: state.turn,
      },
    );
    const running = isCanaryCampaignRunning(engineControl);
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        enabled: running,
        shadowMode: !running,
        liveStateAdapter: {
          ...(state.agentEconomy.liveStateAdapter ?? {}),
          writeBackEnabled: running,
          shadowOnly: !running,
        },
        engineControl,
      },
    };
  }

  if (action?.type === "AGENT_ECONOMY_STOP_CANARY_CAMPAIGN") {
    const engineControl = stopCanaryCampaign(
      state.agentEconomy.engineControl,
      action.payload?.reason ?? "operator-stop",
      state.turn,
    );
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        enabled: false,
        shadowMode: true,
        liveStateAdapter: {
          ...(state.agentEconomy.liveStateAdapter ?? {}),
          writeBackEnabled: false,
          shadowOnly: true,
        },
        engineControl,
      },
    };
  }

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

  if (action?.type === "AGENT_ECONOMY_SET_WRITE_BACK") {
    const enabled = action.payload?.enabled === true;
    const engineControl = setEngineWriteBackEnabled(
      state.agentEconomy.engineControl,
      enabled,
    );
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        enabled: false,
        shadowMode: true,
        liveStateAdapter: {
          ...(state.agentEconomy.liveStateAdapter ?? {}),
          writeBackEnabled: engineControl.writeBackEnabled,
          shadowOnly: true,
        },
        engineControl,
      },
    };
  }

  if (action?.type === "AGENT_ECONOMY_FORCE_ROLLBACK") {
    const engineControl = stopCanaryCampaign(
      state.agentEconomy.engineControl,
      action.payload?.reason ?? "manual-rollback",
      state.turn,
    );
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        enabled: false,
        shadowMode: true,
        liveStateAdapter: {
          ...(state.agentEconomy.liveStateAdapter ?? {}),
          writeBackEnabled: false,
          shadowOnly: true,
        },
        engineControl,
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
  const transitionSource = action?.type === "LOAD_SAVE" && nextState.agentEconomy
    ? nextState.agentEconomy
    : preparedState.agentEconomy;
  const transitionedAgentEconomy = reconcileLiveStateTransition(
    transitionSource,
    preparedState,
    nextState,
    action,
  );

  let origin = "state-reconciliation";
  if (action?.type === "START_GAME" || action?.type === "PLAY_AGAIN") {
    origin = "new-game";
  } else if (action?.type === "LOAD_SAVE") {
    origin = "save-migration";
  }

  const reconciledState = ensureAgentEconomyState({
    ...nextState,
    agentEconomy: transitionedAgentEconomy,
  }, origin);
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
  const canaryWasActive = control.activeMode === ENGINE_MODES.CANARY
    && control.writeBackEnabled === true
    && isCanaryCampaignRunning(control);

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
    const nextAgentEconomy = finalizeAgentQuarterLiveState(
      preparedState.agentEconomy,
      simulatedAgentEconomy,
      reconciledState,
    );

    if (canaryWasActive) {
      const transaction = applyCanaryTransaction({
        beforeState: preparedState,
        legacyState: reconciledState,
        agentEconomy: nextAgentEconomy,
        control: nextControl,
        comparison,
        attemptedCanary: true,
      });
      return {
        ...transaction.state,
        agentEconomy: transaction.agentEconomy,
      };
    }

    return {
      ...reconciledState,
      agentEconomy: {
        ...nextAgentEconomy,
        enabled: false,
        shadowMode: true,
        engineControl: nextControl,
      },
    };
  } catch (error) {
    const comparison = buildFailureComparison(preparedState, error);
    const failedControl = recordEngineComparison(control, comparison, checkpoint);
    if (canaryWasActive) {
      const transaction = applyCanaryTransaction({
        beforeState: preparedState,
        legacyState: reconciledState,
        agentEconomy: reconciledState.agentEconomy,
        control: failedControl,
        comparison,
        attemptedCanary: true,
      });
      return {
        ...transaction.state,
        agentEconomy: transaction.agentEconomy,
      };
    }

    const rolledBackControl = failedControl.activeMode === ENGINE_MODES.SHADOW
      && failedControl.writeBackEnabled === false
      ? failedControl
      : forceEngineRollback(
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
