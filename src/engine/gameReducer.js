/**
 * gameReducer.js
 *
 * useReducer-compatible reducer for The Lord's Ledger.
 *
 * Resource-based architecture: no abstract meters (treasury/people/military/faith).
 * All game state is expressed through concrete resources:
 *   denarii, food, population, garrison, inventory, buildings, castle, etc.
 *
 * State is plain-serializable JS — no class instances, no functions, no closures.
 * All transitions are pure: same action + same state = same result (modulo RNG).
 */

import {
  translateEffects,
  applyResourceEffects,
  checkGameOver,
} from "./meterUtils.js";

import {
  selectSeasonalEvent,
  selectRandomEvent,
} from "./eventSelector.js";

import { simulateEconomy, canBuildBuilding, getTotalFood, getBuildingType, getUsedPlots, getRepairCost } from "./economyEngine.js";
import BUILDINGS from "../data/buildings.js";
import {
  EMPTY_INVENTORY, generateMarketPrices, DIFFICULTY_CONFIGS,
  CASTLE_LEVELS, CASTLE_LEVELS_EASY,
  DEFENSE_UPGRADES, DEFENSE_UPGRADES_EASY,
  RECRUIT_COST, MAX_GARRISON,
  STARTING_TOTAL_PLOTS,
  SEASON_DEGRADE_MULTIPLIERS,
} from "../data/economy.js";
import { PERSPECTIVE_FLIPS } from "../data/perspectiveFlips.js";
import { ALL_FLIPS, checkFlipTriggers, getInitialFlipStats, computeCyoaConsequences, resolveFlipOption, computeFlipConsequences } from "./flipEngine.js";
import { checkSynergies, getSynergyTradePriceBonus, getSynergyWoolSellBonus } from "./synergyEngine.js";
import { SYNERGY_TIER_MAP } from "../data/synergies.js";
import { getInitialRaidState, checkForRaid, resolveRaid, buildRaidChronicleText } from "./raidEngine.js";
import { RAID_TYPES } from "../data/raids.js";
import {
  SOLDIER_TYPES, WALLS_TRACK, GATE_TRACK, MOAT_TRACK, MORALE_LEVELS,
  BASE_CASTLE_DEFENSE, CRIMINAL_DEFENSE_THRESHOLD, SCOTTISH_DEFENSE_THRESHOLD,
  getMoraleLevel, getTotalGarrison, getMilitaryUpkeep,
  calculateDefenseRating, canUpgradeFortification, removeFromGarrison,
  getInitialMilitaryState, KNIGHT_NAMES, MILITARY_SCRIBES_NOTES,
} from "../data/military.js";
import { HAGGLE_CONFIG, REPUTATION_CONFIG, getReputationTier, LOCAL_MERCHANTS, FOREIGN_TRADERS, pickMarketEvent } from "../data/market.js";
import {
  ANSELM_GREETINGS, TITHE_RESPONSES, TITHE_EFFECTS,
  CAEDMON_GREETINGS, SHOP_ITEMS,
  MORAL_DILEMMAS, MANUSCRIPT_SYMBOLS, MANUSCRIPT_FACTS,
} from "../data/chapel.js";
import { computeReputation, computeCompoundFlags, CRISIS_EVENTS, PEAK_EVENTS } from "../data/greatHall.js";
import {
  getInitialPeopleState, reconcileTiers, updateFamilyLoyalty,
  checkFamilyDepartures, checkFamilyReturns, pickFeedEvents, computeMorale,
} from "../data/people.js";
import {
  generateForgeMarketPrices, rollForgeSupplyEvent, calculateForgeReadiness,
} from "../data/blacksmith.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEASONS = ["spring", "summer", "autumn", "winter"];
const MAX_TURNS = 40;
const MAX_CAUSE_CHAIN = 4;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const initialState = {
  phase: "title",
  difficulty: "normal",
  turn: 1,
  season: "spring",
  year: 1,

  // Resources (replaces abstract meters)
  denarii: 500,
  food: 200,
  population: 20,
  inventory: { ...EMPTY_INVENTORY, grain: 150, livestock: 30, fish: 20, iron: 20, steel: 5, coal: 50, leather: 10, wood: 15 },
  inventoryCapacity: 300,
  buildings: [
    { instanceId: "strip_farm-0-pre", type: "strip_farm", condition: 100, builtOnTurn: 0, freeUpkeep: true },
    { instanceId: "pasture-0-pre", type: "pasture", condition: 100, builtOnTurn: 0, freeUpkeep: true },
    { instanceId: "coal_pit-0-pre", type: "coal_pit", condition: 100, builtOnTurn: 0, freeUpkeep: true },
    { instanceId: "tannery-0-pre", type: "tannery", condition: 100, builtOnTurn: 0, freeUpkeep: true },
    { instanceId: "sawmill-0-pre", type: "sawmill", condition: 100, builtOnTurn: 0, freeUpkeep: true },
    { instanceId: "smelter-0-pre", type: "smelter", condition: 100, builtOnTurn: 0, freeUpkeep: true },
  ],
  totalPlots: STARTING_TOTAL_PLOTS,
  economyHistory: [],      // Array of { turn, season, netGold, netFood } for trend display
  garrison: 5,
  castleLevel: 1,
  castleUpgradeProgress: 0,
  castleUpgrading: false,
  taxRate: "medium",
  laborAllocation: { demesne: 40, peasant: 40, construction: 20 },
  marketPrices: generateMarketPrices(),
  defenseUpgrades: [],
  churchDonation: 0,

  // Resource deltas (for dashboard display)
  resourceDeltas: { denarii: 0, food: 0, population: 0, garrison: 0 },

  // Bankruptcy tracking (4 consecutive turns at 0 denarii = game over)
  bankruptcyTurns: 0,
  // Starvation tracking (3 consecutive turns at 0 food = game over)
  starvationTurns: 0,

  // UI state
  activeTab: "estate",
  tutorialsSeen: [],
  seasonReport: [],

  // Event system
  chronicle: [],
  currentEvent: null,
  currentRandomEvent: null,
  scribesNote: null,
  usedSeasonalIds: [],
  usedRandomIds: [],
  causeChain: [],
  gameOverReason: null,

  // Perspective flip state
  perspectiveFlips: {
    serf_week: false, merchant_day: false, noble_dilemma: false, knight_gamble: false,
    cyoa_lord: false, cyoa_merchant: false, cyoa_monk: false, cyoa_knight: false, cyoa_serf: false,
  },
  tradeCount: 0,
  militaryEventEverFired: false,
  lastFlipTurn: 0,
  currentFlipId: null,
  currentFlipStats: null,
  currentDecisionIndex: 0,
  flipConsequenceFlags: [],
  currentFlipOutcome: null,
  currentCyoaNodeId: null,
  cyoaEndingType: null,

  // Synergy system state (simplified — no meter-based tracking)
  synergies: {
    activated: [],
    tradeTypes: [],
    woolTrades: 0,
    spicePurchases: 0,
    lowTaxTurns: 0,
    foodSurplusTurns: 0,
  },
  pendingSynergyNotifications: [],

  // Raid system state
  raids: getInitialRaidState(),

  // Watchtower state
  watchtower: {
    scannedThisSeason: false,
    lastScanResult: null,
    warnings: {
      criminalRaidBonus: 0,
      scottishRaidBonus: 0,
      raidRequirementReduction: 0,
      merchantPreview: null,
    },
    totalScans: 0,
    totalAnomaliesSpotted: 0,
    totalAnomaliesMissed: 0,
    perfectScans: 0,
    signalLog: [],
    rodericScribesNoteSeen: false,
    scanScribesNoteSeen: false,
  },

  // Tavern state
  tavern: {
    gambitRoundsThisSeason: 0,
    gambitLastChoice: null,
    gambitTotalWins: 0,
    gambitTotalLosses: 0,
    gambitNetEarnings: 0,
    ratsPlayedThisSeason: false,
    ratsBestScore: 0,
    bardRiddlesSolved: 0,
    wallStashFound: false,
    strangerAppearedThisSeason: false,
    totalVisits: 0,
    gambitScribesNoteSeen: false,
    ratsScribesNoteSeen: false,
    // Marta the Merchant
    martaOffersUsed: [],
    martaSpiceInvestment: false,
    martaStoragePurchased: false,
    martaScribesNoteSeen: false,
    // Old Aldric
    aldricOffersUsed: [],
    aldricDrillActive: 0,
    aldricScribesNoteSeen: false,
  },

  // Chapel state
  chapel: {
    view: "nave",
    faith: 50,
    piety: 30,
    happiness: 60,
    anselmGreeting: null,
    caedmonGreeting: null,
    currentDilemma: null,
    dilemmaResult: null,
    dilemmasCompleted: [],
    inventory: [],
    titheAmount: 0,
    titheResponse: null,
    msPhase: "idle",
    msPattern: [],
    msPlayerInput: [],
    msRound: 1,
    msMaxRound: 4,
    msActiveSymbol: null,
    msFact: null,
    msReward: 0,
    gameLog: [],
    // B-14 FIX: Per-year counter for diminishing returns on spice-driven faith gain.
    spicePurchasesThisYear: 0,
  },

  // Market Square state
  market: {
    reputation: {
      edmund: 50,
      wulfric: 50,
      agnes: 50,
      foreign: 50,
    },
    activeHaggle: null,
    currentForeignTrader: "spring",
    tradesThisSeason: 0,
    totalTradesLifetime: 0,
    totalHagglesWon: 0,
    totalHagglesLost: 0,
    denariiEarnedFromTrade: 0,
    denariiSpentOnTrade: 0,
    seasonalPriceModifiers: {},
    activeMarketEvent: null,
    usedMarketEventIds: [],
    quickTradesUsed: 0,
    haggleTradesUsed: 0,
    lastTradedSeason: { edmund: -1, wulfric: -1, agnes: -1, foreign: -1 },
    marketScribesNoteSeen: false,
    reputationScribesNoteSeen: false,
  },

  // Great Hall state (approval meters, reputation, ruling history, audience, decrees, council, feast)
  greatHall: {
    meters: { people: 50, treasury: 50, church: 50, military: 50 },
    reputation: "Unknown Lord",
    reputationTrack: null,
    reputationScores: {},
    disputesResolved: 0,
    rulingHistory: [],
    // Phase 3: Audience, Decrees, Council, Feast
    audienceResolved: [],
    activeDecrees: [],
    decreeSlotsUsed: 0,
    councilResolved: [],
    hasFeastedThisSeason: false,
    feastHistory: [],
    // Phase 4: Steward trust
    stewardTrust: 50,
    // Phase 5: Consequence engine
    hallLog: [],
    meterHistory: [],
    compoundFlags: {},
    pendingHallEvent: null,
    crisisTriggered: {},
    peakTriggered: {},
  },

  // Military state (typed garrison, fortification tracks, morale)
  military: getInitialMilitaryState(5),

  // People tab state (social tiers, labor allocation, notable families, village feed)
  people: getInitialPeopleState(20),

  // Blacksmith Forge state
  blacksmith: {
    inventory: [],
    equipped: [],
    nextItemUid: 1,
    totalItemsForged: 0,
    masterworksCreated: 0,
    godricRespect: 50,
    godricMood: "working",
    watFactIndex: 0,
    banterIndex: 0,
    lastVisitTurn: 0,
    marketPrices: null,
    productionLog: [],
    priceHistory: [],
    totalGoldInvested: 0,
    totalGoldEarned: 0,
    salesThisSeason: 0,
    activeSupplyEvent: null,
    supplyEventTurnsLeft: 0,
    usedSupplyEventIds: [],
    soldToMortimer: false,
    ironVeinActive: false,
  },
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function turnToSeasonYear(turn) {
  const zeroIndexed = turn - 1;
  const seasonIndex = zeroIndexed % 4;
  const year = Math.floor(zeroIndexed / 4) + 1;
  return { season: SEASONS[seasonIndex], year };
}

function addChronicle(chronicle, text, season, year, turn, type = "system") {
  return [
    ...chronicle,
    { text, season, year, turn, type },
  ];
}

function addCauseChain(causeChain, turn, season, year, summary) {
  const entry = { turn, season, year, summary };
  const next = [...causeChain, entry];
  return next.slice(-MAX_CAUSE_CHAIN);
}

function computeResourceDeltas(before, after) {
  return {
    denarii: after.denarii - before.denarii,
    food: after.food - before.food,
    population: after.population - before.population,
    garrison: after.garrison - before.garrison,
  };
}

/**
 * B-14 FIX: Diminishing-returns faith gain from spice purchases.
 *
 * Spices are marketed as boosting faith each season via church ceremonies.
 * Without a ceiling, spamming spice purchases drives faith near 100.
 * Gain scales down across a year (reset each new year):
 *   1st purchase: +3 faith per unit (full)
 *   2nd-3rd:      +1 faith per unit (half-ish)
 *   4th+:         +0 faith per unit (plateau)
 *
 * @param {number} prevCount  spicePurchasesThisYear BEFORE this buy
 * @param {number} unitsBought number of spice units bought in this transaction
 * @returns {number} total faith delta (integer, >= 0)
 */
function computeSpiceFaithGain(prevCount, unitsBought) {
  if (unitsBought <= 0) return 0;
  let gain = 0;
  for (let i = 0; i < unitsBought; i++) {
    const n = prevCount + i;
    if (n < 1) gain += 3;
    else if (n < 3) gain += 1;
    else gain += 0;
  }
  return gain;
}

function pickSeasonalEvent(season, usedSeasonalIds, turn, allSeasonalEvents) {
  const event = selectSeasonalEvent(season, usedSeasonalIds, turn, allSeasonalEvents);
  if (!event) return { event: null, usedSeasonalIds };

  const forSeason = (allSeasonalEvents || []).filter((e) => e.season === season);
  const allUsed = forSeason.every((e) => usedSeasonalIds.includes(e.id));
  const nextUsed = allUsed
    ? [event.id]
    : [...usedSeasonalIds.filter((id) => id !== event.id), event.id];

  return { event, usedSeasonalIds: nextUsed };
}

function pickRandomEvent(usedRandomIds, turn, allRandomEvents) {
  const event = selectRandomEvent(usedRandomIds, turn, allRandomEvents);
  if (!event) return { event: null, usedRandomIds };

  const allUsed = (allRandomEvents || []).every((e) => usedRandomIds.includes(e.id));
  const nextUsed = allUsed
    ? [event.id]
    : [...usedRandomIds.filter((id) => id !== event.id), event.id];

  return { event, usedRandomIds: nextUsed };
}

function getOptionEffects(event, optionIndex) {
  const option = event.options?.[optionIndex];
  if (!option) return {};
  if (option.effects) return option.effects;
  return event.effects ?? {};
}

function getScribesNote(event, optionIndex) {
  const option = event.options?.[optionIndex];
  return option?.scribesNote ?? event.scribesNote ?? null;
}

function buildCauseChainSummary(event, optionIndex) {
  const option = event.options?.[optionIndex];
  if (option?.causeChainSummary) return option.causeChainSummary;
  if (option?.text) return option.text.slice(0, 80);
  if (event.title) return event.title.slice(0, 80);
  return `Turn choice at event ${event.id}`;
}

/**
 * Apply an event choice: translate effects to resources, apply them, check game over.
 */
function applyChoice(state, event, optionIndex, chronicleType) {
  const { chronicle, causeChain, turn, season, year } = state;

  const effects = getOptionEffects(event, optionIndex);
  const resourceEffects = translateEffects(effects);
  const applied = applyResourceEffects(state, resourceEffects, MAX_GARRISON);
  const scribesNote = getScribesNote(event, optionIndex);

  const option = event.options?.[optionIndex];
  const chronicleText = option?.chronicle ?? option?.resultText ?? option?.text ?? event.title ?? "A decision was made.";

  const newChronicle = addChronicle(chronicle, chronicleText, season, year, turn, chronicleType);

  const summary = buildCauseChainSummary(event, optionIndex);
  const newCauseChain = addCauseChain(causeChain, turn, season, year, summary);

  // Reconcile typed garrison with flat garrison changes from events
  const garrisonDelta = applied.garrison - state.garrison;
  let updatedMilitary = applied.military || state.military;
  if (garrisonDelta !== 0 && updatedMilitary) {
    const milGarrison = { ...updatedMilitary.garrison };
    if (garrisonDelta > 0) {
      // Event adds soldiers — add as levy
      milGarrison.levy = (milGarrison.levy || 0) + garrisonDelta;
    } else {
      // Event removes soldiers — remove weakest first
      updatedMilitary = { ...updatedMilitary, garrison: removeFromGarrison(milGarrison, Math.abs(garrisonDelta)) };
    }
    if (garrisonDelta > 0) {
      updatedMilitary = { ...updatedMilitary, garrison: milGarrison };
    }
  }

  const newState = {
    ...state,
    denarii: applied.denarii,
    population: applied.population,
    garrison: applied.garrison,
    inventory: applied.inventory,
    food: applied.food,
    military: updatedMilitary,
  };
  const gameOverReason = checkGameOver(newState);

  const resourceDeltas = {
    denarii: applied.denarii - state.denarii,
    food: applied.food - state.food,
    population: applied.population - state.population,
    garrison: applied.garrison - state.garrison,
  };

  return {
    denarii: applied.denarii,
    population: applied.population,
    garrison: applied.garrison,
    inventory: applied.inventory,
    food: applied.food,
    military: updatedMilitary,
    resourceDeltas,
    chronicle: newChronicle,
    causeChain: newCauseChain,
    scribesNote,
    gameOverReason,
  };
}

/**
 * Returns which tabs are unlocked for a given turn.
 * All tabs unlocked from turn 1 in resource-based mode.
 */
export function getUnlockedTabs() {
  return ["estate", "map", "market", "military", "people", "chronicle"];
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function gameReducer(state, action) {
  switch (action.type) {

    // -----------------------------------------------------------------------
    // START / RESTART
    // -----------------------------------------------------------------------
    case "START_GAME":
    case "PLAY_AGAIN": {
      const difficulty = action.payload?.difficulty || state.difficulty || "normal";
      const config = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.normal;
      const startInventory = { ...EMPTY_INVENTORY, ...config.startingInventory };

      const startTurn = 1;
      const { season: startSeason, year: startYear } = turnToSeasonYear(startTurn);

      const openingText =
        "The old lord has passed. You have inherited the estate. " +
        "The spring air carries both promise and uncertainty. " +
        "Build your manor, manage your resources, then simulate the season to see what unfolds.";

      const chronicle = addChronicle([], openingText, startSeason, startYear, startTurn, "system");

      return {
        ...initialState,
        phase: "management",
        difficulty,
        turn: startTurn,
        season: startSeason,
        year: startYear,
        currentEvent: null,
        usedSeasonalIds: [],
        usedRandomIds: [],
        chronicle,
        denarii: config.startingDenarii,
        food: getTotalFood(startInventory),
        population: config.startingPopulation,
        garrison: config.startingGarrison ?? 5,
        inventory: startInventory,
        inventoryCapacity: 300,
        buildings: [
          { instanceId: "coal_pit-0-pre", type: "coal_pit", condition: 100, builtOnTurn: 0, freeUpkeep: true },
          { instanceId: "tannery-0-pre", type: "tannery", condition: 100, builtOnTurn: 0, freeUpkeep: true },
          { instanceId: "sawmill-0-pre", type: "sawmill", condition: 100, builtOnTurn: 0, freeUpkeep: true },
          { instanceId: "smelter-0-pre", type: "smelter", condition: 100, builtOnTurn: 0, freeUpkeep: true },
        ],
        castleLevel: 1,
        castleUpgradeProgress: 0,
        castleUpgrading: false,
        military: getInitialMilitaryState(config.startingGarrison ?? 5),
        people: getInitialPeopleState(config.startingPopulation),
        taxRate: "medium",
        laborAllocation: { demesne: 40, peasant: 40, construction: 20 },
        marketPrices: generateMarketPrices(),
        defenseUpgrades: [],
        churchDonation: 0,
        activeTab: "estate",
        seasonReport: [],
        resourceDeltas: { denarii: 0, food: 0, population: 0, garrison: 0 },
        bankruptcyTurns: 0,
        starvationTurns: 0,
        synergies: {
          activated: [], tradeTypes: [], woolTrades: 0, spicePurchases: 0,
          lowTaxTurns: 0, foodSurplusTurns: 0,
        },
        pendingSynergyNotifications: [],
        raids: getInitialRaidState(),
        tavern: {
          gambitRoundsThisSeason: 0,
          gambitLastChoice: null,
          gambitTotalWins: 0,
          gambitTotalLosses: 0,
          gambitNetEarnings: 0,
          ratsPlayedThisSeason: false,
          ratsBestScore: 0,
          bardRiddlesSolved: 0,
          wallStashFound: false,
          strangerAppearedThisSeason: false,
          totalVisits: 0,
          gambitScribesNoteSeen: false,
          ratsScribesNoteSeen: false,
          martaOffersUsed: [],
          martaSpiceInvestment: false,
          martaStoragePurchased: false,
          martaScribesNoteSeen: false,
          aldricOffersUsed: [],
          aldricDrillActive: 0,
          aldricScribesNoteSeen: false,
        },
        market: {
          reputation: { edmund: 50, wulfric: 50, agnes: 50, foreign: 50 },
          activeHaggle: null,
          currentForeignTrader: "spring",
          tradesThisSeason: 0,
          totalTradesLifetime: 0,
          totalHagglesWon: 0,
          totalHagglesLost: 0,
          denariiEarnedFromTrade: 0,
          denariiSpentOnTrade: 0,
          seasonalPriceModifiers: {},
          activeMarketEvent: null,
          usedMarketEventIds: [],
          quickTradesUsed: 0,
          haggleTradesUsed: 0,
          lastTradedSeason: { edmund: -1, wulfric: -1, agnes: -1, foreign: -1 },
          marketScribesNoteSeen: false,
          reputationScribesNoteSeen: false,
        },
      };
    }

    // -----------------------------------------------------------------------
    // SET_TAB
    // -----------------------------------------------------------------------
    case "SET_TAB": {
      const { tab } = action.payload ?? {};
      if (!tab) return state;
      return { ...state, activeTab: tab };
    }

    case "DISMISS_TUTORIAL": {
      const { tab } = action.payload ?? {};
      if (!tab || state.tutorialsSeen.includes(tab)) return state;
      return { ...state, tutorialsSeen: [...state.tutorialsSeen, tab] };
    }

    // -----------------------------------------------------------------------
    // BUILD_BUILDING
    // -----------------------------------------------------------------------
    case "BUILD_BUILDING": {
      const { buildingId } = action.payload ?? {};
      if (state.phase !== "management") return state;

      const def = BUILDINGS[buildingId];
      if (!def) return state;

      const check = canBuildBuilding(buildingId, state);
      if (!check.canBuild) return state;

      const buildingInstance = {
        instanceId: `${buildingId}-${state.turn}-${Date.now()}`,
        type: buildingId,
        condition: 100,
        builtOnTurn: state.turn,
      };

      return {
        ...state,
        denarii: state.denarii - def.cost,
        buildings: [...state.buildings, buildingInstance],
        chronicle: addChronicle(state.chronicle, `Built a ${def.name} for ${def.cost}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // DEMOLISH_BUILDING
    // -----------------------------------------------------------------------
    case "DEMOLISH_BUILDING": {
      const { buildingIndex } = action.payload ?? {};
      if (state.phase !== "management") return state;
      if (buildingIndex < 0 || buildingIndex >= state.buildings.length) return state;

      const newBuildings = [...state.buildings];
      newBuildings.splice(buildingIndex, 1);

      const removed = state.buildings[buildingIndex];
      const removedType = getBuildingType(removed);
      const def = BUILDINGS[removedType];
      const refund = def ? Math.floor(def.cost / 2) : 0;

      return {
        ...state,
        buildings: newBuildings,
        denarii: state.denarii + refund,
        chronicle: addChronicle(state.chronicle, `Demolished a ${def?.name || "building"}. Refunded ${refund}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // REPAIR_BUILDING
    // -----------------------------------------------------------------------
    case "REPAIR_BUILDING": {
      const { buildingIndex } = action.payload ?? {};
      if (state.phase !== "management") return state;
      if (buildingIndex < 0 || buildingIndex >= state.buildings.length) return state;

      const building = state.buildings[buildingIndex];
      if (typeof building === "string") return state; // Can't repair legacy format
      if (building.condition >= 100) return state;

      const cost = getRepairCost(building);
      if (state.denarii < cost) return state;

      const repairedBuildings = state.buildings.map((b, i) =>
        i === buildingIndex ? { ...b, condition: 100 } : b
      );
      const def = BUILDINGS[getBuildingType(building)];

      return {
        ...state,
        denarii: state.denarii - cost,
        buildings: repairedBuildings,
        chronicle: addChronicle(state.chronicle, `Repaired ${def?.name || "building"} to full condition for ${cost}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // UPGRADE_BUILDING
    // -----------------------------------------------------------------------
    case "UPGRADE_BUILDING": {
      const { buildingIndex } = action.payload ?? {};
      if (state.phase !== "management") return state;
      if (buildingIndex < 0 || buildingIndex >= state.buildings.length) return state;

      const building = state.buildings[buildingIndex];
      const typeId = getBuildingType(building);
      const def = BUILDINGS[typeId];
      if (!def?.upgradeTo) return state;

      const upgradeDef = BUILDINGS[def.upgradeTo];
      if (!upgradeDef) return state;

      const upgradeCost = def.upgradeCost ?? upgradeDef.cost;
      if (state.denarii < upgradeCost) return state;

      // Check if upgrade needs more plots than current building
      const extraPlots = (upgradeDef.plots ?? 1) - (def.plots ?? 1);
      if (extraPlots > 0) {
        const usedPlots = getUsedPlots(state.buildings);
        const totalPlots = state.totalPlots ?? STARTING_TOTAL_PLOTS;
        if (usedPlots + extraPlots > totalPlots) return state;
      }

      const upgradedBuildings = state.buildings.map((b, i) =>
        i === buildingIndex
          ? { ...b, type: def.upgradeTo, instanceId: `${def.upgradeTo}-${state.turn}-${Date.now()}` }
          : b
      );

      return {
        ...state,
        denarii: state.denarii - upgradeCost,
        buildings: upgradedBuildings,
        chronicle: addChronicle(state.chronicle, `Upgraded ${def.name} to ${upgradeDef.name} for ${upgradeCost}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // SELL_RESOURCE
    // -----------------------------------------------------------------------
    case "SELL_RESOURCE": {
      const { resource, quantity } = action.payload ?? {};
      if (state.phase !== "management") return state;
      const available = state.inventory[resource] || 0;
      if (available <= 0 || quantity <= 0) return state;

      const sellQty = Math.min(quantity, available);
      const activated = state.synergies?.activated ?? [];
      const basePrice = state.marketPrices.sell?.[resource] || 0;
      const tradeBonus = getSynergyTradePriceBonus(activated);
      const isWoolish = resource === "wool" || resource === "cloth";
      const woolBonus = isWoolish ? getSynergyWoolSellBonus(activated) : 0;
      const price = basePrice + tradeBonus + woolBonus;
      const income = sellQty * price;
      const newInventory = { ...state.inventory, [resource]: available - sellQty };

      const prevSynergies = state.synergies ?? {};
      const newWoolTrades = prevSynergies.woolTrades + (isWoolish ? sellQty : 0);
      const newTradeTypes = prevSynergies.tradeTypes.includes(resource)
        ? prevSynergies.tradeTypes
        : [...prevSynergies.tradeTypes, resource];

      const sellCfg = { grain: "Grain", livestock: "Livestock", fish: "Fish", timber: "Timber", clay: "Clay", iron: "Iron", stone: "Stone", wool: "Wool", cloth: "Cloth", honey: "Honey", herbs: "Herbs", ale: "Ale" };
      return {
        ...state,
        inventory: newInventory,
        denarii: state.denarii + income,
        food: getTotalFood(newInventory),
        tradeCount: (state.tradeCount || 0) + 1,
        synergies: { ...prevSynergies, woolTrades: newWoolTrades, tradeTypes: newTradeTypes },
        chronicle: addChronicle(state.chronicle, `Sold ${sellQty} ${sellCfg[resource] || resource} for ${income}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // BUY_RESOURCE
    // -----------------------------------------------------------------------
    case "BUY_RESOURCE": {
      const { resource, quantity } = action.payload ?? {};
      if (state.phase !== "management") return state;

      const price = state.marketPrices.buy?.[resource] || 0;
      if (price <= 0 || quantity <= 0) return state;

      const maxAfford = Math.floor(state.denarii / price);
      const buyQty = Math.min(quantity, maxAfford);
      if (buyQty <= 0) return state;

      const totalCost = price * buyQty;
      const currentQty = state.inventory[resource] || 0;
      const newInventory = { ...state.inventory, [resource]: currentQty + buyQty };

      const prevSynergies = state.synergies ?? {};
      const newSpicePurchases = prevSynergies.spicePurchases + (resource === "spices" ? buyQty : 0);
      const newTradeTypes = prevSynergies.tradeTypes.includes(resource)
        ? prevSynergies.tradeTypes
        : [...prevSynergies.tradeTypes, resource];

      // B-14 FIX: diminishing-returns faith gain on spice buys.
      const prevChapelBuy = state.chapel ?? {};
      const prevSpiceYearBuy = prevChapelBuy.spicePurchasesThisYear ?? 0;
      const faithGainBuy = resource === "spices"
        ? computeSpiceFaithGain(prevSpiceYearBuy, buyQty)
        : 0;
      const nextChapelBuy = resource === "spices"
        ? {
            ...prevChapelBuy,
            faith: Math.min(100, Math.max(0, (prevChapelBuy.faith ?? 50) + faithGainBuy)),
            spicePurchasesThisYear: prevSpiceYearBuy + buyQty,
          }
        : prevChapelBuy;

      const buyCfg = { grain: "Grain", livestock: "Livestock", fish: "Fish", timber: "Timber", clay: "Clay", iron: "Iron", stone: "Stone", salt: "Salt", tools: "Tools", spices: "Spices" };
      return {
        ...state,
        denarii: state.denarii - totalCost,
        inventory: newInventory,
        food: getTotalFood(newInventory),
        tradeCount: (state.tradeCount || 0) + 1,
        synergies: { ...prevSynergies, spicePurchases: newSpicePurchases, tradeTypes: newTradeTypes },
        chapel: nextChapelBuy,
        chronicle: addChronicle(state.chronicle, `Bought ${buyQty} ${buyCfg[resource] || resource} for ${totalCost}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // HAGGLE_START — Player approaches a merchant to haggle
    // -----------------------------------------------------------------------
    case "HAGGLE_START": {
      const { merchantId, resource, quantity, mode } = action.payload ?? {};
      if (state.phase !== "management") return state;
      if (state.market?.activeHaggle) return state;

      const mktPrices = state.marketPrices ?? {};
      const fairPrice = mode === "sell"
        ? (mktPrices.sell?.[resource] || 0)
        : (mktPrices.buy?.[resource] || 0);
      if (fairPrice <= 0) return state;

      const merchant = LOCAL_MERCHANTS.find(m => m.id === merchantId);
      const difficulty = merchant?.haggleDifficulty || "medium";

      const rep = state.market?.reputation?.[merchantId] ?? 50;
      const repTier = getReputationTier(rep);
      const repMod = repTier.effect;

      const openingPct = HAGGLE_CONFIG.openingOffer[difficulty] || 0.75;
      let openingOffer;
      if (mode === "sell") {
        openingOffer = Math.max(1, Math.round(fairPrice * (openingPct + repMod)));
      } else {
        openingOffer = Math.max(1, Math.round(fairPrice * (2 - openingPct - repMod)));
      }

      const qty = Math.min(quantity, mode === "sell" ? (state.inventory[resource] || 0) : quantity);
      if (qty <= 0) return state;

      return {
        ...state,
        market: {
          ...state.market,
          activeHaggle: {
            merchantId, mode, resource, quantity: qty, fairPrice,
            currentOffer: openingOffer, playerCounter: null,
            round: 1, maxRounds: HAGGLE_CONFIG.maxRounds,
            difficulty, status: "open",
          },
        },
      };
    }

    // -----------------------------------------------------------------------
    // HAGGLE_COUNTER — Player makes a counter-offer
    // -----------------------------------------------------------------------
    case "HAGGLE_COUNTER": {
      const { counterPrice } = action.payload ?? {};
      if (state.phase !== "management") return state;
      const haggle = state.market?.activeHaggle;
      if (!haggle || haggle.status !== "open") return state;

      const { fairPrice, currentOffer, round, maxRounds, difficulty, mode } = haggle;

      const priceDiff = mode === "sell"
        ? (counterPrice - fairPrice) / fairPrice
        : (fairPrice - counterPrice) / fairPrice;

      const chances = HAGGLE_CONFIG.acceptChance[difficulty] || HAGGLE_CONFIG.acceptChance.medium;
      let acceptProb = 0;
      if (priceDiff <= 0.10) acceptProb = chances.withinTenPercent;
      else if (priceDiff <= 0.20) acceptProb = chances.withinTwenty;
      else acceptProb = chances.aboveMarket;

      if (Math.random() < acceptProb) {
        return {
          ...state,
          market: {
            ...state.market,
            activeHaggle: { ...haggle, currentOffer: counterPrice, playerCounter: counterPrice, status: "accepted", round },
          },
        };
      }

      const step = HAGGLE_CONFIG.counterStep[difficulty] || 0.5;
      let newOffer;
      if (mode === "sell") {
        newOffer = Math.max(1, Math.round(currentOffer + (counterPrice - currentOffer) * step));
      } else {
        newOffer = Math.max(1, Math.round(currentOffer - (currentOffer - counterPrice) * step));
      }

      const newRound = round + 1;
      return {
        ...state,
        market: {
          ...state.market,
          activeHaggle: { ...haggle, currentOffer: newOffer, playerCounter: counterPrice, round: newRound, status: newRound >= maxRounds ? "final" : "open" },
        },
      };
    }

    // -----------------------------------------------------------------------
    // HAGGLE_ACCEPT — Player accepts the current offer
    // -----------------------------------------------------------------------
    case "HAGGLE_ACCEPT": {
      if (state.phase !== "management") return state;
      const haggle = state.market?.activeHaggle;
      if (!haggle) return state;

      const { merchantId, mode, resource, quantity, currentOffer, fairPrice } = haggle;
      const price = currentOffer;
      const prevMarket = state.market ?? {};
      const prevSynergies = state.synergies ?? {};
      const LABEL = { grain: "Grain", livestock: "Livestock", fish: "Fish", timber: "Timber", clay: "Clay", iron: "Iron", stone: "Stone", wool: "Wool", cloth: "Cloth", honey: "Honey", herbs: "Herbs", ale: "Ale", salt: "Salt", tools: "Tools", spices: "Spices" };

      let newState;
      if (mode === "sell") {
        const available = state.inventory[resource] || 0;
        const sellQty = Math.min(quantity, available);
        if (sellQty <= 0) return state;
        const income = sellQty * price;
        const newInventory = { ...state.inventory, [resource]: available - sellQty };
        const isWoolish = resource === "wool" || resource === "cloth";
        const newWoolTrades = prevSynergies.woolTrades + (isWoolish ? sellQty : 0);
        const newTradeTypes = prevSynergies.tradeTypes.includes(resource)
          ? prevSynergies.tradeTypes : [...prevSynergies.tradeTypes, resource];
        const mName = LOCAL_MERCHANTS.find(m => m.id === merchantId)?.name || FOREIGN_TRADERS[state.season]?.name || "a merchant";
        newState = {
          ...state, inventory: newInventory, denarii: state.denarii + income,
          food: getTotalFood(newInventory), tradeCount: (state.tradeCount || 0) + 1,
          synergies: { ...prevSynergies, woolTrades: newWoolTrades, tradeTypes: newTradeTypes },
          chronicle: addChronicle(state.chronicle, `Sold ${sellQty} ${LABEL[resource] || resource} to ${mName} for ${income}d (haggled from ${fairPrice}d each).`, state.season, state.year, state.turn, "action"),
        };
      } else {
        const totalCost = price * quantity;
        if (state.denarii < totalCost) return state;
        const currentQty = state.inventory[resource] || 0;
        const newInventory = { ...state.inventory, [resource]: currentQty + quantity };
        const newSpicePurchases = prevSynergies.spicePurchases + (resource === "spices" ? quantity : 0);
        const newTradeTypes = prevSynergies.tradeTypes.includes(resource)
          ? prevSynergies.tradeTypes : [...prevSynergies.tradeTypes, resource];
        const mName = LOCAL_MERCHANTS.find(m => m.id === merchantId)?.name || FOREIGN_TRADERS[state.season]?.name || "a merchant";

        // B-14 FIX: diminishing-returns faith gain on spice buys (same as BUY_RESOURCE).
        const prevChapelHag = state.chapel ?? {};
        const prevSpiceYearHag = prevChapelHag.spicePurchasesThisYear ?? 0;
        const faithGainHag = resource === "spices"
          ? computeSpiceFaithGain(prevSpiceYearHag, quantity)
          : 0;
        const nextChapelHag = resource === "spices"
          ? {
              ...prevChapelHag,
              faith: Math.min(100, Math.max(0, (prevChapelHag.faith ?? 50) + faithGainHag)),
              spicePurchasesThisYear: prevSpiceYearHag + quantity,
            }
          : prevChapelHag;

        newState = {
          ...state, denarii: state.denarii - totalCost, inventory: newInventory,
          food: getTotalFood(newInventory), tradeCount: (state.tradeCount || 0) + 1,
          synergies: { ...prevSynergies, spicePurchases: newSpicePurchases, tradeTypes: newTradeTypes },
          chapel: nextChapelHag,
          chronicle: addChronicle(state.chronicle, `Bought ${quantity} ${LABEL[resource] || resource} from ${mName} for ${totalCost}d (haggled from ${fairPrice}d each).`, state.season, state.year, state.turn, "action"),
        };
      }

      const wonHaggle = mode === "sell" ? price >= fairPrice * 0.9 : price <= fairPrice * 1.1;
      const wasFair = Math.abs(price - fairPrice) / fairPrice <= 0.1;
      let repChange = REPUTATION_CONFIG.anyDeal;
      if (wasFair) repChange += REPUTATION_CONFIG.fairDeal;
      if (haggle.round === 1) repChange += REPUTATION_CONFIG.quickAccept;
      const prevRep = prevMarket.reputation?.[merchantId] ?? 50;
      const newRep = Math.max(REPUTATION_CONFIG.min, Math.min(REPUTATION_CONFIG.max, prevRep + repChange));

      return {
        ...newState,
        market: {
          ...prevMarket, activeHaggle: null,
          reputation: { ...prevMarket.reputation, [merchantId]: newRep },
          tradesThisSeason: (prevMarket.tradesThisSeason || 0) + 1,
          totalTradesLifetime: (prevMarket.totalTradesLifetime || 0) + 1,
          totalHagglesWon: (prevMarket.totalHagglesWon || 0) + (wonHaggle ? 1 : 0),
          totalHagglesLost: (prevMarket.totalHagglesLost || 0) + (wonHaggle ? 0 : 1),
          denariiEarnedFromTrade: (prevMarket.denariiEarnedFromTrade || 0) + (mode === "sell" ? currentOffer * quantity : 0),
          denariiSpentOnTrade: (prevMarket.denariiSpentOnTrade || 0) + (mode === "buy" ? currentOffer * quantity : 0),
          haggleTradesUsed: (prevMarket.haggleTradesUsed || 0) + 1,
          lastTradedSeason: { ...prevMarket.lastTradedSeason, [merchantId]: state.turn },
        },
      };
    }

    // -----------------------------------------------------------------------
    // HAGGLE_WALK_AWAY — Player abandons the current haggle
    // -----------------------------------------------------------------------
    case "HAGGLE_WALK_AWAY": {
      if (state.phase !== "management") return state;
      const haggle = state.market?.activeHaggle;
      if (!haggle) return state;
      const { merchantId } = haggle;
      const prevMarket = state.market ?? {};
      const prevRep = prevMarket.reputation?.[merchantId] ?? 50;
      const newRep = Math.max(REPUTATION_CONFIG.min, prevRep + REPUTATION_CONFIG.walkAway);
      return {
        ...state,
        market: { ...prevMarket, activeHaggle: null, reputation: { ...prevMarket.reputation, [merchantId]: newRep } },
        chronicle: addChronicle(state.chronicle, "You walked away from a deal at the market.", state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // SET_TAX_RATE
    // -----------------------------------------------------------------------
    case "SET_TAX_RATE": {
      const { rate } = action.payload ?? {};
      if (state.phase !== "management") return state;
      if (!["low", "medium", "high", "crushing"].includes(rate)) return state;
      return { ...state, taxRate: rate };
    }

    // -----------------------------------------------------------------------
    // PEOPLE_SET_LABOR — labor allocation from People tab
    // -----------------------------------------------------------------------
    case "PEOPLE_SET_LABOR": {
      if (state.phase !== "management") return state;
      const { laborFarming, laborGarrison, laborChurch } = action.payload ?? {};
      const prevPeople = state.people ?? getInitialPeopleState(state.population);
      return {
        ...state,
        people: {
          ...prevPeople,
          laborFarming: laborFarming ?? prevPeople.laborFarming,
          laborGarrison: laborGarrison ?? prevPeople.laborGarrison,
          laborChurch: laborChurch ?? prevPeople.laborChurch,
        },
      };
    }

    // -----------------------------------------------------------------------
    // RECRUIT_SOLDIERS (typed: levy, menAtArms, knights)
    // -----------------------------------------------------------------------
    case "RECRUIT_SOLDIERS": {
      const { count, soldierType = "levy" } = action.payload ?? {};
      if (state.phase !== "management") return state;
      if (!count || count <= 0) return state;

      const typeDef = SOLDIER_TYPES[soldierType];
      if (!typeDef) return state;

      const mil = state.military ?? getInitialMilitaryState(state.garrison);
      const currentCount = mil.garrison[soldierType] || 0;
      const totalGarrison = getTotalGarrison(mil.garrison);

      // Cost check
      const maxCanAfford = Math.floor(state.denarii / typeDef.recruitCost);

      // Type cap
      const maxByTypeCap = typeDef.max != null ? typeDef.max - currentCount : Infinity;

      // Population cap (60% of population for total garrison)
      const maxByPop = Math.floor(state.population * 0.6) - totalGarrison;

      // Knights require minimum population
      if (soldierType === "knights" && state.population < (typeDef.minPopulation || 0)) return state;

      const actual = Math.min(count, maxCanAfford, maxByTypeCap, maxByPop);
      if (actual <= 0) return state;

      const cost = actual * typeDef.recruitCost;
      const newGarrison = { ...mil.garrison, [soldierType]: currentCount + actual };

      return {
        ...state,
        denarii: state.denarii - cost,
        garrison: getTotalGarrison(newGarrison),
        military: {
          ...mil,
          garrison: newGarrison,
          morale: soldierType === "knights" ? Math.min(100, (mil.morale || 50) + 5) : mil.morale,
          totalRecruitmentSpending: (mil.totalRecruitmentSpending || 0) + cost,
        },
        chronicle: addChronicle(state.chronicle, `Recruited ${actual} ${typeDef.name.toLowerCase()} for ${cost}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // DISMISS_SOLDIERS (typed: levy, menAtArms, knights)
    // -----------------------------------------------------------------------
    case "DISMISS_SOLDIERS": {
      const { count, soldierType = "levy" } = action.payload ?? {};
      if (state.phase !== "management") return state;
      if (!count || count <= 0) return state;

      const typeDef = SOLDIER_TYPES[soldierType];
      if (!typeDef) return state;

      const mil = state.military ?? getInitialMilitaryState(state.garrison);
      const currentCount = mil.garrison[soldierType] || 0;
      const actual = Math.min(count, currentCount);
      if (actual <= 0) return state;

      const newGarrison = { ...mil.garrison, [soldierType]: currentCount - actual };
      const newMorale = Math.max(0, (mil.morale || 50) - 5); // Dismissal hurts morale

      return {
        ...state,
        garrison: getTotalGarrison(newGarrison),
        military: { ...mil, garrison: newGarrison, morale: newMorale },
        chronicle: addChronicle(state.chronicle, `Dismissed ${actual} ${typeDef.name.toLowerCase()}.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // UPGRADE_CASTLE (legacy — kept for backward compat, no-op if military exists)
    // -----------------------------------------------------------------------
    case "UPGRADE_CASTLE": {
      // Legacy action — use UPGRADE_FORTIFICATION instead
      return state;
    }

    // -----------------------------------------------------------------------
    // INSTALL_DEFENSE (legacy — replaced by fortification tracks)
    // -----------------------------------------------------------------------
    case "INSTALL_DEFENSE": {
      // Legacy action — use UPGRADE_FORTIFICATION instead
      return state;
    }

    // -----------------------------------------------------------------------
    // UPGRADE_FORTIFICATION (walls, gate, or moat)
    // -----------------------------------------------------------------------
    case "UPGRADE_FORTIFICATION": {
      const { track } = action.payload ?? {};
      if (state.phase !== "management") return state;
      if (!["walls", "gate", "moat"].includes(track)) return state;

      const mil = state.military ?? getInitialMilitaryState(state.garrison);
      const currentLevels = { walls: mil.walls, gate: mil.gate, moat: mil.moat };
      const { canUpgrade, next } = canUpgradeFortification(track, currentLevels);
      if (!canUpgrade || !next) return state;

      if (state.denarii < next.cost) return state;

      const newMil = {
        ...mil,
        [track]: next.level,
        morale: Math.min(100, (mil.morale || 50) + 10), // Castle upgrade boosts morale
        totalFortificationSpending: (mil.totalFortificationSpending || 0) + next.cost,
      };

      // Keep castleLevel synced with walls level (for passive income)
      const newCastleLevel = track === "walls" ? next.level : state.castleLevel;

      // Determine scribe's note
      let scribesNote = null;
      if (track === "walls" && next.level === 2 && !mil.scribesNoteSeen?.castleEvolution) {
        scribesNote = MILITARY_SCRIBES_NOTES.castleEvolution;
        newMil.scribesNoteSeen = { ...mil.scribesNoteSeen, castleEvolution: true };
      }

      return {
        ...state,
        denarii: state.denarii - next.cost,
        castleLevel: newCastleLevel,
        military: newMil,
        scribesNote: scribesNote || state.scribesNote,
        chronicle: addChronicle(state.chronicle, `Upgraded ${track} to ${next.name} for ${next.cost}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // DONATE_TO_CHURCH
    // -----------------------------------------------------------------------
    case "DONATE_TO_CHURCH": {
      const { amount } = action.payload ?? {};
      if (state.phase !== "management") return state;
      if (!amount || amount <= 0) return state;
      if (state.denarii < amount) return state;

      return {
        ...state,
        denarii: state.denarii - amount,
        churchDonation: (state.churchDonation || 0) + amount,
        chronicle: addChronicle(state.chronicle, `Donated ${amount}d to the Church.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // SIMULATE_SEASON
    // -----------------------------------------------------------------------
    case "SIMULATE_SEASON": {
      if (state.phase !== "management") return state;

      // Victory check BEFORE any season processing — prevents raids/events
      // from firing after the final turn (BUG 4 fix)
      if (state.turn >= MAX_TURNS) {
        // Pyrrhic victory: survived but barely — population too low
        const isPyrrhic = state.population < 3;
        const victoryText = isPyrrhic
          ? "Ten years have passed, but at what cost? Your estate barely clings to life. " +
            "The chronicles will note your survival, though few remain to read them."
          : "Ten years have passed. Your reign has endured through war, famine, and feast. " +
            "The chronicles will remember your name.";
        const { season: vSeason, year: vYear } = turnToSeasonYear(state.turn);
        return {
          ...state,
          phase: "victory",
          pyrrhicVictory: isPyrrhic,
          chronicle: addChronicle(state.chronicle, victoryText, vSeason, vYear, state.turn, "system"),
          currentEvent: null,
          currentRandomEvent: null,
          scribesNote: null,
        };
      }

      const { seasonalEvents = [] } = action.payload ?? {};
      const { turn, season, year, usedSeasonalIds } = state;

      // Snapshot before economy
      const before = { denarii: state.denarii, food: state.food, population: state.population, garrison: state.garrison };

      // 1. Run the full economic simulation
      const econResult = simulateEconomy({
        denarii: state.denarii,
        population: state.population,
        inventory: state.inventory,
        inventoryCapacity: state.inventoryCapacity,
        buildings: state.buildings,
        garrison: state.garrison,
        castleLevel: state.castleLevel,
        taxRate: state.taxRate,
        season,
        turn,
        difficulty: state.difficulty,
        defenseUpgrades: state.defenseUpgrades,
        churchDonation: state.churchDonation ?? 0,
        synergies: state.synergies,
        military: state.military,
      });

      // 1.5. MORALE & TYPED GARRISON RECONCILIATION
      const prevMil = state.military ?? getInitialMilitaryState(state.garrison);
      let milMorale = prevMil.morale ?? 50;
      let milGarrison = { ...prevMil.garrison };
      let milDesertions = 0;

      // Reconcile garrison if economy engine removed soldiers (food shortage/unpaid upkeep)
      const totalBefore = getTotalGarrison(milGarrison);
      const totalAfter = econResult.garrison;
      if (totalAfter < totalBefore) {
        const deserted = totalBefore - totalAfter;
        milGarrison = removeFromGarrison(milGarrison, deserted);
        milDesertions += deserted;
      }

      // Morale: upkeep paid?
      const upkeepCost = getMilitaryUpkeep(prevMil.garrison);
      if (upkeepCost > 0 && econResult.denarii >= 0) {
        milMorale = Math.min(100, milMorale + 2);
      } else if (upkeepCost > 0 && econResult.denarii <= 0) {
        milMorale = Math.max(0, milMorale - 10);
      }

      // Morale: food stores (tiered thresholds scaled to population)
      const foodPerPerson = econResult.population > 0 ? econResult.food / econResult.population : 0;
      if (foodPerPerson > 5) {
        milMorale = Math.min(100, milMorale + 3);
      } else if (foodPerPerson > 3) {
        milMorale = Math.min(100, milMorale + 1);
      } else if (econResult.food <= 0) {
        milMorale = Math.max(0, milMorale - 15);
      } else if (foodPerPerson < 1) {
        milMorale = Math.max(0, milMorale - 8);
      } else if (foodPerPerson < 2) {
        milMorale = Math.max(0, milMorale - 3);
      }

      // Morale: population unhappiness
      if (econResult.population < 10) {
        milMorale = Math.max(0, milMorale - 3);
      }

      // Morale: natural drift toward equilibrium (70)
      // Above 70: decay scales with distance. Below 30: slow recovery.
      if (milMorale > 85) {
        milMorale -= 3;
      } else if (milMorale > 70) {
        milMorale -= 2;
      } else if (milMorale < 30) {
        milMorale = Math.min(30, milMorale + 2);
      }

      // Track idle seasons (used for narrative flavor, no morale penalty)
      const idleSeasons = (prevMil.idleSeasons || 0) + 1;

      // Morale: mutinous desertion (10% chance per levy)
      const moraleLevel = getMoraleLevel(milMorale);
      if (moraleLevel.desertionChance > 0 && milGarrison.levy > 0) {
        let levyDeserted = 0;
        for (let i = 0; i < milGarrison.levy; i++) {
          if (Math.random() < moraleLevel.desertionChance) levyDeserted++;
        }
        if (levyDeserted > 0) {
          milGarrison = { ...milGarrison, levy: milGarrison.levy - levyDeserted };
          milDesertions += levyDeserted;
          econResult.report.push(`${levyDeserted} levy ${levyDeserted === 1 ? "peasant" : "peasants"} deserted due to mutinous morale.`);
        }
      }

      // Knights abandon if population too low (scaled by difficulty)
      const knightPopThreshold = { easy: 10, normal: 8, hard: 5 }[state.difficulty || "normal"] || 8;
      if (milGarrison.knights > 0 && econResult.population < knightPopThreshold) {
        const knightName = KNIGHT_NAMES[Math.floor(Math.random() * KNIGHT_NAMES.length)];
        milGarrison = { ...milGarrison, knights: milGarrison.knights - 1 };
        milDesertions += 1;
        econResult.report.push(`${knightName} has abandoned your service, disgusted by the state of your people.`);
      }

      const updatedMilitary = {
        ...prevMil,
        garrison: milGarrison,
        morale: milMorale,
        idleSeasons,
        totalUpkeepSpending: (prevMil.totalUpkeepSpending || 0) + upkeepCost,
        soldiersLostToDesertion: (prevMil.soldiersLostToDesertion || 0) + milDesertions,
      };

      // Update the total garrison count
      const finalGarrison = getTotalGarrison(milGarrison);
      econResult.garrison = finalGarrison;

      // 2. Track bankruptcy
      let bankruptcyTurns = state.bankruptcyTurns || 0;
      if (econResult.denarii <= 0) {
        bankruptcyTurns += 1;
      } else {
        bankruptcyTurns = 0;
      }

      // 2b. Track starvation (food at 0 for consecutive turns)
      let starvationTurns = state.starvationTurns || 0;
      if (econResult.food <= 0) {
        starvationTurns += 1;
      } else {
        starvationTurns = 0;
      }

      // 3. Add economic report to chronicle
      let nextChronicle = state.chronicle;
      for (const line of econResult.report) {
        nextChronicle = addChronicle(nextChronicle, line, season, year, turn, "system");
      }

      // 3.5. BUILDING DEGRADATION — condition decays each season
      const degradeMult = SEASON_DEGRADE_MULTIPLIERS[season] ?? 1.0;
      const degradedBuildings = state.buildings.map((b) => {
        if (typeof b === "string") return b; // Legacy string format — skip
        const def = BUILDINGS[getBuildingType(b)];
        const rate = def?.degradeRate ?? 5;
        const loss = Math.round(rate * 0.5 * degradeMult);
        const newCondition = Math.max(0, (b.condition ?? 100) - loss);
        return { ...b, condition: newCondition };
      });

      // Report condition warnings
      for (const b of degradedBuildings) {
        if (typeof b === "string") continue;
        const def = BUILDINGS[getBuildingType(b)];
        if (!def) continue;
        const orig = state.buildings.find((sb) => typeof sb !== "string" && sb.instanceId === b.instanceId);
        if (b.condition <= 24 && orig && orig.condition > 24) {
          nextChronicle = addChronicle(nextChronicle, `Your ${def.name} has fallen into ruin and produces nothing until repaired.`, season, year, turn, "system");
        } else if (b.condition <= 49 && b.condition > 24 && orig && orig.condition > 49) {
          nextChronicle = addChronicle(nextChronicle, `Your ${def.name} is in poor condition \u2014 output reduced by half.`, season, year, turn, "system");
        }
      }

      // 3.6. ECONOMY HISTORY — track for trend display
      const newEconomyHistory = [...(state.economyHistory ?? []), {
        turn,
        season,
        netGold: econResult.denarii - state.denarii,
        netFood: econResult.food - state.food,
      }].slice(-8);

      // 3.7 PEOPLE — tiers, loyalty, departures, feed
      const prevPeople = state.people ?? getInitialPeopleState(state.population);
      const foodBal = econResult.food - state.food;
      const reconciledTiers = reconcileTiers(econResult.population, prevPeople.tiers ?? { serfs: 12, freemen: 6, skilled: 2 });
      const peopleMorale = computeMorale({ ...state, population: econResult.population, resourceDeltas: { ...state.resourceDeltas, food: foodBal }, people: prevPeople });
      let pFamilies = updateFamilyLoyalty(prevPeople.notableFamilies || [], state.taxRate, peopleMorale.value, prevPeople.laborGarrison ?? 0, prevPeople.laborChurch ?? 5, foodBal);
      for (const fid of checkFamilyDepartures(pFamilies, peopleMorale.value)) { pFamilies = pFamilies.map((f) => f.id !== fid ? f : (nextChronicle = addChronicle(nextChronicle, f.leaveNarrative || `${f.name} has left.`, season, year, turn, "event"), { ...f, present: false, turnsGone: 0 })); }
      for (const fid of checkFamilyReturns(pFamilies, peopleMorale.value)) { pFamilies = pFamilies.map((f) => f.id !== fid ? f : (nextChronicle = addChronicle(nextChronicle, f.returnNarrative || `${f.name} has returned.`, season, year, turn, "event"), { ...f, present: true, turnsGone: 0, loyalty: 1 })); }
      const pFeed = pickFeedEvents(season, peopleMorale.value, foodBal, econResult.population, pFamilies);
      const pTaxRev = season === "autumn" ? econResult.population * (({ low: 2, medium: 4, high: 6, crushing: 8 })[state.taxRate] || 4) : 0;
      const updatedPeople = { ...prevPeople, tiers: reconciledTiers, notableFamilies: pFamilies, villageFeed: pFeed, taxHistory: [...(prevPeople.taxHistory || []), { season, year, revenue: pTaxRev }].slice(-8) };

      // 4. Check game over from economy
      const afterState = {
        population: econResult.population,
        bankruptcyTurns,
        starvationTurns,
        difficulty: state.difficulty,
      };
      const econGameOver = checkGameOver(afterState);
      if (econGameOver) {
        return {
          ...state,
          denarii: econResult.denarii,
          food: econResult.food,
          population: econResult.population,
          garrison: econResult.garrison,
          inventory: econResult.inventory,
          buildings: degradedBuildings,
          economyHistory: newEconomyHistory,
          chronicle: nextChronicle,
          seasonReport: econResult.report,
          resourceDeltas: computeResourceDeltas(before, {
            denarii: econResult.denarii,
            food: econResult.food,
            population: econResult.population,
            garrison: econResult.garrison,
          }),
          bankruptcyTurns,
          starvationTurns,
          phase: "game_over",
          gameOverReason: econGameOver,
          currentEvent: null,
          currentRandomEvent: null,
          churchDonation: 0,
          military: updatedMilitary,
          people: updatedPeople,
        };
      }

      // 5. Pick the seasonal event
      const { event: seasonalEvent, usedSeasonalIds: nextUsedSeasonalIds } = pickSeasonalEvent(
        season,
        usedSeasonalIds,
        turn,
        seasonalEvents,
      );

      // Reset tavern seasonal limits
      const tavernSeasonReset = {
        ...state.tavern,
        gambitRoundsThisSeason: 0,
        ratsPlayedThisSeason: false,
        strangerAppearedThisSeason: false,
      };

      // Reset watchtower seasonal state, clear one-season warnings
      const prevWt = state.watchtower ?? {};
      const watchtowerSeasonReset = {
        ...prevWt,
        scannedThisSeason: false,
        lastScanResult: null,
        warnings: {
          criminalRaidBonus: 0,
          scottishRaidBonus: 0,
          raidRequirementReduction: 0,
          merchantPreview: null,
        },
      };

      // Reset market seasonal state and pick market event
      const prevMkt = state.market ?? {};
      const marketEvent = pickMarketEvent(turn, prevMkt.usedMarketEventIds || []);
      const marketSeasonReset = {
        ...prevMkt,
        activeHaggle: null,
        tradesThisSeason: 0,
        activeMarketEvent: marketEvent,
        usedMarketEventIds: marketEvent
          ? [...(prevMkt.usedMarketEventIds || []), marketEvent.id]
          : (prevMkt.usedMarketEventIds || []),
      };

      if (marketEvent) {
        nextChronicle = addChronicle(nextChronicle, `Market: ${marketEvent.title} \u2014 ${marketEvent.description}`, season, year, turn, "event");
      }

      // Resolve Marta's spice investment
      let finalDenarii = econResult.denarii;
      if (tavernSeasonReset.martaSpiceInvestment) {
        if (Math.random() < 0.85) {
          finalDenarii += 120;
          nextChronicle = addChronicle(nextChronicle, "Marta\u2019s spice shipment arrived! +120d.", season, year, turn, "action");
        } else {
          nextChronicle = addChronicle(nextChronicle, "Marta\u2019s spice shipment was lost to bandits. Your 75d investment is gone.", season, year, turn, "event");
        }
        tavernSeasonReset.martaSpiceInvestment = false;
      }

      // Decrement Aldric's drill buff
      if (tavernSeasonReset.aldricDrillActive > 0) {
        tavernSeasonReset.aldricDrillActive -= 1;
        if (tavernSeasonReset.aldricDrillActive === 0) {
          nextChronicle = addChronicle(nextChronicle, "Aldric\u2019s training effect has faded.", season, year, turn, "system");
        }
      }

      // --- BLACKSMITH SEASON PROCESSING ---
      const prevBs = state.blacksmith ?? {};
      let forgeInv = econResult.inventory;
      let forgeSeasonReset = { ...prevBs, salesThisSeason: 0 };

      // Iron vein passive production
      if (prevBs.ironVeinActive) {
        forgeInv = { ...forgeInv, iron: (forgeInv.iron || 0) + 3 };
        nextChronicle = addChronicle(nextChronicle, "The iron vein yielded 3 bars.", season, year, turn, "system");
      }

      // Record price history snapshot
      const currentForgePrices = generateForgeMarketPrices(season);
      forgeSeasonReset.priceHistory = [...(prevBs.priceHistory || []).slice(-12), {
        turn, season, prices: currentForgePrices,
      }];
      forgeSeasonReset.marketPrices = currentForgePrices;

      // Supply event countdown
      if (prevBs.supplyEventTurnsLeft > 0) {
        forgeSeasonReset.supplyEventTurnsLeft = prevBs.supplyEventTurnsLeft - 1;
        if (forgeSeasonReset.supplyEventTurnsLeft <= 0) {
          forgeSeasonReset.activeSupplyEvent = null;
          nextChronicle = addChronicle(nextChronicle, "The forge supply disruption has ended.", season, year, turn, "system");
        }
      }

      // Roll for new supply event (if none active)
      if (!forgeSeasonReset.activeSupplyEvent) {
        const newForgeEvent = rollForgeSupplyEvent(turn, forgeSeasonReset.usedSupplyEventIds || []);
        if (newForgeEvent) {
          forgeSeasonReset.activeSupplyEvent = newForgeEvent;
          forgeSeasonReset.supplyEventTurnsLeft = newForgeEvent.duration || 0;
        }
      }

      // Equipped items update econResult inventory
      econResult.inventory = forgeInv;

      // --- RAID CHECK (after production, before seasonal events) ---
      const prevRaids = state.raids ?? getInitialRaidState();
      const raidsWithCooldowns = {
        ...prevRaids,
        criminalCooldown: Math.max(0, (prevRaids.criminalCooldown || 0) - 1),
        scottishCooldown: Math.max(0, (prevRaids.scottishCooldown || 0) - 1),
      };
      const raidTrigger = checkForRaid(raidsWithCooldowns, turn);

      if (raidTrigger) {
        // Raid triggered — pause season at raid_warning phase
        return {
          ...state,
          denarii: finalDenarii,
          food: econResult.food,
          population: econResult.population,
          garrison: econResult.garrison,
          inventory: econResult.inventory,
          buildings: degradedBuildings,
          economyHistory: newEconomyHistory,
          chronicle: nextChronicle,
          seasonReport: econResult.report,
          resourceDeltas: computeResourceDeltas(before, {
            denarii: finalDenarii,
            food: econResult.food,
            population: econResult.population,
            garrison: econResult.garrison,
          }),
          bankruptcyTurns,
          starvationTurns,
          phase: "raid_warning",
          currentEvent: seasonalEvent,
          usedSeasonalIds: nextUsedSeasonalIds,
          activeTab: "chronicle",
          churchDonation: 0,
          tavern: tavernSeasonReset,
          watchtower: watchtowerSeasonReset,
          market: marketSeasonReset,
          military: updatedMilitary,
          people: updatedPeople,
          blacksmith: forgeSeasonReset,
          raids: {
            ...raidsWithCooldowns,
            activeRaid: { type: raidTrigger.type, phase: "warning", result: null },
          },
        };
      }

      return {
        ...state,
        denarii: finalDenarii,
        food: econResult.food,
        population: econResult.population,
        garrison: econResult.garrison,
        inventory: econResult.inventory,
        buildings: degradedBuildings,
        economyHistory: newEconomyHistory,
        chronicle: nextChronicle,
        seasonReport: econResult.report,
        resourceDeltas: computeResourceDeltas(before, {
          denarii: finalDenarii,
          food: econResult.food,
          population: econResult.population,
          garrison: econResult.garrison,
        }),
        bankruptcyTurns,
        starvationTurns,
        phase: (seasonalEvent && seasonalEvent.options?.length > 0) ? "seasonal_action" : "seasonal_resolve",
        currentEvent: (seasonalEvent && seasonalEvent.options?.length > 0) ? seasonalEvent : null,
        usedSeasonalIds: nextUsedSeasonalIds,
        activeTab: "chronicle",
        churchDonation: 0,
        tavern: tavernSeasonReset,
        watchtower: watchtowerSeasonReset,
        market: marketSeasonReset,
        military: updatedMilitary,
        people: updatedPeople,
        blacksmith: forgeSeasonReset,
        raids: { ...raidsWithCooldowns, activeRaid: null },
      };
    }

    // -----------------------------------------------------------------------
    // RAID_DEFEND — player clicks "Defend the Estate" on warning screen
    // -----------------------------------------------------------------------
    case "RAID_DEFEND": {
      if (state.phase !== "raid_warning") return state;
      const raids = state.raids ?? {};
      const activeRaid = raids.activeRaid;
      if (!activeRaid || activeRaid.phase !== "warning") return state;

      const raidType = activeRaid.type;
      const mil = state.military ?? getInitialMilitaryState(state.garrison);

      // Calculate watchtower bonus
      const wtWarnings = state.watchtower?.warnings ?? {};
      let watchtowerBonus = 0;
      if (raidType === "criminal") watchtowerBonus += (wtWarnings.criminalRaidBonus || 0);
      if (raidType === "scottish") watchtowerBonus += (wtWarnings.scottishRaidBonus || 0);
      watchtowerBonus += (wtWarnings.raidRequirementReduction || 0);

      // Calculate defense rating (including forge equipment bonus)
      const forgeEquipBonus = calculateForgeReadiness(
        (state.blacksmith ?? {}).equipped || [], state.garrison
      ).defenseBonus;
      const defenseRating = calculateDefenseRating(mil, watchtowerBonus + forgeEquipBonus);
      const defenseThreshold = raidType === "criminal" ? CRIMINAL_DEFENSE_THRESHOLD : SCOTTISH_DEFENSE_THRESHOLD;

      const result = resolveRaid(raidType, defenseRating, defenseThreshold, state.garrison, state.castleLevel, state.inventory, state.difficulty);
      if (!result) return state;

      // Log watchtower intelligence if it helped
      let raidChronicle = state.chronicle;
      if (watchtowerBonus > 0) {
        raidChronicle = addChronicle(
          raidChronicle,
          `Watchtower intelligence applied: defense rating boosted by ${watchtowerBonus}.`,
          state.season, state.year, state.turn, "system"
        );
      }

      // Update morale based on raid outcome
      let raidMorale = mil.morale;
      if (result.victory) {
        raidMorale = Math.min(100, raidMorale + 15);
      } else {
        raidMorale = Math.max(0, raidMorale - 20);
      }

      // Determine scribe's note for first-time raids
      const raidDef = RAID_TYPES[raidType];
      const scribesKey = raidType === "criminal" ? "criminalScribesNoteSeen" : "scottishScribesNoteSeen";
      const isFirstRaid = !raids[scribesKey];
      const raidScribesNote = isFirstRaid ? raidDef.scribesNote : null;

      // Also show feudal obligation scribe's note on first raid if not yet seen
      let militaryScribesNote = null;
      if (!mil.scribesNoteSeen?.feudalObligation) {
        militaryScribesNote = MILITARY_SCRIBES_NOTES.feudalObligation;
      }

      return {
        ...state,
        phase: "raid_result",
        scribesNote: raidScribesNote || militaryScribesNote || null,
        chronicle: raidChronicle,
        military: {
          ...mil,
          morale: raidMorale,
          lastRaidOutcome: result.victory ? "victory" : "defeat",
          idleSeasons: 0,
          scribesNoteSeen: militaryScribesNote
            ? { ...mil.scribesNoteSeen, feudalObligation: true }
            : mil.scribesNoteSeen,
        },
        raids: {
          ...raids,
          activeRaid: { ...activeRaid, phase: "result", result, defenseRating, defenseThreshold, watchtowerBonus },
          [scribesKey]: true,
        },
      };
    }

    // -----------------------------------------------------------------------
    // RAID_CONTINUE — player clicks "Continue" after seeing raid results
    // -----------------------------------------------------------------------
    case "RAID_CONTINUE": {
      if (state.phase !== "raid_result") return state;
      const raids = state.raids ?? {};
      const activeRaid = raids.activeRaid;
      if (!activeRaid || activeRaid.phase !== "result" || !activeRaid.result) return state;

      const { type: raidType, result } = activeRaid;
      const { season, year, turn } = state;

      // Apply resource changes — cap population loss at 25% per raid
      let newDenarii = Math.max(0, state.denarii + result.denariiDelta);
      const maxPopLoss = Math.ceil(state.population * 0.25);
      const cappedPopDelta = result.populationDelta < 0
        ? Math.max(result.populationDelta, -maxPopLoss)
        : result.populationDelta;
      let newPopulation = Math.max(0, state.population + cappedPopDelta);
      let newInventory = { ...state.inventory };

      // Apply food delta to grain
      if (result.foodDelta !== 0) {
        const currentGrain = newInventory.grain || 0;
        newInventory.grain = Math.max(0, currentGrain + result.foodDelta);
      }

      // Apply trade good loss
      if (result.tradeGoodLost) {
        const { resource, amount } = result.tradeGoodLost;
        newInventory[resource] = Math.max(0, (newInventory[resource] || 0) - amount);
      }

      const newFood = getTotalFood(newInventory);

      // Reconcile typed garrison after raid losses
      const raidMil = state.military ?? getInitialMilitaryState(state.garrison);
      let raidGarrison = { ...raidMil.garrison };
      let raidSoldiersLost = 0;
      if (result.garrisonDelta < 0) {
        const loss = Math.abs(result.garrisonDelta);
        raidGarrison = removeFromGarrison(raidGarrison, loss);
        raidSoldiersLost = loss;
      }
      // Add garrison gains (from victory — added as levy)
      if (result.garrisonDelta > 0) {
        raidGarrison = { ...raidGarrison, levy: (raidGarrison.levy || 0) + result.garrisonDelta };
      }
      let newGarrison = getTotalGarrison(raidGarrison);
      newGarrison = Math.max(0, newGarrison);

      const updatedRaidMil = {
        ...raidMil,
        garrison: raidGarrison,
        soldiersLostToRaids: (raidMil.soldiersLostToRaids || 0) + raidSoldiersLost,
      };

      // Build chronicle entry
      const defRating = activeRaid.defenseRating ?? 0;
      const defThreshold = activeRaid.defenseThreshold ?? 0;
      const wtBonus = activeRaid.watchtowerBonus ?? 0;
      const chronicleText = buildRaidChronicleText(raidType, result, season, year, state.garrison, defRating, defThreshold, wtBonus);
      let nextChronicle = addChronicle(state.chronicle, chronicleText, season, year, turn, "event");

      // Update raid statistics
      const isCriminal = raidType === "criminal";
      const updatedRaids = {
        ...raids,
        lastRaidTurn: turn,
        lastRaidType: raidType,
        criminalCooldown: isCriminal ? RAID_TYPES.criminal.cooldownTurns : raids.criminalCooldown,
        scottishCooldown: !isCriminal ? RAID_TYPES.scottish.cooldownTurns : raids.scottishCooldown,
        totalCriminalRaids: (raids.totalCriminalRaids || 0) + (isCriminal ? 1 : 0),
        totalScottishRaids: (raids.totalScottishRaids || 0) + (!isCriminal ? 1 : 0),
        criminalVictories: (raids.criminalVictories || 0) + (isCriminal && result.victory ? 1 : 0),
        scottishVictories: (raids.scottishVictories || 0) + (!isCriminal && result.victory ? 1 : 0),
        criminalDefeats: (raids.criminalDefeats || 0) + (isCriminal && !result.victory ? 1 : 0),
        scottishDefeats: (raids.scottishDefeats || 0) + (!isCriminal && !result.victory ? 1 : 0),
        totalDenariiLost: (raids.totalDenariiLost || 0) + (result.denariiDelta < 0 ? Math.abs(result.denariiDelta) : 0),
        totalFoodLost: (raids.totalFoodLost || 0) + (result.foodDelta < 0 ? Math.abs(result.foodDelta) : 0),
        totalDenariiRecovered: (raids.totalDenariiRecovered || 0) + (result.denariiDelta > 0 ? result.denariiDelta : 0),
        activeRaid: null,
      };

      // Bankruptcy counter: preserve SIMULATE_SEASON's count for this turn.
      // Only update if raid pushed denarii to 0 when it wasn't already 0.
      let raidBankruptcyTurns = state.bankruptcyTurns || 0;
      if (newDenarii <= 0 && state.denarii > 0) {
        // Raid caused bankruptcy this turn — set to 1 (not increment, to avoid double-count)
        raidBankruptcyTurns = Math.max(raidBankruptcyTurns, 1);
      }

      // Check game over after raid losses
      const postRaidState = { population: newPopulation, bankruptcyTurns: state.bankruptcyTurns, starvationTurns: state.starvationTurns, difficulty: state.difficulty };
      const raidGameOver = checkGameOver(postRaidState);
      if (raidGameOver) {
        return {
          ...state,
          denarii: newDenarii,
          food: newFood,
          population: newPopulation,
          garrison: newGarrison,
          inventory: newInventory,
          chronicle: nextChronicle,
          raids: updatedRaids,
          military: updatedRaidMil,
          bankruptcyTurns: raidBankruptcyTurns,
          phase: "game_over",
          gameOverReason: raidGameOver,
          currentEvent: null,
          currentRandomEvent: null,
          scribesNote: null,
        };
      }

      // Resume normal season flow — go to seasonal_action (or skip to resolve if no event)
      return {
        ...state,
        denarii: newDenarii,
        food: newFood,
        population: newPopulation,
        garrison: newGarrison,
        inventory: newInventory,
        chronicle: nextChronicle,
        raids: updatedRaids,
        military: updatedRaidMil,
        bankruptcyTurns: raidBankruptcyTurns,
        scribesNote: null,
        phase: (state.currentEvent && state.currentEvent.options?.length > 0) ? "seasonal_action" : "seasonal_resolve",
        currentEvent: (state.currentEvent && state.currentEvent.options?.length > 0) ? state.currentEvent : null,
        activeTab: "chronicle",
        resourceDeltas: {
          denarii: newDenarii - state.denarii,
          food: newFood - state.food,
          population: newPopulation - state.population,
          garrison: newGarrison - state.garrison,
        },
      };
    }

    // -----------------------------------------------------------------------
    // SELECT_SEASONAL_ACTION
    // -----------------------------------------------------------------------
    case "SELECT_SEASONAL_ACTION": {
      const { optionIndex } = action.payload ?? {};
      const { currentEvent, phase } = state;

      if (phase !== "seasonal_action" || !currentEvent) return state;

      const partial = applyChoice(state, currentEvent, optionIndex, "action");

      if (partial.gameOverReason) {
        return {
          ...state,
          ...partial,
          phase: "game_over",
          currentEvent: null,
        };
      }

      return {
        ...state,
        ...partial,
        phase: "seasonal_resolve",
      };
    }

    // -----------------------------------------------------------------------
    // CONTINUE_TO_RANDOM
    // -----------------------------------------------------------------------
    case "CONTINUE_TO_RANDOM": {
      const { phase, usedRandomIds, turn } = state;
      const { randomEvents = [] } = action.payload ?? {};

      if (phase !== "seasonal_resolve") return state;

      const { event: randomEvent, usedRandomIds: nextUsedRandomIds } = pickRandomEvent(
        usedRandomIds,
        turn,
        randomEvents,
      );

      if (!randomEvent) {
        return {
          ...state,
          phase: "random_resolve",
          currentRandomEvent: null,
          usedRandomIds: nextUsedRandomIds,
        };
      }

      return {
        ...state,
        phase: "random_event",
        currentRandomEvent: randomEvent,
        usedRandomIds: nextUsedRandomIds,
      };
    }

    // -----------------------------------------------------------------------
    // SELECT_RANDOM_RESPONSE
    // -----------------------------------------------------------------------
    case "SELECT_RANDOM_RESPONSE": {
      const { optionIndex } = action.payload ?? {};
      const { currentRandomEvent, phase } = state;

      if (phase !== "random_event" || !currentRandomEvent) return state;

      const partial = applyChoice(state, currentRandomEvent, optionIndex, "event");

      if (partial.gameOverReason) {
        return {
          ...state,
          ...partial,
          phase: "game_over",
          currentRandomEvent: null,
        };
      }

      return {
        ...state,
        ...partial,
        phase: "random_resolve",
        militaryEventEverFired: state.militaryEventEverFired || (currentRandomEvent?.requiresMeter === "military"),
      };
    }

    // -----------------------------------------------------------------------
    // ADVANCE_TURN
    // -----------------------------------------------------------------------
    case "ADVANCE_TURN": {
      const { phase, turn, chronicle } = state;

      if (phase !== "random_resolve" && phase !== "seasonal_resolve") return state;

      // Victory check
      if (turn >= MAX_TURNS) {
        const isPyrrhic = state.population < 3;
        const victoryText = isPyrrhic
          ? "Ten years have passed, but at what cost? Your estate barely clings to life. " +
            "The chronicles will note your survival, though few remain to read them."
          : "Ten years have passed. Your reign has endured through war, famine, and feast. " +
            "The chronicles will remember your name.";
        const { season, year } = turnToSeasonYear(turn);
        return {
          ...state,
          phase: "victory",
          pyrrhicVictory: isPyrrhic,
          chronicle: addChronicle(chronicle, victoryText, season, year, turn, "system"),
          currentEvent: null,
          currentRandomEvent: null,
          scribesNote: null,
        };
      }

      const nextTurn = turn + 1;
      const { season: nextSeason, year: nextYear } = turnToSeasonYear(nextTurn);

      let nextChronicle = chronicle;

      // Generate new market prices for the new season
      const newMarketPrices = generateMarketPrices();

      // Update market: rotate foreign trader, reset haggle, clear event
      const advMkt = state.market ?? {};
      const foreignTrader = FOREIGN_TRADERS[nextSeason];
      const advanceMarket = {
        ...advMkt,
        currentForeignTrader: nextSeason,
        activeHaggle: null,
        activeMarketEvent: null,
        tradesThisSeason: 0,
      };
      if (foreignTrader && advMkt.currentForeignTrader !== nextSeason) {
        nextChronicle = addChronicle(nextChronicle, foreignTrader.arrivalText, nextSeason, nextYear, nextTurn, "event");
      }

      const zeroDeltas = { denarii: 0, food: 0, population: 0, garrison: 0 };

      // Reset seasonal Great Hall limits (decree slots + feast flag)
      // Phase 4: Small trust decay if lord didn't interact with the hall at all
      const prevHallAdvance = state.greatHall ?? {};
      const hallWasActive = prevHallAdvance.hasFeastedThisSeason
        || prevHallAdvance.decreeSlotsUsed > 0
        || (prevHallAdvance.disputesResolved || 0) > 0;
      const trustDecay = hallWasActive ? 0 : -2;
      const advanceTrust = Math.max(0, Math.min(100, (prevHallAdvance.stewardTrust || 50) + trustDecay));

      // Phase 4: Recompute reputation from full ruling history each season
      const advanceRep = computeReputation(prevHallAdvance.rulingHistory || []);

      // Phase 5: Snapshot meter history for trend tracking
      const prevMeterHistory = prevHallAdvance.meterHistory || [];
      const meterSnapshot = {
        turn: state.turn,
        season: state.season,
        year: state.year,
        meters: { ...(prevHallAdvance.meters || { people: 50, treasury: 50, church: 50, military: 50 }) },
      };

      // Phase 5: Recompute compound flags
      const advanceCompoundFlags = computeCompoundFlags(prevHallAdvance.rulingHistory || []);

      // Phase 5: Check for crisis/peak events at season boundary
      const advMeters = prevHallAdvance.meters || { people: 50, treasury: 50, church: 50, military: 50 };
      const advCrisis = { ...(prevHallAdvance.crisisTriggered || {}) };
      const advPeak = { ...(prevHallAdvance.peakTriggered || {}) };
      let seasonHallEvent = null;
      for (const [key, val] of Object.entries(advMeters)) {
        if (val < 20 && !advCrisis[key] && CRISIS_EVENTS[key]) {
          seasonHallEvent = { ...CRISIS_EVENTS[key], meter: key, type: "crisis" };
          advCrisis[key] = true;
        }
        if (val > 80 && !advPeak[key] && PEAK_EVENTS[key]) {
          seasonHallEvent = { ...PEAK_EVENTS[key], meter: key, type: "peak" };
          advPeak[key] = true;
        }
        if (val >= 20) advCrisis[key] = false;
        if (val <= 80) advPeak[key] = false;
      }

      const advanceHall = {
        ...prevHallAdvance,
        decreeSlotsUsed: 0,
        hasFeastedThisSeason: false,
        stewardTrust: advanceTrust,
        reputation: advanceRep.title,
        reputationTrack: advanceRep.track,
        reputationScores: advanceRep.scores,
        meterHistory: [...prevMeterHistory, meterSnapshot],
        compoundFlags: advanceCompoundFlags,
        pendingHallEvent: seasonHallEvent || prevHallAdvance.pendingHallEvent || null,
        crisisTriggered: advCrisis,
        peakTriggered: advPeak,
      };

      // --- Synergy consecutive counters ---
      const prevSyn = state.synergies ?? {};
      const taxIsLow = state.taxRate === "low" || state.taxRate === "medium";
      const newLowTaxTurns = taxIsLow ? (prevSyn.lowTaxTurns ?? 0) + 1 : 0;
      const newFoodSurplusTurns = (state.food ?? 0) > 100
        ? (prevSyn.foodSurplusTurns ?? 0) + 1 : 0;

      const updatedSynergies = {
        ...prevSyn,
        lowTaxTurns: newLowTaxTurns,
        foodSurplusTurns: newFoodSurplusTurns,
      };

      // B-14 FIX: reset per-year spice counter when the year rolls over.
      const prevChapelAdvance = state.chapel ?? {};
      const advanceChapel = nextYear !== state.year
        ? { ...prevChapelAdvance, spicePurchasesThisYear: 0 }
        : prevChapelAdvance;

      // Check for newly activated synergies
      const stateForSynergyCheck = { ...state, synergies: updatedSynergies };
      const newSynergyIds = checkSynergies(stateForSynergyCheck);

      let synergiesAfterCheck = updatedSynergies;
      let synChronicle = nextChronicle;
      let synNotifications = [];

      if (newSynergyIds.length > 0) {
        synergiesAfterCheck = {
          ...updatedSynergies,
          activated: [...(updatedSynergies.activated ?? []), ...newSynergyIds],
        };
        for (const tierId of newSynergyIds) {
          const entry = SYNERGY_TIER_MAP[tierId];
          if (entry?.tier.chronicle) {
            synChronicle = addChronicle(
              synChronicle, entry.tier.chronicle, nextSeason, nextYear, nextTurn, "event",
            );
          }
          synNotifications.push({
            tierId,
            tier: entry?.tier.tier ?? 1,
            title: entry?.tier.title ?? "",
            description: entry?.tier.description ?? "",
            pathName: entry?.path.name ?? "",
            pathIcon: entry?.path.icon ?? "",
            pathColor: entry?.path.color ?? "#b8860b",
            scribesNote: entry?.tier.scribesNote ?? null,
          });
        }
      }

      // Check if a perspective flip should trigger this turn
      const triggeredFlipId = checkFlipTriggers({
        ...state,
        turn: nextTurn,
      });

      if (triggeredFlipId) {
        return {
          ...state,
          phase: "flip_intro",
          turn: nextTurn,
          season: nextSeason,
          year: nextYear,
          chronicle: synChronicle,
          marketPrices: newMarketPrices,
          resourceDeltas: zeroDeltas,
          currentEvent: null,
          currentRandomEvent: null,
          scribesNote: null,
          seasonReport: [],
          synergies: synergiesAfterCheck,
          pendingSynergyNotifications: [],
          deferredSynergyNotifications: synNotifications,
          market: advanceMarket,
          greatHall: advanceHall,
          chapel: advanceChapel,
          // Flip state
          lastFlipTurn: nextTurn,
          currentFlipId: triggeredFlipId,
          currentFlipStats: getInitialFlipStats(triggeredFlipId),
          currentDecisionIndex: 0,
          flipConsequenceFlags: [],
          currentFlipOutcome: null,
        };
      }

      return {
        ...state,
        phase: "management",
        turn: nextTurn,
        season: nextSeason,
        year: nextYear,
        currentEvent: null,
        currentRandomEvent: null,
        scribesNote: null,
        chronicle: synChronicle,
        resourceDeltas: zeroDeltas,
        marketPrices: newMarketPrices,
        activeTab: "estate",
        seasonReport: [],
        synergies: synergiesAfterCheck,
        pendingSynergyNotifications: synNotifications,
        market: advanceMarket,
        greatHall: advanceHall,
        chapel: advanceChapel,
      };
    }

    // -----------------------------------------------------------------------
    // DISMISS_SCRIBES_NOTE
    // -----------------------------------------------------------------------
    case "DISMISS_SCRIBES_NOTE": {
      return { ...state, scribesNote: null };
    }

    case "SET_SCRIBES_NOTE": {
      return { ...state, scribesNote: action.payload.text };
    }

    // -----------------------------------------------------------------------
    // Perspective Flip actions
    // -----------------------------------------------------------------------
    case "DISMISS_FLIP_INTRO": {
      if (state.phase !== "flip_intro") return state;
      const flipForIntro = ALL_FLIPS[state.currentFlipId];
      // BUG-04 guard: if flip data is missing, recover to management
      if (!flipForIntro) {
        return {
          ...state,
          phase: "management",
          currentFlipId: null,
          currentFlipStats: null,
          currentDecisionIndex: 0,
          flipConsequenceFlags: [],
          currentFlipOutcome: null,
          currentCyoaNodeId: null,
          cyoaEndingType: null,
        };
      }
      if (flipForIntro.type === "cyoa") {
        return { ...state, phase: "flip_decision", currentCyoaNodeId: flipForIntro.startNode };
      }
      return { ...state, phase: "flip_decision" };
    }

    case "SELECT_FLIP_OPTION": {
      if (state.phase !== "flip_decision") return state;
      const { optionIndex } = action.payload ?? {};
      const flip = ALL_FLIPS[state.currentFlipId];
      if (!flip) return state;

      // --- CYOA branching flow ---
      if (flip.type === "cyoa") {
        const node = flip.nodes[state.currentCyoaNodeId];
        if (!node || node.isEnding) return state;
        const option = node.options?.[optionIndex];
        if (!option) return state;

        const targetNode = flip.nodes[option.goto];
        if (!targetNode) return state;

        if (targetNode.isEnding) {
          return {
            ...state,
            phase: "flip_summary",
            currentCyoaNodeId: option.goto,
            cyoaEndingType: targetNode.endingType,
            currentFlipOutcome: null,
          };
        }

        return {
          ...state,
          currentCyoaNodeId: option.goto,
          // Stay in flip_decision phase - go directly to next scene
        };
      }

      // --- Existing linear flow ---
      const decision = flip.decisions[state.currentDecisionIndex];
      if (!decision) return state;

      const option = decision.options[optionIndex];
      if (!option) return state;

      const { nextStats, consequenceFlags, outcome, wasSuccess } = resolveFlipOption(
        option,
        state.currentFlipStats,
      );

      return {
        ...state,
        phase: "flip_outcome",
        currentFlipStats: nextStats,
        flipConsequenceFlags: [...state.flipConsequenceFlags, ...consequenceFlags],
        currentFlipOutcome: outcome,
        flipOutcomeWasSuccess: wasSuccess,
      };
    }

    case "CONTINUE_FLIP": {
      if (state.phase !== "flip_outcome") return state;
      const flip = ALL_FLIPS[state.currentFlipId];
      if (!flip) return state;

      const nextIndex = state.currentDecisionIndex + 1;

      if (nextIndex >= flip.decisions.length) {
        return {
          ...state,
          phase: "flip_summary",
          currentFlipOutcome: null,
        };
      }

      return {
        ...state,
        phase: "flip_decision",
        currentDecisionIndex: nextIndex,
        currentFlipOutcome: null,
      };
    }

    case "DISMISS_FLIP_SUMMARY": {
      if (state.phase !== "flip_summary") return state;

      const { currentFlipId, flipConsequenceFlags, turn, chronicle } = state;
      const flip = ALL_FLIPS[currentFlipId];
      // BUG-04 guard: if flip data is missing, recover to management
      if (!flip) {
        return {
          ...state,
          phase: "management",
          currentFlipId: null,
          currentFlipStats: null,
          currentDecisionIndex: 0,
          flipConsequenceFlags: [],
          currentFlipOutcome: null,
          currentCyoaNodeId: null,
          cyoaEndingType: null,
        };
      }

      // Compute consequences: CYOA uses endingType, linear uses consequence flags
      let consequences;
      if (flip.type === "cyoa") {
        consequences = computeCyoaConsequences(currentFlipId, state.cyoaEndingType);
      } else {
        consequences = computeFlipConsequences(currentFlipId, flipConsequenceFlags);
      }
      const resourceEffects = translateEffects(consequences);
      const applied = applyResourceEffects(state, resourceEffects, MAX_GARRISON);

      // Reconcile typed garrison
      const flipGarrisonDelta = applied.garrison - state.garrison;
      let flipMilitary = state.military;
      if (flipGarrisonDelta !== 0 && flipMilitary) {
        const mg = { ...flipMilitary.garrison };
        if (flipGarrisonDelta > 0) {
          mg.levy = Math.min((mg.levy || 0) + flipGarrisonDelta, MAX_GARRISON);
          flipMilitary = { ...flipMilitary, garrison: mg };
        } else {
          flipMilitary = { ...flipMilitary, garrison: removeFromGarrison(mg, Math.abs(flipGarrisonDelta)) };
        }
      }

      // BUG-03: Track bankruptcy after flip consequences
      let flipBankruptcyTurns = state.bankruptcyTurns || 0;
      if (applied.denarii <= 0) {
        flipBankruptcyTurns += 1;
      } else {
        flipBankruptcyTurns = 0;
      }

      const newState = {
        ...state,
        denarii: applied.denarii,
        population: applied.population,
        garrison: applied.garrison,
        inventory: applied.inventory,
        food: applied.food,
        military: flipMilitary,
        bankruptcyTurns: flipBankruptcyTurns,
      };
      const gameOverReason = checkGameOver(newState);

      // Chronicle entry
      const { season: flipSeason, year: flipYear } = turnToSeasonYear(turn);
      const chronicleText = `You experienced life as ${flip.character} and saw your manor through their eyes.`;
      let nextChronicle = addChronicle(chronicle, chronicleText, flipSeason, flipYear, turn, "event");

      // BUG-15: Add cause chain entry for flip consequences
      const flipCauseEntry = {
        turn, season: flipSeason, year: flipYear,
        summary: `Perspective flip: ${flip.character}`,
        effects: resourceEffects,
      };
      const nextCauseChain = [...(state.causeChain || []), flipCauseEntry].slice(-MAX_CAUSE_CHAIN);

      // Mark flip as fired
      const nextPerspectiveFlips = { ...state.perspectiveFlips, [currentFlipId]: true };

      if (gameOverReason) {
        return {
          ...state,
          ...newState,
          phase: "game_over",
          chronicle: nextChronicle,
          causeChain: nextCauseChain,
          gameOverReason,
          perspectiveFlips: nextPerspectiveFlips,
          currentFlipId: null,
          currentFlipStats: null,
          currentDecisionIndex: 0,
          flipConsequenceFlags: [],
          currentFlipOutcome: null,
          currentCyoaNodeId: null,
          cyoaEndingType: null,
        };
      }

      // BUG-01 FIX: Do NOT increment turn — ADVANCE_TURN already did it.
      // The flip happens on the current turn, not a new one.

      // BUG-05 FIX: Victory check uses current turn (already incremented by ADVANCE_TURN)
      if (turn >= MAX_TURNS) {
        const isPyrrhic = (newState.population ?? state.population) < 3;
        const victoryText = isPyrrhic
          ? "Ten years have passed, but at what cost? Your estate barely clings to life. " +
            "The chronicles will note your survival, though few remain to read them."
          : "Ten years have passed. Your reign has endured through war, famine, and feast. " +
            "The chronicles will remember your name.";
        return {
          ...state,
          ...newState,
          phase: "victory",
          pyrrhicVictory: isPyrrhic,
          chronicle: addChronicle(nextChronicle, victoryText, flipSeason, flipYear, turn, "system"),
          causeChain: nextCauseChain,
          perspectiveFlips: nextPerspectiveFlips,
          currentFlipId: null,
          currentFlipStats: null,
          currentDecisionIndex: 0,
          flipConsequenceFlags: [],
          currentFlipOutcome: null,
          currentCyoaNodeId: null,
          cyoaEndingType: null,
          currentEvent: null,
          currentRandomEvent: null,
          scribesNote: null,
        };
      }

      // BUG-02 FIX: Apply seasonal state resets (matching ADVANCE_TURN logic)
      const flipMkt = state.market ?? {};
      const flipForeignTrader = FOREIGN_TRADERS[state.season];
      const flipMarketReset = {
        ...flipMkt,
        currentForeignTrader: state.season,
        activeHaggle: null,
        activeMarketEvent: null,
        tradesThisSeason: 0,
      };
      if (flipForeignTrader && flipMkt.currentForeignTrader !== state.season) {
        nextChronicle = addChronicle(nextChronicle, flipForeignTrader.arrivalText, flipSeason, flipYear, turn, "event");
      }

      const flipPrevHall = state.greatHall ?? {};
      const flipHallWasActive = flipPrevHall.hasFeastedThisSeason
        || flipPrevHall.decreeSlotsUsed > 0
        || (flipPrevHall.disputesResolved || 0) > 0;
      const flipTrustDecay = flipHallWasActive ? 0 : -2;
      const flipAdvanceTrust = Math.max(0, Math.min(100, (flipPrevHall.stewardTrust || 50) + flipTrustDecay));
      const flipAdvanceRep = computeReputation(flipPrevHall.rulingHistory || []);
      const flipPrevMeterHistory = flipPrevHall.meterHistory || [];
      const flipMeterSnapshot = {
        turn: state.turn,
        season: state.season,
        year: state.year,
        meters: { ...(flipPrevHall.meters || { people: 50, treasury: 50, church: 50, military: 50 }) },
      };
      const flipAdvanceCompoundFlags = computeCompoundFlags(flipPrevHall.rulingHistory || []);
      const flipAdvMeters = flipPrevHall.meters || { people: 50, treasury: 50, church: 50, military: 50 };
      const flipAdvCrisis = { ...(flipPrevHall.crisisTriggered || {}) };
      const flipAdvPeak = { ...(flipPrevHall.peakTriggered || {}) };
      let flipSeasonHallEvent = null;
      for (const [key, val] of Object.entries(flipAdvMeters)) {
        if (val < 20 && !flipAdvCrisis[key] && CRISIS_EVENTS[key]) {
          flipSeasonHallEvent = { ...CRISIS_EVENTS[key], meter: key, type: "crisis" };
          flipAdvCrisis[key] = true;
        }
        if (val > 80 && !flipAdvPeak[key] && PEAK_EVENTS[key]) {
          flipSeasonHallEvent = { ...PEAK_EVENTS[key], meter: key, type: "peak" };
          flipAdvPeak[key] = true;
        }
        if (val >= 20) flipAdvCrisis[key] = false;
        if (val <= 80) flipAdvPeak[key] = false;
      }
      const flipAdvanceHall = {
        ...flipPrevHall,
        decreeSlotsUsed: 0,
        hasFeastedThisSeason: false,
        stewardTrust: flipAdvanceTrust,
        reputation: flipAdvanceRep.title,
        reputationTrack: flipAdvanceRep.track,
        reputationScores: flipAdvanceRep.scores,
        meterHistory: [...flipPrevMeterHistory, flipMeterSnapshot],
        compoundFlags: flipAdvanceCompoundFlags,
        pendingHallEvent: flipSeasonHallEvent || flipPrevHall.pendingHallEvent || null,
        crisisTriggered: flipAdvCrisis,
        peakTriggered: flipAdvPeak,
      };

      const flipTavernReset = {
        ...state.tavern,
        gambitRoundsThisSeason: 0,
        ratsPlayedThisSeason: false,
        strangerAppearedThisSeason: false,
      };

      const flipWtReset = {
        ...(state.watchtower ?? {}),
        scannedThisSeason: false,
        lastScanResult: null,
        warnings: {
          criminalRaidBonus: 0,
          scottishRaidBonus: 0,
          raidRequirementReduction: 0,
          merchantPreview: null,
        },
      };

      const flipPrevBs = state.blacksmith ?? {};
      const flipBsReset = {
        ...flipPrevBs,
        salesThisSeason: 0,
        marketPrices: generateForgeMarketPrices(state.season),
      };

      // Synergy consecutive counters
      const flipPrevSyn = state.synergies ?? {};
      const flipTaxIsLow = state.taxRate === "low" || state.taxRate === "medium";
      const flipNewLowTaxTurns = flipTaxIsLow ? (flipPrevSyn.lowTaxTurns ?? 0) + 1 : 0;
      const flipNewFoodSurplusTurns = (applied.food ?? 0) > 100
        ? (flipPrevSyn.foodSurplusTurns ?? 0) + 1 : 0;
      const flipUpdatedSynergies = {
        ...flipPrevSyn,
        lowTaxTurns: flipNewLowTaxTurns,
        foodSurplusTurns: flipNewFoodSurplusTurns,
      };
      const flipStateForSynergyCheck = { ...newState, synergies: flipUpdatedSynergies };
      const flipNewSynergyIds = checkSynergies(flipStateForSynergyCheck);
      let flipSynergiesAfterCheck = flipUpdatedSynergies;
      let flipSynNotifications = [];
      if (flipNewSynergyIds.length > 0) {
        flipSynergiesAfterCheck = {
          ...flipUpdatedSynergies,
          activated: [...(flipUpdatedSynergies.activated ?? []), ...flipNewSynergyIds],
        };
        for (const tierId of flipNewSynergyIds) {
          const entry = SYNERGY_TIER_MAP[tierId];
          if (entry?.tier.chronicle) {
            nextChronicle = addChronicle(nextChronicle, entry.tier.chronicle, flipSeason, flipYear, turn, "event");
          }
          flipSynNotifications.push({
            tierId,
            tier: entry?.tier.tier ?? 1,
            title: entry?.tier.title ?? "",
            description: entry?.tier.description ?? "",
            pathName: entry?.path.name ?? "",
            pathIcon: entry?.path.icon ?? "",
            pathColor: entry?.path.color ?? "#b8860b",
            scribesNote: entry?.tier.scribesNote ?? null,
          });
        }
      }

      const zeroDeltas = { denarii: 0, food: 0, population: 0, garrison: 0 };

      return {
        ...state,
        ...newState,
        phase: "management",
        // BUG-01 FIX: use current turn, not turn + 1
        turn,
        season: flipSeason,
        year: flipYear,
        chronicle: nextChronicle,
        causeChain: nextCauseChain,
        marketPrices: generateMarketPrices(),
        perspectiveFlips: nextPerspectiveFlips,
        activeTab: "estate",
        seasonReport: [],
        resourceDeltas: zeroDeltas,
        currentEvent: null,
        currentRandomEvent: null,
        scribesNote: null,
        currentFlipId: null,
        currentFlipStats: null,
        currentDecisionIndex: 0,
        flipConsequenceFlags: [],
        currentFlipOutcome: null,
        currentCyoaNodeId: null,
        cyoaEndingType: null,
        // BUG-02 FIX: seasonal state resets
        market: flipMarketReset,
        greatHall: flipAdvanceHall,
        tavern: flipTavernReset,
        watchtower: flipWtReset,
        blacksmith: flipBsReset,
        synergies: flipSynergiesAfterCheck,
        pendingSynergyNotifications: [...(state.deferredSynergyNotifications ?? []), ...flipSynNotifications],
        deferredSynergyNotifications: [],
      };
    }

    // -----------------------------------------------------------------------
    // Dismiss synergy notification
    // -----------------------------------------------------------------------
    case "DISMISS_SYNERGY_NOTIFICATION": {
      const queue = state.pendingSynergyNotifications ?? [];
      return {
        ...state,
        pendingSynergyNotifications: queue.slice(1),
      };
    }

    // -----------------------------------------------------------------------
    // TAVERN ACTIONS
    // -----------------------------------------------------------------------

    case "TAVERN_VISIT": {
      if (state.phase !== "management") return state;
      const prevTavern = state.tavern ?? {};
      return {
        ...state,
        tavern: {
          ...prevTavern,
          totalVisits: (prevTavern.totalVisits ?? 0) + 1,
        },
        chronicle: addChronicle(state.chronicle, "You visited the Boar\u2019s Head Tavern.", state.season, state.year, state.turn, "action"),
      };
    }

    case "TAVERN_GAMBIT_RESULT": {
      if (state.phase !== "management") return state;
      const { result, wager } = action.payload ?? {};
      // result: "win" | "lose" | "draw"
      const prevT = state.tavern ?? {};
      const net = result === "win" ? wager : result === "lose" ? -wager : 0;
      const newDenarii = Math.max(0, state.denarii + net);

      const label = result === "win" ? "won" : result === "lose" ? "lost" : "drew at";
      const absNet = Math.abs(net);

      return {
        ...state,
        denarii: newDenarii,
        tavern: {
          ...prevT,
          gambitRoundsThisSeason: (prevT.gambitRoundsThisSeason ?? 0) + 1,
          gambitTotalWins: (prevT.gambitTotalWins ?? 0) + (result === "win" ? 1 : 0),
          gambitTotalLosses: (prevT.gambitTotalLosses ?? 0) + (result === "lose" ? 1 : 0),
          gambitNetEarnings: (prevT.gambitNetEarnings ?? 0) + net,
        },
        chronicle: addChronicle(
          state.chronicle,
          result === "draw"
            ? `You ${label} Knight\u2019s Gambit. No coins changed hands.`
            : `You ${label} ${absNet}d at Knight\u2019s Gambit.`,
          state.season, state.year, state.turn, "action",
        ),
      };
    }

    case "TAVERN_GAMBIT_SET_LAST": {
      const { choice } = action.payload ?? {};
      return {
        ...state,
        tavern: { ...state.tavern, gambitLastChoice: choice },
      };
    }

    case "TAVERN_GAMBIT_SCRIBES_NOTE_SEEN": {
      return {
        ...state,
        tavern: { ...state.tavern, gambitScribesNoteSeen: true },
      };
    }

    case "TAVERN_RATS_RESULT": {
      if (state.phase !== "management") return state;
      const { caught, foodLost, reward } = action.payload ?? {};
      const prevTav = state.tavern ?? {};
      const newFood = Math.max(0, state.food - foodLost);
      const newDen = state.denarii + (reward ?? 0);

      // Apply food loss to inventory (remove from grain first, then livestock, then fish)
      let remainingLoss = foodLost;
      const newInv = { ...state.inventory };
      for (const key of ["grain", "livestock", "fish"]) {
        if (remainingLoss <= 0) break;
        const available = newInv[key] || 0;
        const take = Math.min(available, remainingLoss);
        newInv[key] = available - take;
        remainingLoss -= take;
      }

      return {
        ...state,
        denarii: newDen,
        food: newFood,
        inventory: newInv,
        tavern: {
          ...prevTav,
          ratsPlayedThisSeason: true,
          ratsBestScore: Math.max(prevTav.ratsBestScore ?? 0, caught),
        },
        chronicle: addChronicle(
          state.chronicle,
          `You cleared ${caught} rats from the cellar. ${foodLost > 0 ? `${foodLost} food was lost to vermin.` : "No food was lost!"}${reward > 0 ? ` Earned ${reward}d for your efforts.` : ""}`,
          state.season, state.year, state.turn, "action",
        ),
      };
    }

    case "TAVERN_RATS_SCRIBES_NOTE_SEEN": {
      return {
        ...state,
        tavern: { ...state.tavern, ratsScribesNoteSeen: true },
      };
    }

    case "TAVERN_BARD_RIDDLE_SOLVED": {
      if (state.phase !== "management") return state;
      const prevTvn = state.tavern ?? {};
      return {
        ...state,
        denarii: state.denarii + 10,
        tavern: {
          ...prevTvn,
          bardRiddlesSolved: (prevTvn.bardRiddlesSolved ?? 0) + 1,
        },
        chronicle: addChronicle(state.chronicle, "The bard\u2019s riddle earned you 10d.", state.season, state.year, state.turn, "action"),
      };
    }

    case "TAVERN_WALL_STASH": {
      if (state.phase !== "management") return state;
      const prevTv = state.tavern ?? {};
      if (prevTv.wallStashFound) return state;
      return {
        ...state,
        denarii: state.denarii + 25,
        tavern: { ...prevTv, wallStashFound: true },
        chronicle: addChronicle(state.chronicle, "You found a hidden coin purse in the tavern wall! +25d.", state.season, state.year, state.turn, "action"),
      };
    }

    case "TAVERN_STRANGER_TRADE": {
      if (state.phase !== "management") return state;
      const { cost, foodReward } = action.payload ?? {};
      if (state.denarii < cost) return state;
      const prevTa = state.tavern ?? {};

      const newInvStr = { ...state.inventory };
      newInvStr.grain = (newInvStr.grain || 0) + (foodReward ?? 0);

      return {
        ...state,
        denarii: state.denarii - cost,
        inventory: newInvStr,
        food: getTotalFood(newInvStr),
        tavern: { ...prevTa, strangerAppearedThisSeason: true },
        chronicle: addChronicle(state.chronicle, "A mysterious stranger sold you provisions.", state.season, state.year, state.turn, "action"),
      };
    }

    case "TAVERN_STRANGER_DISMISS": {
      const prevTab = state.tavern ?? {};
      return {
        ...state,
        tavern: { ...prevTab, strangerAppearedThisSeason: true },
        chronicle: addChronicle(state.chronicle, "A mysterious stranger offered you counsel.", state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // MARTA THE MERCHANT
    // -----------------------------------------------------------------------

    case "TAVERN_MARTA_SCRIBES_NOTE_SEEN": {
      return {
        ...state,
        tavern: { ...state.tavern, martaScribesNoteSeen: true },
      };
    }

    case "TAVERN_MARTA_ACCEPT_OFFER": {
      if (state.phase !== "management") return state;
      const { offerId } = action.payload ?? {};
      const prevTm = state.tavern ?? {};
      if ((prevTm.martaOffersUsed ?? []).includes(offerId)) return state;

      const baseTavern = {
        ...prevTm,
        martaOffersUsed: [...(prevTm.martaOffersUsed ?? []), offerId],
      };

      switch (offerId) {
        case "bulk_wool": {
          if ((state.inventory?.wool ?? 0) < 5) return state;
          const newInv = { ...state.inventory, wool: state.inventory.wool - 5 };
          return {
            ...state,
            denarii: state.denarii + 40,
            inventory: newInv,
            food: getTotalFood(newInv),
            tavern: baseTavern,
            chronicle: addChronicle(state.chronicle, "Marta brokered a Flemish wool deal: sold 5 wool for 40d.", state.season, state.year, state.turn, "action"),
          };
        }
        case "spice_investment": {
          if (state.denarii < 75) return state;
          return {
            ...state,
            denarii: state.denarii - 75,
            tavern: { ...baseTavern, martaSpiceInvestment: true },
            chronicle: addChronicle(state.chronicle, "Invested 75d in Marta\u2019s spice shipment. Returns expected next season.", state.season, state.year, state.turn, "action"),
          };
        }
        case "trade_route_tip": {
          if (state.denarii < 30) return state;
          // Find best-priced trade good
          const tradeGoods = ["wool", "cloth", "honey", "herbs", "ale"];
          let bestGood = "cloth";
          let bestPrice = 0;
          for (const good of tradeGoods) {
            const price = state.marketPrices?.sell?.[good] ?? 0;
            if (price > bestPrice) {
              bestPrice = price;
              bestGood = good;
            }
          }
          const tipText = `Marta whispers: "${bestGood.charAt(0).toUpperCase() + bestGood.slice(1)} fetches ${bestPrice}d at market right now. Best rate I\u2019ve seen."`;
          return {
            ...state,
            denarii: state.denarii - 30,
            tavern: baseTavern,
            chronicle: addChronicle(state.chronicle, tipText, state.season, state.year, state.turn, "action"),
          };
        }
        case "storage_deal": {
          if (state.denarii < 50) return state;
          if (prevTm.martaStoragePurchased) return state;
          return {
            ...state,
            denarii: state.denarii - 50,
            inventoryCapacity: (state.inventoryCapacity ?? 300) + 20,
            tavern: { ...baseTavern, martaStoragePurchased: true },
            chronicle: addChronicle(state.chronicle, "Marta arranged storage expansion. Inventory capacity +20.", state.season, state.year, state.turn, "action"),
          };
        }
        default:
          return state;
      }
    }

    case "TAVERN_MARTA_DECLINE_OFFER": {
      if (state.phase !== "management") return state;
      const { offerId: declinedMartaId } = action.payload ?? {};
      const prevTmd = state.tavern ?? {};
      if ((prevTmd.martaOffersUsed ?? []).includes(declinedMartaId)) return state;
      return {
        ...state,
        tavern: {
          ...prevTmd,
          martaOffersUsed: [...(prevTmd.martaOffersUsed ?? []), declinedMartaId],
        },
        chronicle: addChronicle(state.chronicle, "You declined Marta\u2019s trade offer.", state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // OLD ALDRIC THE VETERAN
    // -----------------------------------------------------------------------

    case "TAVERN_ALDRIC_SCRIBES_NOTE_SEEN": {
      return {
        ...state,
        tavern: { ...state.tavern, aldricScribesNoteSeen: true },
      };
    }

    case "TAVERN_ALDRIC_ACCEPT_OFFER": {
      if (state.phase !== "management") return state;
      const { offerId: aldricOfferId } = action.payload ?? {};
      const prevTa2 = state.tavern ?? {};
      if ((prevTa2.aldricOffersUsed ?? []).includes(aldricOfferId)) return state;

      const baseAldricTavern = {
        ...prevTa2,
        aldricOffersUsed: [...(prevTa2.aldricOffersUsed ?? []), aldricOfferId],
      };

      switch (aldricOfferId) {
        case "basic_drill": {
          if (state.denarii < 30 || (state.garrison ?? 0) === 0) return state;
          return {
            ...state,
            denarii: state.denarii - 30,
            tavern: { ...baseAldricTavern, aldricDrillActive: 3 },
            chronicle: addChronicle(state.chronicle, "Old Aldric drilled the garrison. Defense readiness improved for 3 seasons.", state.season, state.year, state.turn, "action"),
          };
        }
        case "wall_inspection": {
          if (state.denarii < 20) return state;
          const garrison = state.garrison ?? 0;
          const castleLvl = state.castleLevel ?? 1;
          const defCount = (state.defenseUpgrades ?? []).length;
          let report;
          if (castleLvl === 1 && garrison < 5) {
            report = "Aldric\u2019s report: Your defenses are dire. A wooden palisade and fewer than 5 men? Upgrade your castle and recruit immediately.";
          } else if (castleLvl < 3 && defCount === 0) {
            report = "Aldric\u2019s report: Stone walls would serve you better, and you\u2019ve no defensive installations. Consider a moat or arrow slits.";
          } else if (garrison < 8) {
            report = "Aldric\u2019s report: Your walls are adequate, but you need more men. A castle without soldiers is just an expensive barn.";
          } else {
            report = "Aldric\u2019s report: Your defenses are sound. Maintain garrison strength and upgrade when resources allow.";
          }
          return {
            ...state,
            denarii: state.denarii - 20,
            tavern: baseAldricTavern,
            chronicle: addChronicle(state.chronicle, report, state.season, state.year, state.turn, "action"),
          };
        }
        case "recruit_referral": {
          if (state.denarii < 40) return state;
          const refMil = state.military ?? getInitialMilitaryState(state.garrison ?? 0);
          const refGarrison = { ...refMil.garrison, menAtArms: (refMil.garrison.menAtArms || 0) + 1 };
          return {
            ...state,
            denarii: state.denarii - 40,
            garrison: getTotalGarrison(refGarrison),
            military: { ...refMil, garrison: refGarrison },
            tavern: baseAldricTavern,
            chronicle: addChronicle(state.chronicle, "Aldric recruited a seasoned man-at-arms for the garrison.", state.season, state.year, state.turn, "action"),
          };
        }
        case "war_story_lesson": {
          if ((state.garrison ?? 0) === 0) return state;
          return {
            ...state,
            population: state.population + 2,
            tavern: baseAldricTavern,
            chronicle: addChronicle(state.chronicle, "Aldric told war stories to the garrison. Morale spread through the village. Population +2.", state.season, state.year, state.turn, "action"),
          };
        }
        default:
          return state;
      }
    }

    case "TAVERN_ALDRIC_DECLINE_OFFER": {
      if (state.phase !== "management") return state;
      const { offerId: declinedAldricId } = action.payload ?? {};
      const prevTad = state.tavern ?? {};
      if ((prevTad.aldricOffersUsed ?? []).includes(declinedAldricId)) return state;
      return {
        ...state,
        tavern: {
          ...prevTad,
          aldricOffersUsed: [...(prevTad.aldricOffersUsed ?? []), declinedAldricId],
        },
        chronicle: addChronicle(state.chronicle, "You declined Aldric\u2019s offer.", state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // CHAPEL ACTIONS
    // -----------------------------------------------------------------------

    case "CHAPEL_SET_VIEW": {
      const { view } = action.payload ?? {};
      const prevChapel = state.chapel ?? {};
      const updates = { view };

      // Randomize NPC greeting on first visit
      if (view === "anselm" && !prevChapel.anselmGreeting) {
        updates.anselmGreeting = ANSELM_GREETINGS[Math.floor(Math.random() * ANSELM_GREETINGS.length)];
      }
      if (view === "caedmon" && !prevChapel.caedmonGreeting) {
        updates.caedmonGreeting = CAEDMON_GREETINGS[Math.floor(Math.random() * CAEDMON_GREETINGS.length)];
      }
      // Clear tithe response and dilemma result when navigating away
      if (view === "nave") {
        updates.titheResponse = null;
        updates.dilemmaResult = null;
        updates.currentDilemma = null;
      }

      return { ...state, chapel: { ...prevChapel, ...updates } };
    }

    case "CHAPEL_PAY_TITHE": {
      if (state.phase !== "management") return state;
      const { amount } = action.payload ?? {};
      if (!amount || amount <= 0 || state.denarii < amount) return state;

      const prevChapel = state.chapel ?? {};
      const pct = amount / state.denarii;
      const category = pct >= 0.10 ? "generous" : pct >= 0.03 ? "stingy" : "none";
      const responses = TITHE_RESPONSES[category];
      const response = responses[Math.floor(Math.random() * responses.length)];
      const effects = TITHE_EFFECTS[category];

      const newFaith = Math.min(100, Math.max(0, (prevChapel.faith ?? 50) + (effects.faith ?? 0)));
      const newPiety = Math.min(100, Math.max(0, (prevChapel.piety ?? 30) + (effects.piety ?? 0)));

      const logEntry = { text: `Tithed ${amount}d to Father Anselm (${category}).`, turn: state.turn, season: state.season };

      return {
        ...state,
        denarii: state.denarii - amount,
        churchDonation: (state.churchDonation || 0) + amount,
        chapel: {
          ...prevChapel,
          faith: newFaith,
          piety: newPiety,
          titheResponse: response,
          gameLog: [...(prevChapel.gameLog ?? []), logEntry],
        },
        chronicle: addChronicle(state.chronicle, `Tithed ${amount}d to the Chapel. Faith ${effects.faith >= 0 ? "+" : ""}${effects.faith}, Piety ${effects.piety >= 0 ? "+" : ""}${effects.piety}.`, state.season, state.year, state.turn, "action"),
      };
    }

    case "CHAPEL_BUY_ITEM": {
      if (state.phase !== "management") return state;
      const { itemId } = action.payload ?? {};
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      if (!item) return state;

      const prevChapel = state.chapel ?? {};
      const owned = prevChapel.inventory ?? [];
      if (owned.includes(itemId)) return state;
      if (state.denarii < item.cost) return state;

      const effects = item.effects ?? {};
      const newFaith = Math.min(100, Math.max(0, (prevChapel.faith ?? 50) + (effects.faith ?? 0)));
      const newPiety = Math.min(100, Math.max(0, (prevChapel.piety ?? 30) + (effects.piety ?? 0)));
      const newHappiness = Math.min(100, Math.max(0, (prevChapel.happiness ?? 60) + (effects.happiness ?? 0)));

      // Apply food effect to main inventory
      let newInventory = state.inventory;
      let newFood = state.food;
      if (effects.food) {
        const foodGain = effects.food;
        newInventory = { ...state.inventory, grain: (state.inventory.grain || 0) + foodGain };
        newFood = getTotalFood(newInventory);
      }

      const logEntry = { text: `Purchased ${item.name} for ${item.cost}d from Brother Caedmon.`, turn: state.turn, season: state.season };

      return {
        ...state,
        denarii: state.denarii - item.cost,
        inventory: newInventory,
        food: newFood,
        chapel: {
          ...prevChapel,
          inventory: [...owned, itemId],
          faith: newFaith,
          piety: newPiety,
          happiness: newHappiness,
          gameLog: [...(prevChapel.gameLog ?? []), logEntry],
        },
        chronicle: addChronicle(state.chronicle, `Purchased ${item.name} from Brother Caedmon for ${item.cost}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    case "CHAPEL_START_DILEMMA": {
      if (state.phase !== "management") return state;
      const prevChapel = state.chapel ?? {};
      const completed = prevChapel.dilemmasCompleted ?? [];
      const available = MORAL_DILEMMAS.filter((d) => !completed.includes(d.id));
      if (available.length === 0) return state;

      const dilemma = available[Math.floor(Math.random() * available.length)];

      return {
        ...state,
        chapel: {
          ...prevChapel,
          view: "dilemma",
          currentDilemma: dilemma,
          dilemmaResult: null,
        },
      };
    }

    case "CHAPEL_RESOLVE_DILEMMA": {
      if (state.phase !== "management") return state;
      const { choiceIndex } = action.payload ?? {};
      const prevChapel = state.chapel ?? {};
      const dilemma = prevChapel.currentDilemma;
      if (!dilemma || choiceIndex == null) return state;

      const choice = dilemma.choices[choiceIndex];
      if (!choice) return state;

      const effects = choice.effects ?? {};

      // Apply resource effects
      let newDenarii = state.denarii + (effects.denarii ?? 0);
      newDenarii = Math.max(0, newDenarii);

      const newFaith = Math.min(100, Math.max(0, (prevChapel.faith ?? 50) + (effects.faith ?? 0)));
      const newPiety = Math.min(100, Math.max(0, (prevChapel.piety ?? 30) + (effects.piety ?? 0)));
      const newHappiness = Math.min(100, Math.max(0, (prevChapel.happiness ?? 60) + (effects.happiness ?? 0)));

      const logEntry = {
        text: `Moral dilemma "${dilemma.title}" — chose: ${choice.label}`,
        turn: state.turn,
        season: state.season,
      };

      // Build chronicle effect summary
      const effectParts = [];
      if (effects.denarii) effectParts.push(`${effects.denarii > 0 ? "+" : ""}${effects.denarii}d`);
      if (effects.faith) effectParts.push(`Faith ${effects.faith > 0 ? "+" : ""}${effects.faith}`);
      if (effects.piety) effectParts.push(`Piety ${effects.piety > 0 ? "+" : ""}${effects.piety}`);
      if (effects.happiness) effectParts.push(`Happiness ${effects.happiness > 0 ? "+" : ""}${effects.happiness}`);
      const effectStr = effectParts.length ? ` (${effectParts.join(", ")})` : "";

      return {
        ...state,
        denarii: newDenarii,
        chapel: {
          ...prevChapel,
          faith: newFaith,
          piety: newPiety,
          happiness: newHappiness,
          dilemmaResult: { text: choice.result, effects },
          dilemmasCompleted: [...(prevChapel.dilemmasCompleted ?? []), dilemma.id],
          gameLog: [...(prevChapel.gameLog ?? []), logEntry],
        },
        chronicle: addChronicle(state.chronicle, `Chapel dilemma: "${dilemma.title}" — ${choice.label}.${effectStr}`, state.season, state.year, state.turn, "event"),
      };
    }

    case "CHAPEL_MS_START": {
      const prevChapel = state.chapel ?? {};
      const patternLength = 3;
      const pattern = Array.from({ length: patternLength }, () =>
        Math.floor(Math.random() * MANUSCRIPT_SYMBOLS.length)
      );
      return {
        ...state,
        chapel: {
          ...prevChapel,
          view: "manuscript",
          msPhase: "showing",
          msPattern: pattern,
          msPlayerInput: [],
          msRound: 1,
          msMaxRound: 4,
          msActiveSymbol: null,
          msFact: null,
          msReward: 0,
        },
      };
    }

    case "CHAPEL_MS_FLASH": {
      const { index } = action.payload ?? {};
      return {
        ...state,
        chapel: { ...(state.chapel ?? {}), msActiveSymbol: index },
      };
    }

    case "CHAPEL_MS_CLEAR_FLASH": {
      return {
        ...state,
        chapel: { ...(state.chapel ?? {}), msActiveSymbol: null },
      };
    }

    case "CHAPEL_MS_DONE_SHOWING": {
      return {
        ...state,
        chapel: { ...(state.chapel ?? {}), msPhase: "input" },
      };
    }

    case "CHAPEL_MS_INPUT": {
      const { index } = action.payload ?? {};
      const prevChapel = state.chapel ?? {};
      if (prevChapel.msPhase !== "input") return state;

      const newInput = [...(prevChapel.msPlayerInput ?? []), index];
      const expected = prevChapel.msPattern ?? [];
      const pos = newInput.length - 1;

      // Wrong answer
      if (newInput[pos] !== expected[pos]) {
        const fact = MANUSCRIPT_FACTS[Math.floor(Math.random() * MANUSCRIPT_FACTS.length)];
        return {
          ...state,
          chapel: { ...prevChapel, msPhase: "fail", msPlayerInput: newInput, msFact: fact },
        };
      }

      // Correct so far, sequence not complete
      if (newInput.length < expected.length) {
        return {
          ...state,
          chapel: { ...prevChapel, msPlayerInput: newInput },
        };
      }

      // Sequence complete — check if more rounds
      const round = prevChapel.msRound ?? 1;
      const maxRound = prevChapel.msMaxRound ?? 4;

      if (round < maxRound) {
        // Next round — longer pattern
        const nextLength = 3 + round; // round 1=3, round 2=4, round 3=5, round 4=6
        const nextPattern = Array.from({ length: nextLength }, () =>
          Math.floor(Math.random() * MANUSCRIPT_SYMBOLS.length)
        );
        return {
          ...state,
          chapel: {
            ...prevChapel,
            msRound: round + 1,
            msPattern: nextPattern,
            msPlayerInput: [],
            msPhase: "showing",
            msActiveSymbol: null,
          },
        };
      }

      // All rounds complete — success!
      const hasQuill = (prevChapel.inventory ?? []).includes("quill_ink");
      const reward = hasQuill ? 20 : 15;
      const fact = MANUSCRIPT_FACTS[Math.floor(Math.random() * MANUSCRIPT_FACTS.length)];
      const newFaith = Math.min(100, (prevChapel.faith ?? 50) + 5);
      const newPiety = Math.min(100, (prevChapel.piety ?? 30) + 3);

      const logEntry = { text: `Completed manuscript copying: +${reward}d, +5 Faith, +3 Piety.`, turn: state.turn, season: state.season };

      return {
        ...state,
        denarii: state.denarii + reward,
        chapel: {
          ...prevChapel,
          msPhase: "success",
          msPlayerInput: newInput,
          msReward: reward,
          msFact: fact,
          faith: newFaith,
          piety: newPiety,
          gameLog: [...(prevChapel.gameLog ?? []), logEntry],
        },
        chronicle: addChronicle(state.chronicle, `Completed manuscript in the Scriptorium. Earned ${reward}d.`, state.season, state.year, state.turn, "action"),
      };
    }

    // -----------------------------------------------------------------------
    // GREAT HALL — Dispute Resolution
    // -----------------------------------------------------------------------

    case "HALL_RULE_DISPUTE": {
      const { disputeId, rulingId, consequences, decree } = action.payload;
      const prevHall = state.greatHall;
      const prevMeters = prevHall.meters;

      const clamp = (v) => Math.max(0, Math.min(100, v));
      const newMeters = {
        people: clamp(prevMeters.people + (consequences.people || 0)),
        treasury: clamp(prevMeters.treasury + (consequences.treasury || 0)),
        church: clamp(prevMeters.church + (consequences.church || 0)),
        military: clamp(prevMeters.military + (consequences.military || 0)),
      };

      const resolved = prevHall.disputesResolved + 1;

      const rulingEntry = {
        disputeId,
        rulingId,
        consequences,
        decree,
        turn: state.turn,
        season: state.season,
        year: state.year,
      };

      // Phase 4: Compute reputation from cumulative ruling patterns
      const newHistory = [...prevHall.rulingHistory, rulingEntry];
      const repResult = computeReputation(newHistory);

      // Phase 4: Trust shifts — small trust bump for each ruling (engagement reward)
      const trustDelta = 2;
      const newTrust = Math.max(0, Math.min(100, (prevHall.stewardTrust || 50) + trustDelta));

      // Phase 5: Compound flags and hall log
      const newCompoundFlags = computeCompoundFlags(newHistory);
      const disputeLogEntry = {
        type: "dispute",
        text: `Ruled on dispute: "${decree}"`,
        turn: state.turn, season: state.season, year: state.year,
        consequences,
      };

      // Phase 5: Check for crisis/peak triggers after meter change
      let pendingEvent = null;
      const prevCrisis = prevHall.crisisTriggered || {};
      const prevPeak = prevHall.peakTriggered || {};
      const newCrisis = { ...prevCrisis };
      const newPeak = { ...prevPeak };
      for (const [key, val] of Object.entries(newMeters)) {
        if (val < 20 && !prevCrisis[key] && CRISIS_EVENTS[key]) {
          pendingEvent = { ...CRISIS_EVENTS[key], meter: key, type: "crisis" };
          newCrisis[key] = true;
        }
        if (val > 80 && !prevPeak[key] && PEAK_EVENTS[key]) {
          pendingEvent = { ...PEAK_EVENTS[key], meter: key, type: "peak" };
          newPeak[key] = true;
        }
        // Reset trigger if meter recovers
        if (val >= 20) newCrisis[key] = false;
        if (val <= 80) newPeak[key] = false;
      }

      const conParts = Object.entries(consequences)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v > 0 ? "+" : ""}${v}`);
      const conText = conParts.length > 0 ? ` (${conParts.join(", ")})` : "";

      return {
        ...state,
        greatHall: {
          ...prevHall,
          meters: newMeters,
          reputation: repResult.title,
          reputationTrack: repResult.track,
          reputationScores: repResult.scores,
          disputesResolved: resolved,
          stewardTrust: newTrust,
          rulingHistory: newHistory,
          compoundFlags: newCompoundFlags,
          hallLog: [...(prevHall.hallLog || []), disputeLogEntry],
          pendingHallEvent: pendingEvent,
          crisisTriggered: newCrisis,
          peakTriggered: newPeak,
        },
        chronicle: addChronicle(
          state.chronicle,
          `Ruled on a dispute in the Great Hall: "${decree}"${conText}`,
          state.season,
          state.year,
          state.turn,
          "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // GREAT HALL — Audience Response
    // -----------------------------------------------------------------------

    case "HALL_AUDIENCE_RESPOND": {
      const { encounterId, consequences } = action.payload;
      const prevHall = state.greatHall;
      const prevMeters = prevHall.meters;

      const clamp = (v) => Math.max(0, Math.min(100, v));
      const newMeters = {
        people: clamp(prevMeters.people + (consequences.people || 0)),
        treasury: clamp(prevMeters.treasury + (consequences.treasury || 0)),
        church: clamp(prevMeters.church + (consequences.church || 0)),
        military: clamp(prevMeters.military + (consequences.military || 0)),
      };

      const conParts = Object.entries(consequences)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v > 0 ? "+" : ""}${v}`);
      const conText = conParts.length > 0 ? ` (${conParts.join(", ")})` : "";

      // Trust +1 for engaging with the people
      const audTrust = Math.min(100, (prevHall.stewardTrust || 50) + 1);

      // Phase 5: Hall log
      const audLogEntry = {
        type: "audience",
        text: `Held audience with petitioner`,
        turn: state.turn, season: state.season, year: state.year,
        consequences,
      };

      return {
        ...state,
        greatHall: {
          ...prevHall,
          meters: newMeters,
          audienceResolved: [...prevHall.audienceResolved, encounterId],
          stewardTrust: audTrust,
          hallLog: [...(prevHall.hallLog || []), audLogEntry],
        },
        chronicle: addChronicle(
          state.chronicle,
          `Held audience in the Great Hall${conText}`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // GREAT HALL — Issue Decree
    // -----------------------------------------------------------------------

    case "HALL_ISSUE_DECREE": {
      const { decreeId, effects } = action.payload;
      const prevHall = state.greatHall;
      const prevMeters = prevHall.meters;

      const clamp = (v) => Math.max(0, Math.min(100, v));
      const newMeters = {
        people: clamp(prevMeters.people + (effects.people || 0)),
        treasury: clamp(prevMeters.treasury + (effects.treasury || 0)),
        church: clamp(prevMeters.church + (effects.church || 0)),
        military: clamp(prevMeters.military + (effects.military || 0)),
      };

      const conParts = Object.entries(effects)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v > 0 ? "+" : ""}${v}`);
      const conText = conParts.length > 0 ? ` (${conParts.join(", ")})` : "";

      // Phase 5: Hall log
      const decreeLogEntry = {
        type: "decree",
        text: `Issued decree: ${decreeId}`,
        turn: state.turn, season: state.season, year: state.year,
        consequences: effects,
      };

      return {
        ...state,
        greatHall: {
          ...prevHall,
          meters: newMeters,
          activeDecrees: [...prevHall.activeDecrees, decreeId],
          decreeSlotsUsed: prevHall.decreeSlotsUsed + 1,
          hallLog: [...(prevHall.hallLog || []), decreeLogEntry],
        },
        chronicle: addChronicle(
          state.chronicle,
          `Issued a decree from the Great Hall${conText}`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // GREAT HALL — Revoke Decree
    // -----------------------------------------------------------------------

    case "HALL_REVOKE_DECREE": {
      const { decreeId } = action.payload;
      const prevHall = state.greatHall;

      // Phase 5: Hall log
      const revokeLogEntry = {
        type: "decree_revoke",
        text: `Revoked decree: ${decreeId}`,
        turn: state.turn, season: state.season, year: state.year,
      };

      return {
        ...state,
        greatHall: {
          ...prevHall,
          activeDecrees: prevHall.activeDecrees.filter((id) => id !== decreeId),
          hallLog: [...(prevHall.hallLog || []), revokeLogEntry],
        },
        chronicle: addChronicle(
          state.chronicle,
          `Revoked a decree in the Great Hall.`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // GREAT HALL — Council Vote
    // -----------------------------------------------------------------------

    case "HALL_COUNCIL_VOTE": {
      const { topicId, consequences } = action.payload;
      const prevHall = state.greatHall;
      const prevMeters = prevHall.meters;

      const clamp = (v) => Math.max(0, Math.min(100, v));
      const newMeters = {
        people: clamp(prevMeters.people + (consequences.people || 0)),
        treasury: clamp(prevMeters.treasury + (consequences.treasury || 0)),
        church: clamp(prevMeters.church + (consequences.church || 0)),
        military: clamp(prevMeters.military + (consequences.military || 0)),
      };

      const conParts = Object.entries(consequences)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v > 0 ? "+" : ""}${v}`);
      const conText = conParts.length > 0 ? ` (${conParts.join(", ")})` : "";

      // Trust +1 for convening the council
      const cncTrust = Math.min(100, (prevHall.stewardTrust || 50) + 1);

      // Phase 5: Hall log
      const councilLogEntry = {
        type: "council",
        text: `Council voted on: ${topicId}`,
        turn: state.turn, season: state.season, year: state.year,
        consequences,
      };

      return {
        ...state,
        greatHall: {
          ...prevHall,
          meters: newMeters,
          councilResolved: [...prevHall.councilResolved, topicId],
          stewardTrust: cncTrust,
          hallLog: [...(prevHall.hallLog || []), councilLogEntry],
        },
        chronicle: addChronicle(
          state.chronicle,
          `The council voted on a matter in the Great Hall${conText}`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // GREAT HALL — Feast Complete
    // -----------------------------------------------------------------------

    case "HALL_FEAST_COMPLETE": {
      const { totalEffects } = action.payload;
      const prevHall = state.greatHall;
      const prevMeters = prevHall.meters;

      const clamp = (v) => Math.max(0, Math.min(100, v));
      const newMeters = {
        people: clamp(prevMeters.people + (totalEffects.people || 0)),
        treasury: clamp(prevMeters.treasury + (totalEffects.treasury || 0)),
        church: clamp(prevMeters.church + (totalEffects.church || 0)),
        military: clamp(prevMeters.military + (totalEffects.military || 0)),
      };

      const conParts = Object.entries(totalEffects)
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v > 0 ? "+" : ""}${v}`);
      const conText = conParts.length > 0 ? ` (${conParts.join(", ")})` : "";

      // Trust +3 for hosting a feast (shows generosity)
      const fstTrust = Math.min(100, (prevHall.stewardTrust || 50) + 3);

      // Phase 5: Hall log
      const feastLogEntry = {
        type: "feast",
        text: "Hosted a feast in the Great Hall",
        turn: state.turn, season: state.season, year: state.year,
        consequences: totalEffects,
      };

      return {
        ...state,
        greatHall: {
          ...prevHall,
          meters: newMeters,
          hasFeastedThisSeason: true,
          feastHistory: [...prevHall.feastHistory, {
            season: state.season,
            year: state.year,
            totalEffects,
          }],
          stewardTrust: fstTrust,
          hallLog: [...(prevHall.hallLog || []), feastLogEntry],
        },
        chronicle: addChronicle(
          state.chronicle,
          `Hosted a feast in the Great Hall${conText}`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // GREAT HALL — Dismiss Event (Phase 5)
    // -----------------------------------------------------------------------

    case "HALL_DISMISS_EVENT": {
      const prevHall = state.greatHall;
      const evt = prevHall.pendingHallEvent;
      if (!evt) return state;

      // Apply crisis/peak effects
      const clamp = (v) => Math.max(0, Math.min(100, v));
      const pMeters = prevHall.meters;
      const eff = evt.effects || {};
      const eMeters = {
        people: clamp(pMeters.people + (eff.people || 0)),
        treasury: clamp(pMeters.treasury + (eff.treasury || 0)),
        church: clamp(pMeters.church + (eff.church || 0)),
        military: clamp(pMeters.military + (eff.military || 0)),
      };

      // Log the event
      const evtLogEntry = {
        type: evt.type,
        text: evt.chronicle || evt.text,
        turn: state.turn, season: state.season, year: state.year,
        consequences: eff,
      };

      return {
        ...state,
        greatHall: {
          ...prevHall,
          meters: eMeters,
          pendingHallEvent: null,
          hallLog: [...(prevHall.hallLog || []), evtLogEntry],
        },
        chronicle: addChronicle(
          state.chronicle,
          evt.chronicle || "A notable event occurred in the Great Hall.",
          state.season, state.year, state.turn, "event"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // WATCHTOWER actions
    // -----------------------------------------------------------------------
    case "WATCHTOWER_SCAN_COMPLETE": {
      const { anomaliesTotal, anomaliesFound, rating, denariiBonus, warnings, foundList } = action.payload ?? {};
      const prevWt = state.watchtower ?? {};
      const { season: wtSeason, year: wtYear, turn: wtTurn } = state;

      const isPerfect = anomaliesFound === anomaliesTotal;

      const foundNames = (foundList ?? []).map((a) => a.name).join(", ");
      const logText = anomaliesFound > 0
        ? `Scanned horizon \u2014 spotted ${foundNames}. Rating: ${rating}.`
        : `Scanned horizon \u2014 clear. No threats spotted. Rating: ${rating}.`;

      const newLog = [
        ...(prevWt.signalLog ?? []),
        { turn: wtTurn, season: wtSeason, year: wtYear, text: logText, type: "scan" },
      ];

      let wtChronicle = addChronicle(
        state.chronicle,
        `You climbed the Watchtower and scanned the horizon. Rating: ${rating}. Spotted ${anomaliesFound} of ${anomaliesTotal} anomalies.`,
        wtSeason, wtYear, wtTurn, "action"
      );

      if (warnings) {
        if (warnings.criminalRaidBonus > 0) {
          wtChronicle = addChronicle(wtChronicle, "Advance warning: campfire smoke spotted \u2014 bandit threat detected.", wtSeason, wtYear, wtTurn, "system");
        }
        if (warnings.scottishRaidBonus > 0) {
          wtChronicle = addChronicle(wtChronicle, "Advance warning: dust cloud spotted \u2014 mounted riders approaching.", wtSeason, wtYear, wtTurn, "system");
        }
        if (warnings.raidRequirementReduction > 0) {
          wtChronicle = addChronicle(wtChronicle, "Advance warning: signal fire spotted \u2014 allied lord warns of military threat.", wtSeason, wtYear, wtTurn, "system");
        }
        if (warnings.merchantPreview) {
          wtChronicle = addChronicle(wtChronicle, `Advance warning: merchant wagon spotted \u2014 ${warnings.merchantPreview.name} approaches with ${warnings.merchantPreview.specialty}.`, wtSeason, wtYear, wtTurn, "system");
        }
      }

      return {
        ...state,
        denarii: state.denarii + (denariiBonus || 0),
        chronicle: wtChronicle,
        resourceDeltas: denariiBonus > 0
          ? { ...state.resourceDeltas, denarii: (state.resourceDeltas?.denarii ?? 0) + denariiBonus }
          : state.resourceDeltas,
        watchtower: {
          ...prevWt,
          scannedThisSeason: true,
          lastScanResult: { anomaliesTotal, anomaliesFound, rating },
          warnings: warnings ?? prevWt.warnings,
          totalScans: (prevWt.totalScans ?? 0) + 1,
          totalAnomaliesSpotted: (prevWt.totalAnomaliesSpotted ?? 0) + (anomaliesFound ?? 0),
          totalAnomaliesMissed: (prevWt.totalAnomaliesMissed ?? 0) + ((anomaliesTotal ?? 0) - (anomaliesFound ?? 0)),
          perfectScans: isPerfect ? (prevWt.perfectScans ?? 0) + 1 : (prevWt.perfectScans ?? 0),
          signalLog: newLog,
        },
      };
    }

    case "WATCHTOWER_RODERIC_SCRIBES_NOTE_SEEN": {
      return {
        ...state,
        watchtower: { ...(state.watchtower ?? {}), rodericScribesNoteSeen: true },
      };
    }

    case "WATCHTOWER_SCAN_SCRIBES_NOTE_SEEN": {
      return {
        ...state,
        watchtower: { ...(state.watchtower ?? {}), scanScribesNoteSeen: true },
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_FORGE_COMPLETE — Record a forged item, deduct resources
    // -----------------------------------------------------------------------
    case "BLACKSMITH_FORGE_COMPLETE": {
      const {
        itemId, itemName, itemCost, category, grade, qualityScore,
        goldCost, statMultiplier, tradeMultiplier, baseMilitary,
        baseTradeValue, durability,
      } = action.payload ?? {};
      if (!itemName) return state;

      const bs = state.blacksmith ?? {};
      const newDenarii = Math.max(0, state.denarii - (goldCost || 0));
      const isMasterwork = grade === "Masterwork";

      // Deduct forge material costs from main inventory
      const forgeInv = { ...state.inventory };
      if (itemCost) {
        for (const [key, amt] of Object.entries(itemCost)) {
          if (key !== "gold" && forgeInv[key] != null) {
            forgeInv[key] = Math.max(0, forgeInv[key] - amt);
          }
        }
      }

      // Create inventory item
      const uid = bs.nextItemUid || 1;
      const forgedItem = {
        uid,
        itemId: itemId || "unknown",
        name: itemName,
        category: category || "weapon",
        grade: grade || "Standard",
        qualityScore: qualityScore || 50,
        militaryBonus: Math.round((baseMilitary || 0) * (statMultiplier || 1)),
        tradeValue: Math.round((baseTradeValue || 0) * (tradeMultiplier || 1)),
        durability: durability || "Good",
        cost: itemCost || {},
        forgedTurn: state.turn,
      };

      return {
        ...state,
        denarii: newDenarii,
        inventory: forgeInv,
        blacksmith: {
          ...bs,
          inventory: [...(bs.inventory || []), forgedItem],
          nextItemUid: uid + 1,
          totalItemsForged: (bs.totalItemsForged || 0) + 1,
          masterworksCreated: (bs.masterworksCreated || 0) + (isMasterwork ? 1 : 0),
          godricRespect: Math.max(0, Math.min(100,
            (bs.godricRespect || 50)
            + (grade === "Masterwork" ? 3 : 0)
            + (grade === "Fine" ? 1 : 0)
            + (grade === "Rough" ? -2 : 0)
            + (grade === "Scrap" ? -5 : 0)
          )),
          totalGoldInvested: (bs.totalGoldInvested || 0) + (goldCost || 0),
          productionLog: [...(bs.productionLog || []), {
            itemId: itemId || "unknown",
            name: itemName,
            category: category || "weapon",
            grade: grade || "Standard",
            qualityScore: qualityScore || 50,
            tradeValue: forgedItem.tradeValue,
            militaryBonus: forgedItem.militaryBonus,
            turn: state.turn,
            season: state.season,
            goldCost: goldCost || 0,
          }],
        },
        chronicle: addChronicle(
          state.chronicle,
          `The forge produced a ${grade} ${itemName}${isMasterwork ? " — a masterwork!" : grade === "Scrap" ? " — ruined." : "."}${qualityScore ? ` (Quality: ${qualityScore}%)` : ""}`,
          state.season,
          state.year,
          state.turn,
          "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_EQUIP_ITEM — Move item from inventory to equipped
    // -----------------------------------------------------------------------
    case "BLACKSMITH_EQUIP_ITEM": {
      const { itemUid } = action.payload ?? {};
      const bs = state.blacksmith ?? {};
      const inv = bs.inventory || [];
      const item = inv.find(i => i.uid === itemUid);
      if (!item) return state;

      return {
        ...state,
        blacksmith: {
          ...bs,
          inventory: inv.filter(i => i.uid !== itemUid),
          equipped: [...(bs.equipped || []), item],
        },
        chronicle: addChronicle(
          state.chronicle,
          `Equipped a ${item.grade} ${item.name} to the garrison (+${item.militaryBonus} military).`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_SELL_ITEM — Sell item from inventory for gold
    // -----------------------------------------------------------------------
    case "BLACKSMITH_SELL_ITEM": {
      const { itemUid } = action.payload ?? {};
      const bs = state.blacksmith ?? {};
      const inv = bs.inventory || [];
      const item = inv.find(i => i.uid === itemUid);
      if (!item) return state;

      const sellPrice = action.payload?.price ?? item.tradeValue ?? 0;
      return {
        ...state,
        denarii: state.denarii + sellPrice,
        blacksmith: {
          ...bs,
          inventory: inv.filter(i => i.uid !== itemUid),
          totalGoldEarned: (bs.totalGoldEarned || 0) + sellPrice,
          salesThisSeason: (bs.salesThisSeason || 0) + 1,
          soldToMortimer: bs.soldToMortimer || (action.payload?.buyerId === "mortimer_agent"),
          godricRespect: action.payload?.respectCost
            ? Math.max(0, Math.min(100, (bs.godricRespect || 50) + action.payload.respectCost))
            : bs.godricRespect,
        },
        chronicle: addChronicle(
          state.chronicle,
          action.payload?.buyerName
            ? `Sold a ${item.grade} ${item.name} to ${action.payload.buyerName} for ${sellPrice} denarii.`
            : `Sold a ${item.grade} ${item.name} for ${sellPrice} denarii.`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_SCRAP_ITEM — Destroy item, recover partial materials
    // -----------------------------------------------------------------------
    case "BLACKSMITH_SCRAP_ITEM": {
      const { itemUid } = action.payload ?? {};
      const bs = state.blacksmith ?? {};
      const inv = bs.inventory || [];
      const item = inv.find(i => i.uid === itemUid);
      if (!item) return state;

      const scrapInv = { ...state.inventory };
      const recovered = {};
      if (item.cost) {
        for (const [key, amt] of Object.entries(item.cost)) {
          if (key !== "gold" && amt > 0) {
            const rec = Math.floor(amt * 0.4);
            if (rec > 0) {
              scrapInv[key] = (scrapInv[key] || 0) + rec;
              recovered[key] = rec;
            }
          }
        }
      }
      const recText = Object.entries(recovered).map(([k, v]) => `${v} ${k}`).join(", ");

      return {
        ...state,
        inventory: scrapInv,
        blacksmith: {
          ...bs,
          inventory: inv.filter(i => i.uid !== itemUid),
        },
        chronicle: addChronicle(
          state.chronicle,
          `Scrapped a ${item.grade} ${item.name}.${recText ? ` Recovered: ${recText}.` : ""}`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_BUY_RESOURCE — Purchase forge materials from market
    // -----------------------------------------------------------------------
    case "BLACKSMITH_BUY_RESOURCE": {
      const { resource, quantity, totalCost } = action.payload ?? {};
      if (!resource || !quantity || !totalCost) return state;
      if (state.denarii < totalCost) return state;

      const buyInv = { ...state.inventory };
      buyInv[resource] = (buyInv[resource] || 0) + quantity;

      const bsBuy = state.blacksmith ?? {};
      return {
        ...state,
        denarii: state.denarii - totalCost,
        inventory: buyInv,
        blacksmith: {
          ...bsBuy,
          totalGoldInvested: (bsBuy.totalGoldInvested || 0) + totalCost,
        },
        chronicle: addChronicle(
          state.chronicle,
          `Purchased ${quantity} ${resource} for ${totalCost} denarii.`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_VISIT — Track forge visits, adjust respect
    // -----------------------------------------------------------------------
    case "BLACKSMITH_VISIT": {
      const bs = state.blacksmith ?? {};
      const turnsSinceVisit = state.turn - (bs.lastVisitTurn || 0);

      // +1 respect for visiting, -3 if 3+ turns since last visit
      let respectDelta = 1;
      if (turnsSinceVisit >= 3 && bs.lastVisitTurn > 0) {
        respectDelta = -3;
      }

      return {
        ...state,
        blacksmith: {
          ...bs,
          lastVisitTurn: state.turn,
          godricRespect: Math.max(0, Math.min(100, (bs.godricRespect || 50) + respectDelta)),
        },
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_ADVANCE_WAT — Cycle Wat's fact index
    // -----------------------------------------------------------------------
    case "BLACKSMITH_ADVANCE_WAT": {
      const bs = state.blacksmith ?? {};
      return {
        ...state,
        blacksmith: {
          ...bs,
          watFactIndex: (bs.watFactIndex || 0) + 1,
        },
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_ADVANCE_BANTER — Cycle banter index
    // -----------------------------------------------------------------------
    case "BLACKSMITH_ADVANCE_BANTER": {
      const bs = state.blacksmith ?? {};
      return {
        ...state,
        blacksmith: {
          ...bs,
          banterIndex: (bs.banterIndex || 0) + 1,
        },
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_DISMISS_SUPPLY_EVENT — Clear after player reads
    // -----------------------------------------------------------------------
    case "BLACKSMITH_DISMISS_SUPPLY_EVENT": {
      const bsEvt = state.blacksmith ?? {};
      const supplyEvt = bsEvt.activeSupplyEvent;
      if (!supplyEvt) return state;

      let seInv = { ...state.inventory };
      let seDenarii = state.denarii;
      let seText = `Forge event: ${supplyEvt.name}.`;

      if (supplyEvt.effect === "steel_bonus_5") {
        seInv.steel = (seInv.steel || 0) + 5;
        seText += " Acquired 5 superior steel bars.";
      } else if (supplyEvt.effect === "iron_loss_30") {
        const lost = Math.floor((seInv.iron || 0) * 0.3);
        seInv.iron = Math.max(0, (seInv.iron || 0) - lost);
        seText += ` Lost ${lost} iron to rust.`;
      } else if (supplyEvt.effect === "royal_reward_50") {
        seDenarii += 50;
        seText += " Received 50 denarii from the Crown.";
      }

      return {
        ...state,
        denarii: seDenarii,
        inventory: seInv,
        blacksmith: {
          ...bsEvt,
          activeSupplyEvent: supplyEvt.duration > 0 ? supplyEvt : null,
          supplyEventTurnsLeft: supplyEvt.duration > 0 ? supplyEvt.duration : 0,
          usedSupplyEventIds: [...(bsEvt.usedSupplyEventIds || []), supplyEvt.id],
        },
        chronicle: addChronicle(state.chronicle, seText, state.season, state.year, state.turn, "event"),
      };
    }

    // -----------------------------------------------------------------------
    // BLACKSMITH_INVEST_IRON_VEIN — Spend denarii for +iron/season
    // -----------------------------------------------------------------------
    case "BLACKSMITH_INVEST_IRON_VEIN": {
      const bsVein = state.blacksmith ?? {};
      const veinEvt = bsVein.activeSupplyEvent;
      if (!veinEvt || veinEvt.effect !== "iron_investment") return state;
      const veinCost = veinEvt.investCost || 30;
      if (state.denarii < veinCost) return state;

      return {
        ...state,
        denarii: state.denarii - veinCost,
        blacksmith: {
          ...bsVein,
          ironVeinActive: true,
          activeSupplyEvent: null,
          supplyEventTurnsLeft: 0,
          usedSupplyEventIds: [...(bsVein.usedSupplyEventIds || []), veinEvt.id],
          totalGoldInvested: (bsVein.totalGoldInvested || 0) + veinCost,
        },
        chronicle: addChronicle(
          state.chronicle,
          `Invested ${veinCost} denarii in the iron vein. +${veinEvt.investReward || 3} iron per season.`,
          state.season, state.year, state.turn, "action"
        ),
      };
    }

    // -----------------------------------------------------------------------
    case "LOAD_SAVE":
      return { ...action.payload.savedState };

    default:
      return state;
  }
}

export default gameReducer;
