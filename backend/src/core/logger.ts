function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    // Redact likely patient-identifiable tokens: ABHA/Aadhaar numbers, names, medical content
    if (/abha|aadhaar|patient_name|name/i.test(value)) {
      return '[REDACTED]';
    }
  }
  return value;
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
  },
};

function sanitize(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    // Never log patient medical history, document contents, or LLM prompts
    if (/history|prompt|document|content|message|conversation/i.test(key)) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = redact(value);
    }
  }
  return out;
}
