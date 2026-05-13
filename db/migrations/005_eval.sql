CREATE TABLE eval_runs (
  eval_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eval_name TEXT NOT NULL,
  target_workflow TEXT,
  target_version TEXT,
  dataset_id TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_score NUMERIC(5, 4),
  total_cost_usd NUMERIC(10, 4),
  metadata JSONB
);

CREATE TABLE eval_outcomes (
  outcome_id BIGSERIAL PRIMARY KEY,
  eval_run_id UUID NOT NULL REFERENCES eval_runs(eval_run_id) ON DELETE CASCADE,
  row_id TEXT NOT NULL,
  scorer TEXT NOT NULL,
  score NUMERIC(5, 4),
  passed BOOLEAN,
  payload JSONB
);

CREATE INDEX idx_eval_outcomes_run ON eval_outcomes(eval_run_id);
