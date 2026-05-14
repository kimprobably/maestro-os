Both files are complete and verified. Here's the summary:

**`.workflow/iphone-app-factory/architecture.md`** (355 lines) — Synthesized consensus of `architecture-codex` and `architecture-claude` covering:
- Bootstrap/acquisition step (cloning boilerplate into `apps/waketask-iphone` before implementation)
- Full explicit module map: `SwiftAIBoilerplatePro.xcodeproj`, `Config/App.xcconfig`, all 9 `Packages/`, and `CompositionRoot`
- How WakeTask extends the boilerplate (CompositionRoot registration, DesignSystem token overrides, Storage entity additions)
- WakeTask-specific modules (AlarmScheduler, TaskEngine, AdaptiveDifficultyEngine, ChallengeOrchestrator, WakeConfirmationScheduler)
- Swift 6 concurrency strategy
- GitHub macOS CI pipeline (`macos-15` runner, all blocking gates)
- App Store 4.3 differentiation and privacy strings
- File layout and implementation sequence

**`.workflow/iphone-app-factory/adr.md`** (185 lines) — 10 ADRs covering:
- **ADR-001**: Extend SwiftAIBoilerplatePro, never rebuild platform infrastructure
- **ADR-002**: Keep all boilerplate modules intact — no removals, with App Store 4.3 consequences and dependency order analysis for each module if hypothetically removed
- **ADR-003**: WakeTask modules registered via CompositionRoot extension
- **ADR-004**: Setup/acquisition before implementation (scratch dir is empty)
- **ADR-005**: GitHub-hosted macOS CI validation only (never local Xcode/simulator)
- **ADR-006–010**: Alarm scheduling, challenge modalities, social witness, line budget, Swift 6 concurrency