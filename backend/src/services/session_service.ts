import { db } from '../db/database';
import { config } from '../core/config';
import { sessionExpired, notFound } from '../core/errors';
import type { Session } from '../types/index';

export function getSession(sessionId: string): Session {
  const session = db.sessions.get(sessionId);
  if (!session) {
    throw notFound('SESSION_NOT_FOUND', 'Session not found.');
  }

  const now = Date.now();
  if (new Date(session.expires_at).getTime() < now) {
    if (session.status !== 'COMPLETED') {
      session.status = 'EXPIRED';
    }
    throw sessionExpired();
  }

  return session;
}

export function getPatient(patientId: string) {
  const patient = db.patients.get(patientId);
  if (!patient) {
    throw notFound('PATIENT_NOT_FOUND', 'Patient not found.');
  }
  return patient;
}

export function isExpired(session: Session): boolean {
  return new Date(session.expires_at).getTime() < Date.now();
}

export function sessionExpiryDate(): string {
  return new Date(Date.now() + config.sessionExpiryMs).toISOString();
}