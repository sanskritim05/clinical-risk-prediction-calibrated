# Phase 4 Calibration Summary

Platt scaling (sigmoid calibration) fit on the **validation** split; evaluated on the **test** split.

## Brier score (lower is better)

| Model | Before | After (Platt) | Δ (after - before) |
|---|---:|---:|---:|
| logreg | 0.22317 | 0.09513 | -0.12804 |
| xgboost | 0.09423 | 0.09424 | 0.00001 |

Plot: `calibration_before_after.png`