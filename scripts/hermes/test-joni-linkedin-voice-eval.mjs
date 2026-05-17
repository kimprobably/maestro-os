import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const scriptPath = path.join(repoRoot, "scripts/hermes/joni-linkedin-voice-eval.mjs");

async function tempPost(name, content) {
  const root = await mkdtemp(path.join(os.tmpdir(), "joni-voice-"));
  const file = path.join(root, name);
  await writeFile(file, `${content.trim()}\n`);
  return file;
}

function runJson(args, options = {}) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
  const output = result.stdout.trim();
  assert.ok(output, result.stderr || "expected JSON output");
  return {
    status: result.status,
    stderr: result.stderr,
    json: JSON.parse(output),
  };
}

test("voice lint passes a specific B2B founder post with bounded roughness", async () => {
  const file = await tempPost(
    "good.md",
    `
I would not add another LinkedIn post until the follow-up path can turn attention into pipeline.

If you're a B2B founder selling through your own audience, this is usually where the leak starts.

The post works. Someone replies. A useful objection shows up in the comments. A possible sales angle appears.

Then it disappears into Slack.

That is not a content problem. It is an operating loop problem.

The useful setup is boring:

The post idea enters in one place.
Replies and questions get captured.
The founder reviews the useful ones once a week.
The sales team knows what to do next.

tbh, that is the part most tools skip.

If LinkedIn is creating activity but not pipeline, I would fix that loop before asking for more posts.
`,
  );

  const { status, json } = runJson(["lint", "--file", file, "--target", "B2B founder", "--pain", "pipeline"]);

  assert.equal(status, 0);
  assert.equal(json.passes, true);
  assert.equal(json.checks.target_reader.passes, true);
  assert.equal(json.checks.pain_point.passes, true);
  assert.equal(json.checks.roughness.passes, true);
  assert.ok(json.hook.score >= 7, `expected strong hook, got ${json.hook.score}`);
});

test("voice lint fails when roughness is too high", async () => {
  const file = await tempPost(
    "overrough.md",
    `
i would not add another linkedin post rn.

bc the pipeline path is cooked...

if you're a B2B founder, the content is not really the problem tho.

kinda obvious once you see it, tbh.

the comments show up, someone says something useful, and then everyone just vibes in Slack.

wanna fix pipeline from LinkedIn? fix the loop first.
`,
  );

  const { status, json } = runJson(["lint", "--file", file, "--target", "B2B founder", "--pain", "pipeline"]);

  assert.equal(status, 1);
  assert.equal(json.passes, false);
  assert.equal(json.checks.roughness.passes, false);
  assert.match(json.issues.join("\n"), /roughness/i);
});

test("voice lint fails when a long post has no human roughness", async () => {
  const file = await tempPost(
    "too-polished.md",
    `
I would not add another LinkedIn post until the follow-up path can turn attention into pipeline.

If you are a B2B founder selling through your own audience, this is usually where the leak starts.

The post works. Someone replies. A useful objection shows up in the comments. A possible sales angle appears.

Then it disappears into Slack.

That is not a content problem. It is an operating loop problem.

The useful setup is boring:

The post idea enters in one place.
Replies and questions get captured.
The founder reviews the useful ones once a week.
The sales team knows what to do next.

If LinkedIn is creating activity but not pipeline, I would fix that loop before asking for more posts.
`,
  );

  const { status, json } = runJson(["lint", "--file", file, "--target", "B2B founder", "--pain", "pipeline"]);

  assert.equal(status, 1);
  assert.equal(json.checks.roughness.passes, false);
  assert.match(json.issues.join("\n"), /too polished|roughness/i);
});

test("voice lint fails vague posts that do not name target reader and pain early", async () => {
  const file = await tempPost(
    "vague.md",
    `
The handoff is usually the problem.

Most teams add a new tool and expect behavior to change.

Someone writes prompts. Someone makes a doc. Everyone agrees it seems useful.

Two weeks later, the same questions are back.

That means the process needs to be clearer.
`,
  );

  const { status, json } = runJson(["lint", "--file", file, "--target", "B2B founder", "--pain", "pipeline"]);

  assert.equal(status, 1);
  assert.equal(json.checks.target_reader.passes, false);
  assert.equal(json.checks.pain_point.passes, false);
  assert.equal(json.checks.hook_clarity.passes, false);
});

test("compare rejects rewrites that improve roughness but make the hook less clear", async () => {
  const before = await tempPost(
    "before.md",
    `
I would not add another LinkedIn post until the follow-up path can turn attention into pipeline.

If you're a B2B founder, this is usually where the leak starts.

The post works. Someone replies. A useful objection shows up in the comments.

Then it disappears into Slack.

tbh, that is not a content problem. It is an operating loop problem.
`,
  );
  const after = await tempPost(
    "after.md",
    `
The handoff is rarely the thing people inspect.

If you're a B2B founder, this is usually where the leak starts.

The post works. Someone replies. A useful objection shows up in the comments.

Then it disappears into Slack.

That is not a content problem. It is an operating loop problem.
`,
  );

  const { status, json } = runJson([
    "compare",
    "--before",
    before,
    "--after",
    after,
    "--target",
    "B2B founder",
    "--pain",
    "pipeline",
  ]);

  assert.equal(status, 1);
  assert.equal(json.passes, false);
  assert.equal(json.checks.hook_regression.passes, false);
  assert.match(json.issues.join("\n"), /hook/i);
});
