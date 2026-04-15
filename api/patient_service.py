from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd
import shap

from api.model_loader import PIPE, CAL, META, features_to_frame
from shap_utils import explain_single_patient, get_feature_names_from_column_transformer


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PATIENT_DATA_PATH = PROJECT_ROOT / "ml" / "data" / "processed" / "phase2_features.parquet"
FILTER_OUT_DISCHARGE = {
    "Expired",
    "Hospice / home",
    "Hospice / medical facility",
}
DIRECTORY_COLUMNS = [
    "patient_nbr",
    "race",
    "gender",
    "age",
    "time_in_hospital",
    "number_inpatient",
    "number_emergency",
    "discharge_disposition_id",
    "admission_type_id",
]


def _clean_scalar(value: Any, fallback: str = "Unknown") -> Any:
    if pd.isna(value):
        return fallback
    if isinstance(value, np.generic):
        return value.item()
    return value


def _feature_dict_from_row(row: pd.Series) -> Dict[str, Any]:
    return {
        col: _clean_scalar(row.get(col), None)
        for col in META["feature_cols"]
    }


def _prediction_from_features(features: Dict[str, Any]) -> Dict[str, Any]:
    X = features_to_frame(features, META)
    p_base = PIPE.predict_proba(X)[:, 1]
    probability = float(CAL.transform(p_base)[0])
    threshold = 0.5

    return {
        "probability": probability,
        "label": int(probability >= threshold),
        "threshold": threshold,
        "served_model_name": META["model_name"],
    }


def _row_to_directory_item(row: pd.Series) -> Dict[str, Any]:
    return {
        "patient_nbr": str(_clean_scalar(row["patient_nbr"])),
        "race": str(_clean_scalar(row.get("race"))),
        "gender": str(_clean_scalar(row.get("gender"))),
        "age": str(_clean_scalar(row.get("age"))),
        "time_in_hospital": int(_clean_scalar(row.get("time_in_hospital"), 0)),
        "number_inpatient": int(_clean_scalar(row.get("number_inpatient"), 0)),
        "number_emergency": int(_clean_scalar(row.get("number_emergency"), 0)),
        "discharge_disposition_id": str(
            _clean_scalar(row.get("discharge_disposition_id"))
        ),
        "admission_type_id": str(_clean_scalar(row.get("admission_type_id"))),
    }


@lru_cache(maxsize=1)
def get_patient_frame() -> pd.DataFrame:
    if not PATIENT_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Missing processed patient data: {PATIENT_DATA_PATH}. Run Phase 2 first."
        )

    df = pd.read_parquet(PATIENT_DATA_PATH)
    df = df[~df["discharge_disposition_id"].isin(FILTER_OUT_DISCHARGE)].copy()
    df["patient_nbr"] = df["patient_nbr"].astype(str)
    df = df.sort_values(["patient_nbr", "encounter_id"], kind="stable")
    return df


@lru_cache(maxsize=1)
def get_shap_context():
    preprocess = PIPE.named_steps["preprocess"]
    model = PIPE.named_steps["model"]
    explainer = shap.TreeExplainer(model)
    feature_names = get_feature_names_from_column_transformer(preprocess)
    return preprocess, explainer, feature_names


def get_patient_list(limit: int = 50) -> List[Dict[str, Any]]:
    df = get_patient_frame()
    deduped = df.drop_duplicates(subset=["patient_nbr"], keep="last")
    items = deduped.loc[:, DIRECTORY_COLUMNS].head(limit)
    return [_row_to_directory_item(row) for _, row in items.iterrows()]


def get_patient_row(patient_id: str) -> pd.Series:
    df = get_patient_frame()
    rows = df[df["patient_nbr"] == str(patient_id)]
    if rows.empty:
        raise KeyError(f"Patient {patient_id} was not found in the filtered cohort.")
    return rows.iloc[-1]


def predict_patient(patient_id: str) -> Dict[str, Any]:
    row = get_patient_row(patient_id)
    return _prediction_from_features(_feature_dict_from_row(row))


def explain_patient(patient_id: str, top_k: int = 8) -> Dict[str, Any]:
    row = get_patient_row(patient_id)
    features = _feature_dict_from_row(row)
    X = features_to_frame(features, META)

    preprocess, explainer, feature_names = get_shap_context()
    x_transformed = preprocess.transform(X)
    if hasattr(x_transformed, "toarray"):
        x_dense = x_transformed.toarray()
    else:
        x_dense = np.asarray(x_transformed)

    shap_values = explainer.shap_values(x_dense)
    explanation = explain_single_patient(
        shap_values_row=np.asarray(shap_values)[0],
        x_row=x_dense[0],
        feature_names=feature_names,
        top_k=top_k,
    )

    for direction in ("top_positive", "top_negative"):
        for item in explanation[direction]:
            item["shap_value"] = item.pop("shap")

    return {"explanation": explanation}


def compare_patients(patient_ids: List[str]) -> List[Dict[str, Any]]:
    return [
        {
            "patient_id": patient_id,
            "prediction": predict_patient(patient_id),
            "explanation": explain_patient(patient_id)["explanation"],
        }
        for patient_id in patient_ids
    ]
