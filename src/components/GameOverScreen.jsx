import { failureNarratives } from "../data/endings";

export default function GameOverScreen({ gameOverReason, causeChain, state, onPlayAgain }) {
  if (!gameOverReason) return null;

  const narrative = failureNarratives[gameOverReason.type];
  if (!narrative) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-6"
      style={{ backgroundColor: "#0f0d0a" }}
      data-gameover-reason={gameOverReason.type}
    >
      <div
        className="w-full max-w-xl rounded-lg border-2 p-5 sm:p-8 shadow-2xl"
        style={{
          backgroundColor: "#1a1610",
          borderColor: "#8b1a1a",
          boxShadow: "0 8px 32px rgba(139, 26, 26, 0.3)",
        }}
      >
        <div className="text-center mb-4">
          <div className="text-4xl mb-2" style={{ color: "#c62828" }}>{"\u2620"}</div>
          <h2
            className="font-heading text-2xl sm:text-3xl font-bold"
            style={{ color: "#c62828" }}
          >
            {narrative.title}
          </h2>
          <p className="text-base font-semibold mt-1" style={{ color: "#a89070" }}>
            {narrative.headline}
          </p>
        </div>

        <div
          className="w-12 h-0.5 mx-auto my-4"
          style={{ backgroundColor: "#8b1a1a" }}
        />

        <p className="text-base leading-relaxed mb-5" style={{ color: "#a89070" }}>
          {narrative.narrative}
        </p>

        {/* Chronicle of Ruin - Causal Chain */}
        {causeChain && causeChain.length > 0 && (
          <div
            className="rounded-md border-2 p-4 mb-5"
            style={{ borderColor: "#8b1a1a", backgroundColor: "#231e16" }}
          >
            <h3
              className="font-heading text-base font-bold uppercase tracking-wider mb-3"
              style={{ color: "#c62828" }}
            >
              {"\u2620"} Chronicle of Ruin
            </h3>
            <div className="flex flex-col gap-2">
              {causeChain.map((entry, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ backgroundColor: "#8b1a1a", color: "#faf3e3" }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <span className="text-xs font-semibold" style={{ color: "#c4a24a" }}>
                      Y{entry.year} {entry.season?.charAt(0).toUpperCase() + entry.season?.slice(1)}
                    </span>
                    <p className="text-sm leading-snug" style={{ color: "#a89070" }}>
                      {entry.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historian's Lesson */}
        <div
          className="rounded-md border p-4 mb-5"
          style={{ borderColor: "#c4a24a", backgroundColor: "#231e16" }}
        >
          <h4
            className="font-heading text-sm font-bold uppercase tracking-wider mb-2"
            style={{ color: "#c4a24a" }}
          >
            Historian's Lesson
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: "#a89070" }}>
            {narrative.historianLesson}
          </p>
        </div>

        {/* Final resource values */}
        {state && (
          <div className="grid grid-cols-4 gap-2 mb-5 text-center text-sm">
            {[
              { key: "denarii", label: "Denarii", icon: "\u269C", value: `${state.denarii || 0}d` },
              { key: "food", label: "Food", icon: "\u2727", value: state.food || 0 },
              { key: "population", label: "Families", icon: "\u2302", value: state.population || 0 },
              { key: "garrison", label: "Garrison", icon: "\u2694", value: state.garrison || 0 },
            ].map((r) => (
              <div key={r.key} className="py-2 rounded-md border" style={{ borderColor: "#6a5a42", backgroundColor: "#231e16" }}>
                <div className="text-lg mb-0.5" style={{ color: "#c4a24a" }}>{r.icon}</div>
                <div className="font-heading font-semibold uppercase" style={{ color: "#6a5a42" }}>
                  {r.label}
                </div>
                <div className="text-lg font-bold" style={{ color: "#e8c44a" }}>
                  {r.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onPlayAgain}
          className="w-full py-3 rounded-md border-2 font-heading font-bold text-base uppercase tracking-wider cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #8b1a1a, #c62828)",
            borderColor: "#c4a24a",
            color: "#e8c44a",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #a02020, #d63030)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #8b1a1a, #c62828)";
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
