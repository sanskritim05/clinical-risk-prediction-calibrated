# api/model_loader.py
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = PROJECT_ROOT / "ml" / "artifacts"
ML_SRC_DIR = PROJECT_ROOT / "ml" / "src"

# Make sure custom training modules like calibration.py are importable
if str(ML_SRC_DIR) not in sys.path:
    sys.path.insert(0, str(ML_SRC_DIR))


def load_artifacts() -> Tuple[Any, Any, Dict[str, Any]]:
    model_path = ARTIFACTS_DIR / "xgb_pipeline.joblib"
    cal_path = ARTIFACTS_DIR / "platt_calibrator.joblib"
    meta_path = ARTIFACTS_DIR / "model_meta.json"

    if not model_path.exists():
        raise FileNotFoundError(f"Missing model pipeline: {model_path}")
    if not cal_path.exists():
        raise FileNotFoundError(f"Missing calibrator: {cal_path}")
    if not meta_path.exists():
        raise FileNotFoundError(f"Missing metadata file: {meta_path}")

    pipe = joblib.load(model_path)
    cal = joblib.load(cal_path)
    meta = json.loads(meta_path.read_text())

    return pipe, cal, meta


def features_to_frame(features: Dict[str, Any], meta: Dict[str, Any]) -> pd.DataFrame:
    cols = meta["feature_cols"]
    row = {col: features.get(col, None) for col in cols}
    return pd.DataFrame([row], columns=cols)