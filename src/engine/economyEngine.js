/**
 * economyEngine.js
 *
 * Pure functions for the economic simulation.
 * No side effects, no I/O. All functions are deterministic given inputs.
 *
 * The simulate() function runs the full season resolution:
 * 1. Production — buildings produce into inventory (with seasonal/condition/synergy modifiers)
 * 2. Consumption — population eats food (with seasonal consumption modifier)
 * 3. Upkeep — building + garrison costs deducted from denarii
 * 4. Tax collection (Autumn only)
 * 5. Passive income (market tolls, mill fees)
 * 6. Population changes based on food/tax conditions
 *
 * Buildings can be either string IDs (legacy) or objects { type, condition, ... }.
 * Use getBuildingType() to normalize.
 *
 * Returns the new economic state + a report array of chronicle lines.
 */

import BUILDINGS from "../data/buildings.js";
import {
  FOOD_RESOURCES,
  TAX_RATES,
  GARRISON_UPKEEP_PER_SOLDIER,
  FOOD_PER_FAMILY,
  DIFFICULTY_CONFIGS,
  SEASON_FARM_MULTIPLIERS,
  SEASON_CONSUMPTION_MULTIPLIERS,
  STARTING_TOTAL_PLOTS,
  REPAIR_COST_PER_POINT,
} from "../data/economy.js";
import { getSynergyPassiveIncome, hasSynergyPopulationBonus } from "./synergyEngine.js";

// ---------------------------------------------------------------------------
// Building type helpers (handle both string[] and object[] formats)
// ---------------------------------------------------------------------------

/**
 * Extract the building type ID from a building entry.
 * Handles both legacy string format and new object format.
 */
export function getBuildingType(building) {
  return typeof building === "string" ? building : building.type;
}

/**
 * Count how many of a given building type the player has built.
 */
function countBuilding(buildings, buildingId) {
  return buildings.filter((b) => getBuildingType(b) === buildingId).length;
}

/**
 * Get total inventory used (sum of all resource quantities).
 */
export function getInventoryUsed(inventory) {
  return Object.values(inventory).reduce((sum, v) => sum + v, 0);
}

/**
 * Get total food in inventory (grain + livestock + fish + flour).
 */
export function getTotalFood(inventory) {
  return FOOD_RESOURCES.reduce((sum, r) => sum + (inventory[r] || 0), 0);
}

/**
 * Calculate total building upkeep per season.
 */
export function getTotalBuildingUpkeep(buildings) {
  return buildings.reduce((sum, b) => {
    if (b.freeUpkeep) return sum;
    const def = BUILDINGS[getBuildingType(b)];
    return sum + (def ? def.upkeep : 0);
  }, 0);
}

/**
 * Calculate total garrison upkeep per season.
 */
export function getGarrisonUpkeep(garrison, military) {
  if (military?.garrison) {
    const g = military.garrison;
    // Must match SOLDIER_TYPES upkeep values in data/military.js
    return (g.levy || 0) * 1 + (g.menAtArms || 0) * 4 + (g.knights || 0) * 8;
  }
  // Legacy fallback for when typed garrison isn't available
  return garrison * GARRISON_UPKEEP_PER_SOLDIER;
}

/**
 * Calculate total upkeep (buildings + garrison).
 */
export function getTotalUpkeep(buildings, garrison, military) {
  return getTotalBuildingUpkeep(buildings) + getGarrisonUpkeep(garrison, military);
}

/**
 * Calculate tax income for the season.
 * Only collected in Autumn.
 */
export function getTaxIncome(population, taxRate, season) {
  if (season !== "autumn") return 0;
  const rate = TAX_RATES[taxRate]?.rate ?? TAX_RATES.medium.rate;
  return population * rate;
}

/**
 * Calculate passive income (market tolls, mill fees based on castle level and buildings).
 */
export function getPassiveIncome(castleLevel, buildings) {
  const baseTolls = castleLevel * 5;
  const millFees = buildings.filter((b) => {
    const t = getBuildingType(b);
    return t === "fulling_mill" || t === "brewery" || t === "mill";
  }).length * 4;
  return baseTolls + millFees;
}

// ---------------------------------------------------------------------------
// Land system
// ---------------------------------------------------------------------------

/**
 * Calculate total plots used by all buildings.
 */
export function getUsedPlots(buildings) {
  return buildings.reduce((sum, b) => {
    const def = BUILDINGS[getBuildingType(b)];
    return sum + (def?.plots ?? 1);
  }, 0);
}

// ---------------------------------------------------------------------------
// Building condition helpers
// ---------------------------------------------------------------------------

/**
 * Get the output multiplier for a building's current condition.
 * Good (75-100): 1.0, Fair (50-74): 0.75, Poor (25-49): 0.5, Ruined (0-24): 0
 */
export function getConditionMultiplier(condition) {
  if (condition >= 75) return 1.0;
  if (condition >= 50) return 0.75;
  if (condition >= 25) return 0.5;
  return 0;
}

/**
 * Calculate repair cost for a building instance.
 */
export function getRepairCost(building) {
  const def = BUILDINGS[getBuildingType(building)];
  if (!def) return 0;
  const condition = typeof building === "string" ? 100 : (building.condition ?? 100);
  const pointsToRepair = 100 - condition;
  if (pointsToRepair <= 0) return 0;
  const costPerPoint = REPAIR_COST_PER_POINT[def.rarity] ?? REPAIR_COST_PER_POINT.common;
  return Math.max(1, Math.ceil(pointsToRepair * costPerPoint));
}

/**
 * Calculate the synergy bonus for a building from its buildingSynergies array.
 * Checks if the synergy partner is present in the player's buildings.
 */
function getBuildingSynergyBonus(building, allBuildings) {
  const def = BUILDINGS[getBuildingType(building)];
  if (!def?.buildingSynergies?.length) return 0;

  let totalBonus = 0;
  for (const syn of def.buildingSynergies) {
    const hasPartner = allBuildings.some((b) => getBuildingType(b) === syn.with);
    if (hasPartner) totalBonus += syn.bonus;
  }
  return totalBonus;
}

/**
 * Get active building synergies for display.
 * Returns array of { buildingType, partnerType, bonus, desc, active }.
 */
export function getActiveBuildingSynergies(buildings) {
  const synergies = [];
  const typeSet = new Set(buildings.map((b) => getBuildingType(b)));

  for (const building of buildings) {
    const def = BUILDINGS[getBuildingType(building)];
    if (!def?.buildingSynergies?.length) continue;

    for (const syn of def.buildingSynergies) {
      // Avoid duplicate display (only show from one direction)
      if (synergies.some((s) => s.buildingType === def.id && s.partnerType === syn.with)) continue;
      synergies.push({
        buildingType: def.id,
        partnerType: syn.with,
        bonus: syn.bonus,
        desc: syn.desc,
        active: typeSet.has(syn.with),
      });
    }
  }

  return synergies;
}

// ---------------------------------------------------------------------------
// Production
// ---------------------------------------------------------------------------

/**
 * Calculate total production from all buildings.
 * Applies condition, seasonal, and building synergy modifiers.
 * Returns { produced, consumed, inventory, report }.
 */
function runProduction(buildings, inventory, inventoryCapacity, season) {
  const produced = {};
  const consumed = {};
  let currentInventory = { ...inventory };
  let currentUsed = getInventoryUsed(currentInventory);
  const report = [];
  const seasonMult = SEASON_FARM_MULTIPLIERS[season] ?? 1.0;

  // First pass: basic producers (no consumes)
  for (const building of buildings) {
    const typeId = getBuildingType(building);
    const def = BUILDINGS[typeId];
    if (!def || def.consumes) continue;

    // Condition modifier (object format only; strings default to 100%)
    const condition = typeof building === "string" ? 100 : (building.condition ?? 100);
    const condMod = getConditionMultiplier(condition);

    // Skip ruined buildings
    if (condMod === 0) {
      report.push(`Your ${def.name} is in ruins and produced nothing.`);
      continue;
    }

    // Seasonal modifier (farms only)
    const farmMod = def.isFarm ? seasonMult : 1.0;

    // Building synergy bonus
    const synergyBonus = getBuildingSynergyBonus(building, buildings);

    for (const [resource, baseAmount] of Object.entries(def.produces)) {
      const amount = Math.max(1, Math.round(baseAmount * condMod * farmMod * (1 + synergyBonus)));
      const space = inventoryCapacity - currentUsed;
      const actualAmount = Math.min(amount, space);
      if (actualAmount > 0) {
        produced[resource] = (produced[resource] || 0) + actualAmount;
        currentInventory[resource] = (currentInventory[resource] || 0) + actualAmount;
        currentUsed += actualAmount;
      }
    }
  }

  // Second pass: converter buildings (consumes input, produces output)
  for (const building of buildings) {
    const typeId = getBuildingType(building);
    const def = BUILDINGS[typeId];
    if (!def || !def.consumes) continue;

    // Condition modifier
    const condition = typeof building === "string" ? 100 : (building.condition ?? 100);
    const condMod = getConditionMultiplier(condition);
    if (condMod === 0) {
      report.push(`Your ${def.name} is in ruins and cannot process materials.`);
      continue;
    }

    // Check if all inputs are available
    let canProduce = true;
    for (const [resource, amount] of Object.entries(def.consumes)) {
      if ((currentInventory[resource] || 0) < amount) {
        canProduce = false;
        report.push(`Your ${def.name} sits idle \u2014 not enough ${resource}.`);
        break;
      }
    }

    if (canProduce) {
      // Consume inputs
      for (const [resource, amount] of Object.entries(def.consumes)) {
        consumed[resource] = (consumed[resource] || 0) + amount;
        currentInventory[resource] -= amount;
        currentUsed -= amount;
      }
      // Produce outputs (scaled by condition)
      for (const [resource, baseAmount] of Object.entries(def.produces)) {
        const amount = Math.max(1, Math.round(baseAmount * condMod));
        const space = inventoryCapacity - currentUsed;
        const actualAmount = Math.min(amount, space);
        if (actualAmount > 0) {
          produced[resource] = (produced[resource] || 0) + actualAmount;
          currentInventory[resource] = (currentInventory[resource] || 0) + actualAmount;
          currentUsed += actualAmount;
        }
      }
    }
  }

  // Check if inventory was full and production was wasted
  if (currentUsed >= inventoryCapacity && buildings.length > 0) {
    report.push("Your storehouses are full! Some production was wasted.");
  }

  return { produced, consumed, inventory: currentInventory, report };
}

/**
 * Consume food for the population.
 * Applies seasonal consumption modifier (winter = 1.5x).
 * Returns { inventory, foodEaten, shortfall, report }.
 */
function runConsumption(inventory, population, maxFoodLoss, season) {
  const consumptionMult = SEASON_CONSUMPTION_MULTIPLIERS[season] ?? 1.0;
  const baseNeeded = population * FOOD_PER_FAMILY;
  const seasonalNeeded = Math.ceil(baseNeeded * consumptionMult);
  const needed = maxFoodLoss ? Math.min(seasonalNeeded, maxFoodLoss) : seasonalNeeded;
  let remaining = needed;
  const nextInventory = { ...inventory };
  const report = [];

  // Consume food in order: grain, livestock, fish, flour
  for (const resource of FOOD_RESOURCES) {
    if (remaining <= 0) break;
    const available = nextInventory[resource] || 0;
    const eat = Math.min(available, remaining);
    nextInventory[resource] -= eat;
    remaining -= eat;
  }

  const foodEaten = needed - remaining;
  const shortfall = remaining;

  if (shortfall > 0) {
    const rationingNote = (maxFoodLoss && seasonalNeeded > needed) ? ` (rationing reduced from ${seasonalNeeded})` : "";
    report.push(`Your ${population} families needed ${needed} food${rationingNote} but only had ${foodEaten}. ${shortfall} families went hungry!`);
  } else {
    const seasonNote = consumptionMult > 1.0 ? ` (winter rations: \u00D7${consumptionMult})` : "";
    const capNote = (maxFoodLoss && seasonalNeeded > maxFoodLoss) ? ` (rationing saved ${seasonalNeeded - maxFoodLoss})` : "";
    report.push(`Your ${population} families consumed ${foodEaten} food${seasonNote}${capNote}.`);
  }

  return { inventory: nextInventory, foodEaten, shortfall, report };
}

/**
 * Deduct upkeep costs from denarii.
 * Returns { denarii, unpaidUpkeep, report }.
 */
function runUpkeep(denarii, buildings, garrison, military) {
  const buildingCost = getTotalBuildingUpkeep(buildings);
  const garrisonCost = getGarrisonUpkeep(garrison, military);
  const totalCost = buildingCost + garrisonCost;
  const report = [];

  let newDenarii = denarii - totalCost;
  let unpaidUpkeep = 0;

  if (newDenarii < 0) {
    unpaidUpkeep = Math.abs(newDenarii);
    newDenarii = 0;
    report.push(`Upkeep cost ${totalCost}d but you only had ${denarii}d. ${unpaidUpkeep}d went unpaid!`);
  } else if (totalCost > 0) {
    report.push(`Upkeep: ${buildingCost}d for buildings, ${garrisonCost}d for ${garrison} soldiers. Total: ${totalCost}d.`);
  }

  return { denarii: newDenarii, unpaidUpkeep, report };
}

/**
 * Run the full seasonal economic simulation.
 *
 * @param {object} state - Economy-relevant state fields
 * @returns {object} { denarii, food, population, inventory, report, populationChange }
 */
export function simulateEconomy(state) {
  const {
    denarii,
    population,
    inventory,
    inventoryCapacity,
    buildings,
    garrison,
    castleLevel,
    taxRate,
    season,
  } = state;

  const report = [];
  const diffCfg = DIFFICULTY_CONFIGS[state.difficulty || "normal"] || DIFFICULTY_CONFIGS.normal;
  const penaltyScale = diffCfg.penaltyScale;
  let currentDenarii = denarii;
  let currentPopulation = population;
  let currentGarrison = garrison;

  // ----- 1. PRODUCTION -----
  const production = runProduction(buildings, inventory, inventoryCapacity, season);
  let currentInventory = production.inventory;
  report.push(...production.report);

  // Baseline subsistence: peasant families forage and tend small garden plots.
  // Per-difficulty scale so a zero-action player has several turns of stability
  // before any food spiral.
  const farmMult = SEASON_FARM_MULTIPLIERS[season] ?? 1.0;
  const subsistenceScale = diffCfg.subsistenceScale ?? 0.7;
  const subsistenceGrain = Math.max(3, Math.floor(currentPopulation * subsistenceScale * farmMult));
  currentInventory = { ...currentInventory, grain: (currentInventory.grain || 0) + subsistenceGrain };

  // Summarize production
  const prodEntries = Object.entries(production.produced);
  if (prodEntries.length > 0) {
    const prodStr = prodEntries.map(([r, a]) => `${a} ${r}`).join(", ");
    report.push(`Your buildings produced: ${prodStr}.`);
  }

  // ----- 1.5. LEVY LABOR PENALTY -----
  const levyCount = state.military?.garrison?.levy || 0;
  const levyThreshold = Math.floor(currentPopulation * 0.25);
  const excessLevy = Math.max(0, levyCount - levyThreshold);
  if (excessLevy > 0) {
    const penaltyRate = excessLevy * 0.10;
    const totalFoodProduced = FOOD_RESOURCES.reduce((sum, r) => sum + (production.produced[r] || 0), 0);
    const foodPenalty = Math.min(totalFoodProduced, Math.ceil(totalFoodProduced * penaltyRate));
    if (foodPenalty > 0) {
      const grainRemoval = Math.min(currentInventory.grain || 0, foodPenalty);
      currentInventory = { ...currentInventory, grain: (currentInventory.grain || 0) - grainRemoval };
      report.push(`${excessLevy} levy conscripts beyond safe limit reduced food harvest by ${Math.round(penaltyRate * 100)}% (-${grainRemoval} grain).`);
    }
  }

  // ----- 2. CONSUMPTION -----
  const difficulty = state.difficulty || "normal";
  const foodCapBase = diffCfg.foodCapBase ?? 28;
  const consumptionScale = diffCfg.consumptionScale ?? 0.7;
  const maxFoodLoss = Math.max(foodCapBase, Math.ceil(currentPopulation * FOOD_PER_FAMILY * consumptionScale));
  const consumption = runConsumption(currentInventory, currentPopulation, maxFoodLoss, season);
  currentInventory = consumption.inventory;
  report.push(...consumption.report);

  // Food shortfall causes families to leave
  if (consumption.shortfall > 0) {
    // On Hard difficulty, complete food exhaustion can kill the last family (no immortal floor)
    const totalFoodAfter = getTotalFood(currentInventory);
    const floorPop = (difficulty === "hard" && totalFoodAfter === 0) ? 0 : 1;
    const maxAttrition = Math.max(1, Math.ceil(currentPopulation * 0.25));
    const baseAttrition = Math.max(1, Math.ceil(consumption.shortfall * penaltyScale));
    const familiesLeave = Math.min(currentPopulation - floorPop, maxAttrition, baseAttrition);
    if (familiesLeave > 0) {
      currentPopulation -= familiesLeave;
      report.push(`${familiesLeave} ${familiesLeave === 1 ? "family" : "families"} left due to hunger.`);
    }
  }

  // ----- 2.5. GARRISON FOOD — soldiers eat too -----
  const garrisonAtStart = currentGarrison;
  const maxDesertionThisSeason = Math.max(1, Math.ceil(garrisonAtStart * 0.5));
  let totalDesertions = 0;

  const garrisonFoodNeeded = Math.ceil(currentGarrison / 5);
  if (garrisonFoodNeeded > 0) {
    let garrisonRemaining = garrisonFoodNeeded;
    for (const resource of FOOD_RESOURCES) {
      if (garrisonRemaining <= 0) break;
      const available = currentInventory[resource] || 0;
      const eat = Math.min(available, garrisonRemaining);
      currentInventory[resource] -= eat;
      garrisonRemaining -= eat;
    }
    if (garrisonRemaining > 0) {
      report.push(`Your ${currentGarrison} soldiers needed ${garrisonFoodNeeded} food but supplies ran short.`);
      // Hungry soldiers desert (capped by season max)
      const rawDeserters = Math.min(currentGarrison, Math.ceil(garrisonRemaining * penaltyScale));
      const deserters = Math.min(rawDeserters, maxDesertionThisSeason - totalDesertions);
      if (deserters > 0) {
        currentGarrison -= deserters;
        totalDesertions += deserters;
        report.push(`${deserters} hungry ${deserters === 1 ? "soldier" : "soldiers"} deserted.`);
      }
    } else {
      report.push(`Your garrison consumed ${garrisonFoodNeeded} food.`);
    }
  }

  // ----- 3. UPKEEP -----
  const upkeep = runUpkeep(currentDenarii, buildings, currentGarrison, state.military);
  currentDenarii = upkeep.denarii;
  report.push(...upkeep.report);

  // BUG-08 FIX: Unpaid upkeep — soldiers desert proportional to unpaid ratio
  if (upkeep.unpaidUpkeep > 0) {
    const garrisonCost = getGarrisonUpkeep(currentGarrison, state.military);
    const unpaidRatio = garrisonCost > 0 ? Math.min(1, upkeep.unpaidUpkeep / garrisonCost) : 0;
    const rawDeserters = Math.min(currentGarrison, Math.max(1, Math.ceil(currentGarrison * unpaidRatio * 0.2 * penaltyScale)));
    const deserters = Math.min(rawDeserters, maxDesertionThisSeason - totalDesertions);
    if (deserters > 0) {
      currentGarrison -= deserters;
      totalDesertions += deserters;
      report.push(`${deserters} unpaid ${deserters === 1 ? "soldier" : "soldiers"} deserted.`);
    }
  }

  // ----- 4. TAX COLLECTION (Autumn full + quarterly levy) -----
  const taxIncome = getTaxIncome(currentPopulation, taxRate, season);
  if (taxIncome > 0) {
    currentDenarii += taxIncome;
    report.push(`Autumn tax collection: ${taxIncome}d from ${currentPopulation} families at ${TAX_RATES[taxRate]?.label || "medium"} rate.`);

    // Tax rate affects population (Autumn only)
    const taxConfig = TAX_RATES[taxRate];
    if (taxConfig && taxConfig.populationMod) {
      const popChange = taxConfig.populationMod;
      if (popChange < 0) {
        const leavers = Math.min(currentPopulation - 1, Math.abs(popChange));
        currentPopulation -= leavers;
        if (leavers > 0) {
          report.push(`${leavers} ${leavers === 1 ? "family" : "families"} left due to heavy taxes.`);
        }
      } else if (popChange > 0) {
        currentPopulation += popChange;
        report.push(`${popChange} new ${popChange === 1 ? "family" : "families"} settled thanks to low taxes.`);
      }
    }
  } else if (season !== "autumn" && currentPopulation > 0) {
    const quarterlyLevy = Math.max(3, Math.floor(currentPopulation * 0.15));
    currentDenarii += quarterlyLevy;
    report.push(`Quarterly market levy: ${quarterlyLevy}d from ${currentPopulation} families.`);
  }

  // ----- 5. PASSIVE INCOME -----
  const passiveIncome = getPassiveIncome(castleLevel, buildings);
  // Population generates income from cottage industries and market activity
  const populationIncome = Math.floor(currentPopulation * 0.5);
  const totalPassiveIncome = passiveIncome + populationIncome;
  currentDenarii += totalPassiveIncome;
  if (totalPassiveIncome > 0) {
    const parts = [];
    if (passiveIncome > 0) parts.push(`${passiveIncome}d from market tolls`);
    if (populationIncome > 0) parts.push(`${populationIncome}d from cottage industries`);
    report.push(`Passive income: ${parts.join(", ")}.`);
  }

  // ----- 5.25. ESTATE MAINTENANCE — scales with size to prevent denarii snowball -----
  const buildingCount = buildings.filter(b => {
    if (typeof b === "string") return true;
    if (b.freeUpkeep) return false;
    return (b.condition ?? 100) > 0;
  }).length;
  const estateMaintenance = Math.floor(buildingCount * 2 + Math.max(0, currentPopulation - 15) * 0.5);
  if (estateMaintenance > 0) {
    currentDenarii = Math.max(0, currentDenarii - estateMaintenance);
    report.push(`Estate maintenance: ${estateMaintenance}d for ${buildingCount} buildings and road upkeep.`);
  }

  // ----- 5.5. SYNERGY BONUSES -----
  const activatedSynergies = state.synergies?.activated ?? [];
  const synergyIncome = getSynergyPassiveIncome(activatedSynergies);
  currentDenarii += synergyIncome;
  if (synergyIncome > 0) {
    report.push(`Strategy bonuses: +${synergyIncome}d`);
  }

  // ----- 6. POPULATION GROWTH/DECLINE -----
  let populationChange = 0;
  const totalFoodInInventory = getTotalFood(currentInventory);
  const foodSurplus = totalFoodInInventory > Math.ceil(currentPopulation * 1.0);

  // Ale consumed for morale — helps attract settlers
  const isFamine = consumption.shortfall > 0;
  const hasAle = !isFamine && (currentInventory.ale || 0) >= 3;
  if (hasAle) {
    currentInventory = { ...currentInventory, ale: currentInventory.ale - 3 };
    report.push("Your people enjoyed 3 ale \u2014 morale is high!");
  }

  // Luxury goods consumed (skip during famine to conserve resources)
  if (!isFamine && (currentInventory.salt || 0) > 0) {
    currentInventory.salt -= 1;
  }
  if (!isFamine && (currentInventory.tools || 0) > 0) {
    currentInventory.tools -= 1;
  }
  // Spices consumed — church ceremonies (skip during famine)
  if (!isFamine && (currentInventory.spices || 0) > 0) {
    currentInventory.spices -= 1;
    currentDenarii += 10; // Church reciprocates generosity
  }

  // Church donation income bonus (faith → economic benefit)
  const churchDonation = state.churchDonation ?? 0;
  if (churchDonation > 0) {
    // Church reciprocates: small denarii bonus + population attraction
    const churchBonus = Math.min(30, Math.floor(churchDonation / 3));
    currentDenarii += churchBonus;
    if (churchBonus > 0) {
      report.push(`The Church reciprocates your ${churchDonation}d offering: +${churchBonus}d in tithes and goodwill.`);
    }
    // Church favor attracts settlers
    if (churchDonation >= 75 && Math.random() < 0.4) {
      populationChange += 1;
    }
  }

  // Growth from food surplus + ale (soft cap at 35, hard cap at 50)
  const popSoftCap = 35;
  const popHardCap = 50;
  const growthChanceMod = currentPopulation >= popHardCap ? 0 : currentPopulation >= popSoftCap ? 0.3 : 1.0;
  if (foodSurplus && hasAle && growthChanceMod > 0) {
    populationChange += Math.random() < (0.4 * growthChanceMod) ? 2 : (Math.random() < (0.5 * growthChanceMod) ? 1 : 0);
  } else if (foodSurplus && Math.random() < (0.25 * growthChanceMod)) {
    populationChange += 1;
  }

  // Synergy: Breadbasket bonus — extra chance for +1 population
  if (hasSynergyPopulationBonus(activatedSynergies) && foodSurplus) {
    if (populationChange === 0 && Math.random() < 0.25) {
      populationChange = 1;
    }
  }

  // Decline from starvation
  if (consumption.shortfall > 0 && populationChange > 0) {
    populationChange = 0; // Cancel growth during famine
  }

  // Population recovery — when critically low, wandering families trickle in
  // Prevents unrecoverable death spiral but requires no active famine
  if (currentPopulation > 0 && currentPopulation < 10 && consumption.shortfall === 0 && populationChange <= 0) {
    const recoveryChance = currentPopulation < 5 ? 0.5 : 0.3;
    if (Math.random() < recoveryChance) {
      populationChange = 1;
      report.push("A wandering family, seeking a lord's protection, has settled on your estate.");
    }
  }

  // Enforce hard population cap — can't grow above cap from any source
  if (populationChange > 0 && currentPopulation >= popHardCap) {
    populationChange = 0;
  } else if (populationChange > 0 && currentPopulation + populationChange > popHardCap) {
    populationChange = popHardCap - currentPopulation;
  }

  currentPopulation = Math.max(0, currentPopulation + populationChange);
  if (populationChange > 0) {
    report.push(`${populationChange} new ${populationChange === 1 ? "family has" : "families have"} settled on your land.`);
  } else if (populationChange < 0) {
    report.push(`${Math.abs(populationChange)} ${Math.abs(populationChange) === 1 ? "family has" : "families have"} left your manor.`);
  }

  // --- INVARIANT GUARDS ---
  if (currentDenarii < 0) {
    currentDenarii = 0;
  }
  if (currentPopulation < 1) {
    currentPopulation = 0; // Allow reaching 0 for game over
  }
  for (const [res, qty] of Object.entries(currentInventory)) {
    if (qty < 0) {
      currentInventory[res] = 0;
    }
  }

  return {
    denarii: currentDenarii,
    food: getTotalFood(currentInventory),
    population: currentPopulation,
    inventory: currentInventory,
    garrison: currentGarrison,
    report,
    populationChange,
  };
}

/**
 * Check if a building can be built given current state.
 * Returns { canBuild: boolean, reason: string | null }.
 */
export function canBuildBuilding(buildingId, state) {
  const def = BUILDINGS[buildingId];
  if (!def) return { canBuild: false, reason: "Unknown building" };

  const { denarii, buildings } = state;
  const totalPlots = state.totalPlots ?? STARTING_TOTAL_PLOTS;

  // Check cost
  if (denarii < def.cost) {
    return { canBuild: false, reason: `Need ${def.cost}d (have ${denarii}d)` };
  }

  // Check build limit
  const currentCount = countBuilding(buildings, buildingId);
  if (currentCount >= def.maxCount) {
    return { canBuild: false, reason: `Maximum ${def.maxCount} built` };
  }

  // Check land plots
  const usedPlots = getUsedPlots(buildings);
  if (usedPlots + (def.plots ?? 1) > totalPlots) {
    return { canBuild: false, reason: `Need ${def.plots ?? 1} plot${(def.plots ?? 1) > 1 ? "s" : ""} (${totalPlots - usedPlots} available)` };
  }

  // Check prerequisites
  if (def.requires) {
    const hasPrereq = buildings.some((b) => getBuildingType(b) === def.requires);
    if (!hasPrereq) {
      const prereqDef = BUILDINGS[def.requires];
      return { canBuild: false, reason: `Requires ${prereqDef?.name || def.requires}` };
    }
  }

  return { canBuild: true, reason: null };
}

/**
 * Calculate the net income per season (not including tax).
 */
export function getNetIncome(buildings, garrison, castleLevel, military) {
  const passiveIncome = getPassiveIncome(castleLevel, buildings);
  const totalUpkeep = getTotalUpkeep(buildings, garrison, military);
  return passiveIncome - totalUpkeep;
}

/**
 * Calculate the food consumption rate per season.
 */
export function getFoodConsumption(population) {
  return population * FOOD_PER_FAMILY;
}
