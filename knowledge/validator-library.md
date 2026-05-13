# Validator Library

Status: draft v0.1 for Tim review

Validators should be deterministic when possible and LLM-judged only when the property is genuinely semantic.

## Common Validators

### `required_fields`

Checks that required JSON fields are present and non-null.

Inputs:
- `fields: string[]`

Failure:
- Validation error with missing field names.

### `json_schema`

Validates output against a schema.

Inputs:
- `schema_path`

Failure:
- Validation error with schema path and failing keys.

### `dot_syntax`

Runs Graphviz/Fabro validation against workflow files.

Inputs:
- `path`

Failure:
- Syntax or workflow validation error.

### `no_banned_phrases`

Rejects text containing banned phrases.

Inputs:
- `phrases: string[]`
- `case_sensitive: boolean`

Default banned outreach phrases:
- `leverage`
- `synergy`
- `I noticed`
- `AI-powered`
- `circle back`

### `max_length`

Checks text length by characters, words, or lines.

Inputs:
- `mode: chars|words|lines`
- `max: number`

### `single_cta`

Checks that outreach copy asks for one clear action.

Implementation:
- Deterministic pass for obvious single-question copy.
- LLM judge when multiple asks may be implied.

### `voice_match`

LLM judge comparing text to `knowledge/voice.md`.

Inputs:
- `threshold`, default `0.75`

CLI:
- `maestro verify outreach-voice-match <draft-path> [--threshold <0-1>] [--model <openrouter-model>]`

Output:
- Score 0-1.
- Reasons.
- Suggested fix if below threshold.

### `hook_specificity`

LLM judge for whether copy references a concrete lead/company situation rather than generic personalization.

Inputs:
- `lead_context`
- `threshold`, default `0.70`

### `irreversible_action_gate`

Checks that any send, merge, deploy, delete, migration, campaign queue, or scale-enrichment stage has a STOP gate before execution.

Failure:
- Blocks workflow registration.

### `persona_present`

Checks workflow metadata and Slack posts include a known persona.

Failure:
- Blocks workflow registration.

### `memory_write_policy`

Checks durable memory writes are done by the memory-curator-agent or through an approved workflow step.

Failure:
- Blocks workflow registration unless explicitly overridden by human approval.

## GTM Validators

### `email_deliverable`

Format check plus MX lookup. No SMTP probe in v0.

CLI:
- `maestro verify email-deliverable <email-or-json-path>`
- `--skip-mx` is available for local fixtures.
- `--allow-reserved-domains` is available for `.example` fixture leads.

Output:
- `{deliverable, reason, checked_mx, mx_records?}`

### `probe_before_scale`

Requires a probe step and threshold gate before large lead discovery/enrichment.

Default thresholds:
- `>60%` A+B qualification: scale allowed.
- `30-60%`: revise ICP/search and re-probe.
- `<30%`: stop and revisit ICP.

### `phone_opt_in`

Rejects phone enrichment unless the spec or gate explicitly requests phone.

### `competitor_review_gate`

Requires human review before enrichment when the ICP/search can return competitors or lookalikes that sell the same service.

### `outreach_banned_phrases`

Rejects variants containing default banned outreach phrases.

CLI:
- `maestro verify outreach-banned-phrases <draft-path> [--mode all|any] [--phrases <comma-list>] [--output <path>]`

Default phrases:
- `leverage`
- `synergy`
- `I noticed`
- `AI-powered`
- `circle back`

### `outreach_length`

Checks body word and line counts.

CLI:
- `maestro verify outreach-length <draft-path> [--max-words <n>] [--max-lines <n>] [--mode all|any] [--output <path>]`

Defaults:
- `max-words: 80`
- `max-lines: 8`

### `dedup_lead`

Checks whether the lead has a draft in the last 30 days.

CLI:
- `maestro verify dedup-lead <email-or-json-path> [--days <n>]`

Requires:
- `DATABASE_URL`

Output:
- `{is_duplicate, last_contacted_at}`

## Code Validators

### `no_select_star`

Rejects database query strings containing `select('*')`.

### `route_thinness`

Flags route handlers over the repo target size or containing obvious business logic.

### `allowed_fields_required`

Checks update paths use allowlisted fields instead of raw body spread.

### `tests_present`

Checks changed code has relevant tests or a documented reason tests are not applicable.

### `quality_commands_pass`

Runs deterministic project-specific commands and records exact output.
