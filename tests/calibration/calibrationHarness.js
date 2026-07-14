import {
  generateStressSeeds,
  runAgentEconomyStress,
} from "../stress/agentEconomyStressHarness.js";
import {
  CALIBRATION_BASE_SEED,
  CALIBRATION_QUARTERS,
  CALIBRATION_SCENARIOS,
  CALIBRATION_SEED_COUNT,
  CALIBRATION_VERSION,
  HARD_GATES,
} from "./calibrationConfig.js";

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function round(value, digits = 4) {
  return Number(finite(value).toFixed(digits));
}

function check(id, observed, operator, target, tier = "calibration") {
  const comparisons = {
    eq: observed === target,
    gte: observed >= target,
    lte: observed <= target,
  };
  return {
    id,
    tier,
    status: comparisons[operator] ? "pass" : "fail",
    observed,
    operator,
    target,
  };
}

function rangeChecks(id, observed, minimum, maximum) {
  return [
    check(`${id}-minimum`, observed, "gte", minimum),
    check(`${id}-maximum`, observed, "lte", maximum),
  ];
}

function summarizePriceBand(summary) {
  const rows = Object.values(summary.priceByCommodity ?? {});
  return {
    minimumRatio: rows.length > 0
      ? round(Math.min(...rows.map((row) => finite(row.minRatio, 1))), 4)
      : 1,
    maximumRatio: rows.length > 0
      ? round(Math.max(...rows.map((row) => finite(row.maxRatio, 1))), 4)
      : 1,
  };
}

export function evaluateScenarioSummary(summary, target) {
  const averages = summary.averages ?? {};
  const rates = summary.rates ?? {};
  const runtime = summary.runtime ?? {};
  const priceBand = summarizePriceBand(summary);
  const trades = finite(averages.trades);
  const failedOrders = finite(averages.failedOrders);
  const failedOrdersPerTrade = trades > 0 ? round(failedOrders / trades, 2) : null;

  const hardChecks = [
    check("completion-rate", finite(summary.completionRate), "gte", HARD_GATES.completionRate, "hard"),
    check("invariant-failure-rate", finite(rates.invariantFailure), "lte", HARD_GATES.invariantFailureRate, "hard"),
    check("maximum-quarter-runtime", finite(runtime.maxQuarterMs), "lte", HARD_GATES.maxQuarterRuntimeMs, "hard"),
  ];

  const calibrationChecks = [
    check("economic-survival-rate", finite(summary.economicSurvivalRate), "gte", target.economicSurvivalRateMin),
    ...rangeChecks(
      "food-fulfillment-rate",
      finite(averages.foodFulfillmentRate),
      target.foodFulfillmentRateMin,
      target.foodFulfillmentRateMax,
    ),
    ...rangeChecks(
      "employment-rate",
      finite(averages.employmentRate),
      target.employmentRateMin,
      target.employmentRateMax,
    ),
    check("idle-building-rate", finite(averages.idleBuildingRate), "lte", target.idleBuildingRateMax),
    check("input-shortage-rate", finite(averages.shortageEventRate), "lte", target.inputShortageRateMax),
    check("trades-per-day", finite(averages.tradesPerDay), "gte", target.tradesPerDayMin),
    {
      id: "failed-orders-per-trade",
      tier: "calibration",
      status: failedOrdersPerTrade != null && failedOrdersPerTrade <= target.failedOrdersPerTradeMax
        ? "pass"
        : "fail",
      observed: failedOrdersPerTrade,
      operator: "lte",
      target: target.failedOrdersPerTradeMax,
    },
    check("extreme-inflation-seed-rate", finite(rates.extremeInflation), "lte", target.extremeInflationSeedRateMax),
    check("price-crash-seed-rate", finite(rates.priceCrash), "lte", target.priceCrashSeedRateMax),
    check("endpoint-poverty-rate", finite(averages.povertyRate), "lte", target.povertyRateMax),
    check("average-health", finite(averages.health), "gte", target.averageHealthMin),
    check("average-satisfaction", finite(averages.satisfaction), "gte", target.averageSatisfactionMin),
    check("minimum-commodity-price-ratio", priceBand.minimumRatio, "gte", target.commodityPriceRatioMin),
    check("maximum-commodity-price-ratio", priceBand.maximumRatio, "lte", target.commodityPriceRatioMax),
  ];

  return {
    hardStatus: hardChecks.every((item) => item.status === "pass") ? "pass" : "fail",
    calibrationStatus: calibrationChecks.every((item) => item.status === "pass")
      ? "meets-target"
      : "needs-calibration",
    hardChecks,
    calibrationChecks,
    observed: {
      economicSurvivalRate: finite(summary.economicSurvivalRate),
      foodFulfillmentRate: finite(averages.foodFulfillmentRate),
      employmentRate: finite(averages.employmentRate),
      idleBuildingRate: finite(averages.idleBuildingRate),
      inputShortageRate: finite(averages.shortageEventRate),
      tradesPerDay: finite(averages.tradesPerDay),
      failedOrdersPerTrade,
      extremeInflationSeedRate: finite(rates.extremeInflation),
      priceCrashSeedRate: finite(rates.priceCrash),
      povertyRate: finite(averages.povertyRate),
      averageHealth: finite(averages.health),
      averageSatisfaction: finite(averages.satisfaction),
      minimumCommodityPriceRatio: priceBand.minimumRatio,
      maximumCommodityPriceRatio: priceBand.maximumRatio,
    },
  };
}

function findScenario(results, id) {
  return results.find((result) => result.id === id);
}

function directionalCheck(id, left, operator, right, metric) {
  const leftValue = finite(left?.evaluation?.observed?.[metric]);
  const rightValue = finite(right?.evaluation?.observed?.[metric]);
  const passed = operator === "gte" ? leftValue >= rightValue : leftValue <= rightValue;
  return {
    id,
    tier: "directional",
    status: passed ? "pass" : "fail",
    leftScenario: left?.id ?? null,
    leftValue,
    operator,
    rightScenario: right?.id ?? null,
    rightValue,
    metric,
  };
}

export function evaluateDirectionalExpectations(results) {
  const baseline = findScenario(results, "default-estate");
  const agriculture = findScenario(results, "agricultural-shortage");
  const labor = findScenario(results, "labor-shortage");
  const broken = findScenario(results, "broken-supply-chain");
  const highTax = findScenario(results, "high-tax");
  const lowTax = findScenario(results, "low-tax");
  const expanded = findScenario(results, "expanded-estate");

  return [
    directionalCheck(
      "agricultural-loss-reduces-food",
      agriculture,
      "lte",
      baseline,
      "foodFulfillmentRate",
    ),
    directionalCheck(
      "labor-reservation-reduces-employment",
      labor,
      "lte",
      baseline,
      "employmentRate",
    ),
    directionalCheck(
      "broken-chain-increases-idle-processing",
      broken,
      "gte",
      baseline,
      "idleBuildingRate",
    ),
    directionalCheck(
      "expansion-reduces-input-shortages",
      expanded,
      "lte",
      baseline,
      "inputShortageRate",
    ),
    directionalCheck(
      "expansion-improves-employment",
      expanded,
      "gte",
      baseline,
      "employmentRate",
    ),
    directionalCheck(
      "high-tax-does-not-reduce-poverty-below-low-tax",
      highTax,
      "gte",
      lowTax,
      "povertyRate",
    ),
  ];
}

export function runCalibrationMatrix(options = {}) {
  const seedCount = Math.max(1, Math.floor(options.seedCount ?? CALIBRATION_SEED_COUNT));
  const quarters = Math.max(1, Math.floor(options.quarters ?? CALIBRATION_QUARTERS));
  const baseSeed = options.baseSeed ?? CALIBRATION_BASE_SEED;
  const scenarios = options.scenarios ?? CALIBRATION_SCENARIOS;
  const seeds = options.seeds ?? generateStressSeeds(seedCount, baseSeed);

  const results = scenarios.map((scenario) => {
    const stress = runAgentEconomyStress({
      seeds,
      quarters,
      population: scenario.population,
      estateInventory: scenario.estateInventory,
      buildings: scenario.buildings,
      laborAllocation: scenario.laborAllocation,
      taxRate: scenario.taxRate,
      baseSeed,
      runtimeGateMsPerQuarter: HARD_GATES.maxQuarterRuntimeMs,
    });
    const evaluation = evaluateScenarioSummary(stress.summary, scenario.target);
    return {
      id: scenario.id,
      name: scenario.name,
      purpose: scenario.purpose,
      expectedPressure: scenario.expectedPressure,
      inputs: {
        population: scenario.population,
        estateInventory: scenario.estateInventory,
        buildings: scenario.buildings.map((building) => typeof building === "string" ? building : building.type),
        laborAllocation: scenario.laborAllocation,
        taxRate: scenario.taxRate,
      },
      target: scenario.target,
      evaluation,
      stressSummary: stress.summary,
      worstSeeds: stress.summary.worstSeeds,
    };
  });

  const directionalChecks = evaluateDirectionalExpectations(results);
  const hardStatus = results.every((result) => result.evaluation.hardStatus === "pass")
    ? "pass"
    : "fail";
  const calibrationStatus = results.every(
    (result) => result.evaluation.calibrationStatus === "meets-target",
  ) ? "meets-target" : "needs-calibration";

  return {
    generatedAt: new Date().toISOString(),
    calibrationVersion: CALIBRATION_VERSION,
    configuration: {
      seedCount: seeds.length,
      quartersPerScenario: quarters,
      daysPerSeed: quarters * 30,
      scenarioCount: scenarios.length,
      totalQuarterSimulations: seeds.length * quarters * scenarios.length,
      totalDaySimulations: seeds.length * quarters * 30 * scenarios.length,
      baseSeed,
      sharedSeeds: seeds,
    },
    hardStatus,
    calibrationStatus,
    targetMissCount: results.reduce(
      (total, result) => total + result.evaluation.calibrationChecks.filter(
        (item) => item.status === "fail",
      ).length,
      0,
    ),
    directionalStatus: directionalChecks.every((item) => item.status === "pass")
      ? "pass"
      : "mixed",
    directionalChecks,
    scenarios: results,
  };
}
