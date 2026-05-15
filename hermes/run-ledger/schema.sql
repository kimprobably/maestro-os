-- Durable Fabro run ledger for the Maestro Hermes operator.
-- SQLite-compatible. No vector storage.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS fabro_runs (
  run_id TEXT PRIMARY KEY,
  workflow_file TEXT,
  app_inputs_json TEXT NOT NULL DEFAULT '{}',
  current_status TEXT NOT NULL,
  current_node TEXT,
  next_node_id TEXT,
  failure_class TEXT CHECK (
    failure_class IS NULL OR failure_class IN (
      'transient_infra',
      'deterministic',
      'control_plane',
      'quality_gate',
      'approval_blocked',
      'unknown'
    )
  ),
  latest_git_sha TEXT,
  run_branch TEXT,
  sandbox_name TEXT,
  sandbox_id TEXT,
  last_event_cursor INTEGER NOT NULL DEFAULT 0,
  last_event_id TEXT,
  known_failures_json TEXT NOT NULL DEFAULT '[]',
  decisions_taken_json TEXT NOT NULL DEFAULT '[]',
  open_quality_risks_json TEXT NOT NULL DEFAULT '[]',
  next_action TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS fabro_run_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES fabro_runs(run_id) ON DELETE CASCADE,
  cursor INTEGER,
  event_id TEXT,
  event_type TEXT NOT NULL,
  event_created_at TEXT,
  node_id TEXT,
  stage_id TEXT,
  summary TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- Every event must be identifiable for replay-safety: either by stable
  -- event_id from Fabro, or by cursor when the upstream omits one. Without
  -- this, polling retries can write multiple NULL/NULL duplicate rows.
  CHECK (event_id IS NOT NULL OR cursor IS NOT NULL)
);

-- Partial unique indexes so retries and resumes are idempotent for both
-- identification modes. SQLite allows multiple NULLs in a plain UNIQUE
-- constraint, so we cannot rely on UNIQUE(run_id, event_id) alone — it
-- treats every NULL event_id as distinct and lets cursor-only events
-- duplicate freely. Partial indexes filter to the non-null subset so
-- replayed events conflict and writers can use ON CONFLICT DO NOTHING
-- (or DO UPDATE) to upsert safely.
CREATE UNIQUE INDEX IF NOT EXISTS uq_fabro_run_events_event_id
  ON fabro_run_events(run_id, event_id)
  WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_fabro_run_events_cursor
  ON fabro_run_events(run_id, cursor)
  WHERE cursor IS NOT NULL;

CREATE TABLE IF NOT EXISTS fabro_run_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES fabro_runs(run_id) ON DELETE CASCADE,
  decision_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor TEXT NOT NULL DEFAULT 'hermes',
  decision_type TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  action_taken TEXT NOT NULL,
  result TEXT,
  residual_risk TEXT
);

CREATE TABLE IF NOT EXISTS fabro_quality_gates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES fabro_runs(run_id) ON DELETE CASCADE,
  gate_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'deferred', 'unknown')),
  evidence_uri TEXT,
  checked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_fabro_runs_status ON fabro_runs(current_status);
CREATE INDEX IF NOT EXISTS idx_fabro_run_events_run_cursor ON fabro_run_events(run_id, cursor);
CREATE INDEX IF NOT EXISTS idx_fabro_run_decisions_run ON fabro_run_decisions(run_id, decision_at);
CREATE INDEX IF NOT EXISTS idx_fabro_quality_gates_run ON fabro_quality_gates(run_id, gate_name);
