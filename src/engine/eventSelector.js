/**
 * eventSelector.js
 *
 * Pure event-selection functions for The Lord's Ledger.
 * No side effects, no I/O. All randomness comes from Math.random() calls.
 *
 * With the meter system removed, event filtering is simplified:
 * - No tutorial safety filtering (all resources available from turn 1)
 * - requiresMeter gates converted to turn-based gates
 */

/**
 * Picks one item at random from an array.
 * Returns null if the array is empty.
 */
function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Filters an event list to those not yet used.
 * If all events are used, returns the full list (resets used tracking implicitly).
 */
function filterUnused(events, usedIds) {
  const unused = events.filter((e) => !usedIds.includes(e.id));
  return unused.length > 0 ? unused : events;
}

/**
 * Selects a seasonal event for the current season.
 *
 * @param {string} season - "spring" | "summer" | "autumn" | "winter"
 * @param {string[]} usedSeasonalIds
 * @param {number} turn - Current turn number (unused now but kept for API compat)
 * @param {Array<object>} allSeasonalEvents
 * @returns {object | null}
 */
export function selectSeasonalEvent(season, usedSeasonalIds, turn, allSeasonalEvents) {
  if (!allSeasonalEvents || allSeasonalEvents.length === 0) return null;

  // Narrow to the current season
  const forSeason = allSeasonalEvents.filter((e) => e.season === season);
  if (forSeason.length === 0) {
    return pickRandom(allSeasonalEvents);
  }

  // Prefer unused events; reset implicitly if all have been used
  const unusedCandidates = filterUnused(forSeason, usedSeasonalIds);
  return pickRandom(unusedCandidates);
}

/**
 * Selects a random (non-seasonal) event.
 *
 * Filtering rules:
 *   - Events with requiresMeter "military" only appear after turn 3
 *   - Events with requiresMeter "faith" only appear after turn 5
 *
 * @param {string[]} usedRandomIds
 * @param {number} turn - Current turn number
 * @param {Array<object>} allRandomEvents
 * @returns {object | null}
 */
export function selectRandomEvent(usedRandomIds, turn, allRandomEvents) {
  if (!allRandomEvents || allRandomEvents.length === 0) return null;

  // Filter by turn-based gates (replaces old meter gates)
  const gated = allRandomEvents.filter((e) => {
    if (!e.requiresMeter) return true;
    if (e.requiresMeter === "military") return turn >= 3;
    if (e.requiresMeter === "faith") return turn >= 5;
    return true;
  });

  if (gated.length === 0) return null;

  // Prefer unused
  const unusedCandidates = filterUnused(gated, usedRandomIds);
  return pickRandom(unusedCandidates);
}
