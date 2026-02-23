from __future__ import annotations

import json

from config import (
    RAW_DATA_FILE,
    REPORTS_DIR,
    PROCESSED_DIR,
    RANDOM_SEED,
    TRAIN_FRAC,
    VAL_FRAC,
    TEST_FRAC,
)
from dataset import load_raw_diabetes_data, make_binary_label, basic_sanity_checks
from split import (
    SplitConfig,
    group_split_by_patient,
    assign_split_column,
    verify_no_patient_leakage,
    save_splits_json,
)


def main() -> None:
    # Load + sanity check
    df = load_raw_diabetes_data(RAW_DATA_FILE)
    basic_sanity_checks(df)

    # Label
    df = df.copy()
    df["target_readmit_lt30"] = make_binary_label(df, "readmitted")

    # Reports folder
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # Class balance report
    pos_rate = float(df["target_readmit_lt30"].mean())
    class_counts = df["target_readmit_lt30"].value_counts(dropna=False).to_dict()

    (REPORTS_DIR / "class_balance.json").write_text(
        json.dumps(
            {
                "n_rows": int(len(df)),
                "positive_rate": pos_rate,
                "class_counts": {str(k): int(v) for k, v in class_counts.items()},
            },
            indent=2,
        )
    )

    # Group split by patient
    cfg = SplitConfig(
        train_frac=TRAIN_FRAC, val_frac=VAL_FRAC, test_frac=TEST_FRAC, seed=RANDOM_SEED
    )
    splits = group_split_by_patient(df, patient_col="patient_nbr", cfg=cfg)
    save_splits_json(splits, REPORTS_DIR / "splits.json")

    # Assign split label to rows
    df["split"] = assign_split_column(df, patient_col="patient_nbr", splits=splits)

    # Drop rows missing split (only happens if patient_nbr is missing)
    if df["split"].isna().any():
        df = df.dropna(subset=["split"]).copy()

    verify_no_patient_leakage(df, patient_col="patient_nbr", split_col="split")

    # Split summary markdown
    summary_lines = []
    summary_lines.append("# Phase 1 Split Summary\n")
    summary_lines.append(f"- Total rows: {len(df)}")
    summary_lines.append(f"- Positive rate (<30): {pos_rate:.4f}\n")

    for s in ["train", "val", "test"]:
        sdf = df[df["split"] == s]
        summary_lines.append(f"## {s}")
        summary_lines.append(f"- rows: {len(sdf)}")
        summary_lines.append(f"- unique patients: {sdf['patient_nbr'].nunique()}")
        summary_lines.append(f"- positive rate: {sdf['target_readmit_lt30'].mean():.4f}\n")

    (REPORTS_DIR / "split_summary.md").write_text("\n".join(summary_lines))

    # Save processed Phase 1 artifact locally (DO NOT COMMIT)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    out_file = PROCESSED_DIR / "phase1_base.parquet"
    df.to_parquet(out_file, index=False)

    print("Phase 1 complete.")
    print(f"Wrote: {REPORTS_DIR / 'class_balance.json'}")
    print(f"Wrote: {REPORTS_DIR / 'splits.json'}")
    print(f"Wrote: {REPORTS_DIR / 'split_summary.md'}")
    print(f"Wrote: {out_file} (local only, do not commit)")


if __name__ == "__main__":
    main()