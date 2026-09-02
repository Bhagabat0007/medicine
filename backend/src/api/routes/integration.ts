import { Router } from 'express';
import { fhirService } from '../../services/fhir_service';
import { asyncHandler } from '../helpers';
import { badRequest } from '../../core/errors';

const router = Router();

// POST /integration/fhir/push
router.post(
  '/fhir/push',
  asyncHandler(async (req, res) => {
    const sessionId = (req.body as { session_id?: string } | undefined)?.session_id;
    if (!sessionId) {
      throw badRequest('INVALID_INPUT', 'session_id is required.');
    }

    const result = await fhirService.pushClinicalDocument(sessionId);

    res.json({
      success: true,
      data: result,
      error: null,
    });
  }),
);

export default router;