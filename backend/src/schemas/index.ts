import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  abha_id: z.string().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const createSessionSchema = z.object({
  patient_id: z.string().min(1),
  language: z.enum(['en', 'hi', 'or', 'bn']).default('en'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const consentSchema = z.object({
  consent_given: z.boolean(),
  purpose: z.string().min(1).default('Clinical history and hospital consultation'),
});

export type ConsentInput = z.infer<typeof consentSchema>;

export const interviewAnswerSchema = z.object({
  question_id: z.string().min(1),
  answer: z.string().min(1).max(2000),
  input_type: z.enum(['voice', 'text', 'touch']).default('text'),
});

export type InterviewAnswerInput = z.infer<typeof interviewAnswerSchema>;

export const editSummarySchema = z
  .object({
    chief_complaint: z.string().optional(),
    hpi: z
      .object({
        onset: z.string().optional(),
        severity: z.number().int().min(0).max(10).optional(),
        character: z.string().optional(),
        location: z.string().optional(),
        duration: z.string().optional(),
        associated_symptoms: z.array(z.string()).optional(),
      })
      .optional(),
    past_medical_history: z.array(z.string()).optional(),
    medications: z.array(z.object({ name: z.string(), dosage: z.string().optional() })).optional(),
    allergies: z.array(z.string()).optional(),
    family_history: z.array(z.string()).optional(),
    personal_history: z.record(z.string(), z.string()).optional(),
    review_of_systems: z.record(z.string(), z.string()).optional(),
  })
  .optional();

export type EditSummaryInput = z.infer<typeof editSummarySchema>;
