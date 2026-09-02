import type { Question, Session } from '../types/index';
import { appendMessage } from '../db/database';
import { applyRedFlagToSession } from './redflag_service';
import { llmEnabled, generateNextQuestion } from './llm_service';
import { logger } from '../core/logger';

/**
 * SOCRATES-style adaptive interview engine.
 * For the hackathon MVP, this uses a deterministic rule-based branching
 * flow. It can be replaced/augmented with an LLM dialogue manager without
 * changing the route layer (the LLM would just populate `currentQuestion`).
 */

export const FIRST_QUESTION: Question = {
  question_id: 'chief_complaint',
  type: 'voice',
  text: 'What brings you here today?',
  subtext: 'Tell me in your own words.',
};

interface Branch {
  question_id: string;
  type: Question['type'];
  text: string;
  subtext?: string;
  options?: string[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}

const CHIEF_COMPLAINT_BRANCHES: { keywords: string[]; branch: Branch[] }[] = [
  {
    keywords: ['chest', 'heart', 'breath', 'breathing'],
    branch: [
      {
        question_id: 'pain_onset',
        type: 'single_choice',
        text: 'When did this start?',
        options: ['Today', 'Yesterday', 'A few days ago', 'A week ago', 'More than a week ago'],
      },
      {
        question_id: 'pain_severity',
        type: 'scale',
        text: 'How severe is it?',
        subtext: 'From 0 (no pain) to 10 (worst pain)',
        min: 0,
        max: 10,
        minLabel: 'No pain',
        maxLabel: 'Worst pain',
      },
      {
        question_id: 'pain_character',
        type: 'single_choice',
        text: 'How would you describe it?',
        options: ['Pressure', 'Burning', 'Sharp', 'Tightness', 'Dull ache', 'Other'],
      },
      {
        question_id: 'associated_symptoms',
        type: 'multiple_choice',
        text: 'Any of these along with it?',
        subtext: 'Select all that apply.',
        options: ['Fever', 'Breathlessness', 'Nausea', 'Dizziness', 'Sweating', 'None of these'],
      },
    ],
  },
  {
    keywords: ['head', 'headache', 'migraine'],
    branch: [
      {
        question_id: 'pain_onset',
        type: 'single_choice',
        text: 'When did the headache start?',
        options: ['Today', 'Yesterday', 'A few days ago', 'A week ago', 'More than a week ago'],
      },
      {
        question_id: 'pain_severity',
        type: 'scale',
        text: 'How severe is the headache?',
        subtext: 'Rate from 0 (mild) to 10 (worst)',
        min: 0,
        max: 10,
        minLabel: 'Mild',
        maxLabel: 'Worst',
      },
      {
        question_id: 'pain_character',
        type: 'single_choice',
        text: 'How would you describe it?',
        options: ['Throbbing', 'Sharp', 'Pressure', 'Dull ache', 'Other'],
      },
      {
        question_id: 'associated_symptoms',
        type: 'multiple_choice',
        text: 'Any of these along with it?',
        subtext: 'Select all that apply.',
        options: ['Nausea', 'Light sensitivity', 'Dizziness', 'Fever', 'Blurred vision', 'None of these'],
      },
    ],
  },
  {
    keywords: ['stomach', 'abdomen', 'vomit', 'diarrhea', 'nausea', 'belly'],
    branch: [
      {
        question_id: 'pain_onset',
        type: 'single_choice',
        text: 'When did the stomach problem start?',
        options: ['Today', 'Yesterday', 'A few days ago', 'A week ago', 'More than a week ago'],
      },
      {
        question_id: 'pain_severity',
        type: 'scale',
        text: 'How severe is it?',
        subtext: 'Rate from 0 (mild) to 10 (worst)',
        min: 0,
        max: 10,
        minLabel: 'Mild',
        maxLabel: 'Worst',
      },
      {
        question_id: 'associated_symptoms',
        type: 'multiple_choice',
        text: 'Any of these along with it?',
        subtext: 'Select all that apply.',
        options: ['Vomiting', 'Fever', 'Diarrhea', 'Dehydration', 'Blood in stool', 'None of these'],
      },
    ],
  },
];

const GENERIC_BRANCH: Branch[] = [
  {
    question_id: 'pain_onset',
    type: 'single_choice',
    text: 'When did this start?',
    options: ['Today', 'Yesterday', 'A few days ago', 'A week ago', 'More than a week ago'],
  },
  {
    question_id: 'pain_severity',
    type: 'scale',
    text: 'How severe is it on a scale of 0 to 10?',
    subtext: '0 is no pain, 10 is the worst pain',
    min: 0,
    max: 10,
    minLabel: 'No pain',
    maxLabel: 'Worst pain',
  },
  {
    question_id: 'associated_symptoms',
    type: 'multiple_choice',
    text: 'Any of these along with it?',
    subtext: 'Select all that apply.',
    options: ['Fever', 'Breathlessness', 'Nausea', 'Dizziness', 'Sweating', 'None of these'],
  },
];

const TAIL_QUESTIONS: Branch[] = [
  {
    question_id: 'previous_medications',
    type: 'voice',
    text: 'Are you taking any medicines right now?',
    subtext: 'You can say them or type.',
  },
  {
    question_id: 'allergies',
    type: 'single_choice',
    text: 'Do you have any allergies?',
    options: ['No known allergies', 'Yes, to medicines', 'Yes, to food', 'Yes, to other things'],
  },
];

interface InterviewState {
  chiefComplaint?: string;
  branchAccepted: boolean;
  tailIndex: number;
}

const interviewState = new Map<string, InterviewState>();

export function startInterview(session: Session): Question {
  interviewState.set(session.id, { branchAccepted: false, tailIndex: 0 });
  session.status = 'IN_PROGRESS';
  appendMessage(session, { role: 'AI', message: FIRST_QUESTION.text, question_id: FIRST_QUESTION.question_id });
  return FIRST_QUESTION;
}

export interface SubmitAnswerResult {
  next_question: Question | null;
  progress: number;
  priority: string;
  red_flag?: boolean;
  completed: boolean;
}

const TOTAL_STEPS = 7;

export async function submitAnswer(
  session: Session,
  questionId: string,
  answer: string,
  inputType: 'voice' | 'text' | 'touch',
): Promise<SubmitAnswerResult> {
  appendMessage(session, {
    role: 'PATIENT',
    message: answer,
    question_id: questionId,
    metadata: { input_type: inputType },
  });

  const state = interviewState.get(session.id) ?? { branchAccepted: false, tailIndex: 0 };
  interviewState.set(session.id, state);

  // Extract structured clinical data
  extractData(session, questionId, answer);

  // Red-flag check on every answer
  const redFlag = applyRedFlagToSession(session, answer);
  let progress = computeProgress(session);

  // When an LLM backend is configured, let it drive the next, context-relevant
  // question (or decide the intake is complete). On LLM failure we fall back
  // to the deterministic rule-based flow below.
  if (llmEnabled()) {
    const patientAnswers = session.conversation.filter((m) => m.role === 'PATIENT').length;
    const llm = await generateNextQuestion(session);
    if (!llm.fallback) {
      if (llm.done && patientAnswers >= 3) {
        session.status = 'SUMMARY_READY';
        markProgress(session, 100);
        return {
          next_question: null,
          progress: 100,
          priority: session.priority,
          red_flag: redFlag.detected,
          completed: true,
        };
      }
      if (llm.question) {
        appendMessage(session, { role: 'AI', message: llm.question.text, question_id: llm.question.question_id });
        session.status = redFlag.detected ? 'RED_FLAG_DETECTED' : 'IN_PROGRESS';
        return {
          next_question: llm.question,
          progress,
          priority: session.priority,
          red_flag: redFlag.detected,
          completed: false,
        };
      }
    }
  }

  // Choose next question
  let next: Branch | Question | null = null;

  if (questionId === 'chief_complaint') {
    const branch = selectBranch(answer);
    state.branchAccepted = true;
    next = branch[0] ?? null;
  } else if (state.branchAccepted) {
    const branchIdx = branchIndexFor(session.clinical_data.chief_complaint);
    const branch = branchForIndex(branchIdx);
    const branchPos = [
      'pain_onset',
      'pain_severity',
      'pain_character',
      'associated_symptoms',
    ];
    const pos = branchPos.indexOf(questionId);
    if (pos >= 0 && pos + 1 < branch.length) {
      next = branch[pos + 1];
    } else if (pos >= 0) {
      // branch exhausted -> move to tail
      state.branchAccepted = false;
      next = TAIL_QUESTIONS[0] ?? null;
    }
  }

  if (!next && !state.branchAccepted) {
    if (state.tailIndex < TAIL_QUESTIONS.length) {
      next = TAIL_QUESTIONS[state.tailIndex];
      state.tailIndex++;
    } else {
      // Interview complete
      session.status = 'SUMMARY_READY';
      markProgress(session, 100);
      return {
        next_question: null,
        progress: 100,
        priority: session.priority,
        red_flag: redFlag.detected,
        completed: true,
      };
    }
  }

  if (next) {
    appendMessage(session, { role: 'AI', message: next.text, question_id: next.question_id });
    session.status = redFlag.detected ? 'RED_FLAG_DETECTED' : 'IN_PROGRESS';
  }

  return {
    next_question: next as Question | null,
    progress,
    priority: session.priority,
    red_flag: redFlag.detected,
    completed: false,
  };
}

function selectBranch(answer: string): Branch[] {
  const lower = answer.toLowerCase();
  for (const entry of CHIEF_COMPLAINT_BRANCHES) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return entry.branch;
    }
  }
  return GENERIC_BRANCH;
}

function branchForIndex(branchIdx: number): Branch[] {
  const branches = CHIEF_COMPLAINT_BRANCHES.map((b) => b.branch);
  return branches[branchIdx] ?? GENERIC_BRANCH;
}

function branchIndexFor(chiefComplaint?: string): number {
  const lower = (chiefComplaint ?? '').toLowerCase();
  for (let i = 0; i < CHIEF_COMPLAINT_BRANCHES.length; i++) {
    if (CHIEF_COMPLAINT_BRANCHES[i].keywords.some((k) => lower.includes(k))) {
      return i;
    }
  }
  return -1;
}

function extractData(session: Session, questionId: string, answer: string): void {
  switch (questionId) {
    case 'chief_complaint':
      session.clinical_data.chief_complaint = answer;
      break;
    case 'pain_onset':
      session.clinical_data.onset = answer;
      session.clinical_data.duration = answer;
      break;
    case 'pain_severity': {
      const sev = parseSeverity(answer);
      if (sev !== undefined) session.clinical_data.severity = sev;
      break;
    }
    case 'pain_character':
      session.clinical_data.character = answer;
      break;
    case 'associated_symptoms':
      session.clinical_data.associated_symptoms = answer
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      break;
    default:
      break;
  }
}

function parseSeverity(answer: string): number | undefined {
  const match = answer.match(/\d+/);
  if (!match) return undefined;
  const num = Number(match[0]);
  return num >= 0 && num <= 10 ? num : undefined;
}

function computeProgress(session: Session): number {
  const answered = session.conversation.filter((m) => m.role === 'PATIENT').length;
  const raw = Math.min(95, Math.round((answered / TOTAL_STEPS) * 100));
  markProgress(session, raw);
  return raw;
}

function markProgress(session: Session, progress: number): void {
  logger.info(`Interview progress ${progress}% for session`, { session_id: session.id });
}