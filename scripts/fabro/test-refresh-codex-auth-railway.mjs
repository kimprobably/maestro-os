#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = join(repoRoot, "scripts/fabro/refresh-codex-auth-railway.mjs");

function run(args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function withFakeCodexHome(fn) {
  const dir = mkdtempSync(join(tmpdir(), "codex-auth-"));
  const codexHome = join(dir, ".codex");
  try {
    mkdirSync(codexHome);
    writeFileSync(
      join(codexHome, "auth.json"),
      JSON.stringify({ refresh_token: "secret-refresh" }),
    );
    writeFileSync(
      join(codexHome, ".credentials.json"),
      JSON.stringify({ mobbin: { access_token: "secret-mcp" } }),
    );
    return fn({ dir, codexHome });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function output(result) {
  return `${result.stdout || ""}${result.stderr || ""}`;
}

test("refresh-codex-auth validates and redacts local Codex auth", () => {
  withFakeCodexHome(({ codexHome }) => {
    const result = run(["--codex-home", codexHome, "--service", "fabro-maestro", "--dry-run"]);

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.variables.length, 2);
    assert.deepEqual(payload.variables.map((item) => item.key), [
      "CODEX_AUTH_JSON_BASE64",
      "CODEX_MCP_CREDENTIALS_JSON_BASE64",
    ]);
    assert.match(String(payload.variables[0].source), /auth\.json$/);
    assert.match(String(payload.variables[1].source), /\.credentials\.json$/);
    assert.doesNotMatch(output(result), /secret-refresh|secret-mcp/);
  });
});

test("refresh-codex-auth sends secret values through Railway stdin", () => {
  withFakeCodexHome(({ dir, codexHome }) => {
    const bin = join(dir, "bin");
    const log = join(dir, "railway.log");
    mkdirSync(bin);
    writeFileSync(
      join(bin, "railway"),
      `#!/usr/bin/env node
const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
fs.appendFileSync(${JSON.stringify(log)}, process.argv.slice(2).join(" ") + " stdin=" + input.length + "\\n");
`,
      { mode: 0o755 },
    );

    const result = run(
      ["--codex-home", codexHome, "--service", "fabro-maestro", "--environment", "production"],
      {
        PATH: `${bin}:${process.env.PATH}`,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const logged = readFileSync(log, "utf8");
    assert.match(logged, /variable set CODEX_AUTH_JSON_BASE64 --stdin/);
    assert.match(logged, /variable set CODEX_MCP_CREDENTIALS_JSON_BASE64 --stdin/);
    assert.doesNotMatch(logged, /secret-refresh|secret-mcp/);
    assert.doesNotMatch(output(result), /secret-refresh|secret-mcp/);
  });
});

test("refresh-codex-auth redeploys the target Railway service when requested", () => {
  withFakeCodexHome(({ dir, codexHome }) => {
    const bin = join(dir, "bin");
    const log = join(dir, "railway.log");
    mkdirSync(bin);
    writeFileSync(
      join(bin, "railway"),
      `#!/usr/bin/env node
const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
fs.appendFileSync(${JSON.stringify(log)}, process.argv.slice(2).join(" ") + " stdin=" + input.length + "\\n");
`,
      { mode: 0o755 },
    );

    const result = run(
      ["--codex-home", codexHome, "--service", "fabro-maestro", "--environment", "production", "--redeploy"],
      {
        PATH: `${bin}:${process.env.PATH}`,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const logged = readFileSync(log, "utf8");
    assert.match(logged, /variable set CODEX_AUTH_JSON_BASE64 --stdin --service fabro-maestro --environment production --skip-deploys/);
    assert.match(logged, /service redeploy --service fabro-maestro --yes/);
    assert.doesNotMatch(logged, /service redeploy .*--environment/);
    assert.doesNotMatch(output(result), /secret-refresh|secret-mcp/);
  });
});

test("refresh-codex-auth does not print stdin secrets if Railway fails", () => {
  withFakeCodexHome(({ dir, codexHome }) => {
    const bin = join(dir, "bin");
    mkdirSync(bin);
    writeFileSync(
      join(bin, "railway"),
      `#!/usr/bin/env node
const fs = require("fs");
process.stderr.write(fs.readFileSync(0, "utf8"));
process.exit(1);
`,
      { mode: 0o755 },
    );
    const authBase64 = Buffer.from(
      JSON.stringify({ refresh_token: "secret-refresh" }),
      "utf8",
    ).toString("base64");

    const result = run(["--codex-home", codexHome, "--service", "fabro-maestro"], {
      PATH: `${bin}:${process.env.PATH}`,
    });

    assert.notEqual(result.status, 0);
    assert.match(output(result), /railway variable set failed for CODEX_AUTH_JSON_BASE64/);
    assert.doesNotMatch(output(result), /secret-refresh|secret-mcp/);
    assert.doesNotMatch(output(result), new RegExp(authBase64));
  });
});

test("refresh-codex-auth does not print invalid JSON contents", () => {
  const dir = mkdtempSync(join(tmpdir(), "codex-auth-invalid-"));
  const codexHome = join(dir, ".codex");
  try {
    mkdirSync(codexHome);
    writeFileSync(join(codexHome, "auth.json"), "secret-refresh");

    const result = run(["--codex-home", codexHome, "--service", "fabro-maestro", "--dry-run"]);

    assert.notEqual(result.status, 0);
    assert.match(output(result), /invalid JSON in .*auth\.json/);
    assert.doesNotMatch(output(result), /secret-refresh/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
