import type { PatientListItem } from "../types";

type PatientListProps = {
  patients: PatientListItem[];
  selectedIds: string[];
  activePatientId: string | null;
  compareMode: boolean;
  searchQuery: string;
  onPatientClick: (patientId: string) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
};

function metricLabel(patient: PatientListItem) {
  const raceKey = (patient.race || "Unknown").toLowerCase();
  const raceLabel = raceKey === "unknown" ? "Unknown race" : patient.race;
  return `${raceLabel} • ${patient.gender || "Unknown"} • ${patient.age || "Unknown age"}`;
}

export function PatientList({
  patients,
  selectedIds,
  activePatientId,
  compareMode,
  searchQuery,
  onPatientClick,
  onSearchChange,
  onRefresh,
}: PatientListProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-950/40">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Patient Directory
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              Indexed Cohort Patients
            </h2>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
            {patients.length} shown
          </span>
        </div>

        <div className="mt-4 flex gap-3">
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search patient ID, race, gender, age"
            className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50"
          />
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="p-6">
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm leading-6 text-slate-300">
            <p className="text-base font-semibold text-white">No patients are visible yet.</p>
            <p className="mt-2">
              Clear the search filter or refresh the directory. If the list still stays empty,
              make sure the backend is running and the processed cohort data has been generated.
            </p>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-slate-400">
              Start the API with `uvicorn api.main:app --reload`, then reload the frontend and
              choose a patient from the cohort list.
            </div>
          </div>
        </div>
      ) : (
        <div className="max-h-[680px] overflow-auto">
          <table className="min-w-full divide-y divide-slate-800 text-left">
            <thead className="sticky top-0 bg-slate-950/95 backdrop-blur">
              <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Profile</th>
                <th className="px-5 py-3 font-medium">Stay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {patients.map((patient) => {
                const isSelected = selectedIds.includes(patient.patient_nbr);
                const isActive = activePatientId === patient.patient_nbr;

                return (
                  <tr
                    key={patient.patient_nbr}
                    onClick={() => onPatientClick(patient.patient_nbr)}
                    className={`cursor-pointer transition ${
                      compareMode
                        ? isSelected
                          ? "bg-cyan-500/10"
                          : "hover:bg-slate-800/80"
                        : isActive
                          ? "bg-amber-500/10"
                          : "hover:bg-slate-800/80"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold ${
                            compareMode && isSelected
                              ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                              : "border-slate-700 bg-slate-950 text-slate-200"
                          }`}
                        >
                          {patient.patient_nbr.slice(-2)}
                        </span>
                        <div>
                          <p className="font-medium text-white">#{patient.patient_nbr}</p>
                          <p className="text-sm text-slate-400">
                            {compareMode
                              ? isSelected
                                ? "Selected for comparison"
                                : "Click to add"
                              : isActive
                                ? "Currently open"
                                : "Click to review"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      {metricLabel(patient)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {patient.time_in_hospital}d stay • {patient.number_inpatient} prior admits
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
