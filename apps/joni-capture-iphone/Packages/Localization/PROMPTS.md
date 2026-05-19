# Localization Module Prompts

Ready-to-use prompts for common tasks in the Localization module.

## Add Strings for a New Feature

> Add localized strings for a new "Favorites" feature. Add keys to `en.lproj/Localizable.strings` following the existing naming convention (e.g., `favorites.title`, `favorites.empty`, `favorites.add`, `favorites.remove`). Add corresponding computed properties to the `L10n` enum under a new `Favorites` namespace. Follow the pattern in `L10n.Chat` or `L10n.Settings`.

## Add a New Language

> Add Spanish localization. Create `es.lproj/Localizable.strings` by copying `en.lproj/Localizable.strings` and translating all values. For pluralization, create `es.lproj/Localizable.stringsdict` following the English stringsdict pattern. No code changes are needed; the `L10n` enum picks up new languages automatically via `Bundle.module`.

## Add Pluralization Support

> Add pluralization for a "messages remaining" counter. Add entries to `Localizable.stringsdict` following the existing pluralization pattern. Add a `L10n.Chat.messagesRemaining(_ count: Int)` method that uses `String(localized:)` with the stringsdict key. Support "zero", "one", and "other" plural forms.
