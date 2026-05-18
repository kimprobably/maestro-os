CREATE TABLE leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  domain TEXT,
  full_name TEXT,
  company TEXT,
  role TEXT,
  linkedin_url TEXT,
  enriched_at TIMESTAMPTZ,
  enrichment JSONB,
  icp_score INT,
  icp_reasoning TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE drafts (
  draft_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(lead_id) ON DELETE SET NULL,
  campaign_id TEXT,
  kind TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL,
  validation JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE validation_outcomes (
  outcome_id BIGSERIAL PRIMARY KEY,
  run_id UUID REFERENCES runs(run_id) ON DELETE CASCADE,
  stage_name TEXT,
  validator TEXT NOT NULL,
  subject_kind TEXT,
  subject_id TEXT,
  status TEXT NOT NULL,
  payload JSONB,
  ts TIMESTAMPTZ DEFAULT now()
);
