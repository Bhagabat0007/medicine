import fs from 'node:fs';
import path from 'node:path';
import { config } from '../core/config';
import { logger } from '../core/logger';

/**
 * Lightweight JSON-file persistence layer.
 *
 * The hackathon's in-memory store is upgraded to survive server restarts by
 * serialising the full database to a JSON file on disk whenever data changes.
 * This is intentionally simple (no external DB dependency) but gives real
 * durability, and can be swapped for Postgres later without touching the routes.
 */

export interface PersistedData {
  patients: Record<string, unknown>;
  sessions: Record<string, unknown>;
  consents: Record<string, unknown>;
  integrationEvents: unknown[];
}

function resolveDataPath(): string {
  return path.resolve(process.cwd(), config.dataDir, 'medikiosk-db.json');
}

export function loadFromDisk(): PersistedData | null {
  const file = resolveDataPath();
  try {
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedData;
    logger.info('Loaded persisted database from disk', { file });
    return parsed;
  } catch (err) {
    logger.warn('Failed to load persisted database, starting fresh', {
      file,
      error: err instanceof Error ? err.message : 'unknown',
    });
    return null;
  }
}

/**
 * Write the current database to disk. Creates the data directory if needed.
 * Writes atomically (temp file + rename) to avoid corruption on crash.
 */
export function save(data: {
  patients: Map<string, unknown>;
  sessions: Map<string, unknown>;
  consents: Map<string, unknown>;
  integrationEvents: unknown[];
}): void {
  const file = resolveDataPath();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const json = JSON.stringify(serialise(data), null, 2);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, json, 'utf-8');
    fs.renameSync(tmp, file);
  } catch (err) {
    logger.warn('Failed to save database to disk', {
      file,
      error: err instanceof Error ? err.message : 'unknown',
    });
  }
}

/**
 * Serialise the database maps into plain objects for storage.
 */
export function serialise(data: {
  patients: Map<string, unknown>;
  sessions: Map<string, unknown>;
  consents: Map<string, unknown>;
  integrationEvents: unknown[];
}): PersistedData {
  return {
    patients: Object.fromEntries(data.patients),
    sessions: Object.fromEntries(data.sessions),
    consents: Object.fromEntries(data.consents),
    integrationEvents: data.integrationEvents,
  };
}

/**
 * Rehydrate plain persisted objects back into Maps.
 */
export function deserialise(data: PersistedData): {
  patients: Map<string, unknown>;
  sessions: Map<string, unknown>;
  consents: Map<string, unknown>;
  integrationEvents: unknown[];
} {
  return {
    patients: new Map(Object.entries(data.patients ?? {})),
    sessions: new Map(Object.entries(data.sessions ?? {})),
    consents: new Map(Object.entries(data.consents ?? {})),
    integrationEvents: data.integrationEvents ?? [],
  };
}
