import BUILDINGS from "../../data/buildings.js";
import { SEASON_FARM_MULTIPLIERS } from "../../data/economy.js";
import { allocateBuildingWorkforce } from "./workforceSystem.js";

export const SHADOW_INPUT_OVERRIDES = {
  sawmill: { timber: 2 },
  tannery: { livestock: 1 },
};

const DAYS_PER_SEASON = 30;
const SUBSISTENCE_RATES = {
  farmer: { grain: 0.035 },
  fisherman: { fish: 0.02 },
  herder: { livestock: 0.008 },
};
const SUBSISTENCE_SEASON_MULTIPLIERS = {
  spring: 1,
  summer: 1.1,
  autumn: 1.15,
  winter: 0.65,
};

function quantity(value) {
  if (!Number.isFinite(value)) return 0;
  return Number(Math.max(0, value).toFixed(4));
}

function getConditionMultiplier(condition) {
  if (condition >= 75) return 1;
  if (condition >= 50) return 0.75;
  if (condition >= 25) return 0.5;
  return 0;
}

function getSynergyBonus(type, buildings) {
  const definition = BUILDINGS[type];
  if (!definition?.buildingSynergies?.length) return 0;
  const present = new Set((buildings ?? []).map((building) =>
    typeof building === "string" ? building : building?.type));
  return definition.buildingSynergies.reduce(
    (total, synergy) => total + (present.has(synergy.with) ? synergy.bonus : 0),
    0,
  );
}

function getWorkerQuality(householdsById, assignments) {
  let workers = 0;
  let quality = 0;

  for (const assignment of assignments) {
    const household = householdsById.get(assignment.householdId);
    if (!household) continue;
    const health = Math.max(0, Math.min(100, Number(household.health) || 0));
    const satisfaction = Math.max(0, Math.min(100, Number(household.satisfaction) || 0));
    const hasTools = quantity(household.inventory?.tools) >= assignment.workers * 0.05;
    const toolsFactor = hasTools ? 1 : 0.88;
    const householdQuality = Math.max(0.45, Math.min(1.15,
      (0.55 + health / 300 + satisfaction / 500) * toolsFactor,
    ));
    workers += assignment.workers;
    quality += householdQuality * assignment.workers;
  }

  return workers > 0 ? quality / workers : 0;
}

function getAvailable(householdsById, assignments, commodity) {
  return assignments.reduce((total, assignment) => {
    const household = householdsById.get(assignment.householdId);
    return total + quantity(household?.inventory?.[commodity]);
  }, 0);
}

function consumeFromWorkers(householdsById, assignments, commodity, requested) {
  let remaining = quantity(requested);
  let consumed = 0;

  for (const assignment of assignments) {
    if (remaining <= 0) break;
    const household = householdsById.get(assignment.householdId);
    if (!household) continue;
    const available = quantity(household.inventory?.[commodity]);
    const amount = Math.min(available, remaining);
    if (amount <= 0) continue;
    household.inventory = {
      ...household.inventory,
      [commodity]: quantity(available - amount),
    };
    consumed = quantity(consumed + amount);
    remaining = quantity(remaining - amount);
  }

  return consumed;
}

function distributeToWorkers(householdsById, assignments, commodity, totalAmount) {
  const totalWorkers = assignments.reduce((total, assignment) => total + assignment.workers, 0);
  if (totalWorkers <= 0 || totalAmount <= 0) return;
  let distributed = 0;

  assignments.forEach((assignment, index) => {
    const household = householdsById.get(assignment.householdId);
    if (!household) return;
    const amount = index === assignments.length - 1
      ? quantity(totalAmount - distributed)
      : quantity(totalAmount * assignment.workers / totalWorkers);
    household.inventory = {
      ...household.inventory,
      [commodity]: quantity(quantity(household.inventory?.[commodity]) + amount),
    };
    distributed = quantity(distributed + amount);
  });
}

function addProductionNeed(householdsById, assignments, commodity, amount) {
  const totalWorkers = assignments.reduce((total, assignment) => total + assignment.workers, 0);
  if (totalWorkers <= 0 || amount <= 0) return;

  for (const assignment of assignments) {
    const household = householdsById.get(assignment.householdId);
    if (!household) continue;
    const share = quantity(amount * assignment.workers / totalWorkers);
    household.productionNeeds = {
      ...household.productionNeeds,
      [commodity]: quantity(quantity(household.productionNeeds?.[commodity]) + share),
    };
  }
}

function sumInto(target, source) {
  for (const [commodity, amount] of Object.entries(source ?? {})) {
    target[commodity] = quantity(quantity(target[commodity]) + amount);
  }
}

function runSubsistenceProduction(households, workerLimit, context = {}) {
  let remainingWorkers = Math.max(0, Math.floor(Number(workerLimit) || 0));
  const produced = {};
  const assignments = [];
  const seasonMultiplier = SUBSISTENCE_SEASON_MULTIPLIERS[context.season] ?? 1;

  for (const household of households) {
    if (remainingWorkers <= 0) break;
    const recipe = SUBSISTENCE_RATES[household.occupation];
    if (!recipe) continue;
    const available = Math.max(
      0,
      Math.floor(Number(household.weight) || 0) - Math.floor(Number(household.assignedWorkers) || 0),
    );
    const workers = Math.min(available, remainingWorkers);
    if (workers <= 0) continue;
    const health = Math.max(0, Math.min(100, Number(household.health) || 0));
    const satisfaction = Math.max(0, Math.min(100, Number(household.satisfaction) || 0));
    const quality = Math.max(0.35, Math.min(1.1, 0.45 + health / 250 + satisfaction / 500));
    const householdProduced = {};
    for (const [commodity, rate] of Object.entries(recipe)) {
      const amount = quantity(rate * workers * seasonMultiplier * quality);
      if (amount <= 0) continue;
      household.inventory = {
        ...household.inventory,
        [commodity]: quantity(quantity(household.inventory?.[commodity]) + amount),
      };
      householdProduced[commodity] = amount;
      produced[commodity] = quantity(quantity(produced[commodity]) + amount);
    }
    const assignment = {
      householdId: household.id,
      workers,
      buildingInstanceId: `subsistence-${household.occupation}`,
      buildingType: "subsistence",
      service: true,
    };
    household.workAssignments = [...(household.workAssignments ?? []), assignment];
    household.assignedWorkers = Math.min(
      household.weight,
      Math.max(0, Number(household.assignedWorkers) || 0) + workers,
    );
    household.employmentRatio = household.assignedWorkers / Math.max(1, household.weight);
    household.workplaceId ??= assignment.buildingInstanceId;
    assignments.push({ ...assignment, produced: householdProduced });
    remainingWorkers -= workers;
  }

  return {
    produced,
    totalProduced: quantity(Object.values(produced).reduce((total, amount) => total + amount, 0)),
    assignedWorkers: assignments.reduce((total, assignment) => total + assignment.workers, 0),
    assignments,
    remainingWorkers,
  };
}

export function runBuildingProduction(households, buildings, context = {}) {
  const workforce = allocateBuildingWorkforce(
    households,
    buildings,
    context.laborAllocation,
  );
  const nextHouseholds = workforce.households;
  const householdsById = new Map(nextHouseholds.map((household) => [household.id, household]));
  const produced = {};
  const consumed = {};
  const buildingReports = [];
  let inputShortageEvents = 0;
  let idleBuildingDays = 0;

  for (const workplace of workforce.buildingWorkforce) {
    const definition = BUILDINGS[workplace.type];
    if (!definition) {
      idleBuildingDays += 1;
      buildingReports.push({ ...workplace, status: "unknown-building", produced: {}, consumed: {}, shortages: {} });
      continue;
    }

    const conditionMultiplier = getConditionMultiplier(workplace.condition);
    if (workplace.assignedWorkers <= 0 || conditionMultiplier <= 0) {
      idleBuildingDays += 1;
      buildingReports.push({ ...workplace, produced: {}, consumed: {}, shortages: {} });
      continue;
    }

    const laborRatio = Math.max(0, Number(workplace.laborRatio) || 0);
    const workerQuality = getWorkerQuality(householdsById, workplace.assignments);
    const seasonMultiplier = definition.isFarm
      ? SEASON_FARM_MULTIPLIERS[context.season] ?? 1
      : 1;
    const synergyMultiplier = 1 + getSynergyBonus(workplace.type, buildings);
    const dailyScale = laborRatio
      * conditionMultiplier
      * workerQuality
      * seasonMultiplier
      * synergyMultiplier
      / DAYS_PER_SEASON;
    const inputRecipe = SHADOW_INPUT_OVERRIDES[workplace.type] ?? definition.consumes ?? {};
    const plannedInputs = Object.fromEntries(
      Object.entries(inputRecipe).map(([commodity, amount]) => [commodity, quantity(amount * dailyScale)]),
    );
    const shortages = {};
    let inputRatio = 1;

    for (const [commodity, required] of Object.entries(plannedInputs)) {
      if (required <= 0) continue;
      const available = getAvailable(householdsById, workplace.assignments, commodity);
      inputRatio = Math.min(inputRatio, available / required);
      if (available < required) {
        shortages[commodity] = quantity(required - available);
      }
    }
    inputRatio = Math.max(0, Math.min(1, inputRatio));

    const buildingConsumed = {};
    for (const [commodity, required] of Object.entries(plannedInputs)) {
      const amount = quantity(required * inputRatio);
      if (amount <= 0) continue;
      buildingConsumed[commodity] = consumeFromWorkers(
        householdsById,
        workplace.assignments,
        commodity,
        amount,
      );
    }

    if (Object.keys(shortages).length > 0) {
      inputShortageEvents += 1;
      for (const [commodity, missing] of Object.entries(shortages)) {
        addProductionNeed(householdsById, workplace.assignments, commodity, missing);
      }
    }

    const buildingProduced = {};
    for (const [commodity, baseAmount] of Object.entries(definition.produces ?? {})) {
      const amount = quantity(baseAmount * dailyScale * inputRatio);
      if (amount <= 0) continue;
      buildingProduced[commodity] = amount;
      distributeToWorkers(householdsById, workplace.assignments, commodity, amount);
    }

    for (const assignment of workplace.assignments) {
      const household = householdsById.get(assignment.householdId);
      if (!household) continue;
      if (Number(household.needs?.tools) >= 60 && quantity(household.inventory?.tools) < 0.05) {
        addProductionNeed(householdsById, [assignment], "tools", 0.05 * assignment.workers);
      }
    }

    if (Object.values(buildingProduced).every((amount) => amount <= 0)) idleBuildingDays += 1;
    sumInto(produced, buildingProduced);
    sumInto(consumed, buildingConsumed);
    buildingReports.push({
      ...workplace,
      status: Object.keys(shortages).length > 0
        ? inputRatio > 0 ? "input-limited" : "input-shortage"
        : workplace.status,
      workerQuality: quantity(workerQuality),
      dailyScale: quantity(dailyScale),
      inputRatio: quantity(inputRatio),
      produced: buildingProduced,
      consumed: buildingConsumed,
      shortages,
    });
  }

  const subsistence = runSubsistenceProduction(
    nextHouseholds,
    workforce.summary.unassignedEconomicWorkers,
    context,
  );
  sumInto(produced, subsistence.produced);
  const workforceSummary = {
    ...workforce.summary,
    subsistenceAssignedWorkers: subsistence.assignedWorkers,
    employedWorkers: workforce.summary.employedWorkers + subsistence.assignedWorkers,
    unassignedEconomicWorkers: subsistence.remainingWorkers,
    employmentCoverage: workforce.summary.economicWorkerCapacity > 0
      ? (workforce.summary.employedWorkers + subsistence.assignedWorkers)
        / workforce.summary.economicWorkerCapacity
      : 1,
  };

  return {
    households: nextHouseholds,
    produced,
    consumed,
    totalProduced: quantity(Object.values(produced).reduce((total, amount) => total + amount, 0)),
    totalInputsConsumed: quantity(Object.values(consumed).reduce((total, amount) => total + amount, 0)),
    buildingReports,
    subsistence,
    workforce: workforceSummary,
    metrics: {
      requiredWorkers: workforceSummary.requiredWorkers,
      assignedWorkers: workforceSummary.assignedWorkers,
      idleBuildingDays,
      inputShortageEvents,
    },
  };
}
