from __future__ import annotations

from fastapi import FastAPI, HTTPException

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import PredictRequest, PredictResponse
from api.model_loader import load_artifacts, features_to_frame

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


try:
    PIPE, CAL, META = load_artifacts()
    LOAD_ERROR = None
except Exception as e:
    PIPE, CAL, META = None, None, None
    LOAD_ERROR = str(e)


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