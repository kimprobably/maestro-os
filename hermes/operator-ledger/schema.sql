-- General Maestro operator ledger.
-- SQLite-compatible. No vector storage.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ledger_subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  title TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(subject_type, subject_key)
);

CREATE TABLE IF NOT EXISTS ledger_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES ledger_subjects(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  external_id TEXT,
  summary TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (external_id IS NOT NULL OR summary IS NOT NULL OR payload_json != '{}')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_events_external_id
  ON ledger_events(subject_type, subject_key, source, external_id)
  WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS ledger_checkpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES ledger_subjects(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  summary TEXT NOT NULL,
  state_json TEXT NOT NULL DEFAULT '{}',
  source_event_id INTEGER REFERENCES ledger_events(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(subject_id)
);

CREATE TABLE IF NOT EXISTS ledger_cursors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES ledger_subjects(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  source TEXT NOT NULL,
  cursor_name TEXT NOT NULL,
  cursor_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(subject_id, source, cursor_name)
);

CREATE TABLE IF NOT EXISTS ledger_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES ledger_subjects(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  action_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'hermes',
  status TEXT NOT NULL DEFAULT 'observed'
    CHECK (status IN ('observed', 'queued', 'running', 'succeeded', 'failed', 'cancelled', 'blocked')),
  evidence_json TEXT NOT NULL DEFAULT '{}',
  result_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ledger_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_subject_id INTEGER NOT NULL REFERENCES ledger_subjects(id) ON DELETE CASCADE,
  from_type TEXT NOT NULL,
  from_key TEXT NOT NULL,
  to_subject_id INTEGER NOT NULL REFERENCES ledger_subjects(id) ON DELETE CASCADE,
  to_type TEXT NOT NULL,
  to_key TEXT NOT NULL,
  relationship TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(from_subject_id, to_subject_id, relationship)
);

CREATE INDEX IF NOT EXISTS idx_ledger_subjects_type_key ON ledger_subjects(subject_type, subject_key);
CREATE INDEX IF NOT EXISTS idx_ledger_events_subject_recorded ON ledger_events(subject_type, subject_key, recorded_at, id);
CREATE INDEX IF NOT EXISTS idx_ledger_events_source_external ON ledger_events(source, external_id);
CREATE INDEX IF NOT EXISTS idx_ledger_links_from ON ledger_links(from_type, from_key);
CREATE INDEX IF NOT EXISTS idx_ledger_links_to ON ledger_links(to_type, to_key);
