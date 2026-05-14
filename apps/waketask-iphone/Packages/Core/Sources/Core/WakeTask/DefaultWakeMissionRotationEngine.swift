import Foundation

public struct DefaultWakeMissionRotationEngine: WakeMissionRotationEngine {
    private let randomIndex: @Sendable (Int) -> Int

    public init(randomIndex: @escaping @Sendable (Int) -> Int = { upperBound in
        guard upperBound > 0 else { return 0 }
        return Int.random(in: 0 ..< upperBound)
    }) {
        self.randomIndex = randomIndex
    }

    public func missions(for alarm: WakeAlarm, previousRuns: [WakeRun], missionCount: Int) -> [WakeMission] {
        let count = max(1, missionCount)
        let recentModalities = recentWindowModalities(from: previousRuns, strictness: alarm.strictness)
        var ordered = WakeMissionModality.allCases

        if let firstIndex = ordered.firstIndex(where: { !recentModalities.contains($0) }) {
            ordered.swapAt(0, firstIndex)
        }

        if ordered.count > 1 {
            let shuffleIndex = min(randomIndex(ordered.count), ordered.count - 1)
            ordered.swapAt(0, shuffleIndex)
        }

        var generated: [WakeMission] = []
        for index in 0 ..< count {
            let modality = ordered[index % ordered.count]
            generated.append(
                WakeMission(modality: modality, prompt: prompt(for: modality, strictness: alarm.strictness))
            )
        }

        return generated
    }

    private func recentWindowModalities(from runs: [WakeRun], strictness: WakeStrictness) -> Set<WakeMissionModality> {
        let window = switch strictness {
        case .relaxed: 1
        case .balanced: 2
        case .strict: 3
        }

        let recentRuns = runs.sorted { $0.scheduledAt > $1.scheduledAt }.prefix(window)
        return Set(recentRuns.flatMap { $0.missions.map(\.modality) })
    }

    private func prompt(for modality: WakeMissionModality, strictness: WakeStrictness) -> String {
        switch (modality, strictness) {
        case (.cognitive, .relaxed):
            "Solve a quick pattern: 7 + 5 - 3"
        case (.cognitive, .balanced):
            "Reverse these numbers out loud: 8, 3, 1"
        case (.cognitive, .strict):
            "Count backward by 7 from 84"
        case (.movement, .relaxed):
            "Take 8 steps away from your bed"
        case (.movement, .balanced):
            "Do 12 marching steps with your phone"
        case (.movement, .strict):
            "Complete 15 quick squats"
        case (.scanPhoto, .relaxed):
            "Photograph the sink area"
        case (.scanPhoto, .balanced):
            "Photograph your bathroom mirror"
        case (.scanPhoto, .strict):
            "Photograph your kitchen counter"
        }
    }
}
