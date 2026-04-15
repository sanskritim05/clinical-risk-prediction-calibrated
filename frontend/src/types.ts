export type PatientListItem = {
  patient_nbr: string;
  race: string;
  gender: string;
  age: string;
  time_in_hospital: number;
  number_inpatient: number;
  number_emergency: number;
  discharge_disposition_id: string;
  admission_type_id: string;
};

export type PatientPrediction = {
  probability: number;
  label: number;
  threshold: number;
  served_model_name: string;
};

export type ModelPredictResponse = {
  served_model_name: string;
  probability_readmit_lt30: number;
  predicted_label: number;
  threshold: number;
};

export type ShapContribution = {
  feature: string;
  value: number;
  shap_value: number;
};

export type PatientExplanation = {
  top_positive: ShapContribution[];
  top_negative: ShapContribution[];
};

export type ComparedPatient = {
  patient_id: string;
  prediction: PatientPrediction;
  explanation: PatientExplanation;
};
