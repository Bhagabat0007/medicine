import { Router } from 'express';
import { getSession } from '../../services/session_service';
import { generateSummary } from '../../services/summary_service';
import { generateClinicalSummaryDraft } from '../../services/llm_service';
import { fhirService } from '../../services/fhir_service';
import { asyncHandler, param } from '../helpers';
import { badRequest } from '../../core/errors';

const router = Router({ mergeParams: true });

// POST /sessions/:session_id/summary - generate + push summary
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const session = getSession(param(req.params.session_id));

    if (!session.clinical_data.chief_complaint) {
      throw badRequest('INCOMPLETE_INTERVIEW', 'Complete the interview before generating a summary.');
    }

    session.status = 'DOCUMENT_PROCESSING';

    // Prefer an LLM-generated draft; fall back to the deterministic generator
    // when no LLM key is configured or the call fails.
    const aiDraft = await generateClinicalSummaryDraft(session);
    const summary = aiDraft ?? generateSummary(session);

    session.summary = summary;
    session.status = 'SUMMARY_READY';

    // Mock FHIR push of the clinical document
    const push = await fhirService.pushClinicalDocument(session.id);

    res.json({
      success: true,
      data: { summary, integration: push, provider: aiDraft ? 'llm' : 'rules' },
      error: null,
    });
  }),
);

// GET /sessions/:session_id/summary
router.get(
  '/',
  asyncHandler((req, res) => {
    const session = getSession(param(req.params.session_id));
    if (!session.summary) {
      throw badRequest('SUMMARY_NOT_READY', 'Summary not generated yet.');
    }
    res.json({ success: true, data: session.summary, error: null });
  }),
);

export default router;