CORE_NUMERIC_FEATURES = [
    "time_in_hospital",
    "num_lab_procedures",
    "num_procedures",
    "num_medications",
    "number_outpatient",
    "number_emergency",
    "number_inpatient",
    "number_diagnoses",
]

CORE_CATEGORICAL_FEATURES = [
    "race",
    "gender",
    "age",
    "admission_type_id",
    "admission_source_id",
    "discharge_disposition_id",
    "max_glu_serum",
    "A1Cresult",
    "insulin",
    "metformin",
    "change",
    "diabetesMed",
]

DIAG_COLS = ["diag_1", "diag_2", "diag_3"]

TARGET_COL = "target_readmit_lt30"
SPLIT_COL = "split"
PATIENT_COL = "patient_nbr"