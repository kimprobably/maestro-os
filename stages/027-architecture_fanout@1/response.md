**Architecture Candidate: `codex-gpt5.5 / Extension-First Plan v1`**

1. **Keep Unchanged (baseline modules)**
- Keep `SwiftAIBoilerplatePro.xcodeproj`, `Config/App.xcconfig`, and the existing Swift 6 package graph.
- Keep core packages unchanged in implementation contract: `Core`, `Networking`, `Storage`, `Auth`, `Payments`, `AI`, `FeatureSettings`, `Localization`, `DesignSystem`.
- Keep Composition root pattern (`CompositionRoot` + `CompositionRoot+Factories`) and strict constructor injection.
- Keep existing CI scaffold (`.github/workflows/ci.yml`, `ios-ci.yml`) as base lanes.

2. **Adapt (new WakeTask feature surface)**
- Add new package `Packages/FeatureWake` for wake-domain UI + view models + domain services.
- Add `WakeDomain` types inside `FeatureWake` for:
`AlarmPlan`, `MissionChain`, `MissionType(math|memory|motion|scan|fallback)`, `WakeCheckSchedule(+3/+7/+12)`, `WakeSessionTelemetry`.
- Extend `Storage` with wake-specific models/repos (new files, no rewrite): `AlarmRepository`, `WakeSessionRepository`, `MissionTargetRepository`.
- Add `WakeMissionEngine` service to orchestrate mission completion + fallback routing.
- Add `WakeCheckScheduler` service for post-dismiss checks and escalation triggers.
- Add `PermissionCoordinator` adapter using existing app shell flow to enforce notification/camera gating behavior from spec.
- Add `WakeReliabilityLog` screens in app shell consuming persisted telemetry.

3. **Remove only if justified**
- Remove `FeatureChat` from app target only if WakeTask ships no chat in MVP; reason: reduces App Store 4.3 template similarity and dead surface.
- Remove related chat entry points from `MainTabView`, route factories, and tests if removed.
- Keep `AI` package physically present unless dependency cleanup is required; no platform rewrite, only target-level detachment.

4. **CompositionRoot changes**
- Add singleton registrations: `alarmRepository`, `wakeSessionRepository`, `missionTargetRepository`, `wakeMissionEngine`, `wakeCheckScheduler`, `permissionCoordinator`.
- Add factories: `makeWakeHomeViewModel()`, `makeAlarmEditorViewModel(alarmID:)`, `makeWakeFlowViewModel(sessionID:)`, `makeReliabilityLogViewModel()`.
- Keep all view models `@MainActor @Observable`; keep protocol-typed dependencies as `any ...`.
- Keep debug/release auth mode behavior unchanged.

5. **DesignSystem usage**
- Use DS tokens only (`DSColors`, `DSSpacing`, typography helpers); no hardcoded styling values.
- Wake-critical screens use large tap targets, high contrast, low cognitive density.
- Reuse `SAIGlass` wrappers only through `DesignSystem` APIs (no direct `glassEffect` usage).
- Add only minimal wake-specific components in `FeatureWake` composed from DS primitives.

6. **Data / repository / client plan**
- `Storage` remains source of truth for alarms, mission configs, wake sessions, and reliability timelines.
- `WakeSessionRepository` writes required telemetry fields exactly as spec mandates.
- `WakeMissionEngine` is pure orchestration over repos + motion/camera adapters; no direct SwiftUI dependency.
- Networking/Auth/Payments stay as-is; WakeTask MVP is local-first for alarm flow reliability.

7. **ViewModel boundaries**
- `WakeHomeViewModel`: upcoming alarms, profile switch, readiness state.
- `AlarmEditorViewModel`: mission chain config + setup validation.
- `WakeFlowViewModel`: runtime mission progression + fallback enforcement.
- `WakeCheckViewModel`: +3/+7/+12 check handling and escalation state.
- `ReliabilityLogViewModel`: timeline rendering and filtering.
- No VM owns persistence implementation details; all via repository protocols.

8. **Swift 6 concurrency risks and mitigations**
- Risk: timer/check callbacks crossing actors and mutating observable state.
- Mitigation: scheduler emits async events; VM state mutation only on `@MainActor`.
- Risk: repositories used from background contexts.
- Mitigation: keep wake repositories aligned with existing `Storage` actor pinning strategy.
- Risk: race between dismissal and first +3 minute check.
- Mitigation: single authoritative session state machine with idempotent transitions.

9. **Test plan**
- Unit: mission engine pass/fail/fallback transitions, wake-check escalation policy, permission denial recovery.
- Repository integration: telemetry persistence fields and timeline ordering.
- Composition tests: factories resolve correct dependencies and feature toggles.
- UI tests: setup flow, mission completion, fallback route, reliability log visibility.
- Regression gate: maintain existing suite and add WakeTask-specific tests under 400-line/file constraint.

10. **Appium exploratory harness plan**
- Add `scripts/ios/run-appium-exploratory.sh` to launch simulator, run bounded-depth control tapper, and collect JSON.
- Write report to `reports/ios/appium-exploratory-report.json` with required schema keys and thresholds.
- Enforce pass contract in CI unless explicit `defer_appium: true` input is provided and documented.

11. **GitHub macOS CI plan**
- Extend existing `ci.yml` (macos-15, Xcode 26.2) with blocking jobs:
`xcodebuild build`, `xcodebuild test`, SwiftLint, SwiftFormat check, Qlty, secret scan, App Store 4.3 string audit.
- Add artifact outputs:
`reports/ios/ios-quality-report.json` and `reports/ios/appium-exploratory-report.json`.
- Keep iOS 18.6 fallback lane for `SAIGlass` compatibility smoke tests.
- Fail PR when any DoD blocking gate fails; allow deferral only with explicit tracked reason/owner/date.