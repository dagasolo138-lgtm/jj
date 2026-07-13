/**
 * audience.js
 *
 * Great Hall Phase 3 — Audience Encounters for The Lord's Ledger.
 *
 * 20 audience encounters that appear in the Great Hall throne room.
 * Each encounter presents a petitioner with a request and 2-4 response
 * options, each carrying tradeoff consequences across four domains.
 *
 * Schema:
 *   id            — unique string 'aud_NNN'
 *   name          — petitioner display name
 *   type          — beggar|merchant|priest|soldier|gossip|inventor|child|
 *                   healer|monk|criminal|entertainer|petitioner|advisor|
 *                   mystery|tradition|staff|collective|specialist|dispute_light
 *   tone          — serious|comedic|tense (defaults serious)
 *   preview       — one-line physical description shown before granting audience
 *   speech        — the petitioner's spoken plea (2-4 sentences)
 *   responses[]   — 2-4 options the lord may choose
 *     label       — short button text
 *     text        — the lord's spoken ruling
 *     consequences — { people, treasury, church, military } — all 4 keys required
 *     aftermath   — narrative result (1-2 sentences)
 *   historicalNote — real medieval history at 6th grade level
 *
 * Consequence ranges:
 *   Trivial: +/-1 | Small: +/-2-3 | Medium: +/-4-5
 *   Large: +/-6-8 | Massive: +/-9-12
 */

const AUDIENCE_ENCOUNTERS = [

  // ---------------------------------------------------------------
  // 1. OLD MARTHA (Beggar, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_001",
    name: "Old Martha",
    type: "beggar",
    tone: "serious",
    preview: "A frail woman clutching a ragged shawl.",
    speech:
      "My lord, I've not eaten in three days. My husband died at harvest " +
      "and the village will not share their stores with a widow. I beg " +
      "you — even scraps from the kitchen would keep my bones together " +
      "another week.",
    responses: [
      {
        label: "Feed her from the kitchen",
        text:
          "Send her to the kitchen. Tell the cook she eats until she's full.",
        consequences: { people: 3, treasury: -1, church: 0, military: 0 },
        aftermath:
          "Martha weeps with gratitude and kisses the hem of your cloak. " +
          "Word spreads through the village that the lord feeds the hungry, " +
          "and two other widows appear at the gate by evening.",
      },
      {
        label: "Give her work in the manor",
        text:
          "No charity — but I'll not let you starve. Report to the laundress " +
          "tomorrow at dawn. You'll earn your bread.",
        consequences: { people: 1, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Martha nods slowly, wiping her eyes. She proves a steady worker " +
          "and is soon tending herbs in the kitchen garden. The steward " +
          "notes that dignity and bread make a fine pair.",
      },
      {
        label: "Turn her away",
        text:
          "I cannot feed every mouth that comes to my door. The village " +
          "must look after its own.",
        consequences: { people: -4, treasury: 0, church: -1, military: 0 },
        aftermath:
          "Martha shuffles away without a word. The hall falls silent. " +
          "Father Aldous is seen shaking his head as he leaves, and the " +
          "village mutters about hard-hearted lords.",
      },
    ],
    historicalNote:
      "Widows in medieval England often faced destitution after a husband's " +
      "death. While the Church taught that caring for widows was a sacred " +
      "duty, in practice many were left to beg. Some manors established " +
      "'widow's portions' — small plots of land or grain allowances — but " +
      "these varied widely by region and the lord's generosity.",
  },

  // ---------------------------------------------------------------
  // 2. HENRIK THE TRADER (Merchant, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_002",
    name: "Henrik the Trader",
    type: "merchant",
    tone: "serious",
    preview: "A well-dressed man with a foreign accent and a heavy purse.",
    speech:
      "My lord, I have traveled from the Low Countries with fine wool and " +
      "Flemish cloth. I seek permission to establish a permanent market " +
      "stall on your estate. I would pay a fair rent, and your people " +
      "would benefit from goods they cannot find elsewhere.",
    responses: [
      {
        label: "Welcome him warmly",
        text:
          "You are welcome here, Henrik. I'll have a stall built for you " +
          "near the market cross. Trade brings prosperity to us all.",
        consequences: { people: 2, treasury: 5, church: -1, military: 0 },
        aftermath:
          "Henrik sets up a handsome stall draped with Flemish cloth. " +
          "The villagers flock to examine his wares. Father Aldous " +
          "grumbles about foreign influence, but the treasury swells " +
          "with rent payments.",
      },
      {
        label: "Allow with restrictions",
        text:
          "You may trade here, but only on market days, and you will " +
          "submit to the same tolls as any English merchant. My bailiff " +
          "will inspect your weights.",
        consequences: { people: 1, treasury: 3, church: 1, military: 0 },
        aftermath:
          "Henrik agrees to the terms with a merchant's practiced smile. " +
          "The arrangement satisfies most — the church approves of fair " +
          "weights, and coin trickles steadily into your coffers.",
      },
      {
        label: "Refuse him entry",
        text:
          "I'll not have foreign traders undercutting my own people. " +
          "You may sell at the next fair, then move along.",
        consequences: { people: -1, treasury: -2, church: 2, military: 0 },
        aftermath:
          "Henrik bows stiffly and departs. The priest nods approvingly " +
          "at your caution, but several villagers mutter about missed " +
          "opportunities. The neighboring lord welcomes Henrik instead.",
      },
    ],
    historicalNote:
      "Flemish merchants were among the most active traders in medieval " +
      "England. The wool trade between England and Flanders was one of " +
      "the most important economic relationships in Europe. English wool " +
      "was considered the finest in the world, and Flemish weavers turned " +
      "it into cloth that was sold across the continent.",
  },

  // ---------------------------------------------------------------
  // 3. FATHER ALDOUS (Priest, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_003",
    name: "Father Aldous",
    type: "priest",
    tone: "serious",
    preview: "The village priest, looking troubled.",
    speech:
      "My lord, I come to you about a matter of the soul. Roger the " +
      "blacksmith has not attended Mass in six weeks. He works on the " +
      "Sabbath and speaks openly against paying his tithe. If he goes " +
      "unpunished, others will follow his example, and the church will " +
      "suffer.",
    responses: [
      {
        label: "Order Roger to attend Mass",
        text:
          "Roger will attend Mass this Sunday or he will answer to me " +
          "in this hall. A man who defies the Church defies the order " +
          "of things.",
        consequences: { people: -3, treasury: 0, church: 5, military: 1 },
        aftermath:
          "Roger appears at church that Sunday, jaw clenched and arms " +
          "folded. Father Aldous beams. The village whispers that the " +
          "lord's word is iron, though some think he overstepped.",
      },
      {
        label: "Speak with Roger privately",
        text:
          "I'll talk to Roger myself. There may be more to this than " +
          "stubbornness. Send him to me after his forge cools.",
        consequences: { people: 4, treasury: 0, church: -1, military: 0 },
        aftermath:
          "Roger confides that Father Aldous insulted his dead wife from " +
          "the pulpit. You mediate a quiet reconciliation. The village " +
          "respects your patience, though the priest feels undermined.",
      },
      {
        label: "Tell the priest to handle it himself",
        text:
          "Father, the care of souls is your business, not mine. Speak " +
          "to Roger, pray for him, do as you will — but I have a manor " +
          "to run.",
        consequences: { people: 1, treasury: 0, church: 1, military: 0 },
        aftermath:
          "Father Aldous leaves looking deflated. Roger continues to skip " +
          "Mass, but the village takes no great notice. The matter fades " +
          "without resolution, which suits most people fine.",
      },
    ],
    historicalNote:
      "Church attendance was not optional in medieval England — it was " +
      "enforced by both religious and secular law. Lords were expected to " +
      "support the Church's authority within their manors. Refusing to " +
      "pay tithes (a ten percent tax to the Church) could result in " +
      "excommunication, which cut a person off from all sacraments.",
  },

  // ---------------------------------------------------------------
  // 4. SERGEANT WULF (Soldier, Tense)
  // ---------------------------------------------------------------
  {
    id: "aud_004",
    name: "Sergeant Wulf",
    type: "soldier",
    tone: "tense",
    preview: "A scarred man in chainmail, breathing hard from a ride.",
    speech:
      "My lord, I've ridden hard from the northern border. There's " +
      "movement in the hills — armed men, maybe twenty, camping just " +
      "beyond your boundary stones. Could be bandits, could be a " +
      "neighbor's scouts. Either way, we're not ready if they come south.",
    responses: [
      {
        label: "Recruit ten more soldiers",
        text:
          "We arm ourselves. Put out the call — ten able men, wages and " +
          "arms provided. I'll not be caught unprepared.",
        consequences: { people: -2, treasury: -4, church: 0, military: 6 },
        aftermath:
          "Ten men answer the call within a week. Wulf drills them hard " +
          "in the yard. The treasury feels the strain, but the garrison " +
          "stands tall and the border movement ceases.",
      },
      {
        label: "Build a watchtower on the ridge",
        text:
          "We need eyes, not just swords. Commission a watchtower on the " +
          "northern ridge. If trouble comes, we'll see it a day before " +
          "it arrives.",
        consequences: { people: 1, treasury: -6, church: 0, military: 4 },
        aftermath:
          "The watchtower rises within a fortnight, giving a clear view " +
          "of three valleys. The mysterious camp breaks apart once they " +
          "realize they're being watched. Your people sleep easier.",
      },
      {
        label: "Send a diplomatic message",
        text:
          "Send a rider under a white banner. Find out who they are and " +
          "what they want. There's no sense in starting a fight that " +
          "words could prevent.",
        consequences: { people: 2, treasury: 0, church: 0, military: -1 },
        aftermath:
          "Your rider returns with word that they are displaced farmers " +
          "from a failed estate to the north, looking for land. The " +
          "threat dissolves, though Wulf remains uneasy about soft " +
          "responses to armed strangers.",
      },
    ],
    historicalNote:
      "Border defense was a constant concern for medieval lords. Unlike " +
      "modern nations with clear borders, medieval estates often had " +
      "fuzzy boundaries marked only by stones, streams, or old trees. " +
      "Raids from neighboring lords, bandits, or Scottish raiders were " +
      "a real threat, especially in northern England.",
  },

  // ---------------------------------------------------------------
  // 5. AGNES THE WEAVER (Gossip, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_005",
    name: "Agnes the Weaver",
    type: "gossip",
    tone: "serious",
    preview: "A sharp-eyed woman who seems to know everyone's business.",
    speech:
      "My lord, I wouldn't normally trouble you with village talk, but " +
      "this is a matter of theft. Geoffrey the miller has been skimming " +
      "grain — a handful from every sack. I've watched him do it. Half " +
      "the village suspects, but no one dares speak because he controls " +
      "the only mill.",
    responses: [
      {
        label: "Investigate the miller",
        text:
          "Have the bailiff weigh Geoffrey's output against the grain " +
          "brought in. If the numbers don't match, I'll see him in " +
          "this hall in chains.",
        consequences: { people: 3, treasury: 2, church: 0, military: 0 },
        aftermath:
          "The bailiff finds Geoffrey's stores bulging with unaccounted " +
          "grain. Confronted, the miller confesses and pays restitution. " +
          "The village is relieved that someone finally acted.",
      },
      {
        label: "Dismiss it as gossip",
        text:
          "Agnes, I'll not upend the village on the word of a weaver " +
          "with a grudge. Bring me proof, not whispers.",
        consequences: { people: -2, treasury: -1, church: 0, military: 0 },
        aftermath:
          "Agnes leaves tight-lipped and furious. Geoffrey continues his " +
          "skimming, and the village's trust in your justice dims. Two " +
          "families quietly begin grinding their own grain at home.",
      },
      {
        label: "Warn Agnes about spreading tales",
        text:
          "Have a care with your tongue, Agnes. Accusations without " +
          "proof cause more harm than a light thumb on the scales. " +
          "If you bring me evidence, I'll listen — but not rumor.",
        consequences: { people: -1, treasury: 0, church: 1, military: 0 },
        aftermath:
          "Agnes falls silent, though her eyes flash with resentment. " +
          "The village takes note that the lord values order over " +
          "accusation. Father Aldous approves of your caution.",
      },
    ],
    historicalNote:
      "Millers were among the most distrusted people in medieval villages. " +
      "Because they controlled the grinding of grain — which everyone " +
      "needed — they had countless opportunities to skim a little from " +
      "each sack. The phrase 'putting one's thumb on the scale' may " +
      "have originated from this very practice.",
  },

  // ---------------------------------------------------------------
  // 6. EDWIN THE TINKER (Inventor, Comedic)
  // ---------------------------------------------------------------
  {
    id: "aud_006",
    name: "Edwin the Tinker",
    type: "inventor",
    tone: "comedic",
    preview: "A wild-haired man carrying a contraption made of sticks and rope.",
    speech:
      "My lord! My lord, I have done it! I have invented a plow that " +
      "plows ITSELF! You attach it to two goats and a system of ropes " +
      "and pulleys, and the goats walk in a circle, and the plow goes " +
      "forward. I only need funding for the ropes. And the goats. And " +
      "possibly a longer field.",
    responses: [
      {
        label: "Fund his invention",
        text:
          "You have ambition, Edwin. Here's coin for your ropes and " +
          "goats. Show me a working model by next market day.",
        consequences: { people: 2, treasury: -3, church: 0, military: 0 },
        aftermath:
          "Edwin's first test ends with two confused goats, a tangled " +
          "rope, and a plow embedded in a hedge. But his second attempt " +
          "actually moves some earth, and the farmers watch with " +
          "grudging interest. Innovation has a rocky start.",
      },
      {
        label: "Ask for a demonstration first",
        text:
          "Show me what you have, Edwin. Right here, right now. I'll " +
          "not pay for promises.",
        consequences: { people: 1, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Edwin eagerly demonstrates his model on the hall floor with " +
          "two kittens and a ball of yarn. It almost works. The court " +
          "is entertained, and Edwin leaves with hope but no coin — " +
          "yet.",
      },
      {
        label: "Decline politely",
        text:
          "Edwin, I admire your spirit, but I cannot fund every " +
          "contraption that walks through my door. Perhaps next season.",
        consequences: { people: -1, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Edwin's shoulders sag, but he nods and shuffles away with " +
          "his contraption clanking behind him. The steward mutters " +
          "that the man will be back — he always comes back.",
      },
    ],
    historicalNote:
      "Medieval inventors were surprisingly active. The heavy plow, the " +
      "horse collar, the windmill, and the mechanical clock were all " +
      "medieval innovations. However, most inventors worked without " +
      "funding or recognition, and many good ideas were lost because " +
      "no lord would invest in something unproven.",
  },

  // ---------------------------------------------------------------
  // 7. YOUNG PETER (Child, Comedic)
  // ---------------------------------------------------------------
  {
    id: "aud_007",
    name: "Young Peter",
    type: "child",
    tone: "comedic",
    preview: "A small boy with enormous eyes and dirty knees.",
    speech:
      "M-my lord... I... I lost my dog. His name is Turnip and he's " +
      "brown and he has one ear that sticks up and one that doesn't " +
      "and he's my best friend and I've looked EVERYWHERE and Mum " +
      "said to stop crying but I CAN'T because Turnip is LOST.",
    responses: [
      {
        label: "Order a search for the dog",
        text:
          "Sergeant! Organize a search party. We're looking for a brown " +
          "dog named Turnip. One ear up, one ear down. I want that dog " +
          "found before sundown.",
        consequences: { people: 3, treasury: 0, church: 0, military: -1 },
        aftermath:
          "Three soldiers spend the afternoon combing hedgerows and " +
          "calling for Turnip. They find the dog stuck in a badger " +
          "hole near the stream, tail wagging furiously. Peter's joy " +
          "is worth every lost hour of patrol.",
      },
      {
        label: "Send him to the kitchen for scraps to lure Turnip",
        text:
          "Go to the kitchen, lad. Tell the cook I said to give you " +
          "a bone and some bacon scraps. Then sit outside and wait — " +
          "a hungry dog will find food.",
        consequences: { people: 1, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Peter runs to the kitchen and returns with a greasy bundle. " +
          "He sits by the gate, sniffling. Within an hour, a brown blur " +
          "comes barreling out of the woods. Turnip has found the bacon. " +
          "Peter has found Turnip. All is well.",
      },
      {
        label: "Tell him to handle it himself",
        text:
          "Boy, I am lord of this manor, not a dog-catcher. Go find " +
          "your dog yourself.",
        consequences: { people: -2, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Peter's lip trembles and he runs from the hall in tears. " +
          "The court falls awkwardly quiet. Even the steward looks " +
          "away. The village will remember that the lord couldn't " +
          "spare a moment for a child.",
      },
    ],
    historicalNote:
      "Dogs were essential working animals in medieval life — herding " +
      "sheep, guarding homes, and hunting vermin. Even peasant children " +
      "had dogs, though they were working animals, not pets in the modern " +
      "sense. A good herding dog was genuinely valuable to a poor family.",
  },

  // ---------------------------------------------------------------
  // 8. BEATRICE THE MIDWIFE (Healer, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_008",
    name: "Beatrice the Midwife",
    type: "healer",
    tone: "serious",
    preview: "A calm woman carrying a bundle of dried herbs.",
    speech:
      "My lord, there is sickness in the eastern cottages. Three families " +
      "are down with fever, and it's spreading. I can treat them with " +
      "herbs and rest, but I need coin for supplies, and someone with " +
      "authority to keep the healthy away from the sick until it passes.",
    responses: [
      {
        label: "Quarantine and fund her treatment",
        text:
          "Seal off the eastern cottages. No one in or out without " +
          "Beatrice's word. Give her whatever coin she needs from the " +
          "treasury for herbs and clean linens.",
        consequences: { people: 2, treasury: -3, church: 1, military: 0 },
        aftermath:
          "The quarantine holds. Beatrice works through three nights " +
          "without sleep, and by the week's end the fever breaks. No " +
          "one dies. The church praises your prudence, and Beatrice " +
          "earns a reputation as a miracle worker.",
      },
      {
        label: "Fund the treatment but skip quarantine",
        text:
          "Give Beatrice the coin, but I'll not imprison healthy " +
          "families in their homes. People must be free to work.",
        consequences: { people: 1, treasury: -2, church: 0, military: 0 },
        aftermath:
          "Beatrice does her best, but the fever spreads to two more " +
          "cottages before it fades. No one dies, but the village is " +
          "weakened for a fortnight. Beatrice says it could have been " +
          "prevented.",
      },
      {
        label: "Pray for God's mercy instead",
        text:
          "This is God's will being worked upon us. Tell Father Aldous " +
          "to lead prayers for the sick. If it is meant to pass, it " +
          "will pass.",
        consequences: { people: -4, treasury: 0, church: 3, military: 0 },
        aftermath:
          "The village prays. Two of the sick recover on their own, " +
          "but old Edith the spinner dies in the night. The church " +
          "approves of your faith, but the village questions your " +
          "judgment. Beatrice says nothing, but her silence speaks.",
      },
    ],
    historicalNote:
      "Medieval medicine was a mix of herbal knowledge, prayer, and " +
      "superstition. Midwives and healers often had real expertise with " +
      "herbs — willow bark (aspirin), honey (antiseptic), and lavender " +
      "(calming) were all used effectively. Quarantine was practiced as " +
      "early as the 14th century, especially during the Black Death.",
  },

  // ---------------------------------------------------------------
  // 9. BROTHER MARCUS (Monk, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_009",
    name: "Brother Marcus",
    type: "monk",
    tone: "serious",
    preview: "A monk in travel-stained robes, carrying a leather satchel.",
    speech:
      "My lord, I come from the abbey at Whitminster. Our abbot sends " +
      "greetings and a proposal: we wish to establish a scriptorium on " +
      "your estate — a place where monks may copy manuscripts and teach " +
      "the village children their letters. In return, we offer prayers " +
      "for your house and a share of any books we produce for sale.",
    responses: [
      {
        label: "Accept enthusiastically",
        text:
          "A scriptorium! Yes, Brother Marcus, this is exactly what this " +
          "estate needs. I'll provide a building and funding. Knowledge " +
          "is the finest treasure.",
        consequences: { people: 4, treasury: -4, church: 5, military: 0 },
        aftermath:
          "Within a month, three monks are settled in a converted barn, " +
          "scratching away at parchment by candlelight. Village children " +
          "crowd around to watch and learn. The estate gains a reputation " +
          "for learning, and the church speaks highly of your piety.",
      },
      {
        label: "Accept with conditions",
        text:
          "I welcome the monks, but on my terms. They teach the children " +
          "as promised, and the scriptorium pays a modest rent for use " +
          "of the building. Faith and commerce need not be enemies.",
        consequences: { people: 3, treasury: -2, church: 2, military: 0 },
        aftermath:
          "Brother Marcus agrees with a wry smile. The scriptorium opens " +
          "modestly, and the children learn their letters. The arrangement " +
          "satisfies both God and the ledger.",
      },
      {
        label: "Decline the offer",
        text:
          "I have no quarrel with the abbey, but I cannot afford to house " +
          "monks and fund their work. Perhaps another estate has deeper " +
          "pockets.",
        consequences: { people: -1, treasury: 1, church: -3, military: 0 },
        aftermath:
          "Brother Marcus bows and departs without argument, but the " +
          "church is displeased. Father Aldous remarks pointedly in " +
          "Sunday's sermon about lords who value coin over the Word. " +
          "The village children remain unlettered.",
      },
    ],
    historicalNote:
      "Scriptoriums were the medieval world's publishing houses. Monks " +
      "painstakingly copied books by hand, one page at a time, using " +
      "quill pens and ink made from oak galls. A single book could take " +
      "months to complete. Before the printing press, these monastic " +
      "scriptoriums were the only way knowledge was preserved and shared.",
  },

  // ---------------------------------------------------------------
  // 10. GILES THE POACHER (Criminal, Tense)
  // ---------------------------------------------------------------
  {
    id: "aud_010",
    name: "Giles the Poacher",
    type: "criminal",
    tone: "tense",
    preview: "A thin man in chains, dragged in by a guard.",
    speech:
      "My lord, I took three rabbits from your forest, and I'll not lie " +
      "about it. My children haven't eaten in two days. The eldest is " +
      "sick with hunger. I knew the penalty when I set my snares, and " +
      "I set them anyway. Do what you will — but my children are " +
      "innocent in this.",
    responses: [
      {
        label: "Show mercy",
        text:
          "A father who feeds his children is no criminal in my eyes. " +
          "Release him. And send food to his family from the stores.",
        consequences: { people: 6, treasury: -1, church: 2, military: -2 },
        aftermath:
          "Giles breaks down weeping. The hall erupts in murmurs — some " +
          "approving, some warning that mercy invites more poaching. " +
          "But the village remembers a lord who chose children over " +
          "rabbits.",
      },
      {
        label: "Apply the full penalty of the law",
        text:
          "The law is the law. Giles shall lose his right hand, as " +
          "custom demands for poaching on the lord's forest. Let this " +
          "be a lesson to any who would steal from my land.",
        consequences: { people: -8, treasury: 1, church: -1, military: 3 },
        aftermath:
          "The punishment is carried out in the courtyard. The village " +
          "is horrified. Giles's wife collapses. For weeks, no one " +
          "meets your eye. Fear replaces trust, and the garrison stands " +
          "a little taller knowing the law has teeth.",
      },
      {
        label: "Pardon him and address the hunger",
        text:
          "Release Giles and strike his chains. Then send Edmund to " +
          "count the hungry families in the village. We open the grain " +
          "stores today. No one poaches when no one starves.",
        consequences: { people: 8, treasury: -3, church: 0, military: -3 },
        aftermath:
          "The grain stores are opened, and twelve families receive " +
          "emergency rations. The cost is significant, and Wulf warns " +
          "that generosity without strength invites trouble. But the " +
          "village loves you for it — deeply and genuinely.",
      },
    ],
    historicalNote:
      "Poaching was one of the most common crimes in medieval England, " +
      "and one of the most harshly punished. The royal forests were " +
      "reserved for the king's hunting, and even taking a rabbit could " +
      "result in mutilation or death. The famous Robin Hood legends grew " +
      "directly from anger over these forest laws, which many saw as " +
      "unjust.",
  },

  // ---------------------------------------------------------------
  // 11. ROSA THE ALEWIFE (Merchant, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_011",
    name: "Rosa the Alewife",
    type: "merchant",
    tone: "serious",
    preview: "A stout woman smelling strongly of hops.",
    speech:
      "My lord, I brew the best ale in three villages and everyone " +
      "knows it. I've applied for a market license to sell at the " +
      "cross, but the guild master says women cannot hold licenses. " +
      "I ask you to overrule him. My ale is honest, my measures are " +
      "true, and my coin is as good as any man's.",
    responses: [
      {
        label: "Grant her the license",
        text:
          "If the ale is good and the measures are true, the brewer's " +
          "sex matters not to me. Grant the license. And Rosa — if I " +
          "hear of short measures, I'll close you down myself.",
        consequences: { people: 3, treasury: 2, church: -2, military: 0 },
        aftermath:
          "Rosa's stall becomes the most popular in the market. Her ale " +
          "draws buyers from neighboring villages. The guild master " +
          "fumes, and Father Aldous preaches about proper roles, but " +
          "the coin flows and the people are merry.",
      },
      {
        label: "Uphold tradition",
        text:
          "The guild rules exist for good reason, Rosa. I cannot overturn " +
          "them for one brewer, however skilled. Sell through your " +
          "husband or a male relative.",
        consequences: { people: -3, treasury: 0, church: 2, military: 0 },
        aftermath:
          "Rosa leaves the hall in cold fury. Several village women " +
          "stop attending market days in silent protest. The church " +
          "approves of upholding order, but the village has lost " +
          "something it cannot easily name.",
      },
      {
        label: "License under her husband's name",
        text:
          "A compromise, Rosa. The license will bear your husband's " +
          "name, but the stall is yours to run. This way the guild " +
          "is satisfied, and you have your market.",
        consequences: { people: 1, treasury: 1, church: 0, military: 0 },
        aftermath:
          "Rosa accepts with a tight-lipped nod. Everyone knows the " +
          "truth, but the legal fiction keeps the peace. The ale flows, " +
          "the guild grumbles less, and the arrangement works well " +
          "enough — for now.",
      },
    ],
    historicalNote:
      "Brewing was actually one of the few trades where women were well " +
      "represented in medieval England. 'Alewives' brewed and sold ale " +
      "from their homes, and the word 'brewster' (female brewer) appears " +
      "frequently in court records. However, as brewing became more " +
      "profitable, guilds increasingly pushed women out of the trade.",
  },

  // ---------------------------------------------------------------
  // 12. TWO SHEPHERDS (Dispute Light, Comedic)
  // ---------------------------------------------------------------
  {
    id: "aud_012",
    name: "Two Shepherds",
    type: "dispute_light",
    tone: "comedic",
    preview: "Two red-faced shepherds yelling about a sheep.",
    speech:
      "MY LORD — this SCOUNDREL painted my best ewe with his mark! " +
      "/ LIES! That sheep has been mine since lambing season! She " +
      "answers to her name! / Sheep don't HAVE names, you turnip!",
    responses: [
      {
        label: "Have the sheep choose its owner",
        text:
          "Enough! Bring the sheep into the hall. Set both men at " +
          "opposite ends. Whichever one the sheep walks to is its " +
          "true master. The beast knows its shepherd.",
        consequences: { people: 2, treasury: 0, church: 0, military: 0 },
        aftermath:
          "The sheep is brought in and promptly walks to neither man, " +
          "instead eating a tapestry. The court erupts in laughter. " +
          "The shepherds, both embarrassed, agree to split the cost " +
          "of the tapestry and share the sheep's wool. Justice, of " +
          "a sort, is served.",
      },
      {
        label: "Check the wool records",
        text:
          "Does this estate not keep wool tallies? Fetch the records. " +
          "Whichever flock is short a sheep has its answer.",
        consequences: { people: 1, treasury: 1, church: 0, military: 0 },
        aftermath:
          "The steward consults the tallies and finds that one flock " +
          "is indeed short. The matter is settled with mathematics " +
          "rather than shouting, and the court is impressed by the " +
          "lord's methodical approach.",
      },
      {
        label: "Fine them both for wasting your time",
        text:
          "You've both wasted my morning over one sheep. Pay a " +
          "shilling each for the privilege of yelling in my hall, " +
          "and sort it out between yourselves.",
        consequences: { people: -1, treasury: 2, church: 0, military: 0 },
        aftermath:
          "Both shepherds sputter in outrage, then pay up and leave " +
          "the hall still arguing. The matter remains unresolved, " +
          "but the treasury is two shillings richer and the court " +
          "learned that the lord's patience has a price.",
      },
    ],
    historicalNote:
      "Livestock disputes were extremely common in medieval manor courts. " +
      "Sheep were marked with colored dye or ear notches to identify " +
      "their owners, but disputes still arose constantly. Some courts " +
      "even recorded tests similar to the 'sheep chooses its owner' " +
      "method described here, with mixed results.",
  },

  // ---------------------------------------------------------------
  // 13. PERCIVAL THE MUSICIAN (Entertainer, Comedic)
  // ---------------------------------------------------------------
  {
    id: "aud_013",
    name: "Percival the Musician",
    type: "entertainer",
    tone: "comedic",
    preview: "A man with a lute and an extremely confident smile.",
    speech:
      "My lord! I am Percival of Ashford, the finest musician between " +
      "here and London — possibly including London. I can play the " +
      "lute, the rebec, and the hurdy-gurdy, sometimes all at once. " +
      "I humbly offer my services for your next feast, in exchange " +
      "for mere coin, lodging, and unlimited access to the pantry.",
    responses: [
      {
        label: "Hire him for the next feast",
        text:
          "You have spirit, Percival. You're hired for the next feast. " +
          "But if you're half as good as you claim, I'll be amazed.",
        consequences: { people: 3, treasury: -2, church: 0, military: 0 },
        aftermath:
          "Percival turns out to be genuinely talented. His ballads " +
          "make the old women weep and his jigs make the children " +
          "dance. The feast is remembered for months, and the village " +
          "hums his tunes all winter.",
      },
      {
        label: "Test his skills first",
        text:
          "Play something. Now. If you move me, you eat tonight. " +
          "If not, you walk.",
        consequences: { people: 1, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Percival plays a haunting ballad about a knight who lost " +
          "his love in the Crusades. Even Sergeant Wulf wipes his eye. " +
          "You send Percival to the kitchen with a nod, and the court " +
          "speaks well of a lord who values talent over promises.",
      },
      {
        label: "Chase him off",
        text:
          "I have no need of wandering players. Be gone before my " +
          "guards help you on your way.",
        consequences: { people: -2, treasury: 0, church: 0, military: 1 },
        aftermath:
          "Percival slinks away, clutching his lute. The hall feels " +
          "a bit colder after he goes. The guards smirk, but the " +
          "villagers who heard him playing outside the gate wish the " +
          "lord had listened.",
      },
    ],
    historicalNote:
      "Traveling musicians, called minstrels, were an important part of " +
      "medieval entertainment. They carried news, songs, and stories " +
      "from place to place. A lord who employed a good minstrel gained " +
      "prestige, as feasts with music and entertainment were a sign of " +
      "wealth and culture.",
  },

  // ---------------------------------------------------------------
  // 14. WIDOW THORNTON (Petitioner, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_014",
    name: "Widow Thornton",
    type: "petitioner",
    tone: "serious",
    preview: "A well-dressed woman with composure that barely conceals grief.",
    speech:
      "My lord, my husband Sir Edmund Thornton died a fortnight past. " +
      "He held forty acres from you in knight's service. Our son is " +
      "nine years old — too young to hold land by custom. I ask that " +
      "you allow me to hold the land in trust until my boy comes of " +
      "age. I can manage the farm. I have been managing it for years " +
      "while Edmund rode to tourneys.",
    responses: [
      {
        label: "Grant her the land",
        text:
          "You managed the land while your husband played at war? " +
          "Then you've already proven yourself. The land is yours " +
          "to hold until your son is of age.",
        consequences: { people: 4, treasury: 0, church: -1, military: 0 },
        aftermath:
          "Widow Thornton bows with dignity and leaves the hall with " +
          "her head high. The village approves — she is well-liked " +
          "and competent. The church mutters about proper order, but " +
          "the farm thrives under her stewardship.",
      },
      {
        label: "Follow custom strictly",
        text:
          "Custom is clear — the land reverts to me until the boy is " +
          "of age. I will appoint a steward to manage it. You may " +
          "remain in the house.",
        consequences: { people: -3, treasury: 1, church: 2, military: 0 },
        aftermath:
          "Widow Thornton's composure cracks, and she leaves the hall " +
          "fighting tears. The appointed steward proves competent but " +
          "uninspired. The village sees a grieving widow stripped of " +
          "her home's independence, and the murmuring is not kind.",
      },
      {
        label: "Appoint a guardian with her as co-manager",
        text:
          "I'll appoint a guardian for the legal form of it, but you " +
          "will manage the day-to-day work. The guardian will report " +
          "to me if anything goes amiss.",
        consequences: { people: 1, treasury: 0, church: 1, military: 0 },
        aftermath:
          "A sensible compromise. The guardian is a formality, and " +
          "Widow Thornton runs the farm as she always has. Both " +
          "Church and village are satisfied, and the boy grows up " +
          "watching his mother manage his inheritance with skill.",
      },
    ],
    historicalNote:
      "When a feudal tenant died, his land technically reverted to the " +
      "lord. Widows had few legal rights to hold land, though in practice " +
      "many managed estates for years. The concept of 'wardship' — where " +
      "the lord controlled a minor heir's land — was often abused for " +
      "profit. Some widows paid large fees just to retain control of " +
      "their own homes.",
  },

  // ---------------------------------------------------------------
  // 15. EDMUND THE STEWARD (Advisor, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_015",
    name: "Edmund the Steward",
    type: "advisor",
    tone: "serious",
    preview: "Your steward approaches with an unusual expression — concern.",
    speech:
      "My lord, a word in private, if I may. I've been over the " +
      "accounts twice now, and the truth is plain: the treasury is " +
      "thin. Winter is coming, the garrison needs paying, and there " +
      "is less in reserve than I would like. We must either spend " +
      "less or earn more — and soon.",
    responses: [
      {
        label: "Thank him and plan for austerity",
        text:
          "You're right, Edmund. Cut the household expenses by a " +
          "quarter. No unnecessary feasts, no new purchases until " +
          "the balance improves. Tighten the belt.",
        consequences: { people: -2, treasury: 3, church: 0, military: 0 },
        aftermath:
          "The austerity measures pinch, but the treasury stabilizes. " +
          "Candles are rationed, meals grow simpler, and the servants " +
          "grumble. But Edmund nods approvingly — a lord who listens " +
          "to his steward is a lord who survives.",
      },
      {
        label: "Dismiss the concern",
        text:
          "Edmund, you worry too much. We've weathered thin seasons " +
          "before. God provides.",
        consequences: { people: 0, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Edmund bows and says nothing more, but his expression " +
          "speaks volumes. The treasury remains at risk, and the " +
          "steward's warning goes unheeded. Whether this proves wise " +
          "or foolish, only time will tell.",
      },
      {
        label: "Ask for a full accounting",
        text:
          "Show me the books, Edmund. Every penny in, every penny " +
          "out. I want to see where the coin goes before I decide " +
          "where to cut.",
        consequences: { people: 1, treasury: 1, church: 0, military: 0 },
        aftermath:
          "Edmund spreads the ledgers across the table with evident " +
          "relief — finally, a lord who reads the numbers. Together " +
          "you find small savings and one outright waste. The treasury " +
          "improves modestly, and the steward's respect for you grows.",
      },
    ],
    historicalNote:
      "The steward was one of the most important people on a medieval " +
      "estate. He managed the lord's finances, supervised the harvest, " +
      "and kept detailed records of every transaction. Many stewards " +
      "were more educated than the lords they served. The Domesday " +
      "Book itself was essentially a giant steward's accounting of " +
      "all England.",
  },

  // ---------------------------------------------------------------
  // 16. A STRANGER AT THE GATE (Mystery, Tense)
  // ---------------------------------------------------------------
  {
    id: "aud_016",
    name: "A Stranger at the Gate",
    type: "mystery",
    tone: "tense",
    preview: "A hooded figure who will not give a name.",
    speech:
      "I bring you a warning, my lord, and I ask nothing in return " +
      "but that you hear me. Lord Mortimer of Ashby is gathering men. " +
      "He speaks openly of your lands and your weakness. I cannot say " +
      "more. I cannot say who sent me. But if you are wise, you will " +
      "prepare.",
    responses: [
      {
        label: "Press the stranger for details",
        text:
          "You've come to my hall with grave words and no name. I'll " +
          "hear more before I act. Who sent you? What does Mortimer " +
          "plan?",
        consequences: { people: 0, treasury: 0, church: 0, military: 2 },
        aftermath:
          "The stranger reveals little more — only that Mortimer has " +
          "hired mercenaries and may move before winter. Then the " +
          "stranger slips away like smoke. Wulf doubles the night " +
          "watch, and the border patrols ride a little farther.",
      },
      {
        label: "Reward the stranger with coin",
        text:
          "Your courage in coming here will not be forgotten. Take " +
          "this purse and know that this lord rewards those who bring " +
          "truth, even in shadow.",
        consequences: { people: 0, treasury: -3, church: 0, military: 3 },
        aftermath:
          "The stranger takes the coin and vanishes into the night. " +
          "Over the following weeks, more whispers reach you through " +
          "mysterious channels — the stranger has allies, and your " +
          "coin has bought you an intelligence network of sorts.",
      },
      {
        label: "Arrest the stranger",
        text:
          "Guards! Seize this person. Anyone who hides their face and " +
          "speaks of plots may well be a plotter themselves.",
        consequences: { people: -1, treasury: 0, church: 0, military: 1 },
        aftermath:
          "The stranger is taken to the cells but reveals nothing " +
          "under questioning and escapes by morning through means " +
          "no one can explain. Wulf is unsettled. The warning about " +
          "Mortimer may or may not be true, but you've made an " +
          "enemy of whoever sent the messenger.",
      },
      {
        label: "Ignore the warning",
        text:
          "Nameless warnings from hooded strangers? This is my hall, " +
          "not a minstrel's tale. Be gone.",
        consequences: { people: 0, treasury: 0, church: 0, military: 0 },
        aftermath:
          "The stranger shrugs and departs. The court resumes its " +
          "business. Whether Mortimer truly plots or the stranger " +
          "was sowing mischief, you've chosen to stand on your own " +
          "assessment. Time will reveal the truth.",
      },
    ],
    historicalNote:
      "Intrigue between neighboring lords was constant in medieval " +
      "England. Alliances shifted, marriages were political tools, and " +
      "spies were common. Many lords employed networks of informants — " +
      "merchants, monks, and travelers who carried information along " +
      "with their goods. The line between diplomacy and espionage was " +
      "often invisible.",
  },

  // ---------------------------------------------------------------
  // 17. THE VILLAGE ELDER (Tradition, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_017",
    name: "The Village Elder",
    type: "tradition",
    tone: "serious",
    preview: "The oldest man in the village, leaning on a gnarled stick.",
    speech:
      "My lord, I come about the Witness Tree — the great oak at the " +
      "crossroads where your grandfather held his first court. It is " +
      "dying. The trunk is hollow, the branches are bare. The village " +
      "has gathered beneath that tree for a hundred years. If it falls, " +
      "something of this place dies with it.",
    responses: [
      {
        label: "Pay for a tree-keeper to tend it",
        text:
          "That tree stood when my grandfather was young, and it will " +
          "stand when my grandchildren are old. Hire a tree-keeper. " +
          "Spare no expense.",
        consequences: { people: 4, treasury: -3, church: 0, military: 0 },
        aftermath:
          "A skilled woodsman is brought from the abbey to tend the " +
          "ancient oak. He prunes the dead wood, fills the hollow with " +
          "clay and moss, and builds a low fence to protect the roots. " +
          "The village gathers beneath it that Sunday, and the elder " +
          "weeps quietly. Some things are worth more than coin.",
      },
      {
        label: "Let nature take its course",
        text:
          "All things die, elder. Even trees. When it falls, we'll " +
          "clear the wood and use it for building. That's the way " +
          "of things.",
        consequences: { people: -2, treasury: 0, church: 0, military: 0 },
        aftermath:
          "The elder leaves without a word. The tree dies by autumn " +
          "and is felled for timber. The crossroads feels emptier " +
          "without it, and the older villagers shake their heads " +
          "when they pass the stump.",
      },
      {
        label: "Plant a new tree beside it",
        text:
          "Plant a young oak beside the old one. When the old tree " +
          "falls, the new one will be waiting. One generation " +
          "shelters the next.",
        consequences: { people: 2, treasury: -1, church: 0, military: 0 },
        aftermath:
          "A sapling is planted beside the dying oak. The village " +
          "approves of the symbolism — continuity, not replacement. " +
          "The elder pats the sapling's slender trunk and smiles. " +
          "It's a small thing, but it means everything.",
      },
    ],
    historicalNote:
      "Witness Trees were real features of medieval English law. Important " +
      "agreements, boundary disputes, and even legal trials were conducted " +
      "beneath specific ancient trees. The trees served as living " +
      "landmarks and their destruction could cause genuine legal " +
      "confusion. Some medieval oaks still standing in England today " +
      "are over 800 years old.",
  },

  // ---------------------------------------------------------------
  // 18. GILBERT THE HERALD (Staff, Comedic)
  // ---------------------------------------------------------------
  {
    id: "aud_018",
    name: "Gilbert the Herald",
    type: "staff",
    tone: "comedic",
    preview: "Your herald, looking embarrassed.",
    speech:
      "My lord, I... I must confess a terrible error. When reading " +
      "your latest decree in the village square, I may have... " +
      "misspoken. Instead of announcing that 'all chickens must be " +
      "penned by nightfall,' I announced that 'all chickens must " +
      "wear hats by nightfall.' The village is... confused.",
    responses: [
      {
        label: "Make it official",
        text:
          "Hats? HATS? ...You know what, Gilbert? Let it stand. I " +
          "want to see chickens in hats. Issue a formal decree.",
        consequences: { people: 3, treasury: -1, church: 0, military: 0 },
        aftermath:
          "The village, baffled but obedient, fashions tiny hats from " +
          "scraps of cloth and leather. Within a week, the sight of " +
          "chickens in bonnets and caps becomes the greatest source " +
          "of joy the village has known in years. Visitors come from " +
          "neighboring estates just to see it. Gilbert is mortified, " +
          "but the people are delighted.",
      },
      {
        label: "Quietly correct the error",
        text:
          "Go back to the square, Gilbert, and read the decree " +
          "correctly this time. And for the love of all that is holy, " +
          "practice first.",
        consequences: { people: 1, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Gilbert returns to the square, red-faced, and reads the " +
          "correct decree. The village is slightly disappointed — they " +
          "were rather enjoying the hat idea. But order is restored, " +
          "and the chickens are penned hatless by nightfall.",
      },
      {
        label: "Mock Gilbert publicly",
        text:
          "Gilbert, you are the worst herald in Christendom. From now " +
          "on, I'll have the steward check your scrolls before you " +
          "open your mouth in the square.",
        consequences: { people: -1, treasury: 0, church: 0, military: 1 },
        aftermath:
          "Gilbert turns scarlet and bows low, retreating from the " +
          "hall to scattered snickering. His announcing improves " +
          "dramatically after this, driven by pure embarrassment. " +
          "The court learned the lord suffers no incompetence, but " +
          "at the cost of a man's dignity.",
      },
    ],
    historicalNote:
      "Heralds were official messengers and announcers in medieval " +
      "courts. They memorized proclamations, announced visitors, and " +
      "organized ceremonies. Literacy was not always required — many " +
      "heralds worked from memory. Mistakes in official announcements " +
      "could have serious consequences, though comical errors were " +
      "also recorded in medieval court rolls.",
  },

  // ---------------------------------------------------------------
  // 19. DELEGATION OF FARMERS (Collective, Serious)
  // ---------------------------------------------------------------
  {
    id: "aud_019",
    name: "Delegation of Farmers",
    type: "collective",
    tone: "serious",
    preview: "Five farmers stand together, hats in hand, unified in purpose.",
    speech:
      "My lord, we come as one voice for the whole eastern quarter. " +
      "The bridge over Ashford creek has rotted through. Last week " +
      "Thomas's cart went through the planks, and we lost a full load " +
      "of grain to the water. No one can cross safely with a heavy " +
      "load. If the bridge is not repaired, we cannot bring our " +
      "harvest to market.",
    responses: [
      {
        label: "Commission a proper stone bridge",
        text:
          "A stone bridge. Something that will last a hundred years. " +
          "Edmund, draw up the plans and hire the masons. This bridge " +
          "will bear my name.",
        consequences: { people: 4, treasury: -5, church: 0, military: 1 },
        aftermath:
          "The stone bridge is completed in six weeks, solid and " +
          "handsome. The farmers cheer when the first loaded cart " +
          "crosses without a creak. Trade improves immediately, and " +
          "even Sergeant Wulf notes that a good bridge serves " +
          "military transport as well.",
      },
      {
        label: "Patch it with timber",
        text:
          "Replace the rotten planks with good timber. It won't last " +
          "forever, but it'll hold for a few years and cost far less " +
          "than stone.",
        consequences: { people: 2, treasury: -2, church: 0, military: 0 },
        aftermath:
          "The timber repair is done in three days. It's functional " +
          "but uninspiring. The farmers are grateful enough, though " +
          "they know they'll be back in a few years when the new " +
          "wood begins to rot as well.",
      },
      {
        label: "Dismiss the request",
        text:
          "The bridge has stood for twenty years. Ford the creek or " +
          "find another way around. I have greater matters to attend to.",
        consequences: { people: -4, treasury: 1, church: 0, military: 0 },
        aftermath:
          "The farmers leave in stony silence. Within a month, two " +
          "more carts are lost to the creek. Families begin using a " +
          "longer route that adds half a day to market journeys. " +
          "Resentment simmers in the eastern quarter.",
      },
    ],
    historicalNote:
      "Bridge maintenance was a major responsibility of medieval lords. " +
      "Many bridges were funded through 'pontage' — special taxes " +
      "collected from those who crossed. Stone bridges were expensive " +
      "but could last centuries; some medieval bridges in England are " +
      "still in use today. A failed bridge could isolate entire " +
      "communities and destroy local trade.",
  },

  // ---------------------------------------------------------------
  // 20. CEDRIC THE BEEKEEPER (Specialist, Comedic)
  // ---------------------------------------------------------------
  {
    id: "aud_020",
    name: "Cedric the Beekeeper",
    type: "specialist",
    tone: "comedic",
    preview:
      "A man covered in bee stings who seems oddly cheerful about it.",
    speech:
      "My lord! Wonderful news! The bees have outdone themselves this " +
      "season — a record harvest of honey! I have more than I can " +
      "store in my cottage. The pots are stacked to the rafters, the " +
      "bees are still working, and my wife says if one more jar comes " +
      "through the door she's moving to her mother's. I need proper " +
      "storage, my lord, or the honey will spoil.",
    responses: [
      {
        label: "Grant him use of the manor cellar",
        text:
          "Use the east cellar — it's cool and dry. Store the surplus " +
          "there, and we'll sell the excess at the next market for a " +
          "tidy profit.",
        consequences: { people: 1, treasury: 3, church: 0, military: 0 },
        aftermath:
          "The cellar fills with golden jars of honey. The sweet scent " +
          "drifts through the manor for weeks. The honey sells well at " +
          "market, and Cedric's wife returns home now that the cottage " +
          "is habitable again. Everyone wins — except the bees, who " +
          "don't seem to mind.",
      },
      {
        label: "Buy the surplus directly",
        text:
          "I'll buy the surplus from you at a fair price, Cedric. The " +
          "kitchen can use it, and we'll send some to the abbey — " +
          "they need beeswax for candles.",
        consequences: { people: 2, treasury: -2, church: 0, military: 0 },
        aftermath:
          "Cedric happily delivers pot after pot to the manor kitchen. " +
          "The cook begins experimenting with honey cakes, and the " +
          "abbey is grateful for the beeswax. Cedric uses the coin " +
          "to build a proper honey shed, solving the problem for " +
          "good.",
      },
      {
        label: "Tell him to sell it at market himself",
        text:
          "You're a beekeeper, not a beggar. Take it to market, sell " +
          "it, and keep the coin. You've earned it.",
        consequences: { people: 1, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Cedric nods cheerfully and hauls his honey to market on a " +
          "borrowed cart. He sells out by midday and returns home " +
          "whistling. His wife is impressed. The village gains a " +
          "reputation for fine honey, which is a small thing but " +
          "a proud one.",
      },
    ],
    historicalNote:
      "Beekeeping was a valued skill in medieval England. Honey was the " +
      "primary sweetener in an age before sugar was widely available, " +
      "and beeswax was essential for making high-quality candles used " +
      "in churches. Some monasteries kept hundreds of hives, and a " +
      "skilled beekeeper was a genuine asset to any estate.",
  },

];

export default AUDIENCE_ENCOUNTERS;
