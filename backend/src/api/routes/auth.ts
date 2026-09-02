import { Router } from 'express';
import { z } from 'zod';
import { doctorProfile, verifyPassword, signToken } from '../../services/auth_service';
import { asyncHandler, validate } from '../helpers';
import { badRequest } from '../../core/errors';
import { requireAuth } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /auth/login - authenticate a doctor and issue a JWT
router.post(
  '/login',
  asyncHandler((req, res) => {
    const input = validate(loginSchema, req.body ?? {});

    if (input.username !== doctorProfile.username || !verifyPassword(input.password)) {
      throw badRequest('INVALID_CREDENTIALS', 'Invalid username or password.');
    }

    const token = signToken(doctorProfile);
    res.json({
      success: true,
      data: {
        token,
        user: doctorProfile,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      },
      error: null,
    });
  }),
);

// GET /auth/me - return the profile of the currently authenticated doctor
router.get(
  '/me',
  requireAuth,
  asyncHandler((req, res) => {
    res.json({
      success: true,
      data: { ...doctorProfile, auth: req.auth },
      error: null,
    });
  }),
);

export default router;
