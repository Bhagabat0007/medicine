import { Router } from 'express';
import { interviewAnswerSchema } from '../../schemas/index';
import { getSession } from '../../services/session_service';
import { startInterview, submitAnswer } from '../../services/interview_service';
import { asyncHandler, validate, param } from '../helpers';
import { badRequest } from '../../core/errors';

const router = Router({ mergeParams: true });

// POST /sessions/:session_id/interview/start
router.post(
  '/start',
  asyncHandler((req, res) => {
    const session = getSession(param(req.params.session_id));
    if (session.status === 'CONSENT_PENDING') {
      throw badRequest('CONSENT_REQUIRED', 'Consent must be given before starting the interview.');
    }
    const question = startInterview(session);
    res.json({ success: true, data: { question, progress: 0, priority: session.priority }, error: null });
  }),
);

// POST /sessions/:session_id/interview/answer
router.post(
  '/answer',
  asyncHandler(async (req, res) => {
    const session = getSession(param(req.params.session_id));
    const input = validate(interviewAnswerSchema, req.body ?? {});

    const result = await submitAnswer(
      session,
      input.question_id,
      input.answer,
      input.input_type,
    );

    res.json({
      success: true,
      data: {
        next_question: result.next_question,
        progress: result.progress,
        priority: result.priority,
        completed: result.completed,
      },
      error: null,
    });
  }),
);

// GET /sessions/:session_id/interview - current interview state
router.get(
  '/',
  asyncHandler((req, res) => {
    const session = getSession(param(req.params.session_id));
    res.json({
      success: true,
      data: {
        status: session.status,
        priority: session.priority,
        progress: session.conversation.filter((m) => m.role === 'PATIENT').length,
        conversation: session.conversation,
        clinical_data: session.clinical_data,
      },
      error: null,
    });
  }),
);

export default router;