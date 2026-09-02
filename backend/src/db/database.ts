import type {
  Patient,
  Session,
  Consent,
  ConversationMessage,
  MedicalDocument,
  RedFlag,
  ClinicalSummary,
  IntegrationEvent,
} from '../types/index';

/**
 * In-memory storage for the hackathon MVP.
 * The interface mirrors what a real database (Postgres) would expose,
 * so it can be swapped out without changing services/routes.
 */
export interface Database {
  patients: Map<string, Patient>;
  sessions: Map<string, Session>;
  consents: Map<string, Consent>;
  integrationEvents: IntegrationEvent[];
}

export const db: Database = {
  patients: new Map(),
  sessions: new Map(),
  consents: new Map(),
  integrationEvents: [],
};

/** Append a read-only conversation message directly into a session. */
export function appendMessage(session: Session, message: Omit<ConversationMessage, 'id' | 'session_id' | 'timestamp'>): ConversationMessage {
  const full: ConversationMessage = {
    id: generateId(),
    session_id: session.id,
    timestamp: new Date().toISOString(),
    ...message,
  };
  session.conversation.push(full);
  return full;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
}

export function generateToken(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const num = String(100 + Math.floor(Math.random() * 900));
  return `${letter}${num}`;
}
