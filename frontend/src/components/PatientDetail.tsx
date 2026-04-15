import { useEffect, useState } from "react";

import { explainPatient, predictPatient } from "../api";
import type { PatientExplanation, PatientListItem, PatientPrediction } from "../types";
import { PredictionGauge } from "./PredictionGauge";
import { SHAPWaterfall } from "./SHAPWaterfall";

type PatientDetailProps = {
  patient: PatientListItem | null;
};

export function PatientDetail({ patient }: PatientDetailProps) {
  const [prediction, setPrediction] = useState<PatientPrediction | null>(null);
  const [explanation, setExplanation] = useState<PatientExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patient) {
      return;
    }

    const patientId = patient.patient_nbr;
    let cancelled = false;

    async function loadPatientDetail() {
      setLoading(true);
      setError("");

      try {
        const [predictionResponse, explanationResponse] = await Promise.all([
          predictPatient(patientId),
          explainPatient(patientId),
        ]);

        if (!cancelled) {
          setPrediction(predictionResponse);
          setExplanation(explanationResponse);
        }
      } catch (detailError) {
        if (!cancelled) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load patient detail."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPatientDetail();

    return () => {
      cancelled = true;
    };
  }, [patient]);

  if (!patient) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-slate-300">
        Select a patient to review their prediction and SHAP explanation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Patient Detail
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Patient #{patient.patient_nbr}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {(patient.race || "Unknown").toLowerCase()} race cohort •{" "}
              {(patient.gender || "Unknown").toLowerCase()} • {patient.age || "Unknown age"} •
              admission type: {patient.admission_type_id || "Unknown"}
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              Stay length: {patient.time_in_hospital} days
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              Prior inpatient visits: {patient.number_inpatient}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              Emergency visits: {patient.number_emergency}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              Disposition: {patient.discharge_disposition_id}
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">
          Loading prediction and explanation...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      ) : prediction && explanation ? (
        <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
          <PredictionGauge prediction={prediction} />
          <SHAPWaterfall explanation={explanation} title="Patient-level Feature Impact" />
        </div>
      ) : null}
    </div>
  );
}
