#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const corpus = join(repoRoot, "scripts/iphone-app-factory/design-corpus.mjs");

function sqliteAvailable() {
  return spawnSync("sqlite3", ["--version"], { encoding: "utf8" }).status === 0;
}

function withTempDb(fn) {
  const dir = mkdtempSync(join(tmpdir(), "design-corpus-"));
  try {
    return fn(join(dir, "design-corpus.sqlite"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runCorpus(args, env = {}) {
  return spawnSync(process.execPath, [corpus, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function sqlite(db, sql) {
  const result = spawnSync("sqlite3", [db, sql], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function sqliteJson(db, sql) {
  const result = spawnSync("sqlite3", [db], {
    cwd: repoRoot,
    input: `.mode json\n${sql}`,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

function upsertSource(db, options = {}) {
  const sourceName = options.sourceName || "Alarmy";
  const sourceUrl = options.sourceUrl || "https://mobbin.com/apps/alarmy-ios";
  const result = runCorpus([
    "upsert-source",
    "--db",
    db,
    "--source-type",
    "mobbin",
    "--source-name",
    sourceName,
    "--source-url",
    sourceUrl,
    "--source-policy",
    "reference-only",
    "--raw-asset-allowed",
    "false",
  ]);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function upsertAlarmySource(db) {
  return upsertSource(db);
}

test("design-corpus init creates sqlite schema", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    const init = runCorpus(["init", "--db", db]);
    assert.equal(init.status, 0, init.stderr);
    const report = JSON.parse(init.stdout);
    assert.equal(report.storage, "sqlite");
    assert.equal(report.path, db);

    const tables = sqlite(db, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
      .split("\n")
      .filter(Boolean);
    assert.deepEqual(
      tables.filter((name) => name.startsWith("design_")),
      [
        "design_assets",
        "design_observations",
        "design_reference_packs",
        "design_sources",
      ],
    );
  });
});

test("design-corpus upsert-source records a source without duplicates", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    const first = upsertAlarmySource(db);
    const second = upsertAlarmySource(db);

    assert.equal(first.source.id, "src_alarmy");
    assert.equal(second.source.id, "src_alarmy");
    assert.equal(sqlite(db, "SELECT COUNT(*) FROM design_sources;"), "1");

    const rows = sqliteJson(db, "SELECT id, source_type, source_name, source_policy, raw_asset_allowed FROM design_sources;");
    assert.deepEqual(rows, [
      {
        id: "src_alarmy",
        source_type: "mobbin",
        source_name: "Alarmy",
        source_policy: "reference-only",
        raw_asset_allowed: 0,
      },
    ]);
  });
});

test("design-corpus add-asset stores private asset metadata with source policy", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    upsertAlarmySource(db);

    const add = runCorpus([
      "add-asset",
      "--db",
      db,
      "--source-id",
      "src_alarmy",
      "--asset-type",
      "screenshot",
      "--screen-type",
      "active_alarm",
      "--storage-key",
      "s3://private/path.png",
      "--sha256",
      "abc123",
      "--captured-at",
      "2026-05-16T00:00:00Z",
    ]);
    assert.equal(add.status, 0, add.stderr);
    const report = JSON.parse(add.stdout);
    assert.equal(report.asset.source_policy, "reference-only");
    assert.equal(report.asset.private_only, true);

    const rows = sqliteJson(db, `
SELECT a.source_id, a.asset_type, a.screen_type, a.storage_provider, a.storage_key, a.sha256, a.captured_at, a.private_only, s.source_policy
FROM design_assets AS a
JOIN design_sources AS s ON s.id = a.source_id;
`);
    assert.deepEqual(rows, [
      {
        source_id: "src_alarmy",
        asset_type: "screenshot",
        screen_type: "active_alarm",
        storage_provider: "s3",
        storage_key: "s3://private/path.png",
        sha256: "abc123",
        captured_at: "2026-05-16T00:00:00Z",
        private_only: 1,
        source_policy: "reference-only",
      },
    ]);
  });
});

test("design-corpus add-observation stores derived notes without raw screenshot storage", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    upsertAlarmySource(db);

    const add = runCorpus([
      "add-observation",
      "--db",
      db,
      "--source-id",
      "src_alarmy",
      "--app-domain",
      "alarm_clock",
      "--screen-type",
      "active_alarm",
      "--observation-type",
      "interaction-pattern",
      "--summary",
      "Large single action and high contrast hierarchy",
      "--what-to-adapt",
      "Use oversized confirm/progress targets in wake mode",
      "--what-not-to-copy",
      "Do not reproduce Alarmy's layout, copy, colors, or proprietary assets",
      "--tags",
      '["wake-mode","high-friction"]',
    ]);
    assert.equal(add.status, 0, add.stderr);

    assert.equal(sqlite(db, "SELECT COUNT(*) FROM design_assets;"), "0");
    const rows = sqliteJson(db, "SELECT source_id, asset_id, app_domain, screen_type, observation_type, summary, what_to_adapt, what_not_to_copy, tags_json FROM design_observations;");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].source_id, "src_alarmy");
    assert.equal(rows[0].asset_id, null);
    assert.equal(rows[0].app_domain, "alarm_clock");
    assert.equal(rows[0].screen_type, "active_alarm");
    assert.equal(rows[0].observation_type, "interaction-pattern");
    assert.equal(rows[0].summary, "Large single action and high contrast hierarchy");
    assert.equal(rows[0].what_to_adapt, "Use oversized confirm/progress targets in wake mode");
    assert.equal(rows[0].what_not_to_copy, "Do not reproduce Alarmy's layout, copy, colors, or proprietary assets");
    assert.deepEqual(JSON.parse(rows[0].tags_json), ["wake-mode", "high-friction"]);
  });
});

test("design-corpus reference-pack returns matching references by domain, screen type, and tags", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    upsertAlarmySource(db);
    upsertSource(db, {
      sourceName: "Notion",
      sourceUrl: "https://mobbin.com/apps/notion-ios",
    });

    for (const args of [
      [
        "--source-id",
        "src_alarmy",
        "--app-domain",
        "alarm_clock",
        "--screen-type",
        "active_alarm",
        "--observation-type",
        "interaction-pattern",
        "--summary",
        "Large single action and high contrast hierarchy",
        "--what-to-adapt",
        "Use oversized confirm/progress targets in wake mode",
        "--what-not-to-copy",
        "Do not reproduce Alarmy's layout, copy, colors, or proprietary assets",
        "--tags",
        '["wake-mode","high-friction"]',
      ],
      [
        "--source-id",
        "src_notion",
        "--app-domain",
        "notes",
        "--screen-type",
        "editor",
        "--observation-type",
        "layout",
        "--summary",
        "Dense document toolbar",
        "--what-to-adapt",
        "Keep editing actions close to text",
        "--what-not-to-copy",
        "Do not reproduce Notion's toolbar",
        "--tags",
        '["editor"]',
      ],
    ]) {
      const add = runCorpus(["add-observation", "--db", db, ...args]);
      assert.equal(add.status, 0, add.stderr);
    }

    const pack = runCorpus([
      "reference-pack",
      "--db",
      db,
      "--run-id",
      "run_123",
      "--app-domain",
      "alarm_clock",
      "--screen-type",
      "active_alarm",
      "--tags",
      "wake-mode,high-friction",
    ]);
    assert.equal(pack.status, 0, pack.stderr);
    const report = JSON.parse(pack.stdout);
    assert.equal(report.reference_pack.run_id, "run_123");
    assert.equal(report.references.length, 1);
    assert.equal(report.references[0].source_id, "src_alarmy");
    assert.equal(report.references[0].source.raw_asset_allowed, false);
    assert.deepEqual(report.references[0].tags, ["wake-mode", "high-friction"]);

    const rows = sqliteJson(db, "SELECT run_id, app_domain, query_json, observation_ids_json FROM design_reference_packs;");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].run_id, "run_123");
    assert.equal(rows[0].app_domain, "alarm_clock");
    assert.deepEqual(JSON.parse(rows[0].query_json).tags, ["wake-mode", "high-friction"]);
    assert.deepEqual(JSON.parse(rows[0].observation_ids_json), [report.references[0].id]);
  });
});

test("design-corpus stores Mobbin reference metadata while raw assets remain disallowed", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    upsertAlarmySource(db);

    const rows = sqliteJson(db, "SELECT id, source_type, source_url, source_policy, raw_asset_allowed FROM design_sources;");
    assert.deepEqual(rows, [
      {
        id: "src_alarmy",
        source_type: "mobbin",
        source_url: "https://mobbin.com/apps/alarmy-ios",
        source_policy: "reference-only",
        raw_asset_allowed: 0,
      },
    ]);
  });
});

test("design-corpus fails clearly when DESIGN_CORPUS_DATABASE_URL is present without explicit SQLite db", () => {
  const result = runCorpus(["init"], {
    DESIGN_CORPUS_DATABASE_URL: "postgres://user:secret@example.com/db",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Postgres\/Neon support is not enabled yet/);
  assert.doesNotMatch(result.stderr, /secret/);
});

test("design-corpus explicit SQLite db overrides unsupported DESIGN_CORPUS_DATABASE_URL", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    const result = runCorpus(["init", "--db", db], {
      DESIGN_CORPUS_DATABASE_URL: "postgres://user:secret@example.com/db",
    });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ok, true);
    assert.equal(report.storage, "sqlite");
    assert.equal(report.path, db);
    assert.doesNotMatch(result.stdout, /secret/);
  });
});

test("design-corpus redacts secret-like source URL query values from output", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    const sourceUrl = "https://user:source-password@mobbin.example/apps/alarmy?access_token=source-token-secret&api_key=source-api-key&title=alarmy";
    const result = runCorpus([
      "upsert-source",
      "--db",
      db,
      "--source-type",
      "mobbin",
      "--source-name",
      "Alarmy",
      "--source-url",
      sourceUrl,
      "--source-policy",
      "reference-only",
      "--raw-asset-allowed",
      "false",
    ]);
    assert.equal(result.status, 0, result.stderr);
    const printed = `${result.stdout}\n${result.stderr}`;

    assert.doesNotMatch(printed, /source-password/);
    assert.doesNotMatch(printed, /source-token-secret/);
    assert.doesNotMatch(printed, /source-api-key/);
    assert.match(printed, /https:\/\/\[redacted\]@mobbin\.example\/apps\/alarmy/);
    assert.match(printed, /access_token=\[redacted\]/);
    assert.match(printed, /api_key=\[redacted\]/);
    assert.match(printed, /title=alarmy/);

    const stored = sqlite(db, "SELECT source_url FROM design_sources WHERE id = 'src_alarmy';");
    assert.equal(stored, sourceUrl);
  });
});

test("design-corpus redacts signed private storage key query values from output", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    upsertAlarmySource(db);
    const storageKey = "s3://private/path.png?X-Amz-Signature=storage-signature-secret&credential=storage-credential-secret&screen=active";
    const add = runCorpus([
      "add-asset",
      "--db",
      db,
      "--source-id",
      "src_alarmy",
      "--asset-type",
      "screenshot",
      "--screen-type",
      "active_alarm",
      "--storage-key",
      storageKey,
      "--sha256",
      "abc123",
      "--captured-at",
      "2026-05-16T00:00:00Z",
    ]);
    assert.equal(add.status, 0, add.stderr);
    const printed = `${add.stdout}\n${add.stderr}`;

    assert.doesNotMatch(printed, /storage-signature-secret/);
    assert.doesNotMatch(printed, /storage-credential-secret/);
    assert.match(printed, /s3:\/\/private\/path\.png/);
    assert.match(printed, /X-Amz-Signature=\[redacted\]/);
    assert.match(printed, /credential=\[redacted\]/);
    assert.match(printed, /screen=active/);

    const stored = sqlite(db, "SELECT storage_key FROM design_assets LIMIT 1;");
    assert.equal(stored, storageKey);
  });
});

test("design-corpus redacts secret-like source URL fragment values from output", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    const sourceUrl = "https://mobbin.example/apps/alarmy#access_token=fragment-source-secret&view=summary";
    const result = runCorpus([
      "upsert-source",
      "--db",
      db,
      "--source-type",
      "mobbin",
      "--source-name",
      "Alarmy",
      "--source-url",
      sourceUrl,
      "--source-policy",
      "reference-only",
      "--raw-asset-allowed",
      "false",
    ]);
    assert.equal(result.status, 0, result.stderr);
    const printed = `${result.stdout}\n${result.stderr}`;

    assert.doesNotMatch(printed, /fragment-source-secret/);
    assert.match(printed, /https:\/\/mobbin\.example\/apps\/alarmy/);
    assert.match(printed, /#access_token=\[redacted\]/);
    assert.match(printed, /view=summary/);

    const stored = sqlite(db, "SELECT source_url FROM design_sources WHERE id = 'src_alarmy';");
    assert.equal(stored, sourceUrl);
  });
});

test("design-corpus redacts secret-like storage key fragment values from output", (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 CLI is not available");

  withTempDb((db) => {
    upsertAlarmySource(db);
    const storageKey = "s3://private/path.png#X-Amz-Signature=fragment-storage-secret&screen=active";
    const add = runCorpus([
      "add-asset",
      "--db",
      db,
      "--source-id",
      "src_alarmy",
      "--asset-type",
      "screenshot",
      "--screen-type",
      "active_alarm",
      "--storage-key",
      storageKey,
      "--sha256",
      "abc123",
      "--captured-at",
      "2026-05-16T00:00:00Z",
    ]);
    assert.equal(add.status, 0, add.stderr);
    const printed = `${add.stdout}\n${add.stderr}`;

    assert.doesNotMatch(printed, /fragment-storage-secret/);
    assert.match(printed, /s3:\/\/private\/path\.png/);
    assert.match(printed, /#X-Amz-Signature=\[redacted\]/);
    assert.match(printed, /screen=active/);

    const stored = sqlite(db, "SELECT storage_key FROM design_assets LIMIT 1;");
    assert.equal(stored, storageKey);
  });
});

test("design-corpus help lists global database and schema options", () => {
  const result = runCorpus(["--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /design-corpus\.mjs init \[global options\]/);
  assert.match(result.stdout, /design-corpus\.mjs upsert-source \[global options\]/);
  assert.doesNotMatch(result.stdout, /\[global options\] init/);
  assert.match(result.stdout, /Global options:/);
  assert.match(result.stdout, /--db <sqlite-path>/);
  assert.match(result.stdout, /--schema <schema-path>/);
});
