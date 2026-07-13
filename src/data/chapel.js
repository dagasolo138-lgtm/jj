/**
 * chapel.js
 *
 * Data definitions for the Chapel of St. Dunstan.
 * Dialogue pools, shop inventory, moral dilemmas, manuscript facts.
 */

// ---------------------------------------------------------------------------
// Father Anselm — Parish Priest
// ---------------------------------------------------------------------------

export const ANSELM_GREETINGS = [
  "Ah, my lord graces us with a visit. The Almighty is watching. He's always watching. That's sort of His thing.",
  "Welcome to God's house, my lord. Please note the new crack in the ceiling. That's not a metaphor. It's an actual crack.",
  "My lord! I was just praying for guidance on how to tell you the chapel needs repairs. And here you are! Coincidence? Or divine intervention? Either way \u2014 the roof leaks.",
  "Blessings upon you, my lord. The peasants have been confessing again. I cannot share details, but I CAN say your cook is stealing your cheese.",
  "Ah, you've come to the chapel. Your soul must be heavy. Don't worry \u2014 I charge by the sin, and I offer bulk discounts.",
];

export const TITHE_RESPONSES = {
  generous: [
    "A generous tithe, my lord. God smiles upon those who give freely. I also smile. See? This is my smiling face.",
    "Splendid! This will repair the chapel roof. It leaks directly onto the altar. God sends rain, but I don't think He means it to land THERE.",
    "The Almighty rewards generosity, my lord. Usually in the afterlife, but I'll put in a good word for the 'right now' as well.",
  ],
  stingy: [
    "That's... that's all? My lord, the CANDLES cost more than this. I'm not angry. Just disappointed. Like God. God is also disappointed.",
    "I see. Well. I suppose the chapel can survive another winter without a door. Doors are a luxury, really.",
    "Hmm. The last lord who tithed this little was struck by lightning. I'm not saying God did it. I'm not saying God DIDN'T do it.",
  ],
  none: [
    "No tithe? Bold. Very bold. I'll be over here. Praying. For your SOUL, my lord. It needs the help.",
    "You know, in some kingdoms, failing to tithe results in excommunication. I'm just sharing information. Casually. While looking at you.",
    "The church bell is broken, the altar wine has turned to vinegar, and you tithe NOTHING? I'll just add 'divine wrath' to our list of concerns.",
  ],
};

export const TITHE_EFFECTS = {
  generous: { faith: 12, piety: 8 },
  stingy: { faith: 4, piety: 2 },
  none: { faith: 0, piety: -2 },
};

// ---------------------------------------------------------------------------
// Brother Caedmon — Traveling Monk Shop
// ---------------------------------------------------------------------------

export const CAEDMON_GREETINGS = [
  "Peace be with you, my lord! I've traveled from the monastery with goods and gossip. The goods cost money. The gossip is free.",
  "Greetings! I've just arrived from the scriptorium. My fingers are stained with ink, my back aches from copying, and I have WONDERFUL things to sell you.",
  "My lord! Brother Caedmon, at your service. I carry herbs from the monastery garden, relics of questionable origin, and one genuinely excellent piece of cheese.",
  "I've walked forty miles to reach your village. My feet are blistered, my robes are muddy, and I am absolutely ready to do business.",
];

export const SHOP_ITEMS = [
  {
    id: "monastery_herbs",
    name: "Monastery Herbs",
    icon: "\u2618",
    cost: 10,
    description: "Medicinal herbs grown by monks who talk to the plants. The plants seem to like it.",
    effectText: "Heals 5 pop during plague events",
    effects: { food: 5 },
  },
  {
    id: "illuminated_letter",
    name: "Illuminated Letter",
    icon: "\u2726",
    cost: 25,
    description: "A single capital 'A' painted in gold leaf with a tiny dragon in the corner. Took a monk three weeks.",
    effectText: "+5 Faith, +3 Piety",
    effects: { faith: 5, piety: 3 },
  },
  {
    id: "beeswax_candles",
    name: "Beeswax Candles",
    icon: "\u29BF",
    cost: 8,
    description: "They smell holy. Father Anselm says the current candles smell like 'a goat's opinion.'",
    effectText: "+3 Faith",
    effects: { faith: 3 },
  },
  {
    id: "relic_tooth",
    name: "Relic: Tooth of St. Brendan",
    icon: "\u2629",
    cost: 40,
    description: "Allegedly. Brother Caedmon found it 'near a holy site.' The holy site was a market.",
    effectText: "+10 Faith, attracts pilgrims",
    effects: { faith: 10 },
  },
  {
    id: "quill_ink",
    name: "Quill & Ink Set",
    icon: "\u2767",
    cost: 15,
    description: "For your scribes. Or for writing angry letters to the bishop. Both valid uses.",
    effectText: "Scriptorium bonus: +5d on successful copies",
    effects: {},
  },
  {
    id: "monastery_cheese",
    name: "Monastery Cheese",
    icon: "\u25C9",
    cost: 5,
    description: "Aged eighteen months by monks who took a vow of silence. The cheese, however, is LOUD.",
    effectText: "+2 Happiness, +3 Food",
    effects: { happiness: 2, food: 3 },
  },
];

// ---------------------------------------------------------------------------
// Moral Dilemmas
// ---------------------------------------------------------------------------

export const MORAL_DILEMMAS = [
  {
    id: "starving_widow",
    title: "The Starving Widow",
    narrative: "A widow with three children has been caught stealing grain from the church stores. Father Anselm turns to you. The law says she must pay a fine of 15 denarii or spend a week in the stocks. But her children are starving...",
    choices: [
      {
        label: "Show mercy \u2014 forgive the debt",
        iconName: "Heart",
        result: "You wave away the fine. The widow weeps with gratitude. Father Anselm nods approvingly \u2014 'Mercy is the mark of a good lord.' Word spreads through the village. Your people see a ruler who cares.",
        effects: { faith: 12, happiness: 8, piety: 10 },
      },
      {
        label: "Enforce the law \u2014 she must pay",
        iconName: "Scale",
        result: "The law is the law. The widow scrapes together what she can, and her neighbors contribute the rest. Order is maintained, but the village whispers about your coldness. The children go hungry another week.",
        effects: { denarii: 15, faith: -5, happiness: -10, piety: -3 },
      },
      {
        label: "Pay her fine yourself from the treasury",
        iconName: "Coins",
        result: "You reach into the treasury and count out 15 denarii yourself. Father Anselm's eyebrows rise nearly off his face. 'My lord, that is... uncommonly generous.' The village buzzes with admiration. The widow names her next child after you.",
        effects: { denarii: -15, faith: 15, happiness: 12, piety: 15 },
      },
    ],
  },
  {
    id: "questionable_relic",
    title: "The Questionable Relic",
    narrative: "A traveling friar claims to possess a bone of Saint Peter himself. He wants to install it in your chapel for a 'small donation' of 50 denarii. Father Anselm is suspicious \u2014 'There are enough pieces of Saint Peter traveling Europe to build three whole saints.' But the peasants are excited...",
    choices: [
      {
        label: "Buy the relic \u2014 the people want it",
        iconName: "Star",
        result: "The relic is installed with great ceremony. Peasants come from neighboring villages to see it. Father Anselm mutters about 'theological standards' but admits the chapel has never been so popular. Pilgrim donations trickle in.",
        effects: { denarii: -50, faith: 20, happiness: 15, piety: 5 },
      },
      {
        label: "Refuse \u2014 it's probably fake",
        iconName: "Eye",
        result: "You send the friar packing. Some villagers are disappointed, but Father Anselm is relieved. 'A wise decision, my lord. The Church has enough fake bones to fill a charnel house.' Your reputation for prudence grows.",
        effects: { faith: -3, happiness: -5, piety: 8 },
      },
      {
        label: "Demand the friar prove its authenticity first",
        iconName: "BookOpen",
        result: "You request documentation. The friar sputters, produces a suspiciously fresh-looking certificate, then quietly leaves town in the night. Father Anselm chuckles. 'I believe that's what we call divine discernment, my lord.'",
        effects: { faith: 5, happiness: 3, piety: 12 },
      },
    ],
  },
  {
    id: "herbalist_trial",
    title: "The Herbalist's Trial",
    narrative: "Old Margery, the village herbalist, has been accused of witchcraft by a jealous neighbor. She heals with plants and prayers \u2014 but some say her prayers aren't to God. Father Anselm says, 'The Church demands we investigate.' The peasants are divided. Margery has saved many lives...",
    choices: [
      {
        label: "Protect Margery \u2014 dismiss the charges",
        iconName: "Shield",
        result: "You declare Margery innocent and warn the accuser about bearing false witness. Margery continues her work, grateful but cautious. Some villagers praise your judgment; others whisper that you've sided with a witch. Father Anselm looks uneasy.",
        effects: { faith: -8, happiness: 10, piety: -5 },
      },
      {
        label: "Hold a fair trial with witnesses",
        iconName: "Scale",
        result: "You convene a proper hearing. Witnesses testify to Margery's healing \u2014 all herbs, all prayers to saints. The accuser's jealousy becomes obvious. Justice is served publicly, and both the Church and the people feel respected.",
        effects: { denarii: -5, faith: 10, happiness: 8, piety: 10 },
      },
      {
        label: "Send her to the bishop for judgment",
        iconName: "Cross",
        result: "You defer to the bishop's authority. Margery is taken away for questioning. Some villagers are furious \u2014 she was their only healer. Father Anselm nods solemnly. 'The Church's judgment is final.' Months later, Margery is quietly released, but she never returns.",
        effects: { faith: 5, happiness: -15, piety: 3 },
      },
    ],
  },
  {
    id: "bishops_demand",
    title: "The Bishop's Demand",
    narrative: "A letter arrives bearing the bishop's seal. He demands an extra tithe \u2014 10% of your treasury \u2014 to fund a new cathedral in the city. Father Anselm reads it aloud, then looks at you nervously. 'The bishop is... not someone you want as an enemy, my lord.'",
    choices: [
      {
        label: "Pay in full \u2014 stay in the Church's good graces",
        iconName: "Church",
        result: "You send the full amount. The bishop's reply is warm and effusive. Father Anselm receives a commendation letter. Your chapel is listed as a 'model parish.' Your treasury, however, feels considerably lighter.",
        effects: { denarii: -60, faith: 20, happiness: -5, piety: 18 },
      },
      {
        label: "Negotiate \u2014 offer half and plead poverty",
        iconName: "MessageSquare",
        result: "You write a carefully worded letter about your estate's difficulties and enclose half the requested amount. The bishop's reply is curt but accepting. Father Anselm exhales. 'Could have been worse, my lord. Much worse.'",
        effects: { denarii: -30, faith: 8, piety: 8 },
      },
      {
        label: "Refuse \u2014 your people need that money",
        iconName: "AlertTriangle",
        result: "You pen a polite but firm refusal. Father Anselm goes pale. 'My lord, I hope you know what you're doing.' The bishop's next letter is decidedly less friendly. Whispers of 'that rebellious lord' reach neighboring parishes.",
        effects: { faith: -15, happiness: 5, piety: -12 },
      },
    ],
  },
  {
    id: "caedmons_proposal",
    title: "Brother Caedmon's Proposal",
    narrative: "Brother Caedmon approaches you with an unusual idea: he wants to start a small school in the chapel where village children can learn to read and write. Father Anselm frowns. 'Reading is for monks and nobles. If the peasants learn letters, they'll start reading things they shouldn't...'",
    choices: [
      {
        label: "Fund the school \u2014 knowledge for all",
        iconName: "BookOpen",
        result: "You provide 40 denarii for supplies. Within weeks, a dozen children crowd the chapel each morning, learning their letters. Brother Caedmon beams. Even Father Anselm admits the children are better behaved. 'Though I still say it'll end in trouble,' he adds.",
        effects: { denarii: -40, faith: 15, happiness: 20, piety: 12 },
      },
      {
        label: "Allow it but don't fund it",
        iconName: "Scroll",
        result: "You give Brother Caedmon permission but no coin. He scrounges supplies from the monastery and teaches a handful of children with charcoal on slate. It's modest, but it's a start. Father Anselm watches from a distance, arms crossed.",
        effects: { faith: 5, happiness: 5, piety: 5 },
      },
      {
        label: "Refuse \u2014 Father Anselm has a point",
        iconName: "X",
        result: "You side with the parish priest. Brother Caedmon's face falls. 'As you wish, my lord.' The children continue their days in the fields. Father Anselm looks relieved, but there's something in his eyes that might be regret.",
        effects: { faith: -3, happiness: -5, piety: -2 },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Manuscript Mini-Game
// ---------------------------------------------------------------------------

export const MANUSCRIPT_SYMBOLS = [
  "\u2629", // ☩
  "\u2726", // ✦
  "\u2618", // ☘
  "\u269C", // ⚜
  "\u2720", // ✠
  "\u25C6", // ◆
  "\u2756", // ❖
  "\u26EA", // ⛪
];

export const MANUSCRIPT_FACTS = [
  "Monks spent up to 3 YEARS copying a single book by hand. One mistake and they'd have to scrape the ink off with a knife and start the page over.",
  "Parchment was made from animal skin \u2014 usually sheep or goat. A single Bible required the hides of about 250 sheep. That's an entire flock for one book.",
  "Scribes often left complaints in the margins: 'My hand is so cold,' 'This ink is terrible,' and the classic: 'Now I've written the whole thing \u2014 for God's sake, give me a drink.'",
  "The most expensive color in manuscript painting was ultramarine blue, made from ground lapis lazuli imported from Afghanistan. It cost more than gold.",
  "Some monks drew doodles in the margins when they got bored \u2014 knights fighting snails, rabbits with swords, and cats playing bagpipes. Medieval margins were basically medieval memes.",
  "Books were so valuable they were chained to library shelves. Not to stop people from reading them \u2014 to stop people from STEALING them.",
];

// ---------------------------------------------------------------------------
// Piety flavor text
// ---------------------------------------------------------------------------

export const PIETY_FLAVOR = [
  { max: 20, text: "Father Anselm prays for you nightly. Not the good kind of praying." },
  { max: 50, text: "The Church considers you... adequate. Not a compliment." },
  { max: 80, text: "You are in good standing. The bishop knows your name. In a positive way." },
  { max: Infinity, text: "The Church sings your praises. Literal songs. They wrote a hymn. It's not very good, but it's the thought that counts." },
];
