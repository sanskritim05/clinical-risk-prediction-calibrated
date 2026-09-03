export const MODEL_NAME = "xgboost_filtered_cohort";
export const CLINICAL_THRESHOLD = 0.5;

export type NumericFeatureKey =
  | "time_in_hospital"
  | "num_lab_procedures"
  | "num_procedures"
  | "num_medications"
  | "number_outpatient"
  | "number_emergency"
  | "number_inpatient"
  | "number_diagnoses";

export type CategoricalFeatureKey =
  | "race"
  | "gender"
  | "age"
  | "admission_type"
  | "admission_source"
  | "discharge_disposition"
  | "max_glu_serum"
  | "A1Cresult"
  | "insulin"
  | "metformin"
  | "change"
  | "diabetesMed"
  | "diag_1_group"
  | "diag_2_group"
  | "diag_3_group";

export type FeaturePayload = Record<NumericFeatureKey, number> &
  Record<CategoricalFeatureKey, string>;

export interface PatientRecord extends FeaturePayload {
  patient_id: string;
}

export interface DirectoryPatient {
  patient_id: string;
  race: string;
  gender: string;
  age: string;
  time_in_hospital: number;
  number_inpatient: number;
  number_emergency: number;
  number_diagnoses: number | null;
  discharge_disposition: string;
  admission_type: string;
}

export interface ShapDriver {
  feature: string;
  value: number;
}

export interface Prediction {
  patient_id?: string;
  probability: number;
  label: 0 | 1;
  model: string;
  threshold: number;
}

export interface Explanation {
  patient_id: string;
  drivers: ShapDriver[];
  base_value: number;
}

export interface ComparisonEntry {
  patient: DirectoryPatient;
  prediction: Prediction;
  explanation: Explanation;
}

export const NUMERIC_FIELDS: { key: NumericFeatureKey; label: string }[] = [
  { key: "time_in_hospital", label: "Time in hospital (days)" },
  { key: "num_lab_procedures", label: "Lab procedures" },
  { key: "num_procedures", label: "Procedures" },
  { key: "num_medications", label: "Medications" },
  { key: "number_outpatient", label: "Outpatient visits" },
  { key: "number_emergency", label: "Emergency visits" },
  { key: "number_inpatient", label: "Inpatient visits" },
  { key: "number_diagnoses", label: "Diagnoses count" },
];

export const RACES = ["Caucasian", "AfricanAmerican", "Asian", "Hispanic", "Other"];
export const GENDERS = ["Female", "Male"];
export const AGES = [
  "[0-10)",
  "[10-20)",
  "[20-30)",
  "[30-40)",
  "[40-50)",
  "[50-60)",
  "[60-70)",
  "[70-80)",
  "[80-90)",
  "[90-100)",
];
export const ADMISSION_TYPES = [
  "Emergency",
  "Urgent",
  "Elective",
  "Trauma Center",
  "Not Available",
];
export const ADMISSION_SOURCES = [
  "Emergency Room",
  "Physician Referral",
  "Clinic Referral",
  "Transfer from hospital",
  "Transfer from SNF",
  "HMO Referral",
  "Unknown",
];
export const DISCHARGE_DISPOSITIONS = [
  "Discharged to home",
  "Discharged to short-term hospital",
  "Discharged to SNF",
  "Discharged to rehab facility",
  "Discharged to long-term care",
  "Admitted as inpatient",
];
export const MAX_GLU_SERUM = ["None", "Norm", ">200", ">300"];
export const A1C_RESULTS = ["None", "Norm", ">7", ">8"];
export const MED_LEVELS = ["No", "Up", "Down", "Steady"];
export const CHANGE_LEVELS = ["No", "Ch"];
export const DIABETES_MED = ["Yes", "No"];
export const DIAG_GROUPS = [
  "Circulatory",
  "Respiratory",
  "Digestive",
  "Injury/Poisoning",
  "Musculoskeletal",
  "Genitourinary",
  "Neoplasms",
  "Diabetes",
  "Other",
  "Missing/Unknown",
];

export const CATEGORICAL_FIELDS: {
  key: CategoricalFeatureKey;
  label: string;
  options: string[];
  group: "demographics" | "clinical";
}[] = [
  { key: "race", label: "Race", options: RACES, group: "demographics" },
  { key: "gender", label: "Gender", options: GENDERS, group: "demographics" },
  { key: "age", label: "Age bracket", options: AGES, group: "demographics" },
  {
    key: "admission_type",
    label: "Admission type",
    options: ADMISSION_TYPES,
    group: "demographics",
  },
  {
    key: "admission_source",
    label: "Admission source",
    options: ADMISSION_SOURCES,
    group: "demographics",
  },
  {
    key: "discharge_disposition",
    label: "Discharge disposition",
    options: DISCHARGE_DISPOSITIONS,
    group: "demographics",
  },
  {
    key: "max_glu_serum",
    label: "Max glucose serum",
    options: MAX_GLU_SERUM,
    group: "clinical",
  },
  { key: "A1Cresult", label: "A1C result", options: A1C_RESULTS, group: "clinical" },
  { key: "insulin", label: "Insulin", options: MED_LEVELS, group: "clinical" },
  { key: "metformin", label: "Metformin", options: MED_LEVELS, group: "clinical" },
  { key: "change", label: "Medication change", options: CHANGE_LEVELS, group: "clinical" },
  { key: "diabetesMed", label: "Diabetes medication", options: DIABETES_MED, group: "clinical" },
  {
    key: "diag_1_group",
    label: "Primary diagnosis group",
    options: DIAG_GROUPS,
    group: "clinical",
  },
  {
    key: "diag_2_group",
    label: "Secondary diagnosis group",
    options: DIAG_GROUPS,
    group: "clinical",
  },
  {
    key: "diag_3_group",
    label: "Tertiary diagnosis group",
    options: DIAG_GROUPS,
    group: "clinical",
  },
];

export const EXAMPLE_PAYLOAD: FeaturePayload = {
  time_in_hospital: 6,
  num_lab_procedures: 48,
  num_procedures: 1,
  num_medications: 18,
  number_outpatient: 1,
  number_emergency: 1,
  number_inpatient: 2,
  number_diagnoses: 9,
  race: "Caucasian",
  gender: "Female",
  age: "[70-80)",
  admission_type: "Emergency",
  admission_source: "Emergency Room",
  discharge_disposition: "Discharged to SNF",
  max_glu_serum: "None",
  A1Cresult: ">8",
  insulin: "Up",
  metformin: "No",
  change: "Ch",
  diabetesMed: "Yes",
  diag_1_group: "Circulatory",
  diag_2_group: "Diabetes",
  diag_3_group: "Respiratory",
};

export const EMPTY_PAYLOAD: FeaturePayload = {
  time_in_hospital: 3,
  num_lab_procedures: 40,
  num_procedures: 1,
  num_medications: 13,
  number_outpatient: 0,
  number_emergency: 0,
  number_inpatient: 0,
  number_diagnoses: 7,
  race: "Caucasian",
  gender: "Female",
  age: "[60-70)",
  admission_type: "Emergency",
  admission_source: "Emergency Room",
  discharge_disposition: "Discharged to home",
  max_glu_serum: "None",
  A1Cresult: "None",
  insulin: "No",
  metformin: "No",
  change: "No",
  diabetesMed: "Yes",
  diag_1_group: "Circulatory",
  diag_2_group: "Other",
  diag_3_group: "Other",
};

const DISPLAY_OVERRIDES: Record<string, string> = {
  AfricanAmerican: "African American",
  Ch: "Changed",
  Norm: "Normal",
};

export function prettyOption(value: string) {
  return DISPLAY_OVERRIDES[value] ?? value;
}

export function prettyFeature(name: string) {
  return name.replace(/_/g, " ");
}

export function prettyAge(age: string) {
  const m = age.match(/\[(\d+)-(\d+)\)/);
  if (!m) return age;
  return `${m[1]!}–${Number(m[2]!) - 1}`;
}
