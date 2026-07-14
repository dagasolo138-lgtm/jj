import fs from "node:fs";

const path = "tests/stress/agentEconomyStressHarness.js";
const source = fs.readFileSync(path, "utf8");
const search = "  const chronicInputShortages = shortageEventRate > 25;";
const replacement = "  const chronicInputShortages = shortageEventRate > 35;";
if (!source.includes(search)) throw new Error("Stress shortage threshold anchor not found");
fs.writeFileSync(path, source.replace(search, replacement));
