/**
 * military.js — Military data definitions for the expanded Military tab
 *
 * Soldier types, fortification upgrade tracks (walls/gate/moat), morale
 * levels, defense calculation helpers, historical tooltips, and scribe's
 * notes. Pure data and functions only — no side effects, no I/O, no DOM.
 *
 * Defense balance targets:
 *   Starting (5 levy, palisade, morale 50):   ~15  (meets criminal threshold)
 *   By turn 4 (~75-155d invested):             >=18 (criminal threshold)
 *   By turn 8 (~230d+ invested):               >=38 (Scottish threshold)
 */

// ─── Soldier Types ────────────────────────────────────────────────

export const SOLDIER_TYPES = {
  levy: {
    id: "levy",
    name: "Levy Peasants",
    subtitle: "Fyrd",
    icon: "\u2692",  // hammers
    recruitCost: 5,
    upkeep: 1,
    defenseValue: 1,
    max: null,  // limited by population (25% cap before food penalty)
    borderColor: "#6a5a42",
    description: "Farmers with sharpened tools. Cheap but fragile.",
    recruitButtons: [1, 5],
    dismissButtons: [1, 5],
  },
  menAtArms: {
    id: "menAtArms",
    name: "Men-at-Arms",
    subtitle: "Professional Soldiers",
    icon: "\u2694",  // crossed swords
    recruitCost: 15,
    upkeep: 4,
    defenseValue: 3,
    max: 10,
    borderColor: "#8b1a1a",
    description: "Trained fighters. The backbone of any real defense.",
    recruitButtons: [1, 3],
    dismissButtons: [1, 3],
  },
  knights: {
    id: "knights",
    name: "Knights",
    subtitle: "Mounted Elite",
    icon: "\u265B",  // queen chess piece
    recruitCost: 50,
    upkeep: 8,
    defenseValue: 8,
    max: 3,
    borderColor: "#c4a24a",
    description: "One knight equals eight peasants in combat. But the cost is staggering.",
    recruitButtons: [1],
    dismissButtons: [1],
    minPopulation: 10,
  },
};

// ─── Fortification Tracks ─────────────────────────────────────────

export const WALLS_TRACK = [
  { level: 0, name: "No Walls", cost: 0, defense: 0, description: "Your estate is open ground. Anyone can walk in." },
  { level: 1, name: "Wooden Palisade", cost: 30, defense: 5, description: "Sharpened logs driven into the earth. Burns easily but stops casual raiders. Built in days." },
  { level: 2, name: "Stone Curtain Wall", cost: 120, defense: 15, description: "Quarried stone, mortared and stacked. Resists fire, requires siege engines to breach. Takes months to build." },
  { level: 3, name: "Curtain Wall with Towers", cost: 250, defense: 25, description: "Flanking towers allow defenders to fire along the wall face. Attackers have no blind spots. The classic medieval defense." },
  { level: 4, name: "Concentric Walls", cost: 500, defense: 40, description: "Walls within walls. If attackers breach the outer ring, they're trapped in a killing ground. Edward I's masterpiece design.", requires: { walls: 3 } },
];

export const GATE_TRACK = [
  { level: 0, name: "Open Entrance", cost: 0, defense: 0, description: "No gate. You may as well hang a sign: 'Come right in.'" },
  { level: 1, name: "Wooden Gate", cost: 20, defense: 3, description: "Thick oak planks reinforced with iron bands. Stops a battering ram \u2014 for a while." },
  { level: 2, name: "Iron-Bound Gate with Bar", cost: 60, defense: 7, description: "Iron plating over oak, with a heavy timber bar. Requires serious effort to break." },
  { level: 3, name: "Gatehouse with Portcullis", cost: 150, defense: 12, description: "A fortified gatehouse with an iron portcullis \u2014 a sliding grid of iron bars.", requires: { walls: 2 } },
  { level: 4, name: "Barbican with Murder Holes", cost: 300, defense: 18, description: "An extended gatehouse corridor. Attackers who enter are funneled through a narrow passage with 'murder holes' above.", requires: { gate: 3 } },
];

export const MOAT_TRACK = [
  { level: 0, name: "None", cost: 0, defense: 0, description: "Dry ground all around. Attackers walk right up to the walls." },
  { level: 1, name: "Dry Ditch", cost: 40, defense: 4, description: "A deep trench around the walls. Slows attackers, prevents siege towers from reaching the wall." },
  { level: 2, name: "Water-Filled Moat", cost: 100, defense: 10, description: "The ditch flooded with diverted stream water. Attackers can't cross in armor without drowning.", requires: { walls: 2 } },
  { level: 3, name: "Moat with Drawbridge", cost: 200, defense: 15, description: "A proper drawbridge \u2014 the only way across. When raised, the castle is an island." },
];

// ─── Morale System ────────────────────────────────────────────────

export const MORALE_LEVELS = [
  { min: 0, max: 20, label: "Mutinous", modifier: -0.30, desertionChance: 0.10, color: "#c62828" },
  { min: 21, max: 40, label: "Disgruntled", modifier: -0.15, desertionChance: 0, color: "#d48a2a" },
  { min: 41, max: 60, label: "Adequate", modifier: 0, desertionChance: 0, color: "#a8a8b0" },
  { min: 61, max: 80, label: "Good", modifier: 0.10, desertionChance: 0, color: "#4a8a3a" },
  { min: 81, max: 100, label: "Fierce", modifier: 0.25, desertionChance: 0, color: "#c4a24a" },
];

// ─── Constants ────────────────────────────────────────────────────

export const BASE_CASTLE_DEFENSE = 5;  // Motte mound provides base defense
export const CRIMINAL_DEFENSE_THRESHOLD = 18;
export const SCOTTISH_DEFENSE_THRESHOLD = 38;
export const LEVY_FOOD_PENALTY_THRESHOLD = 0.25;  // 25% of population
export const LEVY_FOOD_PENALTY_PER_EXCESS = 0.10;  // 10% per excess levy

// ─── Knight Names (for desertion narratives) ──────────────────────

export const KNIGHT_NAMES = [
  "Sir Godfrey", "Sir Aldwyn", "Sir Edmund", "Sir Percival", "Sir Randolph",
  "Sir Tristram", "Sir Cedric", "Sir Baldwin", "Sir Reginald", "Sir Geoffrey",
];

// ─── Helper Functions ─────────────────────────────────────────────

/** Look up the morale bracket for a given morale value (0-100). */
export function getMoraleLevel(morale) {
  return MORALE_LEVELS.find(l => morale >= l.min && morale <= l.max) || MORALE_LEVELS[2];
}

/** Total headcount across all soldier types. */
export function getTotalGarrison(garrison) {
  return (garrison.levy || 0) + (garrison.menAtArms || 0) + (garrison.knights || 0);
}

/** Total denarii upkeep per season for the entire garrison. */
export function getMilitaryUpkeep(garrison) {
  return (garrison.levy || 0) * SOLDIER_TYPES.levy.upkeep +
    (garrison.menAtArms || 0) * SOLDIER_TYPES.menAtArms.upkeep +
    (garrison.knights || 0) * SOLDIER_TYPES.knights.upkeep;
}

/**
 * Calculate the overall defense rating from garrison, fortifications,
 * morale, and optional watchtower bonus.
 */
export function calculateDefenseRating(military, watchtowerBonus = 0) {
  const { garrison, walls, gate, moat, morale } = military;

  const garrisonDefense =
    (garrison.levy || 0) * SOLDIER_TYPES.levy.defenseValue +
    (garrison.menAtArms || 0) * SOLDIER_TYPES.menAtArms.defenseValue +
    (garrison.knights || 0) * SOLDIER_TYPES.knights.defenseValue;

  const wallsDef = WALLS_TRACK[walls]?.defense || 0;
  const gateDef = GATE_TRACK[gate]?.defense || 0;
  const moatDef = MOAT_TRACK[moat]?.defense || 0;
  const fortDefense = BASE_CASTLE_DEFENSE + wallsDef + gateDef + moatDef;

  const moraleLevel = getMoraleLevel(morale);
  const moraleMod = 1 + moraleLevel.modifier;

  return Math.round((garrisonDefense + fortDefense) * moraleMod + watchtowerBonus);
}

/**
 * Produce a structured breakdown of all defense contributions for
 * display in the UI (garrison lines, fortification lines, modifiers).
 */
export function getDefenseBreakdown(military, watchtowerBonus = 0) {
  const { garrison, walls, gate, moat, morale } = military;

  const garrisonItems = [];
  if (garrison.levy > 0) garrisonItems.push({ label: "Levy Peasants", count: garrison.levy, value: SOLDIER_TYPES.levy.defenseValue, total: garrison.levy * SOLDIER_TYPES.levy.defenseValue });
  if (garrison.menAtArms > 0) garrisonItems.push({ label: "Men-at-Arms", count: garrison.menAtArms, value: SOLDIER_TYPES.menAtArms.defenseValue, total: garrison.menAtArms * SOLDIER_TYPES.menAtArms.defenseValue });
  if (garrison.knights > 0) garrisonItems.push({ label: "Knights", count: garrison.knights, value: SOLDIER_TYPES.knights.defenseValue, total: garrison.knights * SOLDIER_TYPES.knights.defenseValue });

  const garrisonTotal = garrisonItems.reduce((s, i) => s + i.total, 0);

  const fortItems = [
    { label: "Castle (Motte-and-Bailey)", value: BASE_CASTLE_DEFENSE },
    { label: `Walls (${WALLS_TRACK[walls]?.name || "None"})`, value: WALLS_TRACK[walls]?.defense || 0 },
    { label: `Gate (${GATE_TRACK[gate]?.name || "None"})`, value: GATE_TRACK[gate]?.defense || 0 },
    { label: `Moat (${MOAT_TRACK[moat]?.name || "None"})`, value: MOAT_TRACK[moat]?.defense || 0 },
  ];

  const fortTotal = fortItems.reduce((s, i) => s + i.value, 0);

  const moraleLevel = getMoraleLevel(morale);
  const moraleMod = 1 + moraleLevel.modifier;
  const modifierItems = [
    { label: `Morale (${moraleLevel.label})`, value: moraleLevel.modifier !== 0 ? `${moraleLevel.modifier > 0 ? "+" : ""}${Math.round(moraleLevel.modifier * 100)}%` : "+0%", numericMod: moraleLevel.modifier },
  ];
  if (watchtowerBonus > 0) {
    modifierItems.push({ label: "Watchtower Warning", value: `+${watchtowerBonus}`, numericAdd: watchtowerBonus });
  }

  const total = Math.round((garrisonTotal + fortTotal) * moraleMod + watchtowerBonus);

  return { garrisonItems, garrisonTotal, fortItems, fortTotal, modifierItems, moraleMod, watchtowerBonus, total };
}

/**
 * Check whether a fortification track can be upgraded, accounting for
 * prerequisites (e.g. concentric walls require curtain wall with towers).
 * Returns { canUpgrade, reason, next }.
 */
export function canUpgradeFortification(track, currentLevels) {
  const { walls, gate, moat } = currentLevels;
  let trackData, currentLevel;

  if (track === "walls") { trackData = WALLS_TRACK; currentLevel = walls; }
  else if (track === "gate") { trackData = GATE_TRACK; currentLevel = gate; }
  else if (track === "moat") { trackData = MOAT_TRACK; currentLevel = moat; }
  else return { canUpgrade: false, reason: "Unknown track" };

  const nextLevel = currentLevel + 1;
  const next = trackData[nextLevel];
  if (!next) return { canUpgrade: false, reason: "Maximum level reached" };

  // Check prerequisites
  if (next.requires) {
    for (const [req, reqLevel] of Object.entries(next.requires)) {
      const current = currentLevels[req] || 0;
      if (current < reqLevel) {
        const reqTrack = req === "walls" ? WALLS_TRACK : req === "gate" ? GATE_TRACK : MOAT_TRACK;
        return { canUpgrade: false, reason: `Requires: ${reqTrack[reqLevel]?.name || req}` };
      }
    }
  }

  return { canUpgrade: true, reason: null, next };
}

/**
 * Remove soldiers from the garrison, prioritizing levy first,
 * then men-at-arms, then knights.
 */
export function removeFromGarrison(garrison, count) {
  let remaining = count;
  const newGarrison = { ...garrison };

  // Remove levy first
  const levyRemove = Math.min(newGarrison.levy || 0, remaining);
  newGarrison.levy = (newGarrison.levy || 0) - levyRemove;
  remaining -= levyRemove;

  // Then men-at-arms
  if (remaining > 0) {
    const maaRemove = Math.min(newGarrison.menAtArms || 0, remaining);
    newGarrison.menAtArms = (newGarrison.menAtArms || 0) - maaRemove;
    remaining -= maaRemove;
  }

  // Then knights
  if (remaining > 0) {
    const knightRemove = Math.min(newGarrison.knights || 0, remaining);
    newGarrison.knights = (newGarrison.knights || 0) - knightRemove;
  }

  // BUG-21 FIX: Ensure no typed garrison count goes negative
  newGarrison.levy = Math.max(0, newGarrison.levy || 0);
  newGarrison.menAtArms = Math.max(0, newGarrison.menAtArms || 0);
  newGarrison.knights = Math.max(0, newGarrison.knights || 0);

  return newGarrison;
}

// ─── Historical Tooltips ──────────────────────────────────────────

export const MILITARY_TOOLTIPS = {
  garrison: "The soldiers stationed at your castle to defend it. More soldiers = stronger defense, but higher upkeep costs.",
  defenseRating: "A number representing your total military strength. Combines garrison soldiers, castle fortifications, morale, and special bonuses. Higher is better.",
  upkeep: "The ongoing cost to maintain your military each season. Soldiers need food, wages, and equipment. If you can't pay upkeep, morale drops.",
  levy: "Ordinary villagers called to serve in defense. The word 'fyrd' is Anglo-Saxon for 'army of the people.' Cheap but not well-trained.",
  menAtArms: "Professional soldiers who fight for a living. Better equipped and trained than levy peasants, but more expensive.",
  knight: "A heavily armored mounted warrior. The elite of medieval warfare. A single knight could defeat many ordinary soldiers \u2014 but the cost of armor, horse, and squire was enormous.",
  palisade: "A fence of sharpened wooden stakes driven into the ground. The simplest castle defense. Quick to build but vulnerable to fire.",
  curtainWall: "The main outer wall of a castle, usually built of stone. 'Curtain' because it hangs between towers like a curtain between posts.",
  portcullis: "A heavy iron or wooden grid that slides vertically in grooves to block a gateway. From the French 'porte coulissante' \u2014 sliding door.",
  murderHoles: "Openings in the ceiling of a gatehouse passage through which defenders dropped stones, boiling water, or hot sand on attackers below.",
  concentric: "Having two or more rings of walls, one inside the other. If attackers breach the outer wall, they're trapped between the two walls.",
  moat: "A deep trench, often filled with water, surrounding a castle. Prevents direct assault on walls and makes tunneling extremely difficult.",
  barbican: "A fortified extension of a gatehouse, projecting outward from the castle. Forces attackers through a narrow, heavily defended corridor.",
  motteAndBailey: "The earliest Norman castle design: a raised mound of earth (motte) topped by a wooden tower, surrounded by an enclosed yard (bailey).",
  morale: "The spirit and willingness of soldiers to fight. High morale means they'll hold under pressure. Low morale means they'll run \u2014 or worse.",
  recruitCost: "The one-time price to hire a new soldier. Covers equipment, initial training, and a signing bonus.",
};

// ─── Scribe's Notes (educational flavor text) ─────────────────────

export const MILITARY_SCRIBES_NOTES = {
  feudalObligation: "In the feudal system, every lord owed military service to his overlord \u2014 and every peasant owed service to his lord. The 'fyrd' (Anglo-Saxon) or 'levy' (Norman) system required free men to serve in defense of their community for a set number of days per year, usually 40. They brought their own weapons \u2014 often just a farming tool or a sharpened stick. Professional soldiers (men-at-arms) were far more effective but had to be paid, housed, and equipped year-round. Knights \u2014 the medieval equivalent of tanks \u2014 were devastatingly powerful but ruinously expensive. A lord's challenge was always the same: how much defense can I afford without bankrupting my estate? This tension between security and solvency defined medieval governance.",
  castleEvolution: "Castle design evolved over centuries in direct response to new attack methods. The first castles were simple mounds of earth (mottes) with wooden fences (baileys) \u2014 built fast but vulnerable to fire. Stone replaced wood, creating the iconic medieval fortress. When attackers learned to tunnel under walls, moats were dug. When battering rams broke gates, portcullises were added. When siege towers scaled walls, flanking towers provided crossfire. Edward I's concentric castles at Caernarfon, Conwy, and Harlech represent the pinnacle of medieval military engineering \u2014 and cost as much as a modern aircraft carrier relative to the national budget. Defense was the most expensive thing a medieval lord could buy.",
  militaryMorale: "Medieval armies were held together by loyalty, pay, and fear \u2014 in roughly that order. Soldiers who weren't paid deserted. Soldiers who lost faith in their commander surrendered. The most effective military leaders \u2014 Richard the Lionheart, William Marshal, Henry V \u2014 understood that morale was as important as steel. Henry V's speech at Agincourt (immortalized by Shakespeare) turned an exhausted, outnumbered army into a fighting force that destroyed the French cavalry. Words, food, and coin: the three weapons of morale.",
};

// ─── Initial State Factory ────────────────────────────────────────

/**
 * Produce the initial military sub-state for a new game.
 * Starting garrison defaults to 5 levy (fyrd peasants).
 */
export function getInitialMilitaryState(startingGarrison = 5) {
  return {
    garrison: { levy: startingGarrison, menAtArms: 0, knights: 0 },
    walls: 1,    // Start with palisade (Motte-and-Bailey includes basic walls)
    gate: 0,     // No gate initially
    moat: 0,     // No moat initially
    morale: 50,  // Adequate
    lastRaidOutcome: null,  // "victory" or "defeat" - for morale tracking
    idleSeasons: 0,         // Seasons without a raid (for morale decay)
    totalRecruitmentSpending: 0,
    totalUpkeepSpending: 0,
    totalFortificationSpending: 0,
    soldiersLostToRaids: 0,
    soldiersLostToDesertion: 0,
    scribesNoteSeen: {
      feudalObligation: false,
      castleEvolution: false,
      militaryMorale: false,
    },
  };
}
