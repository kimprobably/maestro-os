#!/usr/bin/env node
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const DEFAULT_SERVICE = "maestro-hermes-gateway";
const DEFAULT_ENVIRONMENT = "production";
const DEFAULT_PROFILE_HOME = "/data/.hermes/profiles/maestro-operator";
const DEFAULT_REMOTE_PYTHON = "/usr/local/lib/hermes-agent/venv/bin/python3";
const DEFAULT_HERMES_SOURCE = "/usr/local/lib/hermes-agent";

export const remotePythonSource = String.raw`
import base64
import asyncio
import json
import os
import re
import sqlite3
import sys
import time
from pathlib import Path

PROFILE_HOME = Path(os.environ.get("HERMES_PROFILE_HOME", "/data/.hermes/profiles/maestro-operator"))
HERMES_SOURCE = os.environ.get("HERMES_SOURCE", "/usr/local/lib/hermes-agent")
os.environ["HERMES_HOME"] = str(PROFILE_HOME)
if HERMES_SOURCE not in sys.path:
    sys.path.insert(0, HERMES_SOURCE)

def _coerce_int(value, default=0, minimum=0, maximum=10**18):
    try:
        number = int(value)
    except Exception:
        number = default
    return max(minimum, min(maximum, number))

def _load_json(path, fallback):
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return fallback

def _sessions():
    data = _load_json(PROFILE_HOME / "sessions" / "sessions.json", {})
    return data if isinstance(data, dict) else {}

def _channel_directory():
    data = _load_json(PROFILE_HOME / "channel_directory.json", {})
    return data if isinstance(data, dict) else {}

def _content(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        parts = []
        for block in value:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                text = block.get("text") or block.get("content")
                if text:
                    parts.append(str(text))
        return "\n".join(parts)
    if isinstance(value, dict):
        text = value.get("text") or value.get("content")
        if text:
            return str(text)
        return json.dumps(value, ensure_ascii=False)
    return str(value)

def _messages_for(session_id):
    try:
        from hermes_state import SessionDB
        return SessionDB().get_messages(session_id)
    except Exception:
        db_path = PROFILE_HOME / "state.db"
        if not db_path.exists():
            return []
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        try:
            rows = conn.execute(
                "SELECT * FROM messages WHERE session_id = ? ORDER BY id",
                (session_id,),
            ).fetchall()
        finally:
            conn.close()
        messages = []
        for row in rows:
            item = dict(row)
            for key in ("tool_calls", "reasoning_details", "codex_reasoning_items"):
                if item.get(key):
                    try:
                        item[key] = json.loads(item[key])
                    except Exception:
                        pass
            messages.append(item)
        return messages

def _conversation_rows(args):
    entries = _sessions()
    platform = (args.get("platform") or "").lower()
    search = (args.get("search") or "").lower()
    limit = _coerce_int(args.get("limit", 50), default=50, minimum=1, maximum=200)
    rows = []
    for key, entry in entries.items():
        origin = entry.get("origin") or {}
        entry_platform = entry.get("platform") or origin.get("platform", "")
        if platform and entry_platform.lower() != platform:
            continue
        display_name = entry.get("display_name", "")
        chat_name = origin.get("chat_name", "")
        if search and search not in display_name.lower() and search not in chat_name.lower() and search not in key.lower():
            continue
        rows.append({
            "session_key": key,
            "session_id": entry.get("session_id", ""),
            "platform": entry_platform,
            "chat_type": entry.get("chat_type", origin.get("chat_type", "")),
            "display_name": display_name,
            "chat_name": chat_name,
            "user_name": origin.get("user_name", ""),
            "updated_at": entry.get("updated_at", ""),
        })
    rows.sort(key=lambda row: row.get("updated_at", ""), reverse=True)
    return rows[:limit]

def conversations_list(args):
    rows = _conversation_rows(args)
    return {"count": len(rows), "conversations": rows}

def conversation_get(args):
    session_key = args.get("session_key") or ""
    entry = _sessions().get(session_key)
    if not entry:
        return {"error": "Conversation not found: " + session_key}
    origin = entry.get("origin") or {}
    return {
        "session_key": session_key,
        "session_id": entry.get("session_id", ""),
        "platform": entry.get("platform") or origin.get("platform", ""),
        "chat_type": entry.get("chat_type", origin.get("chat_type", "")),
        "display_name": entry.get("display_name", ""),
        "user_name": origin.get("user_name", ""),
        "chat_name": origin.get("chat_name", ""),
        "chat_id": origin.get("chat_id", ""),
        "thread_id": origin.get("thread_id"),
        "updated_at": entry.get("updated_at", ""),
        "created_at": entry.get("created_at", ""),
        "input_tokens": entry.get("input_tokens", 0),
        "output_tokens": entry.get("output_tokens", 0),
        "total_tokens": entry.get("total_tokens", 0),
    }

def messages_read(args):
    session_key = args.get("session_key") or ""
    limit = _coerce_int(args.get("limit", 50), default=50, minimum=1, maximum=200)
    entry = _sessions().get(session_key)
    if not entry:
        return {"error": "Conversation not found: " + session_key}
    session_id = entry.get("session_id", "")
    if not session_id:
        return {"error": "No session ID for this conversation"}
    filtered = []
    for msg in _messages_for(session_id):
        role = msg.get("role", "")
        if role not in ("user", "assistant"):
            continue
        text = _content(msg.get("content"))
        if text:
            filtered.append({
                "id": str(msg.get("id", "")),
                "role": role,
                "content": text[:2000],
                "timestamp": msg.get("timestamp", ""),
            })
    return {
        "session_key": session_key,
        "count": len(filtered[-limit:]),
        "total_in_session": len(filtered),
        "messages": filtered[-limit:],
    }

def attachments_fetch(args):
    session_key = args.get("session_key") or ""
    message_id = str(args.get("message_id") or "")
    entry = _sessions().get(session_key)
    if not entry:
        return {"error": "Conversation not found: " + session_key}
    target = None
    for msg in _messages_for(entry.get("session_id", "")):
        if str(msg.get("id", "")) == message_id:
            target = msg
            break
    if not target:
        return {"error": "Message not found: " + message_id}
    attachments = []
    raw = target.get("content")
    if isinstance(raw, list):
        for idx, block in enumerate(raw):
            if isinstance(block, dict) and block.get("type") not in ("text", "input_text", None):
                attachments.append({"index": idx, "type": block.get("type", "unknown"), "data": block})
    for match in re.finditer(r"MEDIA:\s*(\S+)", _content(raw)):
        attachments.append({"type": "media_path", "path": match.group(1)})
    return {"message_id": message_id, "count": len(attachments), "attachments": attachments}

def _events_poll(args):
    after_cursor = _coerce_int(args.get("after_cursor", 0), default=0, minimum=0)
    limit = _coerce_int(args.get("limit", 20), default=20, minimum=1, maximum=200)
    only_key = args.get("session_key")
    events = []
    for key, entry in _sessions().items():
        if only_key and key != only_key:
            continue
        for msg in _messages_for(entry.get("session_id", "")):
            cursor = _coerce_int(msg.get("id", 0), default=0, minimum=0)
            if cursor <= after_cursor:
                continue
            role = msg.get("role", "")
            if role not in ("user", "assistant"):
                continue
            text = _content(msg.get("content"))
            events.append({
                "cursor": cursor,
                "type": "message",
                "session_key": key,
                "session_id": entry.get("session_id", ""),
                "role": role,
                "timestamp": msg.get("timestamp", ""),
                "content": text[:1000],
            })
    events.sort(key=lambda event: event["cursor"])
    selected = events[:limit]
    next_cursor = max([after_cursor] + [event["cursor"] for event in selected])
    return {"events": selected, "count": len(selected), "next_cursor": next_cursor}

def events_poll(args):
    return _events_poll(args)

def events_wait(args):
    timeout_ms = _coerce_int(args.get("timeout_ms", 30000), default=30000, minimum=0, maximum=300000)
    deadline = time.time() + (timeout_ms / 1000)
    while True:
        result = _events_poll({**args, "limit": 1})
        if result["events"]:
            return {"event": result["events"][0], "next_cursor": result["next_cursor"]}
        if time.time() >= deadline:
            return {"event": None, "reason": "timeout"}
        time.sleep(0.5)

_SLACK_THREAD_TARGET_RE = re.compile(r"^\s*slack:([CGD][A-Z0-9]{8,})(?::([0-9]+\.[0-9]+))?\s*$")

async def _send_slack_thread_message(chat_id, thread_id, message):
    try:
        import aiohttp
        from gateway.config import Platform, load_gateway_config
        from gateway.platforms.base import proxy_kwargs_for_aiohttp, resolve_proxy_url
        from gateway.platforms.slack import SlackAdapter
    except Exception as exc:
        return {"error": f"Slack thread send unavailable: {exc}"}

    try:
        config = load_gateway_config()
        pconfig = config.platforms.get(Platform.SLACK)
        token = getattr(pconfig, "token", "") if pconfig else ""
        if not token:
            return {"error": "Slack platform is not configured"}

        try:
            adapter = SlackAdapter.__new__(SlackAdapter)
            formatted = adapter.format_message(message)
            chunks = adapter.truncate_message(formatted, SlackAdapter.MAX_MESSAGE_LENGTH)
        except Exception:
            chunks = [message]

        proxy = resolve_proxy_url()
        session_kwargs, request_kwargs = proxy_kwargs_for_aiohttp(proxy)
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        last_ts = None
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30), **session_kwargs) as session:
            for chunk in chunks:
                payload = {
                    "channel": chat_id,
                    "text": chunk,
                    "mrkdwn": True,
                    "thread_ts": thread_id,
                }
                async with session.post(
                    "https://slack.com/api/chat.postMessage",
                    headers=headers,
                    json=payload,
                    **request_kwargs,
                ) as response:
                    data = await response.json()
                    if not data.get("ok"):
                        return {"error": f"Slack API error: {data.get('error', 'unknown')}"}
                    last_ts = data.get("ts")
        return {
            "success": True,
            "platform": "slack",
            "chat_id": chat_id,
            "thread_ts": thread_id,
            "message_id": last_ts,
        }
    except Exception as exc:
        return {"error": f"Slack thread send failed: {exc}"}

def messages_send(args):
    target = args.get("target") or ""
    message = args.get("message") or ""
    if not target or not message:
        return {"error": "Both target and message are required"}
    slack_match = _SLACK_THREAD_TARGET_RE.fullmatch(target)
    if slack_match and slack_match.group(2):
        return asyncio.run(_send_slack_thread_message(slack_match.group(1), slack_match.group(2), message))
    from tools.send_message_tool import send_message_tool
    result = send_message_tool({"action": "send", "target": target, "message": message})
    try:
        return json.loads(result)
    except Exception:
        return {"result": result}

def channels_list(args):
    platform = (args.get("platform") or "").lower()
    directory = _channel_directory()
    channels = []
    platforms = directory.get("platforms") if isinstance(directory, dict) else None
    if isinstance(platforms, dict):
        for plat, entries in platforms.items():
            if platform and plat.lower() != platform:
                continue
            if isinstance(entries, list):
                for channel in entries:
                    if not isinstance(channel, dict):
                        continue
                    chat_id = channel.get("id") or channel.get("chat_id") or ""
                    channels.append({
                        "target": f"{plat}:{chat_id}" if chat_id else plat,
                        "platform": plat,
                        "name": channel.get("name") or channel.get("display_name") or "",
                        "chat_type": channel.get("type", ""),
                    })
    if channels:
        return {"count": len(channels), "channels": channels}
    seen = set()
    for key, entry in _sessions().items():
        origin = entry.get("origin") or {}
        plat = entry.get("platform") or origin.get("platform", "")
        chat_id = origin.get("chat_id", "")
        if not plat or not chat_id:
            continue
        if platform and plat.lower() != platform:
            continue
        target = f"{plat}:{chat_id}"
        if target in seen:
            continue
        seen.add(target)
        channels.append({
            "target": target,
            "platform": plat,
            "name": entry.get("display_name") or origin.get("chat_name", ""),
            "chat_type": entry.get("chat_type", origin.get("chat_type", "")),
        })
    return {"count": len(channels), "channels": channels}

def permissions_list_open(args):
    return {"count": 0, "approvals": [], "note": "The Railway bridge is stateless; live approvals are only visible to an attached Hermes MCP bridge process."}

def permissions_respond(args):
    return {"error": "No pending approvals are tracked by this stateless Railway bridge."}

TOOLS = {
    "conversations_list": conversations_list,
    "conversation_get": conversation_get,
    "messages_read": messages_read,
    "attachments_fetch": attachments_fetch,
    "events_poll": events_poll,
    "events_wait": events_wait,
    "messages_send": messages_send,
    "channels_list": channels_list,
    "permissions_list_open": permissions_list_open,
    "permissions_respond": permissions_respond,
}

def main():
    tool = sys.argv[1]
    args = json.loads(base64.b64decode(sys.argv[2]).decode("utf-8")) if len(sys.argv) > 2 else {}
    if tool not in TOOLS:
        raise SystemExit("unknown tool: " + tool)
    print(json.dumps(TOOLS[tool](args), ensure_ascii=False))

if __name__ == "__main__":
    main()
`;

export function toolDefinitions() {
  return [
    {
      name: "conversations_list",
      description: "List active messaging conversations from the Railway Hermes maestro-operator profile.",
      inputSchema: {
        type: "object",
        properties: {
          platform: { type: "string", description: "Optional platform filter, for example slack." },
          limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
          search: { type: "string", description: "Optional text filter for conversation names." },
        },
      },
    },
    {
      name: "conversation_get",
      description: "Get detailed info about one Railway Hermes conversation by session key.",
      inputSchema: {
        type: "object",
        properties: { session_key: { type: "string" } },
        required: ["session_key"],
      },
    },
    {
      name: "messages_read",
      description: "Read recent user and assistant messages from a Railway Hermes conversation.",
      inputSchema: {
        type: "object",
        properties: {
          session_key: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        },
        required: ["session_key"],
      },
    },
    {
      name: "attachments_fetch",
      description: "List non-text attachments referenced by a Railway Hermes message.",
      inputSchema: {
        type: "object",
        properties: {
          session_key: { type: "string" },
          message_id: { type: "string" },
        },
        required: ["session_key", "message_id"],
      },
    },
    {
      name: "events_poll",
      description: "Poll Railway Hermes session messages since a cursor.",
      inputSchema: {
        type: "object",
        properties: {
          after_cursor: { type: "integer", minimum: 0, default: 0 },
          session_key: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 200, default: 20 },
        },
      },
    },
    {
      name: "events_wait",
      description: "Wait for the next Railway Hermes session message after a cursor.",
      inputSchema: {
        type: "object",
        properties: {
          after_cursor: { type: "integer", minimum: 0, default: 0 },
          session_key: { type: "string" },
          timeout_ms: { type: "integer", minimum: 0, maximum: 300000, default: 30000 },
        },
      },
    },
    {
      name: "messages_send",
      description: "Send a text message through the running Railway Hermes gateway.",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", description: "Platform target such as slack:C123 or slack:C123:1779018267.455079 for a Slack thread." },
          message: { type: "string" },
        },
        required: ["target", "message"],
      },
    },
    {
      name: "channels_list",
      description: "List available messaging targets from the Railway Hermes channel directory.",
      inputSchema: {
        type: "object",
        properties: { platform: { type: "string" } },
      },
    },
    {
      name: "permissions_list_open",
      description: "List pending approval requests visible to this Railway Hermes bridge session.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "permissions_respond",
      description: "Respond to a pending approval request visible to this Railway Hermes bridge session.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          decision: { type: "string", enum: ["allow-once", "allow-always", "deny"] },
        },
        required: ["id", "decision"],
      },
    },
  ];
}

export function buildRailwayArgs(toolName, toolArgs = {}, options = {}) {
  const service = options.service || process.env.HERMES_RAILWAY_SERVICE || DEFAULT_SERVICE;
  const environment = options.environment || process.env.HERMES_RAILWAY_ENVIRONMENT || DEFAULT_ENVIRONMENT;
  const profileHome = options.profileHome || process.env.HERMES_RAILWAY_PROFILE_HOME || DEFAULT_PROFILE_HOME;
  const remotePython = options.remotePython || process.env.HERMES_RAILWAY_PYTHON || DEFAULT_REMOTE_PYTHON;
  const hermesSource = options.hermesSource || process.env.HERMES_RAILWAY_SOURCE || DEFAULT_HERMES_SOURCE;
  const source64 = Buffer.from(remotePythonSource, "utf8").toString("base64");
  const args64 = Buffer.from(JSON.stringify(toolArgs || {}), "utf8").toString("base64");
  const command = [
    `HERMES_PROFILE_HOME=${shellQuote(profileHome)}`,
    `HERMES_SOURCE=${shellQuote(hermesSource)}`,
    shellQuote(remotePython),
    "-c",
    shellQuote(`import base64; exec(base64.b64decode("${source64}"))`),
    shellQuote(toolName),
    shellQuote(args64),
  ].join(" ");
  return ["ssh", "--service", service, "--environment", environment, command];
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'\"'\"'`)}'`;
}

function redact(text) {
  return String(text || "").replace(
    /(xox[baprs]-[A-Za-z0-9-]+|github_pat_[A-Za-z0-9_]+|ghp_[A-Za-z0-9_]+|sk-[A-Za-z0-9_:-]+|AQ\\.[A-Za-z0-9_.-]+)/g,
    "[REDACTED]",
  );
}

export function callRailwayTool(toolName, toolArgs = {}, options = {}) {
  const railwayCommand = options.railwayCommand || process.env.RAILWAY_CLI || "railway";
  const args = buildRailwayArgs(toolName, toolArgs, options);
  return new Promise((resolve, reject) => {
    const child = spawn(railwayCommand, args, {
      cwd: options.cwd || process.cwd(),
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
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(redact(stderr || stdout || `railway ssh exited ${code}`)));
        return;
      }
      const trimmed = stdout.trim();
      try {
        resolve(JSON.parse(trimmed));
      } catch {
        resolve({ result: trimmed });
      }
    });
  });
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function resultText(payload) {
  if (typeof payload === "string") return payload;
  return JSON.stringify(payload, null, 2);
}

async function handleRequest(request) {
  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: request.params?.protocolVersion || "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "railway-hermes", version: "0.1.0" },
      },
    };
  }

  if (request.method === "ping") {
    return { jsonrpc: "2.0", id: request.id, result: {} };
  }

  if (request.method === "tools/list") {
    return { jsonrpc: "2.0", id: request.id, result: { tools: toolDefinitions() } };
  }

  if (request.method === "tools/call") {
    const name = request.params?.name;
    const args = request.params?.arguments || {};
    if (!toolDefinitions().some((tool) => tool.name === name)) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32602, message: `Unknown tool: ${name}` },
      };
    }
    try {
      const payload = await callRailwayTool(name, args);
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: { content: [{ type: "text", text: resultText(payload) }] },
      };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          isError: true,
          content: [{ type: "text", text: `Railway Hermes bridge failed: ${redact(error.message)}` }],
        },
      };
    }
  }

  if (request.method?.startsWith("notifications/")) return null;

  return {
    jsonrpc: "2.0",
    id: request.id,
    error: { code: -32601, message: `Method not found: ${request.method}` },
  };
}

export async function runServer() {
  process.stdin.setEncoding("utf8");
  let buffer = "";
  process.stdin.on("data", async (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let request;
      try {
        request = JSON.parse(line);
      } catch (error) {
        writeMessage({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: `Parse error: ${error.message}` },
        });
        continue;
      }
      const response = await handleRequest(request);
      if (response && Object.hasOwn(request, "id")) writeMessage(response);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runServer();
}
