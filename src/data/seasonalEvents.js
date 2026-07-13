/**
 * Seasonal Events for The Lord's Ledger
 *
 * Events are organized by season. Each season array contains event objects
 * that are drawn from during the matching season turn.
 *
 * tutorialSafe: true — event only affects Treasury and People.
 *   Used in turns 1–2 before Military and Faith meters are introduced.
 *
 * Effect ranges are intentionally small (−15 to +15) so the game
 * stays survivable across 40 turns while still feeling consequential.
 *
 * scribesNote — 2–3 sentences of real medieval history at 6th grade level.
 */

const seasonalEvents = {

  // ─────────────────────────────────────────────────────────────
  // SPRING
  // ─────────────────────────────────────────────────────────────
  spring: [

    {
      id: "spring_1",
      title: "The Planting Decision",
      season: "spring",
      tutorialSafe: true,
      description:
        "The snow has melted and the fields are soft and ready. Your steward, " +
        "a stocky man named Edmund, stands before you with a dirt-stained map. " +
        "\"My lord, it is time to decide how we plant. We could fill every field " +
        "with wheat, or we could try the old three-field system the monks use — " +
        "resting one field and planting beans in another.\"",
      options: [
        {
          text: "Plant wheat in every field — we need the grain.",
          effects: { treasury: -3, people: 8 },
          chronicle:
            "You ordered every field planted with wheat from edge to edge. " +
            "The harvest was good and your people ate well, but the soil " +
            "looked pale and tired by summer's end.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Use the three-field system — wheat, beans, and fallow.",
          effects: { treasury: 2, people: 5 },
          chronicle:
            "You divided the land wisely — wheat in one field, beans in " +
            "another, and one field left to rest. The beans made a hearty " +
            "stew that your people enjoyed all summer.",
          indicators: { treasury: "up", people: "up" },
        },
      ],
      scribesNote:
        "Medieval farmers discovered that planting beans and peas actually " +
        "helped the soil grow better wheat the following year. Scientists " +
        "wouldn't understand why until the 1800s — the bean plants were " +
        "quietly adding nitrogen back into the ground!",
    },

    {
      id: "spring_2",
      title: "The Traveling Seed Merchant",
      season: "spring",
      tutorialSafe: true,
      description:
        "A merchant has arrived at your gate with mules loaded with seed grain " +
        "from the south. He claims his seeds grow faster and produce bigger " +
        "loaves than your local variety. \"For ten silver coins, my lord, your " +
        "harvest will be the envy of every estate in the county.\" Your steward " +
        "shrugs — he has never heard of this man before.",
      options: [
        {
          text: "Buy the southern seeds and try them in a test field.",
          effects: { treasury: -7, people: 6 },
          chronicle:
            "You paid ten silver coins for the merchant's seeds and gave " +
            "him lodging for the night. Whether his promise holds true, " +
            "you will not know until harvest time.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Send the merchant away and keep your usual seeds.",
          effects: { treasury: 2, people: -2 },
          chronicle:
            "You thanked the merchant but sent him on his way. Your farmers " +
            "grumbled — they had hoped for something new — but they planted " +
            "the familiar grain they knew how to tend.",
          indicators: { treasury: "up", people: "down" },
        },
        {
          text: "Haggle the price down to five silver coins.",
          effects: { treasury: -5, people: 3 },
          chronicle:
            "You drove a hard bargain and the merchant accepted five coins " +
            "with a strained smile. You got half his seeds, and your farmers " +
            "seemed pleased to see their lord haggle skillfully.",
          indicators: { treasury: "down", people: "up" },
        },
      ],
      scribesNote: null,
    },

    {
      id: "spring_3",
      title: "The Soldier Levy",
      season: "spring",
      description:
        "Your captain of the guard, a scarred veteran named Sir Hugo, reports " +
        "that several of your men-at-arms have left for better pay in a nearby " +
        "lord's service. \"We are thin on soldiers, my lord. Spring is a good " +
        "time to recruit — young men are restless after winter and looking for " +
        "work. But it costs coin to arm and train them.\"",
      options: [
        {
          text: "Recruit and arm ten new soldiers right away.",
          effects: { treasury: -8, military: 12 },
          chronicle:
            "You paid for armor, swords, and a month of training. Ten " +
            "young men from the village stood proudly at the gate by " +
            "month's end. Sir Hugo looked almost satisfied.",
          indicators: { treasury: "down", military: "up" },
        },
        {
          text: "Recruit five soldiers — affordable and still useful.",
          effects: { treasury: -6, military: 5 },
          chronicle:
            "You hired five men and stretched your coin carefully. Sir Hugo " +
            "said it was better than nothing, though he muttered something " +
            "under his breath about border wolves.",
          indicators: { treasury: "down", military: "up" },
        },
        {
          text: "Skip recruiting — hold onto the treasury for now.",
          effects: { treasury: 4, military: -5 },
          chronicle:
            "You told Sir Hugo to make do with what he had. He bowed " +
            "stiffly. The castle gate felt just a little less safe " +
            "as the weeks went on.",
          indicators: { treasury: "up", military: "down" },
        },
      ],
      scribesNote:
        "In real medieval estates, soldiers did not serve for free. " +
        "A knight's full armor — called a 'harness' — could cost as much " +
        "as £80, which was more than a skilled carpenter earned in ten years. " +
        "That is why only wealthy lords could afford large armies.",
    },

    {
      id: "spring_4",
      title: "The Trade Road Opens",
      season: "spring",
      tutorialSafe: true,
      description:
        "Winter mud has dried and the road to the market town is passable " +
        "again. Your reeve — the man who manages your estate accounts — " +
        "suggests two options: send your wool to market now while prices " +
        "are high, or use the good road to bring in a stone mason to " +
        "repair the crumbling north wall of the granary.",
      options: [
        {
          text: "Send the wool to market and collect the coin.",
          effects: { treasury: 12, people: -3 },
          chronicle:
            "Three carts of wool rumbled down the road before dawn. " +
            "Your reeve returned four days later with a satisfying purse " +
            "of silver, though the workers who loaded the carts looked " +
            "a little resentful.",
          indicators: { treasury: "up", people: "down" },
        },
        {
          text: "Hire the mason to repair the granary wall.",
          effects: { treasury: -8, people: 7 },
          chronicle:
            "The mason arrived with a young apprentice and spent two " +
            "weeks patching and re-laying stone. Your villagers seemed " +
            "relieved to see the granary — where all their winter food " +
            "is stored — looking solid again.",
          indicators: { treasury: "down", people: "up" },
        },
      ],
      scribesNote: null,
    },

    {
      id: "spring_5",
      title: "The Monastery's Offer",
      season: "spring",
      description:
        "Brother Aldric from the monastery three miles away arrives with " +
        "an offer. His monks have extra seed grain and offer to share it — " +
        "but only if you donate laborers to help expand their vegetable " +
        "garden for a week. Your farmers need every hand for spring planting.",
      options: [
        {
          text: "Accept the monks' offer and send ten workers for a week.",
          effects: { treasury: 5, people: -5, faith: 8 },
          chronicle:
            "Your workers helped the monks dig and plant while Brother " +
            "Aldric said prayers for your family. The seed grain arrived " +
            "in good time, and the village priest spoke warmly of you " +
            "at Sunday mass.",
          indicators: { treasury: "up", people: "down", faith: "up" },
        },
        {
          text: "Decline politely — your own fields come first.",
          effects: { people: 3, faith: -5 },
          chronicle:
            "You sent Brother Aldric away with a small gift of bread. " +
            "Your farmers were glad to keep every hand on the estate, " +
            "but the monk left looking disappointed, and the village " +
            "priest seemed cooler toward you the following Sunday.",
          indicators: { people: "up", faith: "down" },
        },
      ],
      scribesNote:
        "Monasteries in medieval England were much more than just churches. " +
        "Cistercian monks — a group famous for hard work — were some of the " +
        "best farmers and engineers of their time. Fountains Abbey in Yorkshire " +
        "ran a flock of 18,000 sheep and was considered a center of farming " +
        "knowledge that lords from miles away would visit for advice.",
    },

    {
      id: "spring_6",
      title: "The Bridge Repair",
      season: "spring",
      tutorialSafe: true,
      description:
        "Winter floods have damaged the wooden bridge that connects your " +
        "village to the main road. Merchants cannot cross, and your own " +
        "carts are taking a long muddy detour. Your carpenter says a " +
        "proper stone bridge would cost more but last a generation. " +
        "A patched wooden one could be ready in a week.",
      options: [
        {
          text: "Build a proper stone bridge — it will last for decades.",
          effects: { treasury: -8, people: 5 },
          chronicle:
            "You hired a mason and a dozen laborers. The stone bridge " +
            "took six weeks and cost a painful amount of coin, but it " +
            "stood solid and your villagers crossed it with evident pride.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Patch the wooden bridge quickly and cheaply.",
          effects: { treasury: -4, people: 2 },
          chronicle:
            "Your carpenter nailed and braced the old bridge back together " +
            "in five days. Merchants grumbled about the planks shifting " +
            "underfoot, but at least carts could cross again.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Charge a crossing toll to pay for the repairs over time.",
          effects: { treasury: 6, people: -8 },
          chronicle:
            "You posted a guard at the damaged bridge and charged a penny " +
            "per cart to cross. The merchants paid, but they complained " +
            "loudly, and your own villagers shot resentful looks at the " +
            "man collecting coins.",
          indicators: { treasury: "up", people: "down" },
        },
      ],
      scribesNote:
        "By the year 1086, England already had about 6,500 water mills — " +
        "roughly one for every village. Medieval engineers were excellent " +
        "builders when they had the funds. Stone bridges built in the " +
        "Middle Ages are still standing in many parts of Europe today.",
    },

    {
      id: "spring_7",
      title: "The Runaway Serf",
      season: "spring",
      description:
        "A young farmer named Wat has slipped away from your estate and " +
        "fled to the market town, where he has been living for three months. " +
        "Under the law, if a serf lives freely in a town for a year and a " +
        "day without being caught, he earns his freedom. Your steward wants " +
        "him brought back. But Wat is a hard worker who could thrive if free.",
      options: [
        {
          text: "Send men to bring Wat back to the estate.",
          effects: { treasury: -4, people: -8, military: 3 },
          chronicle:
            "Your guards returned with a sullen Wat three days later. " +
            "He worked, but the look in his eyes was different — and " +
            "the other villagers had heard the story. A cold mood " +
            "settled over the estate.",
          indicators: { treasury: "down", people: "down", military: "up" },
        },
        {
          text: "Let Wat go — and tell the other serfs you are a fair lord.",
          effects: { people: 10, faith: 3, military: -3 },
          chronicle:
            "You declared Wat free and sent word to the village. A cheer " +
            "went up that you heard from the castle window. Your authority " +
            "over the other serfs technically weakened, but they spoke " +
            "of you with something that felt like genuine loyalty.",
          indicators: { people: "up", faith: "up", military: "down" },
        },
      ],
      scribesNote:
        "The rule that a serf became free after living in a town for 'a year " +
        "and a day' was real English law in the Middle Ages. Towns actually " +
        "encouraged serfs to escape because they needed workers. This caused " +
        "constant arguments between lords who wanted their laborers back " +
        "and town officials who wanted to keep them.",
    },

  ],

  // ─────────────────────────────────────────────────────────────
  // SUMMER
  // ─────────────────────────────────────────────────────────────
  summer: [

    {
      id: "summer_1",
      title: "The Hay Harvest Rush",
      season: "summer",
      tutorialSafe: true,
      description:
        "It is haymaking time, and the weather could turn at any moment. " +
        "Your reeve tells you there is a choice: you can use all your " +
        "available workers to cut and dry the hay as fast as possible, " +
        "or you can spare a few men to start repairing the mill that " +
        "grinds your grain. You cannot do both fully with the workers " +
        "you have.",
      options: [
        {
          text: "Focus every worker on the hay — get it all in before rain.",
          effects: { treasury: 8, people: 4 },
          chronicle:
            "You called every able-bodied person to the meadows. It was " +
            "exhausting work in the summer heat, but the hay barn was " +
            "packed full before the rains came, and your animals would " +
            "eat well all winter.",
          indicators: { treasury: "up", people: "up" },
        },
        {
          text: "Split the workers — half on hay, half fixing the mill.",
          effects: { treasury: 3, people: -3 },
          chronicle:
            "Some hay was lost to a brief rain shower, and the mill " +
            "repairs only got half done. Your workers were stretched " +
            "thin and visibly tired, but the mill at least stopped " +
            "grinding so loudly.",
          indicators: { treasury: "up", people: "down" },
        },
      ],
      scribesNote:
        "Hay was incredibly important in medieval farming because it was " +
        "the only winter food for animals. Without hay, horses and oxen " +
        "starved, which meant no plowing in spring. One bad haymaking " +
        "season could start a chain reaction that lasted for years.",
    },

    {
      id: "summer_2",
      title: "The Summer Tournament",
      season: "summer",
      description:
        "A neighboring lord, Sir Edmund of Ravenstone, has invited all " +
        "the lords of the county to a summer tournament. Knights will " +
        "joust and compete for prizes. Hosting your own knights costs " +
        "coin, but winning brings honor — and beaten knights must pay " +
        "a ransom for their horses and armor.",
      options: [
        {
          text: "Send your knights to compete — glory and ransom await.",
          effects: { treasury: -8, military: 10, faith: 2 },
          chronicle:
            "Your knights rode out in polished armor and returned with " +
            "two captured horses and a purse of ransom money. Sir Hugo " +
            "looked ten years younger. The whole estate talked about " +
            "the tournament for weeks.",
          indicators: { treasury: "down", military: "up", faith: "up" },
        },
        {
          text: "Skip the tournament — your men are needed at home.",
          effects: { treasury: 5, military: -5 },
          chronicle:
            "You kept your knights at their drills and your coin in the " +
            "chest. But word spread that your men had not attended, and " +
            "a few young soldiers grumbled about missing the excitement.",
          indicators: { treasury: "up", military: "down" },
        },
        {
          text: "Go yourself and watch — show your face without the cost.",
          effects: { treasury: -3, military: 2, faith: 4 },
          chronicle:
            "You rode to the tournament as a guest and cheered loudly. " +
            "You shook hands with three other lords and the bishop, who " +
            "seemed pleased to see you there. No ransoms, but useful friendships.",
          indicators: { treasury: "down", military: "up", faith: "up" },
        },
      ],
      scribesNote:
        "Medieval tournaments were actually very dangerous and expensive. " +
        "A warhorse called a destrier could cost £80 — that is like a " +
        "skilled worker's wages for ten years — and it could be lost in " +
        "a single joust. But for knights who won, capturing an opponent's " +
        "horse and armor was like winning a small fortune.",
    },

    {
      id: "summer_3",
      title: "The Market Fair Charter",
      season: "summer",
      tutorialSafe: true,
      description:
        "A royal messenger arrives with a proposal: the king is granting " +
        "market charters — official permission to hold a weekly market — " +
        "to lords willing to pay a fee. Your village has no market. " +
        "A market would bring traders and coin, but the fee is steep " +
        "and it takes time to build the stalls.",
      options: [
        {
          text: "Pay the fee and get the charter — build a market square.",
          effects: { treasury: -8, people: 8 },
          chronicle:
            "You signed the royal parchment and paid fifteen silver coins. " +
            "Within a month, a dozen merchants set up stalls in the new " +
            "square. Your villagers could buy salt, cloth, and tools without " +
            "traveling to the next town.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Ask for a smaller traveling fair permit — cheaper option.",
          effects: { treasury: -5, people: 4 },
          chronicle:
            "You secured the right to hold one fair each summer. Merchants " +
            "came for three days, sold their goods, and moved on. It was " +
            "not a permanent market, but your people appreciated even that.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Send the messenger away — you cannot afford it this year.",
          effects: { people: -4 },
          chronicle:
            "You told the messenger you would consider it next year. " +
            "He rode away with a blank expression. Your villagers, " +
            "who had heard about the market, were quietly disappointed.",
          indicators: { people: "down" },
        },
      ],
      scribesNote:
        "Between 1200 and 1270, English kings granted more than 2,200 market " +
        "and fair charters. Getting a market charter was a big deal — it meant " +
        "merchants had to come to your village, which brought money and goods " +
        "to people who might otherwise never see them. Some tiny English towns " +
        "became wealthy entirely because of their markets.",
    },

    {
      id: "summer_4",
      title: "The Militia Drill",
      season: "summer",
      description:
        "Your captain Sir Hugo wants to hold a week of military drills for " +
        "the village's able-bodied men — a local militia that could defend " +
        "the estate if professional soldiers were away. This would take " +
        "farmers away from their summer work and cost coin for equipment " +
        "and practice weapons.",
      options: [
        {
          text: "Order the full week of militia drills.",
          effects: { treasury: -7, people: -5, military: 10 },
          chronicle:
            "For a week, the fields were quiet and the practice ground " +
            "was loud. Some farmers complained about lost work, but by " +
            "the end they stood straighter and held their pikes properly. " +
            "Sir Hugo called it the best week he had seen in years.",
          indicators: { treasury: "down", people: "down", military: "up" },
        },
        {
          text: "Drill only on Sundays — preserve the work week.",
          effects: { treasury: -2, people: 2, military: 4 },
          chronicle:
            "You compromised: Sunday drills after church. The farmers " +
            "did not love it, but they grumbled less than expected. " +
            "Sir Hugo said the training was better than nothing — " +
            "barely.",
          indicators: { treasury: "down", people: "up", military: "up" },
        },
        {
          text: "Skip the drills — the harvest matters more right now.",
          effects: { treasury: 4, people: 3, military: -6 },
          chronicle:
            "You told Sir Hugo the harvest came first. He nodded slowly " +
            "and walked away. The fields were productive that week, but " +
            "your militia would not be ready if trouble came.",
          indicators: { treasury: "up", people: "up", military: "down" },
        },
      ],
      scribesNote: null,
    },

    {
      id: "summer_5",
      title: "The Road Peddler's Remedy",
      season: "summer",
      description:
        "A peddler traveling through your estate claims he has medicine " +
        "that can cure summer fever, which has been making several " +
        "families sick. He wants five silver coins for a small bottle. " +
        "Your village healer, an old woman named Maud, says she can " +
        "treat the sick with herbs — slowly and with no guarantee.",
      options: [
        {
          text: "Buy the peddler's remedy and distribute it to the sick.",
          effects: { treasury: -5, people: 9 },
          chronicle:
            "Whether it was the remedy or good fortune, the sick families " +
            "recovered within two weeks. Word spread that you had spent " +
            "your own coin on medicine for your people. Maud looked " +
            "skeptical but held her tongue.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Let Maud treat the sick with her herbal knowledge.",
          effects: { people: 4, faith: 3 },
          chronicle:
            "Old Maud boiled her herbs and applied her poultices. It took " +
            "longer, but most of the sick recovered. The village trusted " +
            "her, and her prayers alongside the treatment seemed to comfort " +
            "everyone — priest included.",
          indicators: { people: "up", faith: "up" },
        },
        {
          text: "Do nothing — sickness comes and goes on its own.",
          effects: { people: -10 },
          chronicle:
            "You decided nature would take its course. Two of the sick " +
            "families did not recover. The deaths cast a shadow over " +
            "the village for weeks, and mothers kept their children away " +
            "from the castle gate.",
          indicators: { people: "down" },
        },
      ],
      scribesNote:
        "Medieval healers actually knew quite a lot about plants. Garlic, " +
        "honey, and willow bark were used as medicines — and scientists later " +
        "discovered that willow bark contains the same ingredient as aspirin. " +
        "Monasteries kept 'physic gardens' full of medicinal herbs and some " +
        "monks became so skilled that lords traveled miles to visit them.",
    },

    {
      id: "summer_6",
      title: "The Castle Well",
      season: "summer",
      tutorialSafe: true,
      description:
        "Your castle well has been running slow all summer. The well-digger " +
        "you hired says you need to either dig it deeper now — while " +
        "the dry season shows him exactly where the water is — or wait " +
        "and risk it running dry next summer. Digging deeper is expensive " +
        "and noisy, and will disrupt the courtyard for weeks.",
      options: [
        {
          text: "Dig the well deeper now while conditions are good.",
          effects: { treasury: -7, people: 6 },
          chronicle:
            "The courtyard was a muddy mess for three weeks. The well-digger " +
            "struck a strong underground spring at twenty feet deeper. " +
            "Clear, cold water flowed in abundance, and your cook said " +
            "the soup tasted better immediately.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Wait and see — it has not run dry yet.",
          effects: { treasury: 2, people: -4 },
          chronicle:
            "You decided to save the coin. The well kept producing — " +
            "barely — through a dry August. Your people rationed water " +
            "more carefully than usual, and there was grumbling about " +
            "the washing water being muddy.",
          indicators: { treasury: "up", people: "down" },
        },
      ],
      scribesNote:
        "Clean water was a genuine challenge in medieval towns and castles. " +
        "Medieval London actually built lead pipes to bring fresh spring water " +
        "into the city center — a project called 'The Conduit' that was finished " +
        "in the 1200s. People knew dirty water made them sick, even if they " +
        "did not understand germs yet.",
    },

    {
      id: "summer_7",
      title: "The Building Project",
      season: "summer",
      description:
        "Your estate needs a new barn for storing grain and tools. Your " +
        "carpenter says he can build a solid timber barn with good " +
        "roof thatch. A traveling stonemason says he can build a far " +
        "better stone barn, but at triple the cost and twice the time. " +
        "The old barn is still standing — patched and creaky, but standing.",
      options: [
        {
          text: "Commission the stone barn — it will last a generation.",
          effects: { treasury: -8, people: 7 },
          chronicle:
            "The masons worked all summer and into autumn. The stone barn " +
            "stood like a small fortress at the edge of the field. Your " +
            "steward called it the finest building on the estate — " +
            "which irritated the cook, who had asked for a new kitchen first.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Build the timber barn — cheaper, faster, good enough.",
          effects: { treasury: -6, people: 4 },
          chronicle:
            "Your carpenter had the barn framed and thatched in six weeks. " +
            "It smelled of fresh-cut oak and dry straw. It was not beautiful, " +
            "but it was solid and dry, and your grain would be safe in it.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Patch the old barn again — hold off spending for now.",
          effects: { treasury: 3, people: -3 },
          chronicle:
            "You paid the carpenter to nail boards over the worst gaps " +
            "and replace a section of rotten roof. The barn stood another " +
            "year. Your reeve warned you quietly that it would not last " +
            "another winter after this one.",
          indicators: { treasury: "up", people: "down" },
        },
      ],
      scribesNote: null,
    },

  ],

  // ─────────────────────────────────────────────────────────────
  // AUTUMN
  // ─────────────────────────────────────────────────────────────
  autumn: [

    {
      id: "autumn_1",
      title: "The Grain Harvest",
      season: "autumn",
      tutorialSafe: true,
      description:
        "The wheat is golden and ready, but the weather report from your " +
        "shepherd is worrying — he says his old shoulder aches, which means " +
        "rain within a week. Your reeve says you must choose how to bring " +
        "in the harvest: rush every worker to the fields now and get it " +
        "done in a few frantic days, or pace the work to be safer but slower.",
      options: [
        {
          text: "All hands to the fields — work day and night to finish fast.",
          effects: { treasury: 12, people: -6 },
          chronicle:
            "You rang the estate bell and called every able person to the " +
            "harvest. Workers cut wheat by torchlight, children gathered " +
            "sheaves, and your cook fed them cold soup in the fields. " +
            "The last cartload rolled in just as the first rain fell.",
          indicators: { treasury: "up", people: "down" },
        },
        {
          text: "Pace the work steadily — rest your people properly.",
          effects: { treasury: 7, people: 4 },
          chronicle:
            "You harvested steadily over eight days. A short rain shower " +
            "damaged a small portion of the grain, but your workers were " +
            "not exhausted, and the mood at the harvest supper was " +
            "genuinely cheerful.",
          indicators: { treasury: "up", people: "up" },
        },
      ],
      scribesNote:
        "The grain harvest was the most important moment of the medieval year. " +
        "If it went wrong, the whole estate could starve before the next spring. " +
        "During the Great Famine of 1315, heavy rains ruined harvests across " +
        "all of Europe for three years in a row. Even King Edward II of England " +
        "could not find bread to eat at one point during those terrible years.",
    },

    {
      id: "autumn_2",
      title: "The Tax Collection",
      season: "autumn",
      tutorialSafe: true,
      description:
        "Autumn is when rents and taxes are collected from your tenants. " +
        "Your reeve has drawn up two proposals: collect the full amount " +
        "that is owed, which several families will struggle to pay " +
        "after a difficult year; or reduce the tax slightly, which will " +
        "cost you coin but may keep your people from going hungry this winter.",
      options: [
        {
          text: "Collect the full tax — your estate needs the revenue.",
          effects: { treasury: 12, people: -10 },
          chronicle:
            "Your tax collectors went door to door and took what was owed. " +
            "Two families had to sell a goat to pay. The coin chest was " +
            "satisfyingly heavy, but the village felt colder than usual " +
            "as October arrived.",
          indicators: { treasury: "up", people: "down" },
        },
        {
          text: "Reduce this year's tax by a third — your people come first.",
          effects: { treasury: 5, people: 9 },
          chronicle:
            "You told your reeve to collect only what people could give. " +
            "Word spread quickly. A delegation of farmers arrived at the " +
            "castle gate to thank you in person. You still collected coin, " +
            "but less than you needed.",
          indicators: { treasury: "up", people: "up" },
        },
        {
          text: "Double the tax — your treasury is getting dangerously low.",
          effects: { treasury: 18, people: -15 },
          chronicle:
            "You sent your collectors with orders to take double. They " +
            "came back with heavy bags and nervous expressions. Three " +
            "families packed up and left for another lord's estate. " +
            "The village was quieter — and smaller — by November.",
          indicators: { treasury: "up", people: "down" },
        },
      ],
      scribesNote:
        "Medieval taxes were complicated and could be paid in grain, animals, " +
        "or money. Lords knew that if they taxed too heavily, their serfs would " +
        "simply run away to a more generous lord. After the Black Death killed " +
        "half of Europe's people in the 1300s, the surviving peasants had real " +
        "power to demand better conditions — because lords desperately needed " +
        "their labor.",
    },

    {
      id: "autumn_3",
      title: "The Wool Surplus",
      season: "autumn",
      description:
        "Your shepherd has done excellent work this year — you have more " +
        "wool than expected after shearing. A Flemish wool buyer has arrived " +
        "offering a good price to take the whole surplus now. Or you could " +
        "store the wool and sell it in spring when prices are traditionally higher.",
      options: [
        {
          text: "Sell the wool now to the Flemish buyer.",
          effects: { treasury: 10, people: 3 },
          chronicle:
            "You shook the Flemish buyer's hand and his men loaded the " +
            "wool onto wagons by nightfall. The coin arrived the next " +
            "morning in a locked box, and your reeve seemed genuinely " +
            "pleased with the price.",
          indicators: { treasury: "up", people: "up" },
        },
        {
          text: "Store the wool and sell in spring for a higher price.",
          effects: { treasury: -3, people: -2 },
          chronicle:
            "You sent the Flemish buyer away and had the wool packed " +
            "into dry sacks in the stone barn. The gamble might pay off " +
            "in spring — or prices might drop. For now, the coin " +
            "stayed locked away in someone else's purse.",
          indicators: { treasury: "down", people: "down" },
        },
        {
          text: "Sell half now and keep half for spring.",
          effects: { treasury: 5, people: 1 },
          chronicle:
            "You struck a middle path: half the wool went with the " +
            "Flemish buyer and half was stored in the barn. You made " +
            "steady coin without gambling everything on spring prices.",
          indicators: { treasury: "up", people: "up" },
        },
      ],
      scribesNote:
        "English wool was so valuable in the Middle Ages that it was nicknamed " +
        "'the jewel of the realm.' Flemish weavers — from what is now Belgium — " +
        "bought huge quantities of English wool to make cloth. The seat where " +
        "the Lord Chancellor sits in the British Parliament is still called " +
        "'the Woolsack' — a reminder of how important wool once was to England.",
    },

    {
      id: "autumn_4",
      title: "Preparing the Winter Stores",
      season: "autumn",
      tutorialSafe: true,
      description:
        "Your cook and steward are debating how to prepare for winter. " +
        "Some of the pigs can be slaughtered now while they are fat — " +
        "the meat can be salted and smoked to last all winter. But if " +
        "you keep more pigs alive through winter, they may produce more " +
        "offspring in spring. You cannot feed too many animals through " +
        "the cold months.",
      options: [
        {
          text: "Slaughter most of the pigs now and smoke the meat.",
          effects: { treasury: 6, people: 7 },
          chronicle:
            "The estate smelled of woodsmoke and salt for two weeks as " +
            "the butchering was done. Your cook packed the cellar with " +
            "salted pork, smoked sausages, and lard. The village children " +
            "watched wide-eyed as the barrels were filled.",
          indicators: { treasury: "up", people: "up" },
        },
        {
          text: "Keep most of the pigs alive — invest in spring offspring.",
          effects: { treasury: -4, people: 2 },
          chronicle:
            "You kept your pigs penned and fed through the cold. The " +
            "winter diet was leaner — more bread and pottage, less meat — " +
            "but your sow delivered eight healthy piglets come March.",
          indicators: { treasury: "down", people: "up" },
        },
      ],
      scribesNote:
        "The autumn pig slaughter — called 'Martinmas' after the feast of " +
        "Saint Martin on November 11th — was one of the most important days " +
        "of the medieval year. Almost every peasant family kept at least one " +
        "pig because pigs would eat almost anything, including kitchen scraps. " +
        "Salt was expensive but absolutely necessary for preserving meat.",
    },

    {
      id: "autumn_5",
      title: "The Disputed Land",
      season: "autumn",
      description:
        "Your reeve brings you a dispute: two families claim the same " +
        "strip of farmland on the edge of your estate. One family has " +
        "farmed it for twenty years; the other has a faded document " +
        "they say gives them the right. You must decide. The wrong " +
        "call could create enemies on your own estate.",
      options: [
        {
          text: "Rule in favor of the family with the document.",
          effects: { people: -4, faith: 5 },
          chronicle:
            "You studied the document with your clerk and ruled that " +
            "written proof should outweigh years of habit. The document " +
            "family celebrated; the other family went home angry. " +
            "The village priest nodded his approval of your lawful thinking.",
          indicators: { people: "down", faith: "up" },
        },
        {
          text: "Rule in favor of the family who has farmed it longest.",
          effects: { people: 4, faith: -3 },
          chronicle:
            "You ruled that twenty years of farming was proof enough of " +
            "ownership. The older family thanked you warmly. The family " +
            "with the document grumbled that you had ignored proper written " +
            "law, and the priest agreed with them privately.",
          indicators: { people: "up", faith: "down" },
        },
        {
          text: "Split the strip of land equally between both families.",
          effects: { people: 6, faith: 2 },
          chronicle:
            "You drew a line down the middle of the strip and declared " +
            "it divided. Both families looked a little unhappy — but " +
            "neither was furious, and the dispute was settled before " +
            "it could fester through the winter.",
          indicators: { people: "up", faith: "up" },
        },
      ],
      scribesNote:
        "Medieval courts dealt with land disputes constantly. England had a " +
        "system of 'manor courts' where the lord himself often heard and " +
        "decided local cases — there were no professional lawyers at this level. " +
        "Written documents were considered very powerful evidence because most " +
        "people could not read, so anyone who could write something down had " +
        "a real advantage.",
    },

    {
      id: "autumn_6",
      title: "The Traveling Bishop",
      season: "autumn",
      description:
        "The bishop of your diocese is making his annual tour and will " +
        "pass through your estate. Hosting him means a lavish feast and " +
        "gifts — expensive but potentially very valuable for your standing " +
        "with the Church. Or you could offer only modest hospitality and " +
        "keep your coin.",
      options: [
        {
          text: "Host a grand feast with all the ceremony due a bishop.",
          effects: { treasury: -8, people: 5, faith: 12 },
          chronicle:
            "You set the great hall with fine linen and your best silver " +
            "cups. The bishop ate well, blessed your household, and stayed " +
            "two nights. He wrote a letter of commendation that your steward " +
            "framed on the study wall.",
          indicators: { treasury: "down", people: "up", faith: "up" },
        },
        {
          text: "Offer a decent meal but nothing lavish.",
          effects: { treasury: -4, faith: 4 },
          chronicle:
            "You served good food and honest wine. The bishop was polite " +
            "and stayed one night before continuing his journey. He seemed " +
            "satisfied, though your steward whispered that a more generous " +
            "lord might have made a better impression.",
          indicators: { treasury: "down", faith: "up" },
        },
        {
          text: "Send a small gift and make your excuses — claim illness.",
          effects: { treasury: 5, faith: -8 },
          chronicle:
            "Your messenger delivered a polite note and a small purse of " +
            "coins as an offering. The bishop accepted but did not hide " +
            "his disappointment. Your standing with the Church cooled " +
            "noticeably before winter arrived.",
          indicators: { treasury: "up", faith: "down" },
        },
      ],
      scribesNote:
        "Medieval bishops were not just religious leaders — they were powerful " +
        "politicians and landowners. Some bishops controlled armies and huge " +
        "areas of land. In England, the Bishop of Durham had so much power " +
        "in northern England that his territory was sometimes called 'the " +
        "County Palatine' — almost a separate kingdom with its own courts and taxes.",
    },

    {
      id: "autumn_7",
      title: "The Road Bandits",
      season: "autumn",
      description:
        "Your merchant tenants are complaining: a band of former soldiers — " +
        "men who fought in the last war and were never paid — has been " +
        "robbing travelers on the road through your estate. Trade is " +
        "slowing down as merchants take longer routes to avoid your land. " +
        "You must deal with the problem.",
      options: [
        {
          text: "Send soldiers to capture or drive away the bandits.",
          effects: { treasury: -6, people: 4, military: 5 },
          chronicle:
            "You dispatched Sir Hugo with twelve men. After three days " +
            "of searching the woods, they ran the bandits off into the " +
            "next county. Two men were caught and brought to your court. " +
            "Merchants returned to the road within a week.",
          indicators: { treasury: "down", people: "up", military: "up" },
        },
        {
          text: "Offer the bandits honest work on the estate — hire them.",
          effects: { treasury: -8, people: 2, military: 7 },
          chronicle:
            "You sent a messenger with an offer of steady wages. Seven " +
            "men came in, thin and wary, and signed on as extra guards. " +
            "Sir Hugo watched them closely but admitted they handled " +
            "a sword better than most of his recruits.",
          indicators: { treasury: "down", people: "up", military: "up" },
        },
        {
          text: "Ignore the problem — it is not your responsibility.",
          effects: { treasury: -5, people: -6 },
          chronicle:
            "You decided the road was the king's problem. But the merchants " +
            "disagreed and started avoiding your estate entirely. Market " +
            "revenue fell sharply, and your own villagers started locking " +
            "their doors at night.",
          indicators: { treasury: "down", people: "down" },
        },
      ],
      scribesNote: null,
    },

  ],

  // ─────────────────────────────────────────────────────────────
  // WINTER
  // ─────────────────────────────────────────────────────────────
  winter: [

    {
      id: "winter_1",
      title: "The Castle Repairs",
      season: "winter",
      tutorialSafe: true,
      description:
        "Winter rains have revealed that sections of your castle's outer " +
        "wall are crumbling. Your master mason says there are two problem " +
        "spots: one near the gate that is urgent, and one on the east " +
        "tower that can wait but will get worse. You do not have the coin " +
        "to fix both properly right now.",
      options: [
        {
          text: "Repair the gate section — it is the most dangerous gap.",
          effects: { treasury: -7, military: 8 },
          chronicle:
            "Your masons worked in the cold, mixing mortar that had to " +
            "be kept from freezing. The gate section was rebuilt solid " +
            "by February. Sir Hugo slept better knowing the main entry " +
            "point was secure.",
          indicators: { treasury: "down", military: "up" },
        },
        {
          text: "Patch both sections cheaply — keep costs down.",
          effects: { treasury: -6, military: 3 },
          chronicle:
            "You ordered quick patches on both spots — fresh mortar and " +
            "wooden reinforcing. They would hold through this winter, " +
            "your mason said, but his tone made clear he was not making " +
            "any promises about next winter.",
          indicators: { treasury: "down", military: "up" },
        },
        {
          text: "Leave the repairs until spring — winter is the wrong time.",
          effects: { treasury: 3, military: -6 },
          chronicle:
            "You decided the stone could wait until the weather warmed. " +
            "The decision saved coin, but in January a chunk of the gate " +
            "wall crumbled into the moat. Sir Hugo's expression said " +
            "everything he was too loyal to put into words.",
          indicators: { treasury: "up", military: "down" },
        },
      ],
      scribesNote:
        "Many early medieval castles were not made of stone at all. They were " +
        "built from wood on top of a man-made mound of earth — this was called " +
        "a 'motte-and-bailey' castle. Stone castles were very expensive and " +
        "could take decades to build. Most ordinary lords had wooden fortifications " +
        "that needed constant repair, especially in wet winters.",
    },

    {
      id: "winter_2",
      title: "The Winter Feast",
      season: "winter",
      tutorialSafe: true,
      description:
        "The Christmas season is here, and your steward says tradition " +
        "expects you to host a feast for your workers and villagers. " +
        "A good feast costs real coin — meat, spiced wine, candles, " +
        "and musicians — but it lifts spirits through the darkest " +
        "months and reminds people why they serve a lord rather than " +
        "just farming alone.",
      options: [
        {
          text: "Host a proper feast — spare no expense at Christmas.",
          effects: { treasury: -7, people: 12 },
          chronicle:
            "The great hall blazed with candles and smelled of roasting " +
            "pork and mulled wine. A traveling musician played until midnight. " +
            "Your people ate until they could not move and went home singing. " +
            "They would remember this Christmas for years.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Host a modest feast — enough food, but keep it simple.",
          effects: { treasury: -4, people: 6 },
          chronicle:
            "You provided a warm hall, hot pottage, bread, and a barrel " +
            "of ale. It was simple but generous, and your people seemed " +
            "genuinely glad to gather together out of the cold.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Skip the feast this year — the treasury cannot spare it.",
          effects: { treasury: 4, people: -9 },
          chronicle:
            "You sent word that there would be no feast this Christmas. " +
            "The village went quiet. You heard later that several families " +
            "had combined their own meager stores to have a small celebration " +
            "in a barn, pointedly without you.",
          indicators: { treasury: "up", people: "down" },
        },
      ],
      scribesNote:
        "Medieval peasants actually had more time off than many people today! " +
        "They worked roughly eight hours a day, but with Sundays off, church " +
        "holidays, and festivals like Christmas, May Day, and harvest celebrations, " +
        "they had about one-third of the year free from work. The Christmas " +
        "season could last for twelve days of feasting and celebration.",
    },

    {
      id: "winter_3",
      title: "The Border Negotiation",
      season: "winter",
      description:
        "Your eastern neighbor, Lady Cecily of Ashmore, has sent a " +
        "messenger: she wants to settle a long-standing dispute about " +
        "which lord controls a stretch of woodland between your estates. " +
        "Both sides hunt there. She proposes a meeting to negotiate " +
        "in February, when travel is slow and neither side wants a fight.",
      options: [
        {
          text: "Meet with Lady Cecily and negotiate a fair agreement.",
          effects: { treasury: -3, people: 3, military: 5, faith: 3 },
          chronicle:
            "You rode to the boundary with your steward and two guards. " +
            "Lady Cecily was sharp and well-prepared. After three hours " +
            "in a cold field, you agreed to split the wood and share " +
            "the hunting rights. Both sides rode home satisfied.",
          indicators: { treasury: "down", people: "up", military: "up", faith: "up" },
        },
        {
          text: "Reject the meeting — the wood is yours and you will keep it.",
          effects: { military: -5, people: -4 },
          chronicle:
            "You sent the messenger back with a firm refusal. Your steward " +
            "looked worried. Lady Cecily's next letter was noticeably colder, " +
            "and your scouts reported that she had moved extra soldiers " +
            "to her eastern border.",
          indicators: { military: "down", people: "down" },
        },
        {
          text: "Propose giving up the wood in exchange for a trade agreement.",
          effects: { treasury: 8, people: 2, military: 3 },
          chronicle:
            "You offered Lady Cecily the entire disputed wood in exchange " +
            "for guaranteed use of her river crossing at no toll. She " +
            "agreed immediately — more quickly than you had hoped, which " +
            "made you wonder if you had given too much.",
          indicators: { treasury: "up", people: "up", military: "up" },
        },
      ],
      scribesNote:
        "Medieval women of noble birth could have real power — especially as " +
        "widows. Nicholaa de la Haye, who lived around 1150 to 1230, inherited " +
        "the job of defending Lincoln Castle and actually commanded its defense " +
        "twice during battles. She was also appointed Sheriff of Lincolnshire, " +
        "making her one of the most powerful people in northern England.",
    },

    {
      id: "winter_4",
      title: "The Court Dispute",
      season: "winter",
      description:
        "Two of your most important tenants — the miller and the blacksmith " +
        "— have come to your court with a dispute. The miller claims the " +
        "blacksmith's new forge is diverting water from the millstream. " +
        "The blacksmith says his water wheel does not reduce the flow. " +
        "Both men are essential to your estate. Both are furious.",
      options: [
        {
          text: "Rule in favor of the miller — the mill came first.",
          effects: { treasury: 4, people: -5 },
          chronicle:
            "You ruled that the mill had the prior right to the water. " +
            "The miller bowed; the blacksmith left your court red-faced. " +
            "Your grain was ground reliably, but new iron tools started " +
            "arriving more slowly than before.",
          indicators: { treasury: "up", people: "down" },
        },
        {
          text: "Rule in favor of the blacksmith — the water is sufficient.",
          effects: { treasury: -4, military: 5 },
          chronicle:
            "You ruled that the flow was adequate for both. The blacksmith " +
            "smiled; the miller stormed out. Your weapons and tools were " +
            "repaired promptly all winter, but the miller slowed his " +
            "work to a pointed crawl.",
          indicators: { treasury: "down", military: "up" },
        },
        {
          text: "Commission a water engineer to measure the flow precisely.",
          effects: { treasury: -6, people: 7 },
          chronicle:
            "You hired a man from the nearest town who understood water " +
            "works. He spent a week measuring and returned with a verdict " +
            "both men accepted, because it came from someone who had actually " +
            "measured. The cost was worth the peace.",
          indicators: { treasury: "down", people: "up" },
        },
      ],
      scribesNote: null,
    },

    {
      id: "winter_5",
      title: "The Fuel Crisis",
      season: "winter",
      description:
        "A colder-than-usual January has burned through your wood " +
        "stores faster than expected. Your people are rationing their " +
        "fires to stay warm. Your forester says you can cut timber " +
        "from your managed woodland — but he recommends against it, " +
        "as this year's growth is just getting established. Alternatively, " +
        "you could purchase coal from a merchant, but the price in " +
        "winter is brutal.",
      options: [
        {
          text: "Cut the woodland timber — your people need heat now.",
          effects: { treasury: 2, people: 7, military: -3 },
          chronicle:
            "You ordered the foresters to fell timber despite their " +
            "protests. Fires burned warm through February. But the " +
            "young trees that had been cut would take years to regrow, " +
            "and your hunting grounds shrank noticeably.",
          indicators: { treasury: "up", people: "up", military: "down" },
        },
        {
          text: "Buy coal from the merchant at the winter price.",
          effects: { treasury: -8, people: 8 },
          chronicle:
            "You paid the merchant's steep winter rate and had the coal " +
            "carted to the village. The fires burned black and smoky, but " +
            "warm. Your people thanked you, and your woodland survived " +
            "intact for next year.",
          indicators: { treasury: "down", people: "up" },
        },
        {
          text: "Ration carefully — everyone burns less until March.",
          effects: { people: -8, faith: 3 },
          chronicle:
            "You ordered strict fuel rationing and sent the village priest " +
            "to explain that everyone must endure together. The priest did " +
            "his best, but several old villagers fell ill from the cold. " +
            "They recovered when March finally arrived, but barely.",
          indicators: { people: "down", faith: "up" },
        },
      ],
      scribesNote:
        "Firewood was one of the most important resources in a medieval estate — " +
        "nearly as important as food. Lords carefully managed their forests and " +
        "had strict rules about who could cut wood. The royal forest laws were " +
        "so harsh that a peasant could lose a hand for poaching a deer, but " +
        "gathering fallen branches was usually allowed. Coal was known and used " +
        "in medieval England but was much less common than wood.",
    },

    {
      id: "winter_6",
      title: "The Pilgrim's Request",
      season: "winter",
      description:
        "A group of twelve pilgrims arrives at your gate in a February " +
        "snowstorm. They are traveling to a distant holy shrine and are " +
        "cold, hungry, and exhausted. They have almost no money. Turning " +
        "them away in this weather feels wrong, but feeding and housing " +
        "twelve extra mouths for several days will cost your winter stores.",
      options: [
        {
          text: "Take them in fully — give them warmth, beds, and meals.",
          effects: { treasury: -6, people: 3, faith: 10 },
          chronicle:
            "You opened the gate and the great hall. Your cook complained " +
            "quietly about the depleted stores, but the pilgrims prayed " +
            "for your family every morning and left warm blessings behind " +
            "when the weather cleared.",
          indicators: { treasury: "down", people: "up", faith: "up" },
        },
        {
          text: "Let them sleep in the stable — warm enough and costs little.",
          effects: { treasury: -2, people: 1, faith: 4 },
          chronicle:
            "You offered the stable's warmth and a daily meal of bread " +
            "and pottage. The pilgrims were grateful for shelter from " +
            "the snow, even if the stable smelled of horses. They moved " +
            "on as soon as the road was passable.",
          indicators: { treasury: "down", people: "up", faith: "up" },
        },
        {
          text: "Turn them away — your stores are needed for your own people.",
          effects: { people: -3, faith: -10 },
          chronicle:
            "You told the pilgrims your estate was full and shut the gate. " +
            "The village priest heard what happened and his next sermon " +
            "was noticeably pointed about Christian charity. Several " +
            "of your people looked at you differently after that.",
          indicators: { people: "down", faith: "down" },
        },
      ],
      scribesNote:
        "Pilgrimage was one of the most popular activities in the Middle Ages. " +
        "People traveled hundreds of miles — on foot — to visit shrines like " +
        "Canterbury Cathedral or Santiago de Compostela in Spain. The Church " +
        "taught that helping pilgrims was a holy act. Lords who turned pilgrims " +
        "away risked their reputation with both the Church and their own people.",
    },

    {
      id: "winter_7",
      title: "The Accounting Books",
      season: "winter",
      description:
        "Your reeve has prepared the annual account of all estate income " +
        "and spending. He presents two problems: your miller has been " +
        "skimming a little grain from every bag he grinds — your reeve " +
        "has proof — and your reeve himself made a large mistake that " +
        "cost you money. Both men await your judgment.",
      options: [
        {
          text: "Punish the miller harshly and reprimand the reeve fairly.",
          effects: { treasury: 5, people: -5, military: 3 },
          chronicle:
            "You fined the miller one full year's earnings and docked " +
            "the reeve's pay for two months. Both men accepted silently. " +
            "The message spread: your estate was honest, but the punishments " +
            "felt severe to those who heard the full story.",
          indicators: { treasury: "up", people: "down", military: "up" },
        },
        {
          text: "Warn both men and demand repayment over time.",
          effects: { treasury: 3, people: 4 },
          chronicle:
            "You gave both men a clear warning and required them to " +
            "repay what was lost from their future wages. The miller " +
            "looked shaken; the reeve looked relieved. Neither made " +
            "the same mistake again.",
          indicators: { treasury: "up", people: "up" },
        },
        {
          text: "Dismiss the miller and keep the reeve on probation.",
          effects: { treasury: -4, people: 2, military: 4 },
          chronicle:
            "You sacked the miller on the spot and spent the next month " +
            "finding a replacement. The new man was more expensive. The " +
            "reeve was grateful and worked twice as hard, but the gap " +
            "in grain-grinding held up your spring planting plans.",
          indicators: { treasury: "down", people: "up", military: "up" },
        },
      ],
      scribesNote:
        "Medieval estate managers kept detailed written records called 'pipe " +
        "rolls' and 'account rolls.' These documents listed every hen, every " +
        "bushel of grain, and every coin that entered or left the estate. " +
        "Historians today use these records to learn exactly how medieval " +
        "estates worked — some account rolls from English estates survive " +
        "from the 1200s and are still readable today.",
    },

  ],
};

export default seasonalEvents;
