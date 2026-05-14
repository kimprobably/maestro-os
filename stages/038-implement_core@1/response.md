Implemented core phase in `apps/waketask-iphone` with domain logic, local persistence, ViewModel logic, and unit tests, plus the required evidence file.

Changed files:
- [WakeTaskCore.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Core/Sources/Core/WakeTaskCore.swift)
- [WakeTaskSessionViewModelTests.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Core/Tests/CoreTests/WakeTaskSessionViewModelTests.swift)
- [WakeTaskSessionRepository.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Storage/Sources/Storage/Repositories/WakeTaskSessionRepository.swift)
- [WakeTaskSessionRepositoryTests.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Storage/Tests/StorageTests/WakeTaskSessionRepositoryTests.swift)
- [core.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/core.md)

What was implemented:
- WakeTask core domain models and protocols for mission chain, profiles, wake checks, and per-alarm reliability telemetry fields.
- `WakeTaskSessionViewModel` (logic-only, no layout work) with:
  - fallback mission validation
  - session start/fire/dismiss transitions
  - wake-check recording
  - escalation/success computation for +3/+7/+12 schedule
- Local actor-based repository in `Storage` using `UserDefaults` for MVP persistence with recency ordering and bounded retention.
- Privacy-preserving data handling by persisting only mission types, profile, timestamps, and check outcomes (no raw scan payloads or free-form user content).

Validation:
- Could not run Swift tests in this environment because `swift` is unavailable (`/bin/bash: swift: command not found`).