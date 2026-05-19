# WakeTask Object Proof Stage Learning

Summarize learnings from one Object Proof stage and update the cumulative program memory.

Current stage:

- Stage id: `{{ inputs.stage_id|default("barcode") }}`
- Stage name: `{{ inputs.stage_name|default("Barcode Scan") }}`
- Stage artifact root: `{{ inputs.stage_root|default(".workflow/object-proof-program/stages/barcode") }}`
- Program root: `.workflow/object-proof-program`

Read:

- `.workflow/object-proof-program/program-spec.md`
- `.workflow/object-proof-program/learnings/cumulative-learnings.json` if it exists
- `{{ inputs.stage_root|default(".workflow/object-proof-program/stages/barcode") }}/stage-spec.json`
- `{{ inputs.stage_root|default(".workflow/object-proof-program/stages/barcode") }}/eval-plan.json`
- `{{ inputs.stage_root|default(".workflow/object-proof-program/stages/barcode") }}/implementation-evidence.json`
- `{{ inputs.stage_root|default(".workflow/object-proof-program/stages/barcode") }}/validation-report.json`
- `{{ inputs.stage_root|default(".workflow/object-proof-program/stages/barcode") }}/stage-postmortem.md`

## Required Output

Write:

- `.workflow/object-proof-program/learnings/{{ inputs.stage_id|default("barcode") }}-learnings.md`
- `.workflow/object-proof-program/learnings/{{ inputs.stage_id|default("barcode") }}-learnings.json`
- `.workflow/object-proof-program/learnings/cumulative-learnings.json`

## Markdown Required Headings

Use these headings exactly:

- `# Object Proof Stage Learnings`
- `## What Worked`
- `## What Failed`
- `## Carry Forward`
- `## Next Stage Changes`
- `## Evals To Keep`
- `## Risks`
- `## No Secrets`

## JSON Contract

`{{ inputs.stage_id|default("barcode") }}-learnings.json` must include:

```json
{
  "stage_id": "barcode",
  "what_worked": ["string"],
  "what_failed": ["string"],
  "reusable_patterns": ["string"],
  "evals_to_keep": ["string"],
  "next_stage_changes": ["string"],
  "risks": ["string"]
}
```

`cumulative-learnings.json` must include:

```json
{
  "stages": ["barcode"],
  "carry_forward": ["string"],
  "code_patterns": ["string"],
  "eval_patterns": ["string"],
  "workflow_improvements": ["string"],
  "risks": ["string"]
}
```

## Constraints

- Be concrete. Name file paths, tests, APIs, and failure modes where available.
- Distinguish app product backlog from workflow reliability backlog.
- Do not copy secrets or raw logs.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
