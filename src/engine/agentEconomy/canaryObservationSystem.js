import { normalizeEngineControl } from "./engineControlSystem.js";

export const CANARY_OBSERVATION_VERSION = 1;
export const CANARY_OBSERVATION_HISTORY_LIMIT = 48;
export const CANARY_CAMPAIGN_HISTORY_LIMIT = 12;
export const RELEASE_GUARDRAIL_WINDOW = 3;
export const MIN_COMPLETED_TRIAL_CAMPAIGNS = 3;

export const RELEASE_DRIFT_LIMITS = Object.freeze({
  denariiRatio: 0.35,
  foodRatio: 0.5,
  inventoryRatio: 0.5,
  populationAbsolute: 0,
});

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function integer(value, fallback = 0) {
  return Math.max(0, Math.floor(finite(value, fallback)));
}

function round(value, digits = 4) {
  return Number(finite(value).toFixed(digits));
}

function unique(values = []) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}

function totalInventory(inventory = {}) {
  return Object.values(inventory ?? {}).reduce((total, amount) => total + Math.max(0, finite(amount)), 0);
}

function normalizeDelta(delta = {}) {
  return {
    denarii: round(delta.denarii ?? delta.cash, 2),
    food: round(delta.food, 4),
    population: Math.trunc(finite(delta.population)),
    inventory: round(delta.inventory, 4),
  };
}

function checkpointShift(checkpoint = {}, committed = {}) {
  return {
    denarii: round(finite(committed.denarii) - finite(checkpoint.denarii), 2),
    food: round(finite(committed.food) - finite(checkpoint.food), 4),
    population: integer(committed.population) - integer(checkpoint.population),
    inventory: round(totalInventory(committed.inventory) - totalInventory(checkpoint.inventory), 4),
  };
}

function modelDrift(comparison = {}) {
  const legacy = normalizeDelta(comparison.legacyDeltas);
  const agent = normalizeDelta(comparison.agentDeltas);
  return {
    denarii: round(agent.denarii - legacy.denarii, 2),
    food: round(agent.food - legacy.food, 4),
    population: agent.population - legacy.population,
    inventory: round(agent.inventory - legacy.inventory, 4),
  };
}

function driftRatios(drift, checkpoint = {}) {
  return {
    denarii: round(Math.abs(drift.denarii) / Math.max(100, Math.abs(finite(checkpoint.denarii))), 4),
    food: round(Math.abs(drift.food) / Math.max(10, Math.abs(finite(checkpoint.food))), 4),
    population: Math.abs(Math.trunc(finite(drift.population))),
    inventory: round(
      Math.abs(drift.inventory) / Math.max(10, totalInventory(checkpoint.inventory)),
      4,
    ),
  };
}

export function normalizeCanaryObservation(observation) {
  const source = observation && typeof observation === "object" ? observation : {};
  const drift = normalizeDelta(source.modelDrift);
  return {
    version: CANARY_OBSERVATION_VERSION,
    id: typeof source.id === "string" ? source.id : null,
    campaignId: typeof source.campaignId === "string" ? source.campaignId : null,
    transactionId: typeof source.transactionId === "string" ? source.transactionId : null,
    turn: integer(source.turn),
    season: typeof source.season === "string" ? source.season : null,
    status: source.status === "rolled-back" ? "rolled-back" : "committed",
    applied: source.applied === true,
    issues: Array.isArray(source.issues)
      ? source.issues.filter((item) => typeof item === "string").slice(0, 20)
      : [],
    legacyDeltas: normalizeDelta(source.legacyDeltas),
    agentDeltas: normalizeDelta(source.agentDeltas),
    resourceShift: normalizeDelta(source.resourceShift),
    modelDrift: drift,
    driftRatios: {
      denarii: Math.max(0, finite(source.driftRatios?.denarii)),
      food: Math.max(0, finite(source.driftRatios?.food)),
      population: Math.max(0, integer(source.driftRatios?.population)),
      inventory: Math.max(0, finite(source.driftRatios?.inventory)),
    },
  };
}

export function normalizeCanaryCampaignSummary(summary) {
  const source = summary && typeof summary === "object" ? summary : {};
  return {
    version: CANARY_OBSERVATION_VERSION,
    id: typeof source.id === "string" ? source.id : null,
    status: source.status === "completed" ? "completed" : "aborted",
    quarterLimit: Math.max(1, integer(source.quarterLimit, 3)),
    attemptedQuarters: integer(source.attemptedQuarters),
    committedQuarters: integer(source.committedQuarters),
    startedTurn: Number.isFinite(source.startedTurn) ? integer(source.startedTurn) : null,
    completedTurn: Number.isFinite(source.completedTurn) ? integer(source.completedTurn) : null,
    lastStopReason: typeof source.lastStopReason === "string" ? source.lastStopReason : null,
    observationCount: integer(source.observationCount),
    rollbackCount: integer(source.rollbackCount),
    maxDriftRatios: {
      denarii: Math.max(0, finite(source.maxDriftRatios?.denarii)),
      food: Math.max(0, finite(source.maxDriftRatios?.food)),
      population: Math.max(0, integer(source.maxDriftRatios?.population)),
      inventory: Math.max(0, finite(source.maxDriftRatios?.inventory)),
    },
    totalResourceShift: normalizeDelta(source.totalResourceShift),
  };
}

export function recordCanaryObservation(control, transaction, comparison = {}) {
  const normalized = normalizeEngineControl(control);
  if (!transaction || typeof transaction !== "object") return normalized;
  const campaignId = typeof normalized.canaryCampaign?.id === "string"
    ? normalized.canaryCampaign.id
    : null;
  const sequence = integer(normalized.canaryObservationSequence) + 1;
  const drift = modelDrift(comparison);
  const checkpoint = transaction.checkpoint ?? {};
  const observation = normalizeCanaryObservation({
    id: `canary-observation-${String(sequence).padStart(4, "0")}`,
    campaignId,
    transactionId: transaction.id,
    turn: transaction.turn,
    season: transaction.season,
    status: transaction.status,
    applied: transaction.applied,
    issues: transaction.issues,
    legacyDeltas: comparison.legacyDeltas,
    agentDeltas: comparison.agentDeltas,
    resourceShift: transaction.committed
      ? checkpointShift(checkpoint, transaction.committed)
      : {},
    modelDrift: drift,
    driftRatios: driftRatios(drift, checkpoint),
  });

  return {
    ...normalized,
    canaryObservationSequence: sequence,
    lastCanaryObservation: observation,
    canaryObservations: [
      ...(Array.isArray(normalized.canaryObservations) ? normalized.canaryObservations : []),
      observation,
    ].slice(-CANARY_OBSERVATION_HISTORY_LIMIT),
  };
}

function maxRatios(observations) {
  return observations.reduce((maximums, observation) => ({
    denarii: Math.max(maximums.denarii, finite(observation.driftRatios?.denarii)),
    food: Math.max(maximums.food, finite(observation.driftRatios?.food)),
    population: Math.max(maximums.population, integer(observation.driftRatios?.population)),
    inventory: Math.max(maximums.inventory, finite(observation.driftRatios?.inventory)),
  }), { denarii: 0, food: 0, population: 0, inventory: 0 });
}

function sumShifts(observations) {
  return observations.reduce((total, observation) => ({
    denarii: round(total.denarii + finite(observation.resourceShift?.denarii), 2),
    food: round(total.food + finite(observation.resourceShift?.food), 4),
    population: total.population + Math.trunc(finite(observation.resourceShift?.population)),
    inventory: round(total.inventory + finite(observation.resourceShift?.inventory), 4),
  }), { denarii: 0, food: 0, population: 0, inventory: 0 });
}

export function archiveCanaryCampaign(control, campaign) {
  const normalized = normalizeEngineControl(control);
  if (!campaign || typeof campaign !== "object" || typeof campaign.id !== "string") return normalized;
  const existing = Array.isArray(normalized.canaryCampaignHistory)
    ? normalized.canaryCampaignHistory.map(normalizeCanaryCampaignSummary)
    : [];
  if (existing.some((summary) => summary.id === campaign.id)) return normalized;

  const observations = (normalized.canaryObservations ?? [])
    .map(normalizeCanaryObservation)
    .filter((observation) => observation.campaignId === campaign.id);
  const summary = normalizeCanaryCampaignSummary({
    id: campaign.id,
    status: campaign.status,
    quarterLimit: campaign.quarterLimit,
    attemptedQuarters: campaign.attemptedQuarters,
    committedQuarters: campaign.committedQuarters,
    startedTurn: campaign.startedTurn,
    completedTurn: campaign.completedTurn,
    lastStopReason: campaign.lastStopReason,
    observationCount: observations.length,
    rollbackCount: observations.filter((observation) => observation.status === "rolled-back").length,
    maxDriftRatios: maxRatios(observations),
    totalResourceShift: sumShifts(observations),
  });

  return {
    ...normalized,
    lastCanaryCampaignSummary: summary,
    canaryCampaignHistory: [...existing, summary].slice(-CANARY_CAMPAIGN_HISTORY_LIMIT),
  };
}

export function getCanaryReleaseGuardrails(control) {
  const normalized = normalizeEngineControl(control);
  const history = (normalized.canaryCampaignHistory ?? []).map(normalizeCanaryCampaignSummary);
  const standardCompleted = history.filter(
    (summary) => summary.status === "completed"
      && summary.quarterLimit === 3
      && summary.committedQuarters === 3,
  );
  const recent = history.slice(-RELEASE_GUARDRAIL_WINDOW);
  const blockers = [];

  if (standardCompleted.length < MIN_COMPLETED_TRIAL_CAMPAIGNS) {
    blockers.push(`completed-trials:${standardCompleted.length}/${MIN_COMPLETED_TRIAL_CAMPAIGNS}`);
  }
  if (recent.length < RELEASE_GUARDRAIL_WINDOW) {
    blockers.push(`observation-window:${recent.length}/${RELEASE_GUARDRAIL_WINDOW}`);
  }
  if (recent.some((summary) => summary.status !== "completed")) {
    blockers.push("recent-campaign-abort");
  }
  if (recent.some((summary) => summary.rollbackCount > 0)) {
    blockers.push("recent-transaction-rollback");
  }

  const maximums = maxRatios(recent.map((summary) => ({ driftRatios: summary.maxDriftRatios })));
  if (maximums.denarii > RELEASE_DRIFT_LIMITS.denariiRatio) blockers.push("denarii-drift-limit");
  if (maximums.food > RELEASE_DRIFT_LIMITS.foodRatio) blockers.push("food-drift-limit");
  if (maximums.inventory > RELEASE_DRIFT_LIMITS.inventoryRatio) blockers.push("inventory-drift-limit");
  if (maximums.population > RELEASE_DRIFT_LIMITS.populationAbsolute) blockers.push("population-drift");

  return {
    ready: blockers.length === 0,
    blockers: unique(blockers),
    completedStandardTrials: standardCompleted.length,
    requiredStandardTrials: MIN_COMPLETED_TRIAL_CAMPAIGNS,
    observationWindow: recent.length,
    requiredObservationWindow: RELEASE_GUARDRAIL_WINDOW,
    recentCampaigns: recent,
    maximumDriftRatios: maximums,
    limits: { ...RELEASE_DRIFT_LIMITS },
  };
}
