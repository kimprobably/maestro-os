-- Private UX Studio design corpus.
-- SQLite-compatible. Stores source metadata, private asset metadata, derived
-- observations, and generated reference packs.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS design_sources (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  app_name TEXT,
  app_store_id TEXT,
  bundle_id TEXT,
  source_policy TEXT NOT NULL,
  raw_asset_allowed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS design_assets (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES design_sources(id),
  asset_type TEXT NOT NULL,
  screen_type TEXT NOT NULL,
  flow_name TEXT,
  flow_step INTEGER,
  storage_provider TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  perceptual_hash TEXT,
  width INTEGER,
  height INTEGER,
  captured_at TEXT NOT NULL,
  private_only INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS design_observations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES design_sources(id),
  asset_id TEXT REFERENCES design_assets(id),
  app_domain TEXT NOT NULL,
  screen_type TEXT NOT NULL,
  observation_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  what_to_adapt TEXT NOT NULL,
  what_not_to_copy TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS design_reference_packs (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  app_domain TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  query_json TEXT NOT NULL,
  observation_ids_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_design_assets_source ON design_assets(source_id);
CREATE INDEX IF NOT EXISTS idx_design_assets_screen ON design_assets(screen_type);
CREATE INDEX IF NOT EXISTS idx_design_observations_lookup ON design_observations(app_domain, screen_type, observation_type);
CREATE INDEX IF NOT EXISTS idx_design_observations_source ON design_observations(source_id);
CREATE INDEX IF NOT EXISTS idx_design_reference_packs_run ON design_reference_packs(run_id);
