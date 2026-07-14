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
  `import { createHousehold } from "./householdFactory.js";`,
  `import { createHousehold, createInitialAgentEconomy } from "./householdFactory.js";`,
  "initial economy import",
);
replaceOnce(
  livePath,
  `  if (RESET_ACTIONS.has(actionType)) {\n    adapter = createInitialLiveStateAdapter(afterLegacy);\n    return attachAdapter(working, adapter);\n  }`,
  `  if (RESET_ACTIONS.has(actionType)) {\n    adapter = createInitialLiveStateAdapter(afterLegacy);\n    if (actionType === "LOAD_SAVE" && Array.isArray(agentEconomy?.households)) {\n      const loaded = reconcileAgentEconomyPopulation(agentEconomy, after.population, {\n        createdTurn: after.turn,\n        origin: "live-adapter:load-save",\n        estateInventory: after.inventory,\n      });\n      return attachAdapter({ ...loaded, liveStateAdapter: adapter }, adapter);\n    }\n    const reset = createInitialAgentEconomy(after.population, {\n      createdTurn: after.turn,\n      origin: "live-adapter:" + actionType.toLowerCase(),\n      estateInventory: after.inventory,\n      seed: agentEconomy?.rngSeed,\n    });\n    return attachAdapter(reset, adapter);\n  }`,
  "reset transition",
);

const integratedPath = "src/engine/agentEconomy/integratedGameReducer.js";
replaceOnce(
  integratedPath,
  `  const transitionedAgentEconomy = reconcileLiveStateTransition(\n    preparedState.agentEconomy,\n    preparedState,`,
  `  const transitionSource = action?.type === "LOAD_SAVE" && nextState.agentEconomy\n    ? nextState.agentEconomy\n    : preparedState.agentEconomy;\n  const transitionedAgentEconomy = reconcileLiveStateTransition(\n    transitionSource,\n    preparedState,`,
  "load save source",
);
