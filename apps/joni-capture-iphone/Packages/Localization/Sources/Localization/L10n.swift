import Foundation

/// Type-safe localization namespace for SwiftAI Boilerplate Pro.
///
/// ```swift
/// import Localization
///
/// Text(L10n.Auth.tagline)
/// Text(L10n.Chat.messagesRemaining(5))
/// errorMessage = L10n.Error.networkOffline
/// ```
///
/// ## Adding a new string
/// 1. Add it to the matching `L10n+<Namespace>.swift` extension.
/// 2. Add the translation to every `.strings` file in `Resources/`.
///
/// ## Adding a new language
/// 1. Create `Resources/[lang-code].lproj/`.
/// 2. Copy `Localizable.strings` from `en.lproj/` and translate.
/// 3. Xcode picks it up automatically.
public enum L10n {
    /// Bundle that holds the localization resources. Used by every
    /// `L10n+<Namespace>.swift` sibling file to resolve strings.
    static let bundle: Bundle = .module
}

// MARK: - Locale Utilities

public extension L10n {
    /// All locale identifiers we currently ship translations for (minus `Base`).
    static var supportedLanguages: [String] {
        bundle.localizations.filter { $0 != "Base" }
    }

    /// Currently active ISO language code, e.g. `"en"`.
    static var currentLanguage: String {
        Locale.current.language.languageCode?.identifier ?? "en"
    }

    /// Whether the given ISO language code is in the shipped translation set.
    static func isLanguageSupported(_ languageCode: String) -> Bool {
        supportedLanguages.contains(languageCode)
    }
}
