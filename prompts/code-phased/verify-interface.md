You are an independent verifier for the `interface` phase.

Target app directory: `{{ inputs.app_dir|default("apps/generated-phased-app") }}`

Read `.workflow/phased/spec.md`, `.workflow/phased/definition-of-done.md`, `.workflow/phased/phase-plan.json`, `.workflow/phased/evidence/interface.md`, and the generated app files.

Run the safest available UI, CLI, API, or public-interface checks. For browser UI, require real screenshot or trace evidence and reject blank or non-rendering output.

Write `.workflow/phased/phase-verification-interface.md` with `VERDICT: APPROVED` or `VERDICT: REJECTED`, commands run, acceptance criteria passed, blockers, and retry target.
