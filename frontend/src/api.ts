import type {
  ComparedPatient,
  ModelPredictResponse,
  PatientExplanation,
  PatientListItem,
  PatientPrediction,
} from "./types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8000";

async function rpcCall<TResponse, TPayload = undefined>(
  path: string,
  payload?: TPayload,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: payload ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    body: payload ? JSON.stringify(payload) : undefined,
    ...init,
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { detail?: string }
      | null;
    throw new Error(errorPayload?.detail || `Request failed for ${path}`);
  }

  return (await response.json()) as TResponse;
}

export function getPatientList(limit = 50) {
  return rpcCall<PatientListItem[]>(`/get_patient_list?limit=${limit}`);
}

export function predictPatient(patientId: string) {
  return rpcCall<PatientPrediction, { patient_id: string }>("/predict_patient", {
    patient_id: patientId,
  });
}

export function predictEncounter(features: Record<string, string | number | null>) {
  return rpcCall<ModelPredictResponse, { features: Record<string, string | number | null> }>(
    "/predict",
    { features }
  );
}

export async function explainPatient(patientId: string) {
  const response = await rpcCall<
    { explanation: PatientExplanation },
    { patient_id: string }
  >("/explain_patient", {
    patient_id: patientId,
  });

  return response.explanation;
}

export function comparePatients(patientIds: string[]) {
  return rpcCall<ComparedPatient[], { patient_ids: string[] }>(
    "/compare_patients",
    {
      patient_ids: patientIds,
    }
  );
}
