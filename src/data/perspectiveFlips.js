/**
 * perspectiveFlips.js
 *
 * Content data for the four "perspective flip" mini-sequences.
 * Each flip temporarily casts the player as a different character on the estate.
 * Triggered once per playthrough at specific gameplay conditions.
 *
 * Structure per flip:
 *   id, character, title, colorScheme, triggerConditions,
 *   intro, characterStats, decisions[], consequences, returnText, scribesNote
 */

export const PERSPECTIVE_FLIPS = {
  // =========================================================================
  // FLIP A: A Serf's Week — Thomas the Villein
  // =========================================================================
  serf_week: {
    id: "serf_week",
    character: "Thomas the Villein",
    title: "A Serf's Week",
    colorScheme: {
      accent: "#5c3d1e",
      light: "#a0714f",
      background: "#f0e6d3",
      text: "#2a1a08",
    },
    triggerConditions: { minTurn: 8 },
    intro: {
      title: "A Serf's Week",
      bridgeText:
        "As you sign the autumn tax rolls, your quill pauses. What does this number mean to those who pay it? You close your eyes\u2026",
      narrativeText:
        "You are Thomas, a villein on this very manor. You wake before dawn in a one-room cruck house. Your wife Maud is already stirring the fire. Your three children sleep on straw pallets. Today is Monday \u2014 the first of three days you owe working the lord\u2019s fields. Your own strip of land sits unplowed. Rain is coming.",
    },
    characterStats: {
      hunger: { label: "Hunger", icon: "\u2727", initial: 60, color: "#8b4513" },
      energy: { label: "Energy", icon: "\u2726", initial: 70, color: "#556b2f" },
      family: { label: "Family", icon: "\u2302", initial: 50, color: "#8b1a1a" },
    },
    decisions: [
      // Decision 1: Morning Labor
      {
        title: "Day 1: The Lord\u2019s Fields",
        description:
          "The reeve is calling workers to the lord\u2019s demesne. Your own strip needs plowing desperately \u2014 if you don\u2019t plant soon, your family will go hungry this winter.",
        scribesNote:
          "Villeins owed 2\u20133 days of \u2018week-work\u2019 on the lord\u2019s demesne every week. The lord\u2019s crops and the peasant\u2019s crops needed attention at the same time \u2014 and the lord\u2019s ALWAYS came first. Missing your work days could mean a fine in the manorial court.",
        options: [
          {
            text: "Work the lord\u2019s field faithfully",
            statEffects: { energy: -15, hunger: -10 },
            outcome:
              "You hoe the lord\u2019s field from dawn to dusk. Your back aches. Supper tonight will be thin \u2014 but at least you avoided the reeve\u2019s wrath.",
            consequenceFlags: ["obedient_labor"],
          },
          {
            text: "Sneak away to water your own strips first, then go late",
            chance: 0.6,
            successStatEffects: { energy: -10, hunger: +5, family: +10 },
            failureStatEffects: { energy: -15, hunger: -10, family: -15 },
            successOutcome:
              "You tend your own crops at dawn and arrive at the lord\u2019s field only slightly late. No one noticed. Your strips look better already.",
            failureOutcome:
              "The reeve spotted your absence and noted it. You\u2019ll owe extra days of labor. Maud looks worried when you tell her.",
            consequenceFlags: { success: [], failure: ["caught_sneaking"] },
          },
          {
            text: "Send your eldest son to the lord\u2019s field while you plow your own",
            statEffects: { energy: -10, hunger: +15, family: -10 },
            outcome:
              "Your son struggles under the heavy work meant for a grown man. He comes home exhausted and resentful. But your strips are plowed.",
            consequenceFlags: ["missed_labor"],
          },
        ],
      },
      // Decision 2: The Heriot
      {
        title: "Day 2: The Heriot",
        description:
          "Your neighbor Old Edmund died last night. His widow Agnes is weeping \u2014 the reeve has come to collect the heriot: the family\u2019s best ox. Without it, Agnes cannot plow her field. She has four children.",
        scribesNote:
          "The heriot was a death tax \u2014 when a serf died, the lord took the family\u2019s best animal. For a peasant family that owned one ox, this could be economically devastating. Imagine losing your family car the same week a parent dies.",
        options: [
          {
            text: "Say nothing \u2014 it\u2019s the law",
            statEffects: { family: -5 },
            outcome:
              "You watch as the reeve leads the ox away. Agnes\u2019s children stare. The village is quiet. Sometimes the law is the cruelest thing of all.",
            consequenceFlags: [],
          },
          {
            text: "Offer to share your ox with Agnes for plowing season",
            statEffects: { energy: -10, family: +15 },
            outcome:
              "Agnes weeps with gratitude. Your own plowing will take twice as long now, but the village murmurs approval. Kindness is remembered.",
            consequenceFlags: ["helped_neighbor"],
          },
          {
            text: "Speak up to the reeve and ask for mercy",
            chance: 0.5,
            successStatEffects: { family: +10 },
            failureStatEffects: { family: -10 },
            successOutcome:
              "The reeve hesitates, then agrees to take a cow instead. Agnes still has her ox. Small mercies.",
            failureOutcome:
              "The reeve reports you as a troublemaker. Now he\u2019ll be watching you closely. Agnes loses the ox anyway.",
            consequenceFlags: { success: ["helped_neighbor"], failure: ["caught_sneaking"] },
          },
        ],
      },
      // Decision 3: Feeding the Family
      {
        title: "Day 3: Feeding the Family",
        description:
          "It\u2019s evening. Maud has made pottage \u2014 a thick stew of peas, beans, and onions. There\u2019s dark rye bread and weak ale. But there\u2019s not quite enough for everyone to eat their fill.",
        scribesNote:
          "A medieval peasant\u2019s diet was mostly bread and pottage (thick vegetable stew). They drank about a gallon of weak ale per day because water was often unsafe. Meat was rare \u2014 maybe on feast days. Despite this, peasants were often strong and muscular from constant physical labor.",
        options: [
          {
            text: "Everyone eats equal portions",
            statEffects: { hunger: -10 },
            outcome:
              "Nobody is satisfied, but nobody is starving either. The children grumble. Maud makes it stretch with extra water in the pottage.",
            consequenceFlags: [],
          },
          {
            text: "Give the children the most \u2014 you and Maud eat less",
            statEffects: { hunger: -20, family: +10 },
            outcome:
              "The children eat their fill for once. Your stomach growls through the night, but their sleeping faces are peaceful. Maud squeezes your hand.",
            consequenceFlags: ["sacrificed_for_family"],
          },
          {
            text: "Eat your full share \u2014 you need strength for tomorrow\u2019s labor",
            statEffects: { hunger: +5, energy: +10, family: -10 },
            outcome:
              "You eat well. You\u2019ll be strong for the fields tomorrow. But Maud gives you a look that says more than words ever could.",
            consequenceFlags: [],
          },
        ],
      },
      // Decision 4: Market Day
      {
        title: "Day 5: Market Day",
        description:
          "Saturday. The lord has granted permission for a small market. You have a few extra eggs and a bundle of herbs. You could sell them for a penny or two \u2014 or trade them for salt to preserve food for winter.",
        scribesNote:
          "Medieval peasants were not entirely self-sufficient. They relied on local markets to buy salt (essential for food preservation), iron tools, and pottery. Market day was also a social event \u2014 one of the few times peasants could interact beyond their own village.",
        options: [
          {
            text: "Sell for coins \u2014 save toward buying your freedom someday",
            statEffects: { hunger: -5, family: +5 },
            outcome:
              "Two pennies. It\u2019s nothing \u2014 and it\u2019s everything. Freedom costs 20 shillings. At this rate, it would take a lifetime. But the dream keeps you going.",
            consequenceFlags: ["saved_coins"],
          },
          {
            text: "Trade for salt \u2014 practical survival",
            statEffects: { hunger: +10, family: +5 },
            outcome:
              "Salt secured. The meat you salted last autumn lasted until spring. This winter might be bearable after all.",
            consequenceFlags: ["helped_market"],
          },
          {
            text: "Give the eggs to Agnes\u2019s children \u2014 they\u2019re hungrier than yours",
            statEffects: { hunger: -5, family: +15 },
            outcome:
              "Agnes\u2019s youngest smiles for the first time since Edmund died. The whole village sees. Thomas the villein, they whisper, has a good heart.",
            consequenceFlags: ["helped_neighbor"],
          },
        ],
      },
      // Decision 5: The Merchet
      {
        title: "Day 7: The Merchet",
        description:
          "Your daughter Emma, age 14, has been noticed by a freeman\u2019s son from the next village. He wants to marry her. But to marry outside the manor, you must pay the lord a merchet \u2014 a marriage fine of 2 shillings. You don\u2019t have 2 shillings. You barely have 2 pennies.",
        scribesNote:
          "Merchet was a fine paid to the lord for permission to marry \u2014 especially if the serf\u2019s daughter married someone outside the manor. The lord lost a potential worker, so he charged for it. Serfs couldn\u2019t marry, move, or sell property without the lord\u2019s permission. This wasn\u2019t slavery \u2014 but it wasn\u2019t freedom either.",
        options: [
          {
            text: "Beg the lord for mercy or a payment plan",
            chance: 0.5,
            successStatEffects: { family: +20 },
            failureStatEffects: { family: -10 },
            successOutcome:
              "The lord agrees to a payment plan. Emma will marry her freeman. Your grandchildren might be born free. Hope is a powerful thing.",
            failureOutcome:
              "The lord refuses. Emma weeps into her pillow. The freeman\u2019s son will find someone else. Your daughter will stay on this manor.",
            consequenceFlags: { success: ["paid_merchet"], failure: [] },
          },
          {
            text: "Forbid the marriage \u2014 you can\u2019t afford it",
            statEffects: { family: -15 },
            outcome:
              "Emma doesn\u2019t speak to you for a week. She\u2019ll marry someone on this manor instead \u2014 another villein\u2019s son. Her children will be serfs, like you.",
            consequenceFlags: [],
          },
          {
            text: "Ask the village to help \u2014 everyone chips in a little",
            statEffects: { family: +10 },
            outcome:
              "Penny by penny, the village scrapes together enough. You owe favors to half the manor now. But Emma is radiant on her wedding day.",
            consequenceFlags: ["helped_neighbor"],
          },
        ],
      },
    ],
    consequences: {
      base: { people: +2, treasury: +2 },
      flags: {
        obedient_labor: { people: +2 },
        missed_labor: { people: -3, treasury: -2 },
        caught_sneaking: { people: -3 },
        helped_neighbor: { people: +3 },
        sacrificed_for_family: { people: +2 },
        helped_market: { treasury: +2, people: +2 },
        saved_coins: { treasury: +1 },
        paid_merchet: { people: +5, treasury: -3 },
      },
    },
    returnText:
      "You open your eyes. The tax roll stares up at you. The numbers have not changed \u2014 but something in you has. Thomas\u2019s week is over. He worked, fed his family as best he could, and faced choices no lord ever has to think about.",
    scribesNote:
      "In medieval England, villeins owed their lord \u2018week-work\u2019 \u2014 unpaid labor on the lord\u2019s demesne for two or three days every week, plus rent payments in crops or coin. This system wasn\u2019t slavery, but it wasn\u2019t freedom. A villein couldn\u2019t leave, marry, or sell property without the lord\u2019s permission. The lord\u2019s power was almost total \u2014 but it came with obligations too. A good lord protected his people. A bad one simply took.",
  },

  // =========================================================================
  // FLIP B: A Merchant Woman's Day — Agnes the Brewster
  // =========================================================================
  merchant_day: {
    id: "merchant_day",
    character: "Agnes the Brewster",
    title: "A Merchant Woman\u2019s Day",
    colorScheme: {
      accent: "#8b6914",
      light: "#c9a227",
      background: "#fdf3d7",
      text: "#3d2517",
    },
    triggerConditions: { minTurn: 6 },
    intro: {
      title: "A Merchant Woman\u2019s Day",
      bridgeText:
        "As you review the market tolls, you notice a woman\u2019s name crossed out and replaced with a man\u2019s. You wonder what that story looks like from the other side\u2026",
      narrativeText:
        "You are Agnes, a widow who brews ale in the market town below the castle. Your husband died two years ago. You kept his brewing business \u2014 the only way to feed your three children. Today is market day, and your fresh batch is ready. But so is trouble.",
    },
    characterStats: {
      coin: { label: "Coin", icon: "\u269C", initial: 30, color: "#8b6914" },
      reputation: { label: "Reputation", icon: "\u2605", initial: 50, color: "#2d5a27" },
      safety: { label: "Safety", icon: "\u2694", initial: 60, color: "#4a1a6b" },
    },
    decisions: [
      // Decision 1: The Ale-Taster
      {
        title: "Morning: The Ale-Taster",
        description:
          "The ale-taster \u2014 a man appointed by the lord to inspect all ale \u2014 arrives at your door. He tastes your brew, frowns, and says it\u2019s \u2018slightly weak.\u2019 You know it\u2019s fine. He\u2019s done this before. He wants a bribe.",
        scribesNote:
          "Ale-tasters were real officials who inspected every batch brewed in a town. Women brewed most of England\u2019s ale for centuries \u2014 the word \u2018brewster\u2019 is the feminine form of \u2018brewer.\u2019 But ale-tasters fined women far more often than men, and medieval church art even depicted alewives being dragged to hell by demons.",
        options: [
          {
            text: "Pay the bribe \u2014 3 coins",
            statEffects: { coin: -3, reputation: +5 },
            outcome:
              "He pockets the coins and marks your ale as \u2018acceptable.\u2019 It was always acceptable. But this is the cost of doing business as a woman.",
            consequenceFlags: [],
          },
          {
            text: "Refuse and demand a fair tasting",
            chance: 0.5,
            successStatEffects: { reputation: +10 },
            failureStatEffects: { coin: -5, reputation: -5 },
            successOutcome:
              "Other merchants overhear your challenge. The ale-taster backs down, embarrassed. Your reputation grows. Agnes doesn\u2019t take nonsense.",
            failureOutcome:
              "The ale-taster fines you 5 coins for \u2018substandard brew.\u2019 Everyone knows it\u2019s unfair. But the fine stands.",
            consequenceFlags: { success: ["stood_ground"], failure: [] },
          },
          {
            text: "Offer him a free barrel instead of coins",
            statEffects: { coin: -2, reputation: +3 },
            outcome:
              "He takes the barrel with a grin. You keep your cash but lose product. A barrel of ale is worth more than 3 coins, but he doesn\u2019t need to know you\u2019d have poured it out tomorrow anyway.",
            consequenceFlags: [],
          },
        ],
      },
      // Decision 2: The Femme Sole Decision
      {
        title: "Midday: The Femme Sole Decision",
        description:
          "A cloth merchant offers you a business partnership \u2014 he\u2019ll supply hops (a new ingredient from the continent) if you brew a new style of beer. But to sign the contract, you must register as \u2018femme sole\u2019 \u2014 a woman trading independently. This gives you legal rights to make deals\u2026 but also makes YOU personally liable for all debts.",
        scribesNote:
          "Under medieval law, a married woman\u2019s legal identity was absorbed into her husband\u2019s \u2014 this was called \u2018coverture.\u2019 She couldn\u2019t own property, sign contracts, or appear in court. But widows and \u2018femme sole\u2019 women could trade independently. In medieval London, women worked as silkwomen, brewsters, and merchants \u2014 but they always faced more legal obstacles than men doing the same work.",
        options: [
          {
            text: "Register as femme sole \u2014 take the risk for independence",
            statEffects: { reputation: +15, safety: -10 },
            outcome:
              "You sign the papers. For the first time, your name appears on an official document as a trader in your own right. It\u2019s terrifying. It\u2019s exhilarating.",
            consequenceFlags: ["femme_sole"],
          },
          {
            text: "Decline \u2014 too risky with three children to feed",
            statEffects: { safety: +5, reputation: -5 },
            outcome:
              "The cloth merchant shrugs and moves on. Your ale stays the same. Your life stays the same. Safe. Small. Certain.",
            consequenceFlags: [],
          },
          {
            text: "Work with the merchant informally \u2014 no contract",
            statEffects: { coin: +5 },
            outcome:
              "You brew the hopped beer without a contract. It sells well. But if the merchant cheats you, you have no legal recourse. Trust is a fragile currency.",
            consequenceFlags: [],
          },
        ],
      },
      // Decision 3: The Competitor
      {
        title: "Afternoon: The Competitor",
        description:
          "A man named Robert has opened a brewing operation across the street. He has more capital, a bigger space, and the guild\u2019s support. He\u2019s undercutting your prices. Your regular customers are wavering.",
        scribesNote:
          "As brewing became more profitable in the late Middle Ages, men with more capital and guild connections gradually pushed women out of the trade. By the 1400s, almost all commercial brewing was controlled by men. Women kept brewing at home for their families, but the public market \u2014 and the money \u2014 belonged to the guilds.",
        options: [
          {
            text: "Lower your prices to match",
            statEffects: { coin: -5, reputation: +5 },
            outcome:
              "Your customers stay, but your margins vanish. You\u2019re working harder for less. Robert can afford to wait you out. You can\u2019t.",
            consequenceFlags: [],
          },
          {
            text: "Specialize \u2014 brew medicinal herb ale that Robert can\u2019t replicate",
            chance: 0.7,
            successStatEffects: { coin: +5, reputation: +10 },
            failureStatEffects: { coin: -3, reputation: -5 },
            successOutcome:
              "Your herb ale becomes the talk of the market. People come from two villages away. Robert can brew cheaper \u2014 but he can\u2019t brew better.",
            failureOutcome:
              "The herb ale doesn\u2019t sell. People prefer what they know. You\u2019ve wasted ingredients you couldn\u2019t afford to lose.",
            consequenceFlags: { success: ["innovated"], failure: [] },
          },
          {
            text: "Appeal to the guild for fair competition rules",
            chance: 0.5,
            successStatEffects: { reputation: +10 },
            failureStatEffects: { reputation: -10 },
            successOutcome:
              "The guild master, grudgingly, rules that Robert must match your prices. Fair competition. For now.",
            failureOutcome:
              "The guild sides with Robert. \u2018Perhaps,\u2019 the guild master says, \u2018a woman should focus on her household.\u2019 You lose three customers that week.",
            consequenceFlags: { success: ["stood_ground"], failure: ["pushed_out"] },
          },
        ],
      },
      // Decision 4: The Exclusive Contract
      {
        title: "Evening: Alice Claver\u2019s Offer",
        description:
          "A wealthy silkwoman named Alice visits the market. She\u2019s looking for a reliable ale supplier for her household. It\u2019s a guaranteed contract \u2014 but she demands exclusivity. You\u2019d make good money, but you couldn\u2019t sell to anyone else.",
        scribesNote:
          "Alice Claver was a real London silkwoman who became one of the city\u2019s most successful merchants after her husband\u2019s death in 1456. She appeared in 7 of 9 royal wardrobe payments in 1480. She never remarried \u2014 widowhood was her path to legal and economic independence.",
        options: [
          {
            text: "Accept the exclusive contract",
            statEffects: { coin: +8, reputation: -5 },
            outcome:
              "Steady income. Reliable. But your other customers feel abandoned, and your world shrinks to one buyer. If Alice ever leaves\u2026",
            consequenceFlags: [],
          },
          {
            text: "Decline \u2014 keep your independence",
            statEffects: { reputation: +5 },
            outcome:
              "Alice nods with what might be respect. \u2018I understand,\u2019 she says. \u2018A woman who builds her own trade should keep it.\u2019",
            consequenceFlags: ["stood_ground"],
          },
          {
            text: "Negotiate \u2014 offer priority supply but not exclusivity",
            chance: 0.5,
            successStatEffects: { coin: +5, reputation: +5 },
            failureStatEffects: {},
            successOutcome:
              "Alice agrees. She gets first choice of your best barrels; you keep your other customers. A merchant\u2019s compromise.",
            failureOutcome:
              "Alice wants exclusivity or nothing. She moves on. But she remembers your name \u2014 and that counts for something.",
            consequenceFlags: { success: ["innovated"], failure: [] },
          },
        ],
      },
    ],
    consequences: {
      base: { treasury: +2, faith: +2 },
      flags: {
        femme_sole: { people: +5, treasury: +2 },
        stood_ground: { people: +3 },
        innovated: { treasury: +3 },
        pushed_out: { people: -3, treasury: -2 },
      },
    },
    returnText:
      "Agnes closes her stall as the sun sets. She made a little coin, fought to keep her business, and navigated a world that wasn\u2019t built for her. The market ledger won\u2019t record her struggles \u2014 but the ale will keep flowing.",
    scribesNote:
      "Women were central to the medieval economy but nearly invisible in its records. Brewsters, silkwomen, and market traders kept towns fed and supplied, yet faced legal barriers, guild exclusion, and social stigma that their male counterparts never encountered. When we read \u2018the merchant sold ale,\u2019 we rarely ask: was the merchant a woman?",
  },

  // =========================================================================
  // FLIP C: A Noblewoman's Dilemma — Lady Margaret
  // =========================================================================
  noble_dilemma: {
    id: "noble_dilemma",
    character: "Lady Margaret",
    title: "A Noblewoman\u2019s Dilemma",
    colorScheme: {
      accent: "#1a3a6b",
      light: "#4a6fa5",
      background: "#eef2f8",
      text: "#1a1a2e",
    },
    triggerConditions: { minTurn: 10 },
    intro: {
      title: "A Noblewoman\u2019s Dilemma",
      bridgeText:
        "A messenger arrives \u2014 the king demands soldiers. As you dictate your response, you wonder: what would it be like to be the one left behind?",
      narrativeText:
        "You are Lady Margaret, wife of the lord. Your husband has ridden north to answer the king\u2019s military summons. He left you in charge of the entire estate \u2014 over 100 servants, 20 peasant families, a garrison of soldiers, and a harvest to manage. You have no formal legal authority. But the estate doesn\u2019t run itself.",
    },
    characterStats: {
      authority: { label: "Authority", icon: "\u265B", initial: 40, color: "#1a3a6b" },
      household: { label: "Household", icon: "\u2302", initial: 60, color: "#2d5a27" },
      danger: { label: "Danger", icon: "\u26A0", initial: 20, color: "#8b1a1a" },
    },
    decisions: [
      // Decision 1: The Steward's Report
      {
        title: "Monday: The Steward\u2019s Report",
        description:
          "The steward brings the weekly accounts. Income is short \u2014 three families haven\u2019t paid rent. The steward says, \u2018My lady, your lord husband would send the bailiff to collect.\u2019 But you know one family\u2019s father is ill and another just lost a child.",
        scribesNote:
          "When lords went to war or on Crusade, their wives ran entire estates \u2014 managing finances, settling disputes, directing servants, and even commanding garrisons. Noblewomen were often better educated in estate management than their husbands. Yet legally, under coverture, a married woman couldn\u2019t own property or sign contracts in her own name.",
        options: [
          {
            text: "Send the bailiff \u2014 the estate needs income",
            statEffects: { household: +10, authority: +5 },
            outcome:
              "The bailiff collects. Two families pay grudgingly. The sick father sells his only goat. The estate ledger balances. Something else does not.",
            consequenceFlags: ["strict_rule"],
          },
          {
            text: "Grant the sick family a delay, collect from the others",
            statEffects: { household: +5, authority: +10 },
            outcome:
              "Fair and firm. The steward nods approvingly. The sick family sends their eldest daughter with a basket of eggs as thanks. Authority earned, not demanded.",
            consequenceFlags: ["fair_rule"],
          },
          {
            text: "Waive all three debts this month",
            statEffects: { household: -10, authority: +15 },
            outcome:
              "The steward frowns at the ledger. But word spreads through the village: Lady Margaret is merciful. When the harvest comes, these families will remember.",
            consequenceFlags: ["merciful_rule"],
          },
        ],
      },
      // Decision 2: The Boundary Dispute
      {
        title: "Wednesday: The Boundary Dispute",
        description:
          "A neighboring lord, Sir Geoffrey, claims your husband agreed to move the boundary between your estates \u2014 giving Geoffrey control of the stream and mill. You know this is a lie. But Sir Geoffrey\u2019s messenger says: \u2018Surely a woman cannot speak for her lord in matters of property?\u2019",
        scribesNote:
          "Nicholaa de la Haye (c. 1150\u20131230) inherited the castellanship of Lincoln Castle, defended it twice in battle, and was appointed Sheriff of Lincolnshire. When political enemies tried to remove her from office, she traveled to court and demanded \u2014 and won \u2014 her position back. She was over 60 years old.",
        options: [
          {
            text: "\u2018I speak for this estate until my lord returns.\u2019",
            statEffects: { authority: +15, danger: +10 },
            outcome:
              "The messenger\u2019s smirk fades. You produce the original boundary charter from the estate records. Sir Geoffrey\u2019s claim crumbles \u2014 but he will not forget this humiliation.",
            consequenceFlags: ["stood_firm"],
          },
          {
            text: "Stall \u2014 \u2018I will consult my lord by letter.\u2019",
            statEffects: { authority: +5 },
            outcome:
              "The messenger leaves, satisfied he\u2019s dealing with a hesitant woman. But you\u2019ve bought time to prepare your defense. Let Geoffrey think you\u2019re weak.",
            consequenceFlags: [],
          },
          {
            text: "Concede the stream but keep the mill",
            statEffects: { authority: -5, household: -5, danger: -5 },
            outcome:
              "Peace at a price. Geoffrey gets his stream. You keep the mill. Your husband may be displeased \u2014 but at least there won\u2019t be fighting while he\u2019s away.",
            consequenceFlags: ["conceded"],
          },
        ],
      },
      // Decision 3: The Garrison Commander
      {
        title: "Thursday: The Garrison Commander",
        description:
          "The garrison captain reports: scouts have spotted armed men in the forest \u2014 possibly bandits, possibly Sir Geoffrey\u2019s soldiers testing your defenses. The captain asks for orders. He\u2019s not used to taking them from a woman.",
        scribesNote:
          "During the Siege of Lincoln in 1217, Nicholaa de la Haye commanded the castle garrison against rebel forces. She was in her 60s. When Prince Louis of France demanded her surrender, she refused. The castle held. Medieval women who wielded military authority were rare \u2014 but they existed, and some were formidable.",
        options: [
          {
            text: "Order doubled patrols and close the gates at dusk",
            statEffects: { authority: +10, household: -5, danger: -10 },
            outcome:
              "The captain hesitates, then obeys. The gates close early. Market access is limited, but the walls are watched. Whatever lurks in the forest will find no easy entry.",
            consequenceFlags: ["defended_well"],
          },
          {
            text: "Send a scouting party to identify the threat",
            chance: 0.6,
            successStatEffects: { danger: -15, authority: +5 },
            failureStatEffects: { danger: +15 },
            successOutcome:
              "Your scouts find a bandit camp and scatter them without a fight. The captain looks at you with something new in his eyes. Respect.",
            failureOutcome:
              "The scouting party encounters Geoffrey\u2019s men. Arrows are exchanged. One of your soldiers is wounded. The threat is real and closer than you thought.",
            consequenceFlags: { success: ["defended_well"], failure: ["danger_escalated"] },
          },
          {
            text: "Ignore it \u2014 focus on the harvest",
            statEffects: { household: +5, danger: +10 },
            outcome:
              "The harvest goes well. But at night, you hear hoofbeats in the distance. The threat festers. Ignoring danger doesn\u2019t make it leave.",
            consequenceFlags: ["ignored_threat"],
          },
        ],
      },
      // Decision 4: The Harvest Decision
      {
        title: "Saturday: The Harvest",
        description:
          "The harvest is ready but rain is forecast. You can rush the harvest with every available hand \u2014 including pulling soldiers from patrol \u2014 or wait and risk losing the crop to weather.",
        options: [
          {
            text: "Rush the harvest \u2014 pull everyone including soldiers",
            statEffects: { household: +15, danger: +15 },
            outcome:
              "Every hand works from dawn to dark. The grain is saved. But for two days, the walls stand unguarded. You sleep with a dagger under your pillow.",
            consequenceFlags: ["risked_defense"],
          },
          {
            text: "Harvest with available workers only \u2014 keep guards posted",
            statEffects: { household: +5 },
            outcome:
              "Slower, but safer. Some grain is lost to the rain. The garrison stays sharp. A lady must balance the ledger and the sword.",
            consequenceFlags: ["defended_well"],
          },
          {
            text: "Split the difference \u2014 half the garrison helps in shifts",
            statEffects: { household: +10, danger: +5 },
            outcome:
              "A compromise. Most of the harvest is saved. The walls are thinner but not bare. Margaret, they will say, is a practical woman.",
            consequenceFlags: [],
          },
        ],
      },
    ],
    consequences: {
      base: { military: +2, people: +2 },
      flags: {
        strict_rule: { treasury: +3 },
        fair_rule: { people: +3, treasury: +2 },
        merciful_rule: { people: +5, treasury: -2 },
        stood_firm: { military: +3, people: +2 },
        conceded: { treasury: -3 },
        defended_well: { military: +3 },
        danger_escalated: { military: -3 },
        ignored_threat: { military: -5 },
        risked_defense: { military: -3, treasury: +2 },
      },
    },
    returnText:
      "Your lord husband returns to find the estate in order. He glances at the ledger, nods, and moves on to other matters. The estate records don\u2019t note who made the decisions that kept it running. But the servants know. The village knows. And Margaret knows.",
    scribesNote:
      "Noblewomen were the invisible managers of medieval England. They ran estates, commanded garrisons, negotiated with neighbors, and kept the economy moving \u2014 all while legally defined as extensions of their husbands. History records the lords who went to war. It rarely records the wives who kept everything from falling apart while they were gone.",
  },

  // =========================================================================
  // FLIP D: A Knight's Gamble — Sir William
  // =========================================================================
  knight_gamble: {
    id: "knight_gamble",
    character: "Sir William",
    title: "A Knight\u2019s Gamble",
    colorScheme: {
      accent: "#8b1a1a",
      light: "#c0392b",
      background: "#f5eeee",
      text: "#2c1810",
    },
    triggerConditions: { minTurn: 12 },
    intro: {
      title: "A Knight\u2019s Gamble",
      bridgeText:
        "As you review your garrison roster, you think of Sir William \u2014 your most loyal knight. You\u2019ve never wondered what his service costs him\u2026",
      narrativeText:
        "You are Sir William, a knight holding two hides of land from the lord. The king has called his vassals to war. You must serve 40 days at your OWN expense \u2014 armor, weapons, warhorses, and food. Your harvest needs you at home. But a knight who refuses the summons loses everything.",
    },
    characterStats: {
      honor: { label: "Honor", icon: "\u2694", initial: 50, color: "#8b1a1a" },
      coin: { label: "Coin", icon: "\u269C", initial: 40, color: "#8b6914" },
      health: { label: "Health", icon: "\u2665", initial: 80, color: "#2d5a27" },
    },
    decisions: [
      // Decision 1: Equipping for War
      {
        title: "Departure: Equipping for War",
        description:
          "Your armor needs repair and your warhorse is getting old. A new destrier costs 80 marks \u2014 more than most families earn in a lifetime. Repaired equipment and a patched-up old horse will do\u2026 probably.",
        scribesNote:
          "A knight\u2019s full equipment \u2014 armor, weapons, warhorses, and supplies \u2014 could cost the equivalent of a modern luxury car. A single warhorse (called a destrier) cost 80 pounds when a skilled carpenter earned about 6 shillings per year. That\u2019s like someone earning $40,000 buying a $500,000 horse. Many knights were surprisingly cash-poor despite owning land.",
        options: [
          {
            text: "Buy the best equipment you can afford",
            statEffects: { coin: -30, honor: +10, health: +10 },
            outcome:
              "Gleaming armor. A strong new destrier. You look the part. Your purse is lighter than air, but on the field, appearance is survival.",
            consequenceFlags: ["well_equipped"],
          },
          {
            text: "Patch what you have \u2014 save the money",
            statEffects: { coin: -5, honor: -5, health: -5 },
            outcome:
              "The other knights notice your dented helm and tired horse. They say nothing. They don\u2019t need to. But you still have coin for the campaign ahead.",
            consequenceFlags: [],
          },
          {
            text: "Borrow money from a merchant at interest",
            statEffects: { honor: +5, health: +10 },
            outcome:
              "Good equipment, no upfront cost. But the merchant\u2019s smile promises a reckoning. You\u2019ll owe 40 marks when you return \u2014 if you return.",
            consequenceFlags: ["in_debt"],
          },
        ],
      },
      // Decision 2: The Tournament
      {
        title: "The March: The Tournament",
        description:
          "On the march, a tournament is announced. Victory means capturing your opponents\u2019 horses and armor \u2014 worth a fortune. Defeat means ransom or worse. The crowd roars. Your heart pounds.",
        scribesNote:
          "Tournaments were violent, deadly, and hugely profitable. William Marshal \u2014 considered the greatest knight of the 12th century \u2014 made his fortune capturing 500+ knights in tournaments over his career. He ransomed their horses and armor for enormous sums. The Church repeatedly banned tournaments as sinful. Knights kept showing up.",
        options: [
          {
            text: "Enter the tournament",
            chance: 0.5,
            successStatEffects: { coin: +25, health: -10, honor: +10 },
            failureStatEffects: { coin: -20, health: -20, honor: -5 },
            successOutcome:
              "You unhorse two opponents and capture a fine destrier. The crowd chants your name. Your purse is heavy. Your ribs are bruised. This is glory.",
            failureOutcome:
              "A lance catches you in the shoulder. You fall. Your opponent claims your horse. The ransom to recover your armor costs everything you had.",
            consequenceFlags: { success: ["tournament_victory"], failure: ["tournament_defeat"] },
          },
          {
            text: "Watch from the sidelines",
            statEffects: { honor: -5 },
            outcome:
              "Other knights exchange knowing glances. A knight who won\u2019t joust. Safe \u2014 but the whispers follow you like a shadow.",
            consequenceFlags: [],
          },
          {
            text: "Bet on other fighters instead",
            chance: 0.6,
            successStatEffects: { coin: +10 },
            failureStatEffects: { coin: -10 },
            successOutcome:
              "Your man wins. You collect your winnings quietly. Not glorious, but profitable.",
            failureOutcome:
              "Your man falls in the second pass. There go 10 coins. Gambling \u2014 the other knightly tradition.",
            consequenceFlags: { success: [], failure: [] },
          },
        ],
      },
      // Decision 3: The 40-Day Limit
      {
        title: "Day 39: The 40-Day Limit",
        description:
          "You\u2019ve served 39 days. Tomorrow is your last required day. But the king\u2019s campaign isn\u2019t over \u2014 he asks knights to stay voluntarily. Your crops are dying at home. The king\u2019s eyes sweep the assembled knights.",
        scribesNote:
          "The feudal military obligation was exactly 40 days. After that, knights could legally go home \u2014 even mid-battle. Kings hated this. They increasingly demanded \u2018scutage\u2019 (shield-tax) \u2014 money instead of service \u2014 so they could hire professional soldiers who\u2019d fight as long as they were paid. This shift from feudal levies to paid armies fundamentally changed medieval warfare.",
        options: [
          {
            text: "Stay and serve \u2014 loyalty to the king matters",
            statEffects: { honor: +15, coin: -10 },
            outcome:
              "The king nods. He will remember your name. But every extra day is food you didn\u2019t buy, crops you didn\u2019t harvest, and a family that waits.",
            consequenceFlags: ["stayed_loyal"],
          },
          {
            text: "Leave on day 40 \u2014 your obligation is fulfilled",
            statEffects: { honor: -5 },
            outcome:
              "Technically correct. Legally unchallengeable. The other knights who stay look at you with something between envy and contempt. You ride home with a clear conscience and a heavy heart.",
            consequenceFlags: [],
          },
          {
            text: "Pay scutage and leave \u2014 offer money instead of service",
            statEffects: { honor: -10, coin: -15 },
            outcome:
              "The king\u2019s clerk accepts your payment without expression. You\u2019re free to go. Your purse is empty. But you\u2019ll be home in three days.",
            consequenceFlags: ["paid_scutage"],
          },
        ],
      },
      // Decision 4: The Homecoming
      {
        title: "Home: The Reckoning",
        description:
          "You return home. Your fields are in poor shape \u2014 your wife managed as best she could, but harvest season waited for no one. A neighbor offers to buy your second hide of land. The money would solve your debts\u2026 but land is everything.",
        scribesNote:
          "A knight\u2019s identity was inseparable from his land. \u2018Knight\u2019s fee\u2019 \u2014 the land held in exchange for military service \u2014 defined social status. Selling land meant losing rank and the ability to serve. Many knights fell into debt after campaigns, trapped between the cost of war and the need to keep their estates intact. The feudal system demanded loyalty, but it didn\u2019t pay the bills.",
        options: [
          {
            text: "Sell the land \u2014 pay your debts and start fresh",
            statEffects: { coin: +30, honor: -10 },
            outcome:
              "The neighbor\u2019s coin is warm in your hand. Your debts are paid. But a knight without land is barely a knight. Your children will inherit less.",
            consequenceFlags: ["sold_land"],
          },
          {
            text: "Keep the land \u2014 find another way",
            statEffects: { honor: +5 },
            outcome:
              "The debt remains. The collectors will come. But the land is yours, and your children\u2019s after you. Some things are worth more than coin.",
            consequenceFlags: [],
          },
          {
            text: "Mortgage the land to a merchant \u2014 keep ownership but pay rent on your OWN land",
            statEffects: { coin: +15, honor: -5 },
            outcome:
              "You keep the land on paper. But each season, you pay rent to a man who\u2019s never held a sword. The world is changing. Knights feel it first.",
            consequenceFlags: ["in_debt"],
          },
        ],
      },
    ],
    consequences: {
      base: { military: +2 },
      flags: {
        well_equipped: { military: +3, treasury: -3 },
        in_debt: { treasury: -3 },
        tournament_victory: { military: +5, treasury: +3 },
        tournament_defeat: { military: -3 },
        stayed_loyal: { faith: +3, military: +3 },
        paid_scutage: { treasury: -3 },
        sold_land: { military: -5, treasury: +3 },
      },
    },
    returnText:
      "Sir William returns to your service. The cost of chivalry is measured in more than honor \u2014 it\u2019s measured in coin, in crops left unharvested, in families left waiting. The songs never mention the bills.",
    scribesNote:
      "Knights were the backbone of medieval armies, but the feudal military system was deeply flawed. Knights served at their own expense for exactly 40 days, then could legally leave. Equipment cost a fortune. Tournaments were both sport and economic necessity. As kings needed longer campaigns, they shifted to paid armies \u2014 ending the age of the feudal knight. The chivalric ideal was beautiful. The economic reality was brutal.",
  },
};

export default PERSPECTIVE_FLIPS;
