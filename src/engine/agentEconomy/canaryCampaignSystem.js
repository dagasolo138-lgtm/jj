import {
  ENGINE_MODES,
  forceEngineRollback,
  normalizeEngineControl,
  requestEngineMode,
  setEngineWriteBackEnabled,
} from "./engineControlSystem.js";

export const CANARY_CAMPAIGN_VERSION = 1;
export const DEFAULT_CANARY_CAMPAIGN_QUARTERS = 3;
export const MAX_CANARY_CAMPAIGN_QUARTERS = 4;

export const CANARY_CAMPAIGN_STATUS = Object.freeze({
  IDLE: "idle",
  BLOCKED: "blocked",
  RUNNING: "running",
  COMPLETED: "completed",
  ABORTED: "aborted",
});

function integer(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function clampQuarterLimit(value) {
  return Math.max(
    1,
    Math.min(MAX_CANARY_CAMPAIGN_QUARTERS, integer(value, DEFAULT_CANARY_CAMPAIGN_QUARTERS)),
  );
}

function unique(values = []) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}

function ensureWriteBlocker(blockers = []) {
  return unique([...blockers.filter((item) => item !== "candidate-write-disabled"), "candidate-write-disabled"]);
}

export function createInitialCanaryCampaign() {
  return {
    version: CANARY_CAMPAIGN_VERSION,
    status: CANARY_CAMPAIGN_STATUS.IDLE,
    quarterLimit: DEFAULT_CANARY_CAMPAIGN_QUARTERS,
    attemptedQuarters: 0,
    committedQuarters: 0,
    startedTurn: null,
    completedTurn: null,
    lastStopReason: null,
    lastTransactionId: null,
  };
}

export function normalizeCanaryCampaign(campaign) {
  const source = campaign && typeof campaign === "object" ? campaign : {};
  const fallback = createInitialCanaryCampaign();
  const status = Object.values(CANARY_CAMPAIGN_STATUS).includes(source.status)
    ? source.status
    : fallback.status;

  return {
    ...fallback,
    ...source,
    version: CANARY_CAMPAIGN_VERSION,
    status,
    quarterLimit: clampQuarterLimit(source.quarterLimit),
    attemptedQuarters: integer(source.attemptedQuarters),
    committedQuarters: integer(source.committedQuarters),
    startedTurn: Number.isFinite(source.startedTurn) ? integer(source.startedTurn) : null,
    completedTurn: Number.isFinite(source.completedTurn) ? integer(source.completedTurn) : null,
    lastStopReason: typeof source.lastStopReason === "string" ? source.lastStopReason : null,
    lastTransactionId: typeof source.lastTransactionId === "string" ? source.lastTransactionId : null,
  };
}

export function getCanaryCampaignBlockers(control) {
  const normalized = normalizeEngineControl(control);
  const blockers = [];
  for (const [name, ready] of Object.entries(normalized.adapterCapabilities ?? {})) {
    if (ready !== true) blockers.push(`adapter-not-ready:${name}`);
  }
  if (normalized.consecutiveSafeQuarters < normalized.requiredSafeQuarters) {
    blockers.push(
      `safe-quarter-streak:${normalized.consecutiveSafeQuarters}/${normalized.requiredSafeQuarters}`,
    );
  }
  return unique(blockers);
}

export function isCanaryCampaignRunning(control) {
  return normalizeCanaryCampaign(control?.canaryCampaign).status === CANARY_CAMPAIGN_STATUS.RUNNING;
}

export function startCanaryCampaign(control, options = {}) {
  const normalized = normalizeEngineControl(control);
  const quarterLimit = clampQuarterLimit(options.quarterLimit);
  const turn = integer(options.turn);
  const blockers = getCanaryCampaignBlockers(normalized);

  if (blockers.length > 0) {
    return {
      ...normalized,
      canaryCampaign: {
        ...createInitialCanaryCampaign(),
        status: CANARY_CAMPAIGN_STATUS.BLOCKED,
        quarterLimit,
        completedTurn: turn,
        lastStopReason: `campaign-blocked:${blockers.join(",")}`,
      },
    };
  }

  const writeEnabled = setEngineWriteBackEnabled(normalized, true);
  const canary = requestEngineMode(writeEnabled, ENGINE_MODES.CANARY, turn);
  return {
    ...canary,
    requestedMode: ENGINE_MODES.CANARY,
    activeMode: ENGINE_MODES.CANARY,
    authority: ENGINE_MODES.LEGACY,
    writeBackEnabled: true,
    canaryEligible: true,
    promotionBlockers: [],
    canaryCampaign: {
      ...createInitialCanaryCampaign(),
      status: CANARY_CAMPAIGN_STATUS.RUNNING,
      quarterLimit,
      startedTurn: turn,
    },
  };
}

export function stopCanaryCampaign(control, reason = "operator-stop", turn = 0) {
  const normalized = normalizeEngineControl(control);
  const campaign = normalizeCanaryCampaign(normalized.canaryCampaign);
  const rolledBack = forceEngineRollback(normalized, `canary-campaign:${reason}`, turn);
  return {
    ...rolledBack,
    promotionBlockers: ensureWriteBlocker(rolledBack.promotionBlockers),
    canaryCampaign: {
      ...campaign,
      status: CANARY_CAMPAIGN_STATUS.ABORTED,
      completedTurn: integer(turn),
      lastStopReason: reason,
    },
  };
}

export function finalizeCanaryCampaignTransaction(control, transaction, turn = 0) {
  const normalized = normalizeEngineControl(control);
  const campaign = normalizeCanaryCampaign(normalized.canaryCampaign);
  if (campaign.status !== CANARY_CAMPAIGN_STATUS.RUNNING || !transaction) return normalized;

  const attemptedQuarters = campaign.attemptedQuarters + 1;
  const committed = transaction.status === "committed" && transaction.applied === true;
  const committedQuarters = campaign.committedQuarters + (committed ? 1 : 0);
  const baseCampaign = {
    ...campaign,
    attemptedQuarters,
    committedQuarters,
    lastTransactionId: typeof transaction.id === "string" ? transaction.id : null,
  };

  if (!committed) {
    return {
      ...normalized,
      requestedMode: ENGINE_MODES.SHADOW,
      activeMode: ENGINE_MODES.SHADOW,
      authority: ENGINE_MODES.LEGACY,
      writeBackEnabled: false,
      canaryEligible: false,
      promotionBlockers: ensureWriteBlocker(normalized.promotionBlockers),
      canaryCampaign: {
        ...baseCampaign,
        status: CANARY_CAMPAIGN_STATUS.ABORTED,
        completedTurn: integer(turn),
        lastStopReason: transaction.issues?.[0] ?? "transaction-rollback",
      },
    };
  }

  if (committedQuarters >= campaign.quarterLimit) {
    return {
      ...normalized,
      requestedMode: ENGINE_MODES.SHADOW,
      activeMode: ENGINE_MODES.SHADOW,
      authority: ENGINE_MODES.LEGACY,
      writeBackEnabled: false,
      canaryEligible: false,
      promotionBlockers: ensureWriteBlocker(normalized.promotionBlockers),
      canaryCampaign: {
        ...baseCampaign,
        status: CANARY_CAMPAIGN_STATUS.COMPLETED,
        completedTurn: integer(turn),
        lastStopReason: "campaign-limit-reached",
      },
    };
  }

  return {
    ...normalized,
    authority: ENGINE_MODES.CANARY,
    canaryCampaign: baseCampaign,
  };
}
