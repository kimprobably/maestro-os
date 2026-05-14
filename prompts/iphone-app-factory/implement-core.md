# Implement Core Phase

Implement only the core product logic phase in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

Use the boilerplate's existing module boundaries, repositories, clients, logging, and Swift concurrency patterns.

Core scope:

- domain models
- repositories/clients or local persistence needed for MVP
- ViewModel logic without UI layout work
- unit tests for logic, repositories, and ViewModels
- privacy-preserving data handling

Do not add broad infrastructure that the boilerplate already provides.

Write `.workflow/iphone-app-factory/evidence/core.md` with:

- `Files changed`
- `Commands run`
- `Acceptance criteria`
- `Risks`
