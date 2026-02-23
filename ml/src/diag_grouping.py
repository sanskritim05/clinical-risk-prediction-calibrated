from __future__ import annotations

import numpy as np
import pandas as pd


def _to_float_safe(x) -> float | None:
    try:
        return float(x)
    except Exception:
        return None


def map_icd9_to_group(code: str | float | None) -> str:
    """
    Map ICD-9 diagnosis codes into broad groups.
    This is a simplified mapping suitable for interpretability and stable features.
    """
    if code is None or (isinstance(code, float) and np.isnan(code)):
        return "missing_unknown"

    s = str(code).strip()
    if s == "" or s.lower() == "nan":
        return "missing_unknown"

    # V-codes (supplementary) and E-codes (external causes)
    if s.startswith(("V", "v")):
        return "other"
    if s.startswith(("E", "e")):
        return "injury_poisoning"

    val = _to_float_safe(s)
    if val is None:
        return "other"

    # Broad ICD-9 ranges
    if 390 <= val <= 459 or val == 785:
        return "circulatory"
    if 460 <= val <= 519 or val == 786:
        return "respiratory"
    if 520 <= val <= 579 or val == 787:
        return "digestive"
    if 800 <= val <= 999:
        return "injury_poisoning"
    if 710 <= val <= 739:
        return "musculoskeletal"
    if 580 <= val <= 629 or val == 788:
        return "genitourinary"
    if 140 <= val <= 239:
        return "neoplasms"
    if 250 <= val < 251:
        return "diabetes"

    return "other"


def add_diag_groups(df: pd.DataFrame, diag_cols: list[str]) -> pd.DataFrame:
    out = df.copy()
    for c in diag_cols:
        out[f"{c}_group"] = out[c].apply(map_icd9_to_group)
    return out