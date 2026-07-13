import { simulateEconomy } from "../../src/engine/economyEngine.js";
import { EMPTY_INVENTORY } from "../../src/data/economy.js";

const SEASONS = ["spring", "summer", "autumn", "winter"];
const BASE_SEED = 0x6d2b79f5;

function inventory(overrides = {}) {
  return { ...EMPTY_INVENTORY, ...overrides };
}

function building(type, condition = 100, instanceId = type) {
  return { type, condition, instanceId, builtOnTurn: 0 };
}

function military(levy = 0, menAtArms = 0, knights = 0) {
  return {
    garrison: { levy, menAtArms, knights },
  };
}

export const ECONOMY_BASELINE_SCENARIOS = [
  {
    id: "balanced_agriculture",
    seed: BASE_SEED + 1,
    state: {
      difficulty: "normal",
      denarii: 500,
      population: 20,
      inventory: inventory({ grain: 120, livestock: 20, fish: 10 }),
      inventoryCapacity: 300,
      buildings: [
        building("strip_farm", 100, "farm-1"),
        building("strip_farm", 100, "farm-2"),
        building("strip_farm", 100, "farm-3"),
        building("pasture", 100, "pasture-1"),
        building("fishpond", 100, "fishpond-1"),
      ],
      garrison: 5,
      military: military(5),
      castleLevel: 1,
      taxRate: "medium",
      synergies: { activated: [] },
      churchDonation: 0,
    },
  },
  {
    id: "crushing_tax",
    seed: BASE_SEED + 2,
    state: {
      difficulty: "normal",
      denarii: 500,
      population: 20,
      inventory: inventory({ grain: 140, livestock: 15, fish: 8 }),
      inventoryCapacity: 300,
      buildings: [
        building("strip_farm", 100, "farm-1"),
        building("strip_farm", 100, "farm-2"),
        building("pasture", 100, "pasture-1"),
      ],
      garrison: 5,
      military: military(5),
      castleLevel: 1,
      taxRate: "crushing",
      synergies: { activated: [] },
      churchDonation: 0,
    },
  },
  {
    id: "military_overload",
    seed: BASE_SEED + 3,
    state: {
      difficulty: "normal",
      denarii: 250,
      population: 18,
      inventory: inventory({ grain: 120, livestock: 15, fish: 5 }),
      inventoryCapacity: 300,
      buildings: [
        building("strip_farm", 100, "farm-1"),
        building("strip_farm", 100, "farm-2"),
        building("pasture", 100, "pasture-1"),
      ],
      garrison: 25,
      military: military(25),
      castleLevel: 1,
      taxRate: "medium",
      synergies: { activated: [] },
      churchDonation: 0,
    },
  },
  {
    id: "food_shortage",
    seed: BASE_SEED + 4,
    state: {
      difficulty: "hard",
      denarii: 180,
      population: 25,
      inventory: inventory({ grain: 5 }),
      inventoryCapacity: 300,
      buildings: [],
      garrison: 3,
      military: military(3),
      castleLevel: 1,
      taxRate: "high",
      synergies: { activated: [] },
      churchDonation: 0,
    },
  },
  {
    id: "damaged_estate",
    seed: BASE_SEED + 5,
    state: {
      difficulty: "normal",
      denarii: 400,
      population: 20,
      inventory: inventory({ grain: 100, livestock: 10, fish: 5 }),
      inventoryCapacity: 300,
      buildings: [
        building("strip_farm", 30, "farm-poor"),
        building("pasture", 20, "pasture-ruined"),
        building("fishpond", 45, "fishpond-poor"),
        building("timber_lot", 10, "timber-ruined"),
      ],
      garrison: 5,
      military: military(5),
      castleLevel: 1,
      taxRate: "medium",
      synergies: { activated: [] },
      churchDonation: 0,
    },
  },
];

export function createSeededRandom(seed) {
  let value = seed >>> 0;
  return function seededRandom() {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function sortedInventory(value) {
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([resource, quantity]) => [resource, quantity]),
  );
}

function assertFiniteNonNegative(label, value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and non-negative; received ${value}`);
  }
}

function assertEconomyInvariants(result, turn) {
  assertFiniteNonNegative(`turn ${turn} denarii`, result.denarii);
  assertFiniteNonNegative(`turn ${turn} population`, result.population);
  assertFiniteNonNegative(`turn ${turn} food`, result.food);
  assertFiniteNonNegative(`turn ${turn} garrison`, result.garrison);

  for (const [resource, quantity] of Object.entries(result.inventory)) {
    assertFiniteNonNegative(`turn ${turn} inventory.${resource}`, quantity);
  }
}

export function runEconomyScenario(scenario, turns = 40) {
  const originalRandom = Math.random;
  Math.random = createSeededRandom(scenario.seed);

  try {
    let state = structuredClone(scenario.state);
    let minDenarii = state.denarii;
    let minPopulation = state.population;
    let minFood = Object.values(state.inventory).reduce((sum, value) => sum + value, 0);
    let maxPopulation = state.population;
    let maxFood = minFood;
    let bankruptTurns = 0;
    let currentBankruptStreak = 0;
    let longestBankruptStreak = 0;
    let firstBankruptcyTurn = null;
    let firstPopulationZeroTurn = null;
    const yearlyCheckpoints = [];

    for (let turn = 1; turn <= turns; turn += 1) {
      const season = SEASONS[(turn - 1) % SEASONS.length];
      const result = simulateEconomy({ ...state, season });
      assertEconomyInvariants(result, turn);

      state = {
        ...state,
        ...result,
        season,
        military: {
          ...state.military,
          garrison: {
            levy: result.garrison,
            menAtArms: 0,
            knights: 0,
          },
        },
      };

      minDenarii = Math.min(minDenarii, result.denarii);
      minPopulation = Math.min(minPopulation, result.population);
      minFood = Math.min(minFood, result.food);
      maxPopulation = Math.max(maxPopulation, result.population);
      maxFood = Math.max(maxFood, result.food);

      if (result.denarii === 0) {
        bankruptTurns += 1;
        currentBankruptStreak += 1;
        longestBankruptStreak = Math.max(longestBankruptStreak, currentBankruptStreak);
        firstBankruptcyTurn ??= turn;
      } else {
        currentBankruptStreak = 0;
      }

      if (result.population === 0) {
        firstPopulationZeroTurn ??= turn;
      }

      if (turn % 4 === 0) {
        yearlyCheckpoints.push({
          year: turn / 4,
          denarii: result.denarii,
          population: result.population,
          food: result.food,
          garrison: result.garrison,
        });
      }
    }

    return {
      id: scenario.id,
      seed: scenario.seed,
      turns,
      ending: {
        denarii: state.denarii,
        population: state.population,
        food: state.food,
        garrison: state.garrison,
        buildingCount: state.buildings.length,
        inventory: sortedInventory(state.inventory),
      },
      metrics: {
        minDenarii,
        minPopulation,
        minFood,
        maxPopulation,
        maxFood,
        bankruptTurns,
        longestBankruptStreak,
        firstBankruptcyTurn,
        firstPopulationZeroTurn,
        survived: state.population > 0 && longestBankruptStreak < 3,
      },
      yearlyCheckpoints,
    };
  } finally {
    Math.random = originalRandom;
  }
}

export function runAllEconomyBaselines(turns = 40) {
  return ECONOMY_BASELINE_SCENARIOS.map((scenario) => runEconomyScenario(scenario, turns));
}
