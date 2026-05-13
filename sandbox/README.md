# Daytona Sandbox Notes

Daytona v0.174 uses CLI flags or SDK calls for snapshots. The TOML sketch in
`docs/SPIKE-PLAN.md` is not the current CLI interface.

Create the tool snapshot:

```bash
daytona login --api-key "$DAYTONA_API_KEY"
daytona snapshot create maestro-code-factory-v5 \
  --dockerfile sandbox/Dockerfile \
  --context sandbox \
  --cpu 2 \
  --memory 4 \
  --disk 10
```

Run the auth test:

```bash
daytona create --snapshot maestro-code-factory-v5 --name maestro-dev-auth-test
daytona exec maestro-dev-auth-test -- claude --version
daytona exec maestro-dev-auth-test -- codex --version
daytona ssh maestro-dev-auth-test
```

Inside the SSH session, authenticate `claude` and `codex` using their supported
browser/device flow, then run:

```bash
claude -p "say hello"
codex run -p "say hello"
```

Do not commit or upload local `~/.claude` or `~/.codex` directories as part of a
snapshot build context. Those directories may contain subscription auth state.

## 2026-05-12 Initial Result

- Daytona CLI authenticated with the provided API key.
- CLI/API version mismatch observed: local CLI `v0.173.0`, API `v0.175.0`.
- `daytona snapshot create maestro-dev --dockerfile sandbox/Dockerfile --cpu 2
--memory 4 --disk 10` failed with `Forbidden: Access denied`, so the provided
  key does not currently allow custom snapshot creation.
- A default sandbox was created from `daytona-small` as `maestro-dev-auth-test`.
- Default sandbox has Claude Code installed: `2.1.19`.
- Codex was not present in the default snapshot; installing `@openai/codex` in
  the live sandbox produced `codex-cli 0.130.0`.
- `claude -p hello` failed with `Invalid API key - Please run /login`.
- `codex exec --skip-git-repo-check hello` failed with OpenAI
  `401 Unauthorized`, confirming no Codex auth state in the sandbox.
- The test sandbox was stopped after the probe.

Current conclusion: Daytona sandbox creation works, and subscription CLI auth
works after Tim manually logs in inside the sandbox. The remaining gap is making
that auth state repeatable for future sandboxes.

## 2026-05-12 Manual Auth Follow-Up

Sandbox: `c0a38490-8cf5-45ca-a12d-9537aa02cc4d`

- Claude Code: `2.1.19`.
- Codex: `0.130.0`.
- After manual login, `codex login status` reported `Logged in using ChatGPT`.
- `claude -p hello` returned a successful response.
- `codex exec --skip-git-repo-check hello` returned a successful response.

## 2026-05-12 Snapshot Permission Follow-Up

A broader Daytona key was installed into the local Daytona profile for
`https://app.daytona.io/api`.

- `daytona snapshot list -f json` works without per-command env overrides.
- `daytona snapshot create maestro-agent-test-20260512 -f sandbox/Dockerfile -c
sandbox --cpu 1 --memory 1 --disk 3` created active snapshot
  `1047d5db-7497-4fb0-85b6-c2c2cc284722`.
- The CLI stream reported `INTERNAL_ERROR` during export, but the server-side
  snapshot is active with `errorReason: null`.

Open issue: custom snapshot creation now works. The remaining repeatability gap
is subscription auth state for Claude/Codex. For repeatability, use one of:

- Daytona volume mounted at the agent home/config paths.
- A bootstrap step that installs missing CLIs and asks Tim to authenticate only
  when `claude -p hello` or `codex login status` fails.

## 2026-05-12 Agent Auth Bootstrap

Added `sandbox/bootstrap-agent-auth.sh` as the canonical sandbox-side auth probe.

Usage inside a Daytona sandbox:

```bash
sandbox/bootstrap-agent-auth.sh check
```

Use install mode when Codex is missing and `npm` is available:

```bash
sandbox/bootstrap-agent-auth.sh install
```

The script verifies:

- `claude --version`, then `claude -p "$CLAUDE_PROBE_PROMPT"`.
- `codex --version`, then `codex login status` with a
  `codex exec --skip-git-repo-check "$CODEX_PROBE_PROMPT"` fallback.
- Missing auth prints the manual `/login` and `codex login` steps.

It intentionally refuses to treat copied host auth directories as the pattern.
Do not copy local `~/.claude` or `~/.codex` into snapshot build contexts; use
a Daytona volume mounted at `MAESTRO_AGENT_STATE_DIR` for persistent
agent home/config state.

Fabro smoke run `01KRFNBDPQ66ZX32BWYJX484MX` validated the bootstrap script
syntax and safety markers.

## 2026-05-13 Code Factory Snapshot

Created and activated `maestro-code-factory-v5` from `sandbox/Dockerfile`.
The snapshot includes Node 22, Bun, Fabro CLI, Qlty, Promptfoo, Spec Kitty,
Claude Code, Codex, ShellCheck, Git, jq, ripgrep, and Python/pipx.

Fabro Daytona smoke run `01KRGN9SJX8VQN58BY5HWHY179` booted a fresh sandbox
from the v3 snapshot and verified:

- Required tools are available in the sandbox.
- GitHub network egress works.
- Fabro secret-vault references resolve into sandbox env without printing
  secret values.
- The sandbox stops cleanly after the run.

Fabro Daytona smoke run `01KRGS58K3WTD480RKW55KCWD4` booted a fresh sandbox
from the v5 snapshot and additionally verified:

- `fabro --version` works inside the sandbox.
- Claude Code and Codex CLIs are installed.
- The mounted agent-state volume is writable.

## 2026-05-13 Persistent Agent Auth Volume

Fabro fork work added `[run.sandbox.daytona.volumes]` support so the runtime
can pass Daytona volume mounts through sandbox creation. The local Daytona
volume is:

- name: `maestro-agent-auth`
- id: `beefe1da-59a0-48f6-9e19-a513d1790ce3`
- mount path: `/home/daytona/agent-state`
- subpath: `agent-auth`

`.fabro/project.toml` mounts that volume and sets
`MAESTRO_AGENT_STATE_DIR=/home/daytona/agent-state`. Inside a fresh sandbox,
run:

```bash
sandbox/bootstrap-agent-auth.sh check
claude
codex login
sandbox/bootstrap-agent-auth.sh check
```

The bootstrap script symlinks `~/.claude` and `~/.codex` into the mounted state
directory before probing auth, so successful logins persist across future Fabro
Daytona sandboxes that mount the same volume.

Fabro run `01KRGQSYTMGFWS1SQDA0W952Q8` verified the new volume-aware Daytona
run path. The created sandbox reported the mounted volume at
`/home/daytona/agent-state` with subpath `agent-auth`, then wrote
`volume-ready` to `$MAESTRO_AGENT_STATE_DIR/smoke/last-check.txt`.
