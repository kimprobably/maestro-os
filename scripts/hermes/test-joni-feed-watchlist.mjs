import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const scriptPath = path.join(repoRoot, "scripts/hermes/joni-feed-watchlist.mjs");
const captureScript = path.join(repoRoot, "scripts/hermes/joni-linkedin-capture.mjs");

function sqliteAvailable() {
  return spawnSync("sqlite3", ["--version"], { encoding: "utf8" }).status === 0;
}

async function tempRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "joni-feed-"));
  await mkdir(path.join(root, ".workflow/joni-linkedin/daily"), { recursive: true });
  await mkdir(path.join(root, "docs/operator/linkedin"), { recursive: true });
  return root;
}

function runScript(args, options = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function runSqlite(db, sql) {
  const result = spawnSync("sqlite3", [db, sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test("joni feed watchlist imports private connection CSV into sqlite", async (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 unavailable");
  const root = await tempRoot();
  const db = path.join(root, "joni-feed.sqlite");
  const csvPath = path.join(root, "connections.csv");
  await writeFile(
    csvPath,
    [
      '"Full Name","LinkedIn URL","Follower Count","Connections Count","Company Name","Title","Founder/CEO Classification","Classification","TYPE","Posted At ISO","Num Likes","Num Comments","LI Post"',
      '"Ada Founder","https://www.linkedin.com/in/ada-founder","50000","12000","Ada Co","Founder","YES","b2b","saas","2026-05-15T12:00:00Z","120","33","https://www.linkedin.com/feed/update/urn:li:activity:ada"',
      '"Ben Operator","https://www.linkedin.com/in/ben-operator","7000","9000","Ben Co","CEO","YES","b2b","agency","2026-05-14T10:00:00Z","35","8","https://www.linkedin.com/feed/update/urn:li:activity:ben"',
      '"Cara Quiet","https://www.linkedin.com/in/cara-quiet","900","1500","Cara Co","Founder","YES","b2b","consultant","","","",""',
      "",
    ].join("\n"),
  );

  const imported = runScript(["import-csv", "--db", db, "--csv", csvPath]);
  assert.equal(imported.status, 0, imported.stderr);
  const report = JSON.parse(imported.stdout);
  assert.equal(report.imported, 3);
  assert.equal(report.with_linkedin_url, 3);

  assert.equal(runSqlite(db, "SELECT COUNT(*) FROM joni_sources;"), "3");
  assert.equal(
    runSqlite(db, "SELECT full_name || ':' || follower_count FROM joni_sources ORDER BY follower_count DESC LIMIT 1;"),
    "Ada Founder:50000",
  );
});

test("joni feed watchlist selects a daily source cohort with top and rotating tiers", async (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 unavailable");
  const root = await tempRoot();
  const db = path.join(root, "joni-feed.sqlite");
  const csvPath = path.join(root, "connections.csv");
  const sourceOut = path.join(root, ".workflow/joni-linkedin/daily/selected-sources.json");
  await writeFile(
    csvPath,
    [
      '"Full Name","LinkedIn URL","Follower Count","Connections Count","Company Name","Title","Founder/CEO Classification","Classification","TYPE","Posted At ISO","Num Likes","Num Comments","LI Post"',
      '"Big Founder","https://www.linkedin.com/in/big-founder","100000","30000","Big Co","Founder","YES","b2b","saas","2026-05-15T12:00:00Z","200","80","https://www.linkedin.com/feed/update/urn:li:activity:big"',
      '"Mid Founder","https://www.linkedin.com/in/mid-founder","15000","11000","Mid Co","CEO","YES","b2b","agency","2026-05-15T12:00:00Z","70","20","https://www.linkedin.com/feed/update/urn:li:activity:mid"',
      '"Active Small","https://www.linkedin.com/in/active-small","1200","800","Small Co","Founder","YES","b2b","consultant","2026-05-16T12:00:00Z","90","55","https://www.linkedin.com/feed/update/urn:li:activity:small"',
      '"Quiet Small","https://www.linkedin.com/in/quiet-small","800","600","Quiet Co","Founder","YES","b2b","coach","","","",""',
      "",
    ].join("\n"),
  );

  assert.equal(runScript(["import-csv", "--db", db, "--csv", csvPath]).status, 0);
  const selected = runScript([
    "select-sources",
    "--db",
    db,
    "--out",
    sourceOut,
    "--limit",
    "3",
    "--tier-a-percent",
    "25",
    "--rotation-limit",
    "1",
    "--date",
    "2026-05-17",
  ]);
  assert.equal(selected.status, 0, selected.stderr);

  const config = JSON.parse(await readFile(sourceOut, "utf8"));
  assert.equal(config.version, 1);
  assert.equal(config.sources.length, 3);
  assert.ok(config.sources.some((source) => source.name.includes("Big Founder") && source.tier === "top"));
  assert.ok(config.sources.every((source) => source.type === "profile" && source.profile.startsWith("https://www.linkedin.com/in/")));
  assert.ok(config.sources.every((source) => source.source_id));
});

test("joni capture preserves source ids so feed snapshots can be scored", async (t) => {
  if (!sqliteAvailable()) return t.skip("sqlite3 unavailable");
  const root = await tempRoot();
  const db = path.join(root, "joni-feed.sqlite");
  const csvPath = path.join(root, "connections.csv");
  await writeFile(
    csvPath,
    [
      '"Full Name","LinkedIn URL","Follower Count","Connections Count","Company Name","Title","Founder/CEO Classification","Classification","TYPE","Posted At ISO","Num Likes","Num Comments","LI Post"',
      '"High Signal","https://www.linkedin.com/in/high-signal","9000","7000","Signal Co","Founder","YES","b2b","agency","2026-05-15T12:00:00Z","20","4","https://www.linkedin.com/feed/update/urn:li:activity:old"',
      "",
    ].join("\n"),
  );
  assert.equal(runScript(["import-csv", "--db", db, "--csv", csvPath]).status, 0);
  const sourceId = runSqlite(db, "SELECT id FROM joni_sources LIMIT 1;");
  const sourceConfig = path.join(root, ".workflow/joni-linkedin/daily/selected-sources.json");
  await writeFile(
    sourceConfig,
    JSON.stringify({
      version: 1,
      sources: [{ type: "profile", name: "High Signal", source_id: sourceId, tier: "active", profile: "https://www.linkedin.com/in/high-signal" }],
    }),
  );
  const fixture = path.join(root, "fixture.json");
  await writeFile(
    fixture,
    JSON.stringify({
      responses: {
        "profile:High Signal": {
          elements: [{
            id: "new-post",
            content: "Founder-led GTM needs operating loops, not more prompts.",
            linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:new",
            author: { name: "High Signal", linkedinUrl: "https://www.linkedin.com/in/high-signal" },
            postedAt: { date: "2026-05-17", timestamp: 1778976000000 },
            engagement: { likes: 140, comments: 35, shares: 7 },
          }],
        },
      },
    }),
  );

  const capture = spawnSync(
    process.execPath,
    [
      captureScript,
      "capture",
      "--root",
      root,
      "--sources",
      sourceConfig,
      "--out-dir",
      ".workflow/joni-linkedin/daily",
      "--mode",
      "fixture",
      "--fixture",
      fixture,
    ],
    { encoding: "utf8", env: { ...process.env, HARVEST_API_KEY: "not-printed" } },
  );
  assert.equal(capture.status, 0, capture.stderr);

  const record = runScript(["record-posts", "--db", db, "--posts", path.join(root, ".workflow/joni-linkedin/daily/posts.jsonl")]);
  assert.equal(record.status, 0, record.stderr);
  const score = runScript(["score", "--db", db, "--out-dir", path.join(root, ".workflow/joni-linkedin/daily"), "--limit", "5"]);
  assert.equal(score.status, 0, score.stderr);

  const candidates = JSON.parse(await readFile(path.join(root, ".workflow/joni-linkedin/daily/feed-candidates.json"), "utf8"));
  assert.equal(candidates.candidates.length, 1);
  assert.equal(candidates.candidates[0].source_id, sourceId);
  assert.ok(candidates.candidates[0].score > candidates.candidates[0].engagement.weighted_total);
  assert.match(await readFile(path.join(root, ".workflow/joni-linkedin/daily/feed-candidates.md"), "utf8"), /High Signal/);
});
