import { useState, useCallback, useEffect, useRef } from "react";
import { BARD_TALES, BARD_STATE_COMMENTS, BARD_RIDDLES } from "../data/tavern";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shuffle an array (Fisher-Yates) without mutating the original. */
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Create a shuffled index queue for cycling through tales without repeats. */
function createTaleQueue() {
  return shuffle(Array.from({ length: BARD_TALES.length }, (_, i) => i));
}

/**
 * Roll a random content type based on weighted probabilities:
 *   tale    = 60%
 *   comment = 25%
 *   riddle  = 15%
 */
function rollContentType() {
  const roll = Math.random();
  if (roll < 0.6) return "tale";
  if (roll < 0.85) return "comment";
  return "riddle";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SpeechBubble({ children, animKey }) {
  return (
    <div
      key={animKey}
      className="quill-appear rounded-lg border-2 p-4 mt-3"
      style={{
        backgroundColor: "#2a2010",
        borderColor: "#c4a24a",
        boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      {children}
    </div>
  );
}

function BardPortrait() {
  return (
    <div
      className="flex items-center justify-center rounded-lg border-2 mx-auto"
      style={{
        width: 80,
        height: 80,
        borderColor: "#c4a24a",
        backgroundColor: "#1a1610",
        boxShadow: "0 0 12px rgba(196, 162, 74, 0.2)",
      }}
    >
      <span
        style={{
          fontSize: 36,
          color: "#c4a24a",
          fontFamily: "serif",
          lineHeight: 1,
        }}
      >
        {"\u266A"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BardsCorner({ state, onRiddleSolved, onBack }) {
  // Track tale cycling: shuffled queue of indices, no repeats until exhausted
  const taleQueue = useRef(createTaleQueue());
  const taleIndex = useRef(0);
  const cycleCount = useRef(0);

  // Animation key to trigger quill-appear on each new content
  const [animKey, setAnimKey] = useState(0);

  /** Pull the next tale from the shuffled queue, cycling when exhausted. */
  const getNextTale = useCallback(() => {
    if (taleIndex.current >= taleQueue.current.length) {
      // All tales shown — reshuffle and start a new cycle
      taleQueue.current = createTaleQueue();
      taleIndex.current = 0;
      cycleCount.current += 1;
    }
    const idx = taleQueue.current[taleIndex.current];
    taleIndex.current += 1;
    const text = BARD_TALES[idx];
    const isRepeat = cycleCount.current > 0;
    return { type: "tale", text, isRepeat };
  }, []);

  /** Generate a piece of content based on weighted roll. */
  const generateContent = useCallback(
    (forceType) => {
      const type = forceType || rollContentType();

      if (type === "tale") {
        return getNextTale();
      }

      if (type === "comment") {
        const match = BARD_STATE_COMMENTS.find((c) => c.condition(state));
        return {
          type: "comment",
          text: match ? match.text : "Your manor endures, my lord.",
        };
      }

      // riddle
      const riddle =
        BARD_RIDDLES[Math.floor(Math.random() * BARD_RIDDLES.length)];
      return {
        type: "riddle",
        question: riddle.question,
        answer: riddle.answer,
        options: shuffle(riddle.options),
        correctText: riddle.correct,
        wrongText: riddle.wrong,
      };
    },
    [state, getNextTale]
  );

  const [content, setContent] = useState(null);
  const [riddleResult, setRiddleResult] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    setContent((prev) => (prev === null ? generateContent() : prev));
    // Only run once on mount to seed initial content; generateContent is
    // intentionally omitted so state changes don't re-seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reroll = useCallback(() => {
    setContent(generateContent());
    setRiddleResult(null);
    setSelectedOption(null);
    setAnimKey((k) => k + 1);
  }, [generateContent]);

  const handleRiddleAnswer = useCallback(
    (option) => {
      if (riddleResult !== null) return;
      setSelectedOption(option);
      if (option === content.answer) {
        setRiddleResult("correct");
        onRiddleSolved();
      } else {
        setRiddleResult("wrong");
      }
    },
    [riddleResult, content, onRiddleSolved]
  );

  // --- Render content body ---------------------------------------------------

  let body = null;

  if (content === null) {
    body = null;
  } else if (content.type === "tale") {
    body = (
      <SpeechBubble animKey={animKey}>
        {content.isRepeat && (
          <p
            className="text-xs mb-2 italic"
            style={{ color: "#8a7a5a", fontFamily: "Crimson Text, serif" }}
          >
            Have I told you this one? No matter. It bears repeating.
          </p>
        )}
        <p
          className="text-sm sm:text-base leading-relaxed"
          style={{ color: "#c8b090", fontFamily: "Crimson Text, serif" }}
        >
          <span style={{ color: "#e8c44a", fontSize: "1.3em", lineHeight: 1 }}>
            {"\u201C"}
          </span>
          {content.text}
          <span style={{ color: "#e8c44a", fontSize: "1.3em", lineHeight: 1 }}>
            {"\u201D"}
          </span>
        </p>
      </SpeechBubble>
    );
  } else if (content.type === "comment") {
    body = (
      <SpeechBubble animKey={animKey}>
        <p
          className="text-sm sm:text-base leading-relaxed italic"
          style={{ color: "#c8b090", fontFamily: "Crimson Text, serif" }}
        >
          <span style={{ color: "#e8c44a", fontSize: "1.3em", lineHeight: 1 }}>
            {"\u201C"}
          </span>
          {content.text}
          <span style={{ color: "#e8c44a", fontSize: "1.3em", lineHeight: 1 }}>
            {"\u201D"}
          </span>
        </p>
      </SpeechBubble>
    );
  } else if (content.type === "riddle") {
    body = (
      <div key={animKey} className="quill-appear">
        <SpeechBubble>
          <p
            className="text-sm sm:text-base leading-relaxed font-semibold"
            style={{ color: "#e8c44a", fontFamily: "Crimson Text, serif" }}
          >
            {content.question}
          </p>
        </SpeechBubble>

        <div className="flex flex-col gap-2 mt-3">
          {content.options.map((option) => {
            let bg = "#1a1610";
            let border = "#6a5a42";
            let textColor = "#c8b090";

            if (riddleResult !== null && option === content.answer) {
              bg = "rgba(74, 138, 58, 0.25)";
              border = "#4a8a3a";
              textColor = "#6dc858";
            } else if (
              riddleResult === "wrong" &&
              option === selectedOption
            ) {
              bg = "rgba(198, 40, 40, 0.2)";
              border = "#c62828";
              textColor = "#e57373";
            }

            return (
              <button
                key={option}
                onClick={() => handleRiddleAnswer(option)}
                disabled={riddleResult !== null}
                className="w-full text-left px-4 py-3 rounded-md border-2 cursor-pointer min-h-[44px]"
                style={{
                  backgroundColor: bg,
                  borderColor: border,
                  color: textColor,
                  fontFamily: "Crimson Text, serif",
                  transition: "all 200ms ease",
                  opacity:
                    riddleResult !== null &&
                    option !== content.answer &&
                    option !== selectedOption
                      ? 0.5
                      : 1,
                }}
                onMouseEnter={(e) => {
                  if (riddleResult === null) {
                    e.currentTarget.style.backgroundColor = "#2a2318";
                    e.currentTarget.style.borderColor = "#c4a24a";
                  }
                }}
                onMouseLeave={(e) => {
                  if (riddleResult === null) {
                    e.currentTarget.style.backgroundColor = "#1a1610";
                    e.currentTarget.style.borderColor = "#6a5a42";
                  }
                }}
              >
                {option}
              </button>
            );
          })}
        </div>

        {riddleResult === "correct" && (
          <SpeechBubble>
            <p
              className="text-sm italic"
              style={{ color: "#4a8a3a", fontFamily: "Crimson Text, serif" }}
            >
              {content.correctText}
              <span
                className="block mt-1 font-semibold not-italic"
                style={{ color: "#e8c44a" }}
              >
                +10 denarii
              </span>
            </p>
          </SpeechBubble>
        )}
        {riddleResult === "wrong" && (
          <SpeechBubble>
            <p
              className="text-sm italic"
              style={{ color: "#c62828", fontFamily: "Crimson Text, serif" }}
            >
              {content.wrongText}
            </p>
          </SpeechBubble>
        )}
      </div>
    );
  }

  // --- Layout ----------------------------------------------------------------

  return (
    <div
      className="rounded-lg border-2 p-4 sm:p-5 max-w-xl mx-auto"
      style={{
        backgroundColor: "#1a1610",
        borderColor: "#8a7a3a",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Header */}
      <h3
        className="text-center text-lg sm:text-xl font-bold mb-3"
        style={{ fontFamily: "Cinzel, serif", color: "#e8c44a" }}
      >
        The Bard{"'"}s Corner
      </h3>

      {/* Portrait */}
      <BardPortrait />

      {/* Intro line */}
      <p
        className="text-center italic text-sm mt-3 mb-1"
        style={{ color: "#a89070", fontFamily: "Crimson Text, serif" }}
      >
        Sit, sit! The fire is warm, and my tongue is warmer.
      </p>

      {/* Decorative rule */}
      <div className="decorative-rule" style={{ color: "#8a7a3a" }}>
        {"\u25C6"}
      </div>

      {/* Content */}
      {body}

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={reroll}
          className="flex-1 px-4 py-3 rounded-md border-2 cursor-pointer font-semibold text-sm min-h-[44px]"
          style={{
            backgroundColor: "#231e16",
            borderColor: "#c4a24a",
            color: "#c4a24a",
            fontFamily: "Cinzel, serif",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2d2619";
            e.currentTarget.style.borderColor = "#e8c44a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#231e16";
            e.currentTarget.style.borderColor = "#c4a24a";
          }}
        >
          Tell me more...
        </button>
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 rounded-md border-2 cursor-pointer font-semibold text-sm min-h-[44px]"
          style={{
            backgroundColor: "#1a1610",
            borderColor: "#6a5a42",
            color: "#a89070",
            fontFamily: "Cinzel, serif",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2318";
            e.currentTarget.style.borderColor = "#a89070";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#1a1610";
            e.currentTarget.style.borderColor = "#6a5a42";
          }}
        >
          Leave
        </button>
      </div>
    </div>
  );
}
