/**
 * Stage definitions.
 * 7-stage workflow configuration with validators.
 * Constraint: never imports Express types.
 */

import type { Persona } from '../state/schemas.js';

export interface StageDefinition {
  stageId: string;
  stageName: string;
  persona: Persona;
  scriptPath: string;
  validatorId: string | null;
  gateId: string | null;
}

export const STAGES: StageDefinition[] = [
  {
    stageId: 'load_context',
    stageName: 'Load Context',
    persona: 'maestro',
    scriptPath: 'scripts/stages/load_context.sh',
    validatorId: 'file_exists',
    gateId: null,
  },
  {
    stageId: 'write_spec',
    stageName: 'Write Spec',
    persona: 'smith',
    scriptPath: 'scripts/stages/write_spec.ts',
    validatorId: 'spec_quality',
    gateId: null,
  },
  {
    stageId: 'review_spec',
    stageName: 'Review Spec',
    persona: 'maestro',
    scriptPath: 'scripts/stages/review_spec.ts',
    validatorId: 'findings_schema',
    gateId: 'spec_approval',
  },
  {
    stageId: 'implement_code',
    stageName: 'Implement Code',
    persona: 'smith',
    scriptPath: 'scripts/stages/implement_code.ts',
    validatorId: 'tests_present',
    gateId: null,
  },
  {
    stageId: 'verify_ci',
    stageName: 'Verify CI',
    persona: 'smith',
    scriptPath: 'scripts/stages/verify_ci.sh',
    validatorId: 'ci_passed',
    gateId: null,
  },
  {
    stageId: 'final_review',
    stageName: 'Final Review',
    persona: 'maestro',
    scriptPath: 'scripts/stages/final_review.ts',
    validatorId: 'final_verdict',
    gateId: 'final_handoff',
  },
  {
    stageId: 'emit_summary',
    stageName: 'Emit Run Summary',
    persona: 'maestro',
    scriptPath: 'scripts/stages/emit_summary.ts',
    validatorId: null,
    gateId: null,
  },
];
