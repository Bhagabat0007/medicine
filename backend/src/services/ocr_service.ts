import { db, generateId } from '../db/database';
import type { MedicalDocument } from '../types/index';

/**
 * OCR service for the hackathon.
 * Simulates reading a prescription/lab report image and returning
 * structured medical entities (medicines, diagnoses, dates).
 *
 * In production this would call Google Vision / Azure Document Intelligence
 * + a medical NER model. The route layer stays the same.
 */
export interface OcrResult {
  document_type: string;
  date?: string;
  medicines: { name: string; dosage?: string }[];
  diagnoses: string[];
  lab_values: string[];
}

const SAMPLE_RESULTS: OcrResult[] = [
  {
    document_type: 'prescription',
    date: '2026-08-12',
    medicines: [
      { name: 'Paracetamol', dosage: '500mg' },
      { name: 'Omeprazole', dosage: '20mg' },
    ],
    diagnoses: [],
    lab_values: [],
  },
  {
    document_type: 'lab_report',
    date: '2026-08-05',
    medicines: [],
    diagnoses: ['Elevated blood sugar'],
    lab_values: ['HbA1c: 7.2%', 'Fasting glucose: 140 mg/dL'],
  },
  {
    document_type: 'prescription',
    date: '2026-06-20',
    medicines: [
      { name: 'Amlodipine', dosage: '5mg' },
      { name: 'Aspirin', dosage: '75mg' },
    ],
    diagnoses: [],
    lab_values: [],
  },
];

export class OcrService {
  async process(filename: string, mimetype: string): Promise<MedicalDocument> {
    // Simulate OCR latency
    await new Promise((resolve) => setTimeout(resolve, 50));

    const sample = SAMPLE_RESULTS[Math.floor(Math.random() * SAMPLE_RESULTS.length)];

    return {
      id: generateId(),
      session_id: '',
      filename,
      document_type: sample.document_type,
      date: sample.date,
      medicines: sample.medicines,
      diagnoses: sample.diagnoses,
      lab_values: sample.lab_values,
      status: 'PROCESSED',
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Simulate OCR of an Indian identity document (ABHA / Aadhaar).
   * Returns a representative raw text block for downstream LLM extraction.
   * In production this would be Google Vision / Azure OCR on the uploaded image.
   */
  async identityOcr(_filename: string): Promise<{ raw_text: string; document_type: string }> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const maleNames = ['Rahul Sharma', 'Amit Kumar', 'Vikram Singh', 'Rohan Gupta'];
    const femaleNames = ['Anita Devi', 'Meena Kumari', 'Priya Reddy', 'Sunita Verma'];
    const isMale = Math.random() > 0.5;
    const names = isMale ? maleNames : femaleNames;
    const fullName = names[Math.floor(Math.random() * names.length)];
    const age = 18 + Math.floor(Math.random() * 60);

    return {
      document_type: 'identity',
      raw_text: [
        'Government of India',
        'Unique Identification Authority of India',
        `Name: ${fullName}`,
        `DOB: ${String(8 + Math.floor(Math.random() * 20)).padStart(2, '0')}/${String(
          1 + Math.floor(Math.random() * 12),
        ).padStart(2, '0')}/1990`,
        `Age/Year of Birth: ${age}`,
        `Gender: ${isMale ? 'M' : 'F'}`,
        'XXXX XXXX XXXX 1234',
        'Address: 24, MG Road, Bengaluru, Karnataka - 560001',
        'Verify below QR code validity.',
      ].join('\n'),
    };
  }
}

export const ocrService = new OcrService();