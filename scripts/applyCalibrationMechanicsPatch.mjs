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

replaceOnce(
  "tests/stress/agentEconomyStressHarness.js",
  "  const initial = createInitialAgentEconomy(population, { seed });",
  `  const initial = createInitialAgentEconomy(population, {\n    seed,\n    estateInventory: options.estateInventory ?? legacyInitialState.inventory,\n  });`,
  "stress estate inventory",
);

replaceOnce(
  "tests/unit/agentEconomyProductionChains.test.js",
  "  assert.ok(grainOrder.quantity >= 1);",
  "  assert.ok(grainOrder.quantity > 0);",
  "fractional production order expectation",
);
