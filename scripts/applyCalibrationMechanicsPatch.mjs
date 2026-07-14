import fs from "node:fs";

function replaceOnce(path, search, replacement, label) {
  const source = fs.readFileSync(path, "utf8");
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Ambiguous patch anchor: ${label}`);
  }
  fs.writeFileSync(path, source.replace(search, replacement));
}

const pricePath = "src/engine/agentEconomy/priceBeliefSystem.js";
replaceOnce(
  pricePath,
  `import { MIN_TRADE_QUANTITY, calibratedQuantity } from "./economyCalibration.js";`,
  `import {\n  LEARNED_PRICE_CEILING_MULTIPLIER,\n  LEARNED_PRICE_FLOOR_MULTIPLIER,\n  MIN_TRADE_QUANTITY,\n  calibratedQuantity,\n} from "./economyCalibration.js";`,
  "price stability imports",
);
replaceOnce(
  pricePath,
  `  center = clamp(center, bounds.floor, bounds.ceiling);\n  halfSpread = clamp(halfSpread, bounds.reference * 0.04, bounds.reference * 0.75);\n\n  let min = clamp(center - halfSpread, bounds.floor, bounds.ceiling);\n  let max = clamp(center + halfSpread, bounds.floor, bounds.ceiling);`,
  `  const learnedFloor = Math.max(\n    bounds.floor,\n    bounds.reference * LEARNED_PRICE_FLOOR_MULTIPLIER,\n  );\n  const learnedCeiling = Math.min(\n    bounds.ceiling,\n    bounds.reference * LEARNED_PRICE_CEILING_MULTIPLIER,\n  );\n  center = clamp(center, learnedFloor, learnedCeiling);\n  halfSpread = clamp(halfSpread, bounds.reference * 0.04, bounds.reference * 0.35);\n\n  let min = clamp(center - halfSpread, learnedFloor, learnedCeiling);\n  let max = clamp(center + halfSpread, learnedFloor, learnedCeiling);`,
  "learned price band",
);
replaceOnce(
  pricePath,
  `    lastPrice: Number.isFinite(options.lastPrice)\n      ? roundMoney(clamp(options.lastPrice, bounds.floor, bounds.ceiling))\n      : normalized.lastPrice,`,
  `    lastPrice: Number.isFinite(options.lastPrice)\n      ? roundMoney(clamp(options.lastPrice, learnedFloor, learnedCeiling))\n      : roundMoney(clamp(normalized.lastPrice, learnedFloor, learnedCeiling)),`,
  "learned last price band",
);
replaceOnce(
  pricePath,
  `  if (outcome.failedBuy > 0) {\n    const ratio = outcome.failedBuy / Math.max(MIN_TRADE_QUANTITY, outcome.buyOrdered);\n    const urgency = FOOD_COMMODITIES.has(outcome.commodity)\n      ? clamp((Number(household.needs?.food) || 0) / 100, 0, 1)\n      : 0;\n    next = shiftBelief(outcome.commodity, next, {\n      centerMultiplier: 1 + 0.03 + ratio * 0.05 + urgency * 0.025,\n      spreadMultiplier: 1.04,\n    });\n  }\n\n  if (outcome.failedSell > 0) {\n    const ratio = outcome.failedSell / Math.max(MIN_TRADE_QUANTITY, outcome.sellOrdered);\n    next = shiftBelief(outcome.commodity, next, {\n      centerMultiplier: 1 - 0.025 - ratio * 0.05,\n      spreadMultiplier: 1.04,\n    });\n  }`,
  `  if (outcome.failedBuy > 0 && outcome.buyFilled < MIN_TRADE_QUANTITY) {\n    const ratio = outcome.failedBuy / Math.max(MIN_TRADE_QUANTITY, outcome.buyOrdered);\n    const urgency = FOOD_COMMODITIES.has(outcome.commodity)\n      ? clamp((Number(household.needs?.food) || 0) / 100, 0, 1)\n      : 0;\n    const reference = getReferencePrice(outcome.commodity);\n    next = shiftBelief(outcome.commodity, next, {\n      anchorPrice: reference * 1.08,\n      anchorWeight: 0.08,\n      centerMultiplier: 1 + 0.002 + ratio * 0.004 + urgency * 0.002,\n      spreadMultiplier: 1.01,\n    });\n  }\n\n  if (outcome.failedSell > 0 && outcome.sellFilled < MIN_TRADE_QUANTITY) {\n    const ratio = outcome.failedSell / Math.max(MIN_TRADE_QUANTITY, outcome.sellOrdered);\n    const reference = getReferencePrice(outcome.commodity);\n    next = shiftBelief(outcome.commodity, next, {\n      anchorPrice: reference * 0.92,\n      anchorWeight: 0.08,\n      centerMultiplier: 1 - 0.002 - ratio * 0.004,\n      spreadMultiplier: 1.01,\n    });\n  }`,
  "stable failure learning",
);
