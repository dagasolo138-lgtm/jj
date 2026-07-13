/**
 * TutorialHint.jsx
 *
 * Contextual hint banners shown during the first few turns to guide new players.
 * Disappears automatically after the relevant turn passes.
 */

const HINTS = {
  estate: [
    { maxTurn: 2, text: "Start by building a Strip Farm or Pasture — they produce food to keep your people alive and attract new settlers." },
    { maxTurn: 4, text: "Watch your Net income at the top. If it's negative, you're losing money each season. Build wisely!" },
  ],
  market: [
    { maxTurn: 4, text: "Visit merchant stalls to haggle for better prices, or use Quick Trade for instant deals at the posted rate." },
    { maxTurn: 6, text: "Your reputation with merchants grows as you trade. Higher reputation means better opening offers when haggling." },
  ],
  military: [
    { maxTurn: 6, text: "Recruit soldiers to defend your estate. Upgrade your castle and install defenses for lasting protection." },
    { maxTurn: 8, text: "Soldiers cost upkeep each season and eat food. Don't recruit more than you can afford to feed!" },
  ],
  people: [
    { maxTurn: 2, text: "Set your tax rate here. Higher taxes bring more gold in autumn, but families may leave if pushed too hard." },
    { maxTurn: 6, text: "Donate to the Church — the Church reciprocates with economic support and helps attract new settlers." },
  ],
  chronicle: [
    { maxTurn: 2, text: "This is the history of your reign. Every action, event, and season is recorded here." },
  ],
};

export default function TutorialHint({ tab, turn }) {
  const tabHints = HINTS[tab];
  if (!tabHints) return null;

  const activeHint = tabHints.find((h) => turn <= h.maxTurn);
  if (!activeHint) return null;

  return (
    <div
      className="rounded-md border p-3 mb-4 text-sm"
      style={{
        backgroundColor: "rgba(196, 162, 74, 0.08)",
        borderColor: "#8a7a3a",
        color: "#a89070",
      }}
    >
      <span className="font-heading font-bold uppercase text-xs tracking-wider mr-1.5" style={{ color: "#c4a24a" }}>
        {"\u2756"} Tip:
      </span>
      {activeHint.text}
    </div>
  );
}
