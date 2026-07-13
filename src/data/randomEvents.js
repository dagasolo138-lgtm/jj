/**
 * Random Events for The Lord's Ledger
 *
 * These events fire at random during any turn after the tutorial phase,
 * weighted by category availability (requiresMeter controls eligibility).
 *
 * requiresMeter:
 *   null       — always eligible (economic / social)
 *   "military" — only fires after Military meter is introduced (turn 3+)
 *   "faith"    — only fires after Faith meter is introduced (turn 5+)
 *
 * category: "economic" | "social" | "military" | "religious"
 *
 * scribesNote — 2–3 sentences of real medieval history at 6th grade level.
 *   Included on at least 8 events per specification.
 */

const randomEvents = [

  // ──────────────────────────────────────────────
  // ECONOMIC (6+)
  // ──────────────────────────────────────────────

  {
    id: "rand_eco_1",
    title: "The Merchant Caravan",
    category: "economic",
    requiresMeter: null,
    description:
      "A large merchant caravan from the south arrives at your estate " +
      "and asks permission to camp on your land for three days while " +
      "they rest their animals. They carry spices, fine cloth, and " +
      "metalwork. In exchange for use of your field, they offer to sell " +
      "you goods at a discount — or to pay a camping fee in silver.",
    options: [
      {
        text: "Charge them a camping fee and let them stay.",
        effects: { treasury: 8, people: 4 },
        chronicle:
          "You collected a fair camping fee and the merchants set up " +
          "their colorful tents in the south field. Your villagers " +
          "visited in the evenings and came home with small purchases. " +
          "The caravan left three days later with a promise to return.",
        indicators: { treasury: "up", people: "up" },
      },
      {
        text: "Accept discounted goods instead of a fee — invest in trade goods.",
        effects: { treasury: -3, people: 7 },
        chronicle:
          "You took spices, cloth, and two quality iron tools at half " +
          "price. Your cook was thrilled about the spices, and your " +
          "people were excited to see such exotic goods in the storeroom.",
        indicators: { treasury: "down", people: "up" },
      },
      {
        text: "Turn the caravan away — you don't want strangers on your land.",
        effects: { treasury: -4, people: -2 },
        chronicle:
          "You sent the caravan master on his way politely. He rode " +
          "off without argument. But your villagers, who had heard the " +
          "caravan was coming, were quietly disappointed — and you lost " +
          "a potential trade relationship.",
        indicators: { treasury: "down", people: "down" },
      },
    ],
    scribesNote:
      "Merchant caravans were essential to medieval trade. Spices like " +
      "pepper, cinnamon, and cloves came all the way from Asia and were " +
      "worth nearly their weight in silver. Pepper was so valuable that " +
      "it was sometimes used to pay rent. This is why Europeans later " +
      "spent decades searching for a sea route to Asia — to cut out " +
      "the middlemen and make spices cheaper.",
  },

  {
    id: "rand_eco_2",
    title: "The Crop Blight",
    category: "economic",
    requiresMeter: null,
    description:
      "A dark mold has appeared on a portion of your stored grain. " +
      "Your steward says it is spreading and you must decide quickly: " +
      "destroy the affected grain immediately and accept the loss, or " +
      "try to separate the good grain from the bad and save as much " +
      "as possible — a risky process that could spread the mold further.",
    options: [
      {
        text: "Destroy all the affected grain right away — stop the spread.",
        effects: { treasury: -7, people: 3 },
        chronicle:
          "You ordered a full third of your grain stores burned before " +
          "sunset. It was a painful loss, but the remaining grain stayed " +
          "clean. Your cook planned leaner menus through February, " +
          "but the village did not go hungry.",
        indicators: { treasury: "down", people: "up" },
      },
      {
        text: "Try to separate the clean grain and save the good portion.",
        effects: { treasury: -5, people: -5 },
        chronicle:
          "Your workers spent two days sorting grain by lamplight. " +
          "Some of the mold had already spread further than you realized, " +
          "and you lost more than you saved. The winter food supply " +
          "was uncomfortably thin.",
        indicators: { treasury: "down", people: "down" },
      },
    ],
    scribesNote:
      "Ergot — a poisonous mold that grows on rye and wheat — was a real " +
      "and terrifying problem in medieval farming. Bread made from ergot-infected " +
      "grain caused a disease called 'St. Anthony's Fire' that made people feel " +
      "like they were burning from the inside. Entire villages went mad or died " +
      "from eating infected grain without knowing what was happening to them.",
  },

  {
    id: "rand_eco_3",
    title: "The Debt Offer",
    category: "economic",
    requiresMeter: null,
    description:
      "A moneylender from the city arrives with an offer: he will lend " +
      "you twenty silver coins now, to be repaid as thirty coins within " +
      "two years. He calls it a 'service fee' rather than interest, " +
      "since charging interest on loans was officially forbidden by " +
      "the Church. The coin would help your treasury right now.",
    options: [
      {
        text: "Accept the loan — you need the coin and can pay it back.",
        effects: { treasury: 20, faith: -5 },
        chronicle:
          "You signed the moneylender's document and he counted out " +
          "twenty coins on your table. Your treasury looked much healthier, " +
          "but your village priest heard about the arrangement and his " +
          "next sermon mentioned the dangers of usury without looking " +
          "directly at you.",
        indicators: { treasury: "up", faith: "down" },
      },
      {
        text: "Refuse the loan — you will not deal with moneylenders.",
        effects: { faith: 5 },
        chronicle:
          "You sent the moneylender away empty-handed. He bowed politely " +
          "and left without argument — he had many other clients. Your " +
          "treasury stayed tight, but the village priest nodded approvingly " +
          "when he heard the news.",
        indicators: { faith: "up" },
      },
    ],
    scribesNote:
      "The Church officially forbade charging interest on loans, calling it " +
      "'usury' — a sin. But medieval people needed loans, so moneylenders got " +
      "creative, calling interest a 'fee' or hiding it in the repayment terms. " +
      "Jewish merchants often served as moneylenders because they were excluded " +
      "from most other professions — and then were blamed and persecuted for " +
      "doing the exact job that Christian society had forced them into.",
  },

  {
    id: "rand_eco_4",
    title: "The Trade Dispute",
    category: "economic",
    requiresMeter: null,
    description:
      "A merchant who regularly buys your wool is refusing to pay the " +
      "price you agreed to last spring. He claims the market price has " +
      "fallen and demands a lower rate. Your reeve says you have a verbal " +
      "agreement but nothing written down. The merchant threatens to " +
      "find a new wool supplier if you insist on the original price.",
    options: [
      {
        text: "Insist on the agreed price — a deal is a deal.",
        effects: { treasury: 5, people: -4 },
        chronicle:
          "You held firm on the original price. The merchant paid " +
          "grudgingly and left muttering. Your reeve said you had done " +
          "the right thing, but warned that the merchant had friends " +
          "among other buyers who might hear about the disagreement.",
        indicators: { treasury: "up", people: "down" },
      },
      {
        text: "Accept a slightly lower price — keep the trade relationship.",
        effects: { treasury: -3, people: 5 },
        chronicle:
          "You split the difference and agreed on a rate three coins " +
          "lower than the original. The merchant seemed surprised and " +
          "then grateful. He stayed for dinner and promised to bring " +
          "you first offer on next season's Flemish cloth.",
        indicators: { treasury: "down", people: "up" },
      },
      {
        text: "Find a new buyer — send your wool to the city market directly.",
        effects: { treasury: 8, people: -3 },
        chronicle:
          "You dismissed the merchant and sent your own carts to the " +
          "city market, where you found a buyer who paid full price. " +
          "The journey cost more, but you netted good coin and learned " +
          "that you did not need a middleman.",
        indicators: { treasury: "up", people: "down" },
      },
    ],
    scribesNote: null,
  },

  {
    id: "rand_eco_5",
    title: "The Smugglers",
    category: "economic",
    requiresMeter: null,
    description:
      "Your border guards have caught a group of men smuggling salt " +
      "across your estate at night — salt that should have been taxed " +
      "at the royal salt market. The men claim they are just poor farmers " +
      "trying to avoid an unfair tax. Salt is essential for preserving " +
      "food, and the royal tax on it is deeply unpopular. What do you do?",
    options: [
      {
        text: "Turn them over to the royal sheriff — it is the law.",
        effects: { treasury: 6, people: -7, faith: -3 },
        chronicle:
          "You handed the men to the sheriff's officers who arrived " +
          "the next morning. You received a small fee for the capture. " +
          "The village whispered about it for weeks — several of the " +
          "smugglers had families who everyone knew.",
        indicators: { treasury: "up", people: "down", faith: "down" },
      },
      {
        text: "Let them go with a warning — the tax is genuinely unfair.",
        effects: { people: 9, faith: 4, military: -3 },
        chronicle:
          "You sent them home with their salt and a stern warning. Word " +
          "spread that you were a fair lord who did not hide behind royal " +
          "rules when common sense said otherwise. Your captain worried " +
          "quietly about what this meant for enforcement on the borders.",
        indicators: { people: "up", faith: "up", military: "down" },
      },
      {
        text: "Keep half the salt as a fine and let them go.",
        effects: { treasury: 4, people: 3 },
        chronicle:
          "You took half their salt — worth a few coins — as a fine " +
          "and sent them home. They lost some of their contraband but " +
          "kept their freedom. Your cook was pleased about the extra salt, " +
          "and no one had to go before the sheriff.",
        indicators: { treasury: "up", people: "up" },
      },
    ],
    scribesNote:
      "Salt was one of the most important and expensive goods in the Middle Ages " +
      "because it was the only way to preserve meat and fish through the winter. " +
      "In France, the 'gabelle' — a royal salt tax — was so hated that it was " +
      "one of the main causes of the French Revolution in 1789, nearly 400 years " +
      "later. Entire wars were fought over control of salt mines and salt routes.",
  },

  {
    id: "rand_eco_6",
    title: "The Price Collapse",
    category: "economic",
    requiresMeter: null,
    description:
      "News arrives from the city market: a good harvest across the " +
      "whole region has driven grain prices to a ten-year low. The " +
      "grain you were planning to sell at market will earn far less " +
      "than expected. Your reeve suggests three options for dealing " +
      "with the shortfall in expected income.",
    options: [
      {
        text: "Sell the grain at the low price — take the loss now.",
        effects: { treasury: 4, people: 2 },
        chronicle:
          "You sold at market rate, accepting lower revenue than planned. " +
          "It stung, but your reeve said moving the grain quickly was " +
          "smarter than storing it and hoping prices would recover before " +
          "it spoiled.",
        indicators: { treasury: "up", people: "up" },
      },
      {
        text: "Hold the grain in storage and wait for prices to rise.",
        effects: { treasury: -4, people: -3 },
        chronicle:
          "You packed the grain into sealed barrels and waited. The price " +
          "crept up slightly in winter — but storage cost coin and the " +
          "grain lost quality over months. You eventually sold at barely " +
          "better than market rate.",
        indicators: { treasury: "down", people: "down" },
      },
      {
        text: "Use the cheap grain to feed workers building the new barn.",
        effects: { treasury: -2, people: 8 },
        chronicle:
          "You put the grain to work feeding your laborers well during " +
          "construction. The workers were better fed than usual and seemed " +
          "to notice. The barn was finished ahead of schedule, and morale " +
          "was high throughout the project.",
        indicators: { treasury: "down", people: "up" },
      },
    ],
    scribesNote: null,
  },

  {
    id: "rand_eco_7",
    title: "The Water Mill Opportunity",
    category: "economic",
    requiresMeter: null,
    description:
      "The water mill on your estate's stream is old and grinding slowly. " +
      "A craftsman visiting from the north says he can rebuild it with " +
      "new millstones and improved gear-work that will grind twice as " +
      "much grain in the same time. The cost is significant, but the " +
      "improved mill would also attract outside farmers to pay for grinding.",
    options: [
      {
        text: "Commission the full mill rebuild — it's a long-term investment.",
        effects: { treasury: -8, people: 6 },
        chronicle:
          "The craftsman spent six weeks rebuilding the mill from its " +
          "foundation stones. The new mechanism hummed smoothly and " +
          "ground grain twice as fast. Within a month, farmers from " +
          "two neighboring estates were paying to use it.",
        indicators: { treasury: "down", people: "up" },
      },
      {
        text: "Just replace the millstones — cheaper partial improvement.",
        effects: { treasury: -5, people: 3 },
        chronicle:
          "You replaced the worn millstones and left the rest. Grinding " +
          "improved noticeably but not dramatically. The craftsman shrugged " +
          "and said you would be back for the full rebuild within three years.",
        indicators: { treasury: "down", people: "up" },
      },
    ],
    scribesNote:
      "By the year 1086, England already had about 6,500 water mills — roughly " +
      "one for every village in the country. The Domesday Book, a great survey " +
      "ordered by William the Conqueror, recorded every one of them because " +
      "they were valuable enough to be taxed. Mills were so important that lords " +
      "required their peasants to use only the lord's mill — and pay a fee for it.",
  },

  // ──────────────────────────────────────────────
  // SOCIAL (6+)
  // ──────────────────────────────────────────────

  {
    id: "rand_soc_1",
    title: "The Peasant Petition",
    category: "social",
    requiresMeter: null,
    description:
      "A delegation of seven farmers arrives at your hall carrying a " +
      "wooden box with a rolled-up petition inside. Their spokesman, " +
      "an older man with a steady voice, explains that they want three " +
      "things: one less day of labor on your fields per week, the right " +
      "to keep their second pig without paying a fee, and better drainage " +
      "on the flooded lower fields. They have come politely but they " +
      "are clearly not going to leave without an answer.",
    options: [
      {
        text: "Grant all three requests — they are reasonable.",
        effects: { treasury: -8, people: 14 },
        chronicle:
          "You listened to every point and agreed to all three. The " +
          "delegation looked genuinely stunned — and then relieved. " +
          "The spokesman bowed low and said he would tell the others. " +
          "The word spread before nightfall: you were a lord who listened.",
        indicators: { treasury: "down", people: "up" },
      },
      {
        text: "Grant the drainage and the pig — refuse the labor change.",
        effects: { treasury: -4, people: 7 },
        chronicle:
          "You agreed to fix the flooding and waive the pig fee, but " +
          "held firm on the labor requirement. The spokesman accepted " +
          "this without argument. Two out of three felt like a victory " +
          "to both sides.",
        indicators: { treasury: "down", people: "up" },
      },
      {
        text: "Refuse all three — you cannot appear weak to your tenants.",
        effects: { people: -12, military: -3 },
        chronicle:
          "You told the delegation that your rules were your rules and " +
          "showed them out. The spokesman said nothing — but the look " +
          "in his eyes as he turned to leave stayed with you for days. " +
          "Three families quietly began looking for opportunities elsewhere.",
        indicators: { people: "down", military: "down" },
      },
    ],
    scribesNote:
      "Medieval peasants were not powerless. They could petition their lords, " +
      "refuse to work during arguments, or simply leave for a better situation. " +
      "After the Black Death killed nearly half of Europe's people in the 1340s, " +
      "the peasants who survived had so much bargaining power that the old feudal " +
      "rules began to break down across all of Europe over the next century.",
  },

  {
    id: "rand_soc_2",
    title: "The Noble Marriage Offer",
    category: "social",
    requiresMeter: null,
    description:
      "A lord from a prosperous neighboring county sends a polite but " +
      "clear proposal: he wishes to arrange a marriage between his " +
      "eldest son and your niece, who currently lives in your household. " +
      "The proposed groom's family controls a river crossing that would " +
      "benefit your trade enormously. Your niece has not been consulted.",
    options: [
      {
        text: "Accept the proposal — it is a good match for the estate.",
        effects: { treasury: 10, people: -4, faith: 3 },
        chronicle:
          "You accepted and sent the contract to be drawn up. Your niece " +
          "received the news quietly, which told you nothing. The river " +
          "crossing tolls began being waived for your merchants within " +
          "the month. The wedding was held the following spring.",
        indicators: { treasury: "up", people: "down", faith: "up" },
      },
      {
        text: "Ask your niece first — her opinion matters.",
        effects: { people: 8, faith: 5 },
        chronicle:
          "Your niece was surprised to be asked. She met the young man " +
          "twice before agreeing. The marriage went ahead, but with her " +
          "genuine consent — a somewhat unusual arrangement that your " +
          "household servants talked about for months.",
        indicators: { people: "up", faith: "up" },
      },
      {
        text: "Decline politely — your niece is not a bargaining piece.",
        effects: { people: 5, faith: 6, treasury: -4 },
        chronicle:
          "You sent a courteous refusal. The neighboring lord accepted " +
          "it graciously in writing, though he found a different route " +
          "for his son's marriage within the month. Your niece, when she " +
          "heard what you had declined and why, brought you a gift of " +
          "embroidered cloth she had made herself.",
        indicators: { people: "up", faith: "up", treasury: "down" },
      },
    ],
    scribesNote:
      "Medieval marriages among noble families were almost always arranged " +
      "for political or financial reasons. The historian's motto: 'Let others " +
      "wage war — you, happy Austria, marry!' was actually said about the " +
      "Habsburg royal family, who built one of Europe's largest empires " +
      "almost entirely through strategic marriages rather than conquest.",
  },

  {
    id: "rand_soc_3",
    title: "The Wandering Scholar",
    category: "social",
    requiresMeter: null,
    description:
      "A young scholar from the new university in the city has arrived " +
      "and asked to stay for a month, studying your estate's old documents " +
      "and maps. He says he is writing a history of this region. He has " +
      "no money but offers to teach reading and arithmetic to whichever " +
      "of your household servants you choose, in exchange for his room and board.",
    options: [
      {
        text: "Take him in — education is worth more than his room and board.",
        effects: { treasury: -3, people: 8, faith: 4 },
        chronicle:
          "You gave the scholar a small room and a candle allowance. " +
          "Within a week, six of your household staff were gathering " +
          "after supper to learn their letters. Your steward started " +
          "keeping neater accounts almost immediately.",
        indicators: { treasury: "down", people: "up", faith: "up" },
      },
      {
        text: "Turn him away — you cannot afford to feed extra mouths.",
        effects: { people: -3 },
        chronicle:
          "You told the scholar your estate was too busy to host visitors. " +
          "He thanked you politely, adjusted his pack, and walked back " +
          "down the road. Your household staff heard about the offer " +
          "of lessons and were quietly disappointed.",
        indicators: { people: "down" },
      },
    ],
    scribesNote:
      "The first universities in Europe were founded during the Middle Ages — " +
      "the University of Bologna in 1088, the University of Paris around 1150, " +
      "and Oxford University around 1167. Far from being a 'dark age,' this " +
      "period saw a huge flowering of learning as Europeans rediscovered ancient " +
      "Greek and Roman texts and began building on them in exciting new ways.",
  },

  {
    id: "rand_soc_4",
    title: "The Flood in the Lower Village",
    category: "social",
    requiresMeter: null,
    description:
      "Unusual spring rains have flooded the lower village, destroying " +
      "six homes and ruining stored food in four cellars. The families " +
      "are sheltering in the church. Your resources are tight, but these " +
      "are your people and they need help now.",
    options: [
      {
        text: "Provide emergency grain, timber, and housing in the castle.",
        effects: { treasury: -8, people: 13 },
        chronicle:
          "You opened the castle storerooms and invited the flooded " +
          "families in while their homes were rebuilt. It crowded your " +
          "kitchen and irritated your cook, but within three weeks the " +
          "new houses stood dry, and six families owed you their winter.",
        indicators: { treasury: "down", people: "up" },
      },
      {
        text: "Offer timber for rebuilding and some grain — but no castle housing.",
        effects: { treasury: -6, people: 6 },
        chronicle:
          "You provided building materials and a week of food. The families " +
          "stayed in the church and rebuilt as fast as they could. It was " +
          "enough to survive, if not comfortable. They thanked you — " +
          "carefully, as people do when they expected more.",
        indicators: { treasury: "down", people: "up" },
      },
      {
        text: "Tell them it is God's will — you cannot help everyone.",
        effects: { people: -11, faith: -8 },
        chronicle:
          "You sent word that your treasury was too tight for charity. " +
          "The village priest read your message aloud in the church " +
          "to the huddled families — and then led them in a prayer " +
          "that did not include your name.",
        indicators: { people: "down", faith: "down" },
      },
    ],
    scribesNote: null,
  },

  {
    id: "rand_soc_5",
    title: "The Famous Traveler",
    category: "social",
    requiresMeter: null,
    description:
      "A famous traveling storyteller — known across three counties — " +
      "has arrived at your gate and offered to perform in exchange for " +
      "a night's lodging. If you host him, stories of your hospitality " +
      "will spread wherever he goes. But he also has a reputation for " +
      "telling embarrassing tales about stingy lords at the next stop.",
    options: [
      {
        text: "Host him generously with food, wine, and a fine audience.",
        effects: { treasury: -5, people: 10 },
        chronicle:
          "The storyteller performed in your great hall for three hours. " +
          "Your servants laughed so hard some cried. When he left the " +
          "next morning, he bowed deeply and told you he had rarely been " +
          "treated so well. You wondered what he would say about your " +
          "estate at the next village inn.",
        indicators: { treasury: "down", people: "up" },
      },
      {
        text: "Give him a simple meal and a place in the stable to sleep.",
        effects: { treasury: -2, people: 3 },
        chronicle:
          "You fed him adequately and gave him dry straw for a bed. " +
          "He performed a shorter version of his act for your kitchen " +
          "staff before settling in for the night. When he left, " +
          "he said nothing — which was probably fine.",
        indicators: { treasury: "down", people: "up" },
      },
    ],
    scribesNote: null,
  },

  {
    id: "rand_soc_6",
    title: "The Inheritance Dispute",
    category: "social",
    requiresMeter: null,
    description:
      "An old farmer on your estate has died, leaving behind two sons " +
      "and a daughter. The eldest son claims the entire farm by right " +
      "of inheritance. The younger son says they always worked it " +
      "together and should share. The daughter says she helped more " +
      "than either brother but gets nothing under the current rules. " +
      "All three are in your hall, waiting.",
    options: [
      {
        text: "Rule in favor of the eldest — the traditional law is clear.",
        effects: { people: -5, faith: 5, military: 2 },
        chronicle:
          "You followed the rule of primogeniture — eldest inherits. " +
          "The eldest son nodded, the younger son's jaw tightened, " +
          "and the daughter left the hall silently. The priest approved " +
          "of your traditional ruling, which was small comfort to the " +
          "younger siblings.",
        indicators: { people: "down", faith: "up", military: "up" },
      },
      {
        text: "Divide the farm equally between the two sons.",
        effects: { people: 4, faith: -3, treasury: 2 },
        chronicle:
          "You split the farm in two and drew the boundary yourself. " +
          "The younger son looked relieved. The eldest was unhappy but " +
          "accepted it. The daughter watched the whole proceeding and " +
          "said nothing when her name was never mentioned at all.",
        indicators: { people: "up", faith: "down", treasury: "up" },
      },
      {
        text: "Give each of the three children a fair share — all three worked.",
        effects: { people: 10, faith: -5, military: -2 },
        chronicle:
          "You divided the farm into three parts. The youngest children " +
          "stared at you in disbelief. The eldest stormed out. The priest " +
          "shook his head. But the daughter caught your eye as she left " +
          "and gave you the smallest, most genuine nod you had ever received.",
        indicators: { people: "up", faith: "down", military: "down" },
      },
    ],
    scribesNote:
      "Under medieval law in most of Europe, the eldest son inherited almost " +
      "everything — a rule called 'primogeniture.' Younger sons had to find " +
      "careers in the Church, the military, or trade. Daughters inherited only " +
      "if there were no male heirs at all, and even then, the lord could " +
      "control who they married. This system kept noble estates from being " +
      "split into smaller and smaller pieces with each generation.",
  },

  // ──────────────────────────────────────────────
  // MILITARY (6+)
  // ──────────────────────────────────────────────

  {
    id: "rand_mil_1",
    title: "The Border Raid",
    category: "military",
    requiresMeter: "military",
    description:
      "Scouts bring urgent news: a band of about thirty armed men has " +
      "crossed your eastern border during the night and made off with " +
      "cattle from two farms. No one was killed, but the farmers are " +
      "frightened and angry. Your captain thinks they were men from " +
      "the neighboring county hired by a lord who has a dispute with you.",
    options: [
      {
        text: "Send soldiers to pursue and recover the cattle.",
        effects: { treasury: -6, military: 8, people: 5 },
        chronicle:
          "Your soldiers rode hard and caught the raiders before they " +
          "crossed back into the next county. Four raiders were captured, " +
          "the cattle recovered. The captured men were held for ransom. " +
          "Your farmers cheered when the cows came home.",
        indicators: { treasury: "down", military: "up", people: "up" },
      },
      {
        text: "Reinforce the border but don't pursue — risk of escalation.",
        effects: { treasury: -4, military: 4, people: -3 },
        chronicle:
          "You doubled the border guards and built a watchtower on the " +
          "eastern ridge. The cattle were gone, and your farmers resented " +
          "the loss — but no further raids came that season, and you " +
          "avoided a wider conflict.",
        indicators: { treasury: "down", military: "up", people: "down" },
      },
      {
        text: "Demand the neighboring lord pay for the stolen cattle.",
        effects: { treasury: 6, military: -3, people: 3 },
        chronicle:
          "You sent a strongly worded letter and a messenger who was " +
          "instructed not to leave without a reply. The neighboring lord " +
          "denied involvement but paid a small settlement to avoid " +
          "further argument. The money barely covered the cattle's value.",
        indicators: { treasury: "up", military: "down", people: "up" },
      },
    ],
    scribesNote:
      "Border raids between neighboring lords were extremely common in medieval " +
      "Europe. Lords had limited ability to stop small-scale theft and violence, " +
      "which is partly why strong castles and reliable soldiers were so important. " +
      "The English 'border country' between England and Scotland was raided so " +
      "often for centuries that the word 'bereaved' — meaning to have something " +
      "taken from you — comes from the raids on the Scottish border.",
  },

  {
    id: "rand_mil_2",
    title: "The Mercenary Offer",
    category: "military",
    requiresMeter: "military",
    description:
      "A mercenary captain named Gerhard arrives with thirty experienced " +
      "soldiers seeking employment. His men are well-armed and trained — " +
      "much better than your militia. He wants a month's pay upfront and " +
      "promises loyalty for a full year. Your captain Sir Hugo is skeptical: " +
      "hired soldiers care about coin, not your estate.",
    options: [
      {
        text: "Hire Gerhard and his company for the full year.",
        effects: { treasury: -8, military: 15 },
        chronicle:
          "Gerhard's men set up camp outside the castle walls and proved " +
          "their worth quickly — disciplined, effective, and professional. " +
          "Sir Hugo watched them jealously, which meant he also pushed " +
          "your own soldiers harder than usual.",
        indicators: { treasury: "down", military: "up" },
      },
      {
        text: "Hire them for just two months — help while you recruit your own.",
        effects: { treasury: -7, military: 6 },
        chronicle:
          "You hired Gerhard's company for two months, using the time " +
          "to recruit and train six new permanent soldiers. When the " +
          "mercenaries moved on, your own force was meaningfully stronger.",
        indicators: { treasury: "down", military: "up" },
      },
      {
        text: "Refuse — you will not trust hired strangers to defend your land.",
        effects: { military: -3, people: 4 },
        chronicle:
          "You sent Gerhard on his way. Sir Hugo nodded approval. Your " +
          "permanent soldiers seemed to stand a little taller knowing " +
          "their lord trusted them over outsiders. But the estate remained " +
          "thinner on experienced fighters than you would have liked.",
        indicators: { military: "down", people: "up" },
      },
    ],
    scribesNote:
      "Mercenary soldiers — called 'free companies' — were a major feature of " +
      "medieval warfare. After big wars ended, thousands of trained soldiers " +
      "suddenly had no employer and no way to make a living peacefully. Groups " +
      "called the 'routiers' in France became so dangerous during the Hundred " +
      "Years War that the Church tried to officially ban them, calling them " +
      "'enemies of God and humanity' — without much success.",
  },

  {
    id: "rand_mil_3",
    title: "The Deserters",
    category: "military",
    requiresMeter: "military",
    description:
      "Three of your soldiers have gone missing overnight. Your captain " +
      "Sir Hugo believes they deserted — slipped away to seek better-paying " +
      "work. The same men had complained last month about not being paid " +
      "on time. Sir Hugo wants to send riders to catch them and make an " +
      "example. You know the payment was indeed late.",
    options: [
      {
        text: "Hunt them down and discipline them publicly.",
        effects: { treasury: -4, military: 4, people: -5 },
        chronicle:
          "Your riders caught two of the three within a day's ride. " +
          "They were brought back and given light punishment in front " +
          "of the assembled garrison. The other soldiers watched in " +
          "silence. Desertions stopped for several months afterward.",
        indicators: { treasury: "down", military: "up", people: "down" },
      },
      {
        text: "Let them go and pay your remaining soldiers on time going forward.",
        effects: { treasury: -6, military: -4, people: 5 },
        chronicle:
          "You admitted the payment failure was your responsibility and " +
          "paid the garrison promptly, with a small bonus. You said " +
          "nothing about the deserters. The remaining soldiers seemed " +
          "satisfied — but Sir Hugo's expression made clear he thought " +
          "you had made a mistake.",
        indicators: { treasury: "down", military: "down", people: "up" },
      },
      {
        text: "Replace them immediately with new recruits from the village.",
        effects: { treasury: -5, military: -3, people: -2 },
        chronicle:
          "You recruited three replacements from willing young men in " +
          "the village. They were eager but inexperienced. The gap in " +
          "training was noticeable to Sir Hugo, who set about drilling " +
          "them with grim determination.",
        indicators: { treasury: "down", military: "down", people: "down" },
      },
    ],
    scribesNote: null,
  },

  {
    id: "rand_mil_4",
    title: "The Bandit Gang",
    category: "military",
    requiresMeter: "military",
    description:
      "A gang of about fifteen bandits has made a hideout in the dense " +
      "forest on the edge of your estate. They have been robbing travelers " +
      "and threatening farmers who work near the forest edge. The forest " +
      "is thick and the gang knows the paths well. A direct assault " +
      "could fail badly.",
    options: [
      {
        text: "Send a full armed patrol to clear the forest.",
        effects: { treasury: -7, military: 10, people: 6 },
        chronicle:
          "Sir Hugo led twelve soldiers into the forest at dawn. After " +
          "a full day of searching, they found the camp. Most of the " +
          "bandits fled; four were captured. The forest was clear, " +
          "and travelers on your estate roads breathed easier.",
        indicators: { treasury: "down", military: "up", people: "up" },
      },
      {
        text: "Offer the bandits a pardon if they surrender and work on the estate.",
        effects: { treasury: -4, military: 3, people: 4 },
        chronicle:
          "You sent a messenger into the forest with an offer. Eight men " +
          "came out — wary, hungry, and willing. Three stayed to work " +
          "as farm laborers; five moved on. The remaining bandits seemed " +
          "to disappear without their numbers.",
        indicators: { treasury: "down", military: "up", people: "up" },
      },
      {
        text: "Build a watchtower and patrol the forest edge — wait them out.",
        effects: { treasury: -5, military: 5, people: -4 },
        chronicle:
          "You built a wooden tower at the forest's edge and kept armed " +
          "men there day and night. The bandits could not easily raid " +
          "the fields anymore, but they were still out there. Farmers " +
          "near the forest refused to work their strips alone.",
        indicators: { treasury: "down", military: "up", people: "down" },
      },
    ],
    scribesNote: null,
  },

  {
    id: "rand_mil_5",
    title: "The Weapon Shortage",
    category: "military",
    requiresMeter: "military",
    description:
      "Your blacksmith reports that your soldiers' swords and armor are " +
      "in poor condition. Several swords are dull enough to be dangerous " +
      "to their owners in a real fight. Proper repairs require high-quality " +
      "iron that your smith says will cost considerably. Or you can buy " +
      "cheaper iron and accept weapons that are 'good enough for now.'",
    options: [
      {
        text: "Buy the best iron and do the repairs right.",
        effects: { treasury: -8, military: 12 },
        chronicle:
          "Your blacksmith hammered and tempered for two weeks straight. " +
          "The finished weapons gleamed, and Sir Hugo personally tested " +
          "each blade before accepting it. Your soldiers looked more " +
          "dangerous — and knew it.",
        indicators: { treasury: "down", military: "up" },
      },
      {
        text: "Use cheaper iron — you cannot afford the best right now.",
        effects: { treasury: -5, military: 5 },
        chronicle:
          "The cheaper iron did the job adequately. The repaired weapons " +
          "were serviceable but not impressive. Sir Hugo said nothing, " +
          "but he did arrange for extra drilling — possibly as a way of " +
          "compensating for equipment he did not fully trust.",
        indicators: { treasury: "down", military: "up" },
      },
      {
        text: "Postpone repairs — the weapons will hold a little longer.",
        effects: { treasury: 4, military: -8 },
        chronicle:
          "You delayed the blacksmith and kept the coin. Sir Hugo gave " +
          "a report on readiness that was carefully worded to say nothing " +
          "good. During the next drill, a soldier's sword snapped at the " +
          "hilt, which at least settled the argument.",
        indicators: { treasury: "up", military: "down" },
      },
    ],
    scribesNote:
      "Making a good medieval sword was extremely skilled work. A master " +
      "swordsmith carefully folded and hammered iron hundreds of times to " +
      "make it both hard and flexible — a sword that was too brittle would " +
      "snap in battle, but one that was too soft would bend. A fine sword " +
      "could take a week or more to make and cost several months of a " +
      "soldier's wages.",
  },

  {
    id: "rand_mil_6",
    title: "The Fortification Request",
    category: "military",
    requiresMeter: "military",
    description:
      "A royal inspector arrives and informs you that under new royal " +
      "orders, all lords in the region must contribute to building a " +
      "new garrison fort on the main road to protect against raids " +
      "from the north. You can pay your share in coin, send laborers, " +
      "or send soldiers to serve in the new fort for a season.",
    options: [
      {
        text: "Pay your share in coin — keep your own forces at home.",
        effects: { treasury: -7, military: 5 },
        chronicle:
          "You paid the inspector's required amount and sent him off " +
          "with a polite bow. The fort was built with others' labor. " +
          "The royal registry noted your compliance, and your own " +
          "soldiers stayed home where they were needed.",
        indicators: { treasury: "down", military: "up" },
      },
      {
        text: "Send ten laborers for a month — cheaper than coin.",
        effects: { treasury: -3, people: -5, military: 4 },
        chronicle:
          "You sent ten strong men with tools. They were away for six " +
          "weeks, and your own building projects slowed. When they " +
          "returned, they had learned new construction techniques from " +
          "the royal engineers working at the fort.",
        indicators: { treasury: "down", people: "down", military: "up" },
      },
      {
        text: "Send five soldiers for a season — they gain combat experience.",
        effects: { treasury: -5, military: 8 },
        chronicle:
          "Five of your soldiers spent a season at the frontier fort. " +
          "They returned harder, more disciplined, and full of stories " +
          "about the soldiers they had fought alongside. Sir Hugo seemed " +
          "pleased — even a little envious.",
        indicators: { treasury: "down", military: "up" },
      },
    ],
    scribesNote: null,
  },

  // ──────────────────────────────────────────────
  // RELIGIOUS (6+)
  // ──────────────────────────────────────────────

  {
    id: "rand_rel_1",
    title: "The Tithe Demand",
    category: "religious",
    requiresMeter: "faith",
    description:
      "The archdeacon has arrived carrying a scroll listing your unpaid " +
      "tithes — the one-tenth of all produce that landowners owe to " +
      "the Church each year. Your records show you paid most of it, " +
      "but his records show a different number. He is polite but firm, " +
      "and he reminds you that disputes like this can be taken to the " +
      "bishop's court.",
    options: [
      {
        text: "Pay the full amount he claims — avoid any conflict with the Church.",
        effects: { treasury: -7, faith: 8 },
        chronicle:
          "You handed over the full amount without argument. The archdeacon " +
          "signed his scroll and gave you a receipt. Your steward was " +
          "furious about the discrepancy for weeks afterward, but you " +
          "had no new enemies at the diocese.",
        indicators: { treasury: "down", faith: "up" },
      },
      {
        text: "Show him your own records and insist on your lower figure.",
        effects: { treasury: -4, faith: -5 },
        chronicle:
          "You laid out your account books and argued the numbers calmly. " +
          "The archdeacon examined them and, after two uncomfortable hours, " +
          "accepted a compromise. You paid somewhat less — but he left " +
          "with a note of the dispute recorded in the diocese register.",
        indicators: { treasury: "down", faith: "down" },
      },
      {
        text: "Pay half now and propose a payment plan for the rest.",
        effects: { treasury: -5, faith: 2 },
        chronicle:
          "You offered half immediately and promised the rest by Michaelmas. " +
          "The archdeacon accepted, clearly preferring a reliable partial " +
          "payment to a long dispute. He left satisfied enough, though " +
          "your steward marked the debt in red in his books.",
        indicators: { treasury: "down", faith: "up" },
      },
    ],
    scribesNote:
      "The tithe — one-tenth of everything — was one of the biggest sources " +
      "of income for the medieval Church. Farmers paid it in grain, animals, " +
      "or produce. The Church used this money to pay for churches, priests, " +
      "hospitals, and schools — but also for the very wealthy lives of some " +
      "bishops and abbots. Tithe disputes were extremely common and often " +
      "ended up in Church courts, which had enormous power.",
  },

  {
    id: "rand_rel_2",
    title: "The Bishop's Visit",
    category: "religious",
    requiresMeter: "faith",
    description:
      "The bishop himself has announced he will visit your estate next " +
      "month for a pastoral inspection — checking on the condition of " +
      "your chapel, the quality of the local priests, and the religious " +
      "life of your people. He will expect a report from your village " +
      "priest on whether you have been a good Christian lord.",
    options: [
      {
        text: "Prepare the chapel and make charitable donations before his visit.",
        effects: { treasury: -8, faith: 12 },
        chronicle:
          "You had the chapel whitewashed, the altar cloth replaced, " +
          "and distributed grain to six poor families two days before " +
          "the bishop arrived. Your village priest's report was glowing. " +
          "The bishop blessed your estate and stayed for an excellent dinner.",
        indicators: { treasury: "down", faith: "up" },
      },
      {
        text: "Do nothing special — your faith stands on its own record.",
        effects: { faith: -4 },
        chronicle:
          "The bishop arrived to a chapel that was adequate but plain, " +
          "and a priest whose report was careful rather than enthusiastic. " +
          "The bishop stayed one night, made polite comments, and left " +
          "you with the feeling that his next letter to the diocese " +
          "would mention your estate only briefly.",
        indicators: { faith: "down" },
      },
    ],
    scribesNote: null,
  },

  {
    id: "rand_rel_3",
    title: "The Pilgrim Arrivals",
    category: "religious",
    requiresMeter: "faith",
    description:
      "A relic — a small bone said to belong to Saint Cuthbert — has " +
      "been displayed in a nearby town, and pilgrims are flooding through " +
      "your estate on their way there. Hundreds of travelers need food, " +
      "water, and a safe place to stop. This is both an opportunity " +
      "and an enormous logistical challenge.",
    options: [
      {
        text: "Set up a way station — sell food and lodging at fair prices.",
        effects: { treasury: 9, people: 5, faith: 5 },
        chronicle:
          "You had your workers build a row of simple shelters and set " +
          "up tables selling bread, ale, and dried fish. The pilgrims " +
          "were grateful, your people were busy and earning extra coin, " +
          "and the priest wrote a letter of appreciation to the diocese.",
        indicators: { treasury: "up", people: "up", faith: "up" },
      },
      {
        text: "Provide free food and water as an act of Christian charity.",
        effects: { treasury: -8, people: 3, faith: 14 },
        chronicle:
          "You opened your storerooms and your wells freely. Hundreds " +
          "of pilgrims prayed for your soul as they rested and ate. The " +
          "cost was real and the stores shrank visibly, but the bishop " +
          "heard about your generosity within the week.",
        indicators: { treasury: "down", people: "up", faith: "up" },
      },
      {
        text: "Close your roads to pilgrims — you cannot absorb the traffic.",
        effects: { people: -4, faith: -10 },
        chronicle:
          "You posted guards at the estate roads with orders to redirect " +
          "pilgrims around your lands. The pilgrims complained loudly, " +
          "the priest was shocked, and word reached the nearby monastery " +
          "that you had turned away Christian travelers.",
        indicators: { people: "down", faith: "down" },
      },
    ],
    scribesNote:
      "The shrine of Saint Cuthbert at Durham Cathedral was one of the most " +
      "popular pilgrimage sites in medieval England. Cuthbert was a monk who " +
      "died in 687 AD, and his body was moved around England for centuries to " +
      "protect it from Viking raids. When pilgrims brought money and business " +
      "to a town, local lords quickly learned to welcome — and profit from — " +
      "the traffic.",
  },

  {
    id: "rand_rel_4",
    title: "The Monastery Dispute",
    category: "religious",
    requiresMeter: "faith",
    description:
      "The abbot of the nearby monastery claims that a strip of farmland " +
      "on your estate actually belongs to the monastery based on a grant " +
      "from seventy years ago. He has produced an old document. Your " +
      "own records are unclear on this land. The Church courts will " +
      "rule against you if the document is genuine.",
    options: [
      {
        text: "Give the monks the land — it is not worth a Church dispute.",
        effects: { treasury: -5, faith: 9 },
        chronicle:
          "You examined the document with your clerk and conceded the " +
          "land graciously. The abbot was visibly surprised and invited " +
          "you to a thanksgiving dinner at the monastery. You came away " +
          "with a written blessing and a useful friendship.",
        indicators: { treasury: "down", faith: "up" },
      },
      {
        text: "Contest the document — demand it be verified by the bishop.",
        effects: { treasury: -6, faith: -6 },
        chronicle:
          "The dispute went to the bishop's court and took three months " +
          "to resolve. The document turned out to be genuine. You lost the " +
          "land and the legal costs — and the abbot's cheerful attitude " +
          "toward you visibly cooled.",
        indicators: { treasury: "down", faith: "down" },
      },
      {
        text: "Offer to lease the land from the monastery — keep using it.",
        effects: { treasury: -4, faith: 5 },
        chronicle:
          "You proposed paying the monastery a small annual fee to continue " +
          "farming the land. The abbot found this unexpectedly practical " +
          "and agreed. You kept the productive fields; the monks got " +
          "income. Everyone walked away having gained something.",
        indicators: { treasury: "down", faith: "up" },
      },
    ],
    scribesNote:
      "Medieval monasteries were major landowners across Europe. English " +
      "monasteries owned roughly a quarter of all the farmland in England " +
      "by the time King Henry VIII dissolved them in the 1530s. They kept " +
      "careful written records of their property going back centuries, which " +
      "gave them a huge legal advantage in disputes with lords who had " +
      "worse record-keeping.",
  },

  {
    id: "rand_rel_5",
    title: "The Holy Day Conflict",
    category: "religious",
    requiresMeter: "faith",
    description:
      "The feast day of your estate's patron saint falls exactly on the " +
      "day you had scheduled an urgent market delivery of wool. Your " +
      "priest says all work must stop for the holy day — it is a serious " +
      "religious obligation. Your merchant buyer says if the delivery " +
      "misses the market day, the deal falls apart.",
    options: [
      {
        text: "Honor the holy day — cancel the delivery and absorb the loss.",
        effects: { treasury: -8, faith: 10 },
        chronicle:
          "You called off the delivery and attended the feast day mass " +
          "with your whole household. Your priest led an outdoor procession " +
          "to the saint's shrine. The merchant was angry and found another " +
          "supplier. Your people seemed genuinely moved by your choice.",
        indicators: { treasury: "down", faith: "up" },
      },
      {
        text: "Send the delivery anyway — the merchant deal is too important.",
        effects: { treasury: 10, faith: -9, people: -4 },
        chronicle:
          "You sent the wool carts out at dawn. The priest arrived at " +
          "the courtyard, looked at the departing carts, and went back " +
          "inside the chapel without speaking to you. Several of your " +
          "workers who had expected the day off looked at you sideways " +
          "for weeks afterward.",
        indicators: { treasury: "up", faith: "down", people: "down" },
      },
      {
        text: "Negotiate: deliver the day before, even at a slightly lower price.",
        effects: { treasury: 6, faith: 3 },
        chronicle:
          "You sent a fast rider to the merchant with a counter-proposal: " +
          "delivery tomorrow for a small reduction in price. He agreed, " +
          "surprised by your speed in working around the problem. The " +
          "feast day was honored, and the wool was sold.",
        indicators: { treasury: "up", faith: "up" },
      },
    ],
    scribesNote:
      "Medieval people actually had a lot of official holidays — roughly " +
      "one-third of the year was marked by Church feast days, saints' days, " +
      "and seasonal festivals. The Church strictly required rest on these days. " +
      "But because trade and farming had their own urgent schedules, lords and " +
      "merchants were constantly finding creative ways to work around the rules — " +
      "or simply ignoring them and paying a fine later.",
  },

  {
    id: "rand_rel_6",
    title: "The Relic Discovery",
    category: "religious",
    requiresMeter: "faith",
    description:
      "Your workers digging a new drainage ditch have unearthed an old " +
      "stone box containing what appears to be very old bones and a faded " +
      "Latin inscription. Your priest is breathless with excitement — " +
      "he believes these may be the remains of a local saint. Pilgrims " +
      "would come from miles away. But verifying the discovery requires " +
      "sending the box to the bishop.",
    options: [
      {
        text: "Send the bones to the bishop for verification — do it properly.",
        effects: { faith: 10, people: 4 },
        chronicle:
          "You packaged the box carefully and sent a trusted monk to " +
          "deliver it to the bishop with a full account of the discovery. " +
          "The bishop's response was encouraging — an investigation had " +
          "begun. Your estate's name appeared in the diocese records " +
          "for the first time in decades.",
        indicators: { faith: "up", people: "up" },
      },
      {
        text: "Keep the discovery quiet and build a small shrine on the spot.",
        effects: { treasury: 5, faith: 6, people: 6 },
        chronicle:
          "You had a simple stone shrine built over the spot and told " +
          "your villagers what had been found. Word spread anyway, as " +
          "it always does, and a small but steady trickle of local " +
          "pilgrims arrived each month, leaving small coins at the shrine.",
        indicators: { treasury: "up", faith: "up", people: "up" },
      },
      {
        text: "Say nothing about it — religious controversy helps no one.",
        effects: { faith: -5, people: -3 },
        chronicle:
          "You had the box reburied and told your workers to forget " +
          "what they had seen. The priest was visibly distressed. The " +
          "workers talked about it anyway — workers always do — and " +
          "for weeks people kept walking to the ditch to look at " +
          "the ground.",
        indicators: { faith: "down", people: "down" },
      },
    ],
    scribesNote:
      "Relics — bones and objects associated with saints — were an enormous " +
      "part of medieval religious life. Churches and cathedrals competed to " +
      "collect impressive relics because pilgrims brought money. Some relics " +
      "were authentic; many were not. The Vatican's collection included pieces " +
      "of the True Cross that, if assembled, would have made many crosses — " +
      "which medieval scholars were actually aware of and debated.",
  },

  {
    id: "rand_rel_7",
    title: "The Crusade Preacher",
    category: "religious",
    requiresMeter: "faith",
    description:
      "A passionate friar has arrived in your village, preaching for a " +
      "new crusade and calling on all Christian lords to send men or money. " +
      "Your village priest is moved by the sermon. Several of your young " +
      "soldiers are volunteering. The friar assures you that all debts " +
      "of the departed are forgiven by God.",
    options: [
      {
        text: "Support the crusade with coin — stay home but contribute.",
        effects: { treasury: -8, faith: 9 },
        chronicle:
          "You donated generously to the crusade fund and the friar " +
          "blessed your estate publicly. The young men who had volunteered " +
          "were talked out of going in favor of your financial contribution. " +
          "The friar called you a pillar of Christian virtue and moved " +
          "on to the next estate.",
        indicators: { treasury: "down", faith: "up" },
      },
      {
        text: "Let three soldiers go who volunteered — honor their conviction.",
        effects: { military: -8, faith: 8, people: 4 },
        chronicle:
          "You blessed the three volunteers yourself and gave each a " +
          "small purse for the journey. The village wept and cheered " +
          "in equal measure as they rode out. You did not know if " +
          "you would see them again — two returned, two years later, " +
          "looking very much older.",
        indicators: { military: "down", faith: "up", people: "up" },
      },
      {
        text: "Politely decline — you cannot spare men or money this year.",
        effects: { faith: -6, people: -3 },
        chronicle:
          "You told the friar your obligations at home were too pressing. " +
          "He accepted your answer without a scene but managed, somehow, " +
          "to convey that God was watching very closely. Three young men " +
          "who had hoped to go looked betrayed for the rest of the month.",
        indicators: { faith: "down", people: "down" },
      },
    ],
    scribesNote:
      "The Crusades were a series of religious wars launched by European " +
      "Christians to capture Jerusalem and other holy sites. The First Crusade " +
      "was called by Pope Urban II in 1095. Lords who went on crusade faced " +
      "an enormous problem: they might be away for years, during which their " +
      "estates could fall apart, their neighbors could encroach on their lands, " +
      "and their people had no one to lead them.",
  },

];

export default randomEvents;
