import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

type PredictResponse = {
  served_model_name?: string;
  model_name?: string;
  probability_readmit_lt30: number;
  predicted_label: number;
  threshold: number;
};

type Option = {
  value: string;
  label: string;
};

type FormState = {
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

type SavedResult = {
  id: number;
  savedAt: string;
  form: FormState;
  result: PredictResponse;
};

const API_BASE = "http://127.0.0.1:8000";

const ageOptions: Option[] = [
  { value: "[0-10)", label: "0–9" },
  { value: "[10-20)", label: "10–19" },
  { value: "[20-30)", label: "20–29" },
  { value: "[30-40)", label: "30–39" },
  { value: "[40-50)", label: "40–49" },
  { value: "[50-60)", label: "50–59" },
  { value: "[60-70)", label: "60–69" },
  { value: "[70-80)", label: "70–79" },
  { value: "[80-90)", label: "80–89" },
  { value: "[90-100)", label: "90–99" },
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
  { value: "NULL", label: "Unknown / NULL" },
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
  { value: "Not Available", label: "Not Available" },
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

const initialForm: FormState = {
  time_in_hospital: "",
  num_lab_procedures: "",
  num_procedures: "",
  num_medications: "",
  number_outpatient: "",
  number_emergency: "",
  number_inpatient: "",
  number_diagnoses: "",
  race: "",
  gender: "",
  age: "",
  admission_type_id: "",
  admission_source_id: "",
  discharge_disposition_id: "",
  max_glu_serum: "",
  A1Cresult: "",
  insulin: "",
  metformin: "",
  change: "",
  diabetesMed: "",
  diag_1_group: "",
  diag_2_group: "",
  diag_3_group: "",
};

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedResults, setSavedResults] = useState<SavedResult[]>(() => {
    const stored = localStorage.getItem("savedClinicalRiskResults");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("savedClinicalRiskResults", JSON.stringify(savedResults));
  }, [savedResults]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildPayload = () => ({
    features: {
      ...form,
      time_in_hospital: Number(form.time_in_hospital),
      num_lab_procedures: Number(form.num_lab_procedures),
      num_procedures: Number(form.num_procedures),
      num_medications: Number(form.num_medications),
      number_outpatient: Number(form.number_outpatient),
      number_emergency: Number(form.number_emergency),
      number_inpatient: Number(form.number_inpatient),
      number_diagnoses: Number(form.number_diagnoses),
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post<PredictResponse>(
        `${API_BASE}/predict`,
        buildPayload()
      );
      setResult(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        "Prediction request failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = () => {
    if (!result) return;

    const newSavedResult: SavedResult = {
      id: Date.now(),
      savedAt: new Date().toLocaleString(),
      form: { ...form },
      result: { ...result },
    };

    setSavedResults((prev) => [newSavedResult, ...prev]);
  };

  const handleClearForm = () => {
    setForm(initialForm);
    setResult(null);
    setError("");
  };

  const handleNewPrediction = () => {
    setResult(null);
    setError("");
  };

  const handleLoadSavedResult = (saved: SavedResult) => {
    setForm(saved.form);
    setResult(saved.result);
    setError("");
  };

  const handleDeleteSavedResult = (id: number) => {
    setSavedResults((prev) => prev.filter((item) => item.id !== id));
  };

  const probabilityPct = result
    ? (result.probability_readmit_lt30 * 100).toFixed(1)
    : null;

  const riskValue = result ? Math.min(Number(probabilityPct), 100) : 0;

  const riskBand = result
    ? result.probability_readmit_lt30 < 0.1
      ? "Low"
      : result.probability_readmit_lt30 < 0.25
        ? "Moderate"
        : "High"
    : null;

  return (
    <div className="app-shell">
      <div className="page">
        <header className="hero">
          <div>
            <h1>Clinical Risk Prediction Dashboard</h1>
            <p className="hero-text">
              Calibrated 30-day readmission risk prediction for a clinically
              refined cohort.
            </p>
          </div>
        </header>

        <div className="card instructions-card">
          <div className="instructions-header">
            <div>
              <h3>How to Use This Tool</h3>
              <p>
                Enter patient encounter details, then click{" "}
                <strong>Predict Readmission Risk</strong> to generate a calibrated
                estimate of 30-day readmission probability.
              </p>
            </div>
          </div>

          <div className="instructions-grid">
            <div className="instruction-box">
              <span className="instruction-step">1</span>
              <div>
                <h4>Fill in encounter details</h4>
                <p>
                  Provide hospital stay, labs, prior utilization, medications,
                  and diagnosis group information.
                </p>
              </div>
            </div>

            <div className="instruction-box">
              <span className="instruction-step">2</span>
              <div>
                <h4>Generate a prediction</h4>
                <p>
                  The model estimates the probability that the patient will be
                  readmitted within 30 days of discharge.
                </p>
              </div>
            </div>

            <div className="instruction-box">
              <span className="instruction-step">3</span>
              <div>
                <h4>Interpret the result</h4>
                <p>
                  Use the probability and risk band as a research demo output,
                  not as clinical guidance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <main className="layout">
          <form className="card form-card" onSubmit={handleSubmit}>
            <div className="section-header">
              <h2>Patient Encounter Features</h2>
              <p>Enter encounter details to generate a calibrated risk estimate.</p>
            </div>

            <div className="form-section">
              <h3>Utilization & Encounter Details</h3>
              <div className="grid two-col">
                <InputField
                  label="Time in Hospital"
                  name="time_in_hospital"
                  value={form.time_in_hospital}
                  onChange={handleChange}
                  placeholder="Enter number of days"
                />
                <InputField
                  label="Lab Procedures"
                  name="num_lab_procedures"
                  value={form.num_lab_procedures}
                  onChange={handleChange}
                  placeholder="Enter number of lab procedures"
                />
                <InputField
                  label="Procedures"
                  name="num_procedures"
                  value={form.num_procedures}
                  onChange={handleChange}
                  placeholder="Enter number of procedures"
                />
                <InputField
                  label="Medications"
                  name="num_medications"
                  value={form.num_medications}
                  onChange={handleChange}
                  placeholder="Enter number of medications"
                />
                <InputField
                  label="Outpatient Visits"
                  name="number_outpatient"
                  value={form.number_outpatient}
                  onChange={handleChange}
                  placeholder="Enter number of outpatient visits"
                />
                <InputField
                  label="Emergency Visits"
                  name="number_emergency"
                  value={form.number_emergency}
                  onChange={handleChange}
                  placeholder="Enter number of emergency visits"
                />
                <InputField
                  label="Inpatient Visits"
                  name="number_inpatient"
                  value={form.number_inpatient}
                  onChange={handleChange}
                  placeholder="Enter number of inpatient visits"
                />
                <InputField
                  label="Diagnoses Count"
                  name="number_diagnoses"
                  value={form.number_diagnoses}
                  onChange={handleChange}
                  placeholder="Enter number of diagnoses"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Demographics & Admission</h3>
              <div className="grid two-col">
                <SelectField
                  label="Race"
                  name="race"
                  value={form.race}
                  onChange={handleChange}
                  options={raceOptions}
                />
                <SelectField
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={genderOptions}
                />
                <SelectField
                  label="Age Bracket"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  options={ageOptions}
                />
                <SelectField
                  label="Admission Type"
                  name="admission_type_id"
                  value={form.admission_type_id}
                  onChange={handleChange}
                  options={admissionTypeOptions}
                />
                <SelectField
                  label="Admission Source"
                  name="admission_source_id"
                  value={form.admission_source_id}
                  onChange={handleChange}
                  options={admissionSourceOptions}
                />
                <SelectField
                  label="Discharge Disposition"
                  name="discharge_disposition_id"
                  value={form.discharge_disposition_id}
                  onChange={handleChange}
                  options={dischargeOptions}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Labs, Medications & Diagnosis Groups</h3>
              <div className="grid two-col">
                <SelectField
                  label="Max Glucose Serum"
                  name="max_glu_serum"
                  value={form.max_glu_serum}
                  onChange={handleChange}
                  options={maxGluOptions}
                />
                <SelectField
                  label="A1C Result"
                  name="A1Cresult"
                  value={form.A1Cresult}
                  onChange={handleChange}
                  options={a1cOptions}
                />
                <SelectField
                  label="Insulin"
                  name="insulin"
                  value={form.insulin}
                  onChange={handleChange}
                  options={medStatusOptions}
                />
                <SelectField
                  label="Metformin"
                  name="metformin"
                  value={form.metformin}
                  onChange={handleChange}
                  options={medStatusOptions}
                />
                <SelectField
                  label="Medication Change"
                  name="change"
                  value={form.change}
                  onChange={handleChange}
                  options={changeOptions}
                />
                <SelectField
                  label="Diabetes Medication"
                  name="diabetesMed"
                  value={form.diabetesMed}
                  onChange={handleChange}
                  options={yesNoOptions}
                />
                <SelectField
                  label="Primary Diagnosis Group"
                  name="diag_1_group"
                  value={form.diag_1_group}
                  onChange={handleChange}
                  options={diagGroupOptions}
                />
                <SelectField
                  label="Secondary Diagnosis Group"
                  name="diag_2_group"
                  value={form.diag_2_group}
                  onChange={handleChange}
                  options={diagGroupOptions}
                />
                <SelectField
                  label="Tertiary Diagnosis Group"
                  name="diag_3_group"
                  value={form.diag_3_group}
                  onChange={handleChange}
                  options={diagGroupOptions}
                />
              </div>
            </div>

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Predicting..." : "Predict Readmission Risk"}
            </button>
          </form>

          <aside className="card result-card">
            <div className="section-header">
              <h2>Prediction Result</h2>
              <p>Model output from the calibrated XGBoost pipeline.</p>
            </div>

            {!result && !error && (
              <div className="empty-state">
                <p className="muted">
                  Submit the form to generate a calibrated readmission risk estimate.
                </p>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            {result && (
              <>
                <div className="result-box">
                  <div className="result-pill">
                    {result.served_model_name || result.model_name || "Unknown model"}
                  </div>

                  <div className="metric">
                    <span className="metric-label">
                      Predicted 30-day readmission risk
                    </span>
                    <span className="metric-value">{probabilityPct}%</span>
                  </div>

                  <div className="meter">
                    <div
                      className="meter-fill"
                      style={{ width: `${riskValue}%` }}
                    />
                  </div>

                  <div className="label-box">
                    <span className="label-title">Risk interpretation</span>
                    <span className="label-value">
                      {riskBand} {riskBand === "Low" ? "risk" : "readmission risk"}
                    </span>
                    <p className="label-description">
                      This value estimates the probability that the patient will be
                      readmitted within 30 days of discharge.
                    </p>
                  </div>

                  <div className="threshold-box">
                    <span className="label-title">
                      Label at threshold {result.threshold}
                    </span>
                    <span className="label-value">
                      {result.predicted_label === 1 ? "High risk flag" : "Lower risk flag"}
                    </span>
                  </div>

                  <div className="risk-guide">
                    <h4>How to read this</h4>
                    <ul>
                      <li><strong>Below 10%</strong>: lower relative risk</li>
                      <li><strong>10%–25%</strong>: moderate relative risk</li>
                      <li><strong>Above 25%</strong>: higher relative risk</li>
                    </ul>
                  </div>

                  <div className="note-box">
                    Research demo only. This tool is not for clinical use.
                  </div>
                </div>

                <div className="result-actions">
                  <button
                    className="submit-btn"
                    type="button"
                    onClick={handleSaveResult}
                  >
                    Save Result
                  </button>

                  <button
                    className="submit-btn"
                    type="button"
                    onClick={handleClearForm}
                  >
                    Clear Form
                  </button>
                </div>
              </>
            )}

            <div className="saved-results">
              <h3>Saved Results</h3>

              {savedResults.length === 0 ? (
                <p className="muted">No saved predictions yet.</p>
              ) : (
                <div className="saved-results-list">
                  {savedResults.map((item) => {
                    const savedPct = (
                      item.result.probability_readmit_lt30 * 100
                    ).toFixed(1);

                    const savedBand =
                      item.result.probability_readmit_lt30 < 0.1
                        ? "Low"
                        : item.result.probability_readmit_lt30 < 0.25
                          ? "Moderate"
                          : "High";

                    return (
                      <div key={item.id} className="saved-result-item">
                        <div>
                          <strong>{savedPct}%</strong> readmission risk
                          <div className="muted">
                            {savedBand} risk · saved {item.savedAt}
                          </div>
                          <div className="muted">
                            {item.form.age || "No age"} · {item.form.gender || "No gender"} ·{" "}
                            {item.form.race || "No race"}
                          </div>
                        </div>

                        <div className="saved-result-actions">
                          <button
                            type="button"
                            className="submit-btn saved-action-btn"
                            onClick={() => handleLoadSavedResult(item)}
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            className="submit-btn saved-action-btn"
                            onClick={() => handleDeleteSavedResult(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
};

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
}: FieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="field-input"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: FieldProps & { options: Option[] }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className="field-input" name={name} value={value} onChange={onChange}>
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}