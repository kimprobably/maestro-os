Goal: Generate a toy Slack hello Fabro workflow from the scaffold spec

## Completed stages
- **load_const**: succeeded
  - Script: `cd '/Users/timlife/Documents/claude code/maestro-os'; mkdir -p .maestro/scaffold; ./bin/maestro knowledge get architecture-principles workflow-standards cli-conventions known-gotchas validator-library personas --format text > ${CONST:-.maestro/scaffold/constitution.md}; echo constitution-loaded`
  - Output:
    ```
    /bin/bash: line 2: cd: /Users/timlife/Documents/claude code/maestro-os: No such file or directory
    /bin/bash: line 2: ./bin/maestro: No such file or directory
    constitution-loaded
    ```


You are the spec-agent for Maestro.

Inputs:
- Natural-language spec path: `specs/scaffold/toy-slack-hello.md`
- Constitution path: `.maestro/scaffold/constitution.md`
- Target workflow path: `workflows/scaffold/generated-toy-slack-hello.fabro`

Read the spec and constitution. Produce only JSON with this shape:

```json
{
  "workflow_name": "kebab-case-name",
  "category": "gtm|code|manager|memory|scaffold|other",
  "persona": "maestro|quill|scout|smith|test-bot",
  "purpose": "one sentence",
  "spec_kitty": {
    "package_required": true,
    "spec_markdown_path": "specs/<category>/<workflow_name>.md",
    "spec_json_path": "specs/<category>/<workflow_name>.json",
    "updates_during_run": ["when spec is approved", "when ADR changes", "when review findings change scope"]
  },
  "inputs": [],
  "outputs": [],
  "risk_tags": [],
  "stages": [
    {
      "id": "snake_case_stage_id",
      "type": "llm|command|gate|decision",
      "class": "reasoning|coding|review|drafting|judging",
      "summary": "what the stage does",
      "validator": "required validator command or null"
    }
  ],
  "gates": [
    {
      "id": "gate_id",
      "kind": "STOP|FLAG",
      "reason": "why the gate exists"
    }
  ],
  "review_fanout": [
    "correctness-review-agent",
    "test-review-agent"
  ],
  "adr": {
    "required": false,
    "reason": "why"
  },
  "deterministic_quality_gates": [
    "maestro verify dot-syntax <path>"
  ],
  "memory_writes": [
    {
      "namespace": "persona/<persona>/episodic",
      "writer": "memory-curator-agent",
      "when": "after human-approved run summary"
    }
  ],
  "open_questions": []
}
```

Rules:
- Use Spec Kitty as the work-package layer whenever a workflow creates or changes specs.
- Always include correctness and test review. Add security, migration, dependency, performance, and ADR reviewers only when the risk tags justify them.
- Include STOP gates for irreversible operations: send, merge, deploy, delete, migration, billing, enrichment spend, or long-term memory writes not handled by the curator.
- Use Qlty as the baseline quality gate for code repositories; add native Rust gates when the target output is Rust.
- Rig can be selected only as an output app framework for generated Rust AI applications. Do not use Rig as the Maestro/Fabro runtime.
- Durable memory writes go through `memory-curator-agent` by default.
- If the spec is ambiguous, keep the workflow minimal and put concrete questions in `open_questions`.