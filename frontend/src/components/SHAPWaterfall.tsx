import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { PatientExplanation, ShapContribution } from "../types";

type SHAPWaterfallProps = {
  explanation: PatientExplanation;
  title?: string;
};

type ChartDatum = {
  feature: string;
  shapValue: number;
};

const positiveColor = "#f59e0b";
const negativeColor = "#0891b2";

function formatFeatureLabel(feature: string) {
  return feature.replaceAll("_", " ");
}

function buildChartData(explanation: PatientExplanation): ChartDatum[] {
  return [...explanation.top_positive, ...explanation.top_negative]
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .slice(0, 10)
    .reverse()
    .map((item: ShapContribution) => ({
      feature: formatFeatureLabel(item.feature),
      shapValue: item.shap_value,
    }));
}

export function SHAPWaterfall({
  explanation,
  title = "Top SHAP Contributors",
}: SHAPWaterfallProps) {
  const data = buildChartData(explanation);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Explainability
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="flex gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
            Increased Risk
          </span>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1">
            Decreased Risk
          </span>
        </div>
      </div>

      <div className="h-[560px] rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 12, right: 24, left: 24, bottom: 12 }}
          >
            <ReferenceLine x={0} stroke="#475569" strokeDasharray="4 4" />
            <XAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={{ stroke: "#1e293b" }}
            />
            <YAxis
              type="category"
              dataKey="feature"
              width={340}
              interval={0}
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="shapValue" radius={[8, 8, 8, 8]}>
              {data.map((entry) => (
                <Cell
                  key={`${entry.feature}-${entry.shapValue}`}
                  fill={entry.shapValue >= 0 ? positiveColor : negativeColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
