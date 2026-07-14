import { checkGameOver } from "../meterUtils.js";
import {
  ENGINE_MODES,
  forceEngineRollback,
  normalizeEngineControl,
} from "./engineControlSystem.js";
import {
  finalizeCanaryCampaignTransaction,
  isCanaryCampaignRunning,
} from "./canaryCampaignSystem.js";
import { recordCanaryObservation } from "./canaryObservationSystem.js";
import {
  createLegacyLiveSnapshot,
  projectAgentEconomyToLegacyState,
} from "./liveStateAdapter.js";

export const CANARY_TRANSACTION_VERSION = 1;
export const CANARY_TRANSACTION_HISTORY_LIMIT = 20;

const FOOD_COMMODITIES = ["grain", "livestock", "fish", "flour"];

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function integer(value, fallback = 0) {
  return Math.max(0, Math.floor(finite(value, fallback)));
}

function money(value) {
  return Number(Math.max(0, finite(value)).toFixed(2));
}

function quantity(value) {
  return Number(Math.max(0, finite(value)).toFixed(4));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function cloneGameOverReason(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return clone(value);
  return null;
}

function gameOverSignature(value) {
  if (value == null) return "none";
  if (typeof value === "string") return "string:" + value;
  if (typeof value === "object") {
    return "object:" + (value.type ?? "unknown") + ":" + (value.reason ?? "");
  }
  return typeof value + ":" + String(value);
}

function cloneInventory(inventory = {}) {
  return Object.fromEntries(
    Object.entries(inventory ?? {}).map(([commodity, amount]) => [commodity, quantity(amount)]),
  );
}

function sumFood(inventory = {}) {
  return quantity(FOOD_COMMODITIES.reduce(
    (total, commodity) => total + finite(inventory?.[commodity]),
    0,
  ));
}

function householdPopulation(agentEconomy = {}) {
  return (agentEconomy.households ?? []).reduce(
    (total, household) => total + integer(household?.weight),
    0,
  );
}

function createTransactionId(turn, sequence) {
  return `canary-turn-${integer(turn)}-${String(integer(sequence, 1)).padStart(4, "0")}`;
}

export function createCanaryCheckpoint(state = {}) {
  return {
    version: CANARY_TRANSACTION_VERSION,
    turn: integer(state.turn),
    season: typeof state.season === "string" ? state.season : null,
    denarii: money(state.denarii),
    food: quantity(state.food),
    population: integer(state.population),
    inventory: cloneInventory(state.inventory),
    phase: typeof state.phase === "string" ? state.phase : "management",
    gameOverReason: cloneGameOverReason(state.gameOverReason),
    pyrrhicVictory: state.pyrrhicVictory === true,
    bankruptcyTurns: integer(state.bankruptcyTurns),
    starvationTurns: integer(state.starvationTurns),
    resourceDeltas: clone(state.resourceDeltas ?? {}),
    economyHistory: clone(state.economyHistory ?? []),
  };
}

function inspectInventory(inventory, issues) {
  if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) {
    issues.push("invalid-inventory-object");
    return;
  }
  for (const [commodity, amount] of Object.entries(inventory)) {
    if (typeof commodity !== "string" || commodity.length === 0) {
      issues.push("invalid-inventory-key");
    }
    if (!Number.isFinite(amount) || amount < -0.0001) {
      issues.push(`invalid-inventory-quantity:${commodity}`);
    }
  }
}

export function validateCanaryProjection({
  beforeState,
  legacyState,
  projectedState,
  agentEconomy,
} = {}) {
  const issues = [];
  if (!projectedState || typeof projectedState !== "object") {
    return { valid: false, issues: ["missing-projected-state"] };
  }
  if (!Number.isFinite(projectedState.denarii) || projectedState.denarii < 0) {
    issues.push("invalid-denarii");
  }
  if (!Number.isFinite(projectedState.food) || projectedState.food < 0) {
    issues.push("invalid-food");
  }
  if (!Number.isInteger(projectedState.population) || projectedState.population < 0) {
    issues.push("invalid-population");
  }
  inspectInventory(projectedState.inventory, issues);

  const inventoryFood = sumFood(projectedState.inventory);
  if (Math.abs(inventoryFood - finite(projectedState.food)) > 0.0002) {
    issues.push(`food-inventory-mismatch:${projectedState.food}->${inventoryFood}`);
  }

  const representedPopulation = householdPopulation(agentEconomy);
  if (representedPopulation !== integer(projectedState.population)) {
    issues.push(`household-population-mismatch:${representedPopulation}->${projectedState.population}`);
  }

  const bankruptcyTurns = projectedState.denarii <= 0
    ? integer(beforeState?.bankruptcyTurns) + 1
    : 0;
  const starvationTurns = projectedState.food <= 0
    ? integer(beforeState?.starvationTurns) + 1
    : 0;
  const candidateGameOver = checkGameOver({
    population: projectedState.population,
    bankruptcyTurns,
    starvationTurns,
    difficulty: beforeState?.difficulty,
  });
  const legacyGameOver = cloneGameOverReason(legacyState?.gameOverReason);
  if (gameOverSignature(candidateGameOver) !== gameOverSignature(legacyGameOver)) {
    issues.push(
      "outcome-mismatch:" + gameOverSignature(legacyGameOver)
        + "->" + gameOverSignature(candidateGameOver),
    );
  }

  if (projectedState.phase !== legacyState?.phase) {
    issues.push(`phase-mismatch:${legacyState?.phase ?? "unknown"}->${projectedState.phase ?? "unknown"}`);
  }
  if (gameOverSignature(projectedState.gameOverReason) !== gameOverSignature(legacyGameOver)) {
    issues.push("projected-game-over-mismatch");
  }

  return {
    valid: issues.length === 0,
    issues: [...new Set(issues)].slice(0, 50),
    bankruptcyTurns,
    starvationTurns,
    candidateGameOver: cloneGameOverReason(candidateGameOver),
  };
}

function updateEconomyHistory(history, beforeState, projectedState) {
  const source = Array.isArray(history) ? history.map((entry) => ({ ...entry })) : [];
  const nextEntry = {
    turn: integer(beforeState?.turn),
    season: beforeState?.season ?? null,
    netGold: money(projectedState.denarii) - money(beforeState?.denarii),
    netFood: quantity(projectedState.food) - quantity(beforeState?.food),
  };
  if (source.length > 0 && source.at(-1)?.turn === nextEntry.turn) {
    source[source.length - 1] = { ...source.at(-1), ...nextEntry };
  } else {
    source.push(nextEntry);
  }
  return source.slice(-8);
}

function recordTransaction(control, transaction, success) {
  const normalized = normalizeEngineControl(control);
  return {
    ...normalized,
    authority: success ? ENGINE_MODES.CANARY : ENGINE_MODES.LEGACY,
    canaryWriteCount: integer(normalized.canaryWriteCount) + (success ? 1 : 0),
    canaryRollbackCount: integer(normalized.canaryRollbackCount) + (success ? 0 : 1),
    lastCanaryTransaction: transaction,
    canaryTransactionHistory: [
      ...(Array.isArray(normalized.canaryTransactionHistory)
        ? normalized.canaryTransactionHistory
        : []),
      transaction,
    ].slice(-CANARY_TRANSACTION_HISTORY_LIMIT),
  };
}

function updateAdapterAfterTransaction(agentEconomy, officialState, transaction, applied, control) {
  const snapshot = createLegacyLiveSnapshot(officialState);
  const canaryRemainsActive = applied
    && control?.activeMode === ENGINE_MODES.CANARY
    && control?.authority === ENGINE_MODES.CANARY
    && control?.writeBackEnabled === true
    && isCanaryCampaignRunning(control);
  return {
    ...agentEconomy,
    liveStateAdapter: {
      ...(agentEconomy.liveStateAdapter ?? {}),
      shadowOnly: !canaryRemainsActive,
      writeBackEnabled: canaryRemainsActive,
      legacySnapshot: snapshot,
      treasury: {
        ...(agentEconomy.liveStateAdapter?.treasury ?? {}),
        projectedDenarii: snapshot.denarii,
        lastLegacyDenarii: snapshot.denarii,
      },
      estateInventory: {
        ...(agentEconomy.liveStateAdapter?.estateInventory ?? {}),
        lastLegacyInventory: cloneInventory(snapshot.inventory),
      },
      population: {
        ...(agentEconomy.liveStateAdapter?.population ?? {}),
        lastLegacyPopulation: snapshot.population,
      },
      outcome: {
        phase: snapshot.phase,
        gameOverReason: snapshot.gameOverReason,
        victory: snapshot.phase === "victory",
        pyrrhicVictory: snapshot.pyrrhicVictory,
      },
      lastCanaryTransaction: transaction,
    },
  };
}

function rollbackTransaction({
  beforeState,
  legacyState,
  agentEconomy,
  control,
  checkpoint,
  issues,
  comparison,
  alreadyRolledBack = false,
}) {
  const normalized = normalizeEngineControl(control);
  const reason = `canary-transaction:${issues[0] ?? "unknown-failure"}`;
  const rolledBack = alreadyRolledBack
    ? normalized
    : forceEngineRollback(normalized, reason, beforeState?.turn);
  const sequence = integer(normalized.canaryWriteCount) + integer(normalized.canaryRollbackCount) + 1;
  const transaction = {
    id: createTransactionId(beforeState?.turn, sequence),
    version: CANARY_TRANSACTION_VERSION,
    status: "rolled-back",
    applied: false,
    turn: integer(beforeState?.turn),
    season: beforeState?.season ?? null,
    issues: [...new Set(issues)].slice(0, 50),
    comparisonId: comparison?.id ?? null,
    checkpoint,
  };
  const recordedControl = recordTransaction(rolledBack, transaction, false);
  const observedControl = recordCanaryObservation(recordedControl, transaction, comparison);
  const nextControl = finalizeCanaryCampaignTransaction(
    observedControl,
    transaction,
    beforeState?.turn,
  );
  const nextAgentEconomy = updateAdapterAfterTransaction(
    agentEconomy,
    legacyState,
    transaction,
    false,
    nextControl,
  );
  return {
    applied: false,
    state: legacyState,
    agentEconomy: {
      ...nextAgentEconomy,
      enabled: false,
      shadowMode: true,
      engineControl: nextControl,
    },
    control: nextControl,
    transaction,
  };
}

export function applyCanaryTransaction({
  beforeState,
  legacyState,
  agentEconomy,
  control,
  comparison,
  projector = projectAgentEconomyToLegacyState,
  attemptedCanary = false,
} = {}) {
  const normalized = normalizeEngineControl(control);
  const checkpoint = createCanaryCheckpoint(legacyState);
  const canWrite = normalized.activeMode === ENGINE_MODES.CANARY
    && normalized.writeBackEnabled === true
    && isCanaryCampaignRunning(normalized);

  if (!canWrite) {
    if (!attemptedCanary) {
      return {
        applied: false,
        state: legacyState,
        agentEconomy,
        control: normalized,
        transaction: null,
      };
    }
    return rollbackTransaction({
      beforeState,
      legacyState,
      agentEconomy,
      control: normalized,
      checkpoint,
      issues: ["canary-campaign-not-running"],
      comparison,
      alreadyRolledBack: normalized.activeMode !== ENGINE_MODES.CANARY,
    });
  }

  if (!comparison?.safe) {
    return rollbackTransaction({
      beforeState,
      legacyState,
      agentEconomy,
      control: normalized,
      checkpoint,
      issues: comparison?.criticalIssues?.length > 0
        ? comparison.criticalIssues
        : ["unsafe-engine-comparison"],
      comparison,
      alreadyRolledBack: normalized.activeMode !== ENGINE_MODES.CANARY,
    });
  }

  let projectedState;
  try {
    projectedState = projector(agentEconomy, legacyState);
  } catch (error) {
    return rollbackTransaction({
      beforeState,
      legacyState,
      agentEconomy,
      control: normalized,
      checkpoint,
      issues: [`projection-exception:${error instanceof Error ? error.message : String(error)}`],
      comparison,
    });
  }

  const validation = validateCanaryProjection({
    beforeState,
    legacyState,
    projectedState,
    agentEconomy,
  });
  if (!validation.valid) {
    return rollbackTransaction({
      beforeState,
      legacyState,
      agentEconomy,
      control: normalized,
      checkpoint,
      issues: validation.issues,
      comparison,
    });
  }

  const officialState = {
    ...legacyState,
    denarii: money(projectedState.denarii),
    food: quantity(projectedState.food),
    population: integer(projectedState.population),
    inventory: cloneInventory(projectedState.inventory),
    bankruptcyTurns: validation.bankruptcyTurns,
    starvationTurns: validation.starvationTurns,
    resourceDeltas: {
      denarii: money(projectedState.denarii) - money(beforeState?.denarii),
      food: quantity(projectedState.food) - quantity(beforeState?.food),
      population: integer(projectedState.population) - integer(beforeState?.population),
      garrison: integer(legacyState?.garrison) - integer(beforeState?.garrison),
    },
    economyHistory: updateEconomyHistory(
      legacyState?.economyHistory,
      beforeState,
      projectedState,
    ),
  };
  const sequence = integer(normalized.canaryWriteCount) + integer(normalized.canaryRollbackCount) + 1;
  const transaction = {
    id: createTransactionId(beforeState?.turn, sequence),
    version: CANARY_TRANSACTION_VERSION,
    status: "committed",
    applied: true,
    turn: integer(beforeState?.turn),
    season: beforeState?.season ?? null,
    issues: [],
    comparisonId: comparison?.id ?? null,
    checkpoint,
    committed: createCanaryCheckpoint(officialState),
  };
  const recordedControl = recordTransaction(normalized, transaction, true);
  const observedControl = recordCanaryObservation(recordedControl, transaction, comparison);
  const nextControl = finalizeCanaryCampaignTransaction(
    observedControl,
    transaction,
    beforeState?.turn,
  );
  const canaryRemainsActive = nextControl.activeMode === ENGINE_MODES.CANARY
    && nextControl.authority === ENGINE_MODES.CANARY
    && nextControl.writeBackEnabled === true
    && isCanaryCampaignRunning(nextControl);
  const nextAgentEconomy = updateAdapterAfterTransaction(
    agentEconomy,
    officialState,
    transaction,
    true,
    nextControl,
  );

  return {
    applied: true,
    state: officialState,
    agentEconomy: {
      ...nextAgentEconomy,
      enabled: canaryRemainsActive,
      shadowMode: !canaryRemainsActive,
      engineControl: nextControl,
    },
    control: nextControl,
    transaction,
  };
}
