import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  gameReducer,
  initialState,
} from "../src/engine/agentEconomy/integratedGameReducer.js";
import {
  CANARY_PILOT_STATUS,
  getCanaryPilotReport,
  getCanaryReleaseGuardrails,
  projectAgentEconomyToLegacyState,
} from "../src/engine/agentEconomy/index.js";

const DEFAULT_SEED = 0x5a17c9e3;
const MAX_WARMUP_QUARTERS = 20;
const CAMPAIGN_COUNT = 3;
const QUARTERS_PER_CAMPAIGN = 3;

function parseArguments(argv) {
  const args = Object.fromEntries(argv
    .filter((item) => item.startsWith("--"))
    .map((item) => {
      const [key, ...parts] = item.slice(2).split("=");
      return [key, parts.join("=")];
    }));
  const parsedSeed = Number(args.seed);
  return {
    seed: Number.isFinite(parsedSeed) ? Math.trunc(parsedSeed) >>> 0 : DEFAULT_SEED,
    output: args.output || "artifacts/canary-third-campaign-rehearsal.json",
    difficulty: ["easy", "normal", "hard"].includes(args.difficulty)
      ? args.difficulty
      : "normal",
  };
}

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return function seededRandom() {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function round(value, digits = 4) {
  return Number(finite(value).toFixed(digits));
}

function totalInventory(inventory = {}) {
  return round(Object.values(inventory ?? {}).reduce(
    (total, amount) => total + Math.max(0, finite(amount)),
    0,
  ));
}

function resourceSnapshot(state = {}) {
  return {
    turn: Math.max(0, Math.floor(finite(state.turn))),
    season: typeof state.season === "string" ? state.season : null,
    year: Math.max(0, Math.floor(finite(state.year))),
    phase: typeof state.phase === "string" ? state.phase : null,
    denarii: round(Math.max(0, finite(state.denarii)), 2),
    food: round(Math.max(0, finite(state.food))),
    population: Math.max(0, Math.floor(finite(state.population))),
    garrison: Math.max(0, Math.floor(finite(state.garrison))),
    totalInventory: totalInventory(state.inventory),
  };
}

function stateDigest(state = {}) {
  const payload = {
    ...resourceSnapshot(state),
    inventory: Object.fromEntries(
      Object.entries(state.inventory ?? {}).sort(([left], [right]) => left.localeCompare(right)),
    ),
    agentDay: state.agentEconomy?.day ?? 0,
    rngState: state.agentEconomy?.rngState ?? null,
    campaignHistory: state.agentEconomy?.engineControl?.canaryCampaignHistory ?? [],
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function isTerminal(state) {
  return state.phase === "game_over" || state.phase === "victory";
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function resolveSeasonFlow(state) {
  let next = state;
  for (let step = 0; step < 60; step += 1) {
    if (isTerminal(next)) return next;
    switch (next.phase) {
      case "raid_warning":
        next = gameReducer(next, { type: "RAID_DEFEND" });
        break;
      case "raid_result":
        next = gameReducer(next, { type: "RAID_CONTINUE" });
        break;
      case "seasonal_action":
        next = gameReducer(next, {
          type: "SELECT_SEASONAL_ACTION",
          payload: { optionIndex: 0 },
        });
        break;
      case "seasonal_resolve":
        next = gameReducer(next, {
          type: "CONTINUE_TO_RANDOM",
          payload: { randomEvents: [] },
        });
        break;
      case "random_event":
        next = gameReducer(next, {
          type: "SELECT_RANDOM_RESPONSE",
          payload: { optionIndex: 0 },
        });
        break;
      case "random_resolve":
        next = gameReducer(next, { type: "ADVANCE_TURN" });
        break;
      case "flip_intro":
        next = gameReducer(next, { type: "DISMISS_FLIP_INTRO" });
        break;
      case "flip_decision":
        next = gameReducer(next, {
          type: "SELECT_FLIP_OPTION",
          payload: { optionIndex: 0 },
        });
        break;
      case "flip_outcome":
        next = gameReducer(next, { type: "CONTINUE_FLIP" });
        break;
      case "flip_summary":
        next = gameReducer(next, { type: "DISMISS_FLIP_SUMMARY" });
        break;
      case "management":
        return next;
      default:
        throw new Error(`Unsupported quarter phase: ${next.phase}`);
    }
  }
  throw new Error(`Season flow did not settle; final phase=${next.phase}`);
}

function runQuarter(state) {
  assertCondition(
    state.phase === "management",
    `Quarter must start in management; received ${state.phase}`,
  );
  const before = resourceSnapshot(state);
  const previousTransactionId = state.agentEconomy?.engineControl?.lastCanaryTransaction?.id ?? null;
  let simulated = gameReducer(state, {
    type: "SIMULATE_SEASON",
    payload: { seasonalEvents: [] },
  });
  const control = simulated.agentEconomy?.engineControl ?? {};
  const transaction = control.lastCanaryTransaction?.id !== previousTransactionId
    ? control.lastCanaryTransaction
    : null;
  const observation = transaction
    ? control.canaryObservations?.find((item) => item.transactionId === transaction.id) ?? null
    : null;
  const comparison = control.lastComparison ?? null;
  const afterSimulation = resourceSnapshot(simulated);
  simulated = resolveSeasonFlow(simulated);
  return {
    state: simulated,
    record: {
      before,
      afterSimulation,
      afterAdvance: resourceSnapshot(simulated),
      comparison: comparison ? {
        id: comparison.id,
        safe: comparison.safe === true,
        criticalIssues: comparison.criticalIssues ?? [],
        warnings: comparison.warnings ?? [],
        legacyDeltas: comparison.legacyDeltas ?? null,
        agentDeltas: comparison.agentDeltas ?? null,
      } : null,
      transaction: transaction ? {
        id: transaction.id,
        status: transaction.status,
        applied: transaction.applied === true,
        issues: transaction.issues ?? [],
      } : null,
      observation: observation ? {
        id: observation.id,
        campaignId: observation.campaignId,
        status: observation.status,
        applied: observation.applied === true,
        issues: observation.issues ?? [],
        legacyDeltas: observation.legacyDeltas,
        agentDeltas: observation.agentDeltas,
        resourceShift: observation.resourceShift,
        modelDrift: observation.modelDrift,
        driftRatios: observation.driftRatios,
      } : null,
    },
  };
}

function runCampaign(state, campaignNumber) {
  const quarters = [];
  let next = state;
  for (let index = 0; index < QUARTERS_PER_CAMPAIGN; index += 1) {
    const result = runQuarter(next);
    next = result.state;
    quarters.push({ campaignNumber, index: index + 1, ...result.record });
    assertCondition(
      !isTerminal(next),
      `Campaign ${campaignNumber} reached terminal phase: ${next.phase}`,
    );
  }
  return { state: next, quarters };
}

function inventoryMismatch(projected = {}, official = {}) {
  const commodities = new Set([...Object.keys(projected), ...Object.keys(official)]);
  return [...commodities]
    .map((commodity) => ({
      commodity,
      delta: round(finite(projected[commodity]) - finite(official[commodity])),
    }))
    .filter((item) => Math.abs(item.delta) > 0.0002);
}

function inspectActivationBaseline(state, expectedReason) {
  const projected = projectAgentEconomyToLegacyState(state.agentEconomy, state);
  const mismatches = inventoryMismatch(projected.inventory, state.inventory);
  const adapter = state.agentEconomy?.liveStateAdapter ?? {};
  const result = {
    reason: adapter.activationBaseline?.reason ?? null,
    denariiDelta: round(projected.denarii - finite(state.denarii), 2),
    foodDelta: round(projected.food - finite(state.food)),
    populationDelta: Math.trunc(finite(projected.population) - finite(state.population)),
    inventoryMismatches: mismatches,
    pendingOrders: Array.isArray(state.agentEconomy?.pendingOrders)
      ? state.agentEconomy.pendingOrders.length
      : null,
  };
  result.aligned = result.reason === expectedReason
    && Math.abs(result.denariiDelta) <= 0.01
    && Math.abs(result.foodDelta) <= 0.0002
    && result.populationDelta === 0
    && result.inventoryMismatches.length === 0
    && result.pendingOrders === 0;
  return result;
}

function campaignCommitted(quarters) {
  return quarters.every((quarter) => quarter.transaction?.status === "committed"
    && quarter.transaction?.applied === true
    && quarter.observation?.status === "committed"
    && quarter.observation?.applied === true);
}

function campaignMaxRatios(quarters) {
  return quarters.reduce((maximums, quarter) => ({
    denarii: Math.max(maximums.denarii, finite(quarter.observation?.driftRatios?.denarii)),
    food: Math.max(maximums.food, finite(quarter.observation?.driftRatios?.food)),
    population: Math.max(maximums.population, finite(quarter.observation?.driftRatios?.population)),
    inventory: Math.max(maximums.inventory, finite(quarter.observation?.driftRatios?.inventory)),
  }), { denarii: 0, food: 0, population: 0, inventory: 0 });
}

function withinReleaseLimits(ratios, limits) {
  return finite(ratios.denarii) <= finite(limits.denariiRatio, 0.35)
    && finite(ratios.food) <= finite(limits.foodRatio, 0.5)
    && finite(ratios.inventory) <= finite(limits.inventoryRatio, 0.5)
    && Math.trunc(finite(ratios.population)) <= Math.trunc(finite(limits.populationAbsolute));
}

function quarterRatios(quarters) {
  return quarters.map((quarter) => ({
    turn: quarter.before.turn,
    season: quarter.before.season,
    denarii: finite(quarter.observation?.driftRatios?.denarii),
    food: finite(quarter.observation?.driftRatios?.food),
    population: finite(quarter.observation?.driftRatios?.population),
    inventory: finite(quarter.observation?.driftRatios?.inventory),
  }));
}

const options = parseArguments(process.argv.slice(2));
const originalRandom = Math.random;
Math.random = createSeededRandom(options.seed);

try {
  let state = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: options.difficulty },
  });
  const initialStateSnapshot = resourceSnapshot(state);
  const initialDigest = stateDigest(state);
  const warmup = [];

  while (
    state.agentEconomy.engineControl.consecutiveSafeQuarters
      < state.agentEconomy.engineControl.requiredSafeQuarters
    && warmup.length < MAX_WARMUP_QUARTERS
  ) {
    const result = runQuarter(state);
    state = result.state;
    warmup.push(result.record);
    assertCondition(!isTerminal(state), `Warmup reached terminal phase: ${state.phase}`);
  }

  const warmControl = state.agentEconomy.engineControl;
  assertCondition(
    warmControl.consecutiveSafeQuarters >= warmControl.requiredSafeQuarters,
    `Safe-quarter warmup failed: ${warmControl.consecutiveSafeQuarters}/${warmControl.requiredSafeQuarters}`,
  );

  const campaignRuns = [];
  const activations = [];
  const reviewCheckpoints = [];

  state = gameReducer(state, { type: "AGENT_ECONOMY_START_CANARY_PILOT" });
  assertCondition(
    state.agentEconomy.engineControl.canaryPilot?.status === CANARY_PILOT_STATUS.RUNNING,
    `First campaign did not start: ${state.agentEconomy.engineControl.canaryPilot?.lastStopReason ?? "unknown"}`,
  );
  activations.push(inspectActivationBaseline(state, "pilot-start"));
  assertCondition(activations[0].aligned, `First activation failed: ${JSON.stringify(activations[0])}`);

  for (let campaignNumber = 1; campaignNumber <= CAMPAIGN_COUNT; campaignNumber += 1) {
    const run = runCampaign(state, campaignNumber);
    state = run.state;
    campaignRuns.push(run);
    assertCondition(
      campaignCommitted(run.quarters),
      `Campaign ${campaignNumber} contains an uncommitted transaction`,
    );

    const report = getCanaryPilotReport(state.agentEconomy.engineControl);
    if (campaignNumber < CAMPAIGN_COUNT) {
      assertCondition(
        report.status === CANARY_PILOT_STATUS.AWAITING_REVIEW
          && report.completedCampaigns === campaignNumber,
        `Campaign ${campaignNumber} did not pause for review: ${report.status}/${report.completedCampaigns}`,
      );
      reviewCheckpoints.push({
        afterCampaign: campaignNumber,
        state: resourceSnapshot(state),
        digest: stateDigest(state),
        action: "AGENT_ECONOMY_CONTINUE_CANARY_PILOT",
      });
      state = gameReducer(state, { type: "AGENT_ECONOMY_CONTINUE_CANARY_PILOT" });
      assertCondition(
        state.agentEconomy.engineControl.canaryPilot?.status === CANARY_PILOT_STATUS.RUNNING,
        `Campaign ${campaignNumber + 1} did not start: ${state.agentEconomy.engineControl.canaryPilot?.lastStopReason ?? "unknown"}`,
      );
      const activation = inspectActivationBaseline(state, "pilot-continue");
      activations.push(activation);
      assertCondition(
        activation.aligned,
        `Campaign ${campaignNumber + 1} activation failed: ${JSON.stringify(activation)}`,
      );
    }
  }

  const control = state.agentEconomy.engineControl;
  const pilotReport = getCanaryPilotReport(control);
  const releaseGate = getCanaryReleaseGuardrails(control);
  const campaignRatios = campaignRuns.map((run) => campaignMaxRatios(run.quarters));
  const allRatiosWithinLimits = withinReleaseLimits(
    pilotReport.maximumDriftRatios,
    releaseGate.limits ?? {},
  );
  const hardSafety = {
    safeWarmup: warmControl.consecutiveSafeQuarters >= warmControl.requiredSafeQuarters,
    allActivationsAligned: activations.length === CAMPAIGN_COUNT
      && activations.every((activation) => activation.aligned),
    allCampaignsCommitted: campaignRuns.length === CAMPAIGN_COUNT
      && campaignRuns.every((run) => campaignCommitted(run.quarters)),
    pilotCompleted: pilotReport.status === CANARY_PILOT_STATUS.COMPLETED,
    completedCampaigns: pilotReport.completedCampaigns === CAMPAIGN_COUNT,
    committedQuarters: pilotReport.committedQuarters === CAMPAIGN_COUNT * QUARTERS_PER_CAMPAIGN,
    rollbackCountZero: pilotReport.rollbackCount === 0,
    populationDriftZero: campaignRuns.every((run) => run.quarters.every(
      (quarter) => finite(quarter.observation?.driftRatios?.population) === 0,
    )),
    writeBackClosedAfterPilot: control.writeBackEnabled === false,
    legacyAuthorityRestored: control.authority === "legacy",
    shadowModeRestored: control.activeMode === "shadow",
  };
  assertCondition(
    Object.values(hardSafety).every(Boolean),
    `Third campaign operational safety failed: ${JSON.stringify(hardSafety)}`,
  );
  const releaseReadiness = {
    ratiosWithinLimits: allRatiosWithinLimits,
    releaseGateReady: releaseGate.ready === true,
    releaseGateHasNoBlockers: (releaseGate.blockers ?? []).length === 0,
  };

  const secondFood = finite(campaignRatios[1]?.food);
  const thirdFood = finite(campaignRatios[2]?.food);
  const trend = thirdFood > secondFood
    ? "increased"
    : thirdFood < secondFood
      ? "decreased"
      : "flat";
  const recommendation = releaseGate.ready && allRatiosWithinLimits
    ? "unlock-four-quarter-extension-after-operator-review"
    : "hold-four-quarter-extension";

  const report = {
    schemaVersion: 1,
    evidenceClass: "release-candidate-rehearsal",
    productionReleaseEvidence: false,
    generatedAt: new Date().toISOString(),
    seed: options.seed,
    difficulty: options.difficulty,
    initialState: initialStateSnapshot,
    initialDigest,
    warmup: {
      quarters: warmup.length,
      safeStreak: warmControl.consecutiveSafeQuarters,
      requiredSafeQuarters: warmControl.requiredSafeQuarters,
      records: warmup,
    },
    activations,
    operatorReviewCheckpoints: reviewCheckpoints,
    campaigns: campaignRuns.map((run, index) => ({
      campaignNumber: index + 1,
      activation: activations[index],
      maximumDriftRatios: campaignRatios[index],
      quarterDriftRatios: quarterRatios(run.quarters),
      quarters: run.quarters,
    })),
    thirdCampaignTrend: {
      secondCampaignFoodMaximum: secondFood,
      thirdCampaignFoodMaximum: thirdFood,
      direction: trend,
      increasedButWithinLimit: trend === "increased"
        && thirdFood <= finite(releaseGate.limits?.foodRatio, 0.5),
    },
    pilot: {
      id: pilotReport.id,
      status: pilotReport.status,
      attemptedCampaigns: pilotReport.attemptedCampaigns,
      completedCampaigns: pilotReport.completedCampaigns,
      committedQuarters: pilotReport.committedQuarters,
      rollbackCount: pilotReport.rollbackCount,
      remainingCampaigns: pilotReport.remainingCampaigns,
      progress: pilotReport.progress,
      maximumDriftRatios: pilotReport.maximumDriftRatios,
      campaignSummaries: pilotReport.summaries,
    },
    releaseGate: {
      ready: releaseGate.ready,
      blockers: releaseGate.blockers,
      completedStandardTrials: releaseGate.completedStandardTrials,
      requiredStandardTrials: releaseGate.requiredStandardTrials,
      recentCampaignCount: releaseGate.recentCampaignCount,
      limits: releaseGate.limits,
      allRatiosWithinLimits,
    },
    hardSafety,
    releaseReadiness,
    recommendation,
    endingState: resourceSnapshot(state),
    endingDigest: stateDigest(state),
    notes: [
      "This run replays both reviewed campaigns and then explicitly continues the same pilot into campaign three.",
      "All three campaign activations use the production Canary rebase path.",
      "It uses a deterministic repository-generated new-game state, not a player's browser save.",
      "The report is an audit artifact and is excluded from production release evidence.",
    ],
  };

  await mkdir(path.dirname(options.output), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: options.output,
    warmupQuarters: warmup.length,
    pilotStatus: pilotReport.status,
    completedCampaigns: pilotReport.completedCampaigns,
    committedQuarters: pilotReport.committedQuarters,
    rollbackCount: pilotReport.rollbackCount,
    campaignMaximumDriftRatios: campaignRatios,
    combinedMaximumDriftRatios: pilotReport.maximumDriftRatios,
    releaseGateReady: releaseGate.ready,
    releaseGateBlockers: releaseGate.blockers,
    recommendation,
  }, null, 2));
} catch (error) {
  const failure = {
    schemaVersion: 1,
    evidenceClass: "release-candidate-rehearsal",
    productionReleaseEvidence: false,
    generatedAt: new Date().toISOString(),
    seed: options.seed,
    difficulty: options.difficulty,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null,
  };
  await mkdir(path.dirname(options.output), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(failure, null, 2)}\n`, "utf8");
  console.error(failure.error);
  process.exitCode = 1;
} finally {
  Math.random = originalRandom;
}
