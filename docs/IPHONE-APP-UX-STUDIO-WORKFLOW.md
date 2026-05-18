# iPhone App UX Studio Workflow

The iPhone App UX Studio workflow iterates on an existing iPhone app. It is for serious UI/UX improvement passes that need current-app intake, baseline screenshots, competitor and pattern research, Mobbin MCP references, private design corpus memory, adversarial design directions, implementation evidence, hosted iOS validation, and postmortem learning capture.

Use it when the app already exists and the goal is to improve visual quality, interaction flow, screen clarity, accessibility, screenshots, or retention-critical UX. Use `build-iphone-app` when the goal is to create a new app from an opportunity and SwiftAIBoilerplatePro foundation.

## When To Use

Use UX Studio instead of `build-iphone-app` for:

- existing repos or mounted app directories
- redesigns, design-system upgrades, screen-flow improvements, and app-specific UI polish
- iterations that must preserve existing product behavior, bundle identity, auth, payments, storage, CI, and release setup
- runs that need Mobbin, Page Flows, competitor screenshots, or private design corpus references as research inputs

Do not use it to rebuild an app from scratch, replace product architecture, change commercial terms, or clone another app's screen design.

## Mobbin MCP Setup

Mobbin is optional but expected for high-quality design research when MCP OAuth is available. Configure it for Claude Code and Codex CLI on the worker host:

```bash
claude mcp add mobbin --transport http https://api.mobbin.com/mcp
codex mcp add mobbin --url https://api.mobbin.com/mcp
claude mcp list
codex mcp list
```

Complete OAuth through the MCP client once, then let the cloud profile reuse that authorization. The automated Fabro research stage uses Codex MCP, so Codex Mobbin OAuth is the hard preflight requirement; Claude Code Mobbin auth is useful for manual/cloud-agent design research but is not required by the Daytona stage. The UX Studio workflow does not require `MOBBIN_EMAIL` or `MOBBIN_PASSWORD`.

Daytona workers do not inherit the operator's local Codex OAuth store. For remote runs, use Codex's file-backed MCP OAuth store and provide the base64 contents of `.codex/.credentials.json` through `CODEX_MCP_CREDENTIALS_JSON_BASE64`; the workflow restores that file into `$CODEX_HOME` before checking Mobbin MCP.

Do not write Mobbin credentials, OAuth tokens, cookies, MCP session material, screenshots, or raw proprietary assets into prompts, committed config, postmortems, or app code. Agents may abstract patterns and interaction principles from Mobbin. They must not copy layouts, copy, brand identity, visual assets, or distinctive screen compositions.

## Private Design Corpus Policy

The design corpus under `hermes/design-corpus/` is a private research memory for source metadata, private asset metadata, derived observations, and reference packs.

- Raw competitor and Mobbin screenshots are private-only research artifacts.
- App repos should contain our own screenshots and implementation evidence, not copied reference libraries.
- Use `scripts/iphone-app-factory/design-corpus.mjs` for durable sources, assets, observations, and reference packs.
- Every reusable observation needs `what_to_adapt` and `what_not_to_copy`.
- Mobbin references should prefer source IDs, URLs, titles, tags, and derived notes. Store raw Mobbin assets only when the source policy explicitly allows retention.

## Railway And Daytona Requirements

Real UX Studio runs should use Railway-hosted Fabro and Daytona worker sandboxes:

```bash
export FABRO_SERVER="https://fabro-maestro-production.up.railway.app/api/v1"
node scripts/iphone-app-factory/ux-studio-preflight.mjs --server "$FABRO_SERVER"
```

The run environment must include Fabro/GitHub/agent credentials, OpenRouter, Apify, and Mobbin MCP OAuth when Mobbin research is enabled. The Daytona config must allow network access for GitHub, App Store, Apple HIG, Mobbin MCP, Page Flows, Reddit, CI, and package installation.

Local Fabro is only for isolated experiments. A local run will not appear in the shared Railway UI and should not be used for overnight or handoff-quality UX Studio work unless the run explicitly sets an allow-local mode.

The workflow starts from the `maestro-os` workflow checkout, then runs `checkout_existing_app` to clone `repo_url` into `app_dir`. Use a concrete relative checkout directory such as `apps/waketask-ios`; do not use `app_dir = "."`, because that would point implementation stages at the workflow repository instead of the iPhone app.

If Mobbin MCP is intentionally disabled, set `use_mobbin_mcp = "false"` and `UX_USE_MOBBIN_MCP = "false"` in the run config. The run should record the weaker reference set in the postmortem and final review.

## Expected Artifacts

UX Studio runs should leave these artifacts under `.workflow/iphone-app-ux-studio/`:

- `preflight.json`
- `research/existing-app-intake.md`
- `research/reference-gap-analysis.json`
- `research/competitor-flows.md`
- `research/app-store-review-mining.md`
- `research/mobbin-mcp-research.md`
- `research/pageflows-research.md`
- `research/apple-hig-research.md`
- `research/behavioral-ux-research.md`
- `research/design-opportunity-synthesis.md`
- `research/reference-pack.json`
- `design/tournament-consensus.json`
- `design/tournament-gate.json`
- `design/screen-spec.md`
- `design/screen-spec.json`
- `implementation-plan.md`
- `evidence/visual-system.md`
- `evidence/screen-flows.md`
- screenshot manifests and Appium/XCUITest output
- hosted macOS CI references
- final review and handoff artifacts
- `postmortem.md`
- `postmortem-gate.json`

If a required artifact is intentionally absent, the stage must say why and identify the retry target.

For Fabro parallel research fanouts, `research/reference-pack.json` is the deterministic gate contract after `design_opportunity_synthesis`. Branch Markdown artifacts are expected when available, but the parent workspace may only preserve the selected fan-in branch head. In that case the gate should surface missing branch sidecars as report metadata while continuing if `reference-pack.json` has sufficient source coverage, adaptation guidance, and no secret-looking values.

## WakeTask Rehearsal

Use WakeTask as the concrete rehearsal for existing-app UX iteration. Generate or check in a run-specific config at `workflows/iphone-app-factory/runs/waketask-ux-studio.railway.toml`, then launch it against Railway Fabro:

```bash
export FABRO_SERVER="https://fabro-maestro-production.up.railway.app/api/v1"
node scripts/iphone-app-factory/create-run-config.mjs \
  --mode ux-iteration \
  --repo-url https://github.com/kimprobably/waketask-ios.git \
  --base-branch main \
  --run-branch ux-studio/waketask-$(date +%Y%m%d-%H%M%S) \
  --target-audience "US consumer iPhone users who struggle to wake up reliably" \
  --app-name WakeTask \
  --bundle-id com.keen.waketask \
  --app-dir apps/waketask-ios \
  --app-domain alarm_clock \
  --design-goal "Make setup calm and trustworthy, wake mode impossible to misunderstand while half-asleep, and completion/accountability satisfying enough to support retention." \
  --out workflows/iphone-app-factory/runs/waketask-ux-studio.railway.toml
node scripts/iphone-app-factory/ux-studio-preflight.mjs --server "$FABRO_SERVER"
fabro run workflows/iphone-app-factory/runs/waketask-ux-studio.railway.toml --server "$FABRO_SERVER" --no-upgrade-check
```

The WakeTask design goal is: make setup calm and trustworthy, wake mode impossible to misunderstand while half-asleep, and completion/accountability satisfying enough to support retention.

After launch, attach the babysitter so Hermes gets durable run state:

```bash
node scripts/fabro/babysit-run.mjs --run-id <run-id> --server "$FABRO_SERVER"
```

## Troubleshooting

`preflight.json` reports missing environment keys:
Set the named variables in the run environment. Do not paste values into logs or prompts.

Mobbin MCP is not configured:
Run `claude mcp add mobbin --transport http https://api.mobbin.com/mcp` and `codex mcp add mobbin --url https://api.mobbin.com/mcp`, complete OAuth, restart the agent session, then rerun preflight.

Mobbin MCP is configured but not authorized:
Complete the interactive Mobbin authorization in Claude Code. Non-interactive workflow runs should fail clearly rather than dumping credentials.

The run appears only on local Fabro:
Check `FABRO_SERVER`. It must be `https://fabro-maestro-production.up.railway.app/api/v1` for shared runs.

Daytona cannot reach research or CI targets:
Verify the workflow TOML uses Daytona with network access enabled, then rerun the preflight and Daytona smoke checks.

The design tournament gate fails:
Check `.workflow/iphone-app-ux-studio/design/tournament-consensus.json` for at least three directions, exactly one selected winner, required score fields, screen-level implications, and a no-clone statement.

The screenshot or Appium gate fails:
Treat screenshots and Appium output as evidence, not decoration. Rerun the failed capture or record the exact missing state and retry target.

The postmortem gate fails:
Update `.workflow/iphone-app-ux-studio/postmortem.md` with the required sections, then rerun `node scripts/iphone-app-factory/ux-postmortem-gate.mjs`.
