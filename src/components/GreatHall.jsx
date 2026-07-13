/**
 * GreatHall.jsx
 *
 * Phases 1-4 — The Great Hall
 * Stone hall shell with animated torches + 5 sub-views:
 *   Throne (dispute queue), Audience (NPC conversations), Decrees (issue laws),
 *   Council (advisor debate), Feast (multi-step celebration).
 * Phase 4: Context-aware Edmund dialogue, trust/mood system, reputation evolution.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Scale, Users, ScrollText, Landmark, Utensils, ChevronRight, Shield,
  AlertTriangle, Star, BookOpen, TrendingUp, TrendingDown,
} from "lucide-react";
import {
  AMBIENT_TEXTS,
  DEFAULT_METERS,
  selectEdmundLine,
  getTrustTier,
  getEdmundMood,
  REPUTATION_TRACKS,
  COMPOUND_RULES,
} from "../data/greatHall";
import DISPUTES from "../data/disputes";
import AUDIENCE_ENCOUNTERS from "../data/audience";
import { DECREE_OPTIONS, COUNCIL_TOPICS, FEAST_DATA } from "../data/decrees";
import DisputeScreen from "./DisputeScreen";
import AudienceChamber from "./AudienceChamber";
import DecreeDesk from "./DecreeDesk";
import CouncilChamber from "./CouncilChamber";
import FeastHall from "./FeastHall";

// ─── Color palette (readable) ──────────────────────────────────

const C = {
  // Backgrounds — solid, layered for depth
  bgDeep:     "#0f0d0a",
  bgDark:     "#1a1610",
  bgCard:     "#231e16",
  bgCardHov:  "#2d2619",
  bgElevated: "#2a2318",

  // Borders
  border:     "#4a3f30",
  borderDim:  "#3d3428",

  // Gold
  gold:       "#d4a44c",
  goldBright: "#e8c44a",
  goldDim:    "#8a7a3a",

  // Red accents
  red:        "#8b1a1a",
  redBright:  "#c62828",
  redGlow:    "rgba(139, 26, 26, 0.3)",

  // Text — readable hierarchy
  textBright: "#ede0c8",   // primary headings, important values
  text:       "#d4c4a0",   // body text, NPC dialogue
  textMid:    "#b8a880",   // secondary labels, subtitles
  textDim:    "#907e60",   // tertiary, hints, timestamps
};

// ─── Internal navigation config ────────────────────────────────

const HALL_VIEWS = [
  { id: "throne",   label: "Throne",   Icon: Scale },
  { id: "audience", label: "Audience", Icon: Users },
  { id: "decrees",  label: "Decrees",  Icon: ScrollText },
  { id: "council",  label: "Council",  Icon: Landmark },
  { id: "feast",    label: "Feast",    Icon: Utensils },
  { id: "summary",  label: "Summary",  Icon: BookOpen },
];

// ─── Sub-components ────────────────────────────────────────────

/** CSS-drawn NPC portrait — bordered frame with initial letter */
function NpcPortrait({ initial, socialClass = "steward", mood = "neutral", size = 72 }) {
  const bgMap = {
    peasant:  "linear-gradient(135deg, #4a3728, #2d2018)",
    merchant: "linear-gradient(135deg, #2d4a28, #1a2d14)",
    clergy:   "linear-gradient(135deg, #3a2850, #221838)",
    military: "linear-gradient(135deg, #3a3a40, #222228)",
    noble:    "linear-gradient(135deg, #4a3a10, #2d2408)",
    steward:  "linear-gradient(135deg, #3a3020, #252018)",
  };
  const borderMap = {
    angry:   "#c44444",
    sad:     "#6688aa",
    nervous: "#ccaa44",
    hopeful: "#44aa88",
    neutral: C.gold,
    dutiful: C.textMid,
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${borderMap[mood] || borderMap.neutral}`,
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Cinzel Decorative, Cinzel, serif",
        fontSize: size * 0.35,
        color: C.textBright,
        background: bgMap[socialClass] || bgMap.peasant,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

/** Animated CSS torch — flame + bracket */
function Torch() {
  return (
    <div
      className="torch-glow"
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div
        style={{
          width: 14,
          height: 22,
          background:
            "radial-gradient(ellipse at center bottom, #e8c44a 0%, #c4813a 40%, #8b5e2b 70%, transparent 100%)",
          borderRadius: "50% 50% 20% 20%",
          filter: "blur(1px)",
        }}
      />
      <div
        style={{
          width: 4,
          height: 28,
          background: "linear-gradient(180deg, #5a4a30, #3d3020)",
          borderRadius: 2,
        }}
      />
    </div>
  );
}

// ─── Trust Bar (small inline) ────────────────────────────────────

function TrustBar({ trust }) {
  const tier = getTrustTier(trust);
  return (
    <div style={{ marginTop: 8 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.6rem",
            color: C.textDim,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Trust: {tier.label}
        </span>
        <span
          style={{
            fontFamily: "Crimson Text, serif",
            fontSize: "0.75rem",
            color: tier.color,
          }}
        >
          {trust}/100
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 4,
          backgroundColor: C.bgDeep,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${trust}%`,
            height: "100%",
            backgroundColor: tier.color,
            borderRadius: 2,
            transition: "width 400ms ease, background-color 400ms ease",
          }}
        />
      </div>
      <p
        style={{
          fontFamily: "Crimson Text, serif",
          fontSize: "0.7rem",
          color: C.textDim,
          fontStyle: "italic",
          margin: "3px 0 0",
        }}
      >
        {tier.desc}
      </p>
    </div>
  );
}

// ─── Edmund Mood Indicator ──────────────────────────────────────

function MoodBadge({ mood }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "Cinzel, serif",
        fontSize: "0.55rem",
        color: mood.color,
        letterSpacing: "1px",
        textTransform: "uppercase",
        border: `1px solid ${mood.color}40`,
        borderRadius: 3,
        padding: "1px 6px",
        marginLeft: 8,
      }}
    >
      {mood.label}
    </span>
  );
}

// ─── Phase 5: Hall Event Banner (Crisis/Peak) ──────────────────

function HallEventBanner({ event, onDismiss }) {
  const isCrisis = event.type === "crisis";
  const borderColor = isCrisis ? "#c44444" : "#44aa66";
  const bgColor = isCrisis ? "rgba(139, 26, 26, 0.15)" : "rgba(68, 170, 102, 0.15)";
  const IconComp = isCrisis ? AlertTriangle : Star;
  const label = isCrisis ? "CRISIS" : "PEAK";

  // Format effects for display
  const effectParts = Object.entries(event.effects || {})
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v > 0 ? "+" : ""}${v}`);

  return (
    <div
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        backgroundColor: bgColor,
        padding: 16,
        marginBottom: 16,
        animation: "npcFadeIn 0.5s ease",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${borderColor}30`,
            border: `1px solid ${borderColor}60`,
            flexShrink: 0,
          }}
        >
          <IconComp size={24} style={{ color: borderColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.6rem",
                color: borderColor,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {label}: {event.meter}
            </span>
          </div>
          <p
            style={{
              fontFamily: "Crimson Text, serif",
              fontSize: "0.95rem",
              color: C.text,
              lineHeight: 1.5,
              margin: "0 0 8px",
            }}
          >
            {event.text}
          </p>
          {effectParts.length > 0 && (
            <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
              {effectParts.map((e, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.65rem",
                    color: e.includes("+") ? "#44aa66" : "#c44444",
                    border: `1px solid ${e.includes("+") ? "#44aa6640" : "#c4444440"}`,
                    borderRadius: 3,
                    padding: "2px 6px",
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={onDismiss}
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.75rem",
              color: C.textBright,
              backgroundColor: C.bgElevated,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Phase 5: Season Summary View ───────────────────────────────

function SeasonSummary({ hall, state, onReturn }) {
  const meterHistory = hall.meterHistory || [];
  const hallLog = hall.hallLog || [];
  const meters = hall.meters || DEFAULT_METERS;
  const compoundFlags = hall.compoundFlags || {};
  const activeCompounds = COMPOUND_RULES.filter((r) => compoundFlags[r.flag]);

  // Find log entries for this season
  const seasonLog = hallLog.filter(
    (e) => e.season === state.season && e.year === state.year
  );

  // Calculate meter deltas from last snapshot
  const lastSnapshot = meterHistory.length >= 2
    ? meterHistory[meterHistory.length - 2].meters
    : DEFAULT_METERS;
  const deltas = {};
  for (const key of ["people", "treasury", "church", "military"]) {
    deltas[key] = meters[key] - (lastSnapshot[key] || 50);
  }

  const meterLabels = { people: "People", treasury: "Treasury", church: "Church", military: "Military" };
  const meterColors = { people: "#2d5a2d", treasury: "#c4a24a", church: "#6a4a8a", military: "#8b2020" };

  return (
    <div style={{ animation: "npcFadeIn 0.4s ease" }}>
      <h3
        style={{
          fontFamily: "Cinzel Decorative, Cinzel, serif",
          fontSize: "1rem",
          color: C.goldBright,
          textAlign: "center",
          letterSpacing: "2px",
          margin: "0 0 16px",
          textShadow: "0 0 12px rgba(212,164,76,0.25)",
        }}
      >
        Season Summary
      </h3>

      {/* Meter Changes */}
      <div
        style={{
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          backgroundColor: C.bgCard,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <h4
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.8rem",
            color: C.goldBright,
            margin: "0 0 10px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <BookOpen size={14} />
          Meter Changes
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(meterLabels).map(([key, label]) => {
            const delta = deltas[key];
            const DeltaIcon = delta >= 0 ? TrendingUp : TrendingDown;
            const deltaColor = delta > 0 ? "#44aa66" : delta < 0 ? "#c44444" : C.textDim;
            return (
              <div
                key={key}
                style={{
                  padding: "8px 10px",
                  borderRadius: 4,
                  backgroundColor: C.bgDeep,
                  border: `1px solid ${C.borderDim}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "0.7rem",
                      color: meterColors[key],
                    }}
                  >
                    {label}
                  </span>
                  <div className="flex items-center gap-1">
                    <DeltaIcon size={12} style={{ color: deltaColor }} />
                    <span
                      style={{
                        fontFamily: "Crimson Text, serif",
                        fontSize: "0.8rem",
                        color: deltaColor,
                        fontWeight: 600,
                      }}
                    >
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  </div>
                </div>
                {/* Mini bar */}
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    backgroundColor: C.bgDark,
                    borderRadius: 2,
                    marginTop: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${meters[key]}%`,
                      height: "100%",
                      backgroundColor: meterColors[key],
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "Crimson Text, serif",
                    fontSize: "0.7rem",
                    color: C.textDim,
                    marginTop: 2,
                    display: "block",
                  }}
                >
                  {meters[key]}/100
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hall Actions This Season */}
      {seasonLog.length > 0 && (
        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            backgroundColor: C.bgCard,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <h4
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.8rem",
              color: C.goldBright,
              margin: "0 0 10px",
            }}
          >
            Hall Actions This Season
          </h4>
          {seasonLog.map((entry, i) => (
            <div
              key={i}
              style={{
                padding: "6px 0",
                borderTop: i > 0 ? `1px solid ${C.borderDim}` : "none",
              }}
            >
              <span
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: "0.6rem",
                  color: C.textDim,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {entry.type}
              </span>
              <p
                style={{
                  fontFamily: "Crimson Text, serif",
                  fontSize: "0.85rem",
                  color: C.text,
                  margin: "2px 0 0",
                }}
              >
                {entry.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Compound Consequences */}
      {activeCompounds.length > 0 && (
        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            backgroundColor: C.bgCard,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <h4
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.8rem",
              color: C.goldBright,
              margin: "0 0 10px",
            }}
          >
            Ripple Effects
          </h4>
          {activeCompounds.map((rule) => (
            <p
              key={rule.flag}
              style={{
                fontFamily: "Crimson Text, serif",
                fontStyle: "italic",
                fontSize: "0.85rem",
                color: C.textMid,
                margin: "4px 0",
                paddingLeft: 10,
                borderLeft: `2px solid ${C.goldDim}`,
              }}
            >
              {rule.label}
            </p>
          ))}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onReturn}
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.8rem",
            color: C.textBright,
            backgroundColor: C.bgElevated,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: "8px 24px",
            cursor: "pointer",
          }}
        >
          Return to Throne
        </button>
      </div>
    </div>
  );
}

// ─── Throne Room (default view) ────────────────────────────────

function ThroneRoom({ edmundLine, disputes, resolvedIds, onSelectDispute, trust, mood, reputationTrack }) {
  return (
    <div>
      {/* Central throne icon + description */}
      <div className="text-center" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            border: `2px solid ${C.red}`,
            borderRadius: 8,
            background:
              `linear-gradient(135deg, ${C.bgCard} 0%, ${C.bgDeep} 50%, ${C.bgCard} 100%)`,
            boxShadow:
              `0 0 24px ${C.redGlow}, inset 0 0 20px rgba(0,0,0,0.4)`,
            marginBottom: 10,
          }}
        >
          <Scale size={36} style={{ color: C.gold }} />
        </div>
        <h3
          style={{
            fontFamily: "Cinzel Decorative, Cinzel, serif",
            fontSize: "1rem",
            color: C.goldBright,
            letterSpacing: "2px",
            margin: "4px 0",
            textShadow: "0 0 12px rgba(212,164,76,0.25)",
          }}
        >
          The Seat of Judgment
        </h3>
        <p
          style={{
            fontFamily: "Crimson Text, serif",
            fontStyle: "italic",
            fontSize: "0.85rem",
            color: C.textMid,
            margin: 0,
          }}
        >
          From this throne, the lord hears the disputes of the land and shapes
          the fate of the manor.
        </p>
        {reputationTrack && REPUTATION_TRACKS[reputationTrack] && (
          <div className="flex items-center justify-center gap-2" style={{ marginTop: 6 }}>
            <Shield size={12} style={{ color: C.goldDim }} />
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.65rem",
                color: C.textMid,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {REPUTATION_TRACKS[reputationTrack].label} Path
            </span>
          </div>
        )}
      </div>

      {/* Two-panel layout: Steward + Queue */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Steward Edmund */}
        <div
          className="flex-1"
          style={{
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C.red}`,
            borderRadius: 6,
            backgroundColor: C.bgCard,
            padding: 14,
          }}
        >
          <div className="flex items-start gap-3">
            <NpcPortrait
              initial="E"
              socialClass="steward"
              mood={mood.icon || "dutiful"}
              size={64}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <h4
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.85rem",
                    color: C.goldBright,
                    margin: "0 0 2px",
                  }}
                >
                  Edmund
                </h4>
                <MoodBadge mood={mood} />
              </div>
              <p
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: "0.6rem",
                  color: C.textDim,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                }}
              >
                Steward of the Hall
              </p>
              <p
                style={{
                  fontFamily: "Crimson Text, serif",
                  fontStyle: "italic",
                  fontSize: "0.9rem",
                  color: C.text,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                &ldquo;{edmundLine}&rdquo;
              </p>
              <TrustBar trust={trust} />
            </div>
          </div>
        </div>

        {/* Queue */}
        <div
          className="flex-1"
          style={{
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C.red}`,
            borderRadius: 6,
            backgroundColor: C.bgCard,
            padding: 14,
          }}
        >
          <h4
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.85rem",
              color: C.goldBright,
              margin: "0 0 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ScrollText size={14} />
            Today&rsquo;s Queue
          </h4>
          {disputes.length === 0 ? (
            <p
              style={{
                fontFamily: "Crimson Text, serif",
                fontStyle: "italic",
                fontSize: "0.9rem",
                color: C.textDim,
                margin: 0,
              }}
            >
              No disputes await your judgment this season.
            </p>
          ) : (
            disputes.map((d, i) => {
              const isResolved = resolvedIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => !isResolved && onSelectDispute(d)}
                  disabled={isResolved}
                  className="w-full flex items-center gap-2 text-left"
                  style={{
                    padding: "10px 6px",
                    borderTop: i > 0 ? `1px solid ${C.borderDim}` : "none",
                    background: "none",
                    border: i > 0 ? undefined : "none",
                    borderLeft: "none",
                    borderRight: "none",
                    borderBottom: "none",
                    cursor: isResolved ? "default" : "pointer",
                    opacity: isResolved ? 0.4 : 1,
                    transition: "opacity 200ms ease",
                  }}
                >
                  <ChevronRight
                    size={14}
                    style={{ color: isResolved ? C.textDim : C.redBright, flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontFamily: "Crimson Text, serif",
                      fontSize: "0.9rem",
                      color: isResolved ? C.textDim : C.text,
                      textDecoration: isResolved ? "line-through" : "none",
                    }}
                  >
                    {d.title}
                  </span>
                  <span
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "0.6rem",
                      color: isResolved ? C.textDim : C.textMid,
                      marginLeft: "auto",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      flexShrink: 0,
                    }}
                  >
                    {isResolved ? "Resolved" : d.difficulty}
                  </span>
                </button>
              );
            })
          )}
          {disputes.length > 0 && (
            <p
              style={{
                fontFamily: "Crimson Text, serif",
                fontStyle: "italic",
                fontSize: "0.8rem",
                color: C.textDim,
                marginTop: 10,
                marginBottom: 0,
              }}
            >
              Select a dispute to hear the case.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── (Placeholder views removed — all Phase 3 views are now live) ──

// ─── Main Component ────────────────────────────────────────────

export default function GreatHall({ state, dispatch }) {
  const [currentView, setCurrentView] = useState("throne");
  const [ambientIndex, setAmbientIndex] = useState(0);
  const [ambientVisible, setAmbientVisible] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);

  const hall = state.greatHall || {};
  const meters = hall.meters || DEFAULT_METERS;
  const reputation = hall.reputation || "Unknown Lord";
  const reputationTrack = hall.reputationTrack || null;
  const stewardTrust = hall.stewardTrust ?? 50;
  const resolvedIds = (hall.rulingHistory || []).map((r) => r.disputeId);
  const audienceResolvedIds = useMemo(() => hall.audienceResolved || [], [hall.audienceResolved]);
  const activeDecreeIds = hall.activeDecrees || [];
  const decreeSlotsUsed = hall.decreeSlotsUsed || 0;
  const councilResolvedIds = useMemo(() => hall.councilResolved || [], [hall.councilResolved]);
  const hasFeastedThisSeason = hall.hasFeastedThisSeason || false;
  const pendingHallEvent = hall.pendingHallEvent || null;

  // Phase 4: Edmund mood derived from treasury meter
  const edmundMood = useMemo(() => getEdmundMood(meters.treasury), [meters.treasury]);

  // Phase 4: Context-aware Edmund line — recalculated once per view change
  const [edmundLine, setEdmundLine] = useState(() =>
    selectEdmundLine(state, "throne", stewardTrust)
  );

  const refreshEdmundLine = useCallback((view) => {
    setEdmundLine(selectEdmundLine(state, view, stewardTrust));
  }, [state, stewardTrust]);

  // Disputes: match season, limit 4
  const availableDisputes = useMemo(() => {
    const season = state.season || "spring";
    return DISPUTES.filter(
      (d) => d.season === "any" || d.season === season
    ).slice(0, 4);
  }, [state.season]);

  // Audience: pick 5 encounters that haven't been resolved yet
  const availableAudience = useMemo(() => {
    return AUDIENCE_ENCOUNTERS.filter(
      (e) => !audienceResolvedIds.includes(e.id)
    ).slice(0, 5);
  }, [audienceResolvedIds]);

  // Council: pick the first unresolved topic (1 per season)
  const councilTopic = useMemo(() => {
    return COUNCIL_TOPICS.find((t) => !councilResolvedIds.includes(t.id)) || null;
  }, [councilResolvedIds]);

  // Council unlock: turn >= 4 or people meter > 70
  const councilUnlocked = (state.turn || 1) >= 4 || meters.people > 70;

  // ─── View switching (refreshes Edmund line) ────────────────────

  const switchView = useCallback((view) => {
    setCurrentView(view);
    refreshEdmundLine(view);
  }, [refreshEdmundLine]);

  // ─── Dispatch handlers ──────────────────────────────────────────

  const handleSelectDispute = (dispute) => {
    setSelectedDispute(dispute);
    switchView("dispute");
  };

  const handleRuleDispute = (disputeId, rulingId, consequences, decree) => {
    dispatch({
      type: "HALL_RULE_DISPUTE",
      payload: { disputeId, rulingId, consequences, decree },
    });
    // Refresh Edmund's line after ruling (post-ruling reaction)
    setTimeout(() => refreshEdmundLine("throne"), 100);
  };

  const handleReturnFromDispute = () => {
    setSelectedDispute(null);
    switchView("throne");
  };

  const handleAudienceRespond = (encounterId, responseIndex, consequences) => {
    dispatch({
      type: "HALL_AUDIENCE_RESPOND",
      payload: { encounterId, responseIndex, consequences },
    });
  };

  const handleIssueDecree = (decreeId, effects) => {
    dispatch({
      type: "HALL_ISSUE_DECREE",
      payload: { decreeId, effects },
    });
  };

  const handleRevokeDecree = (decreeId) => {
    dispatch({
      type: "HALL_REVOKE_DECREE",
      payload: { decreeId },
    });
  };

  const handleCouncilVote = (topicId, optionId, consequences) => {
    dispatch({
      type: "HALL_COUNCIL_VOTE",
      payload: { topicId, optionId, consequences },
    });
  };

  const handleFeastComplete = (totalEffects) => {
    dispatch({
      type: "HALL_FEAST_COMPLETE",
      payload: { totalEffects },
    });
  };

  // Phase 5: Dismiss crisis/peak event
  const handleDismissEvent = () => {
    dispatch({ type: "HALL_DISMISS_EVENT" });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAmbientVisible(false);
      const fadeTimer = setTimeout(() => {
        setAmbientIndex((prev) => (prev + 1) % AMBIENT_TEXTS.length);
        setAmbientVisible(true);
      }, 500);
      return () => clearTimeout(fadeTimer);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        background: C.bgDeep,
      }}
    >
      {/* ═══ HEADER ═══ */}
      <div
        style={{
          textAlign: "center",
          padding: "18px 16px 14px",
          borderBottom: `2px solid ${C.red}`,
          background:
            `linear-gradient(180deg, ${C.bgElevated} 0%, ${C.bgDark} 100%)`,
        }}
      >
        <div className="flex items-center justify-center gap-4">
          <Torch />
          <div>
            <h2
              style={{
                fontFamily: "Cinzel Decorative, Cinzel, serif",
                fontSize: "1.3rem",
                color: C.goldBright,
                letterSpacing: "3px",
                textTransform: "uppercase",
                margin: 0,
                lineHeight: 1.2,
                textShadow: "0 0 20px rgba(212,164,76,0.3)",
              }}
            >
              The Great Hall
            </h2>
            <p
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.75rem",
                color: C.textMid,
                letterSpacing: "2px",
                margin: "6px 0 0",
              }}
            >
              <span style={{ color: C.gold }}>{reputation}</span> &mdash;{" "}
              {state.season
                ? state.season.charAt(0).toUpperCase() + state.season.slice(1)
                : "Spring"}
              , Year {state.year || 1}
            </p>
          </div>
          <Torch />
        </div>
      </div>

      {/* Meters now shown in main Dashboard */}

      {/* ═══ CONTENT AREA (with decorative columns) ═══ */}
      <div className="flex" style={{ minHeight: 360 }}>
        {/* Left stone column with torch (desktop) */}
        <div
          className="hidden md:flex flex-col items-center"
          style={{
            width: 48,
            paddingTop: 24,
            background: `linear-gradient(90deg, ${C.bgDeep} 0%, ${C.bgDark} 100%)`,
            borderRight: `2px solid ${C.borderDim}`,
          }}
        >
          <Torch />
        </div>

        {/* Main content */}
        <div
          className="flex-1"
          style={{
            padding: 16,
            background: `linear-gradient(180deg, ${C.bgDark} 0%, ${C.bgDeep} 100%)`,
          }}
        >
          {/* Phase 5: Crisis/Peak Event Banner */}
          {pendingHallEvent && (
            <HallEventBanner event={pendingHallEvent} onDismiss={handleDismissEvent} />
          )}
          {currentView === "throne" && (
            <ThroneRoom
              edmundLine={edmundLine}
              disputes={availableDisputes}
              resolvedIds={resolvedIds}
              onSelectDispute={handleSelectDispute}
              trust={stewardTrust}
              mood={edmundMood}
              reputationTrack={reputationTrack}
            />
          )}
          {currentView === "dispute" && selectedDispute && (
            <DisputeScreen
              dispute={selectedDispute}
              onRule={handleRuleDispute}
              onReturn={handleReturnFromDispute}
            />
          )}
          {currentView === "audience" && (
            <AudienceChamber
              encounters={availableAudience}
              resolvedIds={audienceResolvedIds}
              onRespond={handleAudienceRespond}
              onReturn={() => switchView("throne")}
            />
          )}
          {currentView === "decrees" && (
            <DecreeDesk
              decrees={DECREE_OPTIONS}
              activeDecreeIds={activeDecreeIds}
              decreeSlots={2 - decreeSlotsUsed}
              onIssue={handleIssueDecree}
              onRevoke={handleRevokeDecree}
              onReturn={() => switchView("throne")}
            />
          )}
          {currentView === "council" && (
            <CouncilChamber
              topic={councilTopic}
              onVote={handleCouncilVote}
              onReturn={() => switchView("throne")}
              isLocked={!councilUnlocked}
            />
          )}
          {currentView === "feast" && (
            <FeastHall
              feastData={FEAST_DATA}
              onComplete={handleFeastComplete}
              onReturn={() => switchView("throne")}
              hasFeastedThisSeason={hasFeastedThisSeason}
              treasuryMeter={meters.treasury}
            />
          )}
          {currentView === "summary" && (
            <SeasonSummary
              hall={hall}
              state={state}
              onReturn={() => switchView("throne")}
            />
          )}
        </div>

        {/* Right stone column with torch (desktop) */}
        <div
          className="hidden md:flex flex-col items-center"
          style={{
            width: 48,
            paddingTop: 24,
            background: `linear-gradient(270deg, ${C.bgDeep} 0%, ${C.bgDark} 100%)`,
            borderLeft: `2px solid ${C.borderDim}`,
          }}
        >
          <Torch />
        </div>
      </div>

      {/* ═══ HALL NAVIGATION ═══ */}
      <div
        className="flex overflow-x-auto"
        style={{
          borderTop: `1px solid ${C.border}`,
          backgroundColor: C.bgDark,
        }}
      >
        {HALL_VIEWS.map((view) => {
          const isActive = currentView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => switchView(view.id)}
              className="flex-1 min-w-0 px-2"
              style={{
                paddingTop: 8,
                paddingBottom: 8,
                textAlign: "center",
                backgroundColor: isActive ? C.bgElevated : "transparent",
                borderTop: isActive
                  ? `2px solid ${C.redBright}`
                  : "2px solid transparent",
                color: isActive ? C.goldBright : C.textDim,
                fontFamily: "Cinzel, serif",
                fontSize: "0.7rem",
                letterSpacing: "1px",
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = C.bgElevated;
                  e.currentTarget.style.color = C.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = C.textDim;
                }
              }}
            >
              <view.Icon size={15} className="inline-block" />
              <span className="block text-xs" style={{ marginTop: 2 }}>
                {view.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══ AMBIENT FOOTER ═══ */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: `1px solid ${C.borderDim}`,
          backgroundColor: C.bgDeep,
        }}
      >
        <p
          style={{
            fontFamily: "Crimson Text, serif",
            fontStyle: "italic",
            fontSize: "0.85rem",
            color: C.textDim,
            textAlign: "center",
            margin: 0,
            opacity: ambientVisible ? 1 : 0,
            transition: "opacity 500ms ease",
          }}
        >
          &#9656; {AMBIENT_TEXTS[ambientIndex]}
        </p>
      </div>
    </div>
  );
}
