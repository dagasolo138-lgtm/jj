/**
 * CouncilChamber.jsx
 *
 * Phase 3 — The Council Chamber
 * A formal chamber where the lord's four advisors (Edmund, Aldous,
 * Wulf, Margery) gather to debate matters of state. The player reads
 * each advisor's position, then votes on a course of action.
 * Shows consequences, aftermath, and a historical-note toggle.
 */

import { useState } from "react";
import {
  Landmark, Lock, BookOpen, ChevronRight, ArrowLeft,
} from "lucide-react";

// ─── Advisor portrait config ────────────────────────────────────

const ADVISOR_CONFIG = {
  edmund: {
    name: "Edmund",
    title: "Steward of the Hall",
    initial: "E",
    bg: "linear-gradient(135deg, #3a3020, #252018)",
    border: "#a89070",
  },
  aldous: {
    name: "Father Aldous",
    title: "Parish Chaplain",
    initial: "A",
    bg: "linear-gradient(135deg, #3a2850, #221838)",
    border: "#6a4a8a",
  },
  wulf: {
    name: "Sergeant Wulf",
    title: "Captain of the Guard",
    initial: "W",
    bg: "linear-gradient(135deg, #3a3a40, #222228)",
    border: "#8b4444",
  },
  margery: {
    name: "Margery the Elder",
    title: "Voice of the People",
    initial: "M",
    bg: "linear-gradient(135deg, #4a3728, #2d2018)",
    border: "#4a8a3a",
  },
};

const POSITION_COLORS = {
  support: { bg: "#2d5a2d", text: "#8dba6e" },
  oppose:  { bg: "#8b2020", text: "#e88080" },
  neutral: { bg: "#6a5a42", text: "#c8b090" },
};

const CONSEQUENCE_LABELS = {
  people:   { name: "People",   color: "#2d5a2d" },
  treasury: { name: "Treasury", color: "#c4a24a" },
  church:   { name: "Church",   color: "#6a4a8a" },
  military: { name: "Military", color: "#8b2020" },
};

// ─── Sub-components ─────────────────────────────────────────────

function AdvisorPortrait({ advisorKey, size = 56 }) {
  const cfg = ADVISOR_CONFIG[advisorKey];
  if (!cfg) return null;

  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${cfg.border}`,
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Cinzel Decorative, Cinzel, serif",
        fontSize: size * 0.35,
        color: "#e8dcc8",
        background: cfg.bg,
        flexShrink: 0,
      }}
    >
      {cfg.initial}
    </div>
  );
}

function PositionBadge({ position }) {
  const colors = POSITION_COLORS[position] || POSITION_COLORS.neutral;
  return (
    <span
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: "0.55rem",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: colors.text,
        backgroundColor: colors.bg,
        padding: "2px 8px",
        borderRadius: 3,
      }}
    >
      {position}
    </span>
  );
}

function ConsequenceBadges({ consequences }) {
  const items = Object.entries(consequences).filter(([, v]) => v !== 0);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" style={{ marginTop: 6 }}>
      {items.map(([key, val]) => {
        const info = CONSEQUENCE_LABELS[key];
        if (!info) return null;
        const isPos = val > 0;
        return (
          <span
            key={key}
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.7rem",
              color: isPos ? "#4a8a3a" : "#c44444",
              padding: "2px 8px",
              borderRadius: 3,
              border: `1px solid ${info.color}`,
              backgroundColor: "rgba(26,23,20,0.5)",
            }}
          >
            {info.name} {isPos ? "+" : ""}{val}
          </span>
        );
      })}
    </div>
  );
}

function ConsequencePreview({ consequences }) {
  const items = Object.entries(consequences).filter(([, v]) => v !== 0);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" style={{ marginTop: 4 }}>
      {items.map(([key, val]) => {
        const info = CONSEQUENCE_LABELS[key];
        if (!info) return null;
        const isPositive = val > 0;
        const magnitude = Math.abs(val) >= 4 ? 2 : 1;
        const arrow = isPositive ? "\u25B2" : "\u25BC";
        const arrows = magnitude === 2 ? arrow + arrow : arrow;
        return (
          <span
            key={key}
            style={{
              fontSize: "0.6rem",
              fontFamily: "Cinzel, serif",
              color: isPositive ? "#4a8a3a" : "#c44444",
              letterSpacing: "1px",
            }}
          >
            {info.name} {arrows}
          </span>
        );
      })}
    </div>
  );
}

/** Shared button with gold-border hover pattern */
function HallButton({ onClick, children, style: extraStyle = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: "0.8rem",
        color: "#d4a44c",
        background: "none",
        border: "1px solid #d4a44c",
        padding: "8px 24px",
        borderRadius: 4,
        cursor: "pointer",
        transition: "all 200ms ease",
        ...extraStyle,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(212,164,76,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </button>
  );
}

// ─── Advisor Seat Card ──────────────────────────────────────────

function AdvisorSeat({ advisorKey, advisorData }) {
  const cfg = ADVISOR_CONFIG[advisorKey];
  if (!cfg || !advisorData) return null;

  return (
    <div
      style={{
        flex: "1 1 220px",
        border: `1px solid ${cfg.border}30`,
        borderRadius: 6,
        backgroundColor: "rgba(42,37,32,0.5)",
        padding: 12,
      }}
    >
      <div className="flex items-start gap-3" style={{ marginBottom: 8 }}>
        <AdvisorPortrait advisorKey={advisorKey} size={48} />
        <div className="flex-1 min-w-0">
          <h4
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.75rem",
              color: cfg.border,
              margin: "0 0 2px",
            }}
          >
            {cfg.name}
          </h4>
          <p
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.5rem",
              color: "#6a5a42",
              letterSpacing: "1px",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}
          >
            {cfg.title}
          </p>
          <PositionBadge position={advisorData.position} />
        </div>
      </div>
      <p
        style={{
          fontFamily: "Crimson Text, serif",
          fontStyle: "italic",
          fontSize: "0.85rem",
          color: "#c8b090",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        &ldquo;{advisorData.speech}&rdquo;
      </p>
    </div>
  );
}

// ─── Locked State ───────────────────────────────────────────────

function LockedView({ onReturn }) {
  return (
    <div className="text-center" style={{ padding: "32px 16px" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 72,
          height: 72,
          border: "2px solid #3d3630",
          borderRadius: 8,
          backgroundColor: "rgba(26,23,20,0.5)",
          marginBottom: 16,
        }}
      >
        <Lock size={32} style={{ color: "#6a5a42" }} />
      </div>

      <h3
        style={{
          fontFamily: "Cinzel Decorative, Cinzel, serif",
          fontSize: "1.1rem",
          color: "#6a5a42",
          letterSpacing: "2px",
          margin: "0 0 12px",
        }}
      >
        The Council Chamber
      </h3>

      <p
        style={{
          fontFamily: "Crimson Text, serif",
          fontStyle: "italic",
          fontSize: "0.9rem",
          color: "#4a4030",
          maxWidth: 360,
          margin: "0 auto 16px",
          lineHeight: 1.5,
        }}
      >
        The council chamber is sealed. You must first earn the trust
        of your advisors before they will gather.
      </p>

      <p
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "0.65rem",
          color: "#4a4030",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        Unlock: Season 4 or People above 70
      </p>

      <HallButton onClick={onReturn}>
        <span className="flex items-center gap-2">
          <ArrowLeft size={14} />
          Return to Throne
        </span>
      </HallButton>
    </div>
  );
}

// ─── No Topic State ─────────────────────────────────────────────

function NoTopicView({ onReturn }) {
  return (
    <div className="text-center" style={{ padding: "32px 16px" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 64,
          height: 64,
          border: "2px solid #3d3630",
          borderRadius: 8,
          backgroundColor: "rgba(26,23,20,0.5)",
          marginBottom: 12,
        }}
      >
        <Landmark size={28} style={{ color: "#6a5a42" }} />
      </div>

      <h3
        style={{
          fontFamily: "Cinzel Decorative, Cinzel, serif",
          fontSize: "1rem",
          color: "#6a5a42",
          letterSpacing: "2px",
          margin: "0 0 8px",
        }}
      >
        The Council Chamber
      </h3>

      <p
        style={{
          fontFamily: "Crimson Text, serif",
          fontStyle: "italic",
          fontSize: "0.9rem",
          color: "#4a4030",
          maxWidth: 400,
          margin: "0 auto 20px",
          lineHeight: 1.5,
        }}
      >
        The council has no matters to discuss this season. The advisors
        sit quietly, awaiting your command.
      </p>

      <HallButton onClick={onReturn}>
        <span className="flex items-center gap-2">
          <ArrowLeft size={14} />
          Return to Throne
        </span>
      </HallButton>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
export default function CouncilChamber({ topic, advisors, onVote, onReturn, isLocked }) {
  // Steps: "debate" | "voted"
  const [step, setStep] = useState("debate");
  const [selectedOption, setSelectedOption] = useState(null);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showHistNote, setShowHistNote] = useState(false);

  // ── Locked state
  if (isLocked) {
    return <LockedView onReturn={onReturn} />;
  }

  // ── No topic available
  if (!topic) {
    return <NoTopicView onReturn={onReturn} />;
  }

  // ── Handle vote
  const handleVote = (option) => {
    setSelectedOption(option);
    onVote(topic.id, option.id, option.consequences);
    setStep("voted");
  };

  // Advisor keys in display order
  const advisorKeys = ["edmund", "aldous", "wulf", "margery"];

  return (
    <div className="council-fade">
      {/* ═══ HEADER ═══ */}
      <div className="text-center" style={{ marginBottom: 16 }}>
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 8 }}>
          <Landmark size={18} style={{ color: "#d4a44c" }} />
          <h3
            style={{
              fontFamily: "Cinzel Decorative, Cinzel, serif",
              fontSize: "1rem",
              color: "#d4a44c",
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            The Council Chamber
          </h3>
          <Landmark size={18} style={{ color: "#d4a44c" }} />
        </div>
        <p
          style={{
            fontFamily: "Crimson Text, serif",
            fontStyle: "italic",
            fontSize: "0.8rem",
            color: "#a89070",
            margin: 0,
          }}
        >
          Your advisors have gathered
        </p>
      </div>

      {/* ═══ DEBATE STEP ═══ */}
      {step === "debate" && (
        <div>
          {/* The Matter */}
          <div
            style={{
              padding: 14,
              borderRadius: 6,
              border: "1px solid #3d3630",
              backgroundColor: "rgba(42,37,32,0.5)",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.6rem",
                color: "#6a5a42",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              The Matter Before the Council
            </span>
            <h4
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.9rem",
                color: "#d4a44c",
                margin: "6px 0 8px",
              }}
            >
              {topic.title}
            </h4>
            <p
              style={{
                fontFamily: "Crimson Text, serif",
                fontSize: "0.9rem",
                color: "#e8dcc8",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {topic.description}
            </p>
          </div>

          {/* Advisor Seats — 2x2 grid */}
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.6rem",
                color: "#6a5a42",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 8,
              }}
            >
              Advisor Counsel
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {advisorKeys.map((key) => {
                const topicAdvisor = topic.advisors?.[key];
                if (!topicAdvisor) return null;
                return (
                  <AdvisorSeat
                    key={key}
                    advisorKey={key}
                    advisorData={topicAdvisor}
                  />
                );
              })}
            </div>
          </div>

          {/* Decision Options */}
          <div>
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.6rem",
                color: "#6a5a42",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 8,
              }}
            >
              Your Decision
            </span>
            <div className="flex flex-col gap-3">
              {topic.options.map((option) => (
                <button
                  key={option.id}
                  className="ruling-card"
                  onClick={() => handleVote(option)}
                  onMouseEnter={() => setHoveredOption(option.id)}
                  onMouseLeave={() => setHoveredOption(null)}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 6,
                    border: "1px solid #3d3630",
                    backgroundColor: hoveredOption === option.id
                      ? "rgba(42,37,32,0.7)"
                      : "rgba(42,37,32,0.4)",
                    cursor: "pointer",
                    transition: "all 200ms ease",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      size={14}
                      style={{
                        color: hoveredOption === option.id ? "#d4a44c" : "#6a5a42",
                        flexShrink: 0,
                        transition: "color 200ms ease",
                      }}
                    />
                    <h5
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "0.8rem",
                        color: "#d4a44c",
                        margin: 0,
                      }}
                    >
                      {option.label}
                    </h5>
                  </div>
                  {hoveredOption === option.id && (
                    <ConsequencePreview consequences={option.consequences} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Back to throne */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={onReturn}
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.7rem",
                color: "#6a5a42",
                background: "none",
                border: "1px solid #3d3630",
                padding: "6px 16px",
                borderRadius: 4,
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6a5a42";
                e.currentTarget.style.color = "#a89070";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#3d3630";
                e.currentTarget.style.color = "#6a5a42";
              }}
            >
              <span className="flex items-center gap-2 justify-center">
                <ArrowLeft size={12} />
                Leave Council
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ VOTED STEP ═══ */}
      {step === "voted" && selectedOption && (
        <div>
          {/* Decree card */}
          <div
            className="decree-appear"
            style={{
              padding: 16,
              borderRadius: 6,
              border: "2px solid #a0342b",
              backgroundColor: "rgba(232,220,200,0.08)",
              marginBottom: 16,
            }}
          >
            <div className="flex items-start gap-4">
              {/* Wax Seal */}
              <div
                className="seal-stamp"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 40%, #c44a3a, #8b2020, #5a1010)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)",
                  flexShrink: 0,
                }}
              >
                <Landmark size={20} style={{ color: "#e8dcc8", opacity: 0.8 }} />
              </div>
              <div className="flex-1">
                <h4
                  style={{
                    fontFamily: "Cinzel Decorative, Cinzel, serif",
                    fontSize: "0.8rem",
                    color: "#d4a44c",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    margin: "0 0 8px",
                  }}
                >
                  The Council Has Decided
                </h4>
                <p
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.85rem",
                    color: "#e8dcc8",
                    margin: 0,
                  }}
                >
                  {selectedOption.label}
                </p>
              </div>
            </div>
          </div>

          {/* Aftermath */}
          <div
            style={{
              padding: 12,
              borderRadius: 6,
              border: "1px solid #3d3630",
              backgroundColor: "rgba(42,37,32,0.5)",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.6rem",
                color: "#6a5a42",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              What Follows
            </span>
            <p
              style={{
                fontFamily: "Crimson Text, serif",
                fontSize: "0.9rem",
                color: "#c8b090",
                lineHeight: 1.5,
                margin: "6px 0 0",
              }}
            >
              {selectedOption.aftermath}
            </p>
          </div>

          {/* Consequences */}
          <div
            style={{
              padding: 12,
              borderRadius: 6,
              border: "1px solid #2a2520",
              backgroundColor: "rgba(26,23,20,0.5)",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.6rem",
                color: "#6a5a42",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Consequences
            </span>
            <ConsequenceBadges consequences={selectedOption.consequences} />
          </div>

          {/* Historical Note toggle */}
          {topic.historicalNote && (
            <div style={{ maxWidth: 500, margin: "0 auto 16px" }}>
              <button
                onClick={() => setShowHistNote(!showHistNote)}
                className="flex items-center gap-2"
                style={{
                  margin: "0 auto",
                  fontFamily: "Cinzel, serif",
                  fontSize: "0.7rem",
                  color: "#6a5a42",
                  background: "none",
                  border: "1px solid #3d3630",
                  padding: "6px 14px",
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6a5a42";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#3d3630";
                }}
              >
                <BookOpen size={14} />
                {showHistNote ? "Hide" : "Show"} Historical Context
              </button>
              {showHistNote && (
                <div
                  className="evidence-reveal"
                  style={{
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 6,
                    border: "1px solid #3d3630",
                    backgroundColor: "rgba(42,37,32,0.5)",
                    textAlign: "left",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Crimson Text, serif",
                      fontSize: "0.85rem",
                      color: "#c8b090",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {topic.historicalNote}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Return button */}
          <div style={{ textAlign: "center" }}>
            <HallButton onClick={onReturn}>
              <span className="flex items-center gap-2 justify-center">
                <ArrowLeft size={14} />
                Return to Throne
              </span>
            </HallButton>
          </div>
        </div>
      )}
    </div>
  );
}
