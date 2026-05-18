# Code Simplification Pass

Read:

- `.workflow/iphone-app-factory/spec.md`
- `.workflow/iphone-app-factory/architecture.md`
- all phase evidence
- the app code in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`

Simplify without changing intended behavior.

Required checks:

- remove dead/duplicate code
- split Swift files approaching 400 lines
- simplify large ViewModels
- keep Views stateless where possible
- preserve DesignSystem usage
- preserve tests and CI
- do not remove quality gates

Write `.workflow/iphone-app-factory/evidence/simplification.md`.
