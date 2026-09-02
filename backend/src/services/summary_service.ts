import type { ClinicalSummary, Session, MedicalDocument } from '../types/index';
import { logger } from '../core/logger';

/**
 * Clinical Summary Generator.
 * Fuses conversation + structured clinical data + OCR documents into the
 * standard structure: CC -> HPI -> PMH -> Drug/Allergy -> FH -> PH -> ROS.
 *
 * The output is always treated as an AI-GENERATED DRAFT for the doctor to
 * review and edit - never an autonomous diagnosis.
 */

export function generateSummary(session: Session): ClinicalSummary {
  const data = session.clinical_data;
  const docs: MedicalDocument[] = session.documents;

  const medications = collectMedications(docs);
  const pastMedicalHistory = collectPastMedicalHistory(docs);

  const summary: ClinicalSummary = {
    chief_complaint: {
      text: data.chief_complaint
        ? `${data.chief_complaint}${data.duration ? ` for ${data.duration}` : ''}`
        : 'Chief complaint not specified',
    },
    hpi: {
      onset: data.onset,
      severity: data.severity,
      character: data.character,
      location: data.location,
      duration: data.duration,
      associated_symptoms: data.associated_symptoms,
    },
    past_medical_history: pastMedicalHistory,
    medications,
    allergies: collectAllergies(docs),
    family_history: [],
    personal_history: {},
    review_of_systems: {},
  };

  logger.info('Summary generated for session', { session_id: session.id });
  return summary;
}

function collectMedications(docs: MedicalDocument[]) {
  const seen = new Set<string>();
  const result: ClinicalSummary['medications'] = [];
  for (const doc of docs) {
    for (const med of doc.medicines) {
      if (!seen.has(med.name.toLowerCase())) {
        seen.add(med.name.toLowerCase());
        result.push(med);
      }
    }
  }
  return result;
}

function collectAllergies(docs: MedicalDocument[]) {
  // In a real pipeline, allergies would come from the conversation/OCR too.
  // For the demo, we keep it simple but structured.
  return [];
}

function collectPastMedicalHistory(docs: MedicalDocument[]) {
  const result: string[] = [];
  for (const doc of docs) {
    for (const diagnosis of doc.diagnoses) {
      if (!result.includes(diagnosis)) {
        result.push(diagnosis);
      }
    }
  }
  return result;
}

export function emptySummary(): ClinicalSummary {
  return {
    chief_complaint: { text: '' },
    hpi: {},
    past_medical_history: [],
    medications: [],
    allergies: [],
    family_history: [],
    personal_history: {},
    review_of_systems: {},
  };
}