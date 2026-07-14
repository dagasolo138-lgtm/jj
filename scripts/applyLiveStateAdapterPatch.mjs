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
  `  const adapterCapabilities = normalizeCapabilities(options.adapterCapabilities);\n  const requestedMode = Object.values(ENGINE_MODES).includes(options.requestedMode)`,
  `  const adapterCapabilities = normalizeCapabilities(options.adapterCapabilities);\n  const writeBackEnabled = options.writeBackEnabled === true;\n  const requestedMode = Object.values(ENGINE_MODES).includes(options.requestedMode)`,
  "engine control write flag",
);
replaceOnce(
  controlPath,
  `    canaryEligible: false,\n    adapterCapabilities,\n    promotionBlockers: getAdapterBlockers(adapterCapabilities),`,
  `    canaryEligible: false,\n    adapterCapabilities,\n    writeBackEnabled,\n    promotionBlockers: [\n      ...getAdapterBlockers(adapterCapabilities),\n      ...(writeBackEnabled ? [] : ["candidate-write-disabled"]),\n    ],`,
  "initial promotion blockers",
);
replaceOnce(
  controlPath,
  `    canaryEligible: source.canaryEligible === true,\n    adapterCapabilities,\n    promotionBlockers: Array.isArray(source.promotionBlockers)`,
  `    canaryEligible: source.canaryEligible === true,\n    adapterCapabilities,\n    writeBackEnabled: source.writeBackEnabled === true,\n    promotionBlockers: Array.isArray(source.promotionBlockers)`,
  "normalized write flag",
);
replaceOnce(
  controlPath,
  `function calculateEligibility(control, safeStreak) {\n  const adapterBlockers = getAdapterBlockers(control.adapterCapabilities);\n  const blockers = [...adapterBlockers];`,
  `function calculateEligibility(control, safeStreak) {\n  const adapterBlockers = getAdapterBlockers(control.adapterCapabilities);\n  const blockers = [...adapterBlockers];\n  if (!control.writeBackEnabled) blockers.push("candidate-write-disabled");`,
  "eligibility write blocker",
);
replaceOnce(
  controlPath,
  `export function recordEngineComparison(control, comparison, checkpoint = null) {`,
  `export function setEngineAdapterCapabilities(control, capabilities = {}) {\n  const normalized = normalizeEngineControl(control);\n  const adapterCapabilities = normalizeCapabilities({\n    ...normalized.adapterCapabilities,\n    ...capabilities,\n  });\n  const eligibility = calculateEligibility(\n    { ...normalized, adapterCapabilities },\n    normalized.consecutiveSafeQuarters,\n  );\n  return {\n    ...normalized,\n    adapterCapabilities,\n    canaryEligible: eligibility.eligible,\n    promotionBlockers: eligibility.blockers,\n  };\n}\n\nexport function setEngineWriteBackEnabled(control, enabled) {\n  const normalized = normalizeEngineControl(control);\n  const writeBackEnabled = enabled === true;\n  const eligibility = calculateEligibility(\n    { ...normalized, writeBackEnabled },\n    normalized.consecutiveSafeQuarters,\n  );\n  return {\n    ...normalized,\n    writeBackEnabled,\n    canaryEligible: eligibility.eligible,\n    promotionBlockers: eligibility.blockers,\n  };\n}\n\nexport function recordEngineComparison(control, comparison, checkpoint = null) {`,
  "engine adapter setters",
);

const factoryPath = "src/engine/agentEconomy/householdFactory.js";
replaceOnce(factoryPath, "export const AGENT_ECONOMY_SCHEMA_VERSION = 8;", "export const AGENT_ECONOMY_SCHEMA_VERSION = 9;", "schema version");
replaceOnce(
  factoryPath,
  `    engineControl: createInitialEngineControl(),\n    maxHouseholds,`,
  `    engineControl: createInitialEngineControl(),\n    liveStateAdapter: null,\n    maxHouseholds,`,
  "initial live adapter",
);

const utilsPath = "src/engine/agentEconomy/householdUtils.js";
replaceOnce(
  utilsPath,
  `    engineControl: normalizeEngineControl(source.engineControl),\n    maxHouseholds,`,
  `    engineControl: normalizeEngineControl(source.engineControl),\n    liveStateAdapter: source.liveStateAdapter && typeof source.liveStateAdapter === "object"\n      ? JSON.parse(JSON.stringify(source.liveStateAdapter))\n      : null,\n    maxHouseholds,`,
  "preserve live adapter",
);
replaceOnce(
  utilsPath,
  `      engineControl: sanitized.engineControl,\n      rngSeed: sanitized.rngSeed,`,
  `      engineControl: sanitized.engineControl,\n      liveStateAdapter: sanitized.liveStateAdapter,\n      rngSeed: sanitized.rngSeed,`,
  "preserve adapter on empty migration",
);

const integratedPath = "src/engine/agentEconomy/integratedGameReducer.js";
replaceOnce(
  integratedPath,
  `import { hydrateAgentEconomy, reconcileAgentEconomyPopulation } from "./householdUtils.js";`,
  `import { hydrateAgentEconomy } from "./householdUtils.js";\nimport {\n  ensureLiveStateAdapter,\n  finalizeAgentQuarterLiveState,\n  reconcileLiveStateTransition,\n} from "./liveStateAdapter.js";`,
  "integrated adapter imports",
);
replaceOnce(
  integratedPath,
  `  const agentEconomy = hydrateAgentEconomy(\n    source.agentEconomy,\n    population,\n    {\n      createdTurn: source.turn ?? 0,\n      maxHouseholds: source.agentEconomy?.maxHouseholds,\n      origin,\n      estateInventory: source.inventory,\n    },\n  );`,
  `  const hydratedAgentEconomy = hydrateAgentEconomy(\n    source.agentEconomy,\n    population,\n    {\n      createdTurn: source.turn ?? 0,\n      maxHouseholds: source.agentEconomy?.maxHouseholds,\n      origin,\n      estateInventory: source.inventory,\n    },\n  );\n  const agentEconomy = ensureLiveStateAdapter(hydratedAgentEconomy, source);`,
  "ensure adapter on hydration",
);
replaceOnce(
  integratedPath,
  `  const nextState = legacyGameReducer(preparedState, action);\n\n  let origin = "state-reconciliation";`,
  `  const nextState = legacyGameReducer(preparedState, action);\n  const transitionedAgentEconomy = reconcileLiveStateTransition(\n    preparedState.agentEconomy,\n    preparedState,\n    nextState,\n    action,\n  );\n\n  let origin = "state-reconciliation";`,
  "reconcile legacy transition",
);
replaceOnce(
  integratedPath,
  `  const reconciledState = ensureAgentEconomyState(nextState, origin);`,
  `  const reconciledState = ensureAgentEconomyState({\n    ...nextState,\n    agentEconomy: transitionedAgentEconomy,\n  }, origin);`,
  "hydrate transitioned state",
);
replaceOnce(
  integratedPath,
  `    const nextControl = recordEngineComparison(control, comparison, checkpoint);\n    const nextAgentEconomy = reconcileAgentEconomyPopulation(\n      simulatedAgentEconomy,\n      reconciledState.population,\n      {\n        createdTurn: preparedState.turn,\n        origin: "dual-engine-quarter-resolution",\n      },\n    );`,
  `    const nextControl = recordEngineComparison(control, comparison, checkpoint);\n    const nextAgentEconomy = finalizeAgentQuarterLiveState(\n      preparedState.agentEconomy,\n      simulatedAgentEconomy,\n      reconciledState,\n    );`,
  "finalize quarter adapters",
);
replaceOnce(
  integratedPath,
  `        enabled: nextControl.activeMode === ENGINE_MODES.CANARY,\n        shadowMode: nextControl.activeMode !== ENGINE_MODES.CANARY,\n        engineControl: nextControl,`,
  `        enabled: false,\n        shadowMode: true,\n        engineControl: nextControl,`,
  "force step two shadow mode",
);

const indexPath = "src/engine/agentEconomy/index.js";
replaceOnce(
  indexPath,
  `  requestEngineMode,\n  shouldRunAgentEngine,`,
  `  requestEngineMode,\n  setEngineAdapterCapabilities,\n  setEngineWriteBackEnabled,\n  shouldRunAgentEngine,`,
  "index engine exports",
);
replaceOnce(
  indexPath,
  `export {\n  OCCUPATIONS,`,
  `export {\n  LIVE_STATE_ADAPTER_CAPABILITIES,\n  LIVE_STATE_ADAPTER_VERSION,\n  createInitialLiveStateAdapter,\n  createLegacyLiveSnapshot,\n  ensureLiveStateAdapter,\n  finalizeAgentQuarterLiveState,\n  normalizeLiveStateAdapter,\n  projectAgentEconomyToLegacyState,\n  reconcileLiveStateTransition,\n} from "./liveStateAdapter.js";\n\nexport {\n  OCCUPATIONS,`,
  "index live adapter exports",
);

const livePath = "src/engine/agentEconomy/liveStateAdapter.js";
replaceOnce(
  livePath,
  `  const capabilities = Object.fromEntries(\n    Object.keys(LIVE_STATE_ADAPTER_CAPABILITIES).map((key) => [\n      key,\n      source.capabilities?.[key] === true,\n    ]),\n  );`,
  `  const capabilities = Object.fromEntries(\n    Object.keys(LIVE_STATE_ADAPTER_CAPABILITIES).map((key) => [\n      key,\n      source.capabilities && Object.hasOwn(source.capabilities, key)\n        ? source.capabilities[key] === true\n        : fallback.capabilities[key],\n    ]),\n  );`,
  "adapter capability fallback",
);

const engineTestPath = "tests/unit/agentEconomyEngineControl.test.js";
replaceOnce(
  engineTestPath,
  `test("new games start in shadow mode with legacy authority", () => {`,
  `test("new games start in shadow mode with live adapters ready and write-back blocked", () => {`,
  "engine test title",
);
replaceOnce(
  engineTestPath,
  `  assert.equal(control.canaryEligible, false);\n  assert.ok(control.promotionBlockers.some((item) => item.startsWith("adapter-not-ready:")));`,
  `  assert.equal(control.canaryEligible, false);\n  assert.ok(Object.values(control.adapterCapabilities).every(Boolean));\n  assert.ok(!control.promotionBlockers.some((item) => item.startsWith("adapter-not-ready:")));\n  assert.ok(control.promotionBlockers.includes("candidate-write-disabled"));`,
  "engine adapter expectations",
);
replaceOnce(
  engineTestPath,
  `  let control = createInitialEngineControl({\n    adapterCapabilities: {`,
  `  let control = createInitialEngineControl({\n    writeBackEnabled: true,\n    adapterCapabilities: {`,
  "canary eligibility write flag",
);
replaceOnce(
  engineTestPath,
  `  let control = createInitialEngineControl({\n    requestedMode: ENGINE_MODES.CANARY,`,
  `  let control = createInitialEngineControl({\n    requestedMode: ENGINE_MODES.CANARY,\n    writeBackEnabled: true,`,
  "rollback write flag",
);
