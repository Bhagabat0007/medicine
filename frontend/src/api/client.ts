import type { Question, ClinicalSummary } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach the server. Please check your connection.', 0);
  }

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('INVALID_RESPONSE', 'The server returned an unexpected response.', res.status);
  }

  if (!res.ok || !body.success) {
    throw new ApiError(body.error?.code ?? 'INTERNAL_ERROR', body.error?.message ?? 'Something went wrong.', res.status);
  }

  return body.data as T;
}

function jsonInit(method: string, payload: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

export interface ApiPatient {
  id: string;
  name: string;
  age: number;
  gender?: string;
  token: string;
}

export interface ApiSession {
  id: string;
  patient_id: string;
  language: string;
  status: string;
  priority: 'NORMAL' | 'URGENT';
}

export interface InterviewResult {
  next_question: Question | null;
  progress: number;
  priority: 'NORMAL' | 'URGENT';
  completed: boolean;
}

export interface DoctorQueueEntry {
  token: string;
  patient_id: string;
  session_id: string;
  patient_name: string;
  age: number;
  priority: 'NORMAL' | 'URGENT';
  status: string;
}

export interface ExtractedIdentity {
  name: string;
  age: number;
  gender?: string;
}

export interface ExtractIdentityResult {
  extracted: ExtractedIdentity;
  document_type: string;
}

export interface DoctorPatientDetail {
  patient: ApiPatient;
  summary: ClinicalSummary;
  documents: ApiDocument[];
  priority: 'NORMAL' | 'URGENT';
  status: string;
  session_id: string;
}

export interface ApiDocument {
  id: string;
  filename?: string;
  document_type?: string;
  date?: string;
  medicines?: { name: string; dosage?: string }[];
  diagnoses?: string[];
  lab_values?: string[];
  status?: string;
}

export const api = {
  createPatient: (input: { name: string; age?: number; gender?: string }) =>
    request<ApiPatient>('/patients', jsonInit('POST', input)),

  extractIdentity: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<ExtractIdentityResult>('/patients/extract', { method: 'POST', body: form });
  },

  createSession: (input: { patient_id: string; language: string }) =>
    request<ApiSession>('/sessions', jsonInit('POST', input)),

  recordConsent: (sessionId: string, consent_given: boolean) =>
    request<unknown>(`/sessions/${sessionId}/consent`, jsonInit('POST', { consent_given })),

  startInterview: (sessionId: string) =>
    request<{ question: Question; progress: number; priority: string }>(
      `/sessions/${sessionId}/interview/start`,
      { method: 'POST' },
    ),

  submitAnswer: (sessionId: string, input: { question_id: string; answer: string; input_type: 'voice' | 'text' | 'touch' }) =>
    request<InterviewResult>(`/sessions/${sessionId}/interview/answer`, jsonInit('POST', input)),

  uploadDocument: (sessionId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<ApiDocument>(`/sessions/${sessionId}/documents`, { method: 'POST', body: form });
  },

  getSessionDocuments: (sessionId: string) =>
    request<ApiDocument[]>(`/sessions/${sessionId}/documents`),

  getPriority: (sessionId: string) =>
    request<{ priority: string; reason: string; triage_alert: boolean }>(`/sessions/${sessionId}/priority`),

  generateSummary: (sessionId: string) =>
    request<{ summary: ClinicalSummary; integration: unknown }>(`/sessions/${sessionId}/summary`, { method: 'POST' }),

  getDoctorQueue: () => request<DoctorQueueEntry[]>('/doctor/queue'),

  getDoctorPatient: (patientId: string) =>
    request<DoctorPatientDetail>(`/doctor/patients/${patientId}/summary`),

  saveDoctorSummary: (patientId: string, edits: Record<string, unknown>) =>
    request<ClinicalSummary>(`/doctor/patients/${patientId}/summary`, jsonInit('PATCH', edits)),

  confirmDoctorSummary: (patientId: string) =>
    request<{ status: string; message: string }>(`/doctor/patients/${patientId}/summary/confirm`, { method: 'POST' }),
};
