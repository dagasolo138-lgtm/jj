/**
 * MapTab.jsx
 *
 * Bird's-eye CSS-rendered map of the player's estate.
 * Buildings appear as they're constructed, peasants walk paths,
 * and terrain changes with the seasons.
 */

import { useMemo } from "react";
import BUILDINGS from "../data/buildings.js";

// ---------------------------------------------------------------------------
// Season palette — terrain colors shift each season
// ---------------------------------------------------------------------------

const SEASON_PALETTE = {
  spring: { ground: "#8db96e", grass: "#a8d468", tree: "#4a9a30", water: "#5090c0", waterLight: "#70b0d8", road: "#b89a6a", fieldCrop: "#c8d860" },
  summer: { ground: "#6d9d40", grass: "#88c040", tree: "#2d7a1a", water: "#4080b0", waterLight: "#60a0c8", road: "#a88050", fieldCrop: "#d4b030" },
  autumn: { ground: "#c4a44e", grass: "#d0b458", tree: "#c46a1a", water: "#5090c0", waterLight: "#6aa0c8", road: "#a08050", fieldCrop: "#c49030" },
  winter: { ground: "#c8c8c0", grass: "#d4d4cc", tree: "#7a8a7a", water: "#7aaab8", waterLight: "#8abac8", road: "#b0a090", fieldCrop: "#c0c0b8" },
};

// ---------------------------------------------------------------------------
// Building positions on the map (x%, y%)
// Logical zones: farms NE, pasture E, nature W, mining SE, processing S
// ---------------------------------------------------------------------------

const BUILDING_SPOTS = {
  strip_farm:    [{ x: 60, y: 10 }, { x: 74, y: 10 }],
  demesne_field: [{ x: 60, y: 24 }, { x: 74, y: 24 }],
  pasture:       [{ x: 85, y: 18 }, { x: 85, y: 33 }],
  fishpond:      [{ x: 10, y: 26 }, { x: 10, y: 42 }],
  timber_lot:    [{ x: 10, y: 7 },  { x: 22, y: 7 }],
  clay_pit:      [{ x: 62, y: 82 }, { x: 76, y: 82 }],
  iron_mine:     [{ x: 85, y: 62 }, { x: 85, y: 76 }],
  quarry:        [{ x: 85, y: 46 }, { x: 85, y: 56 }],
  herb_garden:   [{ x: 10, y: 58 }, { x: 22, y: 58 }],
  apiary:        [{ x: 10, y: 74 }, { x: 22, y: 74 }],
  fulling_mill:  [{ x: 36, y: 80 }],
  brewery:       [{ x: 48, y: 72 }],
};

// ---------------------------------------------------------------------------
// Peasant walking paths — waypoints as [x%, y%]
// ---------------------------------------------------------------------------

const WALK_PATHS = [
  // Castle to farm fields
  [{ x: 48, y: 44 }, { x: 52, y: 30 }, { x: 62, y: 16 }, { x: 52, y: 30 }, { x: 48, y: 44 }],
  // Castle to river/fishpond
  [{ x: 42, y: 44 }, { x: 28, y: 38 }, { x: 14, y: 34 }, { x: 28, y: 38 }, { x: 42, y: 44 }],
  // Castle south to market
  [{ x: 48, y: 50 }, { x: 48, y: 62 }, { x: 50, y: 74 }, { x: 48, y: 62 }, { x: 48, y: 50 }],
  // Farms to pasture loop
  [{ x: 66, y: 16 }, { x: 78, y: 20 }, { x: 86, y: 26 }, { x: 78, y: 20 }, { x: 66, y: 16 }],
  // East road to mines
  [{ x: 60, y: 48 }, { x: 72, y: 48 }, { x: 86, y: 50 }, { x: 72, y: 48 }, { x: 60, y: 48 }],
  // Garden stroll
  [{ x: 14, y: 60 }, { x: 20, y: 66 }, { x: 16, y: 74 }, { x: 20, y: 66 }, { x: 14, y: 60 }],
  // Forest to castle
  [{ x: 14, y: 10 }, { x: 24, y: 22 }, { x: 36, y: 36 }, { x: 44, y: 44 }, { x: 36, y: 36 }, { x: 24, y: 22 }, { x: 14, y: 10 }],
  // Mining run
  [{ x: 86, y: 48 }, { x: 86, y: 58 }, { x: 86, y: 68 }, { x: 86, y: 78 }, { x: 86, y: 68 }, { x: 86, y: 58 }, { x: 86, y: 48 }],
  // Village wander (south central)
  [{ x: 40, y: 56 }, { x: 34, y: 64 }, { x: 42, y: 72 }, { x: 52, y: 66 }, { x: 46, y: 56 }, { x: 40, y: 56 }],
  // North fields loop
  [{ x: 56, y: 12 }, { x: 64, y: 8 }, { x: 74, y: 12 }, { x: 68, y: 20 }, { x: 58, y: 18 }, { x: 56, y: 12 }],
  // West riverside walk
  [{ x: 12, y: 20 }, { x: 14, y: 30 }, { x: 12, y: 42 }, { x: 14, y: 52 }, { x: 12, y: 42 }, { x: 14, y: 30 }, { x: 12, y: 20 }],
  // Diagonal castle to SE mines
  [{ x: 52, y: 48 }, { x: 62, y: 56 }, { x: 74, y: 64 }, { x: 84, y: 70 }, { x: 74, y: 64 }, { x: 62, y: 56 }, { x: 52, y: 48 }],
  // Market square wander
  [{ x: 36, y: 76 }, { x: 44, y: 80 }, { x: 54, y: 76 }, { x: 62, y: 80 }, { x: 54, y: 84 }, { x: 44, y: 80 }, { x: 36, y: 76 }],
  // Castle perimeter
  [{ x: 40, y: 38 }, { x: 50, y: 36 }, { x: 58, y: 40 }, { x: 56, y: 50 }, { x: 46, y: 52 }, { x: 38, y: 48 }, { x: 40, y: 38 }],
  // NW forest gatherer
  [{ x: 8, y: 8 }, { x: 16, y: 12 }, { x: 24, y: 8 }, { x: 30, y: 14 }, { x: 24, y: 8 }, { x: 16, y: 12 }, { x: 8, y: 8 }],
  // Long east road
  [{ x: 78, y: 30 }, { x: 82, y: 40 }, { x: 86, y: 52 }, { x: 82, y: 62 }, { x: 86, y: 52 }, { x: 82, y: 40 }, { x: 78, y: 30 }],
];

// ---------------------------------------------------------------------------
// Decorative tree positions
// ---------------------------------------------------------------------------

const TREE_SPOTS = [
  // NW forest cluster (dense)
  { x: 4, y: 6, s: 8 }, { x: 10, y: 4, s: 9 }, { x: 17, y: 5, s: 7 },
  { x: 7, y: 12, s: 8 }, { x: 14, y: 10, s: 7 }, { x: 21, y: 8, s: 6 },
  { x: 6, y: 18, s: 7 }, { x: 18, y: 17, s: 6 }, { x: 12, y: 15, s: 7 },
  { x: 26, y: 6, s: 6 }, { x: 32, y: 10, s: 7 },
  // East edge
  { x: 93, y: 12, s: 6 }, { x: 96, y: 24, s: 7 }, { x: 94, y: 42, s: 6 },
  // South edge
  { x: 26, y: 90, s: 7 }, { x: 32, y: 93, s: 6 }, { x: 18, y: 91, s: 8 },
  { x: 70, y: 93, s: 6 }, { x: 92, y: 89, s: 7 },
  // Scattered accents
  { x: 30, y: 56, s: 6 }, { x: 72, y: 40, s: 6 }, { x: 28, y: 30, s: 5 },
];

// ---------------------------------------------------------------------------
// CSS keyframe generation for peasant paths
// ---------------------------------------------------------------------------

function buildKeyframes(name, waypoints) {
  const steps = waypoints.length - 1;
  const frames = waypoints.map((pt, i) => {
    const pct = Math.round((i / steps) * 100);
    return `${pct}% { left: ${pt.x}%; top: ${pt.y}%; }`;
  });
  return `@keyframes ${name} { ${frames.join(" ")} }`;
}

// Static stylesheet: peasant paths + utility animations
const STYLE_SHEET = [
  ...WALK_PATHS.map((p, i) => buildKeyframes(`walk-${i}`, p)),
  `@keyframes smoke-rise {
    0% { opacity: 0.5; transform: translate(-50%, 0) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -14px) scale(0.2); }
  }`,
  `@keyframes flag-wave {
    0%, 100% { transform: skewX(0deg); }
    50% { transform: skewX(-8deg); }
  }`,
  `@keyframes forge-ember-float {
    0% { opacity: 0.9; transform: translateY(0) scale(1); }
    50% { opacity: 0.6; transform: translateY(-6px) scale(0.6); }
    100% { opacity: 0; transform: translateY(-12px) scale(0.2); }
  }`,
  `@keyframes saw-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }`,
  `@keyframes hide-sway {
    0%, 100% { transform: rotate(-2deg); }
    50% { transform: rotate(2deg); }
  }`,
].join("\n");

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CSSTree({ x, y, size, color }) {
  const trunk = Math.max(2, Math.round(size * 0.25));
  const trunkH = Math.round(size * 0.5);
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 2,
        filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.25))",
      }}
    >
      {/* Upper canopy layer (smaller) */}
      <div style={{
        width: 0, height: 0,
        borderLeft: `${size * 0.7}px solid transparent`,
        borderRight: `${size * 0.7}px solid transparent`,
        borderBottom: `${size * 1.1}px solid ${color}`,
        marginBottom: `${-size * 0.5}px`,
        position: "relative",
        zIndex: 1,
      }} />
      {/* Lower canopy layer (wider) */}
      <div style={{
        width: 0, height: 0,
        borderLeft: `${size}px solid transparent`,
        borderRight: `${size}px solid transparent`,
        borderBottom: `${size * 1.3}px solid ${color}`,
        opacity: 0.85,
      }} />
      {/* Trunk */}
      <div style={{
        width: `${trunk}px`,
        height: `${trunkH}px`,
        backgroundColor: "#5a3a20",
        marginTop: "-1px",
        borderRadius: "0 0 1px 1px",
      }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG shoreline path — bezier curves create an organic, irregular edge.
// The shape hugs the left map edge, curving in/out like a real lake shore.
// Coordinates are in a 1000x600 viewBox (matching 5:3 aspect ratio).
// ---------------------------------------------------------------------------
const SHORE_CURVE =
  "M -20,60 C 28,78 48,115 42,160" +
  " C 34,200 56,230 52,270" +
  " C 46,310 62,338 54,375" +
  " C 44,410 24,438 30,475" +
  " C 36,505 20,535 -20,555";

const WATER_FILL = SHORE_CURVE + " Z";

function WaterBody({ pal }) {
  return (
    <svg
      viewBox="0 0 1000 600"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      <g>
        {/* Layer 1: outermost grass blend — marshy transition zone */}
        <path
          d={SHORE_CURVE}
          stroke={pal.grass}
          strokeWidth="14"
          fill="none"
          opacity="0.28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Layer 2: mid shoreline — lighter water seeping into shore */}
        <path
          d={SHORE_CURVE}
          stroke="#6aafcc"
          strokeWidth="7"
          fill="none"
          opacity="0.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Layer 3: main water body fill */}
        <path d={WATER_FILL} fill={pal.water} opacity="0.85" />

        {/* Layer 4: lighter inner depth — shallows near center */}
        <path
          d={
            "M -20,80 C 18,96 34,130 30,168" +
            " C 24,205 42,235 38,272" +
            " C 32,310 48,340 40,378" +
            " C 32,412 16,440 20,474" +
            " C 24,504 12,532 -20,548 Z"
          }
          fill={pal.waterLight}
          opacity="0.35"
        />

        {/* Surface highlight — light glint */}
        <ellipse cx="18" cy="240" rx="14" ry="30" fill="white" opacity="0.07" transform="rotate(-12 18 240)" />

        {/* Animated surface ripples */}
        <path d="M 14,175 Q 24,168 32,178" stroke="#7ac4dd" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.12;0.42;0.12" dur="4s" repeatCount="indefinite" />
        </path>
        <path d="M 10,295 Q 22,287 30,298" stroke="#7ac4dd" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.08;0.35;0.08" dur="5s" repeatCount="indefinite" begin="1.5s" />
        </path>
        <path d="M 16,410 Q 24,404 20,418" stroke="#7ac4dd" strokeWidth="1" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.08;0.28;0.08" dur="3.5s" repeatCount="indefinite" begin="0.7s" />
        </path>

        {/* ---- Reed clusters along shoreline ---- */}
        {/* Cluster 1 — upper shore */}
        <line x1="42" y1="132" x2="45" y2="117" stroke="#5a7a2a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="46" y1="135" x2="48" y2="119" stroke="#6a8a3a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="39" y1="137" x2="40" y2="124" stroke="#5a7a2a" strokeWidth="1" strokeLinecap="round" />

        {/* Cluster 2 — above widest section */}
        <line x1="52" y1="228" x2="56" y2="213" stroke="#6a8a3a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="56" y1="231" x2="58" y2="215" stroke="#5a7a2a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="49" y1="233" x2="51" y2="220" stroke="#6a8a3a" strokeWidth="1" strokeLinecap="round" />

        {/* Cluster 3 — widest bulge */}
        <line x1="59" y1="332" x2="63" y2="316" stroke="#5a7a2a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="63" y1="335" x2="66" y2="320" stroke="#6a8a3a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="56" y1="337" x2="57" y2="322" stroke="#5a7a2a" strokeWidth="1" strokeLinecap="round" />
        <line x1="61" y1="329" x2="64" y2="314" stroke="#6a8a3a" strokeWidth="1" strokeLinecap="round" />

        {/* Cluster 4 — lower narrows */}
        <line x1="34" y1="448" x2="36" y2="433" stroke="#6a8a3a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="30" y1="450" x2="32" y2="436" stroke="#5a7a2a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="37" y1="452" x2="38" y2="438" stroke="#5a7a2a" strokeWidth="1" strokeLinecap="round" />

        {/* Cluster 5 — near bottom */}
        <line x1="24" y1="500" x2="26" y2="486" stroke="#5a7a2a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="502" x2="22" y2="489" stroke="#6a8a3a" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function CastleView({ level }) {
  const w = 44 + level * 10;
  const h = 34 + level * 8;
  const stoneColor = level >= 2 ? "#8a8078" : "#a08060";
  const stoneBorder = level >= 2 ? "#5a5048" : "#705838";

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "46%",
        transform: "translate(-50%, -50%)",
        width: `${w}px`,
        height: `${h}px`,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Keep tower (level 3+) */}
      {level >= 3 && (
        <div style={{
          width: "14px",
          height: "22px",
          backgroundColor: "#6a6058",
          border: `2px solid #4a4540`,
          borderBottom: "none",
          position: "relative",
          zIndex: 12,
        }}>
          {/* Flagpole + flag */}
          <div style={{
            position: "absolute",
            top: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "2px",
            height: "14px",
            backgroundColor: "#3d2517",
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: "2px",
              width: "10px",
              height: "6px",
              backgroundColor: "#c0392b",
              animation: "flag-wave 2s ease-in-out infinite",
              transformOrigin: "left center",
            }} />
          </div>
          {/* Keep window */}
          <div style={{
            position: "absolute",
            bottom: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "4px",
            height: "6px",
            backgroundColor: "#2c1810",
            borderRadius: "2px 2px 0 0",
          }} />
        </div>
      )}

      {/* Corner towers (level 2+) */}
      {level >= 2 && (
        <div style={{ position: "relative", width: `${w + 10}px`, height: 0 }}>
          {[{ left: "-1px" }, { right: "-1px" }].map((pos, i) => (
            <div key={i} style={{
              position: "absolute",
              ...pos,
              top: "-12px",
              width: "12px",
              height: "16px",
              backgroundColor: "#7a7068",
              border: `2px solid #5a5048`,
              borderRadius: "2px",
              zIndex: 11,
            }}>
              {/* Tower crenellation */}
              <div style={{
                position: "absolute",
                top: "-3px",
                left: "1px",
                right: "1px",
                display: "flex",
                justifyContent: "space-between",
              }}>
                <div style={{ width: "3px", height: "3px", backgroundColor: "#7a7068" }} />
                <div style={{ width: "3px", height: "3px", backgroundColor: "#7a7068" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main wall */}
      <div style={{
        width: "100%",
        flex: 1,
        backgroundColor: stoneColor,
        border: `2px solid ${stoneBorder}`,
        borderRadius: "2px",
        position: "relative",
        minHeight: `${h * 0.6}px`,
      }}>
        {/* Crenellations along top */}
        <div style={{
          position: "absolute",
          top: "-5px",
          left: "4px",
          right: "4px",
          height: "5px",
          display: "flex",
          justifyContent: "space-evenly",
        }}>
          {Array.from({ length: 3 + level }).map((_, i) => (
            <div key={i} style={{
              width: "5px",
              height: "5px",
              backgroundColor: stoneColor,
              border: `1px solid ${stoneBorder}`,
            }} />
          ))}
        </div>

        {/* Gate */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: `${10 + level * 2}px`,
          height: `${12 + level * 2}px`,
          backgroundColor: "#3d2517",
          borderRadius: `${5 + level}px ${5 + level}px 0 0`,
          border: "1px solid #2c1810",
          borderBottom: "none",
        }} />

        {/* Side windows */}
        {level >= 2 && (
          <>
            <div style={{
              position: "absolute", top: "30%", left: "12%",
              width: "4px", height: "6px",
              backgroundColor: "#2c1810", borderRadius: "1px 1px 0 0",
            }} />
            <div style={{
              position: "absolute", top: "30%", right: "12%",
              width: "4px", height: "6px",
              backgroundColor: "#2c1810", borderRadius: "1px 1px 0 0",
            }} />
          </>
        )}
      </div>

      {/* Label */}
      <span style={{
        fontSize: "11px",
        fontFamily: "Cinzel, serif",
        fontWeight: "bold",
        color: "#e8c44a",
        backgroundColor: "rgba(15, 13, 10, 0.85)",
        padding: "1px 6px",
        borderRadius: "3px",
        border: "1px solid rgba(196, 162, 74, 0.4)",
        marginTop: "3px",
        whiteSpace: "nowrap",
        letterSpacing: "0.5px",
      }}>
        {level >= 2 ? `Castle Lv.${level}` : "Castle"}
      </span>
    </div>
  );
}

/** Shared label for all building sprites */
function BuildingLabel({ name }) {
  return (
    <span style={{
      fontSize: "9px",
      fontFamily: "Cinzel, serif",
      fontWeight: "700",
      color: "#2c1810",
      backgroundColor: "rgba(244, 228, 193, 0.75)",
      padding: "0px 3px",
      borderRadius: "2px",
      whiteSpace: "nowrap",
      marginTop: "2px",
      letterSpacing: "0.3px",
    }}>
      {name}
    </span>
  );
}

/** Coal Pit — dark mound with glowing embers and smoke hole */
function CoalPitSprite({ x, y }) {
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      transform: "translate(-50%, -50%)",
      display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5,
    }}>
      <div style={{ position: "relative", width: 38, height: 24 }}>
        {/* Mound shape — rounded dark hill */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 18,
          background: "linear-gradient(180deg, #3a3020 0%, #2a2018 60%, #1a1510 100%)",
          borderRadius: "50% 50% 4px 4px",
          border: "1.5px solid #4a3a28",
          boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.4), 0 2px 3px rgba(0,0,0,0.2)",
        }} />
        {/* Smoke hole at top */}
        <div style={{
          position: "absolute", top: 2, left: "50%", transform: "translateX(-50%)",
          width: 8, height: 5, borderRadius: "50%",
          background: "radial-gradient(ellipse, #1a1208 40%, #3a2a18 100%)",
          border: "1px solid #2a2018",
        }} />
        {/* Ember glow inside hole */}
        <div style={{
          position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)",
          width: 4, height: 3, borderRadius: "50%",
          background: "radial-gradient(ellipse, #ff6b1a 0%, #cc5500 60%, transparent 100%)",
          opacity: 0.7,
          boxShadow: "0 0 4px rgba(255,107,26,0.5)",
        }} />
        {/* Floating embers */}
        {[0, 0.8, 1.6].map((d, i) => (
          <div key={i} style={{
            position: "absolute", top: 0, left: `${44 + i * 6}%`,
            width: 2, height: 2, borderRadius: "50%",
            backgroundColor: "#ff6b1a",
            animation: `forge-ember-float 2s ease-out infinite`,
            animationDelay: `${d}s`,
            opacity: 0.8,
          }} />
        ))}
      </div>
      <BuildingLabel name="Coal Pit" />
    </div>
  );
}

/** Tannery — low workshop with drying hides on a rack */
function TannerySprite({ x, y }) {
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      transform: "translate(-50%, -50%)",
      display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5,
    }}>
      <div style={{ position: "relative", width: 40, height: 28 }}>
        {/* Main building — low and wide */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, width: 28, height: 18,
          background: "linear-gradient(180deg, #6a5030 0%, #5a4028 100%)",
          border: "1.5px solid #4a3420",
          borderRadius: "1px",
          boxShadow: "1px 2px 3px rgba(0,0,0,0.2)",
        }}>
          {/* Flat sloped roof */}
          <div style={{
            position: "absolute", top: -5, left: -2, right: -2, height: 6,
            background: "linear-gradient(180deg, #8a6a40, #6a5030)",
            borderRadius: "1px 1px 0 0",
            borderBottom: "1px solid #4a3420",
          }} />
          {/* Door */}
          <div style={{
            position: "absolute", bottom: 0, left: 8, width: 7, height: 10,
            background: "#2a1a10", borderRadius: "3px 3px 0 0",
            border: "1px solid #3a2a18",
          }} />
        </div>
        {/* Drying rack — vertical frame with hanging hides */}
        <div style={{
          position: "absolute", right: 0, bottom: 0, width: 10, height: 22,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          {/* Rack crossbar */}
          <div style={{
            width: 10, height: 2, backgroundColor: "#5a4a30",
            borderRadius: 1, border: "0.5px solid #3a2a18",
          }} />
          {/* Two vertical posts */}
          <div style={{ display: "flex", justifyContent: "space-between", width: 10, height: 20 }}>
            <div style={{ width: 1.5, height: "100%", backgroundColor: "#5a4a30" }} />
            <div style={{ width: 1.5, height: "100%", backgroundColor: "#5a4a30" }} />
          </div>
          {/* Hanging hides */}
          {[1.5, 5].map((lx, i) => (
            <div key={i} style={{
              position: "absolute", top: 3, left: lx, width: 3, height: 12,
              background: `linear-gradient(180deg, ${i === 0 ? "#8a6a40" : "#7a5a35"}, ${i === 0 ? "#6a5030" : "#5a4028"})`,
              borderRadius: "0 0 1px 1px",
              animation: "hide-sway 3s ease-in-out infinite",
              animationDelay: `${i * 0.5}s`,
              transformOrigin: "top center",
            }} />
          ))}
        </div>
      </div>
      <BuildingLabel name="Tannery" />
    </div>
  );
}

/** Sawmill — building with spinning saw blade wheel */
function SawmillSprite({ x, y }) {
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      transform: "translate(-50%, -50%)",
      display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5,
    }}>
      <div style={{ position: "relative", width: 40, height: 28 }}>
        {/* Main shed */}
        <div style={{
          position: "absolute", bottom: 0, left: 6, width: 28, height: 20,
          background: "linear-gradient(180deg, #8a7a50 0%, #6a5a38 100%)",
          border: "1.5px solid #5a4a30",
          borderRadius: "1px",
          boxShadow: "1px 2px 3px rgba(0,0,0,0.2)",
        }}>
          {/* Peaked roof */}
          <div style={{
            position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "16px solid transparent",
            borderRight: "16px solid transparent",
            borderBottom: "8px solid #7a6a42",
          }} />
          {/* Wide entrance */}
          <div style={{
            position: "absolute", bottom: 0, left: 7, width: 14, height: 12,
            background: "#2a2010",
            borderRadius: "2px 2px 0 0",
            border: "1px solid #4a3a20",
          }} />
        </div>
        {/* Saw blade wheel on left side */}
        <div style={{
          position: "absolute", left: 0, bottom: 4, width: 14, height: 14,
          borderRadius: "50%",
          border: "2px solid #6a6058",
          background: "radial-gradient(circle, #8a8078 0%, #5a5550 60%, #3a3632 100%)",
          animation: "saw-spin 2s linear infinite",
          boxShadow: "0 0 3px rgba(0,0,0,0.3)",
        }}>
          {/* Teeth marks — four lines through center */}
          {[0, 45, 90, 135].map((deg) => (
            <div key={deg} style={{
              position: "absolute", top: "50%", left: "50%",
              width: "100%", height: 1,
              backgroundColor: "#3a3228",
              transform: `translate(-50%, -50%) rotate(${deg}deg)`,
            }} />
          ))}
          {/* Center hub */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 4, height: 4, borderRadius: "50%",
            backgroundColor: "#4a4540", border: "1px solid #2a2520",
          }} />
        </div>
        {/* Log being cut */}
        <div style={{
          position: "absolute", bottom: 2, left: 10, width: 18, height: 4,
          background: "linear-gradient(180deg, #8a6a3a, #6a5028)",
          borderRadius: 2, border: "0.5px solid #5a4020",
        }} />
      </div>
      <BuildingLabel name="Sawmill" />
    </div>
  );
}

/** Smelter — stone furnace with chimney, orange glow, and heavy smoke */
function SmelterSprite({ x, y }) {
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      transform: "translate(-50%, -50%)",
      display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5,
    }}>
      <div style={{ position: "relative", width: 36, height: 34 }}>
        {/* Chimney */}
        <div style={{
          position: "absolute", top: 0, right: 4, width: 8, height: 14,
          background: "linear-gradient(180deg, #5a5048 0%, #4a4038 100%)",
          border: "1.5px solid #3a3028",
          borderRadius: "1px 1px 0 0",
        }}>
          {/* Chimney cap */}
          <div style={{
            position: "absolute", top: -2, left: -2, right: -2, height: 3,
            backgroundColor: "#3a3028", borderRadius: 1,
          }} />
        </div>
        {/* Embers rising from chimney */}
        {[0, 0.6, 1.3].map((d, i) => (
          <div key={i} style={{
            position: "absolute", top: -4, right: `${6 + i * 2}px`,
            width: 2, height: 2, borderRadius: "50%",
            backgroundColor: i === 0 ? "#ff6b1a" : "#ff4500",
            animation: "forge-ember-float 1.8s ease-out infinite",
            animationDelay: `${d}s`,
          }} />
        ))}
        {/* Main furnace body — squat stone structure */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 22,
          background: "linear-gradient(180deg, #6a6058 0%, #4a4238 60%, #3a3228 100%)",
          border: "1.5px solid #3a3028",
          borderRadius: "2px",
          boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.3), 1px 2px 4px rgba(0,0,0,0.25)",
        }}>
          {/* Stone texture lines */}
          <div style={{
            position: "absolute", top: 5, left: 2, right: 2, height: 1,
            backgroundColor: "rgba(0,0,0,0.15)",
          }} />
          <div style={{
            position: "absolute", top: 11, left: 2, right: 2, height: 1,
            backgroundColor: "rgba(0,0,0,0.15)",
          }} />
          {/* Furnace mouth — glowing opening */}
          <div style={{
            position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
            width: 12, height: 10, borderRadius: "6px 6px 2px 2px",
            background: "radial-gradient(ellipse at center bottom, #ff6b1a 0%, #cc5500 40%, #8b3a00 70%, #3a1a08 100%)",
            boxShadow: "0 0 8px rgba(255,107,26,0.4), 0 0 16px rgba(255,69,0,0.2)",
          }} />
        </div>
        {/* Ground glow */}
        <div style={{
          position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)",
          width: 24, height: 6,
          background: "radial-gradient(ellipse, rgba(255,107,26,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      </div>
      <BuildingLabel name="Smelter" />
    </div>
  );
}

/** Custom forge sprites keyed by building ID */
const FORGE_SPRITES = {
  coal_pit: CoalPitSprite,
  tannery: TannerySprite,
  sawmill: SawmillSprite,
  smelter: SmelterSprite,
};

function BuildingSprite({ buildingId, x, y }) {
  const def = BUILDINGS[buildingId];
  if (!def) return null;

  // Use custom sprite for forge buildings
  const CustomSprite = FORGE_SPRITES[buildingId];
  if (CustomSprite) return <CustomSprite x={x} y={y} />;

  const ROOF = {
    common: "#a08060",
    uncommon: "#6b8f5b",
    rare: "#7b5ea7",
  };
  const WALL = {
    common: "#e8d5a3",
    uncommon: "#d8e8d0",
    rare: "#d8d0e8",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 5,
      }}
    >
      <div style={{ position: "relative", width: "34px", height: "26px" }}>
        <div style={{
          position: "absolute",
          top: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "19px solid transparent",
          borderRight: "19px solid transparent",
          borderBottom: `10px solid ${ROOF[def.rarity] || ROOF.common}`,
          filter: "drop-shadow(0 -1px 1px rgba(0,0,0,0.1))",
        }} />
        <div style={{
          width: "100%",
          height: "100%",
          backgroundColor: WALL[def.rarity] || WALL.common,
          border: `1.5px solid ${ROOF[def.rarity] || ROOF.common}`,
          borderRadius: "1px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "1px 2px 3px rgba(0,0,0,0.15)",
        }}>
          <span style={{ fontSize: "15px", lineHeight: 1 }}>{def.icon}</span>
        </div>
      </div>
      <span style={{
        fontSize: "9px",
        fontFamily: "Cinzel, serif",
        fontWeight: "700",
        color: "#2c1810",
        backgroundColor: "rgba(244, 228, 193, 0.75)",
        padding: "0px 3px",
        borderRadius: "2px",
        whiteSpace: "nowrap",
        marginTop: "2px",
        letterSpacing: "0.3px",
      }}>
        {def.name}
      </span>
    </div>
  );
}

function WalkingPeasant({ pathIndex, duration, delay }) {
  return (
    <div
      style={{
        position: "absolute",
        width: "6px",
        height: "6px",
        backgroundColor: "#7a5a30",
        borderRadius: "50%",
        border: "1px solid rgba(0,0,0,0.6)",
        boxShadow: "0 -5px 0 0 #c4a070, 0 -5px 0 1px rgba(0,0,0,0.5)",
        animation: `walk-${pathIndex} ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        zIndex: 15,
        willChange: "left, top",
      }}
    />
  );
}

function SmokePuff({ x, y, delay }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: "4px",
        height: "4px",
        backgroundColor: "rgba(100,100,100,0.35)",
        borderRadius: "50%",
        animation: `smoke-rise 2.5s ease-out infinite`,
        animationDelay: `${delay}s`,
        zIndex: 20,
        pointerEvents: "none",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MapTab({ state, onOpenTavern, onOpenWatchtower, onOpenMarket }) {
  const { buildings, castleLevel, population, season } = state;
  const pal = SEASON_PALETTE[season] || SEASON_PALETTE.spring;

  // Count built instances of each building type
  const counts = useMemo(() => {
    const c = {};
    buildings.forEach((b) => {
      const id = typeof b === "string" ? b : b.type;
      c[id] = (c[id] || 0) + 1;
    });
    return c;
  }, [buildings]);

  // More peasants visible — scales with population, more paths available now
  const peasantCount = Math.min(Math.max(Math.floor(population / 2), 4), WALK_PATHS.length);

  // Smoke sources: castle + processing buildings + permanent forge fixtures
  const smokeSources = useMemo(() => {
    const sources = [
      { x: 50, y: 40 },   // castle chimney
      { x: 74, y: 58 },   // coal pit (permanent)
      { x: 74, y: 44 },   // smelter (permanent)
    ];
    const smokers = ["brewery", "fulling_mill", "iron_mine"];
    smokers.forEach((id) => {
      if (counts[id]) {
        const spot = BUILDING_SPOTS[id]?.[0];
        if (spot) sources.push({ x: spot.x, y: spot.y - 4 });
      }
    });
    return sources;
  }, [counts]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <style>{STYLE_SHEET}</style>

      {/* Title bar */}
      <div
        className="rounded-t-lg border-2 border-b-0 px-3 py-2 text-center"
        style={{ backgroundColor: "#1a1610", borderColor: "#6a5a42" }}
      >
        <h3
          className="font-heading text-base font-bold uppercase tracking-wider"
          style={{ color: "#c4a24a" }}
        >
          Estate of the Realm
        </h3>
        <p className="text-xs" style={{ color: "#8a7a3a" }}>
          {buildings.length} building{buildings.length !== 1 ? "s" : ""} constructed
          {" · "}{population} families
          {" · "}{season?.charAt(0).toUpperCase() + season?.slice(1)}
        </p>
      </div>

      {/* ============ MAP CANVAS ============ */}
      <div
        className="relative border-2 border-t-0 overflow-hidden select-none"
        style={{
          aspectRatio: "5 / 3",
          backgroundColor: pal.ground,
          borderColor: "#6a5a42",
        }}
      >
        {/* Terrain gradient patches */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse at 35% 20%, ${pal.grass} 0%, transparent 40%),
              radial-gradient(ellipse at 70% 70%, ${pal.grass} 0%, transparent 35%),
              radial-gradient(ellipse at 15% 80%, ${pal.grass} 0%, transparent 25%)
            `,
            pointerEvents: "none",
          }}
        />

        {/* ---- WATER (SVG shoreline, west side) ---- */}
        <WaterBody pal={pal} />

        {/* ---- ROADS (SVG dirt trails) ---- */}
        <svg
          viewBox="0 0 500 300"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <defs>
            {/* Slight roughness filter for organic trail edges */}
            <filter id="trail-rough" x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
            </filter>
          </defs>

          {/* Main roads — border (wider, darker) */}
          <g
            stroke="#4a3418"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.22"
            filter="url(#trail-rough)"
          >
            {/* N-S main road */}
            <path d="M 248,12 C 247,70 250,120 249,145 C 248,170 250,210 249,240 C 248,260 250,280 250,290" strokeWidth="7" />
            {/* E-W main road */}
            <path d="M 30,142 C 80,143 140,141 210,142 C 280,143 360,141 470,142" strokeWidth="7" />
          </g>

          {/* Main roads — fill (narrower, lighter) */}
          <g
            stroke={pal.road}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
            filter="url(#trail-rough)"
          >
            <path d="M 248,12 C 247,70 250,120 249,145 C 248,170 250,210 249,240 C 248,260 250,280 250,290" strokeWidth="4" />
            <path d="M 30,142 C 80,143 140,141 210,142 C 280,143 360,141 470,142" strokeWidth="4" />
          </g>

          {/* Minor trails — single thin strokes */}
          <g
            stroke={pal.road}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.25"
            filter="url(#trail-rough)"
          >
            {/* Castle NE to farms */}
            <path d="M 260,130 C 275,105 300,72 325,50 C 345,35 365,28 385,25" strokeWidth="3" />
            {/* Castle to watchtower */}
            <path d="M 268,128 C 278,118 285,108 290,100" strokeWidth="2.5" />
            {/* Castle SW to tavern */}
            <path d="M 232,148 C 215,165 198,180 182,192" strokeWidth="3" />
            {/* Castle S to market */}
            <path d="M 249,158 C 248,180 247,200 250,230" strokeWidth="3" />
            {/* Tavern SE to market */}
            <path d="M 186,200 C 200,210 220,222 242,230" strokeWidth="2.5" />
            {/* East to mines road */}
            <path d="M 350,142 C 375,152 400,168 420,185 C 428,200 425,230 425,270" strokeWidth="3" />
            {/* East pasture spur */}
            <path d="M 385,25 C 405,38 418,55 425,80" strokeWidth="2.5" />
            {/* West to fishpond/gardens */}
            <path d="M 100,142 C 75,152 60,162 52,175" strokeWidth="2.5" />
            {/* West gardens path */}
            <path d="M 52,175 C 55,195 50,215 55,240" strokeWidth="2" />
            {/* South to clay pits */}
            <path d="M 255,240 C 280,245 310,248 340,250 C 360,251 375,250 390,249" strokeWidth="2.5" />
          </g>
        </svg>

        {/* ---- MAP BORDER (thin brown inner frame) ---- */}
        <div style={{
          position: "absolute",
          inset: "3px",
          border: "1.5px solid rgba(90, 64, 32, 0.35)",
          borderRadius: "1px",
          pointerEvents: "none",
          zIndex: 28,
        }} />

        {/* ---- FIELD PATCHES (near farm building spots) ---- */}
        {(counts.strip_farm || counts.demesne_field) && (
          <div style={{
            position: "absolute", left: "55%", top: "4%",
            width: "25%", height: "32%",
            backgroundColor: pal.fieldCrop,
            opacity: 0.25,
            borderRadius: "4px",
            zIndex: 0,
          }} />
        )}
        {counts.pasture && (
          <div style={{
            position: "absolute", left: "80%", top: "14%",
            width: "12%", height: "28%",
            backgroundColor: pal.grass,
            opacity: 0.35,
            borderRadius: "4px",
            border: `1px dashed ${pal.road}44`,
            zIndex: 0,
          }} />
        )}

        {/* ---- DECORATIVE TREES ---- */}
        {TREE_SPOTS.map((t, i) => (
          <CSSTree key={i} x={t.x} y={t.y} size={t.s} color={pal.tree} />
        ))}

        {/* ---- ZONE LABELS ---- */}
        {[
          { text: "Fields", x: "63%", y: "1%" },
          { text: "Pastures", x: "82%", y: "9%" },
          { text: "Gardens", x: "6%", y: "50%" },
          { text: "Mines", x: "80%", y: "55%" },
          { text: "Market", x: "38%", y: "86%" },
          { text: "Forest", x: "7%", y: "22%" },
        ].map((z) => (
          <span
            key={z.text}
            style={{
              position: "absolute",
              left: z.x,
              top: z.y,
              fontSize: "10px",
              fontFamily: "Cinzel, serif",
              fontWeight: "700",
              color: "#3a2a18",
              textShadow: "0 0 3px rgba(244, 228, 193, 0.9), 0 0 3px rgba(244, 228, 193, 0.9), 0 0 6px rgba(244, 228, 193, 0.6)",
              opacity: 0.55,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              pointerEvents: "none",
            }}
          >
            {z.text}
          </span>
        ))}

        {/* ---- BUILDINGS ---- */}
        {Object.entries(BUILDING_SPOTS).map(([id, positions]) =>
          positions.map((pos, i) => {
            const built = (counts[id] || 0) > i;
            if (!built) return null;
            return (
              <BuildingSprite
                key={`${id}-${i}`}
                buildingId={id}
                x={pos.x}
                y={pos.y}
              />
            );
          })
        )}

        {/* ---- CASTLE ---- */}
        <CastleView level={castleLevel} />

        {/* ---- WALKING PEASANTS ---- */}
        {Array.from({ length: peasantCount }).map((_, i) => (
          <WalkingPeasant
            key={`p-${i}`}
            pathIndex={i % WALK_PATHS.length}
            duration={9 + (i % 5) * 3}
            delay={i * 1.2}
          />
        ))}

        {/* ---- SMOKE ---- */}
        {smokeSources.map((src, i) => (
          <SmokePuff key={`s-${i}`} x={src.x} y={src.y} delay={i * 0.7} />
        ))}

        {/* ---- WINTER SNOW OVERLAY ---- */}
        {season === "winter" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                radial-gradient(1.5px 1.5px at 8% 15%, white 50%, transparent 50%),
                radial-gradient(1px 1px at 22% 35%, white 50%, transparent 50%),
                radial-gradient(1.5px 1.5px at 45% 8%, white 50%, transparent 50%),
                radial-gradient(1px 1px at 62% 52%, white 50%, transparent 50%),
                radial-gradient(1.5px 1.5px at 80% 22%, white 50%, transparent 50%),
                radial-gradient(1px 1px at 18% 72%, white 50%, transparent 50%),
                radial-gradient(1.5px 1.5px at 55% 85%, white 50%, transparent 50%),
                radial-gradient(1px 1px at 88% 68%, white 50%, transparent 50%),
                radial-gradient(1px 1px at 35% 50%, white 50%, transparent 50%),
                radial-gradient(1.5px 1.5px at 72% 80%, white 50%, transparent 50%)
              `,
              opacity: 0.4,
              pointerEvents: "none",
              zIndex: 25,
            }}
          />
        )}

        {/* ---- TAVERN (clickable) ---- */}
        <button
          onClick={onOpenTavern}
          style={{
            position: "absolute",
            left: "36%",
            top: "62%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 16,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
          title="Enter the Boar's Head Tavern"
        >
          {/* Building body */}
          <div style={{ position: "relative", width: "46px", height: "34px" }}>
            {/* Roof */}
            <div style={{
              position: "absolute",
              top: "-11px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "26px solid transparent",
              borderRight: "26px solid transparent",
              borderBottom: "13px solid #7a4a2a",
              filter: "drop-shadow(0 -1px 1px rgba(0,0,0,0.15))",
            }} />
            {/* Hanging sign */}
            <div style={{
              position: "absolute",
              top: "-18px",
              right: "-10px",
              width: "2px",
              height: "12px",
              backgroundColor: "#5a3a20",
            }}>
              <div style={{
                position: "absolute",
                bottom: 0,
                left: "-6px",
                width: "14px",
                height: "10px",
                backgroundColor: "#3a2515",
                border: "1px solid #c4a24a",
                borderRadius: "1px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ fontSize: "6px", color: "#c4a24a", lineHeight: 1 }}>{"\u2615"}</span>
              </div>
            </div>
            {/* Walls */}
            <div style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#d8c098",
              border: "2px solid #7a4a2a",
              borderRadius: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "1px 2px 4px rgba(0,0,0,0.2)",
            }}>
              <span style={{ fontSize: "17px", lineHeight: 1 }}>{"\u26EA"}</span>
            </div>
          </div>
          {/* Name label with dark background pill */}
          <span style={{
            fontSize: "11px",
            fontFamily: "Cinzel, serif",
            fontWeight: "700",
            color: "#e8c44a",
            backgroundColor: "rgba(15, 13, 10, 0.85)",
            padding: "1px 6px",
            borderRadius: "3px",
            border: "1px solid rgba(196, 162, 74, 0.4)",
            whiteSpace: "nowrap",
            marginTop: "3px",
            letterSpacing: "0.5px",
          }}>
            Tavern
          </span>
        </button>

        {/* ---- WATCHTOWER (clickable) ---- */}
        {onOpenWatchtower && (
          <button
            onClick={onOpenWatchtower}
            style={{
              position: "absolute",
              left: "38%",
              top: "18%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 16,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
            title="Climb the Watchtower"
          >
            {/* Tower body — tall and narrow */}
            <div style={{ position: "relative", width: "20px", height: "44px" }}>
              {/* Crenellations */}
              <div style={{
                position: "absolute",
                top: "-5px",
                left: "-2px",
                right: "-2px",
                display: "flex",
                justifyContent: "space-between",
              }}>
                <div style={{ width: "5px", height: "5px", backgroundColor: castleLevel >= 2 ? "#7a7068" : "#8a7a60" }} />
                <div style={{ width: "5px", height: "5px", backgroundColor: castleLevel >= 2 ? "#7a7068" : "#8a7a60" }} />
                <div style={{ width: "5px", height: "5px", backgroundColor: castleLevel >= 2 ? "#7a7068" : "#8a7a60" }} />
              </div>
              {/* Wall */}
              <div style={{
                width: "100%",
                height: "100%",
                backgroundColor: castleLevel >= 2 ? "#7a7068" : "#9a8a70",
                border: `2px solid ${castleLevel >= 2 ? "#5a5048" : "#6a5a40"}`,
                borderRadius: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "1px 3px 5px rgba(0,0,0,0.3)",
              }}>
                {/* Arrow slit windows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                  <div style={{ width: "3px", height: "8px", backgroundColor: "#2c1810", borderRadius: "1px" }} />
                  <div style={{ width: "3px", height: "8px", backgroundColor: "#2c1810", borderRadius: "1px" }} />
                </div>
              </div>
            </div>
            {/* Name label with dark background pill */}
            <span style={{
              fontSize: "11px",
              fontFamily: "Cinzel, serif",
              fontWeight: "700",
              color: "#a0c0e0",
              backgroundColor: "rgba(15, 13, 10, 0.85)",
              padding: "1px 6px",
              borderRadius: "3px",
              border: "1px solid rgba(128, 144, 160, 0.4)",
              whiteSpace: "nowrap",
              marginTop: "3px",
              letterSpacing: "0.5px",
            }}>
              Watchtower
            </span>
          </button>
        )}

        {/* ---- MARKET SQUARE (clickable) ---- */}
        <button
          onClick={onOpenMarket}
          style={{
            position: "absolute",
            left: "50%",
            top: "76%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 16,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
          title="Enter the Market Square"
        >
          <div style={{ position: "relative", width: "52px", height: "28px", display: "flex", gap: "2px" }}>
            {/* Three small stall roofs */}
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1, position: "relative" }}>
                <div style={{
                  position: "absolute", top: "-7px", left: "50%", transform: "translateX(-50%)",
                  width: 0, height: 0,
                  borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
                  borderBottom: "9px solid #8a6a2a",
                }} />
                <div style={{
                  width: "100%", height: "100%",
                  backgroundColor: "#d8c098", border: "1.5px solid #8a6a2a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: "10px", lineHeight: 1, color: "#5a3a20" }}>{"\u2696"}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Name label with dark background pill */}
          <span style={{
            fontSize: "11px",
            fontFamily: "Cinzel, serif",
            fontWeight: "700",
            color: "#e8c44a",
            backgroundColor: "rgba(15, 13, 10, 0.85)",
            padding: "1px 6px",
            borderRadius: "3px",
            border: "1px solid rgba(196, 162, 74, 0.4)",
            whiteSpace: "nowrap",
            marginTop: "3px",
            letterSpacing: "0.5px",
          }}>
            Market
          </span>
        </button>

        {/* ---- FORGE BUILDINGS (permanent fixtures) ---- */}
        <CoalPitSprite x={74} y={62} />
        <TannerySprite x={36} y={72} />
        <SawmillSprite x={22} y={42} />
        <SmelterSprite x={74} y={48} />

        {/* ---- COMPASS ROSE ---- */}
        <div
          style={{
            position: "absolute",
            right: "2%",
            bottom: "3%",
            fontSize: "11px",
            fontFamily: "Cinzel, serif",
            fontWeight: "bold",
            color: "#3a2a18",
            textShadow: "0 0 3px rgba(244, 228, 193, 0.8), 0 0 3px rgba(244, 228, 193, 0.8)",
            opacity: 0.5,
            textAlign: "center",
            lineHeight: 1.1,
            pointerEvents: "none",
            zIndex: 3,
          }}
        >
          <div>N</div>
          <div style={{ letterSpacing: "4px" }}>W+E</div>
          <div>S</div>
        </div>

        {/* Hint when no buildings */}
        {buildings.length === 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "6%",
              transform: "translateX(-50%)",
              fontSize: "12px",
              fontFamily: "Crimson Text, serif",
              fontStyle: "italic",
              color: "#e0d0b0",
              backgroundColor: "rgba(15, 13, 10, 0.8)",
              padding: "3px 10px",
              borderRadius: "4px",
              border: "1px solid rgba(196, 162, 74, 0.3)",
              whiteSpace: "nowrap",
              zIndex: 30,
            }}
          >
            Build on the Estate tab to see your village grow...
          </div>
        )}
      </div>

      {/* ============ LEGEND ============ */}
      <div
        className="rounded-b-lg border-2 border-t-0 px-3 py-2 flex flex-wrap gap-x-3 gap-y-1 justify-center items-center"
        style={{ backgroundColor: "#1a1610", borderColor: "#6a5a42" }}
      >
        <LegendSwatch color="#a08060" label="Common" />
        <LegendSwatch color="#6b8f5b" label="Uncommon" />
        <LegendSwatch color="#7b5ea7" label="Rare" />
        <LegendDivider />
        <LegendText label={`Castle Lv.${castleLevel}`} />
        <LegendDivider />
        <LegendDot color="#7a5a30" label={`Peasants (${population})`} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend helpers
// ---------------------------------------------------------------------------

function LegendSwatch({ color, label }) {
  return (
    <span className="flex items-center gap-1" style={{ fontSize: "11px", color: "#a89070", fontFamily: "Cinzel, serif" }}>
      <span style={{
        display: "inline-block",
        width: "10px",
        height: "10px",
        backgroundColor: color,
        borderRadius: "1px",
        border: `1px solid ${color}`,
      }} />
      {label}
    </span>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1" style={{ fontSize: "11px", color: "#a89070", fontFamily: "Cinzel, serif" }}>
      <span style={{
        display: "inline-block",
        width: "7px",
        height: "7px",
        backgroundColor: color,
        borderRadius: "50%",
      }} />
      {label}
    </span>
  );
}

function LegendDivider() {
  return <span style={{ fontSize: "11px", color: "#6a5a42" }}>|</span>;
}

function LegendText({ label }) {
  return (
    <span style={{ fontSize: "11px", color: "#a89070", fontFamily: "Cinzel, serif" }}>
      {label}
    </span>
  );
}
