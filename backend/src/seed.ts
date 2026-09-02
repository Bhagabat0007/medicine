import { db, generateId, generateToken } from './db/database';
import type { Session, Patient } from './types/index';
import { sessionExpiryDate } from './services/session_service';
import { logger } from './core/logger';

/**
 * Seed demo patients so the doctor dashboard and demo flow are non-empty on
 * first launch.
 *
 * Idempotent: with persistence enabled the store may already contain data from
 * a previous run, so we only seed when there are no patients at all. This
 * prevents the same demo patients being duplicated on every server restart.
 */
export function seedDemoData(): void {
  if (db.patients.size > 0) {
    logger.info('Skipping demo seed - database already has patients', {
      patients: db.patients.size,
    });
    return;
  }

  const patientId = generateId();
  const patient: Patient = {
    id: patientId,
    name: 'Rajesh Kumar',
    age: 54,
    gender: 'M',
    token: 'A104',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.patients.set(patientId, patient);

  const sessionId = generateId();
  const session: Session = {
    id: sessionId,
    patient_id: patientId,
    language: 'en',
    status: 'SUMMARY_READY',
    priority: 'URGENT',
    clinical_data: {
      chief_complaint: 'Chest pain',
      onset: 'Yesterday',
      severity: 7,
      character: 'Pressure-like',
      associated_symptoms: ['Breathlessness'],
    },
    conversation: [
      {
        id: generateId(),
        session_id: sessionId,
        role: 'PATIENT',
        message: "I've had chest pain since yesterday and I'm having trouble breathing.",
        timestamp: new Date().toISOString(),
      },
    ],
    documents: [
      {
        id: generateId(),
        session_id: sessionId,
        filename: 'sample-prescription.jpg',
        document_type: 'prescription',
        date: '2026-08-12',
        medicines: [
          { name: 'Amlodipine', dosage: '5mg' },
          { name: 'Aspirin', dosage: '75mg' },
        ],
        diagnoses: [],
        lab_values: [],
        status: 'PROCESSED',
        created_at: new Date().toISOString(),
      },
    ],
    red_flags: [
      {
        id: generateId(),
        session_id: sessionId,
        priority: 'URGENT',
        reason: 'Chest pain with breathlessness',
        triage_alert: true,
        created_at: new Date().toISOString(),
      },
    ],
    summary: {
      chief_complaint: { text: 'Chest pain for 1 day' },
      hpi: {
        onset: 'Yesterday',
        severity: 7,
        character: 'Pressure-like',
        associated_symptoms: ['Breathlessness'],
      },
      past_medical_history: ['Hypertension'],
      medications: [
        { name: 'Amlodipine', dosage: '5mg' },
        { name: 'Aspirin', dosage: '75mg' },
      ],
      allergies: ['Penicillin'],
      family_history: ['Father - heart disease'],
      personal_history: { smoking: 'Ex-smoker', alcohol: 'Occasional' },
      review_of_systems: {},
    },
    started_at: new Date().toISOString(),
    expires_at: sessionExpiryDate(),
  };
  db.sessions.set(sessionId, session);

  // Seed a second normal-priority patient
  const patient2Id = generateId();
  const patient2: Patient = {
    id: patient2Id,
    name: 'Priya Patel',
    age: 42,
    gender: 'F',
    token: 'A105',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.patients.set(patient2Id, patient2);

  const session2Id = generateId();
  db.sessions.set(session2Id, {
    id: session2Id,
    patient_id: patient2Id,
    language: 'en',
    status: 'SUMMARY_READY',
    priority: 'NORMAL',
    clinical_data: {
      chief_complaint: 'Persistent headaches for 3 days',
      onset: '3 days ago',
      severity: 5,
      character: 'Throbbing',
      location: 'Forehead',
      associated_symptoms: [],
    },
    conversation: [],
    documents: [],
    red_flags: [],
    summary: {
      chief_complaint: { text: 'Persistent headaches for 3 days' },
      hpi: { onset: '3 days ago', severity: 5, character: 'Throbbing', location: 'Forehead' },
      past_medical_history: [],
      medications: [],
      allergies: [],
      family_history: [],
      personal_history: {},
      review_of_systems: {},
    },
    started_at: new Date().toISOString(),
    expires_at: sessionExpiryDate(),
  });
}