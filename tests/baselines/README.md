# Legacy economy baseline

This directory freezes the pre-Autarky2 seasonal economy so the agent-economy migration can be compared against a stable control group.

## Covered scenarios

- `balanced_agriculture` — healthy mixed food production
- `crushing_tax` — maximum tax pressure
- `military_overload` — oversized levy and upkeep burden
- `food_shortage` — hard-mode famine with almost no reserves
- `damaged_estate` — poor and ruined production buildings

Each scenario runs for 40 turns (10 years) with a fixed pseudo-random seed. The stored baseline records yearly checkpoints, ending resources, population, garrison, bankruptcy exposure, and survival.

## Commands

```bash
npm run test:economy
npm run test:economy:baseline:update
```

Do not refresh `economy-v1.json` merely to make a failing test pass. Regenerate it only when an economic balance change is intentional and has been reviewed. During the Autarky2 migration, differences from this file are evidence to investigate, not noise to discard.
