import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Search } from "lucide-react";

import { prettyAge, prettyOption, type DirectoryPatient } from "@/lib/risk-types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const COLS = ["Patient", "Race", "Gender", "Age", "LOS", "Inpt", "ED", "Discharge", "Admission"];

export function PatientDirectory({
  patients,
  isLoading,
  isError,
  onRetry,
  isRefetching,
  focusedId,
  selectedIds,
  compareMode,
  onSelect,
}: {
  patients: DirectoryPatient[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isRefetching: boolean;
  focusedId: string | null;
  selectedIds: string[];
  compareMode: boolean;
  onSelect: (patient: DirectoryPatient) => void;
}) {
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [p.patient_id, prettyOption(p.race), p.gender, prettyAge(p.age), p.age, p.admission_type]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [patients, search]);

  const isActive = (p: DirectoryPatient) =>
    compareMode ? selectedIds.includes(p.patient_id) : focusedId === p.patient_id;

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div>
          <p className="label-micro">Indexed cohort</p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Patient directory</h1>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID · race · gender · age · admission"
              className="h-9 rounded-sm border-border bg-panel pl-9 text-xs sm:w-80"
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-sm"
            onClick={onRetry}
            aria-label="Refresh list"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 border-y border-border py-2">
        <span className="label-micro">
          {isLoading ? "Loading cohort…" : `${visible.length} / ${patients.length} visible`}
        </span>
        <span className="label-micro hidden sm:block">Expired &amp; hospice excluded</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto scroll-clinical">
        {isError ? (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 panel-flat p-10 text-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium">Cohort API unavailable.</p>
            <Button variant="secondary" size="sm" className="rounded-sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-1.5 pt-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-sm bg-muted/50" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 panel-flat p-10 text-center">
            <p className="text-sm font-medium">No patients match “{search}”.</p>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
              Clear search
            </Button>
          </div>
        ) : (
          <>
            <table className="hidden w-full border-collapse text-sm md:table">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                <tr>
                  {COLS.map((c) => (
                    <th key={c} className="label-micro px-3 py-2.5 text-left font-normal">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const active = isActive(p);
                  return (
                    <tr
                      key={p.patient_id}
                      onClick={() => onSelect(p)}
                      className={cn(
                        "cursor-pointer border-t border-border/50 transition-colors hover:bg-panel-raised",
                        active && "bg-primary/10 hover:bg-primary/15",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-panel-raised font-mono text-[11px]",
                              active && "border-primary/60 text-primary",
                            )}
                          >
                            {p.patient_id.slice(-2)}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {p.patient_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{prettyOption(p.race)}</td>
                      <td className="px-3 py-2.5 text-xs">{p.gender}</td>
                      <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                        {prettyAge(p.age)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                        {p.time_in_hospital}d
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                        {p.number_inpatient}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                        {p.number_emergency}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                        {p.discharge_disposition}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                        {p.admission_type}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <ul className="space-y-1.5 pt-2 md:hidden">
              {visible.map((p) => {
                const active = isActive(p);
                return (
                  <li key={p.patient_id}>
                    <button
                      onClick={() => onSelect(p)}
                      className={cn(
                        "w-full panel-flat px-3 py-3 text-left transition-colors",
                        active && "border-primary/50 bg-primary/10",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-panel-raised font-mono text-[11px]",
                            active && "border-primary/60 text-primary",
                          )}
                        >
                          {p.patient_id.slice(-2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs">{p.patient_id}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {prettyOption(p.race)} · {p.gender} · {prettyAge(p.age)} ·{" "}
                            {p.admission_type}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2 border-t border-border/60 pt-2 font-mono text-[10px] text-muted-foreground">
                        <span>LOS {p.time_in_hospital}d</span>
                        <span>INPT {p.number_inpatient}</span>
                        <span>ED {p.number_emergency}</span>
                        <span className="truncate">
                          DX {p.number_diagnoses ?? "—"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">
                        {p.discharge_disposition}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
