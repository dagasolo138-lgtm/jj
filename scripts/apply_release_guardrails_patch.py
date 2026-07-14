from pathlib import Path


def replace_once(path, old, new, label):
    target = Path(path)
    text = target.read_text()
    if text.count(old) != 1:
        raise RuntimeError(f"{label}: expected one match, got {text.count(old)}")
    target.write_text(text.replace(old, new))


replace_once(
    "src/engine/agentEconomy/engineControlSystem.js",
    """  return {\n    version: 2,\n    requestedMode,""",
    """  return {\n    version: 3,\n    requestedMode,""",
    "engine control initial version",
)
replace_once(
    "src/engine/agentEconomy/engineControlSystem.js",
    """    canaryTransactionHistory: [],\n    lastRollbackReason: null,""",
    """    canaryTransactionHistory: [],\n    canaryCampaignSequence: 0,\n    canaryObservationSequence: 0,\n    lastCanaryObservation: null,\n    canaryObservations: [],\n    lastCanaryCampaignSummary: null,\n    canaryCampaignHistory: [],\n    lastRollbackReason: null,""",
    "engine control observation defaults",
)
replace_once(
    "src/engine/agentEconomy/engineControlSystem.js",
    """    version: 2,\n    requestedMode,""",
    """    version: 3,\n    requestedMode,""",
    "engine control normalized version",
)
replace_once(
    "src/engine/agentEconomy/engineControlSystem.js",
    """    canaryTransactionHistory: Array.isArray(source.canaryTransactionHistory)\n      ? source.canaryTransactionHistory.slice(-20)\n      : [],\n    lastRollbackReason:""",
    """    canaryTransactionHistory: Array.isArray(source.canaryTransactionHistory)\n      ? source.canaryTransactionHistory.slice(-20)\n      : [],\n    canaryCampaignSequence: integer(source.canaryCampaignSequence),\n    canaryObservationSequence: integer(source.canaryObservationSequence),\n    lastCanaryObservation: source.lastCanaryObservation && typeof source.lastCanaryObservation === \"object\"\n      ? source.lastCanaryObservation\n      : null,\n    canaryObservations: Array.isArray(source.canaryObservations)\n      ? source.canaryObservations.slice(-48)\n      : [],\n    lastCanaryCampaignSummary: source.lastCanaryCampaignSummary\n      && typeof source.lastCanaryCampaignSummary === \"object\"\n      ? source.lastCanaryCampaignSummary\n      : null,\n    canaryCampaignHistory: Array.isArray(source.canaryCampaignHistory)\n      ? source.canaryCampaignHistory.slice(-12)\n      : [],\n    lastRollbackReason:""",
    "engine control observation normalization",
)

replace_once(
    "src/engine/agentEconomy/canaryTransactionSystem.js",
    """import {\n  finalizeCanaryCampaignTransaction,\n  isCanaryCampaignRunning,\n} from \"./canaryCampaignSystem.js\";""",
    """import {\n  finalizeCanaryCampaignTransaction,\n  isCanaryCampaignRunning,\n} from \"./canaryCampaignSystem.js\";\nimport { recordCanaryObservation } from \"./canaryObservationSystem.js\";""",
    "transaction observation import",
)
replace_once(
    "src/engine/agentEconomy/canaryTransactionSystem.js",
    """  const recordedControl = recordTransaction(rolledBack, transaction, false);\n  const nextControl = finalizeCanaryCampaignTransaction(\n    recordedControl,""",
    """  const recordedControl = recordTransaction(rolledBack, transaction, false);\n  const observedControl = recordCanaryObservation(recordedControl, transaction, comparison);\n  const nextControl = finalizeCanaryCampaignTransaction(\n    observedControl,""",
    "rollback observation recording",
)
replace_once(
    "src/engine/agentEconomy/canaryTransactionSystem.js",
    """  const recordedControl = recordTransaction(normalized, transaction, true);\n  const nextControl = finalizeCanaryCampaignTransaction(\n    recordedControl,""",
    """  const recordedControl = recordTransaction(normalized, transaction, true);\n  const observedControl = recordCanaryObservation(recordedControl, transaction, comparison);\n  const nextControl = finalizeCanaryCampaignTransaction(\n    observedControl,""",
    "commit observation recording",
)

replace_once(
    "src/engine/agentEconomy/index.js",
    """export {\n  CANARY_TRANSACTION_HISTORY_LIMIT,""",
    """export {\n  CANARY_CAMPAIGN_HISTORY_LIMIT,\n  CANARY_OBSERVATION_HISTORY_LIMIT,\n  CANARY_OBSERVATION_VERSION,\n  MIN_COMPLETED_TRIAL_CAMPAIGNS,\n  RELEASE_DRIFT_LIMITS,\n  RELEASE_GUARDRAIL_WINDOW,\n  archiveCanaryCampaign,\n  getCanaryReleaseGuardrails,\n  normalizeCanaryCampaignSummary,\n  normalizeCanaryObservation,\n  recordCanaryObservation,\n} from \"./canaryObservationSystem.js\";\n\nexport {\n  CANARY_TRANSACTION_HISTORY_LIMIT,""",
    "index observation exports",
)

replace_once(
    "src/engine/agentEconomy/economyMonitorSelectors.js",
    """} from \"./canaryCampaignSystem.js\";\n\nconst FOOD_COMMODITIES""",
    """} from \"./canaryCampaignSystem.js\";\nimport {\n  getCanaryReleaseGuardrails,\n  normalizeCanaryObservation,\n} from \"./canaryObservationSystem.js\";\n\nconst FOOD_COMMODITIES""",
    "selector observation import",
)
replace_once(
    "src/engine/agentEconomy/economyMonitorSelectors.js",
    """  const campaign = normalizeCanaryCampaign(control.canaryCampaign);\n  const campaignBlockers = getCanaryCampaignBlockers(control);\n  const metrics = agentEconomy.metrics ?? {};""",
    """  const campaign = normalizeCanaryCampaign(control.canaryCampaign);\n  const campaignBlockers = getCanaryCampaignBlockers(control, { quarterLimit: 3 });\n  const extendedCampaignBlockers = getCanaryCampaignBlockers(control, { quarterLimit: 4 });\n  const releaseGate = getCanaryReleaseGuardrails(control);\n  const observationByTransaction = new Map(\n    (control.canaryObservations ?? [])\n      .map(normalizeCanaryObservation)\n      .filter((observation) => observation.transactionId)\n      .map((observation) => [observation.transactionId, observation]),\n  );\n  const metrics = agentEconomy.metrics ?? {};""",
    "selector observation setup",
)
replace_once(
    "src/engine/agentEconomy/economyMonitorSelectors.js",
    """      blockers: campaignBlockers,\n      running: campaign.status === CANARY_CAMPAIGN_STATUS.RUNNING,\n      canStart: campaignBlockers.length === 0 && campaign.status !== CANARY_CAMPAIGN_STATUS.RUNNING,\n    },\n    transactions: (control.canaryTransactionHistory ?? []).slice(-6).reverse().map((transaction) => ({\n      id: transaction.id,\n      status: transaction.status,\n      turn: transaction.turn,\n      season: transaction.season,\n      issue: transaction.issues?.[0] ?? null,\n    })),""",
    """      blockers: campaignBlockers,\n      extendedBlockers: extendedCampaignBlockers,\n      running: campaign.status === CANARY_CAMPAIGN_STATUS.RUNNING,\n      canStart: campaignBlockers.length === 0 && campaign.status !== CANARY_CAMPAIGN_STATUS.RUNNING,\n      canStartExtended: extendedCampaignBlockers.length === 0\n        && campaign.status !== CANARY_CAMPAIGN_STATUS.RUNNING,\n    },\n    releaseGate: {\n      ready: releaseGate.ready,\n      blockers: releaseGate.blockers,\n      completedStandardTrials: releaseGate.completedStandardTrials,\n      requiredStandardTrials: releaseGate.requiredStandardTrials,\n      observationWindow: releaseGate.observationWindow,\n      requiredObservationWindow: releaseGate.requiredObservationWindow,\n      maximumDriftRatios: releaseGate.maximumDriftRatios,\n      limits: releaseGate.limits,\n    },\n    transactions: (control.canaryTransactionHistory ?? []).slice(-6).reverse().map((transaction) => {\n      const observation = observationByTransaction.get(transaction.id);\n      return {\n        id: transaction.id,\n        status: transaction.status,\n        turn: transaction.turn,\n        season: transaction.season,\n        issue: transaction.issues?.[0] ?? null,\n        modelDrift: observation?.modelDrift ?? null,\n        driftRatios: observation?.driftRatios ?? null,\n        resourceShift: observation?.resourceShift ?? null,\n      };\n    }),""",
    "selector release view",
)

replace_once(
    "src/components/EconomyMonitorTab.jsx",
    """                <button\n                  type=\"button\"\n                  disabled={!view.campaign.running}\n                  onClick={() => dispatch({""",
    """                <button\n                  type=\"button\"\n                  disabled={!view.campaign.canStartExtended}\n                  onClick={() => dispatch({\n                    type: \"AGENT_ECONOMY_START_CANARY_CAMPAIGN\",\n                    payload: { quarterLimit: 4 },\n                  })}\n                  className=\"px-4 py-2 rounded-md border text-xs uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed\"\n                  style={{ borderColor: COLORS.gold, color: COLORS.gold, backgroundColor: \"rgba(196, 162, 74, 0.08)\", fontFamily: \"Cinzel, serif\" }}\n                >\n                  Start 4-quarter extension\n                </button>\n                <button\n                  type=\"button\"\n                  disabled={!view.campaign.running}\n                  onClick={() => dispatch({""",
    "extended campaign button",
)
replace_once(
    "src/components/EconomyMonitorTab.jsx",
    """              </div>\n            </div>\n            <div className=\"rounded-md p-3\" style={{ backgroundColor: COLORS.panelDeep }}>\n              <div className=\"text-[10px] uppercase tracking-wider mb-2\" style={{ color: COLORS.muted }}>Recent transactions</div>""",
    """              </div>\n              <div className=\"mt-4 rounded-md border p-3\" style={{ backgroundColor: COLORS.panelDeep, borderColor: view.releaseGate.ready ? COLORS.green : COLORS.border }}>\n                <div className=\"flex items-center justify-between gap-3\">\n                  <span className=\"text-[10px] uppercase tracking-wider\" style={{ color: COLORS.muted }}>4-quarter release gate</span>\n                  <span className=\"text-xs uppercase\" style={{ color: view.releaseGate.ready ? COLORS.green : COLORS.amber }}>\n                    {view.releaseGate.ready ? \"Ready\" : \"Collecting evidence\"}\n                  </span>\n                </div>\n                <div className=\"grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs\">\n                  <span style={{ color: COLORS.text }}>Trials {view.releaseGate.completedStandardTrials}/{view.releaseGate.requiredStandardTrials}</span>\n                  <span style={{ color: COLORS.text }}>Window {view.releaseGate.observationWindow}/{view.releaseGate.requiredObservationWindow}</span>\n                  <span style={{ color: COLORS.text }}>Gold drift {pct(view.releaseGate.maximumDriftRatios.denarii * 100)}</span>\n                  <span style={{ color: COLORS.text }}>Food drift {pct(view.releaseGate.maximumDriftRatios.food * 100)}</span>\n                </div>\n                {view.releaseGate.blockers.length > 0 && (\n                  <div className=\"mt-2 text-xs\" style={{ color: COLORS.amber }}>\n                    {view.releaseGate.blockers.join(\" · \")}\n                  </div>\n                )}\n              </div>\n            </div>\n            <div className=\"rounded-md p-3\" style={{ backgroundColor: COLORS.panelDeep }}>\n              <div className=\"text-[10px] uppercase tracking-wider mb-2\" style={{ color: COLORS.muted }}>Recent transactions</div>""",
    "operator release gate panel",
)
replace_once(
    "src/components/EconomyMonitorTab.jsx",
    """                  {transaction.issue && <div className=\"mt-1\" style={{ color: COLORS.red }}>{transaction.issue}</div>}\n                </div>""",
    """                  {transaction.issue && <div className=\"mt-1\" style={{ color: COLORS.red }}>{transaction.issue}</div>}\n                  {transaction.modelDrift && (\n                    <div className=\"mt-1\" style={{ color: COLORS.muted }}>\n                      Model drift: gold {number(transaction.modelDrift.denarii, 2)} · food {number(transaction.modelDrift.food, 2)} · inventory {number(transaction.modelDrift.inventory, 2)}\n                    </div>\n                  )}\n                </div>""",
    "transaction drift display",
)

replace_once(
    "src/engine/agentEconomy/householdFactory.js",
    "export const AGENT_ECONOMY_SCHEMA_VERSION = 11;",
    "export const AGENT_ECONOMY_SCHEMA_VERSION = 12;",
    "schema version",
)

replace_once(
    "tests/unit/agentEconomyCanaryCampaign.test.js",
    """  const started = startCanaryCampaign(readyControl(), { quarterLimit: 99, turn: 7 });""",
    """  const started = startCanaryCampaign(readyControl(), { quarterLimit: 3, turn: 7 });""",
    "existing campaign start request",
)
replace_once(
    "tests/unit/agentEconomyCanaryCampaign.test.js",
    """  assert.equal(started.canaryCampaign.quarterLimit, 4);""",
    """  assert.equal(started.canaryCampaign.quarterLimit, 3);""",
    "existing campaign expected limit",
)
