import { Router } from 'express';
import { db } from '../../db/database';
import type { Session } from '../../types/index';
import { getPatient } from '../../services/session_service';
import { editSummarySchema } from '../../schemas/index';
import { emptySummary } from '../../services/summary_service';
import { asyncHandler, validate, param } from '../helpers';
import { notFound, badRequest } from '../../core/errors';
import { fhirService } from '../../services/fhir_service';

const router = Router();

// GET /doctor/queue
router.get(
  '/queue',
  asyncHandler((_req, res) => {
    const queue = [];

    for (const session of db.sessions.values()) {
      if (session.status === 'EXPIRED') continue;
      const patient = db.patients.get(session.patient_id);
      if (!patient) continue;

      queue.push({
        token: patient.token,
        patient_id: session.patient_id,
        session_id: session.id,
        patient_name: patient.name,
        age: patient.age,
        priority: session.priority,
        status: session.status,
      });
    }

    // priority first (URGENT before NORMAL), then by start time
    queue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'URGENT' ? -1 : 1;
      return a.patient_name.localeCompare(b.patient_name);
    });

    res.json({ success: true, data: queue, error: null });
  }),
);

// GET /doctor/patients/:id/summary
router.get(
  '/patients/:id/summary',
  asyncHandler((req, res) => {
    const patient = getPatient(param(req.params.id));
    const session = findLatestSession(patient.id);

    if (!session) {
      throw notFound('SESSION_NOT_FOUND', 'No session found for this patient.');
    }

    if (!session.summary) {
      session.summary = emptySummary();
    }

    res.json({
      success: true,
      data: {
        patient,
        summary: session.summary,
        documents: session.documents,
        priority: session.priority,
        status: session.status,
        session_id: session.id,
      },
      error: null,
    });
  }),
);

// PATCH /doctor/patients/:id/summary
router.patch(
  '/patients/:id/summary',
  asyncHandler((req, res) => {
    const patient = getPatient(param(req.params.id));
    const session = findLatestSession(patient.id);
    if (!session) throw notFound('SESSION_NOT_FOUND', 'No session found for this patient.');
    if (!session.summary) throw badRequest('SUMMARY_NOT_READY', 'Summary not generated yet.');

    const edits = validate(editSummarySchema, req.body ?? {});
    if (!edits || Object.keys(edits).length === 0) {
      throw badRequest('INVALID_INPUT', 'No editable fields provided.');
    }

    if (edits.chief_complaint !== undefined) {
      session.summary.chief_complaint.text = edits.chief_complaint;
    }
    if (edits.hpi !== undefined) {
      session.summary.hpi = { ...session.summary.hpi, ...edits.hpi };
    }
    if (edits.past_medical_history !== undefined) session.summary.past_medical_history = edits.past_medical_history;
    if (edits.medications !== undefined) session.summary.medications = edits.medications;
    if (edits.allergies !== undefined) session.summary.allergies = edits.allergies;
    if (edits.family_history !== undefined) session.summary.family_history = edits.family_history;
    if (edits.personal_history !== undefined) session.summary.personal_history = edits.personal_history;
    if (edits.review_of_systems !== undefined) session.summary.review_of_systems = edits.review_of_systems;

    session.status = 'DOCTOR_REVIEW';

    res.json({ success: true, data: session.summary, error: null });
  }),
);

// POST /doctor/patients/:id/summary/confirm
router.post(
  '/patients/:id/summary/confirm',
  asyncHandler(async (req, res) => {
    const patient = getPatient(param(req.params.id));
    const session = findLatestSession(patient.id);
    if (!session) throw notFound('SESSION_NOT_FOUND', 'No session found for this patient.');

    session.status = 'COMPLETED';
    session.completed_at = new Date().toISOString();

    // Mock FHIR push on confirm
    await Promise.all([
      fhirService.pushEncounter(session.id),
      fhirService.pushDocument(session.id),
    ]);

    res.json({
      success: true,
      data: { status: 'CONFIRMED', message: 'Clinical summary confirmed.' },
      error: null,
    });
  }),
);

function findLatestSession(patientId: string): Session | null {
  let latest: Session | null = null;
  for (const session of db.sessions.values()) {
    if (session.patient_id === patientId) {
      if (!latest || session.started_at > latest.started_at) {
        latest = session;
      }
    }
  }
  return latest;
}

export default router;