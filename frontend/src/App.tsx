import { useEffect, useMemo, useState } from "react";

import { getPatientList } from "./api";
import { ComparisonView } from "./components/ComparisonView";
import { ManualAssessment } from "./components/ManualAssessment";
import { PatientDetail } from "./components/PatientDetail";
import { PatientList } from "./components/PatientList";
import type { PatientListItem } from "./types";

export default function App() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [workspaceMode, setWorkspaceMode] = useState<"directory" | "manual">("directory");
  const [compareMode, setCompareMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPatients = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getPatientList(60);
      setPatients(response);
      setActivePatientId((currentId) => {
        if (currentId && response.some((patient) => patient.patient_nbr === currentId)) {
          return currentId;
        }
        return response[0]?.patient_nbr || null;
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load patient directory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = directoryQuery.trim().toLowerCase();
    if (!query) {
      return patients;
    }

    return patients.filter((patient) =>
      [
        patient.patient_nbr,
        patient.race || "Unknown",
        patient.gender || "Unknown",
        patient.age || "Unknown",
        patient.admission_type_id || "Unknown",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [directoryQuery, patients]);

  const activePatient =
    patients.find((patient) => patient.patient_nbr === activePatientId) || null;

  const handlePatientClick = (patientId: string) => {
    if (compareMode) {
      setSelectedIds((currentIds) =>
        currentIds.includes(patientId)
          ? currentIds.filter((id) => id !== patientId)
          : [...currentIds, patientId]
      );
      return;
    }

    setActivePatientId(patientId);
  };

  const handleCompareToggle = () => {
    setCompareMode((current) => {
      const next = !current;
      if (!next) {
        setSelectedIds([]);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1700px] gap-6 px-4 py-5 lg:px-6">
        <aside className="w-full max-w-[380px] flex-col gap-6 lg:flex">
          <section className="rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.95))] p-6 shadow-2xl shadow-slate-950/40">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Clinical Risk Dashboard
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Patient review dashboard
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Review patient risk, see the strongest contributing factors, and
              compare cases side by side in one place.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Navigation
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {workspaceMode === "manual"
                    ? "Manual case entry"
                    : compareMode
                      ? "Comparison mode enabled"
                      : "Single-patient detail mode"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Selection
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {workspaceMode === "manual"
                    ? "Currently open: manual patient entry"
                    : compareMode
                    ? `${selectedIds.length} patient${selectedIds.length === 1 ? "" : "s"} selected`
                    : activePatientId
                      ? `Focused on patient #${activePatientId}`
                      : "Waiting for a patient selection"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/40">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Workspace
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWorkspaceMode("directory")}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  workspaceMode === "directory"
                    ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                    : "border-slate-700 bg-slate-950 text-slate-300"
                }`}
              >
                Patient directory
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("manual")}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  workspaceMode === "manual"
                    ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                    : "border-slate-700 bg-slate-950 text-slate-300"
                }`}
              >
                Manual assessment
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Switch between saved cohort patients and a blank form for manual case entry.
            </p>
          </section>

          {workspaceMode === "directory" ? (
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Workflow
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-white">
                    Multi-select for comparison
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCompareToggle}
                  className={`relative inline-flex h-10 w-20 items-center rounded-full border transition ${
                    compareMode
                      ? "border-cyan-400/40 bg-cyan-500/20"
                      : "border-slate-700 bg-slate-950"
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-950 shadow-lg transition ${
                      compareMode ? "translate-x-10" : "translate-x-1"
                    }`}
                  >
                    {compareMode ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                With Compare off, clicking a patient opens their detail view. With
                Compare on, each click adds or removes that patient from the review set.
              </p>

              {selectedIds.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100"
                    >
                      #{id}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {workspaceMode === "directory" ? (
            loading ? (
              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 text-slate-300">
                Loading cohort directory...
              </div>
            ) : error ? (
              <div className="rounded-[2rem] border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
                <p className="font-semibold">Patient directory unavailable</p>
                <p className="mt-2 text-sm leading-6">{error}</p>
                <div className="mt-4 rounded-2xl border border-rose-400/20 bg-slate-950/30 px-4 py-4 text-sm text-rose-50">
                  Start the API in another terminal with `uvicorn api.main:app --reload`, then retry.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void loadPatients();
                  }}
                  className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-50 transition hover:bg-rose-400/20"
                >
                  Retry patient load
                </button>
              </div>
            ) : (
              <PatientList
                patients={filteredPatients}
                selectedIds={selectedIds}
                activePatientId={activePatientId}
                compareMode={compareMode}
                searchQuery={directoryQuery}
                onPatientClick={handlePatientClick}
                onSearchChange={setDirectoryQuery}
                onRefresh={() => {
                  void loadPatients();
                }}
              />
            )
          ) : null}
        </aside>

        <main className="min-w-0 flex-1 py-1">
          {workspaceMode === "manual" ? (
            <ManualAssessment />
          ) : compareMode && selectedIds.length >= 2 ? (
            <ComparisonView patientIds={selectedIds} />
          ) : (
            <PatientDetail patient={activePatient} />
          )}
        </main>
      </div>
    </div>
  );
}
