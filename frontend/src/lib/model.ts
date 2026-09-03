/**
 * In-browser scoring engine for the Vercel static deploy.
 *
 * A deterministic additive logit model stands in for the trained
 * xgboost_filtered_cohort artifact, then applies Platt scaling.
 * Feature drivers are exact additive contributions vs the cohort baseline
 * (the additive-model analogue of TreeSHAP). Research/demo only.
 */
import {
  ADMISSION_SOURCES,
  ADMISSION_TYPES,
  AGES,
  A1C_RESULTS,
  CHANGE_LEVELS,
  CLINICAL_THRESHOLD,
  DIAG_GROUPS,
  DISCHARGE_DISPOSITIONS,
  DIABETES_MED,
  GENDERS,
  MAX_GLU_SERUM,
  MED_LEVELS,
  MODEL_NAME,
  RACES,
  type Explanation,
  type FeaturePayload,
  type NumericFeatureKey,
  type PatientRecord,
  type Prediction,
} from "./risk-types";

const NUMERIC_WEIGHTS: Record<NumericFeatureKey, { w: number; base: number }> = {
  time_in_hospital: { w: 0.048, base: 4.4 },
  num_lab_procedures: { w: 0.0035, base: 43 },
  num_procedures: { w: -0.032, base: 1.4 },
  num_medications: { w: 0.011, base: 16 },
  number_outpatient: { w: 0.085, base: 0.37 },
  number_emergency: { w: 0.215, base: 0.2 },
  number_inpatient: { w: 0.395, base: 0.64 },
  number_diagnoses: { w: 0.062, base: 7.4 },
};

const CATEGORICAL_WEIGHTS: Record<string, Record<string, number>> = {
  race: { Caucasian: 0.0, AfricanAmerican: 0.05, Asian: -0.06, Hispanic: -0.02, Other: -0.01 },
  gender: { Female: 0.02, Male: -0.02 },
  age: {
    "[0-10)": -0.5,
    "[10-20)": -0.42,
    "[20-30)": -0.24,
    "[30-40)": -0.12,
    "[40-50)": -0.04,
    "[50-60)": 0.04,
    "[60-70)": 0.1,
    "[70-80)": 0.18,
    "[80-90)": 0.24,
    "[90-100)": 0.2,
  },
  admission_type: {
    Emergency: 0.14,
    Urgent: 0.08,
    Elective: -0.18,
    "Trauma Center": 0.02,
    "Not Available": -0.03,
  },
  admission_source: {
    "Emergency Room": 0.11,
    "Physician Referral": -0.12,
    "Clinic Referral": -0.09,
    "Transfer from hospital": 0.16,
    "Transfer from SNF": 0.22,
    "HMO Referral": -0.07,
    Unknown: 0.0,
  },
  discharge_disposition: {
    "Discharged to home": -0.16,
    "Discharged to short-term hospital": 0.24,
    "Discharged to SNF": 0.31,
    "Discharged to rehab facility": 0.12,
    "Discharged to long-term care": 0.27,
    "Admitted as inpatient": 0.2,
  },
  max_glu_serum: { None: 0.0, Norm: -0.05, ">200": 0.11, ">300": 0.17 },
  A1Cresult: { None: 0.0, Norm: -0.09, ">7": 0.08, ">8": 0.15 },
  insulin: { No: -0.06, Up: 0.16, Down: 0.1, Steady: 0.04 },
  metformin: { No: 0.03, Up: 0.05, Down: 0.04, Steady: -0.08 },
  change: { No: -0.05, Ch: 0.09 },
  diabetesMed: { Yes: 0.07, No: -0.1 },
  diag_1_group: {
    Circulatory: 0.09,
    Respiratory: 0.05,
    Digestive: 0.0,
    "Injury/Poisoning": -0.06,
    Musculoskeletal: -0.11,
    Genitourinary: 0.04,
    Neoplasms: 0.12,
    Diabetes: 0.1,
    Other: 0.0,
    "Missing/Unknown": 0.02,
  },
  diag_2_group: {
    Circulatory: 0.05,
    Respiratory: 0.03,
    Digestive: 0.0,
    "Injury/Poisoning": -0.03,
    Musculoskeletal: -0.05,
    Genitourinary: 0.03,
    Neoplasms: 0.07,
    Diabetes: 0.06,
    Other: 0.0,
    "Missing/Unknown": 0.01,
  },
  diag_3_group: {
    Circulatory: 0.03,
    Respiratory: 0.02,
    Digestive: 0.0,
    "Injury/Poisoning": -0.02,
    Musculoskeletal: -0.03,
    Genitourinary: 0.02,
    Neoplasms: 0.04,
    Diabetes: 0.05,
    Other: 0.0,
    "Missing/Unknown": 0.01,
  },
};

const BASE_LOGIT = -0.62;
const PLATT_A = 1.18;
const PLATT_B = -0.07;

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function categoricalBaseline(key: string) {
  const weights = CATEGORICAL_WEIGHTS[key]!;
  const values = Object.values(weights);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function contributions(payload: FeaturePayload) {
  const out: { feature: string; value: number }[] = [];
  for (const [key, { w, base }] of Object.entries(NUMERIC_WEIGHTS)) {
    const x = Number(payload[key as NumericFeatureKey] ?? base);
    out.push({ feature: key, value: w * (x - base) });
  }
  for (const key of Object.keys(CATEGORICAL_WEIGHTS)) {
    const raw = String((payload as Record<string, unknown>)[key] ?? "");
    const w = CATEGORICAL_WEIGHTS[key]![raw] ?? 0;
    out.push({ feature: key, value: w - categoricalBaseline(key) });
  }
  return out;
}

export function predict(payload: FeaturePayload, patientId?: string): Prediction {
  const contribs = contributions(payload);
  const logit = BASE_LOGIT + contribs.reduce((a, c) => a + c.value, 0);
  const calibrated = sigmoid(PLATT_A * logit + PLATT_B);
  const probability = Math.min(0.99, Math.max(0.01, calibrated));
  return {
    ...(patientId ? { patient_id: patientId } : {}),
    probability,
    label: probability >= CLINICAL_THRESHOLD ? 1 : 0,
    model: MODEL_NAME,
    threshold: CLINICAL_THRESHOLD,
  };
}

export function explain(payload: FeaturePayload, patientId: string): Explanation {
  const drivers = contributions(payload)
    .filter((d) => Math.abs(d.value) > 1e-6)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 10);
  return { patient_id: patientId, drivers, base_value: sigmoid(BASE_LOGIT) };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EXCLUDED_DISPOSITIONS = ["Expired", "Hospice / home", "Hospice / medical facility"];

let cache: PatientRecord[] | null = null;

export function listCohort(limit = 60): PatientRecord[] {
  if (!cache) {
    const rnd = mulberry32(20240917);
    const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)] as T;
    const pois = (mean: number, max: number) =>
      Math.min(max, Math.floor(Math.pow(rnd(), 2.2) * (mean * 3 + 1)));
    const rows: PatientRecord[] = [];
    for (let i = 0; i < 60; i++) {
      const disposition = pick(DISCHARGE_DISPOSITIONS);
      if (EXCLUDED_DISPOSITIONS.includes(disposition)) continue;
      rows.push({
        patient_id: String(100238 + i * 7919).padStart(8, "0"),
        time_in_hospital: 1 + Math.floor(rnd() * 13),
        num_lab_procedures: 8 + Math.floor(rnd() * 80),
        num_procedures: Math.floor(rnd() * 6),
        num_medications: 3 + Math.floor(rnd() * 30),
        number_outpatient: pois(0.4, 12),
        number_emergency: pois(0.3, 10),
        number_inpatient: pois(0.7, 9),
        number_diagnoses: 3 + Math.floor(rnd() * 7),
        race: pick(RACES),
        gender: pick(GENDERS),
        age: pick(AGES.slice(2)),
        admission_type: pick(ADMISSION_TYPES),
        admission_source: pick(ADMISSION_SOURCES),
        discharge_disposition: disposition,
        max_glu_serum: pick(MAX_GLU_SERUM),
        A1Cresult: pick(A1C_RESULTS),
        insulin: pick(MED_LEVELS),
        metformin: pick(MED_LEVELS),
        change: pick(CHANGE_LEVELS),
        diabetesMed: pick(DIABETES_MED),
        diag_1_group: pick(DIAG_GROUPS),
        diag_2_group: pick(DIAG_GROUPS),
        diag_3_group: pick(DIAG_GROUPS),
      });
    }
    cache = rows;
  }
  return cache.slice(0, limit);
}

export function findPatient(patientId: string) {
  return listCohort(60).find((p) => p.patient_id === patientId) ?? null;
}
