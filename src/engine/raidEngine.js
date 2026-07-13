/**
 * raidEngine.js
 *
 * Pure functions for the raid system. No side effects, no I/O.
 * Math.random() is the only exception (intentional RNG).
 */

import { RAID_TYPES, TRADE_GOODS_FOR_RAIDS } from "../data/raids.js";

/**
 * Pick a random integer between min and max (inclusive).
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array.
 */
function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Initial raid state for a new game.
 */
export function getInitialRaidState() {
  return {
    lastRaidTurn: 0,
    lastRaidType: null,
    criminalCooldown: 0,
    scottishCooldown: 0,
    totalCriminalRaids: 0,
    totalScottishRaids: 0,
    criminalVictories: 0,
    scottishVictories: 0,
    criminalDefeats: 0,
    scottishDefeats: 0,
    totalDenariiLost: 0,
    totalFoodLost: 0,
    totalDenariiRecovered: 0,
    criminalScribesNoteSeen: false,
    scottishScribesNoteSeen: false,
    activeRaid: null,
  };
}

/**
 * Check if a raid triggers this season.
 * Returns null (no raid) or { type: "criminal"|"scottish" }.
 *
 * @param {object} raids - Current raid state
 * @param {number} turn - Current turn number
 * @returns {{ type: string } | null}
 */
export function checkForRaid(raids, turn) {
  if (!raids) return null;

  const criminalDef = RAID_TYPES.criminal;
  const scottishDef = RAID_TYPES.scottish;

  // Decrement cooldowns (already done before this call in reducer)
  const crimCd = raids.criminalCooldown || 0;
  const scotCd = raids.scottishCooldown || 0;

  // Forced Scottish raid if none has fired by turn 16 (respects cooldown from any recent raid)
  const lastRaid = raids.lastRaidTurn || 0;
  if (turn >= scottishDef.forceTurn && (raids.totalScottishRaids || 0) === 0 && scotCd <= 0 && (turn - lastRaid) >= 2) {
    return { type: "scottish" };
  }

  // Criminal check: triggers every triggerInterval turns at baseChance
  let criminalTriggered = false;
  if (turn >= criminalDef.firstPossibleTurn && crimCd <= 0) {
    if ((turn - criminalDef.firstPossibleTurn) % criminalDef.triggerInterval === 0) {
      criminalTriggered = Math.random() < criminalDef.baseChance;
    }
  }

  // Scottish check: triggers every triggerInterval turns at baseChance
  let scottishTriggered = false;
  if (turn >= scottishDef.firstPossibleTurn && scotCd <= 0) {
    if ((turn - scottishDef.firstPossibleTurn) % scottishDef.triggerInterval === 0) {
      scottishTriggered = Math.random() < scottishDef.baseChance;
    }
  }

  // Cannot stack — criminal check first, Scottish only if no criminal
  if (criminalTriggered && scottishTriggered) {
    // Only one fires — prefer Scottish since it's rarer
    return { type: "scottish" };
  }
  if (criminalTriggered) return { type: "criminal" };
  if (scottishTriggered) return { type: "scottish" };

  return null;
}

/**
 * Resolve a raid and compute gains/losses.
 * Uses defense rating system: total defense vs. threshold.
 *
 * @param {string} raidType - "criminal" or "scottish"
 * @param {number} defenseRating - Player's total defense rating
 * @param {number} defenseThreshold - Required defense to repel the raid
 * @param {number} garrison - Player's total garrison count (for narrative)
 * @param {number} castleLevel - Player's castle level
 * @param {object} inventory - Player's inventory
 * @returns {{ victory: boolean, partial: boolean, defenseRatio: number,
 *             denariiDelta: number, foodDelta: number, populationDelta: number,
 *             garrisonDelta: number, tradeGoodLost: { resource: string, amount: number } | null,
 *             narrativeLine: string, raidName: string }}
 */
export function resolveRaid(raidType, defenseRating, defenseThreshold, garrison, castleLevel, inventory, difficulty) {
  const difficultyScale = difficulty === "easy" ? 0.5 : difficulty === "hard" ? 1.5 : 1.0;
  const def = RAID_TYPES[raidType];
  if (!def) return null;

  const raidName = pickRandom(def.names);

  // VICTORY — defense rating meets or exceeds threshold
  if (defenseRating >= defenseThreshold) {
    const gains = def.gains;
    return {
      victory: true,
      partial: false,
      defenseRatio: 1,
      denariiDelta: gains.denarii,
      foodDelta: gains.food || 0,
      populationDelta: gains.populationGain || 0,
      garrisonDelta: gains.garrisonGain || 0,
      tradeGoodLost: null,
      narrativeLine: pickRandom(def.victoryLines),
      raidName,
    };
  }

  // DEFEAT — calculate losses based on how close defense was
  const defenseRatio = (defenseRating > 0 && defenseThreshold > 0)
    ? Math.min(1, defenseRating / defenseThreshold)
    : 0;
  const lossMultiplier = Math.max(0, 1 - defenseRatio);

  const losses = def.losses;

  // Denarii loss
  let baseDenLoss;
  if (garrison === 0) {
    baseDenLoss = losses.denariiMax;
  } else {
    baseDenLoss = randInt(losses.denariiMin, losses.denariiMax);
  }
  const denariiLoss = Math.round(baseDenLoss * lossMultiplier * difficultyScale);

  // Food loss
  let baseFoodLoss;
  if (garrison === 0) {
    baseFoodLoss = losses.foodMax;
  } else {
    baseFoodLoss = randInt(losses.foodMin, losses.foodMax);
  }
  const foodLoss = Math.round(baseFoodLoss * lossMultiplier * difficultyScale);

  // Population loss — capped at 25% of current population in reducer to prevent wipeouts
  let popLoss = Math.round((losses.populationLoss || 0) * lossMultiplier * difficultyScale);
  if (garrison === 0) {
    popLoss += Math.round(3 * difficultyScale); // Penalty for zero garrison
  }

  // Garrison loss (Scottish only)
  let garrisonLoss = 0;
  if (losses.garrisonLossMin !== undefined) {
    garrisonLoss = Math.min(
      garrison,
      Math.round(randInt(losses.garrisonLossMin, losses.garrisonLossMax) * lossMultiplier)
    );
  }

  // No-castle extra damage (Scottish)
  let extraDenLoss = 0;
  if (castleLevel === 0 && losses.noCastleExtraDenarii) {
    extraDenLoss = losses.noCastleExtraDenarii;
  }

  // Trade good loss
  let tradeGoodLost = null;
  const availableGoods = TRADE_GOODS_FOR_RAIDS.filter((g) => (inventory[g] || 0) > 0);
  if (availableGoods.length > 0) {
    const targetGood = pickRandom(availableGoods);
    const qty = inventory[targetGood] || 0;
    if (losses.tradeGoodCount === "all_of_one") {
      tradeGoodLost = { resource: targetGood, amount: qty };
    } else {
      tradeGoodLost = { resource: targetGood, amount: Math.min(losses.tradeGoodCount, qty) };
    }
  }

  // Narrative line
  let narrativeLine;
  if (garrison === 0) {
    narrativeLine = def.zeroGarrisonLine;
  } else {
    narrativeLine = pickRandom(def.defeatLines);
  }

  // Partial defense message
  const partial = defenseRating > 0 && defenseRating < defenseThreshold;

  return {
    victory: false,
    partial,
    defenseRatio,
    denariiDelta: -(denariiLoss + extraDenLoss),
    foodDelta: -foodLoss,
    populationDelta: -popLoss,
    garrisonDelta: -garrisonLoss,
    tradeGoodLost,
    narrativeLine,
    raidName,
  };
}

/**
 * Build chronicle text for a raid outcome.
 */
export function buildRaidChronicleText(raidType, result, season, year, garrison, defenseRating, defenseThreshold, watchtowerBonus) {
  if (result.victory) {
    const wtNote = watchtowerBonus > 0 ? `, watchtower intel +${watchtowerBonus}` : "";
    const parts = [`${result.raidName} attacked the estate. Your defenses held (rating ${defenseRating} vs ${defenseThreshold} required${wtNote}).`];
    if (result.denariiDelta > 0) parts.push(`Recovered ${result.denariiDelta}d in plunder`);
    if (result.foodDelta > 0) parts.push(`${result.foodDelta} food in captured supplies`);
    parts.push("The people celebrate.");
    return parts.join(". ");
  }

  // Defeat
  const parts = [`${result.raidName} raided the estate.`];
  if (garrison > 0) {
    const wtNote = watchtowerBonus > 0 ? `, watchtower intel +${watchtowerBonus}` : "";
    parts.push(`Your defenses were insufficient (rating ${defenseRating} vs ${defenseThreshold} required${wtNote}).`);
  } else {
    parts.push("There was no garrison to defend.");
  }
  const lostParts = [];
  if (result.denariiDelta < 0) lostParts.push(`${Math.abs(result.denariiDelta)}d`);
  if (result.foodDelta < 0) lostParts.push(`${Math.abs(result.foodDelta)} food`);
  if (result.tradeGoodLost) lostParts.push(`${result.tradeGoodLost.amount} ${result.tradeGoodLost.resource}`);
  if (result.garrisonDelta < 0) lostParts.push(`${Math.abs(result.garrisonDelta)} soldiers killed`);
  if (lostParts.length > 0) parts.push(`Lost ${lostParts.join(", ")}.`);
  if (result.populationDelta < 0) parts.push(`${Math.abs(result.populationDelta)} families fled in terror.`);
  return parts.join(" ");
}
