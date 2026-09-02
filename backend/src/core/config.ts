import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  appEnv: process.env.APP_ENV ?? 'development',
  llmApiKey: process.env.LLM_API_KEY ?? '',
  ocrApiKey: process.env.OCR_API_KEY ?? '',
  ocrEndpoint: process.env.OCR_ENDPOINT ?? '',
  fhirBaseUrl: process.env.FHIR_BASE_URL ?? '',
  fhirClientId: process.env.FHIR_CLIENT_ID ?? '',
  fhirClientSecret: process.env.FHIR_CLIENT_SECRET ?? '',
  sessionExpiryMinutes: Number(process.env.SESSION_EXPIRY_MINUTES ?? 60),
  sessionExpiryMs: Number(process.env.SESSION_EXPIRY_MINUTES ?? 60) * 60 * 1000,
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  isProduction: (process.env.APP_ENV ?? 'development') === 'production',

  // Auth / JWT
  jwtSecret: process.env.JWT_SECRET ?? 'medikiosk-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',

  // Persistence
  dataDir: process.env.DATA_DIR ?? 'data',

  // Seeded doctor credentials (override via env in production)
  doctorUsername: process.env.DOCTOR_USERNAME ?? 'admin',
  doctorPassword: process.env.DOCTOR_PASSWORD ?? 'doctor123',
} as const;
