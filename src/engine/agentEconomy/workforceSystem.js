import BUILDINGS from "../../data/buildings.js";

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

  const buildingWorkforce = [];
  const shortagesByOccupation = {};

  sourceBuildings.forEach((building, index) => {
    const type = getBuildingType(building);
    const definition = BUILDINGS[type];
    const instanceId = getBuildingInstanceId(building, index);
    const requiredOccupation = getRequiredOccupation(type);
    const requiredWorkers = integer(definition?.workersNeeded, 1);
    let remainingRequired = requiredWorkers;
    const assignments = [];

    for (const household of nextHouseholds) {
      if (remainingRequired <= 0 || remainingEconomicWorkers <= 0) break;
      if (household.occupation !== requiredOccupation) continue;
      const available = availableByHousehold.get(household.id) ?? 0;
      if (available <= 0) continue;
      const workers = Math.min(available, remainingRequired, remainingEconomicWorkers);
      if (workers <= 0) continue;

      assignments.push({
        householdId: household.id,
        workers,
        buildingInstanceId: instanceId,
        buildingType: type,
      });
      availableByHousehold.set(household.id, available - workers);
      remainingRequired -= workers;
      remainingEconomicWorkers -= workers;
    }

    const assignedWorkers = assignments.reduce((total, assignment) => total + assignment.workers, 0);
    if (assignedWorkers < requiredWorkers) {
      shortagesByOccupation[requiredOccupation] = (shortagesByOccupation[requiredOccupation] ?? 0)
        + (requiredWorkers - assignedWorkers);
    }

    for (const assignment of assignments) {
      const household = householdById.get(assignment.householdId);
      household.workAssignments = [...household.workAssignments, assignment];
      household.assignedWorkers += assignment.workers;
      household.workplaceId ??= instanceId;
      household.employmentRatio = Math.min(1, household.assignedWorkers / Math.max(1, household.weight));
    }

    const condition = typeof building === "object" ? Number(building.condition ?? 100) : 100;
    buildingWorkforce.push({
      instanceId,
      type,
      requiredOccupation,
      requiredWorkers,
      assignedWorkers,
      laborRatio: requiredWorkers > 0 ? assignedWorkers / requiredWorkers : 1,
      condition: Number.isFinite(condition) ? Math.max(0, Math.min(100, condition)) : 100,
      assignments,
      status: !definition
        ? "unknown-building"
        : condition < 25
          ? "ruined"
          : assignedWorkers === 0
            ? "no-workers"
            : assignedWorkers < requiredWorkers ? "understaffed" : "staffed",
    });
  });

  const requiredWorkers = buildingWorkforce.reduce((total, item) => total + item.requiredWorkers, 0);
  const assignedWorkers = buildingWorkforce.reduce((total, item) => total + item.assignedWorkers, 0);

  return {
    households: nextHouseholds,
    buildingWorkforce,
    summary: {
      economicWorkerCapacity,
      requiredWorkers,
      assignedWorkers,
      unassignedEconomicWorkers: Math.max(0, remainingEconomicWorkers),
      laborCoverage: requiredWorkers > 0 ? assignedWorkers / requiredWorkers : 1,
      staffedBuildings: buildingWorkforce.filter((item) => item.status === "staffed").length,
      understaffedBuildings: buildingWorkforce.filter((item) => item.status === "understaffed").length,
      idleBuildings: buildingWorkforce.filter((item) => ["no-workers", "ruined"].includes(item.status)).length,
      shortagesByOccupation,
    },
  };
}
