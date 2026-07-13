/**
 * MartaMerchant.jsx
 *
 * Marta of Cologne — Femme Sole, Licensed Trader.
 * Interactive tavern NPC that teaches medieval commerce through
 * market tips, trade stories, and one-time deal offers.
 *
 * Rendered as a sub-view within the Tavern overlay.
 */

import { useState, useRef } from "react";
import {
  MARTA_MARKET_TIPS,
  MARTA_TRADE_STORIES,
  MARTA_OFFERS,
  MARTA_SCRIBES_NOTE,
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
        backgroundColor: "#1a2a2a",
        borderColor: "#1a5a5a",
        boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      {children}
    </div>
  );
}

function MartaPortrait() {
  return (
    <div
      className="flex items-center justify-center rounded-lg border-2 mx-auto"
      style={{
        width: 80,
        height: 80,
        borderColor: "#1a5a5a",
        backgroundColor: "#0e1a1a",
        boxShadow: "0 0 12px rgba(26, 90, 90, 0.3)",
      }}
    >
      <span
        style={{
          fontSize: 36,
          color: "#3a9a8a",
          fontFamily: "serif",
          lineHeight: 1,
        }}
      >
        {"\u2696"}
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
        backgroundColor: "#0e1a1a",
        borderColor: "#1a5a5a",
      }}
    >
      <h4
        className="text-sm font-bold uppercase tracking-wide mb-2"
        style={{ fontFamily: "Cinzel, serif", color: "#3a9a8a" }}
      >
        {offer.title}
      </h4>
      <p
        className="text-sm leading-relaxed mb-3"
        style={{ color: "#c8b090", fontFamily: "Crimson Text, serif" }}
      >
        <span style={{ color: "#3a9a8a", fontSize: "1.2em" }}>{"\u201C"}</span>
        {offer.description}
        {offer.warning && (
          <span className="block mt-1 italic" style={{ color: "#a89070" }}>
            {offer.warning}
          </span>
        )}
        <span style={{ color: "#3a9a8a", fontSize: "1.2em" }}>{"\u201D"}</span>
      </p>

      {/* Cost / Reward breakdown */}
      <div
        className="flex gap-4 mb-3 text-xs"
        style={{ fontFamily: "Crimson Text, serif" }}
      >
        <div>
          <span style={{ color: "#8a7a5a" }}>Cost: </span>
          <span style={{ color: "#e57373" }}>{offer.costText}</span>
        </div>
        <div>
          <span style={{ color: "#8a7a5a" }}>Reward: </span>
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
            ? "The deal is struck."
            : "Perhaps another time."}
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
              background: "linear-gradient(135deg, #1a5a5a 0%, #0e3a3a 50%, #1a5a5a 100%)",
              color: "#e8c44a",
              border: "1px solid #2a7a6a",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #2a7a6a 0%, #1a5a5a 50%, #2a7a6a 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #1a5a5a 0%, #0e3a3a 50%, #1a5a5a 100%)";
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

export default function MartaMerchant({ state, onAcceptOffer, onDeclineOffer, onScribesNoteSeen, onBack }) {
  const tavern = state.tavern ?? {};
  const martaOffersUsed = tavern.martaOffersUsed ?? [];
  const scribesNoteSeen = tavern.martaScribesNoteSeen ?? false;

  const availableOffers = MARTA_OFFERS.filter(
    (o) => !martaOffersUsed.includes(o.id)
  );

  // Shuffled queues for cycling without repeats
  const tipQueue = useRef(createQueue(MARTA_MARKET_TIPS.length));
  const tipIndex = useRef(0);
  const storyQueue = useRef(createQueue(MARTA_TRADE_STORIES.length));
  const storyIndex = useRef(0);

  const [animKey, setAnimKey] = useState(0);
  const [showScribesNote, setShowScribesNote] = useState(!scribesNoteSeen);
  const [offerResult, setOfferResult] = useState(null);

  function getNextTip() {
    if (tipIndex.current >= tipQueue.current.length) {
      tipQueue.current = createQueue(MARTA_MARKET_TIPS.length);
      tipIndex.current = 0;
    }
    const idx = tipQueue.current[tipIndex.current++];
    const raw = MARTA_MARKET_TIPS[idx];
    return { type: "tip", text: typeof raw === "function" ? raw(state) : raw };
  }

  function getNextStory() {
    if (storyIndex.current >= storyQueue.current.length) {
      storyQueue.current = createQueue(MARTA_TRADE_STORIES.length);
      storyIndex.current = 0;
    }
    const idx = storyQueue.current[storyIndex.current++];
    return { type: "story", text: MARTA_TRADE_STORIES[idx] };
  }

  function makeContent() {
    const roll = Math.random();
    if (availableOffers.length > 0 && roll < 0.25) {
      const offer = availableOffers[Math.floor(Math.random() * availableOffers.length)];
      return { type: "offer", offer };
    }
    if (roll < 0.60) return getNextTip();
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
      const idx = Math.floor(Math.random() * MARTA_MARKET_TIPS.length);
      const raw = MARTA_MARKET_TIPS[idx];
      return { type: "tip", text: typeof raw === "function" ? raw(state) : raw };
    }
    const idx = Math.floor(Math.random() * MARTA_TRADE_STORIES.length);
    return { type: "story", text: MARTA_TRADE_STORIES[idx] };
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

  if (content.type === "tip" || content.type === "story") {
    const label = content.type === "tip" ? "Market Intelligence" : "A Trade Story";
    body = (
      <SpeechBubble animKey={animKey}>
        <p
          className="text-xs uppercase tracking-wide mb-2"
          style={{ color: "#3a9a8a", fontFamily: "Cinzel, serif" }}
        >
          {label}
        </p>
        <p
          className="text-sm sm:text-base leading-relaxed"
          style={{ color: "#c8b090", fontFamily: "Crimson Text, serif" }}
        >
          <span style={{ color: "#3a9a8a", fontSize: "1.3em", lineHeight: 1 }}>
            {"\u201C"}
          </span>
          {content.text}
          <span style={{ color: "#3a9a8a", fontSize: "1.3em", lineHeight: 1 }}>
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
        backgroundColor: "#0e1a1a",
        borderColor: "#1a5a5a",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Header */}
      <h3
        className="text-center text-lg sm:text-xl font-bold mb-1"
        style={{ fontFamily: "Cinzel, serif", color: "#3a9a8a" }}
      >
        Marta of Cologne
      </h3>
      <p
        className="text-center text-xs italic mb-3"
        style={{ color: "#6a8a7a", fontFamily: "Crimson Text, serif" }}
      >
        Femme Sole &mdash; Licensed Trader
      </p>

      {/* Portrait */}
      <MartaPortrait />

      {/* Intro line */}
      <p
        className="text-center italic text-sm mt-3 mb-1"
        style={{ color: "#a89070", fontFamily: "Crimson Text, serif" }}
      >
        Information has value, my lord. I deal in both.
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
            {MARTA_SCRIBES_NOTE}
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
      <div className="decorative-rule" style={{ color: "#1a5a5a" }}>
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
            backgroundColor: talkDisabled ? "#0a1010" : "#0e2020",
            borderColor: talkDisabled ? "#1a3030" : "#1a5a5a",
            color: talkDisabled ? "#2a4a4a" : "#3a9a8a",
            fontFamily: "Cinzel, serif",
            transition: "all 200ms ease",
            cursor: talkDisabled ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!talkDisabled) {
              e.currentTarget.style.backgroundColor = "#1a3030";
              e.currentTarget.style.borderColor = "#2a7a6a";
            }
          }}
          onMouseLeave={(e) => {
            if (!talkDisabled) {
              e.currentTarget.style.backgroundColor = "#0e2020";
              e.currentTarget.style.borderColor = "#1a5a5a";
            }
          }}
        >
          Talk Again
        </button>
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 rounded-md border-2 font-semibold text-sm min-h-[44px]"
          style={{
            backgroundColor: "#0e1a1a",
            borderColor: "#3a4a4a",
            color: "#6a8a7a",
            fontFamily: "Cinzel, serif",
            transition: "all 200ms ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a2a2a";
            e.currentTarget.style.borderColor = "#6a8a7a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#0e1a1a";
            e.currentTarget.style.borderColor = "#3a4a4a";
          }}
        >
          Leave
        </button>
      </div>
    </div>
  );
}
