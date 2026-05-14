Implemented the core product-logic phase in `apps/waketask-iphone` with boilerplate-aligned boundaries:

- Added WakeTask domain models/protocols/logic in Core:
  - [WakeTaskModels.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Core/Sources/Core/WakeTask/WakeTaskModels.swift)
  - [WakeTaskProtocols.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Core/Sources/Core/WakeTask/WakeTaskProtocols.swift)
  - [DefaultWakeMissionRotationEngine.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Core/Sources/Core/WakeTask/DefaultWakeMissionRotationEngine.swift)
  - [WakeContractEvaluator.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Core/Sources/Core/WakeTask/WakeContractEvaluator.swift)

- Added local persistence repositories in Storage (privacy-preserving local JSON store):
  - [WakeTaskLocalStore.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Storage/Sources/Storage/Repositories/WakeTask/WakeTaskLocalStore.swift)
  - [LocalWakeTaskRepositories.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Storage/Sources/Storage/Repositories/WakeTask/LocalWakeTaskRepositories.swift)

- Added non-layout ViewModel logic for wake flow:
  - [WakeFlowViewModel.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/AppShell/Wake/WakeFlowViewModel.swift)

- Wired DI factories/singletons in composition:
  - [CompositionRoot.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Composition/CompositionRoot.swift)
  - [CompositionRoot+Factories.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Composition/CompositionRoot+Factories.swift)

- Added unit tests for core logic, repos, and ViewModel:
  - [MissionRotationEngineTests.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Core/Tests/CoreTests/WakeTask/MissionRotationEngineTests.swift)
  - [WakeContractEvaluatorTests.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Core/Tests/CoreTests/WakeTask/WakeContractEvaluatorTests.swift)
  - [LocalWakeTaskRepositoriesTests.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Storage/Tests/StorageTests/WakeTask/LocalWakeTaskRepositoriesTests.swift)
  - [WakeFlowViewModelTests.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplateProTests/WakeTask/WakeFlowViewModelTests.swift)

- Wrote required evidence file:
  - [core.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/core.md)

Could not run Swift tests here because the toolchain is unavailable (`swift: command not found`).