#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const DEFAULT_DB = "/data/.hermes/profiles/joni/state/linkedin-feed/joni-linkedin-feed.sqlite";
const SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS joni_sources (
  id TEXT PRIMARY KEY,
  linkedin_url TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  title TEXT,
  company_name TEXT,
  type TEXT,
  classification TEXT,
  founder_classification TEXT,
  follower_count INTEGER NOT NULL DEFAULT 0,
  connections_count INTEGER NOT NULL DEFAULT 0,
  csv_last_post_url TEXT,
  csv_last_post_at TEXT,
  csv_last_likes INTEGER NOT NULL DEFAULT 0,
  csv_last_comments INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'watching',
  tier TEXT NOT NULL DEFAULT 'unassigned',
  imported_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_selected_at TEXT,
  last_captured_at TEXT,
  last_post_seen_at TEXT,
  consecutive_empty_runs INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS joni_posts (
  id TEXT PRIMARY KEY,
  linkedin_url TEXT UNIQUE,
  source_id TEXT,
  author_name TEXT,
  author_linkedin_url TEXT,
  content_hash TEXT,
  content_excerpt TEXT,
  posted_at TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  latest_likes INTEGER NOT NULL DEFAULT 0,
  latest_comments INTEGER NOT NULL DEFAULT 0,
  latest_shares INTEGER NOT NULL DEFAULT 0,
  latest_total INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(source_id) REFERENCES joni_sources(id)
);
CREATE TABLE IF NOT EXISTS joni_post_snapshots (
  post_id TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  source_id TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  weighted_total INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(post_id, captured_at),
  FOREIGN KEY(post_id) REFERENCES joni_posts(id),
  FOREIGN KEY(source_id) REFERENCES joni_sources(id)
);
CREATE TABLE IF NOT EXISTS joni_daily_runs (
  run_date TEXT PRIMARY KEY,
  selected_count INTEGER NOT NULL DEFAULT 0,
  captured_posts INTEGER NOT NULL DEFAULT 0,
  candidate_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
`;

function argValue(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) throw new Error(`missing value for ${name}`);
  return value;
}

function intArg(name, fallback) {
  const raw = argValue(name, String(fallback));
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) throw new Error(`${name} must be an integer`);
  return value;
}

function numArg(name, fallback) {
  const raw = argValue(name, String(fallback));
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number`);
  return value;
}

function hash(value) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

function sourceId(linkedinUrl) {
  return `li_${hash(normalizeUrl(linkedinUrl)).slice(0, 18)}`;
}

function postId(value) {
  return `post_${hash(value).slice(0, 24)}`;
}

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function text(row, name) {
  return String(row[name] || "").trim();
}

function intValue(value) {
  const raw = String(value || "").replaceAll(",", "").trim();
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sqlQuote(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function execSql(db, sql) {
  const result = spawnSync("sqlite3", [db], {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "sqlite3 failed");
  return result.stdout;
}

function queryJson(db, sql) {
  const result = spawnSync("sqlite3", ["-json", db], {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || "sqlite3 query failed");
  const raw = result.stdout.trim();
  return raw ? JSON.parse(raw) : [];
}

async function ensureDb(db) {
  await mkdir(path.dirname(db), { recursive: true });
  execSql(db, SCHEMA);
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows
    .filter((values) => values.some((value) => String(value || "").trim()))
    .map((values) => Object.fromEntries(headers.map((header, idx) => [header, values[idx] || ""])));
}

function urlOrEmpty(value) {
  const url = normalizeUrl(value);
  return /^https?:\/\//i.test(url) ? url : "";
}

function priorityScore(row) {
  const followers = Number(row.follower_count || 0);
  const connections = Number(row.connections_count || 0);
  const likes = Number(row.csv_last_likes || 0);
  const comments = Number(row.csv_last_comments || 0);
  const baseline = likes + comments * 4;
  const recentBoost = row.csv_last_post_at || row.last_post_seen_at ? 200 : 0;
  return Math.log10(followers + 1) * 100
    + Math.log10(connections + 1) * 35
    + baseline * 3
    + recentBoost;
}

function stableOrderKey(seed, source) {
  return Number.parseInt(hash(`${seed}:${source.id}`).slice(0, 12), 16);
}

async function importCsv() {
  const db = argValue("--db", DEFAULT_DB);
  const csvPath = argValue("--csv");
  if (!csvPath) throw new Error("--csv is required");
  await ensureDb(db);

  const csv = await readFile(csvPath, "utf8");
  const rows = parseCsv(csv);
  const now = new Date().toISOString();
  const statements = [];
  let withLinkedinUrl = 0;
  for (const row of rows) {
    const linkedinUrl = normalizeUrl(text(row, "LinkedIn URL"));
    if (!linkedinUrl) continue;
    withLinkedinUrl += 1;
    const id = sourceId(linkedinUrl);
    const fullName = text(row, "Full Name") || [text(row, "First name"), text(row, "Last name")].filter(Boolean).join(" ") || "Unknown";
    statements.push(`
INSERT INTO joni_sources (
  id, linkedin_url, full_name, title, company_name, type, classification,
  founder_classification, follower_count, connections_count, csv_last_post_url,
  csv_last_post_at, csv_last_likes, csv_last_comments, imported_at, updated_at
) VALUES (
  ${sqlQuote(id)}, ${sqlQuote(linkedinUrl)}, ${sqlQuote(fullName)},
  ${sqlQuote(text(row, "Title"))}, ${sqlQuote(text(row, "Company Name"))},
  ${sqlQuote(text(row, "TYPE"))}, ${sqlQuote(text(row, "Classification"))},
  ${sqlQuote(text(row, "Founder/CEO Classification") || text(row, "Founder/CEO Classification Classification"))},
  ${intValue(row["Follower Count"])}, ${intValue(row["Connections Count"])},
  ${sqlQuote(urlOrEmpty(text(row, "LI Post")))}, ${sqlQuote(text(row, "Posted At ISO") || text(row, "Posted Date"))},
  ${intValue(row["Num Likes"])}, ${intValue(row["Num Comments"])},
  ${sqlQuote(now)}, ${sqlQuote(now)}
)
ON CONFLICT(linkedin_url) DO UPDATE SET
  full_name = excluded.full_name,
  title = excluded.title,
  company_name = excluded.company_name,
  type = excluded.type,
  classification = excluded.classification,
  founder_classification = excluded.founder_classification,
  follower_count = excluded.follower_count,
  connections_count = excluded.connections_count,
  csv_last_post_url = excluded.csv_last_post_url,
  csv_last_post_at = excluded.csv_last_post_at,
  csv_last_likes = excluded.csv_last_likes,
  csv_last_comments = excluded.csv_last_comments,
  updated_at = excluded.updated_at;`);
  }
  for (let i = 0; i < statements.length; i += 400) {
    execSql(db, `BEGIN;\n${statements.slice(i, i + 400).join("\n")}\nCOMMIT;`);
  }

  console.log(JSON.stringify({ ok: true, storage: "sqlite", db, imported: statements.length, with_linkedin_url: withLinkedinUrl }, null, 2));
}

async function selectSources() {
  const db = argValue("--db", DEFAULT_DB);
  const out = argValue("--out", ".workflow/joni-linkedin/daily/selected-sources.json");
  const limit = intArg("--limit", 300);
  const tierAPercent = numArg("--tier-a-percent", 20);
  const rotationLimit = intArg("--rotation-limit", Math.max(20, Math.floor(limit * 0.15)));
  const date = argValue("--date", new Date().toISOString().slice(0, 10));
  await ensureDb(db);

  const rows = queryJson(db, "SELECT * FROM joni_sources WHERE status = 'watching' AND linkedin_url <> '';");
  const enriched = rows.map((row) => ({ ...row, priority_score: priorityScore(row) }));
  const topPoolSize = Math.max(1, Math.ceil(enriched.length * (tierAPercent / 100)));
  const topPool = [...enriched].sort((a, b) => Number(b.follower_count) - Number(a.follower_count)).slice(0, topPoolSize);
  const activePool = [...enriched]
    .filter((source) => source.csv_last_post_at || Number(source.csv_last_likes || 0) || Number(source.csv_last_comments || 0) || source.last_post_seen_at)
    .sort((a, b) => b.priority_score - a.priority_score);
  const rotationPool = [...enriched].sort((a, b) => stableOrderKey(date, a) - stableOrderKey(date, b));

  const selected = new Map();
  const add = (source, tier) => {
    if (selected.size >= limit || selected.has(source.id)) return;
    selected.set(source.id, { ...source, selected_tier: tier });
  };
  const nonRotationLimit = Math.max(0, limit - rotationLimit);
  const topTarget = Math.min(topPool.length, Math.max(1, Math.floor(nonRotationLimit * 0.65)));
  for (const source of topPool.sort((a, b) => b.priority_score - a.priority_score)) {
    if (selected.size >= topTarget) break;
    add(source, "top");
  }
  for (const source of activePool) {
    if (selected.size >= nonRotationLimit) break;
    add(source, "active");
  }
  for (const source of rotationPool) add(source, "rotation");

  const sources = [...selected.values()].slice(0, limit);
  const config = {
    version: 1,
    generated_at: new Date().toISOString(),
    policy: {
      kind: "joni-feed-watchlist",
      limit,
      tier_a_percent: tierAPercent,
      rotation_limit: rotationLimit,
      date,
      db,
    },
    sources: sources.map((source) => ({
      type: "profile",
      name: source.full_name,
      source_id: source.id,
      tier: source.selected_tier,
      profile: source.linkedin_url,
      follower_count: Number(source.follower_count || 0),
      enabled: true,
    })),
  };
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(config, null, 2)}\n`);

  const now = new Date().toISOString();
  const updates = sources.map((source) => `UPDATE joni_sources SET tier = ${sqlQuote(source.selected_tier)}, last_selected_at = ${sqlQuote(now)}, updated_at = ${sqlQuote(now)} WHERE id = ${sqlQuote(source.id)};`);
  if (updates.length) execSql(db, `BEGIN;\n${updates.join("\n")}\nCOMMIT;`);
  console.log(JSON.stringify({ ok: true, selected: sources.length, out, tiers: tierCounts(sources) }, null, 2));
}

function tierCounts(sources) {
  const counts = {};
  for (const source of sources) counts[source.selected_tier] = (counts[source.selected_tier] || 0) + 1;
  return counts;
}

async function readJsonl(file) {
  if (!existsSync(file)) return [];
  const raw = await readFile(file, "utf8");
  return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

function postDate(post) {
  return post.posted_at?.date || post.posted_at?.text || "";
}

function weighted(engagement) {
  return Number(engagement.likes || 0)
    + Number(engagement.comments || 0) * 4
    + Number(engagement.shares || 0) * 3;
}

async function recordPosts() {
  const db = argValue("--db", DEFAULT_DB);
  const postsPath = argValue("--posts");
  if (!postsPath) throw new Error("--posts is required");
  await ensureDb(db);
  const posts = await readJsonl(postsPath);
  const now = new Date().toISOString();
  const statements = [];
  const touchedSources = new Set();

  for (const post of posts) {
    const source = post.source || {};
    const engagement = post.engagement || {};
    const sourceIdValue = source.id || source.source_id || "";
    const url = normalizeUrl(post.linkedin_url || "");
    const id = postId(url || post.id || `${sourceIdValue}:${post.content_hash}`);
    const capturedAt = post.captured_at || now;
    const total = Number(engagement.total || 0);
    const postWeighted = weighted(engagement);
    if (sourceIdValue) touchedSources.add(sourceIdValue);
    statements.push(`
INSERT INTO joni_posts (
  id, linkedin_url, source_id, author_name, author_linkedin_url, content_hash,
  content_excerpt, posted_at, first_seen_at, last_seen_at, latest_likes,
  latest_comments, latest_shares, latest_total
) VALUES (
  ${sqlQuote(id)}, ${sqlQuote(url)}, ${sqlQuote(sourceIdValue || null)},
  ${sqlQuote(post.author?.name || "")}, ${sqlQuote(normalizeUrl(post.author?.linkedin_url || ""))},
  ${sqlQuote(post.content_hash || "")}, ${sqlQuote(String(post.content || "").slice(0, 1000))},
  ${sqlQuote(postDate(post))}, ${sqlQuote(capturedAt)}, ${sqlQuote(capturedAt)},
  ${Number(engagement.likes || 0)}, ${Number(engagement.comments || 0)},
  ${Number(engagement.shares || 0)}, ${total}
)
ON CONFLICT(id) DO UPDATE SET
  last_seen_at = excluded.last_seen_at,
  latest_likes = excluded.latest_likes,
  latest_comments = excluded.latest_comments,
  latest_shares = excluded.latest_shares,
  latest_total = excluded.latest_total;

INSERT OR IGNORE INTO joni_post_snapshots (
  post_id, captured_at, source_id, likes, comments, shares, total, weighted_total
) VALUES (
  ${sqlQuote(id)}, ${sqlQuote(capturedAt)}, ${sqlQuote(sourceIdValue || null)},
  ${Number(engagement.likes || 0)}, ${Number(engagement.comments || 0)},
  ${Number(engagement.shares || 0)}, ${total}, ${postWeighted}
);`);
  }

  for (const id of touchedSources) {
    statements.push(`UPDATE joni_sources SET last_captured_at = ${sqlQuote(now)}, consecutive_empty_runs = 0, updated_at = ${sqlQuote(now)} WHERE id = ${sqlQuote(id)};`);
  }
  if (statements.length) execSql(db, `BEGIN;\n${statements.join("\n")}\nCOMMIT;`);
  console.log(JSON.stringify({ ok: true, posts: posts.length, sources_touched: touchedSources.size, db }, null, 2));
}

function parseTime(value) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? time : null;
}

async function score() {
  const db = argValue("--db", DEFAULT_DB);
  const outDir = argValue("--out-dir", ".workflow/joni-linkedin/daily");
  const limit = intArg("--limit", 25);
  const sinceDays = intArg("--since-days", 30);
  const now = parseTime(argValue("--now", "")) || Date.now();
  const cutoff = sinceDays > 0 ? now - sinceDays * 24 * 60 * 60 * 1000 : null;
  await ensureDb(db);
  await mkdir(outDir, { recursive: true });
  const rows = queryJson(db, `
SELECT
  p.id AS post_id,
  p.linkedin_url,
  p.author_name,
  p.content_excerpt,
  p.posted_at,
  p.latest_likes,
  p.latest_comments,
  p.latest_shares,
  s.id AS source_id,
  s.full_name,
  s.linkedin_url AS source_url,
  s.follower_count,
  s.csv_last_likes,
  s.csv_last_comments,
  MAX(ps.captured_at) AS captured_at,
  ps.weighted_total
FROM joni_posts p
JOIN joni_post_snapshots ps ON ps.post_id = p.id
LEFT JOIN joni_sources s ON s.id = p.source_id
GROUP BY p.id
ORDER BY captured_at DESC;
`);
  const candidates = rows.filter((row) => {
    if (!cutoff) return true;
    const postedAt = parseTime(row.posted_at);
    return postedAt !== null && postedAt >= cutoff;
  }).map((row) => {
    const baseline = Number(row.csv_last_likes || 0) + Number(row.csv_last_comments || 0) * 4;
    const weightedTotal = Number(row.weighted_total || 0);
    const postedAt = parseTime(row.posted_at);
    const ageHours = postedAt ? Math.max(1, (now - postedAt) / 36e5) : 24;
    const velocity = weightedTotal / Math.sqrt(ageHours);
    const audience = Math.max(500, Number(row.follower_count || 0));
    const engagementRate = weightedTotal / audience;
    const outperformanceRatio = weightedTotal / Math.max(10, baseline);
    const score = weightedTotal + velocity * 2 + engagementRate * 1500 + outperformanceRatio * 30 + Number(row.latest_comments || 0) * 5;
    return {
      post_id: row.post_id,
      source_id: row.source_id || "",
      author: row.author_name || row.full_name || "",
      author_url: row.source_url || "",
      linkedin_url: row.linkedin_url || "",
      posted_at: row.posted_at || "",
      captured_at: row.captured_at || "",
      content_excerpt: row.content_excerpt || "",
      engagement: {
        likes: Number(row.latest_likes || 0),
        comments: Number(row.latest_comments || 0),
        shares: Number(row.latest_shares || 0),
        weighted_total: weightedTotal,
        audience,
        engagement_rate: Number(engagementRate.toFixed(5)),
      },
      baseline: {
        weighted_total: baseline,
        outperformance_ratio: Number(outperformanceRatio.toFixed(2)),
      },
      velocity_score: Number(velocity.toFixed(2)),
      score: Number(score.toFixed(2)),
    };
  }).sort((a, b) => b.score - a.score).slice(0, limit);

  const payload = {
    generated_at: new Date().toISOString(),
    since_days: sinceDays,
    cutoff_at: cutoff ? new Date(cutoff).toISOString() : "",
    candidate_count: candidates.length,
    candidates,
  };
  await writeFile(path.join(outDir, "feed-candidates.json"), `${JSON.stringify(payload, null, 2)}\n`);
  await writeFile(path.join(outDir, "feed-candidates.md"), markdownCandidates(payload));
  console.log(JSON.stringify({ ok: true, candidates: candidates.length, out_dir: outDir }, null, 2));
}

function markdownCandidates(payload) {
  const lines = [
    "# Joni Feed Candidates",
    "",
    `Generated at: ${payload.generated_at}`,
    payload.since_days > 0 ? `Recency window: last ${payload.since_days} days` : "Recency window: all captured posts",
    `Candidates: ${payload.candidate_count}`,
    "",
  ];
  for (const [idx, candidate] of payload.candidates.entries()) {
    lines.push(
      `## ${idx + 1}. ${candidate.author || "Unknown author"}`,
      "",
      `- Score: ${candidate.score}`,
      `- Weighted engagement: ${candidate.engagement.weighted_total}`,
      `- Outperformance ratio: ${candidate.baseline.outperformance_ratio}`,
      `- URL: ${candidate.linkedin_url || "missing"}`,
      `- Excerpt: ${candidate.content_excerpt.slice(0, 500)}`,
      "",
    );
  }
  if (!payload.candidates.length) lines.push("No candidates met the scoring input requirements.", "");
  return `${lines.join("\n")}\n`;
}

async function appendLedger() {
  const db = argValue("--db", DEFAULT_DB);
  const outDir = argValue("--out-dir", ".workflow/joni-linkedin/daily");
  const ledger = argValue("--ledger", "docs/operator/linkedin/JONI-LINKEDIN-LEDGER.md");
  await ensureDb(db);
  const selected = existsSync(path.join(outDir, "selected-sources.json"))
    ? JSON.parse(await readFile(path.join(outDir, "selected-sources.json"), "utf8"))
    : { sources: [] };
  const candidates = existsSync(path.join(outDir, "feed-candidates.json"))
    ? JSON.parse(await readFile(path.join(outDir, "feed-candidates.json"), "utf8"))
    : { candidates: [] };
  const entry = [
    "",
    `## Feed Watchlist ${new Date().toISOString()}`,
    "",
    `- Sources selected: ${selected.sources.length}`,
    `- Candidate posts: ${candidates.candidates.length}`,
    `- Top candidate: ${candidates.candidates[0]?.linkedin_url || "none"}`,
    `- Candidate artifact: ${path.join(outDir, "feed-candidates.md")}`,
    "",
  ].join("\n");
  await appendFile(ledger, entry);
  console.log(JSON.stringify({ ok: true, ledger }, null, 2));
}

async function main() {
  const command = process.argv[2] || "";
  try {
    if (command === "init") {
      const db = argValue("--db", DEFAULT_DB);
      await ensureDb(db);
      console.log(JSON.stringify({ ok: true, storage: "sqlite", db }, null, 2));
    } else if (command === "import-csv") {
      await importCsv();
    } else if (command === "select-sources") {
      await selectSources();
    } else if (command === "record-posts") {
      await recordPosts();
    } else if (command === "score") {
      await score();
    } else if (command === "ledger") {
      await appendLedger();
    } else {
      throw new Error("usage: joni-feed-watchlist.mjs init|import-csv|select-sources|record-posts|score|ledger");
    }
  } catch (error) {
    console.error(String(error.message || error).replace(/X-API-Key|HARVEST_API_KEY|Bearer|secret/gi, "[redacted]"));
    process.exit(1);
  }
}

await main();
