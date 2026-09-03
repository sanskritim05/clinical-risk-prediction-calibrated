import { useState, type ReactNode } from "react";
import { Activity, GitCompare, HeartPulse, Table2, UserRound, X } from "lucide-react";

import { PatientDirectory } from "@/components/PatientDirectory";
import { usePatients } from "@/hooks/usePatients";
import { PatientDetail } from "@/components/PatientDetail";
import { ComparisonView } from "@/components/ComparisonView";
import { ManualAssessment } from "@/components/ManualAssessment";
import { MODEL_NAME, type DirectoryPatient } from "@/lib/risk-types";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

type Mode = "directory" | "manual";
type View = "directory" | "detail" | "compare" | "manual";

function StatusBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-sidebar-border px-5 py-4">
      <p className="label-micro">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export default function App() {
  const { data: patients = [], isPending, isError, refetch, isRefetching } = usePatients();
  const [mode, setMode] = useState<Mode>("directory");
  const [compareMode, setCompareMode] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<View>("directory");

  const resolvedFocusedId = focusedId ?? patients[0]?.patient_id ?? null;
  const focused = patients.find((p) => p.patient_id === resolvedFocusedId) ?? null;

  function handleSelect(patient: DirectoryPatient) {
    if (compareMode) {
      setSelectedIds((prev) =>
        prev.includes(patient.patient_id)
          ? prev.filter((id) => id !== patient.patient_id)
          : [...prev, patient.patient_id],
      );
      return;
    }
    setFocusedId(patient.patient_id);
    setView("detail");
  }

  function toggleCompare(next: boolean) {
    setCompareMode(next);
    if (!next) {
      setSelectedIds([]);
      setView("directory");
    }
  }

  const activeView: View =
    mode === "manual"
      ? "manual"
      : compareMode
        ? "compare"
        : view === "detail"
          ? "detail"
          : "directory";

  const navLabel =
    activeView === "manual"
      ? "Manual entry"
      : activeView === "compare"
        ? "Comparison"
        : activeView === "detail"
          ? "Single-patient detail"
          : "Patient directory";

  const navItems = [
    { id: "directory", label: "Patient directory", icon: Table2 },
    { id: "manual", label: "Manual assessment", icon: Activity },
  ] as const;

  const directory = (
    <PatientDirectory
      patients={patients}
      isLoading={isPending}
      isError={isError}
      onRetry={() => refetch()}
      isRefetching={isRefetching}
      focusedId={resolvedFocusedId}
      selectedIds={selectedIds}
      compareMode={compareMode}
      onSelect={handleSelect}
    />
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-[17.5rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-primary/30 bg-primary/12 text-primary">
            <HeartPulse className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">READMIT CONSOLE</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              30-day diabetes risk
            </p>
          </div>
        </div>

        <div className="mx-5 mb-4 rounded-sm border-l-2 border-risk-high/70 bg-risk-high/5 px-3 py-2">
          <p className="font-mono text-[10px] leading-relaxed uppercase tracking-[0.1em] text-muted-foreground">
            Research / demo only — on-device scorer, not for clinical use
          </p>
        </div>

        <nav className="px-3 pb-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMode(item.id);
                if (item.id === "directory") setView("directory");
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sm transition-colors",
                mode === item.id
                  ? "bg-primary/12 text-primary shadow-[inset_2px_0_0_0_var(--color-primary)]"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <StatusBlock label="Navigation">
          <p className="text-sm font-medium">{navLabel}</p>
        </StatusBlock>

        <StatusBlock label="Mode">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm">
              <GitCompare className="h-3.5 w-3.5 text-muted-foreground" /> Compare
            </span>
            <Switch checked={compareMode} onCheckedChange={toggleCompare} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {compareMode
              ? "Clicking a patient adds them to the comparison set."
              : "Clicking a patient opens their detail view."}
          </p>
        </StatusBlock>

        <StatusBlock label="Selection">
          {compareMode ? (
            selectedIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No patients selected</p>
            ) : (
              <>
                <p className="text-sm font-medium">{selectedIds.length} selected</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedIds.map((id) => (
                    <button
                      key={id}
                      onClick={() =>
                        setSelectedIds((prev) => prev.filter((existing) => existing !== id))
                      }
                      className="flex items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary transition-colors hover:bg-primary/20"
                    >
                      {id.slice(-4)} <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </>
            )
          ) : (
            <p className="flex items-center gap-1.5 font-mono text-sm">
              <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
              {focused ? focused.patient_id : "None"}
            </p>
          )}
        </StatusBlock>

        <div className="mt-auto border-t border-sidebar-border px-5 py-3">
          <p className="font-mono text-[10px] text-muted-foreground">model: {MODEL_NAME}</p>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-primary/30 bg-primary/12 text-primary">
            <HeartPulse className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs font-semibold tracking-tight">READMIT CONSOLE</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {navLabel}
              {compareMode ? ` · ${selectedIds.length} selected` : focused ? ` · ${focused.patient_id}` : ""}
            </p>
          </div>
          <label className="flex items-center gap-2">
            <span className="label-micro">Cmp</span>
            <Switch checked={compareMode} onCheckedChange={toggleCompare} />
          </label>
        </header>

        <main className="flex min-h-0 flex-1 flex-col p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">
          {activeView === "manual" ? (
            <ManualAssessment />
          ) : activeView === "compare" ? (
            <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="min-h-0">{directory}</div>
              <ComparisonView patientIds={selectedIds} patients={patients} />
            </div>
          ) : activeView === "detail" ? (
            <PatientDetail patient={focused} onBack={() => setView("directory")} />
          ) : (
            directory
          )}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-border bg-sidebar/95 backdrop-blur lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMode(item.id);
                if (item.id === "directory") setView("directory");
              }}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                mode === item.id ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.id === "directory" ? "Directory" : "Manual"}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
