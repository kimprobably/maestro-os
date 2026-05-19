# WakeTask Object Proof Program Spec

Write the high-level program spec for WakeTask's Object Proof mission pack.

Read:

- `docs/superpowers/specs/2026-05-19-object-proof-feature-program-design.md`
- `contexts/iphone-app-factory/waketask/feature-context.md`
- `contexts/iphone-app-factory/waketask/feature-pack.json`
- `contexts/iphone-app-factory/waketask/screenshots/manifest.json`
- the screenshots under `contexts/iphone-app-factory/waketask/screenshots/`
- existing app source in `{{ inputs.app_dir|default("apps/waketask-ios") }}`
- prior `.workflow/object-proof-program/**` artifacts if present

The program must implement the stages in this order:

1. `barcode`
2. `preset_vision`
3. `same_object`

## Required Output

Write:

- `.workflow/object-proof-program/program-spec.md`
- `.workflow/object-proof-program/program-spec.json`

## Markdown Required Headings

Use these headings exactly:

- `# Object Proof Program Spec`
- `## Program Goal`
- `## Stage Order`
- `## Stage Specs`
- `## Learning Contract`
- `## Eval Strategy`
- `## Validation Strategy`
- `## Non-Goals`
- `## No Secrets`

## JSON Contract

`program-spec.json` must include:

```json
{
  "program_goal": "string",
  "stage_order": ["barcode", "preset_vision", "same_object"],
  "stages": [
    {
      "id": "barcode",
      "goal": "string",
      "required_capabilities": ["string"],
      "acceptance_criteria": ["string"],
      "evals_required": ["string"],
      "risk_controls": ["string"]
    }
  ],
  "learning_contract": {
    "required_files": ["string"],
    "carry_forward_rule": "string"
  },
  "eval_strategy": ["string"],
  "validation_strategy": ["string"],
  "non_goals": ["string"]
}
```

## Stage Requirements

Barcode stage:

- registration for a target barcode or QR code;
- persisted target in the alarm/mission config;
- live scan flow;
- dismiss blocked until the scanned code matches;
- test/eval evidence for match and mismatch.

Preset Vision stage:

- preset object picker for common viral-ready objects such as sink, plate, toothbrush, shoes, fridge, keys, toilet, and coffee mug;
- local Apple Vision classification, not cloud AI as the primary dismiss path;
- confidence threshold and label-group handling;
- wrong/uncertain photo retry behavior;
- test/eval evidence for accepted and rejected classification outcomes.

Same-object stage:

- setup flow to register a reference object photo;
- local storage of reference metadata without leaking private image data;
- morning capture flow that compares against the reference;
- dismiss blocked until similarity succeeds or the explicitly designed fallback applies;
- test/eval evidence for match, mismatch, and privacy behavior.

## Constraints

- Keep this app-specific context in the spec and run config; do not change reusable generic workflow files unless necessary.
- Do not rebuild auth, payments, AI, networking, storage infrastructure, localization infrastructure, settings infrastructure, or bundle identity.
- Do not use cloud AI as a required alarm-dismiss dependency.
- Do not copy competitor UI or proprietary screenshots.
- Do not print secrets, credentials, tokens, cookies, private keys, signed URLs, or environment values.
