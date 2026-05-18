# UX Postmortem Learning Capture

Close the UX Studio run with a concise, evidence-backed postmortem at `.workflow/iphone-app-ux-studio/postmortem.md`.

## Inputs To Inspect

Inspect the current Fabro run before writing conclusions:

- Fabro run events from the available Fabro MCP tools or CLI, including retries, failed nodes, reviewer decisions, gate output, and manual steering.
- `.workflow/iphone-app-ux-studio/preflight.json`
- `.workflow/iphone-app-ux-studio/research/**`
- `.workflow/iphone-app-ux-studio/design/**`
- `.workflow/iphone-app-ux-studio/implementation-plan.md`
- `.workflow/iphone-app-ux-studio/evidence/**`
- screenshot manifests, Appium/XCUITest reports, hosted macOS CI output, review notes, final consensus, and handoff artifacts.
- changed source files, tests, workflow config, prompt files, and scripts relevant to the UX iteration.

Do not rely on chat memory when a run event or artifact can answer the question.

## Failure Classification

Classify each meaningful issue into one or more of these buckets:

- control-plane or Railway routing
- Daytona sandbox, network, or bootstrap
- credentials, MCP, or private reference access
- research evidence quality
- Mobbin/Page Flows/private corpus policy
- design synthesis or originality
- implementation scope control
- SwiftUI visual system or screen-flow execution
- screenshot/Appium evidence
- hosted macOS CI
- review fanout or consensus quality
- prompt context budget or prompt clarity
- Hermes/operator ledger, run babysitting, or handoff

For each failure, capture the artifact or event that proves it. If evidence is absent, say that evidence is absent instead of guessing.

## Required Postmortem Sections

Write these exact headings:

```markdown
# UX Studio Postmortem

## Run Summary
## What Worked
## What Failed
## Where Agents Needed Steering
## Gate Effectiveness
## Prompt Improvements
## Workflow Improvements
## Design Corpus Additions
## Next-Run Recommendations
```

Each section should be short and concrete. Prefer bullets that include the relevant artifact path, gate name, run event, or CI check. Mark inference explicitly when the evidence is indirect.

## Learning Capture

Identify reusable learnings that should change future UX Studio runs. Split them into:

- prompt improvements: clearer instructions, missing artifact requirements, anti-cloning constraints, verifier rubrics, or context-budget changes.
- workflow improvements: new gates, retries, fanout joins, preflight checks, artifact publication, CI checks, or handoff requirements.
- design corpus additions: reusable observations from research or run evidence that help future apps without copying competitor screens.

When the existing Hermes/Fabro ledger CLI is available, append a compact postmortem event:

```bash
node scripts/fabro/run-ledger.mjs append-event \
  --run-id <run-id> \
  --current-status postmortem \
  --next-action "<next operator action>" \
  --payload-json <redacted-postmortem-summary-json>
```

If the generalized operator ledger is the better target and its CLI is available, record the same learning as a Fabro-run subject:

```bash
node scripts/operator-ledger/operator-ledger.mjs append-event \
  --subject-type fabro-run \
  --subject-key <run-id> \
  --event-type ux_postmortem_learning \
  --payload-json <redacted-learning-json>
```

When a learning is useful for future design work and the design corpus CLI is available, add a derived observation. Do this only for abstract reusable principles, not raw competitor assets or copied layouts:

```bash
node scripts/iphone-app-factory/design-corpus.mjs add-observation \
  --source-id <existing-or-postmortem-source-id> \
  --app-domain <domain> \
  --screen-type <screen-type> \
  --observation-type postmortem_learning \
  --summary "<evidence-backed observation>" \
  --what-to-adapt "<reusable principle>" \
  --what-not-to-copy "<protected or harmful pattern to avoid>" \
  --tags postmortem,ux-studio
```

If a CLI, database, or source id is unavailable, do not fabricate a write. Note the skipped update and the reason in `## Design Corpus Additions` or `## Next-Run Recommendations`.

## Output Rules

- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, customer data, environment variable values, or raw authorization headers.
- If source material contains secret material, write only `secret material omitted`.
- Do not paste raw Mobbin, Page Flows, or competitor screenshots into public app artifacts.
- Treat raw reference assets as private-only. Capture abstract observations, not copied screens, copy, visual identity, or proprietary interaction sequences.
- Preserve existing useful postmortem content if rerunning; update it instead of deleting evidence.
