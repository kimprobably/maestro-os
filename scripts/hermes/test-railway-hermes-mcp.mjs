#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

import { buildRailwayArgs, remotePythonSource, toolDefinitions } from "./railway-hermes-mcp.mjs";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const script = resolve(repoRoot, "scripts/hermes/railway-hermes-mcp.mjs");

test("Railway Hermes MCP exposes the expected messaging bridge tool surface", () => {
  const names = toolDefinitions().map((tool) => tool.name);
  assert.deepEqual(names, [
    "conversations_list",
    "conversation_get",
    "messages_read",
    "attachments_fetch",
    "events_poll",
    "events_wait",
    "messages_send",
    "channels_list",
    "permissions_list_open",
    "permissions_respond",
  ]);
});

test("Railway command targets the remote maestro-operator profile, not local Hermes", () => {
  const args = buildRailwayArgs("conversations_list", { limit: 1 });
  const joined = args.join(" ");
  assert.equal(args[0], "ssh");
  assert.match(joined, /--service maestro-hermes-gateway/);
  assert.match(joined, /--environment production/);
  assert.match(joined, new RegExp("/data/\\.hermes/profiles/maestro-operator"));
  assert.doesNotMatch(joined, new RegExp("/Users/timlife/\\.hermes"));
  assert.doesNotMatch(joined, new RegExp("\\.local/bin/hermes"));
});

test("Railway bridge sends Slack thread targets with thread_ts", async () => {
  const source64 = Buffer.from(remotePythonSource, "utf8").toString("base64");
  const harness = `
import base64
import json
import sys
import types

captured = []

class FakeResponse:
    async def __aenter__(self):
        return self
    async def __aexit__(self, *args):
        return False
    async def json(self):
        return {"ok": True, "ts": "1779018268.000001"}

class FakeSession:
    def __init__(self, *args, **kwargs):
        pass
    async def __aenter__(self):
        return self
    async def __aexit__(self, *args):
        return False
    def post(self, url, headers=None, json=None, **kwargs):
        captured.append(json)
        return FakeResponse()

aiohttp = types.ModuleType("aiohttp")
aiohttp.ClientSession = FakeSession
aiohttp.ClientTimeout = lambda **kwargs: None
sys.modules["aiohttp"] = aiohttp

gateway = types.ModuleType("gateway")
gateway_config = types.ModuleType("gateway.config")
gateway_base = types.ModuleType("gateway.platforms.base")
gateway_slack = types.ModuleType("gateway.platforms.slack")

class Platform:
    SLACK = "slack"
    def __init__(self, value):
        self.value = value

class SlackAdapter:
    MAX_MESSAGE_LENGTH = 40000
    def format_message(self, value):
        return value
    def truncate_message(self, value, max_length):
        return [value]

class Config:
    platforms = {"slack": types.SimpleNamespace(token="xoxb-test")}

gateway_config.Platform = Platform
gateway_config.load_gateway_config = lambda: Config()
gateway_base.resolve_proxy_url = lambda: None
gateway_base.proxy_kwargs_for_aiohttp = lambda proxy: ({}, {})
gateway_slack.SlackAdapter = SlackAdapter

sys.modules["gateway"] = gateway
sys.modules["gateway.config"] = gateway_config
sys.modules["gateway.platforms.base"] = gateway_base
sys.modules["gateway.platforms.slack"] = gateway_slack

tools = types.ModuleType("tools")
send_message_tool_mod = types.ModuleType("tools.send_message_tool")
send_message_tool_mod.send_message_tool = lambda args: json.dumps({"fallback": args})
sys.modules["tools"] = tools
sys.modules["tools.send_message_tool"] = send_message_tool_mod

namespace = {"__name__": "not_main"}
exec(base64.b64decode("${source64}").decode("utf-8"), namespace)
result = namespace["messages_send"]({
    "target": "slack:C0AHCRH4EP4:1779018267.455079",
    "message": "threaded checkpoint",
})
print(json.dumps({"result": result, "captured": captured}))
`;

  const child = spawn("python3", ["-c", harness], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString("utf8");
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString("utf8");
  });

  const code = await new Promise((resolvePromise) => {
    child.on("close", resolvePromise);
  });

  assert.equal(code, 0, stderr);
  const payload = JSON.parse(stdout);
  assert.equal(payload.result.success, true);
  assert.equal(payload.result.thread_ts, "1779018267.455079");
  assert.deepEqual(payload.captured, [
    {
      channel: "C0AHCRH4EP4",
      text: "threaded checkpoint",
      mrkdwn: true,
      thread_ts: "1779018267.455079",
    },
  ]);
});

test("stdio server returns initialize and tools/list without calling Railway", async () => {
  const child = spawn(process.execPath, [script], {
    cwd: repoRoot,
    stdio: ["pipe", "pipe", "pipe"],
  });

  const responses = [];
  let stdout = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString("utf8");
    const lines = stdout.split(/\r?\n/);
    stdout = lines.pop() || "";
    for (const line of lines) {
      if (line.trim()) responses.push(JSON.parse(line));
    }
  });

  child.stdin.write(
    `${JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "0" } },
    })}\n`,
  );
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })}\n`);

  await new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out waiting for MCP responses")), 3000);
    const interval = setInterval(() => {
      if (responses.length >= 2) {
        clearInterval(interval);
        clearTimeout(timer);
        resolvePromise();
      }
    }, 20);
  });

  child.kill("SIGTERM");
  assert.equal(responses[0].result.serverInfo.name, "railway-hermes");
  assert.equal(responses[1].result.tools.length, 10);
});
