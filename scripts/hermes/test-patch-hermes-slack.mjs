#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const patchScript = join(repoRoot, "hermes/deploy/railway-gateway/patch-hermes-slack.py");

const upstreamSlackFixture = `import os

class SlackGateway:
    async def _resolve_user_name(self, user_id, chat_id=""):
        return user_id

    def _has_active_session_for_thread(self, channel_id, thread_ts, user_id):
        return False

    async def _fetch_thread_context(self, channel_id, thread_ts, current_ts, team_id=""):
        return ""

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
        return source

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
