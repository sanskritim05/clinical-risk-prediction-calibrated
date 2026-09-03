import { explain, findPatient, listCohort, predict } from "./model";
import type {
  ComparisonEntry,
  DirectoryPatient,
  Explanation,
  FeaturePayload,
  PatientRecord,
  Prediction,
} from "./risk-types";

function toDirectoryPatient(patient: PatientRecord): DirectoryPatient {
  return {
    patient_id: patient.patient_id,
    race: patient.race,
    gender: patient.gender,
    age: patient.age,
    time_in_hospital: patient.time_in_hospital,
    number_inpatient: patient.number_inpatient,
    number_emergency: patient.number_emergency,
    number_diagnoses: patient.number_diagnoses,
    discharge_disposition: patient.discharge_disposition,
    admission_type: patient.admission_type,
  };
}

function requirePatient(patientId: string): PatientRecord {
  const patient = findPatient(patientId);
  if (!patient) {
    throw new Error(`Patient ${patientId} was not found in the demo cohort.`);
  }
  return patient;
}

export async function getPatientList(limit = 60): Promise<DirectoryPatient[]> {
  return listCohort(limit).map(toDirectoryPatient);
}

export async function predictPatient(patientId: string): Promise<Prediction> {
  return predict(requirePatient(patientId), patientId);
}

export async function predictManual(payload: FeaturePayload): Promise<Prediction> {
  return predict(payload);
}

export async function explainManual(payload: FeaturePayload): Promise<Explanation> {
  return explain(payload, "manual");
}

export async function explainPatient(patientId: string): Promise<Explanation> {
  return explain(requirePatient(patientId), patientId);
}

export async function comparePatients(
  patientIds: string[],
  directory: DirectoryPatient[] = [],
): Promise<ComparisonEntry[]> {
  return patientIds.map((patientId) => {
    const record = findPatient(patientId);
    const listed = directory.find((patient) => patient.patient_id === patientId);
    if (!record && !listed) {
      throw new Error(`Patient ${patientId} was not found in the demo cohort.`);
    }

    const features = record ?? requirePatient(patientId);
    return {
      patient: listed ?? toDirectoryPatient(features),
      prediction: predict(features, patientId),
      explanation: explain(features, patientId),
    };
  });
}
