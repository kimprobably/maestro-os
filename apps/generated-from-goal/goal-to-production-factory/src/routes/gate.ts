/**
 * Gate route.
 * Approve or reject human gates.
 * Constraint: under 30 lines, no business logic.
 */

import { Router } from 'express';
import { z } from 'zod';
import { recordGateStatus, getRunStatus } from '../state/run-state.js';
import { executeWorkflow } from '../workflow/executor.js';

const router = Router();

// SEC-005 fix: Validate ULID format
const RunIdSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Invalid run ID format');

const GateApprovalSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

router.post('/approve-gate/:runId/:gateId', async (req, res, next) => {
  try {
    const runId = RunIdSchema.parse(req.params.runId);
    const { gateId } = req.params;
    const parsed = GateApprovalSchema.parse(req.body);

    recordGateStatus(runId, gateId, parsed.approved, parsed.rejectionReason);

    // Resume workflow if approved
    if (parsed.approved) {
      const state = getRunStatus(runId);
      if (state != null) {
        executeWorkflow(runId, state.goal).catch((error) => {
          console.error(`Workflow resume failed for run ${runId}:`, error);
        });
      }
    }

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
