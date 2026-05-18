/**
 * State schemas.
 * Zod schemas and TypeScript types for workflow run state.
 * Constraint: never imports from src/routes/ or src/workflow/executor.ts.
 */

import { z } from 'zod';

// ─── Persona ─────

export const PersonaSchema = z.enum(['maestro', 'smith']);
export type Persona = z.infer<typeof PersonaSchema>;

// ─── Stage Status ─────

export const StageStatusValueSchema = z.enum([
  'pending',
  'in_progress',
  'complete',
  'failed',
]);
export type StageStatusValue = z.infer<typeof StageStatusValueSchema>;

export const ValidatorResultSchema = z.object({
  validatorId: z.string(),
  passed: z.boolean(),
  message: z.string().nullable(),
  executedAt: z.string(),
});
export type ValidatorResult = z.infer<typeof ValidatorResultSchema>;

export const FailureEventSchema = z.object({
  eventType: z.literal('stage_failure'),
  runId: z.string(),
  stageId: z.string(),
  stageName: z.string(),
  persona: PersonaSchema,
  cause: z.string(),
  retryable: z.boolean(),
  recommendedAction: z.string(),
  context: z.record(z.unknown()),
});
export type FailureEvent = z.infer<typeof FailureEventSchema>;

export const StageStatusSchema = z.object({
  stageId: z.string(),
  stageName: z.string(),
  persona: PersonaSchema,
  status: StageStatusValueSchema,
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  output: z.string().nullable(),
  error: FailureEventSchema.nullable(),
  validatorResults: z.array(ValidatorResultSchema),
  retryCount: z.number(),
});
export type StageStatus = z.infer<typeof StageStatusSchema>;

// ─── Human Gate ─────

export const GateTypeSchema = z.enum(['FLAG', 'STOP']);
export type GateType = z.infer<typeof GateTypeSchema>;

export const GateStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type GateStatus = z.infer<typeof GateStatusSchema>;

export const HumanGateSchema = z.object({
  gateId: z.string(),
  gateType: GateTypeSchema,
  stageName: z.string(),
  status: GateStatusSchema,
  approvedAt: z.string().nullable(),
  approvedBy: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  context: z.object({
    whatWillHappen: z.string(),
    whatFilesWillChange: z.array(z.string()),
    costExposure: z.string().nullable(),
  }),
});
export type HumanGate = z.infer<typeof HumanGateSchema>;

// ─── Artifact ─────

export const ArtifactTypeSchema = z.enum(['spec', 'code', 'review', 'ci_log']);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

export const ArtifactPathSchema = z.object({
  type: ArtifactTypeSchema,
  path: z.string(),
  createdAt: z.string(),
});
export type ArtifactPath = z.infer<typeof ArtifactPathSchema>;

// ─── Run Summary ─────

export const RunSummarySchema = z.object({
  runId: z.string(),
  goal: z.string(),
  status: z.enum(['complete', 'failed']),
  verdict: z.enum(['PASS', 'FAIL']).nullable(),
  startedAt: z.string(),
  completedAt: z.string(),
  totalDurationSeconds: z.number(),
  stages: z.array(
    z.object({
      stageId: z.string(),
      status: z.string(),
      durationSeconds: z.number().nullable(),
    })
  ),
  artifacts: z.object({
    spec: z.string().nullable(),
    code: z.string().nullable(),
    reviews: z.string().nullable(),
    ciOutput: z.string().nullable(),
  }),
  qualityGates: z.object({
    specReview: z.enum(['pass', 'fail']),
    codeReview: z.enum(['pass', 'fail']),
    ciVerification: z.enum(['pass', 'fail']),
    finalReview: z.enum(['pass', 'fail']),
  }),
});
export type RunSummary = z.infer<typeof RunSummarySchema>;

// ─── Run State ─────

export const RunStatusSchema = z.enum([
  'pending',
  'in_progress',
  'complete',
  'failed',
]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const RunStateSchema = z.object({
  runId: z.string(),
  goal: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: RunStatusSchema,
  stages: z.array(StageStatusSchema),
  artifacts: z.array(ArtifactPathSchema),
  humanGates: z.array(HumanGateSchema),
  runSummary: RunSummarySchema.nullable(),
});
export type RunState = z.infer<typeof RunStateSchema>;
