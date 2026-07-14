import fs from "node:fs";

function replaceOnce(path, search, replacement, label) {
  const source = fs.readFileSync(path, "utf8");
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Ambiguous patch anchor: ${label}`);
  }
  fs.writeFileSync(path, source.replace(search, replacement));
}

const controlPath = "src/engine/agentEconomy/engineControlSystem.js";
replaceOnce(
  controlPath,
  `    version: 1,`,
  `    version: 2,`,
  "initial control version",
);
replaceOnce(
  controlPath,
  `    rollbackCount: 0,\n    lastRollbackReason: null,`,
  `    rollbackCount: 0,\n    canaryWriteCount: 0,\n    canaryRollbackCount: 0,\n    lastCanaryTransaction: null,\n    canaryTransactionHistory: [],\n    lastRollbackReason: null,`,
  "initial canary transaction fields",
);
replaceOnce(
  controlPath,
  `  const requestedMode = Object.values(ENGINE_MODES).includes(source.requestedMode)\n    ? source.requestedMode\n    : activeMode;\n\n  return {`,
  `  const requestedMode = Object.values(ENGINE_MODES).includes(source.requestedMode)\n    ? source.requestedMode\n    : activeMode;\n  const writeBackEnabled = source.writeBackEnabled === true;\n  const authority = source.authority === ENGINE_MODES.CANARY\n    && activeMode === ENGINE_MODES.CANARY\n    && writeBackEnabled\n    ? ENGINE_MODES.CANARY\n    : ENGINE_MODES.LEGACY;\n\n  return {`,
  "normalized authority variables",
);
replaceOnce(
  controlPath,
  `    version: 1,\n    requestedMode,\n    activeMode,\n    authority: ENGINE_MODES.LEGACY,`,
  `    version: 2,\n    requestedMode,\n    activeMode,\n    authority,`,
  "normalized control version",
);
replaceOnce(
  controlPath,
  `    writeBackEnabled: source.writeBackEnabled === true,`,
  `    writeBackEnabled,`,
  "normalized write back",
);
replaceOnce(
  controlPath,
  `    rollbackCount: integer(source.rollbackCount),\n    lastRollbackReason:`,
  `    rollbackCount: integer(source.rollbackCount),\n    canaryWriteCount: integer(source.canaryWriteCount),\n    canaryRollbackCount: integer(source.canaryRollbackCount),\n    lastCanaryTransaction: source.lastCanaryTransaction && typeof source.lastCanaryTransaction === "object"\n      ? source.lastCanaryTransaction\n      : null,\n    canaryTransactionHistory: Array.isArray(source.canaryTransactionHistory)\n      ? source.canaryTransactionHistory.slice(-20)\n      : [],\n    lastRollbackReason:`,
  "normalized transaction fields",
);

const oldSetWriteBack = `export function setEngineWriteBackEnabled(control, enabled) {\n  const normalized = normalizeEngineControl(control);\n  const writeBackEnabled = enabled === true;\n  const eligibility = calculateEligibility(\n    { ...normalized, writeBackEnabled },\n    normalized.consecutiveSafeQuarters,\n  );\n  return {\n    ...normalized,\n    writeBackEnabled,\n    canaryEligible: eligibility.eligible,\n    promotionBlockers: eligibility.blockers,\n  };\n}`;
const newSetWriteBack = `export function setEngineWriteBackEnabled(control, enabled) {\n  const normalized = normalizeEngineControl(control);\n  const writeBackEnabled = enabled === true;\n  const activeMode = !writeBackEnabled && normalized.activeMode === ENGINE_MODES.CANARY\n    ? ENGINE_MODES.SHADOW\n    : normalized.activeMode;\n  const requestedMode = !writeBackEnabled && normalized.requestedMode === ENGINE_MODES.CANARY\n    ? ENGINE_MODES.SHADOW\n    : normalized.requestedMode;\n  const eligibility = calculateEligibility(\n    { ...normalized, activeMode, requestedMode, writeBackEnabled },\n    normalized.consecutiveSafeQuarters,\n  );\n  return {\n    ...normalized,\n    requestedMode,\n    activeMode,\n    authority: writeBackEnabled ? normalized.authority : ENGINE_MODES.LEGACY,\n    writeBackEnabled,\n    canaryEligible: eligibility.eligible,\n    promotionBlockers: eligibility.blockers,\n  };\n}`;
replaceOnce(controlPath, oldSetWriteBack, newSetWriteBack, "set write back behavior");

const recordStart = controlPath;
const oldRecord = `export function recordEngineComparison(control, comparison, checkpoint = null) {\n  const normalized = normalizeEngineControl(control);\n  const safeStreak = comparison?.safe ? normalized.consecutiveSafeQuarters + 1 : 0;\n  const eligibility = calculateEligibility(normalized, safeStreak);\n  let activeMode = normalized.activeMode;\n  let rollbackCount = normalized.rollbackCount;\n  let lastRollbackReason = normalized.lastRollbackReason;\n\n  if (!comparison?.safe && normalized.autoRollback && activeMode === ENGINE_MODES.CANARY) {\n    activeMode = ENGINE_MODES.SHADOW;\n    rollbackCount += 1;\n    lastRollbackReason = comparison.criticalIssues?.[0] ?? "unsafe-engine-comparison";\n  }\n\n  if (normalized.requestedMode === ENGINE_MODES.CANARY && eligibility.eligible) {\n    activeMode = ENGINE_MODES.CANARY;\n  } else if (normalized.requestedMode === ENGINE_MODES.LEGACY) {\n    activeMode = ENGINE_MODES.LEGACY;\n  } else if (activeMode !== ENGINE_MODES.CANARY) {\n    activeMode = ENGINE_MODES.SHADOW;\n  }\n\n  return {\n    ...normalized,\n    activeMode,\n    authority: ENGINE_MODES.LEGACY,\n    consecutiveSafeQuarters: safeStreak,\n    totalComparisons: normalized.totalComparisons + 1,\n    safeComparisons: normalized.safeComparisons + (comparison?.safe ? 1 : 0),\n    unsafeComparisons: normalized.unsafeComparisons + (comparison?.safe ? 0 : 1),\n    canaryEligible: eligibility.eligible,\n    promotionBlockers: eligibility.blockers,\n    rollbackCount,\n    lastRollbackReason,\n    lastComparison: comparison,\n    comparisonHistory: [\n      ...normalized.comparisonHistory,\n      comparison,\n    ].slice(-COMPARISON_HISTORY_LIMIT),\n    legacyCheckpoint: checkpoint ?? normalized.legacyCheckpoint,\n  };\n}`;
const newRecord = `export function recordEngineComparison(control, comparison, checkpoint = null) {\n  const normalized = normalizeEngineControl(control);\n  const safeStreak = comparison?.safe ? normalized.consecutiveSafeQuarters + 1 : 0;\n  let activeMode = normalized.activeMode;\n  let writeBackEnabled = normalized.writeBackEnabled;\n  let rollbackCount = normalized.rollbackCount;\n  let lastRollbackReason = normalized.lastRollbackReason;\n\n  if (!comparison?.safe && normalized.autoRollback && activeMode === ENGINE_MODES.CANARY) {\n    activeMode = ENGINE_MODES.SHADOW;\n    writeBackEnabled = false;\n    rollbackCount += 1;\n    lastRollbackReason = comparison.criticalIssues?.[0] ?? "unsafe-engine-comparison";\n  }\n\n  const eligibility = calculateEligibility(\n    { ...normalized, activeMode, writeBackEnabled },\n    safeStreak,\n  );\n  if (normalized.requestedMode === ENGINE_MODES.CANARY && eligibility.eligible) {\n    activeMode = ENGINE_MODES.CANARY;\n  } else if (normalized.requestedMode === ENGINE_MODES.LEGACY) {\n    activeMode = ENGINE_MODES.LEGACY;\n  } else if (activeMode !== ENGINE_MODES.CANARY) {\n    activeMode = ENGINE_MODES.SHADOW;\n  }\n\n  const authority = activeMode === ENGINE_MODES.CANARY\n    && writeBackEnabled\n    && normalized.authority === ENGINE_MODES.CANARY\n    ? ENGINE_MODES.CANARY\n    : ENGINE_MODES.LEGACY;\n\n  return {\n    ...normalized,\n    activeMode,\n    authority,\n    writeBackEnabled,\n    consecutiveSafeQuarters: safeStreak,\n    totalComparisons: normalized.totalComparisons + 1,\n    safeComparisons: normalized.safeComparisons + (comparison?.safe ? 1 : 0),\n    unsafeComparisons: normalized.unsafeComparisons + (comparison?.safe ? 0 : 1),\n    canaryEligible: eligibility.eligible,\n    promotionBlockers: eligibility.blockers,\n    rollbackCount,\n    lastRollbackReason,\n    lastComparison: comparison,\n    comparisonHistory: [\n      ...normalized.comparisonHistory,\n      comparison,\n    ].slice(-COMPARISON_HISTORY_LIMIT),\n    legacyCheckpoint: checkpoint ?? normalized.legacyCheckpoint,\n  };\n}`;
replaceOnce(recordStart, oldRecord, newRecord, "record comparison behavior");

replaceOnce(
  controlPath,
  `    activeMode: normalized.canaryEligible ? ENGINE_MODES.CANARY : ENGINE_MODES.SHADOW,\n    authority: ENGINE_MODES.LEGACY,`,
  `    activeMode: normalized.canaryEligible ? ENGINE_MODES.CANARY : ENGINE_MODES.SHADOW,\n    authority: normalized.canaryEligible && normalized.activeMode === ENGINE_MODES.CANARY\n      ? normalized.authority\n      : ENGINE_MODES.LEGACY,`,
  "canary request authority",
);
replaceOnce(
  controlPath,
  `    requestedMode: ENGINE_MODES.SHADOW,\n    activeMode: ENGINE_MODES.SHADOW,\n    authority: ENGINE_MODES.LEGACY,\n    rollbackCount: normalized.rollbackCount + 1,`,
  `    requestedMode: ENGINE_MODES.SHADOW,\n    activeMode: ENGINE_MODES.SHADOW,\n    authority: ENGINE_MODES.LEGACY,\n    writeBackEnabled: false,\n    canaryEligible: false,\n    promotionBlockers: calculateEligibility(\n      { ...normalized, writeBackEnabled: false },\n      normalized.consecutiveSafeQuarters,\n    ).blockers,\n    rollbackCount: normalized.rollbackCount + 1,`,
  "force rollback safety",
);

const livePath = "src/engine/agentEconomy/liveStateAdapter.js";
replaceOnce(
  livePath,
  `import { setEngineAdapterCapabilities } from "./engineControlSystem.js";`,
  `import { ENGINE_MODES, setEngineAdapterCapabilities } from "./engineControlSystem.js";`,
  "live adapter mode import",
);
replaceOnce(
  livePath,
  `function attachAdapter(agentEconomy, adapter) {\n  return {\n    ...agentEconomy,\n    liveStateAdapter: adapter,\n    engineControl: setEngineAdapterCapabilities(\n      agentEconomy.engineControl,\n      adapter.capabilities,\n    ),\n  };\n}`,
  `function attachAdapter(agentEconomy, adapter) {\n  const engineControl = setEngineAdapterCapabilities(\n    agentEconomy.engineControl,\n    adapter.capabilities,\n  );\n  const canaryWriting = engineControl.activeMode === ENGINE_MODES.CANARY\n    && engineControl.writeBackEnabled\n    && engineControl.authority === ENGINE_MODES.CANARY;\n  return {\n    ...agentEconomy,\n    liveStateAdapter: {\n      ...adapter,\n      writeBackEnabled: engineControl.writeBackEnabled,\n      shadowOnly: !canaryWriting,\n    },\n    engineControl,\n  };\n}`,
  "sync live adapter mode",
);

const canaryPath = "src/engine/agentEconomy/canaryTransactionSystem.js";
replaceOnce(
  canaryPath,
  `  projector = projectAgentEconomyToLegacyState,\n} = {}) {`,
  `  projector = projectAgentEconomyToLegacyState,\n  attemptedCanary = false,\n} = {}) {`,
  "attempted canary option",
);
replaceOnce(
  canaryPath,
  `  const canWrite = normalized.activeMode === ENGINE_MODES.CANARY\n    && normalized.writeBackEnabled === true;\n\n  if (!canWrite) {`,
  `  const canWrite = normalized.activeMode === ENGINE_MODES.CANARY\n    && normalized.writeBackEnabled === true;\n\n  if (!canWrite && !attemptedCanary) {`,
  "attempted canary gate",
);

const factoryPath = "src/engine/agentEconomy/householdFactory.js";
replaceOnce(factoryPath, "export const AGENT_ECONOMY_SCHEMA_VERSION = 9;", "export const AGENT_ECONOMY_SCHEMA_VERSION = 10;", "schema version");

const integratedPath = "src/engine/agentEconomy/integratedGameReducer.js";
replaceOnce(
  integratedPath,
  `  requestEngineMode,\n  shouldRunAgentEngine,`,
  `  requestEngineMode,\n  setEngineWriteBackEnabled,\n  shouldRunAgentEngine,`,
  "integrated write back import",
);
replaceOnce(
  integratedPath,
  `import { hydrateAgentEconomy } from "./householdUtils.js";`,
  `import { hydrateAgentEconomy } from "./householdUtils.js";\nimport { applyCanaryTransaction } from "./canaryTransactionSystem.js";`,
  "integrated canary import",
);
replaceOnce(
  integratedPath,
  `  if (action?.type === "AGENT_ECONOMY_FORCE_ROLLBACK") {`,
  `  if (action?.type === "AGENT_ECONOMY_SET_WRITE_BACK") {\n    const enabled = action.payload?.enabled === true;\n    const engineControl = setEngineWriteBackEnabled(\n      state.agentEconomy.engineControl,\n      enabled,\n    );\n    return {\n      ...state,\n      agentEconomy: {\n        ...state.agentEconomy,\n        enabled: false,\n        shadowMode: true,\n        liveStateAdapter: {\n          ...(state.agentEconomy.liveStateAdapter ?? {}),\n          writeBackEnabled: engineControl.writeBackEnabled,\n          shadowOnly: true,\n        },\n        engineControl,\n      },\n    };\n  }\n\n  if (action?.type === "AGENT_ECONOMY_FORCE_ROLLBACK") {`,
  "write back control action",
);
replaceOnce(
  integratedPath,
  `        engineControl: forceEngineRollback(\n          state.agentEconomy.engineControl,\n          action.payload?.reason ?? "manual-rollback",\n          state.turn,\n        ),`,
  `        liveStateAdapter: {\n          ...(state.agentEconomy.liveStateAdapter ?? {}),\n          writeBackEnabled: false,\n          shadowOnly: true,\n        },\n        engineControl: forceEngineRollback(\n          state.agentEconomy.engineControl,\n          action.payload?.reason ?? "manual-rollback",\n          state.turn,\n        ),`,
  "manual rollback adapter flags",
);
replaceOnce(
  integratedPath,
  `  const checkpoint = createLegacyCheckpoint(preparedState);\n\n  try {`,
  `  const checkpoint = createLegacyCheckpoint(preparedState);\n  const canaryWasActive = control.activeMode === ENGINE_MODES.CANARY\n    && control.writeBackEnabled === true;\n\n  try {`,
  "canary attempt flag",
);
replaceOnce(
  integratedPath,
  `    return {\n      ...reconciledState,\n      agentEconomy: {\n        ...nextAgentEconomy,\n        enabled: false,\n        shadowMode: true,\n        engineControl: nextControl,\n      },\n    };`,
  `    if (canaryWasActive) {\n      const transaction = applyCanaryTransaction({\n        beforeState: preparedState,\n        legacyState: reconciledState,\n        agentEconomy: nextAgentEconomy,\n        control: nextControl,\n        comparison,\n        attemptedCanary: true,\n      });\n      return {\n        ...transaction.state,\n        agentEconomy: transaction.agentEconomy,\n      };\n    }\n\n    return {\n      ...reconciledState,\n      agentEconomy: {\n        ...nextAgentEconomy,\n        enabled: false,\n        shadowMode: true,\n        engineControl: nextControl,\n      },\n    };`,
  "canary transaction application",
);
replaceOnce(
  integratedPath,
  `    const rolledBackControl = forceEngineRollback(\n      failedControl,\n      comparison.criticalIssues[0],\n      preparedState.turn,\n    );\n\n    return {\n      ...reconciledState,\n      agentEconomy: {\n        ...reconciledState.agentEconomy,\n        enabled: false,\n        shadowMode: true,\n        engineControl: rolledBackControl,\n      },\n    };`,
  `    if (canaryWasActive) {\n      const transaction = applyCanaryTransaction({\n        beforeState: preparedState,\n        legacyState: reconciledState,\n        agentEconomy: reconciledState.agentEconomy,\n        control: failedControl,\n        comparison,\n        attemptedCanary: true,\n      });\n      return {\n        ...transaction.state,\n        agentEconomy: transaction.agentEconomy,\n      };\n    }\n\n    const rolledBackControl = failedControl.activeMode === ENGINE_MODES.SHADOW\n      && failedControl.writeBackEnabled === false\n      ? failedControl\n      : forceEngineRollback(\n        failedControl,\n        comparison.criticalIssues[0],\n        preparedState.turn,\n      );\n\n    return {\n      ...reconciledState,\n      agentEconomy: {\n        ...reconciledState.agentEconomy,\n        enabled: false,\n        shadowMode: true,\n        engineControl: rolledBackControl,\n      },\n    };`,
  "canary exception rollback",
);

const indexPath = "src/engine/agentEconomy/index.js";
replaceOnce(
  indexPath,
  `export {\n  LIVE_STATE_ADAPTER_CAPABILITIES,`,
  `export {\n  CANARY_TRANSACTION_HISTORY_LIMIT,\n  CANARY_TRANSACTION_VERSION,\n  applyCanaryTransaction,\n  createCanaryCheckpoint,\n  validateCanaryProjection,\n} from "./canaryTransactionSystem.js";\n\nexport {\n  LIVE_STATE_ADAPTER_CAPABILITIES,`,
  "canary exports",
);
