**Model Identity**
`arch_claude` candidate by GPT-5 Codex (independent architecture pass)

**WakeTask Architecture Candidate (Extend SwiftAIBoilerplatePro, Don’t Rebuild)**

1. **Keep Unchanged (as-is platform foundation)**
- `Packages/Core`, `Packages/Networking`, `Packages/Storage`, `Packages/DesignSystem`, `Packages/Localization`, `Packages/Auth`, `Packages/Payments`.
- App bootstrap + config pipeline (`Config/*.xcconfig`, generated config flow, secret handling model).
- Existing DI style (`CompositionRoot`, `CompositionRoot+Factories`, protocol-first clients/repos).
- Swift 6 patterns already in repo: `@Observable`, actor isolation, `any` protocol typing.

2. **Adapt (primary WakeTask work)**
- Add new feature packages:
  - `Packages/FeatureAlarm` (alarm CRUD + strictness + scheduling adapters)
  - `Packages/FeatureWakeFlow` (active alarm, mission runner, wake-check countdown/escalation)
  - `Packages/FeatureReliability` (timeline/ledger + weekly consistency summary)
  - `Packages/FeatureFirstTask` (micro-task bridge gating wake completion)
- Extend `Storage` with WakeTask domain models/repos (no new storage stack): `Alarm`, `MissionAttempt`, `WakeSession`, `EscalationEvent`, `FirstTask`.
- Extend `AppShell` navigation:
  - Replace “chat-first” home with wake-first dashboard.
  - Keep onboarding/settings/profile structure but rewrite content for wake constraints/privacy.
- Use `DesignSystem` tokens/components only; add WakeTask brand/theme via `BrandConfig` + color assets, not custom UI framework.
- Keep localization architecture; add WakeTask string namespaces via `L10n+Wake*.swift`.

3. **Remove Only If Justified**
- `FeatureChat` and `AI` can be removed for MVP if wake flow has zero chat value.
- `FeatureRating` optional; keep unless product wants simpler v1.
- If removing `FeatureChat`, also remove chat-related models/routes/factories and clean schema references. Do not remove `DesignSystem`, `Storage`, `Networking`, etc.

4. **CompositionRoot Changes**
- Add wake services/clients:
  - `AlarmSchedulerClient` (local notifications, alarm trigger orchestration).
  - `MissionEngine` (modality rotation + anti-repeat policy).
  - `WakeContractService` (post-dismiss timer + escalation transitions).
  - `ReliabilityLedgerRepository`.
  - `FirstTaskRepository`.
- Add factory methods for each wake ViewModel; keep per-feature factory boundaries like existing pattern.
- Keep all external dependency wiring centralized in `CompositionRoot`; no direct client creation in Views/ViewModels.

5. **Data / Repository / Client Plan**
- `Storage` remains source of truth for MVP wake evidence.
- Repository split:
  - `AlarmRepository` (alarm definitions, strictness, enabled state)
  - `WakeSessionRepository` (per-run state machine + timestamps)
  - `MissionRepository` (attempt outcomes/modalities)
  - `ReliabilityLedgerRepository` (query timeline projections)
  - `FirstTaskRepository` (selected task + completion state)
- `Networking` only for optional future sync/analytics; MVP core wake path remains fully local/offline-safe.

6. **ViewModel Boundaries**
- One VM per feature surface (target <400 LOC each):
  - `AlarmListViewModel`, `AlarmEditorViewModel`
  - `ActiveWakeViewModel`
  - `WakeCheckViewModel`
  - `ReliabilityLedgerViewModel`
  - `FirstTaskViewModel`
- VMs own orchestration/state; repositories own persistence; clients own OS/network integrations.
- No business logic in SwiftUI Views.

7. **Swift 6 Concurrency Risks + Mitigations**
- Risk: timer/escalation race conditions when app foreground/background changes.
  - Mitigation: single actor (`WakeSessionActor`) serializing wake session transitions.
- Risk: `Storage` repos are `@MainActor`; calling from background tasks can deadlock/misorder.
  - Mitigation: isolate state machine in actor, hop to main actor only at repository boundary.
- Risk: notification callbacks + UI updates cross-actor violations.
  - Mitigation: explicit `@MainActor` UI mutation points; async APIs in services.
- Risk: long-running mission checks blocking UI.
  - Mitigation: cooperative tasks + cancellation + timeout policies per modality.

8. **Test Plan**
- Unit:
  - Mission rotation anti-repeat logic (FR-02)
  - Wake contract/escalation transitions with mocked clock (FR-03)
  - First-task gating logic (FR-05)
- Repository integration:
  - Reliability ledger ordering/reason correctness (FR-04)
  - Alarm persistence/edit toggles (FR-01)
- UI tests:
  - create/edit alarm flow
  - completion blocked until first-task done
  - wake-check miss enters escalation flow
- Non-functional checks:
  - file-length gate (<400 LOC), strict concurrency compile checks, accessibility assertions for core flow.

9. **Appium Exploratory Harness Plan**
- Keep mandatory artifact: `reports/ios/appium-exploratory-report.json`.
- Build an exploratory tapper that:
  - launches simulator build
  - traverses reachable screens in onboarding/alarm/wake/ledger/settings
  - taps enabled buttons/controls
  - records `buttons_tapped`, `screens_visited`, crashes/failures
- Gate fails unless `ok=true`, `buttons_tapped>0`, `crashes=0`, `failures=0`.

10. **GitHub macOS CI Plan**
- Extend `.github/workflows/ios-ci.yml` on `macos-15` + Xcode 26.2:
  - `xcodebuild -resolvePackageDependencies`
  - `xcodebuild build` (iPhone 17 Pro / iOS 26.2)
  - `xcodebuild test`
  - SwiftLint + SwiftFormat check
  - Qlty + secret scan (blocking)
  - LOC gate script (`<=400` for Swift prod/test files)
  - Appium exploratory job (or explicit deferred gate with documented blocker)
  - App Store 4.3 string audit step on Release artifact
- Upload artifacts: xcode logs, test reports, Appium report, release string audit report.

**Resulting Positioning**
WakeTask is a wake-reliability product built by extending stable SwiftAIBoilerplatePro primitives (DI, storage, networking, design system, auth/payments), with differentiation concentrated in wake-domain feature packages and wake-session state orchestration.