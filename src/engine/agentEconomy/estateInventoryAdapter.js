import { calibratedQuantity } from "./economyCalibration.js";

const PRIMARY_OWNERS = Object.freeze({
  grain: ["farmer"],
  flour: ["artisan", "farmer"],
  livestock: ["herder"],
  fish: ["fisherman"],
  timber: ["woodsman"],
  wood: ["woodsman", "artisan"],
  coal: ["miner"],
  iron: ["miner"],
  stone: ["miner"],
  clay: ["miner"],
  wool: ["herder"],
  cloth: ["artisan"],
  leather: ["artisan"],
  steel: ["artisan"],
  herbs: ["laborer", "clergy"],
  honey: ["laborer", "clergy"],
  ale: ["artisan", "trader"],
  salt: ["trader"],
  tools: ["artisan", "trader"],
});

function getEligibleHouseholds(households, commodity) {
  const preferred = new Set(PRIMARY_OWNERS[commodity] ?? []);
  const matching = households.filter((household) => preferred.has(household.occupation));
  return matching.length > 0 ? matching : households;
}

function splitQuantity(total, households) {
  const normalizedTotal = calibratedQuantity(total);
  const totalWeight = households.reduce(
    (sum, household) => sum + Math.max(1, Math.floor(Number(household.weight) || 1)),
    0,
  );
  if (normalizedTotal <= 0 || totalWeight <= 0) return new Map();

  const allocations = new Map();
  let distributed = 0;
  households.forEach((household, index) => {
    const weight = Math.max(1, Math.floor(Number(household.weight) || 1));
    const amount = index === households.length - 1
      ? calibratedQuantity(normalizedTotal - distributed)
      : calibratedQuantity(normalizedTotal * weight / totalWeight);
    allocations.set(household.id, amount);
    distributed = calibratedQuantity(distributed + amount);
  });
  return allocations;
}

export function distributeEstateInventory(households, estateInventory = {}, options = {}) {
  const sourceHouseholds = Array.isArray(households) ? households : [];
  if (sourceHouseholds.length === 0) return [];
  const replace = options.replace !== false;
  const next = sourceHouseholds.map((household) => ({
    ...household,
    inventory: replace
      ? Object.fromEntries(Object.keys(household.inventory ?? {}).map((commodity) => [commodity, 0]))
      : { ...(household.inventory ?? {}) },
  }));
  const byId = new Map(next.map((household) => [household.id, household]));

  for (const [commodity, rawAmount] of Object.entries(estateInventory ?? {})) {
    const amount = calibratedQuantity(rawAmount);
    if (amount <= 0) continue;
    const eligible = getEligibleHouseholds(next, commodity);
    const allocations = splitQuantity(amount, eligible);
    for (const [householdId, share] of allocations.entries()) {
      const household = byId.get(householdId);
      if (!household) continue;
      household.inventory = {
        ...household.inventory,
        [commodity]: calibratedQuantity((household.inventory?.[commodity] ?? 0) + share),
      };
    }
  }

  return next;
}

export function getDistributedInventoryTotals(households = []) {
  const totals = {};
  for (const household of households) {
    for (const [commodity, amount] of Object.entries(household.inventory ?? {})) {
      totals[commodity] = calibratedQuantity((totals[commodity] ?? 0) + amount);
    }
  }
  return totals;
}
