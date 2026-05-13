CREATE TABLE cli_invocations (
  invocation_id BIGSERIAL PRIMARY KEY,
  run_id UUID REFERENCES runs(run_id) ON DELETE SET NULL,
  ts TIMESTAMPTZ DEFAULT now(),
  command TEXT NOT NULL,
  args JSONB,
  exit_code INT,
  duration_ms INT,
  cost_usd NUMERIC(10, 4) DEFAULT 0
);

CREATE INDEX idx_cli_invocations_run ON cli_invocations(run_id, ts);
