import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  const index = source.indexOf(search);
  if (index < 0) throw new Error(`Patch anchor not found: ${label}`);
  if (source.indexOf(search, index + search.length) >= 0) {
    throw new Error(`Patch anchor is ambiguous: ${label}`);
  }
  return source.replace(search, replacement);
}

function patchDailySimulation() {
  const path = "src/engine/agentEconomy/dailySimulation.js";
  let source = fs.readFileSync(path, "utf8");

  source = replaceOnce(
    source,
    `    goodsConsumed: safeMetric(metrics.goodsConsumed),\n    productionInputsConsumed: safeMetric(metrics.productionInputsConsumed),`,
    `    goodsConsumed: safeMetric(metrics.goodsConsumed),\n    foodConsumed: safeMetric(metrics.foodConsumed),\n    productionInputsConsumed: safeMetric(metrics.productionInputsConsumed),`,
    "daily metrics food consumed",
  );
  source = replaceOnce(
    source,
    `  let totalConsumed = 0;\n  let unmetFood = 0;`,
    `  let totalConsumed = 0;\n  let foodConsumed = 0;\n  let unmetFood = 0;`,
    "consumption aggregate declaration",
  );
  source = replaceOnce(
    source,
    `    totalConsumed += result.totalConsumed;\n    unmetFood += result.unmetFood;`,
    `    totalConsumed += result.totalConsumed;\n    foodConsumed += result.consumedFood;\n    unmetFood += result.unmetFood;`,
    "consumption aggregate increment",
  );
  source = replaceOnce(
    source,
    `  return { households: nextHouseholds, consumedByCommodity, totalConsumed, unmetFood, unmetFoodByHousehold };`,
    `  return { households: nextHouseholds, consumedByCommodity, totalConsumed, foodConsumed, unmetFood, unmetFoodByHousehold };`,
    "consumption aggregate return",
  );
  source = replaceOnce(
    source,
    `  metrics = addMetric(metrics, "goodsConsumed", consumption.totalConsumed);\n  metrics = addMetric(metrics, "unmetFood", consumption.unmetFood);`,
    `  metrics = addMetric(metrics, "goodsConsumed", consumption.totalConsumed);\n  metrics = addMetric(metrics, "foodConsumed", consumption.foodConsumed);\n  metrics = addMetric(metrics, "unmetFood", consumption.unmetFood);`,
    "daily food metric increment",
  );
  source = replaceOnce(
    source,
    `    totalConsumed: consumption.totalConsumed,\n    unmetFood: consumption.unmetFood,`,
    `    totalConsumed: consumption.totalConsumed,\n    foodConsumed: consumption.foodConsumed,\n    unmetFood: consumption.unmetFood,`,
    "daily summary food consumed",
  );
  source = replaceOnce(
    source,
    `    consumed: Number((endMetrics.goodsConsumed - startMetrics.goodsConsumed).toFixed(2)),\n    unmetFood: Number((endMetrics.unmetFood - startMetrics.unmetFood).toFixed(2)),`,
    `    consumed: Number((endMetrics.goodsConsumed - startMetrics.goodsConsumed).toFixed(2)),\n    foodConsumed: Number((endMetrics.foodConsumed - startMetrics.foodConsumed).toFixed(2)),\n    unmetFood: Number((endMetrics.unmetFood - startMetrics.unmetFood).toFixed(2)),`,
    "quarter summary food consumed",
  );

  fs.writeFileSync(path, source);
}

function patchHouseholdFactory() {
  const path = "src/engine/agentEconomy/householdFactory.js";
  let source = fs.readFileSync(path, "utf8");
  source = replaceOnce(
    source,
    `export const AGENT_ECONOMY_SCHEMA_VERSION = 6;`,
    `export const AGENT_ECONOMY_SCHEMA_VERSION = 7;`,
    "schema version",
  );
  source = replaceOnce(
    source,
    `      goodsConsumed: 0,\n      productionInputsConsumed: 0,`,
    `      goodsConsumed: 0,\n      foodConsumed: 0,\n      productionInputsConsumed: 0,`,
    "initial food metric",
  );
  fs.writeFileSync(path, source);
}

function patchHouseholdUtils() {
  const path = "src/engine/agentEconomy/householdUtils.js";
  let source = fs.readFileSync(path, "utf8");
  source = replaceOnce(
    source,
    `    "goodsConsumed",\n    "productionInputsConsumed",`,
    `    "goodsConsumed",\n    "foodConsumed",\n    "productionInputsConsumed",`,
    "sanitize food metric",
  );
  fs.writeFileSync(path, source);
}

patchDailySimulation();
patchHouseholdFactory();
patchHouseholdUtils();
