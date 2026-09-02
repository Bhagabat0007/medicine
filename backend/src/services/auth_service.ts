import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../core/config';
import { ApiError } from '../core/errors';

/**
 * Doctor authentication service.
 *
 * The doctor dashboard is now gated behind a real login. Credentials come from
 * the seeded doctor account (config), a JWT is issued on login, and every
 * protected `/doctor/*` + `/integration/*` route requires a valid Bearer token.
 * Passwords are stored as bcrypt hashes; the JWT secret comes from env.
 */

export interface DoctorProfile {
  id: string;
  username: string;
  displayName: string;
  role: string;
  specialty: string;
}

export const doctorProfile: DoctorProfile = {
  id: 'doc-mc001',
  username: config.doctorUsername,
  displayName: config.doctorUsername === 'admin' ? 'Dr. Arnav Roy' : config.doctorUsername,
  role: 'doctor',
  specialty: 'General Physician',
};

// bcrypt hash of the configured default password, computed lazily (cached).
let cachedHash: string | null = null;
function passwordHash(): string {
  if (!cachedHash) {
    cachedHash = bcrypt.hashSync(config.doctorPassword, 10);
  }
  return cachedHash;
}

export function verifyPassword(password: string): boolean {
  // Guard against trivial empty passwords.
  if (!password) return false;
  return bcrypt.compareSync(password, passwordHash());
}

export function signToken(profile: DoctorProfile): string {
  return jwt.sign(
    {
      sub: profile.id,
      username: profile.username,
      role: profile.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] },
  );
}

export function verifyToken(token: string): { sub: string; role: string; username: string } {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      sub: string;
      role: string;
      username: string;
    };
    if (payload.role !== 'doctor') {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions.');
    }
    return payload;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'UNAUTHORISED', 'Invalid or expired session.');
  }
}

/** Extract and validate the Bearer token from an Authorization header. */
export function readBearerToken(authHeader: string | undefined): string {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'UNAUTHORISED', 'Authentication required.');
  }
  return authHeader.slice('Bearer '.length).trim();
}
