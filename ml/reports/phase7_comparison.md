# Phase 7: Cohort Refinement (Exclude Expired + Hospice)

This experiment refines the prediction population by excluding discharge dispositions that represent structural non-readmission states (Expired) or hospice discharges.

## Filter

- Excluded discharge dispositions:

  - Expired
  - Hospice / home
  - Hospice / medical facility

## Test-set performance (XGBoost)

| Cohort | N | Prevalence | ROC-AUC | PR-AUC | Brier |
|---|---:|---:|---:|---:|---:|
| Full cohort | 15078 | 0.111 | 0.667 | 0.223 | 0.094 |
| Filtered cohort | 14722 | 0.113 | 0.662 | 0.225 | 0.096 |

## Notes
Excluding structurally non-readmittable discharge categories (Expired, Hospice) produced only minor changes in discrimination and calibration metrics. This suggests that overall predictive performance was not solely driven by these categories.
However, SHAP analysis demonstrated a substantial redistribution of feature importance after filtering. In the full cohort, “Expired” discharge disposition dominated global feature importance. After refinement, feature influence shifted toward prior utilization (e.g., number of inpatient visits), diagnosis groupings, and length of stay.
This highlights the importance of carefully defining the eligible prediction population in clinical risk modeling, as cohort definition can meaningfully alter model interpretation even when overall performance remains similar.