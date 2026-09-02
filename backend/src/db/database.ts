import type {
  Patient,
  Session,
  Consent,
  ConversationMessage,
  IntegrationEvent,
} from '../types/index';
import { loadFromDisk, deserialise, save } from './persistence';
import { logger } from '../core/logger';

/**
 * Database layer.
 *
 * The hackathon MVP originally used a plain in-memory store. It has been
 * upgraded to persist to a JSON file on disk so data survives server restarts.
 * The public interface below is identical to the original in-memory store,
 * so services/routes are unchanged - they keep calling `db.sessions.set(...)`
 * etc. and every mutation is automatically flushed to disk.
 */

export interface Database {
  patients: Map<string, Patient>;
  sessions: Map<string, Session>;
  consents: Map<string, Consent>;
  integrationEvents: IntegrationEvent[];
}

/**
 * A Map subclass that schedules a debounced write to disk after every
 * mutation (set/delete/clear), giving automatic durability.
 */
class PersistingMap<K, V> extends Map<K, V> {
  private timer: ReturnType<typeof setTimeout> | null = null;

  private schedulePersist(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      persistNow();
    }, 100);
  }

  override set(key: K, value: V): this {
    super.set(key, value);
    this.schedulePersist();
    return this;
  }

  override delete(key: K): boolean {
    const result = super.delete(key);
    if (result) this.schedulePersist();
    return result;
  }

  override clear(): void {
    super.clear();
    this.schedulePersist();
  }
}

function persistNow(): void {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') return;
  save(db);
}

function buildDb(): Database {
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  const stored = isTest ? null : loadFromDisk();
  if (stored) {
    const rehydrated = deserialise(stored);
    logger.info('Restored database from disk');
    return {
      patients: new PersistingMap<string, Patient>((rehydrated.patients as Map<string, Patient>) as any),
      sessions: new PersistingMap<string, Session>((rehydrated.sessions as Map<string, Session>) as any),
      consents: new PersistingMap<string, Consent>((rehydrated.consents as Map<string, Consent>) as any),
      integrationEvents: rehydrated.integrationEvents as IntegrationEvent[],
    };
  }
  return {
    patients: new PersistingMap<string, Patient>(),
    sessions: new PersistingMap<string, Session>(),
    consents: new PersistingMap<string, Consent>(),
    integrationEvents: [],
  };
}

export const db: Database = buildDb();

/**
 * Append a read-only conversation message directly into a session.
 */
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
