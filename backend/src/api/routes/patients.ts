import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { createPatientSchema } from '../../schemas/index';
import { db, generateId, generateToken } from '../../db/database';
import { getPatient } from '../../services/session_service';
import { ocrService } from '../../services/ocr_service';
import { extractIdentityFromText } from '../../services/llm_service';
import { param } from '../helpers';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.mimetype)) {
      const err: any = new Error('UNSUPPORTED_FILE');
      err.code = 'UNSUPPORTED_FILE';
      cb(err, false);
      return;
    }
    cb(null, true);
  },
});

// POST /patients/extract - upload an ABHA/Aadhaar photo and extract identity
router.post(
  '/extract',
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_INPUT', message: 'No file uploaded.' },
      });
    }

    try {
      const { raw_text, document_type } = await ocrService.identityOcr(req.file.originalname);
      let identity = await extractIdentityFromText(raw_text);

      // Fallback when no LLM key is configured: parse the simulated OCR text.
      if (!identity) {
        const nameMatch = raw_text.match(/Name:\s*(.+)/i);
        const ageMatch = raw_text.match(/(?:Age\/Year of Birth:|Age:)\s*(\d+)/i);
        const genderMatch = raw_text.match(/Gender:\s*([MF])/i);
        identity = {
          name: nameMatch?.[1]?.trim() ?? '',
          age: ageMatch ? Number(ageMatch[1]) : 0,
          gender: genderMatch?.[1],
        };
      }

      if (!identity.name) {
        return res.status(422).json({
          success: false,
          data: null,
          error: { code: 'EXTRACTION_ERROR', message: "We couldn't read your details from the document. Please try again or enter them manually." },
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          extracted: identity,
          document_type,
        },
        error: null,
      });
    } catch {
      return res.status(422).json({
        success: false,
        data: null,
        error: { code: 'EXTRACTION_ERROR', message: "We couldn't read your document. Please try another photo." },
      });
    }
  },
);

router.post('/', (req, res) => {
  const input = createPatientSchema.parse(req.body ?? {});
  const patient = {
    id: generateId(),
    name: input.name,
    age: input.age ?? 0,
    gender: input.gender,
    abha_id: input.abha_id,
    token: generateToken(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.patients.set(patient.id, patient);
  res.json({ success: true, data: patient, error: null });
});

router.get('/:id', (req, res) => {
  const patient = getPatient(param(req.params.id));
  res.json({ success: true, data: patient, error: null });
});

// Validation error handler for zod within this router
router.use((err: unknown, _req: any, res: any, next: any) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      data: null,
      error: { code: 'INVALID_INPUT', message: err.issues[0]?.message ?? 'Invalid input.' },
    });
    return;
  }
  next(err);
});

export default router;