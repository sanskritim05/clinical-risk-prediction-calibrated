# ml/src/evaluate.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any

import numpy as np
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    roc_curve,
    precision_recall_curve,
)
import matplotlib.pyplot as plt


@dataclass
class EvalResult:
    roc_auc: float
    pr_auc: float


def predict_proba_pos(model, X) -> np.ndarray:
    proba = model.predict_proba(X)
    return proba[:, 1]


def evaluate_discrimination(model, X, y) -> EvalResult:
    p = predict_proba_pos(model, X)
    return EvalResult(
        roc_auc=float(roc_auc_score(y, p)),
        pr_auc=float(average_precision_score(y, p)),
    )


def plot_roc(models: Dict[str, Any], X, y, out_path) -> None:
    plt.figure()
    for name, model in models.items():
        p = predict_proba_pos(model, X)
        fpr, tpr, _ = roc_curve(y, p)
        plt.plot(fpr, tpr, label=name)
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.legend()
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()


def plot_pr(models: Dict[str, Any], X, y, out_path) -> None:
    plt.figure()
    for name, model in models.items():
        p = predict_proba_pos(model, X)
        prec, rec, _ = precision_recall_curve(y, p)
        plt.plot(rec, prec, label=name)
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.legend()
    plt.tight_layout()
    plt.savefig(out_path)
    plt.close()