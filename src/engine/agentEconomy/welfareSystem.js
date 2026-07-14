import { clampNeed, normalizeNeeds } from "./needsSystem.js";

export const DAILY_INCOME_BY_OCCUPATION = {
  farmer: 0.34,
  herder: 0.36,
  fisherman: 0.36,
  woodsman: 0.38,
  miner: 0.46,
  artisan: 0.5,
  trader: 0.55,
  clergy: 0.3,
  laborer: 0.28,
  unemployed: 0,
};

const TAX_RATES = {
  low: 0.04,
  medium: 0.08,
  high: 0.13,
  crushing: 0.2,
};

function money(value) {
  if (!Number.isFinite(value)) return 0;
  return Number(Math.max(0, value).toFixed(2));
}

export function payHouseholdIncome(household) {
  const weight = Math.max(1, Math.floor(household.weight ?? 1));
  const dailyRate = DAILY_INCOME_BY_OCCUPATION[household.occupation] ?? DAILY_INCOME_BY_OCCUPATION.laborer;
  const grossIncome = money(dailyRate * weight);
  return {
    household: {
      ...household,
      cash: money((Number(household.cash) || 0) + grossIncome),
    },
    grossIncome,
  };
}

export function applyHouseholdTaxAndWelfare(household, context = {}) {
  const weight = Math.max(1, Math.floor(household.weight ?? 1));
  const grossIncome = money(context.grossIncome);
  const taxRate = TAX_RATES[context.taxRate] ?? TAX_RATES.medium;
  const taxPaid = money(Math.min(household.cash ?? 0, grossIncome * taxRate));
  let cash = money((Number(household.cash) || 0) - taxPaid);
  const foodNeed = Math.max(0, Number(household.needs?.food) || 0);
  const unmetFood = Math.max(0, Number(context.unmetFood) || 0);
  const welfareEligible = (foodNeed >= 75 || unmetFood > 0) && cash < weight * 2.5;
  const welfarePaid = welfareEligible ? money(Math.min(weight * 0.45, weight * 2.5 - cash)) : 0;
  cash = money(cash + welfarePaid);

  return {
    household: { ...household, cash },
    taxPaid,
    welfarePaid,
  };
}

export function updateHouseholdWellbeing(household, context = {}) {
  const needs = normalizeNeeds(household.needs);
  const unmetFood = Math.max(0, Number(context.unmetFood) || 0);
  const targetFood = Math.max(0, Number(context.targetFood) || 0);
  const consumedFood = Math.max(0, Number(context.consumedFood) || 0);
  const employmentPenalty = Number(household.employmentRatio) > 0 ? 0 : 2;
  const hungerPenalty = targetFood > 0 && unmetFood > 0
    ? 2
    : needs.food >= 90 ? 1 : 0;
  const healthRecovery = targetFood > 0 && consumedFood >= targetFood
    ? 1
    : context.day % 14 === 0 && needs.food < 40 ? 1 : 0;
  const health = Math.max(0, Math.min(100,
    Math.round((Number(household.health) || 0) + healthRecovery - hungerPenalty),
  ));

  const needAverage = Object.values(needs).reduce((total, value) => total + value, 0)
    / Object.keys(needs).length;
  const cashBuffer = (Number(household.cash) || 0) >= Math.max(2, (household.weight ?? 1) * 3) ? 2 : -1;
  const satisfactionTarget = 100 - needAverage + cashBuffer - employmentPenalty;
  const previous = Number(household.satisfaction) || 0;
  const satisfaction = Math.max(0, Math.min(100,
    Math.round(previous + (satisfactionTarget - previous) * 0.12),
  ));

  const nextNeeds = {
    ...needs,
    health: clampNeed(needs.health + (health < 45 ? 3 : health > 80 ? -1 : 0)),
  };

  return {
    ...household,
    health,
    satisfaction,
    needs: nextNeeds,
  };
}
