/**
 * Retry route.
 * Retry a failed workflow stage.
 * Constraint: under 30 lines, no business logic.
 */

import { Router } from 'express';
import { z } from 'zod';
import { getRunStatus, updateStageStatus } from '../state/run-state.js';
import { retryStage } from '../workflow/executor.js';

const router = Router();

// SEC-005 fix: Validate ULID format
const RunIdSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Invalid run ID format');

const RetrySchema = z.object({
  editedGoal: z.string().optional(),
});

router.post('/retry/:runId/:stageId', async (req, res, next) => {
  try {
    const runId = RunIdSchema.parse(req.params.runId);
    const { stageId } = req.params;
    RetrySchema.parse(req.body);

    const state = getRunStatus(runId);
    if (state == null) {
      res.status(404).json({ ok: false, error: 'Run not found' });
      return;
    }

    const stage = state.stages.find((s) => s.stageId === stageId);
    if (stage == null) {
      res.status(404).json({ ok: false, error: 'Stage not found' });
      return;
    }

    if (stage.retryCount >= 3) {
      res.status(400).json({ ok: false, error: 'Retry limit exceeded' });
      return;
    }

    updateStageStatus(runId, stageId, {
      status: 'pending',
      retryCount: stage.retryCount + 1,
      error: null,
    });

    // Retry stage
    retryStage(runId, stageId).catch((error) => {
      console.error(`Stage retry failed for run ${runId}, stage ${stageId}:`, error);
    });

    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: error.errors[0].message });
    } else {
      next(error);
    }
  }
});

export default router;
