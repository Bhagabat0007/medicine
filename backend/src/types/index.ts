export type Language = 'en' | 'hi' | 'or' | 'bn';

export type SessionStatus =
  | 'CREATED'
  | 'CONSENT_PENDING'
  | 'IN_PROGRESS'
  | 'DOCUMENT_PROCESSING'
  | 'SUMMARY_READY'
  | 'DOCTOR_REVIEW'
  | 'COMPLETED'
  | 'RED_FLAG_DETECTED'
  | 'URGENT_TRIAGE'
  | 'EXPIRED';

export type Priority = 'NORMAL' | 'URGENT';

export type MessageRole = 'PATIENT' | 'AI' | 'SYSTEM';

export type QuestionType =
  | 'text'
  | 'voice'
  | 'single_choice'
  | 'multiple_choice'
  | 'scale'
  | 'date'
  | 'number'
  | 'yes_no';

export interface Question {
  question_id: string;
  type: QuestionType;
  text: string;
  subtext?: string;
  options?: string[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender?: string;
  abha_id?: string;
  token: string;
  created_at: string;
  updated_at: string;
}

export interface Consent {
  id: string;
  session_id: string;
  consent_given: boolean;
  purpose: string;
  timestamp: string;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  message: string;
  question_id?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ClinicalData {
  chief_complaint?: string;
  onset?: string;
  severity?: number;
  character?: string;
  location?: string;
  duration?: string;
  associated_symptoms?: string[];
}

export interface Medication {
  name: string;
  dosage?: string;
}

export interface MedicalDocument {
  id: string;
  session_id: string;
  filename: string;
  document_type: string;
  date?: string;
  medicines: Medication[];
  diagnoses: string[];
  lab_values: string[];
  status: 'PROCESSED' | 'FAILED' | 'PENDING';
  created_at: string;
}

export interface RedFlag {
  id: string;
  session_id: string;
  priority: Priority;
  reason: string;
  triage_alert: boolean;
  created_at: string;
}

export interface ClinicalSummary {
  chief_complaint: { text: string };
  hpi: {
    onset?: string;
    severity?: number;
    character?: string;
    location?: string;
    duration?: string;
    associated_symptoms?: string[];
  };
  past_medical_history: string[];
  medications: Medication[];
  allergies: string[];
  family_history: string[];
  personal_history: Record<string, string>;
  review_of_systems: Record<string, string>;
}

export interface Session {
  id: string;
  patient_id: string;
  language: Language;
  status: SessionStatus;
  consent_id?: string;
  priority: Priority;
  clinical_data: ClinicalData;
  conversation: ConversationMessage[];
  documents: MedicalDocument[];
  red_flags: RedFlag[];
  summary?: ClinicalSummary;
  started_at: string;
  completed_at?: string;
  expires_at: string;
}

export interface IntegrationEvent {
  id: string;
  session_id: string;
  destination: string;
  resource_type: string;
  mock: boolean;
  status: 'SUCCESS' | 'FAILED';
  created_at: string;
}
