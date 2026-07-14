from pathlib import Path


def replace_once(path, old, new, label):
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one anchor, found {count}")
    file.write_text(text.replace(old, new, 1))


replace_once(
    "src/engine/agentEconomy/householdFactory.js",
    "export const AGENT_ECONOMY_SCHEMA_VERSION = 10;",
    "export const AGENT_ECONOMY_SCHEMA_VERSION = 11;",
    "schema version",
)

replace_once(
    "src/engine/agentEconomy/index.js",
    '''export {
  CANARY_TRANSACTION_HISTORY_LIMIT,''',
    '''export {
  CANARY_CAMPAIGN_STATUS,
  CANARY_CAMPAIGN_VERSION,
  DEFAULT_CANARY_CAMPAIGN_QUARTERS,
  MAX_CANARY_CAMPAIGN_QUARTERS,
  createInitialCanaryCampaign,
  finalizeCanaryCampaignTransaction,
  getCanaryCampaignBlockers,
  isCanaryCampaignRunning,
  normalizeCanaryCampaign,
  startCanaryCampaign,
  stopCanaryCampaign,
} from "./canaryCampaignSystem.js";

export {
  CANARY_TRANSACTION_HISTORY_LIMIT,''',
    "campaign index exports",
)

replace_once(
    "src/engine/agentEconomy/integratedGameReducer.js",
    '''import { hydrateAgentEconomy } from "./householdUtils.js";
import { applyCanaryTransaction } from "./canaryTransactionSystem.js";''',
    '''import { hydrateAgentEconomy } from "./householdUtils.js";
import {
  isCanaryCampaignRunning,
  startCanaryCampaign,
  stopCanaryCampaign,
} from "./canaryCampaignSystem.js";
import { applyCanaryTransaction } from "./canaryTransactionSystem.js";''',
    "integrated campaign imports",
)

replace_once(
    "src/engine/agentEconomy/integratedGameReducer.js",
    '''function applyControlAction(state, action) {
  if (action?.type === "AGENT_ECONOMY_SET_MODE") {''',
    '''function applyControlAction(state, action) {
  if (action?.type === "AGENT_ECONOMY_START_CANARY_CAMPAIGN") {
    const engineControl = startCanaryCampaign(
      state.agentEconomy.engineControl,
      {
        quarterLimit: action.payload?.quarterLimit,
        turn: state.turn,
      },
    );
    const running = isCanaryCampaignRunning(engineControl);
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

  if (action?.type === "AGENT_ECONOMY_STOP_CANARY_CAMPAIGN") {
    const engineControl = stopCanaryCampaign(
      state.agentEconomy.engineControl,
      action.payload?.reason ?? "operator-stop",
      state.turn,
    );
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        enabled: false,
        shadowMode: true,
        liveStateAdapter: {
          ...(state.agentEconomy.liveStateAdapter ?? {}),
          writeBackEnabled: false,
          shadowOnly: true,
        },
        engineControl,
      },
    };
  }

  if (action?.type === "AGENT_ECONOMY_SET_MODE") {''',
    "integrated campaign actions",
)

replace_once(
    "src/engine/agentEconomy/integratedGameReducer.js",
    '''  if (action?.type === "AGENT_ECONOMY_FORCE_ROLLBACK") {
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        enabled: false,
        shadowMode: true,
        liveStateAdapter: {
          ...(state.agentEconomy.liveStateAdapter ?? {}),
          writeBackEnabled: false,
          shadowOnly: true,
        },
        engineControl: forceEngineRollback(
          state.agentEconomy.engineControl,
          action.payload?.reason ?? "manual-rollback",
          state.turn,
        ),
      },
    };
  }''',
    '''  if (action?.type === "AGENT_ECONOMY_FORCE_ROLLBACK") {
    const engineControl = stopCanaryCampaign(
      state.agentEconomy.engineControl,
      action.payload?.reason ?? "manual-rollback",
      state.turn,
    );
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        enabled: false,
        shadowMode: true,
        liveStateAdapter: {
          ...(state.agentEconomy.liveStateAdapter ?? {}),
          writeBackEnabled: false,
          shadowOnly: true,
        },
        engineControl,
      },
    };
  }''',
    "integrated emergency rollback",
)

replace_once(
    "src/engine/agentEconomy/integratedGameReducer.js",
    '''  const canaryWasActive = control.activeMode === ENGINE_MODES.CANARY
    && control.writeBackEnabled === true;''',
    '''  const canaryWasActive = control.activeMode === ENGINE_MODES.CANARY
    && control.writeBackEnabled === true
    && isCanaryCampaignRunning(control);''',
    "campaign required for writeback",
)

replace_once(
    "src/engine/agentEconomy/canaryTransactionSystem.js",
    '''import {
  ENGINE_MODES,
  forceEngineRollback,
  normalizeEngineControl,
} from "./engineControlSystem.js";''',
    '''import {
  ENGINE_MODES,
  forceEngineRollback,
  normalizeEngineControl,
} from "./engineControlSystem.js";
import {
  finalizeCanaryCampaignTransaction,
  isCanaryCampaignRunning,
} from "./canaryCampaignSystem.js";''',
    "transaction campaign imports",
)

replace_once(
    "src/engine/agentEconomy/canaryTransactionSystem.js",
    '''function updateAdapterAfterTransaction(agentEconomy, officialState, transaction, applied) {
  const snapshot = createLegacyLiveSnapshot(officialState);''',
    '''function updateAdapterAfterTransaction(agentEconomy, officialState, transaction, applied, control) {
  const snapshot = createLegacyLiveSnapshot(officialState);
  const canaryRemainsActive = applied
    && control?.activeMode === ENGINE_MODES.CANARY
    && control?.authority === ENGINE_MODES.CANARY
    && control?.writeBackEnabled === true
    && isCanaryCampaignRunning(control);''',
    "adapter campaign signature",
)
replace_once(
    "src/engine/agentEconomy/canaryTransactionSystem.js",
    '''      shadowOnly: !applied,
      writeBackEnabled: applied,''',
    '''      shadowOnly: !canaryRemainsActive,
      writeBackEnabled: canaryRemainsActive,''',
    "adapter campaign flags",
)

replace_once(
    "src/engine/agentEconomy/canaryTransactionSystem.js",
    '''  const nextControl = recordTransaction(rolledBack, transaction, false);
  const nextAgentEconomy = updateAdapterAfterTransaction(
    agentEconomy,
    legacyState,
    transaction,
    false,
  );''',
    '''  const recordedControl = recordTransaction(rolledBack, transaction, false);
  const nextControl = finalizeCanaryCampaignTransaction(
    recordedControl,
    transaction,
    beforeState?.turn,
  );
  const nextAgentEconomy = updateAdapterAfterTransaction(
    agentEconomy,
    legacyState,
    transaction,
    false,
    nextControl,
  );''',
    "rollback campaign finalization",
)

replace_once(
    "src/engine/agentEconomy/canaryTransactionSystem.js",
    '''  const canWrite = normalized.activeMode === ENGINE_MODES.CANARY
    && normalized.writeBackEnabled === true;

  if (!canWrite && !attemptedCanary) {
    return {
      applied: false,
      state: legacyState,
      agentEconomy,
      control: normalized,
      transaction: null,
    };
  }''',
    '''  const canWrite = normalized.activeMode === ENGINE_MODES.CANARY
    && normalized.writeBackEnabled === true
    && isCanaryCampaignRunning(normalized);

  if (!canWrite) {
    if (!attemptedCanary) {
      return {
        applied: false,
        state: legacyState,
        agentEconomy,
        control: normalized,
        transaction: null,
      };
    }
    return rollbackTransaction({
      beforeState,
      legacyState,
      agentEconomy,
      control: normalized,
      checkpoint,
      issues: ["canary-campaign-not-running"],
      comparison,
      alreadyRolledBack: normalized.activeMode !== ENGINE_MODES.CANARY,
    });
  }''',
    "campaign write gate",
)

replace_once(
    "src/engine/agentEconomy/canaryTransactionSystem.js",
    '''  const nextControl = recordTransaction(normalized, transaction, true);
  const nextAgentEconomy = updateAdapterAfterTransaction(
    agentEconomy,
    officialState,
    transaction,
    true,
  );

  return {
    applied: true,
    state: officialState,
    agentEconomy: {
      ...nextAgentEconomy,
      enabled: true,
      shadowMode: false,
      engineControl: nextControl,
    },''',
    '''  const recordedControl = recordTransaction(normalized, transaction, true);
  const nextControl = finalizeCanaryCampaignTransaction(
    recordedControl,
    transaction,
    beforeState?.turn,
  );
  const canaryRemainsActive = nextControl.activeMode === ENGINE_MODES.CANARY
    && nextControl.authority === ENGINE_MODES.CANARY
    && nextControl.writeBackEnabled === true
    && isCanaryCampaignRunning(nextControl);
  const nextAgentEconomy = updateAdapterAfterTransaction(
    agentEconomy,
    officialState,
    transaction,
    true,
    nextControl,
  );

  return {
    applied: true,
    state: officialState,
    agentEconomy: {
      ...nextAgentEconomy,
      enabled: canaryRemainsActive,
      shadowMode: !canaryRemainsActive,
      engineControl: nextControl,
    },''',
    "commit campaign finalization",
)

replace_once(
    "src/engine/agentEconomy/economyMonitorSelectors.js",
    '''import { ENGINE_MODES, normalizeEngineControl } from "./engineControlSystem.js";''',
    '''import { ENGINE_MODES, normalizeEngineControl } from "./engineControlSystem.js";
import {
  CANARY_CAMPAIGN_STATUS,
  getCanaryCampaignBlockers,
  normalizeCanaryCampaign,
} from "./canaryCampaignSystem.js";''',
    "selector campaign imports",
)
replace_once(
    "src/engine/agentEconomy/economyMonitorSelectors.js",
    '''  const comparison = control.lastComparison;
  const metrics = agentEconomy.metrics ?? {};''',
    '''  const comparison = control.lastComparison;
  const campaign = normalizeCanaryCampaign(control.canaryCampaign);
  const campaignBlockers = getCanaryCampaignBlockers(control);
  const metrics = agentEconomy.metrics ?? {};''',
    "selector campaign variables",
)
replace_once(
    "src/engine/agentEconomy/economyMonitorSelectors.js",
    '''      blockers: control.promotionBlockers,
      isLegacyOnly: control.activeMode === ENGINE_MODES.LEGACY,
    },
    householdStats,''',
    '''      blockers: control.promotionBlockers,
      writeBackEnabled: control.writeBackEnabled === true,
      isLegacyOnly: control.activeMode === ENGINE_MODES.LEGACY,
    },
    campaign: {
      status: campaign.status,
      quarterLimit: campaign.quarterLimit,
      attemptedQuarters: campaign.attemptedQuarters,
      committedQuarters: campaign.committedQuarters,
      remainingQuarters: Math.max(0, campaign.quarterLimit - campaign.committedQuarters),
      progress: round((campaign.committedQuarters / Math.max(1, campaign.quarterLimit)) * 100),
      startedTurn: campaign.startedTurn,
      completedTurn: campaign.completedTurn,
      lastStopReason: campaign.lastStopReason,
      lastTransactionId: campaign.lastTransactionId,
      blockers: campaignBlockers,
      running: campaign.status === CANARY_CAMPAIGN_STATUS.RUNNING,
      canStart: campaignBlockers.length === 0 && campaign.status !== CANARY_CAMPAIGN_STATUS.RUNNING,
    },
    transactions: (control.canaryTransactionHistory ?? []).slice(-6).reverse().map((transaction) => ({
      id: transaction.id,
      status: transaction.status,
      turn: transaction.turn,
      season: transaction.season,
      issue: transaction.issues?.[0] ?? null,
    })),
    householdStats,''',
    "selector campaign return",
)

replace_once(
    "tests/unit/agentEconomyCanaryTransaction.test.js",
    '''  projectAgentEconomyToLegacyState,
  recordEngineComparison,
  requestEngineMode,
} from "../../src/engine/agentEconomy/index.js";''',
    '''  isCanaryCampaignRunning,
  projectAgentEconomyToLegacyState,
  recordEngineComparison,
  startCanaryCampaign,
} from "../../src/engine/agentEconomy/index.js";''',
    "transaction test campaign imports",
)
replace_once(
    "tests/unit/agentEconomyCanaryTransaction.test.js",
    '''  control = recordEngineComparison(control, safeComparison("eligibility"));
  control = requestEngineMode(control, ENGINE_MODES.CANARY, 1);
  assert.equal(control.activeMode, ENGINE_MODES.CANARY);''',
    '''  control = recordEngineComparison(control, safeComparison("eligibility"));
  control = startCanaryCampaign(control, { quarterLimit: 4, turn: 1 });
  assert.equal(control.activeMode, ENGINE_MODES.CANARY);
  assert.equal(isCanaryCampaignRunning(control), true);''',
    "transaction test ready campaign",
)
replace_once(
    "tests/unit/agentEconomyCanaryTransaction.test.js",
    '''  for (let index = 0; index < CANARY_TRANSACTION_HISTORY_LIMIT + 7; index += 1) {
    const result = applyCanaryTransaction({''',
    '''  for (let index = 0; index < CANARY_TRANSACTION_HISTORY_LIMIT + 7; index += 1) {
    if (!isCanaryCampaignRunning(control)) {
      control = startCanaryCampaign(control, { quarterLimit: 4, turn: index + 1 });
    }
    const result = applyCanaryTransaction({''',
    "transaction history rearm",
)

component = Path("src/components/EconomyMonitorTab.jsx")
text = component.read_text()
old = '''function ComparisonValue({ label, legacy, agent }) {
  return ('''
new = '''function resolveOperatorMode() {
  if (typeof window === "undefined") return false;
  const query = new URLSearchParams(window.location.search).get("operator");
  try {
    if (query === "1") {
      window.localStorage.setItem("lords-ledger-operator-mode", "1");
      return true;
    }
    if (query === "0") {
      window.localStorage.removeItem("lords-ledger-operator-mode");
      return false;
    }
    return window.localStorage.getItem("lords-ledger-operator-mode") === "1";
  } catch {
    return query === "1";
  }
}

function ComparisonValue({ label, legacy, agent }) {
  return ('''
if text.count(old) != 1:
    raise RuntimeError("component operator resolver anchor")
text = text.replace(old, new, 1)

old = '''  const mode = view.mode;
  const comparison = view.comparison;

  function setMode(nextMode) {'''
new = '''  const mode = view.mode;
  const comparison = view.comparison;
  const operatorMode = useMemo(resolveOperatorMode, []);

  function setMode(nextMode) {'''
if text.count(old) != 1:
    raise RuntimeError("component operator state anchor")
text = text.replace(old, new, 1)

old = '''          <div className="flex flex-wrap gap-2 lg:justify-end">
            <ModeButton active={mode.active === ENGINE_MODES.LEGACY} onClick={() => setMode(ENGINE_MODES.LEGACY)}>
              Legacy only
            </ModeButton>
            <ModeButton active={mode.active === ENGINE_MODES.SHADOW} onClick={() => setMode(ENGINE_MODES.SHADOW)}>
              Shadow compare
            </ModeButton>
            <ModeButton active={mode.requested === ENGINE_MODES.CANARY} onClick={() => setMode(ENGINE_MODES.CANARY)}>
              Request canary
            </ModeButton>
            <button
              type="button"
              onClick={() => dispatch({
                type: "AGENT_ECONOMY_FORCE_ROLLBACK",
                payload: { reason: "manual-monitor-rollback" },
              })}
              className="px-3 py-2 rounded-md border text-xs uppercase tracking-wide flex items-center gap-1.5"
              style={{ borderColor: "#78433c", color: COLORS.red, backgroundColor: "rgba(120, 67, 60, 0.10)", fontFamily: "Cinzel, serif" }}
            >
              <RotateCcw size={13} /> Roll back
            </button>
          </div>'''
new = '''          {operatorMode && (
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <ModeButton active={mode.active === ENGINE_MODES.LEGACY} onClick={() => setMode(ENGINE_MODES.LEGACY)}>
                Legacy only
              </ModeButton>
              <ModeButton active={mode.active === ENGINE_MODES.SHADOW} onClick={() => setMode(ENGINE_MODES.SHADOW)}>
                Shadow compare
              </ModeButton>
              <button
                type="button"
                onClick={() => dispatch({
                  type: "AGENT_ECONOMY_STOP_CANARY_CAMPAIGN",
                  payload: { reason: "operator-emergency-stop" },
                })}
                className="px-3 py-2 rounded-md border text-xs uppercase tracking-wide flex items-center gap-1.5"
                style={{ borderColor: "#78433c", color: COLORS.red, backgroundColor: "rgba(120, 67, 60, 0.10)", fontFamily: "Cinzel, serif" }}
              >
                <RotateCcw size={13} /> Emergency stop
              </button>
            </div>
          )}'''
if text.count(old) != 1:
    raise RuntimeError("component header controls anchor")
text = text.replace(old, new, 1)

old = '''        {mode.blockers.length > 0 && mode.requested === ENGINE_MODES.CANARY && (
          <div className="mt-4 rounded-md border p-3 text-xs" style={{ borderColor: "#6f532a", backgroundColor: "rgba(210, 154, 74, 0.08)", color: COLORS.amber }}>
            Canary remains blocked: {mode.blockers.join(" · ")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">'''
new = '''        {operatorMode && mode.blockers.length > 0 && mode.requested === ENGINE_MODES.CANARY && (
          <div className="mt-4 rounded-md border p-3 text-xs" style={{ borderColor: "#6f532a", backgroundColor: "rgba(210, 154, 74, 0.08)", color: COLORS.amber }}>
            Canary remains blocked: {mode.blockers.join(" · ")}
          </div>
        )}
      </div>

      {operatorMode && (
        <Panel
          title="Canary operator controls"
          icon={view.campaign.running ? ShieldCheck : AlertTriangle}
          action={(
            <span className="text-xs uppercase" style={{ color: view.campaign.running ? COLORS.green : COLORS.amber }}>
              {view.campaign.status}
            </span>
          )}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ["Limit", `${view.campaign.quarterLimit} quarters`],
                  ["Committed", `${view.campaign.committedQuarters}/${view.campaign.quarterLimit}`],
                  ["Write-back", mode.writeBackEnabled ? "Enabled" : "Disabled"],
                  ["Authority", mode.authority],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md p-3" style={{ backgroundColor: COLORS.panelDeep }}>
                    <div className="text-sm font-semibold" style={{ color: COLORS.gold }}>{value}</div>
                    <div className="text-[10px] uppercase mt-1" style={{ color: COLORS.muted }}>{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span style={{ color: COLORS.muted }}>Campaign progress</span>
                  <span style={{ color: COLORS.gold }}>{view.campaign.committedQuarters}/{view.campaign.quarterLimit}</span>
                </div>
                <ProgressBar value={view.campaign.progress} tone={view.campaign.running ? COLORS.green : COLORS.gold} />
              </div>
              {view.campaign.blockers.length > 0 && !view.campaign.running && (
                <div className="mt-3 text-xs" style={{ color: COLORS.amber }}>
                  Start blocked: {view.campaign.blockers.join(" · ")}
                </div>
              )}
              {view.campaign.lastStopReason && (
                <div className="mt-3 text-xs" style={{ color: view.campaign.status === "aborted" ? COLORS.red : COLORS.muted }}>
                  Last stop: {view.campaign.lastStopReason}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  disabled={!view.campaign.canStart}
                  onClick={() => dispatch({
                    type: "AGENT_ECONOMY_START_CANARY_CAMPAIGN",
                    payload: { quarterLimit: 3 },
                  })}
                  className="px-4 py-2 rounded-md border text-xs uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: COLORS.green, color: COLORS.green, backgroundColor: "rgba(125, 168, 106, 0.10)", fontFamily: "Cinzel, serif" }}
                >
                  Start 3-quarter trial
                </button>
                <button
                  type="button"
                  disabled={!view.campaign.running}
                  onClick={() => dispatch({
                    type: "AGENT_ECONOMY_STOP_CANARY_CAMPAIGN",
                    payload: { reason: "operator-stop" },
                  })}
                  className="px-4 py-2 rounded-md border text-xs uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: COLORS.red, color: COLORS.red, backgroundColor: "rgba(201, 108, 98, 0.08)", fontFamily: "Cinzel, serif" }}
                >
                  Stop and roll back
                </button>
              </div>
            </div>
            <div className="rounded-md p-3" style={{ backgroundColor: COLORS.panelDeep }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: COLORS.muted }}>Recent transactions</div>
              {view.transactions.length === 0 ? (
                <div className="text-xs" style={{ color: COLORS.muted }}>No Canary transactions recorded.</div>
              ) : view.transactions.map((transaction) => (
                <div key={transaction.id} className="py-2 border-t first:border-t-0 text-xs" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ color: COLORS.text }}>Turn {transaction.turn} · {transaction.season}</span>
                    <span style={{ color: transaction.status === "committed" ? COLORS.green : COLORS.red }}>{transaction.status}</span>
                  </div>
                  {transaction.issue && <div className="mt-1" style={{ color: COLORS.red }}>{transaction.issue}</div>}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">'''
if text.count(old) != 1:
    raise RuntimeError("component operator panel anchor")
text = text.replace(old, new, 1)
component.write_text(text)
