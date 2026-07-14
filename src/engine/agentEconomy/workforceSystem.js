import BUILDINGS from "../../data/buildings.js";
import {
  SERVICE_WORKPLACES,
  getBuildingWorkerCapacity,
} from "./economyCalibration.js";

export const BUILDING_OCCUPATIONS = {
  strip_farm: "farmer",
  demesne_field: "farmer",
  pasture: "herder",
  fishpond: "fisherman",
  timber_lot: "woodsman",
  sawmill: "woodsman",
  clay_pit: "miner",
  iron_mine: "miner",
  quarry: "miner",
  coal_pit: "miner",
  herb_garden: "laborer",
  apiary: "laborer",
  tannery: "artisan",
  smelter: "artisan",
  mill: "artisan",
  fulling_mill: "artisan",
  brewery: "artisan",
};

function integer(value, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

export function getBuildingInstanceId(building, index = 0) {
  if (building && typeof building === "object" && typeof building.instanceId === "string") {
    return building.instanceId;
  }
  const type = typeof building === "string" ? building : building?.type ?? "unknown";
  return `${type}-${index}`;
}

export function getBuildingType(building) {
  return typeof building === "string" ? building : building?.type;
}

export function getRequiredOccupation(buildingType) {
  return BUILDING_OCCUPATIONS[buildingType] ?? "laborer";
}

export function getEconomicWorkerCapacity(households, laborAllocation = {}) {
  const population = (households ?? []).reduce(
    (total, household) => total + integer(household?.weight),
    0,
  );
  const constructionShare = Math.max(0, Math.min(100, Number(laborAllocation?.construction) || 0));
  return Math.max(0, population - Math.floor(population * constructionShare / 100));
}

function addAssignment(household, assignment) {
  household.workAssignments = [...household.workAssignments, assignment];
  household.assignedWorkers += assignment.workers;
  household.workplaceId ??= assignment.buildingInstanceId;
  household.employmentRatio = Math.min(
    1,
    household.assignedWorkers / Math.max(1, household.weight),
  );
}

export function allocateBuildingWorkforce(households, buildings, laborAllocation = {}) {
  const sourceHouseholds = Array.isArray(households) ? households : [];
  const sourceBuildings = Array.isArray(buildings) ? buildings : [];
  const economicWorkerCapacity = getEconomicWorkerCapacity(sourceHouseholds, laborAllocation);
  let remainingEconomicWorkers = economicWorkerCapacity;
  const availableByHousehold = new Map();
  const householdById = new Map();

  const nextHouseholds = sourceHouseholds.map((household) => {
    const next = {
      ...household,
      workplaceId: null,
      workAssignments: [],
      assignedWorkers: 0,
      employmentRatio: 0,
      productionNeeds: {},
    };
    householdById.set(next.id, next);
    availableByHousehold.set(next.id, integer(next.weight, 1));
    return next;
  });

  const buildingWorkforce = sourceBuildings.map((building, index) => {
    const type = getBuildingType(building);
    const definition = BUILDINGS[type];
    const requiredWorkers = integer(definition?.workersNeeded, 1);
    const condition = typeof building === "object" ? Number(building.condition ?? 100) : 100;
    return {
      instanceId: getBuildingInstanceId(building, index),
      type,
      requiredOccupation: getRequiredOccupation(type),
      requiredWorkers,
      workerCapacity: getBuildingWorkerCapacity(type, requiredWorkers),
      assignedWorkers: 0,
      laborRatio: 0,
      expansionRatio: 0,
      condition: Number.isFinite(condition) ? Math.max(0, Math.min(100, condition)) : 100,
      assignments: [],
      status: definition ? "no-workers" : "unknown-building",
    };
  });

  function assignWorkers(workplace, household, requestedWorkers) {
    if (remainingEconomicWorkers <= 0 || requestedWorkers <= 0) return 0;
    const available = availableByHousehold.get(household.id) ?? 0;
    const remainingCapacity = Math.max(0, workplace.workerCapacity - workplace.assignedWorkers);
    const workers = Math.min(
      available,
      remainingCapacity,
      remainingEconomicWorkers,
      requestedWorkers,
    );
    if (workers <= 0) return 0;

    const assignment = {
      householdId: household.id,
      workers,
      buildingInstanceId: workplace.instanceId,
      buildingType: workplace.type,
      service: false,
    };
    workplace.assignments.push(assignment);
    workplace.assignedWorkers += workers;
    availableByHousehold.set(household.id, available - workers);
    remainingEconomicWorkers -= workers;
    addAssignment(household, assignment);
    return workers;
  }

  for (const workplace of buildingWorkforce) {
    let needed = workplace.requiredWorkers;
    for (const household of nextHouseholds) {
      if (needed <= 0 || remainingEconomicWorkers <= 0) break;
      if (household.occupation !== workplace.requiredOccupation) continue;
      needed -= assignWorkers(workplace, household, needed);
    }
  }

  let expanded = true;
  while (expanded && remainingEconomicWorkers > 0) {
    expanded = false;
    for (const workplace of buildingWorkforce) {
      if (workplace.assignedWorkers >= workplace.workerCapacity) continue;
      const household = nextHouseholds.find((candidate) =>
        candidate.occupation === workplace.requiredOccupation
        && (availableByHousehold.get(candidate.id) ?? 0) > 0);
      if (!household) continue;
      if (assignWorkers(workplace, household, 1) > 0) expanded = true;
      if (remainingEconomicWorkers <= 0) break;
    }
  }

  let serviceAssignedWorkers = 0;
  for (const household of nextHouseholds) {
    if (remainingEconomicWorkers <= 0) break;
    const serviceWorkplace = SERVICE_WORKPLACES[household.occupation];
    if (!serviceWorkplace) continue;
    const available = availableByHousehold.get(household.id) ?? 0;
    const workers = Math.min(available, remainingEconomicWorkers);
    if (workers <= 0) continue;
    const assignment = {
      householdId: household.id,
      workers,
      buildingInstanceId: serviceWorkplace,
      buildingType: serviceWorkplace,
      service: true,
    };
    availableByHousehold.set(household.id, available - workers);
    remainingEconomicWorkers -= workers;
    serviceAssignedWorkers += workers;
    addAssignment(household, assignment);
  }

  const shortagesByOccupation = {};
  for (const workplace of buildingWorkforce) {
    const definition = BUILDINGS[workplace.type];
    if (workplace.assignedWorkers < workplace.requiredWorkers) {
      shortagesByOccupation[workplace.requiredOccupation] = (
        shortagesByOccupation[workplace.requiredOccupation] ?? 0
      ) + (workplace.requiredWorkers - workplace.assignedWorkers);
    }
    workplace.laborRatio = workplace.requiredWorkers > 0
      ? workplace.assignedWorkers / workplace.requiredWorkers
      : 1;
    workplace.expansionRatio = workplace.workerCapacity > 0
      ? workplace.assignedWorkers / workplace.workerCapacity
      : 0;
    workplace.status = !definition
      ? "unknown-building"
      : workplace.condition < 25
        ? "ruined"
        : workplace.assignedWorkers === 0
          ? "no-workers"
          : workplace.assignedWorkers < workplace.requiredWorkers ? "understaffed" : "staffed";
  }

  const requiredWorkers = buildingWorkforce.reduce((total, item) => total + item.requiredWorkers, 0);
  const buildingWorkerCapacity = buildingWorkforce.reduce((total, item) => total + item.workerCapacity, 0);
  const buildingAssignedWorkers = buildingWorkforce.reduce(
    (total, item) => total + item.assignedWorkers,
    0,
  );
  const employedWorkers = buildingAssignedWorkers + serviceAssignedWorkers;

  return {
    households: nextHouseholds,
    buildingWorkforce,
    summary: {
      economicWorkerCapacity,
      requiredWorkers,
      buildingWorkerCapacity,
      assignedWorkers: buildingAssignedWorkers,
      buildingAssignedWorkers,
      serviceAssignedWorkers,
      employedWorkers,
      unassignedEconomicWorkers: Math.max(0, remainingEconomicWorkers),
      laborCoverage: requiredWorkers > 0
        ? Math.min(1, buildingAssignedWorkers / requiredWorkers)
        : 1,
      employmentCoverage: economicWorkerCapacity > 0
        ? employedWorkers / economicWorkerCapacity
        : 1,
      staffedBuildings: buildingWorkforce.filter((item) => item.status === "staffed").length,
      understaffedBuildings: buildingWorkforce.filter((item) => item.status === "understaffed").length,
      idleBuildings: buildingWorkforce.filter((item) => ["no-workers", "ruined"].includes(item.status)).length,
      shortagesByOccupation,
    },
  };
}
