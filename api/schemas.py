from __future__ import annotations

from typing import Any, Dict, List
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


class PatientListItem(BaseModel):
    patient_nbr: str
    race: str
    gender: str
    age: str
    time_in_hospital: int
    number_inpatient: int
    number_emergency: int
    discharge_disposition_id: str
    admission_type_id: str


class PatientIdRequest(BaseModel):
    patient_id: str


class ComparePatientsRequest(BaseModel):
    patient_ids: List[str]


class PatientPredictionResponse(BaseModel):
    probability: float
    label: int
    threshold: float
    served_model_name: str


class ExplanationContribution(BaseModel):
    feature: str
    value: float
    shap_value: float


class ExplanationPayload(BaseModel):
    top_positive: List[ExplanationContribution]
    top_negative: List[ExplanationContribution]


class ExplainPatientResponse(BaseModel):
    explanation: ExplanationPayload


class ComparedPatientResponse(BaseModel):
    patient_id: str
    prediction: PatientPredictionResponse
    explanation: ExplanationPayload
