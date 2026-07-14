# Agent Economy Calibration Protocol

Version: 2

This document freezes the standards, scenarios, and final results used to calibrate the household economy. Later work may extend production, consumption, employment, markets, production chains, wages, taxes, and welfare, but changes must continue to pass the same hard gates and scenario matrix.

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

The default-estate target band is:

| Metric | Target |
|---|---:|
| Economic survival | at least 95% of seeds |
| Food fulfillment | 85% to 100% |
| Employment | 60% to 85% |
| Building idle rate | at most 25% |
| Input-shortage event rate | at most 35% |
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

A low final hunger need cannot hide years of missed meals. Full food fulfillment is allowed; oversupply is detected through inventory pressure and price ratios rather than by deliberately requiring missed meals.

The default starting estate contains a sawmill without a timber lot. Its expected structural downtime accounts for 16.67 percentage points of the idle and shortage rates. The 25% idle and 35% shortage targets still leave a limited allowance for tannery and smelter startup friction without treating the disconnected sawmill as a systemic collapse.

## Calibrated mechanics

Version 2 adds the following mechanics:

- Estate inventory is distributed into household inventories by occupation at initialization.
- Food demand is aligned to approximately 2.05 units per person per quarter.
- Households maintain a two-unit-per-person food reserve target.
- Markets settle quantities down to 0.05 units.
- Fractional inventory is preserved during trading and consumption.
- Buildings treat `workersNeeded` as minimum operating crew and can use additional same-occupation workers for expansion.
- Traders, clergy, and general laborers receive service employment.
- Idle farmers, fishers, and herders can perform low-output subsistence work.
- Production-input buyers and sellers clear near the reference price when an upstream stock exists.
- Production households maintain a seven-day input buffer.
- Adaptive beliefs remain within 0.6 to 2.5 times the reference price.
- Hunger and health use actual due, fulfilled, and missed meal events rather than assuming every calendar day requires a full meal.

## Fixed scenario matrix

Every scenario uses the same deterministic seeds so results remain directly comparable.

1. **Default estate** — current new-game population, buildings, labor allocation, inventory, and medium tax.
2. **Agricultural shortage** — removes the starting strip farm while preserving the rest of the estate. Subsistence production should soften the shock without hiding it.
3. **Labor shortage** — reserves 70% of the population for construction and checks controlled degradation.
4. **Broken supply chain** — retains processors while removing timber, iron, and coal production and setting those starting stocks to zero.
5. **High tax** — applies the crushing household tax rate to the default estate.
6. **Low tax** — applies the low tax rate as the household-liquidity comparison case.
7. **Expanded estate** — adds food, timber, iron, and milling capacity while reducing construction labor.

Shock scenarios have explicit resilience thresholds that are looser than the default-estate target. Their purpose is to verify controlled degradation rather than demand healthy-estate output from a damaged settlement.

## Directional expectations

The matrix verifies causal direction:

- Removing the strip farm reduces food fulfillment.
- Reserving more labor for construction reduces employment.
- Removing upstream stocks and production increases processor downtime.
- Expansion reduces input shortages.
- Expansion increases employment.
- Crushing tax does not produce lower poverty than low tax.

## Standard run sizes

- Calibration matrix: 12 seeds × 12 quarters × 7 scenarios.
- Quick development stress: 10 seeds × 8 quarters.
- Final validation stress: 100 seeds × 40 quarters.

## Final V2 results

The final seven-scenario matrix completed 1,008 quarter simulations and 30,240 economic days:

- Hard status: `pass`
- Calibration status: `meets-target`
- Target misses: `0`
- Directional checks: `6/6 pass`

Default-estate averages:

| Metric | Result |
|---|---:|
| Economic survival | 100% |
| Food fulfillment | 99.20% |
| Employment | 80% |
| Building idle rate | 22.41% |
| Input-shortage rate | 31.18% |
| Trades per day | 2.2553 |
| Poverty | 5.42% |
| Average health | 99.99 |
| Average satisfaction | 57.57 |
| Commodity price ratio | 0.8225 to 1.0090 |

The final 100-seed × 40-quarter run completed 4,000 quarter simulations and 120,000 economic days:

- Hard status: `pass`
- Balance status: `stable`
- Completion: 100%
- Economic survival: 100%
- Food fulfillment: 99.35%
- Employment: 80%
- Poverty: 3%
- Market activity: 2.2017 trades per day
- Extreme inflation, price crash, market freeze, chronic unemployment, and chronic input-shortage seed rates: 0%
- Mean runtime: 18.1854 ms per quarter
- Maximum runtime: 27.3952 ms per quarter

## Promotion rule

The household economy has passed its economic calibration and long-run stability gates. It still cannot become authoritative until the treasury, manor inventory, population, game-over, and other live game-state adapters are complete and canary rollback remains proven.

Until those adapters are finished, the legacy economy remains authoritative and the household economy remains in shadow mode.
