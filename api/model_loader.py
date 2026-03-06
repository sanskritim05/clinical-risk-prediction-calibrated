from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = PROJECT_ROOT / "ml" / "artifacts"


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
    """
    Convert incoming JSON features into a one-row dataframe matching training schema.
    Missing features are filled with None so the pipeline imputers can handle them.
    Extra features are ignored.
    """
    cols = meta["feature_cols"]
    row = {col: features.get(col, None) for col in cols}
    return pd.DataFrame([row], columns=cols)