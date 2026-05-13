/**
 * Validator invocation.
 * Execute deterministic validators and return results.
 * Constraint: never imports Express types or workflow executor internals.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import type { ValidatorResult } from '../state/schemas.js';

export function validateFileExists(paths: string[]): ValidatorResult {
  const missing = paths.filter((p) => !existsSync(p));

  return {
    validatorId: 'file_exists',
    passed: missing.length === 0,
    message: missing.length > 0 ? `Missing files: ${missing.join(', ')}` : null,
    executedAt: new Date().toISOString(),
  };
}

export function validateSpecQuality(specPath: string): ValidatorResult {
  try {
    const output = execSync(
      `maestro verify spec-quality "${specPath}"`,
      { encoding: 'utf8', timeout: 30000 }
    );

    const result = JSON.parse(output);
    return {
      validatorId: 'spec_quality',
      passed: result.ok === true,
      message: result.ok ? null : JSON.stringify(result.data?.missing ?? []),
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      validatorId: 'spec_quality',
      passed: false,
      message: error instanceof Error ? error.message : 'Validation failed',
      executedAt: new Date().toISOString(),
    };
  }
}

export function validateTestsPresent(codePath: string): ValidatorResult {
  try {
    const output = execSync(
      `maestro verify tests-present "${codePath}"`,
      { encoding: 'utf8', timeout: 30000 }
    );

    const result = JSON.parse(output);
    return {
      validatorId: 'tests_present',
      passed: result.ok === true,
      message: result.ok ? null : 'No test files found',
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      validatorId: 'tests_present',
      passed: false,
      message: error instanceof Error ? error.message : 'Validation failed',
      executedAt: new Date().toISOString(),
    };
  }
}

export function validateCIPassed(ciOutputPath: string): ValidatorResult {
  try {
    if (!existsSync(ciOutputPath)) {
      return {
        validatorId: 'ci_passed',
        passed: false,
        message: 'CI output file not found',
        executedAt: new Date().toISOString(),
      };
    }

    const { readFileSync } = require('fs');
    const content = readFileSync(ciOutputPath, 'utf8');
    const result = JSON.parse(content);

    const allPassed = Object.values(result).every(
      (check: any) => check.status === 'pass'
    );

    return {
      validatorId: 'ci_passed',
      passed: allPassed,
      message: allPassed ? null : 'Some CI checks failed',
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      validatorId: 'ci_passed',
      passed: false,
      message: error instanceof Error ? error.message : 'Validation failed',
      executedAt: new Date().toISOString(),
    };
  }
}

export function validateFinalVerdict(reviewPath: string): ValidatorResult {
  try {
    if (!existsSync(reviewPath)) {
      return {
        validatorId: 'final_verdict',
        passed: false,
        message: 'Final review file not found',
        executedAt: new Date().toISOString(),
      };
    }

    const { readFileSync } = require('fs');
    const content = readFileSync(reviewPath, 'utf8');
    const result = JSON.parse(content);

    return {
      validatorId: 'final_verdict',
      passed: result.verdict === 'PASS',
      message: result.verdict === 'PASS' ? null : result.summary,
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      validatorId: 'final_verdict',
      passed: false,
      message: error instanceof Error ? error.message : 'Validation failed',
      executedAt: new Date().toISOString(),
    };
  }
}
