import { initialState as legacyInitialState } from "../../src/engine/gameReducer.js";

export const CALIBRATION_VERSION = 1;
export const CALIBRATION_SEED_COUNT = 12;
export const CALIBRATION_QUARTERS = 12;
export const CALIBRATION_BASE_SEED = "agent-economy-calibration-v1";

export const HARD_GATES = Object.freeze({
  completionRate: 100,
  invariantFailureRate: 0,
  maxQuarterRuntimeMs: 250,
});

export const DEFAULT_CALIBRATION_TARGET = Object.freeze({
  economicSurvivalRateMin: 95,
  foodFulfillmentRateMin: 85,
  foodFulfillmentRateMax: 98,
  employmentRateMin: 60,
  employmentRateMax: 85,
  idleBuildingRateMax: 20,
  inputShortageRateMax: 20,
  tradesPerDayMin: 0.15,
  failedOrdersPerTradeMax: 25,
  extremeInflationSeedRateMax: 5,
  priceCrashSeedRateMax: 5,
  povertyRateMax: 25,
  averageHealthMin: 55,
  averageSatisfactionMin: 40,
  commodityPriceRatioMin: 0.6,
  commodityPriceRatioMax: 2,
});

function cloneBuildings(buildings = legacyInitialState.buildings) {
  return buildings.map((building) => typeof building === "string" ? building : { ...building });
}

function createBuilding(type, index, condition = 100) {
  return {
    instanceId: `${type}-${index}-calibration`,
    type,
    condition,
    builtOnTurn: 0,
    freeUpkeep: true,
  };
}

function mergeTarget(overrides = {}) {
  return Object.freeze({ ...DEFAULT_CALIBRATION_TARGET, ...overrides });
}

const defaultBuildings = cloneBuildings();

export const CALIBRATION_SCENARIOS = Object.freeze([
  Object.freeze({
    id: "default-estate",
    name: "Default estate",
    purpose: "Primary balance target using the current new-game estate.",
    expectedPressure: "normal",
    population: legacyInitialState.population,
    buildings: cloneBuildings(defaultBuildings),
    laborAllocation: { ...legacyInitialState.laborAllocation },
    taxRate: legacyInitialState.taxRate,
    target: mergeTarget(),
  }),
  Object.freeze({
    id: "agricultural-shortage",
    name: "Agricultural shortage",
    purpose: "Measures whether the economy degrades without instantly dying after losing its strip farm.",
    expectedPressure: "food-shock",
    population: legacyInitialState.population,
    buildings: cloneBuildings(defaultBuildings.filter((building) => building.type !== "strip_farm")),
    laborAllocation: { ...legacyInitialState.laborAllocation },
    taxRate: legacyInitialState.taxRate,
    target: mergeTarget({
      economicSurvivalRateMin: 80,
      foodFulfillmentRateMin: 55,
      employmentRateMin: 45,
      idleBuildingRateMax: 35,
      inputShortageRateMax: 40,
      tradesPerDayMin: 0.08,
      failedOrdersPerTradeMax: 50,
      extremeInflationSeedRateMax: 20,
      povertyRateMax: 40,
      averageHealthMin: 45,
      averageSatisfactionMin: 30,
      commodityPriceRatioMin: 0.4,
      commodityPriceRatioMax: 3,
    }),
  }),
  Object.freeze({
    id: "labor-shortage",
    name: "Labor shortage",
    purpose: "Reserves seventy percent of the population for construction and tests graceful production degradation.",
    expectedPressure: "labor-shock",
    population: legacyInitialState.population,
    buildings: cloneBuildings(defaultBuildings),
    laborAllocation: { demesne: 15, peasant: 15, construction: 70 },
    taxRate: legacyInitialState.taxRate,
    target: mergeTarget({
      economicSurvivalRateMin: 75,
      foodFulfillmentRateMin: 50,
      employmentRateMin: 20,
      employmentRateMax: 55,
      idleBuildingRateMax: 55,
      inputShortageRateMax: 50,
      tradesPerDayMin: 0.05,
      failedOrdersPerTradeMax: 60,
      extremeInflationSeedRateMax: 25,
      povertyRateMax: 45,
      averageHealthMin: 40,
      averageSatisfactionMin: 25,
      commodityPriceRatioMin: 0.35,
      commodityPriceRatioMax: 3.25,
    }),
  }),
  Object.freeze({
    id: "broken-supply-chain",
    name: "Broken supply chain",
    purpose: "Keeps processors while removing timber, iron, and coal upstream buildings to expose input propagation.",
    expectedPressure: "input-shock",
    population: legacyInitialState.population,
    buildings: [
      createBuilding("strip_farm", 0),
      createBuilding("pasture", 0),
      createBuilding("tannery", 0),
      createBuilding("sawmill", 0),
      createBuilding("smelter", 0),
      createBuilding("mill", 0),
    ],
    laborAllocation: { ...legacyInitialState.laborAllocation },
    taxRate: legacyInitialState.taxRate,
    target: mergeTarget({
      economicSurvivalRateMin: 85,
      foodFulfillmentRateMin: 75,
      employmentRateMin: 45,
      idleBuildingRateMax: 55,
      inputShortageRateMax: 65,
      tradesPerDayMin: 0.08,
      failedOrdersPerTradeMax: 60,
      extremeInflationSeedRateMax: 25,
      povertyRateMax: 35,
      averageHealthMin: 50,
      averageSatisfactionMin: 35,
      commodityPriceRatioMin: 0.4,
      commodityPriceRatioMax: 3,
    }),
  }),
  Object.freeze({
    id: "high-tax",
    name: "High tax",
    purpose: "Runs the default estate under the crushing tax rate to expose cash starvation and welfare dependence.",
    expectedPressure: "fiscal-shock",
    population: legacyInitialState.population,
    buildings: cloneBuildings(defaultBuildings),
    laborAllocation: { ...legacyInitialState.laborAllocation },
    taxRate: "crushing",
    target: mergeTarget({
      economicSurvivalRateMin: 90,
      foodFulfillmentRateMin: 80,
      povertyRateMax: 35,
      averageHealthMin: 50,
      averageSatisfactionMin: 35,
    }),
  }),
  Object.freeze({
    id: "low-tax",
    name: "Low tax",
    purpose: "Runs the default estate with low taxation as the household-liquidity comparison case.",
    expectedPressure: "fiscal-relief",
    population: legacyInitialState.population,
    buildings: cloneBuildings(defaultBuildings),
    laborAllocation: { ...legacyInitialState.laborAllocation },
    taxRate: "low",
    target: mergeTarget({
      economicSurvivalRateMin: 95,
      foodFulfillmentRateMin: 85,
      povertyRateMax: 20,
      averageHealthMin: 55,
      averageSatisfactionMin: 42,
    }),
  }),
  Object.freeze({
    id: "expanded-estate",
    name: "Expanded estate",
    purpose: "Adds food, raw-material, mining, and milling capacity to test whether expansion improves the economy.",
    expectedPressure: "growth",
    population: legacyInitialState.population,
    buildings: [
      ...cloneBuildings(defaultBuildings),
      createBuilding("demesne_field", 0),
      createBuilding("fishpond", 0),
      createBuilding("timber_lot", 0),
      createBuilding("iron_mine", 0),
      createBuilding("mill", 0),
    ],
    laborAllocation: { demesne: 45, peasant: 45, construction: 10 },
    taxRate: legacyInitialState.taxRate,
    target: mergeTarget({
      economicSurvivalRateMin: 98,
      foodFulfillmentRateMin: 90,
      employmentRateMin: 70,
      employmentRateMax: 95,
      idleBuildingRateMax: 15,
      inputShortageRateMax: 15,
      tradesPerDayMin: 0.25,
      failedOrdersPerTradeMax: 20,
      extremeInflationSeedRateMax: 5,
      povertyRateMax: 20,
      averageHealthMin: 60,
      averageSatisfactionMin: 45,
    }),
  }),
]);

export function getCalibrationScenario(id) {
  return CALIBRATION_SCENARIOS.find((scenario) => scenario.id === id) ?? null;
}
