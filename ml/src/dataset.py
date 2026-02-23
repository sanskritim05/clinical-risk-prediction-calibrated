from __future__ import annotations

import numpy as np
import pandas as pd

MISSING_TOKEN = "?"


def load_raw_diabetes_data(csv_path) -> pd.DataFrame:
    """
    Load raw diabetes readmission dataset and normalize missing values.

    Treat '?' as missing.
    """
    df = pd.read_csv(csv_path)
    df = df.replace(MISSING_TOKEN, np.nan)
    return df


def basic_sanity_checks(df: pd.DataFrame) -> None:
    """
    Minimal checks so we fail early if the file isn't what we expect.
    """
    required_cols = ["patient_nbr", "readmitted"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    allowed = {"<30", ">30", "NO"}
    seen = set(df["readmitted"].dropna().unique())
    if not seen.issubset(allowed):
        raise ValueError(
            f"Unexpected values in readmitted: {seen}. Expected subset of {allowed}."
        )


def make_binary_label(df: pd.DataFrame, label_col: str = "readmitted") -> pd.Series:
    """
    Binary label:
      1 if readmitted == '<30'
      0 otherwise ('>30' or 'NO')
    """
    if label_col not in df.columns:
        raise ValueError(f"Expected label column '{label_col}' not found.")
    return (df[label_col].astype(str) == "<30").astype(int)