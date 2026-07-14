import fs from "node:fs";

function replaceOnce(path, search, replacement, label) {
  const source = fs.readFileSync(path, "utf8");
  const first = source.indexOf(search);
  if (first < 0) throw new Error("Missing patch anchor: " + label);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error("Ambiguous patch anchor: " + label);
  }
  fs.writeFileSync(path, source.replace(search, replacement));
}

const livePath = "src/engine/agentEconomy/liveStateAdapter.js";
replaceOnce(
  livePath,
  "function cloneInventory(inventory = {}) {",
  [
    "function cloneGameOverReason(value) {",
    "  if (typeof value === \"string\") return value;",
    "  if (value && typeof value === \"object\") return JSON.parse(JSON.stringify(value));",
    "  return null;",
    "}",
    "",
    "function cloneInventory(inventory = {}) {",
  ].join("\n"),
  "live game-over clone helper",
);
replaceOnce(
  livePath,
  "    gameOverReason: typeof state.gameOverReason === \"string\" ? state.gameOverReason : null,",
  "    gameOverReason: cloneGameOverReason(state.gameOverReason),",
  "legacy snapshot game-over reason",
);
replaceOnce(
  livePath,
  [
    "      gameOverReason: typeof source.outcome?.gameOverReason === \"string\"",
    "        ? source.outcome.gameOverReason",
    "        : null,",
  ].join("\n"),
  [
    "      gameOverReason: cloneGameOverReason(",
    "        source.outcome?.gameOverReason ?? snapshot.gameOverReason,",
    "      ),",
  ].join("\n"),
  "normalized outcome game-over reason",
);

const canaryPath = "src/engine/agentEconomy/canaryTransactionSystem.js";
replaceOnce(
  canaryPath,
  [
    "function clone(value) {",
    "  return JSON.parse(JSON.stringify(value ?? null));",
    "}",
  ].join("\n"),
  [
    "function clone(value) {",
    "  return JSON.parse(JSON.stringify(value ?? null));",
    "}",
    "",
    "function cloneGameOverReason(value) {",
    "  if (typeof value === \"string\") return value;",
    "  if (value && typeof value === \"object\") return clone(value);",
    "  return null;",
    "}",
    "",
    "function gameOverSignature(value) {",
    "  if (value == null) return \"none\";",
    "  if (typeof value === \"string\") return \"string:\" + value;",
    "  if (typeof value === \"object\") {",
    "    return \"object:\" + (value.type ?? \"unknown\") + \":\" + (value.reason ?? \"\");",
    "  }",
    "  return typeof value + \":\" + String(value);",
    "}",
  ].join("\n"),
  "canary game-over helpers",
);
replaceOnce(
  canaryPath,
  "    gameOverReason: typeof state.gameOverReason === \"string\" ? state.gameOverReason : null,",
  "    gameOverReason: cloneGameOverReason(state.gameOverReason),",
  "canary checkpoint game-over reason",
);
replaceOnce(
  canaryPath,
  [
    "  const legacyGameOver = typeof legacyState?.gameOverReason === \"string\"",
    "    ? legacyState.gameOverReason",
    "    : null;",
    "  if ((candidateGameOver ?? null) !== legacyGameOver) {",
    "    issues.push(`outcome-mismatch:${legacyGameOver ?? \"none\"}->${candidateGameOver ?? \"none\"}`);",
    "  }",
  ].join("\n"),
  [
    "  const legacyGameOver = cloneGameOverReason(legacyState?.gameOverReason);",
    "  if (gameOverSignature(candidateGameOver) !== gameOverSignature(legacyGameOver)) {",
    "    issues.push(",
    "      \"outcome-mismatch:\" + gameOverSignature(legacyGameOver)",
    "        + \"->\" + gameOverSignature(candidateGameOver),",
    "    );",
    "  }",
  ].join("\n"),
  "canary outcome comparison",
);
replaceOnce(
  canaryPath,
  [
    "  if ((projectedState.gameOverReason ?? null) !== legacyGameOver) {",
    "    issues.push(\"projected-game-over-mismatch\");",
    "  }",
  ].join("\n"),
  [
    "  if (gameOverSignature(projectedState.gameOverReason) !== gameOverSignature(legacyGameOver)) {",
    "    issues.push(\"projected-game-over-mismatch\");",
    "  }",
  ].join("\n"),
  "projected outcome comparison",
);
replaceOnce(
  canaryPath,
  "    candidateGameOver: candidateGameOver ?? null,",
  "    candidateGameOver: cloneGameOverReason(candidateGameOver),",
  "validated candidate outcome",
);
