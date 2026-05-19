# WakeTask Object Proof Stage Implementation

Implement one Object Proof mission stage in WakeTask.

Current stage:

- Stage id: `{{ inputs.stage_id|default("barcode") }}`
- Stage name: `{{ inputs.stage_name|default("Barcode Scan") }}`
- Stage goal: `{{ inputs.stage_goal|default("Implement barcode/QR object proof missions") }}`
- Required capabilities: `{{ inputs.stage_required_capabilities|default("barcode_target_registration,barcode_scan_camera_flow,barcode_dismiss_blocking,barcode_eval_coverage") }}`
- App directory: `{{ inputs.app_dir|default("apps/waketask-ios") }}`
- Stage artifact root: `{{ inputs.stage_root|default(".workflow/object-proof-program/stages/barcode") }}`

Read before planning:

- `.workflow/object-proof-program/program-spec.md`
- `.workflow/object-proof-program/program-spec.json`
- `.workflow/object-proof-program/learnings/cumulative-learnings.json` if it exists
- all prior stage learnings under `.workflow/object-proof-program/learnings/`
- current app source in `{{ inputs.app_dir|default("apps/waketask-ios") }}`
- existing WakeTask mission engine, mission verification, setup UI, live challenge UI, and tests

## Required Behavior

This is not a design-only pass. The stage must change app behavior and prove that behavior.

For barcode:

- add a mission configuration path for registering a barcode/QR target;
- use platform barcode scanning APIs where available;
- persist the target with the alarm/mission model;
- block alarm dismissal until the scanned target matches;
- add tests or simulator evidence for mismatch and match.

For preset Vision:

- add preset object mission targets such as sink, plate, toothbrush, shoes, fridge, keys, toilet, and coffee mug;
- use local Apple Vision/Core ML APIs for classification;
- persist label groups and threshold;
- block dismissal until local classification accepts the target;
- design wrong/uncertain photo retry states and evidence.

For same-object:

- add setup capture for a reference object;
- store local reference metadata safely;
- use on-device image similarity/classification where practical;
- block dismissal until candidate capture matches the reference or the explicit fallback applies;
- document false-negative and lighting risks.

## Required Output

Write all files under `{{ inputs.stage_root|default(".workflow/object-proof-program/stages/barcode") }}`:

- `stage-spec.md`
- `stage-spec.json`
- `eval-plan.json`
- `implementation-evidence.md`
- `implementation-evidence.json`
- `validation-report.md`
- `validation-report.json`
- `stage-postmortem.md`

## Markdown Required Headings

`stage-spec.md` must include:

- `# Object Proof Stage Spec`
- `## Stage Goal`
- `## Required Capabilities`
- `## User Flows`
- `## Data And State`
- `## Acceptance Criteria`
- `## Validation Plan`
- `## Risks`
- `## No Secrets`

`implementation-evidence.md` must include:

- `# Object Proof Implementation Evidence`
- `## Changed Paths`
- `## Capability Coverage`
- `## Commands Run`
- `## Tests Run`
- `## Screenshots Or Simulator Evidence`
- `## Residual Risks`
- `## No Secrets`

`validation-report.md` must include:

- `# Object Proof Validation Report`
- `## Commands Run`
- `## Tests Run`
- `## Quality Evidence`
- `## CI Notes`
- `## Residual Risks`
- `## No Secrets`

`stage-postmortem.md` must include:

- `# Object Proof Stage Postmortem`
- `## What Worked`
- `## What Failed`
- `## Manual Versus Fabro Executed`
- `## Evals Added Or Improved`
- `## Reusable Patterns`
- `## Next Stage Advice`
- `## No Secrets`

## JSON Contracts

`stage-spec.json`:

```json
{
  "stage_id": "barcode",
  "stage_goal": "string",
  "required_capabilities": ["string"],
  "user_flows": [{"id": "string", "steps": ["string"], "success_state": "string"}],
  "data_and_state": [{"name": "string", "change": "string"}],
  "acceptance_criteria": ["string"],
  "validation_plan": {"build": ["string"], "tests": ["string"], "simulator": ["string"], "ci": ["string"]},
  "risks": ["string"]
}
```

`eval-plan.json`:

```json
{
  "stage_id": "barcode",
  "evals": [
    {"id": "string", "kind": "unit|ui|ci|artifact|manual-review", "command_or_check": "string", "proves": "string"}
  ]
}
```

`implementation-evidence.json`:

```json
{
  "stage_id": "barcode",
  "changed_paths": ["string"],
  "capability_coverage": [{"capability": "string", "code_changed": true, "test_or_validation": "string"}],
  "commands_run": ["string"],
  "tests_run": [{"command": "string", "result": "string"}],
  "simulator_or_screenshot_evidence": ["string"],
  "residual_risks": ["string"]
}
```

`validation-report.json`:

```json
{
  "stage_id": "barcode",
  "commands_run": ["string"],
  "tests_run": [{"command": "string", "result": "string"}],
  "quality_evidence": ["string"],
  "ci_notes": ["string"],
  "residual_risks": ["string"]
}
```

## Implementation Rules

- Make the smallest behavior-complete slice for the current stage.
- Read and reuse prior stage patterns instead of rewriting the mission engine again.
- Preserve existing app foundations unless the stage spec explicitly requires a narrow model extension.
- Add or update tests for every required capability.
- Prefer local/on-device APIs for alarm-dismiss verification.
- If hosted GitHub macOS CI is blocked by billing or runner allocation, record that as CI evidence, but still run the strongest local checks available.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
