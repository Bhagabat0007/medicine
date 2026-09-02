import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema, z } from 'zod';
import { ApiError } from '../core/errors';

/**
 * Wraps an async route handler so rejections are forwarded to the
 * central error-handling middleware instead of crashing the server.
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown> | unknown,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}

/**
 * Validates a request section against a Zod schema, throwing a 400
 * INVALID_INPUT ApiError on failure.
 */
export function validate<T extends ZodSchema>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(400, 'INVALID_INPUT', result.error.issues[0]?.message ?? 'Invalid input.');
  }
  return result.data;
}

/**
 * Coerces a route parameter to a string. Express 5 types route params as
 * `string | string[]`, but for our REST routes they are always a scalar.
 */
export function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}