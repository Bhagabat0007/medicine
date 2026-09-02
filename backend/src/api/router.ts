import { Router } from 'express';
import patients from './routes/patients';
import sessions from './routes/sessions';
import interview from './routes/interview';
import documents from './routes/documents';
import summary from './routes/summary';
import doctor from './routes/doctor';
import integration from './routes/integration';

const router = Router();

// Patient + session resources
router.use('/patients', patients);
router.use('/sessions', sessions);

// Nested session resources
router.use('/sessions/:session_id/interview', interview);
router.use('/sessions/:session_id/documents', documents);
router.use('/sessions/:session_id/summary', summary);

// Doctor + integration
router.use('/doctor', doctor);
router.use('/integration', integration);

export default router;