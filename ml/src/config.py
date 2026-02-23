from pathlib import Path

# repo_root/clinical-risk-prediction-calibrated/
PROJECT_ROOT = Path(__file__).resolve().parents[2]
ML_DIR = PROJECT_ROOT / "ml"

DATA_DIR = ML_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"

REPORTS_DIR = ML_DIR / "reports"

# expecting: ml/data/raw/diabetic_data.csv
RAW_DATA_FILE = RAW_DIR / "diabetic_data.csv"

RANDOM_SEED = 42

# patient-group split fractions
TRAIN_FRAC = 0.70
VAL_FRAC = 0.15
TEST_FRAC = 0.15

assert abs(TRAIN_FRAC + VAL_FRAC + TEST_FRAC - 1.0) < 1e-9