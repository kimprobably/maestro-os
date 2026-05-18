/**
 * Artifact route.
 * Serve artifacts (spec, code, reviews, CI logs) by run ID and type.
 * Constraint: under 30 lines, no business logic.
 */

import { Router } from 'express';
import { z } from 'zod';
import { resolve, normalize, extname } from 'path';
import { getRunStatus } from '../state/run-state.js';
import { readFileSync, existsSync, statSync } from 'fs';

const router = Router();

// SEC-005 fix: Validate ULID format
const RunIdSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Invalid run ID format');
const ArtifactTypeSchema = z.enum(['spec', 'code', 'review', 'ci_log']);
const ARTIFACTS_BASE_DIR = resolve('.maestro/factory');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = new Set(['.md', '.json', '.txt', '.log']);

router.get('/artifact/:runId/:type', async (req, res, next) => {
  try {
    const runId = RunIdSchema.parse(req.params.runId);
    const { type } = req.params;
    const artifactType = ArtifactTypeSchema.parse(type);

    const state = getRunStatus(runId);
    if (state == null) {
      res.status(404).json({ ok: false, error: 'Run not found' });
      return;
    }

    const artifact = state.artifacts.find((a) => a.type === artifactType);
    if (artifact == null) {
      res.status(404).json({ ok: false, error: 'Artifact not found' });
      return;
    }

    // SEC-002 fix: Validate path is within base directory
    const normalizedPath = normalize(artifact.path);
    const resolvedPath = resolve(normalizedPath);

    if (!resolvedPath.startsWith(ARTIFACTS_BASE_DIR)) {
      console.error('Path traversal attempt:', { runId, artifactType, path: artifact.path, resolvedPath });
      res.status(403).json({ ok: false, error: 'Access denied' });
      return;
    }

    if (!existsSync(resolvedPath)) {
      res.status(404).json({ ok: false, error: 'File not found' });
      return;
    }

    // Validate file extension
    const ext = extname(resolvedPath);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      res.status(403).json({ ok: false, error: 'Invalid file type' });
      return;
    }

    // Check file size
    const stats = statSync(resolvedPath);
    if (stats.size > MAX_FILE_SIZE) {
      res.status(413).json({ ok: false, error: 'File too large' });
      return;
    }

    const content = readFileSync(resolvedPath, 'utf8');

    if (artifactType === 'spec') {
      res.setHeader('Content-Type', 'text/markdown');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }

    res.send(content);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: 'Invalid artifact type' });
    } else {
      next(error);
    }
  }
});

export default router;
