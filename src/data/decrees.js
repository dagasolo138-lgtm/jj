/**
 * decrees.js
 *
 * Great Hall Phase 3 — Decrees, Council Topics, and Feast Data
 * for The Lord's Ledger.
 *
 * DECREE_OPTIONS — 10 decrees the lord can issue from the Great Hall.
 * COUNCIL_TOPICS — 4 council sessions with advisor positions and options.
 * FEAST_DATA — Guest, entertainment, course, and random event options.
 *
 * All consequence objects use { people, treasury, church, military }.
 * Zero values included explicitly for consistency.
 *
 * Consequence ranges:
 *   Trivial: +/-1 | Small: +/-2-3 | Medium: +/-4-5
 *   Large: +/-6-8 | Massive: +/-9-12
 */

// ═══════════════════════════════════════════════════════════════════
// DECREES
// ═══════════════════════════════════════════════════════════════════

export const DECREE_OPTIONS = [

  // ---------------------------------------------------------------
  // 1. HARVEST TITHE INCREASE
  // ---------------------------------------------------------------
  {
    id: "decree_tax_harvest",
    name: "Harvest Tithe Increase",
    description:
      "Raise the harvest tax from 10% to 15% of all grain produced. " +
      "Every family owes an additional portion of their yield to the " +
      "lord's granary at harvest time.",
    flavor:
      "A wax-sealed proclamation posted on the church door and village square.",
    effects: { people: -4, treasury: 5, church: -1, military: 0 },
    duration: "permanent",
    revokable: true,
  },

  // ---------------------------------------------------------------
  // 2. TAX RELIEF FOR THE POOR
  // ---------------------------------------------------------------
  {
    id: "decree_tax_relief",
    name: "Tax Relief for the Poor",
    description:
      "Exempt the poorest families from all taxation for one year. " +
      "Those with less than five acres of land pay nothing until " +
      "the next Michaelmas.",
    flavor:
      "The herald reads the decree at the village cross, and several " +
      "women burst into tears of relief.",
    effects: { people: 6, treasury: -4, church: 2, military: 0 },
    duration: "permanent",
    revokable: true,
  },

  // ---------------------------------------------------------------
  // 3. ESTABLISH WEEKLY MARKET
  // ---------------------------------------------------------------
  {
    id: "decree_weekly_market",
    name: "Establish Weekly Market",
    description:
      "Grant a charter for a weekly market every Wednesday at the " +
      "village crossroads. Merchants may sell goods, and the lord " +
      "collects tolls from every stall.",
    flavor:
      "Stalls spring up within a fortnight, and the sound of haggling " +
      "fills the air each market day.",
    effects: { people: 2, treasury: 3, church: 0, military: 0 },
    duration: "permanent",
    revokable: true,
  },

  // ---------------------------------------------------------------
  // 4. FORM VILLAGE MILITIA
  // ---------------------------------------------------------------
  {
    id: "decree_militia",
    name: "Form Village Militia",
    description:
      "Every able-bodied man between 16 and 50 must train with a " +
      "quarterstaff or bow one day per week. The village will defend " +
      "itself in times of need.",
    flavor:
      "Sergeant Wulf begins drilling reluctant farmers in the yard, " +
      "their pitchforks replaced with staves.",
    effects: { people: -3, treasury: -2, church: 0, military: 5 },
    duration: "permanent",
    revokable: true,
  },

  // ---------------------------------------------------------------
  // 5. REPAIR VILLAGE CHURCH
  // ---------------------------------------------------------------
  {
    id: "decree_church_repair",
    name: "Repair Village Church",
    description:
      "Fund a full restoration of the village church — new roof " +
      "timbers, repaired windows, and a fresh coat of limewash. " +
      "Father Aldous has been asking for two years.",
    flavor:
      "Masons and carpenters descend on the church, and the sound of " +
      "hammering echoes through the village for weeks.",
    effects: { people: 1, treasury: -5, church: 6, military: 0 },
    duration: "1 event",
    revokable: false,
  },

  // ---------------------------------------------------------------
  // 6. REPAIR THE KING'S ROAD
  // ---------------------------------------------------------------
  {
    id: "decree_road_repair",
    name: "Repair the King's Road",
    description:
      "Fill the ruts, clear the ditches, and lay gravel on the main " +
      "road through the estate. Better roads mean faster trade and " +
      "easier travel for everyone.",
    flavor:
      "For three weeks, every spare hand in the village hauls gravel " +
      "and digs drainage ditches along the rutted highway.",
    effects: { people: 2, treasury: -3, church: 0, military: 0 },
    duration: "permanent",
    revokable: false,
  },

  // ---------------------------------------------------------------
  // 7. IMPOSE NIGHTTIME CURFEW
  // ---------------------------------------------------------------
  {
    id: "decree_curfew",
    name: "Impose Nighttime Curfew",
    description:
      "No villager may be outside their home after the ringing of " +
      "the curfew bell at dusk. Violators will be fined one penny " +
      "and spend a night in the stocks.",
    flavor:
      "The curfew bell tolls at sunset, and the streets empty quickly. " +
      "Only the night watch patrols by torchlight.",
    effects: { people: -4, treasury: 0, church: 1, military: 3 },
    duration: "permanent",
    revokable: true,
  },

  // ---------------------------------------------------------------
  // 8. DECLARE A FEAST DAY
  // ---------------------------------------------------------------
  {
    id: "decree_feast",
    name: "Declare a Feast Day",
    description:
      "Declare a day of celebration for the entire estate. Open the " +
      "stores, roast the oxen, and let the ale flow. The people " +
      "deserve a day of joy.",
    flavor:
      "Trestle tables are dragged into the yard, the kitchen fires " +
      "roar from dawn, and the village forgets its troubles for one " +
      "glorious day.",
    effects: { people: 7, treasury: -6, church: 0, military: -1 },
    duration: "1 event",
    revokable: false,
  },

  // ---------------------------------------------------------------
  // 9. BAN FOREIGN MERCHANTS
  // ---------------------------------------------------------------
  {
    id: "decree_ban_foreign",
    name: "Ban Foreign Merchants",
    description:
      "No merchant from outside the shire may sell goods on the " +
      "estate without express permission from the lord. Local " +
      "traders are to be given preference in all markets.",
    flavor:
      "The guards turn away three Flemish traders at the gate. " +
      "The local merchants nod approvingly, though their prices " +
      "soon creep upward.",
    effects: { people: -2, treasury: -2, church: 1, military: 0 },
    duration: "permanent",
    revokable: true,
  },

  // ---------------------------------------------------------------
  // 10. FUND VILLAGE SCHOOLING
  // ---------------------------------------------------------------
  {
    id: "decree_schooling",
    name: "Fund Village Schooling",
    description:
      "Pay for a literate clerk to teach the village children their " +
      "letters and numbers three mornings per week. Knowledge is the " +
      "foundation of a prosperous estate.",
    flavor:
      "A converted barn becomes the village school. Children crowd " +
      "in, slate tablets in hand, while their parents look on with " +
      "a mixture of pride and bewilderment.",
    effects: { people: 3, treasury: -3, church: 2, military: 0 },
    duration: "permanent",
    revokable: true,
  },

];


// ═══════════════════════════════════════════════════════════════════
// COUNCIL TOPICS
// ═══════════════════════════════════════════════════════════════════

export const COUNCIL_TOPICS = [

  // ---------------------------------------------------------------
  // 1. THE MARRIAGE ALLIANCE (Political)
  // ---------------------------------------------------------------
  {
    id: "council_001",
    title: "The Marriage Alliance",
    description:
      "A neighboring lord, Baron Godfrey of Blackthorn, offers a " +
      "marriage alliance. His daughter would marry your cousin, " +
      "binding the two estates. In return, Godfrey asks that you " +
      "support his disputed claim to a silver mine — a claim the " +
      "Church considers questionable.",
    advisors: {
      edmund: {
        position: "support",
        speech:
          "The gold from the silver mine would strengthen our reserves " +
          "considerably, my lord. Baron Godfrey is wealthy and his " +
          "alliance would protect our southern border. The cost is " +
          "merely a political favor.",
      },
      aldous: {
        position: "oppose",
        speech:
          "Supporting his claim against the Church's judgment is " +
          "dangerous, my lord. The bishop will not forget, and divine " +
          "favor is worth more than silver. I counsel caution.",
      },
      wulf: {
        position: "support",
        speech:
          "Military allies are worth more than gold, my lord. If " +
          "Godfrey's men stand with ours, our borders are twice as " +
          "strong. I say accept — and let the priests sort out their " +
          "own quarrels.",
      },
      margery: {
        position: "neutral",
        speech:
          "The people care little for noble marriages, my lord. They " +
          "want full bellies and safe roads. If this alliance brings " +
          "that, they'll cheer. If it brings war with the Church, " +
          "they'll curse your name.",
      },
    },
    options: [
      {
        id: "accept",
        label: "Accept the Alliance",
        consequences: { treasury: 5, military: 3, church: -4, people: 0 },
        aftermath:
          "The marriage is arranged for midsummer. Baron Godfrey sends " +
          "a generous dowry and twenty armed men as a gesture of goodwill. " +
          "The bishop sends a cold letter. Your southern border is secure, " +
          "but the Church's eye turns toward you with suspicion.",
      },
      {
        id: "decline",
        label: "Decline Politely",
        consequences: { treasury: 0, military: -2, church: 3, people: 1 },
        aftermath:
          "Baron Godfrey accepts your refusal with stiff courtesy, though " +
          "his letters grow less frequent. The bishop praises your judgment " +
          "in Sunday's sermon, and the village approves of a lord who does " +
          "not sell his honor for silver.",
      },
      {
        id: "counter",
        label: "Counter-Propose Without the Mine",
        consequences: { treasury: 2, military: 1, church: 0, people: 1 },
        aftermath:
          "You propose the marriage without supporting the mine claim. " +
          "Godfrey haggles, but ultimately agrees — the marriage alone has " +
          "value. The dowry is smaller, but neither Church nor neighbor " +
          "has cause for complaint. A diplomat's solution.",
      },
    ],
    historicalNote:
      "Marriage alliances were the most common form of medieval diplomacy. " +
      "Families were bound together through strategic marriages that " +
      "secured borders, settled disputes, and consolidated wealth. A " +
      "lord who refused an alliance risked making an enemy; one who " +
      "accepted risked entanglement in another family's problems.",
  },

  // ---------------------------------------------------------------
  // 2. THE NEW ROAD TO MARKET TOWN (Economic)
  // ---------------------------------------------------------------
  {
    id: "council_002",
    title: "The Road to Ashford Market",
    description:
      "The old road to Ashford market town is rutted, flooded in " +
      "spring, and plagued by bandits in summer. Building a new road " +
      "through the forest would halve the travel time and open up " +
      "trade, but it would cost dearly and require cutting through " +
      "the Church's woodland.",
    advisors: {
      edmund: {
        position: "support",
        speech:
          "The road would pay for itself within two years, my lord. " +
          "Faster travel means more trade, more trade means more tolls, " +
          "and more tolls mean a healthier treasury. The numbers are " +
          "clear.",
      },
      aldous: {
        position: "oppose",
        speech:
          "That woodland belongs to the abbey, my lord. Cutting through " +
          "it without the abbot's blessing would be an affront to the " +
          "Church. Find another route, or seek permission first.",
      },
      wulf: {
        position: "support",
        speech:
          "A good road serves the garrison as well as the merchants. " +
          "We can move men and supplies faster, and the cleared forest " +
          "leaves fewer hiding places for bandits. I say build it.",
      },
      margery: {
        position: "support",
        speech:
          "The people have been complaining about that road for years, " +
          "my lord. Market day is a misery of mud and broken axles. " +
          "Build the road and you'll hear nothing but praise from " +
          "every family on the estate.",
      },
    },
    options: [
      {
        id: "build_through_forest",
        label: "Build Through the Forest",
        consequences: { treasury: -6, military: 2, church: -3, people: 4 },
        aftermath:
          "The road is built in eight weeks, straight and wide through " +
          "the cleared forest. Trade doubles within a season. The abbot " +
          "is furious, but the merchants and farmers sing your praises. " +
          "Sergeant Wulf stations a patrol along the new route.",
      },
      {
        id: "negotiate_with_abbey",
        label: "Negotiate With the Abbey First",
        consequences: { treasury: -4, military: 1, church: 1, people: 3 },
        aftermath:
          "You send Brother Marcus to negotiate with the abbot. After " +
          "two weeks of talks and a generous donation, the abbey grants " +
          "permission. The road is built with the Church's blessing, " +
          "though the delay and diplomacy cost extra coin.",
      },
      {
        id: "repair_old_road",
        label: "Repair the Old Road Instead",
        consequences: { treasury: -2, military: 0, church: 0, people: 1 },
        aftermath:
          "The old road is patched and drained, passable if not pleasant. " +
          "It's a fraction of the cost, but the bandits remain and the " +
          "journey is still long. The village is grateful for any " +
          "improvement, but knows it's a temporary fix.",
      },
    ],
    historicalNote:
      "Road building in medieval England was rare and expensive. Most " +
      "roads were simply dirt tracks that turned to mud in rain. The " +
      "Romans had built excellent stone roads centuries earlier, but " +
      "medieval lords rarely invested in new ones. When they did, the " +
      "economic benefits could be transformative for local trade.",
  },

  // ---------------------------------------------------------------
  // 3. THE REFUGEE QUESTION (Humanitarian)
  // ---------------------------------------------------------------
  {
    id: "council_003",
    title: "The Refugees from Thornbury",
    description:
      "A neighboring lord's harvest has failed catastrophically. " +
      "Forty families — men, women, and children — have arrived at " +
      "your border, starving and desperate. They beg for shelter " +
      "and food. Taking them in would strain your resources but " +
      "grow your population. Turning them away may save coin but " +
      "cost your soul.",
    advisors: {
      edmund: {
        position: "oppose",
        speech:
          "Forty families, my lord? That is forty mouths to feed every " +
          "day until the next harvest. Our stores are adequate for our " +
          "own people, but not for an extra village. The numbers do not " +
          "lie — this risks famine for all.",
      },
      aldous: {
        position: "support",
        speech:
          "My lord, the Gospel is clear on this point. 'I was a stranger " +
          "and you took me in.' To turn away the starving is a sin that " +
          "stains a man's soul forever. The Church will remember your " +
          "decision — and so will God.",
      },
      wulf: {
        position: "neutral",
        speech:
          "More people means more hands for the militia, my lord, but " +
          "also more mouths that weaken us if food runs short. I have " +
          "no strong opinion — but if they come, I want them screened " +
          "for troublemakers.",
      },
      margery: {
        position: "oppose",
        speech:
          "The village is already tight, my lord. Where will they " +
          "sleep? Whose fields will they work? Our people fear being " +
          "crowded out by strangers. Charity is noble, but our own " +
          "must come first.",
      },
    },
    options: [
      {
        id: "welcome_all",
        label: "Welcome All Refugees",
        consequences: { treasury: -5, military: 2, church: 5, people: 3 },
        aftermath:
          "The refugees stream in, gaunt and grateful. The grain stores " +
          "take a heavy blow, but the church rings its bells in celebration. " +
          "Within weeks, the new families are clearing land and planting. " +
          "The estate grows stronger — if the food holds out.",
      },
      {
        id: "accept_some",
        label: "Accept Families With Skills",
        consequences: { treasury: -2, military: 1, church: 1, people: 2 },
        aftermath:
          "You select twenty families — farmers, a blacksmith, two " +
          "carpenters, and a mason. The rest are turned away with a " +
          "day's food. The chosen families prove valuable, but guilt " +
          "lingers over those left at the border.",
      },
      {
        id: "refuse",
        label: "Close the Borders",
        consequences: { treasury: 1, military: 0, church: -4, people: -2 },
        aftermath:
          "The guards turn the refugees away. Women weep. Children " +
          "stare with hollow eyes. Father Aldous refuses to speak to " +
          "you for a week, and the village is divided — some relieved, " +
          "some ashamed. The refugees scatter to other estates.",
      },
    ],
    historicalNote:
      "Medieval lords regularly faced refugee crises caused by famine, " +
      "war, or plague. The decision to accept or reject displaced people " +
      "was both moral and practical. Some lords welcomed refugees for " +
      "the labor they provided; others feared the strain on resources. " +
      "The Church consistently preached charity, but practical concerns " +
      "often won out.",
  },

  // ---------------------------------------------------------------
  // 4. THE DRAWBRIDGE TAX (Fiscal)
  // ---------------------------------------------------------------
  {
    id: "council_004",
    title: "The Drawbridge Toll",
    description:
      "The estate's stone bridge is the only crossing for miles. " +
      "Merchants, pilgrims, and travelers all use it. Raising the " +
      "toll would fill the treasury, but higher costs may drive " +
      "traders to longer routes — and the Church believes tolls on " +
      "pilgrims are sinful.",
    advisors: {
      edmund: {
        position: "support",
        speech:
          "We sit on the only good crossing between here and Ashford. " +
          "The merchants will pay because they have no choice — the " +
          "next ford is a day's ride south. A modest increase would " +
          "bring in twenty denarii a season with minimal complaint.",
      },
      aldous: {
        position: "oppose",
        speech:
          "Taxing pilgrims on their way to worship is an offense to " +
          "God, my lord. At the very least, exempt those on pilgrimage. " +
          "The bishop himself crossed this bridge last autumn and " +
          "remarked on the toll with displeasure.",
      },
      wulf: {
        position: "neutral",
        speech:
          "I care nothing for tolls, my lord, but I will say this: " +
          "a busy bridge means many strangers crossing our land. If " +
          "you raise the toll, I want a guard posted at the crossing " +
          "at all times. That costs coin too.",
      },
      margery: {
        position: "oppose",
        speech:
          "Higher tolls mean higher prices at market, my lord. The " +
          "merchants will pass the cost to our people. Everything we " +
          "buy from outside the estate will cost more. The treasury " +
          "gains, but every family's purse shrinks.",
      },
    },
    options: [
      {
        id: "raise_toll",
        label: "Raise the Toll for All",
        consequences: { treasury: 5, military: 0, church: -3, people: -3 },
        aftermath:
          "The new toll is posted at the bridge. Merchants grumble and " +
          "adjust their prices. Pilgrims complain to the bishop. The " +
          "treasury swells, but market prices rise and the Church sends " +
          "a sharply worded letter about Christian hospitality.",
      },
      {
        id: "raise_exempt_pilgrims",
        label: "Raise Toll, Exempt Pilgrims",
        consequences: { treasury: 3, military: 0, church: 1, people: -1 },
        aftermath:
          "Merchants pay the higher toll while pilgrims cross freely. " +
          "The Church is satisfied, and the treasury benefits modestly. " +
          "Some merchants begin disguising their goods carts as " +
          "pilgrimage wagons, which Wulf finds amusing but problematic.",
      },
      {
        id: "keep_current",
        label: "Keep the Current Toll",
        consequences: { treasury: 0, military: 0, church: 0, people: 1 },
        aftermath:
          "Nothing changes. The toll remains fair, the merchants keep " +
          "coming, and the bridge stays busy. Edmund sighs at the " +
          "missed revenue, but the village appreciates stable prices " +
          "and the Church has no complaint.",
      },
    ],
    historicalNote:
      "Bridge tolls, called 'pontage,' were a major source of revenue " +
      "for medieval lords. Control of a river crossing gave enormous " +
      "economic leverage. However, the Church frequently objected to " +
      "tolls charged to pilgrims, and excessive tolls could drive trade " +
      "to rival routes. Balancing revenue against goodwill was a " +
      "constant challenge.",
  },

];


// ═══════════════════════════════════════════════════════════════════
// FEAST DATA
// ═══════════════════════════════════════════════════════════════════

export const FEAST_DATA = {

  /** Who to invite — affects different domains */
  guestOptions: [
    {
      id: "village",
      label: "The Village Folk",
      description: "Invite the common people to eat and drink in the lord's hall.",
      effects: { people: 4, treasury: -2, church: 0, military: 0 },
    },
    {
      id: "merchants",
      label: "Merchants & Traders",
      description: "Invite the merchant class — deals are made over shared ale.",
      effects: { people: 1, treasury: 3, church: 0, military: 0 },
    },
    {
      id: "clergy",
      label: "The Clergy",
      description: "Invite the church — Father Aldous and the local monks.",
      effects: { people: 0, treasury: -2, church: 4, military: 0 },
    },
    {
      id: "soldiers",
      label: "The Garrison",
      description: "Invite the soldiers — they deserve a night off duty.",
      effects: { people: 0, treasury: -3, church: 0, military: 4 },
    },
  ],

  /** Entertainment options during the feast */
  entertainmentOptions: [
    {
      id: "musicians",
      label: "Hire Musicians",
      effects: { people: 2, treasury: -1, church: 0, military: 0 },
    },
    {
      id: "tournament",
      label: "Hold a Tournament",
      effects: { people: 0, treasury: -2, church: 0, military: 2 },
    },
    {
      id: "blessing",
      label: "Priestly Blessing",
      effects: { people: 0, treasury: 0, church: 2, military: 0 },
    },
  ],

  /** What to serve — cost vs. people satisfaction */
  courseOptions: [
    {
      id: "lavish",
      label: "Lavish Spread",
      effects: { people: 3, treasury: -4, church: 0, military: 0 },
    },
    {
      id: "modest",
      label: "Modest Fare",
      effects: { people: 1, treasury: -1, church: 0, military: 0 },
    },
    {
      id: "lords_wine",
      label: "The Lord's Best Wine",
      effects: { people: 2, treasury: -3, church: 0, military: 0 },
    },
  ],

  /** Random events that may fire during the feast */
  randomEvents: [
    {
      id: "fight",
      text:
        "A brawl breaks out between two guests over the last drumstick.",
      effects: { people: -1, treasury: 0, church: 0, military: 1 },
    },
    {
      id: "proposal",
      text:
        "A young couple announces their engagement before the whole hall.",
      effects: { people: 2, treasury: 0, church: 1, military: 0 },
    },
    {
      id: "noble_visit",
      text:
        "A minor noble from a neighboring estate arrives unannounced.",
      effects: { people: 0, treasury: 2, church: 0, military: 0 },
    },
    {
      id: "food_disaster",
      text:
        "The cook trips and sends the main course flying into the gallery.",
      effects: { people: -1, treasury: -1, church: 0, military: 0 },
    },
    {
      id: "bard_song",
      text:
        "A traveling bard composes a song about your lordship on the spot.",
      effects: { people: 3, treasury: 0, church: 0, military: 0 },
    },
    {
      id: "theft",
      text:
        "Someone steals a silver goblet from the high table.",
      effects: { people: 0, treasury: -2, church: 0, military: -1 },
    },
  ],

};
