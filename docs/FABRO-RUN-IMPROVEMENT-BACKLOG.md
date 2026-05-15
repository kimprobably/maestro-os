# Fabro Run Improvement Backlog

This backlog turns Fabro run postmortems into concrete improvements.

Status values:

- `proposed`
- `planned`
- `in_progress`
- `implemented`
- `rejected`

Priority values:

- `P0`: blocks reliable end-to-end runs
- `P1`: likely to prevent expensive retries or false confidence
- `P2`: useful operator or quality improvement

| ID | Source | Priority | Surface | Status | Problem | Proposed Change | Next Action |
|---|---|---:|---|---|---|---|---|
| FRI-001 | WakeTask run `01KRK15YVT2214YB2CZ78HWJJM` | P0 | deployment/preflight | implemented | Run launched on local Fabro while shared visibility expected Railway. | Add Railway preflight that rejects local Fabro unless explicitly allowed. | Keep preflight required before real app factory runs. |
| FRI-002 | WakeTask run `01KRK15YVT2214YB2CZ78HWJJM` | P0 | skill/ledger | implemented | Run state and manual recovery facts were scattered across Fabro, GitHub, artifacts, and chat. | Reuse Hermes SQLite/JSONL run ledger and require babysitter updates. | Use `scripts/fabro/babysit-run.mjs` for active monitoring. |
| FRI-003 | WakeTask promptfoo output | P1 | prompt eval | implemented | Promptfoo failed but deterministic fallback made prompt gate look green. | Split promptfoo pass from fallback pass and surface critical gaps. | Keep accepted-risk promptfoo fallback explicit and rare. |
| FRI-004 | WakeTask implementation reviews | P0 | workflow gate | implemented | Consensus could approve even when source reviews rejected or had blocking findings. | Add review fan-in gate before consensus. | Add final-review fixture coverage if this regresses. |
| FRI-005 | WakeTask Appium evidence | P0 | QA gate | implemented | Appium report could pass with hardcoded counts or weak fallback. | Require telemetry or validated raw fallback evidence. | Strengthen generated XCUITest telemetry output. |
| FRI-006 | WakeTask bootstrap | P2 | bootstrap | implemented | Boilerplate materialization imported AppleDouble `._*` files. | Remove and fail on remaining AppleDouble files during bootstrap. | None. |
| FRI-007 | WakeTask simplification failure | P1 | orchestrator/context | implemented | Stage prompt/context grew large and prompt file write failed after infra instability. | Add prompt context budget/compaction before long agent stages. | Tune byte thresholds from the next real run. |
| FRI-008 | WakeTask finalization | P1 | artifact/metadata | implemented | Metadata branch push failed after useful code existed. | Verify final metadata push and capture recovery instructions/artifact refs. | Confirm the next Railway run exposes matching branch/SHA in GitHub. |

## Adding Ideas

Append new ideas as rows. Prefer one concrete improvement per row. If a lesson
spans multiple surfaces, split it into multiple rows so implementation can be
tracked independently.
