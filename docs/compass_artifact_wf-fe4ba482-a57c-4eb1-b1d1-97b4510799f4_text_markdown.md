# The Lord's Ledger: a medieval economic simulation game design document

**A BitLife-style turn-based simulation where 6th graders manage a medieval estate through text-based choices, learning feudal economics through consequence-driven gameplay.**

The Lord's Ledger puts players in the role of a newly inherited medieval lord managing a castle, lands, and people across roughly 30 in-game seasons (~7 years). Every decision—taxing peasants, trading with merchants, upgrading castle defenses, managing feudal obligations—feeds into an interconnected economic simulation where all four core systems (Treasury, People, Military, Faith) depend on each other. The game uses a hybrid BitLife/Reigns model: text-based scenarios with 2–3 branching choices, four always-visible stat meters, and a scrolling chronicle that records the player's reign as a narrative autobiography. Historical pop-ups ("Scribe's Notes") appear organically during gameplay, connecting each decision to real medieval history. A full playthrough takes 30–45 minutes, with high replayability driven by randomized events, multiple endings, and an achievement system.

---

## 1. Educational objectives and standards alignment

**Primary learning objectives** (tied to 6th grade World History and the C3 Social Studies Framework):

1. **Feudal economic systems**: Students experience how medieval taxation, trade, and labor worked—not by reading about it, but by making decisions that succeed or fail based on these principles. Understanding supply and demand, scarcity, and trade-offs becomes the key to winning.

2. **The feudal social hierarchy**: Players directly manage relationships with serfs, freemen, knights, clergy, and merchants, learning the reciprocal obligations at each level through gameplay consequences. Over-taxing peasants causes revolt; neglecting knights costs military strength.

3. **Interconnected systems thinking**: The circular dependency of economy → military → people → economy teaches students that medieval society was a web of mutual obligations, not a simple top-down hierarchy.

4. **Historical causation and consequence**: Random events drawn from real history (the Great Famine of 1315, the Black Death, poll tax revolts) demonstrate how environmental, economic, and political factors combined to reshape medieval Europe.

5. **Economic vocabulary in context**: Terms like tithe, scutage, surplus, deficit, tariff, guild, demesne, and fief appear naturally in gameplay text, with meaning clarified through context and optional Scribe's Notes.

**Standards alignment**: Common Core ELA (analyzing cause-effect in informational text), C3 Framework (economic decision-making, historical thinking, evaluating trade-offs), and typical 6th grade World History curriculum coverage of feudalism, medieval trade, guilds, and the manorial system.

---

## 2. Core design philosophy: learning IS the mechanic

The central design principle is stolen from DragonBox and Kerbal Space Program: **understanding medieval economics should be the strategy that wins the game.** The game never quizzes students. Instead, the mechanics *are* the history. If a player over-taxes peasants beyond what the manor can sustain, loyalty collapses and a revolt fires—not because the game is lecturing about taxation, but because the system models how real feudal economics worked. The historical pop-ups then connect the dots: "In 1381, King Richard II imposed a poll tax of 12 pence per person—three times the previous rate. The result was the Peasants' Revolt."

**Design pillars**:

- **Trade-off decisions, never obvious ones.** Every choice offers competing benefits. Feed the poor OR strengthen the walls. Both are good; you cannot afford both. This follows the Reigns model where balance is survival.
- **Visible consequences, delayed effects.** Each decision shows immediate stat changes (animated bars moving up/down) but some effects cascade across multiple turns. Skipping harvest investment in autumn means starvation in winter—two turns later.
- **Failure is informative, not punishing.** When a reign ends, the game shows a "Chronicle of Your Reign" summarizing decisions and outcomes, framed as a historical record. Multiple failure modes teach different lessons: bankruptcy teaches fiscal responsibility, rebellion teaches social balance, military defeat teaches defense planning.
- **Scaffolded complexity.** Systems unlock gradually across the first 8 turns. Players never face all four systems at once until they've learned each one individually.
- **Humor and personality.** Named NPCs with distinct voices—a shrewd reeve, a pompous bishop, a cunning merchant—keep the tone engaging without undermining historical accuracy. Age-appropriate dark humor follows the BitLife/Reigns tradition.

---

## 3. Resource systems: four interconnected meters

The game tracks **four core resources** displayed as always-visible colored bars at the top of the screen, inspired directly by Reigns' four-pillar system. If **any meter hits zero, the game ends** with a thematic failure. If any meter maxes out at 100, it also triggers a crisis (too much military power draws the king's suspicion; too much treasury attracts bandits).

| Meter | Color | Icon | Represents | Failure at 0 | Crisis at 100 |
|-------|-------|------|-----------|---------------|----------------|
| **Treasury** | Gold | Coin | Wealth, stored goods, coins | Bankruptcy: cannot pay debts, castle seized | King demands massive "aid"; bandits raid treasury |
| **People** | Green | Wheat sheaf | Peasant loyalty, labor supply, population | Peasant revolt: serfs abandon fields or storm the castle | Population boom: not enough land, food shortages |
| **Military** | Red | Shield | Castle defense, garrison strength, knight loyalty | Defenseless: raiders or rivals seize your lands | King suspects treachery; orders you to disband or march to war |
| **Faith** | Purple | Cross | Church relations, spiritual authority, community morale | Excommunication: no one will trade with or serve you | Church demands control of your courts and treasury |

**Critical design note**: The "death at both extremes" mechanic (borrowed directly from Reigns) is essential for 6th graders. It prevents a dominant strategy of simply maximizing everything and forces genuine trade-off thinking. You cannot be the richest, most-loved, strongest, and most pious lord simultaneously—just as real medieval rulers faced impossible balancing acts.

**Secondary tracked values** (visible on a details panel, one tap deeper):

- **Season** (Spring/Summer/Autumn/Winter) — affects available actions and events
- **Year** (starting Year 1 of your reign)
- **Castle Level** (1–4, corresponding to historical progression)
- **Population** (number of families on your manor, affects labor/tax income)
- **Harvest Quality** (Good/Average/Poor/Failed — determined by player choices + random weather)

---

## 4. Turn structure and game flow

**Each turn represents one season.** Four seasons make one year. A standard game lasts **28–32 turns** (7–8 in-game years), providing the targeted 30–45 minute play session at roughly 60–90 seconds per turn.

### What happens each turn

**Phase 1 — Seasonal Report (5–10 seconds)**
The Steward delivers a brief narrative status update reflecting the current season. Example: *"Autumn, Year 3. The harvest is underway—your reeve reports the wheat fields are yielding well, but early frost threatens the northern strips. Your treasury holds 47 silver marks. 28 families work your lands."*

This report is the "chronicle entry" that scrolls into the BitLife-style narrative log, building the story of the reign.

**Phase 2 — Seasonal Action (player choice, 15–30 seconds)**
The player selects **one major action** from a seasonally appropriate menu. Available actions change based on the season, modeling the real medieval agricultural calendar:

| Season | Available Actions | Historical Basis |
|--------|------------------|------------------|
| **Spring** | Sow crops (choose type), recruit workers, open trade negotiations, hold manorial court | Plowing and sowing oats/barley/peas; lambing season |
| **Summer** | Harvest hay, train militia, hold market fair, build/upgrade castle | Haymaking, shearing, military campaigns launched in summer |
| **Autumn** | Harvest grain, collect rents/taxes, trade surplus at fair, slaughter livestock for winter | Primary harvest; Michaelmas (Sept 29) rent collection; livestock culling |
| **Winter** | Repair tools/buildings, negotiate with merchants, hold feast, resolve disputes in court | Indoor crafts; social/political maneuvering; reduced agricultural activity |

**Phase 3 — Random Event (30–60 seconds)**
After the player's chosen action resolves, a **random event card** appears. These are drawn from a contextual deck (like Reigns' adaptive card system)—war-related cards appear more often during military tensions; famine cards during poor harvests; trade cards during market seasons. Each event presents a scenario with **2–3 response options**, all designed as trade-off decisions.

Example random event (Autumn):
> *Your reeve reports that several families are hiding grain to avoid paying their tithe to the church. Father Edmund demands you enforce collection.*
>
> **[A] Enforce the tithe strictly** → Faith +10, People -8, Treasury +3 (the grain goes to the Church, but some families go hungry)
> **[B] Look the other way** → People +5, Faith -12 (peasants are grateful, but the bishop is furious)
> **[C] Split the difference: collect half** → Faith -4, People -2, Treasury +1 (neither side is happy, but nobody starves or revolts)

**Phase 4 — Consequence Resolution (5–10 seconds)**
All stat changes animate visibly. The scrolling chronicle records what happened. If any stat crosses a threshold (below 15 or above 85), a warning appears: *"Your people grow restless..."* or *"The bishop notes your piety with approval—and ambition."*

**Phase 5 — Educational Pop-up (optional, 10–15 seconds)**
A "Scribe's Note" appears in a parchment-styled modal, connecting the turn's events to real history. These are **dismissible with one tap** and **never block gameplay**. Example after the tithe event above:

> 📜 **SCRIBE'S NOTE: The Tithe**
> *In medieval England, every person owed one-tenth (10%) of everything they produced to the Church. This was called a tithe. Grain was stored in huge tithe barns—about 200 of these barns still survive in England today! Refusing to pay your tithe could get you excommunicated, meaning no one was allowed to talk to you, sell to you, or even bury you in the churchyard.*

---

## 5. Scaffolded tutorial: "The Inheritance"

The game opens with a **guided tutorial sequence** lasting 4–6 turns that introduces systems one at a time while establishing the narrative premise.

**Turn 0 — Prologue (narrative only, no choices)**
> *Your father, Lord Aldric of Thornwall, has died. You inherit his manor: a modest castle, 20 peasant families, a church, and debts. The steward hands you the estate ledger. "Your father was a good man," he says, "but not always a wise one with coin." Your reign begins now.*

Starting stats: Treasury 40, People 50, Military 30, Faith 45. The player begins slightly below the midpoint in most areas—enough to survive but with no margin for error.

**Turns 1–2 (Spring/Summer Year 1): Treasury + People introduced**
Only Treasury and People meters are active. Decisions involve basic taxation and labor allocation. The game teaches the core loop: make a choice → see stats change → read the consequence.

Sample Turn 1 decision: *"Spring planting approaches. Your reeve asks how to divide labor between the lord's demesne and the peasants' own strips."*
- [A] Prioritize the demesne (Treasury +8, People -6)
- [B] Let peasants tend their own fields first (People +6, Treasury -4)
- [C] Split evenly (Treasury +2, People +2)

**📜 SCRIBE'S NOTE**: *On a real medieval manor, serfs owed 2–3 days of work per week on the lord's land (called "week-work"). The lord's crops and the serfs' crops were ready at the same time—and the lord's always came first. Imagine if your teacher assigned you homework, but also made you do THEIR homework before your own!*

**Turns 3–4 (Autumn/Winter Year 1): Military introduced**
A messenger arrives: *"Raiders have been spotted in the neighboring county. Your castle's wooden palisade won't stop a determined attack."* The Military meter activates. The player must now balance three systems.

**Turns 5–6 (Spring/Summer Year 2): Faith introduced**
The bishop visits: *"Your chapel is falling apart, my lord. The people need spiritual guidance—and the Church needs its tithes."* The Faith meter activates. All four systems are now live.

**Turns 7–8: First major crisis**
A multi-turn event forces the player to use all four systems together. Possible scenarios: a bandit siege requiring military + treasury decisions while keeping people fed and the church supportive; a drought threatening harvest requiring trade + faith + people management.

From Turn 9 onward, the game runs at full complexity with all systems interconnected.

---

## 6. Core mechanic 1 — Tax collection and treasury management

### How it works in the game

Treasury represents the lord's accumulated wealth in **silver marks** (a simplified version of the real medieval system where 1 mark = 13 shillings 4 pence). The player collects income and pays expenses each year, with the balance affecting the Treasury meter.

**Income sources** (each modeled on real medieval practice):

- **Rents from peasant holdings** — Base income each autumn at Michaelmas. Amount scales with Population and Harvest Quality. Payment can be in coin, goods, or labor (player chooses emphasis, affecting People satisfaction differently).
- **Demesne production** — The lord's own fields, worked by serf labor. Higher labor allocation = higher production but lower People satisfaction.
- **Market tolls and fees** — Income from the castle market. Scales with Trade activity and Castle Level.
- **Manorial court fines** — Income from justice events. Harsh justice = more fines but lower People.
- **Mill and oven fees (banalities)** — Passive income from the lord's monopoly on grain grinding and bread baking. Historically one of the most resented feudal obligations.

**Expenses** (automatic deductions):

- **Castle maintenance** — Scales with Castle Level. A motte-and-bailey costs ~2 marks/year; a concentric castle costs ~15 marks/year. Skipping maintenance risks structural failure events.
- **Garrison pay** — Soldiers need wages. Higher Military = higher costs.
- **Feast obligations** — Lords were expected to hold seasonal feasts. Skipping them costs People and Faith.
- **Church obligations** — Minimum tithe and chapel maintenance.

**Tax decision events** appear 2–3 times per in-game year. Each models a real medieval tax type:

| Tax Type | Game Mechanic | Historical Basis |
|----------|--------------|-------------------|
| **Tallage** | Emergency tax on all households; high income, high People cost | Arbitrary tax on royal domains; deeply unpopular; abolished 1340 |
| **Scutage** | Collect money from knights instead of military service; Treasury + but Military − | "Shield tax" — payments in lieu of fighting; abuse led to Magna Carta |
| **Aids** | One-time special levy for specific events (son's knighting, daughter's marriage) | Feudal aids were the only "legitimate" special taxes |
| **Market taxes** | Tax on merchants at your fair; Treasury + but Trade activity − | Market tolls required royal charter; over-taxation drove merchants away |
| **Heriot** | Collect a family's best animal when a serf dies; small Treasury +, People − | The death tax was one of the most hated feudal obligations |

### Historical accuracy in the treasury system

The game models the real transition from a barter/labor economy to a money economy. In early turns (Years 1–3), most income arrives as **goods and labor**. As the player develops trade, income shifts toward **coin**, unlocking more flexible spending options. This mirrors the actual 12th–13th century monetization of the English economy.

**Scribe's Note examples for this system:**
- *"Medieval tax collectors used tally sticks—notched wooden sticks split in half, with one half for each party as a receipt. This system was used in England until 1782—over 600 years!"*
- *"The Exchequer was the king's treasury department. It was named after the checkered cloth on the giant accounting table where officials moved counters to calculate taxes—like a board game that determined the kingdom's finances!"*
- *"King John pushed scutage rates to 3 marks per knight's fee—without even fighting a war. The barons were so angry they forced him to sign the Magna Carta in 1215, which declared: 'No scutage shall be imposed in our kingdom without the general consent of our kingdom.'"*

---

## 7. Core mechanic 2 — Trading and bartering with merchants

### How it works in the game

**Trade operates through merchant encounter events and seasonal market fairs.** The player does not manage a complex trade interface—instead, trade happens through narrative decisions that model supply, demand, and the "just price" concept.

**The Market Fair** (available in Summer and Autumn):
If the player chooses "Hold a Market Fair" as their seasonal action, a **3-card trade sequence** plays out:

1. **Merchant Arrival**: A named merchant arrives with specific goods and a personality. *"Guillaume the Flemish wool buyer arrives at your fair. He's traveled three weeks from Bruges and his purse is heavy."*
2. **Trade Offer**: The merchant proposes a deal with 2–3 options reflecting historical trade dynamics. *"Guillaume offers 8 marks for your entire wool clip. Your steward whispers that local buyers would pay only 5—but Guillaume demands exclusive rights for next year too."*
3. **Consequence**: The deal affects Treasury, future trade options, and potentially other systems (exclusive deals anger local merchants → guild trouble).

**Supply and demand** is modeled through a simple scarcity system. Goods the manor produces in surplus (based on player investment) sell well. Goods in shortage cost more to buy. After the Black Death event (if it fires), labor becomes scarce and wages spike—directly modeling the historical wage explosion that followed the plague.

**Common trade goods in the game** (with approximate values based on historical records):

| Good | Produces By | Value | Notes |
|------|------------|-------|-------|
| **Wool** | Sheep (requires pasture allocation) | 5–12 marks/clip | England's #1 export; Flemish buyers paid premium |
| **Grain** | Harvest (autumn) | 2–8 marks/surplus | Price varies wildly with harvest quality |
| **Salt** | Purchased from merchants | Expensive | The only food preservative; critical for winter |
| **Iron tools** | Purchased from smiths | 3–5 marks/set | Needed for farming and castle building |
| **Spices** (pepper, saffron) | Rare merchant events | 10–20 marks | Luxury goods; massive Faith and People boost for feasts |
| **Warhorses** | Special military merchants | 40–80 marks | Historically cost up to £80—a fortune |
| **Cloth** | Produced by weavers (if guild established) | 4–10 marks | Value-added product from raw wool |

**The Guild System** functions as a mid-game upgrade. If the player invests in establishing guilds (a castle upgrade), they unlock **value-added trade**: raw wool becomes finished cloth (worth 2x), grain becomes ale (worth 3x), iron ore becomes tools (worth 4x). However, guilds demand autonomy—fixed prices, regulated hours, quality standards—reducing the player's direct control over trade. This models the real tension between lords and guilds.

**Scribe's Note examples:**
- *"The Champagne Fairs in France were the medieval equivalent of Amazon—lasting up to 49 days, attracting merchants from all over Europe, and even pioneering early credit cards (called 'bills of exchange'). One fair alone traded Flemish cloth, English wool, Italian silk, German metal, and spices from Asia."*
- *"Medieval thinker Thomas Aquinas argued that every product had a 'just price'—a fair value that included costs and honest profit, but never exploited the buyer's desperation. Charging too much was considered a sin!"*
- *"A laborer in 1300 earned about 2 pennies per day. Two chickens cost 1 penny. A pig cost 24–36 pennies. But a warhorse? Up to 19,200 pennies. That's like someone today earning $100/day and needing to buy a $960,000 horse!"*

---

## 8. Core mechanic 3 — Managing the feudal hierarchy

### How it works in the game

The People meter represents the **combined loyalty, satisfaction, and labor capacity** of everyone on the manor. But behind the single bar, the game tracks three sub-populations that respond differently to decisions:

**Serfs/Villeins** (~75% of population): Bound to the land. Provide labor for farming, construction, and castle maintenance. Care most about: fair labor demands, food security, protection from violence, and merchet/heriot fees. Historical basis: serfs owed 2–3 days of week-work plus boon-work at harvest; couldn't leave, marry, or sell land without the lord's permission.

**Freemen/Merchants** (~15% of population): Pay money rents, run shops, work skilled trades. Care most about: fair market access, reasonable tolls, guild rights, and legal protections. Historical basis: freemen held land by money rent without labor obligations; merchants organized into guilds that controlled trade.

**Knights/Minor Nobles** (~10% of population): Provide military service. Care most about: land grants, honor, feasting, and not being asked to pay scutage too often. Historical basis: knights owed 40 days of military service per year in exchange for land grants (knight's fees).

**Key People-management events:**

**Labor Allocation** (Spring): The fundamental medieval tension. The player divides available labor between the lord's demesne and peasant strips. More demesne labor = more Treasury income but less People satisfaction. This models the real conflict where the lord's harvest and the serfs' harvest competed for the same labor at the same time.

**Manorial Court** (any season): The player holds court and adjudicates disputes. Each case presents a ruling decision:
> *"Two families dispute the boundary between their strips. Old Thomas claims Edmund's ox trampled his bean plants. Edmund says Thomas moved the boundary stones."*
> - [A] Rule for Thomas (People: Thomas's family +, Edmund's family −)
> - [B] Rule for Edmund (opposite)
> - [C] Fine them both for wasting the court's time (Treasury +2, both families −)

**📜 SCRIBE'S NOTE**: *"Manorial courts were held regularly and EVERYONE had to attend—if you didn't show up, you got fined! The court handled everything from land disputes to catching people who brewed bad ale. Men were organized into groups of 10 called 'tithings,' and if one member committed a crime, the others were responsible for catching him."*

**Merchet and Heriot events**: When a serf wants to marry or a family head dies, the lord collects traditional fees. Waiving these fees costs Treasury but boosts People. Enforcing them does the opposite. These events teach students about the specific economic tools lords used to control their serfs.

**The Freedom Question** (late-game event): A serf family petitions for their freedom, offering a lump sum of money. Granting it sets a precedent (other serfs demand freedom too, reducing labor supply). Refusing it risks unrest. This models the real post-plague dynamic where serfs increasingly bought or negotiated their freedom.

**Population growth/decline**: Population changes based on food supply, disease events, and migration. After the Black Death event (if triggered), population drops by 30–50%, creating a **labor crisis** where the player must either raise wages (Treasury cost), restrict movement (People cost), or adapt to a smaller workforce. This directly models the historical impact of the plague on feudal economics.

---

## 9. Core mechanic 4 — Military defense and castle upgrades

### Castle upgrade tree

The castle progresses through four historical levels, each unlocking new defensive capabilities and economic benefits but requiring significant Treasury investment and construction time (multiple turns):

**Level 1: Motte-and-Bailey** (starting castle)
- Wooden palisade on an earth mound with a courtyard
- Defense rating: 20. Can repel bandit raids but not organized attacks.
- Cost: Already built (inherited). Maintenance: 2 marks/year.
- Historical note: William the Conqueror built dozens of these in months after 1066. A motte could be raised by ~50 workers in 40 days.

**Level 2: Stone Keep** (available from Year 2)
- Massive rectangular stone tower with walls 4–6 meters thick
- Defense rating: 50. Can withstand minor sieges.
- Cost: 15 marks + 3 turns of construction labor (People cost during building). Maintenance: 5 marks/year.
- Unlocks: Secure treasury room (protects against theft events), market space (increases trade income).
- Historical note: The White Tower in London took ~20 years to build and used limestone shipped from Normandy.

**Level 3: Curtain Wall Castle** (available from Year 4)
- Stone walls with round towers, gatehouse with portcullis, moat
- Defense rating: 75. Can withstand major sieges for multiple turns.
- Cost: 35 marks + 5 turns of construction. Maintenance: 10 marks/year.
- Unlocks: Murder holes (bonus in siege defense), market town charter (passive trade income), garrison quarters (Military capacity increases).
- Historical note: Dover Castle's expansion under Henry II cost ~£6,440 over 8–10 years.

**Level 4: Concentric Castle** (available from Year 6)
- Two rings of walls, multiple gatehouses, advanced fortifications
- Defense rating: 95. Nearly impregnable without prolonged siege.
- Cost: 60 marks + 8 turns of construction. Maintenance: 15 marks/year.
- Unlocks: All defensive features, royal recognition (Faith + Military bonuses), maximum trade capacity.
- Historical note: Edward I's Caernarfon Castle cost £20,000–£25,000 and took 47 years. Its King's Gate alone had 2 drawbridges, 6 portcullises, and 5 doors.

**Individual defensive upgrades** (can be purchased between castle levels):
- Arrow slits (+5 defense, 3 marks)
- Drawbridge (+8 defense, 5 marks)
- Boiling water stations (+6 defense, 2 marks) — *📜 "Boiling OIL is mostly a myth! Oil was too expensive. Defenders actually poured boiling water, hot sand, or quicklime through murder holes."*
- Sally port (+10 defense during sieges, allows counterattack option, 4 marks)

### Military events

**Siege events** are multi-turn narrative sequences. When an attacking force arrives, the player faces 3–5 consecutive decisions across multiple turns:

> **Turn 1**: *"A rival lord's army camps outside your walls. 200 men, with a siege tower under construction. Your garrison of 40 watches from the battlements."*
> - [A] Negotiate (send a messenger to discuss terms — Risk: they refuse)
> - [B] Launch a sally from the postern gate (Military gamble — high risk, high reward)
> - [C] Hunker down and wait (Safe but costly — food supplies drain each turn)

> **Turn 2**: *"The siege continues. Your food stores have dropped. The attackers have completed their siege tower and are bringing up a battering ram."*
> - [A] Target the siege tower with your archers (requires Military > 40)
> - [B] Offer a ransom to lift the siege (Treasury −20)
> - [C] Send a messenger to the king for help (requires Faith > 50 — the king listens to lords the Church supports)

**📜 SCRIBE'S NOTE**: *"The longest siege in medieval England was Kenilworth Castle in 1266—it lasted 172 days (nearly 6 months)! The besieging army needed food from over 20 counties. The Sheriff of London even sent a whale to feed the king's troops. When the defenders finally surrendered, they had food for only 2 more days."*

**Army management** uses the feudal levy system. The player's Military meter reflects:
- **Garrison soldiers** (permanent, paid from Treasury)
- **Feudal levies** (free for 40 days, then they go home — historically accurate)
- **Mercenaries** (expensive but available year-round; dangerous if not paid — they may turn on you)

Scutage events let the player choose: demand knights serve in person (Military + but People −) or accept money instead (Treasury + but Military −).

---

## 10. How all four systems interconnect

The game's central design achievement is the **circular dependency** between all four systems. No system can be managed in isolation:

```
         TREASURY ←→ MILITARY
            ↕              ↕
         PEOPLE  ←→  FAITH
```

**Treasury → Military**: Soldiers need pay. Castle upgrades cost money. No treasury = no defense.

**Military → People**: A strong garrison protects peasants from raids. But demanding feudal levies pulls farmers from their fields during harvest, reducing food production.

**People → Treasury**: Peasants generate all economic production—farming, crafting, market activity. Low population or low loyalty = low income.

**Faith → People**: The Church provides community structure, festivals, and moral authority. High Faith boosts People through feast days and spiritual comfort. Low Faith means excommunication threats that terrify the population.

**Treasury → Faith**: Church buildings, donations, and tithe compliance all cost money. But the Church also provides economic services (monastery trade, tithe barns as grain storage, pilgrimage income).

**Military → Treasury**: Castle tolls and control of trade routes generate income. But military spending is the largest single expense.

**Faith → Military**: Crusade events require both Faith and Military. The Church can bless or condemn military actions, affecting morale.

**People → Military**: Soldiers come from the population. Feudal levies are peasants with weapons. A population crash (plague, famine) means fewer available troops.

**Key interconnection events that force multi-system thinking:**

| Event | Systems Involved | The Dilemma |
|-------|-----------------|-------------|
| **Crusade Call** | All four | The king demands troops and money for a crusade. Refusing angers the king (Military −) and the Church (Faith −). Accepting drains Treasury and removes workers from fields (People −). |
| **Famine** | Treasury + People + Faith | Failed harvest. Buy grain from merchants (Treasury −) or let people starve (People −−)? The Church demands you share your stores (Faith pressure). |
| **Bishop demands a cathedral** | Treasury + Faith + People | Building it costs enormous Treasury and People (labor). Refusing costs Faith. But completing it boosts all three permanently. |
| **Peasant revolt** | All four | Over-taxation + low food + harsh justice = revolt. Military must suppress it (People −−) or you negotiate concessions (Treasury − + Military −). The Church may mediate (Faith influence). |
| **Plague arrives** | All four | Population crashes. Labor shortages spike wages (Treasury −). Military weakens. Church gains influence through caring for sick. Player must decide: restrict movement (People −) or let serfs leave for better wages elsewhere? |

---

## 11. Event system design

Events are the primary content delivery mechanism, driving both gameplay and education. The game uses a **weighted deck system** inspired by Reigns' adaptive card design.

### Event categories

**Seasonal Events** (guaranteed, 1 per turn): Tied to the agricultural calendar. Spring planting, summer haymaking, autumn harvest, winter preparations. These form the backbone of gameplay rhythm and teach the medieval seasonal cycle.

**Random Events** (1 per turn, drawn from weighted deck): The deck composition shifts based on game state. During military tensions, more military cards appear. During trade-heavy periods, more merchant encounters surface. The deck contains approximately 120 unique event cards across these categories:

- **Economic events** (~35 cards): Merchant arrivals, price fluctuations, guild disputes, market opportunities, debased coinage, trade route disruptions
- **Social events** (~30 cards): Peasant petitions, marriage requests, inheritance disputes, feast obligations, serf freedom requests, crime and punishment
- **Military events** (~25 cards): Raids, siege threats, mercenary offers, arms purchases, border disputes, royal military summons
- **Religious events** (~20 cards): Tithe disputes, pilgrim arrivals, bishop visits, monastery trade, saint's day festivals, heresy accusations
- **Disaster events** (~10 cards): Plague, famine, flood, fire, cattle murrain, crop blight

**Historical Milestone Events** (scripted, triggered by specific years or conditions):
These are fixed events that fire at predetermined points to ensure key historical content is covered regardless of the player's choices:

| Trigger | Event | Educational Content |
|---------|-------|-------------------|
| Year 2, Autumn | **The Reeve's Account** | How medieval accounting worked (tally sticks, the Exchequer) |
| Year 3, Spring | **The Guild Charter** | How guilds organized, the 7-year apprenticeship, masterpiece requirement |
| Year 4, Summer | **The King's Summons** | Feudal military obligations, scutage, the 40-day service limit |
| Year 5, Any | **The Great Fair** | Long-distance trade, the Champagne Fairs, bills of exchange |
| Year 6, Winter | **The Charter of Rights** | The Magna Carta's economic provisions, limits on royal taxation |
| Conditional | **The Great Mortality** | Black Death mechanics, population collapse, labor market transformation |
| Conditional | **The Poll Tax** | Flat vs. progressive taxation, the Peasants' Revolt of 1381 |

### Scribe's Notes library (50+ historical pop-ups)

Each pop-up is 2–4 sentences, written at a 6th-grade reading level, connecting a game event to real history. These are organized by system:

**Treasury notes** (12): Tally sticks, the Exchequer, Danegeld, scutage, Magna Carta taxation clauses, currency systems (the penny), debasement, the Saladin tithe, poll taxes, feudal aids, reliefs, amercements.

**Trade notes** (10): Champagne Fairs, guild structure, just price concept, wool trade, spice trade, bartering vs. coin, market charters, merchant guilds vs. craft guilds, usury prohibition, bills of exchange.

**People notes** (12): Feudal hierarchy, homage ceremony, week-work and boon-work, the manor system, three-field rotation, strip farming, banalities (suit of mill), serfdom rules, merchet and heriot, the year-and-a-day rule, peasant diet, Peasants' Revolt.

**Military notes** (10): Motte-and-bailey construction, siege warfare, knight's equipment cost, feudal levy system, 40-day service obligation, chevauchée raiding, famous sieges, castle defensive features, mercenary companies, Château Gaillard.

**Faith notes** (8): Tithing, tithe barns, monastery economics, pilgrimage trade, Church prohibition of usury, trial by ordeal, excommunication, cathedral construction economics.

---

## 12. Win, lose, and legacy conditions

### Loss conditions (any triggers game over)

| Condition | Narrative | Lesson Taught |
|-----------|-----------|---------------|
| **Treasury = 0** | "Your debts consume everything. The king seizes your lands for unpaid obligations." | Fiscal responsibility; revenue must exceed expenses |
| **People = 0** | "Your peasants have abandoned your manor—or worse, stormed your gates." | Social contract; lords owed protection and fairness in exchange for service |
| **Military = 0** | "With no defenders, raiders sweep through your lands unopposed." | Defense requires investment; military neglect invites aggression |
| **Faith = 0** | "The bishop excommunicates you. No priest will serve your chapel, no merchant will trade with you, no vassal will honor your commands." | The Church's enormous power over medieval life |
| **Any meter = 100** | Crisis event fires (king's suspicion, overpopulation famine, Church power grab, bandit magnet) | Balance and moderation; excess is as dangerous as deficit |

### Victory conditions (multiple paths, all require surviving 28+ turns)

**The Prosperous Lord** (Treasury-focused): End the game with Treasury > 70, all other meters > 30. Your trade networks and efficient taxation have built lasting wealth. *"Your manor becomes a model of prosperity. Merchants travel far to trade at your famous fair."*

**The Beloved Lord** (People-focused): End with People > 70, all others > 30. Your fair treatment of serfs and wise justice have earned deep loyalty. *"Songs are sung about your fairness. Freemen from distant manors petition to settle on your lands."*

**The Iron Lord** (Military-focused): End with Military > 70, all others > 30. Your impregnable castle and feared garrison keep the peace. *"No raider dares approach your walls. The king himself asks for your counsel on matters of defense."*

**The Pious Lord** (Faith-focused): End with Faith > 70, all others > 30. Your devotion and church-building have made your manor a spiritual center. *"Pilgrims flock to your chapel. The bishop names your parish as an example for all of Christendom."*

**The Balanced Lord** (hardest): End with ALL meters between 40–60. True balance across all obligations. *"Historians will remember you as the rarest of rulers—one who kept every oath, paid every debt, and served every master without failing any."*

### Legacy screen

Every game ends with a "Chronicle of Your Reign" screen showing:
- Total turns survived and years ruled
- Key decisions and their outcomes (pulled from the scrolling log)
- Final state of all four meters with historical comparison (*"Your treasury of 55 marks rivaled a minor baron's annual income of £200–£500"*)
- Achievement ribbons earned (see below)
- A discussion prompt for classroom use: *"Which decisions had the biggest long-term consequences? What would you do differently?"*

---

## 13. Achievement system and replayability

Following BitLife's ribbon system, players earn **medieval-themed achievements** that encourage different playstyles across multiple sessions:

- 🏰 **The Builder**: Reach Castle Level 4
- ⚔️ **The Defender**: Successfully repel 3 sieges
- 💰 **The Merchant King**: Complete 10 trade deals
- 📜 **The Lawgiver**: Hold 8 manorial courts with fair rulings
- 🌾 **The Good Harvest**: Achieve 3 consecutive good harvests
- ⛪ **The Pious**: Build a cathedral
- 🗡️ **The Crusader**: Answer the Crusade call and return alive
- 🤝 **The Liberator**: Free 5 serf families
- 📖 **The Scholar**: Read all 50+ Scribe's Notes
- 💀 **The Survivor**: Survive the Black Death with all meters above 20
- 👑 **The Balanced Lord**: Win with all meters between 40–60
- 🔥 **The Quick Death**: Lose within 4 turns (teaches the tutorial is important)

These encourage **at least 3–4 playthroughs**, each exploring different strategies and encountering different historical content.

---

## 14. UI/UX design for the BitLife-style interface

### Screen layout

The interface follows a **single-screen, scroll-based design** optimized for tablets (the most common classroom device) and phones:

**Top bar (always visible)**: Four color-coded resource meters with icons. Each bar fills/depletes with smooth animation after decisions. Small directional arrows flash briefly after changes (↑ green for gains, ↓ red for losses). Tapping any meter opens a detail panel showing sub-values and recent change history.

**Center area (scrolling chronicle)**: The main content area is a scrolling parchment-textured log that records every event, decision, and consequence in narrative form—the player's autobiography as a medieval lord. New entries appear at the top with a brief scroll animation. Old entries remain accessible by scrolling down. Text uses a clean serif font at readable size (16pt minimum).

**Decision cards (modal overlay)**: When a choice is required, a parchment-styled card slides up from the bottom with scenario text and 2–3 response buttons. Each button shows **predicted meter effects as small icons** (coin ↑, wheat ↓, etc.) without exact numbers—the player knows which systems are affected but must judge magnitude from context. This partial-information approach mirrors Reigns' design and encourages strategic thinking.

**Bottom navigation bar**: Three buttons—**Actions** (seasonal menu), **Castle** (upgrade tree), **Chronicle** (full history). The "Next Season" button is prominent and centered, functioning like BitLife's "Age" button as the core interaction that advances the game.

**Scribe's Notes**: Appear as a scroll-styled tooltip that slides in from the side, with a small "📜" icon and parchment background. One-tap dismiss. A small counter tracks how many notes the player has read (for the Scholar achievement).

### Visual aesthetic

**Medieval manuscript style**: Parchment textures, illuminated initial capitals on section headers, simple line-art illustrations (woodcut style) for events. Character portraits are simple but distinctive—the reeve has a weathered face and leather cap; the bishop wears ornate robes; the merchant has a fur-trimmed hood. No complex animation or 3D graphics—the focus is text and decisions, matching BitLife's minimalist approach.

**Color palette**: Warm browns and creams (parchment), with the four meter colors providing visual anchors: Gold (Treasury), Forest Green (People), Crimson (Military), Royal Purple (Faith).

**Accessibility**: High contrast text, minimum 16pt font, colorblind-friendly meter designs (each meter has both a unique color AND a unique icon shape), text-to-speech compatible for all narrative content.

---

## 15. Difficulty balancing for 6th graders

### Cognitive load management

**The core challenge**: 11–12 year olds are transitioning from concrete to abstract operational thinking. They can handle systems with **4 variables** and cause-effect chains of **2–3 steps**, but longer chains need visual reinforcement.

**Design solutions**:
- **Maximum 4 core stats** (matching Reigns' proven sweet spot and working memory capacity)
- **Maximum 3 choices per decision** (reducing decision paralysis)
- **Preview system** showing affected meters before committing (reducing blind decisions)
- **Warning system** at threshold values (meters flash when below 15 or above 85)
- **Advisor hints** from the Steward for the first 8 turns: *"Your steward whispers: 'If we tax too heavily after a poor harvest, the peasants may refuse to work, my lord.'"* Hints fade after the tutorial period.
- **Seasonal structure** provides natural rhythm and predictability within the randomness

### Difficulty modes

**Apprentice Lord** (Easy): Starting stats at 50/50/50/50. Wider safe zone (meters fail at 0 and 100 only). Advisor hints throughout. Fewer negative random events. Recommended for first playthrough.

**Lord of the Manor** (Standard): Starting stats at 40/50/30/45 (asymmetric, requiring immediate strategy). Standard fail zones. Hints during tutorial only. Full event deck.

**The Iron Crown** (Hard): Starting stats at 30/40/25/35. Narrower safe zone (meters fail below 5 or above 95). No hints. More frequent negative events. Historical difficulty: unlocks the most challenging and historically accurate events (the Great Famine, the Peasants' Revolt, multiple plague waves).

---

## 16. Feature priority and development roadmap

### Priority 1 — Minimum viable game (core experience)

- Four resource meters with visual feedback and interconnected effects
- Turn structure with seasonal cycling and "Next Season" button
- 40 core event cards (10 per system) with branching consequences
- Basic castle upgrade path (4 levels)
- Scrolling chronicle log recording all events and decisions
- 5 historical milestone events (scripted)
- Win/lose conditions with Legacy Screen
- 20 Scribe's Notes covering essential medieval history
- Apprentice difficulty mode
- Tutorial sequence ("The Inheritance," 6 turns)

### Priority 2 — Full educational experience

- Complete 120-card event deck with weighted drawing system
- All 50+ Scribe's Notes
- Achievement/ribbon system (12 achievements)
- Three difficulty modes
- Individual castle defensive upgrades (arrow slits, drawbridge, etc.)
- Guild system as mid-game upgrade
- Named NPC advisors with personalities (Steward, Reeve, Bishop, Captain, Merchant)
- Multiple victory paths with distinct endings
- Classroom discussion prompts on Legacy Screen
- Teacher dashboard showing which historical content each student encountered

### Priority 3 — Enhanced engagement

- Adaptive card deck system (event frequency shifts with game state)
- Dynasty mode (after death, play as your heir with inherited consequences)
- Seasonal art variations (spring blossoms, winter snow on the parchment)
- Sound design (medieval ambient audio, decision chimes)
- Multiplayer comparison (students can compare reign chronicles)
- Extended event chains (multi-turn narrative arcs: the Crusade, the Plague Years, the Great Revolt)
- Character customization (male/female, name selection, starting traits)
- Expanded trade system with regional price variations

---

## Conclusion: why this design works

The Lord's Ledger succeeds as both a game and a teaching tool because it resolves the central tension of educational game design: **the history IS the strategy.** A student who understands that over-taxation provokes revolt, that the Church controlled medieval life through excommunication threats, and that plague-driven labor shortages transformed the feudal economy will *outplay* a student who does not. The game rewards historical understanding with longer reigns, more achievements, and better outcomes—without ever pausing to quiz.

The BitLife/Reigns hybrid model is ideal for this audience. Text-based decisions require literacy engagement. The four-meter balance system creates genuine strategic tension while remaining visually simple. The seasonal turn structure teaches the agricultural rhythm that governed medieval life. And the Scribe's Notes system delivers historical content at the exact moment it's relevant—when a student has just experienced the economic pressure that caused the Peasants' Revolt, they are primed to learn that it actually happened.

Three design choices deserve emphasis. First, **death at both extremes** prevents dominant strategies and forces the balanced thinking that actual medieval governance demanded. Second, **scaffolded system introduction** across 8 turns means no student faces overwhelming complexity on turn one. Third, **the chronicle as autobiography** transforms a strategy game into a personal narrative—students don't just manage a kingdom, they tell the story of a lord whose decisions echoed through history. That story, more than any textbook, is what they will remember.