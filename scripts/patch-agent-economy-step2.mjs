import { readFileSync, writeFileSync } from "node:fs";

const file = "src/engine/gameReducer.js";
let source = readFileSync(file, "utf8");

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    if (source.includes(replacement)) return;
    throw new Error(`Patch anchor not found: ${label}`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  `import {\n  generateForgeMarketPrices, rollForgeSupplyEvent, calculateForgeReadiness,\n} from "../data/blacksmith.js";`,
  `import {\n  generateForgeMarketPrices, rollForgeSupplyEvent, calculateForgeReadiness,\n} from "../data/blacksmith.js";\nimport {\n  createInitialAgentEconomy, hydrateAgentEconomy, reconcileAgentEconomyPopulation,\n} from "./agentEconomy/index.js";`,
  "agent economy imports",
);

replaceOnce(
  `  // People tab state (social tiers, labor allocation, notable families, village feed)\n  people: getInitialPeopleState(20),`,
  `  // People tab state (social tiers, labor allocation, notable families, village feed)\n  people: getInitialPeopleState(20),\n\n  // Household proxy state for the future autonomous economy.\n  // Disabled and shadow-only until the migration reaches the integration phase.\n  agentEconomy: createInitialAgentEconomy(20),`,
  "initial household state",
);

replaceOnce(
  `    military: updatedMilitary,\n    resourceDeltas,`,
  `    military: updatedMilitary,\n    agentEconomy: reconcileAgentEconomyPopulation(\n      state.agentEconomy,\n      applied.population,\n      { createdTurn: state.turn, origin: "event-effect" },\n    ),\n    resourceDeltas,`,
  "event population reconciliation",
);

replaceOnce(
  `    military: getInitialMilitaryState(config.startingGarrison ?? 5),\n    people: getInitialPeopleState(config.startingPopulation),`,
  `    military: getInitialMilitaryState(config.startingGarrison ?? 5),\n    people: getInitialPeopleState(config.startingPopulation),\n    agentEconomy: createInitialAgentEconomy(config.startingPopulation),`,
  "new game household state",
);

const updatedPeopleAnchor = `      people: updatedPeople,`;
const updatedPeopleReplacement = `      people: updatedPeople,\n      agentEconomy: reconcileAgentEconomyPopulation(\n        state.agentEconomy,\n        econResult.population,\n        { createdTurn: state.turn, origin: "season-resolution" },\n      ),`;
let peopleReplacements = 0;
while (source.includes(updatedPeopleAnchor)) {
  source = source.replace(updatedPeopleAnchor, updatedPeopleReplacement);
  peopleReplacements += 1;
}
if (peopleReplacements !== 3 && !source.includes(`origin: "season-resolution"`)) {
  throw new Error(`Expected 3 season household insertions, found ${peopleReplacements}`);
}

const raidAnchor = `      military: updatedRaidMil,\n      bankruptcyTurns: raidBankruptcyTurns,`;
const raidReplacement = `      military: updatedRaidMil,\n      agentEconomy: reconcileAgentEconomyPopulation(\n        state.agentEconomy,\n        newPopulation,\n        { createdTurn: state.turn, origin: "raid-resolution" },\n      ),\n      bankruptcyTurns: raidBankruptcyTurns,`;
let raidReplacements = 0;
while (source.includes(raidAnchor)) {
  source = source.replace(raidAnchor, raidReplacement);
  raidReplacements += 1;
}
if (raidReplacements !== 2 && !source.includes(`origin: "raid-resolution"`)) {
  throw new Error(`Expected 2 raid household insertions, found ${raidReplacements}`);
}

replaceOnce(
  `    military: flipMilitary,\n    bankruptcyTurns: flipBankruptcyTurns,`,
  `    military: flipMilitary,\n    agentEconomy: reconcileAgentEconomyPopulation(\n      state.agentEconomy,\n      applied.population,\n      { createdTurn: state.turn, origin: "perspective-flip" },\n    ),\n    bankruptcyTurns: flipBankruptcyTurns,`,
  "perspective flip reconciliation",
);

replaceOnce(
  `        population: state.population + 2,\n        tavern: baseAldricTavern,`,
  `        population: state.population + 2,\n        agentEconomy: reconcileAgentEconomyPopulation(\n          state.agentEconomy,\n          state.population + 2,\n          { createdTurn: state.turn, origin: "aldric-war-story" },\n        ),\n        tavern: baseAldricTavern,`,
  "direct population gain reconciliation",
);

replaceOnce(
  `    case "LOAD_SAVE":\n      return { ...action.payload.savedState };`,
  `    case "LOAD_SAVE": {\n      const savedState = action.payload?.savedState;\n      if (!savedState || typeof savedState !== "object") return state;\n      const savedPopulation = Math.max(0, Math.floor(savedState.population ?? state.population ?? 0));\n      return {\n        ...savedState,\n        population: savedPopulation,\n        agentEconomy: hydrateAgentEconomy(\n          savedState.agentEconomy,\n          savedPopulation,\n          { createdTurn: savedState.turn ?? 0 },\n        ),\n      };\n    }`,
  "save migration",
);

writeFileSync(file, source);
