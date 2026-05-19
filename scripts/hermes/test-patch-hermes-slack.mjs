#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const patchScript = join(repoRoot, "hermes/deploy/railway-gateway/patch-hermes-slack.py");

const upstreamSlackFixture = `import asyncio
import json
import logging
import os
import re
import time

logger = logging.getLogger(__name__)

class SlackGateway:
    def __init__(self):
        self._reacting_message_ids = set()
        self._bot_message_ts = set()
        self._mentioned_threads = set()
        self._active_status_threads = {}
        self._assistant_threads = {}
        self._team_bot_user_ids = {}
        self._bot_user_id = "U_BOT"

    async def connect(self):
        try:
            self._socket_mode_task = asyncio.create_task(self._handler.start_async())
            self._running = True
            return True
        except Exception:
            return False

    async def disconnect(self):
        if self._handler:
            try:
                await self._handler.close_async()
            except Exception as e:  # pragma: no cover - defensive logging
                logger.warning("[Slack] Error while closing Socket Mode handler: %s", e, exc_info=True)
        self._running = False

    async def _resolve_user_name(self, user_id, chat_id=""):
        return user_id

    def _has_active_session_for_thread(self, channel_id, thread_ts, user_id):
        return False

    async def _fetch_thread_context(self, channel_id, thread_ts, current_ts, team_id=""):
        return ""

    def _slack_allowed_channels(self):
        return set()

    def _slack_free_response_channels(self):
        return set()

    def _slack_require_mention(self):
        return True

    def _slack_strict_mention(self):
        return False

    def _reactions_enabled(self):
        return True

    def build_source(self, **kwargs):
        return kwargs

    async def handle_message(self, event):
        self.handled_message = event

    async def _handle_slack_message(self, event):
        text = event.get("text", "")
        original_text = text
        channel_id = event.get("channel", "")
        ts = event.get("ts", "")
        team_id = event.get("team", "")
        user_id = event.get("user", "")
        is_dm = False
        thread_ts = event.get("thread_ts") or ts
        bot_uid = "U_BOT"
        is_mentioned = bot_uid and f"<@{bot_uid}>" in original_text
        event_thread_ts = event.get("thread_ts")
        is_thread_reply = bool(event_thread_ts and event_thread_ts != ts)

        if is_mentioned:
            text = text.replace(f"<@{bot_uid}>", "").strip()

        # When entering a thread for the first time (no existing session),
        # fetch thread context so the agent understands the conversation.
        if is_thread_reply and not self._has_active_session_for_thread(
            channel_id=channel_id,
            thread_ts=event_thread_ts,
            user_id=user_id,
        ):
            thread_context = await self._fetch_thread_context(
                channel_id=channel_id,
                thread_ts=event_thread_ts,
                current_ts=ts,
                team_id=team_id,
            )
            if thread_context:
                text = thread_context + text

        msg_type = "text"
        media_types = []

        # Resolve user display name (cached after first lookup)
        user_name = await self._resolve_user_name(user_id, chat_id=channel_id)

        source = {
            "user_id": user_id,
            "user_name": user_name,
            "thread_id": thread_ts,
        }
        msg_event = type("MessageEvent", (), {
            "text": text,
            "source": type("Source", (), {
                "chat_id": channel_id,
                "thread_id": thread_ts,
            })(),
            "message_id": ts,
        })()

        _should_react = (is_dm or is_mentioned) and self._reactions_enabled()
        if _should_react:
            self._reacting_message_ids.add(ts)

        await self.handle_message(msg_event)

    # ----- Thread context fetching -----

    async def _format_thread_context(self):
        context_parts = []
        if True:
            content = ""
            if context_parts:
                content = (
                    "[Thread context — prior messages in this thread (not yet in conversation history):]\\n"
                    + "\\n".join(context_parts)
                    + "\\n[End of thread context]\\n\\n"
                )
        return content
`;

const legacyLedgerBlock = `        await self._maestro_record_slack_ledger_event(
            channel_id=channel_id,
            thread_ts=thread_ts,
            ts=ts,
            user_id=user_id,
            user_name=user_name,
            text=text,
            is_dm=is_dm,
            is_mentioned=bool(is_mentioned),
            is_thread_reply=bool(is_thread_reply),
            team_id=team_id,
        )

        # Maestro patch v2: explicit thread refresh.
`;

function withTempPythonPackage(fn) {
  const dir = mkdtempSync(join(tmpdir(), "maestro-slack-patch-"));
  try {
    const pkg = join(dir, "gateway/platforms");
    mkdirSync(pkg, { recursive: true });
    writeFileSync(join(dir, "gateway/__init__.py"), "");
    writeFileSync(join(pkg, "__init__.py"), "");
    writeFileSync(join(pkg, "slack.py"), upstreamSlackFixture);
    return fn({ dir, slackPath: join(pkg, "slack.py") });
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

function compile(slackPath) {
  const result = runPython(["-m", "py_compile", slackPath], {});
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function runPythonInline(script, env) {
  const result = runPython(["-c", script], env);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

function assertSafeLedgerPlacement(text) {
  const callIndex = text.indexOf("await self._maestro_record_slack_ledger_event(");
  assert.ok(callIndex > 0, "ledger call should exist");
  const beforeCall = text.slice(Math.max(0, callIndex - 320), callIndex);
  assert.match(beforeCall, /user_name = await self\._resolve_user_name\(user_id, chat_id=channel_id\)/);
}

test("Slack patch resolves user_name before the operator-ledger mirror", () => {
  withTempPythonPackage(({ dir, slackPath }) => {
    runPatch(dir);
    compile(slackPath);

    const patched = readFileSync(slackPath, "utf8");
    assert.match(patched, /Maestro patch v4: safe Slack ledger mirror/);
    assert.match(patched, /Maestro patch v3: bounded Slack thread context/);
    assertSafeLedgerPlacement(patched);

    runPatch(dir);
    const twicePatched = readFileSync(slackPath, "utf8");
    assertSafeLedgerPlacement(twicePatched);
    assert.equal((twicePatched.match(/Maestro patch v4: safe Slack ledger mirror/g) || []).length, 1);
  });
});

test("Slack patch upgrades the prior v3 ledger call without failing on bounded context", () => {
  withTempPythonPackage(({ dir, slackPath }) => {
    runPatch(dir);
    const patched = readFileSync(slackPath, "utf8");
    const v3Regression = patched.replace(
      /        # Maestro patch v4: safe Slack ledger mirror\.[\s\S]*?        # Maestro patch v2: explicit thread refresh\.\n/,
      legacyLedgerBlock,
    );
    assert.notEqual(v3Regression, patched, "test fixture should simulate the previous bad ledger call");
    writeFileSync(slackPath, v3Regression);

    runPatch(dir);
    compile(slackPath);
    assertSafeLedgerPlacement(readFileSync(slackPath, "utf8"));
  });
});

test("Slack patch installs missed mention recovery sweeper", () => {
  withTempPythonPackage(({ dir, slackPath }) => {
    runPatch(dir);
    compile(slackPath);

    const patched = readFileSync(slackPath, "utf8");
    assert.match(patched, /Maestro patch v5: missed mention recovery sweeper/);
    assert.match(patched, /async def _maestro_sweep_missed_mentions/);
    assert.match(patched, /conversations_history/);
    assert.match(patched, /self\._maestro_mention_sweeper_task = asyncio\.create_task/);

    runPatch(dir);
    const twicePatched = readFileSync(slackPath, "utf8");
    assert.equal(
      (twicePatched.match(/Maestro patch v5: missed mention recovery sweeper/g) || []).length,
      1,
    );
  });
});

test("Slack patch adds an immediate emoji ack independently of agent processing", () => {
  withTempPythonPackage(({ dir, slackPath }) => {
    runPatch(dir);
    compile(slackPath);

    const patched = readFileSync(slackPath, "utf8");
    assert.match(patched, /async def _maestro_add_ingress_reaction/);
    assert.match(patched, /await self\._maestro_add_ingress_reaction/);
    assert.doesNotMatch(patched, /Got it - working on this/);
    assert.doesNotMatch(patched, /_maestro_post_visible_ack/);

    runPythonInline(
      `
import asyncio
from types import SimpleNamespace
from gateway.platforms.slack import SlackGateway

async def main():
    gateway = SlackGateway()
    gateway.config = SimpleNamespace(extra={})
    reactions = []
    async def add_reaction(channel_id, ts, emoji):
        reactions.append((channel_id, ts, emoji))
        return True
    gateway._add_reaction = add_reaction

    ok = await gateway._maestro_add_ingress_reaction(
        "C123456789",
        "1779130250.583759",
        "1779130250.583759",
    )
    assert ok is True
    assert reactions == [("C123456789", "1779130250.583759", "eyes")]
    assert gateway._maestro_thread_roots_by_channel == {
        "C123456789": ["1779130250.583759"]
    }

asyncio.run(main())
`,
      { PYTHONPATH: dir },
    );
  });
});

test("Slack mention sweeper scans known long-thread roots outside recent history", () => {
  withTempPythonPackage(({ dir, slackPath }) => {
    runPatch(dir);
    compile(slackPath);

    const patched = readFileSync(slackPath, "utf8");
    assert.match(patched, /async def _maestro_sweep_channel_for_missed_mentions/);
    assert.match(patched, /_maestro_mention_sweep_thread_roots/);

    runPythonInline(
      `
import asyncio
from types import SimpleNamespace
from gateway.platforms.slack import SlackGateway

class Dedup:
    def __init__(self):
        self._seen = {}

class Client:
    def __init__(self):
        self.reply_calls = []
    async def conversations_history(self, **kwargs):
        return {"messages": []}
    async def conversations_replies(self, **kwargs):
        self.reply_calls.append(kwargs["ts"])
        return {
            "messages": [
                {"ts": kwargs["ts"], "user": "UOTHER", "text": "old parent"},
                {"ts": "1779130265.200000", "user": "UTIM", "text": "<@U_BOT> missed in old thread", "thread_ts": kwargs["ts"]},
            ]
        }

async def main():
    gateway = SlackGateway()
    gateway.config = SimpleNamespace(extra={})
    gateway._dedup = Dedup()
    gateway._bot_user_id = "U_BOT"
    gateway._team_bot_user_ids = {}
    gateway._mentioned_threads = {"1779130250.583759"}
    gateway._bot_message_ts = set()
    gateway._assistant_threads = {}
    gateway._active_status_threads = {}
    handled = []
    async def fake_handle(event):
        handled.append(event)
    gateway._handle_slack_message = fake_handle
    client = Client()
    gateway._get_client = lambda channel_id: client

    await gateway._maestro_sweep_channel_for_missed_mentions("C123456789", "1779130260.150000")

    assert client.reply_calls == ["1779130250.583759"]
    assert len(handled) == 1
    assert handled[0]["ts"] == "1779130265.200000"
    assert handled[0]["channel"] == "C123456789"

asyncio.run(main())
`,
      { PYTHONPATH: dir },
    );
  });
});
