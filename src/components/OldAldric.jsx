/**
 * OldAldric.jsx
 *
 * Aldric One-Eye — Veteran of the Siege of Acre.
 * Interactive tavern NPC that teaches medieval warfare and castle defense
 * through military counsel, war stories, and one-time training offers.
 *
 * Rendered as a sub-view within the Tavern overlay.
 */

import { useState, useRef } from "react";
import {
  ALDRIC_MILITARY_COUNSEL,
  ALDRIC_WAR_STORIES,
  ALDRIC_TRAINING_OFFERS,
  ALDRIC_SCRIBES_NOTE,
} from "../data/tavern";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createQueue(length) {
  return shuffle(Array.from({ length }, (_, i) => i));
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
        backgroundColor: "#1a0e0e",
        borderColor: "var(--royal-red, #8b1a1a)",
        boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.4)",
      }}
    >
      {children}
    </div>
  );
}

function AldricPortrait() {
  return (
    <div
      className="flex items-center justify-center rounded-lg border-2 mx-auto"
      style={{
        width: 80,
        height: 80,
        borderColor: "var(--royal-red, #8b1a1a)",
        backgroundColor: "#120808",
        boxShadow: "0 0 12px rgba(139, 26, 26, 0.3)",
      }}
    >
      <span
        style={{
          fontSize: 36,
          color: "#c44a4a",
          fontFamily: "serif",
          lineHeight: 1,
        }}
      >
        {"\u2694"}
      </span>
    </div>
  );
}

function OfferCard({ offer, state, offerResult, onAccept, onDecline }) {
  const canAccept = offer.canAccept(state);
  const isResolved = offerResult !== null;

  return (
    <div
      className="quill-appear rounded-lg border-2 p-4 mt-3"
      style={{
        backgroundColor: "#120808",
        borderColor: "var(--royal-red, #8b1a1a)",
      }}
    >
      <h4
        className="text-sm font-bold uppercase tracking-wide mb-2"
        style={{ fontFamily: "Cinzel, serif", color: "#c44a4a" }}
      >
        {offer.title}
      </h4>
      <p
        className="text-sm leading-relaxed mb-3"
        style={{
          color: "#c8b090",
          fontFamily: "Crimson Text, serif",
          lineHeight: 1.8,
        }}
      >
        <span style={{ color: "#c44a4a", fontSize: "1.2em" }}>{"\u201C"}</span>
        {offer.description}
        <span style={{ color: "#c44a4a", fontSize: "1.2em" }}>{"\u201D"}</span>
      </p>

      {/* Cost / Reward breakdown */}
      <div
        className="flex gap-4 mb-3 text-xs"
        style={{ fontFamily: "Crimson Text, serif" }}
      >
        <div>
          <span style={{ color: "#8a7a5a" }}>Cost: </span>
          <span style={{ color: offer.costText === "Free" ? "#6dc858" : "#e57373" }}>
            {offer.costText}
          </span>
        </div>
        <div>
          <span style={{ color: "#8a7a5a" }}>Effect: </span>
          <span style={{ color: "#6dc858" }}>{offer.rewardText}</span>
        </div>
      </div>

      {/* Action buttons or result */}
      {isResolved ? (
        <p
          className="text-sm italic"
          style={{
            color: offerResult.accepted ? "#6dc858" : "#a89070",
            fontFamily: "Crimson Text, serif",
          }}
        >
          {offerResult.accepted
            ? "It is done."
            : "As you wish, my lord."}
        </p>
      ) : !canAccept ? (
        <p
          className="text-sm italic"
          style={{ color: "#a89070", fontFamily: "Crimson Text, serif" }}
        >
          {offer.cantAcceptText}
        </p>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(offer.id)}
            className="px-4 py-2 rounded text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, var(--royal-red, #8b1a1a) 0%, #4a0a0a 50%, var(--royal-red, #8b1a1a) 100%)",
              color: "#e8c44a",
              border: "1px solid #c44a4a",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #c44a4a 0%, #6a1a1a 50%, #c44a4a 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, var(--royal-red, #8b1a1a) 0%, #4a0a0a 50%, var(--royal-red, #8b1a1a) 100%)";
            }}
          >
            Accept
          </button>
          <button
            onClick={() => onDecline(offer.id)}
            className="px-4 py-2 rounded text-sm"
            style={{
              backgroundColor: "#1a1208",
              color: "#8a7a5a",
              border: "1px solid #3a3020",
              cursor: "pointer",
            }}
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function OldAldric({ state, onAcceptOffer, onDeclineOffer, onScribesNoteSeen, onBack }) {
  const tavern = state.tavern ?? {};
  const aldricOffersUsed = tavern.aldricOffersUsed ?? [];
  const scribesNoteSeen = tavern.aldricScribesNoteSeen ?? false;

  const availableOffers = ALDRIC_TRAINING_OFFERS.filter(
    (o) => !aldricOffersUsed.includes(o.id)
  );

  // Shuffled queues for cycling without repeats
  const counselQueue = useRef(createQueue(ALDRIC_MILITARY_COUNSEL.length));
  const counselIndex = useRef(0);
  const storyQueue = useRef(createQueue(ALDRIC_WAR_STORIES.length));
  const storyIndex = useRef(0);

  const [animKey, setAnimKey] = useState(0);
  const [showScribesNote, setShowScribesNote] = useState(!scribesNoteSeen);
  const [offerResult, setOfferResult] = useState(null);

  function getNextCounsel() {
    if (counselIndex.current >= counselQueue.current.length) {
      counselQueue.current = createQueue(ALDRIC_MILITARY_COUNSEL.length);
      counselIndex.current = 0;
    }
    const idx = counselQueue.current[counselIndex.current++];
    const raw = ALDRIC_MILITARY_COUNSEL[idx];
    return { type: "counsel", text: typeof raw === "function" ? raw(state) : raw };
  }

  function getNextStory() {
    if (storyIndex.current >= storyQueue.current.length) {
      storyQueue.current = createQueue(ALDRIC_WAR_STORIES.length);
      storyIndex.current = 0;
    }
    const idx = storyQueue.current[storyIndex.current++];
    return { type: "story", text: ALDRIC_WAR_STORIES[idx] };
  }

  function makeContent() {
    const roll = Math.random();
    if (availableOffers.length > 0 && roll < 0.25) {
      const offer = availableOffers[Math.floor(Math.random() * availableOffers.length)];
      return { type: "offer", offer };
    }
    if (roll < 0.60) return getNextCounsel();
    return getNextStory();
  }

  // Initial content avoids ref access during render
  const [content, setContent] = useState(() => {
    const roll = Math.random();
    if (availableOffers.length > 0 && roll < 0.25) {
      const offer = availableOffers[Math.floor(Math.random() * availableOffers.length)];
      return { type: "offer", offer };
    }
    if (roll < 0.60) {
      const idx = Math.floor(Math.random() * ALDRIC_MILITARY_COUNSEL.length);
      const raw = ALDRIC_MILITARY_COUNSEL[idx];
      return { type: "counsel", text: typeof raw === "function" ? raw(state) : raw };
    }
    const idx = Math.floor(Math.random() * ALDRIC_WAR_STORIES.length);
    return { type: "story", text: ALDRIC_WAR_STORIES[idx] };
  });

  function reroll() {
    setContent(makeContent());
    setOfferResult(null);
    setAnimKey((k) => k + 1);
  }

  function handleAccept(offerId) {
    setOfferResult({ offerId, accepted: true });
    onAcceptOffer(offerId);
  }

  function handleDecline(offerId) {
    setOfferResult({ offerId, accepted: false });
    onDeclineOffer(offerId);
  }

  function handleDismissScribesNote() {
    setShowScribesNote(false);
    onScribesNoteSeen();
  }

  // Disable "Talk Again" when an actionable offer is pending
  const talkDisabled =
    content.type === "offer" &&
    offerResult === null &&
    content.offer.canAccept(state);

  // --- Render content body ---

  let body = null;

  if (content.type === "counsel" || content.type === "story") {
    const label = content.type === "counsel" ? "Military Counsel" : "A War Story";
    body = (
      <SpeechBubble animKey={animKey}>
        <p
          className="text-xs uppercase tracking-wide mb-2"
          style={{ color: "#c44a4a", fontFamily: "Cinzel, serif" }}
        >
          {label}
        </p>
        <p
          className="text-sm sm:text-base leading-relaxed"
          style={{
            color: "#c8b090",
            fontFamily: "Crimson Text, serif",
            lineHeight: 1.8,
            letterSpacing: "0.3px",
          }}
        >
          <span style={{ color: "#c44a4a", fontSize: "1.3em", lineHeight: 1 }}>
            {"\u201C"}
          </span>
          {content.text}
          <span style={{ color: "#c44a4a", fontSize: "1.3em", lineHeight: 1 }}>
            {"\u201D"}
          </span>
        </p>
      </SpeechBubble>
    );
  } else if (content.type === "offer") {
    body = (
      <OfferCard
        offer={content.offer}
        state={state}
        offerResult={offerResult}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    );
  }

  // --- Layout ---

  return (
    <div
      className="rounded-lg border-2 p-4 sm:p-5 max-w-xl mx-auto"
      style={{
        backgroundColor: "#120808",
        borderColor: "var(--royal-red, #8b1a1a)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Header */}
      <h3
        className="text-center text-lg sm:text-xl font-bold mb-1"
        style={{ fontFamily: "Cinzel, serif", color: "#c44a4a" }}
      >
        Aldric One-Eye
      </h3>
      <p
        className="text-center text-xs italic mb-3"
        style={{ color: "#8a6a5a", fontFamily: "Crimson Text, serif" }}
      >
        Veteran of the Siege of Acre
      </p>

      {/* Portrait */}
      <AldricPortrait />

      {/* Intro line */}
      <p
        className="text-center italic text-sm mt-3 mb-1"
        style={{ color: "#8a7060", fontFamily: "Crimson Text, serif" }}
      >
        War teaches what books cannot. Sit. Listen.
      </p>

      {/* Scribe's Note (first visit only) */}
      {showScribesNote && (
        <div
          className="rounded-lg border p-3 mt-3 mb-2"
          style={{
            backgroundColor: "#1a2018",
            borderColor: "#4a6a3a",
          }}
        >
          <h4
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: "#8a9a6a", fontFamily: "Cinzel, serif" }}
          >
            Scribe{"'"}s Note
          </h4>
          <p
            className="text-xs leading-relaxed italic"
            style={{ color: "#a8a080", fontFamily: "Crimson Text, serif" }}
          >
            {ALDRIC_SCRIBES_NOTE}
          </p>
          <button
            onClick={handleDismissScribesNote}
            className="mt-2 px-3 py-1 rounded text-xs"
            style={{
              backgroundColor: "#2a3a1a",
              color: "#8a9a6a",
              border: "1px solid #4a6a3a",
              cursor: "pointer",
            }}
          >
            I understand
          </button>
        </div>
      )}

      {/* Decorative rule */}
      <div className="decorative-rule" style={{ color: "var(--royal-red, #8b1a1a)" }}>
        {"\u25C6"}
      </div>

      {/* Content */}
      {body}

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={reroll}
          disabled={talkDisabled}
          className="flex-1 px-4 py-3 rounded-md border-2 font-semibold text-sm min-h-[44px]"
          style={{
            backgroundColor: talkDisabled ? "#0a0505" : "#1a0e0e",
            borderColor: talkDisabled ? "#3a1010" : "var(--royal-red, #8b1a1a)",
            color: talkDisabled ? "#4a2020" : "#c44a4a",
            fontFamily: "Cinzel, serif",
            transition: "all 200ms ease",
            cursor: talkDisabled ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!talkDisabled) {
              e.currentTarget.style.backgroundColor = "#2a1010";
              e.currentTarget.style.borderColor = "#c44a4a";
            }
          }}
          onMouseLeave={(e) => {
            if (!talkDisabled) {
              e.currentTarget.style.backgroundColor = "#1a0e0e";
              e.currentTarget.style.borderColor = "var(--royal-red, #8b1a1a)";
            }
          }}
        >
          Talk Again
        </button>
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 rounded-md border-2 font-semibold text-sm min-h-[44px]"
          style={{
            backgroundColor: "#120808",
            borderColor: "#4a3030",
            color: "#8a6a5a",
            fontFamily: "Cinzel, serif",
            transition: "all 200ms ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a0e0e";
            e.currentTarget.style.borderColor = "#8a6a5a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#120808";
            e.currentTarget.style.borderColor = "#4a3030";
          }}
        >
          Leave
        </button>
      </div>
    </div>
  );
}
