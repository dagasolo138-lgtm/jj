/**
 * Tavern.jsx
 *
 * The Boar's Head Tavern — social heart of the medieval village.
 * Contains mini-games (Knight's Gambit, Rats in the Cellar),
 * the Bard's Corner, easter eggs (wall, stranger), and atmosphere.
 *
 * Rendered as an overlay within the Map tab.
 */

import { useState, useMemo, useEffect } from "react"; // useMemo used in TavernWall
import KnightsGambit from "./KnightsGambit";
import RatsInCellar from "./RatsInCellar";
import BardsCorner from "./BardsCorner";
import MartaMerchant from "./MartaMerchant";
import OldAldric from "./OldAldric";
import {
  TAVERN_SUBTITLES,
  WALL_STATIC_GRAFFITI,
  WALL_DYNAMIC_CONDITIONS,
  STRANGER_ENCOUNTERS,
  VISIT_MILESTONES,
} from "../data/tavern";

// ---------------------------------------------------------------------------
// Tavern station cards
// ---------------------------------------------------------------------------

const STATIONS = [
  {
    id: "gambit",
    title: "Knight's Gambit",
    subtitle: "Wager your coin on steel and wit",
    icon: "\u2694",
    borderColor: "#8b1a1a",
  },
  {
    id: "rats",
    title: "Rats in the Cellar",
    subtitle: "Defend the grain stores",
    icon: "\u25C6", // diamond as rat placeholder
    borderColor: "#4a8a3a",
  },
  {
    id: "bard",
    title: "The Bard's Corner",
    subtitle: "Tales, riddles, and wisdom",
    icon: "\u266B",
    borderColor: "#6a4a8a",
  },
  {
    id: "marta",
    title: "Marta the Merchant",
    subtitle: "Femme Sole \u2014 Licensed Trader",
    icon: "\u2696",
    borderColor: "#1a5a5a",
  },
  {
    id: "aldric",
    title: "Old Aldric",
    subtitle: "Veteran of the Siege of Acre",
    icon: "\u2694",
    borderColor: "#8b1a1a",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TavernHeader({ subtitle }) {
  return (
    <div className="text-center mb-4">
      <h2
        className="text-xl sm:text-2xl font-bold uppercase tracking-widest"
        style={{
          fontFamily: "Cinzel Decorative, Cinzel, serif",
          color: "#e8c44a",
          textShadow: "0 0 12px rgba(232, 196, 74, 0.3)",
        }}
      >
        The Boar&rsquo;s Head Tavern
      </h2>
      <p
        className="mt-1 italic text-sm"
        style={{ color: "#a89070", fontFamily: "Crimson Text, serif" }}
      >
        &ldquo;{subtitle}&rdquo;
      </p>
    </div>
  );
}

function StationCard({ station, disabled, disabledText, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tavern-card rounded-lg p-4 text-center cursor-pointer border-2 w-full"
      style={{
        backgroundColor: disabled ? "#151008" : "#1a1208",
        borderColor: disabled ? "#3a3020" : station.borderColor,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div
        className="text-3xl mb-2"
        style={{ color: disabled ? "#5a4a30" : "#c4a24a", lineHeight: 1 }}
      >
        {station.icon}
      </div>
      <h3
        className="font-bold text-sm uppercase tracking-wide"
        style={{
          fontFamily: "Cinzel, serif",
          color: disabled ? "#5a4a30" : "#c4a24a",
        }}
      >
        {station.title}
      </h3>
      <p
        className="text-xs mt-1 italic"
        style={{
          fontFamily: "system-ui, sans-serif",
          color: disabled ? "#4a3a20" : "#8a7a5a",
        }}
      >
        {disabled ? disabledText : station.subtitle}
      </p>
    </button>
  );
}

function TavernWall({ state, onStashClick }) {
  const tavern = state.tavern ?? {};
  const dynamicMessages = useMemo(() => {
    return WALL_DYNAMIC_CONDITIONS
      .filter((c) => c.condition(state))
      .map((c) => c.text);
  }, [state]);

  // Visit milestone graffiti
  const milestoneGraffiti = useMemo(() => {
    const msgs = [];
    for (const m of VISIT_MILESTONES) {
      if (m.graffiti && (tavern.totalVisits ?? 0) >= m.visits) {
        msgs.push(m.graffiti);
      }
    }
    return msgs;
  }, [tavern.totalVisits]);

  return (
    <div
      className="rounded-lg border p-3 mt-3"
      style={{
        backgroundColor: "#120e08",
        borderColor: "#3a3020",
        backgroundImage:
          "linear-gradient(135deg, #120e08 25%, #1a1208 50%, #120e08 75%)",
      }}
    >
      <h4
        className="text-xs font-bold uppercase tracking-widest text-center mb-2"
        style={{ color: "#6a5a42", fontFamily: "Cinzel, serif" }}
      >
        The Wall
      </h4>

      <div className="space-y-1">
        {/* Static graffiti */}
        {WALL_STATIC_GRAFFITI.map((g, i) => (
          <p
            key={`static-${i}`}
            className={g.large ? "text-sm" : "text-xs"}
            style={{
              fontFamily: "monospace",
              color: "#5a4a30",
              textDecoration: g.strikethrough ? "line-through" : "none",
              letterSpacing: g.large ? "2px" : "0.5px",
            }}
          >
            {g.text} {g.icon && <span style={{ marginLeft: "4px" }}>{g.icon}</span>}
          </p>
        ))}

        {/* Dynamic notices */}
        {dynamicMessages.map((msg, i) => (
          <p
            key={`dyn-${i}`}
            className="text-xs italic"
            style={{ fontFamily: "Crimson Text, serif", color: "#8a6a3a" }}
          >
            {msg}
          </p>
        ))}

        {/* Milestone graffiti */}
        {milestoneGraffiti.map((msg, i) => (
          <p
            key={`mile-${i}`}
            className="text-xs font-bold"
            style={{ fontFamily: "monospace", color: "#6a5a42" }}
          >
            {msg}
          </p>
        ))}

        {/* Secret stash */}
        {!tavern.wallStashFound ? (
          <span
            onClick={onStashClick}
            className="cursor-pointer select-none inline-block mt-1"
            style={{
              fontSize: "9px",
              color: "#2a2010",
              opacity: 0.3,
              fontFamily: "monospace",
              letterSpacing: "1px",
            }}
            title=""
          >
            {"\u2726"}
          </span>
        ) : (
          <span
            className="inline-block mt-1"
            style={{
              fontSize: "8px",
              color: "#3a3020",
              fontFamily: "monospace",
            }}
          >
            EMPTY
          </span>
        )}
      </div>
    </div>
  );
}

function StrangerCard({ encounter, state, onTrade, onDismiss }) {
  const [interacted, setInteracted] = useState(false);

  if (interacted) return null;

  let displayText = encounter.text;
  if (encounter.type === "warning") {
    // Find lowest resource
    const resources = [
      { name: "treasury", val: state.denarii },
      { name: "food stores", val: state.food },
      { name: "population", val: state.population * 10 },
      { name: "garrison", val: state.garrison * 20 },
    ];
    resources.sort((a, b) => a.val - b.val);
    displayText = `Your ${resources[0].name} concerns me, my lord. Neglect it at your peril.`;
  }

  function handleClick() {
    setInteracted(true);
    if (encounter.type === "trade") {
      // Show trade option
    } else {
      onDismiss();
    }
  }

  return (
    <div
      className="tavern-card rounded-lg p-4 text-center border-2 w-full"
      style={{
        backgroundColor: "#0e0a14",
        borderColor: "#4a2a6a",
      }}
    >
      <div className="text-3xl mb-2" style={{ color: "#8a5aaa" }}>
        {"\u2620"}
      </div>
      <h3
        className="font-bold text-sm uppercase tracking-wide"
        style={{ fontFamily: "Cinzel, serif", color: "#8a5aaa" }}
      >
        A Hooded Figure
      </h3>
      <p
        className="text-xs mt-2 italic"
        style={{ fontFamily: "Crimson Text, serif", color: "#a89070" }}
      >
        &ldquo;{displayText}&rdquo;
      </p>
      <div className="mt-3 flex gap-2 justify-center">
        {encounter.type === "trade" ? (
          <>
            <button
              onClick={() => {
                setInteracted(true);
                onTrade(encounter.cost, encounter.reward?.food ?? 0);
              }}
              disabled={state.denarii < encounter.cost}
              className="px-3 py-1 rounded text-xs font-bold"
              style={{
                backgroundColor: state.denarii >= encounter.cost ? "#2a1a3a" : "#1a1018",
                color: state.denarii >= encounter.cost ? "#c4a24a" : "#5a4a30",
                border: "1px solid #4a2a6a",
                cursor: state.denarii >= encounter.cost ? "pointer" : "not-allowed",
              }}
            >
              Pay {encounter.cost}d
            </button>
            <button
              onClick={handleClick}
              className="px-3 py-1 rounded text-xs"
              style={{
                backgroundColor: "#1a1208",
                color: "#8a7a5a",
                border: "1px solid #3a3020",
              }}
            >
              Decline
            </button>
          </>
        ) : (
          <button
            onClick={handleClick}
            className="px-3 py-1 rounded text-xs"
            style={{
              backgroundColor: "#1a1208",
              color: "#8a7a5a",
              border: "1px solid #3a3020",
            }}
          >
            Nod silently
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Tavern component
// ---------------------------------------------------------------------------

export default function Tavern({ state, dispatch, onClose }) {
  const [activeStation, setActiveStation] = useState(null);
  const [stashMessage, setStashMessage] = useState(null);
  const [entering, setEntering] = useState(true);

  const tavern = state.tavern ?? {};

  // Compute visit milestone message at mount time
  const [visitMessage] = useState(() => {
    const visits = (tavern.totalVisits ?? 0) + 1;
    for (const m of VISIT_MILESTONES) {
      if (m.message && visits === m.visits) return m.message;
    }
    return null;
  });

  // Random subtitle picked once per mount
  const [subtitle] = useState(
    () => TAVERN_SUBTITLES[Math.floor(Math.random() * TAVERN_SUBTITLES.length)]
  );

  // Determine if stranger appears (10% chance, not two visits in a row)
  const [strangerEncounter] = useState(() => {
    if (tavern.strangerAppearedThisSeason) return null;
    if (Math.random() > 0.1) return null;
    const idx = Math.floor(Math.random() * STRANGER_ENCOUNTERS.length);
    return STRANGER_ENCOUNTERS[idx];
  });

  // Log visit on mount
  useEffect(() => {
    dispatch({ type: "TAVERN_VISIT" });
    // Entry animation
    const timer = setTimeout(() => setEntering(false), 600);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Gambit disabled check
  const gambitDisabled = (tavern.gambitRoundsThisSeason ?? 0) >= 5;
  const ratsDisabled = tavern.ratsPlayedThisSeason === true;

  // Handlers for sub-games
  function handleGambitResult(result, wager) {
    dispatch({ type: "TAVERN_GAMBIT_RESULT", payload: { result, wager } });
  }

  function handleGambitSetLast(choice) {
    dispatch({ type: "TAVERN_GAMBIT_SET_LAST", payload: { choice } });
  }

  function handleGambitScribesNoteSeen() {
    dispatch({ type: "TAVERN_GAMBIT_SCRIBES_NOTE_SEEN" });
  }

  function handleRatsResult(stats) {
    dispatch({ type: "TAVERN_RATS_RESULT", payload: stats });
    setActiveStation(null);
  }

  function handleRatsScribesNoteSeen() {
    dispatch({ type: "TAVERN_RATS_SCRIBES_NOTE_SEEN" });
  }

  function handleRiddleSolved() {
    dispatch({ type: "TAVERN_BARD_RIDDLE_SOLVED" });
  }

  function handleMartaAcceptOffer(offerId) {
    dispatch({ type: "TAVERN_MARTA_ACCEPT_OFFER", payload: { offerId } });
  }

  function handleMartaDeclineOffer(offerId) {
    dispatch({ type: "TAVERN_MARTA_DECLINE_OFFER", payload: { offerId } });
  }

  function handleMartaScribesNoteSeen() {
    dispatch({ type: "TAVERN_MARTA_SCRIBES_NOTE_SEEN" });
  }

  function handleAldricAcceptOffer(offerId) {
    dispatch({ type: "TAVERN_ALDRIC_ACCEPT_OFFER", payload: { offerId } });
  }

  function handleAldricDeclineOffer(offerId) {
    dispatch({ type: "TAVERN_ALDRIC_DECLINE_OFFER", payload: { offerId } });
  }

  function handleAldricScribesNoteSeen() {
    dispatch({ type: "TAVERN_ALDRIC_SCRIBES_NOTE_SEEN" });
  }

  function handleStashClick() {
    if (!tavern.wallStashFound) {
      dispatch({ type: "TAVERN_WALL_STASH" });
      setStashMessage(
        "You found a coin purse hidden in a crack in the wall. Some previous lord must have forgotten it. +25d"
      );
      setTimeout(() => setStashMessage(null), 4000);
    }
  }

  function handleStrangerTrade(cost, foodReward) {
    dispatch({ type: "TAVERN_STRANGER_TRADE", payload: { cost, foodReward } });
  }

  function handleStrangerDismiss() {
    dispatch({ type: "TAVERN_STRANGER_DISMISS" });
  }

  // If a station is active, show its sub-view
  if (activeStation === "gambit") {
    return (
      <div className={entering ? "tavern-enter" : ""}>
        <KnightsGambit
          denarii={state.denarii}
          gambitRoundsThisSeason={tavern.gambitRoundsThisSeason ?? 0}
          gambitLastChoice={tavern.gambitLastChoice}
          gambitScribesNoteSeen={tavern.gambitScribesNoteSeen ?? false}
          onResult={handleGambitResult}
          onSetLast={handleGambitSetLast}
          onScribesNoteSeen={handleGambitScribesNoteSeen}
          onBack={() => setActiveStation(null)}
        />
      </div>
    );
  }

  if (activeStation === "rats") {
    return (
      <div className={entering ? "tavern-enter" : ""}>
        <RatsInCellar
          food={state.food}
          ratsPlayedThisSeason={tavern.ratsPlayedThisSeason ?? false}
          ratsScribesNoteSeen={tavern.ratsScribesNoteSeen ?? false}
          onResult={handleRatsResult}
          onScribesNoteSeen={handleRatsScribesNoteSeen}
          onBack={() => setActiveStation(null)}
        />
      </div>
    );
  }

  if (activeStation === "bard") {
    return (
      <div className={entering ? "tavern-enter" : ""}>
        <BardsCorner
          state={state}
          onRiddleSolved={handleRiddleSolved}
          onBack={() => setActiveStation(null)}
        />
      </div>
    );
  }

  if (activeStation === "marta") {
    return (
      <div className={entering ? "tavern-enter" : ""}>
        <MartaMerchant
          state={state}
          onAcceptOffer={handleMartaAcceptOffer}
          onDeclineOffer={handleMartaDeclineOffer}
          onScribesNoteSeen={handleMartaScribesNoteSeen}
          onBack={() => setActiveStation(null)}
        />
      </div>
    );
  }

  if (activeStation === "aldric") {
    return (
      <div className={entering ? "tavern-enter" : ""}>
        <OldAldric
          state={state}
          onAcceptOffer={handleAldricAcceptOffer}
          onDeclineOffer={handleAldricDeclineOffer}
          onScribesNoteSeen={handleAldricScribesNoteSeen}
          onBack={() => setActiveStation(null)}
        />
      </div>
    );
  }

  // Main tavern view
  return (
    <div
      className={`w-full max-w-4xl mx-auto rounded-xl border-2 overflow-hidden relative ${entering ? "tavern-enter" : ""}`}
      style={{
        backgroundColor: "#1a1208",
        borderColor: "#c4a24a",
        backgroundImage:
          "linear-gradient(180deg, #1a1208 0%, #120e06 70%, #1a1408 100%)",
      }}
    >
      {/* Grain texture overlay */}
      <div
        className="tavern-grain"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 p-4 sm:p-6">
        {/* Header */}
        <TavernHeader subtitle={subtitle} />

        {/* Visit milestone message */}
        {visitMessage && (
          <div
            className="text-center mb-3 py-2 rounded"
            style={{
              backgroundColor: "#2a2010",
              border: "1px solid #6a5a42",
            }}
          >
            <p
              className="text-sm italic"
              style={{ color: "#c4a24a", fontFamily: "Crimson Text, serif" }}
            >
              The barkeep says: &ldquo;{visitMessage}&rdquo;
            </p>
          </div>
        )}

        {/* Station grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {STATIONS.map((station) => {
            const isGambit = station.id === "gambit";
            const isRats = station.id === "rats";
            const disabled = (isGambit && gambitDisabled) || (isRats && ratsDisabled);
            const disabledText = isGambit
              ? "Enough for one night, my lord."
              : isRats
                ? "The cellar is clear... for now."
                : "";

            return (
              <StationCard
                key={station.id}
                station={station}
                disabled={disabled}
                disabledText={disabledText}
                onClick={() => !disabled && setActiveStation(station.id)}
              />
            );
          })}
        </div>

        {/* Stranger card (10% chance) */}
        {strangerEncounter && (
          <div className="mb-3">
            <StrangerCard
              encounter={strangerEncounter}
              state={state}
              onTrade={handleStrangerTrade}
              onDismiss={handleStrangerDismiss}
            />
          </div>
        )}

        {/* Wall stash found message */}
        {stashMessage && (
          <div
            className="text-center mb-2 py-2 rounded"
            style={{
              backgroundColor: "#2a2a10",
              border: "1px solid #c4a24a",
            }}
          >
            <p className="text-sm font-bold" style={{ color: "#e8c44a" }}>
              {stashMessage}
            </p>
          </div>
        )}

        {/* Tavern Wall */}
        <TavernWall
          state={state}
          onStashClick={handleStashClick}
        />

        {/* Footer: purse + leave */}
        <div
          className="flex items-center justify-between mt-4 pt-3"
          style={{ borderTop: "1px solid #3a3020" }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: "#c4a24a", fontFamily: "Cinzel, serif" }}
          >
            Your purse: {state.denarii}d
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "#231e16",
              color: "#a89070",
              border: "1px solid #6a5a42",
              fontFamily: "Cinzel, serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2d2619";
              e.currentTarget.style.color = "#c4a24a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#231e16";
              e.currentTarget.style.color = "#a89070";
            }}
          >
            Leave Tavern
          </button>
        </div>
      </div>

      {/* Ambient firelight gradient at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "80px",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(180, 120, 40, 0.06) 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </div>
  );
}
