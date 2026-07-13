/**
 * FeastHall.jsx
 *
 * Phase 3 — The Feast Hall
 * A multi-step feast planner: choose guests, entertainment, and courses,
 * then watch the feast unfold with a random event. Displays combined
 * effects and a running cost preview throughout.
 */

import { useState } from "react";
import {
  Utensils, ChevronRight, ArrowLeft, Sparkles, Crown,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────

const STEP_TITLES = [
  "Who Shall Attend?",
  "Choose Entertainment",
  "The Main Course",
  "The Feast Begins",
  "Feast Complete",
];

const STEP_SUBTITLES = [
  "Select your honored guests for the evening",
  "How shall the hall be entertained?",
  "What fare shall grace the lord's table?",
  "",
  "",
];

const EFFECT_LABELS = {
  people:   { name: "People",   color: "#2d5a2d" },
  treasury: { name: "Treasury", color: "#c4a24a" },
  church:   { name: "Church",   color: "#6a4a8a" },
  military: { name: "Military", color: "#8b2020" },
};

// ─── Helper: combine multiple effect objects ────────────────────

function combineEffects(...effectArrays) {
  const total = { people: 0, treasury: 0, church: 0, military: 0 };
  for (const eff of effectArrays) {
    if (!eff) continue;
    for (const key of Object.keys(total)) {
      total[key] += eff[key] || 0;
    }
  }
  return total;
}

// ─── Sub-components ─────────────────────────────────────────────

/** Effect arrows for radio-option cards (inline preview) */
function EffectArrows({ effects }) {
  const items = Object.entries(effects).filter(([, v]) => v !== 0);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" style={{ marginTop: 4 }}>
      {items.map(([key, val]) => {
        const info = EFFECT_LABELS[key];
        if (!info) return null;
        const isPositive = val > 0;
        const magnitude = Math.abs(val) >= 3 ? 2 : 1;
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

/** Consequence badges for final results (with +/- numbers) */
function ConsequenceBadges({ consequences }) {
  const items = Object.entries(consequences).filter(([, v]) => v !== 0);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([key, val]) => {
        const info = EFFECT_LABELS[key];
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

/** Running cost preview bar at the bottom of planning steps */
function CostPreview({ effects }) {
  const items = Object.entries(effects).filter(([, v]) => v !== 0);
  if (items.length === 0) return null;

  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 4,
        border: "1px solid #2a2520",
        backgroundColor: "rgba(26,23,20,0.6)",
        marginTop: 12,
      }}
    >
      <span
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: "0.55rem",
          color: "#6a5a42",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
        }}
      >
        Running Total
      </span>
      <div className="flex flex-wrap gap-3" style={{ marginTop: 4 }}>
        {items.map(([key, val]) => {
          const info = EFFECT_LABELS[key];
          if (!info) return null;
          const isPos = val > 0;
          return (
            <span
              key={key}
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.65rem",
                color: isPos ? "#4a8a3a" : "#c44444",
              }}
            >
              {info.name} {isPos ? "+" : ""}{val}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Radio-style option card for planning steps */
function OptionCard({ option, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(option)}
      style={{
        textAlign: "left",
        width: "100%",
        padding: 12,
        borderRadius: 6,
        border: isSelected
          ? "2px solid #d4a44c"
          : "1px solid #3d3630",
        backgroundColor: isSelected
          ? "rgba(212,164,76,0.1)"
          : "rgba(42,37,32,0.4)",
        cursor: "pointer",
        transition: "all 200ms ease",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "rgba(42,37,32,0.6)";
          e.currentTarget.style.borderColor = "#6a5a42";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "rgba(42,37,32,0.4)";
          e.currentTarget.style.borderColor = "#3d3630";
        }
      }}
    >
      <div className="flex items-center gap-3">
        {/* Radio dot */}
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: isSelected
              ? "2px solid #d4a44c"
              : "2px solid #6a5a42",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "border-color 200ms ease",
          }}
        >
          {isSelected && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#d4a44c",
              }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h5
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.8rem",
              color: isSelected ? "#d4a44c" : "#c8b090",
              margin: "0 0 2px",
            }}
          >
            {option.label}
          </h5>
          {option.description && (
            <p
              style={{
                fontFamily: "Crimson Text, serif",
                fontStyle: "italic",
                fontSize: "0.8rem",
                color: "#a89070",
                margin: "0 0 2px",
                lineHeight: 1.3,
              }}
            >
              {option.description}
            </p>
          )}
          <EffectArrows effects={option.effects} />
        </div>
      </div>
    </button>
  );
}

/** Shared button with gold-border hover pattern */
function HallButton({ onClick, children, disabled = false, style: extraStyle = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: "0.8rem",
        color: disabled ? "#4a4030" : "#d4a44c",
        background: "none",
        border: `1px solid ${disabled ? "#3d3630" : "#d4a44c"}`,
        padding: "8px 24px",
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 200ms ease",
        opacity: disabled ? 0.5 : 1,
        ...extraStyle,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "rgba(212,164,76,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}

// ─── Already Feasted State ──────────────────────────────────────

function AlreadyFeasedView({ onReturn }) {
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
        <Utensils size={32} style={{ color: "#6a5a42" }} />
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
        The Feast Hall
      </h3>

      <p
        style={{
          fontFamily: "Crimson Text, serif",
          fontStyle: "italic",
          fontSize: "0.9rem",
          color: "#4a4030",
          maxWidth: 380,
          margin: "0 auto 8px",
          lineHeight: 1.5,
        }}
      >
        The tables have been cleared and the revelers have gone home.
        The hall still smells of roast meat and spilled ale.
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
        You have already held a feast this season.
      </p>

      <HallButton onClick={onReturn}>
        <span className="flex items-center gap-2 justify-center">
          <ArrowLeft size={14} />
          Return to Throne
        </span>
      </HallButton>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
export default function FeastHall({ feastData, onComplete, onReturn, hasFeastedThisSeason, treasuryMeter }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGuests, setSelectedGuests] = useState(null);
  const [selectedEntertainment, setSelectedEntertainment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Pick a random event once when step 3 (The Feast Begins) is reached
  // Use useState initializer to avoid Math.random in render
  const [randomEventIndex] = useState(() => {
    if (!feastData?.randomEvents?.length) return 0;
    return Math.floor(Math.random() * feastData.randomEvents.length);
  });

  // ── Already feasted
  if (hasFeastedThisSeason) {
    return <AlreadyFeasedView onReturn={onReturn} />;
  }

  // ── Guard against missing data
  if (!feastData) {
    return (
      <div className="text-center" style={{ padding: "32px 16px" }}>
        <p style={{ fontFamily: "Crimson Text, serif", color: "#6a5a42" }}>
          No feast preparations available.
        </p>
        <HallButton onClick={onReturn} style={{ marginTop: 16 }}>
          Return to Throne
        </HallButton>
      </div>
    );
  }

  const { guestOptions, entertainmentOptions, courseOptions, randomEvents } = feastData;
  const randomEvent = randomEvents?.[randomEventIndex] || null;

  // Compute running effects total
  const runningEffects = combineEffects(
    selectedGuests?.effects,
    selectedEntertainment?.effects,
    selectedCourse?.effects,
  );

  // Total effects including random event (for step 3+)
  const totalEffects = combineEffects(
    selectedGuests?.effects,
    selectedEntertainment?.effects,
    selectedCourse?.effects,
    currentStep >= 3 ? randomEvent?.effects : null,
  );

  // ── Step navigation
  const canAdvance = () => {
    if (currentStep === 0) return selectedGuests !== null;
    if (currentStep === 1) return selectedEntertainment !== null;
    if (currentStep === 2) return selectedCourse !== null;
    return false;
  };

  const handleNext = () => {
    if (currentStep < 3 && canAdvance()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(totalEffects);
  };

  // ── Current options for active step
  const getCurrentOptions = () => {
    if (currentStep === 0) return guestOptions || [];
    if (currentStep === 1) return entertainmentOptions || [];
    if (currentStep === 2) return courseOptions || [];
    return [];
  };

  const getCurrentSelection = () => {
    if (currentStep === 0) return selectedGuests;
    if (currentStep === 1) return selectedEntertainment;
    if (currentStep === 2) return selectedCourse;
    return null;
  };

  const setCurrentSelection = (option) => {
    if (currentStep === 0) setSelectedGuests(option);
    else if (currentStep === 1) setSelectedEntertainment(option);
    else if (currentStep === 2) setSelectedCourse(option);
  };

  return (
    <div className="herald-fade">
      {/* ═══ HEADER ═══ */}
      <div className="text-center" style={{ marginBottom: 16 }}>
        <div className="flex items-center justify-center gap-3" style={{ marginBottom: 8 }}>
          <Utensils size={18} style={{ color: "#d4a44c" }} />
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
            {currentStep < 3 ? "The Feast Hall" : currentStep === 3 ? "The Feast Begins" : "Feast Complete"}
          </h3>
          <Utensils size={18} style={{ color: "#d4a44c" }} />
        </div>
        {currentStep < 3 && (
          <p
            style={{
              fontFamily: "Crimson Text, serif",
              fontStyle: "italic",
              fontSize: "0.8rem",
              color: "#a89070",
              margin: 0,
            }}
          >
            Prepare a grand celebration
          </p>
        )}
      </div>

      {/* ═══ STEP PROGRESS INDICATOR ═══ */}
      <div className="flex items-center justify-center gap-2" style={{ marginBottom: 16 }}>
        {[0, 1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              style={{
                width: s <= currentStep ? 10 : 8,
                height: s <= currentStep ? 10 : 8,
                borderRadius: "50%",
                backgroundColor: s < currentStep
                  ? "#d4a44c"
                  : s === currentStep
                  ? "#c4813a"
                  : "rgba(106,90,66,0.3)",
                border: s === currentStep
                  ? "2px solid #d4a44c"
                  : "1px solid transparent",
                transition: "all 300ms ease",
              }}
            />
            {s < 3 && (
              <div
                style={{
                  width: 24,
                  height: 1,
                  backgroundColor: s < currentStep ? "#d4a44c" : "#3d3630",
                  transition: "background-color 300ms ease",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ═══ PLANNING STEPS (0, 1, 2) ═══ */}
      {currentStep < 3 && (
        <div>
          {/* Step title */}
          <span
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.65rem",
              color: "#6a5a42",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 10,
            }}
          >
            Step {currentStep + 1} &mdash; {STEP_TITLES[currentStep]}
          </span>

          {/* Options list */}
          <div className="flex flex-col gap-3">
            {getCurrentOptions().map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                isSelected={getCurrentSelection()?.id === option.id}
                onSelect={setCurrentSelection}
              />
            ))}
          </div>

          {/* Running cost preview */}
          {(selectedGuests || selectedEntertainment || selectedCourse) && (
            <CostPreview effects={runningEffects} />
          )}

          {/* Navigation buttons */}
          <div
            className="flex items-center justify-between"
            style={{ marginTop: 16 }}
          >
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
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
                <span className="flex items-center gap-2">
                  <ArrowLeft size={12} />
                  Back
                </span>
              </button>
            ) : (
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
                <span className="flex items-center gap-2">
                  <ArrowLeft size={12} />
                  Leave Hall
                </span>
              </button>
            )}

            <HallButton onClick={handleNext} disabled={!canAdvance()}>
              <span className="flex items-center gap-2">
                {currentStep === 2 ? "Begin the Feast" : "Next"}
                <ChevronRight size={14} />
              </span>
            </HallButton>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: THE FEAST BEGINS ═══ */}
      {currentStep === 3 && (
        <div>
          {/* Summary of choices */}
          <div
            style={{
              padding: 14,
              borderRadius: 6,
              border: "1px solid #3d3630",
              backgroundColor: "rgba(42,37,32,0.5)",
              marginBottom: 16,
            }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Crown size={14} style={{ color: "#d4a44c", flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.7rem",
                    color: "#6a5a42",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    width: 100,
                    flexShrink: 0,
                  }}
                >
                  Guests
                </span>
                <span
                  style={{
                    fontFamily: "Crimson Text, serif",
                    fontSize: "0.85rem",
                    color: "#e8dcc8",
                  }}
                >
                  {selectedGuests?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: "#d4a44c", flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.7rem",
                    color: "#6a5a42",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    width: 100,
                    flexShrink: 0,
                  }}
                >
                  Entertainment
                </span>
                <span
                  style={{
                    fontFamily: "Crimson Text, serif",
                    fontSize: "0.85rem",
                    color: "#e8dcc8",
                  }}
                >
                  {selectedEntertainment?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils size={14} style={{ color: "#d4a44c", flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.7rem",
                    color: "#6a5a42",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    width: 100,
                    flexShrink: 0,
                  }}
                >
                  Course
                </span>
                <span
                  style={{
                    fontFamily: "Crimson Text, serif",
                    fontSize: "0.85rem",
                    color: "#e8dcc8",
                  }}
                >
                  {selectedCourse?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Atmospheric text */}
          <p
            style={{
              fontFamily: "Crimson Text, serif",
              fontStyle: "italic",
              fontSize: "0.9rem",
              color: "#a89070",
              lineHeight: 1.5,
              textAlign: "center",
              margin: "0 0 16px",
            }}
          >
            The hall fills with laughter and the clatter of wooden cups.
            Torchlight dances across the faces of your guests as the
            evening unfolds...
          </p>

          {/* Random Event */}
          {randomEvent && (
            <div
              className="decree-appear"
              style={{
                padding: 14,
                borderRadius: 6,
                border: "1px solid #c4813a",
                backgroundColor: "rgba(196,129,58,0.08)",
                marginBottom: 16,
              }}
            >
              <div className="flex items-start gap-3">
                <Sparkles
                  size={20}
                  style={{ color: "#c4813a", flexShrink: 0, marginTop: 2 }}
                />
                <div className="flex-1">
                  <span
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "0.6rem",
                      color: "#c4813a",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    A Feast Event
                  </span>
                  <p
                    style={{
                      fontFamily: "Crimson Text, serif",
                      fontSize: "0.9rem",
                      color: "#e8dcc8",
                      lineHeight: 1.5,
                      margin: "6px 0 8px",
                    }}
                  >
                    {randomEvent.text}
                  </p>
                  <EffectArrows effects={randomEvent.effects} />
                </div>
              </div>
            </div>
          )}

          {/* Total Impact */}
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
              Total Impact
            </span>
            <div style={{ marginTop: 6 }}>
              <ConsequenceBadges consequences={totalEffects} />
            </div>
          </div>

          {/* Complete button */}
          <div style={{ textAlign: "center" }}>
            <HallButton onClick={handleComplete}>
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
