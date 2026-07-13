/**
 * Endings for The Lord's Ledger
 *
 * Resource-based victory and failure narratives.
 * All text is written at 6th grade reading level with historical grounding.
 */

// ─────────────────────────────────────────────────────────────────────────────
// VICTORY TITLES
//
// Usage: check conditions after a completed 40-turn run.
// Score based on: total wealth (denarii + inventory value), population,
// buildings built, garrison strength.
// ─────────────────────────────────────────────────────────────────────────────

export const victoryTitles = {
  wealthy: {
    title: "The Prosperous",
    subtitle: "Lord of Full Coffers",
    description:
      "Your ledgers never ran dry. While other lords borrowed from merchants " +
      "and prayed for good harvests, you kept your treasury full through sharp " +
      "decisions and careful spending. Generations of stewards will study your " +
      "account books as a model of how to run an estate.",
    historianNote:
      "Some of the wealthiest medieval lords built their fortunes through wool " +
      "and trade rather than warfare. The tiny English town of Lavenham became " +
      "the 14th wealthiest settlement in all of England — entirely from the wool trade.",
  },

  populous: {
    title: "The Beloved",
    subtitle: "Friend of the Common Folk",
    description:
      "Your people did not just tolerate your rule — they chose it. You listened " +
      "to petitions, kept rents fair, and fed your village through the hard winters. " +
      "When a traveler asked a farmer who ruled this estate, the farmer smiled before " +
      "answering. That smile was your greatest achievement.",
    historianNote:
      "After the Black Death killed nearly half of Europe's people in the 1340s, " +
      "the lords who treated their peasants well found loyal workers while harsher " +
      "lords lost theirs to neighbors who offered better terms. Kindness was often " +
      "the smartest economic choice.",
  },

  military: {
    title: "The Iron Lord",
    subtitle: "Shield of the Estate",
    description:
      "Your castle walls were sound, your soldiers were trained, and raiders " +
      "learned quickly to seek easier targets. Ten years passed without a " +
      "single successful attack on your lands. In a violent age, you made " +
      "safety — and that safety let everything else grow.",
    historianNote:
      "A good castle and trained soldiers protected not just the lord but every " +
      "farmer, merchant, and craftsman within its reach. Medieval peasants often " +
      "sought out strong lords precisely because protection was worth almost " +
      "any price in a world without police or courts.",
  },

  builder: {
    title: "The Great Builder",
    subtitle: "Architect of a Thriving Estate",
    description:
      "Where once there were empty fields, you built a manor that hummed with " +
      "industry. Farms fed your people, mills turned raw materials into wealth, " +
      "and every building served a purpose. Your estate became a model for " +
      "what careful planning and investment could achieve.",
    historianNote:
      "Medieval lords who invested in infrastructure — mills, bridges, markets — " +
      "often saw returns that dwarfed what they could earn from taxes alone. " +
      "The Cistercian monks were famous for turning barren land into productive " +
      "estates through relentless building and agricultural innovation.",
  },

  balanced: {
    title: "The Balanced",
    subtitle: "Keeper of the Middle Path",
    description:
      "You never chased one goal at the cost of another. Your treasury was " +
      "solid without being miserly. Your people were fed and growing. Your " +
      "soldiers were ready without terrorizing anyone. This is rarer than it " +
      "sounds — most lords end their reigns having sacrificed everything " +
      "for one thing. You sacrificed nothing essential.",
    historianNote:
      "The most successful medieval lords — like Henry II of England — were " +
      "remembered for managing all the competing demands of their position " +
      "at once: law, trade, military strength, and religious duty. History " +
      "remembers extremes, but stable eras are built by balance.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FAILURE NARRATIVES
//
// Two failure modes:
//   - "depopulation" — population reached 0
//   - "bankruptcy" — denarii at 0 for 3+ consecutive turns
// ─────────────────────────────────────────────────────────────────────────────

export const failureNarratives = {
  depopulation: {
    title: "The Empty Village",
    headline: "Your people left — and they took everything with them.",
    narrative:
      "It happened slowly, then all at once. First it was individual families, " +
      "slipping away in the night to a neighboring estate where the lord " +
      "was rumored to be gentler with his rents. Then a whole hamlet left " +
      "after the bad winter — twenty-three people, gone before dawn. " +
      "By midsummer, your fields sat half-worked, your mill ran empty, " +
      "and the village market stalls were bare. An estate without people " +
      "is just land, and land alone feeds no one — including you.",
    historianLesson:
      "After the Black Death killed nearly half of Europe's population in " +
      "the 1340s and 1350s, peasants realized they had real bargaining power. " +
      "Lords who refused to improve conditions found their workers simply " +
      "walking to neighboring estates that offered better terms. This " +
      "migration of workers was one of the main forces that ended serfdom.",
    chain: [
      "Your people needed food, safety, or fairer treatment — and didn't get it.",
      "Families began making quiet calculations about other options.",
      "The first few departures showed others that leaving was possible.",
      "An estate with no workers has no harvest, no income, and no future.",
    ],
  },

  bankruptcy: {
    title: "The Empty Coffer",
    headline: "Your treasury ran dry — and so did your reign.",
    narrative:
      "The last coin left your strongbox on a cold Tuesday in February. " +
      "Your soldiers had not been paid in two months and they knew it. " +
      "By Wednesday morning, a third of them were gone — not fled to an " +
      "enemy, just gone, drifting toward lords who could still afford them. " +
      "Your merchants stopped extending credit. Your steward resigned. " +
      "By spring, your neighbors had begun quietly parceling out your " +
      "lands among themselves, and there was nothing left to argue with.",
    historianLesson:
      "The banking families of Florence — the Bardi and the Peruzzi — " +
      "lent the English King Edward III an estimated 1.5 million gold " +
      "florins. When he defaulted on the debt in 1345, one historian wrote " +
      "that it shattered 'the entire financial market of Europe.' " +
      "Even kings could be brought down by empty treasuries.",
    chain: [
      "You spent more than you collected — each season, the gap widened.",
      "Soldiers went unpaid and began to leave.",
      "Merchants stopped selling on credit when they heard the news.",
      "With no coin, no soldiers, and no goods, there was nothing left to rule.",
    ],
  },

  famine: {
    title: "The Great Famine",
    headline: "Your granaries stood empty — and your people fled.",
    narrative:
      "The last grain of wheat was ground to flour three seasons ago. " +
      "Your people ate roots, then bark, then nothing at all. " +
      "The strongest families packed their carts and left for greener pastures. " +
      "The weakest had no carts to pack. By the time rain finally fell on your " +
      "empty fields, there was no one left to harvest what it grew.",
    historianLesson:
      "The Great Famine of 1315\u20131317 killed millions across Europe. " +
      "Crops failed for three consecutive years due to heavy rains and cold. " +
      "Chroniclers recorded that parents abandoned children, and the price " +
      "of wheat rose eightfold. Some English manors lost half their population.",
    chain: [
      "Your food stores dwindled season after season.",
      "Families began leaving to seek sustenance elsewhere.",
      "With no food to offer, even your most loyal subjects departed.",
      "Three seasons of empty granaries sealed your estate's fate.",
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VICTORY SUMMARY FUNCTION
//
// Takes final game state and builds a narrative summary.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the appropriate victory title based on final game state.
 *
 * @param {{ denarii: number, food: number, population: number, garrison: number,
 *           buildings: string[], inventory: object }} state
 * @returns {object} Victory title object
 */
export function getVictoryTitle(state) {
  const { denarii, population, garrison, buildings, inventory } = state;

  // Calculate inventory value
  const inventoryValue = Object.values(inventory || {}).reduce((sum, v) => sum + v * 5, 0);
  const totalWealth = denarii + inventoryValue;

  // Check for balanced ending: decent in all areas
  const isBalanced =
    denarii >= 200 && denarii <= 800 &&
    population >= 15 && population <= 35 &&
    garrison >= 3 && garrison <= 15 &&
    (buildings || []).length >= 3 && (buildings || []).length <= 8;

  if (isBalanced) return victoryTitles.balanced;

  // Score each category
  const scores = [
    { key: "wealthy", value: totalWealth },
    { key: "populous", value: population * 30 },
    { key: "military", value: garrison * 50 + (state.castleLevel || 1) * 100 },
    { key: "builder", value: (buildings || []).length * 80 },
  ];

  scores.sort((a, b) => b.value - a.value);
  return victoryTitles[scores[0].key];
}

/**
 * Returns a narrative summary of the completed reign based on final state.
 *
 * @param {{ denarii: number, food: number, population: number, garrison: number,
 *           buildings: string[], inventory: object, castleLevel: number }} state
 * @returns {string}
 */
export function victorySummary(state) {
  const { denarii, population, garrison, buildings, castleLevel } = state;
  const inventoryValue = Object.values(state.inventory || {}).reduce((sum, v) => sum + v * 5, 0);
  const totalWealth = denarii + inventoryValue;

  // Determine overall tone
  const wealthScore = totalWealth > 800 ? 2 : totalWealth > 400 ? 1 : 0;
  const popScore = population > 25 ? 2 : population > 15 ? 1 : 0;
  const milScore = garrison > 10 ? 2 : garrison > 5 ? 1 : 0;
  const buildScore = (buildings || []).length > 6 ? 2 : (buildings || []).length > 3 ? 1 : 0;
  const avg = (wealthScore + popScore + milScore + buildScore) / 4;

  let overallTone;
  if (avg >= 1.5) overallTone = "strong";
  else if (avg >= 0.75) overallTone = "solid";
  else overallTone = "difficult";

  const openings = {
    strong:
      "Ten years have passed since you first sat in the lord's chair, " +
      "and the estate stands stronger than it did when you inherited it.",
    solid:
      "Ten years have passed, and your estate has survived — through good " +
      "seasons and hard ones, through difficult choices and painful trade-offs.",
    difficult:
      "Ten years have passed, and you are still here — which, given " +
      "everything, is itself a kind of victory.",
  };

  // Build specific sentences
  const details = [];

  if (totalWealth > 600) {
    details.push(`Your coffers hold ${denarii}d with goods worth another ${inventoryValue}d — a fortune by any measure.`);
  } else if (totalWealth < 200) {
    details.push(`Your treasury sits at ${denarii}d, thinner than your steward would like.`);
  }

  if (population > 25) {
    details.push(`${population} families call your estate home — a thriving community built on trust.`);
  } else if (population < 12) {
    details.push(`Only ${population} families remain — a small village, but a loyal one.`);
  }

  if (garrison > 10) {
    details.push(`Your garrison of ${garrison} soldiers behind ${castleLevel > 1 ? "upgraded walls" : "your castle"} keeps the peace.`);
  } else if (garrison <= 2) {
    details.push(`Your thin garrison of ${garrison} is a vulnerability your neighbors surely noticed.`);
  }

  if ((buildings || []).length > 6) {
    details.push(`${(buildings || []).length} buildings line your estate — farms, workshops, and industry humming with purpose.`);
  }

  const closings = {
    strong:
      "The chronicle of your reign is one that your children's children can be proud of. " +
      "Medieval life was hard, short, and often brutal — and you made a small corner of it " +
      "better for the people who lived there.",
    solid:
      "No reign is perfect, and yours was not. But the estate stands, your people mostly " +
      "remember you fairly, and the ledger books close without disaster. " +
      "In a medieval world, that is no small thing.",
    difficult:
      "The years were hard and the decisions were harder. You made mistakes — every lord does. " +
      "What matters is that you are still learning. " +
      "History is full of lords who did not last ten years.",
  };

  return `${openings[overallTone]} ${details.join(" ")} ${closings[overallTone]}`;
}
