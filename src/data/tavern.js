/**
 * tavern.js
 *
 * Content data for the Boar's Head Tavern:
 * flavor texts, Knight's Gambit config, Bard tales, riddles, stranger encounters.
 */

// ---------------------------------------------------------------------------
// Tavern flavor subtitles — one shown randomly per visit
// ---------------------------------------------------------------------------

export const TAVERN_SUBTITLES = [
  "The fire crackles. Ale flows. Secrets are cheap.",
  "A place for honest men and liars alike.",
  "Every coin wagered here was earned in sweat.",
  "The barkeep watches. He always watches.",
  "You smell woodsmoke, mutton, and ambition.",
  "The bard tunes his lute. The dice are warm.",
  "A stranger in the corner raises his cup to you.",
  "The floorboards creak with the weight of history.",
];

// ---------------------------------------------------------------------------
// Knight's Gambit — medieval rock-paper-scissors
// ---------------------------------------------------------------------------

export const GAMBIT_WEAPONS = {
  sword:  { name: "Sword",  symbol: "\u2694", beats: "arrow",  reason: "The blade cuts the bowstring" },
  shield: { name: "Shield", symbol: "\u26E8", beats: "sword",  reason: "The shield turns the blade" },
  arrow:  { name: "Arrow",  symbol: "\u27B6", beats: "shield", reason: "The arrow finds the gap in the shield" },
};

export const GAMBIT_WAGERS = [10, 25, 50, 100];
export const GAMBIT_MAX_ROUNDS = 5;

export const GAMBIT_WIN_LINES = [
  "Your blade strikes true!",
  "The stranger grunts and slides coins across the table.",
  "A fine strike, my lord.",
];

export const GAMBIT_LOSE_LINES = [
  "Too slow!",
  "The stranger grins. Your coins disappear.",
  "Perhaps try a different approach, my lord.",
];

export const GAMBIT_DRAW_LINES = [
  "Blades clash \u2014 no winner this round.",
  "A standoff. The tension mounts.",
  "Evenly matched.",
];

export const GAMBIT_SCRIBES_NOTE =
  "Games of chance and skill were ubiquitous in medieval taverns. Dice games (especially \u2018hazard,\u2019 the ancestor of craps) were so popular that kings repeatedly tried to ban them among soldiers. Knights and commoners alike wagered on everything from card games to cockfights. The Church condemned gambling, but taverns ignored the clergy \u2014 as they ignored most things.";

// ---------------------------------------------------------------------------
// Rats in the Cellar
// ---------------------------------------------------------------------------

export const RATS_DURATION_MS = 20000;
export const RATS_GRID_SIZE = 4; // 4x4
export const RATS_FOOD_PER_ESCAPE = 2;

export const RATS_RATINGS = [
  { min: 0,  max: 5,  label: "The rats feast tonight.",               reward: 0,  foodPerEscape: 2 },
  { min: 6,  max: 9,  label: "A fair effort, my lord.",               reward: 0,  foodPerEscape: 1 },
  { min: 10, max: 14, label: "Well done! The cellar is mostly clear.", reward: 15, foodPerEscape: 1 },
  { min: 15, max: 99, label: "A legendary ratter! The cats are jealous.", reward: 25, foodPerEscape: 0 },
];

export const RATS_SCRIBES_NOTE =
  "Vermin destroyed vast quantities of stored grain in the Middle Ages \u2014 some historians estimate rats consumed up to a third of Europe\u2019s food supply. The Black Death itself was spread by fleas carried on rats. Cats were valued as working animals precisely because they protected grain stores. A good mouser was worth more than many farm tools.";

// ---------------------------------------------------------------------------
// The Bard's Corner
// ---------------------------------------------------------------------------

export const BARD_TALES = [
  "You think your treasury is impressive? Mansa Musa of Mali carried so much gold on his pilgrimage to Mecca in 1324 that when he passed through Cairo, he gave away so much of it that he crashed Egypt's gold market FOR TWELVE YEARS. The man was so generous he broke an entire country's economy by accident.",
  "You drink coffee, yes? Thank a goat. An Ethiopian herder named Kaldi noticed his goats dancing \u2014 DANCING \u2014 after eating certain berries. Monks in Yemen brewed them into a drink to stay awake during prayers. By the 1400s, coffeehouses in Cairo and Istanbul were everywhere. Europeans didn't figure out coffee for another two hundred years. You're welcome.",
  "In 859 AD \u2014 that's almost 1,200 years ago \u2014 a woman named Fatima al-Fihri used her inheritance to build the University of al-Qarawiyyin in Fez, Morocco. It's still open TODAY. Oxford didn't exist for another 237 years. Harvard? Don't make me laugh. That's 777 years later.",
  "While European doctors were saying 'have you tried leeches?' the physician al-Zahrawi in C\u00f3rdoba, Spain was writing a 1,500-page medical encyclopedia with ILLUSTRATIONS of surgical instruments. He invented tools for removing cataracts from people's EYES. With a needle. On purpose. And it worked.",
  "In 1154, a Muslim geographer named al-Idrisi made a map for the King of Sicily that was more accurate than anything in Europe. Only one problem for you lot \u2014 south was at the TOP. Africa was on top, Europe was on the bottom. He wasn't wrong, by the way. There IS no real 'up' on a sphere. Think about that tonight.",
  "The Mongol Empire ran a postal system called the Yam. Horse relay stations every 25 miles across ALL of Central Asia. A message could travel from Beijing to Budapest in DAYS. Genghis Khan didn't conquer the world with just swords \u2014 he conquered it with really, really fast mail. Your Amazon package still takes a week.",
  "In the Kingdom of Ghana, salt was so valuable that traders would exchange it POUND FOR POUND with gold. Think about that. The same stuff you dump on french fries was worth its weight in treasure. Merchants from the Sahara carried salt blocks on camel caravans for MONTHS to trade in Timbuktu. Some salt blocks were used as money. You could literally lick your wallet.",
  "In the 900s, Baghdad had an entire street called the Suq al-Warraqin \u2014 the Stationers' Market \u2014 with over a HUNDRED shops selling nothing but handwritten books. They had poetry, science, philosophy, fiction. Meanwhile, some European monasteries owned maybe twelve books total and chained them to the shelves so nobody would steal them. Chained. Books.",
  "Zheng He was a Chinese Muslim admiral who commanded a fleet of 300 ships \u2014 some of them 400 feet long. Columbus had three ships. Three. And they were about 60 feet. Zheng He sailed to India, Arabia, and East Africa between 1405 and 1433. He brought back giraffes. GIRAFFES. The Chinese emperor was very confused.",
  "Hospitals in the Islamic world \u2014 called bimaristans \u2014 were free to everyone, regardless of religion or wealth. The one in Cairo had separate wards for different diseases, a pharmacy, and \u2014 I am not making this up \u2014 musicians who played soothing music to help patients heal. Your doctor's office has a four-month-old magazine. Think about that.",
  "You think Vikings only raided? They were businessmen! Arab silver coins called dirhams have been found in Viking graves in Sweden. The traveler Ibn Fadlan actually met the Vikings on the Volga River and wrote about them. He said they were the tallest people he'd ever seen and also... the least hygienic. He was very specific about that. Very. Specific.",
  "When people say 'from here to Timbuktu,' they mean 'the middle of nowhere.' But in the 1400s, Timbuktu \u2014 in present-day Mali \u2014 was one of the most important intellectual cities on EARTH. The Sankore Madrasah had 25,000 students. They studied astronomy, law, medicine, and mathematics. More students than most American colleges today. Nowhere? Please.",
  "In 807 AD, the Abbasid Caliph Harun al-Rashid sent Charlemagne \u2014 the King of the Franks \u2014 a water clock. It had twelve mechanical knights that popped out on the hour. Charlemagne's people thought it was MAGIC. They literally couldn't figure out how it worked. Meanwhile in Baghdad, it was just a nice gift. A regifting, probably.",
  "Chess was invented in India, picked up by Persian scholars, then carried across the Islamic world by traders and travelers. The pieces got Arabic names \u2014 'checkmate' comes from 'shah mat,' which means 'the king is helpless.' Europeans learned the game from Muslims in Spain. So every time you play chess, you're playing a 1,400-year-old import.",
  "The Alhambra in Granada, Spain, built by the Moors, has rooms where the architecture is designed so that a whisper in one corner can be heard perfectly in the opposite corner \u2014 across the entire room. They also carved 'There is no conqueror but God' into the walls over 9,000 times. Nine. Thousand. That's not decoration. That's dedication.",
];

export const BARD_STATE_COMMENTS = [
  { condition: (s) => s.denarii > 800, text: "Your coffers overflow, my lord. Careful \u2014 Mansa Musa was rich too, and he accidentally destroyed Egypt's economy." },
  { condition: (s) => s.denarii < 50, text: "I've seen beggars with heavier purses. Perhaps try taxing something. Anything. The air, maybe." },
  { condition: (s) => s.food < 20, text: "The peasants are eating bark soup. I know because I just had a bowl. It was terrible." },
  { condition: (s) => s.food > 500, text: "Your granaries could feed an army! Which is good, because armies tend to show up when you have food." },
  { condition: (s) => s.population > 300, text: "Your kingdom swells! More people means more taxes, more soldiers, and more complaints. Mostly complaints." },
  { condition: (s) => s.population < 50, text: "It's getting quiet around here. I can hear my own echo. That's never a good sign for a kingdom." },
  { condition: (s) => s.garrison > 200, text: "Your army is fearsome! Though I notice they keep looking at YOUR castle. Just something I observed." },
  { condition: (s) => s.garrison === 0, text: "No army? Bold strategy. I once knew a lord who tried that. I say 'knew' because he's no longer a lord. Or alive." },
  { condition: (s) => s.turn === 1, text: "Ah, a new ruler! The last one? Don't ask. Just... don't open that closet in the east tower." },
  { condition: (s) => s.turn === 5, text: "Five turns in and still alive! That's better than Lord Pemberton. He didn't survive the opening feast." },
  { condition: (s) => s.turn >= 10 && s.turn < 15, text: "Ten turns! You've outlasted most rulers in this cursed kingdom. The bar is low, but still \u2014 well done." },
  { condition: (s) => s.buildings?.some(b => (typeof b === "string" ? b : b.type) === "school"), text: "A school! Fatima al-Fihri would be proud. Knowledge is the one treasure that can't be taxed. Yet." },
  { condition: (s) => s.buildings?.some(b => (typeof b === "string" ? b : b.type) === "market"), text: "A market! Soon traders will come from distant lands, selling exotic goods, exotic diseases, and exotic lies." },
  { condition: () => true, text: "Your manor endures, my lord. Not every lord can say that. The last three couldn't, for instance." },
];

export const BARD_RIDDLES = [
  {
    question: "I am sought by kings but made by the sea. Caravans die for me. I preserve your meat but I'm not loyalty. What am I?",
    answer: "Salt",
    options: ["Salt", "Ice", "Honey"],
    correct: "Salt! The white gold of the Sahara. You'd have done well in Timbuktu.",
    wrong: "No, friend. It's salt. Wars were fought over it. You put it on eggs.",
  },
  {
    question: "I have cities but no houses, forests but no trees, and water but no fish. What am I?",
    answer: "A map",
    options: ["A map", "A painting", "A dream"],
    correct: "A map! al-Idrisi would toast you from his workshop in Sicily.",
    wrong: "It's a map, friend. Perhaps you need one \u2014 you seem a bit lost.",
  },
  {
    question: "The more you take, the more you leave behind. What am I?",
    answer: "Footsteps",
    options: ["Footsteps", "Memories", "Debts"],
    correct: "Footsteps! You think like a Silk Road traveler.",
    wrong: "Footsteps, my lord. Like the ones merchants leave across a thousand miles of desert.",
  },
  {
    question: "I can be cracked, made, told, and played. What am I?",
    answer: "A joke",
    options: ["A joke", "An egg", "A promise"],
    correct: "A joke! And you, my lord, are no joke. Usually.",
    wrong: "A joke! Like the one about the knight who forgot his armor. It didn't end well for him either.",
  },
  {
    question: "I have hands but cannot clap. I have a face but cannot smile. Harun al-Rashid sent me as a gift.",
    answer: "A clock",
    options: ["A clock", "A puppet", "A shield"],
    correct: "A clock! The great water clock of Baghdad. Charlemagne thought it was witchcraft.",
    wrong: "A clock, my lord. Specifically, the legendary water clock that baffled the Franks.",
  },
];

// ---------------------------------------------------------------------------
// Easter Eggs
// ---------------------------------------------------------------------------

export const WALL_STATIC_GRAFFITI = [
  { text: "Aldric owes me 3d", strikethrough: true },
  { text: "God save the King", icon: "\u266B" },
  { text: "HERE BE RATS", large: true },
];

export const WALL_DYNAMIC_CONDITIONS = [
  { condition: (s) => (s.tavern?.gambitTotalWins ?? 0) >= 3, text: "BEWARE THE LORD\u2019S BLADE \u2014 a worthy gambler" },
  { condition: (s) => s.food < 30, text: "BY ORDER: Food rationing in effect" },
  { condition: (s) => s.garrison > 12, text: "SOLDIERS WANTED \u2014 see the garrison captain" },
  { condition: (s) => s.denarii > 800, text: "The lord drinks well tonight" },
  { condition: (s) => s.turn > 10, text: "The seasons turn. How long will this lord last?" },
];

export const STRANGER_ENCOUNTERS = [
  { type: "tip",     text: "I hear trouble is coming with the next season. Prepare wisely." },
  { type: "trade",   text: "I have provisions for sale. 150d for a generous supply.", cost: 150, reward: { food: 10 } },
  { type: "warning", text: null }, // dynamically generated based on lowest resource
];

export const VISIT_MILESTONES = [
  { visits: 3, message: "You\u2019re becoming a regular, my lord." },
  { visits: 5, graffiti: "THE LORD\u2019S SEAT" },
  { visits: 10, message: "On the house, my lord. You\u2019ve earned it." },
];

// ---------------------------------------------------------------------------
// Marta the Merchant \u2014 Femme Sole
// ---------------------------------------------------------------------------

/**
 * Market tips: strings or functions that take game state and return a string.
 * 40% chance per interaction.
 */
export const MARTA_MARKET_TIPS = [
  "Cloth fetches triple what raw wool brings. If you have a pasture, build a fulling mill. The margin is worth the upkeep.",
  "Honey travels well and never spoils. Apiaries are cheap to maintain and the merchants at Champagne pay handsomely for it.",
  (state) => {
    const total = Object.values(state.inventory || {}).reduce((s, v) => s + v, 0);
    const pct = Math.round((total / (state.inventoryCapacity || 300)) * 100);
    return `Your inventory is ${pct}% full. When stores overflow, production goes to waste. Sell before you\u2019re stuffed \u2014 or build more storage.`;
  },
  "Iron is expensive to mine but every castle upgrade demands it. Control your own supply or you\u2019ll pay through the nose at market.",
  (state) => {
    const bUpkeep = (state.buildings || []).length * 3;
    const mil = state.military?.garrison || {};
    const gUpkeep = (mil.levy || 0) * 1 + (mil.menAtArms || 0) * 3 + (mil.knights || 0) * 8;
    return `I\u2019ve seen lords go bankrupt building everything at once. Your upkeep is roughly ${bUpkeep + gUpkeep}d per season \u2014 can your income cover that?`;
  },
  "The Church buys herbs and honey for their infirmaries. A steady supplier earns both coin and favor.",
  "Grain is cheap. Ale is not. A brewery turns 2 grain into ale worth 5 times as much. That\u2019s not magic \u2014 that\u2019s commerce.",
  "Timber and clay are builder\u2019s goods \u2014 you won\u2019t sell them for much, but without them you can\u2019t expand. Think of them as investment, not income.",
  "Net income matters more than gross. A lord with 50d income and 45d upkeep is poorer than one with 20d income and 5d upkeep.",
  "Buy low in spring, sell high before winter. Prices shift with the seasons \u2014 though you\u2019d have to watch the market closely to see it.",
];

/**
 * Trade stories: historical anecdotes. 35% chance per interaction.
 */
export const MARTA_TRADE_STORIES = [
  "I learned my craft at the Champagne Fairs \u2014 six weeks of trading with merchants from Venice, Bruges, Barcelona. Letters of credit instead of hauling coin. The Italians invented banking, you know. We just borrowed it.",
  "In Cologne, the guild tried to bar me from trading. I invoked my right as femme sole \u2014 a woman trading alone, answerable to no husband. The magistrate upheld it. The guild master\u2019s face was worth more than any profit that year.",
  "The Hanseatic League controls trade across the North Sea and the Baltic. Hundreds of towns, thousands of merchants, all bound by agreements. They don\u2019t need armies \u2014 they have monopolies. That\u2019s a different kind of power.",
  "A merchant in Bruges told me about something called a \u2018bill of exchange.\u2019 You deposit money in one city and withdraw it in another without carrying a single coin on the road. Brilliant. The bandits hate it.",
  "The just price doctrine says I must sell at a fair price \u2014 not whatever the market will bear. The Church enforces it. In practice, \u2018fair\u2019 means whatever the guild decides. Funny how that works.",
  "Spices from the East \u2014 pepper, cinnamon, cloves \u2014 are worth more per ounce than silver. A single shipload of pepper can make a Venetian merchant richer than most lords. And here you are, selling grain.",
  "Wool is England\u2019s greatest export. The Flemish weavers buy it raw and sell it back as finished cloth at ten times the price. If that doesn\u2019t teach you the value of manufacturing, nothing will.",
  "I once saw a merchant fined and pilloried for selling short measures of ale. The guild inspector found his tankards had false bottoms. Trust is the only currency that matters in the long run.",
];

/**
 * One-time offers. Each can appear only once per playthrough.
 * canAccept(state) determines whether Accept button is shown.
 */
export const MARTA_OFFERS = [
  {
    id: "bulk_wool",
    title: "Bulk Wool Deal",
    description: "I have a buyer in Flanders offering 40d for 5 wool. Interested?",
    costText: "5 wool",
    rewardText: "+40d (normally ~30d)",
    canAccept: (s) => (s.inventory?.wool ?? 0) >= 5,
    cantAcceptText: "Come back when you have the goods.",
  },
  {
    id: "spice_investment",
    title: "Spice Investment",
    description: "A shipment of pepper is coming through next season. I can reserve you a share for 75d now. You\u2019ll be able to sell it for 120d next season.",
    warning: "There\u2019s always risk on the roads.",
    costText: "75d now",
    rewardText: "120d next season (85% chance)",
    canAccept: (s) => s.denarii >= 75,
    cantAcceptText: "You don\u2019t have the coin for this venture.",
  },
  {
    id: "trade_route_tip",
    title: "Trade Route Tip",
    description: "For 30d, I\u2019ll share what I know about which goods fetch the best prices right now.",
    costText: "30d",
    rewardText: "Market intelligence",
    canAccept: (s) => s.denarii >= 30,
    cantAcceptText: "Information isn\u2019t free, my lord.",
  },
  {
    id: "storage_deal",
    title: "Storage Expansion",
    description: "I know a man with an empty barn. For 50d, I can increase your storage capacity by 20 units. Interested?",
    costText: "50d (one-time)",
    rewardText: "+20 inventory capacity",
    canAccept: (s) => s.denarii >= 50 && !(s.tavern?.martaStoragePurchased),
    cantAcceptText: "You\u2019ve already expanded your storage through my contact.",
  },
];

export const MARTA_SCRIBES_NOTE =
  "The legal status of \u2018femme sole\u2019 allowed medieval women to own businesses, sign contracts, and sue in court \u2014 rights that married women (\u2018femme covert\u2019) did not have under the doctrine of coverture. Many of the most successful brewsters, silk workers, and traders in medieval cities were femme sole. Marta represents thousands of real women who built commercial empires within \u2014 and sometimes despite \u2014 the legal systems of their time.";

// ---------------------------------------------------------------------------
// Old Aldric the Veteran
// ---------------------------------------------------------------------------

/**
 * Military counsel: strings or functions that take game state.
 * 40% chance per interaction.
 */
export const ALDRIC_MILITARY_COUNSEL = [
  (state) => `Your garrison stands at ${state.garrison ?? 0} men. Enough to hold the walls? Depends on the walls. A palisade needs more men to defend than stone. Upgrade when you can.`,
  "Five soldiers cost less than one siege. Maintain your garrison even in peacetime. The lord who disbands his army to save coin pays with his life.",
  "Walls don\u2019t fight. Men do. But men behind walls fight five times their number. That\u2019s the mathematics of defense \u2014 stone is the great equalizer.",
  "A knight costs as much to equip as a small farm produces in a year. That\u2019s why kings tax \u2014 and that\u2019s why peasants resent it. Every sword on the wall is food off a table.",
  "Iron is the spine of defense. Without it, no swords, no armor, no arrowheads, no gate reinforcements. If you\u2019re not mining iron, you\u2019re borrowing time.",
  "Morale matters more than numbers. Ten men who believe in their lord will hold a gate longer than fifty who don\u2019t. Keep your people content or your soldiers will desert when it matters.",
  "The best castle in Christendom falls if it runs out of food. Siege warfare is just starvation with patience. Your food stores ARE your defense.",
  "I\u2019ve seen lords spend everything on soldiers and nothing on walls. I\u2019ve seen lords build grand castles with no one to defend them. Balance. Always balance.",
  "Mercenaries fight for coin, not loyalty. They\u2019re useful in a crisis but they\u2019ll switch sides the moment your treasury runs dry. Build your own garrison.",
  (state) => {
    const remaining = 40 - (state.turn ?? 1);
    return `Castle upgrades are expensive but permanent. Soldiers eat every season. Think about which investment pays off over ${remaining} more turns.`;
  },
];

/**
 * War stories: historical accounts. 35% chance per interaction.
 */
export const ALDRIC_WAR_STORIES = [
  "I was at Acre. Three years of siege. The heat, the flies, the disease \u2014 more men died of fever than of arrows. When the city finally fell, I didn\u2019t feel victory. I felt tired. That\u2019s what war is: being tired and afraid for a very long time.",
  "The castle at Ch\u00e2teau Gaillard was Richard the Lionheart\u2019s masterpiece \u2014 three rings of walls, built in two years, overlooking the Seine. The French took it in six months. They found a latrine chute that led inside the outer wall. A castle is only as strong as its weakest point.",
  "At Cr\u00e9cy, English longbowmen cut down French knights like wheat. Fifteen thousand arrows per minute from six thousand bows. The age of the mounted knight ended that day, though it took a hundred years for anyone to admit it.",
  "I knew a siege engineer who could calculate exactly how many days a castle\u2019s food stores would last by counting the smoke from their chimneys. \u2018More fires means more mouths,\u2019 he said. \u2018When the fires stop, they\u2019re eating the horses.\u2019 Grim arithmetic.",
  "The Mongols \u2014 I never fought them, thank God \u2014 would divert rivers to flood castle foundations. They\u2019d catapult diseased corpses over walls. They understood that a siege is just a problem to solve, and they solved problems without mercy.",
  "William the Conqueror built a motte-and-bailey at Hastings in two weeks. Wood and earth, not stone. Ugly but functional. By the time the English organized a counterattack, he was behind walls. Speed wins wars.",
  "The Children\u2019s Crusade. Thousands of young people, some not much older than you, marched toward the Holy Land believing faith alone would open the gates of Jerusalem. Most never arrived. Some were sold into slavery. Faith without strategy is just hope \u2014 and hope is not a plan.",
  "At the Siege of Rochester, King John\u2019s men tunneled under the castle tower and set fire to forty fat pigs to collapse the foundation. The tower fell. Forty pigs changed the course of English history. Never underestimate creative problem-solving.",
];

/**
 * Training offers. Each can appear only once per playthrough.
 */
export const ALDRIC_TRAINING_OFFERS = [
  {
    id: "basic_drill",
    title: "Basic Drill",
    description: "Your men look soft. For 30d, I\u2019ll drill them for a week. They won\u2019t thank me, but they\u2019ll fight better.",
    costText: "30d",
    rewardText: "Garrison readiness for 3 seasons",
    canAccept: (s) => s.denarii >= 30 && (s.garrison ?? 0) > 0,
    cantAcceptText: "You need both coin and a garrison to drill.",
  },
  {
    id: "wall_inspection",
    title: "Wall Inspection",
    description: "Let me walk your walls. I\u2019ll find the weak points before an enemy does. Cost you 20d for my time.",
    costText: "20d",
    rewardText: "Defense assessment",
    canAccept: (s) => s.denarii >= 20,
    cantAcceptText: "Even advice costs coin, my lord.",
  },
  {
    id: "recruit_referral",
    title: "Recruit Referral",
    description: "I know a man \u2014 solid fighter, no lord to serve. He\u2019d join your garrison for 40d signing bonus.",
    costText: "40d",
    rewardText: "+2 garrison",
    canAccept: (s) => s.denarii >= 40,
    cantAcceptText: "Good soldiers cost good coin. Come back with 40d.",
  },
  {
    id: "war_story_lesson",
    title: "Garrison Morale",
    description: "Gather your garrison tonight. I\u2019ll tell them about Acre. Men who understand what they\u2019re defending fight harder.",
    costText: "Free",
    rewardText: "+2 families (morale draws settlers)",
    canAccept: (s) => (s.garrison ?? 0) > 0,
    cantAcceptText: "You have no garrison to inspire.",
  },
];

export const ALDRIC_SCRIBES_NOTE =
  "Medieval soldiers were not the gleaming knights of legend. Most were ordinary men \u2014 farmers, tradesmen, younger sons \u2014 pressed into service by feudal obligation or drawn by the promise of pay and plunder. A typical soldier\u2019s life was monotony punctuated by terror: months of marching, digging, and waiting, then minutes of chaos. Those who survived carried the experience for the rest of their lives. Veterans like Aldric were repositories of hard-won knowledge in an age before military academies.";
