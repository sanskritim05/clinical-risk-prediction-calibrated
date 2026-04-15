import { useEffect, useState } from "react";

import { comparePatients } from "../api";
import type { ComparedPatient } from "../types";
import { PredictionGauge } from "./PredictionGauge";
import { SHAPWaterfall } from "./SHAPWaterfall";

type ComparisonViewProps = {
  patientIds: string[];
};

export function ComparisonView({ patientIds }: ComparisonViewProps) {
  const [rows, setRows] = useState<ComparedPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (patientIds.length < 2) {
      setRows([]);
      return;
    }

    let cancelled = false;

    async function loadComparison() {
      setLoading(true);
      setError("");

      try {
        const response = await comparePatients(patientIds);
        if (!cancelled) {
          setRows(response);
        }
      } catch (comparisonError) {
        if (!cancelled) {
          setError(
            comparisonError instanceof Error
              ? comparisonError.message
              : "Unable to compare patients."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadComparison();

    return () => {
      cancelled = true;
    };
  }, [patientIds]);

  if (patientIds.length < 2) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-slate-300">
        Enable Compare and select at least two patients to open the clinical review grid.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">
        Building comparison review for {patientIds.length} patients...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Comparison Review
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Multi-patient SHAP comparison
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Side-by-side review of calibrated risk predictions and the features driving them.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {rows.map((row) => (
          <article
            key={row.patient_id}
            className="space-y-6 rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5"
          >
            <header className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Patient #{row.patient_id}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Comparative explanation snapshot
              </h3>
            </header>
            <PredictionGauge prediction={row.prediction} />
            <SHAPWaterfall
              explanation={row.explanation}
              title={`Drivers for patient ${row.patient_id}`}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
