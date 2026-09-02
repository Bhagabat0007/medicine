import type { Request, Response, NextFunction } from 'express';
import { readBearerToken, verifyToken } from '../../services/auth_service';

/**
 * Express middleware that requires a valid doctor JWT.
 * Attaches the verified token payload to `req.auth` for downstream handlers.
 */
export interface AuthPayload {
  sub: string;
  role: string;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = readBearerToken(req.headers.authorization);
    const payload = verifyToken(token);
    req.auth = payload;
    next();
  } catch (err) {
    next(err);
  }
}
