/**
 * Submit route.
 * Accept goal text, create run, trigger workflow.
 * Constraint: under 30 lines, no business logic.
 */

import { Router } from 'express';
import { z } from 'zod';
import { createRun } from '../state/run-state.js';
import { executeWorkflow } from '../workflow/executor.js';

const router = Router();

const SubmitSchema = z.object({
  goal: z.string().min(3).max(5000),
});

// SEC-003 fix: Track active runs to prevent DoS
const activeRuns = new Map<string, boolean>();
const MAX_CONCURRENT_RUNS = 5;

router.post('/submit', async (req, res, next) => {
  try {
    const parsed = SubmitSchema.parse(req.body);

    // SEC-003 fix: Reject if too many active runs
    if (activeRuns.size >= MAX_CONCURRENT_RUNS) {
      res.status(429).json({ ok: false, error: 'Too many active workflows. Try again later.' });
      return;
    }

    const runId = createRun(parsed.goal);
    activeRuns.set(runId, true);

    // Trigger workflow in background
    executeWorkflow(runId, parsed.goal)
      .catch((error) => {
        console.error(`Workflow failed for run ${runId}:`, error);
      })
      .finally(() => {
        activeRuns.delete(runId);
      });

    res.json({ ok: true, data: { runId } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.errors[0].message });
    } else {
      next(error);
    }
  }
});

export default router;
