# ml/src/phase2_build.py
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from config import PROCESSED_DIR, RAW_DIR, REPORTS_DIR
from features import (
    CORE_NUMERIC_FEATURES,
    CORE_CATEGORICAL_FEATURES,
    DIAG_COLS,
    TARGET_COL,
    SPLIT_COL,
)
from diag_grouping import add_diag_groups
from id_mapping import apply_id_maps, build_id_maps_from_raw_text


def main() -> None:
    phase1_file = PROCESSED_DIR / "phase1_base.parquet"
    if not phase1_file.exists():
        raise FileNotFoundError(f"Missing {phase1_file}. Run Phase 1 first.")

    df = pd.read_parquet(phase1_file)

    # Add diagnosis group features
    df = add_diag_groups(df, DIAG_COLS)
    diag_group_cols = [f"{c}_group" for c in DIAG_COLS]

    # Map ID columns using IDS_mapping.csv
    ids_file = RAW_DIR / "IDS_mapping.csv"
    if ids_file.exists():
        maps = build_id_maps_from_raw_text(ids_file)
        if maps:
            df = apply_id_maps(df, maps)
        else:
            print("Warning: Could not parse IDS_mapping.csv. Leaving ID columns numeric.")
    else:
        print("Warning: IDS_mapping.csv not found. Leaving ID columns numeric.")

    # Build feature schema
    schema = {
        "numeric_features": CORE_NUMERIC_FEATURES,
        "categorical_features": CORE_CATEGORICAL_FEATURES + diag_group_cols,
        "target_col": TARGET_COL,
        "split_col": SPLIT_COL,
        "notes": {
            "diagnosis_strategy": "broad_grouping",
            "id_mapping": "parsed from IDS_mapping.csv",
        },
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    (REPORTS_DIR / "feature_schema.json").write_text(json.dumps(schema, indent=2))

    # Save Phase 2 dataset locally (do NOT commit)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    out_file = PROCESSED_DIR / "phase2_features.parquet"
    df.to_parquet(out_file, index=False)

    print("Phase 2 complete.")
    print(f"Wrote: {REPORTS_DIR / 'feature_schema.json'}")
    print(f"Wrote: {out_file} (local only, do not commit)")
    print("\nPreview of mapped ID columns (first 5 rows):")
    print(df[["admission_type_id", "admission_source_id", "discharge_disposition_id"]].head())


if __name__ == "__main__":
    main()