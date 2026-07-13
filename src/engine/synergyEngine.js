/**
 * synergyEngine.js
 *
 * Pure functions for the V3b synergy system.
 * Checks declarative conditions from synergies.js and computes bonuses.
 * No side effects, no I/O.
 */

import { SYNERGY_PATH_LIST, SYNERGY_TIER_MAP, FOOD_BUILDING_IDS } from "../data/synergies.js";
import { getBuildingType } from "./economyEngine.js";

/**
 * Count how many of a given building ID the player has built.
 * Handles both legacy string[] and new object[] formats.
 */
function countBuilding(buildings, buildingId) {
  return buildings.filter((b) => getBuildingType(b) === buildingId).length;
}

/**
 * Check if a single tier's conditions are met.
 * Interprets the declarative condition object against game state.
 *
 * @param {object} tierDef - Tier definition with .conditions
 * @param {object} state - Full game state (including synergies tracking)
 * @returns {boolean}
 */
export function checkTierConditions(tierDef, state) {
  const c = tierDef.conditions;
  if (!c) return false;

  const buildings = state.buildings ?? [];
  const synergies = state.synergies ?? {};

  // buildings: { pasture: 2 } — requires N of each building
  if (c.buildings) {
    for (const [id, count] of Object.entries(c.buildings)) {
      if (countBuilding(buildings, id) < count) return false;
    }
  }

  // castleLevel
  if (c.castleLevel !== undefined && (state.castleLevel ?? 1) < c.castleLevel) return false;

  // garrisonMin
  if (c.garrisonMin !== undefined && (state.garrison ?? 0) < c.garrisonMin) return false;

  // populationMin
  if (c.populationMin !== undefined && (state.population ?? 0) < c.populationMin) return false;

  // foodMin
  if (c.foodMin !== undefined && (state.food ?? 0) < c.foodMin) return false;

  // tradeCount (total trades made, tracked on state.tradeCount + synergies)
  if (c.tradeCount !== undefined) {
    const total = state.tradeCount ?? 0;
    if (total < c.tradeCount) return false;
  }

  // tradeTypeCount (distinct resource types traded)
  if (c.tradeTypeCount !== undefined) {
    const types = synergies.tradeTypes ?? [];
    if (types.length < c.tradeTypeCount) return false;
  }

  // woolTrades
  if (c.woolTrades !== undefined && (synergies.woolTrades ?? 0) < c.woolTrades) return false;

  // spicePurchases
  if (c.spicePurchases !== undefined && (synergies.spicePurchases ?? 0) < c.spicePurchases) return false;

  // lowTaxTurns (consecutive turns of low or medium tax)
  if (c.lowTaxTurns !== undefined && (synergies.lowTaxTurns ?? 0) < c.lowTaxTurns) return false;

  // highPeopleTurns — skipped (meters removed, population-based growth handles this)
  // highFaithTurns — skipped (meters removed, church donations handle this)

  // foodSurplusTurns (consecutive turns with food > 100)
  if (c.foodSurplusTurns !== undefined && (synergies.foodSurplusTurns ?? 0) < c.foodSurplusTurns) return false;

  // foodBuildingCount (count of food-producing buildings)
  if (c.foodBuildingCount !== undefined) {
    const count = buildings.filter((b) => FOOD_BUILDING_IDS.includes(getBuildingType(b))).length;
    if (count < c.foodBuildingCount) return false;
  }

  // defenseUpgradeCount — count fortification levels purchased
  if (c.defenseUpgradeCount !== undefined) {
    const mil = state.military ?? {};
    const fortLevels = (mil.walls || 0) + (mil.gate || 0) + (mil.moat || 0);
    if (fortLevels < c.defenseUpgradeCount) return false;
  }

  // meterMin — skipped (meters removed, resource checks used instead)

  // noRevolts
  if (c.noRevolts && synergies.revoltTriggered) return false;

  // hasConverterBuilding (fulling_mill or brewery)
  if (c.hasConverterBuilding) {
    const hasConverter = buildings.some((b) => getBuildingType(b) === "fulling_mill" || getBuildingType(b) === "brewery");
    if (!hasConverter) return false;
  }

  return true;
}

/**
 * Check all synergy paths and return newly activated tier IDs.
 * Only checks the next unactivated tier for each path.
 *
 * @param {object} state - Full game state
 * @returns {string[]} Array of newly activated tier IDs
 */
export function checkSynergies(state) {
  const activated = state.synergies?.activated ?? [];
  const newlyActivated = [];

  for (const path of SYNERGY_PATH_LIST) {
    // Find the next unactivated tier for this path
    for (const tier of path.tiers) {
      if (activated.includes(tier.id)) continue;
      // This is the next tier to check
      if (checkTierConditions(tier, state)) {
        newlyActivated.push(tier.id);
      }
      break; // Only check the first unactivated tier per path
    }
  }

  return newlyActivated;
}

/**
 * Calculate total passive income from activated synergies.
 */
export function getSynergyPassiveIncome(activated) {
  let total = 0;
  for (const id of activated) {
    const entry = SYNERGY_TIER_MAP[id];
    if (entry?.tier.bonuses?.passiveIncome) {
      total += entry.tier.bonuses.passiveIncome;
    }
  }
  return total;
}

/**
 * Calculate total meter effects from activated synergies.
 * Returns { treasury, people, military, faith } deltas.
 */
export function getSynergyMeterEffects(activated) {
  const effects = { treasury: 0, people: 0, military: 0, faith: 0 };
  for (const id of activated) {
    const entry = SYNERGY_TIER_MAP[id];
    if (entry?.tier.bonuses?.meterEffects) {
      for (const [meter, delta] of Object.entries(entry.tier.bonuses.meterEffects)) {
        effects[meter] += delta;
      }
    }
  }
  return effects;
}

/**
 * Calculate total trade price bonus (added to sell price per unit).
 */
export function getSynergyTradePriceBonus(activated) {
  let total = 0;
  for (const id of activated) {
    const entry = SYNERGY_TIER_MAP[id];
    if (entry?.tier.bonuses?.tradePriceBonus) {
      total += entry.tier.bonuses.tradePriceBonus;
    }
  }
  return total;
}

/**
 * Calculate total wool sell bonus (extra denarii per wool/cloth sold).
 */
export function getSynergyWoolSellBonus(activated) {
  let total = 0;
  for (const id of activated) {
    const entry = SYNERGY_TIER_MAP[id];
    if (entry?.tier.bonuses?.woolSellBonus) {
      total += entry.tier.bonuses.woolSellBonus;
    }
  }
  return total;
}

/**
 * Check if any activated synergy grants population growth bonus.
 */
export function hasSynergyPopulationBonus(activated) {
  for (const id of activated) {
    const entry = SYNERGY_TIER_MAP[id];
    if (entry?.tier.bonuses?.populationGrowthBonus) return true;
  }
  return false;
}

/**
 * Get the highest-tier victory title override from activated synergies.
 * Only Tier 3 synergies have victory titles.
 * Returns the victory title object or null.
 */
export function getSynergyVictoryTitle(activated) {
  let best = null;
  for (const id of activated) {
    const entry = SYNERGY_TIER_MAP[id];
    if (entry?.tier.tier === 3 && entry.tier.victoryTitle) {
      best = entry.tier.victoryTitle;
    }
  }
  return best;
}

/**
 * Get display data for the victory screen showing all active synergies.
 * Returns array of { pathName, pathIcon, pathColor, tierLevel, tierTitle }.
 */
export function getActiveSynergyDisplay(activated) {
  const display = [];
  const pathMaxTier = {};

  for (const id of activated) {
    const entry = SYNERGY_TIER_MAP[id];
    if (!entry) continue;
    const pathId = entry.path.id;
    if (!pathMaxTier[pathId] || entry.tier.tier > pathMaxTier[pathId].tier) {
      pathMaxTier[pathId] = entry.tier;
    }
  }

  for (const [pathId, tier] of Object.entries(pathMaxTier)) {
    const path = SYNERGY_PATH_LIST.find((p) => p.id === pathId);
    if (!path) continue;
    display.push({
      pathName: path.name,
      pathIcon: path.icon,
      pathColor: path.color,
      tierLevel: tier.tier,
      tierTitle: tier.title,
    });
  }

  return display;
}

/**
 * Get set of building IDs that are contributing to active synergies.
 * Used for gold star display in EstateTab.
 */
export function getSynergyBuildings(activated, playerBuildings) {
  const ids = new Set();

  for (const id of activated) {
    const entry = SYNERGY_TIER_MAP[id];
    if (!entry) continue;
    const c = entry.tier.conditions;
    if (!c) continue;

    // Buildings explicitly named in conditions
    if (c.buildings) {
      for (const buildingId of Object.keys(c.buildings)) {
        if (playerBuildings.some((b) => getBuildingType(b) === buildingId)) {
          ids.add(buildingId);
        }
      }
    }

    // Food buildings
    if (c.foodBuildingCount) {
      for (const b of playerBuildings) {
        if (FOOD_BUILDING_IDS.includes(getBuildingType(b))) ids.add(getBuildingType(b));
      }
    }

    // Converter buildings
    if (c.hasConverterBuilding) {
      for (const b of playerBuildings) {
        const t = getBuildingType(b);
        if (t === "fulling_mill" || t === "brewery") ids.add(t);
      }
    }
  }

  return ids;
}
