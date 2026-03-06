from __future__ import annotations

from typing import Any, Dict
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    features: Dict[str, Any] = Field(
        ...,
        description="Raw feature values keyed by the original model feature column names."
    )


class PredictResponse(BaseModel):
    served_model_name: str
    probability_readmit_lt30: float
    predicted_label: int
    threshold: float