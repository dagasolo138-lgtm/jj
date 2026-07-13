import { translateIndicators } from "../engine/meterUtils";

const INDICATOR_LABELS = {
  denarii: "\u269C",
  food: "\u2727",
  population: "\u2302",
  garrison: "\u2694",
};

function IndicatorPills({ indicators }) {
  if (!indicators) return null;
  const translated = translateIndicators(indicators);
  if (!translated) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {Object.entries(translated).map(([resource, dir]) => (
        <span
          key={resource}
          className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border"
          style={{
            borderColor: dir === "up" ? "#4a8a3a" : "#c62828",
            backgroundColor:
              dir === "up"
                ? "rgba(74, 138, 58, 0.15)"
                : "rgba(198, 40, 40, 0.15)",
            color: dir === "up" ? "#4a8a3a" : "#c62828",
          }}
        >
          {INDICATOR_LABELS[resource] || resource}
          {dir === "up" ? " \u2191" : " \u2193"}
        </span>
      ))}
    </div>
  );
}

export default function EventCard({ event, onChoose, phaseLabel }) {
  if (!event || !event.options) return null;

  return (
    <div
      className="mx-auto w-full max-w-xl rounded-lg border-2 p-4 sm:p-5 shadow-lg"
      style={{
        backgroundColor: "#231e16",
        borderColor: "#8a7a3a",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      {phaseLabel && (
        <div
          className="text-xs uppercase tracking-widest font-heading font-semibold mb-2"
          style={{ color: "#c4a24a" }}
        >
          {phaseLabel}
        </div>
      )}
      <h3
        className="font-heading text-lg sm:text-xl font-bold mb-2"
        style={{ fontFamily: "Cinzel, serif", color: "#e8c44a" }}
      >
        {event.title}
      </h3>
      <p className="text-base leading-relaxed mb-4" style={{ color: "#a89070" }}>
        {event.description}
      </p>
      <div className="flex flex-col gap-2" role="group" aria-label="Choose your response">
        {event.options.map((option, i) => (
          <button
            key={i}
            onClick={() => onChoose(i)}
            className="w-full text-left px-4 py-4 rounded-md border-2 cursor-pointer min-h-[44px]"
            style={{
              backgroundColor: "#1a1610",
              borderColor: "#6a5a42",
              color: "#c8b090",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2a2318";
              e.currentTarget.style.borderColor = "#c4a24a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1a1610";
              e.currentTarget.style.borderColor = "#6a5a42";
            }}
            aria-label={`Option ${i + 1}: ${option.text}`}
          >
            <div className="font-semibold text-base">{option.text}</div>
            <IndicatorPills indicators={option.indicators} />
          </button>
        ))}
      </div>
    </div>
  );
}
