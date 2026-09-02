import { create } from 'zustand';
import { api, ApiError } from '../api/client';
import type { ApiDocument } from '../api/client';
import type { PatientSession, ConversationMessage, Question, Symptom, MedicalDocument, ClinicalSummary, Language } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 15);

interface StoreState {
  session: PatientSession;
  error: string | null;
  setLanguage: (lang: Language) => void;
  setPatientInfo: (name: string, age: number) => void;
  setConsent: (given: boolean) => void;
  setCurrentStep: (step: number) => void;
  addConversationMessage: (role: 'ai' | 'patient', message: string) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setInterviewProgress: (progress: number) => void;
  addSymptom: (symptom: Symptom) => void;
  addDocument: (doc: MedicalDocument) => void;
  setSummary: (summary: ClinicalSummary) => void;
  setPriority: (priority: 'normal' | 'urgent') => void;
  setListening: (listening: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setEmergency: (emergency: boolean) => void;
  resetSession: () => void;
  startFlow: (name: string, age: number, language: Language, gender?: string) => Promise<void>;
  confirmConsent: (given: boolean) => Promise<void>;
  beginInterview: () => Promise<Question | null>;
  answerQuestion: (questionId: string, answer: string, inputType: 'voice' | 'text' | 'touch') => Promise<{ next: Question | null; completed: boolean }>;
  submitDocument: (file: File) => Promise<ApiDocument>;
  finishAndGenerateSummary: () => Promise<ClinicalSummary>;
}

const initialSession: PatientSession = {
  patientId: '',
  sessionId: '',
  name: '',
  age: 0,
  language: 'en',
  consentGiven: false,
  symptoms: [],
  conversation: [],
  documents: [],
  priority: 'normal',
  currentStep: 1,
  totalSteps: 6,
  currentQuestion: null,
  interviewProgress: 0,
  isListening: false,
  isSubmitting: false,
  isEmergency: false,
};

export const useStore = create<StoreState>((set, get) => ({
  session: { ...initialSession },
  error: null,

  setLanguage: (lang) =>
    set((state) => ({ session: { ...state.session, language: lang }, error: null })),

  setPatientInfo: (name, age) =>
    set((state) => ({
      session: {
        ...state.session,
        name,
        age,
        patientId: generateId(),
      },
    })),

  setConsent: (given) =>
    set((state) => ({
      session: { ...state.session, consentGiven: given },
    })),

  setCurrentStep: (step) =>
    set((state) => ({ session: { ...state.session, currentStep: step } })),

  addConversationMessage: (role, message) =>
    set((state) => ({
      session: {
        ...state.session,
        conversation: [
          ...state.session.conversation,
          {
            id: generateId(),
            role,
            message,
            timestamp: Date.now(),
          } as ConversationMessage,
        ],
      },
    })),

  setCurrentQuestion: (question) =>
    set((state) => ({
      session: { ...state.session, currentQuestion: question },
    })),

  setInterviewProgress: (progress) =>
    set((state) => ({
      session: { ...state.session, interviewProgress: progress },
    })),

  addSymptom: (symptom) =>
    set((state) => {
      const exists = state.session.symptoms.some((s) => s.id === symptom.id);
      const symptoms = exists
        ? state.session.symptoms.map((s) => (s.id === symptom.id ? symptom : s))
        : [...state.session.symptoms, symptom];
      return { session: { ...state.session, symptoms } };
    }),

  addDocument: (doc) =>
    set((state) => ({
      session: {
        ...state.session,
        documents: [...state.session.documents, doc],
      },
    })),

  setSummary: (summary) =>
    set((state) => ({
      session: { ...state.session, summary },
    })),

  setPriority: (priority) =>
    set((state) => ({
      session: { ...state.session, priority },
    })),

  setListening: (listening) =>
    set((state) => ({
      session: { ...state.session, isListening: listening },
    })),

  setSubmitting: (submitting) =>
    set((state) => ({
      session: { ...state.session, isSubmitting: submitting },
    })),

  setEmergency: (emergency) =>
    set((state) => ({
      session: { ...state.session, isEmergency: emergency },
    })),

  resetSession: () =>
    set(() => ({ session: { ...initialSession }, error: null })),

  startFlow: async (name, age, language, gender) => {
    const s = get().session;
    if (s.sessionId) return;

    try {
      set({ error: null });
      set((state) => ({
        session: { ...state.session, name, age, language },
      }));

      const patient = await api.createPatient({ name, age, gender: gender ?? 'O' });
      const session = await api.createSession({ patient_id: patient.id, language });
      set((state) => ({
        session: {
          ...state.session,
          name,
          age,
          language,
          patientId: patient.id,
          sessionId: session.id,
        },
      }));
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Could not start the session.';
      set({ error: message });
      throw e;
    }
  },

  confirmConsent: async (given) => {
    const sessionId = get().session.sessionId;
    if (!sessionId) return;
    await api.recordConsent(sessionId, given);
    set((state) => ({
      session: { ...state.session, consentGiven: given, currentStep: 3 },
    }));
  },

  beginInterview: async () => {
    const sessionId = get().session.sessionId;
    if (!sessionId) return null;
    const data = await api.startInterview(sessionId);
    const question: Question | null = data.question ?? null;
    set((state) => ({
      session: { ...state.session, currentQuestion: question, interviewProgress: 0 },
    }));
    return question;
  },

  answerQuestion: async (questionId, answer, inputType) => {
    const sessionId = get().session.sessionId;
    if (!sessionId) return { next: null, completed: true };
    const result = await api.submitAnswer(sessionId, { question_id: questionId, answer, input_type: inputType });
    const next = result.next_question ?? null;

    set((state) => {
      const priority: 'normal' | 'urgent' = result.priority === 'URGENT' ? 'urgent' : 'normal';
      const emergency = result.priority === 'URGENT';
      return {
        session: {
          ...state.session,
          currentQuestion: next,
          interviewProgress: result.progress,
          priority,
          isEmergency: state.session.isEmergency || emergency,
        },
      };
    });

    return { next, completed: result.completed };
  },

  submitDocument: async (file) => {
    const sessionId = get().session.sessionId;
    if (!sessionId) throw new ApiError('INVALID_SESSION', 'No active session.');
    const doc = await api.uploadDocument(sessionId, file);
    const mapped: MedicalDocument = {
      id: doc.id,
      name: doc.filename ?? 'Document',
      type: doc.document_type ?? 'document',
      date: doc.date ?? 'Today',
      medicines: doc.medicines,
      diagnoses: doc.diagnoses,
      processed: true,
    };
    set((state) => ({
      session: { ...state.session, documents: [...state.session.documents, mapped] },
    }));
    return doc;
  },

  finishAndGenerateSummary: async () => {
    const sessionId = get().session.sessionId;
    if (!sessionId) throw new ApiError('INVALID_SESSION', 'No active session.');
    set((state) => ({ session: { ...state.session, isSubmitting: true } }));

    try {
      const { summary } = await api.generateSummary(sessionId);
      set((state) => ({
        session: { ...state.session, summary, isSubmitting: false, currentStep: 6 },
      }));
      return summary;
    } catch (e) {
      set((state) => ({ session: { ...state.session, isSubmitting: false } }));
      const message = e instanceof ApiError ? e.message : 'Could not generate the summary.';
      set({ error: message });
      throw e;
    }
  },
}));