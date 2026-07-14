import { SEASON_CONSUMPTION_MULTIPLIERS } from "../../data/economy.js";
import {
  DAILY_FOOD_TARGET_PER_PERSON,
  FOOD_STOCK_TARGET_PER_PERSON,
  calibratedQuantity,
} from "./economyCalibration.js";
import { clampNeed, normalizeNeeds } from "./needsSystem.js";
import { stochasticRound } from "./seededRng.js";

const FOOD_PRIORITY = ["flour", "fish", "grain", "livestock"];

function inventoryQuantity(value) {
  return calibratedQuantity(value);
}

function storedFood(inventory = {}) {
  return FOOD_PRIORITY.reduce(
    (total, commodity) => total + inventoryQuantity(inventory[commodity]),
    0,
  );
}

export function updateHouseholdNeeds(household, context = {}) {
  const day = Math.max(1, Math.floor(context.day ?? 1));
  const occupation = household.occupation ?? "laborer";
  const weight = Math.max(1, Math.floor(household.weight ?? 1));
  const needs = normalizeNeeds(household.needs);
  const foodReserveRatio = storedFood(household.inventory) / Math.max(
    1,
    weight * FOOD_STOCK_TARGET_PER_PERSON,
  );
  const foodDelta = foodReserveRatio >= 1
    ? -2
    : foodReserveRatio >= 0.5
      ? 0
      : day % 5 === 0 ? 1 : 0;
  const nextFoodNeed = clampNeed(needs.food + foodDelta);

  return {
    ...household,
    needs: {
      ...needs,
      food: nextFoodNeed,
      housing: clampNeed(needs.housing + (household.homeId ? -1 : day % 4 === 0 ? 1 : 0)),
      health: clampNeed(needs.health + (nextFoodNeed >= 85 ? 1 : needs.health > 10 ? -1 : 0)),
      clothing: clampNeed(needs.clothing + (day % 5 === 0 ? 1 : 0)),
      tools: clampNeed(needs.tools + (["farmer", "herder", "fisherman", "woodsman", "miner", "artisan"].includes(occupation) && day % 4 === 0 ? 1 : 0)),
      faith: clampNeed(needs.faith + (day % 7 === 0 ? 1 : 0)),
      employment: clampNeed(needs.employment + (household.employmentRatio > 0 ? -1 : 2)),
    },
  };
}

function consumeFromInventory(inventory, commodity, requestedQuantity) {
  const available = inventoryQuantity(inventory[commodity]);
  const requested = Math.max(0, Math.floor(Number(requestedQuantity) || 0));
  const consumed = Math.min(Math.floor(available), requested);
  return {
    inventory: {
      ...inventory,
      [commodity]: inventoryQuantity(available - consumed),
    },
    consumed,
  };
}

export function consumeHousehold(household, rng, context = {}) {
  const weight = Math.max(1, Math.floor(household.weight ?? 1));
  const seasonalMultiplier = SEASON_CONSUMPTION_MULTIPLIERS[context.season] ?? 1;
  const targetFood = stochasticRound(
    weight * DAILY_FOOD_TARGET_PER_PERSON * seasonalMultiplier,
    rng,
  );
  let remainingFood = targetFood;
  let inventory = { ...household.inventory };
  const consumed = {};

  for (const commodity of FOOD_PRIORITY) {
    if (remainingFood <= 0) break;
    const result = consumeFromInventory(inventory, commodity, remainingFood);
    inventory = result.inventory;
    if (result.consumed > 0) consumed[commodity] = result.consumed;
    remainingFood -= result.consumed;
  }

  const consumedFood = targetFood - remainingFood;
  let needs = normalizeNeeds(household.needs);
  if (targetFood > 0) {
    const foodRatio = consumedFood / targetFood;
    needs.food = clampNeed(needs.food - Math.round(6 * foodRatio) + (remainingFood > 0 ? 2 : 0));
  }

  if (needs.clothing >= 60) {
    const source = Math.floor(inventoryQuantity(inventory.cloth)) >= 1 ? "cloth" : "wool";
    const result = consumeFromInventory(inventory, source, 1);
    inventory = result.inventory;
    if (result.consumed > 0) {
      consumed[source] = (consumed[source] ?? 0) + result.consumed;
      needs.clothing = clampNeed(needs.clothing - 25);
    }
  }

  if (needs.tools >= 65) {
    const result = consumeFromInventory(inventory, "tools", 1);
    inventory = result.inventory;
    if (result.consumed > 0) {
      consumed.tools = (consumed.tools ?? 0) + result.consumed;
      needs.tools = clampNeed(needs.tools - 30);
    }
  }

  return {
    household: { ...household, inventory, needs },
    consumed,
    targetFood,
    consumedFood,
    unmetFood: remainingFood,
    totalConsumed: Object.values(consumed).reduce((total, amount) => total + amount, 0),
    contextDay: context.day ?? null,
  };
}
