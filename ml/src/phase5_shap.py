# ml/src/phase5_shap.py
from __future__ import annotations

import json
import numpy as np
import pandas as pd

import shap
import matplotlib.pyplot as plt

from config import PROCESSED_DIR, REPORTS_DIR, RANDOM_SEED
from features import CORE_NUMERIC_FEATURES, CORE_CATEGORICAL_FEATURES, DIAG_COLS, TARGET_COL
from preprocess import PreprocessSpec, get_split_frames
from train_baselines import TrainConfig, train_xgboost
from shap_utils import (
    get_feature_names_from_column_transformer,
    top_mean_abs_shap,
    explain_single_patient,
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

    # Train XGBoost pipeline (same as Phase 3)
    xgb_pipe = train_xgboost(spec, cfg)
    xgb_pipe.fit(X_train, y_train)

    # Extract fitted preprocessor + fitted XGB model
    pre = xgb_pipe.named_steps["preprocess"]
    model = xgb_pipe.named_steps["model"]

    # Transform data to model input space
    X_test_trans = pre.transform(X_test)

    # Convert sparse -> dense for SHAP (TreeExplainer handles dense nicely)
    if hasattr(X_test_trans, "toarray"):
        X_test_dense = X_test_trans.toarray()
    else:
        X_test_dense = np.asarray(X_test_trans)

    feature_names = get_feature_names_from_column_transformer(pre)

    # Sample test rows for SHAP to keep runtime reasonable
    rng = np.random.default_rng(RANDOM_SEED)
    n = X_test_dense.shape[0]
    sample_n = min(2000, n)
    idx = rng.choice(n, size=sample_n, replace=False)
    X_shap = X_test_dense[idx]

    # SHAP values
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_shap)  # shape: (sample_n, n_features)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # 1) Global summary plot
    out_png = REPORTS_DIR / "shap_summary_xgb.png"
    plt.figure()
    shap.summary_plot(shap_values, X_shap, feature_names=feature_names, show=False)
    plt.tight_layout()
    plt.savefig(out_png, dpi=200, bbox_inches="tight")
    plt.close()

    # 2) Top features JSON
    top_feats = top_mean_abs_shap(shap_values=np.array(shap_values), feature_names=feature_names, top_k=25)
    (REPORTS_DIR / "shap_top_features_xgb.json").write_text(json.dumps(top_feats, indent=2))

    # 3) Example patient explanation JSON (one row from sample)
    example_i = 0
    patient_expl = explain_single_patient(
        shap_values_row=np.array(shap_values)[example_i],
        x_row=X_shap[example_i],
        feature_names=feature_names,
        top_k=12,
    )
    (REPORTS_DIR / "shap_example_patient_xgb.json").write_text(json.dumps(patient_expl, indent=2))

    print("Phase 5 complete.")
    print(f"Wrote: {out_png}")
    print(f"Wrote: {REPORTS_DIR / 'shap_top_features_xgb.json'}")
    print(f"Wrote: {REPORTS_DIR / 'shap_example_patient_xgb.json'}")


if __name__ == "__main__":
    main()