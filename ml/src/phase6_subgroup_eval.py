# ml/src/phase6_subgroup_eval.py
from __future__ import annotations

import json
from typing import Dict, Any

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss

from config import PROCESSED_DIR, REPORTS_DIR, RANDOM_SEED
from features import CORE_NUMERIC_FEATURES, CORE_CATEGORICAL_FEATURES, DIAG_COLS, TARGET_COL
from preprocess import PreprocessSpec, get_split_frames
from train_baselines import TrainConfig, train_xgboost


def compute_metrics(y_true: np.ndarray, p_pred: np.ndarray) -> Dict[str, Any]:
    """Compute core metrics for a binary classifier."""
    return {
        "n": int(len(y_true)),
        "prevalence": float(np.mean(y_true)),
        "roc_auc": float(roc_auc_score(y_true, p_pred)),
        "pr_auc": float(average_precision_score(y_true, p_pred)),
        "brier": float(brier_score_loss(y_true, p_pred)),
    }


def evaluate_by_group(df_test: pd.DataFrame, p_test: pd.Series, group_col: str) -> Dict[str, Any]:
    """
    Compute metrics per subgroup.
    Skips groups where y has only one class (cannot compute ROC/PR).
    """
    results: Dict[str, Any] = {}

    if group_col not in df_test.columns:
        raise ValueError(f"Group column '{group_col}' not found in test dataframe.")

    # Ensure predictions align to df_test index
    missing = df_test.index.difference(p_test.index)
    if len(missing) > 0:
        raise ValueError(
            f"Predictions are missing {len(missing)} indices from df_test. "
            "Index alignment is broken."
        )

    for group, sub_df in df_test.groupby(group_col, dropna=False):
        idx = sub_df.index
        y = sub_df[TARGET_COL].to_numpy()
        p = p_test.loc[idx].to_numpy()

        # Skip degenerate groups (all 0 or all 1)
        if len(np.unique(y)) < 2:
            continue

        results[str(group)] = compute_metrics(y, p)

    return results


def write_markdown_tables(out: Dict[str, Any], path: str) -> None:
    lines = []
    lines.append("# Phase 6: Subgroup Performance (XGBoost)\n")
    lines.append(
        "Subgroup evaluation was performed on the held-out **test** split using the XGBoost model. "
        "Metrics include discrimination (ROC-AUC), precision-recall behavior (PR-AUC), and calibration (Brier score).\n"
    )

    def table(title: str, metrics: Dict[str, Any]) -> None:
        lines.append(f"## {title}\n")
        lines.append("| Group | N | Prevalence | ROC-AUC | PR-AUC | Brier |")
        lines.append("|---|---:|---:|---:|---:|---:|")

        # Sort groups by N desc for readability
        for g, m in sorted(metrics.items(), key=lambda kv: kv[1]["n"], reverse=True):
            lines.append(
                f"| {g} | {m['n']} | {m['prevalence']:.3f} | "
                f"{m['roc_auc']:.3f} | {m['pr_auc']:.3f} | {m['brier']:.3f} |"
            )
        lines.append("")

    table("By Gender", out["gender"])
    table("By Age Bracket", out["age"])

    lines.append("## Interpretation\n")
    lines.append(
        "- PR-AUC differences should be interpreted relative to subgroup prevalence.\n"
        "- These results are descriptive performance stratification, not a causal fairness conclusion.\n"
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def plot_roc_bar(out: Dict[str, Any], out_path: str) -> None:
    """
    Simple bar chart of ROC-AUC by group (gender + age).
    """
    plt.figure(figsize=(10, 4))

    # Gender bars
    gender_items = sorted(out["gender"].items(), key=lambda kv: kv[1]["roc_auc"], reverse=True)
    gender_labels = [k for k, _ in gender_items]
    gender_vals = [v["roc_auc"] for _, v in gender_items]

    # Age bars
    age_items = sorted(out["age"].items(), key=lambda kv: kv[1]["roc_auc"], reverse=True)
    age_labels = [k for k, _ in age_items]
    age_vals = [v["roc_auc"] for _, v in age_items]

    # Plot as two adjacent bar groups (no custom colors)
    x1 = np.arange(len(gender_labels))
    x2 = np.arange(len(age_labels)) + (len(gender_labels) + 2)

    plt.bar(x1, gender_vals)
    plt.bar(x2, age_vals)

    plt.xticks(
        list(x1) + list(x2),
        gender_labels + age_labels,
        rotation=30,
        ha="right",
    )
    plt.ylabel("ROC-AUC")
    plt.title("ROC-AUC by Subgroup (XGBoost)")
    plt.tight_layout()
    plt.savefig(out_path, dpi=200, bbox_inches="tight")
    plt.close()


def main() -> None:
    phase2_file = PROCESSED_DIR / "phase2_features.parquet"
    if not phase2_file.exists():
        raise FileNotFoundError(f"Missing {phase2_file}. Run Phase 2 first.")

    df = pd.read_parquet(phase2_file)

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

    # Train flagship model (same params as Phase 3)
    xgb = train_xgboost(spec, cfg)
    xgb.fit(X_train, y_train)

    # Predict on test
    p_test = pd.Series(xgb.predict_proba(X_test)[:, 1], index=X_test.index)

    df_test = df[df["split"] == "test"].copy()

    out = {
        "gender": evaluate_by_group(df_test, p_test, "gender"),
        "age": evaluate_by_group(df_test, p_test, "age"),
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    (REPORTS_DIR / "subgroup_metrics.json").write_text(json.dumps(out, indent=2))
    write_markdown_tables(out, str(REPORTS_DIR / "subgroup_results.md"))
    plot_roc_bar(out, str(REPORTS_DIR / "subgroup_roc_by_group.png"))

    print("Phase 6 complete.")
    print(f"Wrote: {REPORTS_DIR / 'subgroup_metrics.json'}")
    print(f"Wrote: {REPORTS_DIR / 'subgroup_results.md'}")
    print(f"Wrote: {REPORTS_DIR / 'subgroup_roc_by_group.png'}")


if __name__ == "__main__":
    main()