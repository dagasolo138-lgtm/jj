/**
 * FlipScreen.jsx
 *
 * Renders all 4 sub-phases of a perspective flip:
 *   flip_intro → flip_decision → flip_outcome → flip_summary
 *
 * Styled with flip-specific color schemes using inline styles + Tailwind layout.
 */

// ---------------------------------------------------------------------------
// Consequence pills (reuses EventCard style)
// ---------------------------------------------------------------------------

import { translateEffects } from "../engine/meterUtils";

const RESOURCE_LABELS = {
  denarii: "\u269C Denarii",
  food: "\u2727 Food",
  population: "\u2302 Families",
  garrison: "\u2694 Garrison",
};

function ConsequencePills({ consequences }) {
  if (!consequences) return null;
  // Translate old meter-format consequences to resource format for display
  const translated = translateEffects(consequences);
  const entries = Object.entries(translated).filter(([, v]) => v !== 0);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-3">
      {entries.map(([resource, delta]) => (
        <span
          key={resource}
          className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full border font-semibold"
          style={{
            borderColor: delta > 0 ? "#4a8a3a" : "#c62828",
            backgroundColor: delta > 0 ? "rgba(74, 138, 58, 0.15)" : "rgba(198, 40, 40, 0.15)",
            color: delta > 0 ? "#4a8a3a" : "#c62828",
          }}
        >
          {RESOURCE_LABELS[resource] || resource}
          {delta > 0 ? ` +${delta}` : ` ${delta}`}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat change summary for outcome screen
// ---------------------------------------------------------------------------

function StatChangeSummary({ prevStats, nextStats, characterStats }) {
  if (!prevStats || !nextStats || !characterStats) return null;

  const changes = Object.keys(characterStats).map((key) => ({
    key,
    label: characterStats[key].label,
    icon: characterStats[key].icon,
    color: characterStats[key].color,
    delta: nextStats[key] - prevStats[key],
  })).filter((c) => c.delta !== 0);

  if (changes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-3">
      {changes.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full border font-semibold"
          style={{
            borderColor: c.delta > 0 ? "#4a8a3a" : "#c62828",
            backgroundColor: c.delta > 0 ? "rgba(74, 138, 58, 0.15)" : "rgba(198, 40, 40, 0.15)",
            color: c.delta > 0 ? "#4a8a3a" : "#c62828",
          }}
        >
          {c.icon} {c.label} {c.delta > 0 ? `+${c.delta}` : c.delta}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FlipScreen component
// ---------------------------------------------------------------------------

export default function FlipScreen({
  phase,
  flipData,
  currentFlipStats,
  currentDecisionIndex,
  currentFlipOutcome,
  flipOutcomeWasSuccess,
  consequences,
  prevStats,
  onDismissIntro,
  onSelectOption,
  onContinue,
  onDismissSummary,
  // CYOA props:
  currentCyoaNodeId,
  isCyoa,
}) {
  if (!flipData) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-lg border-2 p-5 shadow-lg"
        style={{ backgroundColor: "#231e16", borderColor: "#8a7a3a" }}>
        <p style={{ color: "#a89070" }}>This perspective shift is unavailable.</p>
        <button
          onClick={onDismissSummary}
          className="mt-4 px-6 py-2 rounded-md border cursor-pointer"
          style={{ backgroundColor: "#2a2318", borderColor: "#6a5a42", color: "#c8b090" }}
        >Return to Your Reign</button>
      </div>
    );
  }

  const { colorScheme } = flipData;

  // Shared card wrapper
  const cardStyle = {
    backgroundColor: colorScheme.background,
    borderColor: colorScheme.accent,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
  };

  // ---------------------------------------------------------------------------
  // FLIP INTRO
  // ---------------------------------------------------------------------------
  if (phase === "flip_intro") {
    return (
      <div className="mx-auto w-full max-w-xl rounded-lg border-2 p-5 sm:p-6 shadow-lg" style={cardStyle}>
        <div
          className="text-xs uppercase tracking-widest font-heading font-semibold mb-3"
          style={{ color: colorScheme.accent }}
        >
          Perspective Shift
        </div>
        <h2
          className="font-heading text-2xl sm:text-3xl font-bold mb-3"
          style={{ color: colorScheme.text }}
        >
          {flipData.intro.title}
        </h2>
        <p
          className="italic text-base leading-relaxed mb-4"
          style={{ color: colorScheme.accent }}
        >
          {flipData.intro.bridgeText}
        </p>
        <p
          className="text-base leading-relaxed mb-6"
          style={{ color: colorScheme.text }}
        >
          {flipData.intro.narrativeText}
        </p>
        <div className="text-center">
          <button
            onClick={onDismissIntro}
            className="px-8 py-3 rounded-md border-2 font-heading font-bold text-lg uppercase tracking-wider transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: colorScheme.accent,
              borderColor: colorScheme.accent,
              color: "#faf3e3",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colorScheme.light; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colorScheme.accent; }}
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FLIP DECISION
  // ---------------------------------------------------------------------------
  if (phase === "flip_decision") {
    // CYOA mode: navigate branching node graph instead of linear decisions array
    if (isCyoa && currentCyoaNodeId) {
      const node = flipData.nodes[currentCyoaNodeId];
      if (!node || node.isEnding) return null;

      return (
        <div className="mx-auto w-full max-w-xl rounded-lg border-2 p-4 sm:p-5 shadow-lg" style={cardStyle}>
          <div
            className="text-xs uppercase tracking-widest font-heading font-semibold mb-2"
            style={{ color: colorScheme.accent }}
          >
            Choose Your Path
          </div>
          <h3
            className="font-heading text-lg sm:text-xl font-bold mb-2"
            style={{ color: colorScheme.text }}
          >
            {node.title}
          </h3>
          <p className="text-base leading-relaxed mb-4" style={{ color: colorScheme.text }}>
            {node.description}
          </p>

          <div className="flex flex-col gap-2" role="group" aria-label="Choose your path">
            {node.options.map((option, i) => (
              <button
                key={i}
                onClick={() => onSelectOption(i)}
                className="w-full text-left px-4 py-4 rounded-md border-2 transition-all duration-200 cursor-pointer min-h-[44px]"
                style={{
                  backgroundColor: colorScheme.background,
                  borderColor: colorScheme.light,
                  color: colorScheme.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colorScheme.background + "dd";
                  e.currentTarget.style.borderColor = colorScheme.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colorScheme.background;
                  e.currentTarget.style.borderColor = colorScheme.light;
                }}
                aria-label={`Option ${i + 1}: ${option.text}`}
              >
                <div className="font-semibold text-base">{option.text}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    const decision = flipData.decisions[currentDecisionIndex];
    if (!decision) return null;

    const totalDecisions = flipData.decisions.length;

    return (
      <div className="mx-auto w-full max-w-xl rounded-lg border-2 p-4 sm:p-5 shadow-lg" style={cardStyle}>
        <div
          className="text-xs uppercase tracking-widest font-heading font-semibold mb-2"
          style={{ color: colorScheme.accent }}
        >
          Decision {currentDecisionIndex + 1} of {totalDecisions}
        </div>
        <h3
          className="font-heading text-lg sm:text-xl font-bold mb-2"
          style={{ color: colorScheme.text }}
        >
          {decision.title}
        </h3>
        <p className="text-base leading-relaxed mb-4" style={{ color: colorScheme.text }}>
          {decision.description}
        </p>

        <div className="flex flex-col gap-2" role="group" aria-label="Choose your response">
          {decision.options.map((option, i) => (
            <button
              key={i}
              onClick={() => onSelectOption(i)}
              className="w-full text-left px-4 py-4 rounded-md border-2 transition-all duration-200 cursor-pointer min-h-[44px]"
              style={{
                backgroundColor: colorScheme.background,
                borderColor: colorScheme.light,
                color: colorScheme.text,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colorScheme.background + "dd";
                e.currentTarget.style.borderColor = colorScheme.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colorScheme.background;
                e.currentTarget.style.borderColor = colorScheme.light;
              }}
              aria-label={`Option ${i + 1}: ${option.text}`}
            >
              <div className="font-semibold text-base">{option.text}</div>
              {option.chance !== undefined && (
                <div className="text-xs mt-1 opacity-70" style={{ color: colorScheme.accent }}>
                  {Math.round(option.chance * 100)}% chance of success
                </div>
              )}
            </button>
          ))}
        </div>

        {decision.scribesNote && (
          <div
            className="mt-4 p-3 rounded-md border text-sm leading-relaxed italic"
            style={{
              backgroundColor: "#231e16",
              borderColor: "#6a5a42",
              color: "#a89070",
            }}
          >
            <span className="font-heading font-semibold not-italic" style={{ color: "#c4a24a" }}>
              Scribe&apos;s Note:
            </span>{" "}
            {decision.scribesNote}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FLIP OUTCOME
  // ---------------------------------------------------------------------------
  if (phase === "flip_outcome") {
    const isLast = currentDecisionIndex >= flipData.decisions.length - 1;

    return (
      <div className="mx-auto w-full max-w-xl rounded-lg border-2 p-4 sm:p-5 shadow-lg" style={cardStyle}>
        <div
          className="text-xs uppercase tracking-widest font-heading font-semibold mb-2"
          style={{ color: colorScheme.accent }}
        >
          {flipOutcomeWasSuccess === true && "Success!"}
          {flipOutcomeWasSuccess === false && "Things didn\u2019t go as planned\u2026"}
          {flipOutcomeWasSuccess === null && "Outcome"}
        </div>

        <p className="text-base leading-relaxed mb-4" style={{ color: colorScheme.text }}>
          {currentFlipOutcome}
        </p>

        <StatChangeSummary
          prevStats={prevStats}
          nextStats={currentFlipStats}
          characterStats={flipData.characterStats}
        />

        <div className="text-center mt-5">
          <button
            onClick={onContinue}
            className="px-8 py-3 rounded-md border-2 font-heading font-bold text-lg uppercase tracking-wider transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: colorScheme.accent,
              borderColor: colorScheme.accent,
              color: "#faf3e3",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colorScheme.light; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colorScheme.accent; }}
          >
            {isLast ? "See the Consequences" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FLIP SUMMARY
  // ---------------------------------------------------------------------------
  if (phase === "flip_summary") {
    // CYOA ending mode: show the ending node with icon, historical connection, then estate consequences
    if (isCyoa && currentCyoaNodeId) {
      const endingNode = flipData.nodes[currentCyoaNodeId];

      const endingStyles = {
        good: { label: "Prosperous Ending", bgColor: "rgba(74, 138, 58, 0.15)", borderColor: "#4a8a3a" },
        medium: { label: "Survival Ending", bgColor: "rgba(180, 140, 20, 0.15)", borderColor: "#b48c14" },
        bad: { label: "Downfall Ending", bgColor: "rgba(198, 40, 40, 0.15)", borderColor: "#c62828" },
      };
      const endStyle = endingStyles[endingNode?.endingType] || endingStyles.medium;

      return (
        <div className="mx-auto w-full max-w-xl rounded-lg border-2 p-5 sm:p-6 shadow-lg" style={cardStyle}>
          {/* Ending type badge */}
          <div
            className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full border font-semibold mb-4"
            style={{
              borderColor: endStyle.borderColor,
              backgroundColor: endStyle.bgColor,
              color: endStyle.borderColor,
            }}
          >
            <span className="text-lg">{endingNode?.icon}</span>
            {endStyle.label}
          </div>

          <h2
            className="font-heading text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: colorScheme.text }}
          >
            {endingNode?.title}
          </h2>

          <p className="text-base leading-relaxed mb-4" style={{ color: colorScheme.text }}>
            {endingNode?.description}
          </p>

          {/* Historical Connection */}
          {endingNode?.historicalConnection && (
            <div
              className="mb-4 p-3 rounded-md border text-sm leading-relaxed italic"
              style={{
                backgroundColor: "#231e16",
                borderColor: "#6a5a42",
                color: "#a89070",
              }}
            >
              <span className="font-heading font-semibold not-italic" style={{ color: "#c4a24a" }}>
                Historical Connection:
              </span>{" "}
              {endingNode.historicalConnection}
            </div>
          )}

          {/* Return text */}
          <p
            className="italic text-base leading-relaxed mb-4"
            style={{ color: colorScheme.accent }}
          >
            {flipData.returnText}
          </p>

          {/* Scribe's Note */}
          <div
            className="mb-4 p-3 rounded-md border text-sm leading-relaxed italic"
            style={{
              backgroundColor: "#231e16",
              borderColor: "#6a5a42",
              color: "#a89070",
            }}
          >
            <span className="font-heading font-semibold not-italic" style={{ color: "#c4a24a" }}>
              Scribe&apos;s Note:
            </span>{" "}
            {flipData.scribesNote}
          </div>

          {/* Consequence pills */}
          <p
            className="text-sm font-heading font-semibold text-center mb-1"
            style={{ color: colorScheme.text }}
          >
            The consequences ripple back to your estate&hellip;
          </p>
          <ConsequencePills consequences={consequences} />

          <div className="text-center mt-5">
            <button
              onClick={onDismissSummary}
              className="px-8 py-3 rounded-md border-2 font-heading font-bold text-lg uppercase tracking-wider transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: colorScheme.accent,
                borderColor: colorScheme.accent,
                color: "#faf3e3",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colorScheme.light; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colorScheme.accent; }}
            >
              Return to Your Reign
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-xl rounded-lg border-2 p-5 sm:p-6 shadow-lg" style={cardStyle}>
        <div
          className="text-xs uppercase tracking-widest font-heading font-semibold mb-3"
          style={{ color: colorScheme.accent }}
        >
          Returning to Your Reign
        </div>

        <p
          className="italic text-base leading-relaxed mb-4"
          style={{ color: colorScheme.accent }}
        >
          {flipData.returnText}
        </p>

        {/* Scribe's Note */}
        <div
          className="mb-4 p-3 rounded-md border text-sm leading-relaxed italic"
          style={{
            backgroundColor: "#231e16",
            borderColor: "#6a5a42",
            color: "#a89070",
          }}
        >
          <span className="font-heading font-semibold not-italic" style={{ color: "#c4a24a" }}>
            Scribe&apos;s Note:
          </span>{" "}
          {flipData.scribesNote}
        </div>

        {/* Lord meter consequence pills */}
        <p
          className="text-sm font-heading font-semibold text-center mb-1"
          style={{ color: colorScheme.text }}
        >
          The consequences ripple back to your estate&hellip;
        </p>
        <ConsequencePills consequences={consequences} />

        <div className="text-center mt-5">
          <button
            onClick={onDismissSummary}
            className="px-8 py-3 rounded-md border-2 font-heading font-bold text-lg uppercase tracking-wider transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: colorScheme.accent,
              borderColor: colorScheme.accent,
              color: "#faf3e3",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colorScheme.light; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colorScheme.accent; }}
          >
            Return to Your Reign
          </button>
        </div>
      </div>
    );
  }

  return null;
}
