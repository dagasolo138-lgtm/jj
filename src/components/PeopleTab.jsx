/**
 * PeopleTab.jsx
 *
 * Population management — the emotional and economic heart of the estate.
 * Social tiers, labor allocation, morale gauge, notable families,
 * tax rate selector, and village life feed.
 *
 * Receives state + dispatch directly (complex tab pattern).
 */

import { useState } from "react";
import {
  Wheat, ShoppingBag, Hammer, Swords, Church, Users,
  TrendingUp, TrendingDown, AlertTriangle, Crown, Scissors,
  ArrowUpRight, ArrowRight, ArrowDownRight,
} from "lucide-react";
import { TAX_RATES, FOOD_PER_FAMILY } from "../data/economy.js";
import { getTotalFood } from "../engine/economyEngine.js";
import {
  TIER_CONFIG,
  computeMorale,
  getContextualTip,
  TAX_CONSEQUENCES,
  LABOR_DEFAULTS,
} from "../data/people.js";

// ---------------------------------------------------------------------------
// Color palette (matches Lord's Ledger global)
// ---------------------------------------------------------------------------

const C = {
  bg: "#231e16",
  bgDeep: "#1a1610",
  bgCard: "linear-gradient(135deg, rgba(35, 30, 25, 0.95), rgba(28, 24, 20, 0.98))",
  border: "rgba(140, 110, 70, 0.25)",
  borderSolid: "#6a5a42",
  text: "#d4c9a8",
  textDim: "#8a7e6b",
  textMuted: "#6a6050",
  gold: "#c9a84c",
  goldBright: "#e8c44a",
  green: "#8dba6e",
  amber: "#d4a84c",
  crimson: "#d4726a",
  blue: "#7eb8d4",
  purple: "#b89adb",
  serfBrown: "#a08060",
  freemanTeal: "#6ab0a0",
};

// Icon map for notable families
const ROLE_ICONS = {
  Wheat,
  ShoppingBag,
  Hammer,
  Crown,
  Scissors,
  Swords,
  Church,
  Users,
};

// ---------------------------------------------------------------------------
// Shared card style
// ---------------------------------------------------------------------------

const cardStyle = {
  background: C.bgCard,
  border: `1px solid ${C.border}`,
  borderRadius: "4px",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Contextual tip bar */
function TipBar({ text }) {
  return (
    <div
      className="flex items-start gap-2 px-4 py-2.5 mb-4"
      style={{
        background: "rgba(20, 16, 12, 0.9)",
        border: `1px solid rgba(140, 110, 70, 0.2)`,
        borderRadius: "4px",
      }}
    >
      <span style={{ color: C.gold, fontSize: "14px", lineHeight: "1.4" }}>&#9670;</span>
      <p
        className="text-sm italic m-0"
        style={{ color: C.textDim, fontFamily: "Crimson Text, serif", lineHeight: "1.4" }}
      >
        {text}
      </p>
    </div>
  );
}

/** Social tier row */
function TierRow({ tierKey, count, total }) {
  const tier = TIER_CONFIG[tierKey];
  const IconComponent = ROLE_ICONS[tier.icon] || Users;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center justify-center w-8 h-8 rounded" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
        <IconComponent size={16} color={tier.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ fontFamily: "Cinzel, serif", color: tier.color }}
          >
            {tier.label}
          </span>
          <span className="text-lg font-bold" style={{ color: C.goldBright }}>
            {count}
          </span>
          <span className="text-xs" style={{ color: C.textMuted }}>
            ({pct}%)
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: C.textDim, fontFamily: "Crimson Text, serif" }}>
          {tier.description}
        </p>
      </div>
    </div>
  );
}

/** Morale gauge — vertical thermometer */
function MoraleGauge({ morale }) {
  const fillPct = Math.max(2, morale);
  let fillColor = C.crimson;
  if (morale >= 81) fillColor = C.green;
  else if (morale >= 61) fillColor = "#a0b86e";
  else if (morale >= 41) fillColor = C.amber;
  else if (morale >= 21) fillColor = "#c97a4c";

  return (
    <div className="flex flex-col items-center">
      {/* Thermometer */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "36px",
          height: "160px",
          borderRadius: "18px",
          background: "rgba(0,0,0,0.4)",
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Fill from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 morale-gauge-fill"
          style={{
            height: `${fillPct}%`,
            background: `linear-gradient(to top, ${fillColor}, ${fillColor}dd)`,
            borderRadius: "0 0 18px 18px",
            transition: "height 600ms ease, background 400ms ease",
          }}
        />
        {/* Tick marks */}
        {[25, 50, 75].map((tick) => (
          <div
            key={tick}
            className="absolute left-0 right-0"
            style={{
              bottom: `${tick}%`,
              height: "1px",
              background: "rgba(140, 110, 70, 0.2)",
            }}
          />
        ))}
      </div>
      {/* Value */}
      <span
        className="text-lg font-bold mt-2"
        style={{ color: fillColor, fontFamily: "Cinzel, serif" }}
      >
        {morale}
      </span>
    </div>
  );
}

/** Labor allocation slider */
function LaborSlider({ label, icon, color, value, max, onChange, leftLabel, rightLabel, detail }) {
  const SliderIcon = icon;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <SliderIcon size={14} color={color} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "Cinzel, serif", color }}>
            {label}
          </span>
        </div>
        <span className="text-sm font-bold" style={{ color: C.goldBright }}>{value}%</span>
      </div>
      <div className="flex items-center gap-2">
        {leftLabel && <span className="text-xs w-14 text-right" style={{ color: C.textMuted }}>{leftLabel}</span>}
        <input
          type="range"
          min={0}
          max={max}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 labor-slider"
          style={{ accentColor: color }}
          aria-label={`${label} allocation`}
        />
        {rightLabel && <span className="text-xs w-14" style={{ color: C.textMuted }}>{rightLabel}</span>}
      </div>
      {detail && (
        <p className="text-xs mt-1 pl-6" style={{ color: C.textDim }}>
          {detail}
        </p>
      )}
    </div>
  );
}

/** Notable family card */
function FamilyCard({ family }) {
  const IconComponent = ROLE_ICONS[family.roleIcon] || Users;
  const tierColor = family.tier === "serf" ? C.serfBrown : family.tier === "freeman" ? C.freemanTeal : C.purple;
  const tierLabel = family.tier === "serf" ? "Serf" : family.tier === "freeman" ? "Freeman" : "Skilled";

  // Loyalty pips
  const loyaltyColor = family.loyalty >= 3 ? C.green : family.loyalty >= 2 ? C.amber : C.crimson;

  return (
    <div
      className="people-card rounded p-3 flex-1 min-w-[140px]"
      style={{
        ...cardStyle,
        opacity: family.present ? 1 : 0.5,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <IconComponent size={16} color={tierColor} />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ fontFamily: "Cinzel, serif", color: C.text }}
        >
          {family.name}
        </span>
      </div>

      {/* Tier badge */}
      <div className="mb-2">
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `${tierColor}22`,
            color: tierColor,
            border: `1px solid ${tierColor}44`,
            fontFamily: "Cinzel, serif",
            fontSize: "0.6rem",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          {tierLabel}
        </span>
        <span className="text-xs ml-2" style={{ color: C.textMuted }}>
          {family.role}
        </span>
      </div>

      {/* Loyalty pips */}
      <div className="flex gap-1 mb-2" aria-label={`Loyalty: ${family.loyalty} of ${family.maxLoyalty}`}>
        {Array.from({ length: family.maxLoyalty }, (_, i) => (
          <div
            key={i}
            className="w-4 h-2 rounded-sm"
            style={{
              backgroundColor: i < family.loyalty ? loyaltyColor : "rgba(0,0,0,0.3)",
              border: `1px solid ${i < family.loyalty ? loyaltyColor : C.border}`,
              transition: "background-color 300ms ease",
            }}
          />
        ))}
      </div>

      {/* Narrative */}
      <p
        className="text-xs italic leading-snug"
        style={{ color: C.textDim, fontFamily: "Crimson Text, serif" }}
      >
        {family.present ? family.narrative : `Gone for ${family.turnsGone} ${family.turnsGone === 1 ? "season" : "seasons"}.`}
      </p>

      {/* Generations */}
      <p className="text-xs mt-1.5" style={{ color: C.textMuted }}>
        {family.generations === 1
          ? "Arrived recently"
          : `Here for ${family.generations} generations`}
      </p>

      {/* Bonus */}
      {family.present && (
        <p className="text-xs mt-1" style={{ color: family.loyalty >= 2 ? C.green : C.textMuted }}>
          {family.loyalty >= 2 ? family.bonus.desc : "Bonus inactive (low loyalty)"}
        </p>
      )}
    </div>
  );
}

/** Village feed entry */
function FeedEntry({ event, season, year }) {
  const typeColor = event.type === "warning" ? C.crimson : event.type === "population" ? C.green : C.textDim;
  const prefix = event.type === "warning" ? "\u26A0" : "\u2767";

  return (
    <div className="flex items-start gap-2 py-1.5">
      <span style={{ color: typeColor, fontSize: "12px", flexShrink: 0 }}>{prefix}</span>
      <div>
        <p
          className="text-sm italic leading-snug m-0"
          style={{ color: C.text, fontFamily: "Crimson Text, serif" }}
        >
          {event.text}
        </p>
        <span className="text-xs" style={{ color: C.textMuted }}>
          {season ? `${season.charAt(0).toUpperCase() + season.slice(1)}, Year ${year}` : ""}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PeopleTab({ state, dispatch }) {
  const {
    population,
    inventory,
    taxRate,
    garrison = 0,
    season,
    year,
    resourceDeltas,
  } = state;
  const people = state.people || {};
  const tiers = people.tiers || { serfs: Math.round(population * 0.55), freemen: Math.round(population * 0.32), skilled: Math.max(2, population - Math.round(population * 0.55) - Math.round(population * 0.32)) };
  const families = people.notableFamilies || [];

  // Labor allocation from state (or defaults)
  const [localFarming, setLocalFarming] = useState(people.laborFarming ?? LABOR_DEFAULTS.farming);
  const [localGarrison, setLocalGarrison] = useState(people.laborGarrison ?? LABOR_DEFAULTS.garrison);
  const [localChurch, setLocalChurch] = useState(people.laborChurch ?? LABOR_DEFAULTS.church);

  // Compute workforce
  const totalFamilies = population;
  const garrisonFamilies = Math.round(totalFamilies * (localGarrison / 100));
  const churchFamilies = Math.round(totalFamilies * (localChurch / 100));
  const workingFamilies = Math.max(0, totalFamilies - garrisonFamilies - churchFamilies);
  const assignable = tiers.serfs + tiers.freemen;
  const farmingFamilies = Math.round(Math.min(workingFamilies, assignable) * (localFarming / 100));
  const craftingFamilies = Math.max(0, Math.min(workingFamilies, assignable) - farmingFamilies);

  // Food calculations
  const totalFood = getTotalFood(inventory);
  const garrisonFood = Math.ceil(garrison / 5);
  const consumption = population * FOOD_PER_FAMILY + garrisonFood;
  const foodBalance = resourceDeltas?.food ?? (totalFood - consumption);

  // Morale — compute fresh each render (lightweight pure function)
  const moraleState = {
    ...state,
    people: {
      ...people,
      laborGarrison: localGarrison,
      laborChurch: localChurch,
    },
  };
  const moraleResult = computeMorale(moraleState);

  const morale = moraleResult.value;
  const moraleLevel = moraleResult.level;

  // Growth indicator
  const growthText = foodBalance > 0 && morale > 50
    ? "+1\u20132 families/season"
    : foodBalance >= 0
      ? "Stable"
      : morale < 30
        ? `\u22121\u20133 families at risk`
        : "\u22121 family at risk";
  const GrowthIcon = foodBalance > 0 && morale > 50 ? ArrowUpRight : foodBalance >= 0 ? ArrowRight : ArrowDownRight;
  const growthColor = foodBalance > 0 && morale > 50 ? C.green : foodBalance >= 0 ? C.amber : C.crimson;

  // Contextual tip
  const tipText = getContextualTip(morale, taxRate, localGarrison, localChurch, foodBalance);

  // Village feed
  const feedEvents = people.villageFeed || [];

  // Production estimates
  const baseFoodPerFarmer = 18;
  const millerPresent = families.find((f) => f.id === "miller")?.present;
  const reeveLoyal = (families.find((f) => f.id === "reeve")?.loyalty ?? 0) >= 2;
  const millerMod = millerPresent ? 1.2 : 1.0;
  const reeveMod = reeveLoyal ? 1.1 : 0.9;
  const estFoodProduction = Math.round(farmingFamilies * baseFoodPerFarmer * millerMod * reeveMod / 10);

  const baseCraftGold = 9;
  const smithPresent = families.find((f) => f.id === "smith")?.present;
  const tannerPresent = families.find((f) => f.id === "tanner")?.present;
  const smithMod = smithPresent ? 1.15 : 1.0;
  const tannerMod = tannerPresent ? 1.1 : 1.0;
  const estCraftGold = Math.round(craftingFamilies * baseCraftGold * smithMod * tannerMod);

  // Tax revenue estimate (used in tax card display below)
  // eslint-disable-next-line no-unused-vars
  const taxRateValue = TAX_RATES[taxRate]?.rate ?? 4;

  // Slider change handler — dispatch immediately
  function handleFarmingChange(val) {
    setLocalFarming(val);
    dispatch({ type: "PEOPLE_SET_LABOR", payload: { laborFarming: val, laborGarrison: localGarrison, laborChurch: localChurch } });
  }

  function handleGarrisonChange(val) {
    const clamped = Math.min(val, 40);
    setLocalGarrison(clamped);
    dispatch({ type: "PEOPLE_SET_LABOR", payload: { laborFarming: localFarming, laborGarrison: clamped, laborChurch: localChurch } });
  }

  function handleChurchChange(val) {
    const clamped = Math.min(val, 15);
    setLocalChurch(clamped);
    dispatch({ type: "PEOPLE_SET_LABOR", payload: { laborFarming: localFarming, laborGarrison: localGarrison, laborChurch: clamped } });
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tip Bar */}
      <TipBar text={tipText} />

      {/* ============================================================
         Section 1: Population Overview + Morale Gauge
         ============================================================ */}
      <div
        className="rounded p-4 mb-4"
        style={cardStyle}
      >
        <div className="flex gap-4">
          {/* Left: Population */}
          <div className="flex-1">
            <h3
              className="text-sm font-bold uppercase tracking-wider mb-3"
              style={{ fontFamily: "Cinzel, serif", color: C.gold }}
            >
              Population
              <span className="ml-2 text-xl" style={{ color: C.goldBright }}>{totalFamilies}</span>
              <span className="text-xs ml-1" style={{ color: C.textDim }}>families</span>
            </h3>

            {/* Tier breakdown */}
            <TierRow tierKey="serfs" count={tiers.serfs} total={totalFamilies} />
            <TierRow tierKey="freemen" count={tiers.freemen} total={totalFamilies} />
            <TierRow tierKey="skilled" count={tiers.skilled} total={totalFamilies} />

            {/* Divider */}
            <div className="my-3" style={{ borderTop: `1px solid ${C.border}` }} />

            {/* Growth indicator */}
            <div className="flex items-center gap-2">
              <GrowthIcon size={14} color={growthColor} />
              <span className="text-sm" style={{ color: growthColor }}>
                {growthText}
              </span>
            </div>

            {/* Food balance */}
            <div className="flex items-center gap-2 mt-1.5">
              <Wheat size={14} color={foodBalance >= 0 ? C.green : C.crimson} />
              <span className="text-sm" style={{ color: foodBalance >= 0 ? C.green : C.crimson }}>
                Food Balance: {foodBalance >= 0 ? "+" : ""}{foodBalance}/season
              </span>
            </div>
          </div>

          {/* Right: Morale gauge */}
          <div className="flex flex-col items-center justify-between" style={{ minWidth: "80px" }}>
            <h4
              className="text-xs font-bold uppercase tracking-wider mb-2 text-center"
              style={{ fontFamily: "Cinzel, serif", color: C.textDim }}
            >
              Morale
            </h4>
            <MoraleGauge morale={morale} />
            <span
              className="text-xs font-semibold uppercase tracking-wider mt-2 text-center"
              style={{ fontFamily: "Cinzel, serif", color: moraleLevel.color }}
            >
              {moraleLevel.label}
            </span>
          </div>
        </div>

        {/* Morale flavor text */}
        <p
          className="text-xs italic mt-3 leading-snug"
          style={{ color: C.textDim, fontFamily: "Crimson Text, serif" }}
        >
          {moraleLevel.flavor}
        </p>

        {/* Revolt warning */}
        {morale < 20 && (
          <div
            className="flex items-center gap-2 mt-3 px-3 py-2 rounded morale-critical"
            style={{
              background: "rgba(212, 114, 106, 0.1)",
              border: `1px solid ${C.crimson}66`,
            }}
          >
            <AlertTriangle size={16} color={C.crimson} />
            <span className="text-sm font-semibold" style={{ color: C.crimson }}>
              Revolt imminent. Your people are organizing against you.
            </span>
          </div>
        )}
      </div>

      {/* ============================================================
         Section 2: Labor Allocation
         ============================================================ */}
      <div
        className="rounded p-4 mb-4"
        style={cardStyle}
      >
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-4"
          style={{ fontFamily: "Cinzel, serif", color: C.gold }}
        >
          Labor Allocation
        </h3>

        {/* Slider 1: Farming ↔ Crafts */}
        <LaborSlider
          label="Farming"
          icon={Wheat}
          color={C.serfBrown}
          value={localFarming}
          max={100}
          onChange={handleFarmingChange}
          leftLabel="Farm"
          rightLabel="Crafts"
          detail={`${farmingFamilies} farming \u2192 ~${estFoodProduction} food/season \u00B7 ${craftingFamilies} crafting \u2192 ~${estCraftGold}d/season`}
        />

        {/* Slider 2: Garrison Duty */}
        <LaborSlider
          label="Garrison Duty"
          icon={Swords}
          color={C.crimson}
          value={localGarrison}
          max={40}
          onChange={handleGarrisonChange}
          leftLabel="Guard"
          rightLabel="Work"
          detail={`${garrisonFamilies} on guard duty${garrisonFamilies === 0 ? " \u2014 village undefended" : ""} \u00B7 ${workingFamilies} available for work`}
        />

        {/* Slider 3: Church Labor */}
        <LaborSlider
          label="Chapel Work"
          icon={Church}
          color={C.blue}
          value={localChurch}
          max={15}
          onChange={handleChurchChange}
          leftLabel="Chapel"
          rightLabel="Work"
          detail={`${churchFamilies} at chapel${churchFamilies > 0 ? " \u2014 +5 morale" : " \u2014 Father Anselm displeased (\u22123 morale)"}`}
        />

        {/* Workforce summary */}
        <div
          className="flex flex-wrap gap-2 mt-3 pt-3"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <span className="text-xs uppercase tracking-wider" style={{ fontFamily: "Cinzel, serif", color: C.textDim }}>
            Workforce:
          </span>
          <span className="text-xs" style={{ color: C.serfBrown }}>
            {farmingFamilies} farming
          </span>
          <span style={{ color: C.textMuted }}>&middot;</span>
          <span className="text-xs" style={{ color: C.freemanTeal }}>
            {craftingFamilies} crafting
          </span>
          <span style={{ color: C.textMuted }}>&middot;</span>
          <span className="text-xs" style={{ color: C.crimson }}>
            {garrisonFamilies} garrison
          </span>
          <span style={{ color: C.textMuted }}>&middot;</span>
          <span className="text-xs" style={{ color: C.blue }}>
            {churchFamilies} chapel
          </span>
          <span style={{ color: C.textMuted }}>&middot;</span>
          <span className="text-xs" style={{ color: C.text }}>
            {totalFamilies} total
          </span>
        </div>

        {/* Historical context */}
        <details className="mt-3">
          <summary className="text-xs cursor-pointer" style={{ color: C.gold }}>
            &#10022; Historical Context
          </summary>
          <p
            className="text-xs mt-2 leading-relaxed"
            style={{ color: C.textDim, fontFamily: "Crimson Text, serif" }}
          >
            In the medieval manor system, the lord controlled how labor was distributed.
            Serfs owed a set number of days working the lord&apos;s fields (called &ldquo;demesne labor&rdquo;).
            The balance between farming, military service, and church duties was one of the central
            tensions of feudal life. Too many soldiers meant not enough farmers. Not enough soldiers
            meant your neighbors took everything.
          </p>
        </details>
      </div>

      {/* ============================================================
         Section 3: Tax Rate (Improved)
         ============================================================ */}
      <div
        className="rounded p-4 mb-4"
        style={cardStyle}
      >
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-2"
          style={{ fontFamily: "Cinzel, serif", color: C.gold }}
        >
          Tax Rate
        </h3>
        <p className="text-sm mb-3" style={{ color: C.textDim, fontFamily: "Crimson Text, serif" }}>
          Taxes are collected each Autumn. Higher rates bring more coin but drive people away.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(TAX_RATES).map(([key, config]) => {
            const isActive = taxRate === key;
            const income = population * config.rate;
            const consequence = TAX_CONSEQUENCES[key];

            return (
              <button
                key={key}
                onClick={() => dispatch({ type: "SET_TAX_RATE", payload: { rate: key } })}
                className="p-3 rounded-md text-center cursor-pointer transition-all duration-200 min-h-[44px]"
                style={{
                  backgroundColor: isActive ? C.gold : C.bgDeep,
                  border: isActive ? `1px solid ${C.gold}` : `1px solid ${C.borderSolid}`,
                  borderTop: `3px solid ${consequence.topBorder}`,
                  color: isActive ? "#0f0d0a" : C.text,
                }}
                aria-label={`Set tax rate to ${config.label} \u2014 ${config.rate}d per family`}
                aria-pressed={isActive}
              >
                <div
                  className="text-sm font-bold uppercase"
                  style={{ fontFamily: "Cinzel, serif" }}
                >
                  {config.label}
                </div>
                <div className="text-sm mt-0.5" style={{ color: isActive ? "#0f0d0a" : C.textDim }}>
                  {config.rate}d/family
                </div>
                <div className="text-sm mt-0.5" style={{ color: isActive ? "#0f0d0a" : C.textDim }}>
                  ~{income}d/autumn
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: isActive ? "#0f0d0a" : consequence.topBorder }}
                >
                  {consequence.moraleMod} morale
                </div>
              </button>
            );
          })}
        </div>

        {/* Active tax consequence */}
        {TAX_CONSEQUENCES[taxRate]?.warning && (
          <div
            className="flex items-start gap-2 mt-3 px-3 py-2 rounded"
            style={{
              background: `${TAX_CONSEQUENCES[taxRate].topBorder}11`,
              border: `1px solid ${TAX_CONSEQUENCES[taxRate].topBorder}44`,
            }}
          >
            <AlertTriangle size={14} color={TAX_CONSEQUENCES[taxRate].topBorder} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs" style={{ color: TAX_CONSEQUENCES[taxRate].topBorder }}>
              {TAX_CONSEQUENCES[taxRate].warning}
            </p>
          </div>
        )}
      </div>

      {/* ============================================================
         Section 4: Notable Families
         ============================================================ */}
      <div
        className="rounded p-4 mb-4"
        style={cardStyle}
      >
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-3"
          style={{ fontFamily: "Cinzel, serif", color: C.gold }}
        >
          Notable Families
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {families.map((family) => (
            <FamilyCard key={family.id} family={family} />
          ))}
        </div>

        {/* Family mechanic note */}
        <p className="text-xs mt-3 italic" style={{ color: C.textMuted, fontFamily: "Crimson Text, serif" }}>
          Family loyalty shifts with your decisions. Tax rates, food supply, and garrison burden all affect whether they stay or go.
          Serfs cannot leave \u2014 but they can stop cooperating.
        </p>
      </div>

      {/* ============================================================
         Section 5: Seasonal Feed
         ============================================================ */}
      {feedEvents.length > 0 && (
        <div
          className="rounded p-4 mb-4"
          style={cardStyle}
        >
          <h3
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ fontFamily: "Cinzel, serif", color: C.textDim }}
          >
            Village Life
          </h3>
          <div style={{ maxHeight: "160px", overflowY: "auto" }}>
            {feedEvents.map((event, i) => (
              <FeedEntry key={i} event={event} season={season} year={year} />
            ))}
          </div>
        </div>
      )}

      {/* Morale factor breakdown (collapsible) */}
      <details className="mb-4">
        <summary
          className="text-xs cursor-pointer px-4 py-2 rounded"
          style={{ color: C.textMuted, background: "rgba(20, 16, 12, 0.5)" }}
        >
          Morale Breakdown
        </summary>
        <div
          className="px-4 py-3 rounded-b text-xs grid grid-cols-2 gap-x-4 gap-y-1"
          style={{ background: "rgba(20, 16, 12, 0.5)", color: C.textDim }}
        >
          <span>Base:</span>
          <span style={{ color: C.text }}>+{moraleResult.factors.base}</span>
          <span>Tax Rate ({taxRate}):</span>
          <span style={{ color: moraleResult.factors.tax >= 0 ? C.green : C.crimson }}>
            {moraleResult.factors.tax >= 0 ? "+" : ""}{moraleResult.factors.tax}
          </span>
          <span>Food Balance:</span>
          <span style={{ color: moraleResult.factors.food >= 0 ? C.green : C.crimson }}>
            {moraleResult.factors.food >= 0 ? "+" : ""}{moraleResult.factors.food}
          </span>
          <span>Garrison Burden:</span>
          <span style={{ color: moraleResult.factors.garrison >= 0 ? C.green : C.crimson }}>
            {moraleResult.factors.garrison >= 0 ? "+" : ""}{moraleResult.factors.garrison}
          </span>
          <span>Church Labor:</span>
          <span style={{ color: moraleResult.factors.church >= 0 ? C.green : C.crimson }}>
            {moraleResult.factors.church >= 0 ? "+" : ""}{moraleResult.factors.church}
          </span>
          <span>Family Loyalty:</span>
          <span style={{ color: moraleResult.factors.loyalty >= 0 ? C.green : C.crimson }}>
            {moraleResult.factors.loyalty >= 0 ? "+" : ""}{moraleResult.factors.loyalty}
          </span>
          <span className="font-semibold" style={{ color: C.text }}>Total:</span>
          <span className="font-semibold" style={{ color: moraleLevel.color }}>{morale}</span>
        </div>
      </details>
    </div>
  );
}
