#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const preflight = join(repoRoot, "scripts/iphone-app-factory/ux-studio-preflight.mjs");

const completeEnv = {
  OPENROUTER_API_KEY: "openrouter-secret-value",
  APIFY_TOKEN: "apify-secret-value",
  GITHUB_TOKEN: "github-secret-value",
  CLAUDE_CODE_OAUTH_TOKEN: "claude-secret-value",
  CODEX_AUTH_JSON_BASE64: Buffer.from('{"token":"codex-secret-value"}').toString("base64"),
  MOBBIN_EMAIL: "person@example.com",
  MOBBIN_PASSWORD: "mobbin-secret-value",
};

const secretValues = Object.values(completeEnv);

function makeWorkdir() {
  return mkdtempSync(join(tmpdir(), "ux-studio-preflight-"));
}

function makeFakeBin(commands = {}) {
  const dir = mkdtempSync(join(tmpdir(), "ux-studio-bin-"));
  for (const [name, body] of Object.entries(commands)) {
    const path = join(dir, name);
    writeFileSync(path, `#!/usr/bin/env sh\n${body}\n`);
    spawnSync("chmod", ["755", path]);
  }
  return dir;
}

function runPreflight({
  cwd = makeWorkdir(),
  env = {},
  args = ["--skip-network", "--skip-tools", "--skip-git", "--skip-mobbin-mcp"],
  pathPrefix = "",
} = {}) {
  return {
    cwd,
    result: spawnSync(process.execPath, [preflight, ...args], {
      cwd,
      env: {
        PATH: pathPrefix ? `${pathPrefix}${delimiter}${process.env.PATH}` : process.env.PATH,
        HOME: process.env.HOME,
        ...completeEnv,
        FABRO_SERVER: "https://fabro-maestro-production.up.railway.app/api/v1",
        ...env,
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  };
}

function readReport(cwd) {
  return JSON.parse(readFileSync(join(cwd, ".workflow/iphone-app-ux-studio/preflight.json"), "utf8"));
}

function cleanup(dir) {
  rmSync(dir, { recursive: true, force: true });
}

test("--skip-network mode validates required env presence without printing values", () => {
  const { cwd, result } = runPreflight();
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = `${result.stdout}\n${result.stderr}`;
    for (const value of secretValues) {
      assert.doesNotMatch(output, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    const report = readReport(cwd);
    assert.equal(report.ok, true);
    assert.deepEqual(report.skipped.network, true);
    assert.equal(report.checks.env.missing.length, 0);
  } finally {
    cleanup(cwd);
  }
});

test("missing MOBBIN_EMAIL reports only the key name", () => {
  const { cwd, result } = runPreflight({ env: { MOBBIN_EMAIL: "" } });
  try {
    assert.notEqual(result.status, 0);
    const report = readReport(cwd);
    assert.deepEqual(report.checks.env.missing, ["MOBBIN_EMAIL"]);
    assert.match(result.stdout, /MOBBIN_EMAIL/);
    assert.doesNotMatch(result.stdout, /person@example\.com|mobbin-secret-value/);
  } finally {
    cleanup(cwd);
  }
});

test("Mobbin credentials are optional when use_mobbin_mcp=false", () => {
  const { cwd, result } = runPreflight({
    env: { MOBBIN_EMAIL: "", MOBBIN_PASSWORD: "" },
    args: ["--skip-network", "--skip-tools", "--skip-git", "--use-mobbin-mcp", "false"],
  });
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = readReport(cwd);
    assert.equal(report.ok, true);
    assert.deepEqual(report.checks.env.missing, []);
    assert.equal(report.skipped.mobbin_mcp, true);
  } finally {
    cleanup(cwd);
  }
});

test("GITHUB_TOKEN or GH_TOKEN satisfies the GitHub credential group", () => {
  const first = runPreflight({ env: { GH_TOKEN: "", GITHUB_TOKEN: "github-secret-value" } });
  try {
    assert.equal(first.result.status, 0, first.result.stderr || first.result.stdout);
    assert.equal(readReport(first.cwd).checks.env.missing.includes("GITHUB_TOKEN or GH_TOKEN"), false);
  } finally {
    cleanup(first.cwd);
  }

  const second = runPreflight({ env: { GITHUB_TOKEN: "", GH_TOKEN: "gh-secret-value" } });
  try {
    assert.equal(second.result.status, 0, second.result.stderr || second.result.stdout);
    assert.equal(readReport(second.cwd).checks.env.missing.includes("GITHUB_TOKEN or GH_TOKEN"), false);
    assert.doesNotMatch(second.result.stdout, /gh-secret-value/);
  } finally {
    cleanup(second.cwd);
  }
});

test("CLAUDE_CODE_OAUTH_TOKEN or CLAUDE_CODE_CREDENTIALS_JSON_BASE64 satisfies the Claude credential group", () => {
  const first = runPreflight({
    env: {
      CLAUDE_CODE_OAUTH_TOKEN: "claude-secret-value",
      CLAUDE_CODE_CREDENTIALS_JSON_BASE64: "",
    },
  });
  try {
    assert.equal(first.result.status, 0, first.result.stderr || first.result.stdout);
    assert.equal(
      readReport(first.cwd).checks.env.missing.includes("CLAUDE_CODE_OAUTH_TOKEN or CLAUDE_CODE_CREDENTIALS_JSON_BASE64"),
      false,
    );
  } finally {
    cleanup(first.cwd);
  }

  const second = runPreflight({
    env: {
      CLAUDE_CODE_OAUTH_TOKEN: "",
      CLAUDE_CODE_CREDENTIALS_JSON_BASE64: Buffer.from('{"accessToken":"claude-secret-value"}').toString("base64"),
    },
  });
  try {
    assert.equal(second.result.status, 0, second.result.stderr || second.result.stdout);
    assert.equal(
      readReport(second.cwd).checks.env.missing.includes("CLAUDE_CODE_OAUTH_TOKEN or CLAUDE_CODE_CREDENTIALS_JSON_BASE64"),
      false,
    );
    assert.doesNotMatch(second.result.stdout, /claude-secret-value/);
  } finally {
    cleanup(second.cwd);
  }
});

test("local Fabro URL fails unless --allow-local is provided", () => {
  const blocked = runPreflight({ env: { FABRO_SERVER: "http://127.0.0.1:32276" } });
  try {
    assert.notEqual(blocked.result.status, 0);
    assert.match(blocked.result.stdout, /local Fabro/);
  } finally {
    cleanup(blocked.cwd);
  }

  const allowed = runPreflight({
    env: { FABRO_SERVER: "http://127.0.0.1:32276" },
    args: ["--skip-network", "--skip-tools", "--skip-git", "--skip-mobbin-mcp", "--allow-local"],
  });
  try {
    assert.equal(allowed.result.status, 0, allowed.result.stderr || allowed.result.stdout);
    assert.equal(readReport(allowed.cwd).allow_local, true);
  } finally {
    cleanup(allowed.cwd);
  }
});

test("Fabro URLs with userinfo are redacted from stdout and report", () => {
  const leakedUserinfo = "dummy-secret";
  const { cwd, result } = runPreflight({
    env: {
      FABRO_SERVER: `https://${leakedUserinfo}@fabro-maestro-production.up.railway.app/api/v1`,
      FABRO_WEB_URL: `https://${leakedUserinfo}@fabro-maestro-production.up.railway.app`,
    },
  });
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.doesNotMatch(result.stdout, new RegExp(leakedUserinfo));
    const report = readReport(cwd);
    assert.doesNotMatch(JSON.stringify(report), new RegExp(leakedUserinfo));
    assert.equal(report.server, "https://fabro-maestro-production.up.railway.app/api/v1");
    assert.equal(report.web_url, "https://fabro-maestro-production.up.railway.app");
  } finally {
    cleanup(cwd);
  }
});

test("Fabro URLs with secret query or fragment values are redacted from stdout and report", () => {
  const leakedSecret = "dummy-secret";
  const { cwd, result } = runPreflight({
    env: {
      FABRO_SERVER: `https://fabro-maestro-production.up.railway.app?token=${leakedSecret}#${leakedSecret}`,
      FABRO_WEB_URL: `https://fabro-maestro-production.up.railway.app?api_key=${leakedSecret}#${leakedSecret}`,
    },
  });
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.doesNotMatch(result.stdout, new RegExp(leakedSecret));
    const report = readReport(cwd);
    assert.doesNotMatch(JSON.stringify(report), new RegExp(leakedSecret));
    assert.equal(report.server, "https://fabro-maestro-production.up.railway.app/api/v1");
    assert.equal(report.web_url, "https://fabro-maestro-production.up.railway.app");
  } finally {
    cleanup(cwd);
  }
});

test("generated report includes Mobbin MCP booleans and never credentials", () => {
  const fakeBin = makeFakeBin({
    claude: "if [ \"$1\" = \"mcp\" ] && [ \"$2\" = \"list\" ]; then printf '%s\\n' 'mobbin https://api.mobbin.com/mcp'; exit 0; fi; exit 1",
  });
  const { cwd, result } = runPreflight({
    args: ["--skip-network", "--skip-tools", "--skip-git"],
    pathPrefix: fakeBin,
  });
  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = readReport(cwd);
    assert.equal(typeof report.checks.mobbin_mcp_configured, "boolean");
    assert.equal(typeof report.checks.mobbin_mcp_authorized, "boolean");
    assert.equal(report.checks.mobbin_mcp_configured, true);
    assert.equal(report.checks.mobbin_mcp_authorized, true);
    const serialized = JSON.stringify(report);
    for (const value of secretValues) {
      assert.doesNotMatch(serialized, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  } finally {
    cleanup(cwd);
    cleanup(fakeBin);
  }
});
