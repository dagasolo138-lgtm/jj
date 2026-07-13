/**
 * DisputeScreen.jsx
 *
 * Phase 2 — The Judgment Seat
 * Full dispute resolution flow: herald announcement, petitioner
 * speeches with typewriter reveal, steward advice, ruling selection
 * with consequence previews, decree announcement, and aftermath.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Scale, BookOpen, ChevronRight } from "lucide-react";

// ─── Typewriter text reveal ───────────────────────────────────

function TypewriterText({ text, speed = 25, onComplete }) {
  const [len, setLen] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setLen(0);
    completedRef.current = false;

    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= text.length) {
        setLen(text.length);
        clearInterval(timer);
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
      } else {
        setLen(i);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  const skip = () => {
    setLen(text.length);
    if (!completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    }
  };

  const isDone = len >= text.length;

  return (
    <span
      onClick={!isDone ? skip : undefined}
      style={{ cursor: isDone ? "default" : "pointer" }}
    >
      {text.slice(0, len)}
      {!isDone && <span className="dispute-cursor">|</span>}
    </span>
  );
}

// ─── NPC Portrait ─────────────────────────────────────────────

function NpcPortrait({ initial, socialClass = "peasant", mood = "neutral", size = 64 }) {
  const bgMap = {
    peasant:  "linear-gradient(135deg, #4a3728, #2d2018)",
    merchant: "linear-gradient(135deg, #2d4a28, #1a2d14)",
    clergy:   "linear-gradient(135deg, #3a2850, #221838)",
    military: "linear-gradient(135deg, #3a3a40, #222228)",
    noble:    "linear-gradient(135deg, #4a3a10, #2d2408)",
    steward:  "linear-gradient(135deg, #3a3020, #252018)",
  };
  const borderMap = {
    angry: "#c44444", sad: "#6688aa", nervous: "#ccaa44",
    hopeful: "#44aa88", defensive: "#ca8844", neutral: "#d4a44c",
  };

  return (
    <div
      style={{
        width: size, height: size,
        border: `3px solid ${borderMap[mood] || borderMap.neutral}`,
        borderRadius: 4,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Cinzel Decorative, Cinzel, serif",
        fontSize: size * 0.35, color: "#e8dcc8",
        background: bgMap[socialClass] || bgMap.peasant,
        flexShrink: 0,
        animation: mood === "angry" ? "portrait-shake 0.3s ease infinite" : "none",
      }}
    >
      {initial}
    </div>
  );
}

// ─── Consequence preview arrows ───────────────────────────────

function ConsequencePreview({ consequences }) {
  const labels = {
    people: { name: "People", color: "#2d5a2d" },
    treasury: { name: "Treasury", color: "#c4a24a" },
    church: { name: "Church", color: "#6a4a8a" },
    military: { name: "Military", color: "#8b2020" },
  };

  const items = Object.entries(consequences).filter(([, v]) => v !== 0);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" style={{ marginTop: 6 }}>
      {items.map(([key, val]) => {
        const info = labels[key];
        if (!info) return null;
        const isPositive = val > 0;
        const magnitude = Math.abs(val) >= 5 ? 2 : 1;
        const arrow = isPositive ? "▲" : "▼";
        const arrows = magnitude === 2 ? arrow + arrow : arrow;
        return (
          <span
            key={key}
            style={{
              fontSize: "0.65rem",
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

// ─── Wax Seal SVG ─────────────────────────────────────────────

function WaxSeal({ size = 48 }) {
  return (
    <div
      className="seal-stamp"
      style={{
        width: size, height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 40%, #c44a3a, #8b2020, #5a1010)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)",
        flexShrink: 0,
      }}
    >
      <Scale size={size * 0.45} style={{ color: "#e8dcc8", opacity: 0.8 }} />
    </div>
  );
}

// ─── Main DisputeScreen Component ─────────────────────────────

export default function DisputeScreen({ dispute, onRule, onReturn }) {
  // Steps: 0=herald, 1=presenting, 2=ruling, 3=aftermath, 4=done
  const [step, setStep] = useState(0);
  const [petADone, setPetADone] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showSteward, setShowSteward] = useState(false);
  const [selectedRuling, setSelectedRuling] = useState(null);
  const [showHistNote, setShowHistNote] = useState(false);
  const [hoveredRuling, setHoveredRuling] = useState(null);

  const isDecision = !dispute.petitionerA && !dispute.petitionerB;
  const hasSecondPetitioner = !!dispute.petitionerB;

  // When petitioner A finishes, start B (or show evidence if solo)
  const handlePetAComplete = useCallback(() => {
    setPetADone(true);
    if (!hasSecondPetitioner) {
      setTimeout(() => setShowEvidence(true), 300);
      setTimeout(() => setShowSteward(true), 800);
    }
  }, [hasSecondPetitioner]);

  const handlePetBComplete = useCallback(() => {
    setTimeout(() => setShowEvidence(true), 300);
    setTimeout(() => setShowSteward(true), 800);
  }, []);

  // Handle ruling selection
  const handleSelectRuling = (ruling) => {
    setSelectedRuling(ruling);
    onRule(dispute.id, ruling.id, ruling.consequences, ruling.decree, ruling.reputation_shift);
    setStep(3);
  };

  return (
    <div>
      {/* ═══ STEP 0: Herald Announcement ═══ */}
      {step === 0 && (
        <div className="herald-fade" style={{ textAlign: "center", padding: "20px 0" }}>
          {/* Title */}
          <div className="flex items-center justify-center gap-3" style={{ marginBottom: 16 }}>
            <Scale size={18} style={{ color: "#d4a44c" }} />
            <h3
              style={{
                fontFamily: "Cinzel Decorative, Cinzel, serif",
                fontSize: "0.95rem", color: "#d4a44c",
                letterSpacing: "2px", textTransform: "uppercase",
                margin: 0,
              }}
            >
              {dispute.title}
            </h3>
            <Scale size={18} style={{ color: "#d4a44c" }} />
          </div>

          {/* Herald text */}
          <div
            style={{
              maxWidth: 500, margin: "0 auto",
              padding: 16, borderRadius: 6,
              border: "1px solid #3d3630",
              backgroundColor: "rgba(42,37,32,0.5)",
            }}
          >
            <p
              style={{
                fontFamily: "Crimson Text, serif",
                fontStyle: "italic", fontSize: "0.9rem",
                color: "#c8b090", lineHeight: 1.5,
                margin: "0 0 4px",
              }}
            >
              The herald announces:
            </p>
            <p
              style={{
                fontFamily: "Crimson Text, serif",
                fontSize: "0.9rem", color: "#e8dcc8",
                lineHeight: 1.5, margin: 0,
              }}
            >
              {dispute.herald}
            </p>
          </div>

          {/* Category badge */}
          <div style={{ marginTop: 12 }}>
            <span
              style={{
                fontFamily: "Cinzel, serif", fontSize: "0.55rem",
                color: "#6a5a42", letterSpacing: "2px",
                textTransform: "uppercase",
                border: "1px solid #3d3630", borderRadius: 3,
                padding: "2px 8px",
              }}
            >
              {dispute.category} &middot; {dispute.difficulty}
            </span>
          </div>

          {/* Continue button */}
          <button
            onClick={() => setStep(isDecision ? 2 : 1)}
            style={{
              fontFamily: "Cinzel, serif", fontSize: "0.8rem",
              color: "#d4a44c", background: "none",
              border: "1px solid #d4a44c",
              padding: "8px 24px", borderRadius: 4,
              cursor: "pointer", marginTop: 20,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(212,164,76,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Hear the Case
          </button>
        </div>
      )}

      {/* ═══ STEP 1: Petitioners Presenting ═══ */}
      {step === 1 && (
        <div>
          {/* Title bar */}
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 12 }}>
            <Scale size={14} style={{ color: "#d4a44c" }} />
            <span
              style={{
                fontFamily: "Cinzel, serif", fontSize: "0.7rem",
                color: "#d4a44c", letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              The Matter of {dispute.title}
            </span>
            <Scale size={14} style={{ color: "#d4a44c" }} />
          </div>

          {/* Split-screen petitioners */}
          <div className={`flex flex-col ${hasSecondPetitioner ? "md:flex-row" : ""} gap-3`}>
            {/* Petitioner A */}
            {dispute.petitionerA && (
              <div
                className="flex-1"
                style={{
                  border: "1px solid #3d3630", borderRadius: 6,
                  backgroundColor: "rgba(42,37,32,0.5)",
                  padding: 12,
                }}
              >
                <div className="flex items-start gap-3" style={{ marginBottom: 8 }}>
                  <NpcPortrait
                    initial={dispute.petitionerA.name.charAt(0)}
                    socialClass={dispute.petitionerA.portrait}
                    mood={dispute.petitionerA.mood}
                    size={56}
                  />
                  <div>
                    <h4 style={{
                      fontFamily: "Cinzel, serif", fontSize: "0.75rem",
                      color: "#d4a44c", margin: "0 0 2px",
                    }}>
                      {dispute.petitionerA.name}
                    </h4>
                    <span style={{
                      fontFamily: "Cinzel, serif", fontSize: "0.5rem",
                      color: "#6a5a42", textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}>
                      {dispute.petitionerA.mood}
                    </span>
                  </div>
                </div>
                <p style={{
                  fontFamily: "Crimson Text, serif", fontSize: "0.85rem",
                  color: "#c8b090", lineHeight: 1.5, margin: 0,
                  fontStyle: "italic",
                }}>
                  &ldquo;
                  <TypewriterText
                    text={dispute.petitionerA.speech}
                    speed={25}
                    onComplete={handlePetAComplete}
                  />
                  &rdquo;
                </p>
                {/* Evidence */}
                {showEvidence && dispute.petitionerA.evidence && (
                  <div className="evidence-reveal" style={{
                    marginTop: 8, padding: 8, borderRadius: 4,
                    border: "1px solid #2a2520",
                    backgroundColor: "rgba(26,23,20,0.5)",
                  }}>
                    <span style={{
                      fontFamily: "Cinzel, serif", fontSize: "0.55rem",
                      color: "#6a5a42", textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}>
                      Evidence
                    </span>
                    <p style={{
                      fontFamily: "Crimson Text, serif", fontSize: "0.8rem",
                      color: "#a89070", margin: "4px 0 0",
                    }}>
                      {dispute.petitionerA.evidence}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* VS Divider */}
            {hasSecondPetitioner && (
              <div
                className="hidden md:flex items-center justify-center"
                style={{ width: 30, flexShrink: 0 }}
              >
                <span style={{
                  fontFamily: "Cinzel Decorative, Cinzel, serif",
                  fontSize: "1.2rem", color: "#6a5a42",
                }}>
                  &#9876;
                </span>
              </div>
            )}

            {/* Petitioner B */}
            {hasSecondPetitioner && dispute.petitionerB && (
              <div
                className="flex-1"
                style={{
                  border: "1px solid #3d3630", borderRadius: 6,
                  backgroundColor: "rgba(42,37,32,0.5)",
                  padding: 12,
                  opacity: petADone ? 1 : 0.3,
                  transition: "opacity 300ms ease",
                }}
              >
                <div className="flex items-start gap-3" style={{ marginBottom: 8 }}>
                  <NpcPortrait
                    initial={dispute.petitionerB.name.charAt(0)}
                    socialClass={dispute.petitionerB.portrait}
                    mood={dispute.petitionerB.mood}
                    size={56}
                  />
                  <div>
                    <h4 style={{
                      fontFamily: "Cinzel, serif", fontSize: "0.75rem",
                      color: "#d4a44c", margin: "0 0 2px",
                    }}>
                      {dispute.petitionerB.name}
                    </h4>
                    <span style={{
                      fontFamily: "Cinzel, serif", fontSize: "0.5rem",
                      color: "#6a5a42", textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}>
                      {dispute.petitionerB.mood}
                    </span>
                  </div>
                </div>
                {petADone && (
                  <p style={{
                    fontFamily: "Crimson Text, serif", fontSize: "0.85rem",
                    color: "#c8b090", lineHeight: 1.5, margin: 0,
                    fontStyle: "italic",
                  }}>
                    &ldquo;
                    <TypewriterText
                      text={dispute.petitionerB.speech}
                      speed={25}
                      onComplete={handlePetBComplete}
                    />
                    &rdquo;
                  </p>
                )}
                {showEvidence && dispute.petitionerB.evidence && (
                  <div className="evidence-reveal" style={{
                    marginTop: 8, padding: 8, borderRadius: 4,
                    border: "1px solid #2a2520",
                    backgroundColor: "rgba(26,23,20,0.5)",
                  }}>
                    <span style={{
                      fontFamily: "Cinzel, serif", fontSize: "0.55rem",
                      color: "#6a5a42", textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}>
                      Evidence
                    </span>
                    <p style={{
                      fontFamily: "Crimson Text, serif", fontSize: "0.8rem",
                      color: "#a89070", margin: "4px 0 0",
                    }}>
                      {dispute.petitionerB.evidence}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Steward advice */}
          {showSteward && (
            <div
              className="steward-slide"
              style={{
                marginTop: 12, padding: 12, borderRadius: 6,
                border: "1px solid #3d3630",
                backgroundColor: "rgba(58,48,32,0.4)",
              }}
            >
              <div className="flex items-start gap-3">
                <NpcPortrait initial="E" socialClass="steward" mood="neutral" size={40} />
                <div>
                  <span style={{
                    fontFamily: "Cinzel, serif", fontSize: "0.6rem",
                    color: "#a89070", textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}>
                    Steward Edmund whispers:
                  </span>
                  <p style={{
                    fontFamily: "Crimson Text, serif", fontStyle: "italic",
                    fontSize: "0.85rem", color: "#c8b090",
                    lineHeight: 1.4, margin: "4px 0 0",
                    opacity: 0.9,
                  }}>
                    &ldquo;{dispute.stewardAdvice}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Advance to ruling */}
          {showSteward && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  fontFamily: "Cinzel, serif", fontSize: "0.8rem",
                  color: "#d4a44c", background: "none",
                  border: "1px solid #d4a44c",
                  padding: "8px 24px", borderRadius: 4,
                  cursor: "pointer",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(212,164,76,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Make Your Ruling
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 2: Ruling Selection ═══ */}
      {step === 2 && (
        <div>
          {/* For decision type, show description */}
          {isDecision && dispute.description && (
            <div style={{
              marginBottom: 16, padding: 16, borderRadius: 6,
              border: "1px solid #3d3630",
              backgroundColor: "rgba(42,37,32,0.5)",
            }}>
              <p style={{
                fontFamily: "Crimson Text, serif", fontSize: "0.9rem",
                color: "#e8dcc8", lineHeight: 1.5, margin: "0 0 12px",
              }}>
                {dispute.description}
              </p>
              <div style={{
                padding: 10, borderRadius: 4,
                border: "1px solid #3d3630",
                backgroundColor: "rgba(58,48,32,0.4)",
              }}>
                <span style={{
                  fontFamily: "Cinzel, serif", fontSize: "0.6rem",
                  color: "#a89070", textTransform: "uppercase",
                  letterSpacing: "1px",
                }}>
                  Steward Edmund advises:
                </span>
                <p style={{
                  fontFamily: "Crimson Text, serif", fontStyle: "italic",
                  fontSize: "0.85rem", color: "#c8b090",
                  lineHeight: 1.4, margin: "4px 0 0",
                }}>
                  &ldquo;{dispute.stewardAdvice}&rdquo;
                </p>
              </div>
            </div>
          )}

          <h4 style={{
            fontFamily: "Cinzel Decorative, Cinzel, serif",
            fontSize: "0.85rem", color: "#d4a44c",
            letterSpacing: "2px", textTransform: "uppercase",
            textAlign: "center", margin: "0 0 12px",
          }}>
            Your Ruling
          </h4>

          <div className="flex flex-col gap-3">
            {dispute.rulings.map((ruling) => (
              <button
                key={ruling.id}
                className="ruling-card"
                onClick={() => handleSelectRuling(ruling)}
                onMouseEnter={() => setHoveredRuling(ruling.id)}
                onMouseLeave={() => setHoveredRuling(null)}
                style={{
                  textAlign: "left",
                  padding: 12, borderRadius: 6,
                  border: "1px solid #3d3630",
                  backgroundColor: hoveredRuling === ruling.id
                    ? "rgba(42,37,32,0.7)"
                    : "rgba(42,37,32,0.4)",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                <h5 style={{
                  fontFamily: "Cinzel, serif", fontSize: "0.8rem",
                  color: "#d4a44c", margin: "0 0 4px",
                }}>
                  {ruling.label}
                </h5>
                <p style={{
                  fontFamily: "Crimson Text, serif", fontSize: "0.8rem",
                  color: "#a89070", lineHeight: 1.3, margin: 0,
                }}>
                  {ruling.decree}
                </p>
                {/* Consequence preview on hover */}
                {hoveredRuling === ruling.id && (
                  <ConsequencePreview consequences={ruling.consequences} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Aftermath ═══ */}
      {step === 3 && selectedRuling && (
        <div>
          {/* Decree card */}
          <div
            className="decree-appear"
            style={{
              padding: 16, borderRadius: 6,
              border: "2px solid #a0342b",
              backgroundColor: "rgba(232,220,200,0.08)",
              marginBottom: 16,
            }}
          >
            <div className="flex items-start gap-4">
              <WaxSeal size={48} />
              <div className="flex-1">
                <h4 style={{
                  fontFamily: "Cinzel Decorative, Cinzel, serif",
                  fontSize: "0.8rem", color: "#d4a44c",
                  letterSpacing: "2px", textTransform: "uppercase",
                  margin: "0 0 8px",
                }}>
                  By Decree of the Lord
                </h4>
                <p style={{
                  fontFamily: "Crimson Text, serif", fontSize: "0.9rem",
                  color: "#e8dcc8", lineHeight: 1.5, margin: 0,
                }}>
                  {selectedRuling.decree}
                </p>
              </div>
            </div>
          </div>

          {/* Aftermath */}
          <div style={{
            padding: 12, borderRadius: 6,
            border: "1px solid #3d3630",
            backgroundColor: "rgba(42,37,32,0.5)",
            marginBottom: 16,
          }}>
            <span style={{
              fontFamily: "Cinzel, serif", fontSize: "0.6rem",
              color: "#6a5a42", textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              What follows:
            </span>
            <p style={{
              fontFamily: "Crimson Text, serif", fontSize: "0.9rem",
              color: "#c8b090", lineHeight: 1.5,
              margin: "6px 0 0",
            }}>
              {selectedRuling.aftermath}
            </p>
          </div>

          {/* Meter changes */}
          <div style={{
            padding: 12, borderRadius: 6,
            border: "1px solid #2a2520",
            backgroundColor: "rgba(26,23,20,0.5)",
            marginBottom: 16,
          }}>
            <span style={{
              fontFamily: "Cinzel, serif", fontSize: "0.6rem",
              color: "#6a5a42", textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              Consequences
            </span>
            <div className="flex flex-wrap gap-3" style={{ marginTop: 6 }}>
              {Object.entries(selectedRuling.consequences)
                .filter(([, v]) => v !== 0)
                .map(([key, val]) => {
                  const colors = {
                    people: "#2d5a2d", treasury: "#c4a24a",
                    church: "#6a4a8a", military: "#8b2020",
                  };
                  const isPos = val > 0;
                  return (
                    <span
                      key={key}
                      style={{
                        fontFamily: "Cinzel, serif", fontSize: "0.7rem",
                        color: isPos ? "#4a8a3a" : "#c44444",
                        padding: "2px 8px", borderRadius: 3,
                        border: `1px solid ${colors[key] || "#3d3630"}`,
                        backgroundColor: "rgba(26,23,20,0.5)",
                      }}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}{" "}
                      {isPos ? "+" : ""}{val}
                    </span>
                  );
                })}
            </div>
          </div>

          {/* Continue to done */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => setStep(4)}
              style={{
                fontFamily: "Cinzel, serif", fontSize: "0.8rem",
                color: "#d4a44c", background: "none",
                border: "1px solid #d4a44c",
                padding: "8px 24px", borderRadius: 4,
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(212,164,76,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 4: Done — Historical Note + Return ═══ */}
      {step === 4 && (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Scale size={28} style={{ color: "#6a5a42", marginBottom: 12 }} />
          <p style={{
            fontFamily: "Cinzel, serif", fontSize: "0.75rem",
            color: "#a89070", letterSpacing: "1px",
            margin: "0 0 16px",
          }}>
            The case of &ldquo;{dispute.title}&rdquo; has been resolved.
          </p>

          {/* Historical note toggle */}
          {dispute.historicalNote && (
            <div style={{ maxWidth: 500, margin: "0 auto 16px" }}>
              <button
                onClick={() => setShowHistNote(!showHistNote)}
                className="flex items-center gap-2"
                style={{
                  margin: "0 auto",
                  fontFamily: "Cinzel, serif", fontSize: "0.7rem",
                  color: "#6a5a42", background: "none",
                  border: "1px solid #3d3630",
                  padding: "6px 14px", borderRadius: 4,
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
                    marginTop: 8, padding: 12, borderRadius: 6,
                    border: "1px solid #3d3630",
                    backgroundColor: "rgba(42,37,32,0.5)",
                    textAlign: "left",
                  }}
                >
                  <p style={{
                    fontFamily: "Crimson Text, serif", fontSize: "0.85rem",
                    color: "#c8b090", lineHeight: 1.5, margin: 0,
                  }}>
                    {dispute.historicalNote}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Return button */}
          <button
            onClick={onReturn}
            style={{
              fontFamily: "Cinzel, serif", fontSize: "0.8rem",
              color: "#d4a44c", background: "none",
              border: "1px solid #d4a44c",
              padding: "8px 24px", borderRadius: 4,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(212,164,76,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Return to Throne
          </button>
        </div>
      )}
    </div>
  );
}
