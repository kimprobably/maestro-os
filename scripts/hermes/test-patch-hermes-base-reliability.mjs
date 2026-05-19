#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const patchScript = join(repoRoot, "hermes/deploy/railway-gateway/patch-hermes-base-reliability.py");

const upstreamBaseFixture = `import asyncio
import logging
import os

logger = logging.getLogger(__name__)

class BasePlatformAdapter:
    def __init__(self):
        self.name = "slack"
        self.platform = "slack"
        self.config = type("Config", (), {"extra": {}})()

    async def send(self, **kwargs):
        self.sent = kwargs

    async def _process_message_background(self, event, session_key):
        response = await self._message_handler(event)
        if response:
            await self.send(chat_id=event.source.chat_id, content=response)
`;

function withTempPythonPackage(fn) {
  const dir = mkdtempSync(join(tmpdir(), "maestro-base-patch-"));
  try {
    const pkg = join(dir, "gateway/platforms");
    mkdirSync(pkg, { recursive: true });
    writeFileSync(join(dir, "gateway/__init__.py"), "");
    writeFileSync(join(pkg, "__init__.py"), "");
    writeFileSync(join(pkg, "base.py"), upstreamBaseFixture);
    return fn({ dir, basePath: join(pkg, "base.py") });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runPython(args, env) {
  return spawnSync("python3", args, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runPatch(dir) {
  const result = runPython([patchScript], { PYTHONPATH: dir });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function compile(basePath) {
  const result = runPython(["-m", "py_compile", basePath], {});
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function runPythonInline(script, env) {
  const result = runPython(["-c", script], env);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

test("base reliability patch installs Slack turn watchdog idempotently", () => {
  withTempPythonPackage(({ dir, basePath }) => {
    runPatch(dir);
    compile(basePath);

    const patched = readFileSync(basePath, "utf8");
    assert.match(patched, /Maestro patch: Slack turn watchdog/);
    assert.match(patched, /async def _maestro_message_handler_with_timeout/);
    assert.match(patched, /response = await self\._maestro_message_handler_with_timeout\(event\)/);

    runPatch(dir);
    const twicePatched = readFileSync(basePath, "utf8");
    assert.equal((twicePatched.match(/Maestro patch: Slack turn watchdog/g) || []).length, 1);
  });
});

test("base reliability patch times out slow Slack turns", () => {
  withTempPythonPackage(({ dir, basePath }) => {
    runPatch(dir);
    compile(basePath);

    runPythonInline(
      `
import asyncio
import os
from gateway.platforms.base import BasePlatformAdapter

class Source:
    chat_id = "C123456789"

class Event:
    source = Source()

async def main():
    os.environ["SLACK_TURN_TIMEOUT_SECONDS"] = "0.05"
    adapter = BasePlatformAdapter()
    async def slow_handler(event):
        await asyncio.sleep(5)
        return "too late"
    adapter._message_handler = slow_handler
    response = await adapter._maestro_message_handler_with_timeout(Event())
    assert "time limit" in response

asyncio.run(main())
`,
      { PYTHONPATH: dir },
    );
  });
});

test("base reliability patch leaves non-Slack turns unbounded by default", () => {
  withTempPythonPackage(({ dir, basePath }) => {
    runPatch(dir);
    compile(basePath);

    runPythonInline(
      `
import asyncio
from gateway.platforms.base import BasePlatformAdapter

async def main():
    adapter = BasePlatformAdapter()
    adapter.name = "telegram"
    adapter.platform = "telegram"
    async def handler(event):
        return "ok"
    adapter._message_handler = handler
    response = await adapter._maestro_message_handler_with_timeout(object())
    assert response == "ok"

asyncio.run(main())
`,
      { PYTHONPATH: dir },
    );
  });
});
