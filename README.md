# Clinical Risk Prediction with Calibration and Explainability

An end-to-end machine learning project for predicting **30-day hospital readmission risk** using the **Diabetes 130-US Hospitals (1999-2008)** dataset.

<video src="demo.mp4" controls width="800"></video>

This repository demonstrates the full lifecycle of a healthcare machine learning system:

- Data preprocessing and leakage-safe splitting
- Feature engineering
- Model training and comparison
- Calibration analysis
- SHAP explainability
- Subgroup performance evaluation
- Cohort refinement experiments
- Model export
- FastAPI deployment
- Interactive React dashboard

**Disclaimer:**  
This project is for research and portfolio demonstration purposes only. It is not intended for clinical use.

---

## Project Overview

Hospital readmissions are costly and often preventable. Predicting which patients are likely to be readmitted within 30 days can help healthcare providers prioritize follow-up care and interventions.

This project builds a calibrated machine learning model that estimates the **probability of a patient being readmitted within 30 days of discharge**.

The work goes beyond basic model training and focuses on:

- Realistic clinical evaluation
- Probability calibration
- Model interpretability
- Subgroup analysis
- Deployable ML systems

---

## Dataset

**Dataset:** Diabetes 130-US Hospitals for Years 1999-2008  
**Source:** UCI Machine Learning Repository

The dataset contains **100,000+ hospital encounters** including:

- Demographics
- Lab procedures
- Medications
- Diagnoses
- Hospital admission information
- Discharge disposition
- Prior healthcare utilization

### Target Definition

The original dataset includes a `readmitted` column:

| Value | Meaning |
| --- | --- |
| `NO` | No readmission |
| `>30` | Readmitted after 30 days |
| `<30` | Readmitted within 30 days |

For this project:

```text
target_readmit_lt30 = 1 if readmitted == "<30"
target_readmit_lt30 = 0 otherwise
```

Positive class prevalence is approximately **11%**.

---

## Project Structure

```text
clinical-risk-prediction-calibrated/
├── api/                      # FastAPI inference service
│   ├── main.py
│   ├── model_loader.py
│   └── schemas.py
├── frontend/                 # React dashboard
│   └── src/
├── ml/
│   ├── artifacts/            # exported models (local only)
│   ├── data/
│   │   ├── raw/              # raw dataset 
│   │   └── processed/        # processed datasets
│   ├── reports/              # evaluation outputs
│   └── src/                  # training pipeline scripts
├── DATASET.md
├── MODEL_CARD.md
├── README.md
└── .gitignore
```

---

## Machine Learning Pipeline

The project was built in structured phases.

### Phase 1 - Data Loading and Splitting

- Load UCI dataset
- Create binary readmission target
- Perform **patient-level train/validation/test split**
- Generate class balance and split reports

---

### Phase 2 - Feature Engineering

Key transformations:

- Diagnosis codes mapped into **clinical groups**
- ID fields mapped to readable labels using `IDS_mapping.csv`
- Numeric and categorical feature schema defined

Example diagnosis groups:

- Circulatory
- Respiratory
- Digestive
- Genitourinary
- Diabetes
- Neoplasms
- Injury / poisoning
- Other

---

### Phase 3 - Baseline Models

Two models were trained:

| Model | Purpose |
| --- | --- |
| Logistic Regression | Interpretable baseline |
| XGBoost | Non-linear boosted tree model |

Evaluation metrics:

- ROC-AUC
- PR-AUC

#### Test Results

| Model | ROC-AUC | PR-AUC |
| --- | ---: | ---: |
| Logistic Regression | 0.661 | 0.205 |
| XGBoost | 0.667 | 0.223 |

PR-AUC is particularly important due to the class imbalance.

---

### Phase 4 - Probability Calibration

Healthcare models require well-calibrated probabilities.

Calibration was evaluated using:

- Brier score
- Calibration curves

#### Brier Score (lower is better)

| Model | Before | After |
| --- | ---: | ---: |
| Logistic Regression | 0.223 | 0.095 |
| XGBoost | 0.094 | 0.094 |

XGBoost was already well-calibrated.  
Logistic regression improved significantly after Platt scaling.

---

### Phase 5 - SHAP Explainability

SHAP values were used to identify features influencing predictions.

Important features included:

- Discharge disposition
- Prior inpatient visits
- Diagnosis group
- Number of lab procedures
- Hospital stay length

SHAP outputs generated:

- Global summary plot
- Top features JSON
- Example patient explanation

---

### Phase 6 - Subgroup Performance

Model performance was evaluated across demographic subgroups.

#### Gender

| Group | ROC-AUC |
| --- | ---: |
| Female | 0.664 |
| Male | 0.670 |

#### Age Brackets

Performance varied slightly across age groups but remained broadly consistent.

---

### Phase 7 - Cohort Refinement

Certain discharge outcomes make readmission impossible or clinically irrelevant:

- Expired
- Hospice / home
- Hospice / medical facility

These categories were removed to create a refined prediction cohort.

Result:

- Model interpretation improved
- SHAP importance became more clinically meaningful

---

### Phase 8 - Model Export

The final deployable model includes:

- Trained XGBoost pipeline
- Platt calibration model
- Metadata describing feature schema

Artifacts produced:

```text
ml/artifacts/
  xgb_pipeline.joblib
  platt_calibrator.joblib
  model_meta.json
```

---

## API Deployment

A FastAPI service exposes the model.

### Run the API

```bash
uvicorn api.main:app --reload
```

### Endpoints

#### Health check

`GET /health`

Example response:

```json
{
  "status": "ok",
  "model": "xgboost_filtered_cohort"
}
```

#### Prediction endpoint

`POST /predict`

Example request:

```json
{
  "features": {
    "time_in_hospital": 4,
    "num_lab_procedures": 42,
    "num_procedures": 1,
    "num_medications": 12
  }
}
```

Example response:

```json
{
  "probability_readmit_lt30": 0.157,
  "predicted_label": 0,
  "threshold": 0.5
}
```

---

## Frontend Dashboard

A React interface allows interactive predictions.

Features:

- Patient encounter input form
- Example patient loader
- Calibrated probability display
- Risk interpretation guide
- Research disclaimer

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## How to Reproduce the Project

### 1. Clone the repository

```bash
git clone https://github.com/sanskritim05/clinical-risk-prediction-calibrated.git
cd clinical-risk-prediction-calibrated
```

### 2. Create Python environment

```bash
cd ml
python -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r ../requirements.txt
```

### 4. Add dataset files

Place the following files locally:

```text
ml/data/raw/
  diabetic_data.csv
  IDS_mapping.csv
```

These files are excluded from version control.

### 5. Run pipeline

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

### 6. Run API

```bash
uvicorn api.main:app --reload
```

### 7. Run frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Limitations

- Dataset reflects older hospital practices
- Limited clinical variables compared to real EHR systems
- Not validated on external datasets
- Dashboard does not yet show per-patient SHAP explanations

## Future Improvements

Potential next steps:

- Integrate SHAP explanations into frontend
- Add model monitoring
- Add model versioning
- Evaluate LightGBM / CatBoost
- Deploy using Docker
- Add external validation dataset

## Why This Project Matters

Healthcare machine learning systems must be evaluated beyond simple accuracy.

This project demonstrates:

- Probability calibration
- Interpretability
- Cohort definition
- Subgroup performance
- Deployable ML systems

These components are essential for trustworthy clinical ML applications.
