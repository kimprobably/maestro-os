/**
 * Express server.
 * Main server setup with routes, middleware, and static file serving.
 * Constraint: never imports business logic from workflow executor directly.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import submitRouter from './routes/submit.js';
import statusRouter from './routes/status.js';
import artifactRouter from './routes/artifact.js';
import gateRouter from './routes/gate.js';
import retryRouter from './routes/retry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT ?? 3000;

// ─── Middleware ─────

// SEC-003 fix: Reduced from 10mb to 10kb
app.use(express.json({ limit: '10kb', strict: true }));
app.use(express.static(join(__dirname, '../public')));

// SEC-003 fix: Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes per IP
  message: { ok: false, error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/submit', apiLimiter);

// ─── Routes ─────

app.use('/api', submitRouter);
app.use('/api', statusRouter);
app.use('/api', artifactRouter);
app.use('/api', gateRouter);
app.use('/api', retryRouter);

// ─── Error Handler ─────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
    });
  }
);

// ─── Start Server ─────

app.listen(PORT, () => {
  console.log(`Goal-to-Production Factory running on http://localhost:${PORT}`);
});
