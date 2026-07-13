/**
 * Plain-JS tab configuration shared between TabBar.jsx and E2E specs.
 *
 * Kept in a separate .js file (no JSX, no React imports) so test specs
 * can import it from Node without a Vite/JSX transform.
 *
 * TabBar.jsx pairs each entry with its lucide-react Icon.
 */
export const TAB_CONFIG = [
  { id: "estate",    label: "Estate" },
  { id: "map",       label: "Map" },
  { id: "market",    label: "Market" },
  { id: "military",  label: "Military" },
  { id: "people",    label: "People" },
  { id: "hall",      label: "Hall" },
  { id: "chapel",    label: "Chapel" },
  { id: "forge",     label: "Forge" },
  { id: "chronicle", label: "Chronicle" },
];
