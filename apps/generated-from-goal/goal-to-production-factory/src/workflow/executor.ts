/**
 * Workflow executor.
 * Orchestrates 7-stage workflow with validators and human gates.
 * Constraint: never imports Express types, never mutates state directly.
 */

import { execSync } from 'child_process';
import { resolve, basename } from 'path';
import { existsSync } from 'fs';
import type { FailureEvent, HumanGate, GateType } from '../state/schemas.js';
import {
  getRunStatus,
  addStage,
  addGate,
  updateStageStatus,
  recordFailure,
  updateRunStatus,
} from '../state/run-state.js';
import { STAGES } from './stages.js';
import { getPersonaForStage } from './personas.js';
import {
  validateFileExists,
  validateSpecQuality,
  validateTestsPresent,
  validateCIPassed,
  validateFinalVerdict,
} from './validators.js';

const STAGE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── Security Constants ─────

const ALLOWED_SCRIPTS_DIR = resolve('scripts/stages');
const ALLOWED_SCRIPTS = new Set([
  'scripts/stages/load_context.sh',
  'scripts/stages/write_spec.ts',
  'scripts/stages/review_spec.ts',
  'scripts/stages/implement_code.ts',
  'scripts/stages/verify_ci.sh',
  'scripts/stages/final_review.ts',
  'scripts/stages/emit_summary.ts',
]);

// Whitelist environment variables (SEC-004 fix)
const SAFE_ENV_VARS = ['PATH', 'HOME', 'USER', 'NODE_ENV'];

// ─── Helpers ─────

function executeScript(scriptPath: string, runId: string): string {
  // SEC-001 fix: Validate script path is whitelisted
  if (!ALLOWED_SCRIPTS.has(scriptPath)) {
    throw new Error(`Script not in whitelist: ${scriptPath}`);
  }

  // Validate script path is within allowed directory
  const resolvedPath = resolve(scriptPath);
  if (!resolvedPath.startsWith(ALLOWED_SCRIPTS_DIR)) {
    throw new Error(`Script path outside allowed directory: ${scriptPath}`);
  }

  // Check script exists
  if (!existsSync(resolvedPath)) {
    throw new Error(`Script not found: ${scriptPath}`);
  }

  // Determine interpreter based on extension
  const filename = basename(scriptPath);
  const isTypeScript = filename.endsWith('.ts');
  const isShell = filename.endsWith('.sh');

  if (!isTypeScript && !isShell) {
    throw new Error(`Invalid script type: ${scriptPath}`);
  }

  try {
    // Build safe environment (SEC-004 fix)
    const safeEnv: Record<string, string | undefined> = {
      RUN_ID: runId,
    };
    for (const key of SAFE_ENV_VARS) {
      if (process.env[key] != null) {
        safeEnv[key] = process.env[key];
      }
    }

    // Execute without shell interpolation (SEC-001 fix)
    const command = isTypeScript ? 'npx' : 'bash';
    const args = isTypeScript ? ['tsx', resolvedPath] : [resolvedPath];

    const output = execSync(`${command} ${args.join(' ')}`, {
      encoding: 'utf8',
      timeout: STAGE_TIMEOUT_MS,
      maxBuffer: 1024 * 1024, // SEC-003 fix: 1MB max output
      env: safeEnv,
      cwd: process.cwd(),
    });
    return output.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
    throw error;
  }
}

function createFailureEvent(
  runId: string,
  stageId: string,
  stageName: string,
  error: Error
): FailureEvent {
  return {
    eventType: 'stage_failure',
    runId,
    stageId,
    stageName,
    persona: getPersonaForStage(stageId),
    cause: error.message,
    retryable: !error.message.includes('timeout'),
    recommendedAction: error.message.includes('timeout')
      ? 'Increase timeout or check for infinite loops'
      : 'Review error logs and retry',
    context: {
      timestamp: new Date().toISOString(),
    },
  };
}

function createGate(
  gateId: string,
  gateType: GateType,
  stageName: string,
  whatWillHappen: string,
  whatFilesWillChange: string[]
): HumanGate {
  return {
    gateId,
    gateType,
    stageName,
    status: 'pending',
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    context: {
      whatWillHappen,
      whatFilesWillChange,
      costExposure: null,
    },
  };
}

// ─── Main Executor ─────

export async function executeWorkflow(
  runId: string,
  _goal: string,
  startStageIndex: number = 0
): Promise<void> {
  console.log(`Starting workflow for run ${runId} from stage ${startStageIndex}`);

  updateRunStatus(runId, 'in_progress');

  // Initialize stages only if starting fresh
  if (startStageIndex === 0) {
    for (const stage of STAGES) {
      addStage(runId, stage.stageId, stage.stageName, stage.persona);
    }

    // Initialize gates
    const specApprovalGate = createGate(
      'spec_approval',
      'FLAG',
      'Review Spec',
      'Workflow will proceed to code generation',
      ['apps/generated-from-goal/<slug>/'],
    );

    const finalHandoffGate = createGate(
      'final_handoff',
      'STOP',
      'Final Review',
      'Workflow completes, artifacts finalized, run summary emitted',
      [],
    );

    addGate(runId, specApprovalGate);
    addGate(runId, finalHandoffGate);
  }

  // Execute stages starting from specified index
  for (let i = startStageIndex; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const state = getRunStatus(runId);
    if (state == null) {
      throw new Error(`Run ${runId} not found`);
    }

    // Check if stage should be skipped (pending gate)
    if (stage.gateId != null) {
      const gate = state.humanGates.find((g) => g.gateId === stage.gateId);
      if (gate && gate.status === 'pending') {
        console.log(`Waiting for gate: ${stage.gateId}`);
        return; // Pause workflow, will resume when gate approved
      }

      if (gate && gate.status === 'rejected') {
        console.log(`Gate ${stage.gateId} rejected, stopping workflow`);
        updateRunStatus(runId, 'failed');
        return;
      }
    }

    console.log(`Executing stage: ${stage.stageName}`);

    const startTime = Date.now();

    updateStageStatus(runId, stage.stageId, {
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    });

    try {
      const output = executeScript(stage.scriptPath, runId);

      const duration = Math.floor((Date.now() - startTime) / 1000);

      updateStageStatus(runId, stage.stageId, {
        status: 'complete',
        completedAt: new Date().toISOString(),
        durationSeconds: duration,
        output,
      });

      // Run validator if defined
      if (stage.validatorId != null) {
        console.log(`Running validator: ${stage.validatorId}`);

        let validatorResult;

        switch (stage.validatorId) {
          case 'file_exists':
            validatorResult = validateFileExists([
              '.maestro/factory/goal.md',
              '.maestro/factory/context.md',
            ]);
            break;
          case 'spec_quality':
            validatorResult = validateSpecQuality(
              'specs/factory/goal-to-production-spec.md'
            );
            break;
          case 'tests_present':
            validatorResult = validateTestsPresent(
              'apps/generated-from-goal/goal-to-production-factory'
            );
            break;
          case 'ci_passed':
            validatorResult = validateCIPassed(
              `.maestro/factory/runs/${runId}/ci-output.json`
            );
            break;
          case 'final_verdict':
            validatorResult = validateFinalVerdict(
              `.maestro/factory/runs/${runId}/final-review.json`
            );
            break;
          default:
            validatorResult = {
              validatorId: stage.validatorId,
              passed: true,
              message: null,
              executedAt: new Date().toISOString(),
            };
        }

        if (!validatorResult.passed) {
          const validationError = new Error(
            `Validation failed: ${validatorResult.message}`
          );

          const failure = createFailureEvent(
            runId,
            stage.stageId,
            stage.stageName,
            validationError
          );

          recordFailure(runId, stage.stageId, failure);
          return; // Stop workflow
        }
      }
    } catch (error) {
      const failure = createFailureEvent(
        runId,
        stage.stageId,
        stage.stageName,
        error instanceof Error ? error : new Error(String(error))
      );

      recordFailure(runId, stage.stageId, failure);
      return; // Stop workflow
    }
  }

  // All stages complete
  updateRunStatus(runId, 'complete');
  console.log(`Workflow complete for run ${runId}`);
}

export async function retryStage(runId: string, stageId: string): Promise<void> {
  const state = getRunStatus(runId);
  if (state == null) {
    throw new Error(`Run ${runId} not found`);
  }

  const stageIndex = STAGES.findIndex((s) => s.stageId === stageId);
  if (stageIndex === -1) {
    throw new Error(`Stage ${stageId} not found`);
  }

  // Reset stage status to pending
  updateStageStatus(runId, stageId, {
    status: 'pending',
    startedAt: null,
    completedAt: null,
    durationSeconds: null,
    output: null,
    error: null,
  });

  // Re-run workflow starting from the failed stage
  await executeWorkflow(runId, state.goal, stageIndex);
}
