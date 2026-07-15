import fs from "node:fs";

function replaceOnce(path, search, replacement, label) {
  const source = fs.readFileSync(path, "utf8");
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Ambiguous patch anchor: ${label}`);
  }
  fs.writeFileSync(path, source.replace(search, replacement), "utf8");
}

replaceOnce(
  "src/engine/agentEconomy/emergencyRationingSystem.js",
  "export const EMERGENCY_RATIONING_RESERVE_PER_PERSON = 0.5;",
  "export const EMERGENCY_RATIONING_RESERVE_PER_PERSON = 0.3;",
  "lower protected ration reserve",
);

const testPath = "tests/unit/agentEconomyEmergencyRationing.test.js";
let tests = fs.readFileSync(testPath, "utf8");
const replacements = [
  ["assert.equal(EMERGENCY_RATIONING_RESERVE_PER_PERSON, 0.5);", "assert.equal(EMERGENCY_RATIONING_RESERVE_PER_PERSON, 0.3);"],
  ["assert.equal(result.emergencyRationing.foodRationed, 1);\n  assert.equal(consumed, 1);\n  assert.equal(afterFood, 1);\n  assert.equal(result.unmetFood, 1);", "assert.equal(result.emergencyRationing.foodRationed, 1.4);\n  assert.equal(consumed, 1.4);\n  assert.equal(afterFood, 0.6);\n  assert.equal(result.unmetFood, 0.6);"],
  ["makeHousehold(\"donor\", { grain: 1 })", "makeHousehold(\"donor\", { grain: 0.6 })"],
  ["assert.equal(result.emergencyRationing.availableBudget, 0);\n  assert.equal(result.unmetFood, 2);\n  assert.equal(foodTotal(result.households), 1);", "assert.equal(result.emergencyRationing.availableBudget, 0);\n  assert.equal(result.unmetFood, 2);\n  assert.equal(foodTotal(result.households), 0.6);"],
];
for (const [search, replacement] of replacements) {
  if (!tests.includes(search)) throw new Error(`Missing rationing test anchor: ${search}`);
  tests = tests.replace(search, replacement);
}
const protectedReserveAssertions = "assert.equal(result.emergencyRationing.protectedReserve, 1);";
const protectedReserveCount = tests.split(protectedReserveAssertions).length - 1;
if (protectedReserveCount !== 2) {
  throw new Error(`Expected two protected reserve assertions, found ${protectedReserveCount}`);
}
tests = tests.replaceAll(
  protectedReserveAssertions,
  "assert.equal(result.emergencyRationing.protectedReserve, 0.6);",
);
fs.writeFileSync(testPath, tests, "utf8");
