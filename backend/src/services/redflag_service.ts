import type { Priority, Session } from '../types/index';
import { db, generateId } from '../db/database';

/**
 * Deterministic red-flag rules for the hackathon.
 * Supplemented in the demo by an LLM classifier (not exposed to patients).
 */
const RED_FLAG_PATTERNS: string[][] = [
  ['chest pain', 'breathlessness'],
  ['difficulty breathing', 'chest pain'],
  ['breathlessness', 'chest'],
  ['chest', 'sweating'],
  ['face drooping'],
  ['speech difficulty'],
  ['sudden weakness'],
  ['severe bleeding'],
  ['unconscious'],
  ['difficulty speaking'],
];

const SEVERITY_THRESHOLD = 9;

export interface RedFlagResult {
  priority: Priority;
  reason: string;
  triage_alert: boolean;
  detected: boolean;
}

/**
 * Evaluate free text + structured data for emergency symptom patterns.
 * Never returns a clinical diagnosis - only "may need urgent attention".
 */
export function evaluateRedFlag(
  text: string,
  clinicalData: { chief_complaint?: string; severity?: number; associated_symptoms?: string[] } = {},
): RedFlagResult {
  const combined = `${text} ${clinicalData.chief_complaint ?? ''} ${(clinicalData.associated_symptoms ?? []).join(' ')}`.toLowerCase();

  for (const pattern of RED_FLAG_PATTERNS) {
    const matchCount = pattern.filter((term) => combined.includes(term.toLowerCase())).length;
    if (matchCount === pattern.length) {
      return {
        priority: 'URGENT',
        reason: 'Potential emergency symptom pattern',
        triage_alert: true,
        detected: true,
      };
    }
  }

  if (clinicalData.severity !== undefined && clinicalData.severity >= SEVERITY_THRESHOLD) {
    return {
      priority: 'URGENT',
      reason: 'Reported symptom severity is very high',
      triage_alert: true,
      detected: true,
    };
  }

  return {
    priority: 'NORMAL',
    reason: 'No emergency pattern detected',
    triage_alert: false,
    detected: false,
  };
}

export function applyRedFlagToSession(session: Session, text: string): RedFlagResult {
  const result = evaluateRedFlag(text, session.clinical_data);

  if (result.detected) {
    session.priority = 'URGENT';
    if (session.status !== 'URGENT_TRIAGE') {
      session.status = 'RED_FLAG_DETECTED';
    }
    session.red_flags.push({
      id: generateId(),
      session_id: session.id,
      priority: 'URGENT',
      reason: result.reason,
      triage_alert: true,
      created_at: new Date().toISOString(),
    });
  } else {
    session.status = 'IN_PROGRESS';
  }

  return result;
}