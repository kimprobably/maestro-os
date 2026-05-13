CREATE TABLE runs (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('queued', 'running', 'blocked', 'completed', 'failed', 'cancelled')
  ),
  persona TEXT,
  trigger_source TEXT NOT NULL,
  trigger_payload JSONB,
  slack_channel TEXT,
  slack_thread_ts TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_tokens_in BIGINT DEFAULT 0,
  total_tokens_out BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(10, 4) DEFAULT 0,
  error_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_runs_status ON runs(status, started_at DESC);
CREATE INDEX idx_runs_workflow ON runs(workflow, started_at DESC);
CREATE INDEX idx_runs_slack_thread ON runs(slack_thread_ts)
  WHERE slack_thread_ts IS NOT NULL;

CREATE TABLE run_events (
  event_id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ DEFAULT now(),
  event_type TEXT NOT NULL,
  stage_name TEXT,
  payload JSONB NOT NULL
);

CREATE INDEX idx_run_events_run ON run_events(run_id, ts);

CREATE TABLE run_gates (
  gate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
  gate_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'approved', 'rejected', 'edited', 'cancelled')
  ),
  surface TEXT,
  surfaced_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  decision_payload JSONB,
  slack_message_ts TEXT,
  UNIQUE (run_id, gate_name)
);
