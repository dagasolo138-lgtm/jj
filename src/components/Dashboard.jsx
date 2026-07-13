/**
 * Dashboard.jsx
 *
 * Royal Dark themed top bar showing all key estate resources.
 * Row 1: Primary resources (denarii, food, population, garrison)
 * Row 2: Season info, turn progress bar
 */

import { Coins, Wheat, Users, Swords, Cross, Church, Heart } from "lucide-react";
import { getMoraleLevel } from "../data/military.js";

const RESOURCE_THEMES = {
  denarii: { color: "#c4a24a", Icon: Coins },
  food: { color: "#4a8a3a", Icon: Wheat },
  families: { color: "#2962a8", Icon: Users },
  garrison: { color: "#8b1a1a", Icon: Swords },
  morale: { color: "#d48a2a", Icon: Heart },
  faith: { color: "#7eb8d4", Icon: Cross },
  piety: { color: "#b89adb", Icon: Church },
};

const SEASON_SYMBOLS = {
  spring: "\u2741",
  summer: "\u2600",
  autumn: "\u2767",
  winter: "\u2744",
};

function ResourceStat({ resourceKey, label, value, warning, delta }) {
  const theme = RESOURCE_THEMES[resourceKey] || RESOURCE_THEMES.denarii;
  const { color: borderColor, Icon } = theme;

  return (
    <div
      className={`flex flex-col items-center gap-1 px-3 py-2${warning ? " critical-pulse" : ""}`}
      style={{
        minWidth: 80,
        borderBottom: `3px solid ${borderColor}`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={16} color="#a89070" aria-hidden="true" />
        <span
          className="font-heading font-semibold"
          style={{
            color: "#a89070",
            fontSize: "0.7rem",
            fontVariant: "small-caps",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          data-testid={`resource-${resourceKey}`}
          className="text-2xl"
          style={{
            color: "#e8c44a",
            fontWeight: 700,
            transition: "all 0.5s ease",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
        {delta !== undefined && delta !== 0 && (
          <span
            className="text-sm font-bold"
            style={{ color: delta > 0 ? "#4a8a3a" : "#c62828" }}
          >
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
    </div>
  );
}

function MoraleStat({ morale }) {
  const level = getMoraleLevel(morale);
  const warning = morale <= 20;

  return (
    <div
      className={`flex flex-col items-center gap-1 px-3 py-2${warning ? " critical-pulse" : ""}`}
      style={{
        minWidth: 80,
        borderBottom: `3px solid ${level.color}`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Heart size={16} color="#a89070" aria-hidden="true" />
        <span
          className="font-heading font-semibold"
          style={{
            color: "#a89070",
            fontSize: "0.7rem",
            fontVariant: "small-caps",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Morale
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span
          data-testid="resource-morale"
          className="text-2xl"
          style={{
            color: level.color,
            fontWeight: 700,
            transition: "all 0.5s ease",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {morale}
        </span>
        <span
          className="text-xs font-semibold"
          style={{ color: level.color, lineHeight: 1 }}
        >
          {level.label}
        </span>
      </div>
    </div>
  );
}

function FlipStatBar({ flipStats }) {
  if (!flipStats) return null;

  return (
    <div
      className="px-3 py-2 flex justify-center gap-3 sm:gap-5"
      style={{ background: "linear-gradient(180deg, #1a1610 0%, #0f0d0a 100%)" }}
    >
      {flipStats.map((stat) => (
        <div
          key={stat.key}
          className="flex flex-col items-center gap-0.5 transition-all duration-300"
          style={{ minWidth: 70 }}
          role="meter"
          aria-label={`${stat.label}: ${stat.value} out of 100`}
          aria-valuenow={stat.value}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="flex items-center gap-1">
            <span className="text-base" aria-hidden="true">{stat.icon}</span>
            <span
              className="text-sm font-heading font-semibold uppercase tracking-wide"
              style={{ color: stat.color }}
            >
              {stat.label}
            </span>
          </div>
          <div
            className="w-full h-4 rounded-full overflow-hidden border"
            style={{
              borderColor: stat.color,
              backgroundColor: "#0f0d0a",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${stat.value}%`,
                backgroundColor: stat.color,
              }}
            />
          </div>
          <span className="text-sm font-bold" style={{ color: stat.color }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResourceWarningBanner({ denarii, food, population, garrison, bankruptcyTurns }) {
  const warnings = [];

  if (population <= 5) {
    warnings.push("Population is critically low! Build farms to grow food and attract settlers.");
  }
  if (food <= 0) {
    warnings.push("No food! Your people will starve and leave. Buy grain or build farms immediately.");
  }
  if (denarii <= 0) {
    const turnsLeft = 3 - (bankruptcyTurns || 0);
    warnings.push(`Treasury is empty! ${turnsLeft > 0 ? `${turnsLeft} more seasons and creditors seize your estate.` : "Creditors are at the gate!"} Sell goods or cut spending.`);
  }
  if (garrison <= 0) {
    warnings.push("No garrison! Your estate is defenseless against raids.");
  }

  if (warnings.length === 0) return null;

  return (
    <div
      className="px-3 py-2 flex flex-col gap-1"
      style={{
        backgroundColor: "rgba(198, 40, 40, 0.1)",
        borderLeft: "3px solid #8b1a1a",
      }}
    >
      {warnings.map((w, i) => (
        <p
          key={i}
          className="text-xs sm:text-sm font-bold text-center"
          style={{ color: "#c62828" }}
        >
          {w}
        </p>
      ))}
    </div>
  );
}

function TurnProgressBar({ turn }) {
  const progress = ((turn - 1) / 39) * 100;

  return (
    <div
      className="relative w-full sm:w-48"
      style={{ height: 8 }}
    >
      {/* Track */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{ backgroundColor: "#0f0d0a" }}
      >
        {/* Fill */}
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #1a3a6b, #8b1a1a)",
          }}
        />
      </div>
      {/* Diamond marker */}
      <span
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          left: `${progress}%`,
          transform: `translateX(-50%) translateY(-50%)`,
          color: "#c4a24a",
          fontSize: "0.65rem",
          lineHeight: 1,
          textShadow: "0 0 4px rgba(196, 162, 74, 0.6)",
        }}
        aria-hidden="true"
      >
        {"\u25C6"}
      </span>
    </div>
  );
}

export default function Dashboard({
  denarii,
  food,
  population,
  garrison,
  morale,
  faith,
  piety,
  season,
  year,
  turn,
  resourceDeltas,
  bankruptcyTurns,
  flipMode,
  flipStats,
}) {
  const seasonLabel = season ? season.charAt(0).toUpperCase() + season.slice(1) : "";
  const deltas = resourceDeltas || {};

  return (
    <div
      className="w-full"
      style={{
        background: "linear-gradient(180deg, #1a1610 0%, #0f0d0a 100%)",
        borderBottom: "1px solid #8a7a3a",
      }}
    >
      {/* Row 1: Primary resources OR flip stats */}
      {flipMode && flipStats ? (
        <FlipStatBar flipStats={flipStats} />
      ) : (
        <div className="px-3 py-1 flex justify-center gap-4 sm:gap-6">
          <ResourceStat
            resourceKey="denarii"
            label="Denarii"
            value={`${denarii}d`}
            warning={denarii <= 0}
            delta={deltas.denarii}
          />
          <ResourceStat
            resourceKey="food"
            label="Food"
            value={food}
            warning={food <= 0}
            delta={deltas.food}
          />
          <ResourceStat
            resourceKey="families"
            label="Families"
            value={population}
            warning={population <= 5}
            delta={deltas.population}
          />
          <ResourceStat
            resourceKey="garrison"
            label="Garrison"
            value={garrison}
            warning={garrison <= 0}
            delta={deltas.garrison}
          />
          <MoraleStat morale={morale ?? 50} />
          <ResourceStat
            resourceKey="faith"
            label="Faith"
            value={faith}
          />
          <ResourceStat
            resourceKey="piety"
            label="Piety"
            value={piety}
          />
        </div>
      )}

      {/* Warning banners */}
      {!flipMode && (
        <ResourceWarningBanner
          denarii={denarii}
          food={food}
          population={population}
          garrison={garrison}
          bankruptcyTurns={bankruptcyTurns}
        />
      )}

      {/* Row 2: Season info + turn progress */}
      {!flipMode && (
        <div
          className="px-3 py-2 flex flex-wrap justify-center items-center gap-x-4 gap-y-2"
          style={{
            backgroundColor: "#1a1610",
            borderTop: "1px solid #8a7a3a",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              style={{ color: "#c4a24a", fontSize: "1rem" }}
              aria-hidden="true"
            >
              {SEASON_SYMBOLS[season] || ""}
            </span>
            <span
              className="font-heading font-semibold"
              style={{
                color: "#c4a24a",
                fontFamily: "Cinzel, serif",
                fontSize: "0.85rem",
                letterSpacing: "1px",
              }}
            >
              {seasonLabel}, Year {year} (Turn {turn}/40)
            </span>
          </div>
          <TurnProgressBar turn={turn} />
        </div>
      )}
    </div>
  );
}
