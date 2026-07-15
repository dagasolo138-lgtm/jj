import fs from "node:fs";

function replaceOnce(path, search, replacement, label) {
  const source = fs.readFileSync(path, "utf8");
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Ambiguous patch anchor: ${label}`);
  }
  fs.writeFileSync(path, source.replace(search, replacement), "utf8");
}

replaceOnce(
  "src/engine/agentEconomy/integratedGameReducer.js",
  `    const comparison = buildEngineComparison({\n      beforeLegacy: preparedState,\n      afterLegacy: reconciledState,\n      beforeAgent: preparedState.agentEconomy,\n      projectedAgent: simulatedAgentEconomy,\n      turn: preparedState.turn,\n      season: preparedState.season,\n      expectedDays: AGENT_DAYS_PER_QUARTER,\n    });\n    const nextControl = recordEngineComparison(control, comparison, checkpoint);\n    const nextAgentEconomy = finalizeAgentQuarterLiveState(\n      preparedState.agentEconomy,\n      simulatedAgentEconomy,\n      reconciledState,\n    );`,
  `    const nextAgentEconomy = finalizeAgentQuarterLiveState(\n      preparedState.agentEconomy,\n      simulatedAgentEconomy,\n      reconciledState,\n    );\n    const comparison = buildEngineComparison({\n      beforeLegacy: preparedState,\n      afterLegacy: reconciledState,\n      beforeAgent: preparedState.agentEconomy,\n      projectedAgent: nextAgentEconomy,\n      turn: preparedState.turn,\n      season: preparedState.season,\n      expectedDays: AGENT_DAYS_PER_QUARTER,\n    });\n    const nextControl = recordEngineComparison(control, comparison, checkpoint);`,
  "finalize population adapter before comparison",
);

replaceOnce(
  "src/engine/agentEconomy/engineControlSystem.js",
  `  if (projectedAgentTotals.population !== beforeAgentTotals.population) {\n    criticalIssues.push(\n      \`agent-population-not-conserved:\${beforeAgentTotals.population}->\${projectedAgentTotals.population}\`,\n    );\n  }\n\n`,
  ``,
  "remove obsolete population-conservation invariant",
);

const testPath = "tests/unit/agentEconomyEngineControl.test.js";
let tests = fs.readFileSync(testPath, "utf8");
const marker = `test("comparison history is capped at forty quarters", () => {`;
const addedTest = `test("comparison evaluates population after the live adapter has aligned the quarter", () => {\n  const beforeAgent = createInitialAgentEconomy(1, { seed: 17 });\n  const projected = simulateAgentQuarter(beforeAgent, {\n    days: 30,\n    turn: 1,\n    season: "spring",\n    taxRate: "medium",\n    buildings: [],\n    laborAllocation: { construction: 0 },\n  });\n  projected.households[0] = {\n    ...projected.households[0],\n    weight: 2,\n  };\n\n  const comparison = buildEngineComparison({\n    beforeLegacy: { denarii: 100, food: 20, population: 1, garrison: 0, inventory: {} },\n    afterLegacy: { denarii: 100, food: 20, population: 2, garrison: 0, inventory: {} },\n    beforeAgent,\n    projectedAgent: projected,\n    turn: 1,\n    season: "spring",\n    expectedDays: 30,\n  });\n\n  assert.equal(comparison.safe, true, comparison.criticalIssues?.join("\\n"));\n  assert.equal(comparison.agentDeltas.population, 1);\n  assert.equal(comparison.legacyDeltas.population, 1);\n  assert.ok(!comparison.warnings.includes("population-model-divergence"));\n});\n\n`;
if (!tests.includes(marker)) throw new Error("Missing engine-control test marker");
if (!tests.includes("comparison evaluates population after the live adapter")) {
  tests = tests.replace(marker, addedTest + marker);
  fs.writeFileSync(testPath, tests, "utf8");
}
