-- Add eval ledger fields and waiver tracking.

ALTER TABLE eval_runs
  ADD COLUMN IF NOT EXISTS fabro_run_id TEXT,
  ADD COLUMN IF NOT EXISTS workflow_slug TEXT,
  ADD COLUMN IF NOT EXISTS fabro_node TEXT,
  ADD COLUMN IF NOT EXISTS git_sha TEXT,
  ADD COLUMN IF NOT EXISTS runner TEXT,
  ADD COLUMN IF NOT EXISTS runner_status TEXT,
  ADD COLUMN IF NOT EXISTS fallback_status TEXT,
  ADD COLUMN IF NOT EXISTS waiver_status TEXT,
  ADD COLUMN IF NOT EXISTS gate_status TEXT,
  ADD COLUMN IF NOT EXISTS parent_eval_run_id UUID REFERENCES eval_runs(eval_run_id);

ALTER TABLE eval_outcomes
  ADD COLUMN IF NOT EXISTS eval_id TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS artifact_uris JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS failure_class TEXT;

CREATE TABLE IF NOT EXISTS eval_waivers (
  waiver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eval_id TEXT NOT NULL,
  fabro_run_id TEXT,
  reason TEXT NOT NULL,
  risk_statement TEXT NOT NULL,
  compensating_control TEXT NOT NULL,
  accepted_by TEXT NOT NULL,
  review_by TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eval_runs_fabro_run_id ON eval_runs(fabro_run_id);
CREATE INDEX IF NOT EXISTS idx_eval_runs_gate_status ON eval_runs(gate_status);
CREATE INDEX IF NOT EXISTS idx_eval_outcomes_eval_id ON eval_outcomes(eval_id);
