import { stochasticRound } from "./seededRng.js";

const SEASON_MULTIPLIERS = {
  spring: 1,
  summer: 1.1,
  autumn: 1.2,
  winter: 0.72,
};

export const DAILY_PRODUCTION_RECIPES = {
  farmer: { grain: 0.34 },
  herder: { livestock: 0.035, wool: 0.09 },
  fisherman: { fish: 0.22 },
  woodsman: { timber: 0.17, wood: 0.09 },
  miner: { coal: 0.12, iron: 0.055, stone: 0.07, clay: 0.05 },
  artisan: { flour: 0.1, ale: 0.055, cloth: 0.04, leather: 0.035, steel: 0.025 },
  trader: {},
  clergy: {},
  laborer: {},
  unemployed: {},
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getHouseholdProductivity(household, season = "spring") {
  const health = clamp(Number(household?.health) || 0, 0, 100);
  const satisfaction = clamp(Number(household?.satisfaction) || 0, 0, 100);
  const foodNeed = clamp(Number(household?.needs?.food) || 0, 0, 100);
  const seasonMultiplier = SEASON_MULTIPLIERS[season] ?? 1;
  const conditionMultiplier = 0.45 + health / 200 + satisfaction / 400;
  const hungerPenalty = foodNeed >= 85 ? 0.45 : foodNeed >= 65 ? 0.72 : 1;
  return clamp(conditionMultiplier * hungerPenalty * seasonMultiplier, 0.2, 1.35);
}

export function produceHousehold(household, rng, context = {}) {
  const recipe = DAILY_PRODUCTION_RECIPES[household.occupation] ?? {};
  const productivity = getHouseholdProductivity(household, context.season);
  const weight = Math.max(1, Math.floor(household.weight ?? 1));
  const inventory = { ...household.inventory };
  const produced = {};

  for (const [commodity, dailyRate] of Object.entries(recipe)) {
    const amount = stochasticRound(dailyRate * weight * productivity, rng);
    if (amount <= 0) continue;
    inventory[commodity] = Math.max(0, Number(inventory[commodity]) || 0) + amount;
    produced[commodity] = amount;
  }

  return {
    household: { ...household, inventory },
    produced,
    totalProduced: Object.values(produced).reduce((total, amount) => total + amount, 0),
  };
}
