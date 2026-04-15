from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import (
    ComparePatientsRequest,
    ComparedPatientResponse,
    ExplainPatientResponse,
    PatientIdRequest,
    PatientListItem,
    PatientPredictionResponse,
    PredictRequest,
    PredictResponse,
)
from api.model_loader import CAL, META, PIPE, features_to_frame
from api.patient_service import compare_patients, explain_patient, get_patient_list, predict_patient

app = FastAPI(
    title="Clinical Risk Prediction API",
    version="0.1.0",
    description="Calibrated 30-day readmission risk prediction for a filtered clinical cohort."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


LOAD_ERROR = None if all(item is not None for item in (PIPE, CAL, META)) else (
    "Model artifacts could not be loaded. Run Phase 8 export to create ml/artifacts."
)


@app.get("/")
def root():
    return {
        "name": "Clinical Risk Prediction API",
        "status": "ok" if LOAD_ERROR is None else "error",
        "model": META.get("model_name") if META else None,
        "detail": LOAD_ERROR or "API is running.",
        "docs": "/docs",
        "health": "/health",
        "available_endpoints": [
            "/get_patient_list?limit=50",
            "/predict",
            "/predict_patient",
            "/explain_patient",
            "/compare_patients",
        ],
    }


@app.get("/health")
def health():
    if LOAD_ERROR:
        return {
            "status": "error",
            "detail": LOAD_ERROR,
        }

    return {
        "status": "ok",
        "model": META.get("model_name"),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if LOAD_ERROR:
        raise HTTPException(status_code=500, detail=LOAD_ERROR)

    try:
        X = features_to_frame(req.features, META)

        # Base probability from model pipeline
        p_base = PIPE.predict_proba(X)[:, 1]

        # Calibrated probability
        p_cal = float(CAL.transform(p_base)[0])

        threshold = 0.5
        yhat = int(p_cal >= threshold)

        return PredictResponse(
            served_model_name=META["model_name"],
            probability_readmit_lt30=p_cal,
            predicted_label=yhat,
            threshold=threshold,
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")


@app.get("/get_patient_list", response_model=list[PatientListItem])
def patient_list(limit: int = 50):
    if LOAD_ERROR:
        raise HTTPException(status_code=500, detail=LOAD_ERROR)

    try:
        return get_patient_list(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not load patient list: {e}")


@app.post("/predict_patient", response_model=PatientPredictionResponse)
def predict_patient_endpoint(req: PatientIdRequest):
    if LOAD_ERROR:
        raise HTTPException(status_code=500, detail=LOAD_ERROR)

    try:
        return predict_patient(req.patient_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")


@app.post("/explain_patient", response_model=ExplainPatientResponse)
def explain_patient_endpoint(req: PatientIdRequest):
    if LOAD_ERROR:
        raise HTTPException(status_code=500, detail=LOAD_ERROR)

    try:
        return explain_patient(req.patient_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Explanation failed: {e}")


@app.post("/compare_patients", response_model=list[ComparedPatientResponse])
def compare_patients_endpoint(req: ComparePatientsRequest):
    if LOAD_ERROR:
        raise HTTPException(status_code=500, detail=LOAD_ERROR)

    try:
        return compare_patients(req.patient_ids)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Comparison failed: {e}")
