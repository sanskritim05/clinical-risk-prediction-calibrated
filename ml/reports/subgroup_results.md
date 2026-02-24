# Phase 6: Subgroup Performance (XGBoost)

Subgroup evaluation was performed on the held-out **test** split using the XGBoost model. Metrics include discrimination (ROC-AUC), precision-recall behavior (PR-AUC), and calibration (Brier score).

## By Gender

| Group | N | Prevalence | ROC-AUC | PR-AUC | Brier |
|---|---:|---:|---:|---:|---:|
| Female | 8093 | 0.111 | 0.664 | 0.221 | 0.094 |
| Male | 6985 | 0.112 | 0.670 | 0.226 | 0.094 |

## By Age Bracket

| Group | N | Prevalence | ROC-AUC | PR-AUC | Brier |
|---|---:|---:|---:|---:|---:|
| [70-80) | 3862 | 0.123 | 0.651 | 0.229 | 0.103 |
| [60-70) | 3335 | 0.115 | 0.665 | 0.242 | 0.096 |
| [80-90) | 2581 | 0.115 | 0.628 | 0.204 | 0.098 |
| [50-60) | 2549 | 0.096 | 0.677 | 0.208 | 0.083 |
| [40-50) | 1369 | 0.099 | 0.697 | 0.222 | 0.084 |
| [30-40) | 579 | 0.105 | 0.697 | 0.224 | 0.089 |
| [90-100) | 443 | 0.117 | 0.638 | 0.215 | 0.100 |
| [20-30) | 237 | 0.105 | 0.798 | 0.450 | 0.079 |
| [10-20) | 97 | 0.062 | 0.720 | 0.218 | 0.054 |

## Interpretation

- PR-AUC differences should be interpreted relative to subgroup prevalence.
- These results are descriptive performance stratification, not a causal fairness conclusion.
