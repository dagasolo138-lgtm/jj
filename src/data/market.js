/**
 * market.js
 *
 * Market Square data: merchants, foreign traders, haggling config,
 * reputation system, market events, forecasts, and vocabulary.
 */

// ---------------------------------------------------------------------------
// 1. LOCAL MERCHANTS -- Three permanent merchants with personality-based haggling
// ---------------------------------------------------------------------------

export const LOCAL_MERCHANTS = [
  {
    id: "edmund",
    name: "Edmund the Grain Merchant",
    quote: "Fair prices for honest grain",
    icon: "\u2727",
    accentColor: "#4a8a3a",
    personality: "friendly",
    haggleDifficulty: "easy",
    buys: ["grain", "livestock", "fish"],
    sells: ["grain", "livestock"],
    greetings: [
      "What can I do for you today, my lord?",
      "Fine weather for trading, wouldn't you say?",
      "I've got the best grain this side of the river.",
      "My lord! Always a pleasure to do business.",
    ],
    haggleAccept: [
      "Done. Fair price.",
      "You drive a fair bargain, my lord.",
      "Agreed \u2014 may it profit us both.",
    ],
    haggleReject: [
      "My lord, I'm not a fool. I cannot sell at that price.",
      "I have a family to feed too, my lord.",
      "Perhaps we can find a middle ground?",
    ],
    haggleFinal: [
      "This is my last offer. I cannot go further.",
      "Final price, my lord. Take it or leave it.",
    ],
  },
  {
    id: "wulfric",
    name: "Wulfric the Carpenter",
    quote: "Good timber, fair weight, no nonsense",
    icon: "\u2692",
    accentColor: "#a89070",
    personality: "gruff",
    haggleDifficulty: "medium",
    buys: ["timber", "clay", "iron", "stone"],
    sells: ["timber", "clay", "iron", "stone"],
    greetings: [
      "Need materials? State your business.",
      "Timber, stone, iron \u2014 I have what you need.",
      "My lord. Let's not waste time.",
      "Good wood doesn't come cheap, but it lasts.",
    ],
    haggleAccept: [
      "Agreed.",
      "Fair enough. Done.",
      "A sensible price. We have a deal.",
    ],
    haggleReject: [
      "Too rich for my blood.",
      "I respect your nerve, but no.",
      "Come now, my lord. Be reasonable.",
    ],
    haggleFinal: [
      "Last price. I won't budge further.",
      "This is where I stand. Yes or no?",
    ],
  },
  {
    id: "agnes",
    name: "Agnes the Goodswoman",
    quote: "I know the value of everything",
    icon: "\u2696",
    accentColor: "#c4a24a",
    personality: "shrewd",
    haggleDifficulty: "hard",
    buys: ["wool", "cloth", "honey", "ale", "herbs"],
    sells: ["wool", "cloth", "honey", "ale", "herbs", "salt", "tools", "spices"],
    greetings: [
      "Ah, my lord. Come to trade? Let's see what you've got.",
      "Quality goods deserve quality prices.",
      "I deal in the finer things. You'll find no better.",
      "Step up, my lord. But don't waste my time with low offers.",
    ],
    haggleAccept: [
      "You have yourself a deal.",
      "Ha! Well negotiated. Agreed.",
      "Fine. But you owe me a drink at the tavern.",
    ],
    haggleReject: [
      "Ha! I like your nerve. But no.",
      "You'll have to do better than that, my lord.",
      "Do I look like a charity? Try again.",
    ],
    haggleFinal: [
      "Last offer, my lord. This is generous already.",
      "Take it or walk. I have other customers.",
    ],
  },
];

// ---------------------------------------------------------------------------
// 2. FOREIGN TRADERS -- One per season, rotating
// ---------------------------------------------------------------------------

export const FOREIGN_TRADERS = {
  spring: {
    id: "giovanni",
    name: "Giovanni the Venetian",
    origin: "Venice",
    quote: "From the lagoons of Venice, treasures of the East",
    icon: "\u2726",
    accentColor: "#4a2a6a",
    specialty: ["spices"],
    sellsExclusive: ["spices"],
    buysAtPremium: ["cloth"],
    premiumPercent: 30,
    greetings: [
      "Buongiorno, my lord! Giovanni brings you the finest spices!",
      "From Constantinople to your table \u2014 exotic goods await!",
      "Venice sends her regards, and her finest wares.",
    ],
    arrivalText: "A Venetian merchant has arrived with exotic eastern spices!",
    historicalNote:
      "Venetian merchants controlled the spice trade routes from Constantinople and Alexandria, bringing pepper, cinnamon, and cloves to northern Europe at enormous profit.",
  },
  summer: {
    id: "bjorn",
    name: "Bjorn the Norseman",
    origin: "Scandinavia",
    quote: "Strong timber from the northern forests",
    icon: "\u2693",
    accentColor: "#2a4a6a",
    specialty: ["timber", "iron"],
    sellsExclusive: ["timber", "iron"],
    buysAtPremium: ["ale", "grain"],
    premiumPercent: 30,
    greetings: [
      "Hail, lord! Bjorn brings the strength of the North!",
      "Northern iron, strong as Thor's hammer!",
      "Good timber for ships \u2014 or castles. Your choice.",
    ],
    arrivalText: "A Norse trader has sailed in with northern timber and iron!",
    historicalNote:
      "Norse merchants traded across vast distances, from Scandinavia to Byzantium along river routes. They brought timber, furs, amber, and iron, trading for silver, silk, and spices.",
  },
  autumn: {
    id: "fatima",
    name: "Fatima of Cordoba",
    origin: "Al-Andalus",
    quote: "Knowledge and spice from the gardens of Cordoba",
    icon: "\u2698",
    accentColor: "#8a5a1a",
    specialty: ["spices", "herbs"],
    sellsExclusive: ["spices", "herbs"],
    buysAtPremium: ["wool", "honey"],
    premiumPercent: 30,
    greetings: [
      "Peace be upon you, my lord. Fatima brings healing and flavor.",
      "From the gardens of Al-Andalus, the finest herbs and spices.",
      "Cordoba's markets are the greatest in the world. I bring a taste.",
    ],
    arrivalText: "A merchant from Al-Andalus has arrived with rare herbs and spices!",
    historicalNote:
      "Al-Andalus (Muslim Spain) was a center of learning, medicine, and trade. Cordoba's markets traded goods from across the Islamic world. Women like Fatima could trade independently under Islamic commercial law.",
  },
  winter: {
    id: "pieter",
    name: "Pieter of Bruges",
    origin: "Flanders",
    quote: "Flemish cloth \u2014 the finest in Christendom",
    icon: "\u2630",
    accentColor: "#1a4a2a",
    specialty: ["cloth"],
    sellsExclusive: ["cloth", "tools"],
    buysAtPremium: ["wool"],
    premiumPercent: 40,
    greetings: [
      "Good day, my lord. Pieter of Bruges, at your service.",
      "Flemish cloth keeps you warm when the snow falls.",
      "The looms of Bruges weave the finest cloth. Come see.",
    ],
    arrivalText: "A Flemish cloth trader has braved the winter roads to reach your market!",
    historicalNote:
      "Flanders (modern Belgium) was the cloth-making capital of medieval Europe. Flemish weavers imported raw English wool and turned it into finished cloth worth many times more. The wool trade was so important that the English economy depended on it.",
  },
};

// ---------------------------------------------------------------------------
// 3. HAGGLE CONFIG -- Difficulty parameters for the haggling mini-game
// ---------------------------------------------------------------------------

export const HAGGLE_CONFIG = {
  maxRounds: 3,
  // Opening offer as percentage of market price (merchant's first offer)
  openingOffer: {
    easy: 0.85,
    medium: 0.75,
    hard: 0.65,
  },
  // Chance merchant accepts a counter-offer at various price points
  acceptChance: {
    easy: {
      withinTenPercent: 1.0,
      withinTwenty: 0.6,
      aboveMarket: 0.2,
    },
    medium: {
      withinTenPercent: 0.7,
      withinTwenty: 0.5,
      aboveMarket: 0.1,
    },
    hard: {
      withinTenPercent: 0.5,
      withinTwenty: 0.3,
      aboveMarket: 0.05,
    },
  },
  // When merchant counters, they move toward market price by this fraction
  counterStep: {
    easy: 0.7,
    medium: 0.5,
    hard: 0.3,
  },
  // Quantity discount threshold (bulk discount penalty per unit)
  bulkThreshold: 10,
  bulkDiscount: 0.9,
};

// ---------------------------------------------------------------------------
// 4. REPUTATION CONFIG -- Per-merchant reputation tracking
// ---------------------------------------------------------------------------

export const REPUTATION_CONFIG = {
  initial: 50,
  min: 0,
  max: 100,
  // Changes
  quickAccept: 3,
  fairDeal: 2,
  anyDeal: 1,
  walkAway: -2,
  extremeOffer: -3,
  absenceDecay: -1,
  absenceThreshold: 3,
  // Effect ranges
  tiers: [
    { min: 0, max: 20, label: "Suspicious", effect: -0.15, color: "#c62828" },
    { min: 21, max: 40, label: "Wary", effect: -0.05, color: "#8a5a1a" },
    { min: 41, max: 60, label: "Neutral", effect: 0, color: "#6a5a42" },
    { min: 61, max: 80, label: "Trusted", effect: 0.05, color: "#1a3a6b" },
    { min: 81, max: 100, label: "Valued Partner", effect: 0.15, color: "#c4a24a" },
  ],
};

export function getReputationTier(rep) {
  for (const tier of REPUTATION_CONFIG.tiers) {
    if (rep >= tier.min && rep <= tier.max) return tier;
  }
  return REPUTATION_CONFIG.tiers[2]; // default neutral
}

// ---------------------------------------------------------------------------
// 5. MARKET SUBTITLES -- Atmospheric flavor text (random on each visit)
// ---------------------------------------------------------------------------

export const MARKET_SUBTITLES = [
  "Merchants shout over one another. The smell of spices fills the air.",
  "Carts creak under the weight of goods from distant lands.",
  "Every price is a negotiation. Every handshake is a contract.",
  "The market cross stands at the center \u2014 where oaths are sworn and deals are sealed.",
  "Flemish wool, Baltic amber, Eastern spices \u2014 the world passes through this square.",
  "A good merchant buys low and sells high. A great merchant knows when to walk away.",
  "The guild inspector watches from the tavern door. Short measures will be punished.",
];

// ---------------------------------------------------------------------------
// 6. MARKET EVENTS -- Special events that modify market behavior
// ---------------------------------------------------------------------------

export const MARKET_EVENTS = [
  {
    id: "caravan",
    title: "Merchant Caravan Arrival",
    description:
      "A merchant caravan has arrived from distant lands! The foreign trader offers special deals this season.",
    effect: { foreignPremium: 0.5 },
    chance: 0.15,
    minTurn: 4,
    bannerColor: "#c4a24a",
  },
  {
    id: "market_day",
    title: "Market Day Declared",
    description:
      "The lord has declared a Market Day! All prices are 15% better for buyers AND sellers this season.",
    effect: { allSellBonus: 0.15, allBuyDiscount: 0.15 },
    chance: 0.08,
    minTurn: 8,
    maxTurn: 20,
    oneTime: true,
    bannerColor: "#e8c44a",
    scribesNote:
      "Market days and fair days were major events in medieval towns. Special market charters granted by the king allowed towns to hold weekly markets and annual fairs. On these days, special courts ('pie powder courts' \u2014 from the French 'pieds poudr\u00e9s,' dusty feet) settled disputes quickly, and merchants from far away were welcomed.",
  },
  {
    id: "guild_inspection",
    title: "Guild Inspection",
    description:
      "The guild inspector is checking weights and measures! All merchants are honest today \u2014 no haggling, fixed prices.",
    effect: { noHaggling: true },
    chance: 0.1,
    minTurn: 3,
    bannerColor: "#1a3a6b",
    scribesNote:
      "Medieval guilds strictly regulated trade. Guild inspectors checked that bread loaves weighed correctly, that ale measures were accurate, and that cloth bolts were the proper length. The 'ell' (a standard measurement roughly equal to the length of a man's arm) varied from town to town, creating confusion that merchants exploited. Standardization was a constant battle.",
  },
  {
    id: "shortage",
    title: "Resource Shortage",
    description: "A shortage has hit the market!",
    effect: { shortage: true },
    chance: 0.12,
    minTurn: 5,
    bannerColor: "#c62828",
  },
];

export function pickMarketEvent(turn, usedEventIds) {
  const eligible = MARKET_EVENTS.filter((e) => {
    if (e.minTurn && turn < e.minTurn) return false;
    if (e.maxTurn && turn > e.maxTurn) return false;
    if (e.oneTime && usedEventIds?.includes(e.id)) return false;
    return Math.random() < e.chance;
  });
  return eligible.length > 0 ? eligible[0] : null;
}

// ---------------------------------------------------------------------------
// 7. SEASONAL FORECASTS -- Hints about price trends
// ---------------------------------------------------------------------------

export const SEASONAL_FORECASTS = {
  spring: [
    "Planting season increases demand for grain seed. Sell surplus now.",
    "Summer ale demand is coming. Brew now, sell later.",
    "Fresh timber commands good prices as building season begins.",
  ],
  summer: [
    "Hot weather increases demand for ale. Hold your stores.",
    "Livestock fattens in summer pastures. Prices peak in autumn.",
    "Harvest is coming \u2014 grain prices will fall in autumn.",
  ],
  autumn: [
    "Winter drives grain prices up. Stock your granaries.",
    "Sell livestock before the frost \u2014 winter feed is expensive.",
    "Flemish buyers pay premium for cloth. Hold if you can.",
  ],
  winter: [
    "Food prices soar in winter. Sell grain at a premium.",
    "Iron and stone are hard to mine in frozen ground. Prices rise.",
    "Spring will bring new traders. Save your coin for fresh goods.",
  ],
};

export function getForecasts(season, state) {
  const forecasts = [...(SEASONAL_FORECASTS[season] || [])];
  const result = [];

  // Add state-specific forecasts
  const totalInventory = Object.values(state.inventory || {}).reduce(
    (s, v) => s + v,
    0
  );
  if (totalInventory > state.inventoryCapacity * 0.8) {
    result.push(
      "Your stores overflow. Sell surplus before production is wasted."
    );
  }
  if (state.denarii < 200) {
    result.push(
      "Coin is tight. Consider selling raw materials to fund operations."
    );
  }
  if ((state.inventory?.cloth || 0) > 0) {
    result.push("Flemish buyers pay premium for cloth. Hold if you can.");
  }

  // Add 1-2 seasonal forecasts
  const shuffled = forecasts.sort(() => Math.random() - 0.5);
  result.push(...shuffled.slice(0, Math.max(1, 3 - result.length)));

  return result.slice(0, 3);
}

// ---------------------------------------------------------------------------
// 8. VOCABULARY TOOLTIPS -- Medieval trade terms for educational context
// ---------------------------------------------------------------------------

export const VOCABULARY_TOOLTIPS = {
  haggling:
    "Negotiating a price back and forth until both parties agree. Standard practice in medieval markets.",
  "market price":
    "The current 'going rate' for a good, set by supply and demand.",
  "just price":
    "The medieval idea that goods should be sold at a fair price, not whatever the seller can get away with.",
  surplus:
    "More of a resource than you need. Selling surplus is how lords fund expansion.",
  "femme sole":
    "A woman legally allowed to conduct business independently, without a husband's permission.",
  guild:
    "An organization of merchants or craftsmen that regulated trade, set standards, and controlled prices.",
  assize:
    "A medieval law that fixed prices for essential goods like bread and ale based on the cost of grain.",
};

// ---------------------------------------------------------------------------
// 9. SCRIBE'S NOTES -- Extended historical context panels
// ---------------------------------------------------------------------------

export const MARKET_SCRIBES_NOTES = {
  priceBoard:
    "Medieval market towns were required by law to display prices publicly. The 'assize of bread and ale' regulated prices based on the cost of grain \u2014 if grain prices rose, bakers were allowed to charge more, but only by a fixed formula. Violators were fined, pilloried, or banned from trading. The just price doctrine meant that profit was acceptable, but gouging was a sin.",
  reputation:
    "In medieval markets, reputation was everything. A merchant's word was their bond \u2014 the handshake was a legally binding contract witnessed by the market community. Merchants who cheated were expelled from their guild, pilloried in the town square, or branded. The trust networks that developed between trading partners were the foundation of medieval banking and credit. Reputation literally was money.",
  foreignTrade:
    "Medieval trade was truly international. Italian merchants brought spices from the East, Norse traders sailed from Scandinavia with timber and furs, Flemish weavers turned English wool into Europe's finest cloth, and scholars from Al-Andalus brought knowledge of mathematics, medicine, and astronomy. The market square was where the world came together.",
};
