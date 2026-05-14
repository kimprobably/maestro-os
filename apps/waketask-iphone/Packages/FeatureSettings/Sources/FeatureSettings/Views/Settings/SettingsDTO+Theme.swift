import Storage
import SwiftUI

extension SettingsDTO.Theme {
    var displayName: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        case .aurora: "Aurora"
        case .obsidian: "Obsidian"
        }
    }

    var description: String {
        switch self {
        case .system: "Follows system"
        case .light: "Always light"
        case .dark: "Always dark"
        case .aurora: "Premium light theme"
        case .obsidian: "Premium dark theme"
        }
    }

    var symbolName: String {
        switch self {
        case .system: "circle.lefthalf.filled"
        case .light: "sun.max.fill"
        case .dark: "moon.fill"
        case .aurora: "sparkles"
        case .obsidian: "moon.stars.fill"
        }
    }

    var isPremium: Bool {
        self == .aurora || self == .obsidian
    }
}
