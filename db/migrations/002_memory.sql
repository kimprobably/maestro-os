CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE memory_events (
  event_id BIGSERIAL PRIMARY KEY,
  namespace TEXT NOT NULL,
  ts TIMESTAMPTZ DEFAULT now(),
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  embedding vector(1536)
);

CREATE INDEX idx_memory_events_ns ON memory_events(namespace, ts DESC);
CREATE INDEX idx_memory_events_embedding ON memory_events
  USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

CREATE TABLE memory_snapshots (
  snapshot_id BIGSERIAL PRIMARY KEY,
  namespace TEXT NOT NULL,
  version INT NOT NULL,
  ts TIMESTAMPTZ DEFAULT now(),
  body_md TEXT NOT NULL,
  source_event_ids BIGINT[] NOT NULL,
  UNIQUE (namespace, version)
);

CREATE TABLE memory_index (
  namespace TEXT PRIMARY KEY,
  current_snapshot_version INT NOT NULL,
  current_snapshot_ts TIMESTAMPTZ NOT NULL
);
