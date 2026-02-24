# ml/src/calibration.py
from __future__ import annotations

from dataclasses import dataclass
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import calibration_curve
from sklearn.metrics import brier_score_loss


def predict_proba_pos(model, X) -> np.ndarray:
    proba = model.predict_proba(X)
    return proba[:, 1]


def compute_brier(y_true, p_pred) -> float:
    return float(brier_score_loss(y_true, p_pred))


class PlattCalibrator:
    """
    Platt scaling (sigmoid calibration) fit on predicted probabilities.
    We fit a logistic regression on logit(p) features.

    Usage:
      cal = PlattCalibrator().fit(p_val, y_val)
      p_cal_test = cal.transform(p_test)
    """

    def __init__(self, eps: float = 1e-6):
        self.eps = eps
        self.lr = LogisticRegression(solver="lbfgs", max_iter=1000)

    def _logit(self, p: np.ndarray) -> np.ndarray:
        p = np.clip(p, self.eps, 1 - self.eps)
        return np.log(p / (1 - p))

    def fit(self, p_pred: np.ndarray, y_true: np.ndarray):
        x = self._logit(p_pred).reshape(-1, 1)
        self.lr.fit(x, y_true)
        return self

    def transform(self, p_pred: np.ndarray) -> np.ndarray:
        x = self._logit(p_pred).reshape(-1, 1)
        return self.lr.predict_proba(x)[:, 1]


def get_calibration_curve(y_true, p_pred, n_bins: int = 10):
    frac_pos, mean_pred = calibration_curve(
        y_true, p_pred, n_bins=n_bins, strategy="quantile"
    )
    return mean_pred, frac_pos