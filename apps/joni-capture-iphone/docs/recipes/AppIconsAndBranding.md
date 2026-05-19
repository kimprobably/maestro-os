# App Icons and Branding

Complete guide for app icon design and brand assets.

## App Icon Requirements

### iOS App Icon Sizes

Required sizes (all in pixels):
- 1024x1024 - App Store listing
- 180x180 - iPhone (@3x)
- 120x120 - iPhone (@2x)
- 167x167 - iPad Pro (@2x)
- 152x152 - iPad (@2x)
- 76x76 - iPad (@1x)
- 60x60 - Notification (@3x)
- 40x40 - Notification (@2x)

### Design Guidelines

**Do:**
- Use simple, recognizable shapes
- Avoid text (hard to read at small sizes)
- Use bold colors
- Ensure it works in both light and dark mode
- Test at all sizes
- Follow Apple's icon design principles

**Don't:**
- Use gradients that don't scale well
- Include drop shadows or outer glow
- Use photos or realistic images
- Copy other app icons
- Use Apple hardware images

## Creating Your Icon

### Option 1: Design Tools

**Figma:**
1. Create 1024x1024 artboard
2. Design icon with safe area (924x924)
3. Export as PNG @1x, @2x, @3x

**Sketch:**
1. Use iOS App Icon template
2. Design in artboard
3. Export all sizes

**Canva:**
1. Use App Icon template
2. Design with their tools
3. Download all sizes

### Option 2: Icon Generators

**Recommended:**
- [App Icon Generator](https://appicon.co) - Upload 1024x1024, get all sizes
- [MakeAppIcon](https://makeappicon.com) - Similar service
- [IconKitchen](https://icon.kitchen) - Android + iOS

### Option 3: Hire Designer

- [Fiverr](https://fiverr.com) - $25-100
- [99designs](https://99designs.com) - Contest model
- Local designer - Custom pricing

## Adding Icon to Project

1. **Prepare assets:**
   - Generate all required sizes
   - Name files appropriately

2. **Add to project:**
   - Open `SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/`
   - Replace PNG files
   - Update `Contents.json` if needed

3. **Clean and rebuild:**
   ```bash
   ⌘ + Shift + K  # Clean
   ⌘ + B          # Build
   ```

4. **Verify:**
   - Check home screen on device
   - Check Settings → App list
   - Check App Store Connect preview

## Launch Screen

### Location
`SwiftAIBoilerplatePro/Launch Screen.storyboard`

### Customize

1. **Background color:**
   - Select background view
   - Set color in Attributes inspector
   - Use brand color or `Background` from color assets

2. **Launch logo:**
   - Replace `LaunchLogo` image in Assets.xcassets
   - Keep it simple (icon or wordmark)
   - Ensure it works on light and dark backgrounds

3. **Best practices:**
   - Keep it minimal
   - No loading indicators (Apple guideline)
   - Match first screen of app for seamless transition

## Brand Consistency

### Color Usage

Apply your brand colors consistently:

**Primary Brand Color:**
- App icon background
- Primary CTA buttons
- User message bubbles
- Active tab indicator
- Selection states

**Secondary Brand Color:**
- Secondary buttons
- Accents and highlights
- Gradients
- Link colors

**Neutral Colors:**
- Text (high contrast)
- Backgrounds (subtle)
- Borders and separators
- Assistant message bubbles

### Typography

**File:** `Packages/DesignSystem/Sources/DesignSystem/Tokens/DSTypography.swift`

Use custom fonts:
```swift
public static let body = Font.custom("YourFont-Regular", size: 16)
public static let titleL = Font.custom("YourFont-Bold", size: 24)
```

Don't forget to add font files to project and Info.plist.

## Testing Your Branding

### Visual Checklist

- [ ] App icon looks good at all sizes
- [ ] Icon works in both light and dark mode
- [ ] Launch screen transitions smoothly to first screen
- [ ] Colors are consistent across all screens
- [ ] Typography is readable and on-brand
- [ ] Legal docs have correct company info

### Technical Checklist

- [ ] Bundle ID is unique
- [ ] Code signing works
- [ ] Build archives successfully
- [ ] TestFlight build shows correct icon
- [ ] App Store Connect preview looks correct

## LLM Prompt

```
Rebrand this app with my visual identity:

Icon: Clean, modern chat bubble with AI sparkle
Primary Color: #6C5CE7 (vibrant purple)
Secondary Color: #A29BFE (light purple)
Font: SF Pro Rounded (system rounded variant)
App Name: "ChatGenius"
Bundle ID: "com.mycompany.chatgenius"

Tasks:
1. Update BrandConfig.swift with new name
2. Update AccentPrimary and AccentSecondary color sets
3. Update DSTypography to use rounded font
4. Create placeholder for app icon (describe design for later)
5. Update launch screen background to match primary color

Test in light and dark modes. Ensure accessibility (contrast ratios).
Follow patterns in docs/recipes/AppIconsAndBranding.md.
```

## App Store Assets

### Screenshots

Requirements:
- 6.7" (iPhone 14 Pro Max): 1290 x 2796
- 6.5" (iPhone 11 Pro Max): 1242 x 2688
- 5.5" (iPhone 8 Plus): 1242 x 2208

**Tools:**
- Screenshot Simulator in Xcode
- [Shotbot](https://shotbot.io) - Automated screenshots
- [App Store Screenshot](https://www.appstorescreenshot.com) - Framing tool

### App Preview Videos

Optional but recommended:
- 30 seconds max
- Show key features
- Add subtitles (no audio required)
- Portrait orientation

## Related Docs

- `docs/recipes/WhiteLabeling.md` - Complete rebranding
- `docs/recipes/Theming.md` - Color customization
- `docs/foundations/DesignSystem.md` - Token system
