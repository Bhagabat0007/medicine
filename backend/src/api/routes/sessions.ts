import { Router } from 'express';
import { createSessionSchema, consentSchema } from '../../schemas/index';
import { db, generateId } from '../../db/database';
import { getPatient, getSession, sessionExpiryDate } from '../../services/session_service';
import { recordConsent, getConsent } from '../../services/consent_service';
import { asyncHandler, validate, param } from '../helpers';
import { badRequest } from '../../core/errors';

const router = Router();

// POST /sessions - create a new session for a patient
router.post(
  '/',
  asyncHandler((req, res) => {
    const input = validate(createSessionSchema, req.body ?? {});
    const patient = getPatient(input.patient_id);

    const session = {
      id: generateId(),
      patient_id: patient.id,
      language: input.language,
      status: 'CONSENT_PENDING' as const,
      priority: 'NORMAL' as const,
      clinical_data: {},
      conversation: [],
      documents: [],
      red_flags: [],
      started_at: new Date().toISOString(),
      expires_at: sessionExpiryDate(),
    };

    db.sessions.set(session.id, session);
    res.status(201).json({ success: true, data: session, error: null });
  }),
);

// GET /sessions/:id
router.get(
  '/:id',
  asyncHandler((req, res) => {
    const session = getSession(param(req.params.id));
    res.json({ success: true, data: session, error: null });
  }),
);

// POST /sessions/:id/consent
router.post(
  '/:id/consent',
  asyncHandler((req, res) => {
    const session = getSession(param(req.params.id));
    const input = validate(consentSchema, req.body ?? {});
    const consent = recordConsent(session, input.consent_given, input.purpose);
    session.status = input.consent_given ? 'IN_PROGRESS' : 'CONSENT_PENDING';
    res.status(201).json({ success: true, data: consent, error: null });
  }),
);

// GET /sessions/:id/consent
router.get(
  '/:id/consent',
  asyncHandler((req, res) => {
    const session = getSession(param(req.params.id));
    const consent = getConsent(session.id);
    if (!consent) throw badRequest('CONSENT_REQUIRED', 'Consent has not been recorded yet.');
    res.json({ success: true, data: consent, error: null });
  }),
);

// GET /sessions/:id/priority - red flag / triage status
router.get(
  '/:id/priority',
  asyncHandler((req, res) => {
    const session = getSession(param(req.params.id));
    const latest = session.red_flags[session.red_flags.length - 1];
    res.json({
      success: true,
      data: {
        priority: session.priority,
        reason: latest?.reason ?? 'No emergency pattern detected',
        triage_alert: session.priority === 'URGENT',
      },
      error: null,
    });
  }),
);

export default router;