import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, ArrowLeft, ShieldCheck, Siren } from "lucide-react";

import { explainPatient, predictPatient } from "@/lib/api";
import {
  CLINICAL_THRESHOLD,
  prettyAge,
  prettyOption,
  type DirectoryPatient,
} from "@/lib/risk-types";
import { RiskGauge } from "@/components/RiskGauge";
import { ShapChart } from "@/components/ShapChart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-flat p-3.5">
      <p className="label-micro">{label}</p>
      <p className="mt-1.5 text-sm font-semibold leading-snug">{value}</p>
    </div>
  );
}

export function PatientDetail({
  patient,
  onBack,
}: {
  patient: DirectoryPatient | null;
  onBack: () => void;
}) {
  const id = patient?.patient_id;

  const prediction = useQuery({
    queryKey: ["predict", id],
    queryFn: () => predictPatient(id!),
    enabled: !!id,
  });
  const explanation = useQuery({
    queryKey: ["explain", id],
    queryFn: () => explainPatient(id!),
    enabled: !!id,
  });

  if (!patient) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Select a patient from the directory to view their risk profile.
        </p>
      </div>
    );
  }

  const high = (prediction.data?.probability ?? 0) >= CLINICAL_THRESHOLD;

  return (
    <section className="space-y-4 overflow-auto scroll-clinical pb-6">
      <header className="border-b border-border pb-4">
        <Button variant="ghost" size="sm" className="-ml-2 mb-2 h-7 rounded-sm px-2 text-xs" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Directory
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-micro">Encounter</p>
            <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">
              {patient.patient_id}
            </h1>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {prettyOption(patient.race)} / {patient.gender} / {prettyAge(patient.age)} yrs /{" "}
            {patient.admission_type}
          </p>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Stay length" value={`${patient.time_in_hospital} days`} />
        <SummaryCard label="Prior inpatient" value={`${patient.number_inpatient} visits`} />
        <SummaryCard label="Emergency visits" value={`${patient.number_emergency}`} />
        <SummaryCard label="Discharge" value={patient.discharge_disposition} />
      </div>

      {prediction.isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Prediction service failed.
          <Button variant="secondary" size="sm" className="rounded-sm" onClick={() => prediction.refetch()}>
            Retry
          </Button>
        </div>
      ) : prediction.isPending || !prediction.data ? (
        <div className="h-48 animate-pulse rounded-lg bg-muted/50" />
      ) : (
        <div className="space-y-2">
          <RiskGauge prediction={prediction.data} />
          <div
            className={cn(
              "flex items-center gap-2.5 panel-flat p-3.5 text-sm",
              high ? "border-risk-high/35" : "border-risk-low/35",
            )}
          >
            {high ? (
              <Siren className="h-4 w-4 text-risk-high" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-risk-low" />
            )}
            <span className="label-micro">Suggested action</span>
            <span className="font-medium">
              {high ? "Escalate for review" : "Monitor with routine follow-up"}
            </span>
          </div>
        </div>
      )}

      {explanation.isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Explainability service failed.
          <Button variant="secondary" size="sm" className="rounded-sm" onClick={() => explanation.refetch()}>
            Retry
          </Button>
        </div>
      ) : explanation.isPending || !explanation.data ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted/50" />
      ) : (
        <ShapChart drivers={explanation.data.drivers} />
      )}
    </section>
  );
}
