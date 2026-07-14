import { readFileSync, writeFileSync } from "node:fs";

function replaceOnce(file, search, replacement, label) {
  const source = readFileSync(file, "utf8");
  if (source.includes(replacement)) return;
  if (!source.includes(search)) {
    throw new Error(`Patch anchor not found: ${label}`);
  }
  writeFileSync(file, source.replace(search, replacement));
}

replaceOnce(
  "src/App.jsx",
  'import { gameReducer, initialState } from "./engine/gameReducer";',
  'import { gameReducer, initialState } from "./engine/agentEconomy/integratedGameReducer";',
  "App reducer import",
);

replaceOnce(
  "tests/unit/agentEconomyHouseholds.test.js",
  'import { gameReducer, initialState } from "../../src/engine/gameReducer.js";',
  'import { gameReducer, initialState } from "../../src/engine/agentEconomy/integratedGameReducer.js";',
  "household test reducer import",
);
