import { useState } from "react";

import { predictEncounter } from "../api";
import { PredictionGauge } from "./PredictionGauge";

type Option = {
  value: string;
  label: string;
};

type ManualFormState = {
  time_in_hospital: string;
  num_lab_procedures: string;
  num_procedures: string;
  num_medications: string;
  number_outpatient: string;
  number_emergency: string;
  number_inpatient: string;
  number_diagnoses: string;
  race: string;
  gender: string;
  age: string;
  admission_type_id: string;
  admission_source_id: string;
  discharge_disposition_id: string;
  max_glu_serum: string;
  A1Cresult: string;
  insulin: string;
  metformin: string;
  change: string;
  diabetesMed: string;
  diag_1_group: string;
  diag_2_group: string;
  diag_3_group: string;
};

const ageOptions: Option[] = [
  { value: "[0-10)", label: "0-9" },
  { value: "[10-20)", label: "10-19" },
  { value: "[20-30)", label: "20-29" },
  { value: "[30-40)", label: "30-39" },
  { value: "[40-50)", label: "40-49" },
  { value: "[50-60)", label: "50-59" },
  { value: "[60-70)", label: "60-69" },
  { value: "[70-80)", label: "70-79" },
  { value: "[80-90)", label: "80-89" },
  { value: "[90-100)", label: "90-99" },
];

const raceOptions: Option[] = [
  { value: "Caucasian", label: "Caucasian" },
  { value: "AfricanAmerican", label: "African American" },
  { value: "Asian", label: "Asian" },
  { value: "Hispanic", label: "Hispanic" },
  { value: "Other", label: "Other" },
];

const genderOptions: Option[] = [
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
];

const admissionTypeOptions: Option[] = [
  { value: "Emergency", label: "Emergency" },
  { value: "Urgent", label: "Urgent" },
  { value: "Elective", label: "Elective" },
  { value: "Trauma Center", label: "Trauma Center" },
  { value: "Not Available", label: "Not Available" },
];

const admissionSourceOptions: Option[] = [
  { value: "Emergency Room", label: "Emergency Room" },
  { value: "Physician Referral", label: "Physician Referral" },
  { value: "Clinic Referral", label: "Clinic Referral" },
  { value: "Transfer from a hospital", label: "Transfer from a hospital" },
  {
    value: "Transfer from a skilled nursing facility",
    label: "Transfer from skilled nursing facility",
  },
  { value: "HMO Referral", label: "HMO Referral" },
  { value: "Unknown", label: "Unknown" },
];

const dischargeOptions: Option[] = [
  { value: "Discharged to home", label: "Discharged to home" },
  {
    value: "Discharged/transferred to another short term hospital",
    label: "Transferred to another short-term hospital",
  },
  {
    value: "Discharged/transferred to SNF",
    label: "Transferred to skilled nursing facility",
  },
  {
    value:
      "Discharged/transferred to another rehab fac including rehab units of a hospital .",
    label: "Transferred to rehab facility",
  },
  {
    value: "Discharged/transferred to a long term care hospital.",
    label: "Transferred to long-term care hospital",
  },
  {
    value: "Admitted as an inpatient to this hospital",
    label: "Admitted as inpatient to this hospital",
  },
];

const maxGluOptions: Option[] = [
  { value: "None", label: "None" },
  { value: "Norm", label: "Normal" },
  { value: ">200", label: "> 200" },
  { value: ">300", label: "> 300" },
];

const a1cOptions: Option[] = [
  { value: "None", label: "None" },
  { value: "Norm", label: "Normal" },
  { value: ">7", label: "> 7" },
  { value: ">8", label: "> 8" },
];

const medStatusOptions: Option[] = [
  { value: "No", label: "No" },
  { value: "Up", label: "Up" },
  { value: "Down", label: "Down" },
  { value: "Steady", label: "Steady" },
];

const changeOptions: Option[] = [
  { value: "No", label: "No" },
  { value: "Ch", label: "Changed" },
];

const yesNoOptions: Option[] = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const diagGroupOptions: Option[] = [
  { value: "circulatory", label: "Circulatory" },
  { value: "respiratory", label: "Respiratory" },
  { value: "digestive", label: "Digestive" },
  { value: "injury_poisoning", label: "Injury / Poisoning" },
  { value: "musculoskeletal", label: "Musculoskeletal" },
  { value: "genitourinary", label: "Genitourinary" },
  { value: "neoplasms", label: "Neoplasms" },
  { value: "diabetes", label: "Diabetes" },
  { value: "other", label: "Other" },
  { value: "missing_unknown", label: "Missing / Unknown" },
];

const initialForm: ManualFormState = {
  time_in_hospital: "",
  num_lab_procedures: "",
  num_procedures: "",
  num_medications: "",
  number_outpatient: "0",
  number_emergency: "0",
  number_inpatient: "0",
  number_diagnoses: "",
  race: "",
  gender: "",
  age: "",
  admission_type_id: "",
  admission_source_id: "",
  discharge_disposition_id: "",
  max_glu_serum: "None",
  A1Cresult: "None",
  insulin: "No",
  metformin: "No",
  change: "No",
  diabetesMed: "No",
  diag_1_group: "",
  diag_2_group: "",
  diag_3_group: "",
};

const exampleForm: ManualFormState = {
  time_in_hospital: "4",
  num_lab_procedures: "42",
  num_procedures: "1",
  num_medications: "12",
  number_outpatient: "1",
  number_emergency: "0",
  number_inpatient: "1",
  number_diagnoses: "8",
  race: "Caucasian",
  gender: "Female",
  age: "[60-70)",
  admission_type_id: "Emergency",
  admission_source_id: "Emergency Room",
  discharge_disposition_id: "Discharged to home",
  max_glu_serum: "Norm",
  A1Cresult: ">7",
  insulin: "Steady",
  metformin: "Steady",
  change: "Ch",
  diabetesMed: "Yes",
  diag_1_group: "circulatory",
  diag_2_group: "diabetes",
  diag_3_group: "other",
};

const numericFields: Array<keyof ManualFormState> = [
  "time_in_hospital",
  "num_lab_procedures",
  "num_procedures",
  "num_medications",
  "number_outpatient",
  "number_emergency",
  "number_inpatient",
  "number_diagnoses",
];

export function ManualAssessment() {
  const [form, setForm] = useState<ManualFormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    probability: number;
    label: number;
    threshold: number;
    served_model_name: string;
  } | null>(null);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const buildPayload = () => {
    const features: Record<string, string | number | null> = { ...form };
    for (const field of numericFields) {
      features[field] = form[field] === "" ? null : Number(form[field]);
    }
    return features;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await predictEncounter(buildPayload());
      setResult({
        probability: response.probability_readmit_lt30,
        label: response.predicted_label,
        threshold: response.threshold,
        served_model_name: response.served_model_name,
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Prediction request failed."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr),380px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Manual Assessment
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Enter patient details
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Fill in encounter details to estimate 30-day readmission risk for a
              patient who is not in the saved directory.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm(exampleForm)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
            >
              Load example
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setResult(null);
                setError("");
              }}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>

        <Section title="Hospital stay and utilization">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InputField label="Time in hospital" name="time_in_hospital" value={form.time_in_hospital} onChange={handleChange} />
            <InputField label="Lab procedures" name="num_lab_procedures" value={form.num_lab_procedures} onChange={handleChange} />
            <InputField label="Procedures" name="num_procedures" value={form.num_procedures} onChange={handleChange} />
            <InputField label="Medications" name="num_medications" value={form.num_medications} onChange={handleChange} />
            <InputField label="Outpatient visits" name="number_outpatient" value={form.number_outpatient} onChange={handleChange} />
            <InputField label="Emergency visits" name="number_emergency" value={form.number_emergency} onChange={handleChange} />
            <InputField label="Inpatient visits" name="number_inpatient" value={form.number_inpatient} onChange={handleChange} />
            <InputField label="Diagnoses count" name="number_diagnoses" value={form.number_diagnoses} onChange={handleChange} />
          </div>
        </Section>

        <Section title="Demographics and admission">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField label="Race" name="race" value={form.race} onChange={handleChange} options={raceOptions} />
            <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={genderOptions} />
            <SelectField label="Age bracket" name="age" value={form.age} onChange={handleChange} options={ageOptions} />
            <SelectField label="Admission type" name="admission_type_id" value={form.admission_type_id} onChange={handleChange} options={admissionTypeOptions} />
            <SelectField label="Admission source" name="admission_source_id" value={form.admission_source_id} onChange={handleChange} options={admissionSourceOptions} />
            <SelectField label="Discharge disposition" name="discharge_disposition_id" value={form.discharge_disposition_id} onChange={handleChange} options={dischargeOptions} />
          </div>
        </Section>

        <Section title="Labs, medication, and diagnosis groups">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField label="Max glucose serum" name="max_glu_serum" value={form.max_glu_serum} onChange={handleChange} options={maxGluOptions} />
            <SelectField label="A1C result" name="A1Cresult" value={form.A1Cresult} onChange={handleChange} options={a1cOptions} />
            <SelectField label="Insulin" name="insulin" value={form.insulin} onChange={handleChange} options={medStatusOptions} />
            <SelectField label="Metformin" name="metformin" value={form.metformin} onChange={handleChange} options={medStatusOptions} />
            <SelectField label="Medication change" name="change" value={form.change} onChange={handleChange} options={changeOptions} />
            <SelectField label="Diabetes medication" name="diabetesMed" value={form.diabetesMed} onChange={handleChange} options={yesNoOptions} />
            <SelectField label="Primary diagnosis group" name="diag_1_group" value={form.diag_1_group} onChange={handleChange} options={diagGroupOptions} />
            <SelectField label="Secondary diagnosis group" name="diag_2_group" value={form.diag_2_group} onChange={handleChange} options={diagGroupOptions} />
            <SelectField label="Tertiary diagnosis group" name="diag_3_group" value={form.diag_3_group} onChange={handleChange} options={diagGroupOptions} />
          </div>
        </Section>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Calculating risk..." : "Calculate readmission risk"}
        </button>
      </form>

      <div className="space-y-6">
        {result ? (
          <PredictionGauge prediction={result} />
        ) : (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Result
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Prediction will appear here
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Complete the form to estimate risk for a manually entered patient.
            </p>
          </section>
        )}

        {error ? (
          <section className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm leading-6 text-rose-100">
            {error}
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InputField({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: keyof ManualFormState;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        type="number"
        min="0"
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: keyof ManualFormState;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  value: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-slate-300">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
