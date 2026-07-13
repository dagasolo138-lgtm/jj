/**
 * DecreeDesk.jsx
 *
 * The Decree Desk — a sub-view of the Great Hall where the lord issues
 * and revokes official decrees that shape the manor's laws and customs.
 * Limited to 2 decrees per season. Active decrees persist until revoked.
 *
 * Views: list (default), detail (preview a decree), sealed (aftermath),
 * revoking (confirm revoke).
 */

import { useState, useCallback } from "react";
import {
  ScrollText, Scale, X, ChevronRight, ArrowLeft, Check,
} from "lucide-react";

// ─── Color palette ──────────────────────────────────────────────
const C = {
  hallStone:      "#2a2520",
  hallStoneLight: "#3d3630",
  torchGold:      "#d4a44c",
  parchment:      "#e8dcc8",
  sealWax:        "#a0342b",
  inkBrown:       "#3d2b1a",
  forestGreen:    "#2d5a2d",
  bloodRed:       "#8b2020",
  muted:          "#6a5a42",
  textLight:      "#c8b090",
  textDim:        "#a89070",
};

// ─── Consequence labels ─────────────────────────────────────────
const EFFECT_LABELS = {
  people:   { name: "People",   color: C.forestGreen },
  treasury: { name: "Treasury", color: "#c4a24a" },
  church:   { name: "Church",   color: "#6a4a8a" },
  military: { name: "Military", color: C.bloodRed },
};

// ─── Shared button style helper ─────────────────────────────────
function goldBtnEvents(e, entering) {
  if (entering) {
    e.currentTarget.style.backgroundColor = "rgba(212,164,76,0.15)";
  } else {
    e.currentTarget.style.backgroundColor = "transparent";
  }
}

// ─── Wax Seal (CSS-drawn) ───────────────────────────────────────
function WaxSeal({ size = 48, animated = false }) {
  return (
    <div
      className={animated ? "decree-seal-stamp" : ""}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 40%, #c44a3a, #8b2020, #5a1010)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)",
        flexShrink: 0,
      }}
    >
      <Scale size={size * 0.45} style={{ color: C.parchment, opacity: 0.8 }} />
    </div>
  );
}

// ─── Small inline seal icon ─────────────────────────────────────
function SealDot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 40%, #c44a3a, #8b2020)",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Consequence preview arrows ─────────────────────────────────
function ConsequencePreview({ effects, compact = false }) {
  const items = Object.entries(effects).filter(([, v]) => v !== 0);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" style={{ marginTop: compact ? 4 : 6 }}>
      {items.map(([key, val]) => {
        const info = EFFECT_LABELS[key];
        if (!info) return null;
        const isPositive = val > 0;
        const magnitude = Math.abs(val) >= 5 ? 2 : 1;
        const arrow = isPositive ? "\u25B2" : "\u25BC";
        const arrows = magnitude === 2 ? arrow + arrow : arrow;
        return (
          <span
            key={key}
            style={{
              fontSize: compact ? "0.6rem" : "0.65rem",
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

// ─── Consequence badges (for sealed aftermath) ──────────────────
function ConsequenceBadges({ effects }) {
  const items = Object.entries(effects).filter(([, v]) => v !== 0);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3" style={{ marginTop: 6 }}>
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
            {info.name.charAt(0).toUpperCase() + info.name.slice(1)}{" "}
            {isPos ? "+" : ""}{val}
          </span>
        );
      })}
    </div>
  );
}

// ─── Duration label ─────────────────────────────────────────────
function DurationLabel({ duration }) {
  const map = {
    permanent: { text: "Permanent", color: C.torchGold },
    "1 season": { text: "1 Season", color: C.textDim },
    "1 event":  { text: "1 Event",  color: C.textDim },
  };
  const info = map[duration] || { text: duration, color: C.muted };

  return (
    <span
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: "0.55rem",
        color: info.color,
        letterSpacing: "1px",
        textTransform: "uppercase",
      }}
    >
      {info.text}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export default function DecreeDesk({
  decrees,
  activeDecreeIds,
  decreeSlots,
  onIssue,
  onRevoke,
  onReturn,
}) {
  // Views: "list" | "detail" | "sealed" | "revoking"
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [revokeId, setRevokeId] = useState(null);

  const activeDecrees = decrees.filter((d) => activeDecreeIds.includes(d.id));
  const availableDecrees = decrees.filter((d) => !activeDecreeIds.includes(d.id));
  const selectedDecree = decrees.find((d) => d.id === selectedId) || null;
  const revokeDecree = decrees.find((d) => d.id === revokeId) || null;
  const canSeal = decreeSlots > 0;

  const handleSelectDecree = useCallback((decree) => {
    setSelectedId(decree.id);
    setView("detail");
  }, []);

  const handleSeal = useCallback(() => {
    if (!selectedDecree || !canSeal) return;
    onIssue(selectedDecree.id, selectedDecree.effects);
    setView("sealed");
  }, [selectedDecree, canSeal, onIssue]);

  const handleCancelDetail = useCallback(() => {
    setSelectedId(null);
    setView("list");
  }, []);

  const handleContinueFromSealed = useCallback(() => {
    setSelectedId(null);
    setView("list");
  }, []);

  const handleStartRevoke = useCallback((decreeId) => {
    setRevokeId(decreeId);
    setView("revoking");
  }, []);

  const handleConfirmRevoke = useCallback(() => {
    if (!revokeDecree) return;
    onRevoke(revokeDecree.id);
    setRevokeId(null);
    setView("list");
  }, [revokeDecree, onRevoke]);

  const handleCancelRevoke = useCallback(() => {
    setRevokeId(null);
    setView("list");
  }, []);

  // ─── LIST VIEW ──────────────────────────────────────────────
  if (view === "list") {
    return (
      <div>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: 16 }}>
          <div className="flex items-center justify-center gap-3" style={{ marginBottom: 8 }}>
            <ScrollText size={20} style={{ color: C.torchGold }} />
            <h3
              style={{
                fontFamily: "Cinzel Decorative, Cinzel, serif",
                fontSize: "1rem",
                color: C.torchGold,
                letterSpacing: "2px",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              The Decree Desk
            </h3>
            <ScrollText size={20} style={{ color: C.torchGold }} />
          </div>
          <p
            style={{
              fontFamily: "Crimson Text, serif",
              fontStyle: "italic",
              fontSize: "0.85rem",
              color: C.textDim,
              margin: "0 0 6px",
            }}
          >
            Seal your will into law.
          </p>
          <span
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.65rem",
              color: canSeal ? C.torchGold : "#c44444",
              letterSpacing: "1px",
            }}
          >
            Decrees remaining this season:{" "}
            <strong>{decreeSlots}</strong>
          </span>
        </div>

        {/* ── ACTIVE DECREES ── */}
        <div style={{ marginBottom: 20 }}>
          <h4
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.7rem",
              color: C.muted,
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            Active Decrees
          </h4>

          {activeDecrees.length === 0 ? (
            <div
              style={{
                padding: 16,
                borderRadius: 6,
                border: "1px solid #2a2520",
                backgroundColor: "rgba(26,23,20,0.4)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Crimson Text, serif",
                  fontStyle: "italic",
                  fontSize: "0.85rem",
                  color: C.muted,
                  margin: 0,
                }}
              >
                No decrees are in effect.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeDecrees.map((decree) => (
                <div
                  key={decree.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "1px solid #3d3630",
                    borderLeft: `4px solid ${C.torchGold}`,
                    backgroundColor: "rgba(42,37,32,0.5)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <SealDot />
                    <span
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "0.8rem",
                        color: C.parchment,
                        flex: 1,
                      }}
                    >
                      {decree.name}
                    </span>
                    {decree.revokable && (
                      <button
                        onClick={() => handleStartRevoke(decree.id)}
                        style={{
                          fontFamily: "Cinzel, serif",
                          fontSize: "0.6rem",
                          color: "#c44444",
                          background: "none",
                          border: "1px solid rgba(196,68,68,0.3)",
                          borderRadius: 3,
                          padding: "2px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          transition: "all 200ms ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#c44444";
                          e.currentTarget.style.backgroundColor = "rgba(196,68,68,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(196,68,68,0.3)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <X size={10} /> Revoke
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                    <DurationLabel duration={decree.duration} />
                    <span
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "0.5rem",
                        color: C.muted,
                        letterSpacing: "1px",
                      }}
                    >
                      &middot; {decree.revokable ? "Revokable" : "Cannot Revoke"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── AVAILABLE DECREES ── */}
        <div style={{ marginBottom: 20 }}>
          <h4
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.7rem",
              color: C.muted,
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            Available Decrees
          </h4>

          {!canSeal && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 4,
                border: "1px solid rgba(196,68,68,0.3)",
                backgroundColor: "rgba(139,32,32,0.1)",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Crimson Text, serif",
                  fontSize: "0.8rem",
                  color: "#c44444",
                }}
              >
                You have issued all decrees for this season.
              </span>
            </div>
          )}

          {availableDecrees.length === 0 ? (
            <div
              style={{
                padding: 16,
                borderRadius: 6,
                border: "1px solid #2a2520",
                backgroundColor: "rgba(26,23,20,0.4)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Crimson Text, serif",
                  fontStyle: "italic",
                  fontSize: "0.85rem",
                  color: C.muted,
                  margin: 0,
                }}
              >
                All decrees have been enacted.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableDecrees.map((decree) => (
                <button
                  key={decree.id}
                  onClick={() => handleSelectDecree(decree)}
                  disabled={!canSeal}
                  className="decree-available-card"
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 6,
                    border: "1px solid #3d3630",
                    backgroundColor: "rgba(26,23,20,0.5)",
                    cursor: canSeal ? "pointer" : "default",
                    opacity: canSeal ? 1 : 0.45,
                    transition: "all 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (canSeal) {
                      e.currentTarget.style.borderColor = C.torchGold;
                      e.currentTarget.style.backgroundColor = "rgba(42,37,32,0.6)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 0 16px rgba(212,164,76,0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#3d3630";
                    e.currentTarget.style.backgroundColor = "rgba(26,23,20,0.5)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="flex items-start gap-2">
                    <ScrollText
                      size={14}
                      style={{ color: C.muted, marginTop: 2, flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0">
                      <h5
                        style={{
                          fontFamily: "Cinzel, serif",
                          fontSize: "0.75rem",
                          color: C.parchment,
                          margin: "0 0 4px",
                        }}
                      >
                        {decree.name}
                      </h5>
                      <p
                        style={{
                          fontFamily: "Crimson Text, serif",
                          fontSize: "0.8rem",
                          color: C.textLight,
                          lineHeight: 1.3,
                          margin: "0 0 2px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {decree.description}
                      </p>
                      <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                        <DurationLabel duration={decree.duration} />
                      </div>
                      <ConsequencePreview effects={decree.effects} compact />
                    </div>
                    <ChevronRight
                      size={14}
                      style={{ color: C.muted, marginTop: 2, flexShrink: 0 }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Return button */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={onReturn}
            className="flex items-center gap-2"
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.8rem",
              color: C.torchGold,
              background: "none",
              border: "1px solid #3d3630",
              padding: "8px 20px",
              borderRadius: 4,
              cursor: "pointer",
              margin: "0 auto",
              display: "flex",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.torchGold;
              e.currentTarget.style.backgroundColor = "rgba(212,164,76,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3d3630";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <ArrowLeft size={14} />
            Return to Throne
          </button>
        </div>
      </div>
    );
  }

  // ─── DETAIL VIEW (preview + seal) ────────────────────────────
  if (view === "detail" && selectedDecree) {
    return (
      <div className="decree-appear">
        {/* Back link */}
        <button
          onClick={handleCancelDetail}
          className="flex items-center gap-1"
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.65rem",
            color: C.muted,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 0 12px",
            transition: "color 200ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.torchGold; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
        >
          <ArrowLeft size={12} />
          Back to Decrees
        </button>

        {/* Decree detail card */}
        <div
          style={{
            padding: 20,
            borderRadius: 6,
            border: `1px solid ${C.hallStoneLight}`,
            backgroundColor: "rgba(42,37,32,0.6)",
            marginBottom: 16,
          }}
        >
          {/* Title */}
          <h3
            style={{
              fontFamily: "Cinzel Decorative, Cinzel, serif",
              fontSize: "0.95rem",
              color: C.torchGold,
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}
          >
            {selectedDecree.name}
          </h3>

          {/* Description */}
          <p
            style={{
              fontFamily: "Crimson Text, serif",
              fontSize: "0.9rem",
              color: C.parchment,
              lineHeight: 1.5,
              margin: "0 0 16px",
            }}
          >
            &ldquo;{selectedDecree.description}&rdquo;
          </p>

          {/* Projected Impact */}
          <div
            style={{
              padding: 12,
              borderRadius: 4,
              border: "1px solid #2a2520",
              backgroundColor: "rgba(26,23,20,0.5)",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.6rem",
                color: C.muted,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Projected Impact
            </span>
            <ConsequencePreview effects={selectedDecree.effects} />
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.6rem",
                color: C.muted,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Duration:
            </span>
            <DurationLabel duration={selectedDecree.duration} />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleSeal}
            disabled={!canSeal}
            className="flex items-center gap-2"
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.8rem",
              color: canSeal ? C.parchment : C.muted,
              background: canSeal
                ? "linear-gradient(135deg, #8b2020 0%, #a0342b 50%, #8b2020 100%)"
                : "rgba(42,37,32,0.5)",
              border: canSeal
                ? "1px solid #c44a3a"
                : "1px solid #3d3630",
              padding: "10px 24px",
              borderRadius: 4,
              cursor: canSeal ? "pointer" : "default",
              display: "flex",
              opacity: canSeal ? 1 : 0.5,
              transition: "all 200ms ease",
              boxShadow: canSeal
                ? "0 2px 8px rgba(160,52,43,0.3)"
                : "none",
            }}
            onMouseEnter={(e) => {
              if (canSeal) {
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(160,52,43,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (canSeal) {
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(160,52,43,0.3)";
              }
            }}
          >
            <WaxSeal size={18} />
            Seal This Decree
          </button>

          <button
            onClick={handleCancelDetail}
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.8rem",
              color: C.textDim,
              background: "none",
              border: "1px solid #3d3630",
              padding: "10px 20px",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => goldBtnEvents(e, true)}
            onMouseLeave={(e) => goldBtnEvents(e, false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── SEALED VIEW (aftermath) ──────────────────────────────────
  if (view === "sealed" && selectedDecree) {
    return (
      <div className="decree-appear" style={{ textAlign: "center", padding: "12px 0" }}>
        {/* Title */}
        <h3
          style={{
            fontFamily: "Cinzel Decorative, Cinzel, serif",
            fontSize: "0.95rem",
            color: C.torchGold,
            letterSpacing: "3px",
            textTransform: "uppercase",
            margin: "0 0 16px",
          }}
        >
          By Decree of the Lord
        </h3>

        {/* Seal + decree name */}
        <div
          className="flex items-center gap-4"
          style={{
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <WaxSeal size={56} animated />
          <div style={{ textAlign: "left" }}>
            <h4
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.9rem",
                color: C.parchment,
                margin: "0 0 2px",
              }}
            >
              {selectedDecree.name}
            </h4>
            <DurationLabel duration={selectedDecree.duration} />
          </div>
        </div>

        {/* Flavor text */}
        {selectedDecree.flavor && (
          <div
            style={{
              maxWidth: 450,
              margin: "0 auto 16px",
              padding: 14,
              borderRadius: 6,
              border: `1px solid ${C.hallStoneLight}`,
              backgroundColor: "rgba(42,37,32,0.5)",
            }}
          >
            <p
              style={{
                fontFamily: "Crimson Text, serif",
                fontStyle: "italic",
                fontSize: "0.85rem",
                color: C.textLight,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {selectedDecree.flavor}
            </p>
          </div>
        )}

        {/* Consequences */}
        <div
          style={{
            maxWidth: 450,
            margin: "0 auto 20px",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #2a2520",
            backgroundColor: "rgba(26,23,20,0.5)",
          }}
        >
          <span
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.6rem",
              color: C.muted,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Consequences
          </span>
          <div className="flex flex-wrap gap-3 justify-center" style={{ marginTop: 8 }}>
            <ConsequenceBadges effects={selectedDecree.effects} />
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinueFromSealed}
          className="flex items-center gap-2"
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.8rem",
            color: C.torchGold,
            background: "none",
            border: "1px solid " + C.torchGold,
            padding: "8px 24px",
            borderRadius: 4,
            cursor: "pointer",
            margin: "0 auto",
            display: "flex",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => goldBtnEvents(e, true)}
          onMouseLeave={(e) => goldBtnEvents(e, false)}
        >
          <Check size={14} />
          Continue
        </button>
      </div>
    );
  }

  // ─── REVOKING VIEW (confirm) ──────────────────────────────────
  if (view === "revoking" && revokeDecree) {
    return (
      <div className="decree-appear" style={{ textAlign: "center", padding: "20px 0" }}>
        <X size={32} style={{ color: "#c44444", marginBottom: 12 }} />

        <h3
          style={{
            fontFamily: "Cinzel Decorative, Cinzel, serif",
            fontSize: "0.9rem",
            color: "#c44444",
            letterSpacing: "2px",
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          Revoke Decree
        </h3>

        <p
          style={{
            fontFamily: "Crimson Text, serif",
            fontSize: "0.9rem",
            color: C.textLight,
            maxWidth: 400,
            margin: "0 auto 8px",
            lineHeight: 1.5,
          }}
        >
          Are you certain you wish to tear down the decree of{" "}
          <strong style={{ color: C.parchment }}>{revokeDecree.name}</strong>?
        </p>
        <p
          style={{
            fontFamily: "Crimson Text, serif",
            fontStyle: "italic",
            fontSize: "0.8rem",
            color: C.muted,
            maxWidth: 400,
            margin: "0 auto 20px",
          }}
        >
          Its effects will end immediately. The people will know the
          lord has changed his mind.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleConfirmRevoke}
            className="flex items-center gap-2"
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.8rem",
              color: C.parchment,
              background: "linear-gradient(135deg, #6a1a1a 0%, #8b2020 50%, #6a1a1a 100%)",
              border: "1px solid #c44444",
              padding: "8px 20px",
              borderRadius: 4,
              cursor: "pointer",
              display: "flex",
              transition: "all 200ms ease",
              boxShadow: "0 2px 8px rgba(139,32,32,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(139,32,32,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(139,32,32,0.3)";
            }}
          >
            <X size={14} />
            Tear It Down
          </button>

          <button
            onClick={handleCancelRevoke}
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.8rem",
              color: C.textDim,
              background: "none",
              border: "1px solid #3d3630",
              padding: "8px 20px",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => goldBtnEvents(e, true)}
            onMouseLeave={(e) => goldBtnEvents(e, false)}
          >
            Keep the Decree
          </button>
        </div>
      </div>
    );
  }

  // Fallback — should not be reached
  return null;
}
