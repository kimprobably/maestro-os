#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function envNameForArg(name) {
  return name
    .replace(/^--/, "")
    .replace(/-/g, "_")
    .toUpperCase();
}

function argOrEnv(name, fallback = null) {
  if (name === "--run-id") {
    return argValue(name, process.env.UX_RUN_ID || process.env.UX_RUN_BRANCH || process.env.RUN_ID || fallback);
  }
  if (name === "--screen-type") {
    return argValue(name, process.env.UX_SCREEN_TYPE || process.env.UX_APP_DOMAIN || process.env.SCREEN_TYPE || fallback);
  }
  return argValue(name, process.env[`UX_${envNameForArg(name)}`] || process.env[envNameForArg(name)] || fallback);
}

function required(name) {
  const value = argOrEnv(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function paths() {
  return {
    dbPath: resolve(argValue("--db", "hermes/design-corpus/design-corpus.sqlite")),
    schemaPath: resolve(argValue("--schema", "hermes/design-corpus/schema.sql")),
  };
}

function sqliteAvailable() {
  return spawnSync("sqlite3", ["--version"], { encoding: "utf8" }).status === 0;
}

function sqlQuote(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function secretQueryParameterName(name) {
  let decoded = String(name).replace(/\+/g, " ");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    decoded = String(name);
  }
  const normalized = decoded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const exactSecretNames = new Set([
    "access_token",
    "api_key",
    "auth",
    "authorization",
    "credential",
    "key",
    "password",
    "secret",
    "signature",
    "token",
    "x_amz_signature",
  ]);
  if (exactSecretNames.has(normalized)) return true;
  return normalized
    .split("_")
    .some((part) => ["auth", "authorization", "credential", "key", "password", "secret", "signature", "token"].includes(part));
}

function redactSecretUrlParts(value) {
  return value
    .replace(/\b([a-z][a-z0-9+.-]*:\/\/)([^/?#\s"'<>@]+@)/gi, "$1[redacted]@")
    .replace(/([?#&])([^=&#\s]+)=([^&#\s]*)/g, (match, separator, name) => {
      if (!secretQueryParameterName(name)) return match;
      return `${separator}${name}=[redacted]`;
    });
}

function secretObjectKey(key) {
  const normalized = String(key)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (normalized === "private_only") return false;
  return /(^|[_-])(TOKEN|SECRET|PASSWORD|CREDENTIAL|COOKIE|SESSION|PRIVATE|OAUTH|API[_-]?KEY|AUTH[_-]?(TOKEN|KEY|SECRET|HEADER)|AUTHORIZATION|BEARER)([_-]|$)/i.test(key);
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      if (secretObjectKey(key)) {
        output[key] = "[redacted]";
      } else {
        output[key] = redact(child);
      }
    }
    return output;
  }
  if (typeof value === "string") {
    return redactSecretUrlParts(value)
      .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, "[redacted]")
      .replace(/xox[baprs]-[A-Za-z0-9-]+/g, "[redacted]")
      .replace(/xapp-[A-Za-z0-9-]+/g, "[redacted]")
      .replace(/lin_api_[A-Za-z0-9_-]+/g, "[redacted]")
      .replace(/apify_api_[A-Za-z0-9_-]+/g, "[redacted]");
  }
  return value;
}

function execSql(dbPath, sql) {
  const result = spawnSync("sqlite3", [dbPath], {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(redact(result.stderr || result.stdout || "sqlite3 failed"));
  }
  return result.stdout;
}

function sqliteJson(dbPath, sql) {
  const output = execSql(dbPath, `.mode json\n${sql}`).trim();
  return output ? JSON.parse(output) : [];
}

function ensureSqlite(storage = paths()) {
  if (process.env.DESIGN_CORPUS_DATABASE_URL) {
    throw new Error("DESIGN_CORPUS_DATABASE_URL is set, but Postgres/Neon support is not enabled yet. Unset it or use --db for local SQLite.");
  }
  if (!sqliteAvailable()) {
    throw new Error("sqlite3 CLI is required for design-corpus SQLite storage and was not found on PATH.");
  }
  if (!existsSync(storage.schemaPath)) {
    throw new Error(`Schema file not found: ${storage.schemaPath}`);
  }
  mkdirSync(dirname(storage.dbPath), { recursive: true });
  execSql(storage.dbPath, readFileSync(storage.schemaPath, "utf8"));
  return { storage: "sqlite", path: storage.dbPath };
}

function slug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function stableId(prefix, parts) {
  const digest = createHash("sha256").update(parts.map((part) => String(part ?? "")).join("\0")).digest("hex").slice(0, 16);
  return `${prefix}_${digest}`;
}

function parseBoolean(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (/^(1|true|yes)$/i.test(value)) return true;
  if (/^(0|false|no)$/i.test(value)) return false;
  throw new Error(`Expected boolean value, got: ${value}`);
}

function parseIntegerArg(name) {
  const raw = argValue(name);
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) throw new Error(`Expected integer value for ${name}`);
  return value;
}

function parseTags(raw) {
  if (!raw) return [];
  const trimmed = raw.trim();
  const tags = trimmed.startsWith("[")
    ? JSON.parse(trimmed)
    : trimmed.split(",").map((tag) => tag.trim()).filter(Boolean);
  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")) {
    throw new Error("--tags must be a JSON string array or comma-separated strings");
  }
  return redact(tags);
}

function inferStorageProvider(storageKey) {
  if (/^s3:\/\//i.test(storageKey)) return "s3";
  if (/^gs:\/\//i.test(storageKey)) return "gcs";
  if (/^https?:\/\//i.test(storageKey)) return "https";
  if (/^file:\/\//i.test(storageKey) || storageKey.startsWith("/")) return "local";
  return "private";
}

function rowToSource(row) {
  if (!row) return null;
  return {
    ...row,
    raw_asset_allowed: Boolean(row.raw_asset_allowed),
  };
}

function fetchSource(dbPath, sourceId) {
  const rows = sqliteJson(dbPath, `
SELECT id, source_type, source_name, source_url, app_name, app_store_id, bundle_id, source_policy, raw_asset_allowed, created_at, updated_at
FROM design_sources
WHERE id = ${sqlQuote(sourceId)}
LIMIT 1;
`);
  return rowToSource(rows[0]);
}

function upsertSourceSqlite(storage, source) {
  const sql = `
INSERT INTO design_sources (
  id, source_type, source_name, source_url, app_name, app_store_id, bundle_id, source_policy, raw_asset_allowed, updated_at
)
VALUES (
  ${sqlQuote(source.id)},
  ${sqlQuote(source.source_type)},
  ${sqlQuote(source.source_name)},
  ${sqlQuote(source.source_url)},
  ${sqlQuote(source.app_name)},
  ${sqlQuote(source.app_store_id)},
  ${sqlQuote(source.bundle_id)},
  ${sqlQuote(source.source_policy)},
  ${source.raw_asset_allowed ? 1 : 0},
  CURRENT_TIMESTAMP
)
ON CONFLICT(id) DO UPDATE SET
  source_type = excluded.source_type,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  app_name = excluded.app_name,
  app_store_id = excluded.app_store_id,
  bundle_id = excluded.bundle_id,
  source_policy = excluded.source_policy,
  raw_asset_allowed = excluded.raw_asset_allowed,
  updated_at = excluded.updated_at;
`;
  execSql(storage.dbPath, sql);
  return fetchSource(storage.dbPath, source.id);
}

function addAssetSqlite(storage, asset) {
  const source = fetchSource(storage.dbPath, asset.source_id);
  if (!source) throw new Error(`Unknown source_id: ${asset.source_id}`);

  const sql = `
PRAGMA foreign_keys = ON;
INSERT OR REPLACE INTO design_assets (
  id, source_id, asset_type, screen_type, flow_name, flow_step, storage_provider, storage_key,
  sha256, perceptual_hash, width, height, captured_at, private_only
)
VALUES (
  ${sqlQuote(asset.id)},
  ${sqlQuote(asset.source_id)},
  ${sqlQuote(asset.asset_type)},
  ${sqlQuote(asset.screen_type)},
  ${sqlQuote(asset.flow_name)},
  ${asset.flow_step === null ? "NULL" : Number(asset.flow_step)},
  ${sqlQuote(asset.storage_provider)},
  ${sqlQuote(asset.storage_key)},
  ${sqlQuote(asset.sha256)},
  ${sqlQuote(asset.perceptual_hash)},
  ${asset.width === null ? "NULL" : Number(asset.width)},
  ${asset.height === null ? "NULL" : Number(asset.height)},
  ${sqlQuote(asset.captured_at)},
  ${asset.private_only ? 1 : 0}
);
`;
  execSql(storage.dbPath, sql);
  return {
    ...asset,
    source_policy: source.source_policy,
    raw_asset_allowed: source.raw_asset_allowed,
  };
}

function addObservationSqlite(storage, observation) {
  if (!fetchSource(storage.dbPath, observation.source_id)) throw new Error(`Unknown source_id: ${observation.source_id}`);
  if (observation.asset_id) {
    const assetRows = sqliteJson(storage.dbPath, `SELECT id FROM design_assets WHERE id = ${sqlQuote(observation.asset_id)} LIMIT 1;`);
    if (!assetRows.length) throw new Error(`Unknown asset_id: ${observation.asset_id}`);
  }

  const sql = `
PRAGMA foreign_keys = ON;
INSERT OR REPLACE INTO design_observations (
  id, source_id, asset_id, app_domain, screen_type, observation_type, summary,
  what_to_adapt, what_not_to_copy, tags_json
)
VALUES (
  ${sqlQuote(observation.id)},
  ${sqlQuote(observation.source_id)},
  ${sqlQuote(observation.asset_id)},
  ${sqlQuote(observation.app_domain)},
  ${sqlQuote(observation.screen_type)},
  ${sqlQuote(observation.observation_type)},
  ${sqlQuote(observation.summary)},
  ${sqlQuote(observation.what_to_adapt)},
  ${sqlQuote(observation.what_not_to_copy)},
  ${sqlQuote(JSON.stringify(observation.tags))}
);
`;
  execSql(storage.dbPath, sql);
  return observation;
}

function readReferenceCandidates(storage, appDomain, screenType) {
  return sqliteJson(storage.dbPath, `
SELECT
  o.id,
  o.source_id,
  o.asset_id,
  o.app_domain,
  o.screen_type,
  o.observation_type,
  o.summary,
  o.what_to_adapt,
  o.what_not_to_copy,
  o.tags_json,
  o.created_at,
  s.source_type,
  s.source_name,
  s.source_url,
  s.app_name,
  s.source_policy,
  s.raw_asset_allowed
FROM design_observations AS o
JOIN design_sources AS s ON s.id = o.source_id
WHERE o.app_domain = ${sqlQuote(appDomain)}
  AND o.screen_type = ${sqlQuote(screenType)}
ORDER BY o.created_at DESC, o.id DESC;
`);
}

function observationReference(row) {
  const tags = JSON.parse(row.tags_json || "[]");
  return {
    id: row.id,
    source_id: row.source_id,
    asset_id: row.asset_id,
    app_domain: row.app_domain,
    screen_type: row.screen_type,
    observation_type: row.observation_type,
    summary: row.summary,
    what_to_adapt: row.what_to_adapt,
    what_not_to_copy: row.what_not_to_copy,
    tags,
    source: {
      id: row.source_id,
      source_type: row.source_type,
      source_name: row.source_name,
      source_url: row.source_url,
      app_name: row.app_name,
      source_policy: row.source_policy,
      raw_asset_allowed: Boolean(row.raw_asset_allowed),
    },
  };
}

function createReferencePackSqlite(storage, query) {
  const requestedTags = new Set(query.tags);
  const references = readReferenceCandidates(storage, query.app_domain, query.screen_type)
    .map(observationReference)
    .filter((reference) => {
      if (!requestedTags.size) return true;
      const candidateTags = new Set(reference.tags);
      return [...requestedTags].every((tag) => candidateTags.has(tag));
    });

  const observationIds = references.map((reference) => reference.id);
  const id = stableId("refpack", [query.run_id, query.app_domain, query.screen_type, query.target_audience, JSON.stringify(query.tags)]);
  const queryJson = JSON.stringify(redact({
    app_domain: query.app_domain,
    screen_type: query.screen_type,
    target_audience: query.target_audience,
    tags: query.tags,
  }));
  const sql = `
INSERT OR REPLACE INTO design_reference_packs (
  id, run_id, app_domain, target_audience, query_json, observation_ids_json
)
VALUES (
  ${sqlQuote(id)},
  ${sqlQuote(query.run_id)},
  ${sqlQuote(query.app_domain)},
  ${sqlQuote(query.target_audience)},
  ${sqlQuote(queryJson)},
  ${sqlQuote(JSON.stringify(observationIds))}
);
`;
  execSql(storage.dbPath, sql);
  return {
    id,
    run_id: query.run_id,
    app_domain: query.app_domain,
    target_audience: query.target_audience,
    query: JSON.parse(queryJson),
    observation_ids: observationIds,
    references,
  };
}

function printJson(value) {
  console.log(JSON.stringify(redact(value), null, 2));
}

function usage(exitCode = 1) {
  console.log(`Usage:
  node scripts/iphone-app-factory/design-corpus.mjs init [global options]
  node scripts/iphone-app-factory/design-corpus.mjs upsert-source [global options] --source-type <type> --source-name <name> --source-policy <policy> [--source-url <url>] [--raw-asset-allowed true|false]
  node scripts/iphone-app-factory/design-corpus.mjs add-asset [global options] --source-id <id> --asset-type <type> --screen-type <type> --storage-key <key> --sha256 <hash> --captured-at <iso>
  node scripts/iphone-app-factory/design-corpus.mjs add-observation [global options] --source-id <id> --app-domain <domain> --screen-type <type> --observation-type <type> --summary <text> --what-to-adapt <text> --what-not-to-copy <text> --tags <json|csv>
  node scripts/iphone-app-factory/design-corpus.mjs reference-pack [global options] --run-id <id> --app-domain <domain> --screen-type <type> [--tags <csv|json>]

Global options:
  --db <sqlite-path>        SQLite database path. Defaults to hermes/design-corpus/design-corpus.sqlite.
  --schema <schema-path>    Schema SQL path. Defaults to hermes/design-corpus/schema.sql.
`);
  process.exit(exitCode);
}

function main() {
  const command = process.argv[2];
  if (!command || command === "--help" || command === "-h") usage(command ? 0 : 1);
  const storage = paths();
  const initialized = ensureSqlite(storage);

  if (command === "init") {
    printJson({ ok: true, ...initialized });
  } else if (command === "upsert-source") {
    const sourceName = required("--source-name");
    const source = {
      id: argValue("--source-id", argValue("--id", `src_${slug(sourceName)}`)),
      source_type: required("--source-type"),
      source_name: sourceName,
      source_url: argValue("--source-url"),
      app_name: argValue("--app-name"),
      app_store_id: argValue("--app-store-id"),
      bundle_id: argValue("--bundle-id"),
      source_policy: required("--source-policy"),
      raw_asset_allowed: parseBoolean(argValue("--raw-asset-allowed"), false),
    };
    printJson({ ok: true, storage: initialized.storage, path: initialized.path, source: upsertSourceSqlite(storage, source) });
  } else if (command === "add-asset") {
    const storageKey = required("--storage-key");
    const asset = {
      id: argValue("--asset-id", argValue("--id", stableId("asset", [required("--source-id"), required("--asset-type"), required("--screen-type"), storageKey, required("--sha256")]))),
      source_id: required("--source-id"),
      asset_type: required("--asset-type"),
      screen_type: required("--screen-type"),
      flow_name: argValue("--flow-name"),
      flow_step: parseIntegerArg("--flow-step"),
      storage_provider: argValue("--storage-provider", inferStorageProvider(storageKey)),
      storage_key: storageKey,
      sha256: required("--sha256"),
      perceptual_hash: argValue("--perceptual-hash"),
      width: parseIntegerArg("--width"),
      height: parseIntegerArg("--height"),
      captured_at: required("--captured-at"),
      private_only: parseBoolean(argValue("--private-only"), true),
    };
    printJson({ ok: true, storage: initialized.storage, path: initialized.path, asset: addAssetSqlite(storage, asset) });
  } else if (command === "add-observation") {
    const observation = {
      id: argValue("--observation-id", argValue("--id", stableId("obs", [required("--source-id"), argValue("--asset-id"), required("--app-domain"), required("--screen-type"), required("--observation-type"), required("--summary")]))),
      source_id: required("--source-id"),
      asset_id: argValue("--asset-id"),
      app_domain: required("--app-domain"),
      screen_type: required("--screen-type"),
      observation_type: required("--observation-type"),
      summary: required("--summary"),
      what_to_adapt: required("--what-to-adapt"),
      what_not_to_copy: required("--what-not-to-copy"),
      tags: parseTags(required("--tags")),
    };
    printJson({ ok: true, storage: initialized.storage, path: initialized.path, observation: addObservationSqlite(storage, observation) });
  } else if (command === "reference-pack") {
    const referencePack = createReferencePackSqlite(storage, {
      run_id: required("--run-id"),
      app_domain: required("--app-domain"),
      screen_type: required("--screen-type"),
      target_audience: argOrEnv("--target-audience", "unspecified"),
      tags: parseTags(argOrEnv("--tags", "")),
    });
    printJson({ ok: true, storage: initialized.storage, path: initialized.path, reference_pack: referencePack, references: referencePack.references });
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(redact(error.message || String(error)));
    process.exit(1);
  }
}
