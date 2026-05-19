// ============================================================================
// LOCALIZATION EXAMPLES
// SwiftAI Boilerplate Pro
// ============================================================================
//
// This file demonstrates how to use the Localization module in your app.
// Copy these patterns when adding localized strings to your views.
//
// IMPORTANT: This is a documentation file. It won't compile on its own
// because it references the Localization module which needs to be imported
// in a real Xcode project context.
//
// ============================================================================

import SwiftUI
import Localization  // The Localization package

// MARK: - Example 1: Basic String Usage
// ============================================================================
// Replace hardcoded strings with type-safe L10n keys.
// Benefits: Compile-time safety, autocomplete, easy translation management.
// ============================================================================

struct SignInViewExample: View {
    var body: some View {
        VStack(spacing: 24) {
            // ❌ BEFORE: Hardcoded strings (don't do this)
            // Text("Your AI assistant")
            // Button("Sign in with Apple") { }
            
            // ✅ AFTER: Type-safe localized strings
            Text(L10n.Auth.tagline)  // "Your AI assistant"
            
            Button(L10n.Auth.signInApple) {  // "Sign in with Apple"
                // Sign in action
            }
            
            Button(L10n.Auth.useEmail) {  // "Use email instead"
                // Show email form
            }
            
            // Legal text with links
            Text(L10n.Auth.legalDisclaimer)
        }
    }
}

// MARK: - Example 2: Pluralization
// ============================================================================
// Use pluralized strings for counts. The system automatically selects
// the correct plural form based on the count and current language.
// ============================================================================

struct MessageCounterExample: View {
    let remainingMessages: Int
    
    var body: some View {
        VStack {
            // This automatically handles:
            // - 0 → "No messages remaining"
            // - 1 → "1 message remaining"
            // - 5 → "5 messages remaining"
            // Different languages have different plural rules (Russian, Arabic, etc.)
            
            Text(L10n.Chat.messagesRemaining(remainingMessages))
                .foregroundStyle(remainingMessages <= 3 ? .red : .primary)
        }
    }
}

// MARK: - Example 3: Error Messages
// ============================================================================
// Use localized error messages for consistent, user-friendly errors.
// These pair well with the Core module's AppError type.
// ============================================================================

struct ErrorHandlingExample: View {
    @State private var errorMessage: String?
    
    var body: some View {
        VStack {
            if let error = errorMessage {
                Text(error)
                    .foregroundStyle(.red)
            }
        }
    }
    
    func handleNetworkError() {
        // Use L10n.Error for user-facing error messages
        errorMessage = L10n.Error.networkOffline
        // Output: "You're offline. Please check your internet connection."
    }
    
    func handleValidationError() {
        errorMessage = L10n.Error.invalidEmail
        // Output: "Please enter a valid email address"
    }
    
    func handleGenericError() {
        errorMessage = L10n.Error.generic
        // Output: "Something went wrong. Please try again."
    }
}

// MARK: - Example 4: Settings Screen
// ============================================================================
// Settings screens typically have many strings. L10n keeps them organized.
// ============================================================================

struct SettingsViewExample: View {
    @State private var notificationsEnabled = true
    @State private var shareDiagnostics = false
    
    var body: some View {
        List {
            // Section headers
            Section(L10n.Settings.appearance) {
                NavigationLink(L10n.Settings.theme) {
                    // Theme picker
                }
            }
            
            Section(L10n.Settings.notifications) {
                Toggle(L10n.Settings.pushNotifications, isOn: $notificationsEnabled)
            }
            
            Section(L10n.Settings.privacy) {
                Toggle(isOn: $shareDiagnostics) {
                    VStack(alignment: .leading) {
                        Text(L10n.Settings.shareDiagnostics)
                        Text(L10n.Settings.shareDiagnosticsSubtitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            
            Section(L10n.Settings.legal) {
                NavigationLink(L10n.Settings.termsOfService) { }
                NavigationLink(L10n.Settings.privacyPolicy) { }
            }
            
            Section(L10n.Settings.account) {
                Button(L10n.Settings.deleteAccount, role: .destructive) { }
            }
        }
        .navigationTitle(L10n.Settings.title)
    }
}

// MARK: - Example 5: Common Actions
// ============================================================================
// L10n.Common provides strings for buttons and actions used throughout the app.
// ============================================================================

struct CommonActionsExample: View {
    @Environment(\.dismiss) private var dismiss
    @State private var isLoading = false
    
    var body: some View {
        VStack {
            if isLoading {
                ProgressView()
                Text(L10n.Common.loading)  // "Loading..."
            }
            
            HStack {
                Button(L10n.Common.cancel) {  // "Cancel"
                    dismiss()
                }
                
                Button(L10n.Common.save) {  // "Save"
                    // Save action
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(L10n.Common.done) {  // "Done"
                    dismiss()
                }
            }
        }
    }
}

// MARK: - Example 6: Theme Names
// ============================================================================
// Theme names are localized for international users.
// ============================================================================

struct ThemePickerExample: View {
    @State private var selectedTheme = "system"
    
    var body: some View {
        Picker(L10n.Settings.theme, selection: $selectedTheme) {
            Text(L10n.Theme.system).tag("system")   // "System"
            Text(L10n.Theme.light).tag("light")     // "Light"
            Text(L10n.Theme.dark).tag("dark")       // "Dark"
            Text(L10n.Theme.aurora).tag("aurora")   // "Aurora"
            Text(L10n.Theme.obsidian).tag("obsidian") // "Obsidian"
        }
    }
}

// MARK: - Example 7: Payments/Paywall
// ============================================================================
// Subscription UI with localized strings for international compliance.
// ============================================================================

struct PaywallExample: View {
    var body: some View {
        VStack(spacing: 16) {
            Text(L10n.Payments.upgradeToPro)  // "Upgrade to Pro"
                .font(.title)
            
            // Subscription options
            VStack {
                Text("$9.99 \(L10n.Payments.perMonth)")  // "per month"
                Text("$79.99 \(L10n.Payments.perYear)")  // "per year"
                    .overlay(alignment: .topTrailing) {
                        Text(L10n.Payments.bestValue)  // "Best Value"
                            .font(.caption)
                    }
            }
            
            Button(L10n.Payments.subscribe) {  // "Subscribe"
                // Purchase
            }
            
            Text(L10n.Payments.cancelAnytime)  // "Cancel anytime"
                .font(.caption)
            
            Button(L10n.Payments.restore) {  // "Restore Purchases"
                // Restore
            }
            .buttonStyle(.borderless)
        }
    }
}

// MARK: - Example 8: Chat Interface
// ============================================================================
// Chat screens with localized placeholders, actions, and empty states.
// ============================================================================

struct ChatViewExample: View {
    @State private var inputText = ""
    let messages: [String] = []
    
    var body: some View {
        VStack {
            if messages.isEmpty {
                // Empty state
                VStack(spacing: 8) {
                    Text(L10n.Chat.emptyState)  // "No messages yet"
                        .font(.headline)
                    Text(L10n.Chat.emptyStateSubtitle)  // "Start a conversation..."
                        .foregroundStyle(.secondary)
                }
            } else {
                // Messages list
                ScrollView {
                    ForEach(messages, id: \.self) { message in
                        Text(message)
                            .contextMenu {
                                Button(L10n.Chat.copy) {  // "Copy"
                                    UIPasteboard.general.string = message
                                }
                            }
                    }
                }
            }
            
            // Input bar with localized placeholder
            HStack {
                TextField(L10n.Chat.placeholder, text: $inputText)  // "Type a message..."
                Button(L10n.A11y.sendMessage) {  // Uses accessibility string
                    // Send
                }
            }
        }
        .navigationTitle(L10n.Chat.newChat)  // "New Chat"
        .toolbar {
            Menu {
                Button(L10n.Chat.deleteChat, role: .destructive) { }  // "Delete Chat"
            } label: {
                Image(systemName: "ellipsis")
            }
        }
    }
}

// MARK: - Example 9: Accessibility Labels from Localization
// ============================================================================
// L10n.A11y provides localized accessibility strings.
// These should be used with the DesignSystem's .saiAccessible() modifier.
// ============================================================================

struct AccessibilityExample: View {
    var body: some View {
        VStack {
            // Combine Localization with DesignSystem accessibility
            Button("Send") { }
                .accessibilityLabel(L10n.A11y.sendMessage)
                .accessibilityHint(L10n.A11y.sendMessageHint)
            
            // Or use the localized strings directly
            Image(systemName: "person.circle")
                .accessibilityLabel(L10n.A11y.profilePhoto)
                .accessibilityHint(L10n.A11y.profilePhotoHint)
        }
    }
}

// MARK: - Example 10: Adding New Strings
// ============================================================================
// When you need to add new localized strings:
//
// 1. Add to L10n.swift:
//    public enum MyFeature {
//        public static var title: String {
//            String(localized: "myFeature.title", bundle: bundle)
//        }
//    }
//
// 2. Add to ALL Localizable.strings files:
//    "myFeature.title" = "My Feature";
//
// 3. Use in code:
//    Text(L10n.MyFeature.title)
// ============================================================================

// MARK: - Best Practices Summary
// ============================================================================
//
// ✅ DO:
// - Use L10n.* for all user-facing text
// - Use L10n.Error.* for error messages
// - Use L10n.A11y.* for accessibility labels
// - Test with different languages enabled
// - Add new strings to ALL language files
//
// ❌ DON'T:
// - Hardcode strings in Views
// - Use String(format:) with hardcoded strings
// - Forget to add translations for new strings
// - Mix localized and non-localized text
//
// ============================================================================
