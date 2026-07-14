// Household occupation definitions for the future agent economy.
// This module is data-only and does not affect the live seasonal economy yet.

export const OCCUPATIONS = {
  farmer: {
    id: "farmer",
    label: "Farmer",
    workplaces: ["strip_farm", "demesne_field"],
    outputs: ["grain"],
    primaryNeed: "tools",
  },
  herder: {
    id: "herder",
    label: "Herder",
    workplaces: ["pasture"],
    outputs: ["livestock", "wool"],
    primaryNeed: "tools",
  },
  fisherman: {
    id: "fisherman",
    label: "Fisherman",
    workplaces: ["fishpond"],
    outputs: ["fish"],
    primaryNeed: "tools",
  },
  woodsman: {
    id: "woodsman",
    label: "Woodsman",
    workplaces: ["timber_lot", "sawmill"],
    outputs: ["timber", "wood"],
    primaryNeed: "food",
  },
  miner: {
    id: "miner",
    label: "Miner",
    workplaces: ["iron_mine", "quarry", "clay_pit", "coal_pit"],
    outputs: ["iron", "stone", "clay", "coal"],
    primaryNeed: "health",
  },
  artisan: {
    id: "artisan",
    label: "Artisan",
    workplaces: ["mill", "brewery", "fulling_mill", "tannery", "smelter"],
    outputs: ["flour", "ale", "cloth", "leather", "steel"],
    primaryNeed: "materials",
  },
  trader: {
    id: "trader",
    label: "Trader",
    workplaces: ["market"],
    outputs: [],
    primaryNeed: "cash",
  },
  clergy: {
    id: "clergy",
    label: "Clergy",
    workplaces: ["chapel"],
    outputs: [],
    primaryNeed: "faith",
  },
  laborer: {
    id: "laborer",
    label: "Laborer",
    workplaces: [],
    outputs: [],
    primaryNeed: "employment",
  },
  unemployed: {
    id: "unemployed",
    label: "Unemployed",
    workplaces: [],
    outputs: [],
    primaryNeed: "employment",
  },
};

const DEFAULT_DISTRIBUTION = [
  ["farmer", 0.35],
  ["herder", 0.10],
  ["fisherman", 0.05],
  ["woodsman", 0.10],
  ["miner", 0.08],
  ["artisan", 0.12],
  ["trader", 0.05],
  ["clergy", 0.05],
  ["laborer", 0.10],
];

export function normalizeOccupation(occupation) {
  return OCCUPATIONS[occupation] ? occupation : "laborer";
}

export function getOccupationDefinition(occupation) {
  return OCCUPATIONS[normalizeOccupation(occupation)];
}

/**
 * Deterministically spreads occupations across households.
 * The prime-number stride avoids putting every farmer next to another farmer
 * while keeping save creation reproducible without random numbers.
 */
export function getDefaultOccupation(index) {
  const point = ((Math.max(0, index) * 37) % 100) / 100;
  let cumulative = 0;

  for (const [occupation, share] of DEFAULT_DISTRIBUTION) {
    cumulative += share;
    if (point < cumulative) return occupation;
  }

  return "laborer";
}

export function getOccupationCounts(households) {
  const counts = {};
  for (const household of households ?? []) {
    const occupation = normalizeOccupation(household.occupation);
    counts[occupation] = (counts[occupation] ?? 0) + (household.weight ?? 0);
  }
  return counts;
}
