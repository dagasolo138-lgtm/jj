export const DEFAULT_AGENT_ECONOMY_SEED = 0x6d2b79f5;

export function normalizeSeed(seed, fallback = DEFAULT_AGENT_ECONOMY_SEED) {
  if (typeof seed === "string") {
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index += 1) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) || (fallback >>> 0);
  }

  if (!Number.isFinite(seed)) return fallback >>> 0;
  return (Math.floor(seed) >>> 0) || (fallback >>> 0);
}

export function createSeededRng(seed = DEFAULT_AGENT_ECONOMY_SEED) {
  let state = normalizeSeed(seed);

  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    nextInt(maxExclusive) {
      const max = Math.max(1, Math.floor(maxExclusive));
      return Math.floor(this.next() * max);
    },
    snapshot() {
      return state >>> 0;
    },
  };
}

export function stochasticRound(value, rng) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const whole = Math.floor(value);
  const fraction = value - whole;
  return whole + (fraction > 0 && rng.next() < fraction ? 1 : 0);
}
