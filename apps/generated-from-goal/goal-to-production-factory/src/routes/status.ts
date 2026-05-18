/**
 * Status route.
 * Get workflow run status by ID.
 * Constraint: under 30 lines, no business logic.
 */

import { Router } from 'express';
import { z } from 'zod';
import { getRunStatus } from '../state/run-state.js';

const router = Router();

// SEC-005 fix: Validate ULID format
const RunIdSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Invalid run ID format');

router.get('/status/:runId', async (req, res, next) => {
  try {
    const runId = RunIdSchema.parse(req.params.runId);
    const state = getRunStatus(runId);

    if (state == null) {
      res.status(404).json({ ok: false, error: 'Run not found' });
      return;
    }

    res.json({ ok: true, data: state });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: 'Invalid run ID' });
    } else {
      next(error);
    }
  }
});

export default router;
