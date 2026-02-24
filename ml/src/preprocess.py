from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


@dataclass(frozen=True)
class PreprocessSpec:
    numeric_features: List[str]
    categorical_features: List[str]


def build_preprocessor(spec: PreprocessSpec) -> ColumnTransformer:
    num_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    cat_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", num_pipe, spec.numeric_features),
            ("cat", cat_pipe, spec.categorical_features),
        ],
        remainder="drop",
    )


def get_split_frames(
    df: pd.DataFrame,
    feature_cols: List[str],
    target_col: str,
    split_col: str = "split",
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    missing = [c for c in feature_cols + [target_col, split_col] if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    train_df = df[df[split_col] == "train"]
    val_df = df[df[split_col] == "val"]
    test_df = df[df[split_col] == "test"]

    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_val, y_val = val_df[feature_cols], val_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]

    return X_train, y_train, X_val, y_val, X_test, y_test