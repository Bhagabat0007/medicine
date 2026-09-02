import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './core/config';
import apiRouter from './api/router';
import { errorMiddleware, notFoundHandler } from './api/middleware/error';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve the built frontend SPA directory (../frontend/dist relative to backend/src)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const hasFrontend = fs.existsSync(path.join(frontendDist, 'index.html'));

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '2mb' }));

  // Basic rate limiting for the kiosk endpoints
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        data: null,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
      },
    }),
  );

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: { status: 'ok', env: config.appEnv, timestamp: new Date().toISOString() },
      error: null,
    });
  });

  // API v1
  app.use('/api/v1', apiRouter);

  // Serve the built frontend SPA (single deployment) if it exists
  if (hasFrontend) {
    app.use(
      express.static(frontendDist, {
        index: false,
        maxAge: '1h',
        setHeaders(res, filePath) {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      }),
    );

    // SPA fallback: serve index.html for any non-API client-side route
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/health')) {
        res.sendFile(path.join(frontendDist, 'index.html'));
        return;
      }
      next();
    });
  }

  // 404 + error handling
  app.use(notFoundHandler);
  app.use(errorMiddleware);

  return app;
}