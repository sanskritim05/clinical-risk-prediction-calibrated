import { prettyFeature, type ShapDriver } from "@/lib/risk-types";
import { cn } from "@/lib/utils";

export function ShapChart({
  drivers,
  title = "Feature drivers · SHAP",
}: {
  drivers: ShapDriver[];
  title?: string;
}) {
  const top = drivers.slice(0, 10);
  const max = Math.max(...top.map((d) => Math.abs(d.value)), 0.001);

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <p className="label-micro">{title}</p>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-4 rounded-full bg-risk-high" /> Increased
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-4 rounded-full bg-risk-low" /> Decreased
          </span>
        </div>
      </div>

      <div className="mt-3 divide-y divide-border/50">
        {top.map((d) => {
          const positive = d.value > 0;
          const width = (Math.abs(d.value) / max) * 50;
          return (
            <div key={d.feature} className="group flex items-center gap-3 py-1.5">
              <span className="w-36 shrink-0 truncate text-right text-[11px] capitalize text-muted-foreground transition-colors group-hover:text-foreground sm:w-44">
                {prettyFeature(d.feature)}
              </span>
              <div className="relative h-4 flex-1">
                <div
                  className="absolute inset-y-0 left-1/2 w-px bg-border"
                  aria-hidden
                />
                <div
                  className={cn(
                    "absolute inset-y-[3px] rounded-[2px] transition-all duration-500",
                    positive ? "left-1/2" : "",
                  )}
                  style={{
                    width: `${width}%`,
                    ...(positive ? {} : { right: "50%" }),
                    backgroundImage: positive
                      ? "var(--gradient-alarm)"
                      : "var(--gradient-signal)",
                  }}
                />
              </div>
              <span
                className={cn(
                  "w-14 shrink-0 text-right font-mono text-[10px] tabular-nums",
                  positive ? "text-risk-high" : "text-risk-low",
                )}
              >
                {d.value > 0 ? "+" : ""}
                {d.value.toFixed(3)}
              </span>
            </div>
          );
        })}
        {top.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No feature attribution available.
          </p>
        )}
      </div>
    </div>
  );
}
