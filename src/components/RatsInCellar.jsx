import { useState, useEffect, useRef, useCallback } from "react";
import {
  RATS_DURATION_MS,
  RATS_GRID_SIZE,
  RATS_RATINGS,
  RATS_SCRIBES_NOTE,
} from "../data/tavern";
import ScribesNote from "./ScribesNote";

const TOTAL_CELLS = RATS_GRID_SIZE * RATS_GRID_SIZE;

// Rat SVG silhouette -- simple dark shape with ears
function RatSilhouette() {
  return (
    <svg
      width="40"
      height="36"
      viewBox="0 0 40 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="rat-appear"
      style={{ display: "block", margin: "auto" }}
    >
      {/* Left ear */}
      <ellipse cx="11" cy="8" rx="5" ry="6" fill="#1a1610" />
      {/* Right ear */}
      <ellipse cx="29" cy="8" rx="5" ry="6" fill="#1a1610" />
      {/* Head */}
      <ellipse cx="20" cy="14" rx="10" ry="8" fill="#1a1610" />
      {/* Body */}
      <ellipse cx="20" cy="24" rx="12" ry="10" fill="#1a1610" />
      {/* Eye left */}
      <circle cx="16" cy="12" r="1.5" fill="#c62828" />
      {/* Eye right */}
      <circle cx="24" cy="12" r="1.5" fill="#c62828" />
      {/* Nose */}
      <circle cx="20" cy="16" r="1" fill="#6a5a42" />
      {/* Tail */}
      <path
        d="M32 26 Q38 22 36 16"
        stroke="#1a1610"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Subtle variation in stone tile color per cell index
function tileBg(index) {
  const variations = [
    "#2a2218",
    "#272016",
    "#2c2419",
    "#25201a",
    "#29231b",
    "#2b2117",
    "#26201c",
    "#2d251a",
  ];
  return variations[index % variations.length];
}

// Returns the visibility window (ms) for a rat based on elapsed time
function getVisibilityWindow(elapsedMs) {
  if (elapsedMs < 7000) return 1500;
  if (elapsedMs < 14000) return 1000;
  return 700;
}

// Returns a random spawn delay between 1000-1500ms
function randomSpawnDelay() {
  return 1000 + Math.random() * 500;
}

// Determine rating from caught count
function getRating(caught) {
  for (const r of RATS_RATINGS) {
    if (caught >= r.min && caught <= r.max) return r;
  }
  return RATS_RATINGS[RATS_RATINGS.length - 1];
}

// ---- PHASES ----
const PHASE_INTRO = "intro";
const PHASE_COUNTDOWN = "countdown";
const PHASE_ACTIVE = "active";
const PHASE_RESULTS = "results";

export default function RatsInCellar({
  food: _food,
  ratsPlayedThisSeason,
  ratsScribesNoteSeen,
  onResult,
  onScribesNoteSeen,
  onBack,
}) {
  void _food; // Accepted prop for future use; avoids unused-var lint error

  const [phase, setPhase] = useState(PHASE_INTRO);
  const [countdownNum, setCountdownNum] = useState(3);
  const [showScribesNote, setShowScribesNote] = useState(
    () => !ratsScribesNoteSeen
  );

  // Active game state
  const [caught, setCaught] = useState(0);
  const [escaped, setEscaped] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Active rat: { cellIndex, spawnedAt }
  const [activeRat, setActiveRat] = useState(null);
  // Cell flash effects: Map<cellIndex, {type: "green"|"red", id}>
  const [cellFlashes, setCellFlashes] = useState({});
  // Float-up texts: [{id, cellIndex, text}]
  const [floatTexts, setFloatTexts] = useState([]);

  const startTimeRef = useRef(null);
  const ratTimerRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastRatCellRef = useRef(-1);
  const floatIdRef = useRef(0);

  // ---- COUNTDOWN LOGIC ----
  // When countdown reaches 0, transition to active on the next tick via timeout
  useEffect(() => {
    if (phase !== PHASE_COUNTDOWN) return;
    const t = setTimeout(() => {
      if (countdownNum <= 0) {
        setPhase(PHASE_ACTIVE);
      } else {
        setCountdownNum((n) => n - 1);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdownNum]);

  // ---- Add a cell flash effect ----
  const addCellFlash = useCallback((cellIndex, type) => {
    const id = Date.now() + Math.random();
    setCellFlashes((prev) => ({ ...prev, [cellIndex]: { type, id } }));
    setTimeout(() => {
      setCellFlashes((prev) => {
        const next = { ...prev };
        if (next[cellIndex]?.id === id) delete next[cellIndex];
        return next;
      });
    }, 400);
  }, []);

  // ---- Add a float-up text ----
  const addFloatText = useCallback((cellIndex, text) => {
    const id = ++floatIdRef.current;
    setFloatTexts((prev) => [...prev, { id, cellIndex, text }]);
    setTimeout(() => {
      setFloatTexts((prev) => prev.filter((f) => f.id !== id));
    }, 800);
  }, []);

  // ---- Spawn a new rat ----
  const spawnRat = useCallback(
    (elapsed) => {
      let cell;
      do {
        cell = Math.floor(Math.random() * TOTAL_CELLS);
      } while (cell === lastRatCellRef.current);
      lastRatCellRef.current = cell;

      const visibility = getVisibilityWindow(elapsed);

      setActiveRat({ cellIndex: cell, spawnedAt: Date.now() });

      // Schedule despawn (escape) if not caught
      clearTimeout(ratTimerRef.current);
      ratTimerRef.current = setTimeout(() => {
        // Rat escaped
        setActiveRat(null);
        setEscaped((e) => e + 1);
        addCellFlash(cell, "red");
        addFloatText(cell, "-2 food");
      }, visibility);
    },
    [addCellFlash, addFloatText]
  );

  // ---- ACTIVE PHASE: game loop ----
  useEffect(() => {
    if (phase !== PHASE_ACTIVE) return;

    startTimeRef.current = Date.now();

    // Timer update loop
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      setElapsedMs(elapsed);

      if (elapsed >= RATS_DURATION_MS) {
        // Time's up — end the game
        clearTimeout(ratTimerRef.current);
        clearTimeout(spawnTimerRef.current);
        setActiveRat(null);
        setPhase(PHASE_RESULTS);
        return;
      }
      animFrameRef.current = requestAnimationFrame(updateTimer);
    };
    animFrameRef.current = requestAnimationFrame(updateTimer);

    // Start spawning rats
    const scheduleSpawn = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= RATS_DURATION_MS) return;
      spawnRat(elapsed);
      spawnTimerRef.current = setTimeout(scheduleSpawn, randomSpawnDelay());
    };
    // First rat after a short delay
    spawnTimerRef.current = setTimeout(scheduleSpawn, 500);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(ratTimerRef.current);
      clearTimeout(spawnTimerRef.current);
    };
  }, [phase, spawnRat]);

  // ---- CLICK HANDLERS ----
  const handleCellClick = useCallback(
    (cellIndex) => {
      if (phase !== PHASE_ACTIVE) return;
      setTotalClicks((c) => c + 1);

      if (activeRat && activeRat.cellIndex === cellIndex) {
        // Caught the rat
        clearTimeout(ratTimerRef.current);
        setCaught((c) => c + 1);
        addCellFlash(cellIndex, "green");
        setActiveRat(null);
      } else {
        // Miss — brief feedback
        addFloatText(cellIndex, "Miss!");
      }
    },
    [phase, activeRat, addCellFlash, addFloatText]
  );

  // ---- RESULTS LOGIC ----
  const rating = getRating(caught);
  const accuracy =
    totalClicks > 0 ? Math.round((caught / totalClicks) * 100) : 0;
  const foodLost = escaped * (rating?.foodPerEscape ?? 2);
  const reward = rating?.reward ?? 0;

  const handleFinish = useCallback(() => {
    onResult({
      caught,
      escaped,
      foodLost,
      reward,
    });
  }, [caught, escaped, foodLost, reward, onResult]);

  // ---- Timer bar values ----
  const timerFraction = Math.min(elapsedMs / RATS_DURATION_MS, 1);
  const timerColor =
    timerFraction < 0.5
      ? "#4a8a3a"
      : timerFraction < 0.8
        ? "#c4a24a"
        : "#c62828";

  // ---- RENDER ----

  // Scribe's note overlay
  if (showScribesNote) {
    return (
      <ScribesNote
        text={RATS_SCRIBES_NOTE}
        onDismiss={() => {
          setShowScribesNote(false);
          onScribesNoteSeen();
        }}
      />
    );
  }

  // Already played this season
  if (ratsPlayedThisSeason && phase === PHASE_INTRO) {
    return (
      <div
        className="mx-auto w-full max-w-md rounded-lg border-2 p-5 text-center"
        style={{
          backgroundColor: "#231e16",
          borderColor: "#6a5a42",
        }}
      >
        <p className="text-base mb-4" style={{ color: "#a89070" }}>
          The cellar has been cleared for this season.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-md border-2 font-heading font-semibold text-sm uppercase tracking-wider cursor-pointer"
          style={{
            backgroundColor: "#2a2318",
            borderColor: "#6a5a42",
            color: "#a89070",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#3a3228";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2318";
          }}
        >
          Return to Tavern
        </button>
      </div>
    );
  }

  // INTRO
  if (phase === PHASE_INTRO) {
    return (
      <div
        className="mx-auto w-full max-w-md rounded-lg border-2 p-5"
        style={{
          backgroundColor: "#231e16",
          borderColor: "#8a7a3a",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        }}
      >
        <h3
          className="font-heading text-lg font-bold mb-3 text-center"
          style={{ fontFamily: "Cinzel, serif", color: "#e8c44a" }}
        >
          Rats in the Cellar
        </h3>
        <p className="text-base leading-relaxed mb-4" style={{ color: "#a89070" }}>
          "Rats in the grain stores again, my lord! Help me catch them before
          they ruin everything!"
        </p>
        <p className="text-sm mb-4" style={{ color: "#6a5a42" }}>
          Click the rats before they escape. They get faster as time goes on.
          Every rat that escapes steals your food.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setPhase(PHASE_COUNTDOWN);
              setCountdownNum(3);
            }}
            className="px-6 py-3 rounded-md border-2 font-heading font-semibold text-sm uppercase tracking-wider cursor-pointer"
            style={{
              backgroundColor: "#4a8a3a",
              borderColor: "#4a8a3a",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#5a9a4a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4a8a3a";
            }}
          >
            Ready!
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-md border-2 font-heading font-semibold text-sm uppercase tracking-wider cursor-pointer"
            style={{
              backgroundColor: "#2a2318",
              borderColor: "#6a5a42",
              color: "#a89070",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#3a3228";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#2a2318";
            }}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  // COUNTDOWN
  if (phase === PHASE_COUNTDOWN) {
    return (
      <div
        className="mx-auto w-full max-w-md rounded-lg border-2 p-5 flex flex-col items-center justify-center"
        style={{
          backgroundColor: "#231e16",
          borderColor: "#8a7a3a",
          minHeight: "320px",
        }}
      >
        <p className="text-base mb-4" style={{ color: "#a89070" }}>
          {countdownNum > 0 ? "Ready..." : ""}
        </p>
        <div
          key={countdownNum}
          className="tab-fade-in"
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: countdownNum > 0 ? "5rem" : "2.5rem",
            fontWeight: "bold",
            color: countdownNum > 0 ? "#e8c44a" : "#4a8a3a",
            lineHeight: 1,
          }}
        >
          {countdownNum > 0 ? countdownNum : "GO!"}
        </div>
      </div>
    );
  }

  // RESULTS
  if (phase === PHASE_RESULTS) {
    return (
      <div
        className="mx-auto w-full max-w-md rounded-lg border-2 p-5"
        style={{
          backgroundColor: "#231e16",
          borderColor: "#8a7a3a",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        }}
      >
        <h3
          className="font-heading text-lg font-bold mb-1 text-center"
          style={{ fontFamily: "Cinzel, serif", color: "#e8c44a" }}
        >
          Cellar Cleared
        </h3>
        <p
          className="text-center text-base mb-4"
          style={{ color: "#a89070" }}
        >
          {rating.label}
        </p>

        <div
          className="rounded-md p-4 mb-4 grid grid-cols-3 gap-y-3 text-center"
          style={{ backgroundColor: "#1a1610" }}
        >
          <div>
            <div
              className="text-2xl font-bold"
              style={{ color: "#4a8a3a" }}
            >
              {caught}
            </div>
            <div className="text-xs" style={{ color: "#6a5a42" }}>
              Caught
            </div>
          </div>
          <div>
            <div
              className="text-2xl font-bold"
              style={{ color: "#c62828" }}
            >
              {escaped}
            </div>
            <div className="text-xs" style={{ color: "#6a5a42" }}>
              Escaped
            </div>
          </div>
          <div>
            <div
              className="text-2xl font-bold"
              style={{ color: "#a89070" }}
            >
              {accuracy}%
            </div>
            <div className="text-xs" style={{ color: "#6a5a42" }}>
              Accuracy
            </div>
          </div>
        </div>

        {/* Consequences */}
        <div className="flex flex-col gap-2 mb-4">
          {foodLost > 0 && (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-md"
              style={{ backgroundColor: "rgba(198, 40, 40, 0.1)" }}
            >
              <span className="text-sm" style={{ color: "#c62828" }}>
                Food stolen by rats
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: "#c62828" }}
              >
                -{foodLost} food
              </span>
            </div>
          )}
          {reward > 0 && (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-md"
              style={{ backgroundColor: "rgba(196, 162, 74, 0.1)" }}
            >
              <span className="text-sm" style={{ color: "#c4a24a" }}>
                Tavern keeper's reward
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: "#c4a24a" }}
              >
                +{reward}d
              </span>
            </div>
          )}
          {foodLost === 0 && reward === 0 && (
            <div
              className="flex items-center justify-center px-3 py-2 rounded-md"
              style={{ backgroundColor: "rgba(74, 138, 58, 0.1)" }}
            >
              <span className="text-sm" style={{ color: "#4a8a3a" }}>
                No food lost, but no reward earned.
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleFinish}
          className="w-full py-3 rounded-md border-2 font-heading font-semibold text-sm uppercase tracking-wider cursor-pointer"
          style={{
            backgroundColor: "#2a2318",
            borderColor: "#c4a24a",
            color: "#c4a24a",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#3a3228";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2318";
          }}
        >
          Collect and Return
        </button>
      </div>
    );
  }

  // ---- ACTIVE PHASE ----
  return (
    <div
      className="mx-auto w-full max-w-md rounded-lg border-2 p-3"
      style={{
        backgroundColor: "#1a1610",
        borderColor: "#8a7a3a",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* HUD */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-bold" style={{ color: "#4a8a3a" }}>
          Caught: {caught}
        </span>
        <span
          className="text-xs font-heading font-semibold"
          style={{ color: "#a89070", fontFamily: "Cinzel, serif" }}
        >
          {Math.max(0, Math.ceil((RATS_DURATION_MS - elapsedMs) / 1000))}s
        </span>
        <span className="text-sm font-bold" style={{ color: "#c62828" }}>
          Lost: {escaped * 2} food
        </span>
      </div>

      {/* Timer bar */}
      <div
        className="w-full rounded-full mb-3 overflow-hidden"
        style={{ height: "6px", backgroundColor: "#0f0d0a" }}
      >
        <div
          style={{
            width: `${(1 - timerFraction) * 100}%`,
            height: "100%",
            backgroundColor: timerColor,
            borderRadius: "9999px",
            transition: "width 100ms linear, background-color 500ms ease",
          }}
        />
      </div>

      {/* 4x4 Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${RATS_GRID_SIZE}, 1fr)`,
          gap: "4px",
          userSelect: "none",
        }}
      >
        {Array.from({ length: TOTAL_CELLS }, (_, i) => {
          const hasRat = activeRat?.cellIndex === i;
          const flash = cellFlashes[i];
          const floatsHere = floatTexts.filter((f) => f.cellIndex === i);

          // Flash animation name
          let flashAnim = "none";
          if (flash?.type === "green") {
            flashAnim = "cell-flash-green 400ms ease forwards";
          } else if (flash?.type === "red") {
            flashAnim = "cell-flash-red 400ms ease forwards";
          }

          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                maxWidth: "80px",
                backgroundColor: tileBg(i),
                border: "1px solid #1a1610",
                borderRadius: "4px",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: flashAnim,
                backgroundImage:
                  "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                outline: "none",
                padding: 0,
              }}
              aria-label={
                hasRat ? `Rat in cell ${i + 1}` : `Empty cell ${i + 1}`
              }
            >
              {hasRat && <RatSilhouette />}

              {/* Float-up texts */}
              {floatsHere.map((ft) => (
                <span
                  key={ft.id}
                  className="float-up"
                  style={{
                    position: "absolute",
                    top: "20%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    color:
                      ft.text === "Miss!" ? "#6a5a42" : "#c62828",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ft.text}
                </span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
