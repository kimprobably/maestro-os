/**
 * Run state management.
 * CRUD operations for workflow run state with atomic file writes.
 * Constraint: never imports from src/routes/ or src/workflow/executor.ts.
 */

import { writeFileSync, readFileSync, renameSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { ulid } from 'ulid';
import type {
  RunState,
  StageStatus,
  FailureEvent,
  HumanGate,
  ArtifactPath,
  Persona,
} from './schemas.js';
import { RunStateSchema } from './schemas.js';

// ─── Constants ─────

const RUNS_DIR = '.maestro/factory/runs';

// ─── Helpers ─────

function getRunDir(runId: string): string {
  return join(RUNS_DIR, runId);
}

function getStatusPath(runId: string): string {
  return join(getRunDir(runId), 'status.json');
}

function getBackupPath(runId: string): string {
  return join(getRunDir(runId), 'status.backup.json');
}

function atomicWrite(path: string, data: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${path}.tmp`;
  writeFileSync(tmpPath, data, 'utf8');
  renameSync(tmpPath, path);
}

function backup(runId: string): void {
  const statusPath = getStatusPath(runId);
  const backupPath = getBackupPath(runId);

  if (existsSync(statusPath)) {
    const data = readFileSync(statusPath, 'utf8');
    atomicWrite(backupPath, data);
  }
}

// ─── Read ─────

export function getRunStatus(runId: string): RunState | null {
  const path = getStatusPath(runId);

  if (!existsSync(path)) {
    return null;
  }

  try {
    const data = readFileSync(path, 'utf8');
    const json = JSON.parse(data);
    return RunStateSchema.parse(json);
  } catch (error) {
    console.error(`Failed to read run state for ${runId}:`, error);
    return null;
  }
}

export function listRuns(): RunState[] {
  if (!existsSync(RUNS_DIR)) {
    return [];
  }

  const runs: RunState[] = [];
  const entries = readdirSync(RUNS_DIR);

  for (const entry of entries) {
    const state = getRunStatus(entry);
    if (state != null) {
      runs.push(state);
    }
  }

  return runs;
}

// ─── Write ─────

export function createRun(goal: string): string {
  const runId = ulid();
  const now = new Date().toISOString();

  const initialState: RunState = {
    runId,
    goal,
    createdAt: now,
    updatedAt: now,
    status: 'pending',
    stages: [],
    artifacts: [],
    humanGates: [],
    runSummary: null,
  };

  const data = JSON.stringify(initialState, null, 2);
  atomicWrite(getStatusPath(runId), data);

  return runId;
}

export function updateStageStatus(
  runId: string,
  stageId: string,
  updates: Partial<StageStatus>
): void {
  const state = getRunStatus(runId);
  if (state == null) {
    throw new Error(`Run ${runId} not found`);
  }

  backup(runId);

  const stageIndex = state.stages.findIndex((s) => s.stageId === stageId);
  if (stageIndex === -1) {
    throw new Error(`Stage ${stageId} not found in run ${runId}`);
  }

  state.stages[stageIndex] = { ...state.stages[stageIndex], ...updates };
  state.updatedAt = new Date().toISOString();

  const data = JSON.stringify(state, null, 2);
  atomicWrite(getStatusPath(runId), data);
}

export function recordFailure(
  runId: string,
  stageId: string,
  failure: FailureEvent
): void {
  const state = getRunStatus(runId);
  if (state == null) {
    throw new Error(`Run ${runId} not found`);
  }

  backup(runId);

  const stageIndex = state.stages.findIndex((s) => s.stageId === stageId);
  if (stageIndex === -1) {
    throw new Error(`Stage ${stageId} not found in run ${runId}`);
  }

  state.stages[stageIndex].status = 'failed';
  state.stages[stageIndex].error = failure;
  state.status = 'failed';
  state.updatedAt = new Date().toISOString();

  const data = JSON.stringify(state, null, 2);
  atomicWrite(getStatusPath(runId), data);
}

export function recordGateStatus(
  runId: string,
  gateId: string,
  approved: boolean,
  reason?: string
): void {
  const state = getRunStatus(runId);
  if (state == null) {
    throw new Error(`Run ${runId} not found`);
  }

  backup(runId);

  const gateIndex = state.humanGates.findIndex((g) => g.gateId === gateId);
  if (gateIndex === -1) {
    throw new Error(`Gate ${gateId} not found in run ${runId}`);
  }

  state.humanGates[gateIndex].status = approved ? 'approved' : 'rejected';
  state.humanGates[gateIndex].approvedAt = new Date().toISOString();
  state.humanGates[gateIndex].approvedBy = 'tim';
  state.humanGates[gateIndex].rejectionReason = approved ? null : reason ?? null;
  state.updatedAt = new Date().toISOString();

  const data = JSON.stringify(state, null, 2);
  atomicWrite(getStatusPath(runId), data);
}

export function addStage(
  runId: string,
  stageId: string,
  stageName: string,
  persona: Persona
): void {
  const state = getRunStatus(runId);
  if (state == null) {
    throw new Error(`Run ${runId} not found`);
  }

  backup(runId);

  const stage: StageStatus = {
    stageId,
    stageName,
    persona,
    status: 'pending',
    startedAt: null,
    completedAt: null,
    durationSeconds: null,
    output: null,
    error: null,
    validatorResults: [],
    retryCount: 0,
  };

  state.stages.push(stage);
  state.updatedAt = new Date().toISOString();

  const data = JSON.stringify(state, null, 2);
  atomicWrite(getStatusPath(runId), data);
}

export function addGate(runId: string, gate: HumanGate): void {
  const state = getRunStatus(runId);
  if (state == null) {
    throw new Error(`Run ${runId} not found`);
  }

  backup(runId);

  state.humanGates.push(gate);
  state.updatedAt = new Date().toISOString();

  const data = JSON.stringify(state, null, 2);
  atomicWrite(getStatusPath(runId), data);
}

export function addArtifact(runId: string, artifact: ArtifactPath): void {
  const state = getRunStatus(runId);
  if (state == null) {
    throw new Error(`Run ${runId} not found`);
  }

  backup(runId);

  state.artifacts.push(artifact);
  state.updatedAt = new Date().toISOString();

  const data = JSON.stringify(state, null, 2);
  atomicWrite(getStatusPath(runId), data);
}

export function updateRunStatus(
  runId: string,
  status: RunState['status']
): void {
  const state = getRunStatus(runId);
  if (state == null) {
    throw new Error(`Run ${runId} not found`);
  }

  backup(runId);

  state.status = status;
  state.updatedAt = new Date().toISOString();

  const data = JSON.stringify(state, null, 2);
  atomicWrite(getStatusPath(runId), data);
}
