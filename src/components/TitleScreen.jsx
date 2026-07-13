const DIFFICULTIES = [
  { key: "easy", label: "Easy", desc: "More resources, gentler penalties", icon: "\u2741" },
  { key: "normal", label: "Normal", desc: "The standard experience", icon: "\u2696" },
  { key: "hard", label: "Hard", desc: "Fewer resources, harsher realm", icon: "\u2620" },
];

export default function TitleScreen({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: "#0f0d0a" }}
    >
      <div
        className="w-full max-w-lg text-center rounded-lg border-2 p-6 sm:p-10"
        style={{
          backgroundColor: "#1a1610",
          borderColor: "#c4a24a",
          boxShadow: "0 8px 32px rgba(196, 162, 74, 0.15)",
        }}
      >
        <div className="text-5xl mb-4" style={{ color: "#c4a24a" }}>{"\u265B"}</div>
        <h1
          className="text-3xl sm:text-4xl font-bold mb-2"
          style={{
            fontFamily: "'Cinzel Decorative', Cinzel, serif",
            color: "#e8c44a",
            textShadow: "0 0 20px rgba(232, 196, 74, 0.3)",
          }}
        >
          The Lord's Ledger
        </h1>
        <p className="text-lg mb-1" style={{ color: "#a89070" }}>
          A Medieval Economic Simulation
        </p>
        <div className="flex items-center justify-center my-4 gap-2">
          <div className="flex-1 h-px" style={{ backgroundColor: "#c4a24a" }} />
          <span style={{ color: "#c4a24a", fontSize: "0.75rem" }}>{"\u25C6"}</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#c4a24a" }} />
        </div>
        <p className="text-base leading-relaxed mb-6" style={{ color: "#a89070" }}>
          The old lord has passed, and the estate is now yours. Manage your treasury,
          keep your people fed, defend your borders, and honor the Church — for ten
          years, through spring planting and winter storms, through raids and feasts
          and the quiet decisions that shape a reign.
        </p>
        <p className="text-sm mb-4" style={{ color: "#8a7a3a" }}>
          Every choice has consequences. There are no right answers — only trade-offs.
        </p>

        {/* How to Play */}
        <div
          className="rounded-md border p-4 mb-5 text-left"
          style={{ borderColor: "#6a5a42", backgroundColor: "#231e16" }}
        >
          <h3
            className="font-heading text-sm font-bold uppercase tracking-wider mb-2 text-center"
            style={{ color: "#c4a24a" }}
          >
            How to Play
          </h3>
          <ul className="text-sm space-y-1.5 list-none" style={{ color: "#a89070" }}>
            <li><strong>Goal:</strong> Survive 40 turns (10 years). Manage your resources wisely — if your population reaches 0 or you go bankrupt, you lose.</li>
            <li><strong>{"\u269C"} Denarii:</strong> Earn money by building, trading, and collecting taxes. Pay for buildings, soldiers, and upgrades.</li>
            <li><strong>{"\u2727"} Food:</strong> Keep your families fed. Build farms and buy grain to sustain your growing population.</li>
            <li><strong>{"\u2694"} Military:</strong> Recruit soldiers and upgrade your castle to defend against raids and protect your estate.</li>
            <li><strong>{"\u2302"} Population:</strong> Attract settlers with surplus food, ale, and fair taxes. More families means more labor and tax income.</li>
            <li><strong>Each turn:</strong> Build, trade, and manage your estate, then click <em>Simulate Season</em> to advance. Events will challenge you — choose wisely!</li>
          </ul>
        </div>

        <p
          className="text-sm font-heading font-semibold uppercase tracking-wider mb-3"
          style={{ color: "#a89070" }}
        >
          Choose Your Challenge
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              onClick={() => onStart(d.key)}
              className="flex-1 px-4 py-3 rounded-md border-2 font-heading font-bold text-base uppercase tracking-wider cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #8b1a1a, #c62828)",
                borderColor: "#c4a24a",
                color: "#e8c44a",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #a02020, #e03030)";
                e.currentTarget.style.textShadow = "0 0 10px rgba(232, 196, 74, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #8b1a1a, #c62828)";
                e.currentTarget.style.textShadow = "none";
              }}
            >
              <span className="block text-lg mb-0.5">{d.icon}</span>
              <span className="block">{d.label}</span>
              <span
                className="block text-xs font-normal normal-case tracking-normal mt-0.5"
                style={{ color: "#a89070" }}
              >
                {d.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-6 text-xs" style={{ color: "#8a7a3a" }}>
        A game about medieval economics, trade-offs, and the weight of a crown.
      </p>
    </div>
  );
}
