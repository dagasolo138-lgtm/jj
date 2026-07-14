import fs from "node:fs";

const path = "src/engine/agentEconomy/priceBeliefSystem.js";
const source = fs.readFileSync(path, "utf8");
const search = `      direction: nextCenter > previousCenter + 0.01\n        ? "up"\n        : nextCenter < previousCenter - 0.01 ? "down" : "flat",`;
const replacement = `      direction: nextCenter - previousCenter >= 0.005\n        ? "up"\n        : previousCenter - nextCenter >= 0.005 ? "down" : "flat",`;
if (!source.includes(search)) throw new Error("Price event threshold anchor not found");
fs.writeFileSync(path, source.replace(search, replacement));
