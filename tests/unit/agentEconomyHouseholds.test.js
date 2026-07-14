import assert from "node:assert/strict";
import test from "node:test";

import { gameReducer, initialState } from "../../src/engine/gameReducer.js";
import {
  createHouseholdsForPopulation,
  createInitialAgentEconomy,
  getHouseholdPopulation,
  hydrateAgentEconomy,
  reconcileAgentEconomyPopulation,
  validateHouseholds,
} from "../../src/engine/agentEconomy/index.js";

function withoutAgentEconomy(state) {
  const { agentEconomy: _agentEconomy, ...legacyState } = state;
  return legacyState;
}

test("creates deterministic household proxies with exact population weight", () => {
  const first = createHouseholdsForPopulation(20);
  const second = createHouseholdsForPopulation(20);

  assert.deepEqual(first, second);
  assert.equal(first.length, 20);
  assert.equal(getHouseholdPopulation(first), 20);

  const large = createHouseholdsForPopulation(300);
  assert.equal(large.length, 120);
  assert.equal(getHouseholdPopulation(large), 300);
  assert.ok(large.every((household) => household.weight >= 1));
});

test("households contain serializable inventory, needs, and price memory", () => {
  const economy = createInitialAgentEconomy(22);
  const validation = validateHouseholds(economy.households, 22);

  assert.equal(validation.valid, true, validation.errors.join("\n"));
  const sample = economy.households[0];
  assert.equal(typeof sample.id, "string");
  assert.equal(typeof sample.occupation, "string");
  assert.equal(typeof sample.cash, "number");
  assert.equal(typeof sample.inventory.grain, "number");
  assert.equal(typeof sample.needs.food, "number");
  assert.equal(typeof sample.priceBeliefs.grain.min, "number");
  assert.ok(Array.isArray(sample.priceHistory.grain));

  const roundTrip = JSON.parse(JSON.stringify(economy));
  assert.deepEqual(roundTrip, economy);
});

test("population reconciliation preserves household memory while growing and shrinking", () => {
  const initial = createInitialAgentEconomy(10);
  initial.households[0] = {
    ...initial.households[0],
    cash: 91,
    satisfaction: 73,
    priceHistory: {
      ...initial.households[0].priceHistory,
      grain: [3, 4, 5],
    },
  };
  const preservedId = initial.households[0].id;

  const grown = reconcileAgentEconomyPopulation(initial, 18, { createdTurn: 4 });
  assert.equal(getHouseholdPopulation(grown.households), 18);
  assert.equal(grown.households[0].id, preservedId);
  assert.equal(grown.households[0].cash, 91);
  assert.deepEqual(grown.households[0].priceHistory.grain, [3, 4, 5]);

  const shrunk = reconcileAgentEconomyPopulation(grown, 6);
  assert.equal(getHouseholdPopulation(shrunk.households), 6);
  assert.equal(shrunk.households[0].id, preservedId);
  assert.equal(shrunk.households[0].cash, 91);

  const empty = reconcileAgentEconomyPopulation(shrunk, 0);
  assert.deepEqual(empty.households, []);
  assert.equal(empty.lastReconciledPopulation, 0);
});

test("legacy and malformed saves are hydrated into the current schema", () => {
  const migrated = hydrateAgentEconomy(null, 7, { createdTurn: 12 });
  assert.equal(getHouseholdPopulation(migrated.households), 7);
  assert.ok(migrated.households.every((household) => household.meta.origin === "legacy-save-migration"));

  const repaired = hydrateAgentEconomy({
    schemaVersion: 0,
    nextHouseholdId: 2,
    households: [
      {
        id: "hh-000001",
        weight: 3,
        occupation: "unknown-job",
        cash: -20,
        inventory: { grain: -4 },
        priceBeliefs: {},
      },
      {
        id: "hh-000001",
        weight: 0,
      },
    ],
  }, 5);

  const validation = validateHouseholds(repaired.households, 5);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(new Set(repaired.households.map((household) => household.id)).size, repaired.households.length);
  assert.ok(repaired.households.every((household) => household.cash >= 0));
  assert.ok(repaired.households.every((household) => household.inventory.grain >= 0));
});

test("new games and loaded saves always contain population-synchronized household state", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });

  assert.equal(getHouseholdPopulation(started.agentEconomy.households), started.population);
  assert.equal(started.agentEconomy.enabled, false);
  assert.equal(started.agentEconomy.shadowMode, true);

  const legacySave = {
    ...withoutAgentEconomy(started),
    population: 7,
  };
  const loadedLegacy = gameReducer(started, {
    type: "LOAD_SAVE",
    payload: { savedState: legacySave },
  });
  assert.equal(getHouseholdPopulation(loadedLegacy.agentEconomy.households), 7);

  const custom = createInitialAgentEconomy(3);
  custom.households[0].cash = 123;
  const loadedCurrent = gameReducer(started, {
    type: "LOAD_SAVE",
    payload: {
      savedState: {
        ...started,
        population: 3,
        agentEconomy: custom,
      },
    },
  });
  assert.equal(getHouseholdPopulation(loadedCurrent.agentEconomy.households), 3);
  assert.equal(loadedCurrent.agentEconomy.households[0].cash, 123);
});

test("direct population gains reconcile household weights", () => {
  const started = gameReducer(initialState, {
    type: "START_GAME",
    payload: { difficulty: "normal" },
  });
  const result = gameReducer(started, {
    type: "TAVERN_ALDRIC_ACCEPT_OFFER",
    payload: { offerId: "war_story_lesson" },
  });

  assert.equal(result.population, started.population + 2);
  assert.equal(getHouseholdPopulation(result.agentEconomy.households), result.population);
});
