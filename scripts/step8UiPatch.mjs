import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  const index = source.indexOf(search);
  if (index < 0) throw new Error(`Patch anchor not found: ${label}`);
  if (source.indexOf(search, index + search.length) >= 0) {
    throw new Error(`Patch anchor is ambiguous: ${label}`);
  }
  return source.replace(search, replacement);
}

function patchApp() {
  const path = "src/App.jsx";
  let source = fs.readFileSync(path, "utf8");

  source = replaceOnce(
    source,
    'const BlacksmithTab = lazy(() => import("./components/BlacksmithTab"));',
    'const BlacksmithTab = lazy(() => import("./components/BlacksmithTab"));\nconst EconomyMonitorTab = lazy(() => import("./components/EconomyMonitorTab"));',
    "App lazy monitor import",
  );

  source = replaceOnce(
    source,
    `        {/* --- MILITARY TAB --- */}\n        {!isFlipPhase && displayTab === "military" && isManagement && (`,
    `        {/* --- ECONOMY MONITOR TAB --- */}\n        {!isFlipPhase && displayTab === "economy" && isManagement && (\n          <Suspense fallback={<TabLoadingFallback />}>\n            <EconomyMonitorTab state={state} dispatch={dispatch} />\n          </Suspense>\n        )}\n\n        {/* --- MILITARY TAB --- */}\n        {!isFlipPhase && displayTab === "military" && isManagement && (`,
    "App economy tab render",
  );

  fs.writeFileSync(path, source);
}

function patchTutorialPopup() {
  const path = "src/components/TutorialPopup.jsx";
  let source = fs.readFileSync(path, "utf8");

  source = replaceOnce(
    source,
    `  Landmark, Map, Store, Shield, Users,\n  Scale, Church, Hammer, ScrollText,`,
    `  Activity, Landmark, Map, Store, Shield, Users,\n  Scale, Church, Hammer, ScrollText,`,
    "Tutorial icon import",
  );

  source = replaceOnce(
    source,
    `  market: Store,\n  military: Shield,`,
    `  market: Store,\n  economy: Activity,\n  military: Shield,`,
    "Tutorial icon map",
  );

  source = replaceOnce(
    source,
    `  military: {\n    title: "The Military",`,
    `  economy: {\n    title: "Economy Monitor",\n    subtitle: "Households, Prices & Safety",\n    sections: [\n      {\n        heading: "Household Economy",\n        text: "Track employment, poverty, food stress, health and satisfaction across the households represented by the new economy simulation.",\n      },\n      {\n        heading: "Prices & Production",\n        text: "See supply pressure, price trends, production chains, worker coverage and the exact reason a building is constrained or idle.",\n      },\n      {\n        heading: "Dual-Engine Safety",\n        text: "Compare the household simulation with the legacy economy. Accounting errors or unsafe state automatically block promotion and preserve the legacy result.",\n      },\n    ],\n    tip: "Keep Shadow Compare active while the new economy is being validated. Canary mode remains blocked until every official-state adapter is ready.",\n  },\n\n  military: {\n    title: "The Military",`,
    "Tutorial economy section",
  );

  fs.writeFileSync(path, source);
}

function patchTutorialHint() {
  const path = "src/components/TutorialHint.jsx";
  let source = fs.readFileSync(path, "utf8");

  source = replaceOnce(
    source,
    `  military: [\n    { maxTurn: 6, text: "Recruit soldiers to defend your estate. Upgrade your castle and install defenses for lasting protection." },`,
    `  economy: [\n    { maxTurn: 4, text: "Simulate a season first, then inspect prices, worker coverage and any production-chain bottlenecks here." },\n    { maxTurn: 8, text: "Shadow Compare is the safe default. Canary requests stay blocked until all official game-state adapters are complete." },\n  ],\n  military: [\n    { maxTurn: 6, text: "Recruit soldiers to defend your estate. Upgrade your castle and install defenses for lasting protection." },`,
    "Tutorial hint economy section",
  );

  fs.writeFileSync(path, source);
}

patchApp();
patchTutorialPopup();
patchTutorialHint();
