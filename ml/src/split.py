from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class SplitConfig:
    train_frac: float
    val_frac: float
    test_frac: float
    seed: int


def group_split_by_patient(
    df: pd.DataFrame,
    patient_col: str,
    cfg: SplitConfig,
) -> Dict[str, np.ndarray]:
    """
    Split by unique patient IDs (group split) so the same patient never
    appears in multiple splits.
    """
    patients = df[patient_col].dropna().unique()

    rng = np.random.default_rng(cfg.seed)
    rng.shuffle(patients)

    n = len(patients)
    n_train = int(round(cfg.train_frac * n))
    n_val = int(round(cfg.val_frac * n))
    n_test = n - n_train - n_val  # remainder

    train_ids = patients[:n_train]
    val_ids = patients[n_train : n_train + n_val]
    test_ids = patients[n_train + n_val :]

    assert len(train_ids) + len(val_ids) + len(test_ids) == n
    assert len(test_ids) == n_test

    return {"train": train_ids, "val": val_ids, "test": test_ids}


def assign_split_column(
    df: pd.DataFrame, patient_col: str, splits: Dict[str, np.ndarray]
) -> pd.Series:
    """
    Create a 'split' column mapping each row to train/val/test based on patient ID.
    """
    split_map = {}
    for split_name, ids in splits.items():
        for pid in ids:
            split_map[pid] = split_name

    return df[patient_col].map(split_map)


def verify_no_patient_leakage(df: pd.DataFrame, patient_col: str, split_col: str = "split") -> None:
    """
    Ensure each patient appears in exactly one split.
    """
    patient_splits = df[[patient_col, split_col]].dropna().drop_duplicates()
    counts = patient_splits.groupby(patient_col)[split_col].nunique()
    leaked = counts[counts > 1]
    if len(leaked) > 0:
        raise ValueError(f"Patient leakage detected for {len(leaked)} patients.")


def save_splits_json(splits: Dict[str, np.ndarray], out_path: Path) -> None:
    """
    Save patient IDs per split to JSON for reproducibility.
    """
    out = {k: [int(x) for x in v.tolist()] for k, v in splits.items()}
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2))