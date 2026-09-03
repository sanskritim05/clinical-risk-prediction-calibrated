import { CLINICAL_THRESHOLD, type Prediction } from "@/lib/risk-types";
import { cn } from "@/lib/utils";

function Dial({ value, high, size }: { value: number; high: boolean; size: number }) {
  const r = 42;
  const circumference = Math.PI * r;
  const dash = circumference * Math.min(1, Math.max(0, value));
  return (
    <svg viewBox="0 0 100 58" width={size} height={size * 0.58} className="shrink-0">
      <path
        d="M4 52 A46 46 0 0 1 96 52"
        fill="none"
        stroke="var(--color-muted)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d={`M8 52 A${r} ${r} 0 0 1 92 52`}
        fill="none"
        stroke={high ? "var(--color-risk-high)" : "var(--color-risk-low)"}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* clinical threshold tick at 50% */}
      <line x1="50" y1="4" x2="50" y2="14" stroke="var(--color-foreground)" strokeWidth="1.5" opacity="0.55" />
    </svg>
  );
}

export function RiskGauge({
  prediction,
  compact = false,
}: {
  prediction: Prediction;
  compact?: boolean;
}) {
  const pct = prediction.probability * 100;
  const high = prediction.probability >= CLINICAL_THRESHOLD;

  return (
    <div
      className={cn(
        "panel relative overflow-hidden p-5",
        high ? "glow-alarm" : "glow-signal",
      )}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{ backgroundImage: high ? "var(--gradient-alarm)" : "var(--gradient-signal)" }}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-4">
        <p className="label-micro">Calibrated 30-day readmission risk</p>
        <span
          className={cn(
            "rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
            high
              ? "border-risk-high/45 bg-risk-high/12 text-risk-high"
              : "border-risk-low/45 bg-risk-low/12 text-risk-low",
          )}
        >
          {high ? "High Risk" : "Lower Risk"}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-5">
        <p
          className={cn(
            "font-display font-semibold leading-none tabular-nums",
            compact ? "text-4xl" : "text-6xl",
            high ? "text-risk-high" : "text-risk-low",
          )}
        >
          {pct.toFixed(0)}
          <span className={cn("ml-1 font-mono font-normal text-muted-foreground", compact ? "text-base" : "text-xl")}>
            %
          </span>
        </p>
        <div className="ml-auto">
          <Dial value={prediction.probability} high={high} size={compact ? 108 : 140} />
        </div>
      </div>

      <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(2, Math.min(100, pct))}%`,
            backgroundImage: high ? "var(--gradient-alarm)" : "var(--gradient-signal)",
          }}
        />
        <div
          className="absolute top-0 h-full w-px bg-foreground/60"
          style={{ left: `${CLINICAL_THRESHOLD * 100}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="label-micro">
          Threshold {(CLINICAL_THRESHOLD * 100).toFixed(0)}% · Platt calibrated
        </span>
        <span className="rounded-sm border border-border bg-panel-raised px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {prediction.model}
        </span>
      </div>
    </div>
  );
}
