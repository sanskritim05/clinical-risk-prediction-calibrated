import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, GitCompare } from "lucide-react";

import { comparePatients } from "@/lib/api";
import { prettyAge, type DirectoryPatient } from "@/lib/risk-types";
import { RiskGauge } from "@/components/RiskGauge";
import { ShapChart } from "@/components/ShapChart";
import { Button } from "@/components/ui/button";

export function ComparisonView({
  patientIds,
  patients,
}: {
  patientIds: string[];
  patients: DirectoryPatient[];
}) {
  const query = useQuery({
    queryKey: ["compare", [...patientIds].sort().join(",")],
    queryFn: () => comparePatients(patientIds, patients),
    enabled: patientIds.length >= 2,
  });

  if (patientIds.length < 2) {
    return (
      <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
        <GitCompare className="h-5 w-5 text-muted-foreground" />
        <p className="max-w-xs text-sm text-muted-foreground">
          Compare mode is on — select at least 2 patients from the directory.
        </p>
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden">
      <header className="border-b border-border pb-4">
        <p className="label-micro">Cohort comparison</p>
        <h2 className="mt-1 text-xl font-semibold">{patientIds.length} patients side by side</h2>
      </header>

      <div className="min-h-0 flex-1 overflow-auto scroll-clinical pt-4">
        {query.isError ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Comparison request failed.
            <Button variant="secondary" size="sm" className="rounded-sm" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        ) : query.isPending || !query.data ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {patientIds.map((id) => (
              <div key={id} className="h-72 animate-pulse rounded-lg bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {query.data.map((entry) => (
              <div key={entry.patient.patient_id} className="space-y-2">
                <div className="flex items-baseline justify-between gap-2 border-b border-border pb-1.5">
                  <h3 className="font-mono text-xs font-semibold">{entry.patient.patient_id}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {entry.patient.gender} / {prettyAge(entry.patient.age)} /{" "}
                    {entry.patient.time_in_hospital}d
                  </span>
                </div>
                <RiskGauge prediction={entry.prediction} compact />
                <ShapChart drivers={entry.explanation.drivers} title="Drivers" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
