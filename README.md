<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">Clinical Risk Prediction Calibrated</h3>

  <p align="center">
    A healthcare ML system that predicts diabetes readmission risk using a trained model, serves predictions via FastAPI, and displays results in a React dashboard for patient review and manual entry.
  </p>
</div>

<!-- ABOUT THE PROJECT -->
## About The Project

Clinical Risk Prediction Dashboard is an end-to-end healthcare machine learning project built around the Diabetes 130-US Hospitals (1999-2008) dataset. It trains a calibrated readmission risk model, serves predictions through FastAPI, and presents results in a React dashboard with both patient-directory review and manual case entry.

Users can:

- browse indexed patient records from the processed cohort
- manually enter encounter details for a new assessment
- review 30-day readmission risk predictions
- inspect SHAP-based feature impact charts
- compare patients side by side

This repository also includes the training pipeline, calibration workflow, SHAP analysis, subgroup evaluation, cohort refinement steps, and exported model artifacts used by the API.

### Built With

* [![Python][Python.org]][Python-url]
* [![FastAPI][FastAPI.tiangolo.com]][FastAPI-url]
* [![React][React.dev]][React-url]
* [![Vite][Vite.dev]][Vite-url]
* [![XGBoost][XGBoost]][XGBoost-url]
* [![SHAP][SHAP]][SHAP-url]

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* Python 3.12 or later
* Node.js 18 or later
* npm

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/sanskritim05/clinical-risk-prediction-calibrated.git
   cd clinical-risk-prediction-calibrated
   ```
2. Create and activate the Python environment
   ```sh
   cd ml
   python -m venv .venv
   source .venv/bin/activate
   cd ..
   ```
3. Install backend dependencies
   ```sh
   pip install -r requirements.txt
   ```
4. Install frontend dependencies
   ```sh
   cd frontend
   npm install
   cd ..
   ```
5. Optional: configure the frontend API base URL
   ```sh
   cp frontend/.env.example frontend/.env
   ```
6. If you need to regenerate the processed data and model artifacts, run:
   ```sh
   cd ml
   python src/phase1_build.py
   python src/phase2_build.py
   python src/phase3_train_eval.py
   python src/phase4_calibration.py
   python src/phase5_shap.py
   python src/phase6_subgroup_eval.py
   python src/phase7_cohort_refinement.py
   python src/phase8_train_export.py
   cd ..
   ```

### Run Locally

1. Start the API
   ```sh
   cd ml
   source .venv/bin/activate
   uvicorn api.main:app --reload
   ```
2. Start the frontend
   ```sh
   cd frontend
   npm run dev
   ```
3. Open the app in your browser
   ```text
   http://localhost:5173
   ```
4. Optional backend docs
   ```text
   http://127.0.0.1:8000/docs
   ```

<!-- USAGE -->
## Usage

1. Open the dashboard in the browser.
2. Choose `Patient directory` to inspect saved cohort patients, or `Manual assessment` to enter a new case.
3. Review the predicted 30-day readmission risk.
4. Inspect the explainability chart to see which features are driving the prediction.
5. Optionally enable comparison mode to review patients side by side.

## Features

* FastAPI backend with health, prediction, explanation, and comparison endpoints
* Patient-directory workflow backed by processed cohort data
* Manual assessment workflow for direct feature entry
* Calibrated XGBoost readmission risk model
* SHAP-based patient-level explainability
* Side-by-side patient comparison view
* Reproducible ML pipeline covering preprocessing, training, calibration, and evaluation

## API Endpoints

* `GET /`
* `GET /health`
* `GET /get_patient_list?limit=50`
* `POST /predict`
* `POST /predict_patient`
* `POST /explain_patient`
* `POST /compare_patients`

<!-- PROJECT STRUCTURE -->
## Project Structure

```text
clinical-risk-prediction-calibrated/
├── api/
│   ├── __init__.py
│   ├── main.py
│   ├── model_loader.py
│   ├── patient_service.py
│   └── schemas.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── types.ts
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── ml/
│   ├── api/
│   ├── artifacts/
│   ├── data/
│   │   ├── processed/
│   │   └── raw/
│   ├── reports/
│   └── src/
├── DATASET.md
├── LICENSE
├── MODEL_CARD.md
├── README.md
└── requirements.txt
```

## Disclaimer

This project is for research, portfolio, and demonstration purposes only. It is not intended for clinical use or real-world medical decision-making.

<!-- MARKDOWN LINKS & IMAGES -->
[Python.org]: https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white
[Python-url]: https://python.org
[FastAPI.tiangolo.com]: https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white
[FastAPI-url]: https://fastapi.tiangolo.com
[React.dev]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev
[Vite.dev]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev
[XGBoost]: https://img.shields.io/badge/XGBoost-EC6B23?style=for-the-badge&logoColor=white
[XGBoost-url]: https://xgboost.readthedocs.io
[SHAP]: https://img.shields.io/badge/SHAP-2E8B57?style=for-the-badge&logoColor=white
[SHAP-url]: https://shap.readthedocs.io
