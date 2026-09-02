import { create } from 'zustand';
import type { PatientSession, ConversationMessage, Question, Symptom, MedicalDocument, ClinicalSummary, Language } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 15);

interface StoreState {
  session: PatientSession;
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
}

const initialSession: PatientSession = {
  patientId: '',
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

export const useStore = create<StoreState>((set) => ({
  session: { ...initialSession },

  setLanguage: (lang) =>
    set((state) => ({ session: { ...state.session, language: lang } })),

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
    set((state) => ({
      session: {
        ...state.session,
        symptoms: [...state.session.symptoms, symptom],
      },
    })),

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
    set(() => ({ session: { ...initialSession } })),
}));