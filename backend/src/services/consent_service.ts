import { db, generateId } from '../db/database';
import type { Session } from '../types/index';

const CONSENT_PURPOSE = 'Clinical history and hospital consultation';

export function recordConsent(session: Session, consentGiven: boolean, purpose?: string) {
  const consent = {
    id: generateId(),
    session_id: session.id,
    consent_given: consentGiven,
    purpose: purpose ?? CONSENT_PURPOSE,
    timestamp: new Date().toISOString(),
  };
  db.consents.set(consent.id, consent);
  session.consent_id = consent.id;
  return consent;
}

export function getConsent(sessionId: string) {
  for (const consent of db.consents.values()) {
    if (consent.session_id === sessionId) {
      return consent;
    }
  }
  return null;
}