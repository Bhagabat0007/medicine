import { Router } from 'express';
import { config } from '../../core/config';
import { llmEnabled } from '../../services/llm_service';
import { ocrService } from '../../services/ocr_service';
import { fhirService } from '../../services/fhir_service';

const router = Router();

/**
 * Reports which subsystems are running "live" (real provider / real data) vs
 * "simulated" (fallback). Never exposes secrets. Used by the doctor dashboard
 * to show an honest status badge for the hackathon demo.
 */
router.get('/capabilities', (_req, res) => {
  res.json({
    success: true,
    data: {
      llm: {
        enabled: llmEnabled(),
        mode: llmEnabled() ? 'live' : 'simulated',
      },
      ocr: {
        mode: ocrService.mode,
      },
      fhir: {
        mode: fhirService.mode,
      },
      persistence: {
        enabled: process.env.NODE_ENV !== 'test',
        location: config.dataDir,
      },
      auth: {
        enabled: true,
      },
      env: config.appEnv,
    },
    error: null,
  });
});

export default router;
