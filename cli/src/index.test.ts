import { describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(import.meta.dir, "../..");
const fixturesDir = join(repoRoot, "tmp", "workflow-quality-tests");

function runMaestro(...args: string[]) {
  return spawnSync(process.execPath, ["cli/src/index.ts", ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runMaestroWithEnv(args: string[], env: Record<string, string>) {
  return spawnSync(process.execPath, ["cli/src/index.ts", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, ...env, MAESTRO_SKIP_DOTENV: "1" }
  });
}

function writeExecutable(path: string, content: string) {
  writeFileSync(path, content);
  chmodSync(path, 0o755);
}

function writeWorkflow(name: string, edges: string) {
  mkdirSync(fixturesDir, { recursive: true });
  const path = join(fixturesDir, `${name}.fabro`);
  writeFileSync(path, `digraph ${name} {
    graph [
        goal="Validate workflow routing",
        persona="test-bot",
        inputs="none",
        outputs="none",
        model_stylesheet="
            *       { provider: openrouter; model: anthropic/claude-haiku-4-5; reasoning_effort: low; }
            .coding { backend: cli; provider: anthropic; model: claude-sonnet-4-5; reasoning_effort: high; }
            .review { backend: cli; provider: anthropic; model: claude-sonnet-4-5; reasoning_effort: high; }
        "
    ]
    rankdir=LR

    start [shape=Mdiamond, label="Start"]
    exit [shape=Msquare, label="Exit"]
    validate_post [label="Validate Post", shape=parallelogram, script="echo ok"]
    notify_post_failure [label="Notify Post Failure", shape=parallelogram, script="echo failed"]

${edges}
}
`);
  return path;
}

describe("workflow-quality routing checks", () => {
  test("rejects a node with both unconditional success and failure-labeled edges", () => {
    const path = writeWorkflow("AmbiguousFailureRouting", `
    start -> validate_post
    validate_post -> exit
    validate_post -> notify_post_failure [label="Failed"]
    notify_post_failure -> exit
`);

    const result = runMaestro("verify", "workflow-quality", path, "--json");

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("ambiguous_failure_routing");
  });

  test("accepts explicit outcome success edges with failure fallback edges", () => {
    const path = writeWorkflow("ExplicitFailureRouting", `
    start -> validate_post
    validate_post -> exit [condition="outcome=succeeded"]
    validate_post -> notify_post_failure [label="Failed"]
    notify_post_failure -> exit
`);

    const result = runMaestro("verify", "workflow-quality", path, "--json");

    expect(result.status).toBe(0);
  });

  test("falls back to dot validation for Fabro workflows when fabro CLI is unavailable", () => {
    const binDir = join(repoRoot, "tmp", "workflow-quality-dot-bin");
    mkdirSync(binDir, { recursive: true });
    writeExecutable(
      join(binDir, "dot"),
      `#!/usr/bin/env sh
if [ "$1" = "-Tdot" ] && [ -n "$2" ]; then
  printf 'digraph ok {}\\n'
  exit 0
fi
exit 1
`
    );
    const path = writeWorkflow("DotFallbackRouting", `
    start -> validate_post
    validate_post -> exit [condition="outcome=succeeded"]
`);

    const result = runMaestroWithEnv(["verify", "workflow-quality", path, "--json"], {
      PATH: `${binDir}:/usr/bin:/bin`
    });

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.data.validation.validator).toBe("dot");
  });
});

describe("quality stack doctor", () => {
  test("passes when required local tools and integrations are present", () => {
    const binDir = join(repoRoot, "tmp", "quality-stack-doctor-bin");
    mkdirSync(binDir, { recursive: true });
    writeExecutable(
      join(binDir, "fabro"),
      `#!/usr/bin/env sh
case "$1 $2" in
  "server status") printf '{"status":"running"}\\n' ;;
  "settings --json") printf '{"server":{"server":{"integrations":{"github":{"enabled":true,"strategy":"token"}},"auth":{"methods":["dev-token"]}}}}\\n' ;;
  "model list") printf '[{"id":"moonshotai/kimi-k2.6","provider":"openrouter","configured":true},{"id":"google/gemini-3.1-flash-lite","provider":"openrouter","configured":true},{"id":"google/gemini-3.1-pro-preview","provider":"openrouter","configured":true},{"id":"qwen/qwen3.6-plus","provider":"openrouter","configured":true},{"id":"deepseek/deepseek-v4-pro","provider":"openrouter","configured":true},{"id":"deepseek/deepseek-v4-flash","provider":"openrouter","configured":true}]\\n' ;;
  *) printf 'fabro stub\\n' ;;
esac
`
    );
    writeExecutable(join(binDir, "qlty"), "#!/usr/bin/env sh\nprintf 'qlty stub\\n'\n");
    writeExecutable(
      join(binDir, "spec-kitty"),
      `#!/usr/bin/env sh
if [ "$1" = "verify-setup" ]; then
  printf '{"managed_skills":{"status":"ok","missing":0,"drifted":0,"errors":0}}\\n'
else
  printf 'spec-kitty-cli version 3.1.8\\n'
fi
`
    );
    writeExecutable(join(binDir, "daytona"), "#!/usr/bin/env sh\nprintf 'daytona stub\\n'\n");
    writeExecutable(join(binDir, "gh"), "#!/usr/bin/env sh\nexit 0\n");
    writeExecutable(join(binDir, "claude"), "#!/usr/bin/env sh\nprintf 'claude stub\\n'\n");
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env sh\nprintf 'codex stub\\n'\n");

    const result = runMaestroWithEnv(["doctor", "quality-stack"], {
      PATH: `${binDir}:/usr/bin:/bin`,
      FABRO_SLACK_BOT_TOKEN: "xoxb-test",
      FABRO_SLACK_APP_TOKEN: "xapp-test",
      FABRO_SLACK_CHANNEL_ID: "C123",
      OPENROUTER_API_KEY: "sk-or-test",
      DAYTONA_API_KEY: "dtn_test",
      LINEAR_API_KEY: "lin_api_test",
      MAESTRO_LINEAR_SKIP_NETWORK: "1"
    });

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.data.failed).toBe(0);
    expect(payload.data.checks.some((check: { id: string }) => check.id === "openrouter_models")).toBe(true);
    expect(payload.data.checks.some((check: { id: string }) => check.id === "linear_api")).toBe(true);
  });

  test("fails without required commands", () => {
    const binDir = join(repoRoot, "tmp", "quality-stack-doctor-empty-bin");
    mkdirSync(binDir, { recursive: true });

    const result = runMaestroWithEnv(["doctor", "quality-stack"], {
      PATH: `${binDir}:/usr/bin:/bin`
    });

    expect(result.status).toBe(1);
    const payload = JSON.parse(result.stdout);
    expect(payload.ok).toBe(false);
    expect(payload.data.failed).toBeGreaterThan(0);
  });
});

describe("outreach validators", () => {
  test("email-deliverable rejects invalid addresses before DNS lookup", () => {
    const result = runMaestro("verify", "email-deliverable", "not-an-email");

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("invalid_email_format");
  });

  test("email-deliverable can run format-only for fixture domains", () => {
    const result = runMaestro("verify", "email-deliverable", "maya@example.com", "--skip-mx");

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.data.deliverable).toBe(true);
    expect(payload.data.reason).toBe("mx_skipped");
  });

  test("banned phrase validator passes when any variant is clean", () => {
    mkdirSync(fixturesDir, { recursive: true });
    const path = join(fixturesDir, "variants-banned.json");
    writeFileSync(
      path,
      JSON.stringify({
        variants: [
          { id: "a", body: "I noticed your funding and want to leverage AI-powered synergy." },
          { id: "b", body: "Congrats on the channel launch. Worth comparing list QA notes?" }
        ]
      })
    );

    const result = runMaestro("verify", "outreach-banned-phrases", path, "--mode", "any");

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.data.passed).toBe(true);
    expect(payload.data.entries.find((entry: { id: string }) => entry.id === "b").passed).toBe(true);
  });

  test("length validator fails when no variant fits thresholds", () => {
    mkdirSync(fixturesDir, { recursive: true });
    const path = join(fixturesDir, "variants-length.json");
    writeFileSync(
      path,
      JSON.stringify({
        variants: [
          { id: "a", body: "one two three four five six" },
          { id: "b", body: "one two three four five six seven" }
        ]
      })
    );

    const result = runMaestro("verify", "outreach-length", path, "--max-words", "5", "--mode", "any");

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("outreach_length_failed");
  });

  test("dedup-lead rejects invalid emails before database access", () => {
    const result = runMaestroWithEnv(["verify", "dedup-lead", "not-an-email"], {
      DATABASE_URL: ""
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("invalid_email_format");
  });
});

describe("spec-quality validator", () => {
  test("accepts descriptive verification and reviewer headings", () => {
    mkdirSync(fixturesDir, { recursive: true });
    const path = join(fixturesDir, "descriptive-headings-spec.md");
    writeFileSync(
      path,
      `# Generated Spec

## Purpose
Build the thing.

## Context
This is local.

## Non-goals
No deploy.

## Inputs
One goal.

## Outputs
One app.

## Functional Requirements
- It works.

## Acceptance Criteria
- Tests pass.

## Risks and STOP Gates
- No irreversible actions without STOP.

## Deterministic Verification Plan
- Run Qlty, lint, typecheck, test, and build.

## Reviewer Fanout Plan
- Correctness, test, and security reviewers.

## ADR Decision
ADR NOT REQUIRED.

Spec Kitty work package: wp-001.
`
    );

    const result = runMaestro("verify", "spec-quality", path);

    expect(result.status).toBe(0);
  });
});
