/**
 * flipEngine.js
 *
 * Pure functions for perspective-flip logic.
 * No side effects, no I/O. Math.random() used for chance-based options.
 */

import { PERSPECTIVE_FLIPS } from "../data/perspectiveFlips.js";
import { CYOA_FLIPS } from "../data/cyoaFlips.js";
import { getBuildingType } from "./economyEngine.js";

export const ALL_FLIPS = { ...PERSPECTIVE_FLIPS, ...CYOA_FLIPS };

/** Priority order for trigger evaluation */
const FLIP_PRIORITY = [
  "serf_week", "merchant_day", "noble_dilemma", "knight_gamble",
  "cyoa_lord", "cyoa_merchant", "cyoa_monk", "cyoa_knight", "cyoa_serf",
];

/**
 * Checks whether any perspective flip should trigger this turn.
 * Each flip fires once per playthrough (guarded by state.perspectiveFlips[id]).
 *
 * @param {object} state - Game state (must include turn, perspectiveFlips, taxRate,
 *   meters, buildings, tradeCount, castleLevel, militaryEventEverFired, garrison)
 * @returns {string|null} flipId or null
 */
export function checkFlipTriggers(state) {
  const {
    turn,
    perspectiveFlips = {},
    taxRate,
    population = 20,
    buildings = [],
    tradeCount = 0,
    castleLevel = 1,
    militaryEventEverFired = false,
    garrison = 0,
    lastFlipTurn = 0,
    denarii = 0,
    chapel,
  } = state;

  // BUG-24 FIX: Enforce minimum 3-turn cooldown between flips
  if (turn - lastFlipTurn < 3) return null;

  for (const flipId of FLIP_PRIORITY) {
    // Already fired this playthrough
    if (perspectiveFlips[flipId]) continue;

    const flip = ALL_FLIPS[flipId];
    if (!flip) continue;

    // Must meet minimum turn
    if (turn < flip.triggerConditions.minTurn) continue;

    // Check flip-specific conditions (resource-based)
    switch (flipId) {
      case "serf_week":
        if (taxRate === "high" || taxRate === "crushing" || population < 12) {
          return flipId;
        }
        break;

      case "merchant_day":
        if (
          buildings.some((b) => getBuildingType(b) === "brewery") ||
          buildings.some((b) => getBuildingType(b) === "fulling_mill") ||
          tradeCount >= 5
        ) {
          return flipId;
        }
        break;

      case "noble_dilemma":
        if (castleLevel > 1 || militaryEventEverFired) {
          return flipId;
        }
        break;

      case "knight_gamble":
        if (garrison > 15) {
          return flipId;
        }
        break;

      case "cyoa_lord":
        // BUG-24 FIX: Require at least 3 buildings or 300+ denarii
        if (buildings.length >= 3 || denarii >= 300) {
          return flipId;
        }
        break;

      case "cyoa_merchant":
        if (tradeCount >= 3 || buildings.some((b) => getBuildingType(b) === "brewery") || buildings.some((b) => getBuildingType(b) === "fulling_mill")) {
          return flipId;
        }
        break;

      case "cyoa_monk":
        // BUG-24 FIX: Require chapel interaction (faith > 0 or piety > 0)
        if ((chapel?.faith ?? 0) > 0 || (chapel?.piety ?? 0) > 0) {
          return flipId;
        }
        break;

      case "cyoa_knight":
        if (garrison > 5 || militaryEventEverFired) {
          return flipId;
        }
        break;

      case "cyoa_serf":
        if (taxRate === "high" || taxRate === "crushing" || population < 15) {
          return flipId;
        }
        break;
    }
  }

  return null;
}

/**
 * Returns the initial character stats for a flip.
 *
 * @param {string} flipId
 * @returns {{ [statName]: number }}
 */
export function getInitialFlipStats(flipId) {
  const flip = ALL_FLIPS[flipId];
  if (!flip) return {};

  // CYOA flips have no character stats
  if (flip.type === "cyoa" || !flip.characterStats) return {};

  const stats = {};
  for (const [key, config] of Object.entries(flip.characterStats)) {
    stats[key] = config.initial;
  }
  return stats;
}

/**
 * Resolves a player's choice on a flip decision option.
 * Deterministic options apply statEffects directly.
 * Chance-based options roll Math.random().
 *
 * @param {object} option - The chosen option from the decision
 * @param {{ [statName]: number }} currentStats
 * @returns {{ nextStats: object, consequenceFlags: string[], outcome: string, wasSuccess: boolean|null }}
 */
export function resolveFlipOption(option, currentStats) {
  const clampStat = (val) => Math.min(100, Math.max(0, val));

  // Chance-based option
  if (option.chance !== undefined) {
    const roll = Math.random();
    const success = roll < option.chance;

    const effects = success ? option.successStatEffects : option.failureStatEffects;
    const outcome = success ? option.successOutcome : option.failureOutcome;

    const nextStats = { ...currentStats };
    for (const [stat, delta] of Object.entries(effects || {})) {
      if (nextStats[stat] !== undefined) {
        nextStats[stat] = clampStat(nextStats[stat] + delta);
      }
    }

    let flags = [];
    if (option.consequenceFlags) {
      if (typeof option.consequenceFlags === "object" && !Array.isArray(option.consequenceFlags)) {
        flags = success ? (option.consequenceFlags.success || []) : (option.consequenceFlags.failure || []);
      } else if (Array.isArray(option.consequenceFlags)) {
        flags = option.consequenceFlags;
      }
    }

    return { nextStats, consequenceFlags: flags, outcome, wasSuccess: success };
  }

  // Deterministic option
  const nextStats = { ...currentStats };
  for (const [stat, delta] of Object.entries(option.statEffects || {})) {
    if (nextStats[stat] !== undefined) {
      nextStats[stat] = clampStat(nextStats[stat] + delta);
    }
  }

  const flags = Array.isArray(option.consequenceFlags) ? option.consequenceFlags : [];

  return {
    nextStats,
    consequenceFlags: flags,
    outcome: option.outcome,
    wasSuccess: null,
  };
}

/**
 * Returns true if the given flip ID is a CYOA-style flip.
 *
 * @param {string} flipId
 * @returns {boolean}
 */
export function isCyoaFlip(flipId) {
  const flip = ALL_FLIPS[flipId];
  return flip?.type === "cyoa";
}

/**
 * Computes resource consequences for a CYOA flip based on the ending type reached.
 *
 * @param {string} flipId
 * @param {string} endingType - "good" | "medium" | "bad"
 * @returns {{ treasury?: number, people?: number }}
 */
export function computeCyoaConsequences(flipId, endingType) {
  const flip = ALL_FLIPS[flipId];
  if (!flip || flip.type !== "cyoa") return {};
  return flip.consequences?.[endingType] || {};
}

/**
 * Computes the lord-meter consequences from accumulated flip flags.
 * Sums base consequences + all flag-triggered consequences.
 *
 * @param {string} flipId
 * @param {string[]} flags - Accumulated consequence flags from all decisions
 * @returns {{ treasury?: number, people?: number, military?: number, faith?: number }}
 */
export function computeFlipConsequences(flipId, flags = []) {
  const flip = PERSPECTIVE_FLIPS[flipId];
  if (!flip || !flip.consequences) return {};

  const result = {};

  // Apply base consequences
  for (const [meter, delta] of Object.entries(flip.consequences.base || {})) {
    result[meter] = (result[meter] || 0) + delta;
  }

  // Apply flag-triggered consequences (deduplicate flags)
  const uniqueFlags = [...new Set(flags)];
  for (const flag of uniqueFlags) {
    const flagEffects = flip.consequences.flags?.[flag];
    if (flagEffects) {
      for (const [meter, delta] of Object.entries(flagEffects)) {
        result[meter] = (result[meter] || 0) + delta;
      }
    }
  }

  return result;
}
