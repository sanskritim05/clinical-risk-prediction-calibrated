# Clinical Risk Prediction (Calibrated)

End-to-end clinical readmission risk project with:
- ML pipeline for training, calibration, explainability, and subgroup evaluation
- FastAPI inference service for calibrated predictions
- React + Vite frontend for interactive risk checks

## Repository Layout

- `ml/`
- `ml/src/`: pipeline phases and training/evaluation code
- `ml/data/`: raw and processed dataset files
- `ml/reports/`: generated evaluation outputs and figures
- `ml/artifacts/`: exported model pipeline + calibrator + metadata
- `api/`: FastAPI app and model-loading utilities
- `frontend/`: React TypeScript UI (Vite)

## Prerequisites

- Python 3.11+ (3.12 works)
- Node.js 20+ and npm

## Python Setup (ML + API)

From repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install pandas numpy scikit-learn xgboost shap matplotlib fastapi uvicorn pydantic joblib pyarrow
```

## Data Placement

Place required raw files in:
- `ml/data/raw/diabetic_data.csv`
- `ml/data/raw/IDS_mapping.csv`

## Run ML Pipeline

From repo root:

```bash
python ml/src/phase1_build.py
python ml/src/phase2_build.py
python ml/src/phase3_train_eval.py
python ml/src/phase4_calibration.py
python ml/src/phase5_shap.py
python ml/src/phase6_subgroup_eval.py
python ml/src/phase7_cohort_refinement.py
python ml/src/phase8_train_export.py
```

Expected export artifacts:
- `ml/artifacts/xgb_pipeline.joblib`
- `ml/artifacts/platt_calibrator.joblib`
- `ml/artifacts/model_meta.json`

## Run API

From repo root:

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Prediction endpoint:

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"features": {}}'
```

Note: `features` keys should match `feature_cols` in `ml/artifacts/model_meta.json`.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:5173` (CORS is preconfigured in the API for local Vite hosts).

## Git Ignore Policy

Root `.gitignore` excludes:
- Python caches, venvs, build outputs
- Node modules and Vite build outputs
- Environment files and local logs
- Generated ML data directories and model binaries

If you want to version specific generated outputs, remove or narrow those patterns.
