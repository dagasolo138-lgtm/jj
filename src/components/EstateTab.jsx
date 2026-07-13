/**
 * EstateTab.jsx
 *
 * Rebuilt estate management tab with:
 * - Contextual tip bar
 * - Enhanced economy overview with season badge
 * - Land system (finite plots)
 * - Expanded inventory display
 * - Split view: Your Buildings (management cards) + Build New (purchase cards)
 * - Building condition meters, repair, upgrade
 * - Production chain / synergy display
 */

import { useState } from "react";
import BUILDINGS, { BUILDING_LIST } from "../data/buildings.js";
import {
  RESOURCE_CONFIG,
  FOOD_RESOURCES,
  SEASON_INFO,
  SEASON_FARM_MULTIPLIERS,
  STARTING_TOTAL_PLOTS,
  REPAIR_COST_PER_POINT,
} from "../data/economy.js";
import {
  canBuildBuilding,
  getTotalBuildingUpkeep,
  getGarrisonUpkeep,
  getPassiveIncome,
  getFoodConsumption,
  getUsedPlots,
  getBuildingType,
  getConditionMultiplier,
  getRepairCost,
  getActiveBuildingSynergies,
} from "../engine/economyEngine.js";
import { getSynergyBuildings } from "../engine/synergyEngine.js";
import { getConditionLevel } from "../data/economy.js";

// ---------------------------------------------------------------------------
// Color constants
// ---------------------------------------------------------------------------

const RARITY_COLORS = {
  common:   { border: "rgba(140, 110, 70, 0.5)", glow: "rgba(140, 110, 70, 0.08)", bg: "rgba(140, 110, 70, 0.03)" },
  uncommon: { border: "rgba(160, 170, 80, 0.6)", glow: "rgba(160, 170, 80, 0.08)", bg: "rgba(160, 170, 80, 0.04)" },
  rare:     { border: "rgba(180, 100, 60, 0.6)", glow: "rgba(180, 100, 60, 0.1)", bg: "rgba(180, 100, 60, 0.05)" },
};

const PRODUCTION_COLORS = {
  grain: "#8dba6e", livestock: "#8dba6e", fish: "#8dba6e", flour: "#8dba6e",
  timber: "#7eb8d4", clay: "#7eb8d4", iron: "#7eb8d4", stone: "#7eb8d4",
  steel: "#b8a0d4", coal: "#b8a0d4", leather: "#b8a0d4", wood: "#b8a0d4",
  wool: "#c9a84c", cloth: "#c9a84c", honey: "#c9a84c", herbs: "#c9a84c", ale: "#c9a84c",
};

/** Category colors for inventory grouping */
const CATEGORY_STYLES = {
  food:    { color: "#8dba6e", bg: "rgba(141, 186, 110, 0.08)", border: "rgba(141, 186, 110, 0.25)", label: "Food", icon: "\u2727" },
  raw:     { color: "#7eb8d4", bg: "rgba(126, 184, 212, 0.08)", border: "rgba(126, 184, 212, 0.25)", label: "Materials", icon: "\u2692" },
  forge:   { color: "#b8a0d4", bg: "rgba(184, 160, 212, 0.08)", border: "rgba(184, 160, 212, 0.25)", label: "Forge", icon: "\u2694" },
  trade:   { color: "#c9a84c", bg: "rgba(201, 168, 76, 0.08)",  border: "rgba(201, 168, 76, 0.25)",  label: "Trade Goods", icon: "\u2696" },
  buyOnly: { color: "#a89070", bg: "rgba(168, 144, 112, 0.06)", border: "rgba(168, 144, 112, 0.2)",  label: "Special", icon: "\u2726" },
};

const PLOT_COLORS = {
  food: "#8dba6e",
  material: "#7eb8d4",
  processing: "#c9a84c",
};

// ---------------------------------------------------------------------------
// Section header component
// ---------------------------------------------------------------------------

function SectionHeader({ title }) {
  return (
    <>
      <h3
        className="text-base font-bold uppercase mb-0"
        style={{
          fontFamily: '"Cinzel Decorative", "Cinzel", serif',
          color: "#c4a24a",
          letterSpacing: "2px",
        }}
      >
        {title}
      </h3>
      <div className="decorative-rule">
        <span style={{ color: "#8a7a3a" }}>{"\u25C6"}</span>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tip Bar
// ---------------------------------------------------------------------------

function TipBar({ state }) {
  const { buildings, food, population, season } = state;
  const usedPlots = getUsedPlots(buildings);
  const totalPlots = state.totalPlots ?? STARTING_TOTAL_PLOTS;
  const hasFoodBuilding = buildings.some((b) => {
    const def = BUILDINGS[getBuildingType(b)];
    return def?.isFarm;
  });
  const buildingsNeedRepair = buildings.some((b) => typeof b !== "string" && (b.condition ?? 100) < 75);
  const buildingsRuined = buildings.some((b) => typeof b !== "string" && (b.condition ?? 100) <= 24);
  const netIncome = getPassiveIncome(state.castleLevel, buildings) - getTotalBuildingUpkeep(buildings) - getGarrisonUpkeep(state.garrison, state.military);

  let tip = "";
  if (state.turn === 1 && buildings.length === 0) {
    tip = "Start by building a Strip Farm or Pasture \u2014 they produce food to keep your people alive and attract new settlers.";
  } else if (!hasFoodBuilding && buildings.length > 0) {
    tip = "You have no food production. Your people are eating through reserves. Build farms before it\u2019s too late.";
  } else if (usedPlots >= totalPlots) {
    tip = "All plots are in use. You\u2019ll need to demolish a building to make room, or wait for land grants from the crown.";
  } else if (season === "winter") {
    tip = "Winter is coming. Farm output drops to 25%. Make sure your granaries are stocked.";
  } else if (season === "autumn") {
    tip = "Harvest season! Farms produce 50% bonus output this season. A good time to be a lord.";
  } else if (buildingsRuined) {
    tip = "One of your buildings is in ruins. It produces nothing until repaired. Act quickly.";
  } else if (buildingsNeedRepair) {
    tip = "One of your buildings is in poor condition. Repair it before it stops producing entirely.";
  } else if (food > population * 3) {
    tip = "Food surplus attracts new families. Keep producing more than you consume and your village will grow.";
  } else if (netIncome < 0) {
    tip = "You\u2019re spending more than you earn. Reduce upkeep or increase income before your treasury runs dry.";
  } else if (buildings.length > 0 && buildings.length < 3) {
    tip = "Build more production buildings to diversify your economy. A manor that depends on one resource is fragile.";
  } else {
    tip = "Manage your estate wisely. Build, repair, and upgrade your buildings to grow your manor\u2019s wealth.";
  }

  return (
    <div
      className="rounded-lg px-3 py-2 mb-3 text-sm"
      style={{
        backgroundColor: "rgba(196, 162, 74, 0.06)",
        border: "1px solid rgba(196, 162, 74, 0.2)",
        color: "#a89070",
        fontFamily: '"Crimson Text", serif',
        fontStyle: "italic",
      }}
    >
      <span style={{ color: "#c4a24a", fontStyle: "normal" }}>{"\u25C6"} </span>
      {tip}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Economy Overview (Enhanced)
// ---------------------------------------------------------------------------

function EconomyOverview({ state }) {
  const {
    food, population,
    buildings, garrison, castleLevel, season,
  } = state;

  const garrisonFood = Math.ceil(garrison / 5);
  const consumption = getFoodConsumption(population) + garrisonFood;
  const buildingUpkeep = getTotalBuildingUpkeep(buildings);
  const garrisonUpkeep = getGarrisonUpkeep(garrison);
  const totalUpkeep = buildingUpkeep + garrisonUpkeep;
  const passiveIncome = getPassiveIncome(castleLevel, buildings);
  const netIncome = passiveIncome - totalUpkeep;
  const seasonInfo = SEASON_INFO[season] || SEASON_INFO.spring;
  const foodDanger = food < consumption * 2;

  return (
    <div
      className="rounded-lg p-3 mb-3 estate-section-glow"
      style={{
        backgroundColor: "#231e16",
        border: "1px solid #8a7a3a",
      }}
    >
      <SectionHeader title="Economy Overview" />

      {/* Season badge — full glow treatment */}
      <div
        className="mb-3 p-2.5 rounded-md flex items-center gap-2.5 season-glow"
        style={{
          background: `linear-gradient(135deg, ${seasonInfo.color}18 0%, ${seasonInfo.color}08 50%, ${seasonInfo.color}14 100%)`,
          border: `2px solid ${seasonInfo.color}50`,
          "--season-glow-color": `${seasonInfo.color}40`,
          "--season-glow-color-inner": `${seasonInfo.color}10`,
        }}
      >
        <span
          className="text-2xl stat-value-glow"
          style={{ color: seasonInfo.color }}
        >
          {seasonInfo.symbol}
        </span>
        <div>
          <span
            className="text-sm font-bold uppercase"
            style={{ color: seasonInfo.color, letterSpacing: "1.5px", fontFamily: '"Cinzel", serif', textShadow: `0 0 10px ${seasonInfo.color}60` }}
          >
            {seasonInfo.label}
          </span>
          <span className="text-xs ml-2" style={{ color: `${seasonInfo.color}cc` }}>
            {"\u2014"} {seasonInfo.desc}
          </span>
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard
          label="Food Supply"
          value={food}
          sub={`${"\u25BC"} ${consumption}/season need`}
          accent="#8dba6e"
          glowClass="estate-glow-green"
          warn={foodDanger}
          warnColor="#c97a4c"
          warnGlowClass="estate-glow-amber"
        />
        <StatCard
          label="Income"
          value={`${passiveIncome}d`}
          sub={`${"\u25B2"} per season`}
          accent="#7eb8d4"
          glowClass="estate-glow-blue"
        />
        <StatCard
          label="Upkeep"
          value={`${totalUpkeep}d`}
          sub={`${"\u25BC"} per season`}
          accent="#c97a4c"
          glowClass="estate-glow-amber"
        />
        <StatCard
          label="Net"
          value={`${netIncome >= 0 ? "+" : ""}${netIncome}d`}
          sub={netIncome >= 0 ? `${"\u25B2"} surplus` : `${"\u25BC"} deficit`}
          accent={netIncome >= 0 ? "#8dba6e" : "#d4726a"}
          glowClass={netIncome >= 0 ? "estate-glow-green" : "estate-glow-red"}
          pulse={netIncome < 0}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, glowClass, warn, warnColor, warnGlowClass, pulse }) {
  const displayAccent = warn ? (warnColor || "#c97a4c") : accent;
  const activeGlow = warn ? (warnGlowClass || glowClass) : glowClass;
  return (
    <div
      className={`rounded-md p-2.5 relative overflow-hidden ${activeGlow || ""}${pulse ? " critical-pulse" : ""}`}
      style={{
        background: `linear-gradient(160deg, ${displayAccent}1a 0%, #1a161208 40%, ${displayAccent}10 100%)`,
        border: `2px solid ${displayAccent}50`,
      }}
    >
      {/* Colored left accent bar — thicker, glowing */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[4px]"
        style={{
          backgroundColor: displayAccent,
          boxShadow: `0 0 8px ${displayAccent}80, 0 0 16px ${displayAccent}40`,
        }}
      />
      <div
        className="text-[10px] font-semibold uppercase pl-2"
        style={{ fontFamily: '"Cinzel", serif', color: `${displayAccent}dd`, letterSpacing: "1px" }}
      >
        {label}
      </div>
      <div
        className="text-xl font-bold pl-2 stat-value-glow"
        style={{ fontFamily: '"Cinzel", serif', color: displayAccent }}
      >
        {value}
      </div>
      <div className="text-[11px] pl-2" style={{ color: `${displayAccent}99` }}>
        {sub}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Land & Inventory
// ---------------------------------------------------------------------------

function LandAndInventory({ state }) {
  const { buildings, inventory, totalPlots: tp } = state;
  const totalPlots = tp ?? STARTING_TOTAL_PLOTS;
  const usedPlots = getUsedPlots(buildings);
  const plotFull = usedPlots >= totalPlots;

  // Build plot segments for the bar
  const plotSegments = [];
  for (const b of buildings) {
    const typeId = getBuildingType(b);
    const def = BUILDINGS[typeId];
    if (!def) continue;
    for (let i = 0; i < (def.plots ?? 1); i++) {
      plotSegments.push({
        color: PLOT_COLORS[def.category] || "#8a7a5a",
        label: def.name,
      });
    }
  }
  for (let i = plotSegments.length; i < totalPlots; i++) {
    plotSegments.push({ color: "transparent", label: "Empty" });
  }

  // Group inventory by category
  const categoryOrder = ["food", "raw", "forge", "trade"];
  const grouped = {};
  for (const cat of categoryOrder) grouped[cat] = [];
  for (const [resource, qty] of Object.entries(inventory)) {
    const cfg = RESOURCE_CONFIG[resource];
    if (!cfg) continue;
    const cat = cfg.category || "trade";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ resource, qty, cfg });
  }

  // Map categories to their glow class
  const CATEGORY_GLOW = {
    food: "estate-glow-green",
    raw: "estate-glow-blue",
    forge: "estate-glow-purple",
    trade: "estate-glow-gold",
  };

  return (
    <div
      className="rounded-lg p-3 mb-3 estate-section-glow"
      style={{
        backgroundColor: "#231e16",
        border: "1px solid #8a7a3a",
      }}
    >
      <SectionHeader title="Land & Inventory" />

      {/* Plot bar */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm" style={{ color: "#a89070", fontFamily: '"Cinzel", serif' }}>
            Plots:
          </span>
          <span className="text-sm font-bold stat-value-glow" style={{ color: plotFull ? "#d4726a" : "#e8c44a" }}>
            {usedPlots}/{totalPlots} used
          </span>
          {plotFull && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full estate-glow-red"
              style={{ backgroundColor: "rgba(212, 114, 106, 0.15)", color: "#d4726a", border: "1px solid rgba(212, 114, 106, 0.4)" }}>
              Full
            </span>
          )}
        </div>
        <div
          className="flex gap-0.5 h-5 rounded-md overflow-hidden plot-bar-glow"
          style={{ backgroundColor: "#1a1612", border: "2px solid #4a4030" }}
        >
          {plotSegments.map((seg, i) => (
            <div
              key={i}
              className="flex-1 transition-all duration-300 plot-segment"
              style={{
                backgroundColor: seg.color === "transparent" ? "rgba(106, 90, 66, 0.08)" : seg.color,
                borderRight: i < plotSegments.length - 1 ? "1px solid #0f0d0a" : "none",
                boxShadow: seg.color !== "transparent"
                  ? `inset 0 -2px 3px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.15), 0 0 6px ${seg.color}40`
                  : "none",
              }}
              title={seg.label}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-1.5 text-[10px]" style={{ color: "#8a7a5a" }}>
          <span><span style={{ color: PLOT_COLORS.food, textShadow: `0 0 6px ${PLOT_COLORS.food}80` }}>{"\u25A0"}</span> Food</span>
          <span><span style={{ color: PLOT_COLORS.material, textShadow: `0 0 6px ${PLOT_COLORS.material}80` }}>{"\u25A0"}</span> Materials</span>
          <span><span style={{ color: PLOT_COLORS.processing, textShadow: `0 0 6px ${PLOT_COLORS.processing}80` }}>{"\u25A0"}</span> Processing</span>
          <span><span style={{ color: "rgba(106, 90, 66, 0.4)" }}>{"\u25A1"}</span> Empty</span>
        </div>
      </div>

      {/* Category-grouped inventory with glow */}
      <div className="space-y-2.5">
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items || items.length === 0) return null;
          const catStyle = CATEGORY_STYLES[cat] || CATEGORY_STYLES.trade;
          const hasAny = items.some((item) => item.qty > 0);
          const glowClass = hasAny ? (CATEGORY_GLOW[cat] || "") : "";

          return (
            <div
              key={cat}
              className={`rounded-md p-2.5 inv-category-glow ${glowClass}`}
              style={{
                background: hasAny
                  ? `linear-gradient(145deg, ${catStyle.color}14 0%, ${catStyle.color}06 50%, ${catStyle.color}0a 100%)`
                  : "rgba(26, 22, 18, 0.5)",
                border: `2px solid ${hasAny ? `${catStyle.color}40` : "rgba(106, 90, 66, 0.12)"}`,
              }}
            >
              {/* Category header */}
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{
                  color: catStyle.color,
                  fontSize: "0.85rem",
                  textShadow: hasAny ? `0 0 8px ${catStyle.color}80` : "none",
                }}>
                  {catStyle.icon}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: catStyle.color,
                    fontFamily: '"Cinzel", serif',
                    textShadow: hasAny ? `0 0 6px ${catStyle.color}50` : "none",
                  }}
                >
                  {catStyle.label}
                </span>
                <div className="flex-1 h-px" style={{
                  background: hasAny
                    ? `linear-gradient(90deg, ${catStyle.color}30 0%, transparent 100%)`
                    : `${catStyle.color}12`,
                }} />
              </div>

              {/* Resource items */}
              <div className="flex flex-wrap gap-1.5">
                {items.map(({ resource, qty, cfg }) => {
                  const dimmed = qty === 0;
                  const highlight = qty > 50;
                  return (
                    <span
                      key={resource}
                      className="inline-flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-md transition-all duration-200"
                      style={{
                        background: dimmed
                          ? "transparent"
                          : `linear-gradient(135deg, ${catStyle.color}12 0%, ${catStyle.color}06 100%)`,
                        border: `1px solid ${dimmed ? `${catStyle.color}10` : `${catStyle.color}35`}`,
                        opacity: dimmed ? 0.3 : 1,
                        boxShadow: highlight ? `0 0 8px ${catStyle.color}25, inset 0 0 6px ${catStyle.color}10` : "none",
                      }}
                    >
                      <span style={{
                        color: catStyle.color,
                        fontSize: "0.9rem",
                        textShadow: !dimmed ? `0 0 6px ${catStyle.color}60` : "none",
                      }}>
                        {cfg.icon}
                      </span>
                      <span style={{ color: dimmed ? "#4a4030" : "#b8a888", fontSize: "0.8rem" }}>
                        {cfg.label}
                      </span>
                      <span style={{
                        color: dimmed ? "#4a4030" : highlight ? catStyle.color : "#e8c44a",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        fontFamily: '"Cinzel", serif',
                        textShadow: highlight ? `0 0 8px ${catStyle.color}60` : (!dimmed ? "0 0 6px rgba(232, 196, 74, 0.3)" : "none"),
                      }}>
                        {qty}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Built Building Management Card
// ---------------------------------------------------------------------------

function BuiltBuildingCard({ building, buildingIndex, state, onRepair, onUpgrade, onDemolish }) {
  const [showInfo, setShowInfo] = useState(false);
  const typeId = getBuildingType(building);
  const def = BUILDINGS[typeId];
  if (!def) return null;

  const condition = typeof building === "string" ? 100 : (building.condition ?? 100);
  const condLevel = getConditionLevel(condition);
  const condMod = getConditionMultiplier(condition);
  const rarity = RARITY_COLORS[def.rarity] || RARITY_COLORS.common;
  const repairCost = getRepairCost(building);
  const canRepair = condition < 100 && state.denarii >= repairCost;
  const needsRepair = condition < 75;
  const upgradeDef = def.upgradeTo ? BUILDINGS[def.upgradeTo] : null;
  const canUpgrade = upgradeDef && state.denarii >= (def.upgradeCost ?? upgradeDef.cost);

  // Season modifier display
  const seasonMult = def.isFarm ? SEASON_FARM_MULTIPLIERS[state.season] : 1.0;

  // Active synergies for this building
  const activeSyns = (def.buildingSynergies || []).map((syn) => ({
    ...syn,
    active: state.buildings.some((b) => getBuildingType(b) === syn.with),
  }));

  return (
    <div
      className="rounded-lg p-3 flex flex-col"
      style={{
        backgroundColor: "#231e16",
        border: `1px solid ${condition <= 24 ? "#d4726a" : condition <= 49 ? "#c97a4c" : "#c4a24a"}`,
        animation: "card-enter 300ms ease backwards",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 36, height: 36,
              backgroundColor: `${rarity.border}`,
              color: "#1a1612",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            {def.icon}
          </div>
          <div>
            <h4
              className="text-sm leading-tight"
              style={{ fontFamily: '"Cinzel", serif', fontWeight: 600, color: "#c8b090" }}
            >
              {def.name}
            </h4>
            <p className="text-[11px] italic" style={{ color: "#6a5a42" }}>
              {def.latin}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: `${rarity.border}`, color: "#fff" }}
        >
          {def.rarity}
        </span>
      </div>

      {/* Condition bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[11px] mb-0.5">
          <span style={{ color: "#a89070", fontFamily: '"Cinzel", serif' }}>Condition:</span>
          <span style={{ color: condLevel.color, fontWeight: 600 }}>
            {condLevel.label} ({condition}%)
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#1a1612" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${condition}%`,
              backgroundColor: condLevel.color,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm space-y-0.5 mb-2">
        <div>
          <span style={{ fontFamily: '"Cinzel", serif', color: "#8a7a3a" }}>Output:</span>{" "}
          {Object.entries(def.produces).map(([res, amt], i) => {
            const effective = condMod === 0 ? 0 : Math.max(1, Math.round(amt * condMod * seasonMult));
            const cfg = RESOURCE_CONFIG[res];
            const color = PRODUCTION_COLORS[res] || "#c4a24a";
            return (
              <span key={res}>
                {i > 0 && ", "}
                <span style={{ color }}>
                  {effective} {cfg?.icon || ""} {res}
                </span>
              </span>
            );
          })}
          {def.isFarm && seasonMult !== 1.0 && (
            <span className="text-[11px] ml-1" style={{ color: SEASON_INFO[state.season]?.color || "#6a5a42" }}>
              ({"\u00D7"}{seasonMult} {state.season})
            </span>
          )}
          {condMod < 1.0 && condMod > 0 && (
            <span className="text-[11px] ml-1" style={{ color: "#c97a4c" }}>
              ({Math.round(condMod * 100)}% condition)
            </span>
          )}
          {condMod === 0 && (
            <span className="text-[11px] ml-1" style={{ color: "#d4726a" }}>(ruined)</span>
          )}
          <span className="text-[11px]" style={{ color: "#6a5a42" }}>/season</span>
        </div>
        <div>
          <span style={{ fontFamily: '"Cinzel", serif', color: "#8a7a3a" }}>Upkeep:</span>{" "}
          <span style={{ color: "#c4a24a" }}>{def.upkeep}d/season</span>
        </div>
        {activeSyns.length > 0 && activeSyns.map((syn, i) => (
          <div key={i} className="text-[11px]">
            <span style={{ color: syn.active ? "#c4a24a" : "#4a4030" }}>
              {syn.active ? "\u2713" : "\u2014"} {syn.desc}
              {!syn.active && (
                <span style={{ color: "#4a4030" }}> (not built)</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-auto flex gap-1.5 flex-wrap">
        {needsRepair && (
          <button
            onClick={() => onRepair(buildingIndex)}
            disabled={!canRepair}
            className="py-1.5 px-3 rounded text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 600,
              backgroundColor: canRepair ? "rgba(141, 186, 110, 0.15)" : "transparent",
              border: `1px solid ${canRepair ? "#8dba6e" : "#4a4030"}`,
              color: canRepair ? "#8dba6e" : "#4a4030",
            }}
            title={!canRepair ? `Not enough denarii (need ${repairCost}d, have ${state.denarii}d)` : `Repair this building for ${repairCost}d`}
          >
            Repair {repairCost}d
          </button>
        )}
        {upgradeDef && (
          <button
            onClick={() => onUpgrade(buildingIndex)}
            disabled={!canUpgrade}
            className="py-1.5 px-3 rounded text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 600,
              backgroundColor: canUpgrade ? "rgba(196, 162, 74, 0.15)" : "transparent",
              border: `1px solid ${canUpgrade ? "#c4a24a" : "#4a4030"}`,
              color: canUpgrade ? "#c4a24a" : "#4a4030",
            }}
            title={!canUpgrade ? `Not enough denarii (need ${def.upgradeCost ?? upgradeDef.cost}d, have ${state.denarii}d)` : `Upgrade to ${upgradeDef.name}`}
          >
            {"\u25B2"} {upgradeDef.name} ({def.upgradeCost ?? upgradeDef.cost}d)
          </button>
        )}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="py-1.5 px-3 rounded text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
          style={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 600,
            backgroundColor: "transparent",
            border: "1px solid #4a4030",
            color: "#6a5a42",
          }}
        >
          {showInfo ? "Hide" : "Info"}
        </button>
        <button
          onClick={() => onDemolish(buildingIndex)}
          className="py-1.5 px-3 rounded text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
          style={{
            fontFamily: '"Cinzel", serif',
            fontWeight: 600,
            backgroundColor: "transparent",
            border: "1px solid rgba(139, 26, 26, 0.4)",
            color: "#c62828",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(139, 26, 26, 0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          Demolish
        </button>
      </div>

      {/* Historical info panel */}
      {showInfo && def.historicalNote && (
        <div
          className="mt-2 p-2 rounded text-sm leading-relaxed"
          style={{
            backgroundColor: "rgba(196, 162, 74, 0.06)",
            border: "1px solid rgba(196, 162, 74, 0.15)",
            color: "#a89070",
            fontFamily: '"Crimson Text", serif',
          }}
        >
          {def.historicalNote}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Available Building Card (for building new)
// ---------------------------------------------------------------------------

function BuildCard({ building, state, onBuild, isSynergyBuilding, index }) {
  const [showInfo, setShowInfo] = useState(false);
  const builtCount = state.buildings.filter((b) => getBuildingType(b) === building.id).length;
  const check = canBuildBuilding(building.id, state);
  const rarity = RARITY_COLORS[building.rarity] || RARITY_COLORS.common;
  const locked = !check.canBuild;

  // Active synergies
  const activeSyns = (building.buildingSynergies || []).map((syn) => ({
    ...syn,
    active: state.buildings.some((b) => getBuildingType(b) === syn.with),
  }));

  return (
    <div
      className="rounded-lg p-3 flex flex-col"
      style={{
        backgroundColor: locked ? "#1a1612" : "#231e16",
        border: `1px solid ${locked ? "rgba(106, 90, 66, 0.5)" : rarity.border}`,
        opacity: locked ? 0.92 : 1,
        transition: "all 200ms ease",
        animation: `card-enter 300ms ease backwards`,
        animationDelay: `${index * 40}ms`,
      }}
      onMouseEnter={(e) => {
        if (!locked) {
          e.currentTarget.style.borderColor = rarity.border;
          e.currentTarget.style.boxShadow = `0 0 16px ${rarity.glow}`;
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = locked ? "rgba(106, 90, 66, 0.2)" : rarity.border;
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 36, height: 36,
              backgroundColor: `${rarity.border}`,
              color: "#1a1612",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            {building.icon}
          </div>
          <div>
            <h4
              className="text-sm leading-tight"
              style={{ fontFamily: '"Cinzel", serif', fontWeight: 600, color: "#c8b090" }}
            >
              {building.name}
              {isSynergyBuilding && (
                <span className="ml-1" style={{ color: "#c4a24a" }} title="Part of an active strategy path">
                  {"\u2605"}
                </span>
              )}
            </h4>
            <p className="text-[11px] italic" style={{ color: "#6a5a42" }}>
              {building.latin}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: `${rarity.border}`, color: "#fff" }}
        >
          {building.rarity}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm leading-snug mb-2" style={{ color: "#a89070" }}>
        {building.description}
      </p>

      {/* Stats */}
      <div className="text-sm space-y-0.5 mb-2">
        <div>
          <span style={{ fontFamily: '"Cinzel", serif', color: "#8a7a3a" }}>Cost:</span>{" "}
          <span style={{ color: "#c4a24a" }}>{building.cost}d</span>
        </div>
        <div>
          <span style={{ fontFamily: '"Cinzel", serif', color: "#8a7a3a" }}>Plots:</span>{" "}
          <span style={{ color: "#c4a24a" }}>{building.plots ?? 1}</span>
          {(building.plots ?? 1) > 1 && (
            <span className="text-[11px] ml-1" style={{ color: "#6a5a42" }}>(requires more land)</span>
          )}
        </div>
        <div>
          <span style={{ fontFamily: '"Cinzel", serif', color: "#8a7a3a" }}>Workers:</span>{" "}
          <span style={{ color: "#c4a24a" }}>{building.workersNeeded ?? 1} {(building.workersNeeded ?? 1) === 1 ? "family" : "families"}</span>
        </div>
        <div>
          <span style={{ fontFamily: '"Cinzel", serif', color: "#8a7a3a" }}>Produces:</span>{" "}
          {Object.entries(building.produces).map(([res, amt], i) => {
            const cfg = RESOURCE_CONFIG[res];
            const color = PRODUCTION_COLORS[res] || "#c4a24a";
            return (
              <span key={res}>
                {i > 0 && ", "}
                <span style={{ color }}>
                  {amt} {cfg?.icon || ""} {res}
                </span>
              </span>
            );
          })}
          <span style={{ color: "#8a7a3a" }}>/season</span>
        </div>
        {building.consumes && (
          <div>
            <span style={{ fontFamily: '"Cinzel", serif', color: "#8a7a3a" }}>Consumes:</span>{" "}
            {Object.entries(building.consumes).map(([res, amt], i) => {
              const cfg = RESOURCE_CONFIG[res];
              return (
                <span key={res}>
                  {i > 0 && ", "}
                  <span style={{ color: "#c97a4c" }}>
                    {amt} {cfg?.icon || ""} {res}
                  </span>
                </span>
              );
            })}
            <span style={{ color: "#8a7a3a" }}>/season</span>
          </div>
        )}
        <div>
          <span style={{ fontFamily: '"Cinzel", serif', color: "#8a7a3a" }}>Upkeep:</span>{" "}
          <span style={{ color: "#c4a24a" }}>{building.upkeep}d/season</span>
        </div>
        {building.requires && (
          <div>
            <span style={{ fontFamily: '"Cinzel", serif', color: "#8a7a3a" }}>Requires:</span>{" "}
            <span style={{ color: "#c4a24a" }}>
              {BUILDINGS[building.requires]?.name || building.requires}
            </span>
          </div>
        )}
        {activeSyns.length > 0 && activeSyns.map((syn, i) => (
          <div key={i} className="text-[11px]">
            <span style={{ color: syn.active ? "#c4a24a" : "#4a4030" }}>
              {syn.active ? "\u2713" : "\u2192"} {syn.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Built count */}
      {builtCount > 0 && (
        <div className="text-sm font-semibold mb-2" style={{ color: "#8dba6e" }}>
          Built: {builtCount}/{building.maxCount}
        </div>
      )}

      {/* Build button */}
      <div className="mt-auto flex gap-2">
        <button
          onClick={() => onBuild(building.id)}
          disabled={locked}
          className="flex-1 py-2 rounded-md text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
          style={{
            fontFamily: '"Cinzel Decorative", "Cinzel", serif',
            fontWeight: 700,
            letterSpacing: "2px",
            background: !locked
              ? "linear-gradient(135deg, #8b1a1a, #c62828)"
              : "#3a3228",
            color: !locked ? "#e8c44a" : "#6a5a42",
            border: "none",
            boxShadow: !locked ? "0 2px 8px rgba(198, 40, 40, 0.2)" : "none",
          }}
          onMouseEnter={(e) => {
            if (!locked) {
              e.currentTarget.style.filter = "brightness(1.15)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(198, 40, 40, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!locked) {
              e.currentTarget.style.filter = "brightness(1)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(198, 40, 40, 0.2)";
            }
          }}
          title={locked ? (check.reason || "Cannot build") : `Build ${building.name} for ${building.cost}d`}
        >
          {!locked ? `Build (${building.cost}d)` : (check.reason || "Cannot Build")}
        </button>
      </div>

      {/* Info toggle */}
      {building.historicalNote && (
        <>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="mt-1.5 text-[11px] uppercase tracking-wider cursor-pointer"
            style={{
              color: "#6a5a42",
              background: "none",
              border: "none",
              fontFamily: '"Cinzel", serif',
              textAlign: "left",
            }}
          >
            {showInfo ? "\u25BC Hide history" : "\u25B6 Historical context"}
          </button>
          {showInfo && (
            <div
              className="mt-1 p-2 rounded text-sm leading-relaxed"
              style={{
                backgroundColor: "rgba(196, 162, 74, 0.06)",
                border: "1px solid rgba(196, 162, 74, 0.15)",
                color: "#a89070",
                fontFamily: '"Crimson Text", serif',
              }}
            >
              {building.historicalNote}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Production Chains (collapsible synergy display)
// ---------------------------------------------------------------------------

function ProductionChains({ state }) {
  const [expanded, setExpanded] = useState(false);
  const synergies = getActiveBuildingSynergies(state.buildings);

  if (synergies.length === 0 && state.buildings.length < 2) return null;

  const active = synergies.filter((s) => s.active);
  const potential = synergies.filter((s) => !s.active);

  // Also show some known chains if the player has relevant buildings
  const knownChains = [];
  const builtTypes = new Set(state.buildings.map((b) => getBuildingType(b)));

  if (builtTypes.has("strip_farm") || builtTypes.has("demesne_field")) {
    if (!builtTypes.has("mill")) {
      knownChains.push({
        from: "Farm",
        to: "Mill",
        desc: "Build a Mill to boost grain output by 20%",
        locked: true,
      });
    }
    if (builtTypes.has("mill") && !builtTypes.has("brewery")) {
      knownChains.push({
        from: "Farm \u2192 Mill",
        to: "Brewery",
        desc: "Brewery converts grain to ale for trade income",
        locked: true,
      });
    }
  }
  if (builtTypes.has("pasture") && !builtTypes.has("fulling_mill")) {
    knownChains.push({
      from: "Pasture",
      to: "Fulling Mill",
      desc: "Convert wool into cloth for higher trade value",
      locked: true,
    });
  }

  if (active.length === 0 && potential.length === 0 && knownChains.length === 0) return null;

  return (
    <div
      className="rounded-lg p-3 mb-3"
      style={{ backgroundColor: "#231e16", border: "1px solid #6a5a42" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer"
        style={{ background: "none", border: "none" }}
      >
        <h3
          className="text-base font-bold uppercase"
          style={{
            fontFamily: '"Cinzel Decorative", "Cinzel", serif',
            color: "#c4a24a",
            letterSpacing: "2px",
          }}
        >
          {"\u2692"} Production Chains
        </h3>
        <span style={{ color: "#6a5a42", fontSize: "0.8rem" }}>
          {expanded ? "\u25BC" : "\u25B6"} {active.length > 0 && `${active.length} active`}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {active.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase mb-1" style={{ color: "#8dba6e", letterSpacing: "1px" }}>
                Active Chains
              </div>
              {active.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-0.5">
                  <span style={{ color: "#c4a24a" }}>{"\u2713"}</span>
                  <span style={{ color: "#c8b090" }}>
                    {BUILDINGS[s.buildingType]?.name} + {BUILDINGS[s.partnerType]?.name}
                  </span>
                  <span style={{ color: "#8dba6e" }}>{s.desc}</span>
                </div>
              ))}
            </div>
          )}

          {(potential.length > 0 || knownChains.length > 0) && (
            <div>
              <div className="text-[10px] font-semibold uppercase mb-1" style={{ color: "#6a5a42", letterSpacing: "1px" }}>
                Potential Chains
              </div>
              {potential.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-0.5" style={{ opacity: 0.5 }}>
                  <span style={{ color: "#4a4030" }}>{"\u2014"}</span>
                  <span style={{ color: "#6a5a42" }}>
                    {BUILDINGS[s.buildingType]?.name} + {BUILDINGS[s.partnerType]?.name}
                  </span>
                  <span style={{ color: "#4a4030" }}>{s.desc}</span>
                </div>
              ))}
              {knownChains.map((chain, i) => (
                <div key={`kc-${i}`} className="flex items-center gap-2 text-sm py-0.5" style={{ opacity: 0.5 }}>
                  <span style={{ color: "#4a4030" }}>{"\u2014"}</span>
                  <span style={{ color: "#6a5a42" }}>
                    {chain.from} {"\u2192"} {chain.to}
                  </span>
                  <span style={{ color: "#4a4030" }}>{chain.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main EstateTab
// ---------------------------------------------------------------------------

export default function EstateTab({ state, onBuild, onDemolish, onRepair, onUpgrade, activatedSynergies }) {
  const synergyBuildingIds = getSynergyBuildings(activatedSynergies ?? [], state.buildings);

  // Group built buildings by type for display
  const builtBuildings = state.buildings.map((b, i) => ({ building: b, index: i }));

  // Available buildings to build (not yet at max count)
  const availableBuildings = BUILDING_LIST.filter((def) => {
    const builtCount = state.buildings.filter((b) => getBuildingType(b) === def.id).length;
    return builtCount < def.maxCount;
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tip Bar */}
      <TipBar state={state} />

      {/* Economy Overview */}
      <EconomyOverview state={state} />

      {/* Land & Inventory */}
      <LandAndInventory state={state} />

      {/* YOUR BUILDINGS (built, manageable) */}
      {builtBuildings.length > 0 && (
        <div className="mb-4">
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: "#231e16", border: "1px solid #6a5a42" }}
          >
            <SectionHeader title="Your Buildings" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {builtBuildings.map(({ building, index }) => (
                <BuiltBuildingCard
                  key={typeof building === "string" ? `${building}-${index}` : building.instanceId}
                  building={building}
                  buildingIndex={index}
                  state={state}
                  onRepair={onRepair}
                  onUpgrade={onUpgrade}
                  onDemolish={onDemolish}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTION CHAINS */}
      <ProductionChains state={state} />

      {/* BUILD NEW (available buildings) */}
      <div
        className="rounded-lg p-3"
        style={{ backgroundColor: "#231e16", border: "1px solid #6a5a42" }}
      >
        <SectionHeader title="Build New" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableBuildings.map((building, index) => (
            <BuildCard
              key={building.id}
              building={building}
              state={state}
              onBuild={onBuild}
              isSynergyBuilding={synergyBuildingIds.has(building.id)}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
