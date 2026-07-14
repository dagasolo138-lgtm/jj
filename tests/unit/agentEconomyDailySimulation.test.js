import assert from "node:assert/strict";
import test from "node:test";

import { gameReducer as legacyGameReducer } from "../../src/engine/gameReducer.js";
import {
  gameReducer,
  initialState,
} from "../../src/engine/agentEconomy/integratedGameReducer.js";
import {
  AGENT_DAYS_PER_QUARTER,
  DAILY_PIPELINE,
  createInitialAgentEconomy,
  getAgentEconomyTotals,
  hydrateAgentEconomy,
  simulateAgentDay,
  simulateAgentQuarter,
  validateHouseholds,
} from "../../src/engine/agentEconomy/index.js";

function withoutAgentEconomy(state) {
  const { agentEconomy: _agentEconomy, ...liveState } = state;
  return liveState;
}

function withFixedRandom(callback) {
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

function assertFiniteNonNegativeAgentState(agentEconomy) {
  for (const household of agentEconomy.households) {
    assert.ok(Number.isFinite(household.cash));
    assert.ok(household.cash >= 0);
    assert.ok(Number.isFinite(household.health));
    assert.ok(household.health >= 0 && household.health <= 100);
    assert.ok(Number.isFinite(household.satisfaction));
    assert.ok(household.satisfaction >= 0 && household.satisfaction <= 100);
    for (const amount of Object.values(household.inventory)) {
      assert.ok(Number.isFinite(amount));
      assert.ok(amount >= 0);
    }
    for (const urgency of Object.values(household.needs)) {
      assert.ok(Number.isFinite(urgency));
      assert.ok(urgency >= 0 && urgency <= 100);
    }
  }
  for (const metric of Object.values(agentEconomy.metrics)) {
    assert.ok(Number.isFinite(metric));
    assert.ok(metric >= 0);
  }
}

test("same seed and input produce an identical 30-day quarter", () => {
  const first = createInitialAgentEconomy(30, { seed: 123456 });
  const second = createInitialAgentEconomy(30, { seed: 123456 });

  const firstResult = simulateAgentQuarter(first, {
    turn: 1,
    season: "spring",
    taxRate: "medium",
  });
  const secondResult = simulateAgentQuarter(second, {
    turn: 1,
    season: "spring",
    taxRate: "medium",
  });

  assert.deepEqual(firstResult, secondResult);
  assert.equal(firstResult.day, AGENT_DAYS_PER_QUARTER);
  assert.equal(firstResult.metrics.daysSimulated, AGENT_DAYS_PER_QUARTER);
  assert.equal(firstResult.metrics.quartersSimulated, 1);
  assert.deepEqual(firstResult.lastDailySummary.pipeline, DAILY_PIPELINE);
  assert.equal(firstResult.lastDailySummary.settledTrades, 0);
});

test("saved RNG state resumes the same deterministic trajectory", () => {
  const initial = createInitialAgentEconomy(24, { seed: "step-3-resume" });
  const firstTen = simulateAgentQuarter(initial, {
    days: 10,
    turn: 2,
    season: "summer",
    taxRate: "low",
  });
  const saved = JSON.parse(JSON.stringify(firstTen));
  const hydrated = hydrateAgentEconomy(saved, 24);
  const resumed = simulateAgentQuarter(hydrated, {
    days: 20,
    turn: 2,
    season: "summer",
    taxRate: "low",
  });
  const uninterrupted = simulateAgentQuarter(initial, {
    days: 30,
    turn: 2,
    season: "summer",
    taxRate: "low",
  });

  assert.equal(resumed.day, uninterrupted.day);
  assert.equal(resumed.rngState, uninterrupted.rngState);
  assert.deepEqual(resumed.households, uninterrupted.households);
  assert.equal(resumed.metrics.goodsProduced, uninterrupted.metrics.goodsProduced);
  assert.equal(resumed.metrics.goodsConsumed, uninterrupted.metrics.goodsConsumed);
  assert.equal(resumed.metrics.unmetFood, uninterrupted.metrics.unmetFood);
});

test("40 quarters stay finite, serializable, and population-safe", () => {
  let state = createInitialAgentEconomy(120, { seed: 987654321 });

  for (let turn = 1; turn <= 40; turn += 1) {
    state = simulateAgentQuarter(state, {
      turn,
      season: ["spring", "summer", "autumn", "winter"][(turn - 1) % 4],
      taxRate: turn % 4 === 0 ? "high" : "medium",
    });
  }

  const validation = validateHouseholds(state.households, 120);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(state.day, 1200);
  assert.equal(state.metrics.daysSimulated, 1200);
  assert.equal(state.metrics.quartersSimulated, 40);
  assert.ok(state.dailyHistory.length <= 60);
  assert.equal(state.quarterHistory.length, 40);
  assertFiniteNonNegativeAgentState(state);
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);

  const totals = getAgentEconomyTotals(state);
  assert.equal(totals.population, 120);
  assert.ok(totals.cash >= 0);
  assert.ok(totals.totalInventory >= 0);
});

test("simulateAgentDay rejects uncontrolled randomness", () => {
  assert.throws(
    () => simulateAgentDay(createInitialAgentEconomy(5), null),
    /seeded RNG/,
  );
});

test("integrated reducer runs 30 shadow days without changing live settlement", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const action = {
    type: "SIMULATE_SEASON",
    payload: { seasonalEvents: [] },
  };

  const expectedLive = withFixedRandom(() => legacyGameReducer(started, action));
  const actual = withFixedRandom(() => gameReducer(started, action));

  assert.deepEqual(withoutAgentEconomy(actual), withoutAgentEconomy(expectedLive));
  assert.equal(
    actual.agentEconomy.metrics.daysSimulated,
    started.agentEconomy.metrics.daysSimulated + AGENT_DAYS_PER_QUARTER,
  );
  assert.equal(actual.agentEconomy.metrics.quartersSimulated, 1);
  assert.equal(actual.agentEconomy.shadowMode, true);
  assert.equal(actual.agentEconomy.enabled, false);
});
