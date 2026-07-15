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
} from "../src/engine/agentEconomy/index.js";

const DEFAULT_SEED = 0x5a17c9e3;
const MAX_WARMUP_QUARTERS = 20;
const PILOT_QUARTERS = 3;

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
    output: args.output || "artifacts/canary-release-candidate-rehearsal.json",
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
    inventory: Object.fromEntries(Object.entries(state.inventory ?? {}).sort(([left], [right]) => left.localeCompare(right))),
    agentDay: state.agentEconomy?.day ?? 0,
    rngState: state.agentEconomy?.rngState ?? null,
    campaignHistory: state.agentEconomy?.engineControl?.canaryCampaignHistory ?? [],
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function isTerminal(state) {
  return state.phase === "game_over" || state.phase === "victory";
}

function resolveSeasonFlow(state) {
  let next = state;
  for (let step = 0; step < 20; step += 1) {
    if (isTerminal(next)) return next;
    switch (next.phase) {
      case "raid_warning":
        next = gameReducer(next, { type: "RAID_DEFEND" });
        break;
      case "raid_result":
        next = gameReducer(next, { type: "RAID_CONTINUE" });
        break;
      case "seasonal_action":
        next = gameReducer(next, { type: "SELECT_SEASONAL_ACTION", payload: { optionIndex: 0 } });
        break;
      case "seasonal_resolve":
        next = gameReducer(next, { type: "CONTINUE_TO_RANDOM", payload: { randomEvents: [] } });
        break;
      case "random_event":
        next = gameReducer(next, { type: "SELECT_RANDOM_RESPONSE", payload: { optionIndex: 0 } });
        break;
      case "random_resolve":
        return gameReducer(next, { type: "ADVANCE_TURN" });
      case "management":
        return next;
      default:
        throw new Error(`Unsupported quarter phase: ${next.phase}`);
    }
  }
  throw new Error(`Season flow did not settle; final phase=${next.phase}`);
}

function runQuarter(state) {
  if (state.phase !== "management") {
    throw new Error(`Quarter must start in management; received ${state.phase}`);
  }
  const before = resourceSnapshot(state);
  const previousTransactionId = state.agentEconomy?.engineControl?.lastCanaryTransaction?.id ?? null;
  let simulated = gameReducer(state, {
    type: "SIMULATE_SEASON",
    payload: { seasonalEvents: [] },
  });
  const controlAfterSimulation = simulated.agentEconomy?.engineControl ?? {};
  const transaction = controlAfterSimulation.lastCanaryTransaction?.id !== previousTransactionId
    ? controlAfterSimulation.lastCanaryTransaction
    : null;
  const observation = transaction
    ? controlAfterSimulation.canaryObservations?.find((item) => item.transactionId === transaction.id) ?? null
    : null;
  const comparison = controlAfterSimulation.lastComparison ?? null;
  const afterSimulation = resourceSnapshot(simulated);
  simulated = resolveSeasonFlow(simulated);
  const afterAdvance = resourceSnapshot(simulated);
  return {
    state: simulated,
    record: {
      before,
      afterSimulation,
      afterAdvance,
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

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function evaluateRecommendation(pilotReport, releaseGate) {
  const ratios = pilotReport.maximumDriftRatios ?? {};
  const limits = releaseGate.limits ?? {};
  const withinLimits = finite(ratios.denarii) <= finite(limits.denariiRatio, 0.35)
    && finite(ratios.food) <= finite(limits.foodRatio, 0.5)
    && finite(ratios.inventory) <= finite(limits.inventoryRatio, 0.5)
    && Math.trunc(finite(ratios.population)) <= Math.trunc(finite(limits.populationAbsolute));
  return withinLimits && pilotReport.rollbackCount === 0
    ? "continue-to-second-campaign-after-operator-review"
    : "hold-and-investigate-before-continuing";
}

const options = parseArguments(process.argv.slice(2));
const originalRandom = Math.random;
Math.random = createSeededRandom(options.seed);

try {
  let state = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: options.difficulty },
  });
  const initialSnapshot = resourceSnapshot(state);
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

  state = gameReducer(state, { type: "AGENT_ECONOMY_START_CANARY_PILOT" });
  assertCondition(
    state.agentEconomy.engineControl.canaryPilot?.status === CANARY_PILOT_STATUS.RUNNING,
    `Pilot did not start: ${state.agentEconomy.engineControl.canaryPilot?.lastStopReason ?? "unknown"}`,
  );

  const pilotQuarters = [];
  for (let index = 0; index < PILOT_QUARTERS; index += 1) {
    const result = runQuarter(state);
    state = result.state;
    pilotQuarters.push({ index: index + 1, ...result.record });
    assertCondition(!isTerminal(state), `Pilot reached terminal phase: ${state.phase}`);
  }

  const control = state.agentEconomy.engineControl;
  const pilotReport = getCanaryPilotReport(control);
  const releaseGate = getCanaryReleaseGuardrails(control);
  const endingSnapshot = resourceSnapshot(state);
  const endingDigest = stateDigest(state);
  const committedObservations = pilotQuarters.filter(
    (quarter) => quarter.transaction?.status === "committed"
      && quarter.transaction?.applied === true
      && quarter.observation?.status === "committed",
  );

  const hardSafety = {
    pilotPausedForReview: pilotReport.status === CANARY_PILOT_STATUS.AWAITING_REVIEW,
    completedCampaigns: pilotReport.completedCampaigns === 1,
    committedQuarters: pilotReport.committedQuarters === PILOT_QUARTERS,
    rollbackCountZero: pilotReport.rollbackCount === 0,
    allTransactionsCommitted: committedObservations.length === PILOT_QUARTERS,
    populationDriftZero: pilotQuarters.every(
      (quarter) => finite(quarter.observation?.driftRatios?.population) === 0,
    ),
    writeBackClosedAfterCampaign: control.writeBackEnabled === false,
    legacyAuthorityRestored: control.authority === "legacy",
    shadowModeRestored: control.activeMode === "shadow",
  };

  assertCondition(Object.values(hardSafety).every(Boolean), `Pilot hard safety failed: ${JSON.stringify(hardSafety)}`);

  const report = {
    schemaVersion: 1,
    evidenceClass: "release-candidate-rehearsal",
    productionReleaseEvidence: false,
    generatedAt: new Date().toISOString(),
    seed: options.seed,
    difficulty: options.difficulty,
    initialState: initialSnapshot,
    initialDigest,
    warmup: {
      quarters: warmup.length,
      safeStreak: warmControl.consecutiveSafeQuarters,
      requiredSafeQuarters: warmControl.requiredSafeQuarters,
      records: warmup,
    },
    pilot: {
      id: pilotReport.id,
      status: pilotReport.status,
      attemptedCampaigns: pilotReport.attemptedCampaigns,
      completedCampaigns: pilotReport.completedCampaigns,
      committedQuarters: pilotReport.committedQuarters,
      rollbackCount: pilotReport.rollbackCount,
      remainingCampaigns: pilotReport.remainingCampaigns,
      maximumDriftRatios: pilotReport.maximumDriftRatios,
      campaignSummaries: pilotReport.summaries,
      quarters: pilotQuarters,
    },
    releaseGate: {
      ready: releaseGate.ready,
      blockers: releaseGate.blockers,
      completedStandardTrials: releaseGate.completedStandardTrials,
      requiredStandardTrials: releaseGate.requiredStandardTrials,
      limits: releaseGate.limits,
    },
    hardSafety,
    recommendation: evaluateRecommendation(pilotReport, releaseGate),
    endingState: endingSnapshot,
    endingDigest,
    notes: [
      "This run exercises the production integrated reducer and Canary write-back path.",
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
    committedQuarters: pilotReport.committedQuarters,
    rollbackCount: pilotReport.rollbackCount,
    maximumDriftRatios: pilotReport.maximumDriftRatios,
    recommendation: report.recommendation,
  }, null, 2));
} finally {
  Math.random = originalRandom;
}
