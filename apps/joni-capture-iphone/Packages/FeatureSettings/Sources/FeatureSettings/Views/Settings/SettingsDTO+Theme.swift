import SwiftUI
import Storage

extension SettingsDTO.Theme {
    var displayName: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        case .aurora: return "Aurora"
        case .obsidian: return "Obsidian"
        }
    }

    var description: String {
        switch self {
        case .system: return "Follows system"
        case .light: return "Always light"
        case .dark: return "Always dark"
        case .aurora: return "Premium light theme"
        case .obsidian: return "Premium dark theme"
        }
    }

    var symbolName: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        case .aurora: return "sparkles"
        case .obsidian: return "moon.stars.fill"
        }
    }

    var isPremium: Bool {
        self == .aurora || self == .obsidian
    }
}
