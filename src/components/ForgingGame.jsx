/**
 * ForgingGame.jsx
 *
 * Phase 2 — The Forging Mini-Game (Anvil Rhythm System)
 *
 * A simplified rhythm game: a strike indicator moves across a track,
 * the player clicks/taps/presses spacebar when it reaches the target zone.
 * Better timing = better quality = better items.
 *
 * Flow: Heating → Striking → Quenching → Result
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Flame, Droplets, Star, Circle, X } from "lucide-react";

import {
  FORGE_COLORS,
  FORGING_DIFFICULTY,
  FORGEABLE_ITEMS,
  GODRIC_FORGING,
  GODRIC_RESULTS,
  calculateGrade,
} from "../data/blacksmith";

// ─── Constants ──────────────────────────────────────────────────
const TRACK_WIDTH = 500;         // logical track width in px
const TARGET_CENTER = 0.65;      // target zone at 65% of track
const HEAT_DURATION = 3000;      // heating phase ms
const QUENCH_INDICATOR_SPEED = 0.45; // px per ms for quench
const BEAT_PAUSE = 400;          // ms pause between beats

// ─── Deterministic pick from array by index ─────────────────────
function pickLine(arr, index) {
  if (!arr || arr.length === 0) return "";
  return arr[index % arr.length];
}

// ─── Quality score calculation ──────────────────────────────────
function computeQuality(perfectCount, goodCount, missCount, totalStrikes, streakBonus, quenchBonus) {
  if (totalStrikes === 0) return 0;
  const baseScore = ((perfectCount * 12 + goodCount * 6) / totalStrikes) * (100 / 12);
  return Math.min(100, Math.round(baseScore + streakBonus + quenchBonus));
}

// ─── Strike History Display ─────────────────────────────────────

function StrikeHistory({ strikes, totalRequired }) {
  const slots = Array.from({ length: totalRequired }, (_, i) => {
    const strike = strikes[i];
    if (!strike) return { type: "pending", key: i };
    return { type: strike.accuracy, key: i };
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "6px 0",
      }}
    >
      {slots.map((slot) => {
        const color =
          slot.type === "perfect" ? FORGE_COLORS.sparkYellow :
          slot.type === "good" ? "#c0c0c0" :
          slot.type === "miss" ? "#4a3a2a" :
          "#2a2420";
        const Icon =
          slot.type === "perfect" ? Star :
          slot.type === "good" ? Star :
          slot.type === "miss" ? X :
          Circle;
        const size = slot.type === "pending" ? 10 : 14;
        const fill = slot.type === "perfect" ? FORGE_COLORS.sparkYellow :
                     slot.type === "good" ? "none" : "none";

        return (
          <Icon
            key={slot.key}
            size={size}
            style={{
              color,
              fill,
              opacity: slot.type === "pending" ? 0.3 : 1,
              transition: "all 200ms ease",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Quality Gauge ──────────────────────────────────────────────

function QualityGauge({ score, overshoot }) {
  const gradeColor =
    score >= 90 ? "#ffd700" :
    score >= 70 ? "#c0c0c0" :
    score >= 50 ? "#8a8a8a" :
    score >= 30 ? "#6a5a4a" :
    "#4a3a2a";
  const gradeLabel =
    score >= 90 ? "Masterwork" :
    score >= 70 ? "Fine" :
    score >= 50 ? "Standard" :
    score >= 30 ? "Rough" :
    "Scrap";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.6rem",
            color: "#a89070",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Quality
        </span>
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.65rem",
            color: gradeColor,
            letterSpacing: "1px",
          }}
        >
          {Math.round(score)}% — {gradeLabel}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "#1a1510",
          border: "1px solid #2a2420",
        }}
      >
        <div
          className={overshoot ? "forge-quality-overshoot" : ""}
          style={{
            height: "100%",
            width: `${Math.min(score, 100)}%`,
            borderRadius: 4,
            backgroundColor: gradeColor,
            transition: overshoot ? "none" : "width 300ms ease",
            boxShadow: score >= 70 ? `0 0 6px ${gradeColor}60` : "none",
          }}
        />
      </div>
    </div>
  );
}

// ─── Item Preview (evolving shape during forging) ───────────────

function ItemPreview({ item, progress, qualityScore }) {
  // Progress: 0 to 1 (strikes completed / total)
  const stage = Math.floor(progress * 5);
  const isGood = qualityScore >= 50;

  const baseColor =
    stage <= 1 ? FORGE_COLORS.emberCore :
    stage <= 2 ? FORGE_COLORS.emberGlow :
    stage <= 3 ? "#8a7a6a" :
    isGood ? "#a0a0a0" : "#6a5a4a";

  // Generic evolving shape — wider and more defined as forging progresses
  const height = 20 + stage * 10;
  const width = item?.category === "armor" ? 30 + stage * 6 : 8 + stage * 4;
  const borderRadius =
    item?.category === "armor" ? `${4 + stage}px` :
    `${2}px ${2}px ${1}px ${1}px`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 80,
      }}
    >
      <div
        style={{
          width,
          height,
          backgroundColor: baseColor,
          borderRadius,
          boxShadow:
            stage <= 2
              ? `0 0 ${8 + stage * 4}px ${FORGE_COLORS.emberCore}40`
              : isGood
              ? "0 0 6px rgba(160,160,160,0.3)"
              : "none",
          transition: "all 400ms ease",
          border: isGood && stage >= 3 ? "1px solid rgba(200,200,200,0.2)" : "none",
        }}
      />
      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "0.55rem",
          color: "#5a5550",
          marginTop: 6,
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {item?.name || "Unknown"}
      </div>
    </div>
  );
}

// ─── Heating Phase ──────────────────────────────────────────────

function HeatingPhase({ item, onComplete }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    let rafId;
    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const pct = Math.min(elapsed / HEAT_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        onComplete();
        return;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  const barColor =
    progress < 0.3 ? FORGE_COLORS.emberDim :
    progress < 0.7 ? FORGE_COLORS.emberCore :
    FORGE_COLORS.emberHot;

  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <Flame size={32} style={{ color: FORGE_COLORS.emberCore, marginBottom: 8 }} />
      <h3
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "0.9rem",
          color: FORGE_COLORS.emberCore,
          letterSpacing: "2px",
          margin: "0 0 4px",
        }}
      >
        Heating the Metal
      </h3>
      <p
        style={{
          fontFamily: "Almendra, Crimson Text, serif",
          fontStyle: "italic",
          fontSize: "0.8rem",
          color: "#a89070",
          margin: "0 0 16px",
        }}
      >
        {item.name} is placed in the forge...
      </p>

      {/* Heat bar */}
      <div
        style={{
          maxWidth: 300,
          margin: "0 auto",
          height: 10,
          borderRadius: 5,
          overflow: "hidden",
          backgroundColor: "#1a1510",
          border: "1px solid #2a2420",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            borderRadius: 5,
            backgroundColor: barColor,
            boxShadow: `0 0 8px ${barColor}60`,
            transition: "background-color 300ms ease",
          }}
        />
      </div>

      <p
        style={{
          fontFamily: "Almendra, Crimson Text, serif",
          fontStyle: "italic",
          fontSize: "0.75rem",
          color: "#6a5a42",
          marginTop: 12,
        }}
      >
        &ldquo;{pickLine(GODRIC_FORGING.start, 0)}&rdquo;
      </p>
    </div>
  );
}

// ─── Strike Track (the main rhythm game) ────────────────────────

function StrikeTrack({
  difficulty,
  item,
  onStrikeResult,
  onAllStrikesComplete,
}) {
  const config = FORGING_DIFFICULTY[difficulty];
  const { strikes: totalStrikes, tempo, perfectWindow, goodWindow } = config;

  const [currentBeat, setCurrentBeat] = useState(0);
  const [indicatorPos, setIndicatorPos] = useState(0);
  const [phase, setPhase] = useState("moving"); // 'moving' | 'struck' | 'pausing' | 'done'
  const [strikeResults, setStrikeResults] = useState([]);
  const [perfectCount, setPerfectCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  const [qualityScore, setQualityScore] = useState(50);
  const [overshoot, setOvershoot] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [godricLine, setGodricLine] = useState(() => pickLine(GODRIC_FORGING.start, 0));
  const [flashClass, setFlashClass] = useState("");

  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const trackRef = useRef(null);
  const handleStrikeResultRef = useRef(null);

  const targetPx = TRACK_WIDTH * TARGET_CENTER;
  const speed = TRACK_WIDTH / tempo; // px per ms

  // Advance to next beat after pause
  const nextBeat = useCallback(() => {
    const next = currentBeat + 1;
    if (next >= totalStrikes) {
      setPhase("done");
      const q = computeQuality(perfectCount, goodCount, missCount, totalStrikes, streakBonus, 0);
      setQualityScore(q);
      onAllStrikesComplete({
        perfectCount,
        goodCount,
        missCount,
        bestStreak,
        streakBonus,
        qualityScore: q,
        strikes: strikeResults,
      });
      return;
    }
    setCurrentBeat(next);
    setIndicatorPos(0);
    startTimeRef.current = null;
    setPhase("moving");
    setLastResult(null);
  }, [currentBeat, totalStrikes, perfectCount, goodCount, missCount, bestStreak, streakBonus, strikeResults, onAllStrikesComplete]);

  // Handle strike result
  const handleStrikeResult = useCallback((accuracy, distance) => {
    if (phase !== "moving") return;
    cancelAnimationFrame(rafRef.current);
    setPhase("struck");

    const result = { accuracy, distance, beat: currentBeat };
    setStrikeResults((prev) => [...prev, result]);
    setLastResult(accuracy);
    onStrikeResult(accuracy);

    // Update counts
    let newPerfect = perfectCount;
    let newGood = goodCount;
    let newMiss = missCount;
    let newStreak = currentStreak;
    let newBest = bestStreak;
    let newStreakBonus = streakBonus;
    let lineIndex = currentBeat;

    if (accuracy === "perfect") {
      newPerfect++;
      newStreak++;
      setPerfectCount(newPerfect);
      setFlashClass("forge-strike-perfect");
      setGodricLine(pickLine(GODRIC_FORGING.perfect, lineIndex));
    } else if (accuracy === "good") {
      newGood++;
      setGoodCount(newGood);
      setFlashClass("forge-strike-good");
      setGodricLine(pickLine(GODRIC_FORGING.good, lineIndex));
    } else {
      newMiss++;
      newStreak = 0;
      setMissCount(newMiss);
      setFlashClass("forge-strike-miss");
      if (currentStreak >= 3) {
        setGodricLine(GODRIC_FORGING.streakBroken);
      } else {
        setGodricLine(pickLine(GODRIC_FORGING.miss, lineIndex));
      }
    }

    // Streak milestones
    if (newStreak === 3) {
      setGodricLine(GODRIC_FORGING.streak3);
    } else if (newStreak === 5) {
      setGodricLine(GODRIC_FORGING.streak5);
    } else if (newStreak === 8) {
      setGodricLine(GODRIC_FORGING.streak8);
    }

    newBest = Math.max(newBest, newStreak);
    newStreakBonus = Math.min(newBest, 15); // cap at +15

    setCurrentStreak(newStreak);
    setBestStreak(newBest);
    setStreakBonus(newStreakBonus);

    // Quality
    const totalDone = newPerfect + newGood + newMiss;
    const q = computeQuality(newPerfect, newGood, newMiss, totalDone, newStreakBonus, 0);
    setQualityScore(q);

    // Overshoot animation on perfect
    if (accuracy === "perfect") {
      setOvershoot(true);
      setTimeout(() => setOvershoot(false), 300);
    }

    // Clear flash and pause before next beat
    setTimeout(() => setFlashClass(""), 400);
    setTimeout(() => {
      setPhase("pausing");
      setTimeout(nextBeat, BEAT_PAUSE);
    }, 200);
  }, [phase, currentBeat, perfectCount, goodCount, missCount, currentStreak, bestStreak, streakBonus, nextBeat, onStrikeResult]);

  // Keep ref in sync for animation loop
  useEffect(() => { handleStrikeResultRef.current = handleStrikeResult; }, [handleStrikeResult]);

  // Animation loop (uses ref to avoid stale closure)
  useEffect(() => {
    if (phase !== "moving") return;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const newPos = elapsed * speed;

      if (newPos >= TRACK_WIDTH) {
        // Missed — indicator reached the end
        if (handleStrikeResultRef.current) handleStrikeResultRef.current("miss", TRACK_WIDTH);
        return;
      }

      setIndicatorPos(newPos);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, speed, currentBeat]);

  // Player strike handler
  const handlePlayerStrike = useCallback(() => {
    if (phase !== "moving") return;
    const distance = Math.abs(indicatorPos - targetPx);

    let accuracy;
    // Convert pixel distance to ms-equivalent for comparison with windows
    const msDistance = distance / speed;
    if (msDistance <= perfectWindow) {
      accuracy = "perfect";
    } else if (msDistance <= goodWindow) {
      accuracy = "good";
    } else {
      accuracy = "miss";
    }

    handleStrikeResult(accuracy, distance);
  }, [phase, indicatorPos, targetPx, speed, perfectWindow, goodWindow, handleStrikeResult]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handlePlayerStrike();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlePlayerStrike]);

  if (phase === "done") return null;

  // Target zone rendering
  const perfectHalfPx = (perfectWindow * speed);
  const goodHalfPx = (goodWindow * speed);

  return (
    <div>
      {/* Header: item name + strike counter */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 8 }}
      >
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.75rem",
            color: FORGE_COLORS.emberCore,
            letterSpacing: "1px",
          }}
        >
          Forging: {item.name}
        </span>
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.65rem",
            color: "#a89070",
            letterSpacing: "1px",
          }}
        >
          Strike {Math.min(currentBeat + 1, totalStrikes)} of {totalStrikes}
        </span>
      </div>

      {/* Quality gauge + streak */}
      <div className="flex items-center gap-4" style={{ marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <QualityGauge score={qualityScore} overshoot={overshoot} />
        </div>
        <div style={{ textAlign: "right", minWidth: 80 }}>
          <span
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.55rem",
              color: currentStreak >= 3 ? FORGE_COLORS.sparkYellow : "#5a5550",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Streak: {currentStreak}
          </span>
        </div>
      </div>

      {/* Item preview */}
      <ItemPreview
        item={item}
        progress={strikeResults.length / totalStrikes}
        qualityScore={qualityScore}
      />

      {/* ═══ The Strike Track ═══ */}
      <div
        ref={trackRef}
        className={flashClass}
        onClick={handlePlayerStrike}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: TRACK_WIDTH,
          height: 48,
          margin: "12px auto",
          backgroundColor: "#0d0a08",
          borderRadius: 4,
          border: `1px solid ${FORGE_COLORS.iron}40`,
          overflow: "hidden",
          cursor: phase === "moving" ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        {/* Good zone (outer) */}
        <div
          style={{
            position: "absolute",
            left: targetPx - goodHalfPx,
            width: goodHalfPx * 2,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(90,85,80,0.15)",
            borderLeft: "1px solid rgba(90,85,80,0.3)",
            borderRight: "1px solid rgba(90,85,80,0.3)",
          }}
        />

        {/* Perfect zone (inner) */}
        <div
          style={{
            position: "absolute",
            left: targetPx - perfectHalfPx,
            width: perfectHalfPx * 2,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(255,107,26,0.2)",
            borderLeft: `2px solid ${FORGE_COLORS.emberCore}60`,
            borderRight: `2px solid ${FORGE_COLORS.emberCore}60`,
            boxShadow: `inset 0 0 10px ${FORGE_COLORS.emberCore}20`,
          }}
        />

        {/* Target center line */}
        <div
          style={{
            position: "absolute",
            left: targetPx - 1,
            width: 2,
            top: 0,
            bottom: 0,
            backgroundColor: FORGE_COLORS.emberCore,
            boxShadow: `0 0 4px ${FORGE_COLORS.emberCore}80`,
          }}
        />

        {/* Strike indicator (moving diamond) */}
        <div
          style={{
            position: "absolute",
            left: indicatorPos - 8,
            top: "50%",
            transform: "translateY(-50%) rotate(45deg)",
            width: 16,
            height: 16,
            backgroundColor:
              lastResult === "perfect" ? FORGE_COLORS.sparkYellow :
              lastResult === "good" ? "#c0c0c0" :
              lastResult === "miss" ? "#c62828" :
              FORGE_COLORS.parchment,
            border: `2px solid ${
              lastResult === "perfect" ? FORGE_COLORS.sparkYellow :
              lastResult === "good" ? "#a0a0a0" :
              lastResult === "miss" ? "#8b1a1a" :
              "#a89070"
            }`,
            boxShadow:
              lastResult === "perfect"
                ? `0 0 12px ${FORGE_COLORS.sparkYellow}80`
                : `0 0 4px rgba(0,0,0,0.5)`,
            transition: lastResult ? "background-color 150ms ease" : "none",
            zIndex: 5,
          }}
        />

        {/* "Click to strike" label */}
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 8,
            fontFamily: "Cinzel, serif",
            fontSize: "0.45rem",
            color: "#3a3632",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Click / Spacebar
        </div>
      </div>

      {/* Strike history */}
      <StrikeHistory strikes={strikeResults} totalRequired={totalStrikes} />

      {/* Godric coaching */}
      <div
        style={{
          textAlign: "center",
          padding: "8px 12px",
          marginTop: 4,
          borderRadius: 4,
          backgroundColor: "rgba(13,10,8,0.6)",
          border: `1px solid ${FORGE_COLORS.iron}20`,
        }}
      >
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.55rem",
            color: FORGE_COLORS.emberDim,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Godric:{" "}
        </span>
        <span
          style={{
            fontFamily: "Almendra, Crimson Text, serif",
            fontStyle: "italic",
            fontSize: "0.8rem",
            color: "#c8b090",
          }}
        >
          &ldquo;{godricLine}&rdquo;
        </span>
      </div>
    </div>
  );
}

// ─── Quenching Phase ────────────────────────────────────────────

function QuenchPhase({ onComplete }) {
  const [indicatorPos, setIndicatorPos] = useState(0);
  const [phase, setPhase] = useState("moving"); // 'moving' | 'struck' | 'done'
  const [result, setResult] = useState(null);
  const [steamActive, setSteamActive] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const handleQuenchRef = useRef(null);

  const targetPx = TRACK_WIDTH * 0.5; // center for quench
  const perfectHalf = 80;
  const goodHalf = 140;

  const handleQuench = useCallback((accuracy) => {
    if (phase !== "moving") return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPhase("struck");
    setResult(accuracy);
    setSteamActive(true);

    const bonus =
      accuracy === "perfect" ? 10 :
      accuracy === "good" ? 5 : 0;

    setTimeout(() => {
      setPhase("done");
      onComplete(bonus, accuracy);
    }, 2000);
  }, [phase, onComplete]);

  // Sync ref and run animation loop
  useEffect(() => { handleQuenchRef.current = handleQuench; }, [handleQuench]);

  useEffect(() => {
    if (phase !== "moving") return;
    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const pos = elapsed * QUENCH_INDICATOR_SPEED;
      if (pos >= TRACK_WIDTH) {
        if (handleQuenchRef.current) handleQuenchRef.current("miss");
        return;
      }
      setIndicatorPos(pos);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  const handleClick = useCallback(() => {
    if (phase !== "moving") return;
    const distance = Math.abs(indicatorPos - targetPx);
    const accuracy =
      distance <= perfectHalf ? "perfect" :
      distance <= goodHalf ? "good" :
      "miss";
    handleQuench(accuracy);
  }, [phase, indicatorPos, targetPx, handleQuench]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClick]);

  const quenchLine = result
    ? (result === "perfect" ? GODRIC_FORGING.perfectQuench
      : result === "good" ? GODRIC_FORGING.goodQuench
      : GODRIC_FORGING.missedQuench)
    : pickLine(GODRIC_FORGING.preQuench, 0);

  return (
    <div style={{ textAlign: "center", padding: "16px 0" }}>
      <Droplets size={28} style={{ color: FORGE_COLORS.quenchBlue, marginBottom: 8 }} />
      <h3
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "0.85rem",
          color: FORGE_COLORS.quenchSteam,
          letterSpacing: "2px",
          margin: "0 0 8px",
        }}
      >
        Quench the Steel
      </h3>

      {/* Quench track */}
      <div
        onClick={handleClick}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: TRACK_WIDTH,
          height: 40,
          margin: "12px auto",
          backgroundColor: "#0d0a08",
          borderRadius: 4,
          border: `1px solid ${FORGE_COLORS.quenchBlue}40`,
          overflow: "hidden",
          cursor: phase === "moving" ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        {/* Good zone */}
        <div
          style={{
            position: "absolute",
            left: targetPx - goodHalf,
            width: goodHalf * 2,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(26,58,90,0.15)",
          }}
        />
        {/* Perfect zone */}
        <div
          style={{
            position: "absolute",
            left: targetPx - perfectHalf,
            width: perfectHalf * 2,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(26,58,90,0.3)",
            border: `1px solid ${FORGE_COLORS.quenchBlue}50`,
          }}
        />
        {/* Center line */}
        <div
          style={{
            position: "absolute",
            left: targetPx - 1,
            width: 2,
            top: 0,
            bottom: 0,
            backgroundColor: FORGE_COLORS.quenchSteam,
          }}
        />
        {/* Indicator */}
        <div
          style={{
            position: "absolute",
            left: indicatorPos - 8,
            top: "50%",
            transform: "translateY(-50%) rotate(45deg)",
            width: 14,
            height: 14,
            backgroundColor:
              result === "perfect" ? FORGE_COLORS.quenchSteam :
              result === "good" ? "#6a8aaa" :
              result === "miss" ? "#4a3a2a" :
              FORGE_COLORS.parchment,
            border: `2px solid ${result ? FORGE_COLORS.quenchBlue : "#a89070"}`,
            zIndex: 5,
          }}
        />
      </div>

      {/* Steam particles */}
      {steamActive && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            height: 40,
            overflow: "hidden",
          }}
        >
          {Array.from({ length: result === "perfect" ? 12 : result === "good" ? 6 : 2 }).map((_, i) => (
            <div
              key={i}
              className="forge-steam-particle"
              style={{
                width: 4 + (i % 3) * 2,
                height: 4 + (i % 3) * 2,
                borderRadius: "50%",
                backgroundColor: FORGE_COLORS.quenchSteam,
                opacity: 0.6,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Godric */}
      <p
        style={{
          fontFamily: "Almendra, Crimson Text, serif",
          fontStyle: "italic",
          fontSize: "0.8rem",
          color: "#c8b090",
          marginTop: 8,
        }}
      >
        Godric: &ldquo;{quenchLine}&rdquo;
      </p>

      {phase === "moving" && (
        <p
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.5rem",
            color: "#5a5550",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          Click / Spacebar to Plunge
        </p>
      )}
    </div>
  );
}

// ─── Result Screen ──────────────────────────────────────────────

function ResultScreen({ item, grade, qualityScore, stats, onFinish }) {
  const godricLine = useMemo(
    () => pickLine(GODRIC_RESULTS[grade.grade] || GODRIC_RESULTS.Standard, stats.bestStreak),
    [grade.grade, stats.bestStreak]
  );

  const finalMilitary = Math.round((item.baseMilitary || 0) * grade.statMultiplier);
  const finalTrade = Math.round((item.baseTradeValue || 0) * grade.tradeMultiplier);

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      {/* Grade announcement */}
      <div
        className="forge-result-reveal"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          border: `2px solid ${grade.color}`,
          borderRadius: 8,
          backgroundColor: "rgba(13,10,8,0.8)",
          boxShadow: `0 0 20px ${grade.color}30`,
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: "Cinzel Decorative, Cinzel, serif",
            fontSize: "1.1rem",
            color: grade.color,
            letterSpacing: "3px",
            margin: "0 0 4px",
            textShadow: `0 0 8px ${grade.color}40`,
          }}
        >
          {grade.grade}
        </h3>
        <p
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.7rem",
            color: FORGE_COLORS.parchment,
            margin: "0 0 2px",
          }}
        >
          {item.name}
        </p>
        <p
          style={{
            fontFamily: "Almendra, Crimson Text, serif",
            fontStyle: "italic",
            fontSize: "0.8rem",
            color: "#a89070",
            margin: 0,
          }}
        >
          {grade.description}
        </p>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 8,
          maxWidth: 400,
          margin: "0 auto 16px",
        }}
      >
        <StatBox label="Quality" value={`${qualityScore}%`} color={grade.color} />
        <StatBox label="Perfect Strikes" value={stats.perfectCount} color={FORGE_COLORS.sparkYellow} />
        <StatBox label="Good Strikes" value={stats.goodCount} color="#c0c0c0" />
        <StatBox label="Missed" value={stats.missCount} color="#c62828" />
        <StatBox label="Best Streak" value={stats.bestStreak} color={FORGE_COLORS.emberCore} />
        <StatBox label="Durability" value={grade.durability} color="#a89070" />
        {finalMilitary > 0 && (
          <StatBox label="Military" value={`+${finalMilitary}`} color="#8b2020" />
        )}
        <StatBox label="Trade Value" value={`${finalTrade}d`} color="#c4a24a" />
      </div>

      {/* Godric reaction */}
      <div
        style={{
          padding: "10px 16px",
          borderRadius: 6,
          backgroundColor: "rgba(26,21,16,0.6)",
          border: `1px solid ${FORGE_COLORS.emberDim}30`,
          maxWidth: 400,
          margin: "0 auto 16px",
        }}
      >
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.55rem",
            color: FORGE_COLORS.emberDim,
            letterSpacing: "1px",
          }}
        >
          Godric:{" "}
        </span>
        <span
          style={{
            fontFamily: "Almendra, Crimson Text, serif",
            fontStyle: "italic",
            fontSize: "0.85rem",
            color: "#c8b090",
          }}
        >
          &ldquo;{godricLine}&rdquo;
        </span>
      </div>

      {/* Finish button */}
      <button
        onClick={onFinish}
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "0.75rem",
          color: FORGE_COLORS.emberCore,
          background: "rgba(255,107,26,0.1)",
          border: `1px solid ${FORGE_COLORS.emberCore}60`,
          padding: "8px 24px",
          borderRadius: 4,
          cursor: "pointer",
          letterSpacing: "1px",
          transition: "all 200ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255,107,26,0.2)";
          e.currentTarget.style.borderColor = FORGE_COLORS.emberCore;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255,107,26,0.1)";
          e.currentTarget.style.borderColor = `${FORGE_COLORS.emberCore}60`;
        }}
      >
        Collect Item
      </button>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div
      style={{
        padding: "6px 8px",
        borderRadius: 4,
        backgroundColor: "rgba(13,10,8,0.5)",
        border: "1px solid #2a2420",
      }}
    >
      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "0.5rem",
          color: "#6a5a42",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "0.8rem",
          color,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Item Selector (simple, expanded in Phase 3) ────────────────

function ItemSelector({ resources, onSelect, onCancel }) {
  const items = Object.values(FORGEABLE_ITEMS);

  function canAfford(item) {
    const cost = item.cost;
    return Object.entries(cost).every(([res, amount]) => {
      if (res === "gold") return true; // gold checked separately from denarii
      return (resources[res] || 0) >= amount;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h3
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.85rem",
            color: FORGE_COLORS.emberCore,
            letterSpacing: "1px",
            margin: 0,
          }}
        >
          Choose What to Forge
        </h3>
        <button
          onClick={onCancel}
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.6rem",
            color: "#6a5a42",
            background: "none",
            border: `1px solid ${FORGE_COLORS.iron}40`,
            padding: "4px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 8,
        }}
      >
        {items.map((item) => {
          const affordable = canAfford(item);
          const diff = FORGING_DIFFICULTY[item.difficulty];

          return (
            <button
              key={item.id}
              onClick={() => affordable && onSelect(item)}
              disabled={!affordable}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 6,
                border: `1px solid ${affordable ? FORGE_COLORS.emberDim + "40" : "#2a2420"}`,
                backgroundColor: affordable ? "rgba(26,21,16,0.6)" : "rgba(13,10,8,0.4)",
                cursor: affordable ? "pointer" : "not-allowed",
                opacity: affordable ? 1 : 0.5,
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                if (affordable) {
                  e.currentTarget.style.borderColor = FORGE_COLORS.emberCore + "60";
                  e.currentTarget.style.backgroundColor = "rgba(255,107,26,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (affordable) {
                  e.currentTarget.style.borderColor = FORGE_COLORS.emberDim + "40";
                  e.currentTarget.style.backgroundColor = "rgba(26,21,16,0.6)";
                }
              }}
            >
              {/* Item name + category */}
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.75rem",
                    color: affordable ? FORGE_COLORS.parchment : "#5a5550",
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.5rem",
                    color: "#6a5a42",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  {item.category}
                </span>
              </div>

              {/* Description */}
              <p
                style={{
                  fontFamily: "Crimson Text, serif",
                  fontSize: "0.75rem",
                  color: "#8a7a5a",
                  margin: "0 0 6px",
                  lineHeight: 1.3,
                }}
              >
                {item.description}
              </p>

              {/* Difficulty + strikes */}
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.5rem",
                    color:
                      item.difficulty === "easy" ? "#4a8a3a" :
                      item.difficulty === "medium" ? FORGE_COLORS.emberCore :
                      item.difficulty === "hard" ? "#c62828" :
                      FORGE_COLORS.sparkYellow,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  {diff.label} ({diff.strikes} strikes)
                </span>
              </div>

              {/* Cost */}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(item.cost).map(([res, amount]) => {
                  if (amount === 0) return null;
                  const has = res === "gold" || (resources[res] || 0) >= amount;
                  return (
                    <span
                      key={res}
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "0.5rem",
                        color: has ? "#a89070" : "#c62828",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {res}: {amount}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main ForgingGame Component
// ═══════════════════════════════════════════════════════════════

export default function ForgingGame({ resources, onComplete, onCancel, commissionItem }) {
  // Game phases: 'select' | 'heating' | 'striking' | 'quenching' | 'result'
  const [gamePhase, setGamePhase] = useState(commissionItem ? "heating" : "select");
  const [selectedItem, setSelectedItem] = useState(commissionItem || null);
  const [strikeData, setStrikeData] = useState(null);
  const [finalQuality, setFinalQuality] = useState(0);
  const [finalGrade, setFinalGrade] = useState(null);

  const handleSelectItem = useCallback((item) => {
    setSelectedItem(item);
    setGamePhase("heating");
  }, []);

  const handleHeatingComplete = useCallback(() => {
    setGamePhase("striking");
  }, []);

  const handleStrikeResult = useCallback(() => {
    // Individual strike feedback (used for screen effects)
  }, []);

  const handleAllStrikesComplete = useCallback((data) => {
    setStrikeData(data);
    setGamePhase("quenching");
  }, []);

  const handleQuenchComplete = useCallback((quenchBonus, quenchResult) => {
    const totalQ = computeQuality(
      strikeData.perfectCount,
      strikeData.goodCount,
      strikeData.missCount,
      strikeData.perfectCount + strikeData.goodCount + strikeData.missCount,
      strikeData.streakBonus,
      quenchBonus
    );
    const grade = calculateGrade(totalQ);
    setFinalQuality(totalQ);
    setFinalGrade(grade);
    setStrikeData((prev) => ({ ...prev, quenchResult, quenchBonus }));
    setGamePhase("result");
  }, [strikeData]);

  const handleFinish = useCallback(() => {
    onComplete({
      item: selectedItem,
      grade: finalGrade,
      qualityScore: finalQuality,
      stats: strikeData,
    });
  }, [selectedItem, finalGrade, finalQuality, strikeData, onComplete]);

  return (
    <div>
      {gamePhase === "select" && (
        <ItemSelector
          resources={resources}
          onSelect={handleSelectItem}
          onCancel={onCancel}
        />
      )}

      {gamePhase === "heating" && selectedItem && (
        <HeatingPhase item={selectedItem} onComplete={handleHeatingComplete} />
      )}

      {gamePhase === "striking" && selectedItem && (
        <StrikeTrack
          difficulty={selectedItem.difficulty}
          item={selectedItem}
          onStrikeResult={handleStrikeResult}
          onAllStrikesComplete={handleAllStrikesComplete}
        />
      )}

      {gamePhase === "quenching" && (
        <QuenchPhase onComplete={handleQuenchComplete} />
      )}

      {gamePhase === "result" && selectedItem && finalGrade && (
        <ResultScreen
          item={selectedItem}
          grade={finalGrade}
          qualityScore={finalQuality}
          stats={strikeData}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}
