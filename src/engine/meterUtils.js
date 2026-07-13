/**
 * meterUtils.js
 *
 * Resource-based game state checks for The Lord's Ledger.
 * Replaces the old meter system (treasury/people/military/faith 0-100 bars)
 * with direct resource checks (denarii, food, population, garrison).
 *
 * No side effects, no I/O. All functions are deterministic.
 */

/**
 * Translates old-format meter effects (from events) into resource deltas.
 * This allows existing event data to work with the new resource system.
 *
 * Old format: { treasury: 5, people: -3, military: 2, faith: -1 }
 * New format: { denarii: 50, food: -9, garrison: 1 }
 *
 * Events can also use direct resource keys (denarii, food, population, garrison)
 * which take priority and are passed through directly.
 *
 * @param {{ treasury?: number, people?: number, military?: number, faith?: number,
 *           denarii?: number, food?: number, population?: number, garrison?: number }} effects
 * @returns {{ denarii: number, food: number, population: number, garrison: number }}
 */
export function translateEffects(effects) {
  if (!effects) return { denarii: 0, food: 0, population: 0, garrison: 0 };

  const result = { denarii: 0, food: 0, population: 0, garrison: 0, morale: 0 };

  // Translate old meter keys to resource effects
  if (effects.treasury) result.denarii += effects.treasury * 10;
  if (effects.people) result.food += effects.people * 3;
  if (effects.military) {
    result.garrison += effects.military > 0 ? Math.ceil(effects.military / 5) : Math.floor(effects.military / 5);
    // Military events also affect garrison morale
    result.morale += effects.military * 3;
  }
  if (effects.faith) result.denarii += effects.faith * 5;

  // Direct resource keys override/stack
  if (effects.denarii) result.denarii += effects.denarii;
  if (effects.food) result.food += effects.food;
  if (effects.population) result.population += effects.population;
  if (effects.garrison) result.garrison += effects.garrison;
  if (effects.morale) result.morale += effects.morale;

  return result;
}

/**
 * Applies translated resource effects to the game state.
 * Food effects are added to grain in inventory.
 * Population and garrison are clamped to valid ranges.
 *
 * @param {object} state - Current game state
 * @param {{ denarii: number, food: number, population: number, garrison: number }} resourceEffects
 * @param {number} maxGarrison - Maximum garrison size (default 25)
 * @returns {{ denarii: number, population: number, garrison: number, inventory: object, food: number }}
 */
export function applyResourceEffects(state, resourceEffects, maxGarrison = 25) {
  const newDenarii = Math.max(0, state.denarii + resourceEffects.denarii);
  const newPopulation = Math.max(0, state.population + resourceEffects.population);
  const popBasedCap = Math.floor(newPopulation * 0.6);
  const newGarrison = Math.max(0, Math.min(maxGarrison, popBasedCap, state.garrison + resourceEffects.garrison));

  // Food effects go into grain
  let newInventory = state.inventory;
  if (resourceEffects.food !== 0) {
    const currentGrain = state.inventory.grain || 0;
    const newGrain = Math.max(0, currentGrain + resourceEffects.food);
    newInventory = { ...state.inventory, grain: newGrain };
  }

  // Recalculate total food from inventory
  const FOOD_RESOURCES = ["grain", "livestock", "fish", "flour"];
  const newFood = FOOD_RESOURCES.reduce((sum, r) => sum + (newInventory[r] || 0), 0);

  // Apply morale changes to military state
  let newMilitary = state.military;
  if (resourceEffects.morale && newMilitary) {
    const currentMorale = newMilitary.morale ?? 50;
    const newMorale = Math.max(0, Math.min(100, currentMorale + resourceEffects.morale));
    newMilitary = { ...newMilitary, morale: newMorale };
  }

  return {
    denarii: newDenarii,
    population: newPopulation,
    garrison: newGarrison,
    inventory: newInventory,
    food: newFood,
    military: newMilitary,
  };
}

/**
 * Checks whether the game should end based on resource state.
 *
 * Game over conditions:
 *   - Population reaches 0: everyone left or perished
 *   - Bankrupt for 6+ consecutive turns: creditors seize the estate
 *
 * @param {object} state - Game state with population and bankruptcyTurns
 * @returns {{ type: string, reason: string } | null}
 */
export function checkGameOver(state) {
  if (state.population <= 0) {
    return {
      type: "depopulation",
      reason: "All your families have abandoned or perished on your estate.",
    };
  }
  if ((state.bankruptcyTurns || 0) >= 6) {
    return {
      type: "bankruptcy",
      reason: "Your creditors have seized the estate after seasons of empty coffers.",
    };
  }
  const famineThreshold = state.difficulty === "easy" ? 4 : state.difficulty === "hard" ? 2 : 3;
  if ((state.starvationTurns || 0) >= famineThreshold) {
    return {
      type: "famine",
      reason: "After seasons of famine, your people have scattered to seek sustenance elsewhere.",
    };
  }
  return null;
}

/**
 * Translates old-format indicator objects to resource-based indicators.
 * Used for EventCard display.
 *
 * @param {{ treasury?: string, people?: string, military?: string, faith?: string }} indicators
 * @returns {{ denarii?: string, food?: string, garrison?: string }}
 */
export function translateIndicators(indicators) {
  if (!indicators) return null;

  const result = {};
  if (indicators.treasury) result.denarii = indicators.treasury;
  if (indicators.people) result.food = indicators.people;
  if (indicators.military) result.garrison = indicators.military;
  if (indicators.faith) result.denarii = result.denarii || indicators.faith;

  // Pass through direct resource indicators
  if (indicators.denarii) result.denarii = indicators.denarii;
  if (indicators.food) result.food = indicators.food;
  if (indicators.population) result.population = indicators.population;
  if (indicators.garrison) result.garrison = indicators.garrison;

  return Object.keys(result).length > 0 ? result : null;
}
