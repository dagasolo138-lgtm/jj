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

const livePath = "src/engine/agentEconomy/liveStateAdapter.js";
replaceOnce(
  livePath,
  "export const LIVE_STATE_ADAPTER_VERSION = 1;",
  "export const LIVE_STATE_ADAPTER_VERSION = 2;",
  "live adapter version",
);
replaceOnce(
  livePath,
  `export function ensureLiveStateAdapter(agentEconomy, legacyState = {}) {\n  const adapter = normalizeLiveStateAdapter(agentEconomy?.liveStateAdapter, legacyState);\n  return attachAdapter(agentEconomy, adapter);\n}\n\nexport function reconcileLiveStateTransition`,
  `export function ensureLiveStateAdapter(agentEconomy, legacyState = {}) {\n  const adapter = normalizeLiveStateAdapter(agentEconomy?.liveStateAdapter, legacyState);\n  return attachAdapter(agentEconomy, adapter);\n}\n\nexport function rebaseAgentEconomyForCanary(agentEconomy, legacyState = {}, options = {}) {\n  const snapshot = createLegacyLiveSnapshot(legacyState);\n  let working = ensureLiveStateAdapter(agentEconomy, legacyState);\n  const beforeInventory = getDistributedInventoryTotals(working.households);\n  const beforeProjected = projectAgentEconomyToLegacyState(working, legacyState);\n  const populationResult = conservePopulationAssets(working, snapshot.population, {\n    createdTurn: snapshot.turn,\n    origin: options.origin ?? \"canary-activation-rebase\",\n    legacyState,\n  });\n  working = populationResult.agentEconomy;\n\n  let households = distributeEstateInventory(working.households, snapshot.inventory, { replace: true });\n  const adapter = normalizeLiveStateAdapter(working.liveStateAdapter, legacyState);\n  const reserveCash = money(adapter.unassignedAssets?.cash);\n  if (reserveCash > 0 && households.length > 0) {\n    const [first, ...rest] = households;\n    households = [{ ...first, cash: money(finite(first.cash) + reserveCash) }, ...rest];\n  }\n\n  const rebasedAdapter = {\n    ...adapter,\n    legacySnapshot: snapshot,\n    treasury: {\n      ...adapter.treasury,\n      projectedDenarii: snapshot.denarii,\n      lastLegacyDenarii: snapshot.denarii,\n      lastExternalDelta: 0,\n      lastFiscalDelta: 0,\n    },\n    estateInventory: {\n      lastLegacyInventory: cloneInventory(snapshot.inventory),\n      lastAppliedDelta: {},\n      unresolvedDelta: {},\n    },\n    population: {\n      lastLegacyPopulation: snapshot.population,\n      lastDelta: 0,\n      conservedCash: populationResult.conservedCash,\n      conservedInventory: populationResult.conservedInventory,\n    },\n    outcome: {\n      phase: snapshot.phase,\n      gameOverReason: snapshot.gameOverReason,\n      victory: snapshot.phase === \"victory\",\n      pyrrhicVictory: snapshot.pyrrhicVictory,\n    },\n    unassignedAssets: normalizeReserve(),\n    activationBaseline: {\n      version: 1,\n      turn: snapshot.turn,\n      season: snapshot.season,\n      reason: options.reason ?? \"canary-start\",\n      official: {\n        denarii: snapshot.denarii,\n        food: sumFood(snapshot.inventory),\n        population: snapshot.population,\n        inventory: cloneInventory(snapshot.inventory),\n      },\n      previousProjection: {\n        denarii: money(beforeProjected.denarii),\n        food: quantity(beforeProjected.food),\n        population: integer(beforeProjected.population),\n        inventory: cloneInventory(beforeProjected.inventory),\n      },\n      previousHouseholdInventory: cloneInventory(beforeInventory),\n    },\n    lastTransition: {\n      actionType: \"CANARY_ACTIVATION_REBASE\",\n      turn: snapshot.turn,\n      phase: snapshot.phase,\n      reason: options.reason ?? \"canary-start\",\n    },\n  };\n\n  return attachAdapter({\n    ...working,\n    households,\n    pendingOrders: [],\n  }, rebasedAdapter);\n}\n\nexport function reconcileLiveStateTransition`,
  "canary rebase function",
);

const integratedPath = "src/engine/agentEconomy/integratedGameReducer.js";
replaceOnce(
  integratedPath,
  `import {\n  ensureLiveStateAdapter,\n  finalizeAgentQuarterLiveState,\n  reconcileLiveStateTransition,\n} from \"./liveStateAdapter.js\";`,
  `import {\n  ensureLiveStateAdapter,\n  finalizeAgentQuarterLiveState,\n  rebaseAgentEconomyForCanary,\n  reconcileLiveStateTransition,\n} from \"./liveStateAdapter.js\";`,
  "integrated rebase import",
);
replaceOnce(
  integratedPath,
  `import {\n  isCanaryCampaignRunning,\n  startCanaryCampaign,\n  stopCanaryCampaign,\n} from \"./canaryCampaignSystem.js\";`,
  `import {\n  getCanaryCampaignBlockers,\n  isCanaryCampaignRunning,\n  startCanaryCampaign,\n  stopCanaryCampaign,\n} from \"./canaryCampaignSystem.js\";`,
  "campaign blocker import",
);
replaceOnce(
  integratedPath,
  `  if (action?.type === \"AGENT_ECONOMY_START_CANARY_PILOT\") {\n    if (isCanaryPilotActive(currentControl)) return state;\n    const campaignControl = startCanaryCampaign(currentControl, {\n      quarterLimit: 3,\n      turn: state.turn,\n    });\n    const engineControl = startCanaryPilot(\n      campaignControl,\n      campaignControl.canaryCampaign,\n      state.turn,\n    );\n    return applyEngineControl(state, engineControl);\n  }`,
  `  if (action?.type === \"AGENT_ECONOMY_START_CANARY_PILOT\") {\n    if (isCanaryPilotActive(currentControl)) return state;\n    const blockers = getCanaryCampaignBlockers(currentControl, { quarterLimit: 3 });\n    if (blockers.length > 0) {\n      const blockedControl = startCanaryCampaign(currentControl, { quarterLimit: 3, turn: state.turn });\n      return applyEngineControl(state, startCanaryPilot(\n        blockedControl,\n        blockedControl.canaryCampaign,\n        state.turn,\n      ));\n    }\n    const rebasedEconomy = rebaseAgentEconomyForCanary(state.agentEconomy, state, {\n      reason: \"pilot-start\",\n    });\n    const campaignControl = startCanaryCampaign(rebasedEconomy.engineControl, {\n      quarterLimit: 3,\n      turn: state.turn,\n    });\n    const engineControl = startCanaryPilot(\n      campaignControl,\n      campaignControl.canaryCampaign,\n      state.turn,\n    );\n    return applyEngineControl({ ...state, agentEconomy: rebasedEconomy }, engineControl);\n  }`,
  "pilot start rebase",
);
replaceOnce(
  integratedPath,
  `  if (action?.type === \"AGENT_ECONOMY_CONTINUE_CANARY_PILOT\") {\n    const pilot = normalizeCanaryPilot(currentControl.canaryPilot);\n    if (pilot.status !== CANARY_PILOT_STATUS.AWAITING_REVIEW) return state;\n    const campaignControl = startCanaryCampaign(currentControl, {\n      quarterLimit: 3,\n      turn: state.turn,\n    });\n    const engineControl = continueCanaryPilot(\n      campaignControl,\n      campaignControl.canaryCampaign,\n      state.turn,\n    );\n    return applyEngineControl(state, engineControl);\n  }`,
  `  if (action?.type === \"AGENT_ECONOMY_CONTINUE_CANARY_PILOT\") {\n    const pilot = normalizeCanaryPilot(currentControl.canaryPilot);\n    if (pilot.status !== CANARY_PILOT_STATUS.AWAITING_REVIEW) return state;\n    const blockers = getCanaryCampaignBlockers(currentControl, { quarterLimit: 3 });\n    if (blockers.length > 0) return state;\n    const rebasedEconomy = rebaseAgentEconomyForCanary(state.agentEconomy, state, {\n      reason: \"pilot-continue\",\n    });\n    const campaignControl = startCanaryCampaign(rebasedEconomy.engineControl, {\n      quarterLimit: 3,\n      turn: state.turn,\n    });\n    const engineControl = continueCanaryPilot(\n      campaignControl,\n      campaignControl.canaryCampaign,\n      state.turn,\n    );\n    return applyEngineControl({ ...state, agentEconomy: rebasedEconomy }, engineControl);\n  }`,
  "pilot continue rebase",
);
replaceOnce(
  integratedPath,
  `  if (action?.type === \"AGENT_ECONOMY_START_CANARY_CAMPAIGN\") {\n    if (isCanaryPilotActive(currentControl)) return state;\n    const engineControl = startCanaryCampaign(\n      currentControl,\n      {\n        quarterLimit: action.payload?.quarterLimit,\n        turn: state.turn,\n      },\n    );\n    return applyEngineControl(state, engineControl);\n  }`,
  `  if (action?.type === \"AGENT_ECONOMY_START_CANARY_CAMPAIGN\") {\n    if (isCanaryPilotActive(currentControl)) return state;\n    const quarterLimit = action.payload?.quarterLimit;\n    const blockers = getCanaryCampaignBlockers(currentControl, { quarterLimit });\n    if (blockers.length > 0) {\n      return applyEngineControl(state, startCanaryCampaign(currentControl, {\n        quarterLimit,\n        turn: state.turn,\n      }));\n    }\n    const rebasedEconomy = rebaseAgentEconomyForCanary(state.agentEconomy, state, {\n      reason: \"campaign-start\",\n    });\n    const engineControl = startCanaryCampaign(\n      rebasedEconomy.engineControl,\n      {\n        quarterLimit,\n        turn: state.turn,\n      },\n    );\n    return applyEngineControl({ ...state, agentEconomy: rebasedEconomy }, engineControl);\n  }`,
  "campaign start rebase",
);

const indexPath = "src/engine/agentEconomy/index.js";
replaceOnce(
  indexPath,
  `  projectAgentEconomyToLegacyState,\n  reconcileLiveStateTransition,`,
  `  projectAgentEconomyToLegacyState,\n  rebaseAgentEconomyForCanary,\n  reconcileLiveStateTransition,`,
  "index rebase export",
);
