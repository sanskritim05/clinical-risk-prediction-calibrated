# Clinical Risk Prediction with Calibration + Explainability

Predict 30-day hospital readmission risk using the Diabetes 130-US hospitals dataset.
Includes calibrated probability estimates, SHAP-based explanations, and subgroup performance auditing.

## Project Components
- `ml/`: training, evaluation, calibration, explainability, subgroup audit
- `backend/`: FastAPI service exposing `/predict` and `/explain`
- `frontend/`: React UI for entering encounter features and viewing risk + explanations

## Status
Work in progress.