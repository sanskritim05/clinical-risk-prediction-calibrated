from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from preprocess import PreprocessSpec, build_preprocessor


@dataclass(frozen=True)
class TrainConfig:
    seed: int = 42


def train_logistic_regression(spec: PreprocessSpec, cfg: TrainConfig) -> Pipeline:
    pre = build_preprocessor(spec)

    clf = LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        random_state=cfg.seed,
        n_jobs=None,
    )

    model = Pipeline(steps=[("preprocess", pre), ("model", clf)])
    return model


def train_xgboost(spec: PreprocessSpec, cfg: TrainConfig) -> Pipeline:
    """
    Train an XGBoost classifier inside a sklearn Pipeline.

    We keep params conservative to avoid overfitting out of the gate.
    """
    from xgboost import XGBClassifier

    pre = build_preprocessor(spec)

    xgb = XGBClassifier(
        n_estimators=400,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=1.0,
        min_child_weight=1,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=cfg.seed,
        n_jobs=8,
    )

    model = Pipeline(steps=[("preprocess", pre), ("model", xgb)])
    return model