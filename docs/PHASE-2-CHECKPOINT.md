# Phase 2 Checkpoint

Date: 2026-05-13
Status: in progress

## Completed

- Added the local `maestro` CLI scaffold with Slack posting, Slack gate acknowledgement, memory append/read helpers, knowledge reads, read-only DB query guardrails, Fabro DOT validation, workflow registration, spec-quality validation, workflow-quality validation, required-fields validation, and text verdict gates.
- Linked `fabro` onto the local path at `~/.local/bin/fabro`.
- Patched the Fabro fork so CLI-backed Anthropic stages can fall back to ambient logged-in `claude` CLI auth when no server-owned CLI credential is configured.
- Rebuilt and restarted the Fabro server on `http://127.0.0.1:32276`.
- Confirmed a real scaffold run can execute CLI-backed Claude stages through the server.
- Added the Spec Kitty-compatible spec-lift workflow: `workflows/scaffold/spec-lift-workflow.fabro`.
- Added the Clone Substack-inspired spec-to-application workflow: `workflows/code/spec-to-application.fabro`.
- Added a completed toy spec fixture at `specs/scaffold/completed-toy-slack-hello.md`.
- Added deterministic gates for spec quality, workflow quality, reviewer verdicts, required fields, Qlty/native checks, browser checks, artifact checks, fidelity review, and final review consensus.
- Added a generic Solitaire-style phased app build workflow at `workflows/code/phased-application-build.fabro`. It expands a goal/spec, creates a four-phase plan, implements foundation/core/interface/integration layers, verifies each layer independently, runs deterministic native checks, performs final reviewer fanout, and publishes a handoff only after approval.
- Added a Daytona-ready run config for the phased app build workflow at `workflows/code/phased-application-build.daytona.toml`.
- Added `workflows/fabro/phased-application-build-contract-smoke.fabro`; run `01KRFXVCYCQ6GDC58DA4YV7RH9` verified the generic phased-build contract through Fabro.
- Added Railway handoff notes under `deploy/railway/` for sharing a cloud Fabro server with an engineer without committing raw secrets.
- Installed and initialized Qlty (`0.630.0`) with explicit local plugins for Prettier, Markdownlint, Yamllint, ShellCheck, Rustfmt, Clippy, OSV Scanner, and Gitleaks. Local `.env*` files are excluded from Qlty scans so developer secrets are not emitted by local all-file checks.
- Installed and initialized Spec Kitty (`3.1.8`) for Codex and Claude Code. Spec Kitty-managed agent folders are ignored; project metadata and manifests live under `.kittify/`.
- Added `maestro doctor quality-stack` as the single local readiness check for Fabro, GitHub integration, OpenRouter model routing, Qlty, Spec Kitty, Daytona, GitHub CLI auth, Claude, Codex, and required env presence.
- Added `workflows/fabro/quality-stack-smoke.fabro`; run `01KRFMFEMA5XN85BXJQVPZNPN1` completed successfully through Fabro.
- Added GitHub Actions quality automation in `.github/workflows/quality.yml`: Bun tests, Bun build check, Qlty config/tool install/report, and Spec Kitty setup verification. Added `workflows/fabro/github-ci-smoke.fabro`; run `01KRFMYQB7607TKRRE6J1G420F` completed successfully through Fabro.
- Wired Spec Kitty into `workflows/scaffold/spec-lift-workflow.fabro`: the workflow now records Spec Kitty setup by default, can create a mission when `spec_kitty_feature` is supplied, and publishes the completed spec back to the mission's `spec.md`.
- Added `workflows/fabro/spec-kitty-contract-smoke.fabro`; run `01KRFN3092VJVWVBGFHSZRRJKP` verified Spec Kitty `init`, `specify`, and `verify-setup` contracts in an isolated temp repo.
- Added `sandbox/bootstrap-agent-auth.sh` as the Daytona sandbox-side auth
  probe for Claude Code and Codex. It checks installed CLIs, verifies
  subscription auth with bounded probes, can install missing Codex when
  requested, and documents the manual login/Daytona volume pattern. Added
  `workflows/fabro/daytona-auth-bootstrap-smoke.fabro`; run
  `01KRFNBDPQ66ZX32BWYJX484MX` validated the script contract through Fabro.
- Normalized the legacy Phase 1 test workflows to the current Maestro
  workflow contract: graph persona/input/output metadata, `.coding` and
  `.review` model classes, an explicit STOP gate before Slack posting, and a
  child-workflow validation node.
- Added the first cloud deployment pack at `deploy/fabro-server/`: Docker
  Compose, Caddy reverse proxy, server settings, env template, and a remote
  smoke script for health/settings/workflow API checks.
- Added operational Fabro workflows for cloud readiness and workflow setup:
  `cloud-deployment-pack-smoke.fabro`, `remote-server-smoke.fabro`, and
  `spike-workflow-registry-smoke.fabro`.
- Fresh operational smokes passed through Fabro: deployment pack run
  `01KRFPMBBV6ZKGY01VX2RGV0DG`, workflow registry run
  `01KRFPMBBWZ2K6M5R587725M8K`, and GitHub integration run
  `01KRFPFTWGFW8YTTAGYRS7YFR1`.
- Added Linear bridge scaffolding: `maestro linear smoke`, `linear_api` in
  `doctor quality-stack`, cloud/local env placeholders, Linear setup docs, and
  `workflows/fabro/linear-integration-smoke.fabro`. The Linear API bridge is
  installed locally and can read the Modern Agency Sales workspace/team. Fabro
  smoke run `01KRFR8HR7E3Y0DY28RMKGG53G` completed successfully.
- Added shared Fabro project defaults in `.fabro/project.toml` for Daytona
  code-factory runs: v5 snapshot, full agent permissions, GitHub write
  permissions, artifact capture, allow-all network, and secret-vault sandbox
  env injection for OpenRouter, Apify, Daytona, Linear, Slack, and Fabro.
- Created active Daytona snapshot `maestro-code-factory-v5` with Node 22, Bun,
  Fabro CLI, Qlty, Promptfoo, Spec Kitty, Claude Code, Codex, ShellCheck, Git,
  jq, ripgrep, Python/pipx, and unzip. Snapshot v5 installs the public Fabro
  release tarball directly from GitHub Releases so nested `fabro validate`
  calls work inside remote sandboxes without GHCR auth. Fabro smoke run
  `01KRGS58K3WTD480RKW55KCWD4` confirmed v5 boots, `fabro --version`,
  Claude Code, Codex, GitHub egress, secret-backed env flags, and the writable
  agent-state volume all work in a fresh Daytona sandbox.
- Captured useful Fabro tutorial/example patterns in
  `knowledge/fabro-workflow-patterns.md`: fanout/fan-in review, model routing,
  ensembles, sub-workflows, Clone Substack quality loops, and vague-goal
  layering from the Solitaire example.
- Added the v0 goal-to-production factory workflow:
  `workflows/factory/goal-to-production.fabro`. It takes a vague goal, creates
  a Spec Kitty mission, drafts and reviews a spec, gates human approval, writes
  architecture/ADR/work packages, implements, runs native checks, fans out code
  review, simplifies, runs CI/CD checks, final-reviews, and publishes a handoff.
- Added `workflows/fabro/goal-to-production-contract-smoke.fabro` to keep the
  factory workflow's required end-to-end stages, prompts, human gates, review
  fanout, simplify step, CI/CD gate, and handoff contract under a fast Fabro
  regression check. Run `01KRFRNTD98ZW71QK51JC4SHQK` completed successfully.
- Added the GTM outreach-draft workflow, fixtures, prompts, and Promptfoo eval
  scaffold under `workflows/gtm/`, `prompts/gtm/`, `specs/gtm/`, and `evals/`.
- Promoted the Spike §5.6 GTM validators into executable Maestro commands:
  `email-deliverable`, `outreach-voice-match`, `outreach-banned-phrases`,
  `outreach-length`, and `dedup-lead`. The outreach workflow now calls these
  shared validators instead of embedding all validation logic inline.
- Registry run `01KRFXYHJV3G6V0Q56Y83V6Y0D` validated, quality-checked, and
  registered 24 Fabro workflows with zero failures.
- Reran the scaffold workflow after the latest prompt and review-gate updates.
  Local Fabro run `01KRGP0FJXGG58VZ15H6SHMGQ6` generated
  `workflows/scaffold/generated-toy-slack-hello.fabro`, passed DOT syntax,
  workflow-quality validation, strict reviewer JSON gating, final human
  approval, and workflow registration without manual correction. The generated
  workflow now includes the required STOP gate with approve/reject/edit paths,
  validates revisions before posting, validates every material output, and uses
  explicit `condition="outcome=succeeded"` success routing.
- Removed host-local checkout paths from the scaffold and spec-lift graphs so
  their command stages are repository-relative. The workflow generation and
  review prompts now reject `/Users/...`, `/home/...`, and machine-specific
  checkout paths in generated workflows as portability issues.
- Removed host-local checkout paths from the remaining executable code, GTM,
  factory, phase 1, and Fabro smoke workflows. Fabro registry smoke run
  `01KRGR4HVQPF0ZZM0KADFJV3JR` validated, quality-checked, and registered all
  27 workflows with zero failures after the portability pass.
- Added Daytona persistent volume support to the Fabro fork and rebuilt the
  local `fabro` binary. `.fabro/project.toml` now mounts the
  `maestro-agent-auth` volume at `/home/daytona/agent-state` and sets
  `MAESTRO_AGENT_STATE_DIR` for sandbox-side Claude/Codex auth bootstrap.
  Daytona environment smoke run `01KRGQSYTMGFWS1SQDA0W952Q8` succeeded and the
  created sandbox reported the mounted volume. The run also wrote
  `volume-ready` into the mounted agent-state directory, proving the volume is
  writable from Fabro-created Daytona sandboxes.

## Clone Substack Pattern Incorporated

The Fabro Clone Substack example sets the quality pattern for app generation: bootstrap, spec expansion, plan fanout, implementation, deterministic verification chain, fidelity review, parallel reviewer fanout, consensus, and postmortem repair.

Maestro now mirrors that shape in two workflows:

- `spec-lift-workflow.fabro`: idea to completed spec, with product, engineering, and quality reviewers before approval.
- `spec-to-application.fabro`: completed spec to app, with Qlty/native/browser/artifact gates, fidelity review, correctness/test/security reviewers, and postmortem repair.

## Current Findings

- `goal_gate=true` is not a routing primitive. Fabro still requires explicit transition edges. For quality gates, the passing edge should use `condition="outcome=succeeded"` and the repair edge should be the unconditional fallback.
- Fabro also requires an unconditional fallback when a node uses conditional outgoing edges.
- The first real scaffold run proved the ambient CLI auth patch works, but also showed why deterministic gates need to be broader than Fabro syntax validation.
- The generated toy workflow passed DOT syntax but used unsupported `${CONTEXT:...}` and JavaScript-style interpolation. `maestro verify workflow-quality` now rejects those patterns.
- A later generated toy workflow used pseudo-Fabro attributes (`stage_type`, `validator_type`, `command`, `output_key`) and hallucinated runtime files. `maestro verify workflow-quality` now rejects unsupported attributes and flags files that are read but never written.
- The first fresh scaffold run on the patched graph correctly routed from reviewer rejection to the fix loop. It was stopped after proving the gates because its prompt snapshot predated the latest fix-loop guidance.
- A fresh scaffold run without `--sandbox local` defaulted to Docker and failed
  because the scaffold graph still embeds host-local absolute paths and expects
  local Claude CLI availability. That is a useful environment-boundary finding:
  scaffolding workflows must become repo-relative/Daytona-safe before they can
  run reliably in default remote sandboxes.
- `workflows/scaffold/generated-toy-slack-hello.fabro` now reaches the same
  standard by generation, not manual repair: real Fabro nodes only, explicit
  STOP gate with revision path, deterministic file writes before reads, syntax
  validation, workflow-quality validation, standards review, and workflow
  registration.

## Open Gaps

- Run selected repo-relative code/GTM/factory workflows in Daytona now that the
  workflow library is portable enough for remote execution.
- Daytona code-factory toolchain, secret injection, and persistent auth volume
  mounting now have passing fresh sandbox smokes. The remaining manual step is
  to enter one mounted sandbox, run `sandbox/bootstrap-agent-auth.sh check`,
  complete `claude` and `codex login`, and rerun the check so the mounted
  volume holds reusable subscription auth.
- Cloud Fabro deployment is packaged but not deployed yet; it needs a target
  host/domain and a fork image if we want the remote server to include local
  fork-only changes before they land upstream.
- The Codex Linear connector still needs OAuth reauthentication for connector
  tools. The Maestro/Fabro automation path uses the installed Linear API key.
- Qlty, Spec Kitty, Linear, GitHub, Daytona, Slack, OpenRouter, Claude Code,
  and Codex are captured by `maestro doctor quality-stack`; Spec Kitty mission
  creation is wired into spec-lift and goal-to-production. Direct Spec Kitty
  work-package allocation/review actions still need deeper runtime integration.
- The database-backed memory path has guardrails, but only local file-backed memory has been exercised in this checkpoint.
- Fabro preflight still warns that the Anthropic API provider is not configured for CLI-backed workflows; this is expected for ambient CLI auth, but preflight should eventually learn how to check CLI login state.
