import { Router } from 'express';
import patients from './routes/patients';
import sessions from './routes/sessions';
import interview from './routes/interview';
import documents from './routes/documents';
import summary from './routes/summary';
import doctor from './routes/doctor';
import integration from './routes/integration';
import auth from './routes/auth';
import system from './routes/system';
import { requireAuth } from './middleware/auth';

const router = Router();

// Public: doctor authentication + system status
router.use('/auth', auth);
router.use('/system', system);

// Patient + session resources (kiosk, public)
router.use('/patients', patients);
router.use('/sessions', sessions);

// Nested session resources
router.use('/sessions/:session_id/interview', interview);
router.use('/sessions/:session_id/documents', documents);
router.use('/sessions/:session_id/summary', summary);

// Protected: doctor + integration endpoints require a valid JWT
router.use('/doctor', requireAuth, doctor);
router.use('/integration', requireAuth, integration);

export default router;
