# Onboarding Module

Modern, swipe-based onboarding flow with premium feel, easy customization, and full accessibility support.

## Overview

The onboarding module provides a polished, Apple-grade user experience for introducing new users to your app. By default, it uses a swipe-only navigation style with page dots and a final CTA, but can be configured for traditional button navigation if needed.

**Key Features:**
- 🎨 Swipe-only navigation (modern, premium feel)
- 🎯 Easy content customization (pages, images, colors)
- ♿️ Full accessibility support (VoiceOver, Reduce Motion)
- 📳 Haptic feedback for delightful interactions
- 🎭 Two navigation styles: swipe-only or buttons
- 🖼️ Support for custom illustrations or SF Symbols

## Files

```
SwiftAIBoilerplatePro/AppShell/
├── OnboardingContainerView.swift  # Main container with TabView navigation
├── OnboardingPageView.swift       # Individual page layout
└── OnboardingPage.swift            # Page data model
```

## Architecture

### How It Works

1. **State Management**: `@State private var currentPage` tracks the active page
2. **TabView**: Provides horizontal swipe navigation between pages
3. **Page Dots**: Custom gradient capsules with tap-to-jump functionality
4. **Navigation Styles**: `OnboardingStyle` enum switches between swipe-only and buttons
5. **Haptics**: Light feedback on page change, success notification on completion
6. **Animations**: Subtle fade/scale per page, respects Reduce Motion setting

### Component Hierarchy

```
OnboardingContainerView
├── Skip Button (top-right, hidden on last page)
├── TabView (horizontal paging)
│   └── OnboardingPageView (for each page)
│       ├── Icon Circle (SF Symbol or custom image)
│       └── Content Card (title + description)
├── Page Dots (custom gradient indicators)
└── Navigation (swipe-only CTA or button controls)
```

## Quick Start

### Default Usage

```swift
// Present onboarding with default pages and swipe-only navigation
OnboardingContainerView {
    // Handle completion
    UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
    showOnboarding = false
}
```

### Custom Pages

```swift
let customPages = [
    OnboardingPage(
        title: "Welcome to MyApp",
        description: "Start your journey here",
        systemImage: "star.fill",
        accentColor: "purple"
    ),
    OnboardingPage(
        title: "Track Progress",
        description: "Monitor your daily achievements",
        systemImage: "chart.bar.xaxis",
        imageName: "progress-illustration", // Optional custom image
        accentColor: "blue"
    )
]

OnboardingContainerView(pages: customPages) {
    // Handle completion
}
```

### Button Navigation Mode

```swift
// Use traditional Next/Back buttons instead of swipe-only
OnboardingContainerView(style: .buttons) {
    // Handle completion
}
```

## Customization

### Customizing Page Content

#### Option 1: Modify Default Pages

Edit `OnboardingPage.defaultPages` in `OnboardingPage.swift`:

```swift
static let defaultPages: [OnboardingPage] = [
    OnboardingPage(
        title: "Your Custom Title",
        description: "Your custom description text",
        systemImage: "your.sf.symbol",
        accentColor: "blue"
    ),
    OnboardingPage(
        title: "Another Feature",
        description: "Explain your app's value proposition",
        systemImage: "sparkles",
        accentColor: "purple"
    )
    // Add more pages as needed (recommend 3-5 total)
]
```

#### Option 2: Provide Custom Array

Pass your own pages when initializing the container:

```swift
let myPages = [
    OnboardingPage(
        title: "AI-Powered Insights",
        description: "Get personalized recommendations",
        systemImage: "brain.head.profile",
        accentColor: "blue"
    )
]

OnboardingContainerView(pages: myPages) { /* ... */ }
```

### Custom Illustrations

Replace SF Symbols with your own images:

1. **Add image to Assets.xcassets**
   - Add your illustration image (PNG, PDF, etc.)
   - Name it descriptively (e.g., `onboarding-welcome`)

2. **Set `imageName` in OnboardingPage**:

```swift
OnboardingPage(
    title: "Premium Features",
    description: "Unlock advanced capabilities",
    systemImage: "star",              // Fallback if image not found
    imageName: "premium-illustration", // Your custom image
    accentColor: "purple"
)
```

3. **Image is displayed at 120x120 points** in a 160x160 circle background

### Layout Customization

To modify the page layout, edit `OnboardingPageView.swift`:

**Change icon size:**
```swift
// Current: 160x160 circle with 120x120 image
Circle()
    .fill(DSGradient.primaryLinear.opacity(0.15))
    .frame(width: 200, height: 200)  // Make larger

Image(imageName)
    .frame(width: 160, height: 160)  // Adjust accordingly
```

**Adjust spacing:**
```swift
VStack(spacing: DSSpacing.xxl) {  // Change from .xl to .xxl
    // Content...
}
```

**Modify card style:**
```swift
SAICard(style: .elevated) {  // Change from .tinted to .elevated
    // Content...
}
```

### Color Customization

**Accent Colors** are defined in `OnboardingPageView.colorForAccent()`:

Supported values:
- `"blue"`, `"green"`, `"purple"`, `"orange"`, `"red"`, `"pink"`, `"yellow"`
- `"primary"` (uses DesignSystem primary color)

To add custom colors, edit the helper method in `OnboardingPageView.swift`:

```swift
private func colorForAccent(_ accent: String) -> Color {
    switch accent.lowercased() {
    case "blue": return .blue
    case "custom": return Color(hex: "#FF6B6B")  // Add your color
    default: return .blue
    }
}
```

## Navigation Styles

### Swipe-Only Mode (Default)

Modern, premium feel with gesture-based navigation.

**Features:**
- Horizontal swipe to navigate between pages
- Tap any dot to jump to specific page
- "Skip" button in top-right (hidden on last page)
- "Get Started" CTA appears only on final page
- No visible Next/Back buttons

**Usage:**
```swift
OnboardingContainerView(style: .swipeOnly) { /* ... */ }
// or simply:
OnboardingContainerView { /* ... */ }  // .swipeOnly is default
```

**UX Benefits:**
- Cleaner interface (no button clutter)
- Encourages exploration
- Familiar gesture patterns
- Premium, modern aesthetic

### Button Mode

Traditional navigation with Next/Back buttons.

**Features:**
- First page: Centered "Next" button
- Middle pages: "Back" + "Next" buttons side-by-side
- Last page: "Back" + "Get Started" buttons
- "Skip" still available in top-right

**Usage:**
```swift
OnboardingContainerView(style: .buttons) { /* ... */ }
```

**When to Use:**
- Older user demographics unfamiliar with gestures
- Complex onboarding requiring explicit step-through
- Accessibility requirements for some user groups
- A/B testing against swipe-only variant

## Accessibility

### VoiceOver Support

**Page Content:**
- Pages automatically combine title and description
- Read as: `"{title}. {description}"`

**Page Indicators:**
- Each dot announces: `"Page {n} of {total}"`
- Current page has `.isSelected` trait

**CTA Button:**
- Label: "Get Started"
- Hint: "Double tap to complete onboarding and start using the app"

**Skip Button:**
- Label: "Skip onboarding"
- Hint: "Double tap to skip the onboarding and continue to the app"
- Hidden from VoiceOver on last page

### Reduce Motion

Animations are automatically disabled when Reduce Motion is enabled:

**With Motion:** Fade (0.3 → 1.0 opacity) + scale (0.95 → 1.0)  
**Reduce Motion:** Instant appearance (opacity: 1, scale: 1)

**Implementation:**
```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion

.opacity(reduceMotion ? 1 : (isVisible ? 1 : 0.3))
.scaleEffect(reduceMotion ? 1 : (isVisible ? 1 : 0.95))
```

### Testing Accessibility

1. **Enable VoiceOver**: Settings → Accessibility → VoiceOver
2. **Enable Reduce Motion**: Settings → Accessibility → Motion → Reduce Motion
3. **Test navigation**: Swipe through pages with VoiceOver
4. **Verify announcements**: Check page labels and hints
5. **Test dot navigation**: Ensure dots are tappable and announce correctly

## Haptic Feedback

### Page Change (Light Impact)

Fires when user swipes to a new page:

```swift
.onChange(of: currentPage) { _, _ in
    let impact = UIImpactFeedbackGenerator(style: .light)
    impact.impactOccurred()
}
```

**Feel:** Subtle confirmation of page transition

### Completion (Success Notification)

Fires when user taps "Get Started":

```swift
private func completeOnboarding() {
    let notification = UINotificationFeedbackGenerator()
    notification.notificationOccurred(.success)
    // ...
}
```

**Feel:** Satisfying finish to the onboarding experience

### Disabling Haptics

Haptics respect the system's haptic feedback settings automatically. No additional code needed.

## Integration

### Launch Router Pattern

Present onboarding based on first-launch state:

```swift
// In LaunchRouter.swift or similar
enum AppState {
    case needsOnboarding
    case authenticated
    case unauthenticated
}

@State private var appState: AppState = .needsOnboarding

var body: some View {
    switch appState {
    case .needsOnboarding:
        OnboardingContainerView {
            UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
            appState = .unauthenticated
        }
    case .authenticated:
        MainTabView()
    case .unauthenticated:
        SignInView()
    }
}
```

### Settings Screen Re-trigger

Allow users to view onboarding again:

```swift
// In SettingsView or ProfileView
Button("View Onboarding Again") {
    showOnboarding = true
}
.sheet(isPresented: $showOnboarding) {
    OnboardingContainerView {
        showOnboarding = false
    }
}
```

### Completion Persistence

Save completion state to prevent re-showing:

```swift
// In onComplete closure
UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")

// Check on app launch
let hasCompleted = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")
```

**Note:** For multi-device sync, consider storing in UserDefaults with iCloud sync or in your backend.

## Behavioral Specs

### Swipe-Only Mode

| Interaction | Behavior |
|------------|----------|
| Swipe left/right | Navigate between pages with animation |
| Tap page dot | Jump directly to that page |
| Tap "Skip" | Dismiss onboarding immediately (fires `onComplete`) |
| Reach last page | "Skip" button fades out, "Get Started" CTA appears |
| Tap "Get Started" | Fires success haptic, calls `onComplete` |

### Button Mode

| Interaction | Behavior |
|------------|----------|
| Tap "Next" | Advance to next page with animation |
| Tap "Back" | Return to previous page with animation |
| First page | Only "Next" button shown (centered) |
| Middle pages | "Back" + "Next" buttons (side-by-side) |
| Last page | "Back" + "Get Started" buttons |
| Tap "Get Started" | Fires success haptic, calls `onComplete` |

### Animations

| Element | Animation | Duration | Condition |
|---------|-----------|----------|-----------|
| Page content | Fade (0.3 → 1.0) | 0.5s ease-out | Not reduce-motion |
| Page content | Scale (0.95 → 1.0) | 0.5s ease-out | Not reduce-motion |
| Page dots | Width change (8 → 24) | Spring (0.3s) | Always |
| Page transition | Horizontal slide | System default | Always |
| Skip button | Opacity (1 → 0) | System default | On last page |

## Best Practices

### Content Guidelines

**Keep it concise:**
- 3-5 pages maximum (sweet spot: 3)
- Titles: 2-5 words
- Descriptions: 1-2 sentences (10-20 words)

**Focus on benefits, not features:**
- ❌ "Uses GPT-4 for conversations"
- ✅ "Have natural conversations with AI"

**Use active voice:**
- ❌ "Your data is encrypted"
- ✅ "We encrypt all your data"

**Progressive disclosure:**
- Page 1: Core value proposition
- Page 2: Key differentiator
- Page 3: Call to action / trust signal

### Visual Design

**Icon choice:**
- Use SF Symbols for consistency with iOS
- Choose recognizable, simple icons
- Avoid text-heavy symbols

**Color palette:**
- Use 2-3 colors maximum across all pages
- Ensure sufficient contrast (WCAG AA)
- Consider color blindness (avoid red/green combos)

**Custom illustrations:**
- Keep style consistent across all pages
- Use transparent backgrounds
- Export at 2x/3x for retina displays
- Recommended size: 240x240 @2x

### UX Optimization

**Skip button placement:**
- Always visible (except last page)
- Never force users to complete onboarding
- Some users already know your app

**Page count:**
- Too few (1-2): Seems lazy or unhelpful
- Too many (6+): Users skip or abandon
- Optimal: 3-4 pages

**Testing:**
- A/B test swipe-only vs. buttons
- Track completion rate and time-to-complete
- Test with real users from target demographic

## Examples

### Habit Tracking App

```swift
let habitPages = [
    OnboardingPage(
        title: "Track Daily Habits",
        description: "Build streaks and stay motivated with visual progress.",
        systemImage: "checkmark.circle.fill",
        accentColor: "green"
    ),
    OnboardingPage(
        title: "AI-Powered Insights",
        description: "Get personalized tips based on your patterns.",
        systemImage: "brain.head.profile",
        accentColor: "purple"
    ),
    OnboardingPage(
        title: "Sync Across Devices",
        description: "Your habits follow you wherever you go.",
        systemImage: "icloud.and.arrow.up",
        accentColor: "blue"
    )
]

OnboardingContainerView(pages: habitPages) {
    // Start habit tracking
}
```

### Finance App

```swift
let financePages = [
    OnboardingPage(
        title: "Smart Budgeting",
        description: "AI categorizes expenses and tracks spending automatically.",
        systemImage: "chart.pie.fill",
        imageName: "budget-illustration",
        accentColor: "blue"
    ),
    OnboardingPage(
        title: "Bank-Level Security",
        description: "256-bit encryption keeps your financial data safe.",
        systemImage: "lock.shield.fill",
        accentColor: "green"
    ),
    OnboardingPage(
        title: "Reach Your Goals",
        description: "Set savings targets and watch your progress grow.",
        systemImage: "target",
        imageName: "goals-illustration",
        accentColor: "orange"
    )
]

OnboardingContainerView(pages: financePages) {
    // Proceed to account setup
}
```

### Meditation App

```swift
let meditationPages = [
    OnboardingPage(
        title: "Find Your Calm",
        description: "Guided meditations for stress, sleep, and focus.",
        systemImage: "leaf.fill",
        imageName: "meditation-hero",
        accentColor: "purple"
    ),
    OnboardingPage(
        title: "Personalized Journey",
        description: "AI adapts sessions to your mood and experience level.",
        systemImage: "brain.head.profile",
        accentColor: "blue"
    ),
    OnboardingPage(
        title: "Track Mindfulness",
        description: "See your meditation streak and progress over time.",
        systemImage: "chart.line.uptrend.xyaxis",
        accentColor: "green"
    )
]

OnboardingContainerView(pages: meditationPages, style: .swipeOnly) {
    // Begin first meditation
}
```

## Testing

### Unit Tests

Test page configuration and state:

```swift
func testOnboardingPageEquality() {
    let page1 = OnboardingPage(
        title: "Test",
        description: "Description",
        systemImage: "star",
        accentColor: "blue"
    )
    let page2 = OnboardingPage(
        title: "Test",
        description: "Description",
        systemImage: "star",
        accentColor: "blue"
    )
    XCTAssertEqual(page1, page2)
}

func testDefaultPagesCount() {
    XCTAssertEqual(OnboardingPage.defaultPages.count, 3)
}
```

### Snapshot Tests

Capture visual regressions:

```swift
func testOnboardingPageViewLight() {
    let page = OnboardingPage.defaultPages[0]
    let view = OnboardingPageView(page: page)
    assertSnapshot(matching: view, as: .image(layout: .device(config: .iPhone13)))
}

func testOnboardingContainerSwipeOnly() {
    let container = OnboardingContainerView(style: .swipeOnly) { }
    assertSnapshot(matching: container, as: .image)
}

func testOnboardingContainerButtons() {
    let container = OnboardingContainerView(style: .buttons) { }
    assertSnapshot(matching: container, as: .image)
}
```

### UI Tests

Test user flows:

```swift
func testOnboardingCompletion() {
    let app = XCUIApplication()
    app.launch()
    
    // Swipe through pages
    app.swipeLeft()
    app.swipeLeft()
    
    // Tap Get Started
    app.buttons["Get Started"].tap()
    
    // Verify navigation to next screen
    XCTAssertTrue(app.otherElements["MainTabView"].exists)
}

func testOnboardingSkip() {
    let app = XCUIApplication()
    app.launch()
    
    app.buttons["Skip"].tap()
    
    XCTAssertTrue(app.otherElements["MainTabView"].exists)
}
```

## Troubleshooting

### Issue: Custom image not appearing

**Symptoms:** SF Symbol shows instead of custom image

**Solution:**
1. Verify image is in `Assets.xcassets`
2. Check `imageName` spelling matches exactly
3. Ensure image has @2x and @3x variants
4. Check build target membership (should include main app target)

### Issue: Animations not working

**Symptoms:** Pages appear instantly without fade/scale

**Cause:** Reduce Motion is enabled

**Solution:** This is expected behavior. Test with Reduce Motion off:
- Settings → Accessibility → Motion → Reduce Motion (OFF)

### Issue: Haptics not firing

**Symptoms:** No haptic feedback on page change

**Solution:**
1. Check device supports haptics (not available on older devices)
2. Test on physical device (simulator doesn't support haptics)
3. Verify System Haptics are enabled: Settings → Sounds & Haptics

### Issue: Dots not tappable

**Symptoms:** Tapping dots doesn't jump to page

**Cause:** Gesture conflict with TabView

**Solution:** This is a known SwiftUI limitation. The `.onTapGesture` works but may require precise tapping. Consider increasing tap area:

```swift
Capsule()
    .frame(width: index == currentPage ? 24 : 8, height: 8)
    .padding(.vertical, 8)  // Increase tap target
    .onTapGesture { /* ... */ }
```

### Issue: Skip button not hiding on last page

**Symptoms:** "Skip" still visible when "Get Started" appears

**Cause:** Opacity transition not applying

**Solution:** Verify `isLastPage` computed property:

```swift
private var isLastPage: Bool {
    currentPage == pages.count - 1
}
```

## Migration Guide

### From Old Onboarding (Pre-Polish)

If you're updating from the previous button-based onboarding:

1. **No code changes required** — swipe-only is opt-in via `style` parameter
2. **To keep old behavior:**
   ```swift
   OnboardingContainerView(style: .buttons) { /* ... */ }
   ```
3. **To adopt swipe-only:**
   ```swift
   OnboardingContainerView { /* ... */ }  // or style: .swipeOnly
   ```
4. **Test both modes** and choose based on user testing

### Adding Custom Images

Migration path from SF Symbols to illustrations:

1. **Keep SF Symbols as fallback** while adding images
2. **Add images incrementally** (one page at a time)
3. **Test image load failures** gracefully fall back to symbols

```swift
OnboardingPage(
    title: "Welcome",
    description: "...",
    systemImage: "star",              // Fallback
    imageName: "welcome-illustration" // Try custom first
)
```

## What NOT to Do

❌ **Don't add more than 5 pages** — users will skip  
❌ **Don't force completion** — always provide a skip option  
❌ **Don't use video/GIFs** — increases bundle size, accessibility issues  
❌ **Don't show onboarding every launch** — persist completion state  
❌ **Don't block core features** — let users explore immediately  
❌ **Don't use tiny font sizes** — ensure WCAG AA compliance  
❌ **Don't ignore Reduce Motion** — animations must be optional  
❌ **Don't forget VoiceOver labels** — accessibility is not optional  

## Related Documentation

- [Visual Consistency](visual-consistency.md) — Design system, colors, spacing
- [DesignSystem](DesignSystem.md) — SAIButton, SAICard components used
- [Architecture Overview](architecture-overview.md) — Where onboarding fits in app flow

## External Resources

- [Apple HIG: Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- [WWDC: Onboarding Best Practices](https://developer.apple.com/videos/)
- [SF Symbols](https://developer.apple.com/sf-symbols/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Questions?** Check inline comments in the source files or create an issue.

