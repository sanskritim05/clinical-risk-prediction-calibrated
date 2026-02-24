from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from config import PROCESSED_DIR, REPORTS_DIR, RANDOM_SEED
from features import CORE_NUMERIC_FEATURES, CORE_CATEGORICAL_FEATURES, DIAG_COLS, TARGET_COL
from preprocess import PreprocessSpec, get_split_frames
from train_baselines import TrainConfig, train_logistic_regression, train_xgboost
from evaluate import evaluate_discrimination, plot_roc, plot_pr


def main() -> None:
    phase2_file = PROCESSED_DIR / "phase2_features.parquet"
    if not phase2_file.exists():
        raise FileNotFoundError(f"Missing {phase2_file}. Run Phase 2 first.")

    df = pd.read_parquet(phase2_file)

    diag_group_cols = [f"{c}_group" for c in DIAG_COLS]
    feature_cols = CORE_NUMERIC_FEATURES + CORE_CATEGORICAL_FEATURES + diag_group_cols

    spec = PreprocessSpec(
        numeric_features=CORE_NUMERIC_FEATURES,
        categorical_features=CORE_CATEGORICAL_FEATURES + diag_group_cols,
    )
    cfg = TrainConfig(seed=RANDOM_SEED)

    X_train, y_train, X_val, y_val, X_test, y_test = get_split_frames(
        df=df, feature_cols=feature_cols, target_col=TARGET_COL, split_col="split"
    )

    # Train
    lr = train_logistic_regression(spec, cfg)
    xgb = train_xgboost(spec, cfg)

    lr.fit(X_train, y_train)
    xgb.fit(X_train, y_train)

    # Eval on validation and test
    results = {
        "val": {
            "logreg": evaluate_discrimination(lr, X_val, y_val).__dict__,
            "xgboost": evaluate_discrimination(xgb, X_val, y_val).__dict__,
        },
        "test": {
            "logreg": evaluate_discrimination(lr, X_test, y_test).__dict__,
            "xgboost": evaluate_discrimination(xgb, X_test, y_test).__dict__,
        },
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (REPORTS_DIR / "metrics.json").write_text(json.dumps(results, indent=2))

    # Results table markdown (test metrics)
    t_lr = results["test"]["logreg"]
    t_xgb = results["test"]["xgboost"]

    table = []
    table.append("# Phase 3 Results (Discrimination)\n")
    table.append("| Model | ROC-AUC | PR-AUC |")
    table.append("|---|---:|---:|")
    table.append(f"| Logistic Regression | {t_lr['roc_auc']:.4f} | {t_lr['pr_auc']:.4f} |")
    table.append(f"| XGBoost | {t_xgb['roc_auc']:.4f} | {t_xgb['pr_auc']:.4f} |")
    (REPORTS_DIR / "results_table.md").write_text("\n".join(table))

    # Plots (use test set)
    plot_roc({"LogReg": lr, "XGBoost": xgb}, X_test, y_test, REPORTS_DIR / "roc.png")
    plot_pr({"LogReg": lr, "XGBoost": xgb}, X_test, y_test, REPORTS_DIR / "pr.png")

    print("Phase 3 complete.")
    print(f"Wrote: {REPORTS_DIR / 'metrics.json'}")
    print(f"Wrote: {REPORTS_DIR / 'results_table.md'}")
    print(f"Wrote: {REPORTS_DIR / 'roc.png'}")
    print(f"Wrote: {REPORTS_DIR / 'pr.png'}")


if __name__ == "__main__":
    main()