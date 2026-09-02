import { db, generateId } from '../db/database';
import { logger } from '../core/logger';
import { config } from '../core/config';

export interface FhirPushResult {
  status: 'success' | 'failed';
  destination: string;
  resource_type: string;
  mock: boolean;
}

/**
 * FHIR / ABDM integration abstraction.
 *
 * During the hackathon a MockFHIRService is used - it simulates the push
 * into HIS/ABHA. In production this would be swapped for a real
 * ABDMFHIRService that talks to the ABDM gateway APIs.
 */
export class FHIRService {
  private readonly mock: boolean;

  constructor() {
    this.mock = !config.fhirBaseUrl || config.appEnv !== 'production';
  }

  /** Whether FHIR pushes are simulated or hitting a real ABDM/HIS endpoint. */
  get mode(): 'live' | 'simulated' {
    return this.mock ? 'simulated' : 'live';
  }

  async pushPatient(sessionId: string): Promise<FhirPushResult> {
    return this.record('HIS', 'Patient', sessionId);
  }

  async pushObservation(sessionId: string): Promise<FhirPushResult> {
    return this.record('HIS', 'Observation', sessionId);
  }

  async pushDocument(sessionId: string): Promise<FhirPushResult> {
    return this.record('HIS', 'DocumentReference', sessionId);
  }

  async pushEncounter(sessionId: string): Promise<FhirPushResult> {
    return this.record('HIS', 'Encounter', sessionId);
  }

  /** Full demo push: summary + ABHA record + HIS notification. */
  async pushClinicalDocument(sessionId: string): Promise<FhirPushResult> {
    const result = await this.record('HIS', 'ClinicalDocument', sessionId);
    await this.record('ABHA', 'ClinicalRecord', sessionId);
    return result;
  }

  private async record(destination: string, resourceType: string, sessionId: string): Promise<FhirPushResult> {
    if (this.mock) {
      db.integrationEvents.push({
        id: generateId(),
        session_id: sessionId,
        destination,
        resource_type: resourceType,
        mock: true,
        status: 'SUCCESS',
        created_at: new Date().toISOString(),
      });
      logger.info(`Mock FHIR push to ${destination}`, { resource_type: resourceType });
      return { status: 'success', destination, resource_type: resourceType, mock: true };
    }

    // Real integration point (not implemented for MVP)
    logger.warn(`Real FHIR push requested but not configured for ${destination}`);
    return { status: 'failed', destination, resource_type: resourceType, mock: false };
  }
}

export const fhirService = new FHIRService();