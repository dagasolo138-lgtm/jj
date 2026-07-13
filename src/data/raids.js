/**
 * raids.js
 *
 * Data definitions for the raid system: criminals (outlaws) and Scottish raiders.
 * Pure data — no logic, no side effects.
 */

export const RAID_TYPES = {
  criminal: {
    id: "criminal",
    garrisonRequired: 5,
    firstPossibleTurn: 4,
    baseChance: 0.50,
    cooldownTurns: 1,
    triggerInterval: 4,
    names: ["Outlaws", "Brigands", "Forest Bandits", "Highway Robbers"],
    themeColor: "#8a6a2a",
    themeBg: "rgba(138, 106, 42, 0.1)",
    warningTitle: "\u2020 RAID WARNING \u2020",
    warningText: [
      "Outlaws have been spotted at the edge of the forest. A band of brigands is approaching your estate.",
      "Shadowy figures emerge from the tree line. Highway robbers are converging on your lands.",
      "Smoke rises from the forest road. A gang of desperate men marches toward your gates.",
    ],
    losses: {
      denariiMin: 30,
      denariiMax: 50,
      foodMin: 10,
      foodMax: 20,
      populationLoss: 5,
      garrisonLoss: 0,
      tradeGoodCount: 1,
    },
    gains: {
      denarii: 15,
      populationGain: 3,
      garrisonGain: 2,
    },
    victoryLines: [
      "The walls held! The enemy retreats into the darkness.",
      "Your soldiers fought with the courage of lions. The raiders will think twice before returning.",
      "Steel and stone. That is the answer to those who threaten this manor.",
      "The garrison captain reports: no losses. The enemy broke against your defenses.",
      "Victory. But remain vigilant \u2014 they will return.",
    ],
    defeatLines: [
      "The brigands struck before dawn. They took what they wanted and vanished into the forest.",
      "Your garrison was overwhelmed. The outlaws ransacked the stores and disappeared.",
      "Screams in the night. By morning, your granary was half-empty and your people were afraid.",
      "The bandits laughed as they left. Your soldiers could only watch.",
    ],
    zeroGarrisonLine:
      "There was no one to defend the estate. The outlaws walked in unopposed. This is what happens when a lord forgets that power must be protected.",
    scribesNote:
      "Banditry was endemic in medieval Europe. Dense forests, poor roads, and weak central authority created perfect conditions for outlaws. Some were desperate peasants driven to crime by famine or unjust lords. Others were organized gangs who terrorized entire regions. The famous legend of Robin Hood \u2014 whether based on a real person or not \u2014 reflects a society where the line between outlaw and hero was often a matter of perspective.",
  },

  scottish: {
    id: "scottish",
    garrisonRequired: 10,
    firstPossibleTurn: 8,
    baseChance: 0.40,
    cooldownTurns: 2,
    triggerInterval: 8,
    forceTurn: 16,
    names: ["Scottish Raiders", "Border Reivers", "The Scots"],
    themeColor: "var(--royal-red, #8b1a1a)",
    themeBg: "rgba(139, 26, 26, 0.1)",
    warningTitle: "\u2694 BORDER RAID \u2694",
    warningText: [
      "Scouts report mounted raiders crossing from the north. Scottish reivers are marching on your lands.",
      "The border watchtower lights its beacon. A Scottish war party rides south toward your estate.",
      "Hoofbeats thunder from the north. The Border Reivers have come for plunder.",
    ],
    losses: {
      denariiMin: 80,
      denariiMax: 120,
      foodMin: 30,
      foodMax: 50,
      populationLoss: 10,
      garrisonLossMin: 2,
      garrisonLossMax: 3,
      tradeGoodCount: "all_of_one",
      noCastleExtraDenarii: 15,
    },
    gains: {
      denarii: 40,
      food: 5,
      populationGain: 5,
      garrisonGain: 5,
    },
    victoryLines: [
      "The Scottish raiders were repelled at the walls. Your garrison held firm.",
      "The Reivers tested your defenses and found them unyielding. They retreat north with nothing.",
      "Steel rang against steel at the gates. When the dust settled, your banner still flew.",
      "The garrison captain salutes. 'They came in force, my lord. But we held. We held.'",
      "The Scots withdraw. Your walls are scarred but standing. The people cheer from the battlements.",
    ],
    defeatLines: [
      "The raiders came like a storm. Mounted, armored, and merciless. Your garrison could not hold.",
      "The Scots burned the outlying fields and broke through the palisade. They took everything they could carry.",
      "By the time the dust settled, your stores were raided, your soldiers bloodied, and the Scots were already across the border.",
      "The garrison captain kneels before you, bloody and ashamed. 'We were not enough, my lord. We were never enough.'",
      "They drove off your livestock and torched a granary. The peasants whisper that this lord cannot protect them.",
    ],
    zeroGarrisonLine:
      "There was no one to defend the estate. The Scottish reivers walked in unopposed. This is what happens when a lord forgets that power must be protected.",
    scribesNote:
      "The Anglo-Scottish border was one of the most violent frontiers in medieval Europe. For centuries, raiding parties (known as 'reivers') crossed in both directions, stealing livestock, burning farms, and kidnapping for ransom. Border families \u2014 English and Scottish alike \u2014 built fortified tower houses called 'peel towers' for protection. The raids were so constant that a unique border culture emerged, with its own laws, its own loyalties, and its own code of honor. The word 'bereaved' comes from the border reiving tradition \u2014 to be 'reived' was to be robbed of everything.",
  },
};

export const TRADE_GOODS_FOR_RAIDS = ["wool", "cloth", "honey", "herbs", "ale"];
