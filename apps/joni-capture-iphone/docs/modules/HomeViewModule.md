# Home View Module

Modern, polished home screen with hero section, quick actions, featured carousel, and recent activity.

## Overview

The Home View serves as the main landing page for authenticated users, providing quick access to key features and recent activity. Built with MVVM architecture and driven by design system tokens for consistent, maintainable styling.

**Key Features:**
- 🎨 Hero section with personalized welcome message
- ⚡️ Quick action grid for common tasks
- 🎠 Horizontal featured content carousel
- 📱 Recent conversations list
- 🔄 Pull-to-refresh support
- ♿️ Full accessibility with proper heading semantics

## Purpose & Scope

**What HomeView does:**
- Displays personalized welcome message using user profile data
- Provides quick access to core features (New Chat, History, Upgrade, Settings)
- Showcases featured content in a horizontal scrolling carousel
- Shows recent chat conversations with navigation
- Manages async data loading and refresh states

**Design System Integration:**
- Uses `DSColors` for theming and consistent color palette
- Applies `DSSpacing` tokens for uniform padding and margins
- Leverages `DSRadius` for standardized corner radii
- Uses `DSTypography` for consistent text hierarchy
- Applies `DSElevation` for depth and shadow effects

## Architecture

### MVVM Pattern

```
HomeView (View)
    ↓ observes
HomeViewModel (State + Logic)
    ↓ uses
ConversationRepository (Data)
```

**HomeView**
- SwiftUI view layer
- Renders UI based on ViewModel state
- Handles user interactions via callbacks
- No business logic

**HomeViewModel**
- `@Observable` class for state management
- Manages `isLoading`, `errorMessage`, `recentConversations`
- Handles async data loading and refresh
- Dependency injection via initializer

### One-Way Data Flow

```
User Action → Callback → Parent Navigation
ViewModel.loadData() → State Update → View Re-render
```

**Navigation Callbacks:**
- `onNewChat: () -> Void` - Navigate to new chat screen
- `onShowHistory: () -> Void` - Navigate to full history
- `onShowUpgrade: () -> Void` - Present paywall/upgrade flow
- `onShowSettings: () -> Void` - Navigate to settings
- `onSelectConversation: (UUID) -> Void` - Open specific chat

### Data Flow

1. **Initial Load**: `.task { await viewModel.loadData() }`
2. **Pull-to-Refresh**: `.refreshable { await viewModel.refresh() }`
3. **State Updates**: ViewModel publishes changes via `@Observable`
4. **View Reactivity**: SwiftUI automatically re-renders on state changes

## Files

```
SwiftAIBoilerplatePro/AppShell/
├── HomeView.swift           # Main view with sections
├── HomeViewModel.swift      # State management and logic
├── HomeContent.swift        # Data models and configuration
├── FeatureCard.swift        # Featured carousel card component
├── QuickActionCard.swift    # Quick action grid card component
```

```
Packages/DesignSystem/Sources/DesignSystem/Components/
└── DSSectionHeader.swift    # Reusable section header with divider
```

## Section Recipes

HomeView uses a consistent **section recipe** pattern across all sections for visual rhythm and maintainability.

### Standard Section Recipe

```swift
VStack(alignment: .leading, spacing: 0) {
    // 1. Header with divider
    DSSectionHeader(title: "Section Title")
        .padding(.bottom, DSSpacing.xs)  // 8pt
    
    // 2. Content with matching horizontal padding
    Content
        .padding(.horizontal, DSSpacing.lg)  // 20pt (matches header)
        .padding(.top, DSSpacing.md)         // 12pt after header
}
.padding(.bottom, DSSpacing.xl)  // 24pt between sections
```

### Recipe Components

| Element | Token | Value | Purpose |
|---------|-------|-------|---------|
| Section bottom spacing | `DSSpacing.xl` | 24pt | Visual separation between sections |
| Header horizontal padding | `DSSpacing.lg` | 20pt | Standard gutter, aligns with content |
| Header divider | `DSColors.borderSubtle` | 1pt | Section separation (better contrast than hairline) |
| Header bottom spacing | `DSSpacing.xs` | 8pt | Breathing room after divider |
| Content horizontal padding | `DSSpacing.lg` | 20pt | Must match header for alignment |
| Content top spacing | `DSSpacing.md` | 12pt | Consistent gap after header |

### Applied Recipes

**Hero Section:**
```swift
heroSection
    .padding(.horizontal, DSSpacing.lg)
    .padding(.bottom, DSSpacing.xl)
```

**Quick Actions Section:**
```swift
DSSectionHeader(title: "Quick Actions")
    .padding(.bottom, DSSpacing.xs)
LazyVGrid...
    .padding(.horizontal, DSSpacing.lg)
    .padding(.top, DSSpacing.md)
```

**Featured Section:**
```swift
DSSectionHeader(title: "Featured")
    .padding(.bottom, DSSpacing.xs)
ScrollView(.horizontal)...
    .padding(.top, DSSpacing.md)
// Note: Horizontal padding in HStack for scroll content
```

**Recent Section:**
```swift
HStack {
    DSSectionHeader(title: "Recent Chats", showDivider: false)
    Spacer()
    Button("See All")...
}
.padding(.bottom, DSSpacing.xs)

Rectangle().fill(DSColors.borderSubtle).frame(height: 1)
    .padding(.horizontal, DSSpacing.lg)

VStack...
    .padding(.horizontal, DSSpacing.lg)
    .padding(.top, DSSpacing.md)
```

## Common Customizations

> **Quick Start:** These recipes show how to customize the home screen. All follow the section pattern and use DesignSystem tokens.

### Hero Copy

Change welcome message and subtitle in `HomeContent`:

```swift
// In HomeViewModel or composition root
let customContent = HomeContent(
    welcomeTitle: "Hello, Friend",
    welcomeSubtitle: "Ready to create something amazing?"
)

let viewModel = HomeViewModel(
    conversationRepository: repository,
    content: customContent
)
```

**Dynamic user name:**
```swift
// In parent view after authentication
viewModel.setUserName(user.displayName)
```

### Quick Actions

Add, remove, or modify quick action cards:

**Option 1: Modify defaults in `HomeContent.swift`**
```swift
extension HomeContent.QuickAction {
    public static let defaults: [HomeContent.QuickAction] = [
        QuickAction(
            title: "New Chat",
            systemImage: "plus.message.fill",
            accentColor: "blue",
            action: .newChat
        ),
        QuickAction(
            title: "Voice Chat",  // Custom action
            systemImage: "waveform",
            accentColor: "purple",
            action: .custom("voice")  // Requires enum update
        )
    ]
}
```

**Option 2: Provide custom array at initialization**
```swift
let customActions = [
    HomeContent.QuickAction(
        title: "Scan QR",
        systemImage: "qrcode.viewfinder",
        accentColor: "green",
        action: .custom("scan")
    )
]

let content = HomeContent(quickActions: customActions)
```

**Card styling:**
- Height: Fixed at 110pt in `QuickActionCard`
- Corner radius: `DSRadius.lg` (16pt)
- Shadow: `DSElevation.level1` (subtle depth)
- Icon size: 32pt font size
- Grid columns: 2 (flexible width)
- Grid spacing: `DSSpacing.md` (12pt)

### Featured Carousel

Customize cards and scroll behavior:

**Content:**
```swift
let customFeatures = [
    HomeContent.FeatureItem(
        title: "AI Writing Assistant",
        description: "Create blog posts, emails, and more with AI",
        systemImage: "pencil.and.outline",
        accentColor: "purple"
    ),
    HomeContent.FeatureItem(
        title: "Image Generation",
        description: "Turn text prompts into stunning visuals",
        systemImage: "photo.on.rectangle.angled",
        accentColor: "pink"
    )
]

let content = HomeContent(featuredItems: customFeatures)
```

**Card size and spacing:**
```swift
// In FeatureCard.swift
.frame(width: 250, height: 200)  // Adjust dimensions
.padding(DSSpacing.lg)            // Internal padding

// In HomeView.swift
HStack(spacing: DSSpacing.lg)     // Card spacing (20pt)
```

**Scroll margins and shadow visibility:**
```swift
ScrollView(.horizontal, showsIndicators: false) {
    HStack...
        .padding(.horizontal, DSSpacing.lg)  // Horizontal gutters
        .padding(.vertical, DSSpacing.xs)    // Vertical space for shadows
}
```

**Why padding prevents shadow cutoff:**
- SwiftUI ScrollView doesn't aggressively clip shadows by default
- Horizontal padding creates proper gutters (aligns with section header)
- Vertical padding gives shadows breathing room above/below cards
- This simple approach works without needing special modifiers
- Shadows render fully in both light and dark modes

### Recent List

Modify row appearance and density:

**Row density (vertical spacing):**
```swift
// In HomeView.swift - recentConversationRow()
.padding(.horizontal, DSSpacing.md)         // 12pt horizontal
.padding(.vertical, DSSpacing.md + 2)       // 14pt vertical (increased)

// Between rows
VStack(spacing: DSSpacing.md) {  // 12pt gap prevents shadow merge
    ForEach...
}
```

**Trailing accessories:**
```swift
// Replace chevron with custom accessory
Image(systemName: "star.fill")
    .font(.caption)
    .foregroundStyle(DSColors.warning)

// Or add badge
Text("New")
    .font(DSTypography.caption)
    .padding(.horizontal, 6)
    .padding(.vertical, 2)
    .background(DSColors.accentPrimary)
    .foregroundStyle(.white)
    .clipShape(Capsule())
```

**Row corner radius and shadow:**
```swift
RoundedRectangle(cornerRadius: DSRadius.md)  // 12pt (list row standard)
    .fill(DSColors.surface)
    .overlay(
        RoundedRectangle(cornerRadius: DSRadius.md)
            .strokeBorder(DSColors.borderHairline, lineWidth: 1)
    )
// Shadow applied to outer container (not clipped)
.elevation(DSElevation.level1)
```

## Design Tokens & Theming

### Token Usage Map

**Colors (DSColors):**
- `background` - Page background
- `surface` - Card backgrounds
- `textPrimary` - Headings, main text
- `textSecondary` - Descriptions, timestamps
- `accentPrimary` - Icons, CTAs, "See All" button
- `borderHairline` - Card borders (1pt)
- `borderSubtle` - Section dividers (better contrast)

**Spacing (DSSpacing):**
- `xs` (8pt) - Header bottom spacing, vertical margins
- `sm` (not used on Home)
- `md` (12pt) - Card grid spacing, content top spacing, row gaps
- `lg` (20pt) - Section gutters (horizontal padding)
- `xl` (24pt) - Section bottom spacing

**Corner Radii (DSRadius):**
- `sm` (8pt) - Avatar/icon chip in recent row
- `md` (12pt) - Recent conversation rows (list items)
- `lg` (16pt) - Feature cards, Quick Action cards (prominent)

**Typography (DSTypography):**
- `titleXL` - Hero welcome message
- `titleL` - Section headers
- `titleM` - Feature card titles
- `body` - All body text, Quick Action titles
- `caption` - Timestamps, "See All" button

**Elevation (DSElevation):**
- `level1` - All cards (subtle depth: y=2, blur=8, opacity=0.10)
- `level2` - (not used on Home)
- `level3` - (not used on Home)

### Theme Switching

Tokens automatically adapt to theme changes:

```swift
// In app composition or settings
DSColors.setTheme("dark", colorScheme: .dark)

// HomeView automatically updates:
// - background → .systemBackground (dark)
// - surface → .secondarySystemBackground (dark)
// - borderSubtle → opacity adjusted for dark mode
// - All other tokens follow theme palette
```

**Supported themes:**
- `system` - Follows iOS appearance
- `light` - Always light mode
- `dark` - Always dark mode
- `aurora` - Premium light theme (warm tones)
- `obsidian` - Premium dark theme (deep blue)

## Accessibility

### Heading Semantics

**DSSectionHeader** marks section titles as headings:

```swift
Text(title)
    .font(DSTypography.titleL)
    .accessibilityAddTraits(.isHeader)
```

**VoiceOver navigation:**
- Users can jump between sections using heading rotor
- Proper hierarchy: Hero → Quick Actions → Featured → Recent

### Dynamic Type

All text uses `DSTypography` tokens that scale with Dynamic Type:

| Token | Base Size | Behavior |
|-------|-----------|----------|
| `titleXL` | 34pt | Scales up to accessibility sizes |
| `titleL` | 22pt | Scales proportionally |
| `titleM` | 18pt | Scales proportionally |
| `body` | 17pt (system) | Scales proportionally |
| `caption` | 12pt | Scales proportionally |

**Testing:**
1. Settings → Display & Brightness → Text Size
2. Move slider to largest size
3. Verify all text remains readable
4. Check for truncation or overlaps

### Minimum Contrast

**Borders and separators:**
- `borderHairline`: Uses system `.separator` (WCAG AA compliant)
- `borderSubtle`: Enhanced opacity for better visibility in light mode

**Color contrast ratios:**
- Text Primary on Background: 4.5:1 minimum (AA)
- Text Secondary on Background: 4.5:1 minimum (AA)
- Accent Primary on Surface: 3:1 minimum (AA for large text)

**Light mode considerations:**
- Subtle elevation (`DSElevation.level1`) adds depth
- Border + shadow combination prevents "washed out" cards
- `borderSubtle` provides better separation than pure hairline

### VoiceOver Labels

**Quick Action Cards:**
```swift
// Automatically announced as:
// "New Chat, button"
// "History, button"
```

**Recent Conversation Rows:**
```swift
// Automatically announced as:
// "[Title], updated [time ago], button"
```

**Section Headers:**
```swift
// Announced as:
// "Quick Actions, heading"
// "Featured, heading"
```

## Performance Notes

### Lightweight Models

Use simple structs for carousel content:

```swift
// Good: Lightweight, value type
struct FeatureItem: Identifiable, Equatable {
    let id: UUID
    let title: String
    let description: String
    let systemImage: String
    let accentColor: String
}

// Avoid: Heavy reference types or complex computed properties
@Observable
final class FeatureItem {
    var computedValue: String { /* expensive */ }
}
```

### Avoid Expensive Effects in Scrolling

**Don't:**
```swift
ScrollView {
    ForEach(...) { item in
        CardView(item)
            .blur(radius: 10)              // Expensive GPU effect
            .drawingGroup()                 // Forces offscreen rendering
            .visualEffect { content, proxy in ... }  // Complex geometry
    }
}
```

**Do:**
```swift
ScrollView {
    ForEach(...) { item in
        CardView(item)
            .elevation(DSElevation.level1)  // Simple shadow, GPU-optimized
    }
}
```

### Preview Data

Use mock data for fast Xcode previews:

```swift
#Preview {
    let viewModel = HomeViewModel(
        conversationRepository: PreviewMocks.MockConversationRepository()
    )
    
    return HomeView(
        viewModel: viewModel,
        onNewChat: { print("New Chat") },
        // ... other callbacks
    )
}
```

**Benefits:**
- No network calls in preview
- Instant render times
- Easy to test edge cases (empty states, long text, etc.)

## Testing Checklist

### Visual Regression

- [ ] Spacing alignment in light mode
- [ ] Spacing alignment in dark mode
- [ ] Shadow visibility on cards (light mode)
- [ ] Shadow visibility on cards (dark mode)
- [ ] Section dividers visible and aligned
- [ ] Hero message doesn't wrap awkwardly
- [ ] Featured cards don't clip shadows
- [ ] Recent rows have breathing room

### Accessibility

- [ ] VoiceOver announces sections as headings
- [ ] VoiceOver order matches visual order
- [ ] Dynamic Type scales all text properly
- [ ] No text truncation at largest size
- [ ] Borders meet minimum contrast (4.5:1)
- [ ] Quick action buttons have clear labels
- [ ] Recent rows announce title and time

### Interaction

- [ ] Pull-to-refresh triggers data reload
- [ ] Pull-to-refresh shows loading indicator
- [ ] Quick action cards tap correctly
- [ ] Featured carousel scrolls smoothly
- [ ] Recent rows navigate to conversation
- [ ] "See All" button navigates to history
- [ ] Empty state handled gracefully (no recent)

### Navigation Callbacks

```swift
// Test all callbacks fire correctly
onNewChat() → navigates to chat screen
onShowHistory() → navigates to full history
onShowUpgrade() → presents paywall
onShowSettings() → navigates to settings
onSelectConversation(id) → opens specific chat
```

### State Management

- [ ] Initial load shows recent conversations
- [ ] Error state displays error message
- [ ] Loading state shows progress indicator
- [ ] Refresh updates conversations list
- [ ] Empty recent list hides section
- [ ] User name updates welcome message

## Shadow Application Pattern

### The Problem

Applying `.clipShape()` before `.shadow()` causes shadow clipping:

```swift
// BAD: Shadow is clipped
View()
    .background(Color.surface)
    .clipShape(RoundedRectangle(cornerRadius: 12))  // Clips here
    .shadow(...)  // Shadow cut off by clipping above
```

### The Solution

Apply background and corner radius together, shadow on outer wrapper:

```swift
// GOOD: Shadow renders properly
View()
    .background(
        RoundedRectangle(cornerRadius: 12)  // Inner container
            .fill(Color.surface)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(Color.border, lineWidth: 1)
            )
    )
    .elevation(DSElevation.level1)  // Outer shadow (not clipped)
```

**Applied in:**
- `FeatureCard` - Featured carousel cards
- `QuickActionCard` - Quick action grid cards
- `recentConversationRow()` - Recent list rows

**Why it works:**
1. Background modifier creates an inner container
2. RoundedRectangle with fill creates the shape
3. Overlay adds border to the same shape
4. Elevation (shadow) applied to outer view wrapper
5. No clipping occurs before shadow

## Related Documentation

- [DesignSystem](DesignSystem.md) - Token reference, component library
- [Visual Consistency](visual-consistency.md) - UI guidelines, theming patterns
- [Architecture Overview](architecture-overview.md) - MVVM, navigation, composition
- [Storage](Storage.md) - ConversationRepository, data models

## External Resources

- [Apple HIG: Navigation](https://developer.apple.com/design/human-interface-guidelines/navigation)
- [Apple HIG: Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [SwiftUI ScrollView](https://developer.apple.com/documentation/swiftui/scrollview)

---

**Questions?** Check inline comments in `HomeView.swift` or create an issue.

