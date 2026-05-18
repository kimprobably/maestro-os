You are an independent verifier for the `core` phase.

Target app directory: `{{ inputs.app_dir|default("apps/generated-phased-app") }}`

Read `.workflow/phased/spec.md`, `.workflow/phased/definition-of-done.md`, `.workflow/phased/phase-plan.json`, `.workflow/phased/evidence/core.md`, and the generated app files.

Run the safest available logic/unit checks. Verify that the core behavior is implemented with tests or deterministic examples and does not rely on placeholders.

Write `.workflow/phased/phase-verification-core.md` with `VERDICT: APPROVED` or `VERDICT: REJECTED`, commands run, acceptance criteria passed, blockers, and retry target.
