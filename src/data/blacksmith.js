/**
 * blacksmith.js — Data constants for the Blacksmith's Forge tab
 *
 * Phase 1: Ambient atmosphere, NPC dialogue stubs, forge state config.
 * Phase 2+: Item database, forging mini-game params, commission system.
 */

// ─── Forge palette ──────────────────────────────────────────────
export const FORGE_COLORS = {
  black:       "#0d0a08",
  soot:        "#1a1510",
  iron:        "#3a3632",
  steel:       "#5a5550",
  emberCore:   "#ff6b1a",
  emberHot:    "#ff4500",
  emberGlow:   "#cc5500",
  emberDim:    "#8b3a00",
  coalRed:     "#4a1a0a",
  sparkYellow: "#ffd700",
  sparkWhite:  "#fff8e0",
  quenchBlue:  "#1a3a5a",
  quenchSteam: "#8ab4c8",
  anvilGrey:   "#4a4845",
  leather:     "#5a3a20",
  parchment:   "#e8dcc8",
  inkBlack:    "#1a1208",
};

// ─── Forge temperature states ───────────────────────────────────
export const FORGE_TEMP_CONFIG = {
  cold: {
    label: "Cold",
    glowColor: "transparent",
    glowSize: 0,
    bgOverlay: "rgba(0,0,0,0)",
    embers: false,
    description: "Dark iron and cold stone. No heat.",
  },
  warm: {
    label: "Warm",
    glowColor: "rgba(255,107,26,0.2)",
    glowSize: 30,
    bgOverlay: "rgba(255,107,26,0.03)",
    embers: true,
    description: "A dull orange glow rises from the coals.",
  },
  hot: {
    label: "Hot",
    glowColor: "rgba(255,69,0,0.35)",
    glowSize: 60,
    bgOverlay: "rgba(255,69,0,0.05)",
    embers: true,
    description: "The forge roars. Metal can be shaped.",
  },
  "white-hot": {
    label: "White-Hot",
    glowColor: "rgba(255,248,224,0.4)",
    glowSize: 100,
    bgOverlay: "rgba(255,248,224,0.08)",
    embers: true,
    description: "Blinding heat. The air shimmers.",
  },
};

// ─── Forge resource display config ──────────────────────────────
export const FORGE_RESOURCES = [
  { key: "iron",    label: "Iron",    color: "#7a7068", icon: "▬" },
  { key: "steel",   label: "Steel",   color: "#8a9098", icon: "▰" },
  { key: "coal",    label: "Coal",    color: "#3a2a20", icon: "◆" },
  { key: "leather", label: "Leather", color: "#5a3a20", icon: "▧" },
  { key: "wood",    label: "Wood",    color: "#6a5a3a", icon: "▮" },
];

// ─── Godric greetings (mood-based) ──────────────────────────────
export const GODRIC_GREETINGS = {
  working: [
    "My lord. The forge is hot. What needs making?",
    "Welcome to the smoke. What shall I shape for you today?",
    "The iron doesn't care about politics. What do you need forged?",
    "My lord. I've been tempering hinges all morning. Ready for something with an edge.",
  ],
  pleased: [
    "Ah, my lord. Good to see you at the anvil again.",
    "My lord. The last batch turned out well. Your timing's improving.",
    "The garrison speaks highly of the blades we made last season. What's next?",
  ],
  frustrated: [
    "My lord. We're low on iron. I can't forge weapons from wishes.",
    "Back again? I hope you've brought materials this time.",
    "The soldiers are drilling with wooden swords, my lord. Wooden. Swords.",
  ],
  worried: [
    "My lord, I don't like the reports from the border. We need to arm up.",
    "If raiders come knocking, we need more than strong words. We need steel.",
    "I've been sharpening what we have, but dull blades can only be honed so many times.",
  ],
  proud: [
    "My lord. That masterwork longsword you forged? I hung it above the hearth. It deserves to be seen.",
    "I've trained apprentices for twenty years. You have the best hands I've seen — for a lord.",
    "The merchants are asking about our ironwork. We're building a reputation.",
  ],
};

// ─── Wat idle behaviors ─────────────────────────────────────────
export const WAT_IDLE = [
  "Wat sorts a bucket of nails by size, humming to himself.",
  "Wat attempts to lift Godric's largest hammer. He cannot.",
  "Wat polishes the same spot on the anvil for the fourth time.",
  "Wat reads a scrap of parchment by the light of the forge, mouthing the words slowly.",
  "Wat accidentally knocks over a stack of iron bars. The crash is spectacular.",
  "Wat feeds a piece of bread to the forge cat. The cat ignores it.",
  "Wat practices his hammer swing on an old horseshoe. It flies across the room.",
  "Wat has drawn a detailed diagram of a sword on the wall with charcoal.",
  "Wat tries to balance a nail on his nose. He succeeds for approximately one second.",
  "Wat whispers something to his favorite hammer. He sees you looking. He stops.",
];

// ─── Ambient text (cycles in the forge footer) ─────────────────
export const FORGE_AMBIENT_TEXTS = [
  "Sparks drift upward and die against the blackened rafters.",
  "Godric's hammer rests against the anvil, still warm.",
  "The apprentice sweeps the floor, raising clouds of soot.",
  "Through the open door, you hear the clang of the garrison drilling.",
  "A cat sleeps on a pile of leather scraps, unbothered by the heat.",
  "Iron ingots are stacked by the wall like metal bricks.",
  "The quenching trough hisses with leftover steam.",
  "Someone has scratched a crude sword into the door frame.",
  "Wat hums a tune while sorting nails into wooden buckets.",
  "The forge smells of charcoal, metal, and sweat.",
  "Shadows dance on the soot-stained walls as the fire breathes.",
  "A draft from the chimney draws the smoke upward in lazy spirals.",
];

// ─── Forge navigation config ────────────────────────────────────
// Icons are imported in the component to avoid lucide dependency in data
export const FORGE_VIEWS = [
  { id: "workshop",   label: "Workshop" },
  { id: "forging",    label: "Forging" },
  { id: "armory",     label: "Armory" },
  { id: "orders",     label: "Orders" },
  { id: "storefront", label: "Storefront" },
  { id: "ledger",     label: "Ledger" },
];

// ─── Bellows config ─────────────────────────────────────────────
export const BELLOWS_CONFIG = {
  chargePerPump: 10,
  maxCharge: 100,
  heatThreshold: 50,      // bellowsCharge needed to increase temp
  decayPerSecond: 2,       // charge decays over time
  cooldownMs: 500,         // min ms between pumps
};

// ─── Godric bellows reactions ───────────────────────────────────
export const GODRIC_BELLOWS = {
  encourage: [
    "Good. Keep the air flowing.",
    "That's it. Steady pumps.",
    "The fire needs breath, my lord. Give it more.",
  ],
  warn: [
    "That's enough — you'll melt the grate.",
    "Easy, my lord. Too much air and the coals scatter.",
    "The forge is hot enough. Save your strength for the anvil.",
  ],
};

// ─── Weapon rack silhouettes ────────────────────────────────────
export const RACK_SILHOUETTES = [
  { type: "sword",  label: "Longsword",   width: 8,  height: 48 },
  { type: "axe",    label: "War Axe",     width: 16, height: 40 },
  { type: "spear",  label: "Spear",       width: 6,  height: 56 },
  { type: "mace",   label: "Mace",        width: 12, height: 36 },
  { type: "shield", label: "Tower Shield", width: 28, height: 32 },
  { type: "dagger", label: "Dagger",      width: 6,  height: 24 },
];

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — Forging Mini-Game Data
// ═══════════════════════════════════════════════════════════════

// ─── Difficulty configs ─────────────────────────────────────────
export const FORGING_DIFFICULTY = {
  easy:   { strikes: 6,  tempo: 900, perfectWindow: 180, goodWindow: 300, label: "Easy" },
  medium: { strikes: 8,  tempo: 750, perfectWindow: 140, goodWindow: 240, label: "Medium" },
  hard:   { strikes: 12, tempo: 600, perfectWindow: 100, goodWindow: 180, label: "Hard" },
  master: { strikes: 16, tempo: 500, perfectWindow: 80,  goodWindow: 150, label: "Master" },
};

// ─── Item category config ─────────────────────────────────────
export const ITEM_CATEGORIES = [
  { id: "weapon",      label: "Weapons",     icon: "⚔" },
  { id: "armor",       label: "Armor",       icon: "⛊" },
  { id: "tool",        label: "Tools",       icon: "⚒" },
  { id: "trade_good",  label: "Trade Goods", icon: "⚖" },
];

// ─── Full item database (35 items across 4 categories) ────────
export const FORGEABLE_ITEMS = {
  // ── WEAPONS (10) ──────────────────────────────────────────
  dagger: {
    id: "dagger", name: "Dagger", category: "weapon", difficulty: "easy",
    cost: { iron: 1, steel: 0, coal: 2, leather: 1, wood: 0, gold: 1 },
    baseMilitary: 2, baseTradeValue: 3,
    description: "A short blade for close quarters. Simple to forge, but a poor edge cuts poorly.",
  },
  short_sword: {
    id: "short_sword", name: "Short Sword", category: "weapon", difficulty: "easy",
    cost: { iron: 2, steel: 0, coal: 3, leather: 1, wood: 1, gold: 2 },
    baseMilitary: 3, baseTradeValue: 5,
    description: "A reliable sidearm. Every soldier should carry one.",
  },
  longsword: {
    id: "longsword", name: "Longsword", category: "weapon", difficulty: "medium",
    cost: { iron: 3, steel: 1, coal: 5, leather: 1, wood: 1, gold: 4 },
    baseMilitary: 5, baseTradeValue: 10,
    description: "The standard weapon of a man-at-arms. Requires skill to forge well.",
  },
  war_axe: {
    id: "war_axe", name: "War Axe", category: "weapon", difficulty: "medium",
    cost: { iron: 3, steel: 0, coal: 4, leather: 0, wood: 2, gold: 3 },
    baseMilitary: 5, baseTradeValue: 8,
    description: "Brutal and effective. The wood handle must balance the iron head.",
  },
  mace: {
    id: "mace", name: "Mace", category: "weapon", difficulty: "medium",
    cost: { iron: 4, steel: 0, coal: 4, leather: 1, wood: 1, gold: 3 },
    baseMilitary: 4, baseTradeValue: 7,
    description: "Blunt force. No edge to worry about, but the weight must be right.",
  },
  halberd: {
    id: "halberd", name: "Halberd", category: "weapon", difficulty: "hard",
    cost: { iron: 3, steel: 1, coal: 5, leather: 0, wood: 3, gold: 5 },
    baseMilitary: 7, baseTradeValue: 14,
    description: "Axe, spear, and hook in one. Complex to forge — the head must be perfectly balanced.",
  },
  bastard_sword: {
    id: "bastard_sword", name: "Bastard Sword", category: "weapon", difficulty: "hard",
    cost: { iron: 4, steel: 2, coal: 6, leather: 2, wood: 1, gold: 8 },
    baseMilitary: 8, baseTradeValue: 20,
    description: "A hand-and-a-half blade. The finest steel and the steadiest hand required.",
  },
  arrowheads: {
    id: "arrowheads", name: "Arrowheads (\u00d720)", category: "weapon", difficulty: "easy",
    cost: { iron: 2, steel: 0, coal: 3, leather: 0, wood: 0, gold: 2 },
    baseMilitary: 3, baseTradeValue: 4,
    description: "Twenty bodkin points. Simple to forge in bulk, deadly in flight.",
  },
  spear_tips: {
    id: "spear_tips", name: "Spear Tips (\u00d710)", category: "weapon", difficulty: "easy",
    cost: { iron: 2, steel: 0, coal: 3, leather: 0, wood: 0, gold: 2 },
    baseMilitary: 3, baseTradeValue: 4,
    description: "Ten leaf-shaped heads for the militia's spears. Quick work for a skilled hand.",
  },
  lance: {
    id: "lance", name: "Lance", category: "weapon", difficulty: "hard",
    cost: { iron: 2, steel: 1, coal: 4, leather: 1, wood: 4, gold: 6 },
    baseMilitary: 6, baseTradeValue: 12,
    description: "A mounted weapon. The steel tip must be perfectly aligned with the ash shaft.",
  },

  // ── ARMOR (10) ────────────────────────────────────────────
  leather_cap: {
    id: "leather_cap", name: "Leather Cap", category: "armor", difficulty: "easy",
    cost: { iron: 0, steel: 0, coal: 1, leather: 3, wood: 0, gold: 1 },
    baseMilitary: 1, baseTradeValue: 2,
    description: "Basic head protection. Better than nothing.",
  },
  chain_coif: {
    id: "chain_coif", name: "Chain Coif", category: "armor", difficulty: "medium",
    cost: { iron: 3, steel: 0, coal: 4, leather: 1, wood: 0, gold: 3 },
    baseMilitary: 3, baseTradeValue: 7,
    description: "A hood of interlocking rings. Protects the head and neck from slashing blows.",
  },
  iron_helm: {
    id: "iron_helm", name: "Iron Helm", category: "armor", difficulty: "medium",
    cost: { iron: 3, steel: 0, coal: 4, leather: 1, wood: 0, gold: 4 },
    baseMilitary: 4, baseTradeValue: 8,
    description: "A solid helm that can turn a blade. The eye slits must be precise.",
  },
  leather_jerkin: {
    id: "leather_jerkin", name: "Leather Jerkin", category: "armor", difficulty: "easy",
    cost: { iron: 0, steel: 0, coal: 1, leather: 5, wood: 0, gold: 2 },
    baseMilitary: 2, baseTradeValue: 4,
    description: "Hardened leather body armor. Light, flexible, and quiet.",
  },
  chain_mail: {
    id: "chain_mail", name: "Chain Mail Shirt", category: "armor", difficulty: "hard",
    cost: { iron: 6, steel: 0, coal: 6, leather: 2, wood: 0, gold: 8 },
    baseMilitary: 7, baseTradeValue: 18,
    description: "Thirty thousand interlocking rings. Months of work in the real world.",
  },
  breastplate: {
    id: "breastplate", name: "Breastplate", category: "armor", difficulty: "hard",
    cost: { iron: 5, steel: 2, coal: 7, leather: 2, wood: 0, gold: 10 },
    baseMilitary: 9, baseTradeValue: 25,
    description: "Shaped plate armor for the torso. The crown jewel of a smith's craft.",
  },
  tower_shield: {
    id: "tower_shield", name: "Tower Shield", category: "armor", difficulty: "medium",
    cost: { iron: 4, steel: 0, coal: 4, leather: 2, wood: 3, gold: 5 },
    baseMilitary: 5, baseTradeValue: 10,
    description: "A wall of oak and iron. A soldier behind this can hold a corridor alone.",
  },
  buckler: {
    id: "buckler", name: "Buckler", category: "armor", difficulty: "easy",
    cost: { iron: 2, steel: 0, coal: 2, leather: 1, wood: 1, gold: 2 },
    baseMilitary: 2, baseTradeValue: 4,
    description: "A small round shield for parrying. Light and fast.",
  },
  gauntlets: {
    id: "gauntlets", name: "Gauntlets", category: "armor", difficulty: "medium",
    cost: { iron: 3, steel: 1, coal: 4, leather: 2, wood: 0, gold: 4 },
    baseMilitary: 3, baseTradeValue: 8,
    description: "Articulated hand armor. Each finger joint must flex without binding.",
  },
  greaves: {
    id: "greaves", name: "Greaves", category: "armor", difficulty: "medium",
    cost: { iron: 3, steel: 1, coal: 4, leather: 2, wood: 0, gold: 4 },
    baseMilitary: 3, baseTradeValue: 8,
    description: "Shin guards shaped to deflect low strikes. Often overlooked, always needed.",
  },

  // ── TOOLS (10) ────────────────────────────────────────────
  plowshare: {
    id: "plowshare", name: "Plowshare", category: "tool", difficulty: "easy",
    cost: { iron: 3, steel: 0, coal: 3, leather: 0, wood: 2, gold: 2 },
    baseMilitary: 0, baseTradeValue: 4, effect: "Food production +5%",
    description: "The blade that feeds the village. Humble but essential.",
  },
  scythe: {
    id: "scythe", name: "Scythe", category: "tool", difficulty: "easy",
    cost: { iron: 2, steel: 0, coal: 3, leather: 0, wood: 2, gold: 2 },
    baseMilitary: 0, baseTradeValue: 4, effect: "Harvest speed +5%",
    description: "A curved blade for reaping grain. The sweep must be smooth and even.",
  },
  horseshoes: {
    id: "horseshoes", name: "Horseshoes (\u00d74)", category: "tool", difficulty: "easy",
    cost: { iron: 2, steel: 0, coal: 2, leather: 0, wood: 0, gold: 1 },
    baseMilitary: 0, baseTradeValue: 3, effect: "Trade route speed +5%",
    description: "Four shoes for one horse. Simple work, but the fit must be exact.",
  },
  nails: {
    id: "nails", name: "Nails (\u00d7100)", category: "tool", difficulty: "easy",
    cost: { iron: 1, steel: 0, coal: 2, leather: 0, wood: 0, gold: 1 },
    baseMilitary: 0, baseTradeValue: 2, effect: "Building cost -5%",
    description: "A hundred hand-forged nails. Tedious but always in demand.",
  },
  hinges_fittings: {
    id: "hinges_fittings", name: "Hinges & Fittings", category: "tool", difficulty: "easy",
    cost: { iron: 2, steel: 0, coal: 2, leather: 0, wood: 0, gold: 1 },
    baseMilitary: 0, baseTradeValue: 3, effect: "Building quality +5%",
    description: "Iron hardware for doors and shutters. Every building needs them.",
  },
  church_bell: {
    id: "church_bell", name: "Church Bell", category: "tool", difficulty: "hard",
    cost: { iron: 5, steel: 0, coal: 6, leather: 0, wood: 2, gold: 6 },
    baseMilitary: 0, baseTradeValue: 15, effect: "Faith +8",
    description: "Cast iron, shaped to ring across the valley. A village without a bell is a village without a soul.",
  },
  lock_key: {
    id: "lock_key", name: "Lock & Key Set", category: "tool", difficulty: "medium",
    cost: { iron: 1, steel: 1, coal: 2, leather: 0, wood: 0, gold: 3 },
    baseMilitary: 0, baseTradeValue: 6, effect: "Treasury security +5%",
    description: "Precision work. The pins must be filed to exact tolerances.",
  },
  cauldron: {
    id: "cauldron", name: "Cauldron", category: "tool", difficulty: "medium",
    cost: { iron: 4, steel: 0, coal: 4, leather: 0, wood: 0, gold: 3 },
    baseMilitary: 0, baseTradeValue: 7, effect: "Feast quality bonus",
    description: "A great iron pot for the kitchen. Can feed fifty mouths from a single fire.",
  },
  weather_vane: {
    id: "weather_vane", name: "Weather Vane", category: "tool", difficulty: "medium",
    cost: { iron: 2, steel: 0, coal: 3, leather: 0, wood: 1, gold: 2 },
    baseMilitary: 0, baseTradeValue: 5, effect: "Season prediction",
    description: "A rooster atop the tower, pointing into the wind. Farmers swear by them.",
  },
  chandelier: {
    id: "chandelier", name: "Chandelier", category: "tool", difficulty: "medium",
    cost: { iron: 3, steel: 0, coal: 4, leather: 0, wood: 1, gold: 4 },
    baseMilitary: 0, baseTradeValue: 8, effect: "Great Hall prestige +3",
    description: "Wrought iron arms holding a dozen candles. Turns a dark hall into a throne room.",
  },

  // ── TRADE GOODS (5) ───────────────────────────────────────
  decorative_hinges: {
    id: "decorative_hinges", name: "Decorative Hinges", category: "trade_good", difficulty: "medium",
    cost: { iron: 2, steel: 0, coal: 3, leather: 0, wood: 0, gold: 1 },
    baseMilitary: 0, baseTradeValue: 6,
    description: "Ornamental ironwork with scrolled ends. Nobles pay well for beauty.",
  },
  iron_candelabra: {
    id: "iron_candelabra", name: "Iron Candelabra", category: "trade_good", difficulty: "medium",
    cost: { iron: 3, steel: 0, coal: 4, leather: 0, wood: 0, gold: 2 },
    baseMilitary: 0, baseTradeValue: 9,
    description: "A branching stand for tapers. Churches and nobles compete for the finest examples.",
  },
  wrought_iron_gate: {
    id: "wrought_iron_gate", name: "Wrought Iron Gate", category: "trade_good", difficulty: "hard",
    cost: { iron: 6, steel: 0, coal: 6, leather: 0, wood: 2, gold: 4 },
    baseMilitary: 0, baseTradeValue: 18,
    description: "A major trade piece. The scrollwork alone takes days.",
  },
  ornamental_sword: {
    id: "ornamental_sword", name: "Ornamental Sword", category: "trade_good", difficulty: "hard",
    cost: { iron: 3, steel: 1, coal: 5, leather: 2, wood: 1, gold: 5 },
    baseMilitary: 0, baseTradeValue: 22,
    description: "Ceremonial, not for combat. The blade is etched, the pommel gilded.",
  },
  silver_inlaid_dagger: {
    id: "silver_inlaid_dagger", name: "Silver-inlaid Dagger", category: "trade_good", difficulty: "master",
    cost: { iron: 2, steel: 1, coal: 3, leather: 1, wood: 0, gold: 8 },
    baseMilitary: 0, baseTradeValue: 35,
    description: "A luxury export. Silver wire hammered into channels carved along the blade.",
  },
};

// ─── Quality grade definitions ──────────────────────────────────
export const QUALITY_GRADES = {
  Masterwork: {
    grade: "Masterwork",
    minScore: 90,
    color: "#ffd700",
    statMultiplier: 1.5,
    tradeMultiplier: 3.0,
    description: "Flawless. This blade will be spoken of for generations.",
    durability: "Legendary",
  },
  Fine: {
    grade: "Fine",
    minScore: 70,
    color: "#c0c0c0",
    statMultiplier: 1.2,
    tradeMultiplier: 2.0,
    description: "Excellent craftsmanship. A weapon worthy of a knight.",
    durability: "Excellent",
  },
  Standard: {
    grade: "Standard",
    minScore: 50,
    color: "#8a8a8a",
    statMultiplier: 1.0,
    tradeMultiplier: 1.0,
    description: "Solid work. It will serve its purpose well.",
    durability: "Good",
  },
  Rough: {
    grade: "Rough",
    minScore: 30,
    color: "#6a5a4a",
    statMultiplier: 0.7,
    tradeMultiplier: 0.5,
    description: "Functional, but nothing special. The edge is uneven.",
    durability: "Fragile",
  },
  Scrap: {
    grade: "Scrap",
    minScore: 0,
    color: "#4a3a2a",
    statMultiplier: 0,
    tradeMultiplier: 0.1,
    description: "Ruined. The metal cracked. Only good for melting down.",
    durability: "Broken",
  },
};

export function calculateGrade(qualityScore) {
  if (qualityScore >= 90) return QUALITY_GRADES.Masterwork;
  if (qualityScore >= 70) return QUALITY_GRADES.Fine;
  if (qualityScore >= 50) return QUALITY_GRADES.Standard;
  if (qualityScore >= 30) return QUALITY_GRADES.Rough;
  return QUALITY_GRADES.Scrap;
}

// ─── Godric coaching lines (during forging) ─────────────────────
export const GODRIC_FORGING = {
  start: [
    "Focus on the rhythm. The metal will tell you when it's ready.",
    "Watch the color. Orange is forging heat. White is too hot — you'll burn the carbon out.",
    "Steady hands, my lord. Think of it like a heartbeat.",
  ],
  perfect: [
    "Yes! Like that!",
    "Clean strike. Feel that ring? That's good iron.",
    "Perfect. The metal folded exactly right.",
    "Now you're smithing.",
    "That's the one. Every sword remembers its best strike.",
  ],
  good: [
    "Decent. A hair early, but the metal doesn't mind.",
    "Acceptable. Tighten up and the next one will sing.",
    "Not bad. Not bad at all.",
    "The edge will hold, but it could be sharper.",
  ],
  miss: [
    "Too late. The metal cooled in that spot. Keep going.",
    "That one went wide. Recover on the next strike.",
    "Even I miss sometimes. Rarely. But sometimes.",
    "The anvil felt that one more than the blade did.",
    "Hmm. Let's pretend that didn't happen.",
  ],
  streak3: "Three in a row. You've found the rhythm.",
  streak5: "Five perfect strikes. The blade is singing, my lord.",
  streak8: "Eight. I've seen master smiths who can't hold a streak that long.",
  streakBroken: "The streak breaks. Don't chase it — just hit the next one clean.",
  qualityHigh: "This is shaping into something special. Don't let up.",
  qualityMid: "Solid work so far. A few more good strikes and this'll be fine steel.",
  qualityLow: "We're losing this one, my lord. Every strike from here matters.",
  qualityScrap: "...We may want to start over. There's no shame in melting it down.",
  preQuench: [
    "Now — into the water. One clean motion. Don't hesitate.",
    "The quench seals the steel. Get this right and the blade will ring true.",
    "Steady. Watch the color. When the edge turns blue-grey, plunge it.",
  ],
  perfectQuench: "Listen to that hiss. That's a blade that will hold its edge for years.",
  goodQuench: "Adequate. The temper is set. It'll serve.",
  missedQuench: "You quenched too soon. The core will be brittle. It'll hold, but... I wouldn't trust it against plate.",
};

// ─── Godric result reactions (by grade) ─────────────────────────
export const GODRIC_RESULTS = {
  Masterwork: [
    "...My lord. That is not a weapon. That is a work of art.",
    "In thirty years of smithing, I've made perhaps a dozen pieces this fine. You have the gift.",
    "The garrison will fight twice as hard knowing they carry steel like this.",
  ],
  Fine: [
    "Good work. Any soldier would be proud to carry this into battle.",
    "You're getting better, my lord. That blade will serve well.",
    "Not quite perfect — but closer than most will ever get.",
  ],
  Standard: [
    "It'll do. A working blade for a working soldier.",
    "Honest steel. Nothing fancy, nothing wrong.",
    "Exactly what we need. Not everything has to be legendary.",
  ],
  Rough: [
    "...I've seen worse. From apprentices. First-year apprentices.",
    "The edge is uneven. We can grind it, but it won't hold long.",
    "My lord, perhaps stick to governing and leave the anvil to me?",
  ],
  Scrap: [
    "My lord. That is not a sword. That is an expensive mistake.",
    "I... we should melt this down. Quickly. Before anyone sees it.",
    "Three bars of iron. Gone. Well. Everyone learns.",
  ],
};

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — Commission System Data
// ═══════════════════════════════════════════════════════════════

// ─── Resource market config ───────────────────────────────────
export const RESOURCE_MARKET = {
  iron:    { basePrice: 2, label: "Iron Bars",    unit: "bar",  seasonal: { spring: 1.0, summer: 0.9, autumn: 0.8, winter: 1.1 } },
  steel:   { basePrice: 6, label: "Steel Ingots", unit: "ingot", seasonal: { spring: 1.0, summer: 1.0, autumn: 1.0, winter: 1.0 } },
  coal:    { basePrice: 1, label: "Charcoal",     unit: "sack", seasonal: { spring: 0.9, summer: 0.9, autumn: 1.0, winter: 1.3 } },
  leather: { basePrice: 1, label: "Tanned Hides", unit: "hide", seasonal: { spring: 0.8, summer: 0.8, autumn: 1.0, winter: 1.3 } },
  wood:    { basePrice: 1, label: "Cut Timber",   unit: "plank", seasonal: { spring: 0.9, summer: 0.9, autumn: 1.0, winter: 1.1 } },
};

// Generate fluctuating market prices for a given season
export function generateForgeMarketPrices(season) {
  const prices = {};
  for (const [key, cfg] of Object.entries(RESOURCE_MARKET)) {
    const seasonMod = cfg.seasonal[season] || 1.0;
    const fluctuation = 0.7 + Math.random() * 0.6;
    prices[key] = Math.max(1, Math.round(cfg.basePrice * seasonMod * fluctuation));
  }
  return prices;
}

// ─── Scrap recovery (partial material recovery on scrapping) ──
export const SCRAP_RECOVERY_RATE = 0.4;

// ─── Difficulty display config ───────────────────────────────
export const DIFFICULTY_DISPLAY = {
  easy:   { anvils: 1, label: "Easy",   color: "#6a8a5a" },
  medium: { anvils: 2, label: "Medium", color: "#a89050" },
  hard:   { anvils: 3, label: "Hard",   color: "#c86030" },
  master: { anvils: 4, label: "Master", color: "#c82020" },
};

// ─── Godric commission recommendations ────────────────────────
export function getGodricRecommendation(state) {
  const bs = state.blacksmith || {};
  const garrison = state.garrison || 0;
  const denarii = state.denarii || 0;
  const inventory = bs.inventory || [];
  const equipped = bs.equipped || [];

  const weaponCount = equipped.filter(i => i.category === "weapon").length;
  const armorCount = equipped.filter(i => i.category === "armor").length;

  if (garrison > 5 && weaponCount < garrison * 0.5) {
    return "My lord, the garrison needs swords. We're underarmed.";
  }
  if (garrison > 5 && armorCount < garrison * 0.3) {
    return "Armor, my lord. Our soldiers fight in linen shirts. That won't stop a blade.";
  }
  if (denarii < 20) {
    return "Trade goods fetch good coin. Perhaps an ornamental piece for the merchants?";
  }
  if (inventory.length > 8) {
    return "The armory is filling up. Consider selling or equipping what we have.";
  }
  if ((bs.totalItemsForged || 0) < 3) {
    return "Start with something simple, my lord. A dagger or nails. Learn the rhythm.";
  }
  return "What shall we make today, my lord? The forge is ready.";
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4 — NPC System Data
// ═══════════════════════════════════════════════════════════════

// ─── Godric respect tier definitions ──────────────────────────
export const GODRIC_RESPECT_TIERS = [
  { min: 80, title: "My lord, if I may.", behavior: "trusted", borderColor: "#ffd700" },
  { min: 60, title: "Lord Commander.", behavior: "respected", borderColor: "#c0c0c0" },
  { min: 40, title: "My lord.", behavior: "warm", borderColor: FORGE_COLORS.emberCore },
  { min: 20, title: "My lord.", behavior: "neutral", borderColor: "#8a7a5a" },
  { min: 0,  title: "...my lord.", behavior: "disdain", borderColor: "#4a3a2a" },
];

export function getGodricTier(respect) {
  for (const tier of GODRIC_RESPECT_TIERS) {
    if (respect >= tier.min) return tier;
  }
  return GODRIC_RESPECT_TIERS[GODRIC_RESPECT_TIERS.length - 1];
}

// ─── Godric mood derivation ──────────────────────────────────
export function deriveGodricMood(state) {
  const bs = state.blacksmith || {};
  const respect = bs.godricRespect ?? 50;
  const garrison = state.garrison || 0;
  const equipped = bs.equipped || [];
  const resources = bs.resources || {};

  // Proud: high respect + recent masterwork
  if (respect >= 70 && (bs.masterworksCreated || 0) > 0) return "proud";

  // Worried: garrison exists but poorly armed
  const weaponCount = equipped.filter(i => i.category === "weapon").length;
  if (garrison > 3 && weaponCount < garrison * 0.3) return "worried";

  // Frustrated: low resources
  const ironLow = (resources.iron || 0) < 5;
  const coalLow = (resources.coal || 0) < 10;
  if (ironLow || coalLow) return "frustrated";

  // Pleased: decent respect
  if (respect >= 60) return "pleased";

  return "working";
}

// ─── Godric military readiness commentary ────────────────────
export const GODRIC_MILITARY = {
  critical: [
    "My lord, I need to speak plainly. If anyone attacks us right now, we will lose. The soldiers have sticks.",
    "I lie awake thinking about what happens when raiders come and our boys are holding kitchen knives.",
  ],
  low: [
    "We're underequipped. I can arm maybe a third of the garrison properly. The rest are padding.",
    "I need iron, my lord. Iron and time. Give me both and I'll make us something worth fighting behind.",
  ],
  adequate: [
    "We're not defenseless. But we're not ready for a real fight either.",
    "The basics are covered. If you want an edge, we need better steel — finer work.",
  ],
  strong: [
    "The garrison is well-equipped. The men feel confident. That matters.",
    "We're in good shape. Maintenance and replacements from here — no rush orders needed.",
  ],
  peak: [
    "My lord, I am proud of what we've built here. Every soldier carries steel I'd put my name on.",
    "If our enemies are wise, they'll look at our garrison and choose a different fight.",
  ],
};

export function getReadinessTier(equipped, garrison) {
  if (garrison === 0) return "adequate";
  const ratio = equipped.length / Math.max(garrison, 1);
  if (ratio >= 0.8) return "peak";
  if (ratio >= 0.6) return "strong";
  if (ratio >= 0.4) return "adequate";
  if (ratio >= 0.2) return "low";
  return "critical";
}

// ─── Wat's historical facts ──────────────────────────────────
export const WAT_FACTS = [
  {
    trigger: "any_weapon",
    dialogue: "Did you know \u2014 the Vikings used a technique called pattern welding? They'd twist different types of iron together and forge them into a single blade. The patterns looked like snakes in the steel. Godric says it's showing off. I think it's brilliant.",
    topic: "Pattern welding in Viking swordsmithing",
  },
  {
    trigger: "any_weapon",
    dialogue: "My lord, a good sword takes about 200 hours to make properly. The blade, the hilt, the grip, the pommel, the scabbard... every part is its own craft. Some smiths only make blades. Others only make hilts.",
    topic: "Specialization in medieval weapon production",
  },
  {
    trigger: "iron",
    dialogue: "Iron ore doesn't look like iron at all \u2014 it looks like reddish rock. You have to heat it in a bloomery furnace for hours to get the metal out, and even then, half of what you pull out is slag. That's why iron costs what it does.",
    topic: "Iron smelting and bloom iron",
  },
  {
    trigger: "steel",
    dialogue: "Did you know \u2014 steel is just iron with a little bit of carbon mixed in? A LITTLE bit. Too much and it's brittle, too little and it's soft. Getting it right is... well, Godric makes it look easy. I set my eyebrows on fire last time I tried.",
    topic: "Carbon content and steel hardness",
  },
  {
    trigger: "coal",
    dialogue: "Charcoal burns hotter than wood \u2014 that's why we use it. Charcoal burners live in the forest for weeks, building big domed piles of wood, covering them in turf, and letting them smolder. One wrong move and the whole pile catches fire.",
    topic: "Charcoal production for smithing",
  },
  {
    trigger: "armor",
    dialogue: "A full suit of plate armor could weigh 45 to 55 pounds. Sounds heavy, right? But it's distributed across your whole body. A knight in full plate could run, mount a horse, even do a somersault \u2014 there's records of it.",
    topic: "Medieval armor weight and mobility",
  },
  {
    trigger: "chain_mail",
    dialogue: "Do you know how many rings are in a chain mail shirt? About thirty THOUSAND. Each one made by hand \u2014 cut from wire, shaped into a circle, and riveted shut. Godric made one once. It took him four months. He doesn't like to talk about it.",
    topic: "Chain mail construction",
  },
  {
    trigger: "shield",
    dialogue: "Shields weren't just for blocking! Knights used them as weapons \u2014 shield-bashing was a real technique. Round shields are good for pushing, kite shields protect your legs on horseback, and tower shields are basically portable walls.",
    topic: "Shield types and tactical use",
  },
  {
    trigger: "horseshoes",
    dialogue: "Before horseshoes, horses couldn't really work on hard or rocky ground. When horseshoes spread through Europe around the 6th century, it changed everything \u2014 horses could travel farther, carry more, and work harder. Godric says the horseshoe is more important than the sword.",
    topic: "The horseshoe revolution",
  },
  {
    trigger: "quench",
    dialogue: "Some old texts say Japanese swordsmiths would quench their blades in... unusual liquids. But they DID use different quenching methods \u2014 water, oil, each one cools the steel at a different rate, which changes the hardness. Godric uses plain water. He says fancy quenching is for people who can't forge properly.",
    topic: "Quenching methods and metallurgy",
  },
  {
    trigger: "bellows",
    dialogue: "The bellows are basically the forge's lungs. Without air, the fire can't get hot enough \u2014 you need about 1,100 degrees to work iron. White-hot is even hotter, about 1,300 degrees. At that point, I am nowhere near the forge.",
    topic: "Forge temperatures and air supply",
  },
  {
    trigger: "nails",
    dialogue: "People think nails are boring but they're INCREDIBLY important. Before machine-made nails, every single nail was hand-forged. A house might need thousands. 'Nailers' would sit at small forges all day making nothing but nails. My fingers ache just thinking about it.",
    topic: "Hand-forged nails and construction",
  },
  {
    trigger: "forge_general",
    dialogue: "Did you know that blacksmiths were so important in medieval villages that they were often exempt from certain taxes? The lord needed them too much. Godric says this means HE should be exempt from cleaning the forge. I don't think that's how it works.",
    topic: "Social status of medieval blacksmiths",
  },
  {
    trigger: "forge_general",
    dialogue: "The word 'blacksmith' comes from 'black metal' \u2014 what they called iron, because it turns black when heated. A 'whitesmith' worked with tin or silver. A 'brownsmith' worked with copper or brass.",
    topic: "Etymology of 'blacksmith' and metal workers",
  },
  {
    trigger: "forge_general",
    dialogue: "In Norse mythology, the dwarves were the master smiths. They forged Thor's hammer Mjolnir, Odin's spear Gungnir, and a golden boar that could run through the sky. Godric says if someone wants a golden boar, he'll need a LOT more coal.",
    topic: "Mythology and smithing",
  },
  {
    trigger: "masterwork",
    dialogue: "In the real guild system, an apprentice had to make a 'masterpiece' \u2014 literally a piece good enough for the masters \u2014 to earn the title of master craftsman. Some people never passed. Godric passed on his first try. He mentions this... often.",
    topic: "The guild masterpiece tradition",
  },
  {
    trigger: "scrap",
    dialogue: "Don't feel bad about scrap, my lord. Even Godric has a scrap pile. He just... doesn't let anyone see it. I found it once behind the wood store. He made me swear not to tell. ...Oh. OH NO. Please forget I said that.",
    topic: "Failure as part of the craft",
  },
  {
    trigger: "trade",
    dialogue: "English iron was actually pretty low quality compared to Spanish or Swedish iron. The best swords in Europe were made with steel from Toledo, Spain \u2014 or with 'Ulfberht' steel from Central Asia via Viking trade routes. THOUSANDS of miles for a lump of metal.",
    topic: "International iron trade and quality",
  },
  {
    trigger: "burn_incident",
    dialogue: "OW! That's the third time this week. ...I'm fine. It's fine. Godric says burn scars are a smith's autobiography. I've got enough autobiography for three chapters already.",
    topic: null,
  },
  {
    trigger: "burn_incident",
    dialogue: "I just \u2014 I just touched the quenching tongs and they were still \u2014 OW. My lord, do you know what iron smells like when it touches skin? I do. Intimately.",
    topic: null,
  },
];

// Pick a fact by trigger type, using an index for deterministic selection
export function pickWatFact(trigger, index) {
  const matching = WAT_FACTS.filter(f => f.trigger === trigger);
  if (matching.length === 0) {
    const general = WAT_FACTS.filter(f => f.trigger === "forge_general");
    return general[index % general.length];
  }
  return matching[index % matching.length];
}

// ─── Godric-Wat banter interactions ──────────────────────────
// Each banter is an array of { speaker, line } to avoid duplicate keys
export const GODRIC_WAT_BANTER = [
  [
    { speaker: "godric", line: "Wat. What are you reading?" },
    { speaker: "wat", line: "It's a treatise on Damascus steel folding techniques from\u2014" },
    { speaker: "godric", line: "Is the floor swept?" },
    { speaker: "wat", line: "...No." },
    { speaker: "godric", line: "Then we don't need a treatise. We need a broom." },
  ],
  [
    { speaker: "godric", line: "The apprentice burned himself again." },
    { speaker: "wat", line: "It was only a small burn!" },
    { speaker: "godric", line: "That's what you said about your eyebrows. They still haven't grown back evenly." },
    { speaker: "wat", line: "...They're growing." },
  ],
  [
    { speaker: "godric", line: "Wat, hand me the number four tongs." },
    { speaker: "wat", line: "Which ones are the number fours?" },
    { speaker: "godric", line: "The ones I've told you forty times are the number fours." },
    { speaker: "wat", line: "...The flat ones?" },
    { speaker: "godric", line: "...Yes, Wat. The flat ones." },
  ],
  [
    { speaker: "godric", line: "I notice you've named the hammer again." },
    { speaker: "wat", line: "Her name is Margaret and she strikes TRUE, Godric!" },
    { speaker: "godric", line: "Hammers don't have names." },
    { speaker: "wat", line: "Then why did your father call his anvil 'Old Tom'?" },
    { speaker: "godric", line: "...That was different. Get back to work." },
  ],
  [
    { speaker: "godric", line: "Wat, what's the melting point of iron?" },
    { speaker: "wat", line: "1,538 degrees Celsius!" },
    { speaker: "godric", line: "...He'll do." },
  ],
  [
    { speaker: "godric", line: "[raises a hot iron bar toward Wat]" },
    { speaker: "wat", line: "[flinches violently]" },
    { speaker: "godric", line: "...We'll work on it." },
  ],
];

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — Economy Loop, Garrison Integration, Trade System
// ═══════════════════════════════════════════════════════════════

// ─── Seasonal Buyers ────────────────────────────────────────
export const SEASONAL_BUYERS = [
  {
    id: "local_merchant",
    name: "Wilham the Peddler",
    description: "Always here, never generous. Buys tools and trade goods at fair price.",
    seasons: ["spring", "summer", "autumn", "winter"],
    prefers: ["tool", "trade_good"],
    premium: 0,
    bulkBonus: 0.1,
    dialogue: "What have you got for me today, smith?",
  },
  {
    id: "arms_dealer",
    name: "Traveling Arms Dealer",
    description: "A scarred man in a fur cloak. Pays well for quality blades.",
    seasons: ["spring", "autumn"],
    prefers: ["weapon"],
    premium: 0.3,
    masterworkBonus: 0.5,
    dialogue: "Let me see your finest steel. I have buyers who pay for edges.",
  },
  {
    id: "church_procurement",
    name: "Brother Aldhelm",
    description: "Buying ironwork for the cathedral. Favors decorative pieces and bells.",
    seasons: ["summer"],
    prefers: ["trade_good"],
    premium: 0.2,
    dialogue: "The Bishop requires ironwork for the new chapel. Is anything suitable?",
  },
  {
    id: "mortimer_agent",
    name: "Lord Mortimer's Agent",
    description: "A quiet man with cold eyes. Offers gold for weapons and armor. At what cost?",
    seasons: ["winter"],
    prefers: ["weapon", "armor"],
    premium: 0.5,
    respectCost: -5,
    riskFlag: "soldToMortimer",
    dialogue: "My lord Mortimer has... interests. He pays well for discretion.",
    godricWarning: "My lord, Mortimer is no friend of ours. If those blades come back pointed at us, it's on YOUR conscience.",
  },
  {
    id: "foreign_merchant",
    name: "Henrik the Trader",
    description: "The foreign merchant from the Hanseatic cities. Only visits if welcomed through the Great Hall.",
    seasons: ["spring", "autumn"],
    prefers: ["trade_good", "tool"],
    premium: 0.4,
    requiresFlag: "welcomedHenrik",
    dialogue: "Your forge grows famous! I have buyers across the sea.",
  },
];

/**
 * Get buyers available this season, filtered by game state conditions.
 */
export function getAvailableBuyers(season, state) {
  const rulingHistory = state.greatHall?.rulingHistory || {};
  return SEASONAL_BUYERS.filter(buyer => {
    if (!buyer.seasons.includes(season)) return false;
    if (buyer.requiresFlag && !rulingHistory[buyer.requiresFlag]) return false;
    return true;
  });
}

/**
 * Calculate the price a buyer pays for an item.
 */
export function getBuyerPrice(buyer, item, inventoryCount) {
  let price = item.tradeValue || 0;
  // Premium for preferred categories
  if (buyer.prefers.includes(item.category)) {
    price = Math.round(price * (1 + buyer.premium));
  }
  // Masterwork bonus for arms dealer
  if (buyer.masterworkBonus && item.grade === "Masterwork") {
    price = Math.round(price * (1 + buyer.masterworkBonus));
  }
  // Bulk bonus (3+ items sold this season)
  if (buyer.bulkBonus && inventoryCount >= 3) {
    price = Math.round(price * (1 + buyer.bulkBonus));
  }
  return Math.max(1, price);
}

// ─── Forge Supply Events ────────────────────────────────────
export const FORGE_SUPPLY_EVENTS = [
  {
    id: "iron_shortage",
    name: "Iron Shortage",
    description: "The iron mines to the north have flooded. Iron shipments are delayed.",
    effect: "iron_price_double",
    duration: 2,
    godricComment: "Flood in the northern mines. Iron prices just doubled. I'll make do with what we have.",
  },
  {
    id: "charcoal_surplus",
    name: "Charcoal Surplus",
    description: "The charcoal burners had a bumper season. Coal is cheap.",
    effect: "coal_price_half",
    duration: 3,
    godricComment: "The charcoal burners are practically giving it away. Stock up while you can.",
  },
  {
    id: "traveling_master",
    name: "Traveling Master Smith",
    description: "A master smith passes through, selling superior steel bars at standard price.",
    effect: "steel_bonus_5",
    duration: 0,
    godricComment: "That old man knows things about steel I've never seen. I bought what I could.",
  },
  {
    id: "rust_in_stores",
    name: "Rust in the Stores",
    description: "Damp got into the iron stores. A third of the stock is ruined.",
    effect: "iron_loss_30",
    duration: 0,
    godricComment: "I told Wat to cover the iron bins. Did he listen? He did not.",
  },
  {
    id: "wats_misadventure",
    name: "Wat's Misadventure",
    description: "Wat dropped a crucible of molten iron on the bellows. Repairs will take a season.",
    effect: "forging_disabled",
    duration: 1,
    godricComment: "The boy dropped a CRUCIBLE on the BELLOWS. We're shut down until I fix them.",
  },
  {
    id: "kings_commission",
    name: "The King's Commission",
    description: "A royal courier demands weapons for the king's campaign. 50 denarii reward upon completion.",
    effect: "royal_reward_50",
    duration: 0,
    godricComment: "The King wants our steel. He pays 50 denarii. This isn't a request, my lord.",
  },
  {
    id: "iron_vein",
    name: "Iron Vein Discovered",
    description: "Prospectors found iron on your land. Invest 30 denarii for +3 iron per season.",
    effect: "iron_investment",
    duration: 0,
    investCost: 30,
    investReward: 3,
    godricComment: "There's iron in the eastern hills. If you invest, I'll never complain about supply again. Well. Not about iron.",
  },
];

/**
 * Select a supply event for the current season (20% chance per season after turn 3).
 * Returns null or a supply event object.
 */
export function rollForgeSupplyEvent(turn, usedEventIds) {
  if (turn < 4) return null;
  if (Math.random() > 0.2) return null;
  const available = FORGE_SUPPLY_EVENTS.filter(e => !usedEventIds.includes(e.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// ─── Forge Readiness Calculation ────────────────────────────
/**
 * Calculate equipment readiness of the garrison based on forged items.
 * Returns { readiness (0-100), armed, armored, quality, defenseBonus }.
 */
export function calculateForgeReadiness(equipped, garrison) {
  if (garrison <= 0) return { readiness: 0, armed: 0, armored: 0, quality: 0, defenseBonus: 0 };

  const weapons = equipped.filter(i => i.category === "weapon");
  const armor = equipped.filter(i => i.category === "armor");

  const armed = Math.min(weapons.length, garrison);
  const armored = Math.min(armor.length, garrison);

  const armedRatio = armed / garrison;
  const armoredRatio = armored / garrison;

  // Average quality of all military items
  const allMil = equipped.filter(i => i.militaryBonus > 0);
  const avgQuality = allMil.length > 0
    ? allMil.reduce((s, i) => s + (i.qualityScore || 50), 0) / allMil.length
    : 0;
  const qualityFactor = avgQuality / 100;

  // Weighted: arms (0.4) + armor (0.3) + quality (0.3)
  const readiness = Math.round(
    (armedRatio * 0.4 + armoredRatio * 0.3 + qualityFactor * 0.3) * 100
  );

  // Defense bonus: sum of all military bonuses, halved (it supplements, not replaces, garrison)
  const totalMilBonus = equipped.reduce((s, i) => s + (i.militaryBonus || 0), 0);

  return {
    readiness: Math.min(readiness, 100),
    armed,
    armored,
    quality: Math.round(avgQuality),
    defenseBonus: Math.round(totalMilBonus * 0.5),
  };
}
