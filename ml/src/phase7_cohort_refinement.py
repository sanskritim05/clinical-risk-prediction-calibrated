# ml/src/phase7_cohort_refinement.py
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict, Any, List

import numpy as np
import pandas as pd

from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss

from config import PROCESSED_DIR, REPORTS_DIR, RANDOM_SEED
from features import CORE_NUMERIC_FEATURES, CORE_CATEGORICAL_FEATURES, DIAG_COLS, TARGET_COL
from preprocess import PreprocessSpec, get_split_frames
from train_baselines import TrainConfig, train_xgboost


FILTER_OUT_DISCHARGE = {
    "Expired",
    "Hospice / home",
    "Hospice / medical facility",
}


def compute_metrics(y_true: np.ndarray, p_pred: np.ndarray) -> Dict[str, Any]:
    return {
        "n": int(len(y_true)),
        "prevalence": float(np.mean(y_true)),
        "roc_auc": float(roc_auc_score(y_true, p_pred)),
        "pr_auc": float(average_precision_score(y_true, p_pred)),
        "brier": float(brier_score_loss(y_true, p_pred)),
    }


def get_feature_cols() -> List[str]:
    diag_group_cols = [f"{c}_group" for c in DIAG_COLS]
    return CORE_NUMERIC_FEATURES + CORE_CATEGORICAL_FEATURES + diag_group_cols


def fit_eval_xgb(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Train XGBoost on df (using train split) and evaluate on test split.
    Returns metrics + a few helpful counts.
    """
    diag_group_cols = [f"{c}_group" for c in DIAG_COLS]
    feature_cols = get_feature_cols()

    spec = PreprocessSpec(
        numeric_features=CORE_NUMERIC_FEATURES,
        categorical_features=CORE_CATEGORICAL_FEATURES + diag_group_cols,
    )
    cfg = TrainConfig(seed=RANDOM_SEED)

    X_train, y_train, X_val, y_val, X_test, y_test = get_split_frames(
        df=df, feature_cols=feature_cols, target_col=TARGET_COL, split_col="split"
    )

    model = train_xgboost(spec, cfg)
    model.fit(X_train, y_train)

    p_test = model.predict_proba(X_test)[:, 1]
    metrics = compute_metrics(y_test.to_numpy(), p_test)

    return {
        "metrics_test": metrics,
        "counts": {
            "rows_total": int(len(df)),
            "rows_train": int((df["split"] == "train").sum()),
            "rows_val": int((df["split"] == "val").sum()),
            "rows_test": int((df["split"] == "test").sum()),
        },
    }


def compute_shap_top_features_for_filtered_xgb(df: pd.DataFrame, top_k: int = 25) -> List[Dict[str, Any]]:
    """
    Compute top mean abs SHAP features for the filtered cohort XGB model.
    This is a lightweight version of Phase 5, used for 'before vs after' comparison.
    """
    import shap

    from shap_utils import get_feature_names_from_column_transformer, top_mean_abs_shap

    diag_group_cols = [f"{c}_group" for c in DIAG_COLS]
    feature_cols = get_feature_cols()

    spec = PreprocessSpec(
        numeric_features=CORE_NUMERIC_FEATURES,
        categorical_features=CORE_CATEGORICAL_FEATURES + diag_group_cols,
    )
    cfg = TrainConfig(seed=RANDOM_SEED)

    X_train, y_train, X_val, y_val, X_test, y_test = get_split_frames(
        df=df, feature_cols=feature_cols, target_col=TARGET_COL, split_col="split"
    )

    pipe = train_xgboost(spec, cfg)
    pipe.fit(X_train, y_train)

    pre = pipe.named_steps["preprocess"]
    model = pipe.named_steps["model"]

    X_test_trans = pre.transform(X_test)

    if hasattr(X_test_trans, "toarray"):
        X_test_dense = X_test_trans.toarray()
    else:
        X_test_dense = np.asarray(X_test_trans)

    feature_names = get_feature_names_from_column_transformer(pre)

    rng = np.random.default_rng(RANDOM_SEED)
    n = X_test_dense.shape[0]
    sample_n = min(2000, n)
    idx = rng.choice(n, size=sample_n, replace=False)
    X_shap = X_test_dense[idx]

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_shap)

    top_feats = top_mean_abs_shap(np.array(shap_values), feature_names, top_k=top_k)
    return top_feats


def main() -> None:
    phase2_file = PROCESSED_DIR / "phase2_features.parquet"
    if not phase2_file.exists():
        raise FileNotFoundError(f"Missing {phase2_file}. Run Phase 2 first.")

    df_full = pd.read_parquet(phase2_file)

    # Baseline metrics on full cohort (same as Phase 3/6)
    baseline = fit_eval_xgb(df_full)

    # Filter cohort
    df_filtered = df_full[~df_full["discharge_disposition_id"].isin(FILTER_OUT_DISCHARGE)].copy()

    filtered = fit_eval_xgb(df_filtered)

    # SHAP top features after filter (for comparison to Phase 5)
    top_after = compute_shap_top_features_for_filtered_xgb(df_filtered, top_k=25)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    out = {
        "filter": {
            "excluded_discharge_disposition": sorted(list(FILTER_OUT_DISCHARGE)),
        },
        "baseline_full_cohort": baseline,
        "filtered_cohort": filtered,
    }
    (REPORTS_DIR / "phase7_metrics.json").write_text(json.dumps(out, indent=2))
    (REPORTS_DIR / "phase7_shap_top_features_after_filter.json").write_text(json.dumps(top_after, indent=2))

    # Markdown comparison
    b = baseline["metrics_test"]
    f = filtered["metrics_test"]

    md = []
    md.append("# Phase 7: Cohort Refinement (Exclude Expired + Hospice)\n")
    md.append(
        "This experiment refines the prediction population by excluding discharge dispositions that "
        "represent structural non-readmission states (Expired) or hospice discharges.\n"
    )
    md.append("## Filter\n")
    md.append("- Excluded discharge dispositions:\n")
    for x in sorted(FILTER_OUT_DISCHARGE):
        md.append(f"  - {x}")
    md.append("")

    md.append("## Test-set performance (XGBoost)\n")
    md.append("| Cohort | N | Prevalence | ROC-AUC | PR-AUC | Brier |")
    md.append("|---|---:|---:|---:|---:|---:|")
    md.append(f"| Full cohort | {b['n']} | {b['prevalence']:.3f} | {b['roc_auc']:.3f} | {b['pr_auc']:.3f} | {b['brier']:.3f} |")
    md.append(f"| Filtered cohort | {f['n']} | {f['prevalence']:.3f} | {f['roc_auc']:.3f} | {f['pr_auc']:.3f} | {f['brier']:.3f} |")
    md.append("")
    md.append("## Notes\n")
    md.append(
        "- Filtering changes the *eligible prediction population* and can shift both performance and feature importance.\n"
        "- Compare Phase 5 SHAP (full cohort) vs `phase7_shap_top_features_after_filter.json` (filtered cohort) to see how dominant discharge disposition effects change.\n"
    )

    (REPORTS_DIR / "phase7_comparison.md").write_text("\n".join(md))

    print("Phase 7 complete.")
    print(f"Wrote: {REPORTS_DIR / 'phase7_metrics.json'}")
    print(f"Wrote: {REPORTS_DIR / 'phase7_comparison.md'}")
    print(f"Wrote: {REPORTS_DIR / 'phase7_shap_top_features_after_filter.json'}")


if __name__ == "__main__":
    main()