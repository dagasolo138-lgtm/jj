from pathlib import Path


def replace_once(path, old, new, label):
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one anchor, found {count}")
    file.write_text(text.replace(old, new, 1))


replace_once(
    "src/engine/agentEconomy/integratedGameReducer.js",
    '''  if (action?.type === "AGENT_ECONOMY_SET_MODE") {
    const mode = action.payload?.mode;
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        engineControl: requestEngineMode(
          state.agentEconomy.engineControl,
          mode,
          state.turn,
        ),
      },
    };
  }''',
    '''  if (action?.type === "AGENT_ECONOMY_SET_MODE") {
    const mode = action.payload?.mode;
    const currentControl = state.agentEconomy.engineControl;
    const engineControl = isCanaryCampaignRunning(currentControl)
      && mode !== ENGINE_MODES.CANARY
      ? stopCanaryCampaign(currentControl, `mode-change:${mode ?? "unknown"}`, state.turn)
      : requestEngineMode(currentControl, mode, state.turn);
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
  }''',
    "mode change campaign stop",
)

replace_once(
    "src/engine/agentEconomy/integratedGameReducer.js",
    '''  if (action?.type === "AGENT_ECONOMY_SET_WRITE_BACK") {
    const enabled = action.payload?.enabled === true;
    const engineControl = setEngineWriteBackEnabled(
      state.agentEconomy.engineControl,
      enabled,
    );
    return {
      ...state,
      agentEconomy: {
        ...state.agentEconomy,
        enabled: false,
        shadowMode: true,
        liveStateAdapter: {
          ...(state.agentEconomy.liveStateAdapter ?? {}),
          writeBackEnabled: engineControl.writeBackEnabled,
          shadowOnly: true,
        },
        engineControl,
      },
    };
  }''',
    '''  if (action?.type === "AGENT_ECONOMY_SET_WRITE_BACK") {
    const enabled = action.payload?.enabled === true;
    const currentControl = state.agentEconomy.engineControl;
    const engineControl = !enabled && isCanaryCampaignRunning(currentControl)
      ? stopCanaryCampaign(currentControl, "writeback-disabled", state.turn)
      : setEngineWriteBackEnabled(currentControl, enabled);
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
  }''',
    "writeback campaign stop",
)

test_path = Path("tests/unit/agentEconomyCanaryCampaign.test.js")
text = test_path.read_text()
append = '''

test("switching away from canary aborts a running campaign", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const running = gameReducer({
    ...started,
    agentEconomy: {
      ...started.agentEconomy,
      engineControl: readyControl(1),
    },
  }, {
    type: "AGENT_ECONOMY_START_CANARY_CAMPAIGN",
    payload: { quarterLimit: 3 },
  });
  const shadow = gameReducer(running, {
    type: "AGENT_ECONOMY_SET_MODE",
    payload: { mode: ENGINE_MODES.SHADOW },
  });

  assert.equal(shadow.agentEconomy.engineControl.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.ABORTED);
  assert.equal(shadow.agentEconomy.engineControl.activeMode, ENGINE_MODES.SHADOW);
  assert.equal(shadow.agentEconomy.engineControl.writeBackEnabled, false);
  assert.equal(shadow.agentEconomy.liveStateAdapter.writeBackEnabled, false);
  assert.equal(shadow.agentEconomy.enabled, false);
});

test("disabling write-back aborts the campaign instead of leaving a ghost run", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const running = gameReducer({
    ...started,
    agentEconomy: {
      ...started.agentEconomy,
      engineControl: readyControl(1),
    },
  }, {
    type: "AGENT_ECONOMY_START_CANARY_CAMPAIGN",
    payload: { quarterLimit: 3 },
  });
  const disabled = gameReducer(running, {
    type: "AGENT_ECONOMY_SET_WRITE_BACK",
    payload: { enabled: false },
  });

  assert.equal(disabled.agentEconomy.engineControl.canaryCampaign.status, CANARY_CAMPAIGN_STATUS.ABORTED);
  assert.equal(disabled.agentEconomy.engineControl.canaryCampaign.lastStopReason, "writeback-disabled");
  assert.equal(disabled.agentEconomy.engineControl.writeBackEnabled, false);
  assert.equal(disabled.agentEconomy.engineControl.authority, ENGINE_MODES.LEGACY);
  assert.equal(disabled.agentEconomy.shadowMode, true);
});
'''
if "switching away from canary aborts a running campaign" not in text:
    test_path.write_text(text + append)
