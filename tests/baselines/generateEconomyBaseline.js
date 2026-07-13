import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runAllEconomyBaselines } from "./economyScenarios.js";

const outputUrl = new URL("./economy-v1.json", import.meta.url);
const outputPath = fileURLToPath(outputUrl);

await mkdir(path.dirname(outputPath), { recursive: true });

const baseline = {
  schemaVersion: 1,
  engine: "legacy-seasonal-economy",
  turnsPerScenario: 40,
  notes: "Captured before the Autarky2 agent-economy migration. Update only after an intentional balance change.",
  scenarios: runAllEconomyBaselines(40),
};

await writeFile(outputPath, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
console.log(`Wrote economy baseline to ${outputPath}`);
