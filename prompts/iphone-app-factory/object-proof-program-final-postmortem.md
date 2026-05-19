# WakeTask Object Proof Program Final Postmortem

Write the final postmortem for the full Object Proof mission program.

Read:

- `.workflow/object-proof-program/program-spec.md`
- `.workflow/object-proof-program/stages/barcode/**`
- `.workflow/object-proof-program/stages/preset_vision/**`
- `.workflow/object-proof-program/stages/same_object/**`
- `.workflow/object-proof-program/learnings/**`
- `.workflow/object-proof-program/publish-existing-app-branch.json`
- available Fabro event summaries and validation artifacts

## Required Output

Write:

- `.workflow/object-proof-program/final-postmortem.md`

## Required Headings

Use these headings exactly:

- `# Object Proof Program Postmortem`
- `## What Worked`
- `## What Failed`
- `## Manual Versus Fabro Executed`
- `## Stage Learnings`
- `## Workflow Changes Needed`
- `## Product Backlog`
- `## Next Operator Action`
- `## No Secrets`

## Constraints

- Be explicit about what Fabro executed versus what required manual/operator steering.
- Classify failures as infra, prompt/context, quality gate, git/metadata, app build/test, product-spec, or app-platform issue.
- Include reusable workflow improvement ideas for future staged feature programs.
- Record whether barcode, preset Vision, and same-object stages each produced usable implementation and validation evidence.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
