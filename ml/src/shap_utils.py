# ml/src/shap_utils.py
from __future__ import annotations

from typing import List, Tuple, Dict, Any
import numpy as np


def get_feature_names_from_column_transformer(preprocessor) -> List[str]:
    """
    Extract output feature names from a fitted ColumnTransformer that contains:
      - a numeric pipeline
      - a categorical pipeline with OneHotEncoder
    """
    feature_names: List[str] = []

    for name, transformer, cols in preprocessor.transformers_:
        if name == "remainder" and transformer == "drop":
            continue

        # Pipelines: get last step
        if hasattr(transformer, "steps"):
            last_step = transformer.steps[-1][1]
        else:
            last_step = transformer

        if hasattr(last_step, "get_feature_names_out"):
            # OneHotEncoder supports this; StandardScaler usually doesn't
            try:
                names = last_step.get_feature_names_out(cols)
                feature_names.extend([str(n) for n in names])
            except TypeError:
                # some transformers don't accept cols; fallback
                names = last_step.get_feature_names_out()
                feature_names.extend([str(n) for n in names])
        else:
            # numeric passthrough (after scaling/imputing) keeps same col names
            feature_names.extend([str(c) for c in cols])

    return feature_names


def top_mean_abs_shap(
    shap_values: np.ndarray,
    feature_names: List[str],
    top_k: int = 20,
) -> List[Dict[str, Any]]:
    """
    Return top_k features by mean absolute SHAP value.
    shap_values: (n_samples, n_features)
    """
    mean_abs = np.mean(np.abs(shap_values), axis=0)
    idx = np.argsort(mean_abs)[::-1][:top_k]

    out = []
    for i in idx:
        out.append(
            {
                "feature": feature_names[int(i)],
                "mean_abs_shap": float(mean_abs[int(i)]),
            }
        )
    return out


def explain_single_patient(
    shap_values_row: np.ndarray,
    x_row: np.ndarray,
    feature_names: List[str],
    top_k: int = 10,
) -> Dict[str, Any]:
    """
    Build a compact per-patient explanation:
      - top positive contributors
      - top negative contributors
    """
    contrib = shap_values_row.flatten()
    order_pos = np.argsort(contrib)[::-1]
    order_neg = np.argsort(contrib)

    def pack(indices):
        items = []
        for j in indices[:top_k]:
            items.append(
                {
                    "feature": feature_names[int(j)],
                    "value": float(x_row.flatten()[int(j)]),
                    "shap": float(contrib[int(j)]),
                }
            )
        return items

    return {
        "top_positive": pack(order_pos),
        "top_negative": pack(order_neg),
    }