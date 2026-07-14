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
  `  const unmetFoodByHousehold = {};\n  const nextHouseholds = households.map((household) => {`,
  `  const unmetFoodByHousehold = {};\n  const targetFoodByHousehold = {};\n  const consumedFoodByHousehold = {};\n  const nextHouseholds = households.map((household) => {`,
  "daily food maps",
);
replaceOnce(
  dailyPath,
  `    unmetFood += result.unmetFood;\n    unmetFoodByHousehold[household.id] = result.unmetFood;`,
  `    unmetFood += result.unmetFood;\n    unmetFoodByHousehold[household.id] = result.unmetFood;\n    targetFoodByHousehold[household.id] = result.targetFood;\n    consumedFoodByHousehold[household.id] = result.consumedFood;`,
  "daily food map values",
);
replaceOnce(
  dailyPath,
  `  return { households: nextHouseholds, consumedByCommodity, totalConsumed, foodConsumed, unmetFood, unmetFoodByHousehold };`,
  `  return {\n    households: nextHouseholds,\n    consumedByCommodity,\n    totalConsumed,\n    foodConsumed,\n    unmetFood,\n    unmetFoodByHousehold,\n    targetFoodByHousehold,\n    consumedFoodByHousehold,\n  };`,
  "daily consumption return",
);
replaceOnce(
  dailyPath,
  `  households = households.map((household) => updateHouseholdWellbeing(household, {\n    ...dayContext,\n    unmetFood: consumption.unmetFoodByHousehold[household.id] ?? 0,\n  }));`,
  `  households = households.map((household) => updateHouseholdWellbeing(household, {\n    ...dayContext,\n    unmetFood: consumption.unmetFoodByHousehold[household.id] ?? 0,\n    targetFood: consumption.targetFoodByHousehold[household.id] ?? 0,\n    consumedFood: consumption.consumedFoodByHousehold[household.id] ?? 0,\n  }));`,
  "wellbeing meal context",
);

const welfarePath = "src/engine/agentEconomy/welfareSystem.js";
replaceOnce(
  welfarePath,
  `  const foodNeed = Math.max(0, Number(household.needs?.food) || 0);\n  const welfareEligible = foodNeed >= 75 && cash < weight * 2.5;`,
  `  const foodNeed = Math.max(0, Number(household.needs?.food) || 0);\n  const unmetFood = Math.max(0, Number(context.unmetFood) || 0);\n  const welfareEligible = (foodNeed >= 75 || unmetFood > 0) && cash < weight * 2.5;`,
  "welfare food eligibility",
);
replaceOnce(
  welfarePath,
  `  const unmetFood = Math.max(0, Number(context.unmetFood) || 0);\n  const employmentPenalty = household.occupation === "unemployed" ? 2 : 0;\n  const hungerPenalty = unmetFood > 0 || needs.food >= 80 ? 3 : needs.food >= 60 ? 1 : 0;\n  const healthRecovery = unmetFood === 0 && needs.food < 50 ? 1 : 0;`,
  `  const unmetFood = Math.max(0, Number(context.unmetFood) || 0);\n  const targetFood = Math.max(0, Number(context.targetFood) || 0);\n  const consumedFood = Math.max(0, Number(context.consumedFood) || 0);\n  const employmentPenalty = Number(household.employmentRatio) > 0 ? 0 : 2;\n  const hungerPenalty = targetFood > 0 && unmetFood > 0\n    ? 2\n    : needs.food >= 90 ? 1 : 0;\n  const healthRecovery = targetFood > 0 && consumedFood >= targetFood\n    ? 1\n    : context.day % 14 === 0 && needs.food < 40 ? 1 : 0;`,
  "meal-based wellbeing",
);

const orderPath = "src/engine/agentEconomy/orderIntentSystem.js";
replaceOnce(
  orderPath,
  `} from "./economyCalibration.js";\n\nconst FOOD_COMMODITIES`,
  `} from "./economyCalibration.js";\nimport { getReferencePrice } from "./priceBeliefSystem.js";\n\nconst FOOD_COMMODITIES`,
  "reference price import",
);
replaceOnce(
  orderPath,
  `    for (const [commodity, request] of buyRequests.entries()) {\n      buyOrders.push({\n        id: \`day-\${day}-\${household.id}-buy-\${commodity}\`,\n        householdId: household.id,\n        side: "buy",\n        commodity,\n        quantity: request.quantity,\n        price: safePrice(household.priceBeliefs?.[commodity], "buy"),\n        reason: request.reasons.join("+"),\n      });\n    }`,
  `    for (const [commodity, request] of buyRequests.entries()) {\n      const reason = request.reasons.join("+");\n      const productionInput = request.reasons.some((item) => item.startsWith("production-input"));\n      const beliefPrice = safePrice(household.priceBeliefs?.[commodity], "buy");\n      buyOrders.push({\n        id: \`day-\${day}-\${household.id}-buy-\${commodity}\`,\n        householdId: household.id,\n        side: "buy",\n        commodity,\n        quantity: request.quantity,\n        price: productionInput\n          ? Math.max(beliefPrice, getReferencePrice(commodity) * 1.02)\n          : beliefPrice,\n        reason,\n      });\n    }`,
  "production bid priority",
);
replaceOnce(
  orderPath,
  `  const demandedCommodities = new Set(buyOrders.map((order) => order.commodity));\n  const sellOrders = sellerCandidates.filter((order) =>\n    demandedCommodities.has(order.commodity)\n    && order.quantity >= MIN_TRADE_QUANTITY);\n\n  return [...buyOrders, ...sellOrders];`,
  `  const demandedCommodities = new Set(buyOrders.map((order) => order.commodity));\n  const productionDemand = new Set(\n    buyOrders\n      .filter((order) => order.reason.includes("production-input"))\n      .map((order) => order.commodity),\n  );\n  const sellOrders = sellerCandidates\n    .filter((order) => demandedCommodities.has(order.commodity)\n      && order.quantity >= MIN_TRADE_QUANTITY)\n    .map((order) => productionDemand.has(order.commodity)\n      ? {\n        ...order,\n        price: Math.min(order.price, getReferencePrice(order.commodity) * 0.98),\n      }\n      : order);\n\n  return [...buyOrders, ...sellOrders];`,
  "production ask priority",
);

const productionPath = "src/engine/agentEconomy/buildingProductionSystem.js";
replaceOnce(
  productionPath,
  `const DAYS_PER_SEASON = 30;`,
  `const DAYS_PER_SEASON = 30;\nconst SUBSISTENCE_RATES = {\n  farmer: { grain: 0.035 },\n  fisherman: { fish: 0.02 },\n  herder: { livestock: 0.008 },\n};\nconst SUBSISTENCE_SEASON_MULTIPLIERS = {\n  spring: 1,\n  summer: 1.1,\n  autumn: 1.15,\n  winter: 0.65,\n};`,
  "subsistence constants",
);
replaceOnce(
  productionPath,
  `function sumInto(target, source) {\n  for (const [commodity, amount] of Object.entries(source ?? {})) {\n    target[commodity] = quantity(quantity(target[commodity]) + amount);\n  }\n}\n\nexport function runBuildingProduction`,
  `function sumInto(target, source) {\n  for (const [commodity, amount] of Object.entries(source ?? {})) {\n    target[commodity] = quantity(quantity(target[commodity]) + amount);\n  }\n}\n\nfunction runSubsistenceProduction(households, workerLimit, context = {}) {\n  let remainingWorkers = Math.max(0, Math.floor(Number(workerLimit) || 0));\n  const produced = {};\n  const assignments = [];\n  const seasonMultiplier = SUBSISTENCE_SEASON_MULTIPLIERS[context.season] ?? 1;\n\n  for (const household of households) {\n    if (remainingWorkers <= 0) break;\n    const recipe = SUBSISTENCE_RATES[household.occupation];\n    if (!recipe) continue;\n    const available = Math.max(\n      0,\n      Math.floor(Number(household.weight) || 0) - Math.floor(Number(household.assignedWorkers) || 0),\n    );\n    const workers = Math.min(available, remainingWorkers);\n    if (workers <= 0) continue;\n    const health = Math.max(0, Math.min(100, Number(household.health) || 0));\n    const satisfaction = Math.max(0, Math.min(100, Number(household.satisfaction) || 0));\n    const quality = Math.max(0.35, Math.min(1.1, 0.45 + health / 250 + satisfaction / 500));\n    const householdProduced = {};\n    for (const [commodity, rate] of Object.entries(recipe)) {\n      const amount = quantity(rate * workers * seasonMultiplier * quality);\n      if (amount <= 0) continue;\n      household.inventory = {\n        ...household.inventory,\n        [commodity]: quantity(quantity(household.inventory?.[commodity]) + amount),\n      };\n      householdProduced[commodity] = amount;\n      produced[commodity] = quantity(quantity(produced[commodity]) + amount);\n    }\n    const assignment = {\n      householdId: household.id,\n      workers,\n      buildingInstanceId: \`subsistence-\${household.occupation}\`,\n      buildingType: "subsistence",\n      service: true,\n    };\n    household.workAssignments = [...(household.workAssignments ?? []), assignment];\n    household.assignedWorkers = Math.min(\n      household.weight,\n      Math.max(0, Number(household.assignedWorkers) || 0) + workers,\n    );\n    household.employmentRatio = household.assignedWorkers / Math.max(1, household.weight);\n    household.workplaceId ??= assignment.buildingInstanceId;\n    assignments.push({ ...assignment, produced: householdProduced });\n    remainingWorkers -= workers;\n  }\n\n  return {\n    produced,\n    totalProduced: quantity(Object.values(produced).reduce((total, amount) => total + amount, 0)),\n    assignedWorkers: assignments.reduce((total, assignment) => total + assignment.workers, 0),\n    assignments,\n    remainingWorkers,\n  };\n}\n\nexport function runBuildingProduction`,
  "subsistence helper",
);
replaceOnce(
  productionPath,
  `  return {\n    households: nextHouseholds,\n    produced,`,
  `  const subsistence = runSubsistenceProduction(\n    nextHouseholds,\n    workforce.summary.unassignedEconomicWorkers,\n    context,\n  );\n  sumInto(produced, subsistence.produced);\n  const workforceSummary = {\n    ...workforce.summary,\n    subsistenceAssignedWorkers: subsistence.assignedWorkers,\n    employedWorkers: workforce.summary.employedWorkers + subsistence.assignedWorkers,\n    unassignedEconomicWorkers: subsistence.remainingWorkers,\n    employmentCoverage: workforce.summary.economicWorkerCapacity > 0\n      ? (workforce.summary.employedWorkers + subsistence.assignedWorkers)\n        / workforce.summary.economicWorkerCapacity\n      : 1,\n  };\n\n  return {\n    households: nextHouseholds,\n    produced,`,
  "subsistence execution",
);
replaceOnce(
  productionPath,
  `    buildingReports,\n    workforce: workforce.summary,`,
  `    buildingReports,\n    subsistence,\n    workforce: workforceSummary,`,
  "subsistence return",
);
replaceOnce(
  productionPath,
  `      requiredWorkers: workforce.summary.requiredWorkers,\n      assignedWorkers: workforce.summary.assignedWorkers,`,
  `      requiredWorkers: workforceSummary.requiredWorkers,\n      assignedWorkers: workforceSummary.assignedWorkers,`,
  "workforce metrics",
);
