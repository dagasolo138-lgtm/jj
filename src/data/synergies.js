/**
 * synergies.js
 *
 * Seven hidden strategy paths with 3 tiers each.
 * Conditions are declarative objects interpreted by synergyEngine.js.
 * Bonuses are read by economyEngine.js for passive effects.
 */

export const FOOD_BUILDING_IDS = ["strip_farm", "demesne_field", "fishpond"];

export const SYNERGY_PATHS = {
  wool_baron: {
    id: "wool_baron",
    name: "The Wool Baron",
    icon: "\u223F",
    color: "#b8860b",
    tiers: [
      {
        id: "wool_baron_1",
        tier: 1,
        title: "Shepherd's Promise",
        description: "Your first flock grazes the hillside. The wool trade beckons.",
        conditions: { buildings: { pasture: 1 } },
        bonuses: { passiveIncome: 3 },
        chronicle: "Your growing flock has caught the eye of wool merchants — the Shepherd's Promise begins.",
      },
      {
        id: "wool_baron_2",
        tier: 2,
        title: "Merchant of Fleece",
        description: "Two pastures and a steady wool trade. Buyers come from distant towns.",
        conditions: { buildings: { pasture: 2 }, woolTrades: 4 },
        bonuses: { passiveIncome: 5, woolSellBonus: 2 },
        chronicle: "Your wool is known across the county — you are the Merchant of Fleece.",
      },
      {
        id: "wool_baron_3",
        tier: 3,
        title: "Baron of the Golden Fleece",
        description: "A vertical wool empire: pastures, mill, and castle protection for your caravans.",
        conditions: { buildings: { pasture: 2, fulling_mill: 1 }, woolTrades: 8, castleLevel: 2 },
        bonuses: { passiveIncome: 10, woolSellBonus: 4 },
        chronicle: "From raw fleece to fine cloth, your wool empire is unmatched — you are the Baron of the Golden Fleece.",
        scribesNote: "The great wool merchants of England built dynasties on sheep alone. Your lordship has done the same.",
        victoryTitle: {
          title: "Baron of the Golden Fleece",
          subtitle: "Master of the Wool Trade",
          description: "From humble pastures to a cloth empire spanning the county, you built a dynasty on the backs of sheep. Merchants from distant lands seek your finest cloth, and your name is spoken with reverence in every market square.",
          historianNote: "Like the great Cistercian abbeys that dominated the English wool trade, this lord understood that true wealth grows on four legs.",
        },
      },
    ],
  },

  breadbasket: {
    id: "breadbasket",
    name: "The Breadbasket",
    icon: "\u2727",
    color: "#2d5a27",
    tiers: [
      {
        id: "breadbasket_1",
        tier: 1,
        title: "Fertile Grounds",
        description: "Two food-producing buildings ensure no family goes hungry.",
        conditions: { foodBuildingCount: 2 },
        bonuses: { meterEffects: { people: 1 } },
        chronicle: "Your fields and ponds provide — no family goes hungry. The Fertile Grounds are established.",
      },
      {
        id: "breadbasket_2",
        tier: 2,
        title: "Land of Plenty",
        description: "Consistent food surplus draws new settlers to your manor.",
        conditions: { foodBuildingCount: 2, foodSurplusTurns: 3 },
        bonuses: { meterEffects: { people: 2 }, populationGrowthBonus: true },
        chronicle: "Word of your full granaries spreads — settlers arrive. This is the Land of Plenty.",
      },
      {
        id: "breadbasket_3",
        tier: 3,
        title: "The Granary of the Realm",
        description: "Three food sources, a brewery, a thriving population — your manor feeds the region.",
        conditions: { foodBuildingCount: 3, populationMin: 30, foodMin: 150, buildings: { brewery: 1 } },
        bonuses: { passiveIncome: 8, meterEffects: { people: 3 }, populationGrowthBonus: true },
        chronicle: "Your granaries overflow and your ale flows freely — you are the Granary of the Realm.",
        scribesNote: "In lean times, lords who could feed their people held power that no army could match.",
        victoryTitle: {
          title: "The Granary of the Realm",
          subtitle: "Provider of All Who Hunger",
          description: "Your fields stretch to the horizon, your granaries overflow, and your brewery keeps spirits high. Neighboring lords send envoys begging for grain, and your people have never known want.",
          historianNote: "History remembers few warriors but every famine. This lord ensured their people would remember neither.",
        },
      },
    ],
  },

  fortress: {
    id: "fortress",
    name: "The Fortress",
    icon: "\u265B",
    color: "#8b1a1a",
    tiers: [
      {
        id: "fortress_1",
        tier: 1,
        title: "Stone Walls Rise",
        description: "A stone keep replaces the old wooden palisade.",
        conditions: { castleLevel: 2 },
        bonuses: { meterEffects: { military: 1 } },
        chronicle: "Stone walls now protect your manor — the age of wood is over.",
      },
      {
        id: "fortress_2",
        tier: 2,
        title: "The Iron Garrison",
        description: "Curtain walls, a trained garrison, and defensive upgrades.",
        conditions: { castleLevel: 3, garrisonMin: 10, defenseUpgradeCount: 2 },
        bonuses: { passiveIncome: 5, meterEffects: { military: 2 } },
        chronicle: "Your castle bristles with defenses — raiders now give your lands a wide berth.",
      },
      {
        id: "fortress_3",
        tier: 3,
        title: "The Unbreakable Keep",
        description: "A concentric castle with iron-armed soldiers. No army dares approach.",
        conditions: { castleLevel: 4, garrisonMin: 20, defenseUpgradeCount: 4, buildings: { iron_mine: 1 } },
        bonuses: { passiveIncome: 12, meterEffects: { military: 3 } },
        chronicle: "Your concentric castle stands as an impregnable monument to martial power — The Unbreakable Keep.",
        scribesNote: "Edward I's ring castles in Wales cost a kingdom's ransom but guaranteed dominion. You have built your own.",
        victoryTitle: {
          title: "The Unbreakable Keep",
          subtitle: "Warden of the Iron Walls",
          description: "Your concentric castle towers over the land, its iron-armed garrison the finest in the realm. No siege engine built by man could breach your walls, and the peace you maintain through strength is absolute.",
          historianNote: "The greatest castles were never tested in battle — their mere existence was deterrent enough.",
        },
      },
    ],
  },

  pious_lord: {
    id: "pious_lord",
    name: "The Pious Lord",
    icon: "\u2626",
    color: "#4a1a6b",
    tiers: [
      {
        id: "pious_lord_1",
        tier: 1,
        title: "Keeper of Herbs",
        description: "A herb garden and strong faith — the Church takes notice.",
        conditions: { buildings: { herb_garden: 1 }, meterMin: { faith: 60 } },
        bonuses: { meterEffects: { faith: 1 } },
        chronicle: "Your devotion and healing herbs earn the Church's favor — you are the Keeper of Herbs.",
      },
      {
        id: "pious_lord_2",
        tier: 2,
        title: "Patron of the Parish",
        description: "Sustained faith and imported spices for the altar impress the bishop.",
        conditions: { buildings: { herb_garden: 1 }, highFaithTurns: 3, spicePurchases: 2 },
        bonuses: { passiveIncome: 5, meterEffects: { faith: 2 } },
        chronicle: "The bishop himself visits your chapel — you are the Patron of the Parish.",
      },
      {
        id: "pious_lord_3",
        tier: 3,
        title: "Defender of the Faith",
        description: "Herb garden, apiary for altar candles, a fortified chapel — pilgrims flock to you.",
        conditions: { buildings: { herb_garden: 1, apiary: 1 }, meterMin: { faith: 70 }, castleLevel: 2, spicePurchases: 3 },
        bonuses: { passiveIncome: 10, meterEffects: { faith: 3 } },
        chronicle: "Pilgrims travel from across the realm to pray at your chapel — you are the Defender of the Faith.",
        scribesNote: "The marriage of commerce and devotion was no contradiction in the medieval mind. Beeswax candles and exotic incense glorified God and enriched the lord alike.",
        victoryTitle: {
          title: "Defender of the Faith",
          subtitle: "Beloved of God and Church",
          description: "Your chapel draws pilgrims from distant lands, your herb garden heals the sick, and your altar burns with the finest beeswax and spice-laden incense. The Pope himself has heard of your devotion.",
          historianNote: "The truly pious lord understood that faith was not merely spiritual — it was the foundation of social order itself.",
        },
      },
    ],
  },

  market_king: {
    id: "market_king",
    name: "The Market King",
    icon: "\u269C",
    color: "#b8860b",
    tiers: [
      {
        id: "market_king_1",
        tier: 1,
        title: "Market Regular",
        description: "Five trades completed — the merchants know your face.",
        conditions: { tradeCount: 5 },
        bonuses: { tradePriceBonus: 1 },
        chronicle: "Merchants nod as you approach — you are becoming a Market Regular.",
      },
      {
        id: "market_king_2",
        tier: 2,
        title: "Master Trader",
        description: "Diverse goods, many deals, and a castle market charter.",
        conditions: { tradeCount: 10, tradeTypeCount: 3, castleLevel: 2 },
        bonuses: { passiveIncome: 5, tradePriceBonus: 2 },
        chronicle: "Your market charter draws traders from afar — you are the Master Trader.",
      },
      {
        id: "market_king_3",
        tier: 3,
        title: "King of the Market",
        description: "A trade empire: diverse goods, converter industry, and a fortified market town.",
        conditions: { tradeCount: 15, tradeTypeCount: 5, hasConverterBuilding: true, castleLevel: 3 },
        bonuses: { passiveIncome: 12, tradePriceBonus: 3 },
        chronicle: "Your market town rivals the great fairs of Champagne — you are the King of the Market.",
        scribesNote: "The great medieval fairs were not just places of commerce but engines of civilization. Your market has become such an engine.",
        victoryTitle: {
          title: "King of the Market",
          subtitle: "Lord of Commerce and Trade",
          description: "Your market town is the beating heart of regional trade. Merchants from every corner of the realm compete for stalls, your converter buildings add value to raw goods, and your fortified walls protect the wealth that flows through your gates.",
          historianNote: "The Champagne Fairs made counts richer than kings. This lord understood that gold flows to those who facilitate its movement.",
        },
      },
    ],
  },

  peoples_lord: {
    id: "peoples_lord",
    name: "The People's Lord",
    icon: "\u2727",
    color: "#2d5a27",
    tiers: [
      {
        id: "peoples_lord_1",
        tier: 1,
        title: "Fair Ruler",
        description: "Four turns of low or medium taxes — your people breathe easier.",
        conditions: { lowTaxTurns: 4 },
        bonuses: { meterEffects: { people: 1 } },
        chronicle: "Your fair taxation earns the trust of your tenants — you are known as a Fair Ruler.",
      },
      {
        id: "peoples_lord_2",
        tier: 2,
        title: "Beloved Steward",
        description: "Sustained fair taxes and high approval. Your people thrive.",
        conditions: { lowTaxTurns: 6, highPeopleTurns: 4, populationMin: 25 },
        bonuses: { passiveIncome: 4, meterEffects: { people: 2 }, populationGrowthBonus: true },
        chronicle: "Your people sing your praises — you are the Beloved Steward.",
      },
      {
        id: "peoples_lord_3",
        tier: 3,
        title: "The People's Champion",
        description: "A long reign of justice, prosperity, and peace. No revolt has ever stirred.",
        conditions: { lowTaxTurns: 8, meterMin: { people: 65 }, populationMin: 30, noRevolts: true },
        bonuses: { passiveIncome: 8, meterEffects: { people: 3 }, populationGrowthBonus: true },
        chronicle: "In the annals of your realm, not a single uprising is recorded — you are The People's Champion.",
        scribesNote: "The rarest achievement in medieval governance: a lord so just that the very idea of revolt never took root.",
        victoryTitle: {
          title: "The People's Champion",
          subtitle: "Lord of Justice and Mercy",
          description: "Your people have never known a fairer lord. Low taxes, abundant food, and wise governance have created a manor where families grow, children laugh, and no one whispers of rebellion.",
          historianNote: "For every hundred lords remembered for their conquests, perhaps one is remembered for their kindness. This is that one.",
        },
      },
    ],
  },

  iron_lord: {
    id: "iron_lord",
    name: "The Iron Lord",
    icon: "\u2694",
    color: "#4a4a4a",
    tiers: [
      {
        id: "iron_lord_1",
        tier: 1,
        title: "Iron Veins",
        description: "An iron mine opens — the foundations of military industry.",
        conditions: { buildings: { iron_mine: 1 } },
        bonuses: { meterEffects: { military: 1 } },
        chronicle: "Iron ore flows from your mine — the foundations of power are laid.",
      },
      {
        id: "iron_lord_2",
        tier: 2,
        title: "Forge Master",
        description: "Iron and stone, a garrison, and a fortified keep. Industry meets military.",
        conditions: { buildings: { iron_mine: 1, quarry: 1 }, garrisonMin: 10, castleLevel: 2 },
        bonuses: { passiveIncome: 6, meterEffects: { military: 2 } },
        chronicle: "Your forges ring day and night — you are the Forge Master.",
      },
      {
        id: "iron_lord_3",
        tier: 3,
        title: "The Iron Lord",
        description: "A complete military-industrial complex: mines, quarries, garrison, and fortress.",
        conditions: { buildings: { iron_mine: 1, quarry: 1 }, garrisonMin: 15, castleLevel: 3, defenseUpgradeCount: 2 },
        bonuses: { passiveIncome: 10, meterEffects: { military: 3 } },
        chronicle: "Your military-industrial complex is the envy of every lord in the realm — you are The Iron Lord.",
        scribesNote: "The marriage of raw materials, skilled labor, and military purpose created a self-sustaining engine of power.",
        victoryTitle: {
          title: "The Iron Lord",
          subtitle: "Master of War and Industry",
          description: "Your mines feed your forges, your forges arm your garrison, and your garrison guards your mines. This perfect circle of military industry has made your manor the arsenal of the realm.",
          historianNote: "The great ironworks of medieval Europe transformed not just warfare but civilization itself. This lord harnessed that transformation.",
        },
      },
    ],
  },
};

/** Flat array of all paths for iteration */
export const SYNERGY_PATH_LIST = Object.values(SYNERGY_PATHS);

/** Map of tierId → { path, tier } for quick lookup */
export const SYNERGY_TIER_MAP = {};
for (const path of SYNERGY_PATH_LIST) {
  for (const tier of path.tiers) {
    SYNERGY_TIER_MAP[tier.id] = { path, tier };
  }
}
