import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  appEnv: process.env.APP_ENV ?? 'development',
  llmApiKey: process.env.LLM_API_KEY ?? '',
  ocrApiKey: process.env.OCR_API_KEY ?? '',
  fhirBaseUrl: process.env.FHIR_BASE_URL ?? '',
  fhirClientId: process.env.FHIR_CLIENT_ID ?? '',
  fhirClientSecret: process.env.FHIR_CLIENT_SECRET ?? '',
  sessionExpiryMinutes: Number(process.env.SESSION_EXPIRY_MINUTES ?? 60),
  sessionExpiryMs: Number(process.env.SESSION_EXPIRY_MINUTES ?? 60) * 60 * 1000,
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  isProduction: (process.env.APP_ENV ?? 'development') === 'production',
} as const;
