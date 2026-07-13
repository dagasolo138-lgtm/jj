export default function ScribesNote({ text, onDismiss }) {
  if (!text) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className="w-full max-w-md rounded-lg border-2 p-5 shadow-2xl"
        style={{
          backgroundColor: "#1a1610",
          borderColor: "#c4a24a",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl" style={{ color: "#c4a24a" }}>{"\u273D"}</span>
          <h4
            className="font-heading text-lg font-bold"
            style={{ color: "#c4a24a", fontFamily: "Cinzel, serif" }}
          >
            Scribe's Note
          </h4>
        </div>
        <p className="text-base leading-relaxed mb-4" style={{ color: "#a89070" }}>
          {text}
        </p>
        <button
          onClick={onDismiss}
          className="w-full py-2 rounded-md border-2 font-heading font-semibold text-sm uppercase tracking-wider cursor-pointer transition-colors duration-200"
          style={{
            backgroundColor: "#2a2318",
            borderColor: "#c4a24a",
            color: "#c4a24a",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#3a3228";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2318";
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
