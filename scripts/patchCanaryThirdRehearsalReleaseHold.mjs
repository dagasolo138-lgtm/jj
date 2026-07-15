import fs from "node:fs";

const path = "scripts/runCanaryThirdCampaignRehearsal.mjs";
let source = fs.readFileSync(path, "utf8");

const oldSafety = `    shadowModeRestored: control.activeMode === "shadow",\n    ratiosWithinLimits: allRatiosWithinLimits,\n    releaseGateReady: releaseGate.ready === true,\n    releaseGateHasNoBlockers: (releaseGate.blockers ?? []).length === 0,\n  };\n  assertCondition(\n    Object.values(hardSafety).every(Boolean),\n    \`Third campaign hard safety failed: \${JSON.stringify(hardSafety)}\`,\n  );`;
const newSafety = `    shadowModeRestored: control.activeMode === "shadow",\n  };\n  assertCondition(\n    Object.values(hardSafety).every(Boolean),\n    \`Third campaign operational safety failed: \${JSON.stringify(hardSafety)}\`,\n  );\n  const releaseReadiness = {\n    ratiosWithinLimits: allRatiosWithinLimits,\n    releaseGateReady: releaseGate.ready === true,\n    releaseGateHasNoBlockers: (releaseGate.blockers ?? []).length === 0,\n  };`;

if (!source.includes(oldSafety)) {
  throw new Error("Third rehearsal safety anchor not found");
}
source = source.replace(oldSafety, newSafety);

const oldReport = `    hardSafety,\n    recommendation,`;
const newReport = `    hardSafety,\n    releaseReadiness,\n    recommendation,`;
if (!source.includes(oldReport)) {
  throw new Error("Third rehearsal report anchor not found");
}
source = source.replace(oldReport, newReport);

fs.writeFileSync(path, source);
