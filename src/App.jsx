import { useReducer, useMemo, useState, useEffect, lazy, Suspense } from "react";
import { gameReducer, initialState } from "./engine/gameReducer";
import seasonalEventsData from "./data/seasonalEvents";
import randomEventsData from "./data/randomEvents";
import { ALL_FLIPS, computeFlipConsequences, isCyoaFlip, computeCyoaConsequences } from "./engine/flipEngine";
import useMusic from "./hooks/useMusic";

import TitleScreen from "./components/TitleScreen";
import Dashboard from "./components/Dashboard";
import TabBar from "./components/TabBar";
import EstateTab from "./components/EstateTab";
import MarketSquare from "./components/MarketSquare";
import MilitaryTab from "./components/MilitaryTab";
import PeopleTab from "./components/PeopleTab";
import MapTab from "./components/MapTab";
import Chronicle from "./components/Chronicle";
import EventCard from "./components/EventCard";
import ScribesNote from "./components/ScribesNote";
import ResolveScreen from "./components/ResolveScreen";
import GameOverScreen from "./components/GameOverScreen";
import VictoryScreen from "./components/VictoryScreen";
import FlipScreen from "./components/FlipScreen";
import SynergyToast from "./components/SynergyToast";
import TutorialHint from "./components/TutorialHint";
import Watchtower from "./components/Watchtower";
import RaidScreen from "./components/RaidScreen";
import ChapelTab from "./components/ChapelTab";
import TutorialPopup from "./components/TutorialPopup";

// Lazy-loaded heavy tabs (split into separate chunks, fetched on first open)
const Tavern = lazy(() => import("./components/Tavern"));
const GreatHall = lazy(() => import("./components/GreatHall"));
const BlacksmithTab = lazy(() => import("./components/BlacksmithTab"));

// Minimal fallback while a lazy tab chunk downloads
function TabLoadingFallback() {
  return (
    <div
      className="flex items-center justify-center py-12 italic"
      style={{ color: "#a89070", fontFamily: "Cinzel, serif" }}
    >
      Loading...
    </div>
  );
}


const seasonalEvents = Object.values(seasonalEventsData).flat();
const randomEvents = randomEventsData;

const SAVE_KEY = "lords-ledger-save";

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { muted, toggleMute, ensurePlaying } = useMusic();

  // Start music on first click anywhere
  useEffect(() => {
    const handler = () => ensurePlaying();
    document.addEventListener("click", handler, { once: true });
    return () => document.removeEventListener("click", handler);
  }, [ensurePlaying]);

  const {
    phase,
    turn,
    season,
    year,
    chronicle,
    currentEvent,
    currentRandomEvent,
    scribesNote,
    gameOverReason,
    causeChain,
    activeTab,
    denarii,
    food,
    population,
    resourceDeltas,
    bankruptcyTurns,
    currentFlipId,
    currentFlipStats,
    currentDecisionIndex,
    currentFlipOutcome,
    flipConsequenceFlags,
    currentCyoaNodeId,
    cyoaEndingType,
    pendingSynergyNotifications,
    synergies,
    tutorialsSeen,
  } = state;

  const payload = useMemo(
    () => ({ seasonalEvents, randomEvents }),
    []
  );

  // --- Action handlers ---

  function handleStart(difficulty) {
    dispatch({ type: "START_GAME", payload: { ...payload, difficulty } });
  }

  function handleSeasonalChoice(optionIndex) {
    dispatch({ type: "SELECT_SEASONAL_ACTION", payload: { optionIndex } });
  }

  function handleContinueToRandom() {
    dispatch({ type: "CONTINUE_TO_RANDOM", payload });
  }

  function handleRandomChoice(optionIndex) {
    dispatch({ type: "SELECT_RANDOM_RESPONSE", payload: { optionIndex } });
  }

  function handleAdvanceTurn() {
    dispatch({ type: "ADVANCE_TURN", payload });
  }

  function handleDismissScribesNote() {
    dispatch({ type: "DISMISS_SCRIBES_NOTE" });
  }

  function handlePlayAgain() {
    dispatch({ type: "PLAY_AGAIN", payload });
  }

  function handleSetTab(tab) {
    setTavernOpen(false);
    setWatchtowerOpen(false);
    dispatch({ type: "SET_TAB", payload: { tab } });
  }

  function handleBuild(buildingId) {
    dispatch({ type: "BUILD_BUILDING", payload: { buildingId } });
  }

  function handleDemolish(buildingIndex) {
    dispatch({ type: "DEMOLISH_BUILDING", payload: { buildingIndex } });
  }

  function handleRepair(buildingIndex) {
    dispatch({ type: "REPAIR_BUILDING", payload: { buildingIndex } });
  }

  function handleUpgrade(buildingIndex) {
    dispatch({ type: "UPGRADE_BUILDING", payload: { buildingIndex } });
  }

  function handleSell(resource, quantity) {
    dispatch({ type: "SELL_RESOURCE", payload: { resource, quantity } });
  }

  function handleBuy(resource, quantity) {
    dispatch({ type: "BUY_RESOURCE", payload: { resource, quantity } });
  }

  function handleRecruit(soldierType, count) {
    dispatch({ type: "RECRUIT_SOLDIERS", payload: { soldierType, count } });
  }

  function handleDismiss(soldierType, count) {
    dispatch({ type: "DISMISS_SOLDIERS", payload: { soldierType, count } });
  }

  function handleUpgradeFortification(track) {
    dispatch({ type: "UPGRADE_FORTIFICATION", payload: { track } });
  }

  // --- Flip handlers ---

  const [prevFlipStats, setPrevFlipStats] = useState(null);

  function handleDismissFlipIntro() {
    dispatch({ type: "DISMISS_FLIP_INTRO" });
  }

  function handleFlipOption(optionIndex) {
    setPrevFlipStats(currentFlipStats ? { ...currentFlipStats } : null);
    dispatch({ type: "SELECT_FLIP_OPTION", payload: { optionIndex } });
  }

  function handleContinueFlip() {
    dispatch({ type: "CONTINUE_FLIP" });
  }

  function handleDismissFlipSummary() {
    dispatch({ type: "DISMISS_FLIP_SUMMARY" });
  }

  function handleDismissSynergyNotification() {
    dispatch({ type: "DISMISS_SYNERGY_NOTIFICATION" });
  }

  function handleDismissTutorial(tab) {
    dispatch({ type: "DISMISS_TUTORIAL", payload: { tab } });
  }

  // --- Raid handlers ---
  function handleRaidDefend() {
    dispatch({ type: "RAID_DEFEND" });
  }

  function handleRaidContinue() {
    dispatch({ type: "RAID_CONTINUE" });
  }

  const [tavernOpen, setTavernOpen] = useState(false);
  const [watchtowerOpen, setWatchtowerOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [saveFlash, setSaveFlash] = useState(null); // "saved" | "loaded" | "error"
  const [hasSavedGame, setHasSavedGame] = useState(() => {
    try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
  });

  function handleSaveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      setHasSavedGame(true);
      setSaveFlash("saved");
      setTimeout(() => setSaveFlash(null), 1500);
    } catch {
      setSaveFlash("error");
      setTimeout(() => setSaveFlash(null), 2000);
    }
  }

  function handleLoadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) { setSaveFlash("error"); setTimeout(() => setSaveFlash(null), 2000); return; }
      const savedState = JSON.parse(raw);
      dispatch({ type: "LOAD_SAVE", payload: { savedState } });
      setHasSavedGame(true);
      setSaveFlash("loaded");
      setTimeout(() => setSaveFlash(null), 1500);
    } catch {
      setSaveFlash("error");
      setTimeout(() => setSaveFlash(null), 2000);
    }
  }

  function handleSimulateSeason() {
    if (isResolving) return;
    setTavernOpen(false);
    setWatchtowerOpen(false);
    setIsResolving(true);
    requestAnimationFrame(() => {
      dispatch({ type: "SIMULATE_SEASON", payload });
      setIsResolving(false);
    });
  }

  // --- Computed values ---
  const isManagement = phase === "management";
  const isEventPhase =
    phase === "seasonal_action" ||
    phase === "seasonal_resolve" ||
    phase === "random_event" ||
    phase === "random_resolve" ||
    phase === "raid_warning" ||
    phase === "raid_result";
  const isRaidPhase =
    phase === "raid_warning" ||
    phase === "raid_result";
  const isFlipPhase =
    phase === "flip_intro" ||
    phase === "flip_decision" ||
    phase === "flip_outcome" ||
    phase === "flip_summary";

  const flipData = currentFlipId ? ALL_FLIPS[currentFlipId] : null;

  const flipDisplayStats = useMemo(() => {
    if (!flipData || !currentFlipStats) return null;
    if (flipData.type === "cyoa") return null; // CYOA has no character stats
    return Object.entries(flipData.characterStats).map(([key, config]) => ({
      key,
      label: config.label,
      icon: config.icon,
      color: config.color,
      value: currentFlipStats[key] ?? 0,
    }));
  }, [flipData, currentFlipStats]);

  const flipConsequencesPreview = useMemo(() => {
    if (!currentFlipId || phase !== "flip_summary") return null;
    if (isCyoaFlip(currentFlipId)) {
      return computeCyoaConsequences(currentFlipId, cyoaEndingType);
    }
    return computeFlipConsequences(currentFlipId, flipConsequenceFlags);
  }, [currentFlipId, flipConsequenceFlags, phase, cyoaEndingType]);

  const displayTab = isEventPhase ? "chronicle" : activeTab;
  // B-09 FIX: queue tutorials behind the scribe's note so overlays never stack.
  // If a scribe's note is visible, defer the tutorial until it is dismissed.
  const showTutorial = isManagement && !isFlipPhase && !scribesNote && !tutorialsSeen?.includes(displayTab);

  // --- Title Screen ---
  if (phase === "title") {
    return (
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: "12px", right: "12px", zIndex: 50,
          display: "flex", gap: "6px", alignItems: "center",
        }}>
          {hasSavedGame && (
            <button
              onClick={handleLoadGame}
              title="Load saved game"
              aria-label="Load saved game"
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                border: "1.5px solid #6a5a42", background: "#1a1610",
                color: "#c4a24a", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", lineHeight: 1, transition: "all 0.2s",
              }}
            >
              {"\u2191"}
            </button>
          )}
          <button
            onClick={toggleMute}
            title={muted ? "Unmute music" : "Mute music"}
            aria-label={muted ? "Unmute music" : "Mute music"}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              border: "1.5px solid #6a5a42",
              background: muted ? "#1a1610" : "rgba(196, 162, 74, 0.15)",
              color: muted ? "#6a5a42" : "#c4a24a",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", lineHeight: 1, transition: "all 0.2s",
            }}
          >
            {muted ? "\u266A" : "\u266B"}
          </button>
        </div>
        {saveFlash && (
          <div style={{
            position: "absolute", top: "56px", right: "12px", zIndex: 50,
            fontSize: "11px", fontFamily: "Cinzel, serif",
            color: saveFlash === "error" ? "#c62828" : "#8dba6e",
          }}>
            {saveFlash === "loaded" ? "Game Loaded!" : "Error"}
          </div>
        )}
        <TitleScreen onStart={handleStart} />
      </div>
    );
  }

  // --- Game Over Screen ---
  if (phase === "game_over") {
    return (
      <GameOverScreen
        gameOverReason={gameOverReason}
        causeChain={causeChain}
        state={state}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // --- Victory Screen ---
  if (phase === "victory") {
    return (
      <VictoryScreen
        state={state}
        onPlayAgain={handlePlayAgain}
        activatedSynergies={synergies?.activated ?? []}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0f0d0a" }}
    >
      {/* Scribe's Note overlay */}
      <ScribesNote text={scribesNote} onDismiss={handleDismissScribesNote} />

      {/* Tutorial popup for first tab visit */}
      {showTutorial && (
        <TutorialPopup
          tab={displayTab}
          onDismiss={() => handleDismissTutorial(displayTab)}
        />
      )}

      {/* Raid overlay */}
      {isRaidPhase && state.raids?.activeRaid && (
        <RaidScreen
          raidState={state.raids.activeRaid}
          garrison={state.garrison}
          military={state.military}
          onDefend={handleRaidDefend}
          onContinue={handleRaidContinue}
        />
      )}

      {/* Sticky header: Dashboard + TabBar */}
      <div className="sticky top-0 z-40">
        {/* Save / Load / Music controls */}
        <div style={{
          position: "absolute", top: "6px", right: "8px", zIndex: 50,
          display: "flex", gap: "4px", alignItems: "center",
        }}>
          {saveFlash && (
            <span style={{
              fontSize: "10px",
              fontFamily: "Cinzel, serif",
              color: saveFlash === "error" ? "#c62828" : "#8dba6e",
              marginRight: "2px",
              animation: "tab-fade-in 0.2s",
            }}>
              {saveFlash === "saved" ? "Saved!" : saveFlash === "loaded" ? "Loaded!" : "Error"}
            </span>
          )}
          <button
            onClick={handleSaveGame}
            title="Save game"
            aria-label="Save game"
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "1.5px solid #6a5a42", background: "#1a1610",
              color: "#c4a24a", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", lineHeight: 1, transition: "all 0.2s",
            }}
          >
            {"\u2193"}
          </button>
          <button
            onClick={handleLoadGame}
            title={hasSavedGame ? "Load saved game" : "No save found"}
            aria-label="Load saved game"
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "1.5px solid #6a5a42",
              background: hasSavedGame ? "#1a1610" : "#0f0d0a",
              color: hasSavedGame ? "#c4a24a" : "#4a3a22",
              cursor: hasSavedGame ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", lineHeight: 1, transition: "all 0.2s",
              opacity: hasSavedGame ? 1 : 0.5,
            }}
          >
            {"\u2191"}
          </button>
          <button
            onClick={toggleMute}
            title={muted ? "Unmute music" : "Mute music"}
            aria-label={muted ? "Unmute music" : "Mute music"}
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "1.5px solid #6a5a42",
              background: muted ? "#1a1610" : "rgba(196, 162, 74, 0.15)",
              color: muted ? "#6a5a42" : "#c4a24a",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", lineHeight: 1, transition: "all 0.2s",
            }}
          >
            {muted ? "\u266A" : "\u266B"}
          </button>
        </div>
        <Dashboard
          denarii={denarii}
          food={food}
          population={population}
          garrison={state.garrison}
          morale={state.military?.morale ?? 50}
          faith={state.chapel?.faith ?? 50}
          piety={state.chapel?.piety ?? 30}
          season={season}
          year={year}
          turn={turn}
          resourceDeltas={resourceDeltas}
          bankruptcyTurns={bankruptcyTurns}
          flipMode={isFlipPhase}
          flipStats={flipDisplayStats}
        />

        {!isFlipPhase && (
          <TabBar
            activeTab={displayTab}
            onSetTab={handleSetTab}
            turn={turn}
            disabled={isEventPhase}
          />
        )}
      </div>

      {/* Tab content — pb-24 (96px) leaves space for the sticky Simulate-Season bar (~88px) so scrolled content isn't hidden beneath it (B-54).
          An explicit 96px spacer is appended at the end of the tab content below so the final rows of tall tables (Market commodity list, Forge info panels, Chronicle entries) can always scroll above the sticky bar. */}
      <div key={displayTab} className="flex-1 px-4 py-4 pb-24 tab-fade-in">

        {/* --- FLIP PHASES --- */}
        {isFlipPhase && flipData && (
          <FlipScreen
            phase={phase}
            flipData={flipData}
            currentFlipStats={currentFlipStats}
            currentDecisionIndex={currentDecisionIndex}
            currentFlipOutcome={currentFlipOutcome}
            flipOutcomeWasSuccess={state.flipOutcomeWasSuccess}
            consequences={flipConsequencesPreview}
            prevStats={prevFlipStats}
            onDismissIntro={handleDismissFlipIntro}
            onSelectOption={handleFlipOption}
            onContinue={handleContinueFlip}
            onDismissSummary={handleDismissFlipSummary}
            currentCyoaNodeId={currentCyoaNodeId}
            isCyoa={currentFlipId ? isCyoaFlip(currentFlipId) : false}
          />
        )}

        {/* Tutorial hints for the active tab */}
        {!isFlipPhase && isManagement && (
          <TutorialHint tab={displayTab} turn={turn} />
        )}

        {/* --- ESTATE TAB --- */}
        {!isFlipPhase && displayTab === "estate" && isManagement && (
          <EstateTab
            state={state}
            onBuild={handleBuild}
            onDemolish={handleDemolish}
            onRepair={handleRepair}
            onUpgrade={handleUpgrade}
            activatedSynergies={synergies?.activated ?? []}
          />
        )}

        {/* --- MAP TAB --- */}
        {!isFlipPhase && displayTab === "map" && isManagement && (
          tavernOpen ? (
            <Suspense fallback={<TabLoadingFallback />}>
              <Tavern
                state={state}
                dispatch={dispatch}
                onClose={() => setTavernOpen(false)}
              />
            </Suspense>
          ) : watchtowerOpen ? (
            <Watchtower
              state={state}
              dispatch={dispatch}
              onClose={() => setWatchtowerOpen(false)}
            />
          ) : (
            <MapTab
              state={state}
              onOpenTavern={() => setTavernOpen(true)}
              onOpenWatchtower={() => setWatchtowerOpen(true)}
              onOpenMarket={() => handleSetTab("market")}
            />
          )
        )}

        {/* --- MARKET TAB --- */}
        {!isFlipPhase && displayTab === "market" && isManagement && (
          <MarketSquare
            state={state}
            dispatch={dispatch}
            onSell={handleSell}
            onBuy={handleBuy}
          />
        )}

        {/* --- MILITARY TAB --- */}
        {!isFlipPhase && displayTab === "military" && isManagement && (
          <MilitaryTab
            state={state}
            onRecruit={handleRecruit}
            onDismiss={handleDismiss}
            onUpgradeFortification={handleUpgradeFortification}
            onOpenWatchtower={() => {
              setWatchtowerOpen(true);
              dispatch({ type: "SET_TAB", payload: { tab: "map" } });
            }}
          />
        )}

        {/* --- PEOPLE TAB --- */}
        {!isFlipPhase && displayTab === "people" && isManagement && (
          <PeopleTab
            state={state}
            dispatch={dispatch}
          />
        )}

        {/* --- GREAT HALL TAB --- */}
        {!isFlipPhase && displayTab === "hall" && isManagement && (
          <Suspense fallback={<TabLoadingFallback />}>
            <GreatHall state={state} dispatch={dispatch} />
          </Suspense>
        )}

        {/* --- CHAPEL TAB --- */}
        {!isFlipPhase && displayTab === "chapel" && isManagement && (
          <ChapelTab state={state} dispatch={dispatch} />
        )}

        {/* --- BLACKSMITH FORGE TAB --- */}
        {!isFlipPhase && displayTab === "forge" && isManagement && (
          <Suspense fallback={<TabLoadingFallback />}>
            <BlacksmithTab state={state} dispatch={dispatch} />
          </Suspense>
        )}

        {/* --- CHRONICLE TAB --- */}
        {!isFlipPhase && displayTab === "chronicle" && (
          <>
            {phase === "seasonal_action" && currentEvent && (
              <EventCard
                event={currentEvent}
                onChoose={handleSeasonalChoice}
                phaseLabel="Seasonal Decision"
              />
            )}

            {phase === "seasonal_resolve" && (
              <ResolveScreen
                onContinue={handleContinueToRandom}
                buttonText="See What Happens Next"
              />
            )}

            {phase === "random_event" && currentRandomEvent && (
              <EventCard
                event={currentRandomEvent}
                onChoose={handleRandomChoice}
                phaseLabel="An Event Unfolds"
              />
            )}

            {phase === "random_resolve" && (
              <ResolveScreen
                onContinue={handleAdvanceTurn}
                buttonText={turn >= 40 ? "See Your Legacy" : "Continue"}
              />
            )}

            <Chronicle entries={chronicle} />
          </>
        )}

        {/* Spacer so the final rows of dense tab content (Market commodities, Forge info panels, Chronicle) can scroll above the sticky Simulate-Season bar on 1280x720 viewports (B-54). */}
        {isManagement && !isFlipPhase && (
          <div aria-hidden="true" style={{ height: 96 }} />
        )}
      </div>

      {/* Synergy notification toast — hidden during flip phases to avoid input deadlock */}
      {!isFlipPhase && (
        <SynergyToast
          notification={pendingSynergyNotifications?.[0] ?? null}
          onDismiss={handleDismissSynergyNotification}
        />
      )}

      {/* Simulate Season button */}
      {isManagement && !isFlipPhase && (
        <div
          className="sticky bottom-0 w-full px-4 py-3 text-center z-30"
          style={{ backgroundColor: "#0f0d0a", borderTop: "1px solid #8a7a3a" }}
        >
          <button
            onClick={handleSimulateSeason}
            disabled={isResolving}
            className={`px-10 py-3 rounded-md border-2 font-heading font-bold text-lg uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed${isResolving ? "" : " gold-glow"}`}
            style={{
              background: isResolving
                ? "linear-gradient(135deg, #5a1010 0%, #2a0505 50%, #5a1010 100%)"
                : "linear-gradient(135deg, #8b1a1a 0%, #4a0a0a 50%, #8b1a1a 100%)",
              border: "2px solid #c4a24a",
              color: "#e8c44a",
              fontFamily: "Cinzel Decorative, Cinzel, serif",
              letterSpacing: "3px",
              cursor: isResolving ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isResolving) {
                e.currentTarget.style.background = "linear-gradient(135deg, #c62828 0%, #6a1010 50%, #c62828 100%)";
                e.currentTarget.style.textShadow = "0 0 8px rgba(232, 196, 74, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isResolving) {
                e.currentTarget.style.background = "linear-gradient(135deg, #8b1a1a 0%, #4a0a0a 50%, #8b1a1a 100%)";
                e.currentTarget.style.textShadow = "none";
              }
            }}
            aria-label={isResolving ? "Resolving season..." : "Simulate this season"}
          >
            {isResolving ? "Resolving..." : "Simulate Season"}
          </button>
          <p className="text-sm mt-1 italic" style={{ color: "#a89070" }}>
            Resolve production, consumption, and events for {season ? season.charAt(0).toUpperCase() + season.slice(1) : ""}, Year {year}
          </p>
        </div>
      )}
    </div>
  );
}
