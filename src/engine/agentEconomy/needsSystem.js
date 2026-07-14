// Needs are normalized to 0..100 urgency values.
// The live game does not consume these yet; the daily simulator will use them later.

export const NEED_KEYS = [
  "food",
  "housing",
  "health",
  "clothing",
  "tools",
  "faith",
  "employment",
];

export const DEFAULT_NEEDS = {
  food: 20,
  housing: 15,
  health: 10,
  clothing: 8,
  tools: 5,
  faith: 5,
  employment: 5,
};

export function clampNeed(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createInitialNeeds(index = 0) {
  const variation = Math.max(0, index) % 5;
  return {
    ...DEFAULT_NEEDS,
    food: clampNeed(DEFAULT_NEEDS.food + variation),
    housing: clampNeed(DEFAULT_NEEDS.housing + (variation % 3)),
    health: clampNeed(DEFAULT_NEEDS.health + (variation % 2)),
  };
}

export function normalizeNeeds(needs) {
  const source = needs && typeof needs === "object" ? needs : {};
  const normalized = {};
  for (const key of NEED_KEYS) {
    normalized[key] = clampNeed(source[key] ?? DEFAULT_NEEDS[key]);
  }
  return normalized;
}

export function getHighestPriorityNeed(needs) {
  const normalized = normalizeNeeds(needs);
  return NEED_KEYS.reduce((highest, key) =>
    normalized[key] > normalized[highest] ? key : highest,
  NEED_KEYS[0]);
}

export function updateNeed(needs, key, delta) {
  if (!NEED_KEYS.includes(key)) return normalizeNeeds(needs);
  const normalized = normalizeNeeds(needs);
  return {
    ...normalized,
    [key]: clampNeed(normalized[key] + delta),
  };
}
