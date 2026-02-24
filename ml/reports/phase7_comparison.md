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

- Filtering changes the *eligible prediction population* and can shift both performance and feature importance.
- Compare Phase 5 SHAP (full cohort) vs `phase7_shap_top_features_after_filter.json` (filtered cohort) to see how dominant discharge disposition effects change.
