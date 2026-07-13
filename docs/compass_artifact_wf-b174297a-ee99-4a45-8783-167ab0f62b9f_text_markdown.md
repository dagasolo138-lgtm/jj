# The Lord's Ledger: Expanded Design Addendum

**This addendum transforms The Lord's Ledger from a medieval resource-management game into a systems-thinking engine that teaches 6th graders how feudal economics actually worked — through failure, discovery, empathy, and invention.** Every mechanic below is grounded in both game design research and medieval historical evidence. The five sections address causal failure chains, hidden strategy paths, perspective-flipping events, thematic unfairness mechanics, and PBL integration with a Middle Ages Shark Tank competition. Together, they create a game where students don't just learn about the Middle Ages — they experience the logic of feudal life from the inside.

---

## 1. The Chronicle of Ruin: a causal chain death system

### Design philosophy: failure as the best teacher

The academic concept of **productive failure**, developed by Manu Kapur and validated across a meta-analysis of 12,000+ participants, demonstrates that students who struggle with challenging problems *before* receiving instruction significantly outperform students who receive instruction first — with an effect size of Cohen's d = 0.36 on conceptual understanding and transfer. The mechanism is straightforward: failing activates prior knowledge, reveals misconceptions, and creates a cognitive "readiness" for the lesson that follows. Singapore's Ministry of Education has adopted this framework for redesigning its pre-university math curriculum.

For The Lord's Ledger, this means **every death screen is a teaching moment**, not a punishment. The game's failure system should follow a 3–4 link causal chain architecture where each link traces to a player decision, and the death screen explicitly teaches the historical principle the player just demonstrated through failure.

### How readable failure works in proven games

The gold standard is **FTL: Faster Than Light**, where a fixed, known final boss gives players a clear benchmark to prepare against. Failure is always traceable: "I lost because I didn't upgrade shields in time." **Rimworld** adds a critical innovation — the Expectations System — which dynamically adjusts colonist expectations downward after disasters, preventing trivial mood effects from triggering unrecoverable spirals during recovery. **Frostpunk** uses visible dual meters (Hope and Discontent) so players always see their position at a glance, and creates readable chains through moral dilemmas with clear consequences: it is worse to promise something and fail than to never promise at all.

The key distinction between good and bad death spirals is **player agency**. As game design analyst Josh Bycer notes: "The losses you'll experience in the game will mostly come by your own choice screwing you, not from the unseen hand of the developer." Weather events, plagues, and raids can *trigger* crises in The Lord's Ledger, but whether the player prepared determines the outcome. Random events initiate; player decisions determine.

### The Chronicle death screen: showing the chain

After each failed run, the game displays a **Chronicle of Ruin** — a visual cause-and-effect flowchart tracing the 3–4 decisions that led to collapse. Each node shows:

- **The decision** ("Spring: You expanded fields instead of repairing the granary")
- **The consequence** ("Summer: The granary collapsed, losing 40% of stored grain")
- **The next link** ("Autumn: You couldn't feed your workers")
- **The final collapse** ("Winter: Half your peasants fled to Lord Ashford's lands. YOUR DOMAIN HAS FALLEN.")

Below the chain, a **Historian's Lesson** panel explicitly connects the failure to real medieval history: "This is similar to what happened across England during the Great Famine of 1315–1317, when years of overexpansion left no margin for error when the weather turned."

This two-part structure — failure visualization followed by historical consolidation — directly implements Kapur's productive failure framework: the struggle phase (gameplay) followed by the consolidation phase (the Historian's Lesson).

### Five historically grounded failure chains

Each chain mirrors a real medieval catastrophe, ensuring students learn different economic principles through different failures:

**Chain 1 — The Famine Spiral (Great Famine of 1315–1317)**
Overexpand population beyond carrying capacity → Bad weather reduces harvest → Livestock die without dried fodder (cattle herds fell 80% historically) → Famine triggers social breakdown → Domain collapses. Historical parallel: Edward II of England couldn't find bread at St Albans in August 1315.

**Chain 2 — The Debt Trap (Bardi-Peruzzi Banking Collapse, 1340s)**
Borrow heavily from merchants to fund war → War costs escalate → Lender keeps extending credit hoping for repayment (sunk cost trap) → Player defaults on debt → Credit network collapses → Trade halts → Economy crashes. Historical parallel: The Bardi and Peruzzi banks of Florence lent Edward III an estimated 1.5 million gold florins; his default in 1345 shattered "the entire financial market of Europe."

**Chain 3 — The Labor Crisis (Black Death aftermath, 1347–1381)**
Plague kills half the workforce → Severe labor shortage → Player must choose: offer better terms to surviving peasants (reducing income) or enforce old obligations → If enforce: peasant revolt (as in 1381) → If accommodate: reduced revenue and weakened authority. Either path fundamentally changes the lord's power. This teaches students that the feudal system's collapse wasn't a single event but an economic inevitability.

**Chain 4 — The Succession Crisis (The Anarchy, 1135–1153)**
Heir dies or is unfit → Barons choose sides based on self-interest → Private armies and unlicensed castles proliferate → Central authority erodes → Lawlessness devastates the local economy → 20 years of exhaustion. Historical parallel: chroniclers described Stephen's reign as a time when "Christ and his saints slept."

**Chain 5 — The Compound Catastrophe (14th-Century Mega-Cascade)**
This is the master template showing how multiple systems interconnect: agricultural exhaustion → war drains treasury → banking collapse destroys credit → plague arrives into a weakened society. Each domain failure makes the next worse. This chain teaches that **medieval systems were interconnected** in ways that amplify shocks.

### Safety valves that cost

Following Rimworld's design principle of preventing total hopelessness, the game offers emergency options during spirals — but each carries a steep price:

- The **Church offers emergency grain** (but takes a parcel of your land)
- A **neighboring lord offers alliance** (but demands fealty — reducing your independence)
- A **merchant offers a loan** (at crushing interest — teaching the Bardi-Peruzzi lesson firsthand)
- A **mysterious traveling monk** arrives with advice (but only if the player has invested in Church relations)

These options prevent frustration while teaching that medieval lords had choices, each with real costs. Research on checkpoint systems in educational games shows that reducing the *cost* of failure without removing failure itself produces "significantly lower frustration and higher perceived competence" while preserving learning.

---

## 2. Seven hidden strategy paths rooted in real medieval economics

### How discoverable depth works

The best strategy games create **emergent gameplay** — complex, unscripted player experiences arising from simple, flexible mechanics. Slay the Spire's core design philosophy captures this: "At least one half of a synergy pair needs to work fine on its own. The other half has to shift the puzzle itself — it can't just be stronger." Each card is serviceable alone but pivotal in combination. Players discover build archetypes (Strength builds, Poison builds, Block builds) through repeated play, not instruction.

Hades uses a tiered discovery system: basic boons are immediately useful (Layer 1), stacking same-god boons unlocks Legendary Boons (Layer 2), and combining specific boons from *two* different gods unlocks Duo Boons — the most powerful effects (Layer 3). Players learn organically which prerequisites enable which combinations. **The Lord's Ledger should mirror this tiered architecture**: basic economic decisions work fine alone, two-decision combinations yield modest bonuses, and three-to-four-decision chains unlock transformative "Duo Boon"-equivalent payoffs.

The psychological satisfaction of discovery is central. As one Slay the Spire analysis notes: "Fearful synergies emerging from your own creative energy. As you build deck upon deck, you create a purpose where once there was only randomness." For 6th graders, this translates to the thrill of realizing, "Wait — my sheep AND my Flemish marriage AND my fulling mill all work together!"

### The seven strategy paths

**Path 1: The Wool Baron**
*Starting investment:* Invest in sheep flocks on marginal grazing land.
*Chain:* Sheep farming → Sell raw wool to Flemish buyers → Build relationship with the Staple (crown-licensed wool export monopoly) → Invest in a fulling mill (water-powered cloth processing) → Shift from raw wool exports to domestic cloth production → Massive late-game wealth.
*Historical basis:* English wool was "the jewel in the realm" between the late 13th and late 15th centuries. Cistercian monasteries like Fountains Abbey ran **18,000 sheep**. England exported almost no cloth in 1347; by 1447, it exported 60,000 cloths per year. The tiny town of Lavenham, Suffolk became the 14th wealthiest settlement in England entirely from wool. The Lord Chancellor's seat in Parliament — the woolsack — still symbolizes this wealth.
*Synergy bonuses:* Sheep + Flemish marriage = premium wool prices (2x). Sheep + fulling mill = cloth production (3x value). Wool surplus + market charter = bypass London middlemen.

**Path 2: The Rhine Toll Lord**
*Starting investment:* Build or acquire a castle at a strategic river crossing.
*Chain:* Castle at river narrows → Obtain toll rights → Stretch a chain across the river to stop ships → Collect tolls from all passing trade → Develop the castle town into a market → Centuries of continuous revenue.
*Historical basis:* 79 different toll stations operated along the Rhine over a millennium. Pfalzgrafenstein Castle, built in 1326 on an island in the Rhine, collected tolls until **1867** — over 500 years of revenue from a garrison of only 20 men. By the early 1300s, a trader from Basel to Cologne paid **10–25% of cargo value** in fees across 60+ castles.
*Synergy bonuses:* Castle + river narrows = monopoly pricing. Castle + town development = local economy growth. Multiple toll points = complementary monopoly (but too many kills trade — teaching Nash equilibrium to 6th graders).

**Path 3: The Temple Banker**
*Starting investment:* Establish a fortified deposit location and accept valuables for safekeeping.
*Chain:* Secure storage → Offer letters of credit (pilgrim deposits gold in London, withdraws in Jerusalem) → Charge "rent" on loans (avoiding the usury ban on "interest") → Win papal exemptions from tithes → Build a trade intelligence network → Become indispensable to kings.
*Historical basis:* The Knights Templar invented international banking circa 1150. Temple Church in London was "a highly fortified building, constructed by skilled engineers, defended by highly trained soldiers" — a perfect vault. Their coded cipher letters and meticulous record-keeping anticipated modern banking. Their downfall teaches the risk of becoming *too* powerful: Philip IV of France, deeply in debt to the Order, arrested all Templars on **Friday, October 13, 1307**.
*Synergy bonuses:* Banking + military reputation = depositor trust. Banking + papal exemptions = tax-free profits. Banking + trade network = information advantage on where prices are highest.

**Path 4: The Agricultural Innovator**
*Starting investment:* Adopt the three-field rotation system (replacing two-field).
*Chain:* Three-field system increases productive land from 50% to 66% → Plant legumes (peas, beans) that fix nitrogen in soil → Adopt the heavy plow for clay soils → Add the horse collar (horses are 50% faster than oxen) → Generate surplus → Sell at market for cash → Invest cash in town development.
*Historical basis:* The three-field system, heavy plow, and horse collar together **increased agricultural productivity by up to 200%**, fueling population growth from roughly 1.5 million (Domesday Book, 1086) to 4–5 million by 1300. Cistercian monasteries pioneered these innovations through their grange system. Medieval farmers discovered that beans "fed the soil" — scientists didn't understand nitrogen-fixing chemistry until the 1800s.
*Synergy bonuses:* Three-field + legumes = improved diet + soil fertility. Horse collar + oats (grown in spring field) = feed for faster draft animals. Agricultural surplus + market charter = trade hub → guild formation → monopoly profits.

**Path 5: The Market Charter Lord**
*Starting investment:* Petition the Crown for a market charter.
*Chain:* Market charter = right to hold regular markets and fairs → Attract traders → Collect market tolls → Build bridges, roads, inns → Attract foreign merchants → Develop a wool house or port facility → Transform a minor settlement into a prosperous trading town.
*Historical basis:* Over **2,200 market and fair charters** were issued by English kings between 1200 and 1270. Southampton's designation as one of only 8 wool export ports (1320) created enormous wealth — its medieval Wool House is "the only medieval building in Europe built solely for storing wool."
*Synergy bonuses:* Market + river crossing = captive merchant traffic. Market + wool trade + foreign merchants = bypassing London middlemen. Market + guild establishment = monopoly control.

**Path 6: The Strategic Marriage**
*Starting investment:* Arrange a marriage alliance with a strategically valuable partner.
*Chain:* Marriage into merchant family = new trade routes → Dowry lands expand territory without war → Alliance reduces military costs → Heir inherits combined wealth → Second-generation marriage compounds advantages.
*Historical basis:* Henry II's marriage to Eleanor of Aquitaine (1152) created "one of the largest regions in Europe" by combining English crown lands with Aquitaine (~⅓ of France). Ferdinand and Isabella's marriage (1469) united Castile's wool production with Aragon's Mediterranean trade. The Habsburg motto was literally: "Let others wage war; you, happy Austria, marry!"
*Synergy bonuses:* Marriage + trade access = new markets. Marriage + political alliance = mutual defense. Marriage + dowry lands = territorial expansion without war costs.

**Path 7: The Medici Method (Banking + Political Power)**
*Starting investment:* Establish a bank focusing on Church accounts and trade finance.
*Chain:* Adopt double-entry bookkeeping → Exploit bills of exchange to disguise interest → Diversify into wool, cloth, spices → Establish branch partnerships (legally separate to protect parent bank) → Lend to rulers → Convert financial power into political power → Convert political power into cultural patronage → Dynasty.
*Historical basis:* Giovanni de' Medici founded the Medici Bank in 1397. His fortune at death: ~180,000 gold florins. Under Cosimo, the family produced **4 popes and 2 queens of France**. But the bank declined under Lorenzo the Magnificent, who lacked business training — a classic lesson in succession risk.
*Synergy bonuses:* Banking + papal accounts = guaranteed high-value clients. Banking + art patronage = political goodwill. Banking + political manipulation = control who gets credit = control who thrives.

### Synergy discovery mechanics

The game should use **breadcrumb design** — presenting obvious problems (bandit raids, food shortages, trade disruptions) that hint at solutions without prescribing them. When a player combines two synergistic investments, a subtle visual indicator (a glowing connection line between the two assets on the estate screen) signals the combination without explaining its full power. Three-way and four-way synergies produce increasingly visible effects — training students to look for connections.

---

## 3. Walking in their shoes: perspective-flip event sequences

### The empathy design framework

Research on perspective-switching games reveals three core principles for creating empathy through mechanics:

**Systemic complicity** — place the player *inside* an unjust system as an agent, not a savior. Papers, Please makes you the bureaucrat whose "correct" document processing has moral consequences. This War of Mine makes you the scavenger who might steal from an elderly couple. The empathy emerges not from observing suffering but from participating in systems that produce it.

**Resource-morality coupling** — tie ethical choices to tangible survival costs. In every effective empathy game, moral choices cost resources. Papers, Please docks pay for each "wrong" decision. Frostpunk's hope meter punishes inhumane laws. The player isn't choosing between good and evil but between competing goods under scarcity — the authentic logic of poverty and powerlessness.

**Individual interruptions** — force encounters with specific human stories within management abstractions. Frostpunk interrupts city-building optimization to ask about one specific amputee. Papers, Please inserts named characters with personal pleas between anonymous entrants. The pattern: operate at a system level, then periodically zoom to a single human story to prevent dehumanization.

### Perspective-flip event designs

Each flip is a **2–3 minute mini-sequence** triggered at specific points in the lord's campaign, forcing the player to experience life from another perspective before returning to the lord's view.

**Flip 1: A Serf's Week (triggered when the player raises taxes or demands extra labor)**
The player becomes **Thomas, a villein on their own estate**. Over five quick decision rounds representing five days, Thomas must balance:
- Working the lord's demesne 3 days/week vs. tending his own strip-land
- Paying heriot (death tax — his best ox) after his father dies, devastating his family's plowing capacity
- Deciding whether to send his daughter to marry a man on another lord's estate (paying merchet — a marriage fine — to the player-as-lord)
- Choosing between attending a required feast day (no work allowed) or secretly harvesting his own grain before rain comes

The core tension: **survival vs. obligation**. Every hour spent on the lord's fields is an hour not spent feeding your family. The serf eats dark rye bread and pottage (thick stew of peas, beans, and whatever's available). He drinks a gallon of weak ale daily because water is unsafe. He lives in a one-room cruck house with 8 family members, no glass windows, a central hearth with no chimney. His daily routine runs from dawn (~4:30 AM) to dusk with an 8-hour workday — but with Sundays off, saints' days, and festival holidays totaling roughly a third of the year.

When the player returns to the lord's view, the tax/labor decision they made now carries emotional weight.

**Flip 2: A Merchant Woman's Day (triggered when the player builds a market)**
The player becomes **Agnes, an alewife** in the market town. She must:
- Brew ale (the primary beverage — 1 gallon per person per day, since water is contaminated) under constant time pressure, since ale spoils within days
- Navigate the ale-taster's inspection (historically, women brewers were disproportionately fined and culturally scapegoated — depicted in church murals as destined for hell)
- Decide whether to register as **femme sole** — gaining the right to trade independently but accepting personal liability for all debts (her husband would be untouched by law, but she could lose everything)
- Face a choice when a male competitor undercuts her price: invest in larger-scale production (requiring capital she may not have) or accept declining business

Historical grounding: Women dominated English brewing for centuries. The word "brewster" is the feminine form of "brewer." After the Black Death and increasing professionalization, men with more legal, capital, and social resources gradually pushed women out. By the 1400s, almost all women had been excluded except widows who inherited their husband's businesses. **Alice Claver**, a London silkwoman, became one of the city's most successful merchants after her husband's death in 1456, appearing in 7 of 9 royal wardrobe payments in 1480 — but she never remarried, using widowhood as her path to autonomy.

**Flip 3: A Noblewoman's Dilemma (triggered when the player goes to war or leaves the estate)**
The player becomes **Lady Margaret**, who must run the entire estate while the lord (the player's character) is away at war. She must:
- Hear reports from the steward and bailiff, making decisions about planting, rent collection, and provisioning
- Resolve a boundary dispute with a neighboring lord — but she has no formal legal authority under coverture
- Command the castle garrison when scouts report a raiding party approaching
- Negotiate with a merchant for winter supplies, knowing the household of 100+ servants must be fed

Historical grounding: Noblewomen were "managers of a business" running complex households. **Nicholaa de la Haye** (c. 1150–1230) inherited the castellanship of Lincoln Castle, defended it twice in battle, was appointed Sheriff of Lincolnshire, and when enemies removed her from office, traveled to court to successfully demand restoration. Eleanor of Aquitaine served as vice-regent during Richard I's crusade and actively governed England until her death at 82.

**Flip 4: A Knight's Gamble (triggered when the player orders military action)**
The player becomes **Sir William**, a knight summoned to serve his 40-day feudal obligation at his own expense. He must:
- Choose which of his two warhorses to bring (a destrier could cost **£80** — when a skilled carpenter earned 6 shillings per year)
- Decide whether to enter a tournament (victory means capturing opponents' horses and armor; defeat means ruinous ransom)
- Balance military duty against the fact that his crops need harvesting back home
- Realize his full armor costs the equivalent of a modern luxury car, and one battle could destroy it

The core tension: the chivalric ideal vs. brutal economic reality. Knights were not romantic heroes — the code of chivalry was developed partly to *tame* their constant barbarism. Church councils literally prayed to be delivered from knights' violence.

---

## 4. "Medieval life was not fair": thematic mechanics grounded in law and reality

### Legal unfairness as game mechanics

The game should make specific medieval laws and customs *playable*, so students experience them as systems rather than memorizing definitions:

**Coverture in action.** When playing the lord's storyline, a marriage event should present the bride's assets transferring entirely to the player's control. When playing the noblewoman flip, the player should experience the reverse — being unable to sign a contract, own property, or appear in court independently. Under Bracton (c. 1230s), husband and wife were "one flesh and one blood," and the married woman was "under the rod" of her husband.

**Heriot as economic devastation.** When a serf family's patriarch dies, the lord collects the family's best animal — often their only ox. In gameplay, this should feel like losing a critical resource at the worst possible moment. For the serf-flip player, this means their plowing capacity is devastated just before planting season.

**Merchet as marriage tax.** A serf's daughter wants to marry someone outside the estate. The lord-player collects a fine. The serf-flip player must pay — treating marriage literally as a financial transaction requiring permission.

**Primogeniture and daughters.** Succession events should make clear that only the eldest son inherits. Younger sons must find careers (church, military, trade). Daughters inherit only if there are no male heirs — and even then, the overlord controls their marriage through wardship.

**Forest laws.** Hunting in royal forests carried harsh penalties — including mutilation. A serf-flip event where the player's family is hungry and deer are plentiful in the forbidden forest creates a visceral lesson in legal inequality.

### Eight myths the game should deliberately shatter

The game should include "Historian's Notes" — brief pop-ups that correct misconceptions when gameplay events touch on commonly misunderstood topics:

**Myth: Medieval people were filthy and never bathed.** Reality: Public bathhouses existed throughout Europe. Towns had communal baths where craftsmen bathed after work. By the **13th century, soap was manufactured on an almost industrial scale** in Britain, Italy, Spain, and France. London built "The Conduit" — lead pipes bringing fresh water from springs outside the city to the center for free public access.

**Myth: The "Dark Ages" were intellectually dead.** Reality: The 12th-century Renaissance was a major intellectual flowering. Universities were founded. Christians adopted and built upon Greek and Roman learning. Scholars made advances in optics, mathematics, and medicine.

**Myth: Castles looked like Disney.** Reality: Early castles were **motte-and-bailey** constructions — a mound of earth topped by a wooden tower. Stone castles were expensive and took decades to build. Most lords had timber fortifications. Neuschwanstein, the "classic" fairy-tale castle, was built in 1869.

**Myth: Knights were chivalric heroes.** Reality: Many were young men who, when not fighting wars, frequently "wreaked havoc on local populations." The code of chivalry was developed specifically to *tame* their violence. The Church helped launch the First Crusade partly to redirect these violent men toward the Middle East.

**Myth: Spices hid rotten meat.** Reality: Spices were extraordinarily expensive — only the wealthy could afford them, and the wealthy did not eat rotten meat. Medieval cuisine was varied and sophisticated.

**Myth: Peasants lived in endless misery.** Reality: A typical peasant worked around **8 hours a day** with breaks. They got roughly **one-third of the year** as holidays (Sundays, saints' days, Christmas, Easter, midsummer festivals). After the Black Death, surviving peasants gained significant bargaining power.

**Myth: Everyone thought the Earth was flat.** Reality: Thomas Aquinas used the Earth's roundness as a standard example of scientific truth. The scholar Abu Rayhan Biruni (973–1048) calculated the Earth's radius to within **31 kilometers** of the correct value. The flat-Earth myth was popularized by Washington Irving's fictionalized 1828 Columbus biography.

**Myth: Chastity belts were real.** Reality: According to historian Albrecht Classen, "No author of sermon literature, of penitentiary texts, or didactic and legal writings has ever mentioned the chastity belt." The first known reference (1405) was presented alongside joke inventions including a fart-powered propulsion device. Museum "artifacts" have been shown to be **19th-century forgeries**.

### Medieval engineering achievements for in-game discovery

When players invest in infrastructure, they should encounter real inventions with historically accurate impacts:

- **Water mills** (6,500 in England by 1086 per the Domesday Book — roughly one per village)
- **Heavy plow** (opened Northern Europe's clay river valleys to farming for the first time)
- **Horse collar** (increased horse pulling capacity by 2–3x; horses were 50% faster than oxen)
- **Three-field rotation** (increased productive land from 50% to 66%; legumes fixed nitrogen centuries before scientists understood why)
- **Mechanical clocks** (verge-and-foliot escapement, c. 1275; 70+ European cities had public clocks by 1380)
- **Eyeglasses** (invented near Pisa c. 1286; doubled the productive life of every scholar over age 40)
- **Gothic cathedral engineering** (flying buttresses, pointed arches, ribbed vaults — buildings that have stood 800+ years without computers or calculators)
- **Arabic numerals** (Fibonacci's *Liber Abaci*, 1202 — try doing long division with Roman numerals)
- **Windmills** (European vertical windmills from the 1180s — medieval engineers basically invented wind power)
- **Printing press** (Gutenberg, c. 1440 — before it, ~30,000 books in Europe; within 50 years, over 10 million)

---

## 5. From game to Shark Tank: PBL integration and assessment

### Unit structure built on Gold Standard PBL

The PBLWorks framework identifies 7 essential design elements, all addressed by The Lord's Ledger unit:

- **Driving question:** "How did the economic decisions of medieval people shape their survival, prosperity, and social position — and what innovations could have changed their world?"
- **Sustained inquiry:** 4–6 weeks of iterative investigation — play, research, play with new knowledge, then apply to competition
- **Authenticity:** Medieval economic simulation connects to real principles of scarcity, trade-offs, and supply/demand
- **Student voice and choice:** Students choose game roles and invention focus
- **Reflection:** Structured game journals after each session
- **Critique and revision:** Peer feedback on inventions before final pitch
- **Public product:** The Shark Tank competition itself

Research consistently shows simulation games work best when debriefing is integrated throughout. As Crookall (2014) states: "A game is like a tasty meal in your mouth. The debriefing is digesting and absorbing nutrition." The recommended Brief–Play–Debrief cycle uses the 3D Model: **Defusing** (what happened? how did it feel?), **Discovering** (what decisions did you make and why?), **Deepening** (how would a real medieval person have experienced this?).

### Recommended 6-week sequence

| Week | Phase | Core activities |
|------|-------|----------------|
| 1 | Launch | Entry event with medieval artifacts/images. Introduce driving question. Pre-assessment. Mini-lessons on feudalism, manorial system, guilds. |
| 2 | Gameplay Phase 1 | Students play The Lord's Ledger as assigned roles (3–4 sessions). Keep game journals. Structured debriefing after each session. |
| 3 | Research and analysis | Compare game experiences with primary sources. Workshops on medieval technology and economics. Critical question: "What did the game get right? What did it simplify?" |
| 4 | Gameplay Phase 2 | Play again with different role or advanced scenarios. Begin brainstorming Shark Tank inventions based on problems encountered during gameplay. |
| 5 | Shark Tank development | Research medieval materials and techniques. Design inventions. Create prototypes and pitch presentations. Peer critique sessions. |
| 6 | Competition and reflection | Final Shark Tank presentations. Reflection essays connecting game experiences to historical understanding. Portfolio assembly. |

The ideal time allocation is approximately **30–35% gameplay**, **25–30% research and direct instruction**, **20–25% project work**, and **10–15% reflection and assessment**.

### Middle Ages Shark Tank competition design

**The core constraint that drives creativity:** students may only use materials and techniques available in the medieval period — wood, iron, stone, leather, wool/linen, clay, tallow, hemp rope, bone/horn, limited glass, copper/bronze, lead, and parchment. Power sources are limited to human/animal muscle, water wheels, windmills, and gravity. No electricity, plastics, steel, or gunpowder.

**Pitch structure (5–7 minutes per team):**
1. **The Problem** (1 min): "When I played as a [role], I discovered that [specific problem]..."
2. **The Invention** (2 min): Description with visual model or drawing. Name it.
3. **How It Works** (1 min): Materials, medieval techniques, basic engineering principles
4. **Who Benefits** (1 min): Target users, connection to feudal economics
5. **The Ask** (1 min): Investment needed (in pounds/shillings/pence), expected return
6. **Q&A from investors** (1–2 min)

**The Medieval Council — rotating student judges, each with different investment priorities:**

| Role | Priority | Sample question |
|------|----------|----------------|
| Lord/Lady | Military advantage, estate productivity | "Will this protect my lands?" |
| Merchant | Trade value, profit potential | "Who will buy this? What's the margin?" |
| Bishop/Abbot | Moral value, community benefit | "Does this serve God's purpose?" |
| Guild Master | Craft quality, labor requirements | "Can our guild build this? Will it threaten our monopoly?" |

**Twelve historically grounded invention ideas for student teams:**

1. **Improved heavy plow design** — addressing Northern European clay soils (agricultural engineering)
2. **Water-powered fulling mill** — mechanizing cloth production (mechanical engineering)
3. **Improved food preservation** — salting, smoking, or root-cellar designs (food science)
4. **Castle water supply system** — well engineering, cisterns, or aqueducts (civil engineering)
5. **Windmill adaptation** — grinding grain in flat, water-poor regions (renewable energy)
6. **Horse collar redesign** — maximizing draft animal efficiency (biomechanics)
7. **Mechanical clock mechanism** — the verge-and-foliot escapement (precision engineering)
8. **Gothic arch bridge** — using pointed arch principles for river crossings (structural engineering)
9. **Three-field rotation plan** — redesigning village land use for maximum yield (systems thinking)
10. **Improved accounting tools** — adapting Arabic numerals for estate management (mathematics)
11. **Eyeglass design** — extending the productive life of scholars and craftsmen (optics)
12. **Printing system** — any method of duplicating text faster than hand copying (information technology)

Each invention connects to STEM principles: windmills → renewable energy, Gothic architecture → structural engineering, three-field rotation → systems thinking, Arabic numerals → computational efficiency. This creates natural STEAM integration.

**Game-to-competition transfer:** Students who played as **lords** tend to value military and efficiency inventions. Students who experienced **serf life** tend to invent agricultural labor-saving devices. Students who played as **merchants** focus on trade and transportation improvements. This diversity of perspectives enriches the competition naturally — and teaches that stakeholder perspective shapes innovation priorities.

### Assessment framework

**The Shark Tank pitch IS the summative assessment** — it requires students to synthesize historical knowledge, economic reasoning, creative design, and communication skills in an authentic performance. Game journals serve as formative assessment throughout, and the portfolio documents the learning journey.

**Game journal rubric (formative, ongoing):**
Assessed on five dimensions — decision documentation, historical connection, reflection depth, perspective-taking, and growth over time — each on a 4-point scale from Beginning to Exemplary. The key indicator at the Exemplary level: "Makes multiple, specific connections between game events and medieval history, citing evidence from primary sources."

**Systems thinking rubric:**
- *Advanced:* Identifies multiple interconnected factors and explains feedback loops ("Raising taxes caused peasants to flee, which reduced my labor force, which lowered crop yields, which reduced my tax revenue")
- *Proficient:* Identifies cause-and-effect relationships between 2–3 factors
- *Developing:* Recognizes that decisions have consequences but cannot explain the chain
- *Beginning:* Views events as isolated occurrences

**Perspective-taking rubric:**
- *Advanced:* Articulates how the same event would be experienced differently by 3+ medieval social roles, with specific historical evidence
- *Proficient:* Articulates 2 different perspectives with some historical reasoning
- *Developing:* Acknowledges different perspectives exist but cannot articulate them
- *Beginning:* Applies only modern perspective to medieval situations

**Shark Tank invention rubric:** Evaluates historical authenticity, problem identification, engineering/design quality, economic reasoning, creativity, presentation quality, and collaboration — each on a 4-point scale.

**Standards alignment:** The unit addresses Common Core ELA standards for citing evidence (RH.6-8.1), determining central ideas (RH.6-8.2), collaborative discussion (SL.6.1), and presenting claims (SL.6.4). It also meets C3 Framework standards for explaining economic decision impacts (D2.Eco.1.6-8), analyzing historical significance (D2.His.3.6-8), explaining changing perspectives (D2.His.5.6-8), and multiple causes and effects (D2.His.14.6-8).

**Self-assessment tools:**
- **Traffic Light Check** after each session: Green/Yellow/Red on specific content areas
- **"I Used to Think... Now I Think..."** template capturing conceptual change
- **Skills Inventory** comparing self-ratings before and after the unit on collaboration, decision-making, historical thinking, and economic reasoning

---

## Conclusion: what makes this design work

The Lord's Ledger's power lies in a single design insight: **the game mechanic IS the history lesson**. Students don't learn about cascading feudal failures by reading about them — they cause them, see the chain, and then learn what really happened. They don't memorize that coverture denied women legal personhood — they *experience* being unable to sign a contract during a noblewoman flip and feel the frustration. They don't recite that the three-field system increased yields by 33% — they discover the synergy between spring planting, legumes, and horse collars through experimentation.

Three design decisions make this educationally distinctive. First, the Chronicle of Ruin death screen transforms every failure into a cause-and-effect diagram paired with a real historical parallel — implementing Kapur's productive failure framework where the struggle phase (gameplay) prepares the brain for the consolidation phase (the Historian's Lesson). Second, the seven strategy paths are not prescribed but discovered, mirroring how real medieval wealth was built through interconnected systems (sheep → wool → cloth → trade guilds → market dominance). Third, the perspective flips use the three empathy principles — systemic complicity, resource-morality coupling, and individual interruption — to make feudal inequality something students feel in their decisions rather than observe from a distance.

The Shark Tank competition completes the loop: students who have experienced medieval constraints from the inside are now asked to *solve medieval problems* using only medieval resources. A student who lost their only ox to heriot invents a better plow. A student who watched their alewife business undercut by guild regulation designs a more efficient brewing system. The game doesn't just teach medieval history — it creates the motivation and contextual understanding that makes the project work meaningful.