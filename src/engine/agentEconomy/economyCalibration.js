export const AGENT_ECONOMY_CALIBRATION_VERSION = 1;

export const DAYS_PER_QUARTER = 30;
export const FOOD_PER_PERSON_PER_QUARTER = 2;
export const DAILY_FOOD_TARGET_PER_PERSON = FOOD_PER_PERSON_PER_QUARTER / DAYS_PER_QUARTER;

export const MIN_TRADE_QUANTITY = 0.05;
export const QUANTITY_PRECISION = 4;

export const BUILDING_WORKER_CAPACITY = Object.freeze({
  strip_farm: 10,
  demesne_field: 8,
  pasture: 4,
  fishpond: 4,
  timber_lot: 4,
  clay_pit: 3,
  iron_mine: 4,
  quarry: 4,
  coal_pit: 3,
  herb_garden: 3,
  apiary: 2,
  tannery: 2,
  sawmill: 3,
  smelter: 3,
  mill: 3,
  fulling_mill: 3,
  brewery: 3,
});

export const SERVICE_WORKPLACES = Object.freeze({
  trader: "market-service",
  clergy: "chapel-service",
  laborer: "estate-labor",
});

export function calibratedQuantity(value) {
  if (!Number.isFinite(Number(value))) return 0;
  return Number(Math.max(0, Number(value)).toFixed(QUANTITY_PRECISION));
}

export function getBuildingWorkerCapacity(buildingType, minimumWorkers = 1) {
  const configured = BUILDING_WORKER_CAPACITY[buildingType];
  return Math.max(
    Math.max(1, Math.floor(Number(minimumWorkers) || 1)),
    Math.max(1, Math.floor(Number(configured) || 0)),
  );
}
