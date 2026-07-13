/**
 * RaidScreen.jsx
 *
 * Full-screen raid warning, victory, and defeat overlays.
 * Interrupts the season flow when a raid triggers.
 */

import { useState, useEffect } from "react";
import { RAID_TYPES } from "../data/raids.js";
import { CRIMINAL_DEFENSE_THRESHOLD, SCOTTISH_DEFENSE_THRESHOLD, calculateDefenseRating } from "../data/military.js";
import { Skull, Swords } from "lucide-react";

// ---------------------------------------------------------------------------
// CSS keyframe injection (once)
// ---------------------------------------------------------------------------
const RAID_STYLES_ID = "raid-screen-styles";

function ensureStyles() {
  if (document.getElementById(RAID_STYLES_ID)) return;
  const style = document.createElement("style");
  style.id = RAID_STYLES_ID;
  style.textContent = `
    @keyframes raid-pulse {
      0%, 100% { box-shadow: 0 0 15px 2px var(--raid-glow); }
      50% { box-shadow: 0 0 30px 6px var(--raid-glow); }
    }
    @keyframes raid-gold-flash {
      0% { opacity: 0; }
      30% { opacity: 0.4; }
      100% { opacity: 0; }
    }
    @keyframes raid-red-vignette {
      0% { opacity: 0; }
      30% { opacity: 0.5; }
      100% { opacity: 0; }
    }
    @keyframes raid-shake {
      0%, 100% { transform: translateX(0); }
      15% { transform: translateX(-4px); }
      30% { transform: translateX(4px); }
      45% { transform: translateX(-3px); }
      60% { transform: translateX(3px); }
      75% { transform: translateX(-1px); }
    }
    @keyframes raid-drop-in {
      0% { opacity: 0; transform: translateY(-12px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes raid-fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes raid-particle {
      0% { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0.3); }
    }
    .raid-pulse-border {
      animation: raid-pulse 1.5s ease-in-out infinite;
    }
    .raid-shake {
      animation: raid-shake 0.2s ease-in-out;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DefenseComparison({ defenseRating, threshold }) {
  const isReady = defenseRating >= threshold;
  return (
    <div
      className="rounded-lg p-4 my-4 text-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.3)",
        border: `2px solid ${isReady ? "#4a8a3a" : "#c62828"}`,
      }}
    >
      <div className="flex items-center justify-center gap-4 text-3xl font-bold" style={{ fontFamily: "Cinzel, serif" }}>
        <div>
          <div className="text-sm uppercase tracking-wider mb-1" style={{ color: "#a89070" }}>Defense Rating</div>
          <span style={{ color: isReady ? "#4a8a3a" : "#c62828" }}>{defenseRating}</span>
        </div>
        <span style={{ color: "#6a5a42", fontSize: "1.5rem" }}>vs</span>
        <div>
          <div className="text-sm uppercase tracking-wider mb-1" style={{ color: "#a89070" }}>Required</div>
          <span style={{ color: isReady ? "#4a8a3a" : "#c62828" }}>{threshold}</span>
        </div>
      </div>
      <div
        className="mt-2 text-sm font-bold uppercase tracking-wider"
        style={{ color: isReady ? "#4a8a3a" : "#c62828" }}
      >
        {isReady ? "\u2713 DEFENSES HOLD" : "\u2717 DEFENSES INSUFFICIENT"}
      </div>
    </div>
  );
}

function makeParticles() {
  return Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 40 + Math.random() * 30;
    return {
      key: i,
      px: `${Math.cos(angle) * dist}px`,
      py: `${Math.sin(angle) * dist}px`,
      delay: `${Math.random() * 0.2}s`,
    };
  });
}

function GoldParticles() {
  const [particles] = useState(makeParticles);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.key}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: "#c4a24a",
            "--px": p.px,
            "--py": p.py,
            animation: "raid-particle 0.8s ease-out forwards",
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

function LossLine({ text, delay }) {
  return (
    <div
      className="text-base font-semibold py-1"
      style={{
        color: "#c62828",
        animation: `raid-drop-in 0.3s ease-out ${delay}ms both`,
      }}
    >
      {text}
    </div>
  );
}

function GainLine({ text, delay }) {
  return (
    <div
      className="text-base font-semibold py-1"
      style={{
        color: "#4a8a3a",
        animation: `raid-fade-in 0.3s ease-out ${delay}ms both`,
      }}
    >
      {text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RaidScreen({ raidState, garrison, military, onDefend, onContinue }) {
  const [showShake, setShowShake] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => { ensureStyles(); }, []);

  const { type, phase, result } = raidState || {};
  const def = type ? RAID_TYPES[type] : null;
  const isVictory = result?.victory ?? false;

  // Trigger visual effects when result phase appears
  useEffect(() => {
    if (phase !== "result" || !result) return;
    const raf = requestAnimationFrame(() => {
      if (isVictory) {
        setShowParticles(true);
      } else {
        setShowShake(true);
      }
    });
    const timer = setTimeout(() => {
      setShowParticles(false);
      setShowShake(false);
    }, isVictory ? 1000 : 300);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [phase, result, isVictory]);

  // Stable warning text (pick once per raid type, not on every render)
  const [warningText] = useState(() => {
    if (!def) return "";
    return def.warningText[Math.floor(Math.random() * def.warningText.length)];
  });

  if (!def || !phase) return null;

  const isCriminal = type === "criminal";
  const isScottish = type === "scottish";
  const glowColor = isCriminal ? "rgba(138, 106, 42, 0.5)" : "rgba(139, 26, 26, 0.6)";
  const borderColor = isCriminal ? "#8a6a2a" : "#8b1a1a";
  const RaidIcon = isCriminal ? Skull : Swords;

  // --- WARNING PHASE ---
  if (phase === "warning") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div
          className="w-full max-w-lg rounded-lg raid-pulse-border relative flex flex-col"
          style={{
            backgroundColor: "#1a1610",
            border: `3px solid ${borderColor}`,
            borderLeft: `6px solid ${borderColor}`,
            "--raid-glow": glowColor,
            maxHeight: "calc(100vh - 2rem)",
          }}
        >
          {/* Scrollable content area */}
          <div className="px-6 pt-6 pb-3 overflow-y-auto flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <RaidIcon size={isScottish ? 28 : 24} color={borderColor} />
              <h2
                className={`font-bold uppercase tracking-widest text-center ${isScottish ? "text-2xl" : "text-xl"}`}
                style={{ fontFamily: "Cinzel Decorative, Cinzel, serif", color: borderColor }}
              >
                {def.warningTitle}
              </h2>
              <RaidIcon size={isScottish ? 28 : 24} color={borderColor} />
            </div>

            {/* Description */}
            <p
              className={`text-center leading-relaxed mb-2 ${isScottish ? "text-lg" : "text-base"}`}
              style={{ color: "#c8b090" }}
            >
              {warningText}
            </p>

            {/* Defense comparison */}
            {(() => {
              const mil = military || { garrison: { levy: garrison, menAtArms: 0, knights: 0 }, walls: 1, gate: 0, moat: 0, morale: 50 };
              const dr = calculateDefenseRating(mil);
              const threshold = type === "criminal" ? CRIMINAL_DEFENSE_THRESHOLD : SCOTTISH_DEFENSE_THRESHOLD;
              return <DefenseComparison defenseRating={dr} threshold={threshold} />;
            })()}
          </div>

          {/* Sticky action row — always visible at bottom of overlay */}
          <div
            className="px-6 py-3 text-center shrink-0"
            style={{
              backgroundColor: "#1a1610",
              borderTop: `1px solid ${borderColor}`,
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
            }}
          >
            <button
              onClick={onDefend}
              className="px-8 py-3 rounded-md border-2 font-bold text-lg uppercase tracking-wider cursor-pointer transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, ${borderColor}, #1a1610, ${borderColor})`,
                borderColor: "#c4a24a",
                color: "#e8c44a",
                fontFamily: "Cinzel, serif",
                letterSpacing: "2px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e8c44a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#c4a24a"; }}
            >
              Defend the Estate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RESULT PHASE (victory or defeat) ---
  if (phase === "result" && result) {
    // Build gain/loss lines
    const lines = [];
    if (isVictory) {
      if (result.denariiDelta > 0) lines.push(`+${result.denariiDelta}d recovered`);
      if (result.foodDelta > 0) lines.push(`+${result.foodDelta} food captured`);
      if (result.populationDelta > 0) lines.push(`+${result.populationDelta} families inspired`);
      if (result.garrisonDelta > 0) lines.push(`+${result.garrisonDelta} soldiers recruited`);
    } else {
      if (result.denariiDelta < 0) lines.push(`${result.denariiDelta}d stolen`);
      if (result.foodDelta < 0) lines.push(`${result.foodDelta} food pillaged`);
      if (result.tradeGoodLost) lines.push(`-${result.tradeGoodLost.amount} ${result.tradeGoodLost.resource} seized`);
      if (result.garrisonDelta < 0) lines.push(`${result.garrisonDelta} soldiers killed`);
      if (result.populationDelta < 0) lines.push(`${result.populationDelta} families fled`);
    }

    const resultBorder = isVictory ? "#c4a24a" : "#8b1a1a";
    const resultBg = isVictory ? "rgba(196, 162, 74, 0.05)" : "rgba(139, 26, 26, 0.05)";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        {/* Red vignette flash for defeat */}
        {!isVictory && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 40%, rgba(139, 26, 26, 0.4) 100%)",
              animation: "raid-red-vignette 0.5s ease-out forwards",
            }}
            aria-hidden="true"
          />
        )}

        {/* Gold flash for victory */}
        {isVictory && (
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              backgroundColor: "rgba(196, 162, 74, 0.15)",
              animation: "raid-gold-flash 0.5s ease-out forwards",
            }}
            aria-hidden="true"
          />
        )}

        <div
          className={`w-full max-w-lg rounded-lg relative flex flex-col ${!isVictory && showShake ? "raid-shake" : ""}`}
          style={{
            backgroundColor: "#1a1610",
            border: `3px solid ${resultBorder}`,
            background: `linear-gradient(135deg, #1a1610 0%, ${resultBg} 50%, #1a1610 100%)`,
            maxHeight: "calc(100vh - 2rem)",
          }}
        >
          {/* Particles for victory */}
          {isVictory && showParticles && <GoldParticles />}

          {/* Scrollable content */}
          <div className="px-6 pt-6 pb-3 overflow-y-auto flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <RaidIcon size={24} color={resultBorder} />
              <h2
                className="text-xl font-bold uppercase tracking-widest text-center"
                style={{ fontFamily: "Cinzel Decorative, Cinzel, serif", color: resultBorder }}
              >
                {isVictory ? "RAID REPELLED" : "RAID SUCCESSFUL"}
              </h2>
              <RaidIcon size={24} color={resultBorder} />
            </div>

            {/* Partial defense note */}
            {result.partial && (
              <p className="text-sm text-center mb-2 italic" style={{ color: "#a89070" }}>
                Your {garrison} soldiers fought bravely but were outnumbered. Losses were reduced but not prevented.
              </p>
            )}

            {/* Narrative */}
            <p className="text-base leading-relaxed mb-4 text-center" style={{ color: "#c8b090" }}>
              {result.narrativeLine}
            </p>

            {/* Gains / Losses */}
            <div
              className="rounded-md p-3"
              style={{ backgroundColor: "rgba(0,0,0,0.3)", border: `1px solid ${isVictory ? "#4a8a3a" : "#6a5a42"}` }}
            >
              <div className="text-xs uppercase tracking-wider mb-2 font-bold" style={{ color: "#a89070" }}>
                {isVictory ? "Spoils of Victory" : "Losses Sustained"}
              </div>
              {lines.map((line, i) =>
                isVictory ? (
                  <GainLine key={i} text={line} delay={i * 200} />
                ) : (
                  <LossLine key={i} text={line} delay={i * 200} />
                )
              )}
            </div>
          </div>

          {/* Sticky action row */}
          <div
            className="px-6 py-3 text-center shrink-0"
            style={{
              backgroundColor: "#1a1610",
              borderTop: `1px solid ${resultBorder}`,
              borderBottomLeftRadius: "0.5rem",
              borderBottomRightRadius: "0.5rem",
            }}
          >
            <button
              onClick={onContinue}
              className="px-8 py-3 rounded-md border-2 font-bold text-base uppercase tracking-wider cursor-pointer transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #2a2318, #1a1610)",
                borderColor: "#c4a24a",
                color: "#e8c44a",
                fontFamily: "Cinzel, serif",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e8c44a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#c4a24a"; }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
