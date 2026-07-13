/**
 * Great Hall Disputes for The Lord's Ledger
 *
 * 16 disputes the lord must adjudicate from the Great Hall.
 * Each dispute has two petitioners (or a solo decision), steward advice,
 * 2-4 ruling options with tradeoff consequences, and a historical note.
 *
 * Consequence ranges:
 *   Trivial: +/-1 | Small: +/-2-3 | Medium: +/-4-5
 *   Large: +/-6-8 | Massive: +/-9-12
 *
 * Categories: property, trade, crime, family, church, military, absurd
 * Tones: serious, comedic, tragic, tense
 * Difficulties: easy, medium, hard
 */

const DISPUTES = [

  // ---------------------------------------------------------------
  // 1. THE TRAMPLED CROPS (Property, Easy)
  // ---------------------------------------------------------------
  {
    id: "dispute_001",
    title: "The Trampled Crops",
    season: "any",
    category: "property",
    tone: "serious",
    difficulty: "easy",
    herald:
      "Two men of the village approach the Great Hall, mud still clinging " +
      "to their boots. They shove each other at the threshold before the " +
      "bailiff separates them with a sharp word.",
    petitionerA: {
      name: "Thomas the Farmer",
      portrait: "peasant",
      mood: "angry",
      speech:
        "My lord, I planted that barley with my own two hands, and I " +
        "watched it grow tall and golden through the summer rains. Then " +
        "this man's beast broke through the fence and trampled half my " +
        "crop to ruin. I have a wife and four children who will go hungry " +
        "come winter because of his carelessness.",
      evidence:
        "Thomas shows mud-caked hoofprints leading from a gap in the " +
        "fence directly through the center of his flattened barley field.",
    },
    petitionerB: {
      name: "William the Cattleman",
      portrait: "peasant",
      mood: "defensive",
      speech:
        "My lord, I am sorry for the damage, truly I am. But that fence " +
        "has been rotting for two seasons and Thomas never lifted a hand " +
        "to mend his side of it. The cow pushed through where the posts " +
        "had gone soft with damp. A man who will not maintain his own " +
        "fencing cannot blame my animals for finding the gap.",
      evidence:
        "William presents a piece of rotten fencing, snapped cleanly " +
        "where the wood has turned black with decay, from Thomas's side " +
        "of the boundary.",
    },
    stewardAdvice:
      "My lord, both men have a point. The custom of the manor holds " +
      "that each landholder maintains his own side of a shared fence. " +
      "Yet the cattleman is also bound to keep his animals properly " +
      "penned. A split ruling may keep both men working their land " +
      "rather than nursing grievances.",
    rulings: [
      {
        id: "a",
        label: "Rule for Thomas",
        decree:
          "William the Cattleman shall pay Thomas eight shillings for " +
          "the ruined barley crop, to be delivered in coin or kind before " +
          "the next market day. Let it be known that a man's beasts are " +
          "his responsibility.",
        consequences: { people: 5, treasury: -2, church: 0, military: 0 },
        aftermath:
          "Thomas bows deeply, clutching his cap. William storms out of " +
          "the hall muttering about rotten fences and unjust lords. His " +
          "neighbors later report he repaired his own pen that very evening.",
        reputation_shift: "protector",
      },
      {
        id: "b",
        label: "Rule for William",
        decree:
          "Thomas the Farmer failed in his duty to maintain the shared " +
          "fence, and thus bears the fault for his own loss. No " +
          "compensation is owed. Let this be a lesson in proper upkeep.",
        consequences: { people: -5, treasury: 3, church: 0, military: 0 },
        aftermath:
          "William grins broadly and slaps Thomas on the back as they " +
          "leave. Thomas's face darkens. That night, his wife is heard " +
          "weeping. The village murmurs that the lord favors cattle over " +
          "crops.",
        reputation_shift: "pragmatist",
      },
      {
        id: "c",
        label: "Split responsibility",
        decree:
          "Both men share fault in this matter. William shall pay Thomas " +
          "four shillings for the crop damage, and Thomas shall repair " +
          "his fence within a fortnight or face a fine. The bailiff will " +
          "inspect all shared fences by Michaelmas.",
        consequences: { people: 2, treasury: 1, church: 1, military: 0 },
        aftermath:
          "Neither man is entirely satisfied, but both nod grudgingly. " +
          "By the following week, several villagers have begun mending " +
          "their fences without being told. The steward notes the wisdom " +
          "of the ruling in the manor rolls.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "In medieval England, disputes over livestock damage to crops were " +
      "among the most common cases heard in manorial courts. The custom " +
      "of shared fence maintenance was codified in many village bylaws, " +
      "and fines for straying animals appear constantly in court rolls " +
      "from the 13th and 14th centuries.",
  },

  // ---------------------------------------------------------------
  // 2. THE STOLEN PIG (Property, Easy)
  // ---------------------------------------------------------------
  {
    id: "dispute_002",
    title: "The Stolen Pig",
    season: "autumn",
    category: "property",
    tone: "serious",
    difficulty: "easy",
    herald:
      "A red-faced butcher drags a swineherd before the Great Hall by " +
      "the collar of his tunic. A large spotted pig trots behind them, " +
      "seemingly unbothered by the commotion.",
    petitionerA: {
      name: "Thomas the Butcher",
      portrait: "merchant",
      mood: "angry",
      speech:
        "My lord, that pig is mine and no other's! I raised her from a " +
        "piglet and she bears my ear-notch plain as day — a half-moon " +
        "cut on the left ear. I went looking when she vanished three " +
        "days past and found her fat and happy in this man's pen. He is " +
        "a thief and should answer for it.",
      evidence:
        "Thomas points to the pig's left ear, which bears a distinctive " +
        "half-moon notch matching the mark registered in the manor rolls " +
        "under his name.",
    },
    petitionerB: {
      name: "Simon the Swineherd",
      portrait: "peasant",
      mood: "nervous",
      speech:
        "My lord, I swear on the Holy Virgin I did not steal this beast. " +
        "She wandered into my pen of her own will three days ago, " +
        "looking thin and lost. I fed her and kept her safe, thinking " +
        "she was a stray. I would have brought her to the reeve come " +
        "market day, as is the custom.",
      evidence:
        "Simon presents a small wooden tally showing the grain he fed " +
        "the pig over three days, suggesting he kept careful account of " +
        "the expense.",
    },
    stewardAdvice:
      "My lord, the ear-notch is clear and the manor rolls confirm the " +
      "pig belongs to Thomas. The question is whether Simon kept the " +
      "beast with intent to steal or merely failed to report it quickly " +
      "enough. A middle path would resolve this without branding a " +
      "possibly honest man a thief.",
    rulings: [
      {
        id: "a",
        label: "Rule for Thomas",
        decree:
          "The pig belongs to Thomas the Butcher by the evidence of the " +
          "ear-notch and the manor rolls. Simon the Swineherd shall " +
          "return the pig immediately and pay a fine of two shillings " +
          "for failing to report a found animal as custom requires.",
        consequences: { people: 3, treasury: 1, church: 0, military: 0 },
        aftermath:
          "Thomas leads his pig home with great satisfaction. Simon " +
          "shuffles away, eyes downcast but relieved to avoid the charge " +
          "of theft. The villagers agree the ruling was fair, and several " +
          "report stray animals to the reeve that week.",
        reputation_shift: "just",
      },
      {
        id: "b",
        label: "Rule for Simon",
        decree:
          "Simon the Swineherd acted in good faith by sheltering a stray " +
          "animal and keeping account of its feed. Thomas the Butcher " +
          "should have penned his animals more carefully. The pig is " +
          "returned, but Thomas shall reimburse Simon's feed costs.",
        consequences: { people: -3, treasury: 0, church: -1, military: 0 },
        aftermath:
          "Thomas sputters with outrage, declaring that a man who loses " +
          "a pig to wandering should not be punished for it. Several " +
          "villagers whisper that the lord rewards those who keep what " +
          "is not theirs. Simon keeps his head down for weeks.",
        reputation_shift: "lenient",
      },
      {
        id: "c",
        label: "Return pig and pay for care",
        decree:
          "The pig is Thomas's by right of the ear-notch. Simon sheltered " +
          "the beast and kept honest tally of the feed, so Thomas shall " +
          "pay Simon sixpence for the care of his animal. In future, " +
          "all found animals must be reported to the reeve within one day.",
        consequences: { people: 1, treasury: 0, church: 1, military: 0 },
        aftermath:
          "Both men leave the hall in reasonable spirits. Thomas grumbles " +
          "about paying for his own pig's dinner, but Simon's honesty is " +
          "acknowledged. The new reporting rule prevents similar disputes " +
          "in the months that follow.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "Ear-notching was the medieval equivalent of branding. Every " +
      "pig owner registered a unique ear-mark in the manor court rolls, " +
      "and disputes over livestock identification were resolved by " +
      "checking these records. Pig theft was taken very seriously — " +
      "repeat offenders could face mutilation or hanging.",
  },

  // ---------------------------------------------------------------
  // 3. THE BROKEN BETROTHAL (Family, Medium)
  // ---------------------------------------------------------------
  {
    id: "dispute_003",
    title: "The Broken Betrothal",
    season: "spring",
    category: "family",
    tone: "serious",
    difficulty: "medium",
    herald:
      "An old farmer in his Sunday best leads his daughter into the hall. " +
      "Behind them, a young cooper lingers near the door as though ready " +
      "to bolt. The air between them is thick with unspoken words.",
    petitionerA: {
      name: "Henry the Elder",
      portrait: "peasant",
      mood: "angry",
      speech:
        "My lord, last Michaelmas this young man John Cooper pledged " +
        "before witnesses to marry my Margaret. Now he refuses, saying " +
        "the dowry was never paid. The dowry was agreed at two marks, " +
        "and I set aside the coin. He simply found a richer girl in the " +
        "next village and wants to wriggle free of his oath.",
      evidence:
        "Henry produces an unsigned betrothal contract on scraped " +
        "parchment, with the dowry amount scratched out and rewritten " +
        "at least twice, making the agreed sum unclear.",
    },
    petitionerB: {
      name: "John Cooper",
      portrait: "peasant",
      mood: "defensive",
      speech:
        "My lord, I meant to marry Margaret, truly. But Henry promised " +
        "two marks and never delivered a penny. I waited through winter " +
        "and asked three times. A man cannot start a household on " +
        "promises. I bear Margaret no ill will, but I will not be bound " +
        "to a bargain that was never kept on the other side.",
      evidence:
        "John presents testimony from his master, the village cooper, " +
        "stating that John asked Henry for the dowry three times over " +
        "the winter months and was put off each time.",
    },
    stewardAdvice:
      "My lord, betrothal contracts carry the weight of law, yet a " +
      "contract with no clear terms is hard to enforce. The Church " +
      "holds that a promise to marry is nearly as binding as marriage " +
      "itself. But forcing an unwilling groom rarely makes for a happy " +
      "household.",
    rulings: [
      {
        id: "a",
        label: "Enforce the marriage",
        decree:
          "A betrothal sworn before witnesses is a sacred bond. John " +
          "Cooper shall marry Margaret before Whitsunday, and Henry " +
          "shall deliver the dowry of two marks on the wedding day. Any " +
          "party who fails shall be fined five shillings.",
        consequences: { people: -3, treasury: 1, church: 4, military: 0 },
        aftermath:
          "The Church approves heartily, and Father Aldous notes the " +
          "lord's piety in upholding sacred oaths. But Margaret's eyes " +
          "are red as she leaves, and John's jaw is set like stone. The " +
          "village wonders whether a forced union can find happiness.",
        reputation_shift: "traditional",
      },
      {
        id: "b",
        label: "Void the betrothal",
        decree:
          "The contract is unsigned and the dowry amount disputed. No " +
          "man shall be forced to marry against his settled will. The " +
          "betrothal is dissolved. John Cooper shall pay Henry two " +
          "shillings for the insult to his daughter's honor.",
        consequences: { people: 3, treasury: -1, church: -3, military: 0 },
        aftermath:
          "John nearly collapses with relief. Margaret's father leads " +
          "her away, grim-faced but dignified. Father Aldous mutters " +
          "about the sanctity of promises. Within a month, Margaret " +
          "catches the eye of the miller's son, who proves a kinder match.",
        reputation_shift: "merciful",
      },
      {
        id: "c",
        label: "Order dowry paid and let them choose",
        decree:
          "Henry shall deliver the full two marks within a fortnight. " +
          "Once the dowry is in hand, John and Margaret shall have one " +
          "month to decide freely whether to wed. If either refuses, " +
          "the dowry is returned and the matter is closed without penalty.",
        consequences: { people: 2, treasury: -1, church: 1, military: 0 },
        aftermath:
          "Both parties leave the hall uncertain but without grievance. " +
          "Henry scrambles to raise the coin, and John finds himself " +
          "reconsidering as Margaret brings him a pie the following " +
          "Sunday. The village watches with keen interest.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "In medieval canon law, a betrothal (sponsalia) was nearly as " +
      "binding as marriage itself. Breaking a betrothal could result in " +
      "excommunication. Disputes over dowry amounts were extremely " +
      "common, as agreements were often oral and witnesses disagreed " +
      "about the terms.",
  },

  // ---------------------------------------------------------------
  // 4. THE MILL RIGHTS (Trade, Medium)
  // ---------------------------------------------------------------
  {
    id: "dispute_004",
    title: "The Mill Rights",
    season: "summer",
    category: "trade",
    tone: "serious",
    difficulty: "medium",
    herald:
      "The baker's wife and the brewer's eldest son stand before the " +
      "Great Hall, each clutching yellowed parchments. Behind them, " +
      "the old miller wrings his hands, caught between two of his best " +
      "customers.",
    petitionerA: {
      name: "Agnes the Baker",
      portrait: "merchant",
      mood: "angry",
      speech:
        "My lord, my family has milled our flour on Tuesdays since your " +
        "grandfather's time — it is written here in the manor rolls. " +
        "Now the Brewers demand Tuesday as well, and the miller gives " +
        "them half my time. My bread feeds the village. Without my full " +
        "Tuesday, I cannot bake enough for market day on Wednesday.",
      evidence:
        "Agnes presents a faded entry in the manor court rolls from " +
        "forty years ago, granting the Baker family exclusive use of " +
        "the mill on Tuesdays.",
    },
    petitionerB: {
      name: "Robert the Brewer",
      portrait: "merchant",
      mood: "hopeful",
      speech:
        "My lord, my father's ale has become the finest in three " +
        "parishes and the demand grows with every market. I need Tuesday " +
        "milling to grind the malt for the week's brewing. The old " +
        "arrangement was made when the village was half its present " +
        "size. Times have changed, and the mill must change with them.",
      evidence:
        "Robert shows his account book with growing orders from the " +
        "tavern, the monastery, and two neighboring manors, proving " +
        "that ale production has doubled in three years.",
    },
    stewardAdvice:
      "My lord, the Baker family's Tuesday right is clearly recorded, " +
      "but the Brewer's trade brings coin into the manor. The mill can " +
      "grind from dawn to dusk — perhaps both families might share the " +
      "day, or a rotating schedule could serve. Whichever you decide, " +
      "the mill must keep turning.",
    rulings: [
      {
        id: "a",
        label: "Uphold the Baker's tradition",
        decree:
          "The Baker family's Tuesday right is confirmed by the manor " +
          "rolls and shall not be diminished. The Brewer may use the " +
          "mill on Thursdays, which currently stands idle. Ancient " +
          "rights shall be honored.",
        consequences: { people: 2, treasury: -1, church: 2, military: 0 },
        aftermath:
          "Agnes curtsies with tears of gratitude. Robert grumbles but " +
          "finds that Thursday milling suits his schedule well enough. " +
          "The village approves — tradition has weight here, and the " +
          "lord has shown he honors old promises.",
        reputation_shift: "traditional",
      },
      {
        id: "b",
        label: "Grant the Brewers Tuesday",
        decree:
          "The growth of the Brewer's trade brings prosperity to the " +
          "entire manor. The Brewers shall have Tuesday mornings for " +
          "malt grinding. The Baker family shall begin their milling at " +
          "midday. Progress demands flexibility.",
        consequences: { people: -2, treasury: 3, church: 0, military: 0 },
        aftermath:
          "Robert beams and promises a cask of his finest to the hall. " +
          "Agnes storms out, declaring that half a day is not enough to " +
          "feed the village. Her bread does become scarcer at market, " +
          "and prices rise slightly.",
        reputation_shift: "pragmatist",
      },
      {
        id: "c",
        label: "Create a rotating schedule",
        decree:
          "A new mill schedule is hereby established. The Baker shall " +
          "have full Tuesdays in the first and third weeks of each " +
          "month, and the Brewer in the second and fourth. The miller " +
          "shall post the schedule on the church door for all to see.",
        consequences: { people: 3, treasury: 1, church: -1, military: 0 },
        aftermath:
          "Neither family is fully happy, but both can plan their work. " +
          "The miller, relieved to have clear rules, carves the schedule " +
          "into a board by the mill door. Other tradesmen begin " +
          "requesting their own guaranteed mill days.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "The manorial mill was one of the lord's most valuable monopolies. " +
      "Tenants were often required to grind their grain at the lord's " +
      "mill and pay a fee called 'multure' — typically one-sixteenth of " +
      "the flour. Mill access disputes fill medieval court records, as " +
      "the order of milling could make or break a tradesman's week.",
  },

  // ---------------------------------------------------------------
  // 5. THE BOUNDARY STONE (Property, Medium)
  // ---------------------------------------------------------------
  {
    id: "dispute_005",
    title: "The Boundary Stone",
    season: "spring",
    category: "property",
    tone: "serious",
    difficulty: "medium",
    herald:
      "Two farmers approach the hall side by side but refuse to look at " +
      "one another. Between them, two boys carry a heavy limestone marker " +
      "on a plank, its base still crusted with fresh earth.",
    petitionerA: {
      name: "Gilbert the Plowman",
      portrait: "peasant",
      mood: "angry",
      speech:
        "My lord, I have plowed the same strip for twelve years and I " +
        "know its bounds like I know my own children's faces. This " +
        "spring I find the boundary stone moved a full rod to the east, " +
        "and Hector's field grown fat at my expense. That stone was set " +
        "by your father's surveyor and should not move on its own.",
      evidence:
        "Gilbert points out that the stone is suspiciously clean of moss " +
        "on its base, as though recently uprooted and reset, while " +
        "stones left in place for years are thick with lichen.",
    },
    petitionerB: {
      name: "Hector the Yeoman",
      portrait: "peasant",
      mood: "defensive",
      speech:
        "My lord, that stone has stood where it stands since I " +
        "inherited this land from my father. Gilbert is a good man but " +
        "his memory fails him. Perhaps the spring floods shifted the " +
        "earth around it. I have not touched it and I resent the " +
        "accusation most bitterly.",
      evidence:
        "Hector calls his eldest son, who swears the stone has always " +
        "been in that position, though the boy is only fifteen and has " +
        "been away at the monastery school for two years.",
    },
    stewardAdvice:
      "My lord, the church holds survey records from when these strips " +
      "were last measured, some eight years past. We could commission a " +
      "new survey at the manor's expense to settle the matter by " +
      "measurement rather than memory. The cost is three shillings for " +
      "the surveyor's fee.",
    rulings: [
      {
        id: "a",
        label: "Survey and reset the boundary",
        decree:
          "The manor shall commission a proper survey of the disputed " +
          "boundary using the church's records as reference. The stone " +
          "shall be set where the measurements place it, and any man " +
          "who moves a boundary marker hereafter shall be fined one " +
          "mark and lose his plowing rights for a season.",
        consequences: { people: 2, treasury: -3, church: 1, military: 0 },
        aftermath:
          "The surveyor arrives within the week and determines the stone " +
          "was indeed moved by nearly a rod. Hector accepts the finding " +
          "with a red face but no protest. Gilbert plows his full strip " +
          "again, and the harsh new penalty deters others from trying " +
          "the same trick.",
        reputation_shift: "just",
      },
      {
        id: "b",
        label: "Trust the church records",
        decree:
          "The church's survey records from eight years past shall serve " +
          "as the final word. Father Aldous shall read the measurements " +
          "aloud in the hall, and the boundary shall conform to what is " +
          "written. The Church's records are beyond dispute.",
        consequences: { people: -1, treasury: 0, church: 3, military: 0 },
        aftermath:
          "Father Aldous produces the records with great ceremony. The " +
          "measurements favor Gilbert, though by a smaller margin than " +
          "he claimed. Hector mutters that priests know ink better than " +
          "soil. The Church's authority in village matters grows " +
          "noticeably stronger.",
        reputation_shift: "pious",
      },
      {
        id: "c",
        label: "Split the disputed strip evenly",
        decree:
          "Since the truth of the stone's original position cannot be " +
          "proven beyond doubt, the disputed strip shall be divided " +
          "equally between both parties. A new stone shall be set at " +
          "the midpoint and marked with the manor seal.",
        consequences: { people: 2, treasury: -1, church: 0, military: 0 },
        aftermath:
          "Gilbert loses a few feet of land he believes is rightfully " +
          "his. Hector gains less than he hoped. But both men can plow " +
          "without rancor, and the compromise is seen as fair by the " +
          "village. The new stone, marked with the manor seal, carries " +
          "a warning no one wishes to test.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "Boundary stones were sacred in medieval England. Moving one was " +
      "considered a grave sin as well as a crime — some churches cursed " +
      "boundary-movers during the annual Rogationtide processions. " +
      "Parish perambulations, where villagers walked the boundaries " +
      "each year, helped prevent exactly this kind of dispute.",
  },

  // ---------------------------------------------------------------
  // 6. THE APPRENTICE'S COMPLAINT (Crime, Medium)
  // ---------------------------------------------------------------
  {
    id: "dispute_006",
    title: "The Apprentice's Complaint",
    season: "any",
    category: "crime",
    tone: "serious",
    difficulty: "medium",
    herald:
      "A thin boy of perhaps fourteen enters the hall with a bruised " +
      "cheek and a split lip. Behind him, a barrel-chested blacksmith " +
      "in a scorched leather apron stands with arms folded, jaw set " +
      "like an anvil.",
    petitionerA: {
      name: "Young Will",
      portrait: "peasant",
      mood: "sad",
      speech:
        "My lord, my father apprenticed me to Master Godfrey two years " +
        "ago to learn the smith's trade. But he uses me as a servant — " +
        "I haul coal and sweep ash from dawn until dark and he has not " +
        "taught me to shape so much as a nail. When I ask to learn, he " +
        "strikes me. Look at my face, my lord. This is not teaching.",
      evidence:
        "Will pulls back his sleeve to show older bruises in yellowing " +
        "layers along his forearms, suggesting a pattern of beatings " +
        "over many weeks.",
    },
    petitionerB: {
      name: "Godfrey the Blacksmith",
      portrait: "merchant",
      mood: "defensive",
      speech:
        "My lord, the boy is lazy and clumsy. I have taught three " +
        "apprentices before him and each learned the trade well. This " +
        "one refuses to do the basic work that every apprentice must " +
        "master before touching the anvil. A cuff now and then is the " +
        "right of any master — my own master did the same to me, and I " +
        "am grateful for it.",
      evidence:
        "Godfrey gestures to his three former apprentices, now " +
        "journeymen in neighboring villages, though none are present " +
        "in the hall. Two other apprentices in the hall stare at the " +
        "floor and say nothing.",
    },
    stewardAdvice:
      "My lord, a master's right to discipline is well established, " +
      "but so is his obligation to teach the trade. The boy's bruises " +
      "go beyond a simple cuff. The other apprentices' silence speaks " +
      "as loudly as any testimony. Yet Godfrey is our only blacksmith " +
      "and the village cannot do without his forge.",
    rulings: [
      {
        id: "a",
        label: "Side with Will and reassign him",
        decree:
          "Young Will is hereby released from his apprenticeship to " +
          "Godfrey. The manor shall find him a new master within the " +
          "month. Godfrey is fined three shillings for excessive " +
          "punishment and warned that further complaints will see his " +
          "right to take apprentices revoked.",
        consequences: { people: 4, treasury: -1, church: 0, military: -1 },
        aftermath:
          "Will's eyes fill with tears of relief. Godfrey's face turns " +
          "to thunder, and he works the forge in sullen silence for " +
          "weeks. But his remaining apprentices report that the beatings " +
          "stop entirely. The carpenter agrees to take Will on, and the " +
          "boy proves a quick study.",
        reputation_shift: "protector",
      },
      {
        id: "b",
        label: "Side with the blacksmith",
        decree:
          "A master's right to discipline his apprentice is upheld by " +
          "custom and law. Will shall return to the forge and apply " +
          "himself with greater diligence. If he will not work, he " +
          "shall be returned to his father in disgrace.",
        consequences: { people: -4, treasury: 2, church: 0, military: 1 },
        aftermath:
          "Godfrey claps the boy on the shoulder with a hand like a ham " +
          "and steers him toward the door. Will does not look back. The " +
          "village shakes its head, and mothers clutch their own " +
          "children a little tighter. Godfrey's forge keeps producing, " +
          "but the lord's reputation among the common folk suffers.",
        reputation_shift: "harsh",
      },
      {
        id: "c",
        label: "Investigate personally",
        decree:
          "The lord shall visit the forge unannounced within the " +
          "fortnight to observe the master's conduct and the boy's " +
          "diligence firsthand. Until then, Godfrey shall not strike " +
          "the boy for any reason. If the lord finds cause for concern, " +
          "a full hearing will follow.",
        consequences: { people: 3, treasury: -1, church: 1, military: 0 },
        aftermath:
          "The announcement sends ripples through the village. Godfrey, " +
          "aware he is being watched, becomes an almost gentle teacher " +
          "for the next two weeks. When the lord visits, Will is at the " +
          "anvil shaping his first horseshoe nail. Whether the " +
          "improvement will last remains to be seen, but the village " +
          "respects a lord who takes the trouble to look.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "Medieval apprenticeship contracts bound children to masters for " +
      "seven years or more. Masters had near-parental authority, " +
      "including the right to physically discipline apprentices. " +
      "However, extreme cruelty was grounds for dissolving the " +
      "contract, and manorial courts sometimes intervened to protect " +
      "abused apprentices.",
  },

  // ---------------------------------------------------------------
  // 7. WATER RIGHTS (Property, Medium)
  // ---------------------------------------------------------------
  {
    id: "dispute_007",
    title: "Water Rights",
    season: "summer",
    category: "property",
    tone: "serious",
    difficulty: "medium",
    herald:
      "A delegation of five farmers, sunburnt and grim, marches into " +
      "the hall. At their head walks a prosperous-looking man who " +
      "smells faintly of fish. The farmers' fields lie downstream; " +
      "his fish pond lies across the creek that feeds them.",
    petitionerA: {
      name: "The Downstream Farmers",
      portrait: "peasant",
      mood: "angry",
      speech:
        "My lord, we are five families whose fields have drunk from " +
        "Willow Creek since before any of us were born. This summer, " +
        "Edwin dammed the creek to make himself a fish pond, and now " +
        "our ditches run dry. Our crops are dying in the field. One " +
        "man's fish should not starve five families.",
      evidence:
        "The farmers show cracked, dry irrigation ditches that should " +
        "be running with water in midsummer, and wilting crops in the " +
        "fields beyond.",
    },
    petitionerB: {
      name: "Edwin the Freeman",
      portrait: "merchant",
      mood: "defensive",
      speech:
        "My lord, the creek runs through my land before it reaches " +
        "theirs. I have the right to use the water that crosses my " +
        "property. My fish pond supplies the manor's table with fresh " +
        "carp and pike, and I pay a higher rent than any of these men. " +
        "If they want more water, let them dig a well.",
        evidence:
        "Edwin produces his charter showing he holds freehold land and " +
        "pays premium rent, including a yearly gift of twelve fresh " +
        "fish to the lord's kitchen.",
    },
    stewardAdvice:
      "My lord, water rights are among the thorniest matters in law. " +
      "Edwin's charter gives him use of the water on his land, but the " +
      "ancient custom of riparian rights holds that downstream users " +
      "must not be deprived entirely. A partial dam that allows some " +
      "flow might satisfy both parties, though neither will love it.",
    rulings: [
      {
        id: "a",
        label: "Tear down the dam",
        decree:
          "No man may dam a common waterway to the detriment of his " +
          "neighbors. Edwin shall dismantle his dam within three days " +
          "and restore the natural flow of Willow Creek. He may keep " +
          "a small weir for a modest fish trap, but the creek must run " +
          "free.",
        consequences: { people: 4, treasury: -2, church: 0, military: 0 },
        aftermath:
          "The downstream farmers cheer and clap one another on the " +
          "backs. Edwin's face goes dark as storm clouds. He dismantles " +
          "the dam in bitter silence, and the creek flows again within " +
          "the day. The fish he already stocked swim away downstream, " +
          "and several end up in the farmers' cooking pots.",
        reputation_shift: "protector",
      },
      {
        id: "b",
        label: "Let the dam stand",
        decree:
          "Edwin holds freehold land and has the right to improve his " +
          "property as he sees fit. The downstream farmers shall seek " +
          "other sources of water. The manor will contribute timber for " +
          "a communal well at the crossroads.",
        consequences: { people: -4, treasury: 3, church: 0, military: 0 },
        aftermath:
          "Edwin bows with a satisfied smile and promises an extra " +
          "gift of fish to the lord's table. The farmers leave in " +
          "angry silence. By autumn, two of the five families have lost " +
          "their crops entirely. The village mutters that the lord " +
          "favors coin over common folk.",
        reputation_shift: "pragmatist",
      },
      {
        id: "c",
        label: "Require partial flow",
        decree:
          "Edwin may keep his fish pond but must modify the dam to " +
          "allow half the creek's natural flow to pass downstream at " +
          "all times. The manor's carpenter shall design a sluice gate " +
          "at Edwin's expense. The bailiff will inspect it monthly.",
        consequences: { people: 2, treasury: 1, church: 1, military: 0 },
        aftermath:
          "Neither party is delighted, but the sluice gate works well. " +
          "Edwin's pond is smaller than he wished but still productive. " +
          "The downstream fields recover, though yields are lower than " +
          "in years past. The village sees the lord as a man who finds " +
          "the middle ground.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "Water rights were a constant source of medieval litigation. The " +
      "doctrine of riparian rights held that those living along a " +
      "waterway could use it but not deplete it to the harm of " +
      "downstream neighbors. Fish ponds were a mark of status — even " +
      "monasteries fought bitterly over the right to dam streams for " +
      "their Friday fish.",
  },

  // ---------------------------------------------------------------
  // 8. THE COUNTERFEIT COINS (Trade, Medium)
  // ---------------------------------------------------------------
  {
    id: "dispute_008",
    title: "The Counterfeit Coins",
    season: "autumn",
    category: "trade",
    tone: "tense",
    difficulty: "medium",
    herald:
      "A merchant strides into the hall and slams a handful of silver " +
      "pennies onto the table. They ring with a dull thud instead of " +
      "the bright chime of true coin. Behind him, a thin-faced customer " +
      "shifts from foot to foot.",
    petitionerA: {
      name: "Hugh the Merchant",
      portrait: "merchant",
      mood: "angry",
      speech:
        "My lord, I sold this man two bolts of good wool cloth at fair " +
        "market price. He paid me in silver pennies that looked true " +
        "enough by candlelight. But in the morning I found them shaved " +
        "and clipped — near a quarter of the silver is gone from each " +
        "one. I have been cheated of five shillings by weight.",
      evidence:
        "Hugh stacks the coins beside true pennies for comparison. The " +
        "clipped coins are noticeably smaller and lighter, their edges " +
        "rough where silver has been trimmed away.",
    },
    petitionerB: {
      name: "Osbert the Tanner",
      portrait: "merchant",
      mood: "nervous",
      speech:
        "My lord, I did not clip those coins! I received them as change " +
        "from another stallkeeper at the Michaelmas fair — I do not " +
        "know which one, for I visited many stalls that day. I am a " +
        "tanner, not a moneyer. I would not know how to shave a coin " +
        "if my life depended upon it.",
      evidence:
        "Osbert shows his rough, leather-stained hands and his simple " +
        "tanning tools, none of which could be used for the delicate " +
        "work of coin-clipping.",
    },
    stewardAdvice:
      "My lord, coin-clipping is a crime against the Crown itself, " +
      "punishable by the loss of a hand or worse. But this man may " +
      "truly be an innocent passer of bad coin. We could send the coins " +
      "to the assayer in the market town for testing, or we could " +
      "investigate the market stalls ourselves. Either way, the " +
      "merchant must be made whole.",
    rulings: [
      {
        id: "a",
        label: "Punish Osbert",
        decree:
          "The man who passes false coin bears the responsibility, " +
          "whether he clipped them or not. Osbert shall pay Hugh the " +
          "full difference in true silver and is fined two shillings " +
          "for bringing debased currency into the market. Let all take " +
          "care to examine their coins before spending them.",
        consequences: { people: -3, treasury: 1, church: 0, military: 2 },
        aftermath:
          "Osbert pales and empties his purse on the table. Hugh is " +
          "satisfied. The village market becomes noticeably more " +
          "careful about coin quality, with merchants biting pennies " +
          "before accepting them. But some whisper that the true " +
          "clipper goes free while an honest tanner pays.",
        reputation_shift: "harsh",
      },
      {
        id: "b",
        label: "Investigate the whole market",
        decree:
          "The bailiff shall examine the coin of every stallkeeper who " +
          "traded at the Michaelmas fair. All debased coins found shall " +
          "be confiscated and their holders questioned. Hugh shall be " +
          "reimbursed from the fines collected. The market must be " +
          "cleansed of this blight.",
        consequences: { people: 2, treasury: 3, church: 0, military: -1 },
        aftermath:
          "The investigation turns up clipped coins at three other " +
          "stalls. A traveling tinker is identified as the likely source " +
          "and banned from the market. The stallkeepers grumble about " +
          "the disruption but admit the market is healthier for it. " +
          "Hugh gets his money back from the collected fines.",
        reputation_shift: "just",
      },
      {
        id: "c",
        label: "Send coins to the assayer",
        decree:
          "These coins shall be sent to the royal assayer in the market " +
          "town for proper testing and valuation. Until the assayer " +
          "reports, Osbert shall deposit a bond of five shillings with " +
          "the manor court. If he is found innocent, his bond and " +
          "reputation shall be restored.",
        consequences: { people: 1, treasury: 2, church: 1, military: 0 },
        aftermath:
          "The assayer confirms the coins were clipped by an expert " +
          "hand — not an amateur tanner. Osbert is cleared and his bond " +
          "returned. The assayer's report is posted at the market cross, " +
          "warning all traders to examine coins carefully. The true " +
          "clipper is never found, but the warning reduces the problem.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "Coin-clipping — shaving silver from the edges of coins — was " +
      "one of the most common economic crimes in medieval England. It " +
      "was technically high treason, punishable by death. In 1278, " +
      "Edward I arrested 680 people in a single crackdown. The " +
      "introduction of milled edges on coins in later centuries was " +
      "specifically designed to prevent clipping.",
  },

  // ---------------------------------------------------------------
  // 9. THE FOREST GATHERING RIGHTS (Crime, Medium)
  // ---------------------------------------------------------------
  {
    id: "dispute_009",
    title: "The Forest Gathering Rights",
    season: "autumn",
    category: "crime",
    tone: "tense",
    difficulty: "medium",
    herald:
      "A crowd of peasant women with baskets over their arms stands " +
      "opposite a grim-faced gamekeeper in forest green. The women " +
      "outnumber him ten to one, but his crossbow and the law are on " +
      "his side.",
    petitionerA: {
      name: "Maud the Herbwife",
      portrait: "peasant",
      mood: "hopeful",
      speech:
        "My lord, your father — God rest him — allowed us to gather " +
        "fallen wood, mushrooms, and herbs from the forest floor. We " +
        "take nothing living, we cut no trees. The forest gives us " +
        "fuel for our hearths and remedies for our sick. Without these " +
        "things, the poorest among us will freeze and sicken come " +
        "winter.",
      evidence:
        "Maud presents a basket of gathered goods — dead branches, " +
        "dried mushrooms, bundles of herbs — to show that nothing " +
        "living has been cut or harmed.",
    },
    petitionerB: {
      name: "Ralf the Gamekeeper",
      portrait: "military",
      mood: "angry",
      speech:
        "My lord, every time the gatherers enter the forest they " +
        "disturb the game. The deer flee, the boar scatter, and your " +
        "hunting suffers. Worse, I have caught poachers hiding among " +
        "the women with snares in their baskets. If we allow gathering, " +
        "we cannot control who enters and what they truly take.",
      evidence:
        "Ralf produces three rabbit snares confiscated from gatherers " +
        "in the past month, hidden beneath bundles of kindling.",
    },
    stewardAdvice:
      "My lord, the right of estover — gathering fallen wood and " +
      "forage — is an ancient custom that your father upheld. But the " +
      "gamekeeper's concern about poaching is real. Perhaps designated " +
      "gathering days, when the gamekeeper can patrol, would preserve " +
      "the right while protecting the game.",
    rulings: [
      {
        id: "a",
        label: "Allow unrestricted gathering",
        decree:
          "The ancient right of estover is hereby restored in full. " +
          "The people of the manor may gather fallen wood, mushrooms, " +
          "herbs, and nuts from the forest floor at any time. Any " +
          "person found with a snare or weapon in the forest shall " +
          "answer for poaching separately.",
        consequences: { people: 5, treasury: 0, church: 0, military: -3 },
        aftermath:
          "The women burst into grateful chatter and bless the lord's " +
          "name. Ralf stalks from the hall, jaw clenched. Over the " +
          "following weeks, the forest is busy with gatherers and the " +
          "deer indeed grow scarcer. Two more snares are found, but " +
          "the culprits are caught and punished. The poor have fuel " +
          "for winter.",
        reputation_shift: "protector",
      },
      {
        id: "b",
        label: "Allow gathering on specific days only",
        decree:
          "Gathering is permitted on Wednesdays and Saturdays only, " +
          "when the gamekeeper shall be present to inspect baskets upon " +
          "entry and exit. Any person found with hunting tools or game " +
          "shall forfeit their gathering rights for one year. The " +
          "forest shall rest on all other days.",
        consequences: { people: 2, treasury: 0, church: 1, military: 1 },
        aftermath:
          "The women accept the compromise with cautious gratitude. " +
          "Ralf is satisfied with the control it gives him. The " +
          "Wednesday and Saturday markets gain a new section of forest " +
          "goods, and the basket inspections catch one poacher in the " +
          "first month. The system works well enough.",
        reputation_shift: "wise",
      },
      {
        id: "c",
        label: "Ban all gathering",
        decree:
          "The forest is the lord's demesne and shall be closed to all " +
          "gathering until further notice. Any person found within the " +
          "forest bounds without the gamekeeper's permission shall be " +
          "fined one shilling and confined to the stocks for a day.",
        consequences: { people: -6, treasury: 0, church: -1, military: 4 },
        aftermath:
          "The women leave the hall in stunned silence, and Maud's eyes " +
          "burn with quiet fury. That winter, the poorest families " +
          "struggle for fuel and several children fall ill without " +
          "herbal remedies. The gamekeeper's authority is absolute, but " +
          "the lord's name is cursed in every cottage.",
        reputation_shift: "tyrant",
      },
    ],
    historicalNote:
      "The right of estover — gathering fallen wood and forest products " +
      "— was one of the most fiercely defended peasant rights in " +
      "medieval England. The Charter of the Forest (1217), a companion " +
      "to Magna Carta, specifically protected these rights. When lords " +
      "restricted forest access, it often led to widespread resentment " +
      "and even rebellion.",
  },

  // ---------------------------------------------------------------
  // 10. THE DEBT SPIRAL (Trade, Medium)
  // ---------------------------------------------------------------
  {
    id: "dispute_010",
    title: "The Debt Spiral",
    season: "winter",
    category: "trade",
    tone: "serious",
    difficulty: "medium",
    herald:
      "A haggard farmer in patched clothing stands across from a " +
      "well-fed neighbor who jingles coins in his pocket. Behind them, " +
      "Father Aldous has come uninvited, his presence a pointed comment " +
      "on the matter at hand.",
    petitionerA: {
      name: "Edmund the Tenant",
      portrait: "peasant",
      mood: "sad",
      speech:
        "My lord, last spring my plough-ox died and I had no grain to " +
        "plant. I borrowed two bushels of seed grain from my neighbor " +
        "Ranulf, and he said I must repay three bushels at harvest. " +
        "That is half again what I borrowed. I paid back the two I " +
        "owed, but he demands the third bushel besides. My family " +
        "cannot eat and pay such interest.",
      evidence:
        "Edmund shows his near-empty grain store — barely enough to " +
        "feed his family through the winter, with nothing left for " +
        "the demanded third bushel.",
    },
    petitionerB: {
      name: "Ranulf the Prosperous",
      portrait: "peasant",
      mood: "neutral",
      speech:
        "My lord, I lent that grain in good faith when no one else " +
        "would. I took a risk — had Edmund's crop failed, I would have " +
        "lost everything. The extra bushel is not greed, it is fair " +
        "payment for the risk I bore. If lending gains nothing, no one " +
        "will lend, and men like Edmund will starve instead.",
      evidence:
        "Ranulf presents a tally stick notched with the agreement: two " +
        "bushels lent, three bushels owed, both marks matching between " +
        "the two halves of the split stick.",
    },
    stewardAdvice:
      "My lord, the Church forbids usury — lending at interest — and " +
      "Father Aldous will not let us forget it. But in practice, every " +
      "village runs on informal loans with interest by another name. " +
      "If we forbid all interest, lending will dry up. If we allow it, " +
      "the poor sink deeper into debt each year.",
    rulings: [
      {
        id: "a",
        label: "Cancel the interest",
        decree:
          "The Church's teaching on usury is clear: lending at interest " +
          "is a sin. Edmund shall repay the two bushels he borrowed and " +
          "no more. Ranulf is warned that charging interest on grain " +
          "loans is contrary to God's law and will not be upheld in " +
          "this court.",
        consequences: { people: 2, treasury: -2, church: 4, military: 0 },
        aftermath:
          "Father Aldous beams with satisfaction and leads the hall in " +
          "a prayer of thanksgiving. Ranulf's face hardens, and he " +
          "tells anyone who will listen that he will never lend again. " +
          "When spring comes, two other struggling farmers cannot find " +
          "anyone willing to lend them seed grain.",
        reputation_shift: "pious",
      },
      {
        id: "b",
        label: "Enforce the full debt",
        decree:
          "A bargain struck between free men must be honored. Edmund " +
          "agreed to the terms when he took the grain, and he shall pay " +
          "what he owes — three bushels in full. If he cannot pay in " +
          "grain, he shall work Ranulf's fields for ten days to clear " +
          "the debt.",
        consequences: { people: -4, treasury: 3, church: -2, military: 0 },
        aftermath:
          "Ranulf nods with grim satisfaction. Edmund's shoulders slump " +
          "as he trudges home to tell his wife. Father Aldous storms " +
          "from the hall, his robes swirling. The village knows that " +
          "debts will be paid under this lord — which makes lenders " +
          "generous and borrowers desperate.",
        reputation_shift: "pragmatist",
      },
      {
        id: "c",
        label: "Reduce to a fair rate",
        decree:
          "The loan of two bushels is acknowledged, and a fair fee for " +
          "the risk Ranulf bore is set at one quarter-bushel — not the " +
          "full extra bushel he demands. Edmund shall pay two and one " +
          "quarter bushels in total. In future, the manor court shall " +
          "set the maximum rate for grain loans at one-eighth per " +
          "season.",
        consequences: { people: 2, treasury: 1, church: 2, military: 0 },
        aftermath:
          "Neither man is fully happy, but both accept the ruling as " +
          "reasonable. Father Aldous looks thoughtful — the rate is " +
          "low enough to satisfy the spirit of the usury ban. Other " +
          "villagers take note: lending continues, but at rates the " +
          "poor can survive.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "The medieval Church absolutely prohibited usury — lending money " +
      "at interest — calling it a mortal sin. In practice, everyone " +
      "from kings to peasants borrowed at interest, disguising it as " +
      "'gifts' or service obligations. Jewish moneylenders were often " +
      "used as intermediaries precisely because they were not bound by " +
      "Christian canon law on the subject.",
  },

  // ---------------------------------------------------------------
  // 11. THE SINGING ROOSTER (Absurd, Easy, Comedic)
  // ---------------------------------------------------------------
  {
    id: "dispute_011",
    title: "The Singing Rooster",
    season: "any",
    category: "absurd",
    tone: "comedic",
    difficulty: "easy",
    herald:
      "A red-eyed woman in a nightcap marches into the hall carrying " +
      "what appears to be a sack. Behind her, a bewildered farmer " +
      "clutches a magnificent rooster by the legs. The rooster looks " +
      "offended. The entire hall turns to watch.",
    petitionerA: {
      name: "Widow Margery",
      portrait: "peasant",
      mood: "angry",
      speech:
        "My lord, I have not slept a full night in three weeks because " +
        "of that devil-bird! It crows at midnight, at two in the " +
        "morning, at every hour God sends. My cottage is next door and " +
        "I swear the creature aims its beak at my window on purpose. " +
        "I am losing my mind and my health, and I demand justice!",
      evidence:
        "Margery's dark-circled eyes and trembling hands attest to her " +
        "sleeplessness. Two other neighbors nod vigorously in agreement " +
        "from the back of the hall.",
    },
    petitionerB: {
      name: "Old Cuthbert",
      portrait: "peasant",
      mood: "defensive",
      speech:
        "My lord, that rooster is the finest bird in four parishes! He " +
        "has sired more chicks than I can count and his crowing keeps " +
        "the foxes at bay. Every rooster crows — that is what God made " +
        "them to do. Perhaps the widow should stuff wool in her ears, " +
        "as my wife does.",
      evidence:
        "As if to prove a point, the rooster throws back its head and " +
        "unleashes a tremendous crow that echoes through the stone " +
        "hall, causing several people to jump and the steward to spill " +
        "his ink.",
    },
    stewardAdvice:
      "My lord, I have served three lords and heard many strange cases, " +
      "but this is a first. The rooster is indeed a fine specimen, but " +
      "Margery's suffering is genuine. Perhaps the bird could be housed " +
      "farther from her window, or some arrangement made for the " +
      "nighttime hours.",
    rulings: [
      {
        id: "a",
        label: "Banish the rooster to the outer fields",
        decree:
          "The rooster shall be relocated to a coop in the outer fields, " +
          "beyond the hearing of Widow Margery and her neighbors, where " +
          "it may crow to its heart's content among the sheep. Cuthbert " +
          "may visit his bird daily, but it shall not return to the " +
          "village proper.",
        consequences: { people: 1, treasury: -1, church: 0, military: 0 },
        aftermath:
          "Margery weeps with relief and promises to bake the lord a " +
          "pie. Cuthbert carries his rooster away with the tenderness " +
          "of a man parting with his best friend. The bird's midnight " +
          "concerts are thereafter enjoyed only by sheep, who do not " +
          "seem to mind.",
        reputation_shift: "merciful",
      },
      {
        id: "b",
        label: "Do nothing — roosters crow",
        decree:
          "A rooster is a rooster, and crowing is the nature God gave " +
          "it. The court has more pressing matters than regulating the " +
          "voices of barnyard fowl. Margery may purchase wool for her " +
          "ears at the market.",
        consequences: { people: -2, treasury: 0, church: 0, military: 0 },
        aftermath:
          "Cuthbert looks smug. Margery's face falls, and she stalks " +
          "from the hall. The following week, the rooster mysteriously " +
          "disappears. Cuthbert accuses Margery of murder. The steward " +
          "quietly notes that the case is likely to return.",
        reputation_shift: "indifferent",
      },
      {
        id: "c",
        label: "Decree covered coops after sundown",
        decree:
          "Henceforth, all roosters within the village shall be housed " +
          "in covered coops from sundown to sunrise, with cloth draped " +
          "to block the moonlight. A dark coop keeps a rooster quiet. " +
          "Any owner who fails to cover his birds shall pay a penny " +
          "fine for each night's disturbance.",
        consequences: { people: 2, treasury: 1, church: 0, military: 1 },
        aftermath:
          "The decree becomes the most talked-about ruling in the " +
          "village's memory. To everyone's surprise, covered coops " +
          "work remarkably well. The roosters stay silent until dawn, " +
          "Margery sleeps soundly, and Cuthbert discovers his hens lay " +
          "better when they get a proper night's rest too.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "Noise complaints appear regularly in medieval court records, " +
      "though they were usually about barking dogs or rowdy alehouses " +
      "rather than roosters. Village bylaws sometimes regulated the " +
      "keeping of animals within the settlement, and fines for " +
      "disturbances of the peace were common. The covered-coop trick " +
      "is actually real — darkness prevents roosters from crowing.",
  },

  // ---------------------------------------------------------------
  // 12. THE HAUNTED WELL (Absurd, Easy, Comedic)
  // ---------------------------------------------------------------
  {
    id: "dispute_012",
    title: "The Haunted Well",
    season: "winter",
    category: "absurd",
    tone: "comedic",
    difficulty: "easy",
    herald:
      "Three villagers creep into the hall as though something might " +
      "be following them. They huddle together, glancing over their " +
      "shoulders. Father Aldous follows behind, looking simultaneously " +
      "concerned and exasperated.",
    petitionerA: {
      name: "The Village Delegation",
      portrait: "peasant",
      mood: "nervous",
      speech:
        "My lord, the village well is haunted and no mistake! The water " +
        "turns bitter after dark, and those who draw from it at night " +
        "hear whispers rising from the depths. Old Edith swears she " +
        "saw a pale face in the water last Tuesday. Thirty families " +
        "depend on that well, and now half of them are afraid to drink.",
      evidence:
        "A bucket of water from the well is presented. It does indeed " +
        "smell faintly foul and has a brackish, unpleasant taste that " +
        "worsens the longer it sits.",
    },
    petitionerB: {
      name: "Father Aldous",
      portrait: "clergy",
      mood: "neutral",
      speech:
        "My lord, I have blessed that well twice now with holy water " +
        "and the full rite of exorcism. If there were a spirit, it " +
        "would have departed. I suspect the problem is of this world " +
        "rather than the next, but my flock insists on supernatural " +
        "explanations. The fear is real, even if the ghost is not.",
      evidence:
        "Father Aldous notes that the bitter taste worsens after rain, " +
        "which is unusual for a genuine haunting but quite consistent " +
        "with something rotting in the water.",
    },
    stewardAdvice:
      "My lord, thirty families depend on that well, and whether the " +
      "problem is ghosts or garbage, the water is undrinkable. We " +
      "could investigate the well ourselves, arrange a grand exorcism " +
      "to calm the people, or dig a new well entirely — though that " +
      "last option would cost dearly.",
    rulings: [
      {
        id: "a",
        label: "Investigate the well personally",
        decree:
          "The lord shall inspect the well at once, with rope, torch, " +
          "and two strong men. If there is a spirit, we shall face it. " +
          "If there is a dead animal, we shall remove it. Either way, " +
          "the truth will be known before nightfall.",
        consequences: { people: 4, treasury: -1, church: 0, military: 0 },
        aftermath:
          "Two servants lower a torch into the well and discover a dead " +
          "badger wedged between the stones halfway down, its body " +
          "bloating in the water and producing both the foul taste and " +
          "strange gurgling sounds. The 'ghost' is hauled out on a rope " +
          "to general relief and embarrassment. The water runs clean " +
          "within two days.",
        reputation_shift: "brave",
      },
      {
        id: "b",
        label: "Grand exorcism ceremony",
        decree:
          "Father Aldous shall perform a full exorcism of the well " +
          "with candles, incense, and a procession of the village. The " +
          "manor shall provide two shillings for beeswax candles and " +
          "incense. Let the spirits be driven out with bell, book, and " +
          "candle.",
        consequences: { people: 1, treasury: -2, church: 3, military: 0 },
        aftermath:
          "The exorcism is performed with great solemnity and no small " +
          "amount of spectacle. The villagers' fear subsides — until " +
          "the next heavy rain, when the water turns bitter again. " +
          "Eventually someone thinks to look down the well and finds " +
          "the dead badger. The exorcism is credited with weakening " +
          "the ghost enough to reveal its earthly disguise.",
        reputation_shift: "pious",
      },
      {
        id: "c",
        label: "Declare ghosts are nonsense",
        decree:
          "There are no ghosts in wells, only fools who believe in " +
          "them. The village will drink the water or go thirsty. The " +
          "lord has more important matters to attend to than old wives' " +
          "tales.",
        consequences: { people: -3, treasury: 0, church: 0, military: 2 },
        aftermath:
          "The villagers slink away, chastened but not reassured. The " +
          "well water continues to taste foul, and families begin " +
          "walking a mile to the stream for clean water. Several " +
          "children fall sick. When the dead badger is finally found " +
          "weeks later by a boy dropping stones down the well, the " +
          "lord's indifference is remembered bitterly.",
        reputation_shift: "dismissive",
      },
      {
        id: "d",
        label: "Seal the well and dig a new one",
        decree:
          "The old well is contaminated beyond use and shall be sealed " +
          "with stone. A new well shall be dug on higher ground at the " +
          "manor's expense. The work shall begin at once and the " +
          "village shall draw water from the stream until it is " +
          "complete.",
        consequences: { people: 3, treasury: -5, church: 0, military: 0 },
        aftermath:
          "The new well is dug over three weeks of hard labor and " +
          "produces clear, sweet water. The old well is sealed and " +
          "forgotten. The village gains a better water source, and " +
          "the lord is praised for his generosity, though his steward " +
          "winces at the expense.",
        reputation_shift: "generous",
      },
    ],
    historicalNote:
      "Medieval villagers commonly attributed contaminated water to " +
      "supernatural causes. In reality, animal carcasses, refuse, and " +
      "seepage from nearby cesspits were the usual culprits. Well " +
      "maintenance was a communal responsibility, and manor courts " +
      "frequently fined villagers for contaminating water sources. " +
      "Holy water blessings of wells were a regular part of parish life.",
  },

  // ---------------------------------------------------------------
  // 13. THE RUNAWAY SERF (Military, Hard, Tense)
  // ---------------------------------------------------------------
  {
    id: "dispute_013",
    title: "The Runaway Serf",
    season: "any",
    category: "military",
    tone: "tense",
    difficulty: "hard",
    herald:
      "A mounted knight in the colors of Lord Mortimer waits in the " +
      "courtyard, his horse stamping impatiently. In the hall, a " +
      "terrified young man kneels with his wife and infant child. The " +
      "air is heavy with the scent of trouble between lords.",
    petitionerA: {
      name: "Sir Geoffrey, Mortimer's Man",
      portrait: "military",
      mood: "angry",
      speech:
        "My lord, this man Aldric is the property of Lord Mortimer, " +
        "bound to Mortimer's lands by birth and blood. He fled in the " +
        "night like a thief, and the law is clear — a runaway serf " +
        "must be returned to his rightful lord. Mortimer demands his " +
        "return and will consider any refusal an insult to be answered " +
        "in kind.",
      evidence:
        "Sir Geoffrey produces a writ from Lord Mortimer's court, " +
        "sealed with Mortimer's signet, identifying Aldric as a " +
        "bonded serf and demanding his immediate return.",
    },
    petitionerB: {
      name: "Aldric the Serf",
      portrait: "peasant",
      mood: "sad",
      speech:
        "My lord, I fled because Lord Mortimer worked us to death and " +
        "fed us nothing. My brother died in Mortimer's fields last " +
        "harvest, worked until he dropped. I brought my wife and child " +
        "here because your village has a name for justice. I have been " +
        "here eleven months, working honestly and paying my way. I beg " +
        "you — one more month and the law says I am free.",
      evidence:
        "Several villagers step forward to confirm that Aldric has " +
        "lived and worked among them for eleven months, and the " +
        "village reeve's records confirm the date of his arrival.",
    },
    stewardAdvice:
      "My lord, this is a razor's edge. The law says a serf who lives " +
      "in a free village for a year and a day is free forever. Aldric " +
      "has been here eleven months — one month short. Returning him is " +
      "lawful. Protecting him risks Mortimer's wrath. But hiding him " +
      "until the year is complete... well, the law does not forbid " +
      "slow paperwork.",
    rulings: [
      {
        id: "a",
        label: "Return the serf to Mortimer",
        decree:
          "The law is clear and must be upheld. Aldric is the bonded " +
          "serf of Lord Mortimer and has not yet completed the year " +
          "and a day required for his freedom. He shall be returned " +
          "with his family to Mortimer's lands, and our relations " +
          "with our neighbor preserved.",
        consequences: { people: -6, treasury: 0, church: 1, military: 3 },
        aftermath:
          "Aldric's wife screams as Sir Geoffrey's men drag him from " +
          "the hall. The village watches in horrified silence. Lord " +
          "Mortimer sends a gift of wine in thanks, and the border " +
          "between the two estates remains peaceful. But the villagers " +
          "remember what happened to the man who trusted their lord's " +
          "protection, and some sleep less easily.",
        reputation_shift: "legalist",
      },
      {
        id: "b",
        label: "Protect the serf — refuse Mortimer",
        decree:
          "This man has lived among us, worked our fields, and paid his " +
          "way. He is one of ours now. Tell Lord Mortimer that we do " +
          "not return men who have sought our protection in good faith. " +
          "If he wishes to make a quarrel of it, we will answer.",
        consequences: { people: 7, treasury: -2, church: 0, military: -4 },
        aftermath:
          "Aldric collapses with relief, and his wife clutches the baby " +
          "so tightly it wails. The village erupts in cheers that can " +
          "be heard from the fields. Sir Geoffrey rides away with cold " +
          "fury in his eyes. Mortimer's retaliation comes in small " +
          "ways — his merchants refuse to trade, and his foresters " +
          "harass travelers on the border road.",
        reputation_shift: "protector",
      },
      {
        id: "c",
        label: "Hide him until the year is up",
        decree:
          "The lord regrets that Aldric cannot be found at present — " +
          "it seems he has wandered off to seek work in the market " +
          "town. Sir Geoffrey is welcome to search the village, but " +
          "the bailiff reports he saw the man heading east three days " +
          "ago. How unfortunate.",
        consequences: { people: 4, treasury: -1, church: 0, military: -2 },
        aftermath:
          "Aldric is hidden in the miller's cellar for a month while " +
          "Sir Geoffrey searches in vain. When the year and a day " +
          "pass, Aldric emerges as a free man by law. Mortimer " +
          "suspects the deception but cannot prove it. The village " +
          "gains a loyal and hardworking family, and a very good " +
          "story for winter nights.",
        reputation_shift: "cunning",
      },
    ],
    historicalNote:
      "The 'year and a day' rule was real medieval law. A serf who " +
      "escaped to a chartered town or free village and remained " +
      "unclaimed for that period was legally free. This created " +
      "constant tension between lords who wanted to keep their labor " +
      "force and towns that welcomed new workers. The saying 'city " +
      "air makes free' (Stadtluft macht frei) captured this principle.",
  },

  // ---------------------------------------------------------------
  // 14. THE PRIEST'S SECRET (Church, Hard)
  // ---------------------------------------------------------------
  {
    id: "dispute_014",
    title: "The Priest's Secret",
    season: "any",
    category: "church",
    tone: "serious",
    difficulty: "hard",
    herald:
      "A young woman with a swaddled infant stands trembling before " +
      "the Great Hall. Beside her, Father Aldous stands rigid with " +
      "fury, his hands gripping his prayer book until the knuckles " +
      "whiten. In the shadows, Brother Thomas keeps his eyes on the " +
      "floor.",
    petitionerA: {
      name: "Alice the Weaver",
      portrait: "peasant",
      mood: "sad",
      speech:
        "My lord, this child is Brother Thomas's, and I am not ashamed " +
        "to say it. He promised to leave the brotherhood and marry me, " +
        "but now he denies everything and Father Aldous wants to send " +
        "the matter to the Bishop's court, where no one will hear my " +
        "voice. I have no family and no protector. If the Church judges " +
        "this, they will protect their own and cast me out.",
      evidence:
        "Alice presents a small wooden cross that Brother Thomas carved " +
        "for her, with both their initials scratched into the back, " +
        "along with testimony from her neighbor who saw Thomas visit " +
        "her cottage repeatedly after dark.",
    },
    petitionerB: {
      name: "Father Aldous",
      portrait: "clergy",
      mood: "angry",
      speech:
        "My lord, this is a Church matter and must be handled by Church " +
        "courts. Brother Thomas is a man of God, bound by holy vows. " +
        "If he has sinned, it is for the Bishop to judge and the Church " +
        "to discipline. A secular lord has no jurisdiction over the " +
        "clergy. I insist this case be remanded to the ecclesiastical " +
        "court at once.",
      evidence:
        "Father Aldous cites canon law establishing that clergy are " +
        "subject to Church courts, not manorial courts, and produces " +
        "a letter from the Bishop's secretary supporting this position.",
    },
    stewardAdvice:
      "My lord, this is dangerous ground. The Church guards its legal " +
      "privileges fiercely, and defying the Bishop could bring " +
      "consequences for the entire manor. But the woman's case has " +
      "merit — Church courts rarely rule in favor of a laywoman against " +
      "a brother. A joint hearing might thread the needle, giving " +
      "both sides a voice.",
    rulings: [
      {
        id: "a",
        label: "Try the case in your court",
        decree:
          "This child is a subject of this manor, and the woman is " +
          "under the lord's protection. The case shall be heard here, " +
          "in the Great Hall, where both parties may speak freely. " +
          "Brother Thomas shall answer the accusation before God and " +
          "the village. The Bishop will be informed of the outcome.",
        consequences: { people: 6, treasury: 0, church: -5, military: 1 },
        aftermath:
          "The hall gasps. Father Aldous goes white with anger and " +
          "sweeps from the room, his robes billowing. Brother Thomas " +
          "breaks down and confesses. The village rallies around Alice, " +
          "and Thomas is ordered to provide for the child. The Bishop " +
          "sends a frosty letter of protest, and tithes from the " +
          "parish are notably reduced that year.",
        reputation_shift: "protector",
      },
      {
        id: "b",
        label: "Send to Church courts",
        decree:
          "The law of the land and the law of the Church are clear: " +
          "clergy answer to ecclesiastical courts. The case of Brother " +
          "Thomas shall be remanded to the Bishop's court. Alice may " +
          "present her evidence there, and the manor shall provide her " +
          "transport and a day's food for the journey.",
        consequences: { people: -5, treasury: 0, church: 4, military: 0 },
        aftermath:
          "Alice leaves the hall in tears, clutching her baby. Father " +
          "Aldous nods with grim satisfaction. At the Bishop's court " +
          "three months later, Brother Thomas is quietly transferred " +
          "to a distant monastery. Alice receives nothing. The village " +
          "mutters darkly about justice that depends on which side of " +
          "the altar you stand.",
        reputation_shift: "pious",
      },
      {
        id: "c",
        label: "Joint hearing with Church and manor",
        decree:
          "This matter touches both spiritual vows and the welfare of " +
          "a child born on this manor. The lord and Father Aldous shall " +
          "hear the case together, with the outcome recorded and sent " +
          "to the Bishop. Both the law of God and the law of the land " +
          "shall be satisfied.",
        consequences: { people: 2, treasury: -2, church: 1, military: 0 },
        aftermath:
          "The joint hearing is awkward but functional. Brother Thomas " +
          "admits his relationship with Alice under the combined weight " +
          "of secular and spiritual authority. He is ordered to provide " +
          "for the child from his monastery wages, and Alice is given a " +
          "cottage and spinning work. Father Aldous grudgingly admits " +
          "the arrangement has some merit.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "The question of 'benefit of clergy' — the right of churchmen " +
      "to be tried in Church courts rather than secular ones — was one " +
      "of the great power struggles of the Middle Ages. The murder of " +
      "Thomas Becket in 1170 was partly rooted in this dispute. " +
      "Children fathered by priests were common enough that canon law " +
      "had specific provisions for their care, though enforcement was " +
      "inconsistent.",
  },

  // ---------------------------------------------------------------
  // 15. THE FAMINE CHOICE (Solo Decision, Hard, Tragic)
  // ---------------------------------------------------------------
  {
    id: "dispute_015",
    title: "The Famine Choice",
    season: "winter",
    category: "property",
    tone: "tragic",
    difficulty: "hard",
    herald:
      "No petitioners wait in the hall today. Instead, the steward " +
      "stands alone before the lord's chair, his face drawn and gray " +
      "as the winter sky beyond the windows. He carries a single " +
      "parchment — the inventory of the manor's food stores.",
    petitionerA: null,
    petitionerB: null,
    description:
      "A brutal winter has locked the land in ice for six weeks. The " +
      "steward lays out the numbers with grim precision: the manor's " +
      "food stores can feed every soul on the estate for six more " +
      "weeks, but winter will last at least eight. There is enough for " +
      "eighty of every hundred mouths, but not all. No grain can be " +
      "bought — the roads are impassable and every neighbor hoards " +
      "their own. The lord must decide who eats and who goes hungry. " +
      "There is no good choice — only less terrible ones.",
    stewardAdvice:
      "My lord, I wish I had better counsel. Equal rations mean " +
      "everyone goes hungry but no one starves outright — though the " +
      "old and the very young may not survive on reduced portions. " +
      "Feeding the workers and soldiers keeps the manor functioning " +
      "but condemns the weak. Opening your own stores is generous but " +
      "may leave the manor defenseless if the winter extends further. " +
      "There is no right answer here. Only the one you can live with.",
    rulings: [
      {
        id: "a",
        label: "Equal rations for all",
        decree:
          "Every soul on this estate shall receive an equal share of " +
          "what remains, from the lord's table to the poorest cottage. " +
          "Rations are reduced to three-quarters for all. We will " +
          "endure this together or not at all.",
        consequences: { people: 3, treasury: -1, church: 0, military: -2 },
        aftermath:
          "The village draws together in shared hardship. Soldiers " +
          "grumble as their portions shrink alongside everyone else's. " +
          "Three of the eldest villagers do not survive the winter, but " +
          "the village remembers that the lord shared their suffering. " +
          "When spring finally breaks, the bonds between lord and " +
          "people are stronger than iron.",
        reputation_shift: "just",
      },
      {
        id: "b",
        label: "Prioritize workers and soldiers",
        decree:
          "Those who work the fields and man the walls shall receive " +
          "full rations. The young, the old, and the infirm shall " +
          "receive half portions. The manor must be ready to function " +
          "when spring comes, and that requires strong hands.",
        consequences: { people: -5, treasury: 2, church: 0, military: 4 },
        aftermath:
          "The decision is efficient and brutal. The garrison stays " +
          "strong and the essential workers keep the manor running. " +
          "But seven elderly villagers and two small children die " +
          "before spring. Their families never forget, and the lord's " +
          "name is whispered with bitterness in certain cottages for " +
          "years to come.",
        reputation_shift: "pragmatist",
      },
      {
        id: "c",
        label: "Prioritize the old and sick",
        decree:
          "The strong can endure hunger better than the weak. Full " +
          "rations shall go to the elderly, the ill, and children under " +
          "five. The rest of us — lord, soldier, and worker alike — " +
          "shall tighten our belts and pray for an early thaw.",
        consequences: { people: 1, treasury: 0, church: 4, military: -3 },
        aftermath:
          "Father Aldous declares the lord's mercy a gift from God. " +
          "The old and the sick survive, but the garrison weakens " +
          "noticeably and two soldiers desert to seek food elsewhere. " +
          "The workers struggle through their tasks on empty stomachs. " +
          "The Church praises the ruling as an act of Christian charity.",
        reputation_shift: "merciful",
      },
      {
        id: "d",
        label: "Open the lord's personal stores",
        decree:
          "The lord's pantry, wine cellar, and private grain stores " +
          "shall be opened to the village immediately. What was the " +
          "lord's shall feed the lord's people. We will eat salt pork " +
          "and hard bread together, and when spring comes, we will " +
          "rebuild together.",
        consequences: { people: 8, treasury: -6, church: 2, military: 0 },
        aftermath:
          "The villagers can scarcely believe it when the lord's own " +
          "stores — smoked meats, preserved fruits, casks of ale — are " +
          "distributed to every household. The lord eats the same gruel " +
          "as the poorest serf. Not a soul is lost to hunger that " +
          "winter. The cost to the manor's treasury is severe, but the " +
          "loyalty earned is beyond price. Songs are sung about this " +
          "winter for generations.",
        reputation_shift: "beloved",
      },
    ],
    historicalNote:
      "Famine was a recurring horror of medieval life. The Great Famine " +
      "of 1315-1317 killed an estimated ten to fifteen percent of " +
      "Europe's population. Lords who shared their stores were " +
      "celebrated in chronicles, while those who hoarded faced riots " +
      "and, in some cases, violent overthrow. The moral obligation of " +
      "lordship — noblesse oblige — was never more sharply tested than " +
      "in times of hunger.",
  },

  // ---------------------------------------------------------------
  // 16. THE QUESTION OF THE ORPHANS (Family, Hard)
  // ---------------------------------------------------------------
  {
    id: "dispute_016",
    title: "The Question of the Orphans",
    season: "any",
    category: "family",
    tone: "tragic",
    difficulty: "hard",
    herald:
      "The smell of ash still clings to the three children brought " +
      "before the hall. The eldest, a girl of twelve, holds the hands " +
      "of her two younger brothers, aged eight and five. Their cottage " +
      "burned two nights ago. Their parents did not escape. The village " +
      "has fed them since, but no family has room for all three.",
    petitionerA: {
      name: "Agnes the Elder",
      portrait: "peasant",
      mood: "sad",
      speech:
        "My lord, we have asked every family in the village and none " +
        "can take all three children. The baker would take the eldest " +
        "girl as a helper. The shepherd could use the middle boy. But " +
        "the littlest one — he cries for his mother all night and no " +
        "one has the heart or the room. We cannot let these children " +
        "be scattered like seeds in the wind.",
      evidence:
        "Agnes presents a list of village families she has approached, " +
        "each with their reason for being unable to take all three: " +
        "too many mouths already, too small a cottage, illness in " +
        "the household.",
    },
    petitionerB: {
      name: "Brother Martin",
      portrait: "clergy",
      mood: "hopeful",
      speech:
        "My lord, the monastery of St. Benedict would welcome the " +
        "eldest girl. We have a scriptorium where she could learn to " +
        "read and write — a rare gift for any child, and rarer still " +
        "for a girl. She would be fed, housed, and educated. The " +
        "younger boys might find places as they grow, but the girl's " +
        "future we can secure today.",
      evidence:
        "Brother Martin presents a letter from the Abbot confirming " +
        "the monastery's offer, along with examples of illuminated " +
        "manuscripts produced by the scriptorium's students.",
    },
    stewardAdvice:
      "My lord, the children's welfare is the manor's responsibility — " +
      "their parents were your tenants. Taking them into the castle " +
      "is generous but costly. Splitting them among village families " +
      "is practical but cruel. The monastery offers education but only " +
      "for one. Perhaps the village itself could share the burden if " +
      "properly organized.",
    rulings: [
      {
        id: "a",
        label: "Castle takes all three children",
        decree:
          "These children are wards of the manor and shall live in the " +
          "castle household. The eldest shall serve in the kitchen, the " +
          "middle boy in the stables, and the youngest shall be cared " +
          "for by the castle nurse until he is old enough for duties. " +
          "They shall not be separated.",
        consequences: { people: 6, treasury: -3, church: 0, military: -1 },
        aftermath:
          "The eldest girl cries with relief and pulls her brothers " +
          "close. The village murmurs with admiration — a lord who " +
          "opens his own home to orphans is a lord worth serving. The " +
          "cost of three more mouths is felt in the household budget, " +
          "but the children prove useful and eager. The youngest stops " +
          "crying after a week.",
        reputation_shift: "beloved",
      },
      {
        id: "b",
        label: "Split them among village families",
        decree:
          "The baker shall take the eldest as an apprentice. The " +
          "shepherd shall take the middle boy. The manor shall pay a " +
          "stipend of one shilling per month to any family that takes " +
          "the youngest until he is old enough to work. The children " +
          "shall see each other every Sunday at church.",
        consequences: { people: -4, treasury: 1, church: -1, military: 0 },
        aftermath:
          "The eldest girl's face crumples as her brothers are led " +
          "away. She does not scream — she is too old for that — but " +
          "her silence is worse. The middle boy adjusts quickly, but " +
          "the youngest cries himself to sleep for months. The Sunday " +
          "reunions are bittersweet. The village finds the arrangement " +
          "practical but sad.",
        reputation_shift: "pragmatist",
      },
      {
        id: "c",
        label: "Send all three to the monastery",
        decree:
          "The monastery of St. Benedict shall take all three children " +
          "into its care. The manor shall provide a donation of five " +
          "shillings to support their keep. The children shall receive " +
          "education, shelter, and the guidance of the brothers. They " +
          "shall remain together.",
        consequences: { people: -2, treasury: 1, church: 4, military: 0 },
        aftermath:
          "Brother Martin bows deeply and leads the children away, " +
          "the youngest riding on his shoulders. The monastery proves " +
          "a stern but caring home. The eldest girl learns to read and " +
          "becomes one of the finest scribes in the county. The boys " +
          "grow strong tending the monastery gardens. The village loses " +
          "three future workers but gains the Church's lasting favor.",
        reputation_shift: "pious",
      },
      {
        id: "d",
        label: "Rally the village to share the burden",
        decree:
          "The children shall live together in the vacant cottage by " +
          "the church. Each family in the village shall contribute one " +
          "day's food per week to their upkeep on a rotating schedule. " +
          "The eldest girl shall manage the household, and the village " +
          "women shall check on them daily. It takes a village to raise " +
          "a child — let the village prove it.",
        consequences: { people: 5, treasury: -2, church: 2, military: 0 },
        aftermath:
          "The arrangement is chaotic at first — too much porridge one " +
          "day, not enough the next. But within a month, the village " +
          "women organize a proper schedule. The children's cottage " +
          "becomes the village's shared responsibility and, strangely, " +
          "its shared pride. Neighbors who barely spoke before now " +
          "coordinate meals and mending. The children grow up with " +
          "forty parents instead of two.",
        reputation_shift: "wise",
      },
    ],
    historicalNote:
      "Orphans were a common reality in medieval life, where disease, " +
      "accidents, and childbirth regularly claimed parents in their " +
      "prime. The manor lord had a legal obligation to provide for " +
      "orphaned children of his tenants. Monasteries served as the " +
      "primary social safety net, taking in children who had no family " +
      "to support them. Some of these children rose to become scholars, " +
      "scribes, and even abbots.",
  },

];

export default DISPUTES;
