/**
 * watchtower.js
 *
 * Content data for the Watchtower:
 * flavor texts, Captain Roderic dialogue pools, anomaly definitions,
 * scan ratings, and scribe's notes.
 */

// ---------------------------------------------------------------------------
// Watchtower header subtitles — one shown randomly per visit
// ---------------------------------------------------------------------------

export const WATCHTOWER_SUBTITLES = [
  "The wind bites. The horizon is still. For now.",
  "From here you can see the edge of your domain \u2014 and everything that threatens it.",
  "Stone under your boots. Steel at your side. The land spread out below.",
  "Your captain waits. He never brings good news.",
  "The banner snaps in the wind. Your soldiers watch the tree line.",
  "A clear day. You can see for miles. That\u2019s not always a comfort.",
  "The crows circle the eastern wood. They know something you don\u2019t.",
  "Dawn breaks over the fields. Somewhere out there, someone is watching you too.",
];

// ---------------------------------------------------------------------------
// Captain Roderic — Defense Assessments (40% chance)
// Functions take game state, strings are static.
// ---------------------------------------------------------------------------

export const RODERIC_DEFENSE_ASSESSMENTS = [
  (state) => {
    const g = state.garrison ?? 0;
    if (g === 0) return "We have no garrison, my lord. None. If anyone attacks \u2014 bandits, raiders, a stiff wind \u2014 we fall. This must be your first priority.";
    if (g < 5) return `We have ${g} soldiers. Enough to deter petty thieves, perhaps. But organized attackers? We\u2019d be overrun. I need at least 5 men to hold the walls against outlaws.`;
    if (g < 10) return `Garrison strength: ${g}. We can repel bandits. But the Scots raid in force \u2014 ten men minimum to hold against border reivers. We\u2019re not there yet.`;
    if (g < 15) return `Garrison: ${g}. Solid. We can handle outlaws and turn back a Scottish raiding party. But don\u2019t get comfortable \u2014 strength invites complacency.`;
    return `${g} soldiers under arms. This is a proper garrison, my lord. We can defend against any raiding force in this region. I\u2019d recommend maintaining this strength, not overextending.`;
  },
  (state) => {
    const cl = state.castleLevel ?? 1;
    if (cl <= 1) return "Our defenses are... basic. A wooden palisade and a prayer. Stone walls would double our defensive capability.";
    if (cl === 2) return "The palisade holds. But wood burns, my lord. A stone curtain wall is the next step.";
    return "Stone walls. Good. Every upgrade makes the garrison more effective. Walls are a force multiplier \u2014 five men behind stone fight like fifteen in the open.";
  },
  (state) => {
    const raids = state.raids ?? {};
    if (raids.lastRaidType && raids.lastRaidTurn === state.turn - 1) {
      const lastResult = raids.activeRaid?.result;
      if (lastResult?.victory) return "We held last season. The men are proud \u2014 and they should be. But pride doesn\u2019t stop arrows. Stay prepared.";
      return "Last season\u2019s raid exposed our weakness. That cannot happen again. I need more men or better walls.";
    }
    if ((raids.totalCriminalRaids ?? 0) + (raids.totalScottishRaids ?? 0) === 0 && state.turn >= 6) {
      return "It\u2019s been quiet. Too quiet. Bandits don\u2019t retire, my lord. They wait.";
    }
    return null;
  },
  (state) => {
    const raids = state.raids ?? {};
    if ((raids.criminalCooldown ?? 1) <= 0 && state.turn >= 4) {
      return "The forest road is dangerous. Outlaws have been spotted in the region. A criminal raid could come any season.";
    }
    if ((raids.scottishCooldown ?? 1) <= 0 && state.turn >= 8) {
      return "Reports from the northern border are troubling. Scottish reivers have been active. Expect a raid.";
    }
    return null;
  },
  (state) => {
    const wt = state.watchtower ?? {};
    if (wt.warnings?.criminalRaidBonus > 0) return "Your scouting paid off. We know bandits are gathering. We\u2019ve positioned extra watchmen on the eastern approach. Effective garrison strength is boosted.";
    if (wt.warnings?.scottishRaidBonus > 0) return "Your scouting paid off. Scottish riders have been spotted. We\u2019ve reinforced the northern defenses.";
    if (wt.warnings?.raidRequirementReduction > 0) return "The signal fire from our allied lord confirms a military threat. I\u2019ve alerted the men. We\u2019re as ready as we can be.";
    return null;
  },
];

// ---------------------------------------------------------------------------
// Captain Roderic — Historical Military Lessons (35% chance)
// ---------------------------------------------------------------------------

export const RODERIC_HISTORICAL_LESSONS = [
  "A castle isn\u2019t a building. It\u2019s a system. Walls slow attackers. Towers provide crossfire. The keep is the last stand. Every element works together. One weakness \u2014 a rotting gate, an unguarded postern \u2014 and the whole system fails.",
  "The garrison eats whether we fight or not. That\u2019s the true cost of defense \u2014 not the swords and armor, but the daily bread. Every soldier on the wall is one less farmer in the field. Defense is an economic choice.",
  "Edward I built a ring of castles across Wales \u2014 Caernarfon, Conwy, Harlech, Beaumaris. Concentric design: walls within walls. An attacker who breached the outer wall found themselves trapped in a killing ground between the first and second walls. Brilliant. Expensive. Effective.",
  "The crossbow changed everything. A peasant with two weeks of training could kill a knight who\u2019d spent a lifetime mastering the sword. The Church tried to ban crossbows against Christians \u2014 they succeeded only in making sure everyone used them.",
  "At Stirling Bridge, William Wallace used terrain to defeat a larger English force. The bridge was narrow \u2014 only two horsemen abreast. The Scots waited until half the English army had crossed, then attacked. Geography is a weapon.",
  "A siege is not a battle. It\u2019s a logistics problem. The attacker must feed an army in the field. The defender must outlast them. Whichever side runs out of food first loses. This is why your grain stores matter more than your swordsmen.",
  "Mercenaries \u2014 \u2018free companies\u2019 \u2014 roamed medieval Europe selling their swords to the highest bidder. After the Hundred Years\u2019 War, thousands of unemployed soldiers turned bandit. The line between soldier and criminal was often just a matter of who was paying.",
  "The motte-and-bailey was the medieval world\u2019s prefab fortress. Normans could raise one in two weeks: pile earth into a mound, build a wooden tower on top, surround the base with a palisade. Quick, cheap, and surprisingly effective. Your estate probably started as one.",
  "Night raids were feared above all. Attackers would scale walls in darkness, open the gate from inside, and the garrison would wake to enemies already among them. This is why castle gates had multiple barriers \u2014 portcullis, murder holes, a drawbridge \u2014 any one of which could stop a night assault.",
  "The Scots raided English borderlands for centuries. They called it \u2018reiving\u2019 \u2014 taking livestock, burning crops, kidnapping for ransom. English lords built \u2018peel towers\u2019 \u2014 small fortified towers where a family could shelter during a raid. Your watchtower serves the same purpose. Some things never change.",
];

// ---------------------------------------------------------------------------
// Captain Roderic — Strategic Recommendations (25% chance)
// Functions that return recommendations based on game state.
// ---------------------------------------------------------------------------

export const RODERIC_STRATEGIC_TIPS = [
  (state) => {
    const mil = state.military ?? {};
    const g = mil.garrison ?? {};
    const walls = mil.walls ?? 0;
    const gate = mil.gate ?? 0;
    const moat = mil.moat ?? 0;
    const garrisonDef = (g.levy || 0) * 1 + (g.menAtArms || 0) * 3 + (g.knights || 0) * 8;
    const fortDef = [0,5,15,25,40][walls] + [0,3,7,12,18][gate] + [0,4,10,15][moat];
    const rating = Math.round((garrisonDef + fortDef) * (1 + (mil.morale ?? 50 > 60 ? 0.1 : 0)));
    if (rating < 25 && state.turn >= 4) {
      return `My recommendation: strengthen our defenses immediately. Our defense rating is ${rating} \u2014 we need 25 to repel outlaws. Recruit soldiers or upgrade fortifications.`;
    }
    return null;
  },
  (state) => {
    const mil = state.military ?? {};
    const g = mil.garrison ?? {};
    const walls = mil.walls ?? 0;
    const gate = mil.gate ?? 0;
    const moat = mil.moat ?? 0;
    const garrisonDef = (g.levy || 0) * 1 + (g.menAtArms || 0) * 3 + (g.knights || 0) * 8;
    const fortDef = [0,5,15,25,40][walls] + [0,3,7,12,18][gate] + [0,4,10,15][moat];
    const rating = Math.round((garrisonDef + fortDef) * (1 + (mil.morale ?? 50 > 60 ? 0.1 : 0)));
    if (rating >= 25 && rating < 50 && state.turn >= 8) {
      return `We can handle bandits. But the Scots are a different beast. Our defense rating is ${rating} \u2014 we need 50 to hold against a border raid. Upgrade walls or recruit men-at-arms.`;
    }
    return null;
  },
  (state) => {
    if ((state.food ?? 0) < 100 && (state.garrison ?? 0) > 0) {
      return "Our food stores concern me. If we\u2019re besieged or raided, food is the first target. A hungry garrison is a useless garrison. Build your stores before you build your army.";
    }
    return null;
  },
  (state) => {
    if ((state.denarii ?? 0) > 500 && (state.castleLevel ?? 1) < 3) {
      return "You have coin to spare. Invest it in walls, my lord. A castle upgrade is permanent \u2014 soldiers must be paid every season. Stone is the better investment.";
    }
    return null;
  },
  (state) => {
    const wt = state.watchtower ?? {};
    if (!wt.scannedThisSeason) {
      return "You haven\u2019t scanned the horizon this season. I can\u2019t protect what I can\u2019t see coming. Climb the tower and look, my lord.";
    }
    return null;
  },
  () => "Maintain the garrison. Watch the horizon. Upgrade when you can afford it. Defense is patience, my lord.",
];

// ---------------------------------------------------------------------------
// Captain Roderic — Scribe's Note (shown once on first interaction)
// ---------------------------------------------------------------------------

export const RODERIC_SCRIBES_NOTE =
  "The garrison captain \u2014 or \u2018castellan\u2019 \u2014 was one of the most important figures in a medieval estate. While the lord might be absent (at court, on campaign, or on pilgrimage), the castellan commanded the defense of the castle and its people. The position required military skill, administrative ability, and the trust of the lord. Nicholaa de la Haye, castellan of Lincoln Castle, defended her fortress twice and served as Sheriff of Lincolnshire \u2014 proving that the role demanded competence above all else.";

// ---------------------------------------------------------------------------
// Horizon Scan — Scribe's Note (shown once on first scan)
// ---------------------------------------------------------------------------

export const SCAN_SCRIBES_NOTE =
  "Medieval early warning systems were sophisticated for their time. Watch towers \u2014 often the tallest structure in a castle \u2014 provided visibility for miles in flat terrain. Chains of beacon fires could relay warnings across entire kingdoms: when the Spanish Armada was spotted in 1588, a chain of beacons carried the news from Plymouth to London in minutes. On a smaller scale, every manor lord relied on scouts, watchmen, and signal fires to avoid being caught by surprise. The difference between spotting raiders an hour early and being caught unaware was often the difference between survival and destruction.";

// ---------------------------------------------------------------------------
// Horizon Scan — Anomaly Types
// ---------------------------------------------------------------------------

export const ANOMALY_TYPES = [
  {
    id: "campfire",
    name: "Campfire smoke",
    label: "Campfire smoke \u2014 bandits?",
    description: "Bandits camping nearby \u2014 criminal raid likely next season.",
    reward: "Criminal raid defense +2 next season",
    category: "threat",
    warningKey: "criminalRaidBonus",
  },
  {
    id: "dust",
    name: "Dust cloud",
    label: "Dust cloud \u2014 riders approaching",
    description: "Mounted riders approaching \u2014 could be Scottish raiders or a merchant caravan.",
    reward: "Scottish raid defense +2 next season",
    category: "threat",
    warningKey: "scottishRaidBonus",
  },
  {
    id: "signal",
    name: "Signal fire",
    label: "Signal fire \u2014 allied warning",
    description: "Allied lord sending a warning \u2014 military threat is HIGH next season.",
    reward: "Raid garrison requirement reduced by 2",
    category: "threat",
    warningKey: "raidRequirementReduction",
  },
  {
    id: "wagon",
    name: "Merchant wagon",
    label: "Merchant wagon \u2014 traders approach",
    description: "Traders approaching \u2014 market event likely next season.",
    reward: "Foreign trader preview next season",
    category: "opportunity",
    warningKey: "merchantPreview",
  },
  {
    id: "birds",
    name: "Flock of birds",
    label: "Startled birds \u2014 something in the forest",
    description: "Something disturbed the forest \u2014 could be criminals, could be wildlife.",
    reward: "Ambiguous \u2014 50% chance of real threat",
    category: "ambiguous",
    warningKey: null, // resolved at scan time
  },
];

// ---------------------------------------------------------------------------
// Horizon Scan — Scan Ratings
// ---------------------------------------------------------------------------

export const SCAN_RATINGS = [
  {
    min: 0, max: 1,
    label: "Blind",
    denariiBonus: 0,
    captainLine: "You saw nothing, my lord. Let us hope there is nothing to see.",
  },
  {
    min: 2, max: 3,
    label: "Alert",
    denariiBonus: 0,
    captainLine: "Some threats spotted. But what did you miss?",
  },
  {
    min: 4, max: 5,
    label: "Sharp-eyed",
    denariiBonus: 5,
    captainLine: "Well observed, my lord. We\u2019ll be ready.",
  },
  {
    min: 6, max: 99,
    label: "Eagle-eyed",
    denariiBonus: 10,
    captainLine: "Nothing escapes your gaze. The enemy will find no surprise here.",
  },
];

// ---------------------------------------------------------------------------
// Horizon Scan — Configuration
// ---------------------------------------------------------------------------

export const SCAN_DURATION_SECONDS = 15;
export const SCAN_MIN_ANOMALIES = 4;
export const SCAN_MAX_ANOMALIES = 6;

// ---------------------------------------------------------------------------
// Foreign trader names for merchant preview
// ---------------------------------------------------------------------------

export const FOREIGN_TRADERS = [
  { name: "Pieter of Bruges", specialty: "Flemish cloth" },
  { name: "Marco of Venice", specialty: "Eastern spices" },
  { name: "Yvette of Lyon", specialty: "French wine" },
  { name: "Henrik of L\u00FCbeck", specialty: "Hanseatic goods" },
  { name: "Fatima of C\u00F3rdoba", specialty: "Moorish metalwork" },
];
