#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const HARVEST_BASE_URL = "https://api.harvest-api.com";

function argValue(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function boolArg(name, fallback = false) {
  const raw = String(argValue(name, String(fallback))).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(raw);
}

function repoRoot() {
  return path.resolve(import.meta.dirname, "../..");
}

function rel(root, value) {
  const raw = String(value || "");
  return path.isAbsolute(raw) ? raw : path.join(root, raw);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function hash(value) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

function contentExcerpt(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 4000);
}

function sourceKey(source) {
  return `${source.type}:${source.name}`;
}

function enabledSources(config) {
  return (config.sources || []).filter((source) => source.enabled !== false);
}

function endpointFor(source) {
  if (source.type === "profile") return "/linkedin/profile-posts";
  if (source.type === "company") return "/linkedin/company-posts";
  if (source.type === "search") return "/linkedin/post-search";
  throw new Error(`unsupported source type: ${source.type}`);
}

function paramsFor(source, page, postedLimit, paginationToken) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (postedLimit) params.set("postedLimit", postedLimit);
  if (paginationToken) params.set("paginationToken", paginationToken);

  if (source.type === "profile") {
    if (source.profile) params.set("profile", source.profile);
    else if (source.profileId) params.set("profileId", source.profileId);
    else if (source.profilePublicIdentifier) params.set("profilePublicIdentifier", source.profilePublicIdentifier);
    else throw new Error(`profile source ${source.name} missing profile/profileId/profilePublicIdentifier`);
  }
  if (source.type === "company") {
    if (source.company) params.set("company", source.company);
    else if (source.companyId) params.set("companyId", source.companyId);
    else if (source.companyUniversalName) params.set("companyUniversalName", source.companyUniversalName);
    else throw new Error(`company source ${source.name} missing company/companyId/companyUniversalName`);
  }
  if (source.type === "search") {
    if (!source.search) throw new Error(`search source ${source.name} missing search`);
    params.set("search", source.search);
    if (source.sortBy) params.set("sortBy", source.sortBy);
    if (source.authorsCompany) params.set("authorsCompany", source.authorsCompany);
    if (source.profile) params.set("profile", source.profile);
    if (source.company) params.set("company", source.company);
  }

  return params;
}

async function validateSources({ root, sourcesPath, mode, outDir }) {
  if (!existsSync(sourcesPath)) {
    throw new Error(`missing LinkedIn source config: ${path.relative(root, sourcesPath)}`);
  }
  const config = await readJson(sourcesPath);
  const sources = enabledSources(config);
  const errors = [];
  if (config.version !== 1) errors.push("source config version must be 1");
  if (sources.length === 0) errors.push("source config has no enabled sources");
  for (const source of sources) {
    if (!source.name) errors.push("enabled source missing name");
    if (!["profile", "company", "search"].includes(source.type)) errors.push(`${source.name || "source"} has unsupported type`);
    try {
      paramsFor(source, 1, "24h", "");
    } catch (error) {
      errors.push(error.message);
    }
  }
  const harvestKeyPresent = Boolean(String(process.env.HARVEST_API_KEY || "").trim());
  if (mode === "live" && !harvestKeyPresent) errors.push("missing required credential: HARVEST_API_KEY");

  const report = {
    ok: errors.length === 0,
    mode,
    source_count: sources.length,
    harvest_api_key_present: harvestKeyPresent,
    errors,
  };
  await writeJson(path.join(outDir, "source-validation.json"), report);
  if (errors.length) {
    throw new Error(errors.join("; "));
  }
  console.log(JSON.stringify({ ok: true, mode, source_count: sources.length, harvest_api_key_present: harvestKeyPresent }));
  return { config, sources };
}

async function fetchHarvest(source, page, postedLimit, paginationToken) {
  const key = String(process.env.HARVEST_API_KEY || "").trim();
  if (!key) throw new Error("missing required credential: HARVEST_API_KEY");
  const url = new URL(endpointFor(source), HARVEST_BASE_URL);
  url.search = paramsFor(source, page, postedLimit, paginationToken).toString();
  const response = await fetch(url, {
    headers: {
      "X-API-Key": key,
      "Accept": "application/json",
      "User-Agent": "maestro-joni-linkedin/1.0",
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`HarvestAPI request failed for ${source.name}: status=${response.status} error=${data.error || "unknown"}`);
  }
  return data;
}

async function fixtureResponse(fixture, source) {
  const response = fixture.responses?.[sourceKey(source)];
  if (!response) return { elements: [], pagination: {} };
  return response;
}

function normalizePost(item, source, capturedAt) {
  const url = item.linkedinUrl || item.socialContent?.shareUrl || "";
  const author = item.author || {};
  const engagement = item.engagement || {};
  const reactions = Array.isArray(engagement.reactions) ? engagement.reactions : [];
  const likes = Number(engagement.likes || 0);
  const comments = Number(engagement.comments || 0);
  const shares = Number(engagement.shares || 0);
  const content = contentExcerpt(item.content);
  const stableId = url || item.id || hash(`${sourceKey(source)}:${content}:${item.postedAt?.date || item.postedAgo || ""}`);

  return {
    id: String(item.id || stableId),
    dedupe_key: hash(stableId),
    linkedin_url: url,
    source: {
      id: source.source_id || source.id || "",
      type: source.type,
      name: source.name,
      tier: source.tier || "",
    },
    author: {
      name: author.name || "",
      linkedin_url: author.linkedinUrl || "",
      public_identifier: author.publicIdentifier || author.universalName || "",
      type: author.type || "",
    },
    posted_at: {
      date: item.postedAt?.date || "",
      timestamp: item.postedAt?.timestamp || null,
      text: item.postedAt?.postedAgoText || item.postedAgo || "",
    },
    content,
    content_hash: hash(content),
    engagement: {
      likes,
      comments,
      shares,
      reactions,
      total: likes + comments + shares,
    },
    captured_at: capturedAt,
  };
}

async function collectSource({ source, mode, fixture, maxPages, postedLimit, capturedAt }) {
  const posts = [];
  let paginationToken = "";
  for (let page = 1; page <= maxPages; page += 1) {
    const data = mode === "fixture"
      ? await fixtureResponse(fixture, source)
      : await fetchHarvest(source, page, postedLimit, paginationToken);
    const elements = Array.isArray(data.elements) ? data.elements : [];
    posts.push(...elements.map((item) => normalizePost(item, source, capturedAt)));
    paginationToken = data.pagination?.paginationToken || "";
    if (mode === "fixture" || !paginationToken) break;
  }
  return posts;
}

function summarize(posts, duplicatesRemoved, sources) {
  const bySourceType = {};
  for (const post of posts) {
    bySourceType[post.source.type] = (bySourceType[post.source.type] || 0) + 1;
  }
  const topPosts = [...posts]
    .sort((a, b) => b.engagement.total - a.engagement.total)
    .slice(0, 10)
    .map((post) => ({
      url: post.linkedin_url,
      author: post.author.name,
      source: post.source,
      engagement_total: post.engagement.total,
      excerpt: post.content.slice(0, 240),
    }));

  return {
    ok: true,
    captured_at: posts[0]?.captured_at || new Date().toISOString(),
    source_count: sources.length,
    posts: posts.length,
    duplicates_removed: duplicatesRemoved,
    by_source_type: bySourceType,
    top_posts: topPosts,
  };
}

function markdownSummary(summary) {
  const lines = [
    "# Joni LinkedIn Daily Capture",
    "",
    `Captured at: ${summary.captured_at}`,
    `Sources: ${summary.source_count}`,
    `Posts: ${summary.posts}`,
    `Duplicates removed: ${summary.duplicates_removed}`,
    "",
    "## Source Types",
    "",
    ...Object.entries(summary.by_source_type).map(([type, count]) => `- ${type}: ${count}`),
    "",
    "## Top Posts",
    "",
    ...summary.top_posts.map((post, idx) => [
      `${idx + 1}. ${post.author || "Unknown author"} (${post.engagement_total})`,
      `   ${post.url || "no url"}`,
      `   ${post.excerpt}`,
    ].join("\n")),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function capture(args) {
  const root = path.resolve(argValue("--root", repoRoot()));
  const sourcesPath = rel(root, argValue("--sources", "docs/operator/linkedin/joni-sources.json"));
  const outDir = rel(root, argValue("--out-dir", ".workflow/joni-linkedin/daily"));
  const mode = argValue("--mode", "live");
  const fixturePath = argValue("--fixture", "");
  const maxPages = Number.parseInt(argValue("--max-pages", "1"), 10);
  const postedLimit = argValue("--posted-limit", "24h");
  await mkdir(outDir, { recursive: true });

  const { sources } = await validateSources({ root, sourcesPath, mode, outDir });
  const fixture = mode === "fixture" ? await readJson(rel(root, fixturePath)) : {};
  const capturedAt = new Date().toISOString();
  const rawPosts = [];

  for (const source of sources) {
    rawPosts.push(...await collectSource({ source, mode, fixture, maxPages, postedLimit, capturedAt }));
  }

  const seen = new Set();
  const posts = [];
  for (const post of rawPosts) {
    if (seen.has(post.dedupe_key)) continue;
    seen.add(post.dedupe_key);
    posts.push(post);
  }
  const duplicatesRemoved = rawPosts.length - posts.length;
  const summary = summarize(posts, duplicatesRemoved, sources);

  await writeFile(path.join(outDir, "posts.jsonl"), posts.map((post) => JSON.stringify(post)).join("\n") + (posts.length ? "\n" : ""));
  await writeJson(path.join(outDir, "posts.json"), { posts });
  await writeJson(path.join(outDir, "summary.json"), summary);
  await writeFile(path.join(outDir, "summary.md"), markdownSummary(summary));
  console.log(JSON.stringify({ ok: true, posts: posts.length, duplicates_removed: duplicatesRemoved, out_dir: path.relative(root, outDir) }));
}

async function verifyReview() {
  const root = path.resolve(argValue("--root", repoRoot()));
  const outDir = rel(root, argValue("--out-dir", ".workflow/joni-linkedin/daily"));
  const reviewPath = path.join(outDir, "ai-review.md");
  const text = await readFile(reviewPath, "utf8");
  const required = ["## Patterns", "## Outperforming Posts", "## Draft Candidates", "## Risks"];
  const missing = required.filter((section) => !text.includes(section));
  if (missing.length) throw new Error(`AI review missing required section(s): ${missing.join(", ")}`);
  if (/publish now|post now|send dm|connect with/i.test(text)) {
    throw new Error("AI review contains disallowed mutation recommendation");
  }
  console.log(JSON.stringify({ ok: true, review: path.relative(root, reviewPath) }));
}

async function appendLedger() {
  const root = path.resolve(argValue("--root", repoRoot()));
  const outDir = rel(root, argValue("--out-dir", ".workflow/joni-linkedin/daily"));
  const ledgerPath = rel(root, argValue("--ledger", "docs/operator/linkedin/JONI-LINKEDIN-LEDGER.md"));
  const summary = JSON.parse(await readFile(path.join(outDir, "summary.json"), "utf8"));
  const reviewExists = existsSync(path.join(outDir, "ai-review.md"));
  const entry = [
    "",
    `## Run ${summary.captured_at}`,
    "",
    `- Posts captured: ${summary.posts}`,
    `- Duplicates removed: ${summary.duplicates_removed}`,
    `- Source types: ${Object.entries(summary.by_source_type).map(([type, count]) => `${type}=${count}`).join(", ") || "none"}`,
    `- AI review: ${reviewExists ? ".workflow/joni-linkedin/daily/ai-review.md" : "not generated"}`,
    "",
  ].join("\n");
  await appendFile(ledgerPath, entry);
  console.log(JSON.stringify({ ok: true, ledger: path.relative(root, ledgerPath) }));
}

async function main() {
  const command = process.argv[2] || "";
  const root = path.resolve(argValue("--root", repoRoot()));
  const sourcesPath = rel(root, argValue("--sources", "docs/operator/linkedin/joni-sources.json"));
  const outDir = rel(root, argValue("--out-dir", ".workflow/joni-linkedin/daily"));
  const mode = argValue("--mode", "live");

  try {
    if (command === "validate") {
      await mkdir(outDir, { recursive: true });
      await validateSources({ root, sourcesPath, mode, outDir });
    } else if (command === "capture") {
      await capture(process.argv.slice(3));
    } else if (command === "verify-review") {
      await verifyReview();
    } else if (command === "ledger") {
      await appendLedger();
    } else {
      throw new Error("usage: joni-linkedin-capture.mjs validate|capture|verify-review|ledger");
    }
  } catch (error) {
    console.error(String(error.message || error).replace(/x-api-key|bearer|secret-value-not-printed/gi, "[redacted]"));
    process.exit(1);
  }
}

await main();
