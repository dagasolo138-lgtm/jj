/**
 * SynergyToast.jsx
 *
 * Three-tier notification system for synergy unlocks.
 * Tier 1: small toast at bottom. Tier 2: slide-in card from right. Tier 3: full overlay.
 */

import { useState, useEffect, useRef } from "react";

function Tier1Toast({ notification, onDismiss }) {
  const [opacity, setOpacity] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  useEffect(() => {
    // Fade in
    const fadeInTimer = setTimeout(() => setOpacity(1), 50);
    // Auto-dismiss after 5s
    const dismissTimer = setTimeout(() => {
      setOpacity(0);
      setDismissed(true);
      setTimeout(() => onDismissRef.current(), 400);
    }, 5000);
    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    setOpacity(0);
    setDismissed(true);
    setTimeout(onDismiss, 400);
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex justify-center max-w-sm w-full"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="px-5 py-3 rounded-lg border-2 shadow-lg flex items-center gap-3 cursor-pointer"
        style={{
          backgroundColor: "#1a1610",
          borderColor: "#c4a24a",
          boxShadow: "0 4px 16px rgba(196, 162, 74, 0.3)",
          opacity,
          transition: "opacity 0.4s ease",
          pointerEvents: opacity < 0.1 ? "none" : "auto",
        }}
        onClick={dismiss}
        role="status"
        aria-live="polite"
      >
        <span className="text-2xl">{notification.pathIcon}</span>
        <div>
          <p
            className="font-heading font-bold text-sm uppercase tracking-wider"
            style={{ color: "#c4a24a" }}
          >
            Path Unlocked
          </p>
          <p className="text-sm font-semibold" style={{ color: "#e8c44a" }}>
            {notification.title}
          </p>
        </div>
      </div>
    </div>
  );
}

function Tier2Card({ notification, onDismiss }) {
  const [translateX, setTranslateX] = useState("100%");
  const onDismissRef = useRef(onDismiss);

  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  useEffect(() => {
    const slideTimer = setTimeout(() => setTranslateX("0"), 50);
    // Auto-dismiss after 10s
    const dismissTimer = setTimeout(() => {
      setTranslateX("100%");
      setTimeout(() => onDismissRef.current(), 400);
    }, 10000);
    return () => {
      clearTimeout(slideTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-20 w-72"
      style={{ pointerEvents: "none" }}
    >
    <div
      className="rounded-lg border-2 shadow-xl overflow-hidden cursor-pointer"
      style={{
        backgroundColor: "#1a1610",
        borderColor: notification.pathColor || "#c4a24a",
        boxShadow: `0 8px 24px rgba(0,0,0,0.2)`,
        transform: `translateX(${translateX})`,
        transition: "transform 0.4s ease-out",
        pointerEvents: "auto",
      }}
      onClick={onDismiss}
      role="status"
      aria-live="polite"
    >
      {/* Accent bar */}
      <div className="h-1.5" style={{ backgroundColor: notification.pathColor || "#c4a24a" }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">{notification.pathIcon}</span>
          <div>
            <p
              className="font-heading text-xs font-semibold uppercase tracking-wider"
              style={{ color: notification.pathColor || "#c4a24a" }}
            >
              {notification.pathName}
            </p>
            <p
              className="font-heading font-bold text-base"
              style={{ color: "#e8c44a" }}
            >
              {notification.title}
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#a89070" }}>
          {notification.description}
        </p>
        <p className="text-xs mt-3 italic" style={{ color: "#8a7a3a" }}>
          Tap to dismiss
        </p>
      </div>
    </div>
    </div>
  );
}

function Tier3Overlay({ notification, onDismiss }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        backgroundColor: `rgba(0,0,0,${0.6 * opacity})`,
        transition: "background-color 0.5s ease",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Strategy path mastered"
    >
      <div
        className="w-full max-w-md rounded-lg border-2 overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "#0f0d0a",
          borderColor: "#c4a24a",
          opacity,
          transform: `scale(${0.9 + 0.1 * opacity})`,
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Header */}
        <div className="text-center pt-6 pb-3 px-4">
          <span className="text-5xl block mb-2">{notification.pathIcon}</span>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3].map((s) => (
              <span key={s} className="text-lg" style={{ color: "#c4a24a" }}>
                {"\u2605"}
              </span>
            ))}
          </div>
          <p
            className="font-heading text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "#c4a24a" }}
          >
            Strategy Path Mastered
          </p>
          <h2
            className="font-heading text-2xl sm:text-3xl font-bold"
            style={{ color: "#c4a24a" }}
          >
            {notification.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed text-center mb-4" style={{ color: "#a89070" }}>
            {notification.description}
          </p>

          {/* Scribe's Note */}
          {notification.scribesNote && (
            <div
              className="rounded-md border p-3 mb-4"
              style={{ borderColor: "#6a5a42", backgroundColor: "#1a1610" }}
            >
              <p
                className="font-heading text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "#c4a24a" }}
              >
                Scribe&apos;s Note
              </p>
              <p className="text-xs leading-relaxed italic" style={{ color: "#8a7a3a" }}>
                {notification.scribesNote}
              </p>
            </div>
          )}

          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-md border-2 font-heading font-bold text-sm uppercase tracking-wider cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: "#c4a24a",
              borderColor: "#8a7a3a",
              color: "#0f0d0a",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e8c44a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#c4a24a"; }}
          >
            Continue Your Reign
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SynergyToast({ notification, onDismiss }) {
  if (!notification) return null;

  if (notification.tier === 3) {
    return <Tier3Overlay notification={notification} onDismiss={onDismiss} />;
  }
  if (notification.tier === 2) {
    return <Tier2Card notification={notification} onDismiss={onDismiss} />;
  }
  return <Tier1Toast notification={notification} onDismiss={onDismiss} />;
}
