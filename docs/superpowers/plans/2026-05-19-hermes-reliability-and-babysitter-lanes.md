# Hermes Reliability And Babysitter Lanes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Miles acknowledge Slack reliably, stop burning live Slack turns on long work, and restore Fabro Codex auth with Quincy owning background babysitting.

**Architecture:** Slack ingress should add an emoji as soon as a routed message reaches Hermes and should recover long-thread roots from the operator ledger after restarts. Live Slack turns get a higher hard iteration budget, but long or stuck work is moved into a Kanban-backed Quincy babysitter lane with compact heartbeats to the Fabro runs channel. Fabro Codex auth is refreshed through a stdin-based Railway helper, validated by smoke tests, then failed runs are inspected before retry or fork.

**Tech Stack:** Hermes Slack gateway patchers in Python, Node.js test runner, Hermes CLI kanban/cron/send commands, SQLite operator and run ledgers, Railway CLI, Fabro runtime scripts, Slack channel IDs.

---

## Scope Check

This plan covers four connected reliability failures in the same production loop:

1. Slack ingress/ack flakiness: messages can be routed without a consistent emoji, and old long threads can be missed after a restart.
2. Slack turn exhaustion: Miles burns iterations on work that should be durable, then times out with confusing "worker lane" wording.
3. Fabro run babysitting: Quincy should own Fabro run monitoring off Slack, and the current failed run indicates Codex CLI auth needs to be refreshed before retrying.
4. Hermes agent execution discipline: Miles, Quincy, Smith, Johann, Quill, and Joni need the Superpowers skill set from `https://github.com/obra/superpowers` available in their Hermes profiles so they use the same brainstorming/planning/TDD/review/finish workflows.

These are separate tasks, but they should ship together because the user-facing failure is one experience: Miles appears flaky, silent, or stuck.

## File Structure

- Modify `hermes/deploy/railway-gateway/patch-hermes-slack.py`: emoji ack behavior, ledger-backed thread root recovery.
- Modify `scripts/hermes/test-patch-hermes-slack.mjs`: regression tests for routed thread replies and ledger-seeded sweeps.
- Modify `docs/operator/HERMES-SLACK-RELIABILITY-SPEC.md`: document emoji-only ack, ledger sweeps, turn limits, and babysitter handoff.
- Modify `hermes/deploy/railway-gateway/patch-hermes-base-reliability.py`: timeout copy should name Quincy/background babysitting, not "worker lane".
- Modify `hermes/deploy/railway-gateway/entrypoint.sh`: default higher gateway/delegation turn limits and map Fabro runs channel env.
- Modify `hermes/config/config.example.yaml` and `hermes/distribution/maestro-operator/config.yaml`: set `max_turns` and delegation iterations to 120, add Fabro runs channel guidance.
- Create `scripts/hermes/test-railway-gateway-config.mjs`: static regression checks for turn limits and user-facing timeout copy.
- Create `scripts/hermes/quincy-babysitter-task.mjs`: idempotently create a Quincy Kanban babysitter task for a Fabro run.
- Create `scripts/hermes/test-quincy-babysitter-task.mjs`: dry-run tests for the Quincy task brief and Kanban command shape.
- Modify `hermes/skills/fabro-babysitter/SKILL.md` and `hermes/distribution/maestro-operator/skills/fabro-babysitter/SKILL.md`: require Kanban heartbeats, Fabro run ledger writes, and compact Fabro runs channel reporting.
- Modify `hermes/profiles/maestro-operator/SOUL.md` and `hermes/distribution/maestro-operator/SOUL.md`: make Miles hand long Fabro runs to Quincy through Kanban.
- Modify `hermes/distribution/maestro-operator/cron/fabro-babysitter.json`: report to Fabro runs channel and avoid home-channel spam.
- Create `scripts/fabro/refresh-codex-auth-railway.mjs`: refresh `CODEX_AUTH_JSON_BASE64` and `CODEX_MCP_CREDENTIALS_JSON_BASE64` via Railway stdin without printing secrets.
- Create `scripts/fabro/test-refresh-codex-auth-railway.mjs`: verifies auth JSON validation, stdin secret handling, and redacted output.
- Modify `docs/FABRO-MCP-SETUP.md` and `docs/IPHONE-APP-UX-STUDIO-WORKFLOW.md`: document Codex auth refresh and run recovery sequence.
- Create: `scripts/hermes/sync-superpowers-skills.mjs`: vendor the upstream Superpowers `skills/` tree into the Hermes distribution without requiring network access at runtime.
- Create: `scripts/hermes/test-sync-superpowers-skills.mjs`: verify sync behavior, required skills, license/source metadata, and distribution propagation assumptions.
- Create/modify: `hermes/distribution/maestro-operator/skills/<superpowers-skill>/SKILL.md`: vendored Superpowers skills for all Hermes profiles.
- Create/modify: `hermes/skills/<superpowers-skill>/SKILL.md`: repo-local copy for docs/developer profile parity.
- Modify: `hermes/scripts/install-worker-profiles.sh`: keep tests asserting distribution skills are copied into every worker profile.
- Modify: `hermes/profiles/*/SOUL.md` and `hermes/distribution/maestro-operator/SOUL.md`: require using Superpowers skills for software work.

---

### Task 1: Slack Emoji Ack And Missed Thread Recovery

**Files:**
- Modify: `hermes/deploy/railway-gateway/patch-hermes-slack.py`
- Modify: `scripts/hermes/test-patch-hermes-slack.mjs`
- Modify: `docs/operator/HERMES-SLACK-RELIABILITY-SPEC.md`

- [ ] **Step 1: Write failing routed-thread ack regression**

Add this test to `scripts/hermes/test-patch-hermes-slack.mjs` after the existing emoji ack test:

```js
test("Slack patch reacts to every routed Slack message, not only fresh mentions", () => {
  withTempPythonPackage((dir) => {
    const source = path.join(dir, "slack.py");
    fs.writeFileSync(source, upstreamSlackFixture);
    runPatch(source);
    const python = `
import asyncio
import os
from slack import SlackPlatform

os.environ["SLACK_REACTIONS"] = "true"
gateway = SlackPlatform()
gateway.bot_user_id = "UBOT"
reactions = []

async def add_reaction(channel, ts, emoji):
    reactions.append((channel, ts, emoji))
    return True

gateway._add_reaction = add_reaction

asyncio.run(gateway._handle_slack_message({
    "channel": "C123456789",
    "ts": "1779130300.111111",
    "thread_ts": "1779130250.583759",
    "user": "UTIM",
    "text": "follow up without a direct mention"
}))

assert reactions == [("C123456789", "1779130300.111111", "eyes")]
`;
    runPythonInline(dir, python);
  });
});
```

- [ ] **Step 2: Write failing ledger-thread sweep regression**

Add this test to the same file:

```js
test("Slack mention sweep seeds thread roots from the operator ledger", () => {
  withTempPythonPackage((dir) => {
    fs.writeFileSync(
      path.join(dir, "hermes_constants.py"),
      [
        "from pathlib import Path",
        "import os",
        "def get_hermes_home():",
        "    return Path(os.environ['HERMES_HOME'])",
        "",
      ].join("\n"),
    );
    const source = path.join(dir, "slack.py");
    fs.writeFileSync(source, upstreamSlackFixture);
    runPatch(source);
    const python = `
import os
import sqlite3
import tempfile
from pathlib import Path
from slack import SlackPlatform

home = Path(tempfile.mkdtemp())
os.environ["HERMES_HOME"] = str(home)
state = home / "profiles" / "maestro-operator" / "state"
state.mkdir(parents=True)
db = sqlite3.connect(state / "operator-ledger.sqlite")
db.execute("CREATE TABLE ledger_subjects (id INTEGER PRIMARY KEY, subject_type TEXT, subject_key TEXT, updated_at TEXT)")
db.execute("INSERT INTO ledger_subjects (subject_type, subject_key, updated_at) VALUES (?, ?, ?)", ("slack_thread", "C123456789:1779130250.583759", "2026-05-19T00:00:00Z"))
db.commit()
db.close()

gateway = SlackPlatform()
roots = gateway._maestro_mention_sweep_thread_roots("C123456789")
assert "1779130250.583759" in roots
`;
    runPythonInline(dir, python);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
node --test scripts/hermes/test-patch-hermes-slack.mjs
```

Expected: the routed-thread ack test fails because `_should_react` is limited to DMs/direct mentions, and the ledger sweep test fails because ledger thread roots are not loaded.

- [ ] **Step 4: Make routed messages always receive the emoji**

In `patch-hermes-slack.py`, update the inserted ingress reaction block so every message that reaches `_handle_slack_message` and is not deduped gets the emoji:

```python
        _should_react = self._reactions_enabled()
        if _should_react:
            if not hasattr(self, "_reacting_message_ids"):
                self._reacting_message_ids = set()
            self._reacting_message_ids.add(ts)
            await self._maestro_add_ingress_reaction(channel_id, ts, thread_ts)
```

Keep the helper using `"eyes"` and `SLACK_INGRESS_REACTION_TIMEOUT`.

- [ ] **Step 5: Add ledger-backed sweep roots**

Add this helper inside the mention sweep helper block in `patch-hermes-slack.py`:

```python
    def _maestro_mention_sweep_ledger_thread_roots(self, channel_id: str) -> list[str]:
        try:
            import sqlite3
            from hermes_constants import get_hermes_home

            profile = os.getenv("HERMES_PROFILE", "maestro-operator")
            db_path = (
                get_hermes_home()
                / "profiles"
                / profile
                / "state"
                / "operator-ledger.sqlite"
            )
            if not db_path.exists():
                return []
            limit = max(1, min(250, int(os.getenv("SLACK_MENTION_SWEEP_LEDGER_THREAD_LIMIT", "80"))))
            rows = []
            with sqlite3.connect(db_path) as db:
                rows = db.execute(
                    """
                    SELECT subject_key
                    FROM ledger_subjects
                    WHERE subject_type = 'slack_thread'
                      AND subject_key LIKE ?
                    ORDER BY updated_at DESC, id DESC
                    LIMIT ?
                    """,
                    (f"{channel_id}:%", limit),
                ).fetchall()
            roots = []
            for row in rows:
                subject_key = str(row[0] or "")
                if ":" in subject_key:
                    roots.append(subject_key.split(":", 1)[1])
            return roots
        except Exception:
            logger.debug("[%s] Could not load Slack thread roots from operator ledger", self.name, exc_info=True)
            return []
```

Then add these roots before in-memory mentioned threads inside `_maestro_mention_sweep_thread_roots`:

```python
        for root in self._maestro_mention_sweep_ledger_thread_roots(channel_id):
            add(root)
```

- [ ] **Step 6: Run focused Slack tests**

Run:

```bash
node --test scripts/hermes/test-patch-hermes-slack.mjs
```

Expected: all Slack patch tests pass.

- [ ] **Step 7: Update Slack reliability spec**

In `docs/operator/HERMES-SLACK-RELIABILITY-SPEC.md`, document:

```md
- Primary ingress acknowledgement is an immediate `:eyes:` reaction on every routed Slack message.
- Text "Got it" acknowledgements are disabled.
- Mention sweeps include recent channel history, known in-memory thread roots, and recent `slack_thread` subjects from the operator ledger.
- `SLACK_MENTION_SWEEP_LEDGER_THREAD_LIMIT=80` controls how many ledger thread roots are checked per channel.
```

- [ ] **Step 8: Commit**

Run:

```bash
git add hermes/deploy/railway-gateway/patch-hermes-slack.py scripts/hermes/test-patch-hermes-slack.mjs docs/operator/HERMES-SLACK-RELIABILITY-SPEC.md
git commit -m "Harden Hermes Slack ingress acknowledgement"
```

---

### Task 2: Turn Limits, Timeout Copy, And Unproductive Turn Escape

**Files:**
- Modify: `hermes/deploy/railway-gateway/patch-hermes-base-reliability.py`
- Modify: `hermes/deploy/railway-gateway/entrypoint.sh`
- Modify: `hermes/config/config.example.yaml`
- Modify: `hermes/distribution/maestro-operator/config.yaml`
- Create: `scripts/hermes/test-railway-gateway-config.mjs`

- [ ] **Step 1: Write failing config/copy regression**

Create `scripts/hermes/test-railway-gateway-config.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const entrypoint = readFileSync("hermes/deploy/railway-gateway/entrypoint.sh", "utf8");
const basePatch = readFileSync("hermes/deploy/railway-gateway/patch-hermes-base-reliability.py", "utf8");
const exampleConfig = readFileSync("hermes/config/config.example.yaml", "utf8");
const distributionConfig = readFileSync("hermes/distribution/maestro-operator/config.yaml", "utf8");

test("Railway gateway defaults allow longer Slack and delegation turns", () => {
  assert.match(entrypoint, /HERMES_GATEWAY_MAX_TURNS="\$\{HERMES_GATEWAY_MAX_TURNS:-120\}"/);
  assert.match(entrypoint, /HERMES_DELEGATION_MAX_ITERATIONS="\$\{HERMES_DELEGATION_MAX_ITERATIONS:-120\}"/);
  assert.match(entrypoint, /max\(configured_max_turns, 120\)/);
  assert.match(entrypoint, /max\(configured_max_iterations, 120\)/);
  assert.match(exampleConfig, /max_turns: 120/);
  assert.match(exampleConfig, /max_iterations: 120/);
  assert.match(distributionConfig, /max_turns: 120/);
  assert.match(distributionConfig, /max_iterations: 120/);
});

test("Slack timeout message uses user-facing Quincy babysitter language", () => {
  assert.doesNotMatch(basePatch, /worker lane/);
  assert.match(basePatch, /Quincy/);
  assert.match(basePatch, /background babysit/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --test scripts/hermes/test-railway-gateway-config.mjs
```

Expected: it fails because defaults are still 30 and the timeout message says "worker lane".

- [ ] **Step 3: Increase gateway and delegation defaults**

In `entrypoint.sh`, change the exported defaults:

```bash
export HERMES_GATEWAY_MAX_TURNS="${HERMES_GATEWAY_MAX_TURNS:-120}"
export HERMES_DELEGATION_MAX_ITERATIONS="${HERMES_DELEGATION_MAX_ITERATIONS:-120}"
```

In the Python config-rendering block, replace direct existing config reuse with minimum defaults:

```python
configured_max_turns = int(agent.get("max_turns") or 120)
agent["max_turns"] = env_int("HERMES_GATEWAY_MAX_TURNS", max(configured_max_turns, 120))
```

and:

```python
configured_max_iterations = int(delegation.get("max_iterations") or 120)
delegation["max_iterations"] = env_int("HERMES_DELEGATION_MAX_ITERATIONS", max(configured_max_iterations, 120))
```

- [ ] **Step 4: Update checked-in configs**

In both `hermes/config/config.example.yaml` and `hermes/distribution/maestro-operator/config.yaml`, change:

```yaml
agent:
  max_turns: 120
```

and:

```yaml
delegation:
  max_iterations: 120
```

- [ ] **Step 5: Replace timeout copy**

In `patch-hermes-base-reliability.py`, replace the bounded timeout message with:

```python
            return (
                "I hit the Slack turn time limit before finishing. "
                "I stopped this turn so the thread is usable again. "
                "Ask me to continue, or ask me to have Quincy background babysit it."
            )
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
node --test scripts/hermes/test-railway-gateway-config.mjs scripts/hermes/test-patch-hermes-base-reliability.mjs
```

Expected: both test files pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add hermes/deploy/railway-gateway/patch-hermes-base-reliability.py hermes/deploy/railway-gateway/entrypoint.sh hermes/config/config.example.yaml hermes/distribution/maestro-operator/config.yaml scripts/hermes/test-railway-gateway-config.mjs
git commit -m "Raise Hermes turn limits and clarify timeout handoff"
```

---

### Task 3: Kanban-Backed Quincy Babysitter Lane

**Files:**
- Create: `scripts/hermes/quincy-babysitter-task.mjs`
- Create: `scripts/hermes/test-quincy-babysitter-task.mjs`
- Modify: `hermes/skills/fabro-babysitter/SKILL.md`
- Modify: `hermes/distribution/maestro-operator/skills/fabro-babysitter/SKILL.md`
- Modify: `hermes/profiles/maestro-operator/SOUL.md`
- Modify: `hermes/distribution/maestro-operator/SOUL.md`
- Modify: `hermes/distribution/maestro-operator/cron/fabro-babysitter.json`
- Modify: `docs/HERMES-OPERATOR-ARCHITECTURE.md`
- Modify: `hermes/slack/channel-map.md`

- [ ] **Step 1: Write failing dry-run helper tests**

Create `scripts/hermes/test-quincy-babysitter-task.mjs`:

```js
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const script = "scripts/hermes/quincy-babysitter-task.mjs";

function run(args) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("quincy babysitter task dry-run creates idempotent Kanban command", () => {
  const result = run([
    "--run-id", "01KRYZDZ1WJHFP0ZEH9EY09QW1",
    "--source-channel", "C0AHCRH4EP4",
    "--source-thread", "1779130250.583759",
    "--report-channel", "C_FABRO_RUNS",
    "--dry-run",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.idempotency_key, "fabro-run:01KRYZDZ1WJHFP0ZEH9EY09QW1");
  assert.deepEqual(payload.command.slice(0, 4), ["hermes", "kanban", "create", "Babysit Fabro run 01KRYZDZ1WJHFP0ZEH9EY09QW1"]);
  assert.match(payload.body, /Assigned owner: Quincy/);
  assert.match(payload.body, /Report channel: C_FABRO_RUNS/);
  assert.match(payload.body, /Original Slack thread: C0AHCRH4EP4:1779130250.583759/);
  assert.match(payload.body, /Write Fabro run ledger updates/);
  assert.match(payload.body, /Do not post as Quincy in the original Slack thread/);
});

test("quincy babysitter task rejects unsafe or missing run ids", () => {
  const result = run(["--run-id", "../bad", "--dry-run"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /run id must contain only/);
});
```

- [ ] **Step 2: Implement the helper**

Create `scripts/hermes/quincy-babysitter-task.mjs`:

```js
#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function usage(code = 2) {
  console.error("usage: quincy-babysitter-task.mjs --run-id RUN --source-channel C --source-thread TS --report-channel C_FABRO_RUNS [--dry-run]");
  process.exit(code);
}

function requireSafeRunId(runId) {
  if (!/^[A-Za-z0-9_-]+$/.test(runId)) {
    console.error("run id must contain only letters, numbers, underscore, or dash");
    process.exit(2);
  }
  return runId;
}

const runId = requireSafeRunId(argValue("--run-id"));
if (!runId) usage();
const sourceChannel = argValue("--source-channel", "unknown");
const sourceThread = argValue("--source-thread", "unknown");
const reportChannel = argValue("--report-channel", process.env.SLACK_FABRO_RUNS_CHANNEL || "C_FABRO_RUNS");
const title = `Babysit Fabro run ${runId}`;
const idempotencyKey = `fabro-run:${runId}`;
const body = [
  `Assigned owner: Quincy`,
  `Fabro run id: ${runId}`,
  `Original Slack thread: ${sourceChannel}:${sourceThread}`,
  `Report channel: ${reportChannel}`,
  "",
  "Objective: babysit this Fabro run until terminal state or blocked decision.",
  "Allowed actions: inspect Fabro MCP/events, inspect run branch/SHA, inspect preserved sandbox metadata, update Fabro run ledger, emit Kanban heartbeat, post compact heartbeat to the report channel on status changes or every 30 minutes.",
  "Forbidden actions: print secrets, dump raw logs, mutate production deploys, post as Quincy in the original Slack thread, mark generated code done without test or review evidence.",
  "Exit criteria: completed run with evidence summary, blocked approval request, credential blocker, deterministic failure with next patch target, or terminal failure with preserved artifacts and next action.",
  "Reporting: write Fabro run ledger updates after meaningful events; add Kanban comments for status changes; report blockers/final state to Miles for the original Slack thread.",
  "Write Fabro run ledger updates before making retry, fork, or recovery claims.",
  "Do not post as Quincy in the original Slack thread.",
].join("\n");

const command = [
  "hermes",
  "kanban",
  "create",
  title,
  "--assignee",
  "quincy",
  "--skill",
  "fabro-babysitter",
  "--idempotency-key",
  idempotencyKey,
  "--max-runtime",
  "2h",
  "--created-by",
  "miles",
  "--body",
  body,
  "--json",
];

if (hasFlag("--dry-run")) {
  console.log(JSON.stringify({ ok: true, run_id: runId, idempotency_key: idempotencyKey, command, body }, null, 2));
  process.exit(0);
}

const result = spawnSync(command[0], command.slice(1), {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || `hermes kanban create failed with status ${result.status}\n`);
  process.exit(result.status || 1);
}
process.stdout.write(result.stdout);
```

- [ ] **Step 3: Run helper tests**

Run:

```bash
node --test scripts/hermes/test-quincy-babysitter-task.mjs
```

Expected: both tests pass.

- [ ] **Step 4: Update Quincy babysitter instructions**

In both babysitter skill files, add this section under `Operating Loop`:

```md
## Kanban Babysitter Lane

When a Fabro run is assigned through a Kanban task, Quincy owns the run until a terminal state or blocker.

- Emit `hermes kanban heartbeat <task_id> --note "<status>: <node or next action>"` every polling cycle when the task id is present.
- Add a Kanban comment when status, node, failure class, branch/SHA, sandbox, or next action changes.
- Write the Fabro run ledger before reporting retry, fork, recovery, or terminal claims.
- Post compact status to the Fabro runs Slack channel on status changes, blockers, terminal states, and at most once every 30 minutes for unchanged running work.
- Do not post as Quincy in the original user Slack thread. Miles owns the user-facing thread summary.
- Escalate only approvals, missing credential names, deterministic failures requiring code changes, or unresolved quality risks.
```

- [ ] **Step 5: Update Miles handoff policy**

In both Miles SOUL files, replace vague worker-lane language with:

```md
- For long Fabro runs, create a Kanban task assigned to `quincy` using `scripts/hermes/quincy-babysitter-task.mjs`.
- Miles remains accountable for the original Slack thread. Quincy owns off-thread monitoring, run-ledger updates, and Fabro runs channel heartbeat.
- Use the phrase "background babysit" with users. Do not expose "worker lane" unless explaining architecture.
```

- [ ] **Step 6: Update cron prompt**

Change `hermes/distribution/maestro-operator/cron/fabro-babysitter.json` to:

```json
{
  "name": "Fabro run babysitter",
  "schedule": "every 30m",
  "prompt": "Use fabro-babysitter. Inspect active Fabro runs, update the run ledger, and report compact status changes, blockers, and terminal states to the Fabro runs channel. Do not dump logs or secrets. Do not post routine unchanged status to the Slack home channel.",
  "skills": [
    "fabro-babysitter"
  ],
  "paused": false
}
```

- [ ] **Step 7: Update architecture docs**

In `docs/HERMES-OPERATOR-ARCHITECTURE.md`, add:

```md
### Miles And Quincy Babysitter Flow

Miles is the Slack-facing owner. Quincy is the internal Fabro run owner.
They coordinate through Kanban task comments, task heartbeats, the Fabro run ledger, and the operator ledger. Quincy should not need a Slack persona for normal runs.

Default flow:

1. Miles creates an idempotent Kanban task for `fabro-run:<run_id>` assigned to `quincy`.
2. Quincy inspects Fabro, updates ledgers, and heartbeats on the Kanban task.
3. Quincy sends compact operational status to the Fabro runs channel on changes or every 30 minutes.
4. Miles summarizes final, blocked, approval-needed, or high-risk states in the original Slack thread.
```

- [ ] **Step 8: Run docs/source checks**

Run:

```bash
node --test scripts/hermes/test-quincy-babysitter-task.mjs scripts/hermes/test-agent-registry.mjs
rg -n "worker lane" hermes/deploy/railway-gateway/patch-hermes-base-reliability.py hermes/profiles/maestro-operator/SOUL.md hermes/distribution/maestro-operator/SOUL.md
```

Expected: tests pass. `rg` may still find architectural docs that explain worker lanes, but it must not find the Slack timeout message or user-facing Miles policy.

- [ ] **Step 9: Commit**

Run:

```bash
git add scripts/hermes/quincy-babysitter-task.mjs scripts/hermes/test-quincy-babysitter-task.mjs hermes/skills/fabro-babysitter/SKILL.md hermes/distribution/maestro-operator/skills/fabro-babysitter/SKILL.md hermes/profiles/maestro-operator/SOUL.md hermes/distribution/maestro-operator/SOUL.md hermes/distribution/maestro-operator/cron/fabro-babysitter.json docs/HERMES-OPERATOR-ARCHITECTURE.md hermes/slack/channel-map.md
git commit -m "Add Quincy Kanban babysitter lane"
```

---

### Task 4: Fabro Codex Auth Refresh And Recovery

**Files:**
- Create: `scripts/fabro/refresh-codex-auth-railway.mjs`
- Create: `scripts/fabro/test-refresh-codex-auth-railway.mjs`
- Modify: `docs/FABRO-MCP-SETUP.md`
- Modify: `docs/IPHONE-APP-UX-STUDIO-WORKFLOW.md`

- [ ] **Step 1: Write failing auth refresh tests**

Create `scripts/fabro/test-refresh-codex-auth-railway.mjs`:

```js
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const script = "scripts/fabro/refresh-codex-auth-railway.mjs";

function run(args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("refresh-codex-auth validates and redacts local Codex auth", () => {
  const dir = mkdtempSync(join(tmpdir(), "codex-auth-"));
  const codexHome = join(dir, ".codex");
  mkdirSync(codexHome);
  writeFileSync(join(codexHome, "auth.json"), JSON.stringify({ refresh_token: "secret-refresh" }));
  writeFileSync(join(codexHome, ".credentials.json"), JSON.stringify({ mobbin: { access_token: "secret-mcp" } }));

  const result = run(["--codex-home", codexHome, "--service", "maestro-fabro", "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.variables.length, 2);
  assert.deepEqual(payload.variables.map((item) => item.key), ["CODEX_AUTH_JSON_BASE64", "CODEX_MCP_CREDENTIALS_JSON_BASE64"]);
  assert.doesNotMatch(result.stdout + result.stderr, /secret-refresh|secret-mcp/);
});

test("refresh-codex-auth sends secret values through Railway stdin", () => {
  const dir = mkdtempSync(join(tmpdir(), "codex-auth-"));
  const bin = join(dir, "bin");
  const log = join(dir, "railway.log");
  const codexHome = join(dir, ".codex");
  mkdirSync(bin);
  mkdirSync(codexHome);
  writeFileSync(join(codexHome, "auth.json"), JSON.stringify({ refresh_token: "secret-refresh" }));
  writeFileSync(join(codexHome, ".credentials.json"), JSON.stringify({ mobbin: { access_token: "secret-mcp" } }));
  writeFileSync(join(bin, "railway"), `#!/usr/bin/env node
const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
fs.appendFileSync(${JSON.stringify(log)}, process.argv.slice(2).join(" ") + " stdin=" + input.length + "\\n");
`, { mode: 0o755 });

  const result = run(["--codex-home", codexHome, "--service", "maestro-fabro", "--environment", "production"], {
    PATH: `${bin}:${process.env.PATH}`,
  });
  assert.equal(result.status, 0, result.stderr);
  const logged = readFileSync(log, "utf8");
  assert.match(logged, /variable set CODEX_AUTH_JSON_BASE64 --stdin/);
  assert.match(logged, /variable set CODEX_MCP_CREDENTIALS_JSON_BASE64 --stdin/);
  assert.doesNotMatch(logged, /secret-refresh|secret-mcp/);
  assert.doesNotMatch(result.stdout + result.stderr, /secret-refresh|secret-mcp/);
});
```

- [ ] **Step 2: Implement stdin-based Railway auth refresh**

Create `scripts/fabro/refresh-codex-auth-railway.mjs`:

```js
#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function readJsonBase64(path) {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  JSON.parse(raw);
  return Buffer.from(raw, "utf8").toString("base64");
}

function setRailwayVariable({ key, value, service, environment, skipDeploys }) {
  const args = ["variable", "set", key, "--stdin", "--service", service, "--environment", environment];
  if (skipDeploys) args.push("--skip-deploys");
  const result = spawnSync("railway", args, {
    input: value,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `railway variable set failed for ${key}`);
  }
}

const codexHome = resolve(argValue("--codex-home", process.env.CODEX_HOME || join(homedir(), ".codex")));
const service = argValue("--service", process.env.FABRO_RAILWAY_SERVICE || "maestro-fabro");
const environment = argValue("--environment", process.env.FABRO_RAILWAY_ENVIRONMENT || "production");
const dryRun = hasFlag("--dry-run");
const redeploy = hasFlag("--redeploy");
const variables = [
  { key: "CODEX_AUTH_JSON_BASE64", path: join(codexHome, "auth.json") },
  { key: "CODEX_MCP_CREDENTIALS_JSON_BASE64", path: join(codexHome, ".credentials.json") },
].map((item) => ({ ...item, value: readJsonBase64(item.path) })).filter((item) => item.value);

if (!variables.some((item) => item.key === "CODEX_AUTH_JSON_BASE64")) {
  console.error("missing valid Codex auth.json; run codex login first");
  process.exit(2);
}

if (!dryRun) {
  for (const variable of variables) {
    setRailwayVariable({ key: variable.key, value: variable.value, service, environment, skipDeploys: true });
  }
  if (redeploy) {
    const result = spawnSync("railway", ["service", "redeploy", service], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || "railway service redeploy failed");
    }
  }
}

console.log(JSON.stringify({
  ok: true,
  service,
  environment,
  dry_run: dryRun,
  redeploy,
  variables: variables.map((item) => ({ key: item.key, source: item.path, chars: item.value.length })),
}, null, 2));
```

- [ ] **Step 3: Run auth refresh tests**

Run:

```bash
node --test scripts/fabro/test-refresh-codex-auth-railway.mjs
```

Expected: tests pass, and no test output contains fake secret strings.

- [ ] **Step 4: Refresh local Codex auth interactively**

Run on the operator machine:

```bash
codex login
codex auth status
```

Expected: Codex reports an authenticated account. Do not paste tokens into Slack or terminal output.

- [ ] **Step 5: Push refreshed auth to the Fabro Railway service**

First identify the actual Fabro Railway service name from the Railway UI or by linking the Fabro service locally. Then run:

```bash
node scripts/fabro/refresh-codex-auth-railway.mjs --service maestro-fabro --environment production --redeploy
```

Expected: JSON output lists only variable names, source paths, and encoded lengths. It must not print token values.

- [ ] **Step 6: Validate Fabro runtime credentials before retrying the failed run**

Run:

```bash
node scripts/fabro/railway-preflight.mjs --server https://fabro-maestro-production.up.railway.app/api/v1 --expected-workflow build-iphone-app
```

Then launch or inspect the runtime smoke workflow already present in the repo:

```bash
fabro run workflows/fabro/daytona-cli-auth-runtime-smoke.fabro --server https://fabro-maestro-production.up.railway.app/api/v1
```

Expected: preflight passes and the runtime smoke confirms `codex_auth_file=true` without printing auth values.

- [ ] **Step 7: Inspect preserved failed run before fork or retry**

For run `01KRYZDZ1WJHFP0ZEH9EY09QW1`, use Quincy or a shell-capable operator lane to inspect:

```bash
node scripts/fabro/babysit-run.mjs --run-id 01KRYZDZ1WJHFP0ZEH9EY09QW1 --server https://fabro-maestro-production.up.railway.app/api/v1 --once
```

Expected: ledger is updated with current status, failure class, branch/SHA, sandbox name, and next action. If the run branch has useful work, fork or resume from the latest pushed state instead of starting from scratch.

- [ ] **Step 8: Update docs**

Add this section to `docs/FABRO-MCP-SETUP.md`:

```md
## Refreshing Codex Auth For Fabro Workers

Fabro workers restore Codex CLI auth from `CODEX_AUTH_JSON_BASE64` and Codex MCP file credentials from `CODEX_MCP_CREDENTIALS_JSON_BASE64`. If Codex exits with refresh or websocket 401 errors, refresh local Codex auth and push the files through Railway stdin:

```bash
codex login
node scripts/fabro/refresh-codex-auth-railway.mjs --service maestro-fabro --environment production --redeploy
```

Validate with `scripts/fabro/railway-preflight.mjs` and `workflows/fabro/daytona-cli-auth-runtime-smoke.fabro` before retrying a failed production run.
```

- [ ] **Step 9: Commit**

Run:

```bash
git add scripts/fabro/refresh-codex-auth-railway.mjs scripts/fabro/test-refresh-codex-auth-railway.mjs docs/FABRO-MCP-SETUP.md docs/IPHONE-APP-UX-STUDIO-WORKFLOW.md
git commit -m "Add safe Fabro Codex auth refresh flow"
```

---

### Task 5: Superpowers Skill Set For All Hermes Agents

**Files:**
- Create: `scripts/hermes/sync-superpowers-skills.mjs`
- Create: `scripts/hermes/test-sync-superpowers-skills.mjs`
- Create/modify: `hermes/distribution/maestro-operator/skills/<superpowers-skill>/SKILL.md`
- Create/modify: `hermes/skills/<superpowers-skill>/SKILL.md`
- Modify: `hermes/profiles/maestro-operator/SOUL.md`
- Modify: `hermes/distribution/maestro-operator/SOUL.md`
- Modify: `hermes/profiles/quincy/SOUL.md`
- Modify: `hermes/profiles/smith/SOUL.md`
- Modify: `hermes/profiles/johann/SOUL.md`
- Modify: `hermes/profiles/quill/SOUL.md`
- Modify: `hermes/profiles/joni/SOUL.md`
- Modify: `hermes/agents/bootstrap-rules.md`
- Modify: `hermes/README.md`

- [ ] **Step 1: Write failing Superpowers sync tests**

Create `scripts/hermes/test-sync-superpowers-skills.mjs`:

```js
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const script = "scripts/hermes/sync-superpowers-skills.mjs";

function writeSkill(root, name, body = "") {
  const dir = path.join(root, "skills", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "SKILL.md"), [
    "---",
    `name: ${name}`,
    `description: ${name} test skill`,
    "---",
    "",
    body || `# ${name}`,
    "",
  ].join("\n"));
}

function run(args, cwd = process.cwd()) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("sync-superpowers-skills vendors required skills into Hermes skill dirs", () => {
  const source = mkdtempSync(path.join(tmpdir(), "superpowers-src-"));
  const target = mkdtempSync(path.join(tmpdir(), "maestro-os-"));
  for (const name of [
    "using-superpowers",
    "brainstorming",
    "writing-plans",
    "using-git-worktrees",
    "test-driven-development",
    "subagent-driven-development",
    "executing-plans",
    "requesting-code-review",
    "receiving-code-review",
    "finishing-a-development-branch",
    "systematic-debugging",
    "verification-before-completion",
    "dispatching-parallel-agents",
    "writing-skills",
  ]) {
    writeSkill(source, name);
  }
  writeFileSync(path.join(source, "LICENSE"), "MIT test license\n");

  const result = run(["--source", source, "--repo-root", target]);
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.ok(payload.synced.length >= 14);

  for (const base of ["hermes/skills", "hermes/distribution/maestro-operator/skills"]) {
    for (const name of ["using-superpowers", "brainstorming", "test-driven-development", "finishing-a-development-branch"]) {
      assert.equal(existsSync(path.join(target, base, name, "SKILL.md")), true, `${base}/${name}`);
    }
  }
  assert.match(readFileSync(path.join(target, "hermes/distribution/maestro-operator/skills/SUPERPOWERS_SOURCE.md"), "utf8"), /https:\/\/github\.com\/obra\/superpowers/);
});

test("repo profile installer copies distribution skills into worker profiles", () => {
  const installer = readFileSync("hermes/scripts/install-worker-profiles.sh", "utf8");
  assert.match(installer, /worker_skills_src="\$repo_root\/hermes\/distribution\/maestro-operator\/skills"/);
  assert.match(installer, /copy_worker_skills "\$profile_dir"/);
});

test("Hermes agent SOUL files require Superpowers for software work", () => {
  for (const file of [
    "hermes/profiles/maestro-operator/SOUL.md",
    "hermes/distribution/maestro-operator/SOUL.md",
    "hermes/profiles/quincy/SOUL.md",
    "hermes/profiles/smith/SOUL.md",
    "hermes/profiles/johann/SOUL.md",
    "hermes/profiles/quill/SOUL.md",
    "hermes/profiles/joni/SOUL.md",
  ]) {
    const text = readFileSync(file, "utf8");
    assert.match(text, /Superpowers/);
    assert.match(text, /using-superpowers/);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test scripts/hermes/test-sync-superpowers-skills.mjs
```

Expected: tests fail because the sync script does not exist and profile SOUL files do not require Superpowers yet.

- [ ] **Step 3: Implement the Superpowers sync script**

Create `scripts/hermes/sync-superpowers-skills.mjs`:

```js
#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const requiredSkills = [
  "using-superpowers",
  "brainstorming",
  "writing-plans",
  "using-git-worktrees",
  "test-driven-development",
  "subagent-driven-development",
  "executing-plans",
  "requesting-code-review",
  "receiving-code-review",
  "finishing-a-development-branch",
  "systematic-debugging",
  "verification-before-completion",
  "dispatching-parallel-agents",
  "writing-skills",
];

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function ensureSource(sourceArg) {
  if (sourceArg) return path.resolve(sourceArg);
  const checkout = path.join(tmpdir(), `superpowers-${Date.now()}`);
  const result = spawnSync("git", ["clone", "--depth", "1", "https://github.com/obra/superpowers.git", checkout], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "git clone obra/superpowers failed");
  }
  return checkout;
}

function copySkill(sourceRoot, repoRoot, skillName) {
  const sourceDir = path.join(sourceRoot, "skills", skillName);
  if (!existsSync(path.join(sourceDir, "SKILL.md"))) {
    throw new Error(`missing required Superpowers skill: ${skillName}`);
  }
  const destinations = [
    path.join(repoRoot, "hermes", "skills", skillName),
    path.join(repoRoot, "hermes", "distribution", "maestro-operator", "skills", skillName),
  ];
  for (const destination of destinations) {
    rmSync(destination, { recursive: true, force: true });
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(sourceDir, destination, { recursive: true });
  }
}

const repoRoot = path.resolve(argValue("--repo-root", "."));
const sourceRoot = ensureSource(argValue("--source", ""));
const dryRun = hasFlag("--dry-run");
const sourceSkillsDir = path.join(sourceRoot, "skills");
if (!existsSync(sourceSkillsDir)) throw new Error(`missing skills directory in ${sourceRoot}`);
const available = readdirSync(sourceSkillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const skillName of requiredSkills) {
  if (!available.includes(skillName)) throw new Error(`missing required Superpowers skill: ${skillName}`);
}

if (!dryRun) {
  for (const skillName of available) copySkill(sourceRoot, repoRoot, skillName);
  const licenseText = existsSync(path.join(sourceRoot, "LICENSE")) ? readFileSync(path.join(sourceRoot, "LICENSE"), "utf8") : "";
  const sourceNote = [
    "# Superpowers Source",
    "",
    "These skills are vendored from https://github.com/obra/superpowers.",
    "Use `node scripts/hermes/sync-superpowers-skills.mjs` to refresh them.",
    "",
  ].join("\n");
  for (const base of [
    path.join(repoRoot, "hermes", "skills"),
    path.join(repoRoot, "hermes", "distribution", "maestro-operator", "skills"),
  ]) {
    mkdirSync(base, { recursive: true });
    writeFileSync(path.join(base, "SUPERPOWERS_SOURCE.md"), sourceNote);
    if (licenseText) writeFileSync(path.join(base, "SUPERPOWERS_LICENSE"), licenseText);
  }
}

console.log(JSON.stringify({
  ok: true,
  source: sourceRoot,
  repo_root: repoRoot,
  dry_run: dryRun,
  synced: available,
  required: requiredSkills,
}, null, 2));
```

- [ ] **Step 4: Sync Superpowers from upstream**

Run:

```bash
node scripts/hermes/sync-superpowers-skills.mjs
```

Expected: output JSON lists the synced skill directory names. It should include at least:

```text
using-superpowers
brainstorming
writing-plans
using-git-worktrees
test-driven-development
subagent-driven-development
executing-plans
requesting-code-review
receiving-code-review
finishing-a-development-branch
systematic-debugging
verification-before-completion
dispatching-parallel-agents
writing-skills
```

- [ ] **Step 5: Update profile operating policy**

Add this section to all listed SOUL files:

```md
## Superpowers Discipline

For software, workflow, agent, documentation, and reliability changes, use the local Superpowers skill set.

- Start by checking `using-superpowers` and then load the specific Superpowers skill that matches the work.
- Use `brainstorming` before creative behavior changes or new features.
- Use `writing-plans` before multi-step implementation.
- Use `using-git-worktrees` for isolated branches.
- Use `test-driven-development` for bug fixes and features.
- Use `systematic-debugging` for flaky or unexplained failures.
- Use `verification-before-completion` before claiming work is done.
- Use `finishing-a-development-branch` before merging, deploying, or cleaning up.

These skills are mandatory workflow guardrails, not optional references.
```

For Quincy, add one extra bullet:

```md
- When babysitting Fabro runs, combine `fabro-babysitter` with `systematic-debugging` and `verification-before-completion` before retry/fork claims.
```

For Smith, add one extra bullet:

```md
- For code changes, combine Smith's code-worker policy with `test-driven-development`, `requesting-code-review`, and `finishing-a-development-branch`.
```

- [ ] **Step 6: Update agent bootstrap docs**

In `hermes/agents/bootstrap-rules.md`, add to the required skills checks:

```md
- distribution profile includes the Superpowers skills from `https://github.com/obra/superpowers`;
- worker install copies the distribution skill set into every durable profile;
- each SOUL file names `using-superpowers` as the first skill-discovery step for software work.
```

In `hermes/README.md`, add:

```md
## Superpowers

Hermes agents use the Superpowers methodology from https://github.com/obra/superpowers for software and reliability work. The skills are vendored into `hermes/distribution/maestro-operator/skills` so Miles and every worker profile receive the same workflow guardrails during Railway profile install.

Refresh the vendored copy with:

```bash
node scripts/hermes/sync-superpowers-skills.mjs
```
```

- [ ] **Step 7: Run Superpowers tests**

Run:

```bash
node --test scripts/hermes/test-sync-superpowers-skills.mjs scripts/hermes/test-specialist-profiles.mjs scripts/hermes/test-bootstrap-agent-workflow.mjs
```

Expected: all tests pass.

- [ ] **Step 8: Verify vendored skill set exists**

Run:

```bash
find hermes/distribution/maestro-operator/skills -maxdepth 2 -name SKILL.md | sort
find hermes/skills -maxdepth 2 -name SKILL.md | sort
```

Expected: both lists include the Superpowers skills and the existing Maestro skills.

- [ ] **Step 9: Commit**

Run:

```bash
git add scripts/hermes/sync-superpowers-skills.mjs scripts/hermes/test-sync-superpowers-skills.mjs hermes/skills hermes/distribution/maestro-operator/skills hermes/profiles/maestro-operator/SOUL.md hermes/distribution/maestro-operator/SOUL.md hermes/profiles/quincy/SOUL.md hermes/profiles/smith/SOUL.md hermes/profiles/johann/SOUL.md hermes/profiles/quill/SOUL.md hermes/profiles/joni/SOUL.md hermes/agents/bootstrap-rules.md hermes/README.md
git commit -m "Add Superpowers skills to Hermes agents"
```

---

### Task 6: Full Verification, PR Update, Merge, And Deploy

**Files:**
- Existing branch: `codex/hermes-emoji-ack`
- Existing PR: `https://github.com/kimprobably/maestro-os/pull/3`

- [ ] **Step 1: Run all focused tests**

Run:

```bash
node --test \
  scripts/hermes/test-patch-hermes-slack.mjs \
  scripts/hermes/test-patch-hermes-base-reliability.mjs \
  scripts/hermes/test-railway-gateway-config.mjs \
  scripts/hermes/test-quincy-babysitter-task.mjs \
  scripts/fabro/test-refresh-codex-auth-railway.mjs \
  scripts/hermes/test-sync-superpowers-skills.mjs
```

Expected: all tests pass.

- [ ] **Step 2: Compile Python patchers**

Run:

```bash
python3 -m py_compile \
  hermes/deploy/railway-gateway/patch-hermes-slack.py \
  hermes/deploy/railway-gateway/patch-hermes-base-reliability.py \
  hermes/deploy/railway-gateway/patch-hermes-auxiliary-budgets.py \
  hermes/deploy/railway-gateway/patch-hermes-learning.py
```

Expected: no output and exit code 0.

- [ ] **Step 3: Check whitespace**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 4: Push PR branch**

Run:

```bash
git push origin codex/hermes-emoji-ack
gh pr view 3 --web
gh pr checks 3 --watch
```

Expected: PR checks pass.

- [ ] **Step 5: Merge PR**

Run:

```bash
gh pr merge 3 --squash --delete-branch
```

Expected: PR merges into `main`.

- [ ] **Step 6: Deploy Hermes gateway**

Run:

```bash
rm -rf /tmp/maestro-hermes-railway-reliability
hermes/scripts/prepare-railway-gateway-context.sh /tmp/maestro-hermes-railway-reliability
railway up /tmp/maestro-hermes-railway-reliability --path-as-root --service maestro-hermes-gateway --environment production --message "Deploy Hermes reliability and Quincy babysitter lane"
```

Expected: Railway deployment succeeds.

- [ ] **Step 7: Set Hermes runtime variables**

Run:

```bash
printf '120' | railway variable set HERMES_GATEWAY_MAX_TURNS --stdin --service maestro-hermes-gateway --environment production --skip-deploys
printf '120' | railway variable set HERMES_DELEGATION_MAX_ITERATIONS --stdin --service maestro-hermes-gateway --environment production --skip-deploys
printf '80' | railway variable set SLACK_MENTION_SWEEP_LEDGER_THREAD_LIMIT --stdin --service maestro-hermes-gateway --environment production --skip-deploys
railway service redeploy maestro-hermes-gateway
```

Expected: variables are set without printing secrets, then gateway redeploys.

- [ ] **Step 8: Verify production logs**

Run:

```bash
railway logs --service maestro-hermes-gateway --environment production
```

Expected log markers:

```text
Patched Hermes Slack adapter
Patched Hermes base reliability
```

Also verify no new timeout message contains `worker lane`.

- [ ] **Step 9: Smoke test from Slack**

In Slack:

```text
@Miles ack smoke
```

Expected:

- Miles adds `:eyes:` quickly.
- No "Got it - working on this." text acknowledgement appears.
- If the turn is long, status messages count toward 120 iterations and timeout copy names Quincy/background babysitting.

- [ ] **Step 10: Start Quincy babysitter for the failed Fabro run**

Run:

```bash
node scripts/hermes/quincy-babysitter-task.mjs \
  --run-id 01KRYZDZ1WJHFP0ZEH9EY09QW1 \
  --source-channel C0AHCRH4EP4 \
  --source-thread 1779130250.583759 \
  --report-channel C_FABRO_RUNS
hermes kanban dispatch --max 1
```

Expected: a single idempotent task assigned to `quincy` is created and dispatched. Quincy reports compact progress to the Fabro runs channel and not as a Slack persona in the original thread.

---

## Self-Review

- Spec coverage: Task 1 covers Slack missed/ack flakiness. Task 2 covers turn limit and confusing worker-lane language. Task 3 covers Miles/Quincy hybrid babysitting through Kanban, ledgers, and the Fabro runs channel. Task 4 covers Codex auth reauth and failed Fabro run recovery. Task 5 covers Superpowers distribution to all Hermes agents. Task 6 covers PR, merge, deployment, and production smoke tests.
- Superpowers coverage: Task 5 vendors the upstream Superpowers skill set, verifies the propagation path into all Hermes profiles, and adds SOUL policy requiring the skills for software and reliability work.
- Placeholder scan: No implementation step depends on unspecified code. The only external value is the actual Fabro Railway service name; Task 4 includes a concrete script default and an explicit operator check because the local Railway link currently points at `maestro-hermes-gateway`, not the Fabro service.
- Type consistency: Script flags use `--run-id`, `--source-channel`, `--source-thread`, `--report-channel`, `--service`, `--environment`, and `--dry-run` consistently across tests and implementation snippets.
