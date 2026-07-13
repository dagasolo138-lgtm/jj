import { useState, useCallback } from "react";
import {
  GAMBIT_WEAPONS,
  GAMBIT_WAGERS,
  GAMBIT_MAX_ROUNDS,
  GAMBIT_WIN_LINES,
  GAMBIT_LOSE_LINES,
  GAMBIT_DRAW_LINES,
  GAMBIT_SCRIBES_NOTE,
} from "../data/tavern";

const WEAPON_KEYS = Object.keys(GAMBIT_WEAPONS);

const PHASE_WAGER = "wager";
const PHASE_CHOICE = "choice";
const PHASE_REVEAL = "reveal";
const PHASE_RESULT = "result";
const PHASE_MAXED = "maxed";

/** Pick opponent weapon with weighted randomness based on player's last choice. */
function pickOpponentWeapon(lastChoice) {
  const rand = Math.random();
  if (!lastChoice) {
    // First round: uniform
    if (rand < 0.333) return WEAPON_KEYS[0];
    if (rand < 0.666) return WEAPON_KEYS[1];
    return WEAPON_KEYS[2];
  }
  // 40% counter to last pick, 30% each for others
  const counter = WEAPON_KEYS.find(
    (k) => GAMBIT_WEAPONS[k].beats === lastChoice
  );
  const others = WEAPON_KEYS.filter((k) => k !== counter);
  if (rand < 0.4) return counter;
  if (rand < 0.7) return others[0];
  return others[1];
}

/** Determine outcome: "win", "lose", or "draw". */
function resolveRound(playerKey, opponentKey) {
  if (playerKey === opponentKey) return "draw";
  if (GAMBIT_WEAPONS[playerKey].beats === opponentKey) return "win";
  return "lose";
}

function pickLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

/** Generate gold particle burst positions. */
function makeParticles(count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = 40 + Math.random() * 50;
    particles.push({
      id: i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      size: 4 + Math.random() * 4,
    });
  }
  return particles;
}

export default function KnightsGambit({
  denarii,
  gambitRoundsThisSeason,
  gambitLastChoice,
  gambitScribesNoteSeen,
  onResult,
  onSetLast,
  onScribesNoteSeen,
  onBack,
}) {
  const [phase, setPhase] = useState(
    gambitRoundsThisSeason >= GAMBIT_MAX_ROUNDS ? PHASE_MAXED : PHASE_WAGER
  );
  const [wager, setWager] = useState(0);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [flavorText, setFlavorText] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [showScribesNote, setShowScribesNote] = useState(
    !gambitScribesNoteSeen
  );
  const [particles, setParticles] = useState([]);
  const [shaking, setShaking] = useState(false);
  const [showVignette, setShowVignette] = useState(false);
  const [goldFlash, setGoldFlash] = useState(false);
  const [revealText, setRevealText] = useState("");

  const handleDismissScribesNote = useCallback(() => {
    setShowScribesNote(false);
    onScribesNoteSeen();
  }, [onScribesNoteSeen]);

  const handleWager = useCallback((amount) => {
    setWager(amount);
    setPhase(PHASE_CHOICE);
  }, []);

  const handleChoice = useCallback(
    (weaponKey) => {
      setPlayerChoice(weaponKey);
      onSetLast(weaponKey);

      // Gold border flash on selection
      setGoldFlash(true);
      setTimeout(() => setGoldFlash(false), 400);

      // Dramatic pause
      setRevealText("The stranger reaches for...");
      setPhase(PHASE_REVEAL);

      const opponent = pickOpponentWeapon(gambitLastChoice);

      setTimeout(() => {
        setOpponentChoice(opponent);
        const result = resolveRound(weaponKey, opponent);
        setOutcome(result);

        if (result === "win") {
          setFlavorText(pickLine(GAMBIT_WIN_LINES));
          setReasonText(GAMBIT_WEAPONS[weaponKey].reason);
          setParticles(makeParticles(8));
        } else if (result === "lose") {
          setFlavorText(pickLine(GAMBIT_LOSE_LINES));
          setReasonText(GAMBIT_WEAPONS[opponent].reason);
          setShaking(true);
          setShowVignette(true);
          setTimeout(() => setShaking(false), 300);
          setTimeout(() => setShowVignette(false), 600);
        } else {
          setFlavorText(pickLine(GAMBIT_DRAW_LINES));
          setReasonText("");
        }

        setRevealText("");
        setPhase(PHASE_RESULT);

        // Dispatch result to parent
        onResult(result, wager);
      }, 800);
    },
    [gambitLastChoice, wager, onResult, onSetLast]
  );

  const handlePlayAgain = useCallback(() => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setOutcome(null);
    setFlavorText("");
    setReasonText("");
    setParticles([]);
    setWager(0);

    if (gambitRoundsThisSeason + 1 >= GAMBIT_MAX_ROUNDS) {
      setPhase(PHASE_MAXED);
    } else {
      setPhase(PHASE_WAGER);
    }
  }, [gambitRoundsThisSeason]);

  const roundsLeft = GAMBIT_MAX_ROUNDS - gambitRoundsThisSeason;

  // ---- Scribe's Note overlay ----
  if (showScribesNote) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: "#1a1208", minHeight: "300px" }}
      >
        <div
          className="max-w-md rounded-lg border-2 p-5"
          style={{
            backgroundColor: "rgba(196, 162, 74, 0.12)",
            borderColor: "#8a7a3a",
          }}
        >
          <h3
            className="text-sm uppercase tracking-widest mb-3"
            style={{ fontFamily: "Cinzel, serif", color: "#c4a24a" }}
          >
            Scribe's Note
          </h3>
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: "#a89070", fontStyle: "italic" }}
          >
            {GAMBIT_SCRIBES_NOTE}
          </p>
          <button
            onClick={handleDismissScribesNote}
            className="w-full py-2 rounded border cursor-pointer"
            style={{
              backgroundColor: "#2a2318",
              borderColor: "#c4a24a",
              color: "#c4a24a",
              fontFamily: "Cinzel, serif",
              fontSize: "0.85rem",
              transition: "background-color 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#3a3020";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#2a2318";
            }}
          >
            I understand
          </button>
        </div>
      </div>
    );
  }

  // ---- Max rounds reached ----
  if (phase === PHASE_MAXED) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: "#1a1208", minHeight: "300px" }}
      >
        <p
          className="text-lg mb-4"
          style={{
            fontFamily: "Cinzel, serif",
            color: "#a89070",
            fontStyle: "italic",
          }}
        >
          "Enough for one night, my lord."
        </p>
        <p className="text-sm mb-6" style={{ color: "#6a5a42" }}>
          The stranger gathers his things and melts into the crowd.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2 rounded border cursor-pointer"
          style={{
            backgroundColor: "#2a2318",
            borderColor: "#6a5a42",
            color: "#c8b090",
            fontFamily: "Cinzel, serif",
            fontSize: "0.85rem",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#c4a24a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#6a5a42";
          }}
        >
          Return to Tavern
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center p-4 sm:p-6 ${shaking ? "tavern-shake" : ""}`}
      style={{ backgroundColor: "#1a1208", minHeight: "360px" }}
    >
      {/* Red vignette overlay on loss */}
      {showVignette && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(198, 40, 40, 0.35) 100%)",
            animation: "red-vignette 600ms ease forwards",
            zIndex: 20,
          }}
        />
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <h2
          className="text-xl sm:text-2xl font-bold mb-1"
          style={{ fontFamily: "Cinzel, serif", color: "#e8c44a" }}
        >
          Knight's Gambit
        </h2>
        <p className="text-xs" style={{ color: "#6a5a42" }}>
          Round {Math.min(gambitRoundsThisSeason + 1, GAMBIT_MAX_ROUNDS)} of{" "}
          {GAMBIT_MAX_ROUNDS}
          {" | "}
          <span style={{ color: "#c4a24a" }}>{denarii}d</span> in purse
        </p>
      </div>

      {/* ---- WAGER PHASE ---- */}
      {phase === PHASE_WAGER && (
        <div className="flex flex-col items-center w-full max-w-sm tab-fade-in">
          <p
            className="text-sm mb-4 text-center"
            style={{ color: "#a89070" }}
          >
            The stranger lays his coins on the table. How much will you wager?
          </p>
          <div className="grid grid-cols-2 gap-3 w-full">
            {GAMBIT_WAGERS.map((amount) => {
              const canAfford = denarii >= amount;
              return (
                <button
                  key={amount}
                  onClick={() => canAfford && handleWager(amount)}
                  disabled={!canAfford}
                  className="py-3 rounded border-2 cursor-pointer"
                  style={{
                    backgroundColor: canAfford ? "#2a2318" : "#1a1610",
                    borderColor: canAfford ? "#8a7a3a" : "#3a3020",
                    color: canAfford ? "#c4a24a" : "#4a4030",
                    fontFamily: "Cinzel, serif",
                    fontSize: "1rem",
                    opacity: canAfford ? 1 : 0.5,
                    cursor: canAfford ? "pointer" : "not-allowed",
                    transition: "all 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (canAfford) {
                      e.currentTarget.style.backgroundColor = "#3a3020";
                      e.currentTarget.style.borderColor = "#c4a24a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canAfford) {
                      e.currentTarget.style.backgroundColor = "#2a2318";
                      e.currentTarget.style.borderColor = "#8a7a3a";
                    }
                  }}
                >
                  {amount}d
                </button>
              );
            })}
          </div>
          <button
            onClick={onBack}
            className="mt-4 text-xs cursor-pointer"
            style={{
              color: "#6a5a42",
              background: "none",
              border: "none",
              textDecoration: "underline",
              transition: "color 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#a89070";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#6a5a42";
            }}
          >
            Leave the table
          </button>
        </div>
      )}

      {/* ---- CHOICE PHASE ---- */}
      {phase === PHASE_CHOICE && (
        <div className="flex flex-col items-center w-full max-w-md tab-fade-in">
          <p className="text-sm mb-1 text-center" style={{ color: "#a89070" }}>
            Choose your weapon.
          </p>
          <p className="text-xs mb-4 text-center" style={{ color: "#6a5a42" }}>
            Wager: {wager}d
          </p>
          <div className="flex gap-3 sm:gap-4 justify-center">
            {WEAPON_KEYS.map((key) => {
              const weapon = GAMBIT_WEAPONS[key];
              return (
                <button
                  key={key}
                  onClick={() => handleChoice(key)}
                  className="flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer"
                  style={{
                    width: "120px",
                    height: "160px",
                    backgroundColor: "#1a1610",
                    borderColor: "#6a5a42",
                    color: "#c8b090",
                    transition: "all 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#8b1a1a";
                    e.currentTarget.style.boxShadow =
                      "0 0 16px rgba(139, 26, 26, 0.4)";
                    e.currentTarget.style.backgroundColor = "#221a12";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#6a5a42";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.backgroundColor = "#1a1610";
                  }}
                  aria-label={`Choose ${weapon.name}`}
                >
                  <span
                    className="block mb-2"
                    style={{ fontSize: "2.5rem", lineHeight: 1 }}
                  >
                    {weapon.symbol}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "Cinzel, serif", color: "#a89070" }}
                  >
                    {weapon.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- REVEAL PHASE (dramatic pause) ---- */}
      {phase === PHASE_REVEAL && (
        <div className="flex flex-col items-center justify-center w-full py-8 tab-fade-in">
          <p
            className="text-base"
            style={{
              fontFamily: "Cinzel, serif",
              color: "#a89070",
              fontStyle: "italic",
            }}
          >
            {revealText}
          </p>
        </div>
      )}

      {/* ---- RESULT PHASE ---- */}
      {phase === PHASE_RESULT && playerChoice && opponentChoice && (
        <div className="flex flex-col items-center w-full max-w-md tab-fade-in">
          {/* Side by side reveal */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 mb-4">
            {/* Player card */}
            <div className="flex flex-col items-center">
              <p
                className="text-xs mb-1 uppercase tracking-wider"
                style={{ color: "#6a5a42" }}
              >
                You
              </p>
              <div
                className="flex items-center justify-center rounded-lg border-2"
                style={{
                  width: "100px",
                  height: "130px",
                  backgroundColor: "#1a1610",
                  borderColor:
                    outcome === "win"
                      ? "#c4a24a"
                      : outcome === "lose"
                        ? "#c62828"
                        : "#2962a8",
                  boxShadow:
                    outcome === "win"
                      ? goldFlash
                        ? "0 0 24px rgba(196, 162, 74, 0.6)"
                        : "0 0 12px rgba(196, 162, 74, 0.3)"
                      : outcome === "lose"
                        ? "0 0 12px rgba(198, 40, 40, 0.3)"
                        : "0 0 12px rgba(41, 98, 168, 0.3)",
                  transition: "box-shadow 300ms ease",
                }}
              >
                <span style={{ fontSize: "2.2rem" }}>
                  {GAMBIT_WEAPONS[playerChoice].symbol}
                </span>
              </div>
              <p
                className="text-xs mt-1"
                style={{
                  fontFamily: "Cinzel, serif",
                  color: "#a89070",
                }}
              >
                {GAMBIT_WEAPONS[playerChoice].name}
              </p>
            </div>

            {/* VS */}
            <span
              className="text-lg font-bold"
              style={{ fontFamily: "Cinzel, serif", color: "#6a5a42" }}
            >
              vs
            </span>

            {/* Opponent card — flips in */}
            <div className="flex flex-col items-center">
              <p
                className="text-xs mb-1 uppercase tracking-wider"
                style={{ color: "#6a5a42" }}
              >
                Stranger
              </p>
              <div
                className="flex items-center justify-center rounded-lg border-2 gambit-flip"
                style={{
                  width: "100px",
                  height: "130px",
                  backgroundColor: "#1a1610",
                  borderColor:
                    outcome === "lose"
                      ? "#c4a24a"
                      : outcome === "win"
                        ? "#c62828"
                        : "#2962a8",
                  boxShadow:
                    outcome === "lose"
                      ? "0 0 12px rgba(196, 162, 74, 0.3)"
                      : outcome === "win"
                        ? "0 0 12px rgba(198, 40, 40, 0.3)"
                        : "0 0 12px rgba(41, 98, 168, 0.3)",
                }}
              >
                <span style={{ fontSize: "2.2rem" }}>
                  {GAMBIT_WEAPONS[opponentChoice].symbol}
                </span>
              </div>
              <p
                className="text-xs mt-1"
                style={{
                  fontFamily: "Cinzel, serif",
                  color: "#a89070",
                }}
              >
                {GAMBIT_WEAPONS[opponentChoice].name}
              </p>
            </div>
          </div>

          {/* Outcome banner */}
          <div className="relative text-center mb-1">
            <p
              className="text-xl font-bold"
              style={{
                fontFamily: "Cinzel, serif",
                color:
                  outcome === "win"
                    ? "#e8c44a"
                    : outcome === "lose"
                      ? "#c62828"
                      : "#2962a8",
              }}
            >
              {outcome === "win"
                ? "VICTORY"
                : outcome === "lose"
                  ? "DEFEAT"
                  : "DRAW"}
            </p>

            {/* Gold particles on win */}
            {outcome === "win" &&
              particles.map((p) => (
                <div
                  key={p.id}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: "#e8c44a",
                    borderRadius: "1px",
                    pointerEvents: "none",
                    animation: "gold-burst 800ms ease forwards",
                    "--tx": `${p.tx}px`,
                    "--ty": `${p.ty}px`,
                  }}
                />
              ))}
          </div>

          {/* Win/lose amount float */}
          {outcome === "win" && (
            <p
              className="text-lg font-bold win-float"
              style={{ color: "#e8c44a" }}
            >
              +{wager}d
            </p>
          )}
          {outcome === "lose" && (
            <p
              className="text-lg font-bold win-float"
              style={{ color: "#c62828" }}
            >
              -{wager}d
            </p>
          )}
          {outcome === "draw" && (
            <p className="text-sm" style={{ color: "#2962a8" }}>
              DRAW -- coins returned
            </p>
          )}

          {/* Flavor text */}
          <p
            className="text-sm mt-2 text-center"
            style={{ color: "#a89070", fontStyle: "italic" }}
          >
            {flavorText}
          </p>
          {reasonText && (
            <p
              className="text-xs mt-1 text-center"
              style={{ color: "#6a5a42" }}
            >
              {reasonText}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-5">
            {roundsLeft > 1 && (
              <button
                onClick={handlePlayAgain}
                className="px-5 py-2 rounded border-2 cursor-pointer"
                style={{
                  backgroundColor: "#2a2318",
                  borderColor: "#8a7a3a",
                  color: "#c4a24a",
                  fontFamily: "Cinzel, serif",
                  fontSize: "0.85rem",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#3a3020";
                  e.currentTarget.style.borderColor = "#c4a24a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#2a2318";
                  e.currentTarget.style.borderColor = "#8a7a3a";
                }}
              >
                Another Round
              </button>
            )}
            <button
              onClick={onBack}
              className="px-5 py-2 rounded border cursor-pointer"
              style={{
                backgroundColor: "transparent",
                borderColor: "#6a5a42",
                color: "#a89070",
                fontFamily: "Cinzel, serif",
                fontSize: "0.85rem",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#a89070";
                e.currentTarget.style.color = "#c8b090";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#6a5a42";
                e.currentTarget.style.color = "#a89070";
              }}
            >
              Walk Away
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
