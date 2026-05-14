// ============================================================================
// ACCESSIBILITY EXAMPLES
// SwiftAI Boilerplate Pro
// ============================================================================
//
// This file demonstrates how to use the Accessibility features in DesignSystem.
// Copy these patterns when building accessible views.
//
// IMPORTANT: This is a documentation file. It won't compile on its own.
// Import DesignSystem in your actual project files.
//
// ============================================================================

import DesignSystem // A11y, A11yLabel, and all modifiers
import SwiftUI

// MARK: - Example 1: Pre-defined Labels

// ============================================================================
// Use A11y.* labels for consistent VoiceOver experience across the app.
// These labels include appropriate hints and traits.
// ============================================================================

struct ChatInputExample: View {
    @State private var text = ""

    var body: some View {
        HStack {
            // ❌ BEFORE: No accessibility (VoiceOver says "text field")
            // TextField("Message", text: $text)

            // ✅ AFTER: Proper accessibility
            TextField("Message", text: $text)
                .saiAccessible(A11y.Chat.messageInput)
            // VoiceOver: "Message input. Type your message here."

            Button {
                // Send message
            } label: {
                Image(systemName: "arrow.up.circle.fill")
            }
            .saiAccessible(A11y.Chat.sendButton)
            // VoiceOver: "Send message, button. Double tap to send your message."
        }
    }
}

// MARK: - Example 2: Custom Labels

// ============================================================================
// When pre-defined labels don't fit, create custom ones inline.
// ============================================================================

struct CustomAccessibilityExample: View {
    @State private var isFavorite = false

    var body: some View {
        Button {
            isFavorite.toggle()
        } label: {
            Image(systemName: isFavorite ? "star.fill" : "star")
        }
        .saiAccessible(
            label: isFavorite ? "Remove from favorites" : "Add to favorites",
            hint: "Double tap to \(isFavorite ? "remove from" : "add to") favorites",
            traits: .isButton
        )
    }
}

// MARK: - Example 3: Hiding Decorative Elements

// ============================================================================
// Decorative images and patterns should be hidden from VoiceOver.
// This prevents confusion and speeds up navigation.
// ============================================================================

struct DecorativeElementsExample: View {
    var body: some View {
        ZStack {
            // ❌ BEFORE: VoiceOver announces "Image" for decorative background
            // Image("gradient-background")

            // ✅ AFTER: Hidden from accessibility
            Image("gradient-background")
                .saiAccessibilityHidden()

            // Decorative divider
            Rectangle()
                .fill(DSColors.borderHairline)
                .frame(height: 1)
                .saiAccessibilityHidden()

            // Content that SHOULD be accessible
            Text("Important content")
        }
    }
}

// MARK: - Example 4: Grouping Elements

// ============================================================================
// Group related elements to reduce VoiceOver verbosity.
// Instead of 3 separate elements, users hear one combined label.
// ============================================================================

struct UserRowExample: View {
    let name: String
    let status: String
    let avatarURL: URL?

    var body: some View {
        HStack {
            // ❌ BEFORE: VoiceOver reads 3 separate elements
            // AsyncImage(url: avatarURL)
            // Text(name)
            // Text(status)

            // ✅ AFTER: Combined into single accessible element
            HStack {
                AsyncImage(url: avatarURL) { image in
                    image.resizable()
                } placeholder: {
                    Circle().fill(.gray)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading) {
                    Text(name)
                    Text(status)
                        .foregroundStyle(.secondary)
                }
            }
            .saiAccessibilityCombine(label: "\(name), \(status)")
            // VoiceOver: "John Doe, Online"
        }
    }
}

// MARK: - Example 5: Dynamic Type Support

// ============================================================================
// Text should scale with user's preferred text size.
// Use saiScaledFont for custom font sizes that still respect Dynamic Type.
// ============================================================================

struct DynamicTypeExample: View {
    var body: some View {
        VStack {
            // System fonts automatically support Dynamic Type
            Text("Body text")
                .saiScaledFont(.body)

            // Custom sizes that scale proportionally
            Text("Custom headline")
                .saiScaledFont(size: 24, weight: .bold, relativeTo: .headline)

            Text("Custom caption")
                .saiScaledFont(size: 12, weight: .regular, relativeTo: .caption)

            // For very large sizes, limit to prevent layout issues
            Text("Limited scaling")
                .saiScaledFont(size: 18, weight: .medium, relativeTo: .body)
            // Automatically capped at accessibility3 size
        }
    }
}

// MARK: - Example 6: Reduce Motion

// ============================================================================
// Animations can cause discomfort for users with motion sensitivity.
// Use motion-aware modifiers to respect their preferences.
// ============================================================================

struct ReduceMotionExample: View {
    @State private var isPressed = false
    @State private var isExpanded = false

    var body: some View {
        VStack {
            // ❌ BEFORE: Animation always plays
            // Button { }
            //     .scaleEffect(isPressed ? 0.95 : 1.0)
            //     .animation(.spring(), value: isPressed)

            // ✅ AFTER: Animation only when Reduce Motion is OFF
            Button {
                isExpanded.toggle()
            } label: {
                Text("Expand")
            }
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .saiReducedMotionAnimation(.spring())
            // With Reduce Motion ON: instant state change
            // With Reduce Motion OFF: smooth spring animation

            // For value-based animations
            Rectangle()
                .frame(height: isExpanded ? 200 : 100)
                .saiMotionAwareAnimation(.easeInOut, value: isExpanded)
        }
    }
}

// MARK: - Example 7: High Contrast

// ============================================================================
// Some users enable Increase Contrast for better visibility.
// Adapt colors to ensure text remains readable.
// ============================================================================

struct HighContrastExample: View {
    var body: some View {
        VStack {
            // ❌ BEFORE: Low contrast text may be hard to read
            // Text("Subtle hint")
            //     .foregroundStyle(DSColors.textSecondary.opacity(0.6))

            // ✅ AFTER: Adapts to contrast settings
            Text("Subtle hint")
                .saiContrastAwareForeground(
                    normal: DSColors.textSecondary.opacity(0.6),
                    highContrast: DSColors.textPrimary
                )
            // Normal mode: subtle gray
            // High contrast mode: full black/white

            // Secondary information that's still important
            Text("Last updated: 2 hours ago")
                .saiContrastAwareForeground(
                    normal: DSColors.textSecondary,
                    highContrast: DSColors.textPrimary.opacity(0.9)
                )
        }
    }
}

// MARK: - Example 8: Focus Indicators

// ============================================================================
// Keyboard and Switch Control users need visible focus indicators.
// Add focus rings to interactive elements.
// ============================================================================

struct FocusIndicatorExample: View {
    @FocusState private var focusedField: Field?

    enum Field {
        case email, password
    }

    @State private var email = ""
    @State private var password = ""

    var body: some View {
        VStack {
            TextField("Email", text: $email)
                .focused($focusedField, equals: .email)
                .saiFocusIndicator(focusedField == .email)
            // Shows accent-colored ring when focused

            SecureField("Password", text: $password)
                .focused($focusedField, equals: .password)
                .saiFocusIndicator(focusedField == .password)
        }
    }
}

// MARK: - Example 9: Accessibility Values

// ============================================================================
// For sliders, steppers, and other value controls, announce the current value.
// ============================================================================

struct AccessibilityValueExample: View {
    @State private var volume: Double = 0.5
    @State private var rating: Int = 3

    var body: some View {
        VStack {
            // Slider with spoken value
            Slider(value: $volume)
                .saiAccessibilityValue("\(Int(volume * 100))%", label: "Volume")
            // VoiceOver: "Volume, 50%"

            // Stepper with spoken value
            Stepper(value: $rating, in: 1 ... 5) {
                Text("Rating: \(rating)")
            }
            .saiAccessibilityValue("\(rating) out of 5 stars", label: "Rating")
            // VoiceOver: "Rating, 3 out of 5 stars"
        }
    }
}

// MARK: - Example 10: Reading Order

// ============================================================================
// Control the order in which VoiceOver reads elements.
// Higher priority numbers are read first.
// ============================================================================

struct ReadingOrderExample: View {
    @State private var showError = true

    var body: some View {
        VStack {
            // Error should be announced first
            if showError {
                Text("Error: Connection failed")
                    .foregroundStyle(.red)
                    .saiAccessibilitySortPriority(100) // Read first
            }

            Text("Welcome to the app")
                .saiAccessibilitySortPriority(50) // Read second

            Text("Additional info")
                .saiAccessibilitySortPriority(10) // Read last
        }
    }
}

// MARK: - Example 11: Complete Screen Example

// ============================================================================
// Putting it all together: a fully accessible settings row.
// ============================================================================

struct AccessibleSettingsRow: View {
    let title: String
    let subtitle: String
    let iconName: String
    @Binding var isEnabled: Bool

    var body: some View {
        HStack {
            // Icon (decorative, hidden from VoiceOver)
            Image(systemName: iconName)
                .foregroundStyle(DSColors.accentPrimary)
                .saiAccessibilityHidden()

            // Text content (grouped)
            VStack(alignment: .leading) {
                Text(title)
                    .saiScaledFont(size: 16, weight: .medium, relativeTo: .body)
                Text(subtitle)
                    .saiScaledFont(size: 13, weight: .regular, relativeTo: .caption)
                    .saiContrastAwareForeground(
                        normal: DSColors.textSecondary,
                        highContrast: DSColors.textPrimary.opacity(0.8)
                    )
            }

            Spacer()

            // Toggle
            Toggle("", isOn: $isEnabled)
                .labelsHidden()
        }
        // Combine all into single accessible element
        .saiAccessibilityCombine(label: "\(title), \(isEnabled ? "enabled" : "disabled")")
        .accessibilityHint("Double tap to \(isEnabled ? "disable" : "enable")")
        .accessibilityAddTraits(.isButton)
    }
}

// MARK: - Example 12: Debug Audit (DEBUG only)

// ============================================================================
// Use the audit overlay in previews to check accessibility coverage.
// ============================================================================

#if DEBUG
    struct AuditPreviewExample: View {
        var body: some View {
            VStack {
                Text("Check accessibility")
                Button("Action") {}
                Image(systemName: "star")
            }
            // Add this to see accessibility status overlay
            .accessibilityAuditOverlay()
        }
    }

    /// Print the checklist to console
    func runAccessibilityChecklist() {
        A11yChecklist.printChecklist()
        // Output:
        // 📋 Accessibility Checklist
        // ==========================
        // ✓ All interactive elements have accessibility labels
        // ✓ Buttons have hints describing their action
        // ✓ Images have descriptions or are hidden if decorative
        // ...
    }
#endif

// MARK: - Best Practices Summary

// ============================================================================
//
// ✅ DO:
// - Use .saiAccessible() for interactive elements
// - Hide decorative images with .saiAccessibilityHidden()
// - Group related elements with .saiAccessibilityCombine()
// - Support Dynamic Type with .saiScaledFont()
// - Respect Reduce Motion with .saiReducedMotionAnimation()
// - Test with VoiceOver on a real device
//
// ❌ DON'T:
// - Leave buttons without labels
// - Use generic labels like "button" or "image"
// - Ignore Dynamic Type (text gets cut off)
// - Force animations when Reduce Motion is enabled
// - Test only with default accessibility settings
//
// ============================================================================
