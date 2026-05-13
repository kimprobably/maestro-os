Implement only the `core` phase for `{{ inputs.app_dir|default("apps/generated-phased-app") }}`.

Read:
- `.workflow/phased/spec.md`
- `.workflow/phased/definition-of-done.md`
- `.workflow/phased/context-brief.md`
- `.workflow/phased/phase-plan.json`
- `.workflow/phased/native-core.json`, if present

Build the domain logic, state/data model, business rules, and focused tests described by the plan. Preserve working foundation code and do not regenerate the project from scratch.

After editing, run the fastest relevant checks from the phase plan. Write `.workflow/phased/evidence/core.md` with:
- Files created or changed
- Commands run and results
- Acceptance criteria covered
- Any unresolved risks
