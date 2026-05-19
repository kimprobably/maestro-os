# Hermes Reliability Execution Evidence - 2026-05-19

This file records non-secret execution evidence for the Hermes Slack reliability,
Quincy babysitter, Superpowers, and Fabro Codex auth work.

## Subagent Execution

All five implementation workstreams were executed by delegated worker agents in
the `codex/hermes-emoji-ack` worktree:

| Workstream | Agent ID | Result | Focused Verification |
| --- | --- | --- | --- |
| Slack emoji ack and ledger thread recovery | `019e3ea3-c785-7190-9252-4bc9b61ba18e` | DONE | `node --test scripts/hermes/test-patch-hermes-slack.mjs`; `python3 -m py_compile hermes/deploy/railway-gateway/patch-hermes-slack.py` |
| Turn limits and timeout copy | `019e3ea3-c837-7243-80b2-f5a2509d681c` | DONE | `node --test scripts/hermes/test-railway-gateway-config.mjs scripts/hermes/test-patch-hermes-base-reliability.mjs`; `python3 -m py_compile hermes/deploy/railway-gateway/patch-hermes-base-reliability.py` |
| Quincy Kanban babysitter lane | `019e3ea3-c907-7da1-91a6-35d22b3a0561` | DONE | `node --test scripts/hermes/test-quincy-babysitter-task.mjs scripts/hermes/test-agent-registry.mjs` |
| Fabro Codex auth helper and docs | `019e3ea3-c993-78c3-b9ac-80f2b290b827` | DONE | `node --test scripts/fabro/test-refresh-codex-auth-railway.mjs` |
| Superpowers skill distribution | `019e3ea3-ca53-7290-9c18-c50c19e663b4` | DONE | `node --test scripts/hermes/test-sync-superpowers-skills.mjs scripts/hermes/test-specialist-profiles.mjs scripts/hermes/test-bootstrap-agent-workflow.mjs` |

Spec review agent `019e3eab-bf8b-7753-9e12-91eaaf2d6950` found integration
gaps after the first pass. Those gaps were fixed in this branch:

- Miles SOUL files now explicitly hand long Fabro runs to Quincy via
  `scripts/hermes/quincy-babysitter-task.mjs`.
- `SLACK_FABRO_RUNS_CHANNEL` is mapped at gateway startup.
- `C_FABRO_RUNS` prompts now require compact run status, blockers, terminal
  states, Kanban/run-ledger use, and no raw logs or secrets.
- This evidence file records subagent execution and live Codex auth status.

## Focused Verification

Combined focused test command:

```bash
node --test \
  scripts/fabro/test-refresh-codex-auth-railway.mjs \
  scripts/hermes/test-patch-hermes-slack.mjs \
  scripts/hermes/test-patch-hermes-base-reliability.mjs \
  scripts/hermes/test-railway-gateway-config.mjs \
  scripts/hermes/test-quincy-babysitter-task.mjs \
  scripts/hermes/test-sync-superpowers-skills.mjs \
  scripts/hermes/test-specialist-profiles.mjs \
  scripts/hermes/test-bootstrap-agent-workflow.mjs \
  scripts/hermes/test-agent-registry.mjs
```

Result after integration fixes and review-gap patches: 39 tests passed.

Python patcher compile command:

```bash
python3 -m py_compile \
  hermes/deploy/railway-gateway/patch-hermes-slack.py \
  hermes/deploy/railway-gateway/patch-hermes-base-reliability.py \
  hermes/deploy/railway-gateway/patch-hermes-auxiliary-budgets.py \
  hermes/deploy/railway-gateway/patch-hermes-learning.py
```

Result: passed after integration fixes.

## Fabro Codex Auth

The failed Fabro run requiring attention is:

```text
01KRYZDZ1WJHFP0ZEH9EY09QW1
```

Observed failure class:

- deterministic Codex CLI auth failure;
- Codex CLI exited before implementation;
- websocket returned HTTP 401 Unauthorized;
- failed run reported `codex_auth_installed=true` and
  `codex_mcp_credentials_installed=true`;
- preserved sandbox name: `fabro-01KRYZDZ1WJHFP0ZEH9EY09QW1`;
- run branch/SHA from the babysitter report:
  `fabro/run/01KRYZDZ1WJHFP0ZEH9EY09QW1 @ 7342a2a09402f69b41e63af5aa6978e4f15df524`.

Live auth actions completed without printing secret values:

- `codex login status` returned `Logged in using ChatGPT`.
- `$HOME/.codex/auth.json` exists and parses as JSON.
- `CODEX_AUTH_JSON_BASE64` was refreshed in the hosted Fabro secret store using
  stdin. Fabro reported `updated_at=2026-05-19T05:11:32.295094750Z`.
- `CODEX_AUTH_JSON_BASE64` was refreshed in the `fabro-maestro` Railway service
  using `railway variable set ... --stdin --skip-deploys`; Railway returned
  `{"keys":["CODEX_AUTH_JSON_BASE64"],"set":true}`.
- `fabro-maestro` was redeployed after the auth refresh. Deployment
  `c380c1fc-73e9-4f07-b76c-9cc06ec25611` reached `SUCCESS`.

Codex MCP credential status:

- `CODEX_MCP_CREDENTIALS_JSON_BASE64` is present in the hosted Fabro secret
  store with `updated_at=2026-05-16T20:48:12.591495585Z`.
- Local `$HOME/.codex/.credentials.json` is absent, so no newer MCP credential
  file was available to push during this pass.
- The failed run had already installed MCP credentials successfully; the
  observed blocker was the Codex CLI auth refresh token.

Runtime validation:

- `railway run --service fabro-maestro --environment production -- node scripts/fabro/railway-preflight.mjs ...`
  saw no missing required env keys and confirmed Railway health/settings.
- The same preflight currently fails on two non-auth gates: this branch has
  uncommitted workflow/script/doc changes, and the hosted `/workflows` endpoint
  returns 501.
- `railway run --service fabro-maestro --environment production -- node scripts/fabro/babysit-run.mjs --run-id 01KRYZDZ1WJHFP0ZEH9EY09QW1 --once --no-fail-on-terminal-failure`
  wrote/returned a non-secret summary with `ok=true`, `last_event_cursor=38`,
  and `next_action=continue polling Fabro events`.

## Remaining Before Retry

- Commit, push, merge, and deploy the Hermes reliability branch.
- Rerun the focused test suite after any later patch before merge or deploy.
- Run a fresh Fabro runtime smoke or fork/retry only after the branch is merged
  or from a clean pushed worktree so the Fabro preflight git gate can pass.
