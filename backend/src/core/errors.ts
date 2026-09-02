export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

export const unauthorised = (msg = 'Session is no longer active.') =>
  new ApiError(401, 'INVALID_SESSION', msg);

export const sessionExpired = (msg = 'Session has expired.') =>
  new ApiError(410, 'SESSION_EXPIRED', msg);

export const notFound = (code: string, msg: string) =>
  new ApiError(404, code, msg);

export const conflict = (code: string, msg: string) =>
  new ApiError(409, code, msg);

export const badRequest = (code: string, msg: string) =>
  new ApiError(400, code, msg);
