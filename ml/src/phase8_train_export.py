from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from config import PROCESSED_DIR, REPORTS_DIR, RANDOM_SEED
from features import CORE_NUMERIC_FEATURES, CORE_CATEGORICAL_FEATURES, DIAG_COLS, TARGET_COL
from preprocess import PreprocessSpec, get_split_frames
from train_baselines import TrainConfig, train_xgboost
from calibration import PlattCalibrator, predict_proba_pos


FILTER_OUT_DISCHARGE = {
    "Expired",
    "Hospice / home",
    "Hospice / medical facility",
}


def main() -> None:
    phase2_file = PROCESSED_DIR / "phase2_features.parquet"
    if not phase2_file.exists():
        raise FileNotFoundError(f"Missing {phase2_file}. Run Phase 2 first.")

    df = pd.read_parquet(phase2_file)

    # Filter cohort (clinically refined population)
    df = df[~df["discharge_disposition_id"].isin(FILTER_OUT_DISCHARGE)].copy()

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

    # Train model
    pipe = train_xgboost(spec, cfg)
    pipe.fit(X_train, y_train)

    # Fit Platt calibrator on validation probabilities
    p_val = predict_proba_pos(pipe, X_val)
    cal = PlattCalibrator().fit(p_val, y_val.to_numpy())

    # Evaluate quickly on test (sanity)
    p_test = predict_proba_pos(pipe, X_test)
    p_test_cal = cal.transform(p_test)

    # Save artifacts locally
    artifacts_dir = Path("ml/artifacts")
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    model_path = artifacts_dir / "xgb_pipeline.joblib"
    cal_path = artifacts_dir / "platt_calibrator.joblib"
    meta_path = artifacts_dir / "model_meta.json"

    joblib.dump(pipe, model_path)
    joblib.dump(cal, cal_path)

    meta = {
        "model_name": "xgboost_filtered_cohort",
        "seed": RANDOM_SEED,
        "target": TARGET_COL,
        "excluded_discharge_disposition": sorted(list(FILTER_OUT_DISCHARGE)),
        "feature_cols": feature_cols,
        "numeric_features": CORE_NUMERIC_FEATURES,
        "categorical_features": CORE_CATEGORICAL_FEATURES + diag_group_cols,
        "notes": "Pipeline includes preprocessing. Platt calibrator trained on validation probs.",
    }
    meta_path.write_text(json.dumps(meta, indent=2))

    print("Phase 8 export complete.")
    print(f"Saved model pipeline: {model_path}")
    print(f"Saved calibrator: {cal_path}")
    print(f"Saved meta: {meta_path}")
    print("Sanity: first 5 calibrated probs on test:", np.round(p_test_cal[:5], 4))


if __name__ == "__main__":
    main()