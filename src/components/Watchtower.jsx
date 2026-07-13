/**
 * Watchtower.jsx
 *
 * The Watchtower — military pillar made spatial.
 * Interactive location with Horizon Scan mini-game, Captain Roderic NPC,
 * Defense Status panel, and Signal Fire Log.
 *
 * Rendered as an overlay within the Map tab (same pattern as Tavern).
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  WATCHTOWER_SUBTITLES,
  RODERIC_DEFENSE_ASSESSMENTS,
  RODERIC_HISTORICAL_LESSONS,
  RODERIC_STRATEGIC_TIPS,
  RODERIC_SCRIBES_NOTE,
  SCAN_SCRIBES_NOTE,
  ANOMALY_TYPES,
  SCAN_RATINGS,
  SCAN_DURATION_SECONDS,
  SCAN_MIN_ANOMALIES,
  SCAN_MAX_ANOMALIES,
  FOREIGN_TRADERS,
} from "../data/watchtower";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRating(found) {
  return SCAN_RATINGS.find((r) => found >= r.min && found <= r.max) || SCAN_RATINGS[0];
}

// ---------------------------------------------------------------------------
// Watchtower Header
// ---------------------------------------------------------------------------

function WatchtowerHeader({ subtitle }) {
  return (
    <div className="text-center mb-4">
      <h2
        className="text-xl sm:text-2xl font-bold uppercase tracking-widest"
        style={{
          fontFamily: "Cinzel Decorative, Cinzel, serif",
          color: "var(--gold, #c4a24a)",
          textShadow: "0 0 12px rgba(196, 162, 74, 0.25)",
          letterSpacing: "3px",
        }}
      >
        The Watchtower
      </h2>
      <p
        className="mt-1 italic text-sm"
        style={{ color: "#8090a0", fontFamily: "Crimson Text, serif" }}
      >
        &ldquo;{subtitle}&rdquo;
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizon Scan — SVG Landscape Scene
// ---------------------------------------------------------------------------

function LandscapeScene({ anomalies, onClickAnomaly, timeLeft, scanActive, scanDone }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border-2"
      style={{
        height: "250px",
        borderColor: scanDone ? "var(--gold, #c4a24a)" : "#2a3040",
        transition: "border-color 300ms",
      }}
    >
      {/* Sky gradient */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #1a2040 0%, #3a4a60 35%, #6a5a40 42%, #3a4a2a 43%, #2a3a1a 100%)",
        }}
      />

      {/* Distant hills — layer 1 */}
      <svg
        viewBox="0 0 700 250"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        preserveAspectRatio="none"
      >
        {/* Hill silhouettes */}
        <path
          d="M0,120 Q80,85 160,105 Q240,75 350,95 Q420,60 500,90 Q580,70 700,100 L700,130 L0,130 Z"
          fill="#2a3a2a"
          opacity="0.8"
        />
        <path
          d="M0,115 Q100,95 200,110 Q300,80 400,100 Q520,75 620,95 Q680,85 700,105 L700,135 L0,135 Z"
          fill="#1a2a1a"
          opacity="0.7"
        />

        {/* Tree line */}
        <path
          d="M0,125 L20,115 L25,125 L35,110 L40,125 L55,112 L60,125 L75,108 L80,125 L95,114 L100,125 L115,109 L120,125 L140,113 L145,125 L160,107 L165,125 L185,111 L190,125 L210,108 L215,125 L235,112 L240,125 L260,106 L265,125 L280,113 L285,125 L305,109 L310,125 L330,114 L335,125 L355,108 L360,125 L380,112 L385,125 L400,107 L405,125 L425,114 L430,125 L450,109 L455,125 L475,113 L480,125 L500,108 L505,125 L525,112 L530,125 L550,107 L555,125 L575,114 L580,125 L600,109 L605,125 L620,113 L625,125 L645,108 L650,125 L670,114 L675,125 L700,110 L700,135 L0,135 Z"
          fill="#1a3a1a"
          opacity="0.6"
        />

        {/* Fields — strip farming lines */}
        <g stroke="#3a4a2a" strokeWidth="0.5" opacity="0.3">
          <line x1="100" y1="155" x2="600" y2="155" />
          <line x1="80" y1="170" x2="620" y2="170" />
          <line x1="120" y1="185" x2="580" y2="185" />
          <line x1="90" y1="200" x2="610" y2="200" />
          <line x1="110" y1="215" x2="590" y2="215" />
        </g>

        {/* Road winding into distance */}
        <path
          d="M350,250 Q340,220 345,195 Q350,170 340,150 Q335,140 340,130"
          stroke="#5a4a3a"
          strokeWidth="3"
          fill="none"
          opacity="0.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Timer bar */}
      {scanActive && (
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "4px",
            backgroundColor: "#1a1a1a", zIndex: 20,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(timeLeft / SCAN_DURATION_SECONDS) * 100}%`,
              backgroundColor:
                timeLeft > 10 ? "var(--food-green, #4a8a3a)" :
                timeLeft > 5 ? "var(--gold, #c4a24a)" :
                "var(--danger-red, #c62828)",
              transition: "width 1s linear, background-color 500ms",
            }}
          />
        </div>
      )}

      {/* Anomalies */}
      {scanActive && anomalies.map((a) => (
        <AnomalyElement key={a.key} anomaly={a} onClick={() => onClickAnomaly(a.key)} />
      ))}

      {/* Scan done flash */}
      {scanDone && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 15,
            border: "3px solid var(--gold, #c4a24a)",
            borderRadius: "6px",
            animation: "watchtower-flash 600ms ease-out",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual anomaly elements
// ---------------------------------------------------------------------------

function AnomalyElement({ anomaly, onClick }) {
  const { type, x, y, found, missed } = anomaly;

  const baseStyle = {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
    cursor: found ? "default" : "pointer",
    zIndex: 10,
    transition: "box-shadow 200ms",
  };

  if (missed) {
    return (
      <div
        style={{
          ...baseStyle,
          opacity: 0,
          animation: "watchtower-missed 600ms ease-out",
          pointerEvents: "none",
        }}
      >
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "rgba(198, 40, 40, 0.6)" }} />
      </div>
    );
  }

  const highlight = found
    ? { boxShadow: "0 0 8px var(--gold, #c4a24a)", borderRadius: "50%" }
    : {};

  // Render different anomaly visuals based on type
  switch (type) {
    case "campfire":
      return (
        <div style={{ ...baseStyle, ...highlight }} onClick={!found ? onClick : undefined}>
          <div style={{ width: "30px", height: "40px", position: "relative" }}>
            {/* Smoke wisps */}
            <div style={{
              position: "absolute", left: "12px", bottom: "10px",
              width: "2px", height: "20px",
              background: "linear-gradient(to top, rgba(160,160,160,0.4), transparent)",
              animation: "watchtower-smoke 3s ease-out infinite",
            }} />
            <div style={{
              position: "absolute", left: "16px", bottom: "12px",
              width: "1.5px", height: "16px",
              background: "linear-gradient(to top, rgba(180,180,180,0.3), transparent)",
              animation: "watchtower-smoke 3s ease-out infinite 0.8s",
            }} />
          </div>
          {found && <AnomalyLabel text={anomaly.label} />}
        </div>
      );

    case "dust":
      return (
        <div style={{ ...baseStyle, ...highlight }} onClick={!found ? onClick : undefined}>
          <div style={{
            width: "28px", height: "14px",
            borderRadius: "50%",
            backgroundColor: "rgba(160, 130, 80, 0.35)",
            filter: "blur(3px)",
            animation: "watchtower-pulse 2.5s ease-in-out infinite",
          }} />
          {found && <AnomalyLabel text={anomaly.label} />}
        </div>
      );

    case "signal":
      return (
        <div style={{ ...baseStyle, ...highlight }} onClick={!found ? onClick : undefined}>
          <div style={{
            width: "10px", height: "10px",
            borderRadius: "50%",
            backgroundColor: "#c44a1a",
            animation: "watchtower-flicker 1.5s ease-in-out infinite",
            boxShadow: "0 0 6px rgba(196, 74, 26, 0.6)",
          }} />
          {found && <AnomalyLabel text={anomaly.label} />}
        </div>
      );

    case "wagon":
      return (
        <div style={{ ...baseStyle, ...highlight }} onClick={!found ? onClick : undefined}>
          <div style={{ position: "relative", width: "32px", height: "16px" }}>
            {/* Wagon body */}
            <div style={{
              width: "20px", height: "10px",
              backgroundColor: "#4a3a2a",
              border: "1px solid #3a2a1a",
              borderRadius: "1px",
              animation: "watchtower-wagon 12s linear infinite",
            }} />
            {/* Wheel */}
            <div style={{
              position: "absolute", bottom: "-2px", left: "4px",
              width: "6px", height: "6px",
              borderRadius: "50%",
              border: "1px solid #5a4a3a",
              backgroundColor: "#3a2a1a",
            }} />
          </div>
          {found && <AnomalyLabel text={anomaly.label} />}
        </div>
      );

    case "birds":
      return (
        <div style={{ ...baseStyle, ...highlight }} onClick={!found ? onClick : undefined}>
          <svg width="30" height="24" viewBox="0 0 30 24" style={{ overflow: "visible" }}>
            {/* V-shaped birds */}
            <path d="M4,16 L7,13 L10,16" stroke="#2a2a2a" strokeWidth="1.5" fill="none"
              style={{ animation: "watchtower-birds 4s ease-in-out infinite" }} />
            <path d="M14,12 L17,9 L20,12" stroke="#3a3a3a" strokeWidth="1.5" fill="none"
              style={{ animation: "watchtower-birds 4s ease-in-out infinite 0.5s" }} />
            <path d="M8,20 L11,17 L14,20" stroke="#2a2a2a" strokeWidth="1" fill="none"
              style={{ animation: "watchtower-birds 4s ease-in-out infinite 1.2s" }} />
            <path d="M20,14 L23,11 L26,14" stroke="#3a3a3a" strokeWidth="1" fill="none"
              style={{ animation: "watchtower-birds 4s ease-in-out infinite 0.8s" }} />
          </svg>
          {found && <AnomalyLabel text={anomaly.label} />}
        </div>
      );

    default:
      return null;
  }
}

function AnomalyLabel({ text }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        fontSize: "11px",
        fontFamily: "system-ui, sans-serif",
        color: "#fff",
        backgroundColor: "rgba(15, 13, 10, 0.85)",
        padding: "2px 6px",
        borderRadius: "3px",
        marginTop: "4px",
        zIndex: 25,
        animation: "watchtower-label-in 300ms ease-out",
      }}
    >
      {text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizon Scan — Main Mini-Game Component
// ---------------------------------------------------------------------------

function HorizonScan({ state, dispatch, onBack }) {
  const wt = state.watchtower ?? {};
  const scannedThisSeason = wt.scannedThisSeason ?? false;
  const [showScribesNote, setShowScribesNote] = useState(!(wt.scanScribesNoteSeen ?? false));
  const [phase, setPhase] = useState("ready"); // ready | scanning | report
  const [anomalies, setAnomalies] = useState([]);
  const anomaliesRef = useRef([]);
  const [timeLeft, setTimeLeft] = useState(SCAN_DURATION_SECONDS);
  const [report, setReport] = useState(null);
  const timerRef = useRef(null);

  // Generate anomalies
  const generateAnomalies = useCallback(() => {
    const count = SCAN_MIN_ANOMALIES + Math.floor(Math.random() * (SCAN_MAX_ANOMALIES - SCAN_MIN_ANOMALIES + 1));
    const pool = [...ANOMALY_TYPES];

    // Ensure at least 1 threat and 1 non-threat
    const threats = pool.filter((a) => a.category === "threat");
    const nonThreats = pool.filter((a) => a.category !== "threat");

    const selected = [];
    // 1 guaranteed threat
    selected.push(pickRandom(threats));
    // 1 guaranteed non-threat
    selected.push(pickRandom(nonThreats));

    // Fill remaining from full pool
    const remaining = pool.filter((a) => !selected.find((s) => s.id === a.id));
    const shuffled = shuffle(remaining);
    for (let i = 0; i < count - 2 && i < shuffled.length; i++) {
      selected.push(shuffled[i]);
    }

    // Position anomalies randomly, avoiding overlap
    const positioned = shuffle(selected).map((anomalyType, i) => {
      // Keep anomalies in the landscape area (hills/treeline: y 20-55%, fields: y 55-85%)
      // Avoid edges
      let x, y, attempts = 0;
      do {
        x = 8 + Math.random() * 84;
        y = anomalyType.id === "signal" ? (15 + Math.random() * 20) : // signals on hilltops
          anomalyType.id === "wagon" ? (55 + Math.random() * 25) : // wagons on road/fields
          (20 + Math.random() * 55); // others spread across
        attempts++;
      } while (attempts < 10); // simple positioning, no collision detection needed at this scale

      // Resolve ambiguous birds
      let resolvedThreat = false;
      if (anomalyType.id === "birds") {
        resolvedThreat = Math.random() < 0.5;
      }

      return {
        ...anomalyType,
        key: `${anomalyType.id}-${i}`,
        x,
        y,
        found: false,
        missed: false,
        resolvedThreat,
        label: anomalyType.label,
      };
    });

    return positioned;
  }, []);

  function startScan() {
    const newAnomalies = generateAnomalies();
    anomaliesRef.current = newAnomalies;
    setAnomalies(newAnomalies);
    setTimeLeft(SCAN_DURATION_SECONDS);
    setPhase("scanning");

    // Scribe's note on first scan
    if (showScribesNote) {
      dispatch({ type: "WATCHTOWER_SCAN_SCRIBES_NOTE_SEEN" });
      setShowScribesNote(false);
      dispatch({ type: "DISMISS_SCRIBES_NOTE" });
      // Show scribe's note via the main overlay
      // Actually, we'll dispatch it properly
    }
  }

  function handleClickAnomaly(key) {
    if (phase !== "scanning") return;
    const updated = anomaliesRef.current.map((a) => (a.key === key && !a.found ? { ...a, found: true } : a));
    anomaliesRef.current = updated;
    setAnomalies(updated);
  }

  function finishScan() {
    clearInterval(timerRef.current);

    const final = anomaliesRef.current.map((a) => (a.found ? a : { ...a, missed: true }));
    anomaliesRef.current = final;
    setAnomalies(final);

    const found = final.filter((a) => a.found);
    const missed = final.filter((a) => a.missed);
    const rating = getRating(found.length);

    // Build warnings from found anomalies
    const warnings = {
      criminalRaidBonus: 0,
      scottishRaidBonus: 0,
      raidRequirementReduction: 0,
      merchantPreview: null,
    };

    found.forEach((a) => {
      if (a.warningKey === "criminalRaidBonus") warnings.criminalRaidBonus = 2;
      else if (a.warningKey === "scottishRaidBonus") warnings.scottishRaidBonus = 2;
      else if (a.warningKey === "raidRequirementReduction") warnings.raidRequirementReduction = 2;
      else if (a.warningKey === "merchantPreview") {
        const trader = pickRandom(FOREIGN_TRADERS);
        warnings.merchantPreview = trader;
      }
      // Birds: if resolved as threat, add criminal bonus
      if (a.id === "birds" && a.resolvedThreat) {
        warnings.criminalRaidBonus = 2;
      }
    });

    const reportData = {
      total: final.length,
      found: found.length,
      missed: missed.length,
      threats: found.filter((a) => a.category === "threat" || (a.id === "birds" && a.resolvedThreat)).length,
      opportunities: found.filter((a) => a.category === "opportunity").length,
      foundList: found.map((a) => ({
        name: a.name,
        description: a.description,
        reward: a.reward,
        category: a.category,
        id: a.id,
        resolvedThreat: a.resolvedThreat,
      })),
      missedList: missed.map((a) => ({
        name: a.name,
        id: a.id,
      })),
      rating,
      warnings,
    };

    setReport(reportData);
    setPhase("report");
  }

  // Timer — use a ref to track remaining time so we don't nest state setters
  const timeLeftRef = useRef(SCAN_DURATION_SECONDS);

  useEffect(() => {
    if (phase !== "scanning") return;
    timeLeftRef.current = SCAN_DURATION_SECONDS;
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        finishScan();
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  function acknowledgeReport() {
    if (!report) return;

    dispatch({
      type: "WATCHTOWER_SCAN_COMPLETE",
      payload: {
        anomaliesTotal: report.total,
        anomaliesFound: report.found,
        rating: report.rating.label,
        denariiBonus: report.rating.denariiBonus,
        warnings: report.warnings,
        foundList: report.foundList,
        missedList: report.missedList,
      },
    });

    // Show scan scribe's note on first scan
    if (!(state.watchtower?.scanScribesNoteSeen)) {
      dispatch({ type: "DISMISS_SCRIBES_NOTE" }); // clear any existing
    }

    onBack();
  }

  // Already scanned
  if (scannedThisSeason) {
    return (
      <div className="max-w-xl mx-auto text-center py-8">
        <p
          className="text-base italic mb-4"
          style={{ color: "#8090a0", fontFamily: "Crimson Text, serif" }}
        >
          The horizon is quiet... for now.
        </p>
        <p className="text-xs" style={{ color: "#5a6a7a" }}>
          You have already scanned the horizon this season.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider"
          style={{
            backgroundColor: "#1a1820",
            color: "#8090a0",
            border: "1px solid #3a4050",
            fontFamily: "Cinzel, serif",
            cursor: "pointer",
          }}
        >
          Return
        </button>
      </div>
    );
  }

  // Ready to scan
  if (phase === "ready") {
    return (
      <div className="max-w-2xl mx-auto">
        <h3
          className="text-center text-lg font-bold mb-3 uppercase tracking-wide"
          style={{ fontFamily: "Cinzel, serif", color: "var(--gold, #c4a24a)" }}
        >
          {"\u2680"} Horizon Scan
        </h3>

        {/* First scan scribe's note */}
        {showScribesNote && (
          <div
            className="rounded-lg border p-3 mb-4"
            style={{ backgroundColor: "#1a2018", borderColor: "#4a6a3a" }}
          >
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#8a9a6a", fontFamily: "Cinzel, serif" }}
            >
              Scribe{"'"}s Note
            </h4>
            <p
              className="text-xs leading-relaxed italic"
              style={{ color: "#a8a080", fontFamily: "Crimson Text, serif" }}
            >
              {SCAN_SCRIBES_NOTE}
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "#8090a0", fontFamily: "Crimson Text, serif" }}>
            Survey the landscape for {SCAN_DURATION_SECONDS} seconds. Click any anomalies you spot
            on the horizon. Threats and opportunities appear small {"\u2014"} look carefully.
          </p>
          <button
            onClick={startScan}
            className="px-6 py-3 rounded-md border-2 font-bold text-sm uppercase tracking-wider"
            style={{
              background: "linear-gradient(135deg, #8b1a1a 0%, #4a0a0a 50%, #8b1a1a 100%)",
              border: "2px solid var(--gold, #c4a24a)",
              color: "#e8c44a",
              fontFamily: "Cinzel, serif",
              cursor: "pointer",
              letterSpacing: "2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #c62828 0%, #6a1010 50%, #c62828 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #8b1a1a 0%, #4a0a0a 50%, #8b1a1a 100%)";
            }}
          >
            Scan the Horizon
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={onBack}
            className="px-3 py-1 rounded text-xs"
            style={{
              backgroundColor: "#1a1820",
              color: "#6a7a8a",
              border: "1px solid #2a3040",
              cursor: "pointer",
            }}
          >
            Return
          </button>
        </div>
      </div>
    );
  }

  // Active scan
  if (phase === "scanning") {
    return (
      <div className="max-w-2xl mx-auto">
        <h3
          className="text-center text-sm font-bold mb-2 uppercase tracking-wide"
          style={{ fontFamily: "Cinzel, serif", color: "var(--gold, #c4a24a)" }}
        >
          Scanning... ({timeLeft}s)
        </h3>
        <LandscapeScene
          anomalies={anomalies}
          onClickAnomaly={handleClickAnomaly}
          timeLeft={timeLeft}
          scanActive={true}
          scanDone={false}
        />
        <p className="text-xs text-center mt-2 italic" style={{ color: "#6a7a8a" }}>
          Click anomalies on the landscape before time runs out.
        </p>
      </div>
    );
  }

  // Report
  if (phase === "report" && report) {
    return (
      <div className="max-w-xl mx-auto">
        <div
          className="rounded-lg border-2 p-4"
          style={{
            backgroundColor: "var(--bg-card, #231e16)",
            borderColor: "var(--gold, #c4a24a)",
          }}
        >
          <h3
            className="text-center text-lg font-bold mb-3 uppercase tracking-wide"
            style={{ fontFamily: "Cinzel, serif", color: "var(--gold, #c4a24a)" }}
          >
            Scout{"'"}s Report
          </h3>

          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm" style={{ color: "#a89070" }}>
            <div>
              <span style={{ color: "var(--gold-bright, #e8c44a)", fontWeight: "bold", fontSize: "1.2em" }}>
                {report.found}/{report.total}
              </span>
              <br />Spotted
            </div>
            <div>
              <span style={{ color: "var(--food-green, #4a8a3a)", fontWeight: "bold", fontSize: "1.2em" }}>
                {report.threats}
              </span>
              <br />Threats
            </div>
            <div>
              <span style={{ color: "#5a8aaa", fontWeight: "bold", fontSize: "1.2em" }}>
                {report.opportunities}
              </span>
              <br />Opportunities
            </div>
          </div>

          {/* Rating */}
          <div className="text-center mb-4">
            <span
              className="text-sm font-bold uppercase tracking-wider px-3 py-1 rounded"
              style={{
                backgroundColor:
                  report.rating.label === "Eagle-eyed" ? "rgba(74, 138, 58, 0.2)" :
                  report.rating.label === "Sharp-eyed" ? "rgba(196, 162, 74, 0.15)" :
                  "rgba(100, 120, 140, 0.15)",
                color:
                  report.rating.label === "Eagle-eyed" ? "var(--food-green, #4a8a3a)" :
                  report.rating.label === "Sharp-eyed" ? "var(--gold, #c4a24a)" :
                  "#8090a0",
                fontFamily: "Cinzel, serif",
              }}
            >
              Rating: {report.rating.label}
            </span>
          </div>

          {/* Spotted anomalies */}
          {report.foundList.length > 0 && (
            <div className="space-y-2 mb-3">
              {report.foundList.map((item, i) => (
                <div key={i} className="text-sm" style={{ color: "var(--tan-light, #c8b090)" }}>
                  <span style={{ color: item.category === "threat" ? "#c44a4a" : item.category === "opportunity" ? "#5a8aaa" : "var(--gold, #c4a24a)" }}>
                    {item.category === "threat" ? "\u2694" : item.category === "opportunity" ? "\u2696" : "\u2727"}
                  </span>
                  {" "}{item.name} {"\u2014"} {item.description}
                  {item.id === "birds" && (
                    <span style={{ color: item.resolvedThreat ? "#c44a4a" : "var(--food-green, #4a8a3a)", fontSize: "0.85em" }}>
                      {" "}({item.resolvedThreat ? "Real threat!" : "False alarm \u2014 just startled birds."})
                    </span>
                  )}
                  <br />
                  <span className="text-xs" style={{ color: "var(--food-green, #4a8a3a)" }}>
                    ({item.reward})
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Missed anomalies */}
          {report.missedList.length > 0 && (
            <div className="space-y-1 mb-3">
              {report.missedList.map((item, i) => (
                <div
                  key={i}
                  className="text-sm"
                  style={{ color: "var(--danger-red, #c62828)", opacity: 0.7 }}
                >
                  {"\u2717"} Missed: {item.name}
                </div>
              ))}
            </div>
          )}

          {/* Denarii bonus */}
          {report.rating.denariiBonus > 0 && (
            <p className="text-sm text-center mb-3" style={{ color: "var(--gold-bright, #e8c44a)" }}>
              +{report.rating.denariiBonus}d (scouts rewarded)
            </p>
          )}

          {/* Captain's assessment */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #3a3228" }}>
            <p
              className="text-sm italic"
              style={{ color: "var(--tan, #a89070)", fontFamily: "Crimson Text, serif" }}
            >
              Captain{"'"}s assessment: &ldquo;{report.rating.captainLine}&rdquo;
            </p>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={acknowledgeReport}
              className="px-6 py-2 rounded-md border-2 font-bold text-sm uppercase tracking-wider"
              style={{
                background: "linear-gradient(135deg, #8b1a1a 0%, #4a0a0a 50%, #8b1a1a 100%)",
                border: "2px solid var(--gold, #c4a24a)",
                color: "#e8c44a",
                fontFamily: "Cinzel, serif",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #c62828 0%, #6a1010 50%, #c62828 100%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #8b1a1a 0%, #4a0a0a 50%, #8b1a1a 100%)";
              }}
            >
              Acknowledged
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Captain's Briefing — NPC Panel
// ---------------------------------------------------------------------------

function CaptainBriefing({ state, dispatch, onBack }) {
  const wt = state.watchtower ?? {};
  const scribesNoteSeen = wt.rodericScribesNoteSeen ?? false;
  const [showScribesNote, setShowScribesNote] = useState(!scribesNoteSeen);
  const [animKey, setAnimKey] = useState(0);

  // Shuffled queues for non-repeating content
  const lessonQueue = useRef(shuffle(Array.from({ length: RODERIC_HISTORICAL_LESSONS.length }, (_, i) => i)));
  const lessonIndex = useRef(0);

  function getAssessment() {
    // Try each assessment function; skip nulls
    const shuffled = shuffle(RODERIC_DEFENSE_ASSESSMENTS);
    for (const fn of shuffled) {
      const result = typeof fn === "function" ? fn(state) : fn;
      if (result) return { type: "assessment", text: result };
    }
    return { type: "assessment", text: "The walls hold. For now." };
  }

  function getLesson() {
    if (lessonIndex.current >= lessonQueue.current.length) {
      lessonQueue.current = shuffle(Array.from({ length: RODERIC_HISTORICAL_LESSONS.length }, (_, i) => i));
      lessonIndex.current = 0;
    }
    const idx = lessonQueue.current[lessonIndex.current++];
    return { type: "lesson", text: RODERIC_HISTORICAL_LESSONS[idx] };
  }

  function getRecommendation() {
    const shuffled = shuffle(RODERIC_STRATEGIC_TIPS);
    for (const fn of shuffled) {
      const result = typeof fn === "function" ? fn(state) : fn;
      if (result) return { type: "recommendation", text: result };
    }
    return { type: "recommendation", text: "Maintain the garrison. Watch the horizon. Upgrade when you can afford it. Defense is patience, my lord." };
  }

  function makeContent() {
    const roll = Math.random();
    if (roll < 0.40) return getAssessment();
    if (roll < 0.75) return getLesson();
    return getRecommendation();
  }

  // eslint-disable-next-line react-hooks/refs -- refs read intentionally in initializer on mount
  const [content, setContent] = useState(() => makeContent());

  // Watchtower-specific commentary
  const wtComment = useMemo(() => {
    if ((wt.perfectScans ?? 0) >= 3) return "Your eye is sharp, my lord. The men call you Eagle-Eye. It suits you.";
    if ((wt.totalAnomaliesMissed ?? 0) > (wt.totalAnomaliesSpotted ?? 0) && (wt.totalScans ?? 0) >= 2) {
      return "We\u2019ve missed more than we\u2019ve caught, my lord. The horizon demands patience.";
    }
    return null;
  }, [wt.perfectScans, wt.totalAnomaliesMissed, wt.totalAnomaliesSpotted, wt.totalScans]);

  function reroll() {
    setContent(makeContent());
    setAnimKey((k) => k + 1);
  }

  function handleDismissScribesNote() {
    setShowScribesNote(false);
    dispatch({ type: "WATCHTOWER_RODERIC_SCRIBES_NOTE_SEEN" });
  }

  const typeLabel = content.type === "assessment" ? "Defense Assessment"
    : content.type === "lesson" ? "A Military Lesson"
    : "Strategic Recommendation";

  return (
    <div
      className="rounded-lg border-2 p-4 sm:p-5 max-w-xl mx-auto"
      style={{
        backgroundColor: "#0e0a0a",
        borderColor: "var(--royal-red, #8b1a1a)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Header */}
      <h3
        className="text-center text-lg sm:text-xl font-bold mb-1"
        style={{ fontFamily: "Cinzel, serif", color: "#c44a4a" }}
      >
        Captain Roderic
      </h3>
      <p
        className="text-center text-xs italic mb-3"
        style={{ color: "#8a6a5a", fontFamily: "Crimson Text, serif" }}
      >
        Garrison Commander
      </p>

      {/* Portrait */}
      <div
        className="flex items-center justify-center rounded-lg border-2 mx-auto"
        style={{
          width: 80, height: 80,
          borderColor: "var(--royal-red, #8b1a1a)",
          backgroundColor: "#120808",
          boxShadow: "0 0 12px rgba(139, 26, 26, 0.3)",
        }}
      >
        <span style={{ fontSize: 36, color: "#c44a4a", fontFamily: "serif", lineHeight: 1 }}>
          {"\u26E8"}
        </span>
      </div>

      {/* Intro */}
      <p
        className="text-center italic text-sm mt-3 mb-1"
        style={{ color: "#7a6a5a", fontFamily: "Crimson Text, serif" }}
      >
        Duty. Vigilance. Stone and steel.
      </p>

      {/* Scribe's Note (first visit) */}
      {showScribesNote && (
        <div
          className="rounded-lg border p-3 mt-3 mb-2"
          style={{ backgroundColor: "#1a2018", borderColor: "#4a6a3a" }}
        >
          <h4
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: "#8a9a6a", fontFamily: "Cinzel, serif" }}
          >
            Scribe{"'"}s Note
          </h4>
          <p
            className="text-xs leading-relaxed italic"
            style={{ color: "#a8a080", fontFamily: "Crimson Text, serif" }}
          >
            {RODERIC_SCRIBES_NOTE}
          </p>
          <button
            onClick={handleDismissScribesNote}
            className="mt-2 px-3 py-1 rounded text-xs"
            style={{
              backgroundColor: "#2a3a1a", color: "#8a9a6a",
              border: "1px solid #4a6a3a", cursor: "pointer",
            }}
          >
            I understand
          </button>
        </div>
      )}

      {/* Decorative rule */}
      <div className="decorative-rule" style={{ color: "var(--royal-red, #8b1a1a)" }}>
        {"\u25C6"}
      </div>

      {/* Watchtower-specific comment */}
      {wtComment && (
        <p
          className="text-xs italic text-center mb-2"
          style={{ color: "#8a6a5a", fontFamily: "Crimson Text, serif" }}
        >
          &ldquo;{wtComment}&rdquo;
        </p>
      )}

      {/* Speech content */}
      <div
        key={animKey}
        className="quill-appear rounded-lg border-2 p-4 mt-3"
        style={{
          backgroundColor: "#1a0e0e",
          borderColor: "var(--royal-red, #8b1a1a)",
          boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.4)",
        }}
      >
        <p
          className="text-xs uppercase tracking-wide mb-2"
          style={{ color: "#c44a4a", fontFamily: "Cinzel, serif" }}
        >
          {typeLabel}
        </p>
        <p
          className="text-sm sm:text-base leading-relaxed"
          style={{
            color: "#c8b090",
            fontFamily: "Crimson Text, serif",
            lineHeight: 1.8,
            letterSpacing: "0.3px",
          }}
        >
          <span style={{ color: "#c44a4a", fontSize: "1.3em", lineHeight: 1 }}>{"\u201C"}</span>
          {content.text}
          <span style={{ color: "#c44a4a", fontSize: "1.3em", lineHeight: 1 }}>{"\u201D"}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={reroll}
          className="flex-1 px-4 py-3 rounded-md border-2 font-semibold text-sm min-h-[44px]"
          style={{
            backgroundColor: "#1a0e0e",
            borderColor: "var(--royal-red, #8b1a1a)",
            color: "#c44a4a",
            fontFamily: "Cinzel, serif",
            transition: "all 200ms ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2a1010";
            e.currentTarget.style.borderColor = "#c44a4a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#1a0e0e";
            e.currentTarget.style.borderColor = "var(--royal-red, #8b1a1a)";
          }}
        >
          Hear More
        </button>
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 rounded-md border-2 font-semibold text-sm min-h-[44px]"
          style={{
            backgroundColor: "#0e0a0a",
            borderColor: "#4a3030",
            color: "#8a6a5a",
            fontFamily: "Cinzel, serif",
            transition: "all 200ms ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a0e0e";
            e.currentTarget.style.borderColor = "#8a6a5a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#0e0a0a";
            e.currentTarget.style.borderColor = "#4a3030";
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Defense Status Panel
// ---------------------------------------------------------------------------

function DefenseStatus({ state }) {
  const { garrison, castleLevel, defenseUpgrades = [] } = state;
  const raids = state.raids ?? {};
  const wt = state.watchtower ?? {};
  const warnings = wt.warnings ?? {};

  const criminalDefended = garrison >= 5;
  const scottishDefended = garrison >= 10;

  // Castle name
  const castleNames = ["", "Motte-and-Bailey", "Palisade Fort", "Stone Keep", "Curtain Wall Castle"];
  const castleName = castleNames[castleLevel] || "Unknown";

  // Morale approximation
  const morale = garrison === 0 ? "None" :
    garrison < 5 ? "Nervous" :
    garrison < 10 ? "Steady" :
    "Strong";

  // Active warnings
  const activeWarnings = [];
  if (warnings.criminalRaidBonus > 0) activeWarnings.push({ icon: "\u2694", text: "Campfire smoke spotted \u2014 bandit threat" });
  if (warnings.scottishRaidBonus > 0) activeWarnings.push({ icon: "\u2694", text: "Dust cloud spotted \u2014 riders approaching" });
  if (warnings.raidRequirementReduction > 0) activeWarnings.push({ icon: "\u26A0", text: "Signal fire \u2014 allied warning active" });
  if (warnings.merchantPreview) activeWarnings.push({ icon: "\u2696", text: `Merchant caravan approaching: ${warnings.merchantPreview.name}` });

  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: "var(--bg-card, #231e16)", borderColor: "#3a4050" }}
    >
      <h3
        className="text-sm font-bold uppercase tracking-wider mb-3 text-center"
        style={{ fontFamily: "Cinzel, serif", color: "var(--gold-dim, #8a7a3a)" }}
      >
        Defense Status
      </h3>

      <div className="grid grid-cols-3 gap-3 text-center text-sm mb-3">
        {/* Garrison */}
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: "#1a0e0e", border: "1px solid var(--royal-red, #8b1a1a)" }}
        >
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "#c44a4a", fontFamily: "Cinzel, serif" }}>
            Garrison
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--gold-bright, #e8c44a)", fontFamily: "Cinzel, serif" }}>
            {"\u2694"} {garrison}
          </div>
          <div className="text-xs" style={{ color: "#8a6a5a" }}>Morale: {morale}</div>
        </div>

        {/* Raid Defense */}
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: "#0e0e14", border: "1px solid #3a4050" }}
        >
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "#8090a0", fontFamily: "Cinzel, serif" }}>
            Raid Defense
          </div>
          <div className="space-y-1 mt-1">
            <div className="text-xs">
              <span style={{ color: "#c8b090" }}>Outlaws: </span>
              <span
                className="font-bold"
                style={{ color: criminalDefended ? "var(--food-green, #4a8a3a)" : "var(--danger-red, #c62828)" }}
              >
                {criminalDefended ? "\u2713" : "\u2717"}
              </span>
            </div>
            <div className="text-xs">
              <span style={{ color: "#c8b090" }}>Scots: </span>
              <span
                className="font-bold"
                style={{
                  color: scottishDefended ? "var(--food-green, #4a8a3a)" : "var(--danger-red, #c62828)",
                  animation: scottishDefended ? "none" : "critical-pulse 3s ease-in-out infinite",
                }}
              >
                {scottishDefended ? "\u2713" : "\u2717"}
              </span>
            </div>
          </div>
        </div>

        {/* Fortifications */}
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: "#0e0e0a", border: "1px solid #4a4a3a" }}
        >
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--tan, #a89070)", fontFamily: "Cinzel, serif" }}>
            Fortifications
          </div>
          <div className="text-xs space-y-1" style={{ color: "#c8b090" }}>
            <div>Castle: Lvl {castleLevel}</div>
            <div style={{ fontSize: "10px", color: "#8a7a5a" }}>{castleName}</div>
            <div style={{ fontSize: "10px", color: "#8a7a5a" }}>
              {defenseUpgrades.length} upgrade{defenseUpgrades.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Active Warnings */}
      {activeWarnings.length > 0 && (
        <div
          className="rounded-lg p-3 mb-3"
          style={{ backgroundColor: "#1a1a10", borderLeft: "3px solid var(--gold, #c4a24a)" }}
        >
          <div className="text-xs uppercase tracking-wide mb-1 font-bold" style={{ color: "var(--gold, #c4a24a)", fontFamily: "Cinzel, serif" }}>
            Active Warnings
          </div>
          {activeWarnings.map((w, i) => (
            <div key={i} className="text-xs" style={{ color: "#c8b090" }}>
              {w.icon} {w.text}
            </div>
          ))}
        </div>
      )}

      {/* Raid History */}
      <div className="text-xs" style={{ color: "var(--tan-dark, #6a5a42)" }}>
        <span className="font-bold">Raid History:</span>{" "}
        Criminal: {raids.totalCriminalRaids ?? 0} (Won: {raids.criminalVictories ?? 0}, Lost: {raids.criminalDefeats ?? 0})
        {" \u00B7 "}
        Scottish: {raids.totalScottishRaids ?? 0} (Won: {raids.scottishVictories ?? 0}, Lost: {raids.scottishDefeats ?? 0})
        {((raids.totalDenariiLost ?? 0) > 0 || (raids.totalFoodLost ?? 0) > 0) && (
          <span>
            {" \u00B7 "}Total losses: {raids.totalDenariiLost ?? 0}d, {raids.totalFoodLost ?? 0} food
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal Fire Log
// ---------------------------------------------------------------------------

function SignalFireLog({ state }) {
  const wt = state.watchtower ?? {};
  const log = wt.signalLog ?? [];

  return (
    <div
      className="rounded-lg border p-3"
      style={{
        backgroundColor: "var(--bg-card, #231e16)",
        borderColor: "#2a3040",
        maxHeight: "150px",
        overflowY: "auto",
      }}
    >
      <h4
        className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1"
        style={{ color: "var(--gold-dim, #8a7a3a)", fontFamily: "Cinzel, serif" }}
      >
        {"\u2668"} Signal Fire Log
      </h4>

      {log.length === 0 ? (
        <p className="text-xs italic" style={{ color: "#4a5a6a" }}>
          No entries yet. Scan the horizon to begin your watch.
        </p>
      ) : (
        <div className="space-y-1">
          {[...log].reverse().map((entry, i) => (
            <div
              key={i}
              className="text-xs"
              style={{
                color: entry.type === "raid" ? "#c44a4a" : entry.type === "warning" ? "var(--gold, #c4a24a)" : "#6a7a8a",
                fontFamily: "system-ui, sans-serif",
                animation: i === 0 ? "watchtower-log-in 300ms ease-out" : "none",
              }}
            >
              <span style={{ color: "#5a6a7a" }}>{entry.season} Y{entry.year}:</span>{" "}
              {entry.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Station Cards for Watchtower sections
// ---------------------------------------------------------------------------

function WatchtowerStation({ title, subtitle, icon, borderColor, disabled, disabledText, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg p-4 text-center cursor-pointer border-2 w-full"
      style={{
        backgroundColor: disabled ? "#0a0a10" : "#0e0e18",
        borderColor: disabled ? "#2a2a30" : borderColor,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div
        className="text-3xl mb-2"
        style={{ color: disabled ? "#3a3a40" : borderColor, lineHeight: 1 }}
      >
        {icon}
      </div>
      <h3
        className="font-bold text-sm uppercase tracking-wide"
        style={{
          fontFamily: "Cinzel, serif",
          color: disabled ? "#3a3a40" : "#c4a24a",
        }}
      >
        {title}
      </h3>
      <p
        className="text-xs mt-1 italic"
        style={{
          fontFamily: "system-ui, sans-serif",
          color: disabled ? "#2a2a30" : "#6a7a8a",
        }}
      >
        {disabled ? disabledText : subtitle}
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// CSS Animations (injected via <style>)
// ---------------------------------------------------------------------------

const WATCHTOWER_STYLES = `
@keyframes watchtower-smoke {
  0% { opacity: 0.4; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-18px); }
}
@keyframes watchtower-pulse {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.5; }
}
@keyframes watchtower-flicker {
  0%, 100% { opacity: 0.4; }
  30% { opacity: 1; }
  60% { opacity: 0.5; }
  80% { opacity: 0.9; }
}
@keyframes watchtower-wagon {
  0% { transform: translateX(-4px); }
  100% { transform: translateX(8px); }
}
@keyframes watchtower-birds {
  0% { transform: translateY(0); opacity: 0.7; }
  100% { transform: translateY(-12px); opacity: 0.2; }
}
@keyframes watchtower-flash {
  0% { box-shadow: inset 0 0 30px rgba(196, 162, 74, 0.5); }
  100% { box-shadow: inset 0 0 0 rgba(196, 162, 74, 0); }
}
@keyframes watchtower-missed {
  0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
}
@keyframes watchtower-label-in {
  0% { opacity: 0; transform: translateX(-50%) translateY(4px); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes watchtower-log-in {
  0% { opacity: 0; transform: translateY(-6px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes watchtower-enter {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
`;

// ---------------------------------------------------------------------------
// Main Watchtower Component
// ---------------------------------------------------------------------------

export default function Watchtower({ state, dispatch, onClose }) {
  const [activeSection, setActiveSection] = useState(null);
  const [entering, setEntering] = useState(true);

  const wt = state.watchtower ?? {};

  // Random subtitle picked once per mount
  const [subtitle] = useState(
    () => WATCHTOWER_SUBTITLES[Math.floor(Math.random() * WATCHTOWER_SUBTITLES.length)]
  );

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setEntering(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const scannedThisSeason = wt.scannedThisSeason ?? false;

  // Sub-views
  if (activeSection === "scan") {
    return (
      <div style={{ animation: "watchtower-enter 300ms ease-out" }}>
        <style>{WATCHTOWER_STYLES}</style>
        <HorizonScan state={state} dispatch={dispatch} onBack={() => setActiveSection(null)} />
      </div>
    );
  }

  if (activeSection === "roderic") {
    return (
      <div style={{ animation: "watchtower-enter 300ms ease-out" }}>
        <style>{WATCHTOWER_STYLES}</style>
        <CaptainBriefing state={state} dispatch={dispatch} onBack={() => setActiveSection(null)} />
      </div>
    );
  }

  // Main watchtower view
  return (
    <div
      className={`w-full max-w-4xl mx-auto rounded-xl border-2 overflow-hidden relative ${entering ? "" : ""}`}
      style={{
        backgroundColor: "#0e0c14",
        borderColor: "#3a4050",
        backgroundImage: "linear-gradient(180deg, #121820 0%, #0e0c14 40%, #0f0d0a 100%)",
        animation: entering ? "watchtower-enter 300ms ease-out" : "none",
      }}
    >
      <style>{WATCHTOWER_STYLES}</style>

      {/* Grain texture */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          opacity: 0.03,
        }}
      />

      <div className="relative z-10 p-4 sm:p-6">
        {/* Header */}
        <WatchtowerHeader subtitle={subtitle} />

        {/* Station grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <WatchtowerStation
            title="Horizon Scan"
            subtitle="Survey the landscape for threats"
            icon={"\u2680"}
            borderColor="#5a7aaa"
            disabled={scannedThisSeason}
            disabledText="The horizon is quiet... for now."
            onClick={() => setActiveSection("scan")}
          />
          <WatchtowerStation
            title="Captain\u2019s Briefing"
            subtitle="Hear your garrison commander\u2019s report"
            icon={"\u26E8"}
            borderColor="var(--royal-red, #8b1a1a)"
            disabled={false}
            onClick={() => setActiveSection("roderic")}
          />
        </div>

        {/* Defense Status */}
        <div className="mb-4">
          <DefenseStatus state={state} />
        </div>

        {/* Signal Fire Log */}
        <div className="mb-4">
          <SignalFireLog state={state} />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid #2a3040" }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: "var(--gold, #c4a24a)", fontFamily: "Cinzel, serif" }}
          >
            Garrison: {state.garrison} | Castle Lvl {state.castleLevel}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "#1a1820",
              color: "#8090a0",
              border: "1px solid #3a4050",
              fontFamily: "Cinzel, serif",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2a2830";
              e.currentTarget.style.color = "#c4a24a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1a1820";
              e.currentTarget.style.color = "#8090a0";
            }}
          >
            Descend from Tower
          </button>
        </div>
      </div>

      {/* Cold ambient gradient at top */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "80px",
          background: "linear-gradient(180deg, rgba(40, 60, 100, 0.08) 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 0,
        }}
      />
    </div>
  );
}
