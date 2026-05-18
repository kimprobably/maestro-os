#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/iphone-app-factory/run-codex-prompt.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "run-codex-prompt-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeFakeCodex(dir, body) {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  const codex = join(bin, "codex");
  writeFileSync(codex, `#!/usr/bin/env sh\n${body}\n`);
  spawnSync("chmod", ["755", codex]);
  return bin;
}

function run(cwd, args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("run-codex-prompt renders Fabro input placeholders and invokes Codex CLI", () => {
  withTempDir((dir) => {
    const promptPath = join(dir, "prompt.md");
    const capturePath = join(dir, "captured-prompt.md");
    writeFileSync(
      promptPath,
      "Implement {{ inputs.app_dir|default(\"apps/generated-iphone-app\") }} on {{ inputs.run_branch|default('main') }}.",
    );
    const fakeBin = writeFakeCodex(
      dir,
      "printf '%s\\n' \"$@\" > \"$CODEX_ARGS_CAPTURE\"; cat > \"$CODEX_PROMPT_CAPTURE\"; printf 'codex ok\\n'",
    );

    const result = run(
      dir,
      [
        "--prompt",
        promptPath,
        "--stage",
        "visual-system",
        "--out",
        ".workflow/codex/visual.json",
        "--timeout-ms",
        "5000",
      ],
      {
        PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
        CODEX_ARGS_CAPTURE: join(dir, "args.txt"),
        CODEX_PROMPT_CAPTURE: capturePath,
        UX_APP_DIR: "apps/waketask-ios",
        UX_RUN_BRANCH: "ux-studio/test",
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/codex/visual.json"), "utf8"));
    assert.equal(report.ok, true);
    assert.equal(report.stage, "visual-system");
    assert.equal(report.model, "gpt-5.3-codex");
    assert.match(readFileSync(capturePath, "utf8"), /apps\/waketask-ios/);
    assert.match(readFileSync(capturePath, "utf8"), /ux-studio\/test/);
    assert.match(readFileSync(join(dir, "args.txt"), "utf8"), /exec/);
  });
});

test("run-codex-prompt redacts Codex output on failure", () => {
  withTempDir((dir) => {
    const promptPath = join(dir, "prompt.md");
    writeFileSync(promptPath, "Fail safely.");
    const fakeBin = writeFakeCodex(
      dir,
      "cat >/dev/null; printf '%s\\n' 'api_key = sk-or-v1-test-secret-value' >&2; exit 7",
    );

    const result = run(
      dir,
      ["--prompt", promptPath, "--stage", "screen-flows", "--out", ".workflow/codex/screen.json"],
      {
        PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
      },
    );

    assert.notEqual(result.status, 0);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /secret-looking|status 7|codex/i);
    assert.doesNotMatch(output, /sk-or-v1-test-secret-value/);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/codex/screen.json"), "utf8"));
    assert.equal(report.ok, false);
    assert.doesNotMatch(JSON.stringify(report), /sk-or-v1-test-secret-value/);
  });
});

test("run-codex-prompt redacts secret-like rendered input placeholders", () => {
  withTempDir((dir) => {
    const promptPath = join(dir, "prompt.md");
    const capturePath = join(dir, "captured-prompt.md");
    writeFileSync(promptPath, "Use {{ inputs.mobbin_password|default('missing') }} safely.");
    const fakeBin = writeFakeCodex(
      dir,
      "cat > \"$CODEX_PROMPT_CAPTURE\"; printf 'codex ok\\n'",
    );

    const result = run(
      dir,
      ["--prompt", promptPath, "--stage", "secret-render", "--out", ".workflow/codex/secret.json"],
      {
        PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
        CODEX_PROMPT_CAPTURE: capturePath,
        UX_MOBBIN_PASSWORD: "mobbin-secret-value",
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(readFileSync(capturePath, "utf8"), /\[redacted\]/);
    assert.doesNotMatch(readFileSync(capturePath, "utf8"), /mobbin-secret-value/);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/codex/secret.json"), "utf8"));
    assert.doesNotMatch(JSON.stringify(report), /mobbin-secret-value/);
  });
});

test("run-codex-prompt installs Codex auth from CODEX_AUTH_JSON_BASE64 without printing it", () => {
  withTempDir((dir) => {
    const promptPath = join(dir, "prompt.md");
    const home = join(dir, "home");
    const codexHome = join(home, ".codex");
    const authJson = '{"tokens":{"id_token":"codex-secret-value"}}';
    writeFileSync(promptPath, "Check auth.");
    const fakeBin = writeFakeCodex(
      dir,
      "test -f \"$HOME/.codex/auth.json\" || exit 12; cat >/dev/null; printf 'codex ok\\n'",
    );

    const result = run(
      dir,
      ["--prompt", promptPath, "--stage", "auth-install", "--out", ".workflow/codex/auth.json"],
      {
        PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
        HOME: home,
        CODEX_AUTH_JSON_BASE64: Buffer.from(authJson).toString("base64"),
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(existsSync(join(codexHome, "auth.json")));
    assert.equal(readFileSync(join(codexHome, "auth.json"), "utf8"), authJson);
    assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /codex-secret-value/);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/codex/auth.json"), "utf8"));
    assert.equal(report.codex_auth_installed, true);
    assert.doesNotMatch(JSON.stringify(report), /codex-secret-value/);
  });
});

test("run-codex-prompt configures Mobbin MCP for Mobbin research stages", () => {
  withTempDir((dir) => {
    const promptPath = join(dir, "prompt.md");
    const capturePath = join(dir, "captured-commands.txt");
    writeFileSync(promptPath, "Use Mobbin MCP for pattern research.");
    const fakeBin = writeFakeCodex(
      dir,
      [
        "printf '%s\\n' \"$@\" >> \"$CODEX_COMMAND_CAPTURE\"",
        "case \"$*\" in *\"mcp add mobbin\"*) exit 0;; *\"mcp list\"*) printf '%s\\n' 'mobbin https://api.mobbin.com/mcp'; exit 0;; esac",
        "cat >/dev/null; printf 'codex ok\\n'",
      ].join("\n"),
    );

    const result = run(
      dir,
      ["--prompt", promptPath, "--stage", "mobbin-mcp-research", "--out", ".workflow/codex/mobbin.json"],
      {
        PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
        CODEX_COMMAND_CAPTURE: capturePath,
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const commands = readFileSync(capturePath, "utf8");
    assert.match(commands, /mcp\nadd\nmobbin\n--url\nhttps:\/\/api\.mobbin\.com\/mcp/);
    assert.match(commands, /mcp\nlist/);
    assert.match(commands, /exec/);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/codex/mobbin.json"), "utf8"));
    assert.equal(report.codex_mobbin_mcp.configured, true);
  });
});

test("run-codex-prompt installs Codex MCP credentials without printing them", () => {
  withTempDir((dir) => {
    const promptPath = join(dir, "prompt.md");
    const home = join(dir, "home");
    const codexHome = join(home, ".codex");
    const credentialsJson = '{"mobbin":{"access_token":"codex-mcp-secret-value"}}';
    writeFileSync(promptPath, "Check MCP credentials.");
    const fakeBin = writeFakeCodex(
      dir,
      "test -f \"$HOME/.codex/.credentials.json\" || exit 13; cat >/dev/null; printf 'codex ok\\n'",
    );

    const result = run(
      dir,
      ["--prompt", promptPath, "--stage", "mcp-state-install", "--out", ".workflow/codex/mcp-state.json"],
      {
        PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
        HOME: home,
        CODEX_MCP_CREDENTIALS_JSON_BASE64: Buffer.from(credentialsJson).toString("base64"),
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(existsSync(join(codexHome, ".credentials.json")));
    assert.equal(readFileSync(join(codexHome, ".credentials.json"), "utf8"), credentialsJson);
    assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /codex-mcp-secret-value/);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/codex/mcp-state.json"), "utf8"));
    assert.equal(report.codex_mcp_credentials_installed, true);
    assert.doesNotMatch(JSON.stringify(report), /codex-mcp-secret-value/);
  });
});

test("run-codex-prompt evaluates call artifacts when launched outside repo cwd", () => {
  withTempDir((dir) => {
    const promptPath = join(dir, "prompt.md");
    const lastMessagePath = join(dir, ".workflow/codex/eval.last-message.md");
    const evalOutPath = join(dir, "reports/evals/local/test.call.json");
    writeFileSync(promptPath, "Evaluate this model call.");
    mkdirSync(dirname(lastMessagePath), { recursive: true });
    const fakeBin = writeFakeCodex(
      dir,
      [
        "while [ \"$#\" -gt 0 ]; do",
        "  if [ \"$1\" = \"--output-last-message\" ]; then shift; printf '%s\\n' 'Implemented the requested feature and wrote verification artifacts.' > \"$1\"; fi",
        "  shift",
        "done",
        "cat >/dev/null; printf 'codex ok\\n'",
      ].join("\n"),
    );

    const result = run(
      dir,
      [
        "--prompt",
        promptPath,
        "--stage",
        "eval-hook",
        "--out",
        ".workflow/codex/eval.json",
        "--last-message-out",
        lastMessagePath,
        "--eval-id",
        "iphone-feature.implementation.call",
        "--eval-out",
        evalOutPath,
      ],
      {
        PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(readFileSync(join(dir, ".workflow/codex/eval.json"), "utf8"));
    const evalResult = JSON.parse(readFileSync(evalOutPath, "utf8"));
    assert.equal(report.eval_id, "iphone-feature.implementation.call");
    assert.equal(report.normalized_eval_result_path, evalOutPath);
    assert.equal(evalResult.gate_status, "passed");
  });
});
