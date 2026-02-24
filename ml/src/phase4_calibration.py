# ml/src/phase4_calibration.py
from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from config import PROCESSED_DIR, REPORTS_DIR, RANDOM_SEED
from features import CORE_NUMERIC_FEATURES, CORE_CATEGORICAL_FEATURES, DIAG_COLS, TARGET_COL
from preprocess import PreprocessSpec, get_split_frames
from train_baselines import TrainConfig, train_logistic_regression, train_xgboost
from calibration import (
    predict_proba_pos,
    compute_brier,
    PlattCalibrator,
    get_calibration_curve,
)


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

    # Train base models
    lr = train_logistic_regression(spec, cfg)
    xgb = train_xgboost(spec, cfg)
    lr.fit(X_train, y_train)
    xgb.fit(X_train, y_train)

    # Base probabilities
    p_lr_val = predict_proba_pos(lr, X_val)
    p_xgb_val = predict_proba_pos(xgb, X_val)

    p_lr_test = predict_proba_pos(lr, X_test)
    p_xgb_test = predict_proba_pos(xgb, X_test)

    # BEFORE calibration Brier (test)
    brier_before = {
        "logreg": compute_brier(y_test, p_lr_test),
        "xgboost": compute_brier(y_test, p_xgb_test),
    }

    # Fit Platt calibrators on VAL
    lr_cal = PlattCalibrator().fit(p_lr_val, y_val.to_numpy())
    xgb_cal = PlattCalibrator().fit(p_xgb_val, y_val.to_numpy())

    # AFTER calibration probabilities on test
    p_lr_cal_test = lr_cal.transform(p_lr_test)
    p_xgb_cal_test = xgb_cal.transform(p_xgb_test)

    brier_after = {
        "logreg": compute_brier(y_test, p_lr_cal_test),
        "xgboost": compute_brier(y_test, p_xgb_cal_test),
    }

    # Calibration curves (test)
    lr_mean_b, lr_frac_b = get_calibration_curve(y_test, p_lr_test)
    xgb_mean_b, xgb_frac_b = get_calibration_curve(y_test, p_xgb_test)

    lr_mean_a, lr_frac_a = get_calibration_curve(y_test, p_lr_cal_test)
    xgb_mean_a, xgb_frac_a = get_calibration_curve(y_test, p_xgb_cal_test)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # Plot
    out_plot = REPORTS_DIR / "calibration_before_after.png"
    plt.figure()
    plt.plot([0, 1], [0, 1], linestyle="--", label="Perfectly calibrated")

    plt.plot(lr_mean_b, lr_frac_b, label="LogReg (before)")
    plt.plot(lr_mean_a, lr_frac_a, label="LogReg (after Platt)")

    plt.plot(xgb_mean_b, xgb_frac_b, label="XGBoost (before)")
    plt.plot(xgb_mean_a, xgb_frac_a, label="XGBoost (after Platt)")

    plt.xlabel("Mean predicted probability")
    plt.ylabel("Fraction of positives")
    plt.legend()
    plt.tight_layout()
    plt.savefig(out_plot)
    plt.close()

    # Save scores
    brier_out = {
        "test_brier_before": brier_before,
        "test_brier_after_platt": brier_after,
    }
    (REPORTS_DIR / "brier_scores.json").write_text(json.dumps(brier_out, indent=2))

    # Markdown summary
    md = []
    md.append("# Phase 4 Calibration Summary\n")
    md.append("Platt scaling (sigmoid calibration) fit on the **validation** split; evaluated on the **test** split.\n")
    md.append("## Brier score (lower is better)\n")
    md.append("| Model | Before | After (Platt) | Δ (after - before) |")
    md.append("|---|---:|---:|---:|")
    for k in ["logreg", "xgboost"]:
        before = brier_before[k]
        after = brier_after[k]
        md.append(f"| {k} | {before:.5f} | {after:.5f} | {(after - before):.5f} |")
    md.append("\nPlot: `calibration_before_after.png`")
    (REPORTS_DIR / "calibration_summary.md").write_text("\n".join(md))

    print("Phase 4 complete.")
    print(f"Wrote: {REPORTS_DIR / 'brier_scores.json'}")
    print(f"Wrote: {REPORTS_DIR / 'calibration_summary.md'}")
    print(f"Wrote: {out_plot}")


if __name__ == "__main__":
    main()