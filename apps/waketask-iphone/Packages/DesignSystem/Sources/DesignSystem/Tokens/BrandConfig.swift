import SwiftUI

/// WakeTask brand configuration used across the app shell.
public enum BrandConfig {
    /// App display name shown in first-party UI surfaces.
    public static let appDisplayName = "WakeTask"

    /// Accent color for highlights and primary calls to action.
    public static let accentColor: Color = DSColors.primary

    /// SF Symbol fallback when profile imagery is unavailable.
    public static let avatarFallbackSymbol = "alarm.waves.left.and.right.fill"

    /// App icon background color for generated placeholder assets.
    public static let appIconBackground: Color = DSColors.primary
}
