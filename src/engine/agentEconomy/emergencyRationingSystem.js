import {
  FOOD_STOCK_TARGET_PER_PERSON,
  calibratedQuantity,
} from "./economyCalibration.js";
import { clampNeed } from "./needsSystem.js";

export const EMERGENCY_RATIONING_STOCK_PER_PERSON = FOOD_STOCK_TARGET_PER_PERSON * 1.5;

const FOOD_PRIORITY = ["flour", "fish", "grain", "livestock"];
const EPSILON = 0.0001;

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function quantity(value) {
  return calibratedQuantity(value);
}

function householdPopulation(households = []) {
  return households.reduce(
    (total, household) => total + Math.max(0, Math.floor(finite(household?.weight))),
    0,
  );
}

function householdFood(household = {}) {
  return FOOD_PRIORITY.reduce(
    (total, commodity) => total + quantity(household.inventory?.[commodity]),
    0,
  );
}

function totalFood(households = []) {
  return households.reduce((total, household) => total + householdFood(household), 0);
}

function cloneHouseholds(households = []) {
  return households.map((household) => ({
    ...household,
    inventory: { ...(household.inventory ?? {}) },
    needs: { ...(household.needs ?? {}) },
  }));
}

function donorIndexes(households) {
  return households
    .map((household, index) => ({
      index,
      id: household.id ?? String(index),
      food: householdFood(household),
    }))
    .filter((entry) => entry.food > EPSILON)
    .sort((left, right) => right.food - left.food || left.id.localeCompare(right.id));
}

function withdrawFood(households, requestedAmount) {
  let remaining = quantity(requestedAmount);
  const consumed = {};

  for (const donor of donorIndexes(households)) {
    if (remaining <= EPSILON) break;
    const household = households[donor.index];
    for (const commodity of FOOD_PRIORITY) {
      if (remaining <= EPSILON) break;
      const available = quantity(household.inventory?.[commodity]);
      if (available <= EPSILON) continue;
      const removed = quantity(Math.min(available, remaining));
      household.inventory[commodity] = quantity(available - removed);
      consumed[commodity] = quantity(finite(consumed[commodity]) + removed);
      remaining = quantity(remaining - removed);
    }
  }

  return {
    consumed,
    amount: quantity(requestedAmount - remaining),
  };
}

function mergeCommodityTotals(left = {}, right = {}) {
  const commodities = new Set([...Object.keys(left), ...Object.keys(right)]);
  return Object.fromEntries([...commodities].map((commodity) => [
    commodity,
    quantity(finite(left[commodity]) + finite(right[commodity])),
  ]));
}

function needAdjustment(targetFood, consumedFood, unmetFood) {
  if (targetFood <= EPSILON) return 0;
  return -Math.round(6 * (consumedFood / targetFood)) + (unmetFood > EPSILON ? 2 : 0);
}

function updateRecipientNeed(household, targetFood, initialConsumed, initialUnmet, finalConsumed, finalUnmet) {
  const initialAdjustment = needAdjustment(targetFood, initialConsumed, initialUnmet);
  const finalAdjustment = needAdjustment(targetFood, finalConsumed, finalUnmet);
  return {
    ...household,
    needs: {
      ...(household.needs ?? {}),
      food: clampNeed(finite(household.needs?.food) + finalAdjustment - initialAdjustment),
    },
  };
}

export function applyEmergencyFoodRationing(consumption = {}, context = {}) {
  const sourceHouseholds = Array.isArray(consumption.households) ? consumption.households : [];
  const population = householdPopulation(sourceHouseholds);
  const availableFood = totalFood(sourceHouseholds);
  const stockPerPerson = population > 0 ? availableFood / population : 0;
  const totalUnmet = Math.max(0, finite(consumption.unmetFood));
  const threshold = Math.max(
    FOOD_STOCK_TARGET_PER_PERSON,
    finite(context.emergencyRationingStockPerPerson, EMERGENCY_RATIONING_STOCK_PER_PERSON),
  );
  const enabled = context.emergencyRationing !== false;
  const triggered = enabled
    && population > 0
    && totalUnmet > EPSILON
    && availableFood > EPSILON
    && stockPerPerson <= threshold;

  if (!triggered) {
    return {
      ...consumption,
      emergencyRationing: {
        triggered: false,
        stockPerPerson: quantity(stockPerPerson),
        threshold: quantity(threshold),
        foodRationed: 0,
        recipients: 0,
        consumedByCommodity: {},
      },
    };
  }

  let households = cloneHouseholds(sourceHouseholds);
  const unmetFoodByHousehold = { ...(consumption.unmetFoodByHousehold ?? {}) };
  const consumedFoodByHousehold = { ...(consumption.consumedFoodByHousehold ?? {}) };
  const targetFoodByHousehold = { ...(consumption.targetFoodByHousehold ?? {}) };
  let emergencyConsumed = {};
  let foodRationed = 0;
  const recipientIds = new Set();

  const recipients = households
    .map((household, index) => ({
      index,
      id: household.id ?? String(index),
      unmet: Math.max(0, finite(unmetFoodByHousehold[household.id])),
      weight: Math.max(1, Math.floor(finite(household.weight, 1))),
      health: finite(household.health, 100),
      foodNeed: finite(household.needs?.food),
    }))
    .filter((entry) => entry.unmet > EPSILON)
    .sort((left, right) => (
      (right.unmet / right.weight) - (left.unmet / left.weight)
      || left.health - right.health
      || right.foodNeed - left.foodNeed
      || left.id.localeCompare(right.id)
    ));

  let progress = true;
  while (progress && recipients.some((recipient) => recipient.unmet > EPSILON)) {
    progress = false;
    for (const recipient of recipients) {
      if (recipient.unmet <= EPSILON) continue;
      const allocation = withdrawFood(households, Math.min(1, recipient.unmet));
      if (allocation.amount <= EPSILON) break;

      progress = true;
      recipient.unmet = quantity(recipient.unmet - allocation.amount);
      foodRationed = quantity(foodRationed + allocation.amount);
      emergencyConsumed = mergeCommodityTotals(emergencyConsumed, allocation.consumed);
      recipientIds.add(recipient.id);

      const target = Math.max(0, finite(targetFoodByHousehold[recipient.id]));
      const initialConsumed = Math.max(0, finite(consumedFoodByHousehold[recipient.id]));
      const initialUnmet = Math.max(0, finite(unmetFoodByHousehold[recipient.id]));
      const finalConsumed = quantity(initialConsumed + allocation.amount);
      const finalUnmet = quantity(Math.max(0, target - finalConsumed));
      consumedFoodByHousehold[recipient.id] = finalConsumed;
      unmetFoodByHousehold[recipient.id] = finalUnmet;
      households[recipient.index] = updateRecipientNeed(
        households[recipient.index],
        target,
        initialConsumed,
        initialUnmet,
        finalConsumed,
        finalUnmet,
      );
    }
  }

  const remainingUnmet = quantity(Object.values(unmetFoodByHousehold).reduce(
    (total, amount) => total + Math.max(0, finite(amount)),
    0,
  ));

  return {
    ...consumption,
    households,
    consumedByCommodity: mergeCommodityTotals(
      consumption.consumedByCommodity,
      emergencyConsumed,
    ),
    totalConsumed: quantity(finite(consumption.totalConsumed) + foodRationed),
    foodConsumed: quantity(finite(consumption.foodConsumed) + foodRationed),
    unmetFood: remainingUnmet,
    unmetFoodByHousehold,
    consumedFoodByHousehold,
    emergencyRationing: {
      triggered: true,
      stockPerPerson: quantity(stockPerPerson),
      threshold: quantity(threshold),
      foodRationed,
      recipients: recipientIds.size,
      consumedByCommodity: emergencyConsumed,
    },
  };
}
