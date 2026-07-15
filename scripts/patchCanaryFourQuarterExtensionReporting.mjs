import fs from "node:fs";

const path = "scripts/runCanaryFourQuarterExtensionRehearsal.mjs";
let source = fs.readFileSync(path, "utf8");

const oldSafety = `    extensionRollbackCountZero: extensionSummary?.rollbackCount === 0,\n    populationDriftZero: extensionRun.quarters.every(\n      (quarter) => finite(quarter.observation?.driftRatios?.population) === 0,\n    ),\n    writeBackClosedAfterExtension: finalControl.writeBackEnabled === false,`;
const newSafety = `    extensionRollbackCountZero: extensionSummary?.rollbackCount === 0,\n    writeBackClosedAfterExtension: finalControl.writeBackEnabled === false,`;
if (!source.includes(oldSafety)) throw new Error("Missing extension hard-safety anchor");
source = source.replace(oldSafety, newSafety);

const oldReadiness = `  const releaseReadiness = {\n    extensionWithinLimits,\n    postExtensionGateReady: postExtensionGate.ready === true,`;
const newReadiness = `  const populationDriftZero = extensionRun.quarters.every(\n    (quarter) => finite(quarter.observation?.driftRatios?.population) === 0,\n  );\n  const releaseReadiness = {\n    extensionWithinLimits,\n    populationDriftZero,\n    postExtensionGateReady: postExtensionGate.ready === true,`;
if (!source.includes(oldReadiness)) throw new Error("Missing extension release-readiness anchor");
source = source.replace(oldReadiness, newReadiness);

fs.writeFileSync(path, source, "utf8");
