import type { PatientPrediction } from "../types";

type PredictionGaugeProps = {
  prediction: PatientPrediction;
};

export function PredictionGauge({ prediction }: PredictionGaugeProps) {
  const percentage = Math.round(prediction.probability * 100);
  const toneClass =
    percentage >= 50
      ? "from-amber-400 to-rose-500"
      : "from-cyan-400 to-teal-500";

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Risk Estimate
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">
            30-day Readmission Probability
          </h3>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
          {prediction.served_model_name}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <span className="text-5xl font-semibold tracking-tight text-white">
            {percentage}%
          </span>
          <span
            className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-950 ${toneClass}`}
          >
            {prediction.label ? "High Risk" : "Lower Risk"}
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${toneClass} transition-all duration-500`}
            style={{ width: `${Math.max(percentage, 3)}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-sm text-slate-400">
          <span>Clinical threshold: {(prediction.threshold * 100).toFixed(0)}%</span>
          <span>
            {prediction.label
              ? "Escalate for review"
              : "Monitor with routine follow-up"}
          </span>
        </div>
      </div>
    </section>
  );
}
