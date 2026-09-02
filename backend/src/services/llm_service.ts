import { config } from '../core/config';
import type { Question, QuestionType, Session } from '../types/index';

/**
 * Groq/OpenAI-compatible LLM wrapper.
 *
 * `chatJSON` sends a prompt to the configured LLM (the "GROQ_API_KEY" style
 * key is read from config.llmApiKey) and returns a parsed JSON object.
 *
 * Every public helper is defensive: on missing key, network/parse failure or
 * timeout it returns a safe fallback so the app keeps working without the LLM.
 */

const LLM_JSON_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const TIMEOUT_MS = 8000;

export function llmEnabled(): boolean {
  // Never call the network during automated tests.
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') return false;
  return Boolean(config.llmApiKey);
}

async function chatJSON(
  messages: { role: string; content: string }[],
  temperature = 0.4,
): Promise<Record<string, unknown> | null> {
  if (!config.llmApiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(LLM_JSON_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llmApiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL ?? DEFAULT_MODEL,
        temperature,
        messages,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Strip possible markdown fences
      const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
    return (parsed as Record<string, unknown>) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const QUESTION_TYPES: QuestionType[] = [
  'text',
  'voice',
  'single_choice',
  'multiple_choice',
  'scale',
  'date',
  'number',
  'yes_no',
];

function sanitizeQuestion(raw: Record<string, unknown>): Omit<Question, 'question_id'> | null {
  const text = typeof raw.text === 'string' && raw.text.trim() ? raw.text.trim() : null;
  if (!text) return null;

  const typeRaw = typeof raw.type === 'string' ? raw.type.toLowerCase() : 'text';
  const type: QuestionType = QUESTION_TYPES.includes(typeRaw as QuestionType)
    ? (typeRaw as QuestionType)
    : 'text';

  const options = Array.isArray(raw.options)
    ? raw.options.filter((o): o is string => typeof o === 'string')
    : undefined;

  const min = typeof raw.min === 'number' ? raw.min : undefined;
  const max = typeof raw.max === 'number' ? raw.max : undefined;
  const subtext = typeof raw.subtext === 'string' ? raw.subtext : undefined;
  const minLabel = typeof raw.minLabel === 'string' ? raw.minLabel : undefined;
  const maxLabel = typeof raw.maxLabel === 'string' ? raw.maxLabel : undefined;

  return { type, text, subtext, options, min, max, minLabel, maxLabel };
}

let genCounter = 0;

function nextQuestionId(): string {
  genCounter += 1;
  return `gen_${Date.now().toString(36)}_${genCounter}`;
}

function buildTranscript(session: Session): string {
  return session.conversation
    .map((m) => `${m.role === 'PATIENT' ? 'Patient' : 'Assistant'}: ${m.message}`)
    .join('\n');
}

export interface NextQuestionResult {
  question?: Question;
  done: boolean;
  /** true when the LLM path hit an error and the caller should fall back */
  fallback?: boolean;
}

/**
 * Ask the LLM for the next contextually-relevant clinical intake question
 * (SOCRATES-style) based on the patient's stated problem and prior answers.
 */
export async function generateNextQuestion(session: Session): Promise<NextQuestionResult> {
  if (!llmEnabled()) return { done: false, fallback: true };

  const clinical = session.clinical_data;
  const summaryLines = [
    `Chief complaint: ${clinical.chief_complaint ?? 'not given'}`,
    clinical.onset ? `Onset: ${clinical.onset}` : '',
    clinical.severity !== undefined ? `Severity: ${clinical.severity}/10` : '',
    clinical.character ? `Character: ${clinical.character}` : '',
    clinical.location ? `Location: ${clinical.location}` : '',
    (clinical.associated_symptoms ?? []).length
      ? `Associated symptoms: ${clinical.associated_symptoms?.join(', ')}`
      : '',
  ].filter(Boolean);

  const system = [
    'You are a compassionate clinical intake interviewer for a hospital kiosk (SOCRATES-style).',
    'Ask exactly ONE clear, short follow-up question at a time that is relevant to the specific problem the patient reported.',
    'Gather: onset, location, character, severity, timing, factors, associated symptoms, past medical history, current medications, and allergies.',
    'Adapt each question to what the patient already told you. Do not repeat a question that is already answered.',
    'When you have enough information for a doctor summary, set "done" to true and omit the question.',
    'Never provide a diagnosis. Only ask questions.',
    'Respond with strict JSON only: {"done": boolean, "question": {"type": string, "text": string, "subtext"?: string, "options"?: string[], "min"?: number, "max"?: number, "minLabel"?: string, "maxLabel"?: string}}',
    'Allowed "type" values: text, voice, single_choice, multiple_choice, scale, date, number, yes_no.',
    'Use single_choice/multiple_choice with short option lists (2-6 items) when natural.',
    `Interview so far:\n${buildTranscript(session)}`,
  ].join('\n');

  const user = [
    'Clinical data extracted so far:',
    ...summaryLines,
    '',
    'Given the above, what is the best next question to ask this patient right now? Return the JSON object.',
  ].join('\n');

  const result = await chatJSON(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    0.4,
  );

  if (!result) return { done: false, fallback: true };

  if (result.done === true) {
    return { done: true };
  }

  const raw = typeof result.question === 'object' && result.question !== null ? result.question : result;
  const sanitized = sanitizeQuestion(raw as Record<string, unknown>);
  if (!sanitized) return { done: false, fallback: true };

  return {
    done: false,
    question: {
      question_id: nextQuestionId(),
      ...sanitized,
    },
  };
}

export interface ExtractedIdentity {
  name: string;
  age: number;
  gender?: string;
  confidences?: { name?: number; age?: number };
}

/**
 * Ask the LLM to pull structured patient identity (name/age/gender) from raw
 * OCR text of an ABHA/Aadhaar-like document. Falls back to null on failure.
 */
export async function extractIdentityFromText(ocrText: string): Promise<ExtractedIdentity | null> {
  if (!llmEnabled()) return null;

  const system = [
    'You extract patient identity fields from OCR text of an Indian government ID (ABHA or Aadhaar card).',
    'Return strict JSON only: {"name": string, "age": number, "gender": "M"|"F"|"O", "confidences": {"name": number, "age": number}}.',
    'Set a field to empty string/0 if it cannot be confidently determined.',
  ].join('\n');

  const user = `OCR text of the identity document:\n"""\n${ocrText}\n"""\n\nExtract the patient identity as JSON.`;

  const result = await chatJSON(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    0.2,
  );

  if (!result) return null;

  const name = typeof result.name === 'string' ? result.name.trim() : '';
  const age = typeof result.age === 'number' && result.age > 0 ? Math.round(result.age) : 0;
  if (!name) return null;

  const gender = typeof result.gender === 'string' ? result.gender : undefined;
  const confidences = typeof result.confidences === 'object' && result.confidences !== null
    ? (result.confidences as { name?: number; age?: number })
    : undefined;

  return {
    name,
    age,
    gender,
    confidences: {
      name: typeof confidences?.name === 'number' ? confidences.name : undefined,
      age: typeof confidences?.age === 'number' ? confidences.age : undefined,
    },
  };
}
