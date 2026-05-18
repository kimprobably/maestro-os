/**
 * Persona message formatting.
 * Format failure messages with persona context.
 * Constraint: never imports Express types or workflow executor.
 */

import type { Persona, FailureEvent } from '../state/schemas.js';

export function formatFailureMessage(failure: FailureEvent): string {
  const icon = failure.persona === 'maestro' ? '🎭' : '🔨';
  return `${icon} ${failure.persona}: ${failure.cause}. ${failure.recommendedAction}`;
}

export function getPersonaForStage(stageId: string): Persona {
  const maestroStages = ['load_context', 'review_spec', 'final_review', 'emit_summary'];
  return maestroStages.includes(stageId) ? 'maestro' : 'smith';
}
