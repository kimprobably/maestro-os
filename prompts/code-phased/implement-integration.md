Implement only the `integration` phase for `{{ inputs.app_dir|default("apps/generated-phased-app") }}`.

Read:
- `.workflow/phased/spec.md`
- `.workflow/phased/definition-of-done.md`
- `.workflow/phased/context-brief.md`
- `.workflow/phased/phase-plan.json`
- `.workflow/phased/native-integration.json`, if present

Wire all layers together, finish operational docs, make the default run path work, and produce release evidence. This phase should remove temporary scaffolding and convert demos into deterministic checks.

After editing, run the fastest relevant checks from the phase plan. Write `.workflow/phased/evidence/integration.md` with:
- Files created or changed
- Commands run and results
- Acceptance criteria covered
- Any unresolved risks
