import fs from "node:fs";

function replaceOnce(path, search, replacement, label) {
  const source = fs.readFileSync(path, "utf8");
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Ambiguous patch anchor: ${label}`);
  }
  fs.writeFileSync(path, source.replace(search, replacement));
}

const livePath = "src/engine/agentEconomy/liveStateAdapter.js";
replaceOnce(
  livePath,
  `function cloneInventory(inventory = {}) {`,
  `function cloneGameOverReason(value) {\n  if (typeof value === "string") return value;\n  if (value && typeof value === "object") return JSON.parse(JSON.stringify(value));\n  return null;\n}\n\nfunction cloneInventory(inventory = {}) {`,
  "live game-over clone helper",
);
replaceOnce(
  livePath,
  `    gameOverReason: typeof state.gameOverReason === "string" ? state.gameOverReason : null,`,
  `    gameOverReason: cloneGameOverReason(state.gameOverReason),`,
  "legacy snapshot game-over reason",
);
replaceOnce(
  livePath,
  `      gameOverReason: typeof source.outcome?.gameOverReason === "string"\n        ? source.outcome.gameOverReason\n        : null,`,
  `      gameOverReason: cloneGameOverReason(\n        source.outcome?.gameOverReason ?? snapshot.gameOverReason,\n      ),`,
  "normalized outcome game-over reason",
);

const canaryPath = "src/engine/agentEconomy/canaryTransactionSystem.js";
replaceOnce(
  canaryPath,
  `function clone(value) {\n  return JSON.parse(JSON.stringify(value ?? null));\n}`,
  `function clone(value) {\n  return JSON.parse(JSON.stringify(value ?? null));\n}\n\nfunction cloneGameOverReason(value) {\n  if (typeof value === "string") return value;\n  if (value && typeof value === "object") return clone(value);\n  return null;\n}\n\nfunction gameOverSignature(value) {\n  if (value == null) return "none";\n  if (typeof value === "string") return `string:${value}`;\n  if (typeof value === "object") {\n    return `object:${value.type ?? "unknown"}:${value.reason ?? ""}`;\n  }\n  return `${typeof value}:${String(value)}`;\n}`,
  "canary game-over helpers",
);
replaceOnce(
  canaryPath,
  `    gameOverReason: typeof state.gameOverReason === "string" ? state.gameOverReason : null,`,
  `    gameOverReason: cloneGameOverReason(state.gameOverReason),`,
  "canary checkpoint game-over reason",
);
replaceOnce(
  canaryPath,
  `  const legacyGameOver = typeof legacyState?.gameOverReason === "string"\n    ? legacyState.gameOverReason\n    : null;\n  if ((candidateGameOver ?? null) !== legacyGameOver) {\n    issues.push(`outcome-mismatch:${legacyGameOver ?? "none"}->${candidateGameOver ?? "none"}`);\n  }`,
  `  const legacyGameOver = cloneGameOverReason(legacyState?.gameOverReason);\n  if (gameOverSignature(candidateGameOver) !== gameOverSignature(legacyGameOver)) {\n    issues.push(\n      `outcome-mismatch:${gameOverSignature(legacyGameOver)}->${gameOverSignature(candidateGameOver)}`,\n    );\n  }`,
  "canary outcome comparison",
);
replaceOnce(
  canaryPath,
  `  if ((projectedState.gameOverReason ?? null) !== legacyGameOver) {\n    issues.push("projected-game-over-mismatch");\n  }`,
  `  if (gameOverSignature(projectedState.gameOverReason) !== gameOverSignature(legacyGameOver)) {\n    issues.push("projected-game-over-mismatch");\n  }`,
  "projected outcome comparison",
);
replaceOnce(
  canaryPath,
  `    candidateGameOver: candidateGameOver ?? null,`,
  `    candidateGameOver: cloneGameOverReason(candidateGameOver),`,
  "validated candidate outcome",
);
