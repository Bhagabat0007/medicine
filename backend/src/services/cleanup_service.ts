import { db } from '../db/database';
import { logger } from '../core/logger';
import { config } from '../core/config';

/**
 * Data auto-purge worker.
 * DPDP-aware: once a session has been completed + pushed to HIS/ABHA,
 * temporary session data is scheduled for deletion. For the hackathon this
 * runs on a simple interval in-process; it schedules deletion after the
 * configured expiry window.
 */
let started = false;

export function startCleanupWorker(): void {
  if (started) return;
  started = true;

  const intervalMs = 60 * 1000; // check every minute

  const worker = () => {
    const now = Date.now();
    let purged = 0;

    for (const [sessionId, session] of db.sessions.entries()) {
      if (session.status === 'COMPLETED' || session.status === 'EXPIRED') {
        const expiresAt = new Date(session.expires_at).getTime();
        if (now > expiresAt + config.sessionExpiryMs) {
          db.sessions.delete(sessionId);
          purged++;
        }
      }
    }

    if (purged > 0) {
      logger.info(`Cleanup worker purged ${purged} expired session(s)`);
    }
  };

  // run once immediately, then on interval
  worker();
  setInterval(worker, intervalMs);
}