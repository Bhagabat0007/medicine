import { createApp } from './app';
import { config } from './core/config';
import { seedDemoData } from './seed';
import { startCleanupWorker } from './services/cleanup_service';
import { logger } from './core/logger';

const app = createApp();

// Seed demo patients/sessions and start the auto-purge worker
seedDemoData();
startCleanupWorker();

app.listen(config.port, () => {
  logger.info(`MediKiosk backend listening on http://localhost:${config.port}`, {
    env: config.appEnv,
  });
});