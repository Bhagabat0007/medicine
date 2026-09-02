import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../core/errors';
import { logger } from '../../core/logger';

/**
 * Central error handler - converts unknown errors into the standard
 * { success, data, error } response format. Never leaks stack traces.
 */
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred.';

  if (err && typeof err === 'object') {
    const e = err as { code?: string; message?: unknown };
    if (e.code === 'UNSUPPORTED_FILE') {
      status = 400;
      code = 'UNSUPPORTED_FILE';
      message = 'Unsupported file type. Please upload a JPG, PNG, or PDF.';
    } else if (e.code === 'DOCUMENT_TOO_LARGE') {
      status = 413;
      code = 'DOCUMENT_TOO_LARGE';
      message = 'Document is too large. Maximum size is 5MB.';
    }
  }

  logger.error(`Unhandled error (${code})`, { error: message });
  res.status(status).json({
    success: false,
    data: null,
    error: { code, message },
  });
}

/** 404 handler for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    data: null,
    error: { code: 'NOT_FOUND', message: 'Route not found.' },
  });
}