/**
 * cyoaFlips.js
 *
 * Content data for the five "CYOA perspective flip" branching narratives.
 * Each flip casts the player as a different historical character and guides
 * them through a branching Choose Your Own Adventure sequence.
 * Triggered once per playthrough at specific gameplay conditions.
 *
 * Structure per flip:
 *   id, type, character, title, colorScheme, triggerConditions,
 *   intro, startNode, nodes{}, consequences, returnText, scribesNote
 *
 * Node structure:
 *   Decision nodes: { title, description, options: [{ text, goto }] }
 *   Ending nodes:   { isEnding, endingType, icon, title, description, historicalConnection }
 */

export const CYOA_FLIPS = {
  // =========================================================================
  // CYOA 1: The Lord of Ashworth Manor — Lord Wynn
  // =========================================================================
  cyoa_lord: {
    id: "cyoa_lord",
    type: "cyoa",
    character: "Lord Wynn of Ashworth",
    title: "The Lord of Ashworth Manor",
    colorScheme: {
      accent: "#6b3a2a",
      light: "#a07050",
      background: "#f5ead4",
      text: "#2a1808",
    },
    triggerConditions: { minTurn: 5 },
    intro: {
      title: "Choose Your Path: The Lord of Ashworth Manor",
      bridgeText:
        "A letter arrives bearing the King's seal. As you break the wax, you wonder: what would another lord do in your place?",
      narrativeText:
        "You are Lord Wynn of Ashworth, a minor noble in 13th-century England. Winter approaches, your grain stores are half-full, and a messenger has arrived with troubling news: the King demands soldiers for a campaign in France. Your manor supports 200 souls — serfs, freemen, craftsmen, and their families. Every decision you make ripples through their lives.",
    },
    startNode: "L1",
    nodes: {
      // --- Decision Nodes ---
      L1: {
        title: "The King's Demand",
        description:
          "The royal messenger reads the decree aloud in your great hall. King Henry demands you send 40 men-at-arms to muster at Dover within the month. That is nearly every able-bodied man on your estate — and harvest is not yet finished. Your steward whispers that if you send the men now, the remaining grain will rot in the fields.",
        options: [
          {
            text: "Send 20 men — half the demanded number — and write the King a letter explaining that the harvest must come first.",
            goto: "L2A",
          },
          {
            text: "Comply fully. Send all 40 men immediately. The King's favor is worth more than one season's grain.",
            goto: "L2B",
          },
        ],
      },

      L2A: {
        title: "The Compromise Letter",
        description:
          "Your letter reaches the King's marshal, who is displeased but occupied with larger matters. No punishment comes — yet. With the 20 remaining workers, your steward organizes double shifts. The harvest is salvageable but slow. Then your reeve reports a problem: a group of serfs on the eastern fields are refusing to work the extra hours. They say the labor exceeds their customary obligations under manorial law.",
        options: [
          {
            text: "Meet with the serfs yourself. Listen to their complaint and negotiate a compromise — perhaps a reduced tithe in exchange for the extra labor.",
            goto: "L3A",
          },
          {
            text: "Send your bailiff to enforce the work order. Custom or not, the entire manor will starve if the grain isn't brought in.",
            goto: "L3B",
          },
        ],
      },

      L2B: {
        title: "Full Compliance",
        description:
          "The 40 men march south toward Dover. The King's marshal notes your loyalty. But back at Ashworth, disaster unfolds quickly. With almost no labor force, entire fields of barley and rye go unharvested. Your steward estimates you have stored enough grain for perhaps two months — winter lasts five. Freemen from the nearby village of Thornwick offer to help harvest in exchange for something.",
        options: [
          {
            text: "Offer the Thornwick freemen generous terms: reduced rent on fallow land next spring if they help now.",
            goto: "L3B",
          },
          {
            text: "Offer to pay them from your treasury — silver coin for labor. You can always earn more silver, but grain is life.",
            goto: "L3C",
          },
        ],
      },

      L3A: {
        title: "The Negotiation",
        description:
          "You sit with the serfs in the eastern field. Their spokesman, a weathered man named Godric, explains plainly: they owe you three days' labor per week on the demesne land. You are asking for six. You offer to halve their winter tithe — they would keep more of their own small harvests. Godric confers with the others. They agree, but on one condition: you must put it in writing, witnessed by the village priest. The harvest comes in. Not a record yield, but enough. Now winter arrives and a Flemish wool merchant appears at your gate offering to buy your entire wool surplus at a premium price. But your weaver says she could turn that wool into finished cloth worth three times the raw price — if you can wait until spring.",
        options: [
          {
            text: "Sell the raw wool now. Silver in hand is safer than promises of spring profits — and winter is full of uncertainties.",
            goto: "L4A",
          },
          {
            text: "Keep the wool and invest in your weaver's plan. Higher risk, but the finished cloth could transform Ashworth's economy.",
            goto: "L4B",
          },
        ],
      },

      L3B: {
        title: "The Enforced Harvest",
        description:
          "Whether by bailiff's force or by outside labor, the grain comes in — but tensions are high. The serfs resent the broken customs, or the freemen from Thornwick have leverage they did not have before. Either way, you enter winter with adequate grain but a restless population. Then sickness arrives. A fever sweeps through the village, striking down a dozen workers including your blacksmith. The monastery at Dunmore has a brother who practices medicine, but the Abbot will only send him if you donate timber for their new chapel.",
        options: [
          {
            text: "Send the timber. Losing those trees weakens your estate, but you need that healer and the Church's goodwill.",
            goto: "L4B",
          },
          {
            text: "Refuse. Your people are tough — they have survived fevers before. The timber is more valuable as building material for your own manor.",
            goto: "L4C",
          },
        ],
      },

      L3C: {
        title: "Silver for Labor",
        description:
          "You pay the Thornwick freemen in coin. They work hard and the harvest is partially saved — enough for three months, maybe four if rationed. But your treasury is badly depleted. Worse, word spreads that Lord Wynn is paying silver for common labor. Other lords in the region see this as destabilizing — serfs on neighboring manors start demanding wages too. Your neighbor, Baron Godfrey, sends a sharp letter accusing you of undermining the feudal order. He threatens to raise the matter at the next shire court.",
        options: [
          {
            text: "Write back to Baron Godfrey apologizing and explaining the emergency. Offer to host a feast for neighboring lords to restore relations.",
            goto: "L4C",
          },
          {
            text: "Ignore Godfrey. You had no choice, and you will not grovel to a man who did not lose his entire labor force to the King's levy.",
            goto: "L4D",
          },
        ],
      },

      L4A: {
        title: "Silver in Hand",
        description:
          "The Flemish merchant pays you 12 silver marks for the wool — a fair price. You use the silver to purchase extra grain from a market town and hire a carpenter to repair the manor's leaking roof before the worst of winter. Your people are fed, your buildings are sound, and the serfs remember your fairness at the negotiating table. But spring brings one final test: the King's men return. They want the other 20 soldiers you never sent.",
        options: [
          {
            text: "Send the men now. You have proven your estate can survive hardship, and refusing the King twice would be dangerous.",
            goto: "ENDING_L_GOOD",
          },
          {
            text: "Petition the King directly, presenting your accounts showing how your compromise saved the harvest that feeds his soldiers.",
            goto: "ENDING_L_GOOD",
          },
        ],
      },

      L4B: {
        title: "Calculated Investment",
        description:
          "Whether you kept the wool for your weaver or donated timber to the monks, you made a strategic sacrifice — trading short-term safety for long-term positioning. Winter is lean. There are weeks of thin porridge and careful rationing. Some families grumble. But your choice pays a dividend: either the finished cloth sells at the spring fair for a small fortune, or the monastery sends not just a healer but also a scribe who helps you keep better accounts of your estate. Spring arrives and the King's agents return, demanding back taxes for the \"incomplete\" levy. They want 8 silver marks.",
        options: [
          {
            text: "Pay the tax from your new earnings. It stings, but you are in a position to afford it now.",
            goto: "ENDING_L_GOOD",
          },
          {
            text: "Argue that your compromise benefited the Crown — your harvest fed soldiers. Refuse to pay and prepare to defend your case.",
            goto: "ENDING_L_MEDIUM",
          },
        ],
      },

      L4C: {
        title: "The Price of Stubbornness",
        description:
          "Your refusal — whether to help the sick, to apologize to your neighbors, or both — has consequences. The fever kills your blacksmith and two other skilled workers. Without a smith, tools break and cannot be repaired. Plows dull. Nails run out. Neighboring lords freeze you out of regional trade. By late winter, your stores are dangerously low and your people are losing faith in your leadership. A delegation of your own freemen approaches you with an ultimatum: share the remaining grain equally among all families, or they will petition the shire court to have you removed as lord.",
        options: [
          {
            text: "Agree to share. It is humbling, but survival requires unity.",
            goto: "ENDING_L_MEDIUM",
          },
          {
            text: "Refuse and threaten punishment. You are the lord — the grain is yours by right.",
            goto: "ENDING_L_BAD",
          },
        ],
      },

      L4D: {
        title: "Alone Against the Order",
        description:
          "You ignore Baron Godfrey, and he makes good on his threat. At the shire court, three neighboring lords testify that your wage payments have caused unrest on their manors. The court rules against you: you must pay a fine of 6 silver marks — money you do not have. The sheriff's men arrive to collect. You are forced to sell livestock at winter prices, a devastating loss. Your steward calculates that without those animals, spring planting will be nearly impossible. He suggests one desperate option: petition the King directly for relief, citing your loyal service in sending all 40 men.",
        options: [
          {
            text: "Send the petition. It is a long shot, but the King may remember your loyalty.",
            goto: "ENDING_L_MEDIUM",
          },
          {
            text: "Refuse to beg. You will find another way — perhaps take a loan from the Lombard moneylenders.",
            goto: "ENDING_L_BAD",
          },
        ],
      },

      // --- Ending Nodes ---
      ENDING_L_GOOD: {
        isEnding: true,
        endingType: "good",
        icon: "☀",
        title: "The Wise Steward",
        description:
          "Through careful negotiation, strategic compromise, and respect for both your people and your obligations, Ashworth Manor emerges from the winter stronger than before. Your serfs trust you. Your neighbors respect you. The King's agents regard you as reliable, if independent-minded. When spring comes, the fields are planted on time, the livestock are healthy, and your treasury is recovering. At the county fair, other lords ask how Ashworth survived when so many manors struggled. You earned your place — not by birth alone, but by governing well.",
        historicalConnection:
          "Successful medieval lords balanced obligations to the Crown, the Church, and their tenants. The ones who lasted were not the most powerful — they were the most adaptable. The manorial economy rewarded careful resource management over brute authority.",
      },

      ENDING_L_MEDIUM: {
        isEnding: true,
        endingType: "medium",
        icon: "⚖",
        title: "The Survivor",
        description:
          "Ashworth Manor survives the winter, but barely. You made some strong decisions and some costly ones. Perhaps you argued with the King's agents and now face lingering suspicion. Perhaps your people endured weeks of hunger but held together. You are still lord, your family is still fed, and the fields will be planted — but your treasury is thin, your reputation is mixed, and next winter will test you again. Survival is not the same as prosperity.",
        historicalConnection:
          "Most medieval lords lived in this middle ground — not ruined, but never fully secure. One bad harvest, one royal demand, one outbreak of disease could tip the balance. The feudal system provided structure, but it did not provide safety nets.",
      },

      ENDING_L_BAD: {
        isEnding: true,
        endingType: "bad",
        icon: "☠",
        title: "The Fallen Lord",
        description:
          "Your refusal to compromise — with your serfs, your neighbors, or the Crown — leaves Ashworth isolated and starving. The Lombard loan carries crushing interest. The freemen abandon your estate for better opportunities elsewhere. By spring, you preside over empty fields and crumbling buildings. The sheriff arrives with a new decree: the King is redistributing your fief to a more capable lord. You are permitted to keep your title but given a smaller, poorer estate in the north. Ashworth — the manor your grandfather built — is lost.",
        historicalConnection:
          "Medieval lords could absolutely lose their lands. Mismanagement, defiance of the Crown, or failure to maintain the feudal contract all had real consequences. The land belonged to the King; lords held it in trust, and that trust could be revoked.",
      },
    },
    consequences: {
      good: { treasury: 5, people: 5 },
      medium: { treasury: 2, people: 1 },
      bad: { treasury: -5, people: -5 },
    },
    returnText:
      "You set the letter down and look out across your own estate. The faces are different, the names are different — but the weight of every decision is the same.",
    scribesNote:
      "Medieval lords balanced obligations to the Crown, the Church, and their tenants. The manorial economy rewarded careful resource management over brute authority. Every decision a lord made rippled through the lives of everyone on the estate.",
  },

  // =========================================================================
  // CYOA 2: Elara the Merchant — Elara of Bruges
  // =========================================================================
  cyoa_merchant: {
    id: "cyoa_merchant",
    type: "cyoa",
    character: "Elara of Bruges",
    title: "The Merchant of Bruges",
    colorScheme: {
      accent: "#8b6914",
      light: "#c9a227",
      background: "#fdf3d7",
      text: "#3d2517",
    },
    triggerConditions: { minTurn: 9 },
    intro: {
      title: "Choose Your Path: The Merchant of Bruges",
      bridgeText:
        "A merchant's cart rattles through your gate. As you watch her haggle with your steward, you wonder what the world looks like from behind a market stall.",
      narrativeText:
        "You are Elara, a trader's daughter operating out of the free city of Bruges in Flanders, 1280. Your father's death left you his market stall, three bolts of fine Flemish cloth, a cart, a mule named Patches, and his debts. Women merchants are rare but not unheard of in Bruges — the city's charter protects all guild members equally. You need to turn your small inheritance into a real trading business or lose everything to your father's creditors within the year.",
    },
    startNode: "M1",
    nodes: {
      // --- Decision Nodes ---
      M1: {
        title: "The Opening Move",
        description:
          "It is market day. You have three bolts of Flemish cloth — the finest in Europe — and a decision to make. A local draper offers to buy all three bolts at a fair price: enough to pay off half your father's debt. But a German Hanseatic trader at the next stall mentions that English wool is scarce this season. Cloth prices in London are double what they are here. The sea crossing is dangerous, but the profit could clear your entire debt in one trip.",
        options: [
          {
            text: "Sell to the local draper. It is safe, predictable, and gets the creditors off your back for now.",
            goto: "M2A",
          },
          {
            text: "Risk the Channel crossing. Take your cloth to London where it is worth twice as much.",
            goto: "M2B",
          },
        ],
      },

      M2A: {
        title: "The Safe Sale",
        description:
          "The draper pays 9 silver pennies per bolt — 27 pennies total. You pay 15 toward your father's debt, leaving 12 in your purse and 15 still owed. It is not glamorous, but you are solvent. At the guild hall that evening, you hear two opportunities. A spice merchant from Venice has arrived with a small shipment of pepper — insanely valuable, but expensive to buy. Alternatively, a local potter is looking for someone to transport his wares to the Champagne fair in France, offering you a share of his profits.",
        options: [
          {
            text: "Pool your remaining silver to buy a small quantity of pepper. Spices are the most profitable commodity in Europe — even a little could change everything.",
            goto: "M3A",
          },
          {
            text: "Take the potter's deal. It is less exciting, but the Champagne fairs are the biggest trading events in Europe. Connections matter more than any single commodity.",
            goto: "M3B",
          },
        ],
      },

      M2B: {
        title: "The Channel Crossing",
        description:
          "You hire passage on a merchant cog bound for London. The crossing is rough — Patches the mule hates the sea — but you arrive safely. London is enormous, noisy, and foreign. You do not speak English well, but silver speaks every language. You sell the cloth at a London draper's for 18 pennies per bolt — 54 total. After paying for the crossing, lodging, and port fees, you clear 38 pennies. Enough to pay your father's entire debt with silver to spare. But London offers temptation: an Italian banking agent offers you a line of credit. Borrow now, buy English wool cheap, sell it back in Bruges at a huge markup.",
        options: [
          {
            text: "Take the loan. You have proven you can make this crossing profitably. Scaling up is the smart move.",
            goto: "M3C",
          },
          {
            text: "Decline the loan. Pay your debts, pocket the profit, and build slowly. Debt is what nearly destroyed you in the first place.",
            goto: "M3B",
          },
        ],
      },

      M3A: {
        title: "The Pepper Gamble",
        description:
          "You spend your remaining 12 pennies on a tiny pouch of Venetian pepper — barely a handful. But pepper is worth more than silver by weight in northern Europe. You travel to the regional market in Ghent and find a wealthy household steward desperate to impress his lord for a feast. He pays you 30 pennies for the pepper. Your profit on a single pouch of spice exceeds what your father earned in a month selling cloth. But the spice trade is controlled by powerful Venetian and Genoese families. A Venetian agent approaches you at the Ghent market. He says his master is looking for a northern agent — someone who knows the Flemish markets. The pay is good, but you would be working for him, not for yourself. Alternatively, you could use your new capital to join the Bruges Cloth Guild officially and build your own independent business.",
        options: [
          {
            text: "Accept the Venetian offer. Access to the spice pipeline is worth giving up some independence.",
            goto: "M4A",
          },
          {
            text: "Join the Bruges Cloth Guild. Independence is everything — you will build your own name.",
            goto: "M4B",
          },
        ],
      },

      M3B: {
        title: "The Champagne Fair Connection",
        description:
          "You travel south with the potter's wares to the great Champagne fair at Troyes. The fair is a revelation — thousands of merchants from every corner of Europe packed into one city. You sell the pottery at a decent profit, but more importantly, you make connections. A Provençal wine merchant. A Milanese armorer. A Jewish moneychanger who explains how letters of credit work — the cutting edge of medieval finance. You return to Bruges with modest profit but a head full of ideas. You realize the real money in trade is not in goods — it is in being the person who connects buyers to sellers across long distances. Your next move will define what kind of merchant you become.",
        options: [
          {
            text: "Use your new contacts to become a broker — connecting producers and buyers for a commission, without risking your own silver on goods.",
            goto: "M4B",
          },
          {
            text: "Use the moneychanger's lesson about letters of credit to establish a small money-lending operation alongside your cloth trade.",
            goto: "M4C",
          },
        ],
      },

      M3C: {
        title: "The Leveraged Bet",
        description:
          "You take the Italian banker's loan: 40 pennies of credit at steep interest. You buy English wool at London prices and ship it back to Bruges. The wool sells well — you clear the loan with a tidy profit and still have capital to reinvest. But you notice something disturbing: the Italian banker seems to be keeping track of your movements, your contacts, your sales. You realize you are becoming dependent on his credit line. A Hanseatic merchant — a German trader named Konrad — offers you an alternative partnership. The Hanseatic League controls Baltic trade: furs, amber, timber, salted fish. Konrad wants a Flemish partner to handle the cloth side. It would mean cutting ties with the Italian banker.",
        options: [
          {
            text: "Join with Konrad and the Hanseatic network. Northern trade is booming and the League protects its own.",
            goto: "M4A",
          },
          {
            text: "Stay with the Italian credit line. The Mediterranean connection is more lucrative, even if the banker is controlling.",
            goto: "M4C",
          },
        ],
      },

      M4A: {
        title: "The Alliance",
        description:
          "Whether you joined the Venetian agent or the Hanseatic network, you traded independence for access. And the access pays off — you are now connected to one of the two great trading networks of medieval Europe. Silver flows steadily. You upgrade from a market stall to a proper shop. Patches the mule gets a companion. But your patron makes a demand: they need you to transport a shipment through a contested region where local lords are charging illegal tolls. The shipment is valuable. The risk is real.",
        options: [
          {
            text: "Accept the risky transport. Proving your loyalty now secures your position for years.",
            goto: "ENDING_M_GOOD",
          },
          {
            text: "Refuse the dangerous run and offer an alternative route, even though it means less profit and a slower delivery.",
            goto: "ENDING_M_MEDIUM",
          },
        ],
      },

      M4B: {
        title: "The Independent Path",
        description:
          "You chose independence — the guild, the brokerage, the slow and steady path. It is harder than working for a powerful patron. You do everything yourself: negotiate, transport, keep accounts, maintain your stall. But every penny of profit is yours. By winter's end, you have cleared your father's debt entirely and have a small but growing reputation at the Bruges cloth hall. Then a crisis: a fire sweeps through the cloth hall, destroying half the stored goods. Your bolts survive — you stored them at home — but dozens of other merchants are ruined. They are desperate to buy finished cloth at any price to fulfill their contracts.",
        options: [
          {
            text: "Sell at fair market price. These merchants are your neighbors and potential allies. Gouging them would make you rich today and hated tomorrow.",
            goto: "ENDING_M_GOOD",
          },
          {
            text: "Sell at elevated prices. This is how markets work — scarcity drives price. You did not cause the fire.",
            goto: "ENDING_M_MEDIUM",
          },
        ],
      },

      M4C: {
        title: "The Money Game",
        description:
          "You have drifted from trading goods to trading money — lending, credit, interest. It is enormously profitable but socially dangerous. The Church condemns usury. Other merchants resent you. Even your success attracts the wrong kind of attention: a local lord wants to \"borrow\" a large sum with no realistic plan to repay it. Refusing a lord is risky. Accepting means you may never see that silver again.",
        options: [
          {
            text: "Lend to the lord but demand collateral — a piece of land or a trade privilege. Turn the loan into a business asset.",
            goto: "ENDING_M_MEDIUM",
          },
          {
            text: "Refuse the lord outright and focus on lending to fellow merchants, where contracts are enforceable through the guild court.",
            goto: "ENDING_M_BAD",
          },
        ],
      },

      // --- Ending Nodes ---
      ENDING_M_GOOD: {
        isEnding: true,
        endingType: "good",
        icon: "☀",
        title: "The Merchant of Bruges",
        description:
          "Elara's name is spoken with respect at the cloth hall. Whether through loyal service to a great trading network or through fair dealing with fellow merchants, you built something your father would be proud of. Your stall has become a shop. Your shop will become a warehouse. You hire an apprentice — a girl from a poor family, just like you once were. Bruges is a city where skill and shrewdness matter more than birth, and you are proof of it. Patches the mule is fat and happy.",
        historicalConnection:
          "Medieval Bruges was one of the most important trading cities in Europe. Women could and did operate as merchants, especially in Flanders, where city charters often protected guild members regardless of gender. The cloth trade made Bruges wealthy enough to rival kingdoms.",
      },

      ENDING_M_MEDIUM: {
        isEnding: true,
        endingType: "medium",
        icon: "⚖",
        title: "The Survivor's Bargain",
        description:
          "You are alive, solvent, and in business — but compromised. Maybe you charged too much during the fire and your neighbors remember. Maybe you lent to a lord and now you are tangled in noble politics. Maybe you played it too safe when boldness was needed. Elara is a merchant of Bruges, but not yet a respected one. The business survives. The debts are paid. But trust, once damaged, is expensive to rebuild, and in a medieval trading city, your reputation is your most valuable commodity.",
        historicalConnection:
          "Medieval merchants operated in tight-knit communities where reputation was collateral. Guild records, merchant courts, and word-of-mouth networks meant that how you conducted business mattered as much as what you sold. A merchant who cheated in Bruges might find doors closed in London, Ghent, and Venice.",
      },

      ENDING_M_BAD: {
        isEnding: true,
        endingType: "bad",
        icon: "☠",
        title: "The Debtor's Daughter",
        description:
          "You refused the lord — and he did not take it well. His soldiers \"visit\" your shop, overturning your stall and scattering your goods. The guild protests, but the lord is powerful and the guild is not an army. Without protection, other creditors circle. The Italian banker calls in your remaining debts. You are forced to sell Patches, your cart, and your remaining inventory to pay what you owe. You are back where you started — worse, actually, because now you have enemies. You take work as a serving woman at a tavern near the cloth hall, watching other merchants do the business that should have been yours.",
        historicalConnection:
          "Medieval merchants had no police to call, no insurance to claim, and no bankruptcy protection. The power imbalance between merchants and nobles was a constant tension in medieval cities. Free city charters tried to level the playing field, but a determined lord could still crush a small trader.",
      },
    },
    consequences: {
      good: { treasury: 8, people: 3 },
      medium: { treasury: 3, people: 1 },
      bad: { treasury: -5, people: -3 },
    },
    returnText:
      "The merchant's cart disappears down the road. You return to your ledger, but your understanding of trade has deepened.",
    scribesNote:
      "Medieval trade was the lifeblood of the economy. Merchants like Elara connected producers to buyers across vast distances, turning local surplus into international wealth — and bearing enormous personal risk to do it.",
  },

  // =========================================================================
  // CYOA 3: Sir Roland de Vere — Landless Knight
  // =========================================================================
  cyoa_knight: {
    id: "cyoa_knight",
    type: "cyoa",
    character: "Sir Roland de Vere",
    title: "The Landless Knight",
    colorScheme: {
      accent: "#4a1a2e",
      light: "#8b3a5a",
      background: "#f5e8ed",
      text: "#2a0a18",
    },
    triggerConditions: { minTurn: 15 },
    intro: {
      title: "Choose Your Path: The Landless Knight",
      bridgeText:
        "Your garrison captain reports for duty. Before he speaks, you wonder: what does war look like for a knight who owns nothing but his sword?",
      narrativeText:
        "You are Sir Roland, a landless knight in 1270 who earns his living through military service. You are not a great lord — you hold no fief. Your wealth is your warhorse, your armor, your sword arm, and your reputation. A summons has come from your liege lord, the Earl of Lancaster, to join a campaign against Welsh rebels in the western marches. For you, war is both duty and livelihood. Every battle could make your fortune — or end your life.",
    },
    startNode: "K1",
    nodes: {
      // --- Decision Nodes ---
      K1: {
        title: "The Summons",
        description:
          "You arrive at Lancaster's camp outside Chester with your squire, two packhorses, and a suit of mail that has seen better days. The Earl's marshal assigns you to a company of 30 knights and 100 foot soldiers tasked with securing a river crossing deep in Welsh territory. The Welsh are not massed in armies — they fight in small warbands, using the hills and forests to ambush. Your captain, Sir Hugh, asks for volunteers to lead the vanguard — the first group across the river. The vanguard gets the glory and the most danger.",
        options: [
          {
            text: "Volunteer for the vanguard. A landless knight needs glory — this is how reputations are built.",
            goto: "K2A",
          },
          {
            text: "Hold back and join the main column. Let someone else take the first arrows. Survival is its own kind of strategy.",
            goto: "K2B",
          },
        ],
      },

      K2A: {
        title: "Vanguard Glory",
        description:
          "You lead twelve mounted knights across the ford at dawn. The Welsh are waiting. Arrows hiss from the tree line. One strikes your horse's flank — the beast stumbles but holds. You charge the archers' position, scattering them, and secure the far bank. Two of your knights are wounded but none killed. When Sir Hugh crosses with the main force, he clasps your hand and says the Earl will hear of this. That evening, Welsh envoys approach under a branch of peace. Their leader, a chieftain named Owain, offers to negotiate. He says the Welsh do not want war — they want their customary rights respected. Owain offers hostages as a guarantee of peace. Sir Hugh is suspicious, but the decision falls to you because you hold the river crossing.",
        options: [
          {
            text: "Accept the negotiation. Take the hostages and send word to the Earl. Ending the campaign without more bloodshed would be a triumph.",
            goto: "K3A",
          },
          {
            text: "Refuse. The Welsh have ambushed your men before under flags of truce. Secure the crossing and push inland as ordered.",
            goto: "K3B",
          },
        ],
      },

      K2B: {
        title: "The Cautious Column",
        description:
          "You ride with the main body. The vanguard takes losses at the ford — three knights wounded, one killed. You cross safely and help secure the position, but Sir Hugh assigns the dead knight's captured Welsh ponies to the vanguard survivors, not to you. You receive nothing for today's work but safety. That night, you are assigned to guard the camp perimeter. It is cold, boring work. But your squire notices something: a group of Welsh scouts watching the camp from a ridge. If you could capture one, the intelligence would be valuable.",
        options: [
          {
            text: "Lead a small night raid to capture a Welsh scout. It is risky, but it could prove your worth and provide critical intelligence.",
            goto: "K3A",
          },
          {
            text: "Report the scouts to Sir Hugh and let him decide. Following the chain of command is safer and shows discipline.",
            goto: "K3B",
          },
        ],
      },

      K3A: {
        title: "The Diplomat's Gambit",
        description:
          "Whether through negotiation with Owain or through intelligence gathered from a captured scout, you have positioned yourself as more than just a sword arm. The Earl of Lancaster hears about a knight who thinks as well as he fights. You are summoned to the Earl's tent. He asks your assessment of the Welsh situation — can they be pacified, or must they be crushed? This is a moment that could define your career. The Earl has two factions advising him: the hawks who want total conquest, and the moderates who favor a negotiated settlement with Welsh chieftains swearing fealty.",
        options: [
          {
            text: "Advise moderation. A negotiated peace preserves the Earl's army, costs less silver, and earns the loyalty of Welsh lords who might become useful vassals.",
            goto: "K4A",
          },
          {
            text: "Advise conquest. Half-measures leave enemies alive. The Welsh will rebel again unless their power is broken completely.",
            goto: "K4B",
          },
        ],
      },

      K3B: {
        title: "The Soldier's Path",
        description:
          "You push inland with the column, following orders without question. The campaign grinds on — weeks of rain, mud, skirmishes in valleys where the Welsh melt into the hillsides. Your armor rusts. Your horse grows thin on poor forage. But you do your duty. After a month, the company besieges a small Welsh fortress perched on a cliff. Sir Hugh orders an assault, but the approach is steep and narrow — a killing ground. You can see it will be costly. Several knights mutter about the wisdom of a direct attack.",
        options: [
          {
            text: "Speak up and suggest an alternative: starve the fortress out. A siege takes longer but costs fewer lives.",
            goto: "K4A",
          },
          {
            text: "Say nothing and prepare for the assault. You are a soldier — Sir Hugh gives the orders, you follow them.",
            goto: "K4B",
          },
        ],
      },

      K4A: {
        title: "The Strategic Mind",
        description:
          "Your counsel — whether diplomatic or tactical — proves sound. The Earl takes note of a knight who uses his head. You are rewarded: not with a fief (not yet) but with a position in the Earl's household guard. Steady pay, better equipment, and a seat at the table where decisions are made. Over the winter, the Earl mentions that a small manor near the Welsh border needs a lord — the previous holder died without heirs. But there is a catch: taking the manor means settling on the border, where Welsh raids are a constant threat. The alternative is staying in the Earl's household — safe, well-paid, but always a servant, never a lord.",
        options: [
          {
            text: "Take the border manor. Risk and independence over comfort and servitude. You came to this campaign to win land — here it is.",
            goto: "ENDING_K_GOOD",
          },
          {
            text: "Stay in the Earl's household. The manor is a deathtrap, and being close to the Earl puts you in line for something better.",
            goto: "ENDING_K_MEDIUM",
          },
        ],
      },

      K4B: {
        title: "The Blunt Instrument",
        description:
          "The assault goes forward — either on the fortress or deeper into Welsh territory. It is bloody. You fight well, as always, but the cost is high. Several good men die on the slopes. The fortress falls, but there is no treasure inside — just starving Welsh families. Sir Hugh claims victory in his dispatches to the Earl, but the truth is messier. The campaign winds down not with triumph but with exhaustion on both sides. You return to Chester with your life, your horse (barely), and your reputation intact. But \"intact\" is not the same as \"enhanced.\" The Earl distributes rewards: captured livestock, Welsh ponies, a small purse of silver. You receive a modest share. Not enough to buy land. Not enough to change your station. A fellow knight suggests a new opportunity: a tournament at Kenilworth, where prizes include a warhorse worth more than everything you own. Tournaments are dangerous — men die in melees — but they are the fastest path to wealth for a landless knight.",
        options: [
          {
            text: "Enter the tournament. You have survived a war — you can survive a melee.",
            goto: "ENDING_K_MEDIUM",
          },
          {
            text: "Skip the tournament and hire yourself out as a mercenary to a French lord recruiting in England. The pay is good but the work is ugly.",
            goto: "ENDING_K_BAD",
          },
        ],
      },

      // --- Ending Nodes ---
      ENDING_K_GOOD: {
        isEnding: true,
        endingType: "good",
        icon: "☀",
        title: "The Border Lord",
        description:
          "You take the manor. It is small — a stone tower, a village of 40 families, fields that flood in spring, and a forest full of Welsh raiders. But it is yours. You spend your first year fortifying the tower, negotiating with the nearest Welsh chieftain (a man not unlike Owain), and learning to be a lord instead of just a knight. It is harder than any battle — managing crops, settling disputes between peasants, repairing a mill. But by the second winter, the village is growing. A blacksmith arrives. A market charter is granted. Sir Roland de Vere, once a landless sword-for-hire, has become something that matters: a lord who earned his place.",
        historicalConnection:
          "The Welsh Marches were a frontier zone where ambitious knights could win land through service. Many of England's most powerful families started as minor knights who took border manors and built them into something greater. The feudal system rewarded military service with land — but keeping that land required governance skills, not just sword skills.",
      },

      ENDING_K_MEDIUM: {
        isEnding: true,
        endingType: "medium",
        icon: "⚖",
        title: "The Professional Soldier",
        description:
          "Whether through tournament glory or household service, Roland survives and even prospers modestly. You are well-equipped, well-connected, and respected as a reliable fighting man. But you are still landless. You earn your bread by the season, campaign by campaign, tournament by tournament. It is an honorable life by medieval standards — many knights lived exactly this way — but it is precarious. One bad injury, one unlucky tilt, and everything you have built collapses. You are free but never secure.",
        historicalConnection:
          "Landless knights were a significant population in medieval Europe. They formed the backbone of royal and noble armies, competed in tournaments for prize money, and sometimes became mercenaries. The ideal of the knight-errant — wandering in search of glory — was partly a romantic cover for the economic reality of men who needed to fight for a living.",
      },

      ENDING_K_BAD: {
        isEnding: true,
        endingType: "bad",
        icon: "☠",
        title: "The Sellsword's End",
        description:
          "You take the mercenary contract. The French lord sends you east to fight in a territorial dispute in Burgundy. The cause is meaningless — two nobles arguing over a vineyard — but the pay is real. You fight for silver, not honor, alongside men who would slit your throat for your horse. The work coarsens you. After two years, you are wealthy in silver but poor in everything else. No lord trusts a known mercenary. No lady's family will consider a match. The chivalric code you once followed is a memory. When a younger, faster knight unseats you in a skirmish and takes your warhorse, you are left with nothing but a battered sword and a long walk home.",
        historicalConnection:
          "Mercenary companies were a growing problem in medieval Europe. Landless knights who turned to mercenary work often found it impossible to return to respectable feudal society. The Church attempted to ban tournaments and mercenary warfare multiple times — not out of pacifism, but because roving bands of armed, unemployed knights were a genuine threat to social order.",
      },
    },
    consequences: {
      good: { military: 5, people: 3 },
      medium: { military: 2, people: 1 },
      bad: { military: -5, people: -2 },
    },
    returnText:
      "The captain finishes his report. You look at your soldiers with new eyes — each one has a story, a gamble, a life riding on every command you give.",
    scribesNote:
      "Landless knights were the backbone of medieval armies. They fought for pay, glory, and the hope of winning land. The feudal system promised reward for military service — but delivering on that promise was never guaranteed.",
  },

  // =========================================================================
  // CYOA 4: Brother Thomas of Dunmore Abbey
  // =========================================================================
  cyoa_monk: {
    id: "cyoa_monk",
    type: "cyoa",
    character: "Brother Thomas of Dunmore Abbey",
    title: "The Keeper of the Scriptorium",
    colorScheme: {
      accent: "#2d4a1e",
      light: "#5a8a3a",
      background: "#eef5e8",
      text: "#1a2a08",
    },
    triggerConditions: { minTurn: 12 },
    intro: {
      title: "Choose Your Path: The Keeper of the Scriptorium",
      bridgeText:
        "A monk arrives at your gate with a beautifully illuminated manuscript to sell. You trace the gold leaf lettering and wonder: what is life like behind monastery walls?",
      narrativeText:
        "You are Brother Thomas, a Benedictine monk at Dunmore Abbey in 1275. You entered the monastery at age 14 — not by choice, but because your family could not afford another mouth. Now 28, you have found unexpected peace in the scriptorium, where you copy manuscripts and illuminate them with gold leaf and bright pigments. The Abbey is a center of learning in a world where most people cannot read. But the Abbey is also a political institution — it owns vast lands, collects tithes, and answers to both the Bishop and the King. Your quiet life is about to get complicated.",
    },
    startNode: "T1",
    nodes: {
      // --- Decision Nodes ---
      T1: {
        title: "The Abbot's Secret",
        description:
          "Abbot William calls you to his private chamber. You expect a reprimand — perhaps you used too much gold leaf on your last manuscript. Instead, the Abbot reveals something troubling: a visiting scholar from Paris has brought a copy of newly translated texts from Arabic — works by Aristotle and the Islamic philosopher Averroes. These texts contain ideas about logic and natural philosophy that challenge some Church teachings. The Abbot believes these ideas are important for learning but fears the Bishop would condemn them as heretical. He asks you — his best scribe — to make a copy in secret.",
        options: [
          {
            text: "Agree to copy the texts. Knowledge is sacred, and preserving ideas is what monks do. The Abbot would not ask without good reason.",
            goto: "T2A",
          },
          {
            text: "Refuse respectfully. The risk is too great. If the Bishop discovers forbidden texts in the Abbey's library, everyone suffers — not just you.",
            goto: "T2B",
          },
        ],
      },

      T2A: {
        title: "The Secret Copy",
        description:
          "You work at night by candlelight, copying Aristotle's natural philosophy and Averroes' commentaries. The ideas are fascinating — logical arguments about the natural world, theories about how things move and change, questions about the relationship between reason and faith. You begin to understand why scholars in Paris are so excited by these texts. You also begin to understand why the Church is nervous. You finish the copy in three weeks. The Abbot hides it in the Abbey's locked archive. But the visiting Parisian scholar mentions your work to another monk, Brother Jerome, who is known for his strict orthodoxy. Jerome begins watching you. One morning, he asks pointed questions about what you have been working on late at night.",
        options: [
          {
            text: "Deflect. Tell Jerome you have been working on a psalter — a book of psalms — and show him a partially completed one as proof.",
            goto: "T3A",
          },
          {
            text: "Tell Jerome a partial truth: you copied some philosophical texts for the Abbot's personal study. Avoid mentioning the specific authors.",
            goto: "T3B",
          },
        ],
      },

      T2B: {
        title: "The Careful Monk",
        description:
          "You decline the Abbot's request. He looks disappointed but nods. Two weeks later, you learn that the Abbot asked Brother Jerome to make the copy instead — and Jerome, horrified by the contents, reported the texts to the Bishop. The Bishop sends an investigating priest to Dunmore Abbey. The Abbot is questioned for three days. He is not removed, but the Abbey is placed under closer scrutiny. The atmosphere at Dunmore becomes tense. Monks choose sides — those who support the Abbot's openness to new ideas, and those who side with Jerome's strict orthodoxy. You are caught in the middle. The Abbot asks for your support at a meeting of the Abbey's senior brothers.",
        options: [
          {
            text: "Support the Abbot publicly. Even though you refused to copy the texts, you believe the Abbey should be a place of learning, not fear.",
            goto: "T3A",
          },
          {
            text: "Stay neutral. You have no power here, and taking sides will only make enemies. Focus on your work in the scriptorium.",
            goto: "T3B",
          },
        ],
      },

      T3A: {
        title: "The Scholar's Risk",
        description:
          "Whether through deception or public support, you have aligned yourself with the Abbot and the cause of learning. This puts you in a dangerous but exciting position. The Abbot, grateful for your loyalty, offers you something extraordinary: a chance to travel to the University of Paris to study for one year, funded by the Abbey. Paris is the intellectual capital of Christendom — theology, philosophy, natural science, all debated in its lecture halls. But leaving the Abbey means leaving the safety of your routine, and the Bishop may see your departure as suspicious.",
        options: [
          {
            text: "Go to Paris. This is the opportunity of a lifetime. The risk is worth the knowledge.",
            goto: "T4A",
          },
          {
            text: "Stay at Dunmore and continue your work quietly. Paris is a dream, but the Abbey needs steady hands more than it needs another scholar.",
            goto: "T4B",
          },
        ],
      },

      T3B: {
        title: "The Quiet Path",
        description:
          "You keep your head down. Jerome's faction gains influence. The scriptorium's work shifts from scholarly texts to devotional works — psalters, prayer books, saints' lives. Less intellectually stimulating, but safer. You complete a beautiful illuminated Book of Hours that catches the attention of a wealthy noblewoman, Lady Margaret, who commissions a personal prayer book for her family. The commission would bring significant income to the Abbey. But Lady Margaret wants something unusual: she wants the prayer book to include illustrations of daily life — peasants working fields, merchants trading, children playing. Jerome says this is inappropriate for a sacred text. The Abbot sees no harm in it. The commission — and its income — hangs on your decision as the artist.",
        options: [
          {
            text: "Include Lady Margaret's secular illustrations. Art should reflect all of God's creation, not just saints and angels.",
            goto: "T4A",
          },
          {
            text: "Compromise. Include some secular imagery in the margins (a common medieval practice) but keep the main illustrations sacred.",
            goto: "T4B",
          },
        ],
      },

      T4A: {
        title: "The Bold Choice",
        description:
          "Whether you traveled to Paris or painted peasants in a prayer book, you chose knowledge and expression over caution. And it works — at least at first. In Paris, you encounter ideas that reshape your understanding of the world. In the scriptorium, Lady Margaret's prayer book becomes a celebrated work of art. But boldness has costs. Word reaches the Bishop that Dunmore Abbey harbors a monk with \"unusual\" interests. An inspection is ordered. The Abbot warns you: the inspector will examine your work. If you have copies of Aristotle or unconventional illustrations, you need to decide what to do with them before the inspection.",
        options: [
          {
            text: "Hide the controversial works in a sealed chamber beneath the Abbey's wine cellar. Preservation is more important than obedience.",
            goto: "ENDING_T_GOOD",
          },
          {
            text: "Present your work openly and argue its merit to the inspector. The Church has always been a place of learning — you will remind them.",
            goto: "ENDING_T_MEDIUM",
          },
        ],
      },

      T4B: {
        title: "The Steady Hand",
        description:
          "You chose caution, compromise, and patience. The scriptorium under your quiet leadership becomes the Abbey's pride — beautiful devotional works that earn income and prestige without controversy. Jerome cannot complain about prayer books and psalters. The Abbot appreciates your steadiness even if he wishes you were bolder. Years pass. The Abbot grows old and the question of succession arises. Two candidates emerge: Jerome, who would make Dunmore a fortress of orthodoxy, and you, who would preserve it as a balanced house of both devotion and learning. The senior brothers will vote.",
        options: [
          {
            text: "Quietly campaign among the brothers, emphasizing your record of steady, productive leadership.",
            goto: "ENDING_T_GOOD",
          },
          {
            text: "Decline the nomination. You are a scribe, not a politician. Let others lead while you do what you do best.",
            goto: "ENDING_T_MEDIUM",
          },
        ],
      },

      // --- Ending Nodes ---
      ENDING_T_GOOD: {
        isEnding: true,
        endingType: "good",
        icon: "☀",
        title: "The Keeper of Knowledge",
        description:
          "Whether by hiding Aristotle in the wine cellar or by rising to lead the Abbey yourself, Brother Thomas ensures that Dunmore remains a place where knowledge survives. Your manuscripts — philosophical, devotional, and artistic — outlive you by centuries. Scholars in future ages will study your copies of Aristotle and marvel at the beautiful marginalia in Lady Margaret's prayer book. You never became famous. Most monks never do. But you preserved something that mattered, in an age when knowledge could be destroyed by a single accusation of heresy.",
        historicalConnection:
          "Medieval monasteries were the libraries of Europe. Monks like Thomas preserved Greek and Arabic texts that would have been lost otherwise. The tension between intellectual curiosity and Church orthodoxy was real — scholars were sometimes accused of heresy for studying \"pagan\" philosophy. But the monks who copied these texts created the foundation for the Renaissance and the Scientific Revolution.",
      },

      ENDING_T_MEDIUM: {
        isEnding: true,
        endingType: "medium",
        icon: "⚖",
        title: "The Faithful Scribe",
        description:
          "Thomas lives a long, productive, quiet life at Dunmore. His psalters and prayer books are beautiful. His devotional works bring comfort to the faithful and income to the Abbey. He never studies Aristotle or travels to Paris or challenges the Bishop. He is respected, content, and safe. Some part of him wonders what might have been — what he might have learned, what he might have preserved. But the scriptorium is warm, the ink smells like home, and the vellum pages turn softly under his practiced hands.",
        historicalConnection:
          "Most medieval monks lived exactly this life — devoted, productive, and anonymous. The Benedictine Rule emphasized stability, obedience, and labor. For every monk who became a great scholar, hundreds spent their lives in quiet, faithful work. Their illuminated manuscripts are among the most beautiful objects ever created by human hands.",
      },

      // Note: ENDING_T_BAD is not directly reachable via the branching paths above,
      // but is included as specified for potential story extension.
      ENDING_T_BAD: {
        isEnding: true,
        endingType: "bad",
        icon: "☠",
        title: "The Condemned Scholar",
        description:
          "The Bishop's inspector finds the Aristotle copies. Thomas is accused of harboring heretical texts and questioned harshly. The Abbot tries to intervene but is overruled. Thomas is sentenced to penance: one year of silence, restricted to bread and water, confined to a cell. The forbidden manuscripts are burned in the Abbey courtyard. Thomas watches from his cell window as centuries of philosophical thought turn to ash. He survives his penance but is never trusted again. He spends his remaining years copying prayer lists and inventories — the most tedious work in the scriptorium. His hands, once capable of the most beautiful illumination in England, cramp over ledger entries until they can no longer hold a quill.",
        historicalConnection:
          "The Church's power over intellectual life was absolute. Books were burned, scholars were silenced, and universities operated under strict theological supervision. The recovery of Greek and Arabic texts was one of the great triumphs of medieval intellectual history — but it happened despite enormous institutional resistance, not because of institutional support.",
      },
    },
    consequences: {
      good: { faith: 5, people: 3 },
      medium: { faith: 2, people: 1 },
      bad: { faith: -3, people: -2 },
    },
    returnText:
      "The monk departs with his silver. You look at the manuscript in your hands — each page represents months of devoted labor. Knowledge, you realize, has its own economy.",
    scribesNote:
      "Medieval monasteries were the libraries and universities of their age. Monks preserved ancient knowledge, produced stunning art, and navigated the tension between intellectual curiosity and Church orthodoxy — a tension that shaped the future of Western civilization.",
  },

  // =========================================================================
  // CYOA 5: Agnes of Thornwick — A Serf's Choice
  // =========================================================================
  cyoa_serf: {
    id: "cyoa_serf",
    type: "cyoa",
    character: "Agnes of Thornwick",
    title: "A Serf's Choice",
    colorScheme: {
      accent: "#5c3d1e",
      light: "#a0714f",
      background: "#f0e6d3",
      text: "#2a1a08",
    },
    triggerConditions: { minTurn: 18 },
    intro: {
      title: "Choose Your Path: A Serf's Choice",
      bridgeText:
        "A girl from the village brings flowers to the castle gate. She curtsies nervously. You wonder: what does your rule look like from down there?",
      narrativeText:
        "You are Agnes, a serf bound to the manor of Thornwick in 1280. You are 16 years old. Your family has worked these fields for three generations. You cannot leave the manor without your lord's permission. You cannot marry without his approval. You owe him three days of labor per week on his fields, a share of your harvest, and fees for using the manor's mill and oven. But you are not a slave — you have legal rights under manorial custom, your own small plot of land, and the protection of the village community. Winter is coming, and this year, your choices will determine whether your family survives.",
    },
    startNode: "A1",
    nodes: {
      // --- Decision Nodes ---
      A1: {
        title: "The Broken Plow",
        description:
          "It is September, and your family's plow has cracked. Without it, you cannot prepare your strip of land for winter planting. A new plow costs more than your family earns in a season. The manor blacksmith could repair it, but he answers to the lord's reeve, and the reeve demands a fee — half a bushel of grain — for any repair work. Your family's grain stores are already thin.",
        options: [
          {
            text: "Pay the fee. The plow is essential — without winter planting, there will be nothing to eat next spring. Find the grain somehow.",
            goto: "A2A",
          },
          {
            text: "Attempt to repair the plow yourself using scavenged materials. You have watched the blacksmith work. It will not be perfect, but it might hold.",
            goto: "A2B",
          },
        ],
      },

      A2A: {
        title: "The Cost of Necessity",
        description:
          "You scrape together the grain — borrowing a small amount from your neighbor, Maud, with a promise to repay at harvest. The blacksmith repairs the plow properly. Your strip is planted on time. But now you owe Maud, and winter stores are dangerously low. Your mother is worried. Then an opportunity appears: the lord's steward announces that extra hands are needed in the manor kitchen for the Christmas feast preparations. The pay is food — scraps and leftovers from the lord's table, which during feast season can be substantial. But it means working the lord's kitchen on top of your regular field obligations and your own family's cooking and mending.",
        options: [
          {
            text: "Take the kitchen work. The extra food could mean the difference between surviving winter and starving. Sleep can wait.",
            goto: "A3A",
          },
          {
            text: "Decline. You are already exhausted, and your own family's winter preparations — salting, mending, firewood gathering — need your attention.",
            goto: "A3B",
          },
        ],
      },

      A2B: {
        title: "The Home Repair",
        description:
          "You patch the plow with a piece of salvaged iron and a leather binding. It is crude but functional — for now. You plant your strip, working fast before the ground freezes. But three days in, the repair gives way and the plow cracks again, worse than before. You have lost three days and the plow is now beyond home repair. You are desperate. A traveling tinker passing through the village offers to fix the plow for a price: your family's best laying hen. Without that hen, you lose eggs — a critical protein source through winter. But without the plow, you lose everything.",
        options: [
          {
            text: "Give the tinker the hen. Eggs can be replaced eventually — an unplanted field cannot.",
            goto: "A3A",
          },
          {
            text: "Refuse the tinker and beg the lord's reeve for charity. Explain your situation and ask for the repair at reduced cost or on credit.",
            goto: "A3B",
          },
        ],
      },

      A3A: {
        title: "The Working Winter",
        description:
          "Through exhausting labor — whether in the lord's kitchen or in the frozen fields — you keep your family fed through the lean months. But barely. By February, every family in Thornwick is thin and tired. Then the village reeve makes an announcement: the lord wants to enclose part of the commons — the shared land where villagers graze their animals and gather firewood. He says it will be converted to sheep pasture for the wool trade. This is devastating. The commons is survival itself for serf families. Without grazing land, your family's cow dies. Without firewood rights, you freeze. Several villagers want to protest, but challenging the lord is terrifying.",
        options: [
          {
            text: "Join the protest. Stand with your neighbors and argue that enclosure violates customary manorial rights. There is strength in numbers.",
            goto: "A4A",
          },
          {
            text: "Stay quiet and try to adapt. Find alternative grazing land, gather wood from further away. Do not draw the lord's attention.",
            goto: "A4B",
          },
        ],
      },

      A3B: {
        title: "Asking for Help",
        description:
          "Whether from the reeve or from neighbors, you ask for help. The response is mixed. The reeve is not cruel but not generous — he offers the repair at half price, to be repaid in extra labor days next spring. Your neighbors share what little they can. Maud brings a pot of pottage. Old Godric gives your family firewood. You survive, but you realize something important: your survival depends entirely on the village community. Alone, a serf family is helpless. Together, you have a chance. When spring comes, a new opportunity arises: the nearby town of Millbrook is holding a market fair, and the lord has agreed to let serfs attend and sell goods — eggs, wool, carved items — for one day. Any profit you earn is yours to keep (the lord takes his cut at the gate). This is a rare chance to earn actual coin.",
        options: [
          {
            text: "Go to the fair with everything you can sell. Even a few pennies could change your family's situation.",
            goto: "A4A",
          },
          {
            text: "Stay home and work your strip. The fair is a gamble — you might sell nothing. The land is a certainty.",
            goto: "A4B",
          },
        ],
      },

      A4A: {
        title: "Standing Up / Stepping Out",
        description:
          "You took the brave choice — standing with your community against enclosure, or venturing to the market fair with your meager goods. Either way, you discovered something about yourself: you are not content to simply endure. The commons protest draws the attention of a traveling Franciscan friar who sympathizes with the villagers. He writes a formal petition to the lord citing manorial custom. The lord, not wanting Church scrutiny, backs down — for now. At the market fair, your family's goods sell modestly, but you meet a free townswoman who tells you something astonishing: in some towns, a serf who lives within the town walls for a year and a day becomes legally free. A year and a day. Freedom.",
        options: [
          {
            text: "Begin quietly planning to move your family to Millbrook. Freedom is worth the risk.",
            goto: "ENDING_A_GOOD",
          },
          {
            text: "Stay in Thornwick. Your family has been here for generations. The village is your home, and the community needs you.",
            goto: "ENDING_A_MEDIUM",
          },
        ],
      },

      A4B: {
        title: "The Quiet Endurance",
        description:
          "You keep your head down. The commons are enclosed — your family loses grazing rights. You adapt by gathering wood from further away, waking before dawn and walking miles in the cold. Your cow is sold because you can no longer feed it. The wool trade makes the lord wealthier. The village grows poorer. But spring comes, as it always does. Your strip produces a modest crop. Your neighbors share when they can. Life continues, harder than before but not broken. Then your younger brother, Will, announces he wants to run away to the nearest town to seek freedom and apprenticeship. He is 13 and determined.",
        options: [
          {
            text: "Help Will escape. He deserves a chance at a better life, even if it means risking punishment for your family.",
            goto: "ENDING_A_MEDIUM",
          },
          {
            text: "Convince Will to stay. A 13-year-old alone in a medieval town could end up dead in a ditch. The family stays together.",
            goto: "ENDING_A_BAD",
          },
        ],
      },

      // --- Ending Nodes ---
      ENDING_A_GOOD: {
        isEnding: true,
        endingType: "good",
        icon: "☀",
        title: "The Year and a Day",
        description:
          "Your family slips away on a moonless night. The journey to Millbrook is terrifying — if the lord's men catch you, the punishment is severe. But you reach the town walls, find shelter with the townswoman you met at the fair, and begin a new life. Your mother takes in washing. You find work at a bakery. Will apprentices with a cobbler. For 365 days, you live in fear that the lord will come to claim you. On the 366th day, the town mayor formally declares your family free. You cry — not from sadness, but from the overwhelming relief of owning your own life. You are still poor. You still work with your hands. But the labor is yours. The profit is yours. The future is yours to shape.",
        historicalConnection:
          "The principle of \"a year and a day\" was real — many medieval town charters included provisions that freed serfs who lived within the walls for that period. This created a powerful incentive for serfs to flee to growing towns, which contributed to the slow decline of serfdom in Western Europe. Towns needed labor; serfs needed freedom. The system benefited both, at the expense of rural lords.",
      },

      ENDING_A_MEDIUM: {
        isEnding: true,
        endingType: "medium",
        icon: "⚖",
        title: "Enduring in Place",
        description:
          "Agnes stays in Thornwick — or helps Will leave while she remains. Either way, life goes on. The commons are reduced but not eliminated. Customary rights still protect the basics. Agnes marries, has children, works the same strips her grandparents worked. It is not freedom, but it is not misery. There is the harvest festival in autumn, the warmth of the village alehouse in winter, the satisfaction of seeds breaking through soil in spring. Agnes's world is small — perhaps three miles in any direction — but it is hers in every way that matters to the heart, if not to the law.",
        historicalConnection:
          "Most medieval serfs lived entire lives within a few miles of where they were born. This does not mean their lives were empty. Village communities had rich social lives, customary celebrations, mutual aid networks, and a deep connection to the land. Serfdom was restrictive and unjust, but the people living under it found ways to build meaningful lives within its constraints.",
      },

      ENDING_A_BAD: {
        isEnding: true,
        endingType: "bad",
        icon: "☠",
        title: "The Tightening Grip",
        description:
          "Will stays because Agnes convinced him to. But his resentment grows. The lord tightens his control — enclosure expands, labor obligations increase, and a new reeve is appointed who is harsher than the last. A drought hits the following summer. Without the commons, without the cow, without any margin for error, the harvest fails. Your family joins a growing number of Thornwick families who cannot pay their tithe. The lord seizes grain directly from your stores. What remains will not last the winter. Agnes and her family join the desperate ranks of the landless poor — serfs who technically still owe service to a lord but have nothing left to give. They survive on charity from the monastery, day labor in nearby towns, and the slow erosion of everything their grandparents built. Will disappears one night. Agnes hopes he made it to a town. She never finds out.",
        historicalConnection:
          "The medieval peasantry was vulnerable to cascading disasters: a bad harvest, a harsh lord, enclosure of common land, or disease could push a family from subsistence into destitution. The Black Death of 1348 would eventually shatter the old manorial system by killing so many workers that the survivors could demand better terms. But for Agnes's generation, that catastrophic liberation was still decades away.",
      },
    },
    consequences: {
      good: { people: 8, treasury: 2 },
      medium: { people: 3, treasury: 1 },
      bad: { people: -5, treasury: -3 },
    },
    returnText:
      "The girl is gone. You return to your throne, but something has shifted. Every tax you levy, every law you enforce, every field you enclose — someone like Agnes bears the weight of it.",
    scribesNote:
      "Serfs were bound to the land but were not slaves. They had legal rights, customary protections, and community bonds that sustained them. Understanding serfdom means understanding both its restrictions and its humanity.",
  },
};

/*
 * Structure summary:
 *
 * CYOA_FLIPS differs from PERSPECTIVE_FLIPS in that each entry uses a `nodes`
 * object (keyed by node ID) with `goto` pointers instead of a linear `decisions[]`
 * array. This enables true branching paths where choices lead to different nodes
 * rather than always advancing to the next decision in sequence.
 *
 * Decision nodes:  { title, description, options: [{ text, goto }] }
 * Ending nodes:    { isEnding: true, endingType, icon, title, description, historicalConnection }
 *
 * The `consequences` field maps endingType ("good" | "medium" | "bad") to resource
 * deltas applied to the player's estate when they finish the CYOA sequence.
 */
