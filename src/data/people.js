/**
 * people.js
 *
 * Data definitions for the People tab: social tiers, labor allocation,
 * notable families, morale system, village feed events, and contextual tips.
 *
 * All functions are pure — no side effects, no I/O.
 */

// ---------------------------------------------------------------------------
// SOCIAL TIERS
// ---------------------------------------------------------------------------

export const TIER_CONFIG = {
  serfs: {
    label: "Serfs",
    color: "#a08060",
    icon: "Wheat",
    canLeave: false,
    description: "Bound to the land. They farm, they endure, they cannot leave.",
  },
  freemen: {
    label: "Freemen",
    color: "#6ab0a0",
    icon: "ShoppingBag",
    canLeave: true,
    description: "Free to stay or go. They run shops, haul goods, and vote with their feet.",
  },
  skilled: {
    label: "Skilled Workers",
    color: "#b89adb",
    icon: "Hammer",
    canLeave: true,
    description: "The miller, the blacksmith, the baker. Rare, valuable, irreplaceable.",
  },
};

/** Starting tier distribution for a given population */
export function getInitialTiers(population) {
  const skilled = Math.max(2, Math.min(4, Math.round(population * 0.14)));
  const freemen = Math.max(3, Math.round(population * 0.32));
  const serfs = Math.max(3, population - skilled - freemen);
  return { serfs, freemen, skilled };
}

/**
 * Reconcile tiers after a population change.
 * Freemen leave first (mobile). Serfs absorb growth.
 * Skilled only change with notable family departures/arrivals.
 */
export function reconcileTiers(newPopulation, currentTiers) {
  const currentTotal = currentTiers.serfs + currentTiers.freemen + currentTiers.skilled;
  const delta = newPopulation - currentTotal;
  if (delta === 0) return { ...currentTiers };

  let { serfs, freemen, skilled } = currentTiers;

  if (delta > 0) {
    // Growth: newcomers arrive as freemen (chose to come)
    const freemanGrowth = Math.ceil(delta * 0.6);
    const serfGrowth = delta - freemanGrowth;
    freemen += freemanGrowth;
    serfs += serfGrowth;
  } else {
    // Decline: freemen leave first, then serfs starve
    const loss = Math.abs(delta);
    const freemanLoss = Math.min(freemen - 1, loss); // Keep at least 1
    freemen -= freemanLoss;
    const remaining = loss - freemanLoss;
    if (remaining > 0) {
      serfs = Math.max(1, serfs - remaining);
    }
  }

  // Clamp
  serfs = Math.max(1, serfs);
  freemen = Math.max(1, freemen);
  skilled = Math.max(0, skilled);

  // Final reconciliation: force sum to match
  const sum = serfs + freemen + skilled;
  if (sum !== newPopulation) {
    serfs += newPopulation - sum;
    serfs = Math.max(1, serfs);
  }

  return { serfs, freemen, skilled };
}

// ---------------------------------------------------------------------------
// LABOR ALLOCATION
// ---------------------------------------------------------------------------

export const LABOR_DEFAULTS = {
  farming: 70,   // % of assignable (serfs + freemen) doing farm work
  garrison: 0,   // % of total families on garrison duty
  church: 5,     // % of total families on church duty
};

/** Farming labor modifier for economy engine. 70% is baseline (1.0). */
export function getFarmingLaborMod(farmingPct) {
  return farmingPct / 70;
}

/** Crafts labor modifier. 30% is baseline (1.0). */
export function getCraftsLaborMod(farmingPct) {
  const craftsPct = 100 - farmingPct;
  return craftsPct / 30;
}

// ---------------------------------------------------------------------------
// MORALE
// ---------------------------------------------------------------------------

export const MORALE_TAX_MODS = { low: 15, medium: 5, high: -10, crushing: -25 };

export const MORALE_LEVELS = [
  { min: 81, label: "Content",    color: "#8dba6e",
    flavor: "The village hums with contentment. Children play in the square. This won\u2019t last." },
  { min: 61, label: "Grumbling",  color: "#a0b86e",
    flavor: "The people are fine. \u2018Fine\u2019 is what they say before they stop being fine." },
  { min: 41, label: "Restless",   color: "#d4a84c",
    flavor: "Murmurs in the alehouse. Meetings after dark. Nothing to worry about. Probably." },
  { min: 21, label: "Angry",      color: "#c97a4c",
    flavor: "The peasants request an audience, my lord. They seem\u2026 organized." },
  { min: 0,  label: "Revolt",     color: "#d4726a",
    flavor: "Pitchforks have disappeared from the barns. This is not a farming initiative." },
];

/**
 * Compute morale from game state. Returns { value, factors, level }.
 * Morale is DERIVED, not stored — recalculated every render.
 */
export function computeMorale(state) {
  const { taxRate = "medium" } = state;
  const people = state.people || {};
  const laborChurch = people.laborChurch ?? LABOR_DEFAULTS.church;
  const laborGarrison = people.laborGarrison ?? LABOR_DEFAULTS.garrison;
  const foodBalance = state.resourceDeltas?.food ?? 0;

  // Family loyalty contribution
  const families = people.notableFamilies || [];
  const avgLoyalty = families.length > 0
    ? families.reduce((s, f) => s + f.loyalty, 0) / families.length
    : 2;
  const loyaltyMod = Math.round((avgLoyalty - 2) * 4); // -8 to +8

  const factors = {
    base: 50,
    tax: MORALE_TAX_MODS[taxRate] ?? 0,
    food: foodBalance > 0 ? 10 : foodBalance > -50 ? -5 : -15,
    garrison: laborGarrison > 30 ? -10 : laborGarrison > 15 ? -5 : 0,
    church: laborChurch > 0 ? 5 : -3,
    loyalty: loyaltyMod,
  };

  const raw = Object.values(factors).reduce((s, v) => s + v, 0);
  const value = Math.max(0, Math.min(100, raw));
  const level = MORALE_LEVELS.find((l) => value >= l.min) || MORALE_LEVELS[MORALE_LEVELS.length - 1];

  return { value, factors, level };
}

// ---------------------------------------------------------------------------
// NOTABLE FAMILIES
// ---------------------------------------------------------------------------

export const INITIAL_FAMILIES = [
  {
    id: "tanner",
    name: "The Tanners",
    tier: "freeman",
    role: "Leather Workers",
    roleIcon: "Scissors",
    loyalty: 3,
    maxLoyalty: 4,
    generations: 3,
    present: true,
    turnsGone: 0,
    narrative: "Reliable and proud. Their leather fetches good prices at market.",
    leaveNarrative: "The Tanner family has packed their cart and left for Lord Ashworth\u2019s lands. You lose trade goods and the village loses its only leather worker.",
    returnNarrative: "A cart has been spotted on the north road. The Tanners are coming home.",
    bonus: { type: "trade", amount: 1.1, desc: "+10% craft income" },
    sensitivity: "tax",  // first to leave on high taxes
  },
  {
    id: "miller",
    name: "The Millers",
    tier: "skilled",
    role: "Miller",
    roleIcon: "Wheat",
    loyalty: 2,
    maxLoyalty: 4,
    generations: 5,
    present: true,
    turnsGone: 0,
    narrative: "Controls the mill. Quietly powerful. Everyone needs flour.",
    leaveNarrative: "The Miller has closed the mill and taken his family east. Grain rots in your stores without someone to grind it. Food production \u221220%.",
    returnNarrative: "The Miller\u2019s son has returned with his own family. The mill reopens.",
    bonus: { type: "food", amount: 1.2, desc: "+20% food production" },
    sensitivity: "respect", // responds to overall morale
  },
  {
    id: "smith",
    name: "The Smiths",
    tier: "skilled",
    role: "Blacksmith",
    roleIcon: "Hammer",
    loyalty: 3,
    maxLoyalty: 4,
    generations: 1,
    present: true,
    turnsGone: 0,
    narrative: "New to the village but already essential. Makes the tools everyone depends on.",
    leaveNarrative: "The Smith family has vanished in the night. No blacksmith means no new tools, no repaired plows, no arrowheads.",
    returnNarrative: "A smith from the eastern counties has heard of your village. She arrives with apprentices.",
    bonus: { type: "military", amount: 1.15, desc: "+15% defense rating" },
    sensitivity: "military", // anxious if no garrison
  },
  {
    id: "reeve",
    name: "The Reeves",
    tier: "serf",
    role: "Lead Farmer",
    roleIcon: "Crown",
    loyalty: 2,
    maxLoyalty: 4,
    generations: 8,
    present: true,  // serfs can't leave
    turnsGone: 0,
    narrative: "Old family. Quiet authority among the serfs. When the Reeve speaks, the fields listen.",
    leaveNarrative: null, // can't leave — but CAN rebel
    returnNarrative: null,
    bonus: { type: "farming", amount: 1.1, desc: "+10% farm output when loyal" },
    sensitivity: "stability", // responds to consistency
  },
];

/**
 * Update family loyalty for a season tick.
 * Returns new families array.
 */
export function updateFamilyLoyalty(families, taxRate, morale, garrisonPct, churchPct, foodBalance) {
  return families.map((f) => {
    if (!f.present && f.tier !== "serf") {
      // Absent family: tick toward return
      return { ...f, turnsGone: f.turnsGone + 1 };
    }

    let delta = 0;

    // Tax effect
    if (taxRate === "low") delta += 1;
    else if (taxRate === "high") delta -= 1;
    else if (taxRate === "crushing") delta -= 2;

    // Food effect
    if (foodBalance > 0) delta += 0.5;
    else if (foodBalance < -50) delta -= 1;

    // Garrison burden
    if (garrisonPct > 25) delta -= 0.5;

    // Church comfort
    if (churchPct > 0) delta += 0.25;

    // Family-specific sensitivities
    if (f.sensitivity === "tax" && taxRate === "crushing") delta -= 1;
    if (f.sensitivity === "military" && garrisonPct === 0) delta -= 0.5;
    if (f.sensitivity === "respect" && morale < 40) delta -= 0.5;

    // Round and clamp
    const newLoyalty = Math.max(0, Math.min(f.maxLoyalty, f.loyalty + Math.round(delta)));
    return { ...f, loyalty: newLoyalty };
  });
}

/**
 * Check if a family should depart.
 * Freemen leave at loyalty 0 with low morale. Skilled at loyalty 0.
 * Serfs never leave but their loyalty affects productivity.
 */
export function checkFamilyDepartures(families, morale) {
  const departures = [];
  for (const f of families) {
    if (!f.present) continue;
    if (f.tier === "serf") continue; // serfs can't leave
    if (f.loyalty <= 0 && morale < 35) {
      departures.push(f.id);
    }
  }
  return departures;
}

/**
 * Check if an absent family should return.
 * Returns after 3+ turns gone AND morale > 60.
 */
export function checkFamilyReturns(families, morale) {
  const returns = [];
  for (const f of families) {
    if (f.present) continue;
    if (f.tier === "serf") continue;
    if (f.turnsGone >= 3 && morale > 60) {
      returns.push(f.id);
    }
  }
  return returns;
}

// ---------------------------------------------------------------------------
// VILLAGE FEED EVENTS
// ---------------------------------------------------------------------------

const LIFE_EVENTS = [
  "The Cooper family welcomed a son this season. The father is already teaching him to make barrels.",
  "Old Thomas the shepherd has died. He was 61 \u2014 ancient by village standards. The whole village attended the burial.",
  "Two families celebrated a marriage this season. The alehouse ran dry.",
  "A traveling friar passed through and baptized six children in the creek. Father Anselm was furious he wasn\u2019t consulted.",
  "The Miller\u2019s cat had kittens. The children are fighting over who gets one. This is the biggest crisis in the village right now.",
  "Lightning struck the old oak by the common. The peasants say it\u2019s an omen. Of what, they can\u2019t agree.",
  "A peddler came through selling \u2018dragon bones.\u2019 Brother Caedmon quietly confirmed they were cow ribs.",
  "Someone carved a rude image of you on the alehouse wall. Nobody knows who. Everyone is suspiciously cheerful.",
  "The Reeve\u2019s wife won the harvest festival pie competition for the seventh year running. Nobody dares challenge her.",
  "A stray dog has adopted the village. The children have named it \u2018Lord Biscuit.\u2019",
  "Two boys got stuck in the church bell tower. Father Anselm is pretending not to hear them.",
  "The village well rope snapped. The Reeve organized a repair crew before you even heard about it.",
  "A traveling musician played outside the alehouse. The serfs danced until well past dark.",
  "The tanner\u2019s apprentice accidentally dyed a sheep blue. It\u2019s now the most famous sheep in the county.",
  "A fox got into the chicken coop. Casualties: three hens, one fox, and the dignity of the farmer who chased it in his nightclothes.",
];

const SEASONAL_LIFE = {
  spring: [
    "The first lambs of the season have arrived. Children race to see them in the fields.",
    "Planting has begun. The air smells of fresh earth and hope.",
    "Wildflowers line the lane to the village. The children weave them into crowns.",
  ],
  summer: [
    "The long days keep the villagers working until dusk. The ale never tastes better than after a summer day\u2019s labor.",
    "The creek is low. Children splash in the shallows while their parents watch from the shade.",
    "The blackberries are ripe along the hedgerows. Every child has purple-stained fingers.",
  ],
  autumn: [
    "The harvest is underway. Every hand is needed in the fields.",
    "The first frost came early. Families are patching roofs and salting meat.",
    "Smoke rises from every chimney as the village prepares for winter.",
  ],
  winter: [
    "Snow covers the village. The world is quiet except for the crunch of boots on ice.",
    "Families huddle around their hearths. Stories are told and retold on the long dark nights.",
    "The creek has frozen solid. Children slide across it on their shoes, shrieking with joy.",
  ],
};

/**
 * Pick 3-4 feed events for the current season/state.
 * Mixes seasonal flavor with state-dependent events.
 */
export function pickFeedEvents(season, morale, foodBalance, population, families) {
  const events = [];

  // 1. Always include a seasonal flavor event
  const seasonPool = SEASONAL_LIFE[season] || SEASONAL_LIFE.spring;
  events.push({
    text: seasonPool[Math.floor(Math.random() * seasonPool.length)],
    type: "life",
  });

  // 2. A general life event
  events.push({
    text: LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)],
    type: "life",
  });

  // 3. State-dependent population event
  if (foodBalance > 0 && morale > 60) {
    events.push({
      text: "A freeman family from the east has settled in the village, drawn by word of fair taxes and full granaries.",
      type: "population",
    });
  } else if (morale < 30) {
    events.push({
      text: "A family was seen loading a cart before dawn. By morning, they were gone. The house stands empty.",
      type: "warning",
    });
  } else if (population > 25) {
    events.push({
      text: "The village is growing. New homes are being built along the east road. Children are everywhere.",
      type: "population",
    });
  }

  // 4. Warning events
  if (morale < 20) {
    events.push({
      text: "The peasants have called a meeting in the common field. Armed men were seen at the edges. My lord \u2014 this is not a harvest gathering.",
      type: "warning",
    });
  }

  if (foodBalance < -50) {
    events.push({
      text: "Hunger stalks the village. Children cry at night. The old and weak are failing. This cannot continue.",
      type: "warning",
    });
  }

  // 5. Family-specific events
  const absentFamilies = (families || []).filter((f) => !f.present);
  for (const f of absentFamilies) {
    if (f.turnsGone === 1) {
      events.push({
        text: `${f.name.replace("The ", "The ")} left last season. Their ${f.role.toLowerCase()} stands empty.`,
        type: "warning",
      });
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// CONTEXTUAL TIPS
// ---------------------------------------------------------------------------

export const PEOPLE_TIPS = {
  default: "Set your tax rate and assign labor here. Your people are your kingdom\u2019s greatest resource \u2014 and its greatest threat.",
  lowMorale: "Your people are unhappy. Lower taxes, assign fewer to garrison duty, or risk unrest.",
  highTax: "High taxes fill your coffers but empty your village. Families who leave don\u2019t come back easily.",
  noGarrison: "You have no families on garrison duty. Your village is undefended.",
  noChurch: "No one is assigned to the chapel. Father Anselm is writing you a very long letter.",
  foodShortage: "You\u2019re producing less food than you consume. Assign more families to farming or face famine.",
  surplus: "Food surplus attracts new families. Keep it up and your village will grow.",
  revolt: "Your people are on the verge of revolt. Act now or lose everything.",
};

/**
 * Pick the most relevant tip for the current state.
 */
export function getContextualTip(morale, taxRate, garrisonPct, churchPct, foodBalance) {
  if (morale < 20) return PEOPLE_TIPS.revolt;
  if (morale < 40) return PEOPLE_TIPS.lowMorale;
  if (taxRate === "high" || taxRate === "crushing") return PEOPLE_TIPS.highTax;
  if (foodBalance < 0) return PEOPLE_TIPS.foodShortage;
  if (garrisonPct === 0) return PEOPLE_TIPS.noGarrison;
  if (churchPct === 0) return PEOPLE_TIPS.noChurch;
  if (foodBalance > 50) return PEOPLE_TIPS.surplus;
  return PEOPLE_TIPS.default;
}

// ---------------------------------------------------------------------------
// TAX CONSEQUENCES (enhanced display text)
// ---------------------------------------------------------------------------

export const TAX_CONSEQUENCES = {
  low: {
    topBorder: "#8dba6e",
    moraleMod: "+15",
    consequence: "People feel secure. Growth is steady.",
    warning: null,
  },
  medium: {
    topBorder: "#c9a84c",
    moraleMod: "+5",
    consequence: "A fair balance between lord and village.",
    warning: null,
  },
  high: {
    topBorder: "#c97a4c",
    moraleMod: "\u221210",
    consequence: "Good coin, but grumbling in the lanes.",
    warning: "Freeman families may leave within 1\u20132 seasons if this rate holds.",
  },
  crushing: {
    topBorder: "#d4726a",
    moraleMod: "\u221225",
    consequence: "Maximum coin extraction. Mass exodus.",
    warning: "Families will flee. Skilled workers may abandon you. Risk of organized resistance.",
  },
};

// ---------------------------------------------------------------------------
// INITIAL STATE
// ---------------------------------------------------------------------------

export function getInitialPeopleState(population) {
  return {
    tiers: getInitialTiers(population),
    laborFarming: LABOR_DEFAULTS.farming,
    laborGarrison: LABOR_DEFAULTS.garrison,
    laborChurch: LABOR_DEFAULTS.church,
    notableFamilies: INITIAL_FAMILIES.map((f) => ({ ...f })),
    villageFeed: [],
    taxHistory: [],
  };
}
