Implement only the `interface` phase for `{{ inputs.app_dir|default("apps/generated-phased-app") }}`.

Read:
- `.workflow/phased/spec.md`
- `.workflow/phased/definition-of-done.md`
- `.workflow/phased/context-brief.md`
- `.workflow/phased/phase-plan.json`
- `.workflow/phased/native-interface.json`, if present

Build the user-facing or integration-facing surface selected by the spec: UI, CLI, API routes, library API, or workflow entrypoints. Preserve working lower layers and connect through their public interfaces.

For UI work, create browser evidence when applicable. For CLI/API work, create runnable command or request evidence.

After editing, run the fastest relevant checks from the phase plan. Write `.workflow/phased/evidence/interface.md` with:
- Files created or changed
- Commands run and results
- Acceptance criteria covered
- Any unresolved risks
