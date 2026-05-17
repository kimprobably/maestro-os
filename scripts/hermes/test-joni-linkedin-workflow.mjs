import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const scriptPath = path.join(repoRoot, "scripts/hermes/joni-linkedin-capture.mjs");

async function tempRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "joni-linkedin-"));
  await mkdir(path.join(root, "docs/operator/linkedin"), { recursive: true });
  await mkdir(path.join(root, ".workflow/joni-linkedin/daily"), { recursive: true });
  await writeFile(
    path.join(root, "docs/operator/linkedin/JONI-LINKEDIN-LEDGER.md"),
    "# Joni LinkedIn Ledger\n\n## Runs\n",
  );
  return root;
}

test("joni linkedin capture normalizes fixture HarvestAPI posts and dedupes by URL", async () => {
  const root = await tempRoot();
  const sources = {
    version: 1,
    sources: [
      {
        type: "profile",
        name: "Tim",
        profile: "https://www.linkedin.com/in/tim-example",
        enabled: true,
      },
      {
        type: "search",
        name: "GTM operators",
        search: "gtm operators",
        enabled: true,
      },
    ],
  };
  const fixture = {
    responses: {
      "profile:Tim": {
        elements: [
          {
            id: "post-1",
            content: "Specific GTM systems beat generic playbooks.",
            linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:1",
            author: { name: "Tim", linkedinUrl: "https://www.linkedin.com/in/tim-example" },
            postedAt: { date: "2026-05-16", timestamp: 1778889600000 },
            engagement: { likes: 12, comments: 4, shares: 1 },
          },
        ],
      },
      "search:GTM operators": {
        elements: [
          {
            id: "duplicate-post-1",
            content: "Specific GTM systems beat generic playbooks.",
            linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:1",
            author: { name: "Tim", linkedinUrl: "https://www.linkedin.com/in/tim-example" },
            postedAt: { date: "2026-05-16", timestamp: 1778889600000 },
            engagement: { likes: 12, comments: 4, shares: 1 },
          },
          {
            id: "post-2",
            content: "Pipeline reviews need artifacts, not vibes.",
            linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:2",
            author: { name: "Operator", linkedinUrl: "https://www.linkedin.com/in/operator" },
            postedAt: { date: "2026-05-16", timestamp: 1778893200000 },
            engagement: { likes: 20, comments: 2, shares: 0 },
          },
        ],
      },
    },
  };
  const sourcePath = path.join(root, "docs/operator/linkedin/joni-sources.json");
  const fixturePath = path.join(root, "fixture.json");
  await writeFile(sourcePath, JSON.stringify(sources, null, 2));
  await writeFile(fixturePath, JSON.stringify(fixture, null, 2));

  const capture = spawnSync(
    process.execPath,
    [
      scriptPath,
      "capture",
      "--root",
      root,
      "--sources",
      sourcePath,
      "--out-dir",
      ".workflow/joni-linkedin/daily",
      "--mode",
      "fixture",
      "--fixture",
      fixturePath,
    ],
    { encoding: "utf8", env: { ...process.env, HARVEST_API_KEY: "secret-value-not-printed" } },
  );
  assert.equal(capture.status, 0, capture.stderr);
  assert.doesNotMatch(capture.stdout + capture.stderr, /secret-value-not-printed/);

  const summary = JSON.parse(
    await readFile(path.join(root, ".workflow/joni-linkedin/daily/summary.json"), "utf8"),
  );
  const posts = (await readFile(path.join(root, ".workflow/joni-linkedin/daily/posts.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  assert.equal(summary.posts, 2);
  assert.equal(summary.duplicates_removed, 1);
  assert.deepEqual(summary.by_source_type, { profile: 1, search: 1 });
  assert.equal(posts[0].engagement.total, 17);
  assert.equal(posts[1].engagement.total, 22);
  assert.ok(posts.every((post) => post.content_hash && post.captured_at));
});

test("joni linkedin capture reports missing HarvestAPI key by name only", async () => {
  const root = await tempRoot();
  const sourcePath = path.join(root, "docs/operator/linkedin/joni-sources.json");
  await writeFile(
    sourcePath,
    JSON.stringify({ version: 1, sources: [{ type: "search", name: "GTM", search: "gtm", enabled: true }] }),
  );

  const result = spawnSync(
    process.execPath,
    [scriptPath, "validate", "--root", root, "--sources", sourcePath, "--mode", "live"],
    { encoding: "utf8", env: { ...process.env, HARVEST_API_KEY: "" } },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /HARVEST_API_KEY/);
  assert.doesNotMatch(result.stdout + result.stderr, /secret|x-api-key|Bearer/i);
});

test("joni linkedin daily workflow keeps capture deterministic and AI review downstream", async () => {
  const workflow = await readFile(path.join(repoRoot, "workflows/hermes/joni-linkedin-daily.fabro"), "utf8");
  const runConfig = await readFile(path.join(repoRoot, "workflows/hermes/joni-linkedin-daily.toml"), "utf8");
  const prompt = await readFile(path.join(repoRoot, "prompts/hermes/joni-linkedin-ai-review.md"), "utf8");

  assert.match(workflow, /ensure_feed_watchlist/);
  assert.match(workflow, /select_daily_sources/);
  assert.match(workflow, /validate_harvest_sources/);
  assert.match(workflow, /capture_linkedin_posts/);
  assert.match(workflow, /record_feed_snapshots/);
  assert.match(workflow, /score_feed_candidates/);
  assert.match(workflow, /summarize_capture/);
  assert.match(workflow, /ai_pattern_review/);
  assert.match(workflow, /select_daily_sources -> validate_harvest_sources/);
  assert.match(workflow, /capture_linkedin_posts -> summarize_capture/);
  assert.match(workflow, /score_feed_candidates -> ai_pattern_review/);
  assert.match(workflow, /verify_ai_review/);
  assert.match(runConfig, /HARVEST_API_KEY = "{{ env\.HARVEST_API_KEY }}"/);
  assert.match(runConfig, /feed_db = "\/data\/\.hermes\/profiles\/joni\/state\/linkedin-feed\/joni-linkedin-feed\.sqlite"/);
  assert.match(prompt, /Do not invent/);
  assert.match(prompt, /feed-candidates\.md/);
  assert.match(prompt, /Do not recommend publishing/);
});
