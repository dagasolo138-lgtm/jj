from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text()

def write(path, content):
    (ROOT / path).write_text(content)

def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f"missing patch anchor: {label}")
    return text.replace(old, new, 1)

# Engine-control persistence.
path = "src/engine/agentEconomy/engineControlSystem.js"
text = read(path)
text = replace_once(
    text,
    'import { getCommodityPriceBounds } from "./priceBeliefSystem.js";\n',
    'import {\n  createInitialCanaryPilot,\n  normalizeCanaryPilot,\n} from "./canaryPilotSystem.js";\nimport { getCommodityPriceBounds } from "./priceBeliefSystem.js";\n',
    "engine control pilot import",
)
text = text.replace("version: 3,", "version: 4,")
text = replace_once(
    text,
    "    canaryCampaignHistory: [],\n    lastRollbackReason: null,",
    "    canaryCampaignHistory: [],\n    canaryPilotSequence: 0,\n    canaryPilot: createInitialCanaryPilot(),\n    lastRollbackReason: null,",
    "initial pilot state",
)
text = replace_once(
    text,
    "    canaryCampaignHistory: Array.isArray(source.canaryCampaignHistory)\n      ? source.canaryCampaignHistory.slice(-12)\n      : [],\n    lastRollbackReason:",
    "    canaryCampaignHistory: Array.isArray(source.canaryCampaignHistory)\n      ? source.canaryCampaignHistory.slice(-12)\n      : [],\n    canaryPilotSequence: integer(source.canaryPilotSequence),\n    canaryPilot: normalizeCanaryPilot(source.canaryPilot),\n    lastRollbackReason:",
    "normalized pilot state",
)
write(path, text)

# Reducer orchestration.
path = "src/engine/agentEconomy/integratedGameReducer.js"
text = read(path)
text = replace_once(
    text,
    'import { applyCanaryTransaction } from "./canaryTransactionSystem.js";\n',
    'import {\n  CANARY_PILOT_STATUS,\n  abortCanaryPilot,\n  continueCanaryPilot,\n  isCanaryPilotActive,\n  normalizeCanaryPilot,\n  startCanaryPilot,\n  synchronizeCanaryPilot,\n} from "./canaryPilotSystem.js";\nimport { applyCanaryTransaction } from "./canaryTransactionSystem.js";\n',
    "reducer pilot import",
)
new_control = r'''function applyEngineControl(state, engineControl) {
  const running = isCanaryCampaignRunning(engineControl)
    && engineControl.activeMode === ENGINE_MODES.CANARY
    && engineControl.writeBackEnabled === true;
  return {
    ...state,
    agentEconomy: {
      ...state.agentEconomy,
      enabled: running,
      shadowMode: !running,
      liveStateAdapter: {
        ...(state.agentEconomy.liveStateAdapter ?? {}),
        writeBackEnabled: running,
        shadowOnly: !running,
      },
      engineControl,
    },
  };
}

function applyControlAction(state, action) {
  const currentControl = state.agentEconomy.engineControl;

  if (action?.type === "AGENT_ECONOMY_START_CANARY_PILOT") {
    if (isCanaryPilotActive(currentControl)) return state;
    const campaignControl = startCanaryCampaign(currentControl, {
      quarterLimit: 3,
      turn: state.turn,
    });
    const engineControl = startCanaryPilot(
      campaignControl,
      campaignControl.canaryCampaign,
      state.turn,
    );
    return applyEngineControl(state, engineControl);
  }

  if (action?.type === "AGENT_ECONOMY_CONTINUE_CANARY_PILOT") {
    const pilot = normalizeCanaryPilot(currentControl.canaryPilot);
    if (pilot.status !== CANARY_PILOT_STATUS.AWAITING_REVIEW) return state;
    const campaignControl = startCanaryCampaign(currentControl, {
      quarterLimit: 3,
      turn: state.turn,
    });
    const engineControl = continueCanaryPilot(
      campaignControl,
      campaignControl.canaryCampaign,
      state.turn,
    );
    return applyEngineControl(state, engineControl);
  }

  if (action?.type === "AGENT_ECONOMY_STOP_CANARY_PILOT") {
    const reason = action.payload?.reason ?? "operator-pilot-stop";
    const stopped = isCanaryCampaignRunning(currentControl)
      ? stopCanaryCampaign(currentControl, reason, state.turn)
      : currentControl;
    const engineControl = abortCanaryPilot(stopped, reason, state.turn);
    return applyEngineControl(state, engineControl);
  }

  if (action?.type === "AGENT_ECONOMY_START_CANARY_CAMPAIGN") {
    if (isCanaryPilotActive(currentControl)) return state;
    const engineControl = startCanaryCampaign(
      currentControl,
      {
        quarterLimit: action.payload?.quarterLimit,
        turn: state.turn,
      },
    );
    return applyEngineControl(state, engineControl);
  }

  if (action?.type === "AGENT_ECONOMY_STOP_CANARY_CAMPAIGN") {
    const reason = action.payload?.reason ?? "operator-stop";
    const stopped = stopCanaryCampaign(currentControl, reason, state.turn);
    const engineControl = isCanaryPilotActive(currentControl)
      ? abortCanaryPilot(stopped, reason, state.turn)
      : stopped;
    return applyEngineControl(state, engineControl);
  }

  if (action?.type === "AGENT_ECONOMY_SET_MODE") {
    const mode = action.payload?.mode;
    const stopped = isCanaryCampaignRunning(currentControl)
      && mode !== ENGINE_MODES.CANARY
      ? stopCanaryCampaign(currentControl, `mode-change:${mode ?? "unknown"}`, state.turn)
      : requestEngineMode(currentControl, mode, state.turn);
    const engineControl = isCanaryPilotActive(currentControl) && mode !== ENGINE_MODES.CANARY
      ? abortCanaryPilot(stopped, `mode-change:${mode ?? "unknown"}`, state.turn)
      : stopped;
    return applyEngineControl(state, engineControl);
  }

  if (action?.type === "AGENT_ECONOMY_SET_WRITE_BACK") {
    const enabled = action.payload?.enabled === true;
    const stopped = !enabled && isCanaryCampaignRunning(currentControl)
      ? stopCanaryCampaign(currentControl, "writeback-disabled", state.turn)
      : setEngineWriteBackEnabled(currentControl, enabled);
    const engineControl = !enabled && isCanaryPilotActive(currentControl)
      ? abortCanaryPilot(stopped, "writeback-disabled", state.turn)
      : stopped;
    return applyEngineControl(state, engineControl);
  }

  if (action?.type === "AGENT_ECONOMY_FORCE_ROLLBACK") {
    const reason = action.payload?.reason ?? "manual-rollback";
    const stopped = stopCanaryCampaign(currentControl, reason, state.turn);
    const engineControl = isCanaryPilotActive(currentControl)
      ? abortCanaryPilot(stopped, reason, state.turn)
      : stopped;
    return applyEngineControl(state, engineControl);
  }

  return null;
}'''
text, count = re.subn(
    r"function applyControlAction\(state, action\) \{.*?\n\}\n\nfunction buildFailureComparison",
    new_control + "\n\nfunction buildFailureComparison",
    text,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("failed to replace reducer control actions")
old_return = '''      return {
        ...transaction.state,
        agentEconomy: transaction.agentEconomy,
      };'''
new_return = '''      const synchronizedControl = synchronizeCanaryPilot(transaction.control);
      return {
        ...transaction.state,
        agentEconomy: {
          ...transaction.agentEconomy,
          engineControl: synchronizedControl,
        },
      };'''
if text.count(old_return) != 2:
    raise RuntimeError(f"expected two canary transaction return blocks, found {text.count(old_return)}")
text = text.replace(old_return, new_return)
write(path, text)

# Public exports.
path = "src/engine/agentEconomy/index.js"
text = read(path)
anchor = '''export {
  CANARY_TRANSACTION_HISTORY_LIMIT,
  CANARY_TRANSACTION_VERSION,
  applyCanaryTransaction,
  createCanaryCheckpoint,
  validateCanaryProjection,
} from "./canaryTransactionSystem.js";
'''
addition = anchor + '''
export {
  CANARY_PILOT_STATUS,
  CANARY_PILOT_VERSION,
  DEFAULT_CANARY_PILOT_CAMPAIGNS,
  abortCanaryPilot,
  continueCanaryPilot,
  createInitialCanaryPilot,
  getCanaryPilotReport,
  isCanaryPilotActive,
  normalizeCanaryPilot,
  startCanaryPilot,
  synchronizeCanaryPilot,
} from "./canaryPilotSystem.js";
'''
text = replace_once(text, anchor, addition, "pilot public exports")
write(path, text)

# Monitor selector.
path = "src/engine/agentEconomy/economyMonitorSelectors.js"
text = read(path)
text = replace_once(
    text,
    'import {\n  getCanaryReleaseGuardrails,\n  normalizeCanaryObservation,\n} from "./canaryObservationSystem.js";\n',
    'import {\n  getCanaryReleaseGuardrails,\n  normalizeCanaryObservation,\n} from "./canaryObservationSystem.js";\nimport {\n  CANARY_PILOT_STATUS,\n  getCanaryPilotReport,\n} from "./canaryPilotSystem.js";\n',
    "selector pilot import",
)
text = replace_once(
    text,
    "  const releaseGate = getCanaryReleaseGuardrails(control);\n",
    "  const releaseGate = getCanaryReleaseGuardrails(control);\n  const pilot = getCanaryPilotReport(control);\n  const pilotActive = pilot.status === CANARY_PILOT_STATUS.RUNNING\n    || pilot.status === CANARY_PILOT_STATUS.AWAITING_REVIEW;\n",
    "selector pilot report",
)
text = replace_once(
    text,
    "      canStart: campaignBlockers.length === 0 && campaign.status !== CANARY_CAMPAIGN_STATUS.RUNNING,\n      canStartExtended:",
    "      canStart: campaignBlockers.length === 0\n        && campaign.status !== CANARY_CAMPAIGN_STATUS.RUNNING\n        && !pilotActive,\n      canStartExtended:",
    "campaign start pilot guard",
)
release_anchor = '''    releaseGate: {
      ready: releaseGate.ready,
      blockers: releaseGate.blockers,
      completedStandardTrials: releaseGate.completedStandardTrials,
      requiredStandardTrials: releaseGate.requiredStandardTrials,
      observationWindow: releaseGate.observationWindow,
      requiredObservationWindow: releaseGate.requiredObservationWindow,
      maximumDriftRatios: releaseGate.maximumDriftRatios,
      limits: releaseGate.limits,
    },
'''
pilot_block = release_anchor + '''    pilot: {
      status: pilot.status,
      targetCampaigns: pilot.targetCampaigns,
      attemptedCampaigns: pilot.attemptedCampaigns,
      completedCampaigns: pilot.completedCampaigns,
      remainingCampaigns: pilot.remainingCampaigns,
      committedQuarters: pilot.committedQuarters,
      totalPlannedQuarters: pilot.totalPlannedQuarters,
      rollbackCount: pilot.rollbackCount,
      maximumDriftRatios: pilot.maximumDriftRatios,
      progress: pilot.progress,
      lastStopReason: pilot.lastStopReason,
      active: pilotActive,
      running: pilot.status === CANARY_PILOT_STATUS.RUNNING,
      awaitingReview: pilot.status === CANARY_PILOT_STATUS.AWAITING_REVIEW,
      canStart: campaignBlockers.length === 0
        && !pilotActive
        && campaign.status !== CANARY_CAMPAIGN_STATUS.RUNNING,
      canContinue: pilot.canContinue
        && campaignBlockers.length === 0
        && campaign.status !== CANARY_CAMPAIGN_STATUS.RUNNING,
    },
'''
text = replace_once(text, release_anchor, pilot_block, "selector pilot view model")
write(path, text)

# Operator UI.
path = "src/components/EconomyMonitorTab.jsx"
text = read(path)
button_anchor = '''              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  disabled={!view.campaign.canStart}
'''
pilot_ui = '''              <div className="mt-4 rounded-md border p-3" style={{ backgroundColor: COLORS.panelDeep, borderColor: view.pilot.active ? COLORS.blue : COLORS.border }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: COLORS.muted }}>Controlled pilot program</span>
                  <span className="text-xs uppercase" style={{ color: view.pilot.running ? COLORS.green : view.pilot.awaitingReview ? COLORS.amber : COLORS.muted }}>
                    {view.pilot.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                  <span style={{ color: COLORS.text }}>Trials {view.pilot.completedCampaigns}/{view.pilot.targetCampaigns}</span>
                  <span style={{ color: COLORS.text }}>Quarters {view.pilot.committedQuarters}/{view.pilot.totalPlannedQuarters}</span>
                  <span style={{ color: COLORS.text }}>Rollbacks {view.pilot.rollbackCount}</span>
                  <span style={{ color: COLORS.text }}>Remaining {view.pilot.remainingCampaigns}</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={view.pilot.progress} tone={view.pilot.running ? COLORS.green : COLORS.blue} />
                </div>
                {view.pilot.lastStopReason && (
                  <div className="mt-2 text-xs" style={{ color: view.pilot.status === "aborted" ? COLORS.red : COLORS.muted }}>
                    Pilot state: {view.pilot.lastStopReason}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    disabled={!view.pilot.canStart}
                    onClick={() => dispatch({ type: "AGENT_ECONOMY_START_CANARY_PILOT" })}
                    className="px-3 py-2 rounded-md border text-xs uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: COLORS.blue, color: COLORS.blue, backgroundColor: "rgba(109, 145, 168, 0.10)", fontFamily: "Cinzel, serif" }}
                  >
                    Start 3-trial pilot
                  </button>
                  <button
                    type="button"
                    disabled={!view.pilot.canContinue}
                    onClick={() => dispatch({ type: "AGENT_ECONOMY_CONTINUE_CANARY_PILOT" })}
                    className="px-3 py-2 rounded-md border text-xs uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: COLORS.amber, color: COLORS.amber, backgroundColor: "rgba(210, 154, 74, 0.08)", fontFamily: "Cinzel, serif" }}
                  >
                    Continue after review
                  </button>
                  <button
                    type="button"
                    disabled={!view.pilot.active}
                    onClick={() => dispatch({
                      type: "AGENT_ECONOMY_STOP_CANARY_PILOT",
                      payload: { reason: "operator-pilot-stop" },
                    })}
                    className="px-3 py-2 rounded-md border text-xs uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: COLORS.red, color: COLORS.red, backgroundColor: "rgba(201, 108, 98, 0.08)", fontFamily: "Cinzel, serif" }}
                  >
                    Stop pilot
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  disabled={!view.campaign.canStart}
'''
text = replace_once(text, button_anchor, pilot_ui, "operator pilot controls")
write(path, text)

# Schema version.
path = "src/engine/agentEconomy/householdFactory.js"
text = read(path)
text = text.replace("export const AGENT_ECONOMY_SCHEMA_VERSION = 12;", "export const AGENT_ECONOMY_SCHEMA_VERSION = 13;")
write(path, text)
