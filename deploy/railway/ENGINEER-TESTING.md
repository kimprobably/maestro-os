# Fabro Maestro Engineer Testing Guide

This is the first-pass test plan for the shared Railway Fabro server. The goal
is to learn how the stack behaves under realistic agent workflows, not just to
prove that commands return `0`.

Live server:

```text
https://fabro-maestro-production.up.railway.app
```

Use the API target for CLI commands:

```bash
export FABRO_WEB_URL="https://fabro-maestro-production.up.railway.app"
export FABRO_SERVER="$FABRO_WEB_URL/api/v1"
```

Get the dev token from Railway variables or the team password manager. Do not
paste real tokens into Slack, Linear, GitHub issues, logs, or docs.

```bash
fabro auth login --server "$FABRO_SERVER" --dev-token "$FABRO_DEV_TOKEN"
```

## First 30 Minutes

Start with boring connectivity checks.

```bash
curl -fsS "$FABRO_WEB_URL/health"
fabro model list --server "$FABRO_SERVER" --provider openrouter
```

Expected:

- `/health` returns `{"status":"ok"}`.
- `fabro model list --provider openrouter` includes Kimi, Gemini, Qwen, and
  DeepSeek models.
- The listed OpenRouter models show `configured: true`.

Then run a cheap single-model test before bulk testing credits:

```bash
fabro model test \
  --server "$FABRO_SERVER" \
  --provider openrouter \
  --model moonshotai/kimi-k2.6 \
  --no-upgrade-check
```

If that passes, run the broader OpenRouter smoke:

```bash
fabro run workflows/fabro/openrouter-model-smoke.toml \
  --server "$FABRO_SERVER" \
  --no-upgrade-check
```

Look at `.workflow/openrouter-model-smoke.md` afterward.

## Core Smoke Tests

Run these before trying large app-generation flows.

```bash
fabro run workflows/fabro/quality-stack-smoke.toml --server "$FABRO_SERVER" --no-upgrade-check
fabro run workflows/fabro/spec-kitty-contract-smoke.toml --server "$FABRO_SERVER" --no-upgrade-check
fabro run workflows/fabro/phased-application-build-contract-smoke.toml --server "$FABRO_SERVER" --no-upgrade-check
fabro run workflows/fabro/github-ci-smoke.toml --server "$FABRO_SERVER" --no-upgrade-check
fabro run workflows/fabro/linear-integration-smoke.toml --server "$FABRO_SERVER" --no-upgrade-check
```

For the remote server smoke, use the web URL, not the API URL:

```bash
FABRO_REMOTE_URL="$FABRO_WEB_URL" \
FABRO_REMOTE_DEV_TOKEN="$FABRO_DEV_TOKEN" \
fabro run workflows/fabro/remote-server-smoke.toml \
  --server "$FABRO_SERVER" \
  --no-upgrade-check
```

The smoke workflows write Markdown and JSON artifacts under `.workflow/`.
Those files are the best place to inspect what actually happened.

## Workflows To Play With First

Use this order.

1. `workflows/fabro/openrouter-model-smoke.toml`

   Confirms the model catalog, OpenRouter credentials, pricing metadata, and
   model routing assumptions. This should be the first failure boundary when
   model setup is wrong.

2. `workflows/fabro/quality-stack-smoke.toml`

   Checks Fabro server access, GitHub auth, OpenRouter models, Qlty, Spec
   Kitty, Daytona CLI availability, GitHub CLI auth, and Linear API access.

3. `workflows/fabro/spec-kitty-contract-smoke.toml`

   Verifies that Spec Kitty can initialize an isolated mission and that the
   managed skills surface is intact.

4. `workflows/fabro/phased-application-build-contract-smoke.toml`

   Validates the generic app-build workflow contract: goal expansion, spec
   validation, phase planning, approval gates, implementation phases, review
   fan-out, simplification review, final goal review, handoff, and memory
   summary.

5. `workflows/code/spec-to-application.toml`

   Takes a completed toy spec and builds toward an application in
   `apps/generated-app`. This is the safer first app-generation path because
   the spec is already reasonably concrete.

6. `workflows/code/phased-application-build.toml`

   Starts from `specs/factory/vague-goal.md` and exercises the more generic
   vague-goal-to-implementation workflow.

For early testing of app-generation flows, prefer:

```bash
fabro run workflows/code/spec-to-application.toml \
  --server "$FABRO_SERVER" \
  --sandbox daytona \
  --preserve-sandbox \
  --no-upgrade-check
```

Use `--preserve-sandbox` only while debugging. Clean up Daytona sandboxes after
you finish inspecting them.

## What To Evaluate

Capture notes on these dimensions.

- Does the run decompose the goal into a useful spec, or does it invent vague
  implementation tasks too early?
- Are approval gates placed where a human would naturally want to stop and
  review?
- Do review nodes disagree in useful ways, or are they redundant?
- Does the simplification review actually remove unnecessary code and scope?
- Do Kimi, Qwen, DeepSeek, Gemini, and Claude routes behave differently enough
  to justify explicit model routing?
- Are errors actionable, or do failed stages just say that the agent failed?
- Are secrets redacted in Fabro logs, Railway logs, workflow artifacts, and
  generated handoffs?
- Does Daytona setup give agents the local skills, CLIs, auth, and internet
  access they need?
- Do GitHub and Linear actions create the right artifacts without noisy or
  destructive side effects?

## Model Routing Notes

The current experimental routing shape is:

- Cheap/default orchestration: `openrouter` + `anthropic/claude-haiku-4-5`
- Code generation experiments: Kimi, Qwen, and DeepSeek Flash/Pro
- Hard review/spec review: Gemini Pro Preview, Claude/Codex where available
- Cost-sensitive checks: DeepSeek Flash or Gemini Flash Lite

Do not treat this as settled. The point of the next round of tests is to record
which model is best for each stage: spec drafting, spec review, ADR writing,
implementation, correctness review, test review, security review, and
simplification.

## Suggested Test Scenarios

Use small, concrete tasks first.

- Generate a tiny Slack workflow from `specs/scaffold/toy-slack-hello.md`.
- Ask the vague-goal workflow to turn `specs/factory/vague-goal.md` into a spec
  and stop at the approval gate.
- Run the same coding task through Kimi, Qwen, and DeepSeek, then compare
  correctness and cleanup burden.
- Force a reviewer to reject a weak implementation and verify the retry path is
  clear.
- Verify that Qlty/CI feedback becomes a repair task, not just a final report.
- Create or reference a Linear issue from a workflow and check whether the
  generated status update is useful to a human.

## Known Caveats

- GHCR is currently private. Railway is running from an uploaded minimal Docker
  source context, not a direct public image pull.
- Keep Railway at one replica because Fabro uses the mounted `/storage` volume
  as shared state.
- `/api/v1/health` returns `404` after install. Use `/health` for a public
  health probe.
- `remote-server-smoke` expects Slack and GitHub integration settings to be
  enabled. If it fails there, inspect whether the issue is integration config
  versus server reachability.
- Some workflows intentionally use local scripts under this repo. Run them from
  the repo root unless the workflow says otherwise.

## Reporting Back

For each real test run, capture:

- Run ID and workflow path.
- Goal or spec used.
- Models used per stage.
- Which stages failed, retried, or required human intervention.
- Output artifact paths under `.workflow/`.
- Whether the result should change workflow design, model routing, sandbox
  setup, or quality gates.

The most useful feedback is not "it failed"; it is the smallest workflow,
prompt, model route, or environment assumption that made it fail.
