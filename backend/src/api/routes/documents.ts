import { Router } from 'express';
import multer from 'multer';
import { getSession } from '../../services/session_service';
import { ocrService } from '../../services/ocr_service';
import { asyncHandler, param } from '../helpers';

const router = Router({ mergeParams: true });

// File validation: jpg/jpeg/png/pdf only, max 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      const err: any = new Error('UNSUPPORTED_FILE');
      err.code = 'UNSUPPORTED_FILE';
      cb(err, false);
      return;
    }
    cb(null, true);
  },
});

const handleUploadError = (err: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const e: any = new Error('DOCUMENT_TOO_LARGE');
      e.code = 'DOCUMENT_TOO_LARGE';
      return e;
    }
  }
  return err;
};

// POST /sessions/:session_id/documents
router.post(
  '/',
  (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        const mapped = handleUploadError(err);
        const status = mapped.code === 'UNSUPPORTED_FILE' ? 400 : 413;
        return res.status(status).json({
          success: false,
          data: null,
          error: { code: mapped.code ?? 'UPLOAD_ERROR', message: 'Document could not be processed.' },
        });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const session = getSession(param(req.params.session_id));
    if (!req.file) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_INPUT', message: 'No file uploaded.' },
      });
    }

    session.status = 'DOCUMENT_PROCESSING';

    try {
      const document = await ocrService.process(req.file.originalname, req.file.mimetype);
      document.session_id = session.id;
      session.documents.push(document);
      session.status = session.priority === 'URGENT' ? 'RED_FLAG_DETECTED' : 'IN_PROGRESS';
      return res.status(201).json({ success: true, data: document, error: null });
    } catch {
      return res.status(422).json({
        success: false,
        data: null,
        error: { code: 'OCR_ERROR', message: "We couldn't read this document. Please try another photo." },
      });
    }
  }),
);

// GET /sessions/:session_id/documents
router.get(
  '/',
  asyncHandler((req, res) => {
    const session = getSession(param(req.params.session_id));
    res.json({ success: true, data: session.documents, error: null });
  }),
);

export default router;