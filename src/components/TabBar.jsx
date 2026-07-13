/**
 * TabBar.jsx
 *
 * Horizontal tab navigation with a Royal Dark theme.
 * All tabs unlocked from turn 1 in the resource-based system.
 */

import { Landmark, Map, Store, Shield, Users, ScrollText, Scale, Church, Hammer } from "lucide-react";
import { TAB_CONFIG as TAB_LABELS } from "./tabConfig.js";

// Re-export the plain tab list for any JSX consumers that want it from here.
export { TAB_CONFIG } from "./tabConfig.js";

const TAB_ICONS = {
  estate: Landmark,
  map: Map,
  market: Store,
  military: Shield,
  people: Users,
  hall: Scale,
  chapel: Church,
  forge: Hammer,
  chronicle: ScrollText,
};

const TABS = TAB_LABELS.map((t) => ({ ...t, Icon: TAB_ICONS[t.id] }));

export default function TabBar({ activeTab, onSetTab, disabled }) {
  return (
    <div
      className="w-full flex overflow-x-auto"
      style={{ backgroundColor: "#0f0d0a" }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = disabled;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onSetTab(tab.id)}
            disabled={isDisabled}
            title={tab.label}
            className="tab-button flex-1 min-w-0 px-2 py-3 text-center border-b-2 group"
            style={{
              backgroundColor: isActive ? "#231e16" : "transparent",
              borderBottomColor: isActive ? "#c4a24a" : "transparent",
              color: isActive ? "#c4a24a" : "#6a5a42",
              boxShadow: isActive
                ? "0 -2px 8px rgba(196, 162, 74, 0.15)"
                : "none",
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
              transition: "all 200ms ease",
              fontFamily: "Cinzel, serif",
            }}
            onMouseEnter={(e) => {
              if (isDisabled || isActive) return;
              e.currentTarget.style.backgroundColor = "#231e16";
              e.currentTarget.style.color = "#c8b090";
              e.currentTarget.style.borderBottomColor = "rgba(196, 162, 74, 0.4)";
            }}
            onMouseLeave={(e) => {
              if (isDisabled || isActive) return;
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#6a5a42";
              e.currentTarget.style.borderBottomColor = "transparent";
            }}
            aria-label={`${tab.label} tab${isActive ? " (active)" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <tab.Icon size={16} className="inline-block" style={{ color: "inherit" }} />
            <span className="hidden sm:inline text-sm font-semibold uppercase tracking-wide ml-1">
              {tab.label}
            </span>
            <span className="sm:hidden text-xs font-semibold uppercase tracking-wide block">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
