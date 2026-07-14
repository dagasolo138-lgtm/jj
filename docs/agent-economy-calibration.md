# Agent Economy Calibration Protocol

Version: 1

This document freezes the standards and scenarios used to calibrate the household economy. Later calibration work may change production, consumption, employment, markets, production chains, wages, taxes, and welfare, but it must not silently weaken these targets.

## Two separate result layers

### Hard gates

Hard gates are non-negotiable engineering requirements. A calibration or stress run fails CI when any of these fail:

- 100% of seed runs complete.
- Invariant failure rate is 0%.
- Population is conserved.
- Household cash changes reconcile with income, tax, and welfare.
- Inventory changes reconcile with production, processing inputs, and consumption.
- Commodity and household price beliefs stay inside configured bounds.
- State survives JSON serialization.
- Maximum runtime remains below 250 ms per simulated quarter.
- The frozen legacy economy baseline, lint, and production build continue to pass.

### Calibration targets

Calibration targets describe a healthy economy. Missing these targets produces a report and blocks candidate-engine promotion, but it does not make the normal CI job fail while calibration is in progress.

The default-estate target band is:

| Metric | Target |
|---|---:|
| Economic survival | at least 95% of seeds |
| Food fulfillment | 85% to 98% |
| Employment | 60% to 85% |
| Building idle rate | at most 20% |
| Input-shortage event rate | at most 20% |
| Settled trades per day | at least 0.15 |
| Failed orders per settled trade | at most 25 |
| Seeds with extreme inflation | at most 5% |
| Seeds with price crash | at most 5% |
| Endpoint poverty | at most 25% |
| Average health | at least 55 |
| Average satisfaction | at least 40 |
| Commodity price ratio | 0.6 to 2.0 of reference price |

Food fulfillment is measured across the whole simulation:

`food consumed / (food consumed + unmet food demand)`

A low final hunger need cannot hide years of missed meals.

## Fixed scenario matrix

Every scenario uses the same deterministic seeds so results remain directly comparable.

1. **Default estate** — current new-game population, buildings, labor allocation, and medium tax. This is the primary balance target.
2. **Agricultural shortage** — removes the starting strip farm while preserving the rest of the estate. This tests degradation after a food shock.
3. **Labor shortage** — reserves 70% of the population for construction. This tests graceful degradation under a severe labor constraint.
4. **Broken supply chain** — keeps processors while removing timber, iron, and coal upstream buildings. This tests propagation of missing inputs.
5. **High tax** — uses the crushing household tax rate on the default estate. This tests cash starvation and welfare dependence.
6. **Low tax** — uses the low household tax rate on the default estate. This is the liquidity comparison case.
7. **Expanded estate** — adds a demesne field, fishpond, timber lot, iron mine, and mill while reducing construction labor. Expansion should improve food and employment rather than create more dead buildings.

Shock scenarios have explicit resilience thresholds that are looser than the default-estate target. Their purpose is to verify controlled degradation, not to demand that a damaged estate perform like a healthy one.

## Directional expectations

The matrix also checks causal direction:

- Removing the strip farm should not improve food fulfillment.
- Reserving more labor for construction should not increase employment in production buildings.
- Breaking upstream supply should not reduce input shortages below the default estate.
- Expansion should not reduce food fulfillment or employment.
- Crushing tax should not produce lower poverty than low tax.

Directional failures do not fail hard CI during calibration, but they indicate that a mechanic is disconnected or an indicator is misleading.

## Standard run sizes

- Calibration matrix: 12 seeds × 12 quarters × 7 scenarios.
- Quick development stress: 10 seeds × 8 quarters.
- Final promotion stress: 100 seeds × 40 quarters.

The 12-seed matrix is intended for every calibration change. The 100-seed matrix remains the final promotion gate after a calibration stage is complete.

## Promotion rule

The household economy cannot become authoritative while any of these remain true:

- A hard gate fails.
- The default estate misses the healthy target band.
- Economic survival is below 95% in the final 100-seed run.
- Food fulfillment is below 85% in most seeds.
- Extreme inflation, market freeze, chronic unemployment, or persistent production-chain failure remains systemic.
- The treasury, manor inventory, population, and game-over adapters are incomplete.

During calibration the legacy economy remains authoritative and the household economy remains in shadow mode.
