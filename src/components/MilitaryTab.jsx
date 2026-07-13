/**
 * MilitaryTab.jsx
 *
 * Expanded military management: garrison recruitment/dismissal across soldier
 * types, fortification upgrade tracks (walls/gate/moat), morale display,
 * upkeep summary, defense breakdown, castle SVG visualization, watchtower
 * access, and filtered military chronicle.
 */

import { useState } from "react";
import {
  SOLDIER_TYPES, WALLS_TRACK, GATE_TRACK, MOAT_TRACK,
  CRIMINAL_DEFENSE_THRESHOLD, SCOTTISH_DEFENSE_THRESHOLD,
  getMoraleLevel, getMilitaryUpkeep,
  calculateDefenseRating, getDefenseBreakdown, canUpgradeFortification,
  MILITARY_TOOLTIPS,
} from "../data/military.js";

// ─── Shared styles ───────────────────────────────────────────────

const btnBase = "px-3 py-2 rounded-md font-bold text-sm uppercase tracking-wider cursor-pointer transition-all duration-200 min-h-[44px]";
const btnEnabled = { backgroundColor: "#8b1a1a", border: "1px solid #6a5a42", color: "#e8c44a" };
const btnDisabled = { backgroundColor: "#2a2318", border: "1px solid #3a3228", color: "#6a5a42", cursor: "not-allowed" };

const CARD_BG = "#231e16";
const INNER_BG = "#1a1610";
const GOLD = "#c4a24a";
const VALUE_GOLD = "#e8c44a";
const LABEL_TAN = "#a89070";
const TEXT_TAN = "#c8b090";
const DANGER_RED = "#c62828";
const GREEN = "#4a8a3a";

const headingFont = { fontFamily: "Cinzel, serif" };

// ─── ActionButton ────────────────────────────────────────────────

function ActionButton({ onClick, disabled, children, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={btnBase}
      style={{ ...headingFont, ...(disabled ? { ...btnDisabled, ...style } : { ...btnEnabled, ...style }) }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "#c62828"; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = (style && style.backgroundColor) || "#8b1a1a"; }}
    >
      {children}
    </button>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────

function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const [timerId, setTimerId] = useState(null);

  function handleEnter() {
    const id = setTimeout(() => setVisible(true), 200);
    setTimerId(id);
  }

  function handleLeave() {
    if (timerId) clearTimeout(timerId);
    setTimerId(null);
    setVisible(false);
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {visible && (
        <span
          className="absolute z-50 text-sm rounded-md px-3 py-2 left-1/2 -translate-x-1/2 mt-1 whitespace-normal"
          style={{
            backgroundColor: "#2a2318",
            color: TEXT_TAN,
            border: "1px solid #8a7a3a",
            maxWidth: 250,
            top: "100%",
            pointerEvents: "none",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Castle SVG ──────────────────────────────────────────────────

function CastleSVG({ walls, gate, moat }) {
  const STONE = "#6a6a6a";
  const STONE_LIGHT = "#8a8a8a";
  const WOOD = "#6a4a2a";
  const WOOD_LIGHT = "#8a6a3a";
  const WATER = "#3a6a8a";
  const FLAG = "#8b1a1a";
  const BG = "#231e16";

  return (
    <svg
      viewBox="0 0 350 220"
      className="w-full max-w-[350px] mx-auto"
      style={{ backgroundColor: BG, borderRadius: 8 }}
    >
      {/* Sky gradient background */}
      <rect x="0" y="0" width="350" height="220" fill={BG} />

      {/* Moat */}
      {moat >= 1 && moat < 2 && (
        /* Dry ditch - V shape */
        <polygon points="50,190 175,210 300,190 300,195 175,215 50,195" fill="#3a2a1a" stroke="#2a1a0a" strokeWidth="1" />
      )}
      {moat >= 2 && (
        <>
          {/* Water-filled moat */}
          <ellipse cx="175" cy="200" rx="140" ry="18" fill={WATER} opacity="0.7" />
          {/* Subtle wave lines */}
          <path d="M70,198 Q90,195 110,198 Q130,201 150,198 Q170,195 190,198 Q210,201 230,198 Q250,195 270,198" fill="none" stroke="#5a8aaa" strokeWidth="1" opacity="0.5" />
        </>
      )}
      {moat >= 3 && (
        /* Drawbridge */
        <rect x="158" y="185" width="34" height="12" fill={WOOD} stroke={WOOD_LIGHT} strokeWidth="1" />
      )}

      {/* Motte mound (always present) */}
      <polygon points="50,190 100,130 250,130 300,190" fill="#5a4a2a" stroke="#4a3a1a" strokeWidth="1" />
      <polygon points="60,190 105,135 245,135 290,190" fill="#6a5a3a" />

      {/* Walls level 4: second ring behind */}
      {walls >= 4 && (
        <>
          <rect x="95" y="90" width="160" height="45" fill={STONE} stroke="#5a5a5a" strokeWidth="1" />
          {/* Inner crenellations */}
          {[0,1,2,3,4,5,6,7].map(i => (
            <rect key={`inner-cren-${i}`} x={100 + i * 20} y={85} width={10} height={8} fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="0.5" />
          ))}
        </>
      )}

      {/* Walls level 1: wooden palisade */}
      {walls === 1 && (
        <>
          {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
            <rect key={`pal-${i}`} x={108 + i * 11} y={100} width={5} height={35} fill={WOOD} stroke={WOOD_LIGHT} strokeWidth="0.5" />
          ))}
          {/* Pointed tops */}
          {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
            <polygon key={`pal-top-${i}`} points={`${108 + i * 11},100 ${110.5 + i * 11},93 ${113 + i * 11},100`} fill={WOOD_LIGHT} />
          ))}
        </>
      )}

      {/* Walls level 2+: stone curtain wall */}
      {walls >= 2 && (
        <>
          <rect x="105" y="105" width="140" height="30" fill={STONE} stroke="#5a5a5a" strokeWidth="1" />
          {/* Crenellations */}
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <rect key={`cren-${i}`} x={108 + i * 14} y={99} width={8} height={8} fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="0.5" />
          ))}
        </>
      )}

      {/* Walls level 3+: corner towers */}
      {walls >= 3 && (
        <>
          {/* Left tower */}
          <rect x="95" y="80" width="25" height="55" fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="1" />
          <rect x="93" y="75" width="29" height="8" fill={STONE} stroke="#5a5a5a" strokeWidth="0.5" />
          {/* Left tower crenellations */}
          <rect x="93" y="71" width="7" height="6" fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="0.5" />
          <rect x="107" y="71" width="7" height="6" fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="0.5" />

          {/* Right tower */}
          <rect x="230" y="80" width="25" height="55" fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="1" />
          <rect x="228" y="75" width="29" height="8" fill={STONE} stroke="#5a5a5a" strokeWidth="0.5" />
          {/* Right tower crenellations */}
          <rect x="228" y="71" width="7" height="6" fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="0.5" />
          <rect x="242" y="71" width="7" height="6" fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="0.5" />

          {/* Pennant flags on towers */}
          <line x1="100" y1="71" x2="100" y2="55" stroke="#4a3a2a" strokeWidth="1" />
          <polygon points="100,55 115,60 100,65" fill={FLAG} />
          <line x1="248" y1="71" x2="248" y2="55" stroke="#4a3a2a" strokeWidth="1" />
          <polygon points="248,55 263,60 248,65" fill={FLAG} />
        </>
      )}

      {/* Gate level 1: wooden gate */}
      {gate >= 1 && walls >= 1 && (
        <rect x="165" y="115" width="20" height="20" fill="#3a2a1a" stroke={WOOD} strokeWidth="1" />
      )}

      {/* Gate level 2: iron-bound with cross-hatch */}
      {gate >= 2 && walls >= 1 && (
        <>
          <rect x="165" y="115" width="20" height="20" fill="#2a2218" stroke="#4a4a4a" strokeWidth="1.5" />
          {/* Cross-hatch pattern */}
          <line x1="165" y1="120" x2="185" y2="120" stroke="#5a5a5a" strokeWidth="0.5" />
          <line x1="165" y1="125" x2="185" y2="125" stroke="#5a5a5a" strokeWidth="0.5" />
          <line x1="165" y1="130" x2="185" y2="130" stroke="#5a5a5a" strokeWidth="0.5" />
          <line x1="170" y1="115" x2="170" y2="135" stroke="#5a5a5a" strokeWidth="0.5" />
          <line x1="175" y1="115" x2="175" y2="135" stroke="#5a5a5a" strokeWidth="0.5" />
          <line x1="180" y1="115" x2="180" y2="135" stroke="#5a5a5a" strokeWidth="0.5" />
        </>
      )}

      {/* Gate level 3: portcullis grid */}
      {gate >= 3 && walls >= 2 && (
        <>
          <rect x="163" y="113" width="24" height="24" fill="#1a1610" stroke="#4a4a4a" strokeWidth="1" />
          {/* Portcullis grid lines */}
          {[0,1,2,3,4].map(i => (
            <line key={`pg-h-${i}`} x1="163" y1={115 + i * 5} x2="187" y2={115 + i * 5} stroke="#6a6a6a" strokeWidth="1" />
          ))}
          {[0,1,2,3,4].map(i => (
            <line key={`pg-v-${i}`} x1={165 + i * 5} y1="113" x2={165 + i * 5} y2="137" stroke="#6a6a6a" strokeWidth="1" />
          ))}
        </>
      )}

      {/* Gate level 4: barbican projection */}
      {gate >= 4 && walls >= 2 && (
        <>
          <rect x="160" y="135" width="30" height="20" fill={STONE} stroke="#5a5a5a" strokeWidth="1" />
          <rect x="158" y="132" width="34" height="5" fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="0.5" />
          {/* Barbican crenellations */}
          <rect x="158" y="128" width="8" height="5" fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="0.5" />
          <rect x="176" y="128" width="8" height="5" fill={STONE_LIGHT} stroke="#5a5a5a" strokeWidth="0.5" />
        </>
      )}

      {/* Central keep (always show a basic structure on the mound) */}
      <rect x="155" y="95" width="40" height="40" fill="#5a5048" stroke="#4a4038" strokeWidth="1" />
      <rect x="153" y="90" width="44" height="7" fill="#4a4038" stroke="#3a3028" strokeWidth="0.5" />
    </svg>
  );
}

// ─── Soldier Card ────────────────────────────────────────────────

function SoldierCard({ type, typeData, count, state, onRecruit, onDismiss }) {
  const { denarii, population } = state;

  function getRecruitDisabledReason(amount) {
    if (denarii < typeData.recruitCost * amount) return "Not enough denarii";
    if (typeData.max !== null && count + amount > typeData.max) return "At maximum";
    if (typeData.minPopulation && population < typeData.minPopulation) return `Need ${typeData.minPopulation} families`;
    return null;
  }

  function getDismissDisabledReason(amount) {
    if (count < amount) return "Not enough soldiers";
    return null;
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: CARD_BG,
        border: `2px solid ${typeData.borderColor}`,
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        if (type === "knights") e.currentTarget.style.boxShadow = `0 0 12px ${typeData.borderColor}40`;
      }}
      onMouseLeave={(e) => {
        if (type === "knights") e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl" style={{ color: typeData.borderColor }}>{typeData.icon}</span>
        <div>
          <h4
            className="text-sm font-bold uppercase tracking-wider"
            style={{ ...headingFont, color: typeData.borderColor }}
          >
            {typeData.name}
          </h4>
          <span className="text-xs" style={{ color: LABEL_TAN }}>{typeData.subtitle}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm mb-3 space-y-1" style={{ color: LABEL_TAN }}>
        <div className="flex justify-between">
          <span style={{ color: TEXT_TAN }}>Count:</span>
          <span style={{ color: VALUE_GOLD }}>
            {count} / {typeData.max !== null ? typeData.max : "\u221E"}
          </span>
        </div>
        <div className="flex justify-between">
          <Tooltip text={MILITARY_TOOLTIPS.defenseRating}>
            <span style={{ color: TEXT_TAN }}>Defense:</span>
          </Tooltip>
          <span style={{ color: VALUE_GOLD }}>{typeData.defenseValue} per soldier</span>
        </div>
        <div className="flex justify-between">
          <Tooltip text={MILITARY_TOOLTIPS.recruitCost}>
            <span style={{ color: TEXT_TAN }}>Recruit:</span>
          </Tooltip>
          <span style={{ color: VALUE_GOLD }}>{typeData.recruitCost}d</span>
        </div>
        <div className="flex justify-between">
          <Tooltip text={MILITARY_TOOLTIPS.upkeep}>
            <span style={{ color: TEXT_TAN }}>Upkeep:</span>
          </Tooltip>
          <span style={{ color: VALUE_GOLD }}>{typeData.upkeep}d/season</span>
        </div>
      </div>

      {/* Recruit buttons */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {typeData.recruitButtons.map((amt) => {
          const reason = getRecruitDisabledReason(amt);
          return (
            <Tooltip key={`recruit-${amt}`} text={reason || MILITARY_TOOLTIPS[type === "levy" ? "levy" : type === "menAtArms" ? "menAtArms" : "knight"]}>
              <ActionButton
                onClick={() => onRecruit(type, amt)}
                disabled={!!reason}
              >
                Recruit +{amt}
              </ActionButton>
            </Tooltip>
          );
        })}
      </div>

      {/* Dismiss buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {typeData.dismissButtons.map((amt) => {
          const reason = getDismissDisabledReason(amt);
          return (
            <ActionButton
              key={`dismiss-${amt}`}
              onClick={() => onDismiss(type, amt)}
              disabled={!!reason}
              style={!reason ? { backgroundColor: "#5a1a1a", border: "1px solid #5a1010" } : {}}
            >
              Dismiss -{amt}
            </ActionButton>
          );
        })}
      </div>

      {/* Flavor text */}
      <p className="text-xs italic" style={{ color: LABEL_TAN }}>
        {typeData.description}
      </p>
    </div>
  );
}

// ─── Fortification Track ─────────────────────────────────────────

function FortificationTrack({ trackName, trackData, currentLevel, currentLevels, denarii, onUpgrade }) {
  const { canUpgrade: canUp, reason, next } = canUpgradeFortification(trackName, currentLevels);
  const canAfford = next && denarii >= next.cost;
  const isUpgradeable = canUp && canAfford;

  const trackLabel = trackName === "walls" ? "Walls" : trackName === "gate" ? "Gate" : "Moat";
  const currentLevelData = trackData[currentLevel];

  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: CARD_BG, border: `1px solid #6a5a42` }}
    >
      <h4
        className="text-sm font-bold uppercase tracking-wider mb-2"
        style={{ ...headingFont, color: GOLD }}
      >
        {trackLabel}: {currentLevelData?.name || "None"}
      </h4>

      {/* Progress bar */}
      <div className="flex gap-1 mb-3">
        {trackData.map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-2.5 rounded-sm"
            style={{
              backgroundColor: idx <= currentLevel ? GOLD : "#2a2318",
              border: "1px solid #6a5a42",
            }}
          />
        ))}
      </div>

      {/* Current level description */}
      <p className="text-xs mb-3 italic" style={{ color: LABEL_TAN }}>
        {currentLevelData?.description}
      </p>

      {/* Next upgrade info */}
      {next ? (
        <div className="p-3 rounded-md" style={{ border: "1px solid #6a5a42", backgroundColor: INNER_BG }}>
          <div className="flex justify-between items-start mb-1">
            <span
              className="font-semibold text-sm"
              style={{ ...headingFont, color: TEXT_TAN }}
            >
              Next: {next.name}
            </span>
            <span className="text-xs font-bold" style={{ color: GREEN }}>
              +{next.defense} defense
            </span>
          </div>
          <p className="text-xs mb-2" style={{ color: LABEL_TAN }}>
            {next.description}
          </p>
          <div className="text-xs mb-2" style={{ color: VALUE_GOLD }}>
            Cost: {next.cost}d
          </div>

          {/* Prerequisite lock */}
          {!canUp && reason && (
            <div className="text-xs mb-2 flex items-center gap-1" style={{ color: DANGER_RED }}>
              <span>{"\u26BF"}</span>
              <span>{reason}</span>
            </div>
          )}

          <ActionButton
            onClick={() => onUpgrade(trackName)}
            disabled={!isUpgradeable}
          >
            {isUpgradeable ? `Upgrade (${next.cost}d)` : !canUp ? "Locked" : "Cannot Afford"}
          </ActionButton>
        </div>
      ) : (
        <p className="text-xs font-semibold" style={{ color: GREEN }}>
          Maximum fortification reached
        </p>
      )}
    </div>
  );
}

// ─── Section Heading ─────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h3
      className="text-sm font-bold uppercase tracking-wider mb-3"
      style={{ ...headingFont, color: GOLD }}
    >
      {children}
    </h3>
  );
}

// ─── Military Chronicle keywords ─────────────────────────────────

const MILITARY_KEYWORDS = [
  "garrison", "soldier", "raid", "castle", "wall", "gate", "moat",
  "defense", "recruit", "dismiss", "deserted", "knight", "levy",
  "men-at-arms", "fortif", "watchtower", "palisade", "portcullis",
  "barbican", "morale",
];

function isMilitaryEntry(entry) {
  const text = (entry.text || "").toLowerCase();
  return MILITARY_KEYWORDS.some(kw => text.includes(kw));
}

// ─── Main Component ──────────────────────────────────────────────

export default function MilitaryTab({ state, onRecruit, onDismiss, onUpgradeFortification, onOpenWatchtower }) {
  const [defenseExpanded, setDefenseExpanded] = useState(false);
  const [chronicleExpanded, setChronicleExpanded] = useState(false);

  // Fallback for old saves without state.military
  const mil = state.military ?? {
    garrison: { levy: state.garrison || 0, menAtArms: 0, knights: 0 },
    walls: state.castleLevel || 1,
    gate: 0,
    moat: 0,
    morale: 50,
    idleSeasons: 0,
    totalRecruitmentSpending: 0,
    totalUpkeepSpending: 0,
    totalFortificationSpending: 0,
    soldiersLostToRaids: 0,
    soldiersLostToDesertion: 0,
    scribesNoteSeen: {},
  };

  const watchtowerBonus = state.watchtower?.defenseBonus || 0;
  const defenseRating = calculateDefenseRating(mil, watchtowerBonus);
  const breakdown = getDefenseBreakdown(mil, watchtowerBonus);
  const moraleLevel = getMoraleLevel(mil.morale);
  const totalUpkeep = getMilitaryUpkeep(mil.garrison);
  const estimatedIncome = (state.castleLevel || 1) * 5;
  const upkeepPercent = estimatedIncome > 0 ? Math.round((totalUpkeep / estimatedIncome) * 100) : 0;
  const currentLevels = { walls: mil.walls, gate: mil.gate, moat: mil.moat };

  // Morale bar color
  function getMoraleBarColor(morale) {
    if (morale <= 20) return DANGER_RED;
    if (morale <= 40) return "#d48a2a";
    if (morale <= 60) return "#6a5a42";
    if (morale <= 80) return GREEN;
    return GOLD;
  }

  // Upkeep color
  function getUpkeepColor() {
    if (upkeepPercent < 30) return GREEN;
    if (upkeepPercent <= 50) return "#d48a2a";
    return DANGER_RED;
  }

  // Military chronicle entries
  const militaryChronicle = (state.chronicle || []).filter(isMilitaryEntry).reverse();

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ──── 1. Watchtower Access Card ──── */}
      <div
        onClick={onOpenWatchtower}
        className="rounded-lg p-4 mb-4 cursor-pointer transition-all duration-200"
        style={{
          backgroundColor: "#1a1e24",
          border: "1px solid #4a6a8a",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#6a8aaa";
          e.currentTarget.style.backgroundColor = "#1e2530";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#4a6a8a";
          e.currentTarget.style.backgroundColor = "#1a1e24";
        }}
      >
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-1"
          style={{ ...headingFont, color: "#8ab4d6" }}
        >
          {"\u26CA"} Climb the Watchtower
        </h3>
        <p className="text-sm" style={{ color: "#8a9aaa" }}>
          Survey the horizon. Hear your captain's report.
        </p>
        {state.watchtower?.scannedThisSeason && (
          <span
            className="text-xs font-bold uppercase tracking-wider mt-1 inline-block"
            style={{ color: GREEN }}
          >
            {"\u2713"} Scanned this season
          </span>
        )}
      </div>

      {/* ──── 2. Raid Defense Status ──── */}
      <div
        className="rounded-lg p-4 mb-4"
        style={{ backgroundColor: CARD_BG, border: "1px solid #6a5a42" }}
      >
        <SectionHeading>{"\u2694"} Raid Defense Status</SectionHeading>
        <div className="grid grid-cols-1 gap-2 text-base" style={{ color: LABEL_TAN }}>
          <div className="flex items-center justify-between">
            <span>
              <span className="font-semibold" style={{ color: TEXT_TAN }}>Outlaws:</span>{" "}
              {CRIMINAL_DEFENSE_THRESHOLD} defense
            </span>
            <span
              className="font-bold text-sm uppercase tracking-wider"
              style={{ color: defenseRating >= CRIMINAL_DEFENSE_THRESHOLD ? GREEN : DANGER_RED }}
            >
              {defenseRating >= CRIMINAL_DEFENSE_THRESHOLD ? "\u2713 DEFENDED" : "\u2717 VULNERABLE"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>
              <span className="font-semibold" style={{ color: TEXT_TAN }}>Scots:</span>{" "}
              {SCOTTISH_DEFENSE_THRESHOLD} defense
            </span>
            <span
              className="font-bold text-sm uppercase tracking-wider"
              style={{ color: defenseRating >= SCOTTISH_DEFENSE_THRESHOLD ? GREEN : DANGER_RED }}
            >
              {defenseRating >= SCOTTISH_DEFENSE_THRESHOLD ? "\u2713 DEFENDED" : "\u2717 VULNERABLE"}
            </span>
          </div>
        </div>
        <div className="mt-2 text-sm" style={{ color: LABEL_TAN }}>
          <Tooltip text={MILITARY_TOOLTIPS.defenseRating}>
            <span className="font-semibold" style={{ color: TEXT_TAN }}>Defense Rating:</span>
          </Tooltip>{" "}
          <span className="font-bold text-lg" style={{ color: VALUE_GOLD }}>{defenseRating}</span>
        </div>
      </div>

      {/* ──── 3. Defense Rating Breakdown (Collapsible) ──── */}
      <div
        className="rounded-lg mb-4 overflow-hidden"
        style={{ backgroundColor: CARD_BG, border: "1px solid #6a5a42" }}
      >
        <button
          className="w-full p-4 text-left flex justify-between items-center cursor-pointer"
          style={{ backgroundColor: CARD_BG, border: "none", color: TEXT_TAN }}
          onClick={() => setDefenseExpanded(!defenseExpanded)}
        >
          <span className="text-sm font-bold uppercase tracking-wider" style={{ ...headingFont, color: GOLD }}>
            {"\u2261"} Defense Breakdown
          </span>
          <span className="text-sm" style={{ color: LABEL_TAN }}>
            {defenseExpanded ? "\u25B2" : "\u25BC"}
          </span>
        </button>

        {defenseExpanded && (
          <div className="px-4 pb-4 text-sm" style={{ color: LABEL_TAN }}>
            {/* Garrison section */}
            <div className="mb-3">
              <div className="font-semibold uppercase text-xs tracking-wider mb-1" style={{ color: TEXT_TAN }}>
                Garrison
              </div>
              {breakdown.garrisonItems.length === 0 && (
                <div className="text-xs italic" style={{ color: LABEL_TAN }}>No soldiers stationed</div>
              )}
              {breakdown.garrisonItems.map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span>{item.label} ({item.count} x {item.value})</span>
                  <span style={{ color: VALUE_GOLD }}>{item.total}</span>
                </div>
              ))}
              <div className="flex justify-between mt-1 pt-1" style={{ borderTop: "1px solid #3a3228" }}>
                <span className="font-semibold" style={{ color: TEXT_TAN }}>Garrison subtotal</span>
                <span style={{ color: VALUE_GOLD }}>{breakdown.garrisonTotal}</span>
              </div>
            </div>

            {/* Fortifications section */}
            <div className="mb-3">
              <div className="font-semibold uppercase text-xs tracking-wider mb-1" style={{ color: TEXT_TAN }}>
                Fortifications
              </div>
              {breakdown.fortItems.map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span>{item.label}</span>
                  <span style={{ color: VALUE_GOLD }}>{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between mt-1 pt-1" style={{ borderTop: "1px solid #3a3228" }}>
                <span className="font-semibold" style={{ color: TEXT_TAN }}>Fortifications subtotal</span>
                <span style={{ color: VALUE_GOLD }}>{breakdown.fortTotal}</span>
              </div>
            </div>

            {/* Modifiers section */}
            <div className="mb-3">
              <div className="font-semibold uppercase text-xs tracking-wider mb-1" style={{ color: TEXT_TAN }}>
                Modifiers
              </div>
              {breakdown.modifierItems.map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span>{item.label}</span>
                  <span style={{ color: item.numericMod < 0 ? DANGER_RED : item.numericMod > 0 ? GREEN : LABEL_TAN }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between pt-2 text-base font-bold" style={{ borderTop: "2px solid #6a5a42" }}>
              <span style={{ ...headingFont, color: GOLD }}>Total Defense Rating</span>
              <span style={{ color: VALUE_GOLD }}>{breakdown.total}</span>
            </div>

            {/* Raid thresholds */}
            <div className="mt-3 pt-2 text-xs" style={{ borderTop: "1px solid #3a3228" }}>
              <div className="flex justify-between">
                <span>Outlaw threshold ({CRIMINAL_DEFENSE_THRESHOLD})</span>
                <span style={{ color: breakdown.total >= CRIMINAL_DEFENSE_THRESHOLD ? GREEN : DANGER_RED }}>
                  {breakdown.total >= CRIMINAL_DEFENSE_THRESHOLD ? "\u2713" : "\u2717"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Scottish threshold ({SCOTTISH_DEFENSE_THRESHOLD})</span>
                <span style={{ color: breakdown.total >= SCOTTISH_DEFENSE_THRESHOLD ? GREEN : DANGER_RED }}>
                  {breakdown.total >= SCOTTISH_DEFENSE_THRESHOLD ? "\u2713" : "\u2717"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──── 4. Castle SVG Visualization ──── */}
      <div
        className="rounded-lg p-4 mb-4"
        style={{ backgroundColor: CARD_BG, border: "1px solid #6a5a42" }}
      >
        <SectionHeading>{"\u265B"} Your Castle</SectionHeading>
        <CastleSVG walls={mil.walls} gate={mil.gate} moat={mil.moat} />
        <div className="text-center text-xs mt-2" style={{ color: LABEL_TAN }}>
          {WALLS_TRACK[mil.walls]?.name || "No Walls"}
          {mil.gate > 0 && ` \u00B7 ${GATE_TRACK[mil.gate]?.name}`}
          {mil.moat > 0 && ` \u00B7 ${MOAT_TRACK[mil.moat]?.name}`}
        </div>
      </div>

      {/* ──── 5. Garrison — Soldier Type Cards ──── */}
      <div className="mb-4">
        <SectionHeading>{"\u2694"} Garrison</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(SOLDIER_TYPES).map(([type, typeData]) => (
            <SoldierCard
              key={type}
              type={type}
              typeData={typeData}
              count={mil.garrison[type] || 0}
              state={state}
              onRecruit={onRecruit}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      </div>

      {/* ──── 6. Morale Bar ──── */}
      <div
        className="rounded-lg p-4 mb-4"
        style={{ backgroundColor: CARD_BG, border: "1px solid #6a5a42" }}
      >
        <Tooltip text={MILITARY_TOOLTIPS.morale}>
          <SectionHeading>
            Morale: {moraleLevel.label} ({mil.morale}/100)
          </SectionHeading>
        </Tooltip>

        {/* Progress bar */}
        <div
          className="w-full h-4 rounded-full overflow-hidden mb-2"
          style={{ backgroundColor: "#2a2318", border: "1px solid #3a3228" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${mil.morale}%`,
              backgroundColor: getMoraleBarColor(mil.morale),
            }}
          />
        </div>

        {/* Modifier display */}
        <div className="text-sm" style={{ color: LABEL_TAN }}>
          Defense modifier:{" "}
          <span style={{ color: moraleLevel.modifier > 0 ? GREEN : moraleLevel.modifier < 0 ? DANGER_RED : LABEL_TAN }}>
            {moraleLevel.modifier > 0 ? "+" : ""}{Math.round(moraleLevel.modifier * 100)}% defense
          </span>
        </div>

        {/* Low morale warning */}
        {mil.morale < 40 && (
          <p className="text-xs mt-2 font-semibold" style={{ color: DANGER_RED }}>
            Low morale — soldiers may desert
          </p>
        )}
      </div>

      {/* ──── 7. Upkeep Summary ──── */}
      <div
        className="rounded-lg p-4 mb-4"
        style={{ backgroundColor: CARD_BG, border: "1px solid #6a5a42" }}
      >
        <Tooltip text={MILITARY_TOOLTIPS.upkeep}>
          <SectionHeading>{"\u2696"} Upkeep Summary</SectionHeading>
        </Tooltip>

        <div className="text-sm space-y-1 mb-2" style={{ color: LABEL_TAN }}>
          {(mil.garrison.levy || 0) > 0 && (
            <div className="flex justify-between">
              <span>Levy ({mil.garrison.levy} x {SOLDIER_TYPES.levy.upkeep}d)</span>
              <span style={{ color: VALUE_GOLD }}>{mil.garrison.levy * SOLDIER_TYPES.levy.upkeep}d</span>
            </div>
          )}
          {(mil.garrison.menAtArms || 0) > 0 && (
            <div className="flex justify-between">
              <span>Men-at-Arms ({mil.garrison.menAtArms} x {SOLDIER_TYPES.menAtArms.upkeep}d)</span>
              <span style={{ color: VALUE_GOLD }}>{mil.garrison.menAtArms * SOLDIER_TYPES.menAtArms.upkeep}d</span>
            </div>
          )}
          {(mil.garrison.knights || 0) > 0 && (
            <div className="flex justify-between">
              <span>Knights ({mil.garrison.knights} x {SOLDIER_TYPES.knights.upkeep}d)</span>
              <span style={{ color: VALUE_GOLD }}>{mil.garrison.knights * SOLDIER_TYPES.knights.upkeep}d</span>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2 text-sm font-bold" style={{ borderTop: "1px solid #3a3228" }}>
          <span style={{ color: TEXT_TAN }}>Total per season</span>
          <span style={{ color: VALUE_GOLD }}>{totalUpkeep}d</span>
        </div>

        <div className="flex justify-between mt-1 text-xs">
          <span style={{ color: LABEL_TAN }}>
            % of estimated income (~{estimatedIncome}d)
          </span>
          <span className="font-bold" style={{ color: getUpkeepColor() }}>
            {upkeepPercent}%
          </span>
        </div>
      </div>

      {/* ──── 8. Fortification Upgrade Tracks ──── */}
      <div className="mb-4 space-y-3">
        <SectionHeading>{"\u2616"} Fortifications</SectionHeading>
        <FortificationTrack
          trackName="walls"
          trackData={WALLS_TRACK}
          currentLevel={mil.walls}
          currentLevels={currentLevels}
          denarii={state.denarii}
          onUpgrade={onUpgradeFortification}
        />
        <FortificationTrack
          trackName="gate"
          trackData={GATE_TRACK}
          currentLevel={mil.gate}
          currentLevels={currentLevels}
          denarii={state.denarii}
          onUpgrade={onUpgradeFortification}
        />
        <FortificationTrack
          trackName="moat"
          trackData={MOAT_TRACK}
          currentLevel={mil.moat}
          currentLevels={currentLevels}
          denarii={state.denarii}
          onUpgrade={onUpgradeFortification}
        />
      </div>

      {/* ──── 9. Military Chronicle (Collapsible) ──── */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: CARD_BG, border: "1px solid #6a5a42" }}
      >
        <button
          className="w-full p-4 text-left flex justify-between items-center cursor-pointer"
          style={{ backgroundColor: CARD_BG, border: "none", color: TEXT_TAN }}
          onClick={() => setChronicleExpanded(!chronicleExpanded)}
        >
          <span className="text-sm font-bold uppercase tracking-wider" style={{ ...headingFont, color: GOLD }}>
            {"\u270D"} Military Chronicle ({militaryChronicle.length})
          </span>
          <span className="text-sm" style={{ color: LABEL_TAN }}>
            {chronicleExpanded ? "\u25B2" : "\u25BC"}
          </span>
        </button>

        {chronicleExpanded && (
          <div className="px-4 pb-4 max-h-64 overflow-y-auto">
            {militaryChronicle.length === 0 ? (
              <p className="text-xs italic" style={{ color: LABEL_TAN }}>
                No military events recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {militaryChronicle.map((entry, idx) => {
                  const textLower = (entry.text || "").toLowerCase();
                  const isRaid = textLower.includes("raid") || textLower.includes("attack") || textLower.includes("scot");
                  const isVictory = textLower.includes("defended") || textLower.includes("victory") || textLower.includes("repelled");
                  const isDefeat = textLower.includes("defeat") || textLower.includes("lost") || textLower.includes("plunder") || textLower.includes("deserted");

                  let entryColor = LABEL_TAN;
                  if (isVictory) entryColor = GREEN;
                  else if (isDefeat) entryColor = DANGER_RED;

                  const icon = isRaid ? "\u2694" : "\u2022";

                  return (
                    <div key={idx} className="text-xs" style={{ color: entryColor }}>
                      <span className="mr-1">{icon}</span>
                      <span className="font-semibold" style={{ color: TEXT_TAN }}>
                        {entry.season} Y{entry.year}:
                      </span>{" "}
                      {entry.text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
