import { distributeEstateInventory, getDistributedInventoryTotals } from "./estateInventoryAdapter.js";
import { createHousehold, createInitialAgentEconomy } from "./householdFactory.js";
import { reconcileAgentEconomyPopulation } from "./householdUtils.js";
import { setEngineAdapterCapabilities } from "./engineControlSystem.js";

export const LIVE_STATE_ADAPTER_VERSION = 1;

export const LIVE_STATE_ADAPTER_CAPABILITIES = Object.freeze({
  treasury: true,
  estateInventory: true,
  population: true,
  victoryAndGameOver: true,
});

const FOOD_COMMODITIES = ["grain", "livestock", "fish", "flour"];
const RESET_ACTIONS = new Set(["START_GAME", "PLAY_AGAIN", "LOAD_SAVE"]);

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function integer(value, fallback = 0) {
  return Math.max(0, Math.floor(finite(value, fallback)));
}

function money(value) {
  return Number(Math.max(0, finite(value)).toFixed(2));
}

function quantity(value) {
  return Number(Math.max(0, finite(value)).toFixed(4));
}

function cloneInventory(inventory = {}) {
  return Object.fromEntries(
    Object.entries(inventory ?? {}).map(([commodity, amount]) => [commodity, quantity(amount)]),
  );
}

function addInventory(left = {}, right = {}) {
  const commodities = new Set([...Object.keys(left), ...Object.keys(right)]);
  return Object.fromEntries([...commodities].map((commodity) => [
    commodity,
    quantity(finite(left[commodity]) + finite(right[commodity])),
  ]));
}

function inventoryDelta(before = {}, after = {}) {
  const commodities = new Set([...Object.keys(before), ...Object.keys(after)]);
  return Object.fromEntries([...commodities]
    .map((commodity) => [commodity, Number((finite(after[commodity]) - finite(before[commodity])).toFixed(4))])
    .filter(([, delta]) => Math.abs(delta) > 0.0001));
}

function sumHouseholdCash(households = []) {
  return money(households.reduce((total, household) => total + finite(household?.cash), 0));
}

function sumHouseholdPopulation(households = []) {
  return households.reduce((total, household) => total + integer(household?.weight), 0);
}

function sumFood(inventory = {}) {
  return quantity(FOOD_COMMODITIES.reduce(
    (total, commodity) => total + finite(inventory?.[commodity]),
    0,
  ));
}

function normalizeReserve(reserve = {}) {
  return {
    cash: money(reserve.cash),
    inventory: cloneInventory(reserve.inventory),
  };
}

export function createLegacyLiveSnapshot(state = {}) {
  return {
    turn: integer(state.turn),
    season: typeof state.season === "string" ? state.season : null,
    denarii: money(state.denarii),
    population: integer(state.population),
    inventory: cloneInventory(state.inventory),
    phase: typeof state.phase === "string" ? state.phase : "title",
    gameOverReason: typeof state.gameOverReason === "string" ? state.gameOverReason : null,
    pyrrhicVictory: state.pyrrhicVictory === true,
  };
}

export function createInitialLiveStateAdapter(legacyState = {}) {
  const snapshot = createLegacyLiveSnapshot(legacyState);
  return {
    version: LIVE_STATE_ADAPTER_VERSION,
    shadowOnly: true,
    writeBackEnabled: false,
    capabilities: { ...LIVE_STATE_ADAPTER_CAPABILITIES },
    syncCount: 0,
    legacySnapshot: snapshot,
    treasury: {
      projectedDenarii: snapshot.denarii,
      lastLegacyDenarii: snapshot.denarii,
      lastExternalDelta: 0,
      lastFiscalDelta: 0,
    },
    estateInventory: {
      lastLegacyInventory: cloneInventory(snapshot.inventory),
      lastAppliedDelta: {},
      unresolvedDelta: {},
    },
    population: {
      lastLegacyPopulation: snapshot.population,
      lastDelta: 0,
      conservedCash: 0,
      conservedInventory: {},
    },
    outcome: {
      phase: snapshot.phase,
      gameOverReason: snapshot.gameOverReason,
      victory: snapshot.phase === "victory",
      pyrrhicVictory: snapshot.pyrrhicVictory,
    },
    unassignedAssets: normalizeReserve(),
    lastTransition: null,
  };
}

export function normalizeLiveStateAdapter(adapter, legacyState = {}) {
  const fallback = createInitialLiveStateAdapter(legacyState);
  const source = adapter && typeof adapter === "object" ? adapter : {};
  const snapshot = source.legacySnapshot && typeof source.legacySnapshot === "object"
    ? createLegacyLiveSnapshot(source.legacySnapshot)
    : fallback.legacySnapshot;
  const capabilities = Object.fromEntries(
    Object.keys(LIVE_STATE_ADAPTER_CAPABILITIES).map((key) => [
      key,
      source.capabilities && Object.hasOwn(source.capabilities, key)
        ? source.capabilities[key] === true
        : fallback.capabilities[key],
    ]),
  );

  return {
    ...fallback,
    ...source,
    version: LIVE_STATE_ADAPTER_VERSION,
    shadowOnly: source.shadowOnly !== false,
    writeBackEnabled: source.writeBackEnabled === true,
    capabilities,
    syncCount: integer(source.syncCount),
    legacySnapshot: snapshot,
    treasury: {
      ...fallback.treasury,
      ...(source.treasury && typeof source.treasury === "object" ? source.treasury : {}),
      projectedDenarii: money(source.treasury?.projectedDenarii ?? fallback.treasury.projectedDenarii),
      lastLegacyDenarii: money(source.treasury?.lastLegacyDenarii ?? snapshot.denarii),
      lastExternalDelta: Number(finite(source.treasury?.lastExternalDelta).toFixed(2)),
      lastFiscalDelta: Number(finite(source.treasury?.lastFiscalDelta).toFixed(2)),
    },
    estateInventory: {
      ...fallback.estateInventory,
      ...(source.estateInventory && typeof source.estateInventory === "object" ? source.estateInventory : {}),
      lastLegacyInventory: cloneInventory(source.estateInventory?.lastLegacyInventory ?? snapshot.inventory),
      lastAppliedDelta: { ...(source.estateInventory?.lastAppliedDelta ?? {}) },
      unresolvedDelta: { ...(source.estateInventory?.unresolvedDelta ?? {}) },
    },
    population: {
      ...fallback.population,
      ...(source.population && typeof source.population === "object" ? source.population : {}),
      lastLegacyPopulation: integer(source.population?.lastLegacyPopulation ?? snapshot.population),
      lastDelta: Math.trunc(finite(source.population?.lastDelta)),
      conservedCash: money(source.population?.conservedCash),
      conservedInventory: cloneInventory(source.population?.conservedInventory),
    },
    outcome: {
      ...fallback.outcome,
      ...(source.outcome && typeof source.outcome === "object" ? source.outcome : {}),
      phase: typeof source.outcome?.phase === "string" ? source.outcome.phase : snapshot.phase,
      gameOverReason: typeof source.outcome?.gameOverReason === "string"
        ? source.outcome.gameOverReason
        : null,
      victory: source.outcome?.victory === true,
      pyrrhicVictory: source.outcome?.pyrrhicVictory === true,
    },
    unassignedAssets: normalizeReserve(source.unassignedAssets),
    lastTransition: source.lastTransition && typeof source.lastTransition === "object"
      ? source.lastTransition
      : null,
  };
}

function withdrawInventory(households, commodity, requested) {
  const next = households.map((household) => ({
    ...household,
    inventory: { ...(household.inventory ?? {}) },
  }));
  let remaining = quantity(requested);
  const holders = next
    .map((household, index) => ({
      index,
      available: quantity(household.inventory?.[commodity]),
    }))
    .filter((holder) => holder.available > 0)
    .sort((left, right) => right.available - left.available || left.index - right.index);

  for (const holder of holders) {
    if (remaining <= 0) break;
    const removed = Math.min(holder.available, remaining);
    next[holder.index].inventory[commodity] = quantity(holder.available - removed);
    remaining = quantity(remaining - removed);
  }

  return {
    households: next,
    removed: quantity(requested - remaining),
    unresolved: remaining,
  };
}

function applyExternalInventoryDelta(households, delta = {}) {
  let nextHouseholds = households.map((household) => ({
    ...household,
    inventory: { ...(household.inventory ?? {}) },
  }));
  const applied = {};
  const unresolved = {};

  for (const [commodity, rawDelta] of Object.entries(delta)) {
    const amount = finite(rawDelta);
    if (amount > 0) {
      nextHouseholds = distributeEstateInventory(nextHouseholds, { [commodity]: amount }, { replace: false });
      applied[commodity] = quantity(amount);
    } else if (amount < 0) {
      const withdrawal = withdrawInventory(nextHouseholds, commodity, Math.abs(amount));
      nextHouseholds = withdrawal.households;
      applied[commodity] = Number((-withdrawal.removed).toFixed(4));
      if (withdrawal.unresolved > 0) unresolved[commodity] = Number((-withdrawal.unresolved).toFixed(4));
    }
  }

  return { households: nextHouseholds, applied, unresolved };
}

function conservePopulationAssets(agentEconomy, targetPopulation, options = {}) {
  const sourceHouseholds = Array.isArray(agentEconomy?.households) ? agentEconomy.households : [];
  const beforeCash = sumHouseholdCash(sourceHouseholds);
  const beforeInventory = getDistributedInventoryTotals(sourceHouseholds);
  const beforePopulation = sumHouseholdPopulation(sourceHouseholds);
  const adapter = normalizeLiveStateAdapter(agentEconomy?.liveStateAdapter, options.legacyState);
  let reserve = normalizeReserve(adapter.unassignedAssets);

  let reconciled = reconcileAgentEconomyPopulation(agentEconomy, targetPopulation, options);
  const afterCash = sumHouseholdCash(reconciled.households);
  const afterInventory = getDistributedInventoryTotals(reconciled.households);
  const lostCash = money(Math.max(0, beforeCash - afterCash));
  const lostInventory = Object.fromEntries(
    Object.keys(beforeInventory)
      .map((commodity) => [commodity, quantity(Math.max(0, finite(beforeInventory[commodity]) - finite(afterInventory[commodity])))])
      .filter(([, amount]) => amount > 0),
  );

  reserve = {
    cash: money(reserve.cash + lostCash),
    inventory: addInventory(reserve.inventory, lostInventory),
  };

  if (reconciled.households.length === 0 && targetPopulation > 0) {
    reconciled = {
      ...reconciled,
      households: [createHousehold({
        id: `hh-${String(reconciled.nextHouseholdId).padStart(6, "0")}`,
        index: 0,
        weight: targetPopulation,
        createdTurn: options.createdTurn ?? 0,
        origin: options.origin ?? "population-recovery",
      })],
      nextHouseholdId: reconciled.nextHouseholdId + 1,
    };
  }

  if (reconciled.households.length > 0 && (reserve.cash > 0 || Object.keys(reserve.inventory).length > 0)) {
    const [first, ...rest] = reconciled.households;
    reconciled = {
      ...reconciled,
      households: [{
        ...first,
        cash: money(finite(first.cash) + reserve.cash),
        inventory: addInventory(first.inventory, reserve.inventory),
      }, ...rest],
    };
    reserve = normalizeReserve();
  }

  return {
    agentEconomy: reconciled,
    reserve,
    beforePopulation,
    afterPopulation: sumHouseholdPopulation(reconciled.households),
    conservedCash: lostCash,
    conservedInventory: lostInventory,
  };
}

function attachAdapter(agentEconomy, adapter) {
  return {
    ...agentEconomy,
    liveStateAdapter: adapter,
    engineControl: setEngineAdapterCapabilities(
      agentEconomy.engineControl,
      adapter.capabilities,
    ),
  };
}

export function ensureLiveStateAdapter(agentEconomy, legacyState = {}) {
  const adapter = normalizeLiveStateAdapter(agentEconomy?.liveStateAdapter, legacyState);
  return attachAdapter(agentEconomy, adapter);
}

export function reconcileLiveStateTransition(agentEconomy, beforeLegacy, afterLegacy, action = {}) {
  const actionType = typeof action?.type === "string" ? action.type : "UNKNOWN";
  const before = createLegacyLiveSnapshot(beforeLegacy);
  const after = createLegacyLiveSnapshot(afterLegacy);
  let working = ensureLiveStateAdapter(agentEconomy, beforeLegacy);
  let adapter = normalizeLiveStateAdapter(working.liveStateAdapter, beforeLegacy);

  if (RESET_ACTIONS.has(actionType)) {
    adapter = createInitialLiveStateAdapter(afterLegacy);
    if (actionType === "LOAD_SAVE" && Array.isArray(agentEconomy?.households)) {
      const loaded = reconcileAgentEconomyPopulation(agentEconomy, after.population, {
        createdTurn: after.turn,
        origin: "live-adapter:load-save",
        estateInventory: after.inventory,
      });
      return attachAdapter({ ...loaded, liveStateAdapter: adapter }, adapter);
    }
    const reset = createInitialAgentEconomy(after.population, {
      createdTurn: after.turn,
      origin: "live-adapter:" + actionType.toLowerCase(),
      estateInventory: after.inventory,
      seed: agentEconomy?.rngSeed,
    });
    return attachAdapter(reset, adapter);
  }

  const populationResult = conservePopulationAssets(working, after.population, {
    createdTurn: before.turn,
    origin: `live-adapter:${actionType.toLowerCase()}`,
    legacyState: afterLegacy,
  });
  working = populationResult.agentEconomy;

  const externalInventoryDelta = actionType === "SIMULATE_SEASON"
    ? {}
    : inventoryDelta(before.inventory, after.inventory);
  const inventoryResult = applyExternalInventoryDelta(working.households, externalInventoryDelta);
  working = { ...working, households: inventoryResult.households };

  const externalTreasuryDelta = actionType === "SIMULATE_SEASON"
    ? 0
    : Number((after.denarii - before.denarii).toFixed(2));
  adapter = {
    ...adapter,
    syncCount: adapter.syncCount + 1,
    legacySnapshot: after,
    treasury: {
      ...adapter.treasury,
      projectedDenarii: money(adapter.treasury.projectedDenarii + externalTreasuryDelta),
      lastLegacyDenarii: after.denarii,
      lastExternalDelta: externalTreasuryDelta,
      lastFiscalDelta: 0,
    },
    estateInventory: {
      lastLegacyInventory: cloneInventory(after.inventory),
      lastAppliedDelta: inventoryResult.applied,
      unresolvedDelta: inventoryResult.unresolved,
    },
    population: {
      lastLegacyPopulation: after.population,
      lastDelta: after.population - before.population,
      conservedCash: populationResult.conservedCash,
      conservedInventory: populationResult.conservedInventory,
    },
    outcome: {
      phase: after.phase,
      gameOverReason: after.gameOverReason,
      victory: after.phase === "victory",
      pyrrhicVictory: after.pyrrhicVictory,
    },
    unassignedAssets: populationResult.reserve,
    lastTransition: {
      actionType,
      turn: after.turn,
      externalTreasuryDelta,
      externalInventoryDelta,
      populationDelta: after.population - before.population,
      phase: after.phase,
    },
  };

  return attachAdapter(working, adapter);
}

export function finalizeAgentQuarterLiveState(beforeAgentEconomy, simulatedAgentEconomy, legacyState) {
  const snapshot = createLegacyLiveSnapshot(legacyState);
  let working = ensureLiveStateAdapter(simulatedAgentEconomy, legacyState);
  let adapter = normalizeLiveStateAdapter(working.liveStateAdapter, legacyState);
  const beforeMetrics = beforeAgentEconomy?.metrics ?? {};
  const afterMetrics = simulatedAgentEconomy?.metrics ?? {};
  const taxDelta = finite(afterMetrics.taxCollected) - finite(beforeMetrics.taxCollected);
  const welfareDelta = finite(afterMetrics.welfarePaid) - finite(beforeMetrics.welfarePaid);
  const fiscalDelta = Number((taxDelta - welfareDelta).toFixed(2));

  const populationResult = conservePopulationAssets(working, snapshot.population, {
    createdTurn: snapshot.turn,
    origin: "live-adapter:quarter-finalize",
    legacyState,
  });
  working = populationResult.agentEconomy;
  adapter = {
    ...adapter,
    syncCount: adapter.syncCount + 1,
    legacySnapshot: snapshot,
    treasury: {
      ...adapter.treasury,
      projectedDenarii: money(adapter.treasury.projectedDenarii + fiscalDelta),
      lastLegacyDenarii: snapshot.denarii,
      lastExternalDelta: 0,
      lastFiscalDelta: fiscalDelta,
    },
    estateInventory: {
      ...adapter.estateInventory,
      lastLegacyInventory: cloneInventory(snapshot.inventory),
      lastAppliedDelta: {},
      unresolvedDelta: {},
    },
    population: {
      lastLegacyPopulation: snapshot.population,
      lastDelta: snapshot.population - integer(adapter.population.lastLegacyPopulation),
      conservedCash: populationResult.conservedCash,
      conservedInventory: populationResult.conservedInventory,
    },
    outcome: {
      phase: snapshot.phase,
      gameOverReason: snapshot.gameOverReason,
      victory: snapshot.phase === "victory",
      pyrrhicVictory: snapshot.pyrrhicVictory,
    },
    unassignedAssets: populationResult.reserve,
    lastTransition: {
      actionType: "SIMULATE_SEASON",
      turn: snapshot.turn,
      externalTreasuryDelta: 0,
      fiscalDelta,
      populationDelta: snapshot.population - integer(adapter.population.lastLegacyPopulation),
      phase: snapshot.phase,
    },
  };

  return attachAdapter(working, adapter);
}

export function projectAgentEconomyToLegacyState(agentEconomy, legacyState = {}) {
  const adapted = ensureLiveStateAdapter(agentEconomy, legacyState);
  const adapter = adapted.liveStateAdapter;
  const inventory = addInventory(
    getDistributedInventoryTotals(adapted.households),
    adapter.unassignedAssets.inventory,
  );
  const population = sumHouseholdPopulation(adapted.households);
  return {
    ...legacyState,
    denarii: money(adapter.treasury.projectedDenarii + adapter.unassignedAssets.cash),
    inventory,
    food: sumFood(inventory),
    population,
    phase: adapter.outcome.phase,
    gameOverReason: adapter.outcome.gameOverReason,
    pyrrhicVictory: adapter.outcome.pyrrhicVictory,
  };
}
