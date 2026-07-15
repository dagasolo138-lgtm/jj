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

const dailyPath = "src/engine/agentEconomy/dailySimulation.js";
replaceOnce(
  dailyPath,
  `import { consumeHousehold, updateHouseholdNeeds } from "./consumptionSystem.js";`,
  `import { consumeHousehold, updateHouseholdNeeds } from "./consumptionSystem.js";\nimport { applyEmergencyFoodRationing } from "./emergencyRationingSystem.js";`,
  "daily rationing import",
);
replaceOnce(
  dailyPath,
  `  "consumption",\n  "income",`,
  `  "consumption",\n  "emergency-rationing",\n  "income",`,
  "daily pipeline",
);
replaceOnce(
  dailyPath,
  `    unmetFood: safeMetric(metrics.unmetFood),\n    ordersGenerated: safeMetric(metrics.ordersGenerated),`,
  `    unmetFood: safeMetric(metrics.unmetFood),\n    emergencyFoodRationed: safeMetric(metrics.emergencyFoodRationed),\n    emergencyRationingDays: safeMetric(metrics.emergencyRationingDays),\n    emergencyRationingRecipients: safeMetric(metrics.emergencyRationingRecipients),\n    ordersGenerated: safeMetric(metrics.ordersGenerated),`,
  "daily metrics",
);
replaceOnce(
  dailyPath,
  `  const consumption = aggregateConsumption(households, rng, dayContext);\n  households = consumption.households;`,
  `  let consumption = aggregateConsumption(households, rng, dayContext);\n  consumption = applyEmergencyFoodRationing(consumption, dayContext);\n  households = consumption.households;`,
  "apply emergency rationing",
);
replaceOnce(
  dailyPath,
  `  metrics = addMetric(metrics, "unmetFood", consumption.unmetFood);\n  metrics = addMetric(metrics, "ordersGenerated", orders.length);`,
  `  metrics = addMetric(metrics, "unmetFood", consumption.unmetFood);\n  metrics = addMetric(metrics, "emergencyFoodRationed", consumption.emergencyRationing?.foodRationed);\n  metrics = addMetric(metrics, "emergencyRationingDays", consumption.emergencyRationing?.triggered ? 1 : 0);\n  metrics = addMetric(metrics, "emergencyRationingRecipients", consumption.emergencyRationing?.recipients);\n  metrics = addMetric(metrics, "ordersGenerated", orders.length);`,
  "rationing metrics increment",
);
replaceOnce(
  dailyPath,
  `    unmetFood: consumption.unmetFood,\n    ordersGenerated: orders.length,`,
  `    unmetFood: consumption.unmetFood,\n    emergencyRationing: consumption.emergencyRationing,\n    ordersGenerated: orders.length,`,
  "daily rationing summary",
);
replaceOnce(
  dailyPath,
  `    unmetFood: Number((endMetrics.unmetFood - startMetrics.unmetFood).toFixed(2)),\n    ordersGenerated: Number((endMetrics.ordersGenerated - startMetrics.ordersGenerated).toFixed(2)),`,
  `    unmetFood: Number((endMetrics.unmetFood - startMetrics.unmetFood).toFixed(2)),\n    emergencyFoodRationed: Number((endMetrics.emergencyFoodRationed - startMetrics.emergencyFoodRationed).toFixed(2)),\n    emergencyRationingDays: Number((endMetrics.emergencyRationingDays - startMetrics.emergencyRationingDays).toFixed(2)),\n    emergencyRationingRecipients: Number((endMetrics.emergencyRationingRecipients - startMetrics.emergencyRationingRecipients).toFixed(2)),\n    ordersGenerated: Number((endMetrics.ordersGenerated - startMetrics.ordersGenerated).toFixed(2)),`,
  "quarter rationing summary",
);

const factoryPath = "src/engine/agentEconomy/householdFactory.js";
replaceOnce(factoryPath, "export const AGENT_ECONOMY_SCHEMA_VERSION = 13;", "export const AGENT_ECONOMY_SCHEMA_VERSION = 14;", "schema version");
replaceOnce(
  factoryPath,
  `      unmetFood: 0,\n      ordersGenerated: 0,`,
  `      unmetFood: 0,\n      emergencyFoodRationed: 0,\n      emergencyRationingDays: 0,\n      emergencyRationingRecipients: 0,\n      ordersGenerated: 0,`,
  "initial rationing metrics",
);

const utilsPath = "src/engine/agentEconomy/householdUtils.js";
replaceOnce(
  utilsPath,
  `    "unmetFood",\n    "ordersGenerated",`,
  `    "unmetFood",\n    "emergencyFoodRationed",\n    "emergencyRationingDays",\n    "emergencyRationingRecipients",\n    "ordersGenerated",`,
  "sanitize rationing metrics",
);

const indexPath = "src/engine/agentEconomy/index.js";
replaceOnce(
  indexPath,
  `export {\n  consumeHousehold,\n  updateHouseholdNeeds,\n} from "./consumptionSystem.js";`,
  `export {\n  consumeHousehold,\n  updateHouseholdNeeds,\n} from "./consumptionSystem.js";\n\nexport {\n  EMERGENCY_RATIONING_STOCK_PER_PERSON,\n  applyEmergencyFoodRationing,\n} from "./emergencyRationingSystem.js";`,
  "index rationing exports",
);
