import fs from "node:fs";

const patchPath = "scripts/applyCanaryTransactionPatch.mjs";
const source = fs.readFileSync(patchPath, "utf8");
const oldAnchor = `replaceOnce(\n  controlPath,\n  \`    version: 1,\`,\n  \`    version: 2,\`,\n  "initial control version",\n);`;
const newAnchor = `replaceOnce(\n  controlPath,\n  \`  return {\\n    version: 1,\\n    requestedMode,\`,\n  \`  return {\\n    version: 2,\\n    requestedMode,\`,\n  "initial control version",\n);`;
if (!source.includes(oldAnchor)) {
  throw new Error("Canary patch version anchor was not found");
}
fs.writeFileSync(patchPath, source.replace(oldAnchor, newAnchor));
await import(`./applyCanaryTransactionPatch.mjs?fixed=${Date.now()}`);
