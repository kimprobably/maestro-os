# iPhone App Factory Workflow

This workflow turns a validated app opportunity into a Swift iOS app built on top of SwiftAIBoilerplatePro.

The workflow is intentionally conservative. Fabro owns the SDLC, but iOS build and UI execution require a macOS lane. Daytona can run research, specification, architecture, code review, and repository editing. Xcode, iOS Simulator, Appium XCUITest, signing, archive, and release string audits must run on macOS or through GitHub Actions macOS runners.

## Overnight Target

The default target is a TestFlight-ready handoff, not a live App Store submission.

The workflow does not run paid human testing. It does require an automated Appium/XCUITest exploratory pass that taps every reachable button/control and fails on crashes, broken navigation, or unhandled error screens.

## Core Pattern

1. Research fanout: App Store reviews, Reddit, competitors, and iOS design patterns. The fanout is serialized in overnight mode so branch startup failures cannot be hidden by parallel scheduling.
2. Prompt quality gate: validate the tracked prompt registry and run the Promptfoo prompt-quality eval when available.
3. Research synthesis and evidence gate: jobs-to-be-done, complaints, feature gaps, monetization, differentiation, all expected research artifacts, and a strict opportunity matrix.
4. Adversarial spec lab: Codex, Claude, and OpenRouter models draft specs independently, critique each other, merge, and red-team.
5. Spec Kitty gate: record the accepted spec and definition of done.
6. Architecture and ADR: map the product to SwiftAIBoilerplatePro modules, explicitly deciding what to keep, adapt, or remove.
7. Phased implementation: foundation, core, interface, integration.
8. Implementation code review gate: correctness, tests, security/privacy, and boilerplate-reuse review.
9. Quality hardening: simplification, lint/format/static checks, macOS CI, Appium exploratory clicking, and App Store 4.3 audit.
10. Parallel final review: product fidelity, iOS architecture, security/privacy, release readiness, code quality, and QA.

## Boilerplate Rules

Agents should extend the boilerplate instead of rebuilding infrastructure:

- Keep Auth, Payments, AI, Storage, Networking, Localization, DesignSystem, and Settings unless the architecture stage explicitly removes a module.
- Use the existing MVVM, `@Observable`, repository/client, DesignSystem, and logging patterns.
- Use `AppLogger`; do not add `print`.
- Preserve Swift 6 strict concurrency.
- Keep production and test Swift files under 400 lines.
- Prefer rebranding and focused product surfaces over wholesale rewrites.
- Follow the App Store 4.3 hardening checklist before release.

## Blocking Quality Gates

The generated app must include and pass:

- `xcodebuild build`
- `xcodebuild test`
- SwiftLint strict mode
- SwiftFormat lint mode
- Qlty check
- secret scan with gitleaks or trufflehog
- Appium/XCUITest exploratory button tapper
- release string audit for template fingerprints
- privacy/legal/App Store readiness report

If the workflow cannot prove a gate passed, it fails unless the run explicitly opts into a deferred macOS validation mode.

## CI/CD Layers

There are two CI/CD layers:

1. Maestro/Fabro repo CI validates the workflow factory itself. It runs Bun tests, JavaScript syntax checks, Fabro workflow registration, prompt registry/eval checks, Qlty changed-code checks, and Qlty gitleaks scanning.
2. Generated iPhone app CI is produced inside each app. It must run on macOS and include Xcode build/test, SwiftLint, SwiftFormat, Qlty, sensitive-value scanning, Appium/XCUITest exploratory clicking, and App Store 4.3 release string audit.

The repository currently keeps the full Qlty report as informational because older generated artifacts have a formatting backlog. High-severity changed-code issues and sensitive-value leaks are blocking now. Once the backlog is cleaned up, the full formatting gate should be switched from report-only to blocking.

## Design Research

Mobbin can be used when `use_mobbin=true` and `MOBBIN_EMAIL` / `MOBBIN_PASSWORD` are present in the run environment. The workflow uses Mobbin as pattern research only: agents may abstract layout and interaction patterns, but must not clone another app's screens or copy proprietary assets.

Mobbin credentials must remain environment variables or an interactive browser session. Do not write them to prompts, reports, app code, or committed config.

Research agents must not run environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`. Daytona bootstrap installs redacting wrappers for common env-dump binaries as a runtime backstop, but prompt compliance is still required.

## Prompt Tracking

Workflow prompts live under `prompts/iphone-app-factory/` and are tracked by `evals/iphone-app-factory/prompt-registry.json`. The registry records required markers, dataset version, and rubric version.

Prompt quality is evaluated by `evals/iphone-app-factory/prompt-quality.yaml` through Promptfoo. `scripts/iphone-app-factory/promptfoo-prompt-quality.mjs` runs Promptfoo when available and falls back to deterministic registry checks so CI can still fail on missing prompts, missing required constraints, or accidental secret patterns.
