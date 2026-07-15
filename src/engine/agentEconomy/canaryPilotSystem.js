export const CANARY_PILOT_VERSION = 1;
export const DEFAULT_CANARY_PILOT_CAMPAIGNS = 3;

export const CANARY_PILOT_STATUS = Object.freeze({
  IDLE: "idle",
  BLOCKED: "blocked",
  RUNNING: "running",
  AWAITING_REVIEW: "awaiting-review",
  COMPLETED: "completed",
  ABORTED: "aborted",
});

function integer(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function unique(values = []) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}

export function createInitialCanaryPilot() {
  return {
    version: CANARY_PILOT_VERSION,
    id: null,
    status: CANARY_PILOT_STATUS.IDLE,
    targetCampaigns: DEFAULT_CANARY_PILOT_CAMPAIGNS,
    attemptedCampaigns: 0,
    completedCampaigns: 0,
    campaignIds: [],
    activeCampaignId: null,
    lastReviewedCampaignId: null,
    startedTurn: null,
    completedTurn: null,
    lastStopReason: null,
  };
}

export function normalizeCanaryPilot(pilot) {
  const source = pilot && typeof pilot === "object" ? pilot : {};
  const fallback = createInitialCanaryPilot();
  const status = Object.values(CANARY_PILOT_STATUS).includes(source.status)
    ? source.status
    : fallback.status;
  const targetCampaigns = Math.max(
    1,
    integer(source.targetCampaigns, DEFAULT_CANARY_PILOT_CAMPAIGNS),
  );
  const campaignIds = unique(source.campaignIds).slice(-targetCampaigns);

  return {
    ...fallback,
    ...source,
    version: CANARY_PILOT_VERSION,
    id: typeof source.id === "string" ? source.id : null,
    status,
    targetCampaigns,
    attemptedCampaigns: Math.min(targetCampaigns, integer(source.attemptedCampaigns)),
    completedCampaigns: Math.min(targetCampaigns, integer(source.completedCampaigns)),
    campaignIds,
    activeCampaignId: typeof source.activeCampaignId === "string"
      ? source.activeCampaignId
      : null,
    lastReviewedCampaignId: typeof source.lastReviewedCampaignId === "string"
      ? source.lastReviewedCampaignId
      : null,
    startedTurn: Number.isFinite(source.startedTurn) ? integer(source.startedTurn) : null,
    completedTurn: Number.isFinite(source.completedTurn) ? integer(source.completedTurn) : null,
    lastStopReason: typeof source.lastStopReason === "string" ? source.lastStopReason : null,
  };
}

function campaignIsRunning(campaign) {
  return campaign?.status === "running" && typeof campaign?.id === "string";
}

export function isCanaryPilotActive(control) {
  const status = normalizeCanaryPilot(control?.canaryPilot).status;
  return status === CANARY_PILOT_STATUS.RUNNING
    || status === CANARY_PILOT_STATUS.AWAITING_REVIEW;
}

export function startCanaryPilot(control, campaign, turn = 0) {
  const source = control && typeof control === "object" ? control : {};
  const sequence = integer(source.canaryPilotSequence) + 1;
  if (!campaignIsRunning(campaign)) {
    return {
      ...source,
      canaryPilotSequence: sequence,
      canaryPilot: {
        ...createInitialCanaryPilot(),
        id: `canary-pilot-${String(sequence).padStart(4, "0")}`,
        status: CANARY_PILOT_STATUS.BLOCKED,
        completedTurn: integer(turn),
        lastStopReason: campaign?.lastStopReason ?? "pilot-start-blocked",
      },
    };
  }

  return {
    ...source,
    canaryPilotSequence: sequence,
    canaryPilot: {
      ...createInitialCanaryPilot(),
      id: `canary-pilot-${String(sequence).padStart(4, "0")}`,
      status: CANARY_PILOT_STATUS.RUNNING,
      attemptedCampaigns: 1,
      campaignIds: [campaign.id],
      activeCampaignId: campaign.id,
      startedTurn: integer(turn),
    },
  };
}

export function continueCanaryPilot(control, campaign, turn = 0) {
  const source = control && typeof control === "object" ? control : {};
  const pilot = normalizeCanaryPilot(source.canaryPilot);
  if (pilot.status !== CANARY_PILOT_STATUS.AWAITING_REVIEW || !campaignIsRunning(campaign)) {
    return source;
  }

  return {
    ...source,
    canaryPilot: {
      ...pilot,
      status: CANARY_PILOT_STATUS.RUNNING,
      attemptedCampaigns: Math.min(pilot.targetCampaigns, pilot.attemptedCampaigns + 1),
      campaignIds: unique([...pilot.campaignIds, campaign.id]).slice(-pilot.targetCampaigns),
      activeCampaignId: campaign.id,
      completedTurn: null,
      lastStopReason: null,
      lastReviewedCampaignId: pilot.lastReviewedCampaignId,
      resumedTurn: integer(turn),
    },
  };
}

export function synchronizeCanaryPilot(control) {
  const source = control && typeof control === "object" ? control : {};
  const pilot = normalizeCanaryPilot(source.canaryPilot);
  if (pilot.status !== CANARY_PILOT_STATUS.RUNNING || !pilot.activeCampaignId) return source;

  const history = Array.isArray(source.canaryCampaignHistory)
    ? source.canaryCampaignHistory
    : [];
  const summary = history.find((item) => item?.id === pilot.activeCampaignId);
  if (!summary) return source;

  if (summary.status !== "completed") {
    return {
      ...source,
      canaryPilot: {
        ...pilot,
        status: CANARY_PILOT_STATUS.ABORTED,
        activeCampaignId: null,
        lastReviewedCampaignId: summary.id,
        completedTurn: Number.isFinite(summary.completedTurn)
          ? integer(summary.completedTurn)
          : null,
        lastStopReason: summary.lastStopReason ?? "pilot-campaign-aborted",
      },
    };
  }

  const completedCampaigns = Math.min(pilot.targetCampaigns, pilot.completedCampaigns + 1);
  const complete = completedCampaigns >= pilot.targetCampaigns;
  return {
    ...source,
    canaryPilot: {
      ...pilot,
      status: complete
        ? CANARY_PILOT_STATUS.COMPLETED
        : CANARY_PILOT_STATUS.AWAITING_REVIEW,
      completedCampaigns,
      activeCampaignId: null,
      lastReviewedCampaignId: summary.id,
      completedTurn: complete && Number.isFinite(summary.completedTurn)
        ? integer(summary.completedTurn)
        : null,
      lastStopReason: complete ? "pilot-target-reached" : "awaiting-operator-review",
    },
  };
}

export function abortCanaryPilot(control, reason = "operator-stop", turn = 0) {
  const source = control && typeof control === "object" ? control : {};
  const pilot = normalizeCanaryPilot(source.canaryPilot);
  if (!isCanaryPilotActive(source)) return source;

  return {
    ...source,
    canaryPilot: {
      ...pilot,
      status: CANARY_PILOT_STATUS.ABORTED,
      activeCampaignId: null,
      completedTurn: integer(turn),
      lastStopReason: reason,
    },
  };
}

function maxRatios(summaries) {
  return summaries.reduce((maximums, summary) => ({
    denarii: Math.max(maximums.denarii, finite(summary?.maxDriftRatios?.denarii)),
    food: Math.max(maximums.food, finite(summary?.maxDriftRatios?.food)),
    population: Math.max(maximums.population, integer(summary?.maxDriftRatios?.population)),
    inventory: Math.max(maximums.inventory, finite(summary?.maxDriftRatios?.inventory)),
  }), { denarii: 0, food: 0, population: 0, inventory: 0 });
}

export function getCanaryPilotReport(control) {
  const source = control && typeof control === "object" ? control : {};
  const pilot = normalizeCanaryPilot(source.canaryPilot);
  const history = Array.isArray(source.canaryCampaignHistory)
    ? source.canaryCampaignHistory
    : [];
  const summaries = pilot.campaignIds
    .map((id) => history.find((summary) => summary?.id === id))
    .filter(Boolean);
  const committedQuarters = summaries.reduce(
    (total, summary) => total + integer(summary.committedQuarters),
    0,
  );
  const rollbackCount = summaries.reduce(
    (total, summary) => total + integer(summary.rollbackCount),
    0,
  );

  return {
    ...pilot,
    summaries,
    committedQuarters,
    totalPlannedQuarters: pilot.targetCampaigns * 3,
    remainingCampaigns: Math.max(0, pilot.targetCampaigns - pilot.completedCampaigns),
    rollbackCount,
    maximumDriftRatios: maxRatios(summaries),
    progress: Number(((pilot.completedCampaigns / Math.max(1, pilot.targetCampaigns)) * 100).toFixed(1)),
    canContinue: pilot.status === CANARY_PILOT_STATUS.AWAITING_REVIEW
      && pilot.completedCampaigns < pilot.targetCampaigns,
  };
}
