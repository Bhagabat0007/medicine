export type Language = 'en' | 'hi' | 'or' | 'bn';

export type QuestionType = 'text' | 'voice' | 'single_choice' | 'multiple_choice' | 'scale' | 'date' | 'number' | 'yes_no';

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

export interface ConversationMessage {
  id: string;
  role: 'ai' | 'patient';
  message: string;
  timestamp: number;
}

export interface Symptom {
  id: string;
  name: string;
  severity?: number;
  duration?: string;
}

export interface MedicalDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  medicines?: { name: string; dosage?: string }[];
  diagnoses?: string[];
  processed: boolean;
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
  medications: { name: string; dosage?: string }[];
  allergies: string[];
  family_history: string[];
  personal_history: Record<string, string>;
  review_of_systems: Record<string, string>;
}

export interface PatientSession {
  patientId: string;
  sessionId: string;
  name: string;
  age: number;
  language: Language;
  consentGiven: boolean;
  symptoms: Symptom[];
  conversation: ConversationMessage[];
  documents: MedicalDocument[];
  summary?: ClinicalSummary;
  priority: 'normal' | 'urgent';
  currentStep: number;
  totalSteps: number;
  currentQuestion: Question | null;
  interviewProgress: number;
  isListening: boolean;
  isSubmitting: boolean;
  isEmergency: boolean;
}

export type SessionStatus = 
  | 'CREATED'
  | 'CONSENT_PENDING'
  | 'IN_PROGRESS'
  | 'DOCUMENT_PROCESSING'
  | 'SUMMARY_READY'
  | 'DOCTOR_REVIEW'
  | 'COMPLETED';

export interface DoctorPatient {
  token: string;
  patientId: string;
  name: string;
  age: number;
  priority: 'normal' | 'urgent';
  status: SessionStatus;
  summary?: ClinicalSummary;
  documents: MedicalDocument[];
}